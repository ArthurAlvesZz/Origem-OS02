import { IAdvancedProductionRepository, GreenCoffeeLotRecord, ProductionRecipeRecord, RoastProfileRecord } from '../interfaces/IAdvancedProductionRepository';
import { safeFetch } from './apiClient';

export class ApiAdvancedProductionRepository implements IAdvancedProductionRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getGreenLots(): Promise<GreenCoffeeLotRecord[]> {
    const res = await safeFetch('/api/production/green-lots', { headers: this.getHeaders() });
    return res.data;
  }
  async createGreenLot(data: Partial<GreenCoffeeLotRecord>): Promise<GreenCoffeeLotRecord> {
    const res = await safeFetch('/api/production/green-lots', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }
  async updateGreenLot(id: string, data: Partial<GreenCoffeeLotRecord>): Promise<GreenCoffeeLotRecord> {
    const res = await safeFetch(`/api/production/green-lots/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }

  async getRecipes(): Promise<ProductionRecipeRecord[]> {
    const res = await safeFetch('/api/production/recipes', { headers: this.getHeaders() });
    return res.data;
  }
  async createRecipe(data: Partial<ProductionRecipeRecord>): Promise<ProductionRecipeRecord> {
    const res = await safeFetch('/api/production/recipes', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }
  async updateRecipe(id: string, data: Partial<ProductionRecipeRecord>): Promise<ProductionRecipeRecord> {
    const res = await safeFetch(`/api/production/recipes/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }

  async getRoastProfiles(): Promise<RoastProfileRecord[]> {
    const res = await safeFetch('/api/production/roast-profiles', { headers: this.getHeaders() });
    return res.data;
  }
  async createRoastProfile(data: Partial<RoastProfileRecord>): Promise<RoastProfileRecord> {
    const res = await safeFetch('/api/production/roast-profiles', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }
  async updateRoastProfile(id: string, data: Partial<RoastProfileRecord>): Promise<RoastProfileRecord> {
    const res = await safeFetch(`/api/production/roast-profiles/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }

  async getProductionDemand(): Promise<any[]> {
    const res = await safeFetch('/api/production/demand', { headers: this.getHeaders() });
    return res.data;
  }

  async createBatchFromDemand(data: any): Promise<any> {
    const res = await safeFetch('/api/production/batches/from-demand', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }

  async reserveBatchInputs(id: string, data: { greenLotId: string; reservedKg: number }): Promise<any> {
    const res = await safeFetch(`/api/production/batches/${id}/reserve`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }
  async startBatch(id: string): Promise<any> {
    const res = await safeFetch(`/api/production/batches/${id}/start`, { method: 'POST', headers: this.getHeaders() });
    return res.data;
  }
  async completeBatch(id: string, data: { finalWeight: number; packagedQty: number; costPerUnit: number }): Promise<any> {
    const res = await safeFetch(`/api/production/batches/${id}/complete`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }
  async cancelBatch(id: string): Promise<any> {
    const res = await safeFetch(`/api/production/batches/${id}/cancel`, { method: 'POST', headers: this.getHeaders() });
    return res.data;
  }
}
