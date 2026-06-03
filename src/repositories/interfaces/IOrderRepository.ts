import { Order, OrderItem, OrderStatus } from '../../domain/types';

export interface CreateOrderDTO {
  customerId?: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  notes?: string;
  isConsignmentSettlement?: boolean;
}

export interface IOrderRepository {
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  getCustomers(): Promise<{id: string, name: string}[]>;
  createOrder(data: CreateOrderDTO): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
}
