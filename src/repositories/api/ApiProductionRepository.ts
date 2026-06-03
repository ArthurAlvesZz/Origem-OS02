import { safeFetch } from './apiClient';
import { IProductionRepository, CreateProductionBatchDTO, FinalizeProductionBatchDTO } from '../interfaces/IProductionRepository';
import { ProductionBatch } from '../../domain/types';

export class ApiProductionRepository implements IProductionRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getBatches(): Promise<ProductionBatch[]> {
    const json = await safeFetch('/api/production/batches', { headers: this.getHeaders() });
    return json.data;
  }

  async getBatchById(id: string): Promise<ProductionBatch | undefined> {
    const json = await safeFetch(`/api/production/batches/${id}`, { headers: this.getHeaders() });
    return json.data;
  }

  async createProductionBatch(data: CreateProductionBatchDTO): Promise<ProductionBatch> {
    const json = await safeFetch('/api/production/batches', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...data,
        date: data.expectedDate,
        hours: data.estimatedHours
      })
    });
    return json.data;
  }

  async finalizeProductionBatch(id: string, data: FinalizeProductionBatchDTO): Promise<ProductionBatch> {
    const json = await safeFetch(`/api/production/batches/${id}/complete`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }
}
