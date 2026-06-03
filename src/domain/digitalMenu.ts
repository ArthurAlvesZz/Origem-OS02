export interface DigitalMenuConfig {
  id: string;
  tenantId: string;
  slug: string;
  publicName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  whatsapp?: string | null;
  isOpen: boolean;
  acceptsPickup: boolean;
  acceptsDelivery: boolean;
  deliveryFee: number;
  minimumOrder: number;
  estimatedPrepMinutes: number;
  paymentMethodsJson: string[] | string | null;
  openingHoursJson?: any;
  platformFeeType: string;
  platformFeeValue: number;
  paymentProvider?: string;
  pixKeyManual?: string | null;
}

export interface DigitalMenuCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  order: number;
  active: boolean;
  items?: DigitalMenuItem[];
}

export interface DigitalMenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  productId?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  active: boolean;
  featured: boolean;
  preparationMinutes?: number | null;
  stockLinked: boolean;
}

export interface DigitalMenuOrderPayload {
  customerName: string;
  customerPhone?: string;
  customerDocument?: string;
  deliveryMethod: 'pickup' | 'delivery';
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  paymentMethod: string;
  notes?: string;
  items: {
    itemId: string; // DigitalMenuItem ID
    qty: number;
    notes?: string;
  }[];
}
