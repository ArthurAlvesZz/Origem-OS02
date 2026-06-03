import { PublicLotTrace } from '../../domain/types';

export interface CreateTraceabilityDTO {
  qualityReviewId: string;
  title: string;
  summary?: string;
  publicDescriptorsJson?: string;
  publicOriginJson?: string;
  roastInfoJson?: string;
  productInfoJson?: string;
  publicScore?: number;
}

export interface UpdateTraceabilityDTO {
  title?: string;
  summary?: string;
  publicDescriptorsJson?: string;
  publicOriginJson?: string;
  roastInfoJson?: string;
  productInfoJson?: string;
  publicScore?: number;
}

export interface ITraceabilityRepository {
  getAll(): Promise<PublicLotTrace[]>;
  getById(id: string): Promise<PublicLotTrace | null>;
  getByPublicCode(publicCode: string): Promise<PublicLotTrace | null>;
  createFromQualityReview(data: CreateTraceabilityDTO): Promise<PublicLotTrace>;
  update(id: string, data: UpdateTraceabilityDTO): Promise<PublicLotTrace>;
  publish(id: string): Promise<PublicLotTrace>;
  unpublish(id: string): Promise<PublicLotTrace>;
}
