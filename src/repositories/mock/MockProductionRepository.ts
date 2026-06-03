import { IProductionRepository, CreateProductionBatchDTO, FinalizeProductionBatchDTO } from '../interfaces/IProductionRepository';
import { ProductionBatch } from '../../domain/types';
import { productionBatches } from '../../data/mocks';

export class MockProductionRepository implements IProductionRepository {
  async getBatches(): Promise<ProductionBatch[]> {
    return [...productionBatches];
  }

  async getBatchById(id: string): Promise<ProductionBatch | undefined> {
    return productionBatches.find(b => b.id === id);
  }

  async createProductionBatch(data: CreateProductionBatchDTO): Promise<ProductionBatch> {
    const totalInputCost = data.inputs.reduce((acc, curr) => acc + (curr.qty * curr.unitCost), 0);
    const totalExtraCost = data.extraCosts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalLaborCost = data.estimatedHours * data.laborCostPerHour;
    const totalCost = totalInputCost + totalExtraCost + totalLaborCost;

    const newBatch: ProductionBatch = {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      code: `TR-NEXT`, 
      date: data.expectedDate,
      finalProductId: data.finalProductId,
      finalProductName: data.finalProductName,
      status: 'Em Produção',
      inputs: data.inputs,
      extraCosts: data.extraCosts,
      hours: data.estimatedHours,
      laborCostPerHour: data.laborCostPerHour,
      initialWeight: data.initialWeight,
      finalWeight: 0,
      finalQty: 0,
      yieldPercent: 0,
      lossPercent: 0,
      totalInputCost,
      totalExtraCost,
      totalLaborCost,
      totalCost,
      unitCost: 0,
      responsible: data.responsible,
      notes: data.notes || ''
    };

    productionBatches.unshift(newBatch);
    return newBatch;
  }

  async finalizeProductionBatch(batchId: string, data: FinalizeProductionBatchDTO): Promise<ProductionBatch> {
    const idx = productionBatches.findIndex(b => b.id === batchId);
    if (idx === -1) throw new Error('Lote não encontrado.');
    
    const b = productionBatches[idx];
    const initial = b.initialWeight || 0;
    const yieldPercent = initial > 0 ? (data.finalWeight / initial) * 100 : 0;
    const lossPercent = 100 - yieldPercent;

    productionBatches[idx] = {
      ...b,
      status: data.status,
      finalWeight: data.finalWeight,
      yieldPercent,
      lossPercent,
      notes: b.notes + (data.notes ? `\n[Fim]: ${data.notes}` : '')
    };

    return productionBatches[idx];
  }
}
