import { IB2BCatalogRepository, B2BCatalogItemRecord } from '../interfaces/IB2BCatalogRepository';

export class MockB2BCatalogRepository implements IB2BCatalogRepository {
  private items: B2BCatalogItemRecord[] = [];

  constructor() {
    this.items.push({ id: '1', productId: 'p1', price: 80.0, moq: 10, leadTimeDays: 3, isVisible: true, product: { name: 'Especial Cerrado 1kg' } });
  }

  async getItems(): Promise<B2BCatalogItemRecord[]> { return this.items; }
  async createItem(data: Partial<B2BCatalogItemRecord>): Promise<B2BCatalogItemRecord> {
    const i = { ...data, id: Date.now().toString() } as B2BCatalogItemRecord;
    this.items.push(i); return i;
  }
  async updateItem(id: string, data: Partial<B2BCatalogItemRecord>): Promise<B2BCatalogItemRecord> {
    const i = this.items.findIndex(x => x.id === id); if(i===-1) throw new Error('Not found');
    this.items[i] = { ...this.items[i], ...data }; return this.items[i];
  }
}
