import { Wallet, CreditCard, Landmark, Banknote, Clock } from 'lucide-react';
import { OrderStatus } from '../../domain/types';

interface PaymentSelectorProps {
  method: string;
  status: OrderStatus;
  onChangeMethod: (m: string) => void;
  onChangeStatus: (s: OrderStatus) => void;
}

export function PaymentSelector({ method, status, onChangeMethod, onChangeStatus }: PaymentSelectorProps) {
  const methods = [
    { id: 'PIX', label: 'PIX', icon: Landmark },
    { id: 'Cartão de Crédito', label: 'Crédito', icon: CreditCard },
    { id: 'Cartão de Débito', label: 'Débito', icon: CreditCard },
    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
    { id: 'Boleto 30d', label: 'Boleto 30d', icon: Clock },
    { id: 'A Prazo', label: 'A Prazo (B2B)', icon: Wallet },
  ];

  const statuses = [
    { id: 'Pago' as OrderStatus, label: 'Pago Agora' },
    { id: 'Pendente' as OrderStatus, label: 'Pendente' },
    { id: 'Parcial' as OrderStatus, label: 'Pag. Parcial' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-3">Forma de Pagamento</label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {methods.map(m => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMethod(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  active 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <Icon size={16} className={active ? 'text-emerald-400' : 'text-zinc-500'} />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-3">Status do Pagamento</label>
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {statuses.map(s => (
            <button
              key={s.id}
              onClick={() => onChangeStatus(s.id)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                status === s.id 
                  ? 'bg-zinc-800 text-zinc-50 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
