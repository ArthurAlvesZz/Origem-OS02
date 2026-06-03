import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import crypto from 'crypto';

export async function getTeamMembers(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const members = await prisma.tenantUser.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          lastLoginAt: true,
          createdAt: true
        }
      },
      role: {
        select: {
          id: true,
          name: true
        }
      },
      branch: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  const formatted = members.map(m => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    phone: m.user.phone,
    status: m.status,
    roleId: m.role?.id,
    roleName: m.role?.name,
    branchId: m.branch?.id,
    branchName: m.branch?.name,
    lastLoginAt: m.user.lastLoginAt,
    createdAt: m.createdAt,
    suspendedAt: m.suspendedAt
  }));

  res.json({ status: 'ok', data: formatted });
}

export async function getRoles(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { tenantId: tenantId, deletedAt: null },
        { isSystem: true }
      ]
    },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });

  const formatted = roles.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: r.permissions.map(p => p.permissionKey)
  }));

  res.json({ status: 'ok', data: formatted });
}

export async function getPermissionsList(req: Request, res: Response) {
  const permissions = await prisma.permission.findMany();
  res.json({ status: 'ok', data: permissions });
}

export async function createRole(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, description, permissions } = req.body;

  const role = await prisma.role.create({
    data: {
      tenantId,
      name,
      description,
      permissions: {
        create: (permissions || []).map((p: string) => ({
          permissionKey: p
        }))
      }
    }
  });

  res.json({ status: 'ok', data: role });
}

export async function updateRole(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  const existing = await prisma.role.findFirst({ where: { id, tenantId } });
  if (!existing || existing.isSystem) {
    return res.status(403).json({ error: 'Cannot update system role or role not found' });
  }

  // delete old and create new
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });

  const role = await prisma.role.update({
    where: { id },
    data: {
      name,
      description,
      permissions: {
        create: (permissions || []).map((p: string) => ({
          permissionKey: p
        }))
      }
    }
  });

  res.json({ status: 'ok', data: role });
}

export async function updateTeamMember(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params; // userId
  const { roleId, branchId, phone } = req.body;

  const tu = await prisma.tenantUser.findFirst({ where: { userId: id, tenantId } });
  if (!tu) return res.status(404).json({ error: 'User not found in tenant' });

  await prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId: id } },
    data: { roleId, branchId }
  });

  if (phone !== undefined) {
    await prisma.user.update({
      where: { id },
      data: { phone }
    });
  }

  res.json({ status: 'ok' });
}

export async function suspendTeamMember(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  if (id === (req as any).user?.userId) {
    return res.status(400).json({ error: 'Cannot suspend yourself' });
  }

  await prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId: id } },
    data: { status: 'suspended', suspendedAt: new Date() }
  });

  res.json({ status: 'ok' });
}

export async function reactivateTeamMember(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  await prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId: id } },
    data: { status: 'active', suspendedAt: null }
  });

  res.json({ status: 'ok' });
}

export async function createInvitation(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { email, roleId, branchId } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingTu = await prisma.tenantUser.findFirst({ where: { tenantId, userId: existingUser.id }});
    if (existingTu) {
      return res.status(400).json({ error: 'User already in team' });
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7); // 7 days

  const inv = await prisma.invitation.create({
    data: {
      tenantId,
      email,
      roleId,
      branchId,
      tokenHash,
      invitedByUserId: (req as any).user?.userId,
      expiresAt: expiry
    }
  });

  // Mock send email logic here
  console.log(`[MOCK EMAIL] Invitation sent to ${email} with token: ${token}`);

  res.json({ status: 'ok', data: { ...inv, tokenHash: undefined, mockToken: token } });
}

export async function getAuditLogs(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const logs = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { timestamp: 'desc' },
    take: 100,
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });

  const formatted = logs.map(l => ({
    id: l.id,
    action: l.action,
    module: l.tableName,
    entityId: l.recordId,
    ipAddress: l.ip,
    createdAt: l.timestamp,
    user: l.user
  }));

  res.json({ status: 'ok', data: formatted });
}

export async function getMyPermissions(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.userId;

  const tu = await prisma.tenantUser.findFirst({
    where: { tenantId, userId },
    include: {
      role: {
        include: {
          permissions: true
        }
      }
    }
  });

  const perms = tu?.role?.permissions.map(p => p.permissionKey) || [];
  
  // Implicitly, if user has 'admin' system key or similar, they could have all perms.
  if (tu?.role?.systemKey === 'owner' || tu?.role?.systemKey === 'admin') {
    // Usually admin has everything, we can handle this logic in middleware
  }

  res.json({ status: 'ok', data: perms });
}
