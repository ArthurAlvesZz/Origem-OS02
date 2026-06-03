import { products } from '../data/mocks';
import { Product } from './types';

export function calculateProductMargin(price: number, cost: number) {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export function createProduct(data: Omit<Product, 'id'>) {
  if (data.price < 0) throw new Error('Preço não pode ser negativo');
  if (data.cost < 0) throw new Error('Custo não pode ser negativo');
  
  const newProduct: Product = {
    ...data,
    id: `PROD-${Date.now().toString().slice(-4)}`
  };
  products.push(newProduct);
  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>) {
  if (data.price !== undefined && data.price < 0) throw new Error('Preço não pode ser negativo');
  if (data.cost !== undefined && data.cost < 0) throw new Error('Custo não pode ser negativo');

  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...data };
    return products[index];
  }
  throw new Error('Produto não encontrado');
}
