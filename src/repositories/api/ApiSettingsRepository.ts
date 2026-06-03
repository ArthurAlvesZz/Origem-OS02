import { safeFetch } from './apiClient';
import { ISettingsRepository } from '../interfaces/ISettingsRepository';
import { TenantProfile, Branch, BusinessRules, ProductionRules, ModuleFlags } from '../../domain/types';

export class ApiSettingsRepository implements ISettingsRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getProfile(): Promise<TenantProfile> {
    const json = await safeFetch('/api/settings/profile', { headers: this.getHeaders() });
    return json.data;
  }
  async updateProfile(data: Partial<TenantProfile>): Promise<TenantProfile> {
    const json = await safeFetch('/api/settings/profile', { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }

  async getBranches(): Promise<Branch[]> {
    const json = await safeFetch('/api/settings/branches', { headers: this.getHeaders() });
    return json.data;
  }
  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const json = await safeFetch('/api/settings/branches', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }
  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const json = await safeFetch(`/api/settings/branches/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }
  async deleteBranch(id: string): Promise<void> {
    const res = await safeFetch(`/api/settings/branches/${id}`, { method: 'DELETE', headers: this.getHeaders() });
    if (!res.ok) throw new Error('Falha ao deletar filial');
  }

  async getBusinessRules(): Promise<BusinessRules> {
    const json = await safeFetch('/api/settings/business-rules', { headers: this.getHeaders() });
    return json.data;
  }
  async updateBusinessRules(data: Partial<BusinessRules>): Promise<BusinessRules> {
    const json = await safeFetch('/api/settings/business-rules', { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }

  async getProductionRules(): Promise<ProductionRules> {
    const json = await safeFetch('/api/settings/production-rules', { headers: this.getHeaders() });
    return json.data;
  }
  async updateProductionRules(data: Partial<ProductionRules>): Promise<ProductionRules> {
    const json = await safeFetch('/api/settings/production-rules', { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }

  async getModuleFlags(): Promise<ModuleFlags> {
    const json = await safeFetch('/api/settings/modules', { headers: this.getHeaders() });
    return json.data;
  }
  async updateModuleFlags(data: Partial<ModuleFlags>): Promise<ModuleFlags> {
    const json = await safeFetch('/api/settings/modules', { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }
}
