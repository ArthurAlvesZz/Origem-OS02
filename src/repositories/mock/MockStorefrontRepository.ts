import { IStorefrontRepository, StorefrontProduct, StorefrontPlan, SubscriptionRequestData, SubscriptionRequestRecord, SubscriptionRecord } from '../interfaces/IStorefrontRepository';

export class MockStorefrontRepository implements IStorefrontRepository {
  private products: StorefrontProduct[] = [
    { id: '1', name: 'Catuaí Amarelo', category: 'Grão', unitPrice: 65, description: 'Cerrado Mineiro - 86 pontos', featured: true },
    { id: '2', name: 'Bourbon Amarelo', category: 'Grão', unitPrice: 85, description: 'Alta Mogiana - 88 pontos' }
  ];

  private plans: StorefrontPlan[] = [
    {
      id: '1',
      name: 'Curadoria Mensal',
      description: 'Receba nossos melhores grãos em casa',
      frequency: 'monthly',
      packageCount: 2,
      weight: 250,
      price: 110,
      active: true,
      featured: true
    },
    {
      id: '2',
      name: 'Aventureiro',
      description: 'Lotes exóticos semanais',
      frequency: 'weekly',
      packageCount: 1,
      weight: 250,
      price: 240,
      active: true,
      featured: false
    }
  ];

  private requests: SubscriptionRequestRecord[] = [
    {
      id: 'REQ-01',
      planId: '1',
      customerName: 'Aline Oliveira',
      customerEmail: 'aline@example.com',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ];

  private subscriptions: SubscriptionRecord[] = [
    {
      id: 'SUB-01',
      planId: '1',
      planName: 'Curadoria Mensal',
      customerId: 'CUST-01',
      customerName: 'Carlos Mendonça',
      status: 'active',
      startedAt: new Date().toISOString(),
      nextBillingAt: new Date(Date.now() + 30 * 86400000).toISOString()
    }
  ];

  async getStorefrontProducts(): Promise<StorefrontProduct[]> {
    return this.products;
  }

  async getStorefrontPlans(): Promise<StorefrontPlan[]> {
    return this.plans.filter(p => p.active);
  }

  async createSubscriptionRequest(tenantId: string, data: SubscriptionRequestData): Promise<SubscriptionRequestRecord> {
    const record: SubscriptionRequestRecord = {
      ...data,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.requests.push(record);
    return record;
  }

  async getPlans(): Promise<StorefrontPlan[]> {
    return this.plans;
  }

  async createPlan(data: Partial<StorefrontPlan>): Promise<StorefrontPlan> {
    const plan = {
      ...data,
      id: Date.now().toString(),
      active: true,
    } as StorefrontPlan;
    this.plans.push(plan);
    return plan;
  }

  async updatePlan(id: string, data: Partial<StorefrontPlan>): Promise<StorefrontPlan> {
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx > -1) {
      this.plans[idx] = { ...this.plans[idx], ...data };
      return this.plans[idx];
    }
    throw new Error('Not found');
  }

  async getRequests(): Promise<SubscriptionRequestRecord[]> {
    return this.requests;
  }

  async updateRequestStatus(id: string, status: string): Promise<void> {
    const req = this.requests.find(r => r.id === id);
    if (req) req.status = status;
  }

  async getSubscriptions(): Promise<SubscriptionRecord[]> {
    return this.subscriptions;
  }

  async updateSubscriptionStatus(id: string, status: string): Promise<void> {
    const sub = this.subscriptions.find(s => s.id === id);
    if (sub) sub.status = status;
  }
}
