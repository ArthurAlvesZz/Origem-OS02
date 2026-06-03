import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Briefcase } from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { FinancialSummaryData } from '../../repositories/interfaces/IFinancialRepository';

export function FinancialSummaryCards({ refreshKey }: { refreshKey?: number }) {
  const { financialRepo } = useRepositories();
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null);

  useEffect(() => {
    financialRepo.calculateFinancialSummary().then(setSummary);
  }, [financialRepo, refreshKey]);

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
         <div className="flex items-center gap-3 mb-2 text-zinc-400">
            <DollarSign size={18} className="text-emerald-400" />
            <span className="text-sm font-medium">Saldo Estimado (Caixa)</span>
         </div>
         <div className="text-2xl font-semibold text-zinc-50">R$ {summary.saldoEstimado.toFixed(2)}</div>
         <div className="text-xs text-zinc-500 mt-1">Realizado</div>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
         <div className="flex items-center gap-3 mb-2 text-zinc-400">
            <ArrowUpRight size={18} className="text-sky-400" />
            <span className="text-sm font-medium">A Receber Pendente</span>
         </div>
         <div className="text-2xl font-semibold text-zinc-50">R$ {summary.receitaPendente.toFixed(2)}</div>
         <div className="text-xs text-zinc-500 mt-1">Previsto (Apenas Receitas)</div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
         <div className="flex items-center gap-3 mb-2 text-zinc-400">
            <ArrowDownRight size={18} className="text-red-400" />
            <span className="text-sm font-medium">Contas a Pagar</span>
         </div>
         <div className="text-2xl font-semibold text-zinc-50">R$ {summary.contasAPagar.toFixed(2)}</div>
         <div className="text-xs text-zinc-500 mt-1">Agendadas / Atrasadas</div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
         <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-zinc-400">
               <TrendingUp size={18} className="text-amber-400" />
               <span className="text-sm font-medium">Despesas Pagas</span>
            </div>
         </div>
         <div className="text-2xl font-semibold text-zinc-50">R$ {summary.despesasPagas.toFixed(2)}</div>
         <div className="text-xs text-zinc-500 mt-1">Realizado</div>
      </div>
    </div>
  );
}
