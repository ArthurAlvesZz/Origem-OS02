import { IOrderRepository, CreateOrderDTO } from '../interfaces/IOrderRepository';
import { Order, OrderStatus } from '../../domain/types';
import { orders, customers } from '../../data/mocks';
import { mockCustomers } from './MockCustomerRepository';

export class MockOrderRepository implements IOrderRepository {
  async getCustomers(): Promise<{ id: string; name: string; }[]> {
    return mockCustomers.filter(c => c.status !== 'blocked' && c.status !== 'inactive').map(c => ({ id: c.id, name: c.name }));
  }

  async getOrders(): Promise<Order[]> {
    return [...orders];
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return orders.find(o => o.id === id);
  }

  async createOrder(data: CreateOrderDTO): Promise<Order> {
    const orderId = `ORD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString(),
      customer: data.customerName || 'Consumidor Final',
      total: data.total,
      status: data.status,
      method: data.paymentMethod,
      items: data.items.reduce((acc, curr) => acc + curr.qty, 0)
    };
    
    orders.unshift(newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    orders[idx] = { ...orders[idx], status };
    return orders[idx];
  }
}
