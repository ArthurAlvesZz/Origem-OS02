import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const createProductionBatchSchema = z.object({
  body: z.object({
    code: z.string(),
    date: z.string(),
    finalProductId: z.string().uuid(),
    finalProductName: z.string(),
    initialWeight: z.number().min(0),
    finalWeight: z.number().min(0),
    finalQty: z.number().min(0),
    status: z.string(),
    inputs: z.array(z.object({
      productId: z.string().uuid(),
      name: z.string(),
      qty: z.number().min(0),
      unitCost: z.number().min(0)
    })).optional().default([]),
    extraCosts: z.array(z.object({
      description: z.string(),
      amount: z.number().min(0)
    })).optional().default([]),
    hours: z.number().optional().default(0),
    laborCostPerHour: z.number().optional().default(0),
    totalCost: z.number().optional().default(0),
    unitCost: z.number().optional().default(0),
    responsible: z.string().optional(),
    notes: z.string().optional()
  })
});

export const finalizeProductionBatchSchema = z.object({
  body: z.object({
    finalWeight: z.number().min(0),
    status: z.string(),
    notes: z.string().optional()
  })
});

// GET /api/production/batches
export const getBatches = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const batches = await prisma.productionBatch.findMany({
    where: { tenantId, deletedAt: null },
    include: { inputs: true, extraCosts: true, qualityReviews: true },
    orderBy: { date: 'desc' }
  });

  const formatted = batches.map(b => ({
    ...b,
    date: b.date.toISOString(),
  }));

  res.json({ data: formatted });
};

// GET /api/production/batches/:id
export const getBatchById = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const batch = await prisma.productionBatch.findUnique({
    where: { id },
    include: { inputs: true, extraCosts: true }
  });

  if (!batch || batch.tenantId !== tenantId || batch.deletedAt) {
    return res.status(404).json({ error: 'Lote não encontrado' });
  }

  res.json({ data: { ...batch, date: batch.date.toISOString() } });
};

// POST /api/production/batches
export const createBatch = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const data = req.body;

  const totalInputCost = data.inputs.reduce((sum: number, i: any) => sum + (i.qty * i.unitCost), 0);
  const totalLaborCost = (data.hours || 0) * (data.laborCostPerHour || 0);
  const totalExtraCost = data.extraCosts.reduce((sum: number, e: any) => sum + e.amount, 0);

  const batch = await prisma.$transaction(async (tx) => {
    // Validate final product
    const finalProduct = await tx.product.findUnique({
      where: { id: data.finalProductId }
    });
    if (!finalProduct || finalProduct.tenantId !== tenantId || finalProduct.deletedAt || !finalProduct.active) {
      throw new Error('Produto final não encontrado ou está inativo.');
    }

    const created = await tx.productionBatch.create({
      data: {
        tenantId,
        code: data.code || `PROD-${Date.now().toString().slice(-4)}`,
        date: new Date(data.date),
        finalProductId: data.finalProductId,
        finalProductName: data.finalProductName,
        status: data.status || 'draft',
        initialWeight: data.initialWeight,
        finalWeight: data.finalWeight || 0,
        finalQty: data.finalQty || 0,
        yieldPercent: data.initialWeight > 0 ? ((data.finalWeight || 0) / data.initialWeight) * 100 : 0,
        lossPercent: data.initialWeight > 0 ? 100 - (((data.finalWeight || 0) / data.initialWeight) * 100) : 0,
        hours: data.hours,
        laborCostPerHour: data.laborCostPerHour,
        totalInputCost,
        totalLaborCost,
        totalExtraCost,
        totalCost: totalInputCost + totalLaborCost + totalExtraCost,
        unitCost: data.finalWeight > 0 ? (totalInputCost + totalLaborCost + totalExtraCost) / data.finalWeight : 0,
        responsible: data.responsible,
        notes: data.notes,
        createdBy: userId,
        inputs: {
          create: data.inputs.map((i: any) => ({
             productId: i.productId,
             name: i.name,
             qty: i.qty,
             unitCost: i.unitCost
          }))
        },
        extraCosts: {
          create: data.extraCosts.map((e: any) => ({
             description: e.description,
             amount: e.amount
          }))
        }
      },
      include: { inputs: true, extraCosts: true }
    });

    if (created.status === 'Concluído' || created.status === 'completed') {
      const location = await tx.stockLocation.findFirst({ where: { tenantId } });
      if (location) {
        // Inputs
        for (const input of created.inputs) {
          // Check available stock
          const agg = await tx.stockMovement.aggregate({
            where: { tenantId, productId: input.productId, deletedAt: null },
            _sum: { qty: true }
          });
          const availableStock = agg._sum.qty || 0;
          if (availableStock < input.qty) {
            throw new Error(`Insumo insuficiente para o produto ${input.name}. Necessário: ${input.qty}, Disponível: ${availableStock}.`);
          }

          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: input.productId,
              locationId: location.id,
              movementType: 'production_input',
              qty: -input.qty,
              unitCost: input.unitCost,
              reason: `Insumo Lote ${created.code}`,
              referenceType: 'production_batch',
              referenceId: created.id,
              userId
            }
          });
        }
        
        // Output
        if (created.finalWeight > 0) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: created.finalProductId,
              locationId: location.id,
              movementType: 'production_output',
              qty: created.finalWeight,
              unitCost: created.unitCost,
              reason: `Entrada Lote ${created.code}`,
              referenceType: 'production_batch',
              referenceId: created.id,
              userId
            }
          });
          
          await tx.product.update({
            where: { id: created.finalProductId },
            data: { unitCost: created.unitCost }
          });
        }
      }
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'ProductionBatch',
        recordId: created.id,
        action: 'CREATE',
        newData: { code: created.code, status: created.status }
      }
    });

    return created;
  });

  res.status(201).json({ data: { ...batch, date: batch.date.toISOString() } });
};

// PATCH /api/production/batches/:id/complete
export const finalizeBatch = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;
  const data = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id },
      include: { inputs: true, extraCosts: true }
    });

    if (!batch || batch.tenantId !== tenantId || batch.deletedAt) {
      throw new Error('Lote não encontrado');
    }
    if (batch.status === 'completed') {
      throw new Error('Este lote já foi concluído');
    }

    const { finalWeight, status, notes } = data;
    const yieldPercent = batch.initialWeight > 0 ? (finalWeight / batch.initialWeight) * 100 : 0;
    const lossPercent = batch.initialWeight > 0 ? 100 - yieldPercent : 0;

    // Validate inputs stock
    for (const input of batch.inputs) {
      const location = await tx.stockLocation.findFirst({ where: { tenantId } });
      const qtyNeeded = input.qty;
      // In a real scenario we'd query total stock, here we just do movement
      if (!location) throw new Error('Nenhum estoque configurado.');

      // Check available stock
      const agg = await tx.stockMovement.aggregate({
        where: { tenantId, productId: input.productId, deletedAt: null },
        _sum: { qty: true }
      });
      const availableStock = agg._sum.qty || 0;
      if (availableStock < qtyNeeded) {
        throw new Error(`Insumo insuficiente para o produto ${input.name}. Necessário: ${qtyNeeded}, Disponível: ${availableStock}.`);
      }

      // Decrement stock for inputs
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: input.productId,
          locationId: location.id,
          movementType: 'production_input',
          qty: -qtyNeeded,
          unitCost: input.unitCost,
          reason: `Insumo Lote ${batch.code}`,
          referenceType: 'production_batch',
          referenceId: batch.id,
          userId
        }
      });
    }

    // Increment stock for final product
    const location = await tx.stockLocation.findFirst({ where: { tenantId } });
    if (location) {
      const unitCost = finalWeight > 0 ? batch.totalCost / finalWeight : 0;
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: batch.finalProductId,
          locationId: location.id,
          movementType: 'production_output',
          qty: finalWeight, // Let's use finalWeight as qty since it's roasted coffee in kg
          unitCost: unitCost,
          reason: `Entrada Lote ${batch.code}`,
          referenceType: 'production_batch',
          referenceId: batch.id,
          userId
        }
      });
      
      // Update actual product cost
      await tx.product.update({
        where: { id: batch.finalProductId },
        data: { unitCost }
      });
    }

    const updated = await tx.productionBatch.update({
      where: { id },
      data: {
        finalWeight,
        status: status || 'completed',
        notes: notes || batch.notes,
        yieldPercent,
        lossPercent,
        unitCost: finalWeight > 0 ? batch.totalCost / finalWeight : 0
      },
      include: { inputs: true, extraCosts: true }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'ProductionBatch',
        recordId: id,
        action: 'UPDATE_STATUS',
        newData: { finalWeight, yieldPercent, status: status || 'completed' }
      }
    });

    return updated;
  });

  res.json({ data: { ...result, date: result.date.toISOString() } });
};

// PATCH /api/production/batches/:id/cancel
export const cancelBatch = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id }
    });

    if (!batch || batch.tenantId !== tenantId || batch.deletedAt) {
      throw new Error('Lote não encontrado');
    }
    
    if (batch.status === 'completed') {
      throw new Error('Não é possível cancelar um lote já concluído (estorno ainda não implementado na UI).');
    }

    const updated = await tx.productionBatch.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'ProductionBatch',
        recordId: id,
        action: 'CANCEL',
        newData: { status: 'cancelled' }
      }
    });

    return updated;
  });

  res.json({ data: { ...result, date: result.date.toISOString() } });
};
// Wait, the API spec says `createBatch` and `finalizeProductionBatch` in ApiProductionRepository.
// Actually, `createBatch` in API creates the batch (might be draft, or we can just complete it directly if the UI only sends it all at once).
// Let's look at `ApiStubs.ts` / `ApiProductionRepository.ts` to see what is mapped.
