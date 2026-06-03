import { calculateOrderTotals } from '../../domain/orders';
import { OrderItem } from '../../domain/types';

interface SaleSummaryProps {
  items: OrderItem[];
}

export function SaleSummary({ items }: SaleSummaryProps) {
  const { subtotal, totalDiscount, total, marginPercent, margin } = calculateOrderTotals(items);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-50 mb-4 tracking-tight">Resumo da Venda</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {totalDiscount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Descontos</span>
            <span>- R$ {totalDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="pt-3 border-t border-zinc-800/50 flex justify-between items-end">
          <span className="font-medium text-zinc-300 mb-1">Total</span>
          <span className="text-2xl font-heading font-semibold text-zinc-50">
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800/50 bg-zinc-900/50 -mx-5 -mb-5 p-5 rounded-b-xl flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">Visão Executiva</div>
          <div className="text-xs text-zinc-400">Lucro Estimado: <span className="font-medium text-zinc-300">R$ {margin.toFixed(2)}</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">Margem Central</div>
          <div className={`text-sm font-semibold ${marginPercent >= 35 ? 'text-emerald-400' : marginPercent > 15 ? 'text-amber-400' : 'text-red-400'}`}>
            {marginPercent.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
