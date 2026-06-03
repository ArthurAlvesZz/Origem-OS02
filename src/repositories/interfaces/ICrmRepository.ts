export interface CrmPipelineRecord {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  isDefault: boolean;
  stages?: CrmStageRecord[];
}

export interface CrmStageRecord {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  color?: string | null;
}

export interface CrmDealRecord {
  id: string;
  pipelineId: string;
  stageId: string;
  customerId?: string | null;
  subscriptionRequestId?: string | null;
  paymentIntentId?: string | null;
  orderId?: string | null;
  title: string;
  value: number;
  status: string;
  priority: string;
  ownerUserId?: string | null;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmActivityRecord {
  id: string;
  dealId?: string | null;
  customerId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
}

export interface CommunicationTemplateRecord {
  id: string;
  channel: string;
  name: string;
  subject?: string | null;
  body: string;
  variablesJson?: string | null;
  active: boolean;
}

export interface CommunicationQueueRecord {
  id: string;
  status: string;
  channel: string;
  provider: string;
  recipient: string;
  renderedBody: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  dealId?: string | null;
  customerId?: string | null;
}

export interface ICrmRepository {
  getPipelines(): Promise<CrmPipelineRecord[]>;
  createPipeline(data: Partial<CrmPipelineRecord>): Promise<CrmPipelineRecord>;
  
  getDeals(pipelineId?: string): Promise<CrmDealRecord[]>;
  createDeal(data: Partial<CrmDealRecord>): Promise<CrmDealRecord>;
  updateDeal(id: string, data: Partial<CrmDealRecord>): Promise<CrmDealRecord>;
  moveDeal(id: string, stageId: string): Promise<CrmDealRecord>;
  
  getActivities(dealId?: string, customerId?: string): Promise<CrmActivityRecord[]>;
  createActivity(data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord>;

  getTemplates(): Promise<CommunicationTemplateRecord[]>;
  createTemplate(data: Partial<CommunicationTemplateRecord>): Promise<CommunicationTemplateRecord>;
  
  getCommunications(): Promise<CommunicationQueueRecord[]>;
  queueCommunication(data: Partial<CommunicationQueueRecord>): Promise<CommunicationQueueRecord>;
  markCommunicationSimulated(id: string): Promise<CommunicationQueueRecord>;
}
