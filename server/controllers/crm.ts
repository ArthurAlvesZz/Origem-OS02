import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getPipelines(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const pipelines = await prisma.crmPipeline.findMany({
    where: { tenantId },
    include: {
      stages: { orderBy: { order: 'asc' } }
    }
  });
  
  if (pipelines.length === 0) {
    // Create default pipeline if none exists
    const p = await prisma.crmPipeline.create({
      data: {
        tenantId,
        name: 'Vendas Padrão',
        isDefault: true,
        stages: {
          create: [
            { tenantId, name: 'Lead Novo', order: 1 },
            { tenantId, name: 'Aguardando Pagamento', order: 2 },
            { tenantId, name: 'Ativo', order: 3 },
            { tenantId, name: 'Perdido', order: 4 }
          ]
        }
      },
      include: { stages: true }
    });
    pipelines.push(p);
  }

  res.json({ status: 'ok', data: pipelines });
}

export async function createPipeline(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, type } = req.body;
  const p = await prisma.crmPipeline.create({
    data: { tenantId, name, type }
  });
  res.json({ status: 'ok', data: p });
}

export async function getDeals(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { pipelineId } = req.query;

  const deals = await prisma.crmDeal.findMany({
    where: { 
      tenantId,
      ...(pipelineId ? { pipelineId: String(pipelineId) } : {})
    },
    orderBy: { updatedAt: 'desc' }
  });
  res.json({ status: 'ok', data: deals });
}

export async function createDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { pipelineId, stageId, title, value, priority, customerId } = req.body;

  const deal = await prisma.crmDeal.create({
    data: {
      tenantId, pipelineId, stageId, title, value: value || 0, priority: priority || 'normal', customerId
    }
  });
  res.json({ status: 'ok', data: deal });
}

export async function updateDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { title, value, status, priority, stageId } = req.body;

  const deal = await prisma.crmDeal.updateMany({
    where: { id, tenantId },
    data: { title, value, status, priority, stageId }
  });
  
  const updated = await prisma.crmDeal.findFirst({ where: { id, tenantId } });
  res.json({ status: 'ok', data: updated });
}

export async function moveDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { stageId } = req.body;

  await prisma.crmDeal.updateMany({
    where: { id, tenantId },
    data: { stageId }
  });
  
  const updated = await prisma.crmDeal.findFirst({ where: { id, tenantId } });
  
  // Create an activity for the move
  if(updated) {
     const stage = await prisma.crmStage.findFirst({where: {id: stageId}});
     await prisma.crmActivity.create({
        data: {
           tenantId,
           dealId: id,
           type: 'status_change',
           title: `Card movido para etapa ${stage?.name || 'desconhecida'}`,
           createdByUserId: (req as any).userId
        }
     });
  }
  
  res.json({ status: 'ok', data: updated });
}

export async function getActivities(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { dealId, customerId } = req.query;

  const acts = await prisma.crmActivity.findMany({
    where: {
      tenantId,
      ...(dealId ? { dealId: String(dealId) } : {}),
      ...(customerId ? { customerId: String(customerId) } : {})
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: acts });
}

export async function createActivity(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { dealId, customerId, type, title, body } = req.body;

  const act = await prisma.crmActivity.create({
    data: {
      tenantId, dealId, customerId, type, title, body,
      createdByUserId: (req as any).userId
    }
  });
  res.json({ status: 'ok', data: act });
}

export async function getTemplates(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const temps = await prisma.communicationTemplate.findMany({
    where: { tenantId, active: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: temps });
}

export async function createTemplate(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, channel, body } = req.body;

  const temp = await prisma.communicationTemplate.create({
    data: { tenantId, name, channel, body }
  });
  res.json({ status: 'ok', data: temp });
}

export async function getCommunications(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const comms = await prisma.communicationQueue.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json({ status: 'ok', data: comms });
}

export async function queueCommunication(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { channel, recipient, renderedBody, dealId, customerId } = req.body;

  const comm = await prisma.communicationQueue.create({
    data: {
      tenantId, channel, recipient, renderedBody, dealId, customerId, status: 'draft'
    }
  });
  res.json({ status: 'ok', data: comm });
}

export async function markCommunicationSimulated(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  await prisma.communicationQueue.updateMany({
    where: { id, tenantId },
    data: { status: 'simulated', sentAt: new Date() }
  });

  const updated = await prisma.communicationQueue.findFirst({ where: { id, tenantId } });
  res.json({ status: 'ok', data: updated });
}
