import { safeFetch } from './apiClient';
import { IFinancialRepository, CreateTransactionDTO, FinancialSummaryData, DREData, CashFlowData } from '../interfaces/IFinancialRepository';
import { FinancialTransaction, TransactionStatus } from '../../domain/types';

export class ApiFinancialRepository implements IFinancialRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getTransactions(): Promise<FinancialTransaction[]> {
    const json = await safeFetch('/api/finance/transactions', { headers: this.getHeaders() });
    return json.data;
  }

  async getAccountsReceivable(): Promise<FinancialTransaction[]> {
    const all = await this.getTransactions();
    return all.filter(t => t.type === 'Receita' && (t.status === 'Agendado' || t.status === 'Atrasado'));
  }

  async getAccountsPayable(): Promise<FinancialTransaction[]> {
    const all = await this.getTransactions();
    return all.filter(t => t.type === 'Despesa' && (t.status === 'Agendado' || t.status === 'Atrasado'));
  }

  async createTransaction(data: CreateTransactionDTO): Promise<FinancialTransaction> {
    const apiStatus = data.status === 'Efetivado' ? 'paid' : 'pending';
    const json = await safeFetch('/api/finance/expenses', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: data.description,
        amount: data.amount,
        category: data.category,
        dueDate: data.date,
        status: apiStatus,
        paymentMethod: data.paymentMethod
      })
    });
    return json.data;
  }

  async markTransactionAsPaid(id: string): Promise<FinancialTransaction> {
    const json = await safeFetch(`/api/finance/transactions/${id}/pay`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });
    return json.data;
  }

  async calculateFinancialSummary(): Promise<FinancialSummaryData> {
    const json = await safeFetch('/api/finance/summary', { headers: this.getHeaders() });
    const data = json.data;
    // Map to interface
    return {
      receitaRecebida: data.balance > 0 ? data.balance : 0, 
      receitaPendente: data.toReceive || 0,
      contasAPagar: data.toPay || 0,
      despesasPagas: data.balance < 0 ? Math.abs(data.balance) : 0, // This logic will be fixed in API summary later if it breaks
      saldoEstimado: data.balance + (data.toReceive || 0) - (data.toPay || 0)
    };
  }

  async calculateSimpleDRE(): Promise<DREData> {
    const json = await safeFetch('/api/finance/dre', { headers: this.getHeaders() });
    const data = json.data;
    
    return {
      receitaBruta: data.grossRevenue,
      deducoes: 0,
      receitaLiquida: data.netRevenue,
      cpv: data.cogs,
      lucroBruto: data.grossProfit,
      despesasOperacionais: data.opex,
      resultadoOperacional: data.netIncome,
      margemBruta: data.netRevenue > 0 ? (data.grossProfit / data.netRevenue) * 100 : 0,
      margemOperacional: data.netRevenue > 0 ? (data.netIncome / data.netRevenue) * 100 : 0,
    };
  }

  async calculateCashFlow(days: number): Promise<CashFlowData> {
    // For now, return stub data mimicking the endpoint behavior or adapt to frontend
    // The previous mocked return CashFlowData explicitly, let's keep it safe
    const summary = await this.calculateFinancialSummary();
    return {
      period: `${days} dias`,
      saldoAtual: summary.saldoEstimado,
      projectedIn: summary.receitaPendente,
      projectedOut: summary.contasAPagar,
      projectedBalance: summary.saldoEstimado + summary.receitaPendente - summary.contasAPagar
    };
  }
}
