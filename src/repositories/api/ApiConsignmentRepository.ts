import { safeFetch } from './apiClient';
import { IConsignmentRepository, CreateConsignmentDTO, SettleConsignmentDTO } from '../interfaces/IConsignmentRepository';
import { Consignment, Partner, ConsignmentStatus } from '../../domain/types';

export class ApiConsignmentRepository implements IConsignmentRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getPartners(): Promise<Partner[]> {
    const json = await safeFetch('/api/partners', { headers: this.getHeaders() });
    return json.data;
  }

  private mapToDomain(c: any): Consignment {
    return {
      id: c.id,
      partnerId: c.partnerId,
      partnerName: c.partnerName,
      sentDate: c.date,
      dueDate: c.expectedReturnDate || c.date,
      status: this.mapStatus(c.status),
      items: c.items?.map((i: any) => ({
        productId: i.productId,
        name: i.name,
        qtySent: i.sentQty,
        qtySold: i.soldQty,
        qtyReturned: i.returnedQty,
        qtyLost: i.lostQty,
        unitPrice: i.unitPrice,
        unitCost: i.unitCost
      })) || [],
      expectedTotal: c.totalValue,
      soldTotal: c.items?.reduce((sum: number, i: any) => sum + (i.soldQty * i.unitPrice), 0) || 0
    };
  }

  private mapStatus(status: string): ConsignmentStatus {
    switch (status) {
      case 'open': return 'Aberta';
      case 'partially_settled': return 'Parcial';
      case 'closed': return 'Fechada';
      case 'cancelled': return 'Cancelada' as any;
      default: return 'Aberta';
    }
  }

  async getConsignments(): Promise<Consignment[]> {
    const json = await safeFetch('/api/consignments', { headers: this.getHeaders() });
    return json.data.map((c: any) => this.mapToDomain(c));
  }

  async getConsignmentById(id: string): Promise<Consignment | undefined> {
    const json = await safeFetch(`/api/consignments/${id}`, { headers: this.getHeaders() });
    return this.mapToDomain(json.data);
  }

  async createConsignment(data: CreateConsignmentDTO): Promise<Consignment> {
    const json = await safeFetch('/api/consignments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.mapToDomain(json.data);
  }

  async settleConsignment(data: SettleConsignmentDTO): Promise<Consignment> {
    const json = await safeFetch(`/api/consignments/${data.consignmentId}/settle`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.mapToDomain(json.data);
  }
}
