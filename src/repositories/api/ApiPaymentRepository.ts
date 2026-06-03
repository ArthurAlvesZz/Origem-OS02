import { IPaymentRepository, PaymentIntentRecord, PaymentWebhookEventRecord, PaymentProviderConfigRecord } from '../interfaces/IPaymentRepository';
import { safeFetch } from './apiClient';

export class ApiPaymentRepository implements IPaymentRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getIntents(): Promise<PaymentIntentRecord[]> {
    const res = await safeFetch('/api/payments/intents', { headers: this.getHeaders() });
    return res.data;
  }

  async createIntent(data: Partial<PaymentIntentRecord>): Promise<PaymentIntentRecord> {
    const res = await safeFetch('/api/payments/intents', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async markAsPaidManual(id: string): Promise<PaymentIntentRecord> {
    const res = await safeFetch(`/api/payments/intents/${id}/mark-paid-manual`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.data;
  }

  async cancelIntent(id: string): Promise<void> {
    await safeFetch(`/api/payments/intents/${id}/cancel`, {
      method: 'POST',
      headers: this.getHeaders()
    });
  }

  async getWebhookEvents(): Promise<PaymentWebhookEventRecord[]> {
    const res = await safeFetch('/api/payments/webhook-events', { headers: this.getHeaders() });
    return res.data;
  }

  async getProviderConfig(): Promise<PaymentProviderConfigRecord | null> {
    const res = await safeFetch('/api/payments/provider-config', { headers: this.getHeaders() });
    return res.data;
  }

  async updateProviderConfig(data: Partial<PaymentProviderConfigRecord>): Promise<PaymentProviderConfigRecord> {
    const res = await safeFetch('/api/payments/provider-config', {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }
}
