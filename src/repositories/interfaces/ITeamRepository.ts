export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'invited' | 'active' | 'suspended' | 'inactive';
  roleId?: string;
  roleName?: string;
  branchId?: string;
  branchName?: string;
  lastLoginAt?: string;
  createdAt: string;
  suspendedAt?: string;
}

export interface Permission {
  key: string;
  module: string;
  action: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
}

export interface Invitation {
  id: string;
  email: string;
  roleId?: string;
  branchId?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module?: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { name: string; email: string };
}

export interface ITeamRepository {
  getMembers(): Promise<TeamMember[]>;
  updateMember(id: string, data: Partial<TeamMember>): Promise<void>;
  suspendMember(id: string): Promise<void>;
  reactivateMember(id: string): Promise<void>;
  
  getRoles(): Promise<Role[]>;
  createRole(data: Partial<Role>): Promise<Role>;
  updateRole(id: string, data: Partial<Role>): Promise<Role>;
  
  getPermissions(): Promise<Permission[]>;
  
  createInvitation(data: Partial<Invitation>): Promise<Invitation>;
  getAuditLogs(): Promise<AuditLog[]>;
  getMyPermissions(): Promise<string[]>;
}
