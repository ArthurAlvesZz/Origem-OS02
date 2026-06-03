import { FinancialTransaction, TransactionStatus, TransactionType } from '../../domain/types';

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  type: TransactionType;
  category: string;
  paymentMethod?: string;
}

export interface FinancialSummaryData {
  receitaRecebida: number;
  receitaPendente: number;
  contasAPagar: number;
  despesasPagas: number;
  saldoEstimado: number;
}

export interface DREData {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  cpv: number;
  lucroBruto: number;
  despesasOperacionais: number;
  resultadoOperacional: number;
  margemBruta: number;
  margemOperacional: number;
}

export interface CashFlowData {
  period: string;
  saldoAtual: number;
  projectedIn: number;
  projectedOut: number;
  projectedBalance: number;
}

export interface IFinancialRepository {
  getTransactions(): Promise<FinancialTransaction[]>;
  getAccountsReceivable(): Promise<FinancialTransaction[]>;
  getAccountsPayable(): Promise<FinancialTransaction[]>;
  createTransaction(data: CreateTransactionDTO): Promise<FinancialTransaction>;
  markTransactionAsPaid(id: string): Promise<FinancialTransaction>;
  calculateFinancialSummary(): Promise<FinancialSummaryData>;
  calculateSimpleDRE(): Promise<DREData>;
  calculateCashFlow(days: number): Promise<CashFlowData>;
}
