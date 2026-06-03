import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { CashFlowData } from '../../repositories/interfaces/IFinancialRepository';

export function CashFlowPanel({ refreshKey }: { refreshKey?: number }) {
  const { financialRepo } = useRepositories();
  const [cf7, setCf7] = useState<CashFlowData | null>(null);
  const [cf30, setCf30] = useState<CashFlowData | null>(null);

  useEffect(() => {
    financialRepo.calculateCashFlow(7).then(setCf7);
    financialRepo.calculateCashFlow(30).then(setCf30);
  }, [financialRepo, refreshKey]);

  if (!cf7 || !cf30) return null;

  const Card = ({ data }: { data: any }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4 max-w-sm w-full">
      <h4 className="text-zinc-50 font-medium mb-4">Projeção: {data.period}</h4>
      <div className="space-y-3">
         <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Saldo Atual (Caixa Livre)</span>
            <span className="text-zinc-300 font-mono">R$ {data.saldoAtual.toFixed(2)}</span>
         </div>
         <div className="flex justify-between text-sm border-t border-zinc-800 pt-2 border-dashed">
            <span className="text-emerald-400/80">(+) Entradas Previstas</span>
            <span className="text-emerald-400 font-mono">R$ {data.projectedIn.toFixed(2)}</span>
         </div>
         <div className="flex justify-between text-sm border-b border-zinc-800 pb-2 border-dashed">
            <span className="text-red-400/80">(-) Saídas Previstas</span>
            <span className="text-red-400 font-mono">R$ {data.projectedOut.toFixed(2)}</span>
         </div>
         <div className="flex justify-between font-medium pt-1">
            <span className="text-zinc-300">Saldo Projetado</span>
            <span className={`font-mono text-lg ${data.projectedBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
               R$ {data.projectedBalance.toFixed(2)}
            </span>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      <Card data={cf7} />
      <Card data={cf30} />
    </div>
  );
}
