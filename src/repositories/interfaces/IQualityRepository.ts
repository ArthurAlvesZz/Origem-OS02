export interface QualityReviewRecord {
  id: string;
  productionBatchId?: string;
  productId?: string;
  reviewerUserId?: string;
  status: 'pending_review' | 'approved' | 'approved_with_notes' | 'rejected' | 'blocked' | 'rework_needed';
  scoreTotal?: number;
  fragranceScore?: number;
  aromaScore?: number;
  acidityScore?: number;
  bodyScore?: number;
  sweetnessScore?: number;
  balanceScore?: number;
  aftertasteScore?: number;
  defectsScore?: number;
  notes?: string;
  recommendation?: string;
  reviewedAt?: string;
  createdAt: string;
  batch?: any;
  product?: any;
  descriptors?: any[];
  defects?: any[];
}

export interface SensoryDescriptorRecord {
  id: string;
  name: string;
  category: string;
}

export interface QualityDefectRecord {
  id: string;
  name: string;
  severity: string;
}

export interface IQualityRepository {
  getReviews(): Promise<QualityReviewRecord[]>;
  createReview(data: Partial<QualityReviewRecord>): Promise<QualityReviewRecord>;
  updateReview(id: string, data: Partial<QualityReviewRecord>): Promise<QualityReviewRecord>;
  approveReview(id: string, notes?: string): Promise<QualityReviewRecord>;
  rejectReview(id: string, notes?: string): Promise<QualityReviewRecord>;
  getDescriptors(): Promise<SensoryDescriptorRecord[]>;
  getDefects(): Promise<QualityDefectRecord[]>;
}
