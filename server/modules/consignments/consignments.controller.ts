import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const createPartnerSchema = z.object({
  body: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    document: z.string().optional(),
    type: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional()
  })
});

export const createConsignmentSchema = z.object({
  body: z.object({
    partnerId: z.string().uuid(),
    partnerName: z.string(),
    date: z.string(),
    expectedReturnDate: z.string().optional(),
    totalValue: z.number().min(0),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      name: z.string(),
      sentQty: z.number().min(1),
      unitCost: z.number().min(0),
      unitPrice: z.number().min(0)
    }))
  })
});

export const settleConsignmentSchema = z.object({
  body: z.object({
    date: z.string(),
    paymentMethod: z.string().optional(),
    status: z.string(),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      name: z.string(),
      soldQty: z.number().min(0),
      returnedQty: z.number().min(0),
      lostQty: z.number().min(0),
      unitPrice: z.number().min(0),
      unitCost: z.number().min(0)
    }))
  })
});

// Partners Methods
export const getPartners = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const partners = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null, type: 'partner', status: { notIn: ['blocked', 'inactive'] } },
    orderBy: { name: 'asc' }
  });
  res.json({ data: partners });
};

export const createPartner = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const data = req.body;

  const partner = await prisma.customer.create({
    data: {
      tenantId,
      type: 'partner',
      ...data
    }
  });
  res.status(201).json({ data: partner });
};

export const updatePartner = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const data = req.body;

  const partner = await prisma.customer.updateMany({
    where: { id, tenantId },
    data
  });
  if (partner.count === 0) {
    throw new Error('Parceiro não encontrado.');
  }

  const updated = await prisma.customer.findUnique({ where: { id } });
  res.json({ data: updated });
};

// Consignments Methods
export const getConsignments = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const consignments = await prisma.consignment.findMany({
    where: { tenantId, deletedAt: null },
    include: { items: true },
    orderBy: { date: 'desc' }
  });

  const formatted = consignments.map(c => ({
    ...c,
    date: c.date.toISOString(),
    expectedReturnDate: c.expectedReturnDate ? c.expectedReturnDate.toISOString() : undefined
  }));

  res.json({ data: formatted });
};

export const getConsignmentById = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const consignment = await prisma.consignment.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!consignment || consignment.tenantId !== tenantId || consignment.deletedAt) {
    return res.status(404).json({ error: 'Consignação não encontrada' });
  }

  res.json({ data: { 
    ...consignment, 
    date: consignment.date.toISOString(),
    expectedReturnDate: consignment.expectedReturnDate ? consignment.expectedReturnDate.toISOString() : undefined
  }});
};

export const createConsignment = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const data = req.body;

  const result = await prisma.$transaction(async (tx) => {
    // Check available stock
    for (const item of data.items) {
      const agg = await tx.stockMovement.aggregate({
        where: { tenantId, productId: item.productId, deletedAt: null },
        _sum: { qty: true }
      });
      const availableStock = agg._sum.qty || 0;
      if (availableStock < item.sentQty) {
        throw new Error(`Estoque insuficiente para o produto ${item.name}. Necessário: ${item.sentQty}, Disponível: ${availableStock}.`);
      }
    }

    const totalCost = data.items.reduce((sum: number, it: any) => sum + (it.unitCost * it.sentQty), 0);

    const created = await tx.consignment.create({
      data: {
        tenantId,
        partnerId: data.partnerId,
        partnerName: data.partnerName,
        date: new Date(data.date),
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : undefined,
        status: data.status || 'open',
        totalValue: data.totalValue || 0,
        totalCost,
        notes: data.notes,
        createdBy: userId,
        items: {
          create: data.items.map((i: any) => ({
             productId: i.productId,
             name: i.name,
             sentQty: i.sentQty,
             unitCost: i.unitCost,
             unitPrice: i.unitPrice
          }))
        }
      },
      include: { items: true }
    });

    const location = await tx.stockLocation.findFirst({ where: { tenantId } });
    if (location) {
      for (const item of created.items) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            locationId: location.id,
            movementType: 'consignment_out',
            qty: -item.sentQty,
            unitCost: item.unitCost,
            reason: `Remessa Consig. ${created.id}`,
            referenceType: 'consignment',
            referenceId: created.id,
            userId
          }
        });
      }
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Consignment',
        recordId: created.id,
        action: 'CREATE',
        newData: { status: created.status, totalValue: created.totalValue }
      }
    });

    return created;
  });

  res.status(201).json({ data: { 
    ...result, 
    date: result.date.toISOString(),
    expectedReturnDate: result.expectedReturnDate ? result.expectedReturnDate.toISOString() : undefined
  }});
};

export const settleConsignment = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;
  const data = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const consignment = await tx.consignment.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!consignment || consignment.tenantId !== tenantId || consignment.deletedAt) {
      throw new Error('Consignação não encontrada');
    }
    if (consignment.status === 'closed' || consignment.status === 'cancelled') {
      throw new Error('Consignação já está fechada ou cancelada.');
    }

    // Process items and validate balance
    let totalSold = 0;
    let totalCostSold = 0;
    
    for (const itemData of data.items) {
      const originalItem = consignment.items.find((i: any) => i.productId === itemData.productId);
      if (!originalItem) throw new Error(`Item ${itemData.name} não faz parte da remessa original.`);
      
      const balance = originalItem.sentQty - originalItem.soldQty - originalItem.returnedQty - originalItem.lostQty;
      const sumSettle = itemData.soldQty + itemData.returnedQty + itemData.lostQty;
      
      if (sumSettle > balance + 0.0001) { // Floating point protection
        throw new Error(`Quantidade informada de ${itemData.name} (${sumSettle}) excede o saldo aberto (${balance}).`);
      }
      
      // Accumulate sales total
      totalSold += itemData.soldQty * itemData.unitPrice;
      totalCostSold += itemData.soldQty * itemData.unitCost;

      // Update ConsignmentItem
      await tx.consignmentItem.update({
        where: { id: originalItem.id },
        data: {
          soldQty: originalItem.soldQty + itemData.soldQty,
          returnedQty: originalItem.returnedQty + itemData.returnedQty,
          lostQty: originalItem.lostQty + itemData.lostQty
        }
      });
      
      // Stock Updates
      const location = await tx.stockLocation.findFirst({ where: { tenantId } });
      if (location) {
        if (itemData.returnedQty > 0) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: originalItem.productId,
              locationId: location.id,
              movementType: 'consignment_return',
              qty: itemData.returnedQty,
              unitCost: originalItem.unitCost,
              reason: `Devolução Consig. ${consignment.id}`,
              referenceType: 'consignment_settlement',
              referenceId: consignment.id,
              userId
            }
          });
        }
        if (itemData.lostQty > 0) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: originalItem.productId,
              locationId: location.id,
              movementType: 'loss',
              qty: -itemData.lostQty,
              unitCost: originalItem.unitCost,
              reason: `Perda/Avaria Consig. ${consignment.id}`,
              referenceType: 'consignment_settlement',
              referenceId: consignment.id,
              userId
            }
          });
        }
      }
    }

    // Create Settlement Record
    let orderId = undefined;

    // If there is any sale, generate Order and Finance
    if (totalSold > 0) {
      // In the new model, the consignment's partner IS a customer.
      let customer = await tx.customer.findUnique({
        where: { id: consignment.partnerId }
      });
      
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            tenantId,
            type: 'partner',
            name: consignment.partnerName,
          }
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          customerId: customer.id,
          customerName: customer.name,
          channel: 'consignacao',
          orderDate: new Date(data.date),
          subtotal: totalSold,
          total: totalSold, // assuming no global discount here 
          estimatedCost: totalCostSold,
          estimatedProfit: totalSold - totalCostSold,
          estimatedMargin: totalSold > 0 ? ((totalSold - totalCostSold) / totalSold) * 100 : 0,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'paid', // settlement is paid right away usually
          status: 'completed',
          notes: `Acerto da Consignação ${consignment.id}. ${data.notes || ''}`,
          createdBy: userId,
          items: {
            create: data.items.filter((i: any) => i.soldQty > 0).map((i: any) => ({
              productId: i.productId,
              name: i.name,
              qty: i.soldQty,
              unitPrice: i.unitPrice,
              unitCost: i.unitCost,
              lineTotal: i.soldQty * i.unitPrice,
              estimatedProfit: (i.soldQty * i.unitPrice) - (i.soldQty * i.unitCost)
            }))
          }
        }
      });
      orderId = newOrder.id;

      // Create Financial Transaction
      await tx.financialTransaction.create({
        data: {
          tenantId,
          orderId: newOrder.id,
          type: 'Receita',
          status: 'paid',
          category: 'Vendas',
          description: `Acerto Consignação - Pedido ${newOrder.id}`,
          amount: totalSold,
          paidAmount: totalSold,
          date: new Date(data.date),
          paidAt: new Date(data.date),
          paymentMethod: data.paymentMethod,
          referenceId: consignment.id,
          source: 'consignment',
          createdBy: userId
        }
      });
    }

    const settlement = await tx.consignmentSettlement.create({
      data: {
        tenantId,
        consignmentId: id,
        date: new Date(data.date),
        totalValue: totalSold,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        orderId,
        createdBy: userId,
        items: {
          create: data.items.map((i: any) => ({
             productId: i.productId,
             name: i.name,
             soldQty: i.soldQty,
             returnedQty: i.returnedQty,
             lostQty: i.lostQty,
             unitPrice: i.unitPrice,
             unitCost: i.unitCost
          }))
        }
      }
    });

    const updated = await tx.consignment.update({
      where: { id },
      data: { status: data.status || 'partially_settled' },
      include: { items: true }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Consignment',
        recordId: id,
        action: 'SETTLE',
        newData: { status: updated.status, totalSold }
      }
    });

    return updated;
  });

  res.json({ data: { 
    ...result, 
    date: result.date.toISOString(),
    expectedReturnDate: result.expectedReturnDate ? result.expectedReturnDate.toISOString() : undefined 
  }});
};

export const cancelConsignment = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;

  const result = await prisma.$transaction(async (tx) => {
    const consignment = await tx.consignment.findUnique({
      where: { id },
      include: { settlements: true }
    });

    if (!consignment || consignment.tenantId !== tenantId || consignment.deletedAt) {
      throw new Error('Consignação não encontrada');
    }
    
    if (consignment.settlements.length > 0) {
      throw new Error('Não é possível cancelar uma consignação que já possui acertos.');
    }

    const updated = await tx.consignment.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Consignment',
        recordId: id,
        action: 'CANCEL',
        newData: { status: 'cancelled' }
      }
    });

    return updated;
  });

  res.json({ data: { 
    ...result, 
    date: result.date.toISOString(),
    expectedReturnDate: result.expectedReturnDate ? result.expectedReturnDate.toISOString() : undefined
  }});
};
