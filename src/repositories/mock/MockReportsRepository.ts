import { IReportsRepository, ReportFilters } from '../interfaces/IReportsRepository';
import { GeneratedDocument } from '../../domain/types';
import { orders } from '../../data/mocks';

let mockDocs: GeneratedDocument[] = [];

export class MockReportsRepository implements IReportsRepository {
  async getSalesReports(filters: ReportFilters): Promise<any> {
    const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
    return {
       totalSales,
       ticketMedio: orders.length ? totalSales / orders.length : 0,
       orders: [...orders]
    };
  }

  async getFinanceReports(filters: ReportFilters): Promise<any> {
    return { receitas: 50000, despesas: 20000, saldo: 30000, transactions: [] };
  }

  async getInventoryReports(filters: ReportFilters): Promise<any> {
    return [];
  }

  async getDocuments(): Promise<GeneratedDocument[]> {
    return [...mockDocs];
  }

  async generateDocument(data: Partial<GeneratedDocument>): Promise<GeneratedDocument> {
    const doc: GeneratedDocument = {
       id: Math.random().toString(36).substring(7),
       type: data.type || 'report',
       status: 'active',
       sequenceNumber: mockDocs.length + 1,
       referenceType: data.referenceType,
       referenceId: data.referenceId,
       customerId: data.customerId,
       periodStart: data.periodStart,
       periodEnd: data.periodEnd,
       title: data.title || 'Documento',
       snapshotJson: data.snapshotJson,
       generatedByUserId: 'mock-user',
       generatedAt: new Date().toISOString()
    };
    mockDocs.push(doc);
    return doc;
  }

  async voidDocument(id: string): Promise<GeneratedDocument> {
    const d = mockDocs.find(x => x.id === id);
    if(d) {
       d.status = 'voided';
       d.voidedAt = new Date().toISOString();
    }
    return d as GeneratedDocument;
  }
}
