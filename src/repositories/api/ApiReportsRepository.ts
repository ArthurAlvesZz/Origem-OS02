import { IReportsRepository, ReportFilters } from '../interfaces/IReportsRepository';
import { GeneratedDocument } from '../../domain/types';
import { safeFetch } from './apiClient';

export class ApiReportsRepository implements IReportsRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private buildQuery(filters: ReportFilters) {
    const p = new URLSearchParams();
    if(filters.periodStart) p.append('periodStart', filters.periodStart);
    if(filters.periodEnd) p.append('periodEnd', filters.periodEnd);
    if(filters.customerId) p.append('customerId', filters.customerId);
    return p.toString();
  }

  async getSalesReports(filters: ReportFilters): Promise<any> {
    const qs = this.buildQuery(filters);
    const json = await safeFetch(`/api/reports/sales?${qs}`, { headers: this.getHeaders() });
    return json.data;
  }
  
  async getFinanceReports(filters: ReportFilters): Promise<any> {
    const qs = this.buildQuery(filters);
    const json = await safeFetch(`/api/reports/finance?${qs}`, { headers: this.getHeaders() });
    return json.data;
  }
  
  async getInventoryReports(filters: ReportFilters): Promise<any> {
    const qs = this.buildQuery(filters);
    const json = await safeFetch(`/api/reports/inventory?${qs}`, { headers: this.getHeaders() });
    return json.data;
  }
  
  async getDocuments(): Promise<GeneratedDocument[]> {
    const json = await safeFetch('/api/documents', { headers: this.getHeaders() });
    return json.data;
  }
  
  async generateDocument(data: Partial<GeneratedDocument>): Promise<GeneratedDocument> {
    const json = await safeFetch('/api/documents/generate', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }
  
  async voidDocument(id: string): Promise<GeneratedDocument> {
    const json = await safeFetch(`/api/documents/${id}/void`, { method: 'PATCH', headers: this.getHeaders() });
    return json.data;
  }
}
