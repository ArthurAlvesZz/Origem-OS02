import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ----------------------------------------------------------------------
// PUBLIC STOREFRONT ENDPOINTS
// ----------------------------------------------------------------------

export async function getStorefrontProducts(req: Request, res: Response) {
  // Storefront needs active products
  // we would normally match tenant by origin or passed id
  const tenantId = req.query.t as string || 'default'; // In a real scenario, use subdomain or headers
  
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, description: true, category: true, unitPrice: true }
  });

  res.json({ status: 'ok', data: products });
}

export async function getStorefrontPlans(req: Request, res: Response) {
  // Same, tenant ID comes from header/query in public requests
  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
  });

  res.json({ status: 'ok', data: plans });
}

export async function createSubscriptionRequest(req: Request, res: Response) {
  const { tenantId, planId, customerName, customerEmail, customerPhone, address, notes } = req.body;

  try {
    const request = await prisma.subscriptionRequest.create({
      data: {
        tenantId, // Should ideally be validated against existing tenant
        planId,
        customerName,
        customerEmail,
        customerPhone,
        address,
        notes,
        status: 'pending'
      }
    });

    // CRM Automation: Create Deal
    try {
      const pipeline = await prisma.crmPipeline.findFirst({
        where: { tenantId, isDefault: true },
        include: { stages: { orderBy: { order: 'asc' } } }
      });
      if (pipeline && pipeline.stages.length > 0) {
        await prisma.crmDeal.create({
           data: {
             tenantId,
             pipelineId: pipeline.id,
             stageId: pipeline.stages[0].id,
             title: `Nova Assinatura: ${customerName}`,
             subscriptionRequestId: request.id,
             status: 'open',
             priority: 'normal'
           }
        });
      }
    } catch (crmErr) {
       console.warn('CRM automation failed', crmErr);
    }

    res.json({ status: 'ok', data: request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// ----------------------------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------------------------

export async function getPlans(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const plans = await prisma.subscriptionPlan.findMany({
    where: { tenantId, deletedAt: null }
  });
  res.json({ status: 'ok', data: plans });
}

export async function createPlan(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, description, frequency, packageCount, weight, price, active, featured, productId } = req.body;

  const plan = await prisma.subscriptionPlan.create({
    data: { tenantId, name, description, frequency, packageCount, weight, price, active, featured, productId }
  });
  res.json({ status: 'ok', data: plan });
}

export async function updatePlan(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { name, description, frequency, packageCount, weight, price, active, featured, productId } = req.body;

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: { name, description, frequency, packageCount, weight, price, active, featured, productId }
  });
  res.json({ status: 'ok', data: plan });
}

export async function getRequests(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const requests = await prisma.subscriptionRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: requests });
}

export async function updateRequestStatus(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { status } = req.body;

  // We could also do logic to create standard subscription if approved.
  const reqDb = await prisma.subscriptionRequest.findFirst({ where: { id, tenantId }});
  if (!reqDb) return res.status(404).json({ error: 'Not found' });

  await prisma.subscriptionRequest.update({
    where: { id },
    data: { status }
  });
  
  res.json({ status: 'ok' });
}

export async function getSubscriptions(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const subs = await prisma.subscription.findMany({
    where: { tenantId },
    include: {
      plan: true,
      customer: true
    }
  });

  const formatted = subs.map(s => ({
    id: s.id,
    planId: s.plan.id,
    planName: s.plan.name,
    customerId: s.customer.id,
    customerName: s.customer.name,
    status: s.status,
    startedAt: s.startedAt,
    nextBillingAt: s.nextBillingAt
  }));

  res.json({ status: 'ok', data: formatted });
}

export async function updateSubscriptionStatus(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { status } = req.body;

  await prisma.subscription.update({
    where: { id },
    data: { status }
  });

  res.json({ status: 'ok' });
}
