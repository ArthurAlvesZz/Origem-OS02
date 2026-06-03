import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

// For brevity, we return some aggregated data. Real endpoints would query more specifically based on req.query
export const getSalesReports = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { periodStart, periodEnd, customerId } = req.query;

  let whereObj: any = { tenantId, deletedAt: null };
  if (customerId) whereObj.customerId = customerId;
  if (periodStart && periodEnd) {
    whereObj.createdAt = { gte: new Date(periodStart as string), lte: new Date(periodEnd as string) };
  }

  const orders = await prisma.order.findMany({
    where: whereObj,
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' }
  });

  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const totalDiscount = orders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + (i.discount || 0), 0), 0);
  const count = orders.length;

  res.json({
    data: {
      totalSales,
      totalDiscount,
      ticketMedio: count ? totalSales / count : 0,
      orders
    }
  });
};

export const getFinanceReports = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const txs = await prisma.financialTransaction.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { date: 'asc' }
  });
  
  // DRE Simples
  const receitas = txs.filter(t => t.type === 'Receita' && t.status === 'Efetivado').reduce((a, t) => a + t.amount, 0);
  const despesas = txs.filter(t => t.type === 'Despesa' && t.status === 'Efetivado').reduce((a, t) => a + t.amount, 0);

  res.json({
    data: {
      receitas,
      despesas,
      saldo: receitas - despesas,
      transactions: txs
    }
  });
};

export const getInventoryReports = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  // Let's just return products with stock for now as simple report
  res.json({ data: [] });
};

// Documents
export const generateDocument = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { type, referenceType, referenceId, customerId, periodStart, periodEnd, title, snapshotJson } = req.body;

  const doc = await prisma.generatedDocument.create({
    data: {
      tenantId,
      type,
      referenceType,
      referenceId,
      customerId,
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
      title,
      snapshotJson: typeof snapshotJson === 'string' ? snapshotJson : JSON.stringify(snapshotJson),
      generatedByUserId: userId
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId, userId, tableName: 'GeneratedDocument', recordId: doc.id, action: 'CREATE'
    }
  });

  res.json({ data: doc });
};

export const getDocuments = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const docs = await prisma.generatedDocument.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });

  const parsed = docs.map(d => ({
    ...d,
    snapshotJson: typeof d.snapshotJson === 'string' ? JSON.parse(d.snapshotJson) : d.snapshotJson
  }));

  res.json({ data: parsed });
};

export const voidDocument = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;

  const doc = await prisma.generatedDocument.findFirst({
    where: { id, tenantId, deletedAt: null, status: 'active' }
  });

  if (!doc) {
    throw new Error('Documento não encontrado ou já cancelado');
  }

  const updated = await prisma.generatedDocument.update({
    where: { id },
    data: { status: 'voided', voidedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      tenantId, userId, tableName: 'GeneratedDocument', recordId: id, action: 'UPDATE', newData: { status: 'voided' }
    }
  });

  res.json({ data: updated });
};
