import { IQualityRepository, QualityReviewRecord, SensoryDescriptorRecord, QualityDefectRecord } from '../interfaces/IQualityRepository';
import { safeFetch } from './apiClient';

export class ApiQualityRepository implements IQualityRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getReviews(): Promise<QualityReviewRecord[]> {
    const res = await safeFetch('/api/quality/reviews', { headers: this.getHeaders() });
    return res.data;
  }

  async createReview(data: Partial<QualityReviewRecord>): Promise<QualityReviewRecord> {
    const res = await safeFetch('/api/quality/reviews', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }

  async updateReview(id: string, data: Partial<QualityReviewRecord>): Promise<QualityReviewRecord> {
    const res = await safeFetch(`/api/quality/reviews/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return res.data;
  }

  async approveReview(id: string, notes?: string): Promise<QualityReviewRecord> {
    const res = await safeFetch(`/api/quality/reviews/${id}/approve`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ notes }) });
    return res.data;
  }

  async rejectReview(id: string, notes?: string): Promise<QualityReviewRecord> {
    const res = await safeFetch(`/api/quality/reviews/${id}/reject`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ notes }) });
    return res.data;
  }

  async getDescriptors(): Promise<SensoryDescriptorRecord[]> {
    const res = await safeFetch('/api/quality/descriptors', { headers: this.getHeaders() });
    return res.data;
  }

  async getDefects(): Promise<QualityDefectRecord[]> {
    const res = await safeFetch('/api/quality/defects', { headers: this.getHeaders() });
    return res.data;
  }
}
