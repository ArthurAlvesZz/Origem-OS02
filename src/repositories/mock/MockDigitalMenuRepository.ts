import { IDigitalMenuRepository } from '../interfaces/IDigitalMenuRepository';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuItem, DigitalMenuOrderPayload } from '../../domain/digitalMenu';
import { Order } from '../../domain/types';

let mockConfig: DigitalMenuConfig | null = {
  id: 'cfg-1',
  tenantId: 'tenant-1',
  slug: 'demo',
  publicName: 'Café Origem',
  description: 'Os melhores cafés especiais da região, direto da fazenda para sua xícara.',
  isOpen: true,
  acceptsPickup: true,
  acceptsDelivery: true,
  deliveryFee: 5.0,
  minimumOrder: 15.0,
  estimatedPrepMinutes: 20,
  paymentMethodsJson: JSON.stringify(['pix_manual', 'money', 'card_on_delivery']),
  platformFeeType: 'none',
  platformFeeValue: 0
};

let mockCategories: DigitalMenuCategory[] = [
  { id: 'cat-1', tenantId: 'tenant-1', name: 'Cafés Especiais', order: 1, active: true },
  { id: 'cat-2', tenantId: 'tenant-1', name: 'Acompanhamentos', order: 2, active: true },
];

let mockItems: DigitalMenuItem[] = [
  {
    id: 'item-1', tenantId: 'tenant-1', categoryId: 'cat-1', name: 'Espresso Duplo',
    description: 'Blend da casa, notas de chocolate e caramelo.',
    price: 8.0, active: true, featured: true, stockLinked: false
  },
  {
    id: 'item-2', tenantId: 'tenant-1', categoryId: 'cat-1', name: 'Cappuccino Italiano',
    description: 'Espresso, leite vaporizado e uma fina camada de cacau.',
    price: 12.0, active: true, featured: false, stockLinked: false
  },
  {
    id: 'item-3', tenantId: 'tenant-1', categoryId: 'cat-2', name: 'Pão de Queijo Tradicional',
    description: 'Porção com 5 unidades fresquinhas.',
    price: 10.0, active: true, featured: true, stockLinked: false
  }
];

let mockOrders: Order[] = [];

export class MockDigitalMenuRepository implements IDigitalMenuRepository {
  async getConfig(): Promise<DigitalMenuConfig | null> {
    return mockConfig;
  }

  async updateConfig(data: Partial<DigitalMenuConfig>): Promise<DigitalMenuConfig> {
    if (!mockConfig) {
      mockConfig = { ...data, id: 'cfg-new', tenantId: 'tenant-1', slug: data.slug || 'demo', publicName: data.publicName || 'Novo', isOpen: true, acceptsPickup: true, acceptsDelivery: true, deliveryFee: 0, minimumOrder: 0, estimatedPrepMinutes: 0, paymentMethodsJson: '[]', platformFeeType: 'none', platformFeeValue: 0 } as DigitalMenuConfig;
    } else {
      mockConfig = { ...mockConfig, ...data };
    }
    return mockConfig;
  }

  async getCategories(): Promise<DigitalMenuCategory[]> {
    return [...mockCategories];
  }

  async createCategory(data: Partial<DigitalMenuCategory>): Promise<DigitalMenuCategory> {
    const newCat = { ...data, id: `cat-${Date.now()}`, tenantId: 'tenant-1', active: true, order: mockCategories.length + 1 } as DigitalMenuCategory;
    mockCategories.push(newCat);
    return newCat;
  }

  async updateCategory(id: string, data: Partial<DigitalMenuCategory>): Promise<DigitalMenuCategory> {
    const idx = mockCategories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    mockCategories[idx] = { ...mockCategories[idx], ...data };
    return mockCategories[idx];
  }

  async deleteCategory(id: string): Promise<void> {
    mockCategories = mockCategories.filter(c => c.id !== id);
  }

  async getItems(categoryId?: string): Promise<DigitalMenuItem[]> {
    let res = mockItems;
    if (categoryId) res = res.filter(i => i.categoryId === categoryId);
    return [...res];
  }

  async createItem(data: Partial<DigitalMenuItem>): Promise<DigitalMenuItem> {
    const newItem = { ...data, id: `item-${Date.now()}`, tenantId: 'tenant-1', active: true, featured: false, stockLinked: false, price: data.price || 0 } as DigitalMenuItem;
    mockItems.push(newItem);
    return newItem;
  }

  async updateItem(id: string, data: Partial<DigitalMenuItem>): Promise<DigitalMenuItem> {
    const idx = mockItems.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Item not found');
    mockItems[idx] = { ...mockItems[idx], ...data };
    return mockItems[idx];
  }

  async deleteItem(id: string): Promise<void> {
    mockItems = mockItems.filter(i => i.id !== id);
  }

  async getOrders(): Promise<Order[]> {
    return [...mockOrders];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const idx = mockOrders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    mockOrders[idx].status = status;
    return mockOrders[idx];
  }

  // Public Endpoints
  async getPublicMenu(slug: string): Promise<{ config: DigitalMenuConfig; categories: DigitalMenuCategory[] } | null> {
    if (mockConfig?.slug !== slug && slug !== 'demo') return null;
    
    const configToReturn = mockConfig || { id: 'cfg-new', tenantId: 'tenant-1', slug, publicName: 'Mock', isOpen: true, acceptsPickup: true, acceptsDelivery: true, deliveryFee: 0, minimumOrder: 0, estimatedPrepMinutes: 0, paymentMethodsJson: '[]', platformFeeType: 'none', platformFeeValue: 0 } as DigitalMenuConfig;
    
    // Attach items to categories
    const categoriesWithItems = mockCategories.map(c => ({
      ...c,
      items: mockItems.filter(i => i.categoryId === c.id && i.active)
    }));

    return { config: configToReturn, categories: categoriesWithItems };
  }

  async createPublicOrder(slug: string, payload: DigitalMenuOrderPayload): Promise<{ orderId: string; trackingNumber?: string; paymentIntentId?: string; checkoutUrl?: string; pixQrCode?: string; total: number }> {
    let total = 0;
    payload.items.forEach(reqItem => {
      const dbItem = mockItems.find(i => i.id === reqItem.itemId);
      if (dbItem) total += dbItem.price * reqItem.qty;
    });

    if (payload.deliveryMethod === 'delivery' && mockConfig?.deliveryFee) {
      total += mockConfig.deliveryFee;
    }

    const trackingNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newOrder: Order = {
      id: `MENU-ORD-${Date.now().toString().slice(-4)}`,
      trackingNumber,
      date: new Date().toISOString(),
      customer: payload.customerName,
      total,
      status: 'received',
      method: payload.paymentMethod,
      items: payload.items.reduce((acc, curr) => acc + curr.qty, 0),
      channel: 'digital_menu'
    } as any;

    mockOrders.unshift(newOrder);

    let pixQrCode = undefined;
    let checkoutUrl = undefined;
    if (payload.paymentMethod === 'pix_manual') {
      pixQrCode = mockConfig?.pixKeyManual || '00020126330014BR.GOV.BCB.PIX... (mock)';
    } else if (payload.paymentMethod === 'mercadopago') {
      checkoutUrl = `/menu/${slug}?checkout=success&order=${trackingNumber}`;
    }

    return { orderId: newOrder.id, trackingNumber, total, pixQrCode, checkoutUrl };
  }

  async getPublicOrder(slug: string, id: string): Promise<Order | null> {
    const order = mockOrders.find(o => o.id === id || (o as any).trackingNumber === id);
    return order || null;
  }
}
