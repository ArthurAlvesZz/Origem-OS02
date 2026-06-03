export interface PaymentProviderConfigRecord {
  id: string;
  tenantId: string;
  provider: string;
  mode: string;
  enabled: boolean;
  publicLabel: string;
  metadataJson?: string;
}

export interface PaymentIntentRecord {
  id: string;
  tenantId: string;
  customerId?: string;
  orderId?: string;
  subscriptionRequestId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerIntentId?: string;
  checkoutUrl?: string;
  pixQrCode?: string;
  dueAt?: Date | string;
  createdAt: Date | string;
  paidAt?: Date | string;
}

export interface PaymentTransactionRecord {
  id: string;
  paymentIntentId: string;
  type: string;
  status: string;
  amount: number;
  createdAt: Date | string;
}

export interface PaymentWebhookEventRecord {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  processed: boolean;
  createdAt: Date | string;
  errorMessage?: string;
}

export interface IPaymentRepository {
  getIntents(): Promise<PaymentIntentRecord[]>;
  createIntent(data: Partial<PaymentIntentRecord>): Promise<PaymentIntentRecord>;
  markAsPaidManual(id: string): Promise<PaymentIntentRecord>;
  cancelIntent(id: string): Promise<void>;
  getWebhookEvents(): Promise<PaymentWebhookEventRecord[]>;
  getProviderConfig(): Promise<PaymentProviderConfigRecord | null>;
  updateProviderConfig(data: Partial<PaymentProviderConfigRecord>): Promise<PaymentProviderConfigRecord>;
}
