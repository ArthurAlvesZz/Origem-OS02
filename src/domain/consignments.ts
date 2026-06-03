import { consignments, partners, products } from '../data/mocks';
import { Consignment, ConsignmentItem, ConsignmentStatus } from './types';
import { createOrder } from './orders';
import { createStockLoss, createStockEntry, createStockExit } from './inventory';

export function calculateConsignmentPotentialValue(items: ConsignmentItem[]) {
  return items.reduce((acc, item) => acc + (item.qtySent * item.unitPrice), 0);
}

export function validateConsignmentStock(items: { productId: string; qtySent: number; name: string }[]) {
  const warnings: string[] = [];
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;
    if (product.stock < item.qtySent) {
      warnings.push(`O produto ${item.name} não tem estoque suficiente (${product.stock} disponíveis).`);
    }
  }
  return warnings;
}

export function createConsignment(
  partnerId: string, 
  sentDate: string, 
  dueDate: string, 
  itemsData: { productId: string; qtySent: number; name: string; unitPrice: number; unitCost: number }[]
) {
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) throw new Error('Parceiro não encontrado.');

  const items: ConsignmentItem[] = itemsData.map(i => ({
    productId: i.productId,
    name: i.name,
    qtySent: i.qtySent,
    qtySold: 0,
    qtyReturned: 0,
    qtyLost: 0,
    unitPrice: i.unitPrice,
    unitCost: i.unitCost
  }));

  const expectedTotal = calculateConsignmentPotentialValue(items);

  const newConsignment: Consignment = {
    id: `CSG-${Date.now().toString().slice(-4)}`,
    partnerId,
    partnerName: partner.name,
    sentDate,
    dueDate,
    status: 'Aberta',
    items,
    expectedTotal,
    soldTotal: 0
  };

  // Reduce available stock because products are physically leaving our warehouse to the partner
  for (const item of items) {
    createStockExit(item.productId, item.name, item.qtySent, `Remessa Consig. ${newConsignment.id}`);
  }

  consignments.unshift(newConsignment);
  return newConsignment;
}

export function settleConsignment(
  consignmentId: string, 
  itemSettlements: { productId: string; qtySold: number; qtyReturned: number; qtyLost: number }[],
  isFinal: boolean
) {
  const consignment = consignments.find(c => c.id === consignmentId);
  if (!consignment) throw new Error('Consignação não encontrada.');
  if (consignment.status === 'Fechada') throw new Error('Consignação já fechada.');

  let totalSoldAmount = 0;
  const itemsToCreateOrder = [];

  for (const settlement of itemSettlements) {
    const item = consignment.items.find(i => i.productId === settlement.productId);
    if (!item) continue;

    // Validate quantities
    const unallocated = item.qtySent - (item.qtySold + item.qtyReturned + item.qtyLost);
    const sumNew = settlement.qtySold + settlement.qtyReturned + settlement.qtyLost;
    if (sumNew > unallocated) {
      throw new Error(`As quantidades para ${item.name} ultrapassam o que foi enviado.`);
    }

    item.qtySold += settlement.qtySold;
    item.qtyReturned += settlement.qtyReturned;
    item.qtyLost += settlement.qtyLost;

    if (settlement.qtySold > 0) {
      totalSoldAmount += settlement.qtySold * item.unitPrice;
      itemsToCreateOrder.push({
        productId: item.productId,
        name: item.name,
        qty: settlement.qtySold,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        discount: 0
      });
    }

    if (settlement.qtyReturned > 0) {
      createStockEntry(item.productId, item.name, settlement.qtyReturned, `Devolução Consig. ${consignmentId}`);
    }

    if (settlement.qtyLost > 0) {
      createStockLoss(item.productId, item.name, settlement.qtyLost, `Perda Consig. ${consignmentId}`);
    }
  }

  // Create an Order for the sold items
  if (itemsToCreateOrder.length > 0) {
    // createOrder also does applyStockMovements which decreases stock again!
    // But since the stock was already removed from our warehouse when sent to consignment,
    // creating the order will double-decrease. 
    // To fix this in a mock without complex refactoring of createOrder:
    // We could add back the sold items to the stock just before createOrder is called, so createOrder can safely remove it again.
    for (const orderItem of itemsToCreateOrder) {
      const product = products.find(p => p.id === orderItem.productId);
      if (product) {
        product.stock += orderItem.qty; // Temporary add back
      }
    }
    
    // Now call createOrder
    createOrder(consignment.partnerName, itemsToCreateOrder, 'Pago', 'A Prazo'); // Using "A Prazo" or whatever default
  }

  consignment.soldTotal += totalSoldAmount;

  if (isFinal) {
    consignment.status = 'Fechada';
  } else {
    consignment.status = 'Parcial';
  }

  // Check if all items are fully allocated
  const allAllocated = consignment.items.every(i => i.qtySent === (i.qtySold + i.qtyReturned + i.qtyLost));
  if (allAllocated) {
    consignment.status = 'Fechada';
  }

  return consignment;
}
