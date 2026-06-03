import { IB2BCatalogRepository, B2BCatalogItemRecord } from '../interfaces/IB2BCatalogRepository';
import { safeFetch } from './apiClient';

export class ApiB2BCatalogRepository implements IB2BCatalogRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getItems(): Promise<B2BCatalogItemRecord[]> {
    const res = await safeFetch('/api/b2b/catalog', { headers: this.getHeaders() });
    return res.data;
  }
  async createItem(data: Partial<B2BCatalogItemRecord>): Promise<B2BCatalogItemRecord> {
    const res = await safeFetch('/api/b2b/catalog/items', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }
  async updateItem(id: string, data: Partial<B2BCatalogItemRecord>): Promise<B2BCatalogItemRecord> {
    const res = await safeFetch(`/api/b2b/catalog/items/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }
}
