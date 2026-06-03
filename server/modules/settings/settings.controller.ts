import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

// Default values to seed if missing
const defaultProfile = {
  name: 'COFCOF.CO',
  legalName: 'COFCOF Torrefacao e Comercio Ltda',
  document: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  logoUrl: '',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  language: 'pt-BR'
};

const defaultBusinessRules = {
  defaultB2CPaymentTermsDays: 0,
  defaultB2BPaymentTermsDays: 30,
  defaultConsignmentSettleDays: 15,
  allowNegativeStock: false,
  defaultDiscountLimitPercent: 10,
  monthlyRevenueTarget: 50000,
  defaultSalesChannel: 'Online',
  defaultPaymentMethod: 'PIX'
};

const defaultProductionRules = {
  defaultHourCost: 45,
  masterRoasterHourCost: 80,
  minExpectedYieldPercent: 82,
  maxExpectedLossPercent: 18,
  defaultUnit: 'kg'
};

const defaultModuleFlags = {
  sales: true,
  inventory: true,
  finance: true,
  production: true,
  consignment: true,
  fiscal_placeholder: false,
  payroll_placeholder: false,
  storefront_placeholder: false
};

async function getOrSet<T>(tenantId: string, key: string, defaultValue: T): Promise<T> {
  let setting = await prisma.appSetting.findUnique({ where: { tenantId_key: { tenantId, key } } });
  if (!setting) {
    setting = await prisma.appSetting.create({
      data: { tenantId, key, value: JSON.stringify(defaultValue) }
    });
  }
  return JSON.parse(setting.value);
}

async function setSetting(tenantId: string, key: string, value: any, actionDesc: string, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.appSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      create: { tenantId, key, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'AppSetting',
        recordId: key,
        action: 'UPDATE',
        newData: value
      }
    });

    return updated;
  });
  return JSON.parse(result.value);
}

export const getProfile = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const profile = await getOrSet(tenantId, 'profile', defaultProfile);
  res.json({ data: profile });
};

export const updateProfile = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const data = req.body;
  
  const current = await getOrSet(tenantId, 'profile', defaultProfile);
  const updated = await setSetting(tenantId, 'profile', { ...current, ...data }, 'Atualizou Perfil da Empresa', userId);
  
  res.json({ data: updated });
};

export const getBranches = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const branches = await prisma.branch.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: 'asc' }
  });
  res.json({ data: branches });
};

export const createBranch = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const data = req.body;

  const branch = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.branch.updateMany({ where: { tenantId, deletedAt: null, isDefault: true }, data: { isDefault: false }});
    }

    const created = await tx.branch.create({
      data: { tenantId, ...data }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Branch',
        recordId: created.id,
        action: 'CREATE',
        newData: { name: created.name, type: created.type }
      }
    });

    return created;
  });

  res.json({ data: branch });
};

export const updateBranch = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;
  const data = req.body;

  const current = await prisma.branch.findUnique({ where: { id } });
  if (!current || current.tenantId !== tenantId || current.deletedAt) {
    throw new Error('Unidade não encontrada.');
  }

  const branch = await prisma.$transaction(async (tx) => {
    if (data.isDefault && !current.isDefault) {
      await tx.branch.updateMany({ where: { tenantId, deletedAt: null, isDefault: true }, data: { isDefault: false }});
    }

    const updated = await tx.branch.update({
      where: { id },
      data
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Branch',
        recordId: updated.id,
        action: 'UPDATE',
        newData: data
      }
    });

    return updated;
  });

  res.json({ data: branch });
};

export const deleteBranch = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;

  const current = await prisma.branch.findUnique({ where: { id } });
  if (!current || current.tenantId !== tenantId || current.deletedAt) {
    throw new Error('Unidade não encontrada.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.branch.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false }
    });

    await tx.auditLog.create({
      data: { tenantId, userId, tableName: 'Branch', recordId: id, action: 'DELETE' }
    });
  });

  res.json({ success: true });
};

export const getBusinessRules = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const rules = await getOrSet(tenantId, 'businessRules', defaultBusinessRules);
  res.json({ data: rules });
};

export const updateBusinessRules = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const data = req.body;
  const current = await getOrSet(tenantId, 'businessRules', defaultBusinessRules);
  const updated = await setSetting(tenantId, 'businessRules', { ...current, ...data }, 'Atualizou Regras de Negócio', userId);
  res.json({ data: updated });
};

export const getProductionRules = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const rules = await getOrSet(tenantId, 'productionRules', defaultProductionRules);
  res.json({ data: rules });
};

export const updateProductionRules = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const data = req.body;
  const current = await getOrSet(tenantId, 'productionRules', defaultProductionRules);
  const updated = await setSetting(tenantId, 'productionRules', { ...current, ...data }, 'Atualizou Regras de Produção', userId);
  res.json({ data: updated });
};

export const getModuleFlags = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const flags = await getOrSet(tenantId, 'moduleFlags', defaultModuleFlags);
  res.json({ data: flags });
};

export const updateModuleFlags = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const data = req.body;
  const current = await getOrSet(tenantId, 'moduleFlags', defaultModuleFlags);
  const updated = await setSetting(tenantId, 'moduleFlags', { ...current, ...data }, 'Atualizou Módulos', userId);
  res.json({ data: updated });
};
