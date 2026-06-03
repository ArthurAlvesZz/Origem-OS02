import { Consignment, ConsignmentStatus, Partner } from '../../domain/types';

export interface CreateConsignmentDTO {
  partnerId: string;
  partnerName: string;
  date: string;
  expectedReturnDate: string;
  items: { productId: string; name: string; sentQty: number; unitPrice: number; unitCost: number }[];
  notes?: string;
  totalValue: number;
}

export interface SettleConsignmentDTO {
  consignmentId: string;
  items: { productId: string; soldQty: number; returnedQty: number; lostQty: number; unitPrice: number; name: string; unitCost: number; }[];
  totalSold: number;
  paymentMethod: string;
  notes?: string;
  isPaid: boolean;
  date: string;
  status: string;
}

export interface IConsignmentRepository {
  getPartners(): Promise<Partner[]>;
  getConsignments(): Promise<Consignment[]>;
  getConsignmentById(id: string): Promise<Consignment | undefined>;
  createConsignment(data: CreateConsignmentDTO): Promise<Consignment>;
  settleConsignment(data: SettleConsignmentDTO): Promise<Consignment>;
}
