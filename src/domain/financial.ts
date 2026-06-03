import { financialTransactions, productionBatches } from '../data/mocks';
import { FinancialTransaction, TransactionType, TransactionStatus } from './types';

export function getAccountsReceivable() {
  return financialTransactions.filter(t => t.type === 'Receita' && t.status !== 'Efetivado');
}

export function getAccountsPayable() {
  return financialTransactions.filter(t => t.type === 'Despesa' && t.status !== 'Efetivado');
}

export function createExpense(data: {
  description: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  category: string;
  paymentMethod?: string;
}) {
  const newTx: FinancialTransaction = {
    id: `FIN-${Date.now().toString().slice(-4)}`,
    type: 'Despesa',
    description: data.description,
    amount: data.amount,
    date: data.date,
    status: data.status,
    category: data.category,
    paymentMethod: data.paymentMethod
  };
  financialTransactions.unshift(newTx);
  return newTx;
}

export function markTransactionAsPaid(id: string) {
  const tx = financialTransactions.find(t => t.id === id);
  if (!tx) throw new Error('Transação não encontrada.');
  tx.status = 'Efetivado';
  tx.date = new Date().toISOString().slice(0, 10);
  return tx;
}

export function calculateFinancialSummary() {
  let receitaRecebida = 0;
  let receitaPendente = 0;
  let contasAPagar = 0;
  let despesasPagas = 0;

  for (const t of financialTransactions) {
    if (t.type === 'Receita') {
      if (t.status === 'Efetivado') receitaRecebida += t.amount;
      else receitaPendente += t.amount;
    } else if (t.type === 'Despesa') {
      if (t.status === 'Efetivado') despesasPagas += t.amount;
      else contasAPagar += t.amount;
    }
  }

  const saldoEstimado = receitaRecebida - despesasPagas;

  return {
    receitaRecebida,
    receitaPendente,
    contasAPagar,
    despesasPagas,
    saldoEstimado
  };
}

export function calculateSimpleDRE() {
  // Mock DRE grouping logic based on events
  const summary = calculateFinancialSummary();
  const receitaBruta = summary.receitaRecebida; // Only looking at effective revenue for DRE for simplicity
  
  // CPV - Custo Produto Vendido
  // Simplification: sum all inputs from concluded production batches
  let custoProducaoEstimado = 0;
  for (const b of productionBatches) {
    if (b.status === 'Concluído') {
      custoProducaoEstimado += b.totalCost || 0;
    }
  }
  
  const lucroBruto = receitaBruta - custoProducaoEstimado;
  
  const despesasOperacionais = financialTransactions
    .filter(t => t.type === 'Despesa' && t.status === 'Efetivado' && !['Matéria-prima', 'Insumos', 'Logística de Compra'].includes(t.category))
    .reduce((acc, t) => acc + t.amount, 0);

  const resultadoOperacional = lucroBruto - despesasOperacionais;

  const margemBruta = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0;
  const margemOperacional = receitaBruta > 0 ? (resultadoOperacional / receitaBruta) * 100 : 0;

  return {
    receitaBruta,
    deducoes: 0, // Simplified to 0 for now
    receitaLiquida: receitaBruta,
    cpv: custoProducaoEstimado,
    lucroBruto,
    despesasOperacionais,
    resultadoOperacional,
    margemBruta,
    margemOperacional
  };
}

export function calculateCashFlow(days: number) {
  // A simplified projection
  const today = new Date();
  const limitDate = new Date(today);
  limitDate.setDate(limitDate.getDate() + days);

  const format = (d: Date) => d.toISOString().slice(0, 10);
  const startStr = format(today);
  const endStr = format(limitDate);

  let projectedIn = 0;
  let projectedOut = 0;

  for (const t of financialTransactions) {
    if (t.status !== 'Efetivado' && t.date >= startStr && t.date <= endStr) {
      if (t.type === 'Receita') projectedIn += t.amount;
      if (t.type === 'Despesa') projectedOut += t.amount;
    }
  }

  const { saldoEstimado } = calculateFinancialSummary();

  return {
    period: `${days} dias`,
    saldoAtual: saldoEstimado,
    projectedIn,
    projectedOut,
    projectedBalance: saldoEstimado + projectedIn - projectedOut
  };
}
