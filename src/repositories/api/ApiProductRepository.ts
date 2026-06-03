import { safeFetch } from './apiClient';
import { IProductRepository } from '../interfaces/IProductRepository';
import { Product } from '../../domain/types';

export class ApiProductRepository implements IProductRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getProducts(): Promise<Product[]> {
    const json = await safeFetch('/api/products', { headers: this.getHeaders() });
    return json.data.map(this.mapToDomain);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const json = await safeFetch(`/api/products/${id}`, { headers: this.getHeaders() });
    return this.mapToDomain(json.data);
  }

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    const json = await safeFetch('/api/products', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.mapToDomain(json.data);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const json = await safeFetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.mapToDomain(json.data);
  }

  async deleteProduct(id: string): Promise<void> {
    const res = await safeFetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao deletar produto');
  }

  private mapToDomain(apiProduct: any): Product {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      category: apiProduct.category as any,
      sku: apiProduct.sku || '',
      unit: apiProduct.unit as any,
      cost: apiProduct.unitCost || 0,
      price: apiProduct.unitPrice || 0,
      active: apiProduct.active !== false,
      minStock: apiProduct.minStock || 0,
      stock: 0,
      score: 0
    };
  }
}
