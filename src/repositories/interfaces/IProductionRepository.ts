import { ProductionBatch, ProductionInput, ProductionExtraCost, ProductionStatus } from '../../domain/types';

export interface CreateProductionBatchDTO {
  finalProductId: string;
  finalProductName: string;
  expectedDate: string;
  inputs: ProductionInput[];
  extraCosts: ProductionExtraCost[];
  estimatedHours: number;
  laborCostPerHour: number;
  initialWeight: number;
  responsible: string;
  notes?: string;
}

export interface FinalizeProductionBatchDTO {
  finalWeight: number;
  status: ProductionStatus;
  notes?: string;
}

export interface IProductionRepository {
  getBatches(): Promise<ProductionBatch[]>;
  getBatchById(id: string): Promise<ProductionBatch | undefined>;
  createProductionBatch(data: CreateProductionBatchDTO): Promise<ProductionBatch>;
  finalizeProductionBatch(batchId: string, data: FinalizeProductionBatchDTO): Promise<ProductionBatch>;
}
