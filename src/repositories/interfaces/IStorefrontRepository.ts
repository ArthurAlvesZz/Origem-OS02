export interface StorefrontProduct {
  id: string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  featured?: boolean;
}

export interface StorefrontPlan {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  packageCount: number;
  weight?: number;
  price: number;
  active: boolean;
  featured: boolean;
  productId?: string;
}

export interface SubscriptionRequestData {
  planId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: string;
  notes?: string;
}

export interface SubscriptionRequestRecord extends SubscriptionRequestData {
  id: string;
  status: string;
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  planId: string;
  planName: string;
  customerId: string;
  customerName: string;
  status: string;
  startedAt: string;
  nextBillingAt?: string;
}

export interface IStorefrontRepository {
  // Public
  getStorefrontProducts(): Promise<StorefrontProduct[]>;
  getStorefrontPlans(): Promise<StorefrontPlan[]>;
  createSubscriptionRequest(tenantId: string, data: SubscriptionRequestData): Promise<SubscriptionRequestRecord>;

  // Admin
  getPlans(): Promise<StorefrontPlan[]>;
  createPlan(data: Partial<StorefrontPlan>): Promise<StorefrontPlan>;
  updatePlan(id: string, data: Partial<StorefrontPlan>): Promise<StorefrontPlan>;
  
  getRequests(): Promise<SubscriptionRequestRecord[]>;
  updateRequestStatus(id: string, status: string): Promise<void>;

  getSubscriptions(): Promise<SubscriptionRecord[]>;
  updateSubscriptionStatus(id: string, status: string): Promise<void>;
}
