import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export function auditLog(tableName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only log mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const originalSend = res.send;
      res.send = function (body) {
        // Run audit logging after response is sent asynchronously
        res.on('finish', () => {
          try {
            const tenantId = (req as any).tenantId;
            const userId = (req as any).user?.id;
            if (tenantId) {
              prisma.auditLog.create({
                data: {
                  tenantId,
                  userId,
                  action: req.method,
                  tableName,
                  recordId: 'todo', // Extract from body/params
                  oldData: {},
                  newData: req.body || {},
                  ip: req.ip
                }
              }).catch(console.error);
            }
          } catch (e) {
            console.error('Audit log failed', e);
          }
        });
        return originalSend.call(this, body);
      };
    }
    next();
  };
}
