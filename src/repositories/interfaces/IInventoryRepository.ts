import { StockMovement, Lot } from '../../domain/types';

export interface IInventoryRepository {
  getMovements(): Promise<StockMovement[]>;
  getLots(): Promise<Lot[]>;
  
  createMovement(data: any): Promise<StockMovement>;
  
  createStockEntry(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement>;
  createStockExit(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement>;
  createStockLoss(productId: string, productName: string, qty: number, reason: string): Promise<StockMovement>;
  createStockAdjustment(productId: string, productName: string, newQty: number, reason: string): Promise<StockMovement>;

  createLot(data: Omit<Lot, 'id'>): Promise<Lot>;
  getExpiringLots(): Promise<Lot[]>;
  
  calculateCurrentStock(productId: string): Promise<number>;
  getLowStockProducts(): Promise<any[]>;
}
