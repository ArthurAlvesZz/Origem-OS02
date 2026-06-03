import { safeFetch } from './apiClient';
import { IInventoryRepository } from '../interfaces/IInventoryRepository';
import { StockMovement, Lot } from '../../domain/types';

export class ApiInventoryRepository implements IInventoryRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getMovements(): Promise<StockMovement[]> {
    const json = await safeFetch('/api/inventory/movements', { headers: this.getHeaders() });
    return json.data;
  }

  async getLots(): Promise<Lot[]> {
    const json = await safeFetch('/api/inventory/lots', { headers: this.getHeaders() });
    return json.data;
  }

  async createMovement(data: any): Promise<StockMovement> {
    const json = await safeFetch('/api/inventory/movements', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }

  async createStockEntry(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement> {
    return this.createMovement({ productId, type: 'Entrada', qty, reason });
  }

  async createStockExit(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement> {
    return this.createMovement({ productId, type: 'Saída', qty, reason });
  }

  async createStockLoss(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement> {
    return this.createMovement({ productId, type: 'Perda', qty, reason });
  }

  async createStockAdjustment(productId: string, productName: string, newQty: number, reason: string): Promise<StockMovement> {
    return this.createMovement({ productId, type: 'Ajuste', qty: newQty, reason });
  }

  async createLot(data: Omit<Lot, 'id'>): Promise<Lot> {
    const json = await safeFetch('/api/inventory/lots', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }

  async getExpiringLots(): Promise<Lot[]> {
    return []; // TODO
  }

  async calculateCurrentStock(productId: string): Promise<number> {
    const json = await safeFetch('/api/inventory/summary', { headers: this.getHeaders() });
    const match = json.data.find((x: any) => x.id === productId);
    return match ? match.currentStock : 0;
  }

  async getLowStockProducts(): Promise<any[]> {
    const json = await safeFetch('/api/inventory/low-stock', { headers: this.getHeaders() });
    return json.data;
  }
}
