import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import { FinancialTransaction } from '../../domain/types';

interface AccountsPayableTableProps {
  payables: FinancialTransaction[];
  onMarkPaid: (id: string) => void;
}

export function AccountsPayableTable({ payables, onMarkPaid }: AccountsPayableTableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Data / Vcto</th>
              <th className="px-6 py-4 font-medium">Descrição</th>
              <th className="px-6 py-4 font-medium">Categoria</th>
              <th className="px-6 py-4 font-medium text-right">Valor</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {payables.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-50">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4">{t.description}</td>
                <td className="px-6 py-4"><span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">{t.category}</span></td>
                <td className="px-6 py-4 text-right font-medium text-red-400">- R$ {Math.abs(t.amount).toFixed(2)}</td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      t.status === 'Atrasado' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {t.status}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onMarkPaid(t.id)}
                    className="flex items-center justify-end gap-2 ml-auto text-emerald-400 hover:text-emerald-300 font-semibold text-xs"
                    title="Dar Baixa (Pagar)"
                  >
                    <CheckCircle2 size={16} /> Baixar
                  </button>
                </td>
              </tr>
            ))}
            {payables.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12">
                   <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                        <ArrowUpRight className="text-zinc-500" size={20} />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">Nenhuma conta a pagar</p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm">Os compromissos de pagamento aparecerão aqui quando forem lançados.</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
