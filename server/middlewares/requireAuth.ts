import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key') as any;
    (req as any).user = payload;
    (req as any).tenantId = payload.tenantId;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
