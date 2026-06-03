import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    sku: z.string().optional().nullable(),
    category: z.string(),
    description: z.string().optional().nullable(),
    unit: z.string().default('un'),
    unitCost: z.number().min(0).default(0),
    unitPrice: z.number().min(0).default(0),
    active: z.boolean().default(true),
    minStock: z.number().min(0).default(0),
    isInput: z.boolean().default(false),
  })
});

export const getProducts = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const products = await prisma.product.findMany({
    where: { 
      tenantId,
      deletedAt: null
    },
    orderBy: { name: 'asc' }
  });
  res.json({ data: products });
};

export const getProductById = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const product = await prisma.product.findFirst({
    where: { 
      id: req.params.id,
      tenantId,
      deletedAt: null
    }
  });

  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json({ data: product });
};

export const createProduct = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const data = req.body;

  const product = await prisma.product.create({
    data: {
      ...data,
      tenantId
    }
  });

  res.status(201).json({ data: product });
};

export const updateProduct = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const data = req.body;

  const product = await prisma.product.findFirst({
    where: { id: req.params.id, tenantId, deletedAt: null }
  });

  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data
  });

  res.json({ data: updated });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  const product = await prisma.product.findFirst({
    where: { id: req.params.id, tenantId, deletedAt: null }
  });

  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  await prisma.product.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), active: false }
  });

  res.json({ success: true });
};
