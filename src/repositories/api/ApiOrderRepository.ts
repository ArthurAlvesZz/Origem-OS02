import { safeFetch } from './apiClient';
import { IOrderRepository } from '../interfaces/IOrderRepository';
import { Order } from '../../domain/types';

export class ApiOrderRepository implements IOrderRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getOrders(): Promise<Order[]> {
    const json = await safeFetch('/api/orders', { headers: this.getHeaders() });
    return json.data;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const json = await safeFetch(`/api/orders/${id}`, { headers: this.getHeaders() });
    return json.data;
  }

  async getCustomers(): Promise<any[]> {
    return []; // Future implementation
  }

  async createOrder(data: any): Promise<Order> {
    const json = await safeFetch('/api/orders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }

  async updateOrderStatus(id: string, status: any): Promise<Order> {
    if (status === 'cancelled' || status === 'Cancelado') {
      const json = await safeFetch(`/api/orders/${id}/cancel`, {
        method: 'PATCH',
        headers: this.getHeaders(),
      });
    return json.data;
    }
    throw new Error('Not implemented: ' + status);
  }
}
