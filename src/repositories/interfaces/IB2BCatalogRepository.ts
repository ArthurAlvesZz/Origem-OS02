export interface B2BCatalogItemRecord {
  id: string;
  productId: string;
  price: number;
  moq: number;
  leadTimeDays: number;
  isVisible: boolean;
  product?: any;
}

export interface IB2BCatalogRepository {
  getItems(): Promise<B2BCatalogItemRecord[]>;
  createItem(data: Partial<B2BCatalogItemRecord>): Promise<B2BCatalogItemRecord>;
  updateItem(id: string, data: Partial<B2BCatalogItemRecord>): Promise<B2BCatalogItemRecord>;
}
