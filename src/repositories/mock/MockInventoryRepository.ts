import { IInventoryRepository } from '../interfaces/IInventoryRepository';
import { StockMovement, Lot } from '../../domain/types';
import { stockMovements, lots, products } from '../../data/mocks';

export class MockInventoryRepository implements IInventoryRepository {
  async getMovements(): Promise<StockMovement[]> {
    return [...stockMovements];
  }

  async getLots(): Promise<Lot[]> {
    return [...lots];
  }

  async createMovement(data: any): Promise<StockMovement> {
    const mov: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      product: data.productId, // Mock uses name? Let's just put productId for now, it's mock
      type: data.type,
      qty: data.qty,
      reason: data.reason
    };
    stockMovements.unshift(mov);
    return mov;
  }

  async createStockEntry(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement> {
    const mov: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      product: productName,
      type: 'Entrada',
      qty,
      reason
    };
    stockMovements.unshift(mov);
    return mov;
  }

  async createStockExit(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement> {
    const mov: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      product: productName,
      type: 'Saída',
      qty,
      reason
    };
    stockMovements.unshift(mov);
    return mov;
  }

  async createStockLoss(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement> {
    const mov: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      product: productName,
      type: 'Perda',
      qty,
      reason
    };
    stockMovements.unshift(mov);
    return mov;
  }

  async createStockAdjustment(productId: string, productName: string, newQty: number, reason: string): Promise<StockMovement> {
    const mov: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      product: productName,
      type: 'Ajuste',
      qty: newQty,
      reason
    };
    stockMovements.unshift(mov);
    return mov;
  }

  async createLot(data: Omit<Lot, 'id'>): Promise<Lot> {
    const newLot = {
      id: `LT-${data.code}`,
      ...data
    };
    lots.unshift(newLot);
    return newLot;
  }

  async getExpiringLots(): Promise<Lot[]> {
    const today = new Date();
    const limitDate = new Date(today);
    limitDate.setMonth(limitDate.getMonth() + 2); // 2 months from now

    return lots.filter(lot => {
      const validUntil = new Date(lot.expiryDate);
      return validUntil <= limitDate && lot.qty > 0;
    });
  }

  async calculateCurrentStock(productId: string): Promise<number> {
    const p = products.find(prod => prod.id === productId);
    if (!p) return 0;

    let current = 0;
    for (const mov of stockMovements) {
      if (mov.product === p.name) {
        if (mov.type === 'Entrada') current += mov.qty;
        else if (mov.type === 'Saída' || mov.type === 'Perda') current -= mov.qty;
        else if (mov.type === 'Ajuste') current = mov.qty;
      }
    }
    return current;
  }

  async getLowStockProducts(): Promise<any[]> {
    const lowStock = [];
    for (const prod of products) {
      const current = await this.calculateCurrentStock(prod.id);
      if (current <= (prod.minStock || 0)) {
        lowStock.push({
          product: prod,
          currentStock: current,
          minStock: prod.minStock || 0
        });
      }
    }
    return lowStock;
  }
}
