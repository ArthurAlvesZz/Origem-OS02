import { orders } from '../data/mocks';
import { OrderItem, OrderStatus } from './types';
import { applyStockMovements } from './stock';
import { financialTransactions } from '../data/mocks';

function createFinancialTransaction(
  description: string, 
  amount: number, 
  type: 'Receita' | 'Despesa', 
  status: 'Efetivado' | 'Agendado',
  category: string
) {
  const newTx: any = {
    id: `FIN-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().slice(0, 10),
    description,
    amount,
    type,
    status,
    category
  };
  financialTransactions.unshift(newTx);
  return newTx;
}

export function calculateOrderTotals(items: OrderItem[]) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalCost = 0;

  for (const item of items) {
    subtotal += (item.unitPrice * item.qty);
    totalDiscount += (item.discount * item.qty);
    totalCost += (item.unitCost * item.qty);
  }

  const total = subtotal - totalDiscount;
  const margin = total - totalCost;
  const marginPercent = total > 0 ? (margin / total) * 100 : 0;

  return { subtotal, totalDiscount, total, totalCost, margin, marginPercent };
}

export function createOrder(
  customerName: string, 
  items: OrderItem[], 
  status: OrderStatus, 
  method: string
) {
  const { total } = calculateOrderTotals(items);
  
  const orderId = `ORD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;

  const newOrder = {
    id: orderId,
    date: new Date().toISOString(),
    customer: customerName || 'Consumidor Final',
    total,
    status,
    method,
    items: items.reduce((acc, curr) => acc + curr.qty, 0)
  };

  // Add order to mocks
  orders.unshift(newOrder);

  // Apply Stock
  applyStockMovements(items, `Venda ${newOrder.id}`);

  // Apply Finance
  if (status === 'Pago') {
    createFinancialTransaction(`Venda ${newOrder.id}`, total, 'Receita', 'Efetivado', 'Vendas');
  } else if (status === 'Pendente' || status === 'Parcial') {
    createFinancialTransaction(`Recebimento ref ${newOrder.id}`, total, 'Receita', 'Agendado', 'Vendas');
  }

  return newOrder;
}
