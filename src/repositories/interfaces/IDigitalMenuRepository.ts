import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuItem, DigitalMenuOrderPayload } from '../../domain/digitalMenu';
import { Order } from '../../domain/types';

export interface IDigitalMenuRepository {
  // Admin Endpoints
  getConfig(): Promise<DigitalMenuConfig | null>;
  updateConfig(data: Partial<DigitalMenuConfig>): Promise<DigitalMenuConfig>;
  
  getCategories(): Promise<DigitalMenuCategory[]>;
  createCategory(data: Partial<DigitalMenuCategory>): Promise<DigitalMenuCategory>;
  updateCategory(id: string, data: Partial<DigitalMenuCategory>): Promise<DigitalMenuCategory>;
  deleteCategory(id: string): Promise<void>;

  getItems(categoryId?: string): Promise<DigitalMenuItem[]>;
  createItem(data: Partial<DigitalMenuItem>): Promise<DigitalMenuItem>;
  updateItem(id: string, data: Partial<DigitalMenuItem>): Promise<DigitalMenuItem>;
  deleteItem(id: string): Promise<void>;

  getOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Public Endpoints (no auth required in API)
  getPublicMenu(slug: string): Promise<{
    config: DigitalMenuConfig;
    categories: DigitalMenuCategory[];
  } | null>;
  createPublicOrder(slug: string, payload: DigitalMenuOrderPayload): Promise<{ orderId: string; trackingNumber?: string; paymentIntentId?: string; checkoutUrl?: string; pixQrCode?: string; total: number }>;
  getPublicOrder(slug: string, id: string): Promise<Order | null>;
}
