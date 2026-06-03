import { ITraceabilityRepository, CreateTraceabilityDTO, UpdateTraceabilityDTO } from '../interfaces/ITraceabilityRepository';
import { PublicLotTrace } from '../../domain/types';

export class MockTraceabilityRepository implements ITraceabilityRepository {
  private traces: PublicLotTrace[] = [];

  constructor() {
    this.traces = [
      {
        id: 'trace-1',
        tenantId: 'tenant-1',
        qualityReviewId: 'qr-1',
        productionBatchId: 'batch-1',
        productId: 'prod-1',
        publicCode: 'COFCOF-A1B2',
        status: 'published',
        title: 'Cerrado Ouro - Lote A1B2',
        summary: 'Um café excepcional do Cerrado Mineiro, com notas de caramelo e chocolate.',
        publicScore: 86.5,
        publicDescriptorsJson: JSON.stringify(['Caramelo', 'Chocolate', 'Acidez Cítrica']),
        publicOriginJson: JSON.stringify({ region: 'Cerrado Mineiro', altitude: '1100m', farm: 'Fazenda Esperança' }),
        roastInfoJson: JSON.stringify({ roastDate: new Date().toISOString(), roastLevel: 'Média Clara' }),
        productInfoJson: JSON.stringify({ name: 'Cerrado Ouro', variety: 'Mundo Novo' }),
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }

  async getAll(): Promise<PublicLotTrace[]> {
    return [...this.traces];
  }

  async getById(id: string): Promise<PublicLotTrace | null> {
    const t = this.traces.find(t => t.id === id);
    return t ? { ...t } : null;
  }

  async getByPublicCode(publicCode: string): Promise<PublicLotTrace | null> {
    const t = this.traces.find(t => t.publicCode === publicCode && t.status === 'published');
    return t ? { ...t } : null;
  }

  async createFromQualityReview(data: CreateTraceabilityDTO): Promise<PublicLotTrace> {
    const newTrace: PublicLotTrace = {
      id: `trace-${Date.now()}`,
      tenantId: 'tenant-1',
      qualityReviewId: data.qualityReviewId,
      publicCode: `LT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'draft',
      title: data.title,
      summary: data.summary,
      publicDescriptorsJson: data.publicDescriptorsJson,
      publicOriginJson: data.publicOriginJson,
      roastInfoJson: data.roastInfoJson,
      productInfoJson: data.productInfoJson,
      publicScore: data.publicScore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.traces.push(newTrace);
    return { ...newTrace };
  }

  async update(id: string, data: UpdateTraceabilityDTO): Promise<PublicLotTrace> {
    const index = this.traces.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Traceability not found');
    this.traces[index] = { ...this.traces[index], ...data, updatedAt: new Date().toISOString() };
    return { ...this.traces[index] };
  }

  async publish(id: string): Promise<PublicLotTrace> {
    const index = this.traces.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Traceability not found');
    this.traces[index] = { 
      ...this.traces[index], 
      status: 'published', 
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { ...this.traces[index] };
  }

  async unpublish(id: string): Promise<PublicLotTrace> {
    const index = this.traces.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Traceability not found');
    this.traces[index] = { 
      ...this.traces[index], 
      status: 'unpublished', 
      unpublishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { ...this.traces[index] };
  }
}
