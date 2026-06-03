import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getB2BCatalog(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const items = await prisma.b2BCatalogItem.findMany({ 
    where: { tenantId }, 
    include: { product: true },
    orderBy: { createdAt: 'desc' } 
  });
  res.json({ status: 'ok', data: items });
}

export async function createB2BCatalogItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const data = req.body;
  const item = await prisma.b2BCatalogItem.create({
    data: { ...data, tenantId },
    include: { product: true }
  });
  res.json({ status: 'ok', data: item });
}

export async function updateB2BCatalogItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const data = req.body;
  
  await prisma.b2BCatalogItem.updateMany({ where: { id, tenantId }, data });
  const item = await prisma.b2BCatalogItem.findFirst({ 
    where: { id, tenantId },
    include: { product: true }
  });
  
  res.json({ status: 'ok', data: item });
}
