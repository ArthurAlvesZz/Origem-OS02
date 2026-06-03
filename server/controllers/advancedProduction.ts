import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getGreenLots(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const lots = await prisma.greenCoffeeLot.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  res.json({ status: 'ok', data: lots });
}

export async function createGreenLot(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const data = req.body;
  const lot = await prisma.greenCoffeeLot.create({
    data: { ...data, tenantId }
  });
  res.json({ status: 'ok', data: lot });
}

export async function updateGreenLot(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const data = req.body;
  await prisma.greenCoffeeLot.updateMany({ where: { id, tenantId }, data });
  const lot = await prisma.greenCoffeeLot.findFirst({ where: { id, tenantId } });
  res.json({ status: 'ok', data: lot });
}

export async function getRecipes(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const recipes = await prisma.productionRecipe.findMany({ 
    where: { tenantId }, 
    include: { inputs: true, extras: true },
    orderBy: { createdAt: 'desc' } 
  });
  res.json({ status: 'ok', data: recipes });
}

export async function createRecipe(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { productId, name, targetYield, defaultPackagingId, defaultCostPerHour, observations, inputs, extras } = req.body;
  
  const recipe = await prisma.productionRecipe.create({
    data: {
      tenantId, productId, name, targetYield, defaultPackagingId, defaultCostPerHour, observations,
      inputs: { create: inputs?.map((i: any) => ({ ...i, tenantId })) || [] },
      extras: { create: extras?.map((e: any) => ({ ...e, tenantId })) || [] }
    },
    include: { inputs: true, extras: true }
  });
  res.json({ status: 'ok', data: recipe });
}

export async function updateRecipe(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { name, targetYield, defaultPackagingId, defaultCostPerHour, observations } = req.body;
  
  await prisma.productionRecipe.updateMany({
    where: { id, tenantId },
    data: { name, targetYield, defaultPackagingId, defaultCostPerHour, observations }
  });

  const recipe = await prisma.productionRecipe.findFirst({ where: { id, tenantId }, include: { inputs: true, extras: true } });
  res.json({ status: 'ok', data: recipe });
}

export async function getRoastProfiles(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const profiles = await prisma.roastProfile.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  res.json({ status: 'ok', data: profiles });
}

export async function createRoastProfile(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const data = req.body;
  const profile = await prisma.roastProfile.create({ data: { ...data, tenantId } });
  res.json({ status: 'ok', data: profile });
}

export async function updateRoastProfile(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const data = req.body;
  await prisma.roastProfile.updateMany({ where: { id, tenantId }, data });
  const profile = await prisma.roastProfile.findFirst({ where: { id, tenantId } });
  res.json({ status: 'ok', data: profile });
}

export async function getProductionDemand(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  // This would aggregate actual demands from subscriptions, CRM orders, etc.
  // For now returning a mock compilation for simplicity
  res.json({ status: 'ok', data: [] });
}

// Logic to handle production batch state changes
export async function reserveBatchInputs(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { greenLotId, reservedKg } = req.body;
  
  const reservation = await prisma.productionInputReservation.create({
    data: { tenantId, batchId: id, greenLotId, reservedKg, status: 'active' }
  });
  
  await prisma.greenCoffeeLot.update({
    where: { id: greenLotId },
    data: { stockKg: { decrement: reservedKg } }
  });
  
  res.json({ status: 'ok', data: reservation });
}

export async function startBatch(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  await prisma.productionBatch.updateMany({ where: { id, tenantId }, data: { status: 'roasting' } });
  res.json({ status: 'ok' });
}

export async function completeBatch(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { finalWeight, packagedQty } = req.body;
  
  await prisma.productionBatch.updateMany({ 
    where: { id, tenantId }, 
    data: { status: 'completed', finalWeight, packagedQty } 
  });
  
  const batch = await prisma.productionBatch.findFirst({ where: { id, tenantId } });
  
  if (batch) {
     // Mark reservations as consumed
     await prisma.productionInputReservation.updateMany({
       where: { batchId: batch.id, tenantId },
       data: { status: 'consumed' }
     });

     // Create Quality Review - Stock will be updated only upon Approval
     await prisma.qualityReview.create({
        data: {
          tenantId,
          productionBatchId: batch.id,
          productId: batch.finalProductId,
          status: 'pending_review'
        }
     });
  }

  res.json({ status: 'ok', data: batch });
}

export async function cancelBatch(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  
  await prisma.productionBatch.updateMany({ where: { id, tenantId }, data: { status: 'cancelled' } });
  
  const reservations = await prisma.productionInputReservation.findMany({ where: { batchId: id, tenantId, status: 'active' } });
  for (const r of reservations) {
    await prisma.greenCoffeeLot.update({
      where: { id: r.greenLotId },
      data: { stockKg: { increment: r.reservedKg } }
    });
    await prisma.productionInputReservation.update({
      where: { id: r.id },
      data: { status: 'released' }
    });
  }
  res.json({ status: 'ok' });
}

export async function createBatchFromDemand(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { productId, plannedQuantity, recipeId, roastProfileId, masterRoasterId, inputs, finalWeight, packagedQuantity } = req.body;
  
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Produto final não encontrado' });

  const batch = await prisma.$transaction(async (tx) => {
    const b = await tx.productionBatch.create({
      data: {
        tenantId,
        code: `PRD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: 'completed',
        date: new Date(),
        finalProductId: productId,
        finalProductName: product.name,
        finalQty: packagedQuantity || 0,
        yieldPercent: finalWeight && plannedQuantity ? (finalWeight / plannedQuantity) * 100 : 0,
        lossPercent: finalWeight && plannedQuantity ? ((plannedQuantity - finalWeight) / plannedQuantity) * 100 : 0,
        recipeId,
        roastProfileId,
        masterRoasterId,
        initialWeight: plannedQuantity,
        finalWeight: finalWeight || 0,
        packagedQty: packagedQuantity || 0,
        plannedDate: new Date(),
      }
    });

    for(const input of inputs) {
      if (input.greenLotId) {
        await tx.productionInputReservation.create({
          data: {
            tenantId,
            batchId: b.id,
            greenLotId: input.greenLotId,
            reservedKg: input.weightToUse,
            status: 'consumed'
          }
        });
        await tx.greenCoffeeLot.update({
          where: { id: input.greenLotId },
          data: { stockKg: { decrement: input.weightToUse } }
        });
      }
    }

    // Create Quality Review - Stock will be updated only upon Approval
    await tx.qualityReview.create({
       data: {
         tenantId,
         productionBatchId: b.id,
         productId,
         status: 'pending_review'
       }
    });

    return b;
  });

  res.json({ status: 'ok', data: batch });
}
