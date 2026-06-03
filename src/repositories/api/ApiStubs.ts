import { safeFetch } from './apiClient';
import { IProductRepository } from '../interfaces/IProductRepository';
import { IOrderRepository, CreateOrderDTO } from '../interfaces/IOrderRepository';
import { IInventoryRepository } from '../interfaces/IInventoryRepository';
import { IConsignmentRepository, CreateConsignmentDTO, SettleConsignmentDTO } from '../interfaces/IConsignmentRepository';
import { IProductionRepository, CreateProductionBatchDTO, FinalizeProductionBatchDTO } from '../interfaces/IProductionRepository';
import { IFinancialRepository, CreateTransactionDTO, FinancialSummaryData, DREData, CashFlowData } from '../interfaces/IFinancialRepository';

export class ApiProductRepository implements IProductRepository {
  async getProducts() { return []; }
  async getProductById(id: string) { return undefined; }
  async createProduct(data: any) { return {} as any; }
  async updateProduct(id: string, data: any) { return {} as any; }
  async deleteProduct(id: string) {}
}
