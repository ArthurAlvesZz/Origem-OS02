import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const getSummary = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);

  // 1. Faturamento do mes (Orders)
  const monthOrders = await prisma.order.findMany({
    where: { 
      tenantId, 
      orderDate: { gte: startMonth, lte: endMonth },
      status: { notIn: ['cancelled'] }
    }
  });
  const faturamentoMes = monthOrders.reduce((acc: number, o: any) => acc + o.total, 0);
  const pedidosMes = monthOrders.length;
  
  const lucroEstimado = monthOrders.reduce((acc: number, o: any) => acc + (o.estimatedProfit || 0), 0);
  const margemBruta = faturamentoMes > 0 ? (lucroEstimado / faturamentoMes) * 100 : 0;

  // 2. Receita e Despesas
  const finances = await prisma.financialTransaction.findMany({
    where: {
      tenantId,
      status: { notIn: ['cancelled'] }
    }
  });

  const receitaRecebida = finances
    .filter((f: any) => f.type === 'Receita' && f.status === 'paid' && f.paidAt && new Date(f.paidAt) >= startMonth && new Date(f.paidAt) <= endMonth)
    .reduce((acc: number, f: any) => acc + f.paidAmount, 0);

  const contasReceber = finances
    .filter((f: any) => f.type === 'Receita' && f.status === 'pending')
    .reduce((acc: number, f: any) => acc + f.amount, 0);

  const contasPagar = finances
    .filter((f: any) => f.type === 'Despesa' && f.status === 'pending')
    .reduce((acc: number, f: any) => acc + f.amount, 0);

  // 3. Produção do Mês
  const monthBatches = await prisma.productionBatch.findMany({
    where: {
      tenantId,
      date: { gte: startMonth, lte: endMonth },
      status: { notIn: ['cancelled'] }
    }
  });
  const producaoMes = monthBatches.reduce((acc: number, b: any) => acc + (b.finalWeight || 0), 0);
  const custoProducao = monthBatches.reduce((acc: number, b: any) => acc + (b.totalCost || 0), 0);

  // 4. Estoque Crítico
  const products = await prisma.product.findMany({
    where: { tenantId, active: true, deletedAt: null }
  });
  const inventoryMovements = await prisma.stockMovement.findMany({
    where: { tenantId, deletedAt: null }
  });
  
  let estoqueCritico = 0;
  for (const prod of products) {
    const stock = inventoryMovements
      .filter((m: any) => m.productId === prod.id)
      .reduce((acc: number, m: any) => acc + m.qty, 0);
    if (prod.minStock > 0 && stock <= prod.minStock) {
      estoqueCritico++;
    }
  }

  // 5. Consignações
  const consignments = await prisma.consignment.findMany({
    where: { tenantId, deletedAt: null }
  });

  const abertas = consignments.filter((c: any) => c.status === 'open' || c.status === 'partially_settled');
  const vencidas = abertas.filter((c: any) => c.expectedReturnDate && new Date(c.expectedReturnDate) < now);

  let metaFaturamento = 50000;
  try {
    const setting = await prisma.appSetting.findUnique({ where: { tenantId_key: { tenantId, key: 'businessRules' } } });
    if (setting) {
      const parsed = JSON.parse(setting.value);
      if (parsed.monthlyRevenueTarget) {
        metaFaturamento = parsed.monthlyRevenueTarget;
      }
    }
  } catch(e) {}

  const summary = {
    faturamentoMes,
    metaFaturamento,
    receitaRecebida,
    contasReceber,
    contasPagar,
    lucroEstimado,
    margemBruta,
    estoqueCritico,
    consignacoesAbertas: abertas.length,
    consignacoesVencidas: vencidas.length,
    producaoMes,
    custoProducao,
    pedidosMes
  };

  res.json({ data: summary });
};

export const getAlerts = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const now = new Date();
  const alerts = [];

  // Consignacoes vencidas
  const consignments = await prisma.consignment.findMany({
    where: { 
      tenantId, 
      status: { in: ['open', 'partially_settled'] },
      deletedAt: null
    }
  });

  const vencidas = consignments.filter((c: any) => c.expectedReturnDate && new Date(c.expectedReturnDate) < now);
  for (const c of vencidas) {
    alerts.push({
      id: `consig_${c.id}`,
      type: 'consignacao_vencida',
      title: 'Consignação Vencida',
      message: `Consignação de ${c.partnerName} está vencida desde ${c.expectedReturnDate?.toLocaleDateString('pt-BR')}.`,
      severity: 'medium'
    });
  }

  // Estoque critico
  const products = await prisma.product.findMany({
    where: { tenantId, active: true, deletedAt: null }
  });
  const inventoryMovements = await prisma.stockMovement.findMany({
    where: { tenantId, deletedAt: null }
  });
  
  for (const prod of products) {
    if (prod.minStock > 0) {
      const stock = inventoryMovements
        .filter((m: any) => m.productId === prod.id)
        .reduce((acc: number, m: any) => acc + m.qty, 0);
      if (stock <= prod.minStock) {
         alerts.push({
           id: `stock_${prod.id}`,
           type: 'estoque_baixo',
           title: 'Estoque Crítico',
           message: `Produto ${prod.name} está com estoque (${stock}) abaixo ou igual ao mínimo (${prod.minStock}).`,
           severity: 'high'
         });
      }
    }
  }

  // Contas vencidas
  const finances = await prisma.financialTransaction.findMany({
    where: {
      tenantId,
      status: 'pending'
    }
  });
  const contasVencidas = finances.filter((f: any) => new Date(f.date) < now);
  for (const f of contasVencidas) {
    alerts.push({
      id: `fin_${f.id}`,
      type: 'conta_vencida',
      title: f.type === 'Receita' ? 'Recebimento Atrasado' : 'Pagamento Atrasado',
      message: `${f.description} vencida em ${new Date(f.date).toLocaleDateString('pt-BR')} no valor de R$ ${f.amount.toFixed(2)}.`,
      severity: f.type === 'Despesa' ? 'high' : 'medium'
    });
  }

  res.json({ data: alerts });
};

export const getRecentActivity = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  const activities = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { timestamp: 'desc' },
    take: 10,
    include: { user: { select: { name: true } } }
  });

  const mapped = activities.map((a: any) => {
    let type = 'outro';
    let message = `${a.action} em ${a.tableName}`;
    
    if (a.tableName === 'Order') { type = 'pedido'; message = `Pedido ${a.action === 'CREATE' ? 'Criado' : 'Atualizado'} ${a.newData?.status ? '('+a.newData.status+')' : ''}`; }
    if (a.tableName === 'StockMovement') { type = 'estoque'; message = `Movimentação de Estoque (${a.newData?.movementType || 'Ajuste'})`; }
    if (a.tableName === 'Consignment') { type = 'consignacao'; message = `Consignação ${a.action === 'CREATE' ? 'Criada' : 'Atualizada'} ${a.newData?.status ? '('+a.newData.status+')' : ''}`; }
    if (a.tableName === 'ProductionBatch') { type = 'producao'; message = `Lote de Produção ${a.action === 'CREATE' ? 'Criado' : 'Finalizado'} ${a.newData?.status ? '('+a.newData.status+')' : ''}`; }
    if (a.tableName === 'FinancialTransaction') { type = 'financeiro'; message = `Transação ${a.action === 'CREATE' ? 'Criada' : 'Baixada'} ${a.newData?.status ? '('+a.newData.status+')' : ''}`; }

    return {
      id: a.id,
      date: a.createdAt.toISOString(),
      message,
      type
    };
  });

  res.json({ data: mapped });
};
