import { ITraceabilityRepository, CreateTraceabilityDTO, UpdateTraceabilityDTO } from '../interfaces/ITraceabilityRepository';
import { PublicLotTrace } from '../../domain/types';
import { safeFetch } from './apiClient';

export class ApiTraceabilityRepository implements ITraceabilityRepository {
  async getAll(): Promise<PublicLotTrace[]> {
    return safeFetch('/api/traceability');
  }

  async getById(id: string): Promise<PublicLotTrace | null> {
    return safeFetch(`/api/traceability/${id}`);
  }

  async getByPublicCode(publicCode: string): Promise<PublicLotTrace | null> {
    return safeFetch(`/api/public/trace/${publicCode}`);
  }

  async createFromQualityReview(data: CreateTraceabilityDTO): Promise<PublicLotTrace> {
    return safeFetch(`/api/traceability/from-quality/${data.qualityReviewId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateTraceabilityDTO): Promise<PublicLotTrace> {
    return safeFetch(`/api/traceability/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publish(id: string): Promise<PublicLotTrace> {
    return safeFetch(`/api/traceability/${id}/publish`, { method: 'POST' });
  }

  async unpublish(id: string): Promise<PublicLotTrace> {
    return safeFetch(`/api/traceability/${id}/unpublish`, { method: 'POST' });
  }
}
