import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { Play } from 'lucide-react';

export function DemandList({ onProduce }: { onProduce?: (productId: string, qty: number) => void }) {
  const { advancedProductionRepo } = useRepositories();
  const [demand, setDemand] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemand();
  }, []);

  async function loadDemand() {
    setLoading(true);
    try {
      const data = await advancedProductionRepo.getProductionDemand();
      setDemand(data);
    } catch(e) {}
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Demanda e Lotes Sugeridos</h3>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-zinc-500">Calculando demanda...</div>
        ) : demand.length === 0 ? (
           <div className="p-8 text-center text-zinc-500">Sem demandas pendentes no momento.</div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                 <th className="px-6 py-4 font-medium">Produto</th>
                 <th className="px-6 py-4 font-medium text-right">Pedidos</th>
                 <th className="px-6 py-4 font-medium text-right">Assinaturas</th>
                 <th className="px-6 py-4 font-medium text-right">Estoque</th>
                 <th className="px-6 py-4 font-medium text-right">Sugestão Produção</th>
                 <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {demand.map(d => (
                <tr key={d.id} className="hover:bg-zinc-800/50 transition-colors">
                   <td className="px-6 py-4">
                     <div className="font-medium text-white">{d.product}</div>
                   </td>
                   <td className="px-6 py-4 text-right text-amber-500 font-medium">
                      {d.pendingOrders} un
                   </td>
                   <td className="px-6 py-4 text-right text-emerald-500 font-medium">
                      {d.pendingSubscriptions} un
                   </td>
                   <td className="px-6 py-4 text-right text-zinc-500">
                      {d.currentStock} un
                   </td>
                   <td className="px-6 py-4 text-right font-medium text-white">
                      {d.suggestedProduction} KG
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button onClick={() => onProduce?.(d.product, d.suggestedProduction)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-amber-950 font-medium text-xs rounded transition-colors ml-auto">
                        <Play size={14} /> Produzir
                     </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
