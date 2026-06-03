import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    type: z.string().optional(),
    name: z.string().min(1),
    legalName: z.string().optional(),
    documentType: z.string().optional(),
    document: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    status: z.string().optional(),
    defaultPaymentTermsDays: z.number().optional(),
    creditLimit: z.number().optional(),
    notes: z.string().optional(),
    tags: z.string().optional(),
    address: z.object({
      street: z.string().min(1),
      number: z.string(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().optional(),
      country: z.string().optional()
    }).optional()
  })
});

export const updateCustomerSchema = z.object({
  body: z.object({
    type: z.string().optional(),
    name: z.string().min(1).optional(),
    legalName: z.string().optional(),
    documentType: z.string().optional(),
    document: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    status: z.string().optional(),
    defaultPaymentTermsDays: z.number().optional(),
    creditLimit: z.number().optional(),
    notes: z.string().optional(),
    tags: z.string().optional()
  })
});

export const getCustomers = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const customers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    include: { addresses: true },
    orderBy: { name: 'asc' }
  });
  res.json({ data: customers });
};

export const getCustomerById = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { addresses: true }
  });

  if (!customer || customer.tenantId !== tenantId || customer.deletedAt) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  res.json({ data: customer });
};

export const createCustomer = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { address, ...data } = req.body;

  if (data.document && data.documentType !== 'none') {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, document: data.document, deletedAt: null }
    });
    if (existing) {
      throw new Error(`Documento ${data.document} já está cadastrado para outro cliente.`);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        tenantId,
        createdBy: userId,
        ...data,
      }
    });

    if (address) {
      await tx.customerAddress.create({
        data: {
          customerId: created.id,
          isDefault: true,
          ...address
        }
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Customer',
        recordId: created.id,
        action: 'CREATE',
        newData: { type: created.type, name: created.name }
      }
    });

    return created;
  });

  const full = await prisma.customer.findUnique({
    where: { id: result.id },
    include: { addresses: true }
  });

  res.status(201).json({ data: full });
};

export const updateCustomer = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;
  const data = req.body;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.tenantId !== tenantId || customer.deletedAt) {
    throw new Error('Cliente não encontrado.');
  }

  if (data.document && data.documentType !== 'none' && data.document !== customer.document) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, document: data.document, deletedAt: null, id: { not: id } }
    });
    if (existing) {
      throw new Error(`Documento ${data.document} já está cadastrado para outro cliente.`);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id },
      data
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Customer',
        recordId: id,
        action: 'UPDATE',
        newData: data
      }
    });

    return updated;
  });

  const full = await prisma.customer.findUnique({
    where: { id: result.id },
    include: { addresses: true }
  });

  res.json({ data: full });
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.tenantId !== tenantId || customer.deletedAt) {
    throw new Error('Cliente não encontrado.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Customer',
        recordId: id,
        action: 'DELETE'
      }
    });
  });

  res.json({ success: true });
};

export const getCustomerBalance = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.tenantId !== tenantId) {
    throw new Error('Cliente não encontrado');
  }

  // Calculate balance based on unpaid sales to this customer and unpaid consignments
  // Actually, we can check orders
  const orders = await prisma.order.findMany({
    where: { tenantId, customerId: id, status: { notIn: ['cancelled'] }, paymentStatus: 'pending' }
  });
  const openReceivables = orders.reduce((acc, o) => acc + o.total, 0); // Simplified

  // Unpaid finance transactions
  // Also we might have some direct financial entries (type Receita, source 'order' or whatever)
  // Let's sum pending 'Receita' linking this customer. Need a link in financial.
  // Wait, our financial transaction doesn't have a direct customerId link without orderId.
  // Oh, wait, the openReceivables calculation is fine for orders.
  // What about consignments?
  const consignments = await prisma.consignment.findMany({
    where: { tenantId, partnerId: id, status: { in: ['open', 'partially_settled'] }, deletedAt: null },
    include: { items: true }
  });
  
  let consignmentBalance = 0;
  for (const c of consignments) {
    for (const item of c.items) {
       const qty = item.sentQty - item.soldQty - item.returnedQty - item.lostQty;
       if (qty > 0) {
         consignmentBalance += qty * item.unitPrice;
       }
    }
  }

  res.json({ 
    data: {
      openReceivables,
      consignmentBalance,
      totalExposure: openReceivables + consignmentBalance
    }
  });
};

export const getCustomerActivity = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  
  // Recent orders
  const orders = await prisma.order.findMany({
    where: { tenantId, customerId: id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Recent consignments
  const consignments = await prisma.consignment.findMany({
    where: { tenantId, partnerId: id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Merge and sort
  const act1 = orders.map(o => ({
    id: o.id,
    type: 'pedido',
    date: o.orderDate,
    description: `Pedido ${o.id} - R$ ${o.total.toFixed(2)} (${o.paymentStatus})`
  }));
  const act2 = consignments.map(c => ({
    id: c.id,
    type: 'consignacao',
    date: c.date,
    description: `Remessa ${c.id} - R$ ${c.totalValue.toFixed(2)} (${c.status})`
  }));

  const activity = [...act1, ...act2].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ data: activity });
};
