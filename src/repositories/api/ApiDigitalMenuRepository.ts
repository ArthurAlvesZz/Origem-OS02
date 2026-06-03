import { IDigitalMenuRepository } from '../interfaces/IDigitalMenuRepository';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuItem, DigitalMenuOrderPayload } from '../../domain/digitalMenu';
import { Order } from '../../domain/types';
import { safeFetch } from './apiClient';

export class ApiDigitalMenuRepository implements IDigitalMenuRepository {
  async getConfig(): Promise<DigitalMenuConfig | null> {
    return safeFetch('/api/digital-menu/config');
  }

  async updateConfig(data: Partial<DigitalMenuConfig>): Promise<DigitalMenuConfig> {
    return safeFetch('/api/digital-menu/config', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCategories(): Promise<DigitalMenuCategory[]> {
    return safeFetch('/api/digital-menu/categories');
  }

  async createCategory(data: Partial<DigitalMenuCategory>): Promise<DigitalMenuCategory> {
    return safeFetch('/api/digital-menu/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: Partial<DigitalMenuCategory>): Promise<DigitalMenuCategory> {
    return safeFetch(`/api/digital-menu/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    return safeFetch(`/api/digital-menu/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async getItems(categoryId?: string): Promise<DigitalMenuItem[]> {
    const url = categoryId ? `/api/digital-menu/items?categoryId=${categoryId}` : '/api/digital-menu/items';
    return safeFetch(url);
  }

  async createItem(data: Partial<DigitalMenuItem>): Promise<DigitalMenuItem> {
    return safeFetch('/api/digital-menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: string, data: Partial<DigitalMenuItem>): Promise<DigitalMenuItem> {
    return safeFetch(`/api/digital-menu/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: string): Promise<void> {
    return safeFetch(`/api/digital-menu/items/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrders(): Promise<Order[]> {
    return safeFetch('/api/digital-menu/orders');
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return safeFetch(`/api/digital-menu/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Public Endpoints
  async getPublicMenu(slug: string): Promise<{ config: DigitalMenuConfig; categories: DigitalMenuCategory[] } | null> {
    try {
      return await safeFetch(`/api/public/menu/${slug}`);
    } catch (e) {
      return null;
    }
  }

  async createPublicOrder(slug: string, payload: DigitalMenuOrderPayload): Promise<{ orderId: string; paymentIntentId?: string; checkoutUrl?: string; pixQrCode?: string; total: number }> {
    return safeFetch(`/api/public/menu/${slug}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  
  async getPublicOrder(slug: string, id: string): Promise<Order | null> {
    try {
      return await safeFetch(`/api/public/menu/${slug}/orders/${id}`);
    } catch(e) {
      return null;
    }
  }
}
