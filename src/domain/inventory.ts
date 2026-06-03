import { stockMovements, products, lots } from '../data/mocks';
import { Lot, StockMovement, MovementType } from './types';

function applyMovement(type: MovementType, productId: string, productName: string, qtyDelta: number, reason: string) {
  const product = products.find(p => p.id === productId);
  if (!product) throw new Error('Produto não encontrado');

  const newStock = product.stock + qtyDelta;
  if (newStock < 0 && (type === 'Saída' || type === 'Perda')) {
    // Para simplificar, não bloqueamos o negativo aqui no domínio base, apenas avisamos na UI, ou se quiser bloquear:
    // throw new Error('Estoque não pode ficar negativo para essa operação.');
  }

  product.stock = newStock;

  const movement: StockMovement = {
    id: `MOV-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().slice(0, 10),
    type,
    product: productName,
    qty: qtyDelta,
    reason
  };

  stockMovements.unshift(movement);
  return movement;
}

export function createStockEntry(productId: string, productName: string, qty: number, reason: string) {
  if (qty <= 0) throw new Error('A quantidade de entrada deve ser maior que zero');
  return applyMovement('Entrada', productId, productName, qty, reason);
}

export function createStockExit(productId: string, productName: string, qty: number, reason: string) {
  if (qty <= 0) throw new Error('A quantidade de saída deve ser maior que zero');
  return applyMovement('Saída', productId, productName, -qty, reason);
}

export function createStockLoss(productId: string, productName: string, qty: number, reason: string) {
  if (qty <= 0) throw new Error('A quantidade de perda deve ser maior que zero');
  return applyMovement('Perda', productId, productName, -qty, reason);
}

export function createStockAdjustment(productId: string, productName: string, newQty: number, reason: string) {
  const product = products.find(p => p.id === productId);
  if (!product) throw new Error('Produto não encontrado');

  const delta = newQty - product.stock;
  if (delta === 0) return null;

  return applyMovement('Ajuste', productId, productName, delta, reason);
}

export function createLot(data: Omit<Lot, 'id'>) {
  if (data.qty <= 0) throw new Error('A quantidade do lote deve ser maior que zero');
  
  const newLot: Lot = {
    ...data,
    id: `L-${Date.now().toString().slice(-4)}`
  };
  
  lots.unshift(newLot);
  
  // Optionally, create a stock entry directly from the lot
  applyMovement('Entrada', data.productId, data.productName, data.qty, `Lote ${newLot.code} cadastrado`);
  
  return newLot;
}

export function calculateCurrentStock(productId: string) {
  const product = products.find(p => p.id === productId);
  return product ? product.stock : 0;
}

export function getLowStockProducts() {
  return products.filter(p => p.stock <= p.minStock && p.active);
}

export function getExpiringLots() {
  const now = new Date();
  const warningDate = new Date();
  warningDate.setDate(now.getDate() + 30); // 30 days window
  
  return lots.filter(l => {
    const expiry = new Date(l.expiryDate);
    return expiry <= warningDate;
  });
}
