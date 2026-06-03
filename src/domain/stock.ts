import { products, stockMovements } from '../data/mocks';
import { OrderItem } from './types';

export function validateStockAvailability(items: OrderItem[]) {
  const warnings: string[] = [];
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;
    if (product.stock < item.qty) {
      warnings.push(`O produto ${product.name} excederá o estoque (${product.stock} disponíveis).`);
    }
  }
  return warnings;
}

export function applyStockMovements(items: OrderItem[], reason: string) {
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      product.stock -= item.qty;
      stockMovements.unshift({
        id: `MOV-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
        date: new Date().toISOString().slice(0,10),
        type: 'Saída',
        product: product.name,
        qty: -item.qty,
        reason
      });
    }
  }
}
