import { ITeamRepository, TeamMember, Role, Permission, Invitation, AuditLog } from '../interfaces/ITeamRepository';

export class MockTeamRepository implements ITeamRepository {
  private members: TeamMember[] = [
    {
      id: '1',
      name: 'João Neves (Mock)',
      email: 'joao.neves@cofcof.mock',
      status: 'active',
      roleName: 'Admin',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Maria Vendas',
      email: 'maria@cofcof.mock',
      status: 'active',
      roleName: 'Vendas',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  private roles: Role[] = [
    { id: '1', name: 'Admin', description: 'Acesso total', isSystem: true, permissions: ['*'] },
    { id: '2', name: 'Vendas', description: 'Acesso PDV e Clientes', isSystem: false, permissions: ['orders:read', 'orders:create'] }
  ];

  async getMembers(): Promise<TeamMember[]> {
    return this.members;
  }

  async updateMember(id: string, data: Partial<TeamMember>): Promise<void> {
    const idx = this.members.findIndex(m => m.id === id);
    if(idx > -1) this.members[idx] = { ...this.members[idx], ...data };
  }

  async suspendMember(id: string): Promise<void> {
    const idx = this.members.findIndex(m => m.id === id);
    if(idx > -1) {
      this.members[idx].status = 'suspended';
      this.members[idx].suspendedAt = new Date().toISOString();
    }
  }

  async reactivateMember(id: string): Promise<void> {
    const idx = this.members.findIndex(m => m.id === id);
    if(idx > -1) {
      this.members[idx].status = 'active';
      this.members[idx].suspendedAt = undefined;
    }
  }

  async getRoles(): Promise<Role[]> { return this.roles; }
  
  async createRole(data: Partial<Role>): Promise<Role> {
    const r = { ...data, id: Date.now().toString(), isSystem: false, permissions: data.permissions || [] } as Role;
    this.roles.push(r);
    return r;
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    const idx = this.roles.findIndex(r => r.id === id);
    if (idx > -1) {
       this.roles[idx] = { ...this.roles[idx], ...data };
       return this.roles[idx];
    }
    throw new Error("Not found");
  }

  async getPermissions(): Promise<Permission[]> {
    return [
      { key: 'team:read', module: 'Team', action: 'Read' },
      { key: 'team:update', module: 'Team', action: 'Update' }
    ];
  }

  async createInvitation(data: Partial<Invitation>): Promise<Invitation> {
    return {
      id: Date.now().toString(),
      email: data.email || '',
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return [
      {
        id: '1',
        action: 'login.success',
        createdAt: new Date().toISOString(),
        user: { name: 'João Neves (Mock)', email: 'joao.neves@cofcof.mock' }
      }
    ];
  }

  async getMyPermissions(): Promise<string[]> {
    return ['*'];
  }
}
