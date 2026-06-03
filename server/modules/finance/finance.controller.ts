import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const expenseSchema = z.object({
  body: z.object({
    description: z.string(),
    amount: z.number().min(0.01),
    category: z.string(),
    dueDate: z.string(),
    status: z.enum(['pending', 'paid']),
    paymentMethod: z.string().optional(),
    costCenterId: z.string().optional()
  })
});

export const getTransactions = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      order: {
        include: { customer: true }
      }
    },
    orderBy: { date: 'desc' },
    take: 100
  });

  const now = new Date();

  const formatted = transactions.map(t => {
    let uiStatus = t.status === 'paid' ? 'Efetivado' : (t.status === 'pending' || t.status === 'partial') ? 'Agendado' : t.status === 'cancelled' ? 'Cancelado' : 'Efetivado';
    
    if (t.status === 'pending' && t.dueDate && new Date(t.dueDate) < now) {
      uiStatus = 'Atrasado';
    }

    const customerName = t.order?.customer?.name || t.order?.customerName || null;
    const finalDescription = customerName ? `${t.description} - ${customerName}` : t.description;

    return {
      id: t.id,
      date: t.dueDate ? t.dueDate.toISOString().split('T')[0] : t.date.toISOString().split('T')[0],
      description: finalDescription,
      amount: t.amount,
      type: (t.type === 'revenue' || t.type === 'receivable') ? 'Receita' : 'Despesa',
      status: uiStatus,
      category: t.category,
      paymentMethod: t.paymentMethod,
      _realStatus: t.status // preserve real status if needed for logic
    };
  });

  res.json({ data: formatted });
};

export const createExpense = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.id;
  const data = req.body;

  const isPaid = data.status === 'paid';
  
  const tx = await prisma.financialTransaction.create({
    data: {
      tenantId,
      type: isPaid ? 'expense' : 'payable',
      status: data.status, // paid or pending
      category: data.category,
      description: data.description,
      amount: data.amount,
      paidAmount: isPaid ? data.amount : 0,
      date: new Date(),
      dueDate: new Date(data.dueDate),
      paidAt: isPaid ? new Date() : null,
      paymentMethod: data.paymentMethod,
      costCenterId: data.costCenterId,
      source: 'manual_expense',
      createdBy: userId
    }
  });

  res.status(201).json({ data: tx });
};

export const markAsPaid = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const tx = await prisma.financialTransaction.findFirst({
    where: { id, tenantId, deletedAt: null }
  });

  if (!tx) return res.status(404).json({ error: 'Transação não encontrada' });
  if (tx.status === 'paid') return res.status(400).json({ error: 'Transação já está paga' });

  // Simplified: fully pay it
  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: {
      status: 'paid',
      paidAmount: tx.amount,
      paidAt: new Date(),
      // if it was a receivable it becomes revenue conceptually, 
      // but let's keep the original type logic or just stick it to what we use 
      // (we could mutate type to 'revenue' / 'expense')
      type: tx.type === 'receivable' ? 'revenue' : tx.type === 'payable' ? 'expense' : tx.type
    }
  });

  res.json({ data: updated });
};

export const cancelTransaction = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const tx = await prisma.financialTransaction.findFirst({
    where: { id, tenantId, deletedAt: null }
  });

  if (!tx) return res.status(404).json({ error: 'Transação não encontrada' });

  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: { status: 'cancelled' }
  });

  res.json({ data: updated });
};

export const getFinancialSummary = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const now = new Date();

  // Basic summary: total revenue, total unpaid expenses, etc.
  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId, deletedAt: null, status: { not: 'cancelled' } }
  });

  let balance = 0;
  let toReceive = 0;
  let toPay = 0;

  for (const t of transactions) {
    if (t.type === 'revenue' && t.status === 'paid') {
      balance += t.amount;
    } else if (t.type === 'expense' && t.status === 'paid') {
      balance -= t.amount; // or total paid out
    } else if (t.type === 'receivable' && (t.status === 'pending' || t.status === 'partial')) {
      toReceive += t.amount - t.paidAmount;
    } else if (t.type === 'payable' && (t.status === 'pending' || t.status === 'partial')) {
      toPay += t.amount - t.paidAmount;
    }
  }

  res.json({ data: { balance, toReceive, toPay } });
};

export const getCashFlow = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  
  // Real implement logic based on months, here we'll just mock based on all data
  // Grouping by Month
  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId, deletedAt: null, status: 'paid' }
  });

  // naive group for MVP
  const acc: Record<string, { month: string; in: number; out: number; balance: number }> = {};
  
  for (const t of transactions) {
    const dt = t.paidAt || t.date;
    const m = dt.toISOString().slice(0, 7); // YYYY-MM
    if (!acc[m]) acc[m] = { month: m, in: 0, out: 0, balance: 0 };
    if (t.type === 'revenue') acc[m].in += t.amount;
    if (t.type === 'expense') acc[m].out += t.amount;
  }
  
  const cashFlow = Object.values(acc).sort((a,b) => a.month.localeCompare(b.month));
  // calc balance
  for (const item of cashFlow) {
     item.balance = item.in - item.out;
  }

  res.json({ data: cashFlow });
};

export const getSimpleDre = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId, deletedAt: null, status: 'paid' }
  });

  let grossRevenue = 0;
  let cogs = 0; // we don't have COGS directly linked unless we read order items, but let's approximate or 0
  let opex = 0;

  for (const t of transactions) {
     if (t.type === 'revenue') grossRevenue += t.amount;
     if (t.type === 'expense') {
        if (t.category.toLowerCase().includes('custo') || t.category.toLowerCase().includes('mercadoria')) {
           cogs += t.amount;
        } else {
           opex += t.amount;
        }
     }
  }

  const netRevenue = grossRevenue; // ignoring taxes for now
  const grossProfit = netRevenue - cogs;
  const netIncome = grossProfit - opex;

  res.json({ data: {
    grossRevenue,
    netRevenue,
    cogs,
    grossProfit,
    opex,
    netIncome
  }});
};
