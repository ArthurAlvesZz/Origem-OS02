import { 
  ICrmRepository, CrmPipelineRecord, CrmDealRecord, 
  CrmActivityRecord, CommunicationTemplateRecord, CommunicationQueueRecord 
} from '../interfaces/ICrmRepository';
import { safeFetch } from './apiClient';

export class ApiCrmRepository implements ICrmRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getPipelines(): Promise<CrmPipelineRecord[]> {
    const res = await safeFetch('/api/crm/pipelines', { headers: this.getHeaders() });
    return res.data;
  }

  async createPipeline(data: Partial<CrmPipelineRecord>): Promise<CrmPipelineRecord> {
    const res = await safeFetch('/api/crm/pipelines', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getDeals(pipelineId?: string): Promise<CrmDealRecord[]> {
    const url = pipelineId ? `/api/crm/deals?pipelineId=${pipelineId}` : '/api/crm/deals';
    const res = await safeFetch(url, { headers: this.getHeaders() });
    return res.data;
  }

  async createDeal(data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const res = await safeFetch('/api/crm/deals', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateDeal(id: string, data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const res = await safeFetch(`/api/crm/deals/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async moveDeal(id: string, stageId: string): Promise<CrmDealRecord> {
    const res = await safeFetch(`/api/crm/deals/${id}/move`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ stageId })
    });
    return res.data;
  }

  async getActivities(dealId?: string, customerId?: string): Promise<CrmActivityRecord[]> {
    const params = new URLSearchParams();
    if(dealId) params.append('dealId', dealId);
    if(customerId) params.append('customerId', customerId);
    
    const res = await safeFetch(`/api/crm/activities?${params.toString()}`, { headers: this.getHeaders() });
    return res.data;
  }

  async createActivity(data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord> {
    const res = await safeFetch('/api/crm/activities', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTemplates(): Promise<CommunicationTemplateRecord[]> {
    const res = await safeFetch('/api/crm/templates', { headers: this.getHeaders() });
    return res.data;
  }

  async createTemplate(data: Partial<CommunicationTemplateRecord>): Promise<CommunicationTemplateRecord> {
    const res = await safeFetch('/api/crm/templates', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getCommunications(): Promise<CommunicationQueueRecord[]> {
    const res = await safeFetch('/api/crm/communications', { headers: this.getHeaders() });
    return res.data;
  }

  async queueCommunication(data: Partial<CommunicationQueueRecord>): Promise<CommunicationQueueRecord> {
    const res = await safeFetch('/api/crm/communications/queue', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async markCommunicationSimulated(id: string): Promise<CommunicationQueueRecord> {
    const res = await safeFetch(`/api/crm/communications/${id}/simulate`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.data;
  }
}
