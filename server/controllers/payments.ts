import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ----------------------------------------------------------------------
// PUBLIC/WEBHOOK ENDPOINTS
// ----------------------------------------------------------------------

export async function createPaymentIntentPublic(req: Request, res: Response) {
  const { tenantId, amount, currency, subscriptionRequestId, orderId, method } = req.body;

  // Real world implementation would check provider config and dispatch to gateway
  const intent = await prisma.paymentIntent.create({
    data: {
      tenantId,
      amount,
      currency: currency || 'BRL',
      provider: method || 'mock',
      status: 'pending',
      subscriptionRequestId,
      orderId
    }
  });

  // CRM Automation: Add "Cobrar Pagamento" task to Deal if exists
  if(subscriptionRequestId) {
    try {
      const deal = await prisma.crmDeal.findFirst({ where: { subscriptionRequestId, tenantId } });
      if(deal) {
         await prisma.crmActivity.create({
           data: {
             tenantId,
             dealId: deal.id,
             type: 'task',
             title: 'Cobrar pagamento',
             body: `Intenção de pagamento gerada no valor de ${amount}. Conferir e cobrar o lead.`
           }
         });
      }
    } catch(e) {}
  }

  res.json({ status: 'ok', data: intent });
}

export async function webhookHandler(req: Request, res: Response) {
  const { provider } = req.params;
  const eventId = req.body?.id || Date.now().toString();
  const eventType = req.body?.type || 'unknown';
  const tenantId = req.body?.tenantId || req.query.tenantId;

  // Protect against replay attacks/idempotency
  const existing = await prisma.paymentWebhookEvent.findFirst({
    where: { provider, eventId }
  });

  if (existing) {
    return res.json({ status: 'ok', message: 'Already processed' });
  }

  await prisma.paymentWebhookEvent.create({
    data: {
      provider,
      eventId,
      eventType,
      rawJson: JSON.stringify(req.body),
      processed: true,
      tenantId: tenantId as string || null
    }
  });

  // Here we would typically route the event to a specific adapter to parse and reconcile.
  res.json({ status: 'ok' });
}

// ----------------------------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------------------------

export async function getIntents(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const intents = await prisma.paymentIntent.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json({ status: 'ok', data: intents });
}

export async function markAsPaidManual(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const intent = await prisma.paymentIntent.findFirst({ where: { id, tenantId }});
  if (!intent) return res.status(404).json({ error: 'Not found' });
  if (intent.status === 'paid') return res.status(400).json({ error: 'Already paid' });

  // Mark as paid
  const updated = await prisma.paymentIntent.update({
    where: { id },
    data: {
      status: 'paid',
      paidAt: new Date(),
    }
  });

  // Create financial transaction
  const finTx = await prisma.financialTransaction.create({
    data: {
      tenantId,
      orderId: intent.orderId,
      type: 'income',
      status: 'paid',
      category: 'Vendas/Assinaturas',
      description: `Pagamento Manual - Intent ${intent.id}`,
      amount: intent.amount,
      paidAmount: intent.amount,
      date: new Date(),
      paidAt: new Date(),
      paymentMethod: intent.provider,
      referenceId: intent.id,
      source: 'payment_intent',
      createdBy: (req as any).userId || 'system'
    }
  });

  // Add reconciliation record
  await prisma.paymentReconciliation.create({
    data: {
      tenantId,
      paymentIntentId: intent.id,
      financialTransactionId: finTx.id,
      status: 'matched'
    }
  });

  // If tied to subscription, approve
  if (intent.subscriptionRequestId) {
    await prisma.subscriptionRequest.update({
      where: { id: intent.subscriptionRequestId },
      data: { status: 'approved' }
    });

    // CRM Automation: move to win stage
    try {
      const deal = await prisma.crmDeal.findFirst({ where: { subscriptionRequestId: intent.subscriptionRequestId, tenantId } });
      const pipeline = await prisma.crmPipeline.findFirst({ where: { tenantId, isDefault: true }, include: { stages: { orderBy: { order: 'desc' } } }});
      if(deal && pipeline && pipeline.stages.length >= 2) {
         // Stage 3 is likely 'Ativo' or 'Assinatura Ativa'
         const targetStage = pipeline.stages.find(s => s.name.includes('Ativo') || s.name.includes('Aprovada')) || pipeline.stages[0];
         await prisma.crmDeal.update({
            where: { id: deal.id },
            data: { status: 'won', stageId: targetStage.id }
         });
         await prisma.crmActivity.create({
            data: {
               tenantId, dealId: deal.id, type: 'status_change', title: 'Assinatura paga e aprovada. Card Ganho.'
            }
         });
      }
    } catch(e) {}
  }

  // If tied to order, mark as confirmed/paid
  if (intent.orderId) {
    await prisma.order.update({
      where: { id: intent.orderId },
      data: { paymentStatus: 'paid' }
    });
  }

  res.json({ status: 'ok', data: updated });
}

export async function cancelIntent(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const existing = await prisma.paymentIntent.findFirst({ where: { id, tenantId, status: 'pending' }});
  if (!existing) return res.status(404).json({ error: 'Not found or not pending' });

  const intent = await prisma.paymentIntent.update({
    where: { id },
    data: { status: 'cancelled' }
  });

  // CRM Automation
  if(intent.subscriptionRequestId) {
    try {
      const deal = await prisma.crmDeal.findFirst({ where: { subscriptionRequestId: intent.subscriptionRequestId, tenantId } });
      const pipeline = await prisma.crmPipeline.findFirst({ where: { tenantId, isDefault: true }, include: { stages: true } });
      if(deal && pipeline) {
         let recStage = pipeline.stages.find(s => s.name.includes('Recuperação'));
         if(!recStage) {
            recStage = await prisma.crmStage.create({ data: { tenantId, pipelineId: pipeline.id, name: 'Recuperação', order: 99 }});
         }
         await prisma.crmDeal.update({
            where: { id: deal.id },
            data: { status: 'lost', stageId: recStage.id }
         });
         await prisma.crmActivity.create({
            data: { tenantId, dealId: deal.id, type: 'status_change', title: 'Pagamento cancelado. Card movido para Recuperação / Lost.' }
         });
      }
    } catch(e) {}
  }

  res.json({ status: 'ok' });
}

export async function getWebhookEvents(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const events = await prisma.paymentWebhookEvent.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json({ status: 'ok', data: events });
}

export async function getProviderConfig(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  let config = await prisma.paymentProviderConfig.findFirst({
    where: { tenantId }
  });

  if (!config) {
    config = await prisma.paymentProviderConfig.create({
      data: { tenantId, mode: 'mock', provider: 'mock' }
    });
  }

  res.json({ status: 'ok', data: config });
}

export async function updateProviderConfig(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { provider, mode, enabled, publicLabel, metadataJson } = req.body;
  
  let config = await prisma.paymentProviderConfig.findFirst({ where: { tenantId }});
  
  if (config) {
    config = await prisma.paymentProviderConfig.update({
      where: { id: config.id },
      data: { provider, mode, enabled, publicLabel, metadataJson }
    });
  } else {
    config = await prisma.paymentProviderConfig.create({
      data: { tenantId, provider, mode, enabled, publicLabel, metadataJson }
    });
  }

  res.json({ status: 'ok', data: config });
}
