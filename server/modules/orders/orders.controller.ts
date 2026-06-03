import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  sku: z.string().optional(),
  qty: z.number().min(0.01),
  unitPrice: z.number().min(0),
});

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    customerName: z.string().optional(),
    channel: z.enum(['pdv', 'b2b', 'online', 'consignment', 'other']),
    paymentMethod: z.string().optional(),
    paymentStatus: z.enum(['paid', 'pending', 'partial']),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1)
  })
});

export const getOrders = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const orders = await prisma.order.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      items: true
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const formatted = orders.map(o => ({
    ...o,
    id: o.id,
    date: o.orderDate.toISOString(),
    customer: o.customerName || 'Cliente Balcão',
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod || '-',
    type: o.channel === 'pdv' ? 'PDV' : o.channel === 'b2b' ? 'B2B' : 'Outro',
  }));

  res.json({ data: formatted });
};

export const getOrderById = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, tenantId, deletedAt: null },
    include: { items: true }
  });

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json({ data: order });
};

export const createOrder = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.id;
  const data = req.body;

  // 1. Fetch current products to validate stock and costs
  const productIds = data.items.map((i: any) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId, active: true, deletedAt: null }
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  // We could read stock dynamically here from movements, or a summary view.
  // We'll compute it dynamically for these items
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, productId: { in: productIds }, deletedAt: null },
    select: { productId: true, movementType: true, qty: true }
  });

  const balances: Record<string, number> = {};
  for (const p of products) balances[p.id] = 0;
  for (const m of movements) {
    if (m.movementType === 'Entrada' || m.movementType === 'Devolvido') {
      balances[m.productId] += m.qty;
    } else if (m.movementType === 'Saída' || m.movementType === 'Perda' || m.movementType === 'Consignado') {
      balances[m.productId] -= m.qty;
    } else if (m.movementType === 'Ajuste') {
      balances[m.productId] = m.qty;
    }
  }

  // Get Settings to check allowNegativeStock
  let allowNegativeStock = false;
  try {
    const setting = await prisma.appSetting.findUnique({ where: { tenantId_key: { tenantId, key: 'businessRules' } } });
    if (setting) {
      const parsed = JSON.parse(setting.value);
      allowNegativeStock = parsed.allowNegativeStock === true;
    }
  } catch(e) {}

  // 2. Validate items and prepare totals
  let subtotal = 0;
  let estimatedCost = 0;
  const orderItemsData = [];

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Produto ${item.productId} não encontrado ou inativo`);
    }

    const currentStock = balances[item.productId] ?? 0;
    if (!allowNegativeStock && currentStock < item.qty) {
      throw new Error(`Estoque insuficiente para ${product.name}`);
    }

    const lineTotal = item.qty * item.unitPrice;
    subtotal += lineTotal;
    
    const lineCost = item.qty * product.unitCost;
    estimatedCost += lineCost;

    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId,
      name: product.name,
      sku: product.sku,
      qty: item.qty,
      unitPrice: item.unitPrice,
      unitCost: product.unitCost,
      discount: 0,
      lineTotal,
      estimatedProfit: lineTotal - lineCost
    });
  }

  const discount = 0;
  const total = subtotal - discount;
  const estimatedProfit = total - estimatedCost;
  const estimatedMargin = total > 0 ? (estimatedProfit / total) * 100 : 0;

  // 3. Execute Transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // a) Create Order
      const order = await tx.order.create({
        data: {
          tenantId,
          customerId: data.customerId,
          customerName: data.customerName,
          channel: data.channel,
          subtotal,
          discount,
          total,
          estimatedCost,
          estimatedProfit,
          estimatedMargin,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          status: 'confirmed',
          notes: data.notes,
          createdBy: userId,
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });

      // b) Create Stock Movements
      for (const item of orderItemsData) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            variantId: item.variantId,
            movementType: 'Saída',
            qty: item.qty,
            unitCost: item.unitCost,
            reason: 'Venda ' + data.channel,
            referenceType: 'order',
            referenceId: order.id,
            userId,
          }
        });
      }

      // c) Create Financial Transaction
      if (data.paymentStatus === 'paid' || data.paymentStatus === 'pending') {
         // Create revenue or receivable
         const isPaid = data.paymentStatus === 'paid';
         await tx.financialTransaction.create({
           data: {
             tenantId,
             orderId: order.id,
             type: isPaid ? 'revenue' : 'receivable',
             status: isPaid ? 'paid' : 'pending',
             category: 'Venda de Produtos',
             description: `Venda #${order.id.split('-')[0]}`,
             amount: total,
             paidAmount: isPaid ? total : 0,
             date: new Date(),
             dueDate: isPaid ? new Date() : new Date(new Date().setDate(new Date().getDate() + 30)),
             paidAt: isPaid ? new Date() : null,
             paymentMethod: data.paymentMethod,
             source: 'order',
             createdBy: userId
           }
         });
      }

      return order;
    });

    res.status(201).json({ data: result });
  } catch (error: any) {
    console.error('Order transaction error:', error);
    res.status(500).json({ error: 'Erro ao processar venda: ' + error.message });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.id;
  const orderId = req.params.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, tenantId, deletedAt: null },
        include: { items: true }
      });

      if (!order) throw new Error('Pedido não encontrado');
      if (order.status === 'cancelled') throw new Error('Pedido já cancelado');

      // 1. Cancel order
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'cancelled' }
      });

      // 2. Revert Stock
      for (const item of order.items) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            variantId: item.variantId,
            movementType: 'Entrada', // Returning to stock
            qty: item.qty,
            unitCost: item.unitCost,
            reason: 'Estorno de Venda ' + order.id.split('-')[0],
            referenceType: 'order_cancellation',
            referenceId: order.id,
            userId,
          }
        });
      }

      // 3. Revert Financial Transaction if any
      // In a real app we might create an offsetting entry or just mark it cancelled/deleted
      await tx.financialTransaction.updateMany({
        where: { orderId: order.id, tenantId },
        data: { status: 'cancelled' }
      });

      return updatedOrder;
    });

    res.json({ data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
