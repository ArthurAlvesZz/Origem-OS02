import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getReviews(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const reviews = await prisma.qualityReview.findMany({
    where: { tenantId },
    include: {
      batch: true,
      product: true,
      descriptors: { include: { descriptor: true } },
      defects: { include: { defect: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ data: reviews });
}

export async function createReview(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { productionBatchId, productId, ...data } = req.body;
  
  const review = await prisma.qualityReview.create({
    data: {
      tenantId,
      productionBatchId,
      productId,
      ...data
    }
  });
  
  res.json({ status: 'ok', data: review });
}

export async function updateReview(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  
  const { descriptors, defects, ...data } = req.body;

  const review = await prisma.qualityReview.update({
    where: { id, tenantId },
    data: {
      ...data
    }
  });

  // Sync descriptors if provided
  if (descriptors) {
     await prisma.qualityReviewDescriptor.deleteMany({ where: { qualityReviewId: id } });
     if (descriptors.length > 0) {
       await prisma.qualityReviewDescriptor.createMany({
         data: descriptors.map((d: any) => ({
           qualityReviewId: id,
           descriptorId: d.descriptorId,
           intensity: d.intensity,
           note: d.note
         }))
       });
     }
  }

  // Sync defects if provided
  if (defects) {
     await prisma.qualityReviewDefect.deleteMany({ where: { qualityReviewId: id } });
     if (defects.length > 0) {
       await prisma.qualityReviewDefect.createMany({
         data: defects.map((d: any) => ({
           qualityReviewId: id,
           defectId: d.defectId,
           quantity: d.quantity,
           note: d.note
         }))
       });
     }
  }

  res.json({ status: 'ok', data: review });
}

export async function approveReview(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { notes } = req.body;

  const r = await prisma.qualityReview.update({
    where: { id, tenantId },
    data: { status: 'approved', notes, reviewedAt: new Date(), recommendation: 'release_b2c' },
    include: { batch: true }
  });

  if (r.batch && r.productId) {
     await prisma.stockMovement.create({
       data: {
         tenantId,
         productId: r.productId,
         movementType: 'Entrada', 
         qty: r.batch.packagedQty || r.batch.finalQty || r.batch.finalWeight || 0,
         reason: `Produção Lote ${r.batch.code || r.batch.id.substring(0,8)} - QC Aprovado`,
         userId: (req as any).userId,
         createdAt: new Date()
       }
     });
  }

  res.json({ status: 'ok', data: r });
}

export async function rejectReview(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { notes } = req.body;

  const r = await prisma.qualityReview.update({
    where: { id, tenantId },
    data: { status: 'rejected', notes, reviewedAt: new Date(), recommendation: 'block' }
  });

  res.json({ status: 'ok', data: r });
}

export async function getDescriptors(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const list = await prisma.sensoryDescriptor.findMany({ where: { tenantId } });
  res.json({ data: list });
}

export async function getDefects(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const list = await prisma.qualityDefect.findMany({ where: { tenantId } });
  res.json({ data: list });
}
