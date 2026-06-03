import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Plus, Search } from 'lucide-react';
import { NewConsignmentDrawer } from '../components/consignments/NewConsignmentDrawer';
import { SettlementDrawer } from '../components/consignments/SettlementDrawer';
import { Consignment } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';

export function Consignacao() {
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [settleConsignment, setSettleConsignment] = useState<Consignment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { consignmentRepo } = useRepositories();
  const [consignments, setConsignments] = useState<Consignment[]>([]);

  useEffect(() => {
    consignmentRepo.getConsignments().then(setConsignments);
  }, [consignmentRepo, refreshKey]);

  const handleComplete = () => {
    setIsNewDrawerOpen(false);
    setSettleConsignment(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" key={refreshKey}>
      <PageHeader 
        title="Consignação Lite" 
        description="Controle simples de envios e acertos mensais em parceiros." 
        action={
          <button 
            onClick={() => setIsNewDrawerOpen(true)}
            className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} /> Nova Remessa
          </button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar parceiro..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Parceiro</th>
                <th className="px-6 py-4 font-medium">Vencimento</th>
                <th className="px-6 py-4 font-medium text-right">Qtd. Enviada</th>
                <th className="px-6 py-4 font-medium text-right">Potencial (R$)</th>
                <th className="px-6 py-4 font-medium text-right">Já Vendido</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {consignments.map((c: Consignment) => {
                const totalSent = c.items.reduce((acc, i) => acc + i.qtySent, 0);
                const isClosed = c.status === 'Fechada';
                
                let variant: any = 'info';
                if (c.status === 'Fechada') variant = 'success';
                else if (c.status === 'Vencendo' || c.status === 'Vencida') variant = 'error';
                else if (c.status === 'Parcial') variant = 'warning';

                return (
                  <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-50">{c.partnerName}</td>
                    <td className="px-6 py-4">{new Date(c.dueDate).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right font-medium">{totalSent} un</td>
                    <td className="px-6 py-4 text-right text-emerald-400">R$ {c.expectedTotal.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-zinc-400">R$ {c.soldTotal.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} variant={variant} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isClosed ? (
                        <button 
                          onClick={() => setSettleConsignment(c)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-xs font-semibold text-zinc-50 transition-colors"
                        >
                          Lançar Acerto
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-medium text-xs">Finalizado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isNewDrawerOpen && (
        <NewConsignmentDrawer onClose={() => setIsNewDrawerOpen(false)} onComplete={handleComplete} />
      )}

      {settleConsignment && (
        <SettlementDrawer 
          consignment={settleConsignment} 
          onClose={() => setSettleConsignment(null)} 
          onComplete={handleComplete} 
        />
      )}
    </div>
  );
}
