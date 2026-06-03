import { IStorefrontRepository, StorefrontProduct, StorefrontPlan, SubscriptionRequestData, SubscriptionRequestRecord, SubscriptionRecord } from '../interfaces/IStorefrontRepository';
import { safeFetch } from './apiClient';

export class ApiStorefrontRepository implements IStorefrontRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Public Endpoints
  async getStorefrontProducts(): Promise<StorefrontProduct[]> {
    const json = await safeFetch('/api/storefront/products', { headers: { 'Content-Type': 'application/json' }});
    return json.data;
  }

  async getStorefrontPlans(): Promise<StorefrontPlan[]> {
    const json = await safeFetch('/api/storefront/subscription-plans', { headers: { 'Content-Type': 'application/json' }});
    return json.data;
  }

  async createSubscriptionRequest(tenantId: string, data: SubscriptionRequestData): Promise<SubscriptionRequestRecord> {
    const json = await safeFetch('/api/storefront/subscription-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId })
    });
    return json.data;
  }

  // Admin Endpoints
  async getPlans(): Promise<StorefrontPlan[]> {
    const json = await safeFetch('/api/subscriptions/plans', { headers: this.getHeaders() });
    return json.data;
  }

  async createPlan(data: Partial<StorefrontPlan>): Promise<StorefrontPlan> {
    const json = await safeFetch('/api/subscriptions/plans', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }

  async updatePlan(id: string, data: Partial<StorefrontPlan>): Promise<StorefrontPlan> {
    const json = await safeFetch(`/api/subscriptions/plans/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }

  async getRequests(): Promise<SubscriptionRequestRecord[]> {
    const json = await safeFetch('/api/subscriptions/requests', { headers: this.getHeaders() });
    return json.data;
  }

  async updateRequestStatus(id: string, status: string): Promise<void> {
    await safeFetch(`/api/subscriptions/requests/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
  }

  async getSubscriptions(): Promise<SubscriptionRecord[]> {
    const json = await safeFetch('/api/subscriptions', { headers: this.getHeaders() });
    return json.data;
  }

  async updateSubscriptionStatus(id: string, status: string): Promise<void> {
    await safeFetch(`/api/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
  }
}
