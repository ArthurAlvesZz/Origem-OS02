import { IQualityRepository, QualityReviewRecord, SensoryDescriptorRecord, QualityDefectRecord } from '../interfaces/IQualityRepository';

export class MockQualityRepository implements IQualityRepository {
  private reviews: QualityReviewRecord[] = [
    {
      id: 'rev-01',
      productionBatchId: 'b-01',
      productId: 'prod-01',
      status: 'pending_review',
      createdAt: new Date().toISOString()
    }
  ];

  private descriptors: SensoryDescriptorRecord[] = [
    { id: 'desc-01', name: 'Chocolate Amargo', category: 'flavor' },
    { id: 'desc-02', name: 'Caramelo', category: 'sweetness' },
  ];

  private defects: QualityDefectRecord[] = [
    { id: 'def-01', name: 'Brocado', severity: 'high' }
  ];

  async getReviews(): Promise<QualityReviewRecord[]> {
    return this.reviews;
  }

  async createReview(data: Partial<QualityReviewRecord>): Promise<QualityReviewRecord> {
    const rev = { id: `rev-${Date.now()}`, createdAt: new Date().toISOString(), status: 'pending_review', ...data } as QualityReviewRecord;
    this.reviews.push(rev);
    return rev;
  }

  async updateReview(id: string, data: Partial<QualityReviewRecord>): Promise<QualityReviewRecord> {
    const idx = this.reviews.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.reviews[idx] = { ...this.reviews[idx], ...data };
      return this.reviews[idx];
    }
    throw new Error('Review not found');
  }

  async approveReview(id: string, notes?: string): Promise<QualityReviewRecord> {
    const idx = this.reviews.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.reviews[idx].status = 'approved';
      this.reviews[idx].notes = notes;
      return this.reviews[idx];
    }
    throw new Error('Review not found');
  }

  async rejectReview(id: string, notes?: string): Promise<QualityReviewRecord> {
    const idx = this.reviews.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.reviews[idx].status = 'rejected';
      this.reviews[idx].notes = notes;
      return this.reviews[idx];
    }
    throw new Error('Review not found');
  }

  async getDescriptors(): Promise<SensoryDescriptorRecord[]> {
    return this.descriptors;
  }

  async getDefects(): Promise<QualityDefectRecord[]> {
    return this.defects;
  }
}
