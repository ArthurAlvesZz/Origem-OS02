import { IProductRepository } from '../interfaces/IProductRepository';
import { Product } from '../../domain/types';
import { products } from '../../data/mocks';

export class MockProductRepository implements IProductRepository {
  async getProducts(): Promise<Product[]> {
    return [...products];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return products.find(p => p.id === id);
  }

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      id: Math.random().toString(36).substring(2, 9),
      ...data
    };
    products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Produto não encontrado');
    products[index] = { ...products[index], ...data };
    return products[index];
  }

  async deleteProduct(id: string): Promise<void> {
    const index = products.findIndex(p => p.id === id);
    if (index > -1) {
      products.splice(index, 1);
    }
  }
}
