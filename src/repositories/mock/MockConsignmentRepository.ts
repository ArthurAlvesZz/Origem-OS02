import { IConsignmentRepository, CreateConsignmentDTO, SettleConsignmentDTO } from '../interfaces/IConsignmentRepository';
import { Consignment } from '../../domain/types';
import { consignments, partners } from '../../data/mocks';
import { mockCustomers } from './MockCustomerRepository';

export class MockConsignmentRepository implements IConsignmentRepository {
  async getPartners(): Promise<any[]> {
    return mockCustomers.filter(c => c.type === 'partner' && c.status !== 'blocked' && c.status !== 'inactive');
  }

  async getConsignments(): Promise<Consignment[]> {
    return [...consignments];
  }

  async getConsignmentById(id: string): Promise<Consignment | undefined> {
    return consignments.find(c => c.id === id);
  }

  async createConsignment(data: CreateConsignmentDTO): Promise<Consignment> {
    const consignmentId = `CNS-${Date.now().toString().slice(-4)}`;
    const newConsignment: Consignment = {
      id: consignmentId,
      sentDate: new Date().toISOString(),
      dueDate: data.expectedReturnDate,
      partnerId: data.partnerId,
      partnerName: data.partnerName,
      status: 'Aberta',
      items: data.items.map(i => ({
         productId: i.productId,
         name: i.name,
         qtySent: i.sentQty,
         qtySold: 0,
         qtyReturned: 0,
         qtyLost: 0,
         unitCost: i.unitCost || 0,
         unitPrice: i.unitPrice
      })),
      expectedTotal: data.totalValue,
      soldTotal: 0
    };
    consignments.unshift(newConsignment);
    return newConsignment;
  }

  async settleConsignment(data: SettleConsignmentDTO): Promise<Consignment> {
    const idx = consignments.findIndex(c => c.id === data.consignmentId);
    if (idx === -1) throw new Error('Consignação não encontrada');

    const c = consignments[idx];
    const updatedItems = c.items.map(i => {
      const settled = data.items.find(s => s.productId === i.productId);
      if (settled) {
        return { 
          ...i, 
          qtySold: (i.qtySold || 0) + settled.soldQty, 
          qtyReturned: (i.qtyReturned || 0) + settled.returnedQty,
          qtyLost: (i.qtyLost || 0) + settled.lostQty
        };
      }
      return i;
    });

    const isFullySettled = updatedItems.every(i => (i.qtySold || 0) + (i.qtyReturned || 0) + (i.qtyLost || 0) >= i.qtySent);
    
    consignments[idx] = {
      ...c,
      status: isFullySettled ? 'Fechada' : 'Parcial',
      items: updatedItems as any,
      notes: (c as any).notes + (data.notes ? `\n[Acerto]: ${data.notes}` : '')
    };

    return consignments[idx];
  }
}
