import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { useRepositories } from '../repositories/RepositoryProvider';
import { StorefrontPlan, SubscriptionRequestRecord, SubscriptionRecord } from '../repositories/interfaces/IStorefrontRepository';
import { Coffee, Tag, Plus, CheckCircle2, XCircle, RotateCcw, Search, ExternalLink, Calendar, PauseCircle } from 'lucide-react';

type Tab = 'overview' | 'plans' | 'requests' | 'active';

export function AssinaturasAdmin() {
  const { storefrontRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const [plans, setPlans] = useState<StorefrontPlan[]>([]);
  const [requests, setRequests] = useState<SubscriptionRequestRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'plans' || activeTab === 'overview') {
        const res = await storefrontRepo.getPlans();
        setPlans(res);
      }
      if (activeTab === 'requests' || activeTab === 'overview') {
        const res = await storefrontRepo.getRequests();
        setRequests(res);
      }
      if (activeTab === 'active' || activeTab === 'overview') {
        const res = await storefrontRepo.getSubscriptions();
        setSubscriptions(res);
      }
    } catch (e) {
      console.warn("Erro ao buscar dados de assinaturas", e);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Coffee },
    { id: 'plans', label: 'Planos', icon: Tag },
    { id: 'requests', label: 'Solicitações (Leads)', icon: RotateCcw },
    { id: 'active', label: 'Ativas', icon: CheckCircle2 },
  ];

  const handleUpdateReqStatus = async (id: string, status: string) => {
    try {
      await storefrontRepo.updateRequestStatus(id, status);
      fetchData();
    } catch (e) {
      alert('Erro ao atualizar status');
    }
  };

  const handleUpdateSubStatus = async (id: string, status: string) => {
     try {
       await storefrontRepo.updateSubscriptionStatus(id, status);
       fetchData();
     } catch (e) {
       alert('Erro ao atualizar status');
     }
  };

  const renderOverview = () => {
     const pendingReqs = requests.filter(r => r.status === 'pending').length;
     const activeSubs = subscriptions.filter(s => s.status === 'active').length;
     return (
       <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-zinc-500 text-sm mb-2 flex items-center gap-2"><RotateCcw size={16}/> Solicitações Pendentes</div>
              <div className="text-3xl font-heading font-semibold text-zinc-50">{pendingReqs}</div>
           </div>
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-zinc-500 text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Assinaturas Ativas</div>
              <div className="text-3xl font-heading font-semibold text-zinc-50">{activeSubs}</div>
           </div>
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
              <div className="relative">
                <div className="text-amber-500/80 text-sm mb-2 flex items-center gap-2"><ExternalLink size={16}/> Loja Pública</div>
                <div className="text-lg font-heading font-medium text-amber-500 mt-2">Visitar Storefront B2C</div>
                <a href="/loja" target="_blank" className="absolute inset-0 z-10"></a>
              </div>
           </div>
         </div>
       </div>
     );
  };

  const renderPlans = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h3 className="font-heading font-semibold text-zinc-50 flex items-center gap-2">Planos de Assinatura</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-amber-950 font-medium text-sm rounded-lg transition-colors">
          <Plus size={16} /> Novo Plano
        </button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
             <th className="p-4 font-medium">Plano / Frequência</th>
             <th className="p-4 font-medium">Preço</th>
             <th className="p-4 font-medium">Quantidade</th>
             <th className="p-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {plans.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12">
                 <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                      <Tag className="text-zinc-500" size={20} />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">Nenhum plano configurado</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">Adicione planos de assinatura para exibi-los na loja pública.</p>
                 </div>
              </td>
            </tr>
          )}
          {plans.map(p => (
            <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
              <td className="p-4">
                <div className="font-medium text-zinc-100">{p.name}</div>
                <div className="text-xs text-zinc-500 capitalize">{p.frequency}</div>
              </td>
              <td className="p-4 text-zinc-300">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
              </td>
              <td className="p-4 text-zinc-400 text-sm">
                {p.packageCount}x {p.weight ? p.weight + 'g' : ''}
              </td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${p.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                  {p.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRequests = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
             <th className="p-4 font-medium">Data</th>
             <th className="p-4 font-medium">Cliente</th>
             <th className="p-4 font-medium">Contato</th>
             <th className="p-4 font-medium">Plano ID</th>
             <th className="p-4 font-medium">Status</th>
             <th className="p-4 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12">
                 <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                      <ExternalLink className="text-zinc-500" size={20} />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">Nenhuma solicitação pendente</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">Os pedidos de assinatura da Loja B2C aparecerão aqui para aprovação manual (mock).</p>
                 </div>
              </td>
            </tr>
          )}
          {requests.map(r => (
            <tr key={r.id} className="hover:bg-zinc-800/20 transition-colors group">
              <td className="p-4 text-zinc-400 text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td className="p-4 font-medium text-zinc-100">{r.customerName}</td>
              <td className="p-4 text-sm text-zinc-400">{r.customerEmail}<br/>{r.customerPhone}</td>
              <td className="p-4 text-sm text-zinc-400 font-mono">{r.planId.slice(0,8)}</td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${r.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {r.status}
                </span>
              </td>
              <td className="p-4 text-right">
                {r.status === 'pending' && (
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleUpdateReqStatus(r.id, 'approved')} className="p-1 px-2 text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-emerald-950 rounded transition-colors font-medium">Aprovar Forma</button>
                    <button onClick={() => handleUpdateReqStatus(r.id, 'rejected')} className="p-1 px-2 text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-red-950 rounded transition-colors font-medium">Recusar</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
             <th className="p-4 font-medium">Início</th>
             <th className="p-4 font-medium">Cliente</th>
             <th className="p-4 font-medium">Plano</th>
             <th className="p-4 font-medium">Status</th>
             <th className="p-4 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
           {subscriptions.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12">
                 <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                      <RotateCcw className="text-zinc-500" size={20} />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">Nenhuma assinatura ativa</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">As assinaturas aprovadas de clientes aparecerão aqui.</p>
                 </div>
              </td>
            </tr>
          )}
           {subscriptions.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-800/20 transition-colors group">
                 <td className="p-4 text-zinc-400 text-sm">
                   {new Date(s.startedAt).toLocaleDateString()}
                 </td>
                 <td className="p-4 font-medium text-zinc-100">{s.customerName}</td>
                 <td className="p-4 text-sm text-zinc-300">{s.planName}</td>
                 <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : s.status === 'paused' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {s.status}
                    </span>
                 </td>
                 <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {s.status === 'active' ? (
                        <button onClick={() => handleUpdateSubStatus(s.id, 'paused')} className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors" title="Pausar"><PauseCircle size={16}/></button>
                      ) : s.status === 'paused' ? (
                        <button onClick={() => handleUpdateSubStatus(s.id, 'active')} className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors" title="Reativar"><CheckCircle2 size={16}/></button>
                      ) : null}
                      <button onClick={() => handleUpdateSubStatus(s.id, 'cancelled')} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Cancelar"><XCircle size={16}/></button>
                    </div>
                 </td>
              </tr>
           ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Clube de Assinatura COFCOF" 
        description="Gestão de planos, aprovação de leads B2C e carteira de assinantes." 
      />

      <div className="flex overflow-x-auto pb-2 border-b border-zinc-800 mb-6 gap-6 no-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
                isActive ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={16} />
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'plans' && renderPlans()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'active' && renderSubscriptions()}
      </div>

    </div>
  );
}
