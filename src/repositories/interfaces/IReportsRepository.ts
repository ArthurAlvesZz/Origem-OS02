import { GeneratedDocument } from '../../domain/types';

export interface ReportFilters {
  periodStart?: string;
  periodEnd?: string;
  customerId?: string;
}

export interface IReportsRepository {
  getSalesReports(filters: ReportFilters): Promise<any>;
  getFinanceReports(filters: ReportFilters): Promise<any>;
  getInventoryReports(filters: ReportFilters): Promise<any>;
  
  getDocuments(): Promise<GeneratedDocument[]>;
  generateDocument(data: Partial<GeneratedDocument>): Promise<GeneratedDocument>;
  voidDocument(id: string): Promise<GeneratedDocument>;
}
