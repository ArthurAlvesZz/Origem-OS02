import { 
  ICrmRepository, CrmPipelineRecord, CrmStageRecord, CrmDealRecord, 
  CrmActivityRecord, CommunicationTemplateRecord, CommunicationQueueRecord 
} from '../interfaces/ICrmRepository';

export class MockCrmRepository implements ICrmRepository {
  private pipelines: CrmPipelineRecord[] = [];
  private stages: CrmStageRecord[] = [];
  private deals: CrmDealRecord[] = [];
  private activities: CrmActivityRecord[] = [];
  private templates: CommunicationTemplateRecord[] = [];
  private queues: CommunicationQueueRecord[] = [];

  constructor() {
    this.pipelines.push({
      id: 'pipeline-1',
      tenantId: '1',
      name: 'Vendas Automáticas B2C',
      type: 'b2c',
      isDefault: true,
      stages: [
        { id: 'stage-1', pipelineId: 'pipeline-1', name: 'Lead Novo', order: 1 },
        { id: 'stage-2', pipelineId: 'pipeline-1', name: 'Aguardando Pagamento', order: 2 },
        { id: 'stage-3', pipelineId: 'pipeline-1', name: 'Assinatura Ativa', order: 3 },
      ]
    });

    this.deals.push({
      id: 'deal-1',
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
      title: 'Aline Oliveira - Plano Mensal',
      value: 120,
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async getPipelines(): Promise<CrmPipelineRecord[]> {
    return this.pipelines;
  }

  async createPipeline(data: Partial<CrmPipelineRecord>): Promise<CrmPipelineRecord> {
    const p = { ...data, id: Date.now().toString() } as CrmPipelineRecord;
    this.pipelines.push(p);
    return p;
  }

  async getDeals(pipelineId?: string): Promise<CrmDealRecord[]> {
    if (pipelineId) return this.deals.filter(d => d.pipelineId === pipelineId);
    return this.deals;
  }

  async createDeal(data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const d = { 
      ...data, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as CrmDealRecord;
    this.deals.push(d);
    return d;
  }

  async updateDeal(id: string, data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const index = this.deals.findIndex(d => d.id === id);
    if(index === -1) throw new Error('Not found');
    this.deals[index] = { ...this.deals[index], ...data, updatedAt: new Date().toISOString() };
    return this.deals[index];
  }

  async moveDeal(id: string, stageId: string): Promise<CrmDealRecord> {
    const index = this.deals.findIndex(d => d.id === id);
    if(index === -1) throw new Error('Not found');
    this.deals[index].stageId = stageId;
    this.deals[index].updatedAt = new Date().toISOString();
    return this.deals[index];
  }

  async getActivities(dealId?: string, customerId?: string): Promise<CrmActivityRecord[]> {
    return this.activities.filter(a => (dealId && a.dealId === dealId) || (customerId && a.customerId === customerId));
  }

  async createActivity(data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord> {
    const a = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() } as CrmActivityRecord;
    this.activities.unshift(a);
    return a;
  }

  async getTemplates(): Promise<CommunicationTemplateRecord[]> {
    return this.templates;
  }

  async createTemplate(data: Partial<CommunicationTemplateRecord>): Promise<CommunicationTemplateRecord> {
    const t = { ...data, id: Date.now().toString() } as CommunicationTemplateRecord;
    this.templates.push(t);
    return t;
  }

  async getCommunications(): Promise<CommunicationQueueRecord[]> {
    return this.queues;
  }

  async queueCommunication(data: Partial<CommunicationQueueRecord>): Promise<CommunicationQueueRecord> {
    const q = { 
      ...data, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    } as CommunicationQueueRecord;
    this.queues.unshift(q);
    return q;
  }

  async markCommunicationSimulated(id: string): Promise<CommunicationQueueRecord> {
    const index = this.queues.findIndex(q => q.id === id);
    if(index === -1) throw new Error('Not found');
    this.queues[index].status = 'simulated';
    this.queues[index].sentAt = new Date().toISOString();
    return this.queues[index];
  }
}
