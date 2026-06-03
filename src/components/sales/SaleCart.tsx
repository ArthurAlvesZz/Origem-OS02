import { Trash2, Minus, Plus } from 'lucide-react';
import { OrderItem } from '../../domain/types';

interface SaleCartProps {
  items: OrderItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function SaleCart({ items, onUpdateQty, onRemoveItem }: SaleCartProps) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
        <p className="text-sm text-zinc-500">Adicione produtos para iniciar a venda.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex-1">
            <div className="font-medium text-sm text-zinc-50">{item.name}</div>
            <div className="text-xs text-zinc-500 mt-1">R$ {item.unitPrice.toFixed(2)} cada</div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto">
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => onUpdateQty(item.productId, -1)}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-50 bg-zinc-900 rounded-md transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-medium focus:outline-none bg-transparent tabular-nums text-zinc-50">
                {item.qty}
              </span>
              <button 
                onClick={() => onUpdateQty(item.productId, 1)}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-50 bg-zinc-900 rounded-md transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-zinc-50 w-20 text-right">
                R$ {(item.qty * item.unitPrice).toFixed(2)}
              </div>
              <button 
                onClick={() => onRemoveItem(item.productId)}
                className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
