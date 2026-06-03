import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Plus } from 'lucide-react';
import { FinancialSummaryCards } from '../components/finance/FinancialSummaryCards';
import { AccountsReceivableTable } from '../components/finance/AccountsReceivableTable';
import { AccountsPayableTable } from '../components/finance/AccountsPayableTable';
import { SimpleDRE } from '../components/finance/SimpleDRE';
import { CashFlowPanel } from '../components/finance/CashFlowPanel';
import { ExpenseDrawer } from '../components/finance/ExpenseDrawer';
import { PaymentGatewayPanel } from '../components/finance/PaymentGatewayPanel';
import { useRepositories } from '../repositories/RepositoryProvider';
import { FinancialTransaction } from '../domain/types';

export function Financeiro() {
  const [activeTab, setActiveTab] = useState<'Visão Geral' | 'Receber' | 'Pagar' | 'Fluxo de Caixa' | 'DRE' | 'Pagamentos Online'>('Visão Geral');
  const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { financialRepo } = useRepositories();
  const [receivables, setReceivables] = useState<FinancialTransaction[]>([]);
  const [payables, setPayables] = useState<FinancialTransaction[]>([]);

  useEffect(() => {
    financialRepo.getAccountsReceivable().then(setReceivables);
    financialRepo.getAccountsPayable().then(setPayables);
  }, [financialRepo, refreshKey]);

  const handleMarkPaid = async (id: string) => {
    try {
      await financialRepo.markTransactionAsPaid(id);
      setRefreshKey(prev => prev + 1);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExpenseComplete = () => {
    setIsExpenseDrawerOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8" key={refreshKey}>
      <PageHeader 
        title="Financeiro" 
        description="Gestão de caixa, contas a pagar/receber e DRE simplificada." 
        action={
          <button 
            onClick={() => setIsExpenseDrawerOpen(true)}
            className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} /> Nova Despesa
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 max-w-fit mb-2">
        {(['Visão Geral', 'Receber', 'Pagar', 'Fluxo de Caixa', 'DRE', 'Pagamentos Online'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab 
                ? 'bg-zinc-800 text-zinc-50 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'Visão Geral' && (
          <FinancialSummaryCards refreshKey={refreshKey} />
        )}

        {activeTab === 'Receber' && (
          <AccountsReceivableTable receivables={receivables} onMarkPaid={handleMarkPaid} />
        )}

        {activeTab === 'Pagar' && (
          <AccountsPayableTable payables={payables} onMarkPaid={handleMarkPaid} />
        )}

        {activeTab === 'Fluxo de Caixa' && (
          <CashFlowPanel refreshKey={refreshKey} />
        )}

        {activeTab === 'DRE' && (
          <SimpleDRE refreshKey={refreshKey} />
        )}

        {activeTab === 'Pagamentos Online' && (
          <PaymentGatewayPanel />
        )}
      </div>

      {isExpenseDrawerOpen && (
        <ExpenseDrawer onClose={() => setIsExpenseDrawerOpen(false)} onComplete={handleExpenseComplete} />
      )}
    </div>
  );
}
