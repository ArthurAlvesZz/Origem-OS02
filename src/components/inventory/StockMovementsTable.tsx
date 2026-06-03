import { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpToLine, Settings2, Ban } from 'lucide-react';
import { MovementType, StockMovement } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';

export function StockMovementsTable() {
  const { inventoryRepo } = useRepositories();
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    inventoryRepo.getMovements().then(setStockMovements);
  }, [inventoryRepo]);

  const getIconAndColor = (type: MovementType) => {
    switch (type) {
      case 'Entrada': return { Icon: ArrowDownToLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'Saída': return { Icon: ArrowUpToLine, color: 'text-sky-400', bg: 'bg-sky-500/10' };
      case 'Perda': return { Icon: Ban, color: 'text-red-400', bg: 'bg-red-500/10' };
      case 'Ajuste': return { Icon: Settings2, color: 'text-amber-400', bg: 'bg-amber-500/10' };
      default: return { Icon: Settings2, color: 'text-zinc-400', bg: 'bg-zinc-800' };
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="font-medium text-zinc-50">Últimas Movimentações</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Data</th>
              <th className="px-6 py-4 font-medium">Tipo</th>
              <th className="px-6 py-4 font-medium">Produto</th>
              <th className="px-6 py-4 font-medium text-right">Qtd</th>
              <th className="px-6 py-4 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {stockMovements.slice(0, 50).map((m) => {
              const { Icon, color, bg } = getIconAndColor(m.type);
              return (
                <tr key={m.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${bg} ${color}`}>
                      <Icon size={14} />
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-50">{m.product}</td>
                  <td className={`px-6 py-4 text-right font-medium tabular-nums ${m.qty > 0 ? 'text-emerald-400' : m.qty < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                    {m.qty > 0 ? '+' : ''}{m.qty}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{m.reason}</td>
                </tr>
              );
            })}
            
            {stockMovements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
