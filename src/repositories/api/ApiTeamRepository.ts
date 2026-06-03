import { ITeamRepository, TeamMember, Role, Permission, Invitation, AuditLog } from '../interfaces/ITeamRepository';
import { safeFetch } from './apiClient';

export class ApiTeamRepository implements ITeamRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getMembers(): Promise<TeamMember[]> {
    const json = await safeFetch('/api/team/members', { headers: this.getHeaders() });
    return json.data;
  }

  async updateMember(id: string, data: Partial<TeamMember>): Promise<void> {
    await safeFetch(`/api/team/members/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
  }

  async suspendMember(id: string): Promise<void> {
    await safeFetch(`/api/team/members/${id}/suspend`, { method: 'PATCH', headers: this.getHeaders() });
  }

  async reactivateMember(id: string): Promise<void> {
    await safeFetch(`/api/team/members/${id}/reactivate`, { method: 'PATCH', headers: this.getHeaders() });
  }

  async getRoles(): Promise<Role[]> {
    const json = await safeFetch('/api/team/roles', { headers: this.getHeaders() });
    return json.data;
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    const json = await safeFetch('/api/team/roles', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    const json = await safeFetch(`/api/team/roles/${id}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }

  async getPermissions(): Promise<Permission[]> {
    const json = await safeFetch('/api/team/permissions', { headers: this.getHeaders() });
    return json.data;
  }

  async createInvitation(data: Partial<Invitation>): Promise<Invitation> {
    const json = await safeFetch('/api/team/invitations', { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return json.data;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const json = await safeFetch('/api/audit/access-log', { headers: this.getHeaders() });
    return json.data;
  }

  async getMyPermissions(): Promise<string[]> {
    const json = await safeFetch('/api/me/permissions', { headers: this.getHeaders() });
    return json.data;
  }
}
