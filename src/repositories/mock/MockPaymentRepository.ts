import { IPaymentRepository, PaymentIntentRecord, PaymentWebhookEventRecord, PaymentProviderConfigRecord } from '../interfaces/IPaymentRepository';

export class MockPaymentRepository implements IPaymentRepository {
  private intents: PaymentIntentRecord[] = [];
  private events: PaymentWebhookEventRecord[] = [];
  private config: PaymentProviderConfigRecord = {
    id: '1',
    tenantId: '1',
    provider: 'mock',
    mode: 'sandbox',
    enabled: true,
    publicLabel: 'Pagamento Simulado B2C'
  };

  async getIntents(): Promise<PaymentIntentRecord[]> {
    return this.intents;
  }

  async createIntent(data: Partial<PaymentIntentRecord>): Promise<PaymentIntentRecord> {
    const intent: PaymentIntentRecord = {
      ...data,
      id: Math.random().toString(),
      tenantId: '1',
      status: 'pending',
      provider: 'mock',
      amount: data.amount || 0,
      currency: data.currency || 'BRL',
      createdAt: new Date().toISOString()
    };
    this.intents.push(intent);
    return intent;
  }

  async markAsPaidManual(id: string): Promise<PaymentIntentRecord> {
    const intent = this.intents.find(i => i.id === id);
    if (!intent) throw new Error('Not found');
    intent.status = 'paid';
    intent.paidAt = new Date().toISOString();
    return intent;
  }

  async cancelIntent(id: string): Promise<void> {
    const intent = this.intents.find(i => i.id === id);
    if (!intent) throw new Error('Not found');
    intent.status = 'cancelled';
  }

  async getWebhookEvents(): Promise<PaymentWebhookEventRecord[]> {
    return this.events;
  }

  async getProviderConfig(): Promise<PaymentProviderConfigRecord | null> {
    return this.config;
  }

  async updateProviderConfig(data: Partial<PaymentProviderConfigRecord>): Promise<PaymentProviderConfigRecord> {
    this.config = { ...this.config, ...data };
    return this.config;
  }
}
