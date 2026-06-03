import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })
});

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenants: {
        include: { tenant: true, role: true }
      }
    }
  });

  if (!user || user.tenants.length === 0) {
    return res.status(401).json({ error: 'Credenciais inválidas ou usuário sem acesso' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Use the first tenant by default for now
  const tenantUser = user.tenants[0];

  const payload = {
    id: user.id,
    email: user.email,
    tenantId: tenantUser.tenantId,
    role: tenantUser.role?.name
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'super-secret-jwt-key',
    { expiresIn: '1d' }
  );

  res.json({
    token,
    user: payload
  });
};

export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
};
