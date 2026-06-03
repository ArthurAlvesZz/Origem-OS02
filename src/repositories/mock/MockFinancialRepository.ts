import { IFinancialRepository, CreateTransactionDTO, FinancialSummaryData, DREData, CashFlowData } from '../interfaces/IFinancialRepository';
import { FinancialTransaction } from '../../domain/types';
import { financialTransactions, productionBatches } from '../../data/mocks';

export class MockFinancialRepository implements IFinancialRepository {
  async getTransactions(): Promise<FinancialTransaction[]> {
    return [...financialTransactions];
  }

  async getAccountsReceivable(): Promise<FinancialTransaction[]> {
    return financialTransactions.filter(t => t.type === 'Receita' && t.status !== 'Efetivado');
  }

  async getAccountsPayable(): Promise<FinancialTransaction[]> {
    return financialTransactions.filter(t => t.type === 'Despesa' && t.status !== 'Efetivado');
  }

  async createTransaction(data: CreateTransactionDTO): Promise<FinancialTransaction> {
    const newTx: FinancialTransaction = {
      id: `FIN-${Date.now().toString().slice(-4)}`,
      type: data.type,
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

  async markTransactionAsPaid(id: string): Promise<FinancialTransaction> {
    const tx = financialTransactions.find(t => t.id === id);
    if (!tx) throw new Error('Transação não encontrada.');
    tx.status = 'Efetivado';
    tx.date = new Date().toISOString().slice(0, 10);
    return tx;
  }

  async calculateFinancialSummary(): Promise<FinancialSummaryData> {
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

    return {
      receitaRecebida,
      receitaPendente,
      contasAPagar,
      despesasPagas,
      saldoEstimado: receitaRecebida - despesasPagas
    };
  }

  async calculateSimpleDRE(): Promise<DREData> {
    const summary = await this.calculateFinancialSummary();
    const receitaBruta = summary.receitaRecebida;
    
    let cpv = 0;
    for (const b of productionBatches) {
      if (b.status === 'Concluído') {
        cpv += b.totalCost || 0;
      }
    }
    
    const lucroBruto = receitaBruta - cpv;
    
    const despesasOperacionais = financialTransactions
      .filter(t => t.type === 'Despesa' && t.status === 'Efetivado' && !['Matéria-prima', 'Insumos', 'Logística de Compra'].includes(t.category))
      .reduce((acc, t) => acc + t.amount, 0);

    const resultadoOperacional = lucroBruto - despesasOperacionais;

    return {
      receitaBruta,
      deducoes: 0,
      receitaLiquida: receitaBruta,
      cpv,
      lucroBruto,
      despesasOperacionais,
      resultadoOperacional,
      margemBruta: receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0,
      margemOperacional: receitaBruta > 0 ? (resultadoOperacional / receitaBruta) * 100 : 0
    };
  }

  async calculateCashFlow(days: number): Promise<CashFlowData> {
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

    const { saldoEstimado } = await this.calculateFinancialSummary();

    return {
      period: `${days} dias`,
      saldoAtual: saldoEstimado,
      projectedIn,
      projectedOut,
      projectedBalance: saldoEstimado + projectedIn - projectedOut
    };
  }
}
