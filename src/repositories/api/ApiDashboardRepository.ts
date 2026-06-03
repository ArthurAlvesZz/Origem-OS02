import { IDashboardRepository } from '../interfaces/IDashboardRepository';
import { DashboardSummary, DashboardAlert, DashboardActivity } from '../../domain/types';
import { safeFetch } from './apiClient';

export class ApiDashboardRepository implements IDashboardRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getSummary(): Promise<DashboardSummary> {
    const json = await safeFetch('/api/dashboard/summary', { headers: this.getHeaders() });
    return json.data;
  }

  async getAlerts(): Promise<DashboardAlert[]> {
    const json = await safeFetch('/api/dashboard/alerts', { headers: this.getHeaders() });
    return json.data;
  }

  async getRecentActivity(): Promise<DashboardActivity[]> {
    const json = await safeFetch('/api/dashboard/recent-activity', { headers: this.getHeaders() });
    return json.data;
  }
}
