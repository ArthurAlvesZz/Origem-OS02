import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const movementSchema = z.object({
  body: z.object({
    productId: z.string(),
    type: z.enum(['Entrada', 'Saída', 'Ajuste', 'Perda', 'Consignado', 'Devolvido']),
    qty: z.number().min(0, "A quantidade deve ser positiva"),
    reason: z.string().optional(),
    unitCost: z.number().optional().default(0),
    lotId: z.string().optional(),
  })
});

export const getMovements = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const movements = await prisma.stockMovement.findMany({
    where: { 
      tenantId,
      deletedAt: null
    },
    include: {
      product: { select: { name: true, sku: true } },
      lot: { select: { code: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100 // limit to last 100 for now
  });

  // Map to domain format
  const mapped = movements.map(m => ({
    id: m.id,
    date: m.createdAt.toISOString(),
    product: m.product.name,
    productId: m.productId,
    type: m.movementType,
    qty: m.qty,
    reason: m.reason || '',
    lotCode: m.lot?.code
  }));

  res.json({ data: mapped });
};

export const createMovement = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.id;
  const data = req.body;

  const movement = await prisma.stockMovement.create({
    data: {
      tenantId,
      userId,
      productId: data.productId,
      movementType: data.type,
      qty: data.qty,
      reason: data.reason || null,
      unitCost: data.unitCost || 0,
      lotId: data.lotId || null,
    },
    include: { product: true }
  });

  res.status(201).json({
    data: {
      id: movement.id,
      date: movement.createdAt.toISOString(),
      product: movement.product.name,
      productId: movement.productId,
      type: movement.movementType,
      qty: movement.qty,
      reason: movement.reason || ''
    }
  });
};

export const getInventorySummary = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  // Real world: we'd compute from stock movements OR read from a materialized table.
  // We'll compute it dynamically for now since scale is small.
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      productId: true,
      movementType: true,
      qty: true,
    }
  });

  const balances: Record<string, number> = {};
  for (const m of movements) {
    if (balances[m.productId] === undefined) balances[m.productId] = 0;
    
    if (m.movementType === 'Entrada' || m.movementType === 'Devolvido') {
      balances[m.productId] += m.qty;
    } else if (m.movementType === 'Saída' || m.movementType === 'Perda' || m.movementType === 'Consignado') {
      balances[m.productId] -= m.qty;
    } else if (m.movementType === 'Ajuste') {
      balances[m.productId] = m.qty;
    }
  }

  // To map balances to actual products:
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null, active: true },
    select: { id: true, name: true, sku: true, category: true, minStock: true, unitCost: true, unitPrice: true }
  });

  const summary = products.map(p => ({
    ...p,
    currentStock: balances[p.id] || 0
  }));

  res.json({ data: summary });
};

export const getLowStock = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, deletedAt: null },
    select: { productId: true, movementType: true, qty: true }
  });

  const balances: Record<string, number> = {};
  for (const m of movements) {
    if (balances[m.productId] === undefined) balances[m.productId] = 0;
    
    if (m.movementType === 'Entrada' || m.movementType === 'Devolvido') {
      balances[m.productId] += m.qty;
    } else if (m.movementType === 'Saída' || m.movementType === 'Perda' || m.movementType === 'Consignado') {
      balances[m.productId] -= m.qty;
    } else if (m.movementType === 'Ajuste') {
      balances[m.productId] = m.qty;
    }
  }

  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null, active: true },
  });

  const lowStock = products.map(p => ({
    product: p,
    currentStock: balances[p.id] || 0,
    minStock: p.minStock
  })).filter(x => x.currentStock <= x.minStock);

  res.json({ data: lowStock });
};
