import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { DREData } from '../../repositories/interfaces/IFinancialRepository';

export function SimpleDRE({ refreshKey }: { refreshKey?: number }) {
  const { financialRepo } = useRepositories();
  const [dre, setDre] = useState<DREData | null>(null);

  useEffect(() => {
    financialRepo.calculateSimpleDRE().then(setDre);
  }, [financialRepo, refreshKey]);

  if (!dre) return null;

  const formatLine = (value: number, isNegative = false) => {
     let color = 'text-zinc-50';
     if (isNegative && value > 0) color = 'text-red-400';
     else if (!isNegative && value > 0) color = 'text-emerald-400';
     
     const prefix = isNegative && value > 0 ? '- ' : '';
     return <span className={`font-mono text-sm tracking-tight ${color}`}>{prefix}R$ {value.toFixed(2)}</span>;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 max-w-3xl">
      <div className="p-6 border-b border-zinc-800">
         <h3 className="text-zinc-50 font-medium">Demonstrativo de Resultados (Gerencial)</h3>
         <p className="text-xs text-zinc-500 mt-1">Este modelo é simplificado usando custos estimados de produção. Não tem validade contábil ou fiscal.</p>
      </div>
      
      <div className="p-6 space-y-4">
         <div className="flex justify-between items-center py-2">
            <span className="text-zinc-300 font-medium">(+) Receita Bruta de Vendas</span>
            {formatLine(dre.receitaBruta)}
         </div>

         <div className="flex justify-between items-center py-2 pb-4 border-b border-zinc-800/50">
            <span className="text-zinc-400 pl-4">(-) CPV (Custo dos Produtos Vendidos) <span className="text-xs text-zinc-600 block">Baseado em Produção ou Insumos</span></span>
            {formatLine(dre.cpv, true)}
         </div>

         <div className="flex justify-between items-center py-2 pt-4 bg-zinc-950/30 px-4 rounded font-semibold">
            <span className="text-sky-400">(=) Lucro Bruto</span>
            {formatLine(dre.lucroBruto)}
         </div>
         <div className="text-right text-xs text-zinc-500 px-4 pb-4 border-b border-zinc-800/50">
            Margem Bruta: {dre.margemBruta.toFixed(1)}%
         </div>

         <div className="flex justify-between items-center py-2 pt-4">
            <span className="text-zinc-400 pl-4">(-) Despesas Operacionais <span className="text-xs text-zinc-600 block">Mão de obra, embalagem, infraestrutura</span></span>
            {formatLine(dre.despesasOperacionais, true)}
         </div>

         <div className="flex justify-between items-center py-4 mt-2 border-t-2 border-zinc-700 bg-emerald-500/5 px-4 rounded font-semibold shadow-inner">
            <span className="text-emerald-400 font-heading">(=) Resultado Operacional (Lucro Líquido Estimado)</span>
            <span className={`font-mono text-lg tracking-tight ${dre.resultadoOperacional >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {dre.resultadoOperacional.toFixed(2)}
            </span>
         </div>
         <div className="text-right text-xs text-emerald-500/70 px-4">
            Margem Operacional: {dre.margemOperacional.toFixed(1)}%
         </div>
      </div>
    </div>
  );
}
