import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Assuming this exists

export const getPublicTrace = async (req: Request, res: Response) => {
  try {
    const trace = await prisma.publicLotTrace.findUnique({
      where: { publicCode: req.params.publicCode }
    });

    if (!trace) return res.status(404).json({ error: 'Rastreabilidade não encontrada' });
    if (trace.status !== 'published') return res.status(404).json({ error: 'Lote não publicado' });

    // Ensure we don't leak anything internal
    const payload = {
      title: trace.title,
      summary: trace.summary,
      publicCode: trace.publicCode,
      publicScore: trace.publicScore,
      publicDescriptorsJson: trace.publicDescriptorsJson,
      publicOriginJson: trace.publicOriginJson,
      roastInfoJson: trace.roastInfoJson,
      productInfoJson: trace.productInfoJson,
      publishedAt: trace.publishedAt,
    };

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar lote' });
  }
};

export const getTraces = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const queries = await prisma.publicLotTrace.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(queries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing request' });
  }
};

export const getTraceById = async (req: Request, res: Response) => {
  try {
    const trace = await prisma.publicLotTrace.findFirst({
      where: { 
        id: req.params.id,
        tenantId: (req as any).tenantId 
      }
    });
    if (!trace) return res.status(404).json({ error: 'Not found' });
    res.json(trace);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
};

export const createTraceFromQualityInfo = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { qualityReviewId } = req.params;
    
    // Check if review exists and is Approved
    const review = await prisma.qualityReview.findFirst({
      where: { id: qualityReviewId, tenantId },
      include: {
        descriptors: { include: { descriptor: true } },
        batch: { include: { recipe: true } },
        product: true
      }
    });

    if (!review) return res.status(404).json({ error: 'Quality Review not found' });
    if (review.status !== 'Approved') return res.status(400).json({ error: 'Somente lotes aprovados podem gerar rastreio público.' });

    // Parse info from review
    const body = req.body;
    
    const publicCode = `LT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const trace = await prisma.publicLotTrace.create({
      data: {
        tenantId,
        qualityReviewId,
        productionBatchId: review.productionBatchId,
        productId: review.productId,
        publicCode,
        status: 'draft',
        title: body.title || 'Café Especial',
        summary: body.summary || '',
        publicScore: body.publicScore || review.scoreTotal,
        publicDescriptorsJson: body.publicDescriptorsJson,
        publicOriginJson: body.publicOriginJson,
        roastInfoJson: body.roastInfoJson,
        productInfoJson: body.productInfoJson,
      }
    });

    res.status(201).json(trace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating traceability' });
  }
};

export const updateTrace = async (req: Request, res: Response) => {
  try {
    const trace = await prisma.publicLotTrace.update({
      where: { 
        id: req.params.id,
        tenantId: (req as any).tenantId 
      },
      data: req.body
    });
    res.json(trace);
  } catch (error) {
    res.status(500).json({ error: 'Error processing request' });
  }
};

export const publishTrace = async (req: Request, res: Response) => {
  try {
    const trace = await prisma.publicLotTrace.update({
      where: { 
        id: req.params.id,
        tenantId: (req as any).tenantId 
      },
      data: { 
        status: 'published',
        publishedAt: new Date()
      }
    });
    res.json(trace);
  } catch (error) {
    res.status(500).json({ error: 'Error processing request' });
  }
};

export const unpublishTrace = async (req: Request, res: Response) => {
  try {
    const trace = await prisma.publicLotTrace.update({
      where: { 
        id: req.params.id,
        tenantId: (req as any).tenantId 
      },
      data: { 
        status: 'unpublished',
        unpublishedAt: new Date()
      }
    });
    res.json(trace);
  } catch (error) {
    res.status(500).json({ error: 'Error processing request' });
  }
};
