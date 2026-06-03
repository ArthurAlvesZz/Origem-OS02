import { safeFetch } from './apiClient';
import { ICustomerRepository, CreateCustomerDTO, UpdateCustomerDTO } from '../interfaces/ICustomerRepository';
import { Customer } from '../../domain/types';

export class ApiCustomerRepository implements ICustomerRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getCustomers(): Promise<Customer[]> {
    const json = await safeFetch('/api/customers', { headers: this.getHeaders() });
    return json.data;
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const json = await safeFetch(`/api/customers/${id}`, { headers: this.getHeaders() });
    return json.data;
  }

  async createCustomer(data: CreateCustomerDTO): Promise<Customer> {
    const json = await safeFetch('/api/customers', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }

  async updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    const json = await safeFetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return json.data;
  }

  async deleteCustomer(id: string): Promise<void> {
    const res = await safeFetch(`/api/customers/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao excluir cliente');
    }
  }

  async getCustomerBalance(id: string) {
    const json = await safeFetch(`/api/customers/${id}/balance`, { headers: this.getHeaders() });
    return json.data;
  }

  async getCustomerActivity(id: string) {
    const json = await safeFetch(`/api/customers/${id}/activity`, { headers: this.getHeaders() });
    return json.data;
  }
}
