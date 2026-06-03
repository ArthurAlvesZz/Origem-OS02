import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export function requirePermission(permissionKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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

      if (!tu) {
        return res.status(403).json({ error: 'Not part of this tenant' });
      }

      if (tu.status !== 'active') {
        return res.status(403).json({ error: 'User is inactive or suspended' });
      }

      if (!tu.role) {
        return res.status(403).json({ error: 'User has no role' });
      }

      // Owner/Admin overrides
      if (tu.role.systemKey === 'owner' || tu.role.systemKey === 'admin') {
        return next();
      }

      const hasPerm = tu.role.permissions.some(p => p.permissionKey === permissionKey);
      if (!hasPerm) {
        return res.status(403).json({ error: `Missing required permission: ${permissionKey}` });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
