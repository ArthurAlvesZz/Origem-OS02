import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { useRepositories } from '../repositories/RepositoryProvider';
import { 
  CrmPipelineRecord, CrmStageRecord, CrmDealRecord, 
  CrmActivityRecord, CommunicationTemplateRecord, CommunicationQueueRecord 
} from '../repositories/interfaces/ICrmRepository';
import { Users, Kanban, History, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export function Crm() {
  const { crmRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'activities' | 'templates' | 'queue'>('pipeline');
  const [isLoading, setIsLoading] = useState(true);

  const [pipelines, setPipelines] = useState<CrmPipelineRecord[]>([]);
  const [deals, setDeals] = useState<CrmDealRecord[]>([]);
  const [activities, setActivities] = useState<CrmActivityRecord[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplateRecord[]>([]);
  const [queues, setQueues] = useState<CommunicationQueueRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'pipeline') {
         const p = await crmRepo.getPipelines();
         setPipelines(p);
         if (p.length > 0) {
           const d = await crmRepo.getDeals(p[0].id);
           setDeals(d);
         }
      }
      if (activeTab === 'activities') {
         const a = await crmRepo.getActivities();
         setActivities(a);
      }
      if (activeTab === 'templates') {
         const t = await crmRepo.getTemplates();
         setTemplates(t);
      }
      if (activeTab === 'queue') {
         const q = await crmRepo.getCommunications();
         setQueues(q);
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do CRM", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateSend = async (id: string, recipient: string, body: string) => {
    try {
      await crmRepo.markCommunicationSimulated(id);
      
      // WhatsApp link fallback logic simulation
      alert(`Mensagem simulada enviada com sucesso no sistema.\nNa vida real, usaria a API do provider.\nSe quiser abrir o WhatsApp agora, acesse: https://wa.me/${recipient.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`);
      
      fetchData();
    } catch(e) {
      alert("Erro ao simular");
    }
  };

  const renderPipeline = () => {
    if (pipelines.length === 0) return <div className="text-zinc-500">Nenhum funil configurado.</div>;
    const p = pipelines[0];
    const stages = p.stages || [];

    return (
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {stages.map(stage => (
          <div key={stage.id} className="min-w-[300px] w-[300px] flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-heading font-medium text-white flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 {stage.name}
               </h3>
               <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                 {deals.filter(d => d.stageId === stage.id).length}
               </span>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-3 flex-1 min-h-[400px]">
               {deals.filter(d => d.stageId === stage.id).map(deal => (
                 <div key={deal.id} className="bg-zinc-900 border border-zinc-700/50 hover:border-zinc-500 rounded-lg p-4 cursor-pointer transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-zinc-100 line-clamp-2">{deal.title}</div>
                    </div>
                    {deal.value > 0 && (
                      <div className="text-xs text-zinc-400 font-mono mb-3">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                       <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold
                         ${deal.status === 'open' ? 'bg-amber-500/10 text-amber-500' : deal.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                       `}>
                          {deal.status}
                       </span>
                       <span className="text-[10px] text-zinc-500">
                         {new Date(deal.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                 </div>
               ))}
               
               {deals.filter(d => d.stageId === stage.id).length === 0 && (
                 <div className="text-center text-zinc-600 text-xs py-8 border-2 border-dashed border-zinc-800 rounded-lg">
                   Etapa vazia
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQueue = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
             <th className="p-4 font-medium">Data</th>
             <th className="p-4 font-medium">Destinatário</th>
             <th className="p-4 font-medium">Canal</th>
             <th className="p-4 font-medium">Status / Provider</th>
             <th className="p-4 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {queues.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12">
                 <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                      <MessageSquare className="text-zinc-500" size={20} />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">Nenhuma mensagem na fila</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">Suas campanhas e interações por email ou WhatsApp aparecerão aqui.</p>
                 </div>
              </td>
            </tr>
          )}
          {queues.map(q => (
            <tr key={q.id} className="hover:bg-zinc-800/20 transition-colors group">
              <td className="p-4 text-zinc-400 text-sm">{new Date(q.createdAt).toLocaleDateString()}</td>
              <td className="p-4">
                 <div className="font-medium text-zinc-100">{q.recipient}</div>
                 <div className="text-xs text-zinc-500 truncate max-w-[200px] mt-1">{q.renderedBody}</div>
              </td>
              <td className="p-4">
                 <span className="flex items-center gap-1 text-xs text-zinc-300">
                    <MessageSquare size={14} className="text-zinc-500"/> {q.channel}
                 </span>
              </td>
              <td className="p-4">
                 <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${q.status === 'sent' || q.status === 'simulated' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : q.status === 'draft' || q.status === 'queued' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {q.status}
                    </span>
                    <span className="text-[10px] text-zinc-500">via {q.provider}</span>
                 </div>
              </td>
              <td className="p-4 text-right">
                 {q.status === 'draft' && (
                    <button onClick={() => handleSimulateSend(q.id, q.recipient, q.renderedBody)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-amber-950 font-medium text-xs rounded transition-colors ml-auto">
                      <Send size={14} /> Simular
                    </button>
                 )}
                 {q.status === 'simulated' && (
                    <span className="text-xs text-emerald-500 flex items-center justify-end gap-1"><CheckCircle2 size={14} /> Resolvido</span>
                 )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <PageHeader 
        title="CRM & Automações" 
        description="Gestão de leads, follow-ups de vendas, pagamentos pendentes e fila de comunicação." 
      />

      <div className="flex overflow-x-auto pb-2 border-b border-zinc-800 gap-6 no-scrollbar">
        <button onClick={() => setActiveTab('pipeline')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'pipeline' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Kanban size={16} /> Pipeline de Vendas
           {activeTab === 'pipeline' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('activities')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'activities' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <History size={16} /> Atividades & Tarefas
           {activeTab === 'activities' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('queue')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'queue' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Send size={16} /> Fila de Mensagens (Mock)
           {activeTab === 'queue' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
      </div>

      <div className="min-h-[400px]">
         {activeTab === 'pipeline' && renderPipeline()}
         {activeTab === 'queue' && renderQueue()}
         {activeTab === 'activities' && (
           <div className="text-zinc-500 text-sm">Histórico de Atividades (em construção).</div>
         )}
      </div>

    </div>
  );
}
