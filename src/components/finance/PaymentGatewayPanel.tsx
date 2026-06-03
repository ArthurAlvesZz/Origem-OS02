import { useState, useEffect } from 'react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { PaymentIntentRecord, PaymentProviderConfigRecord } from '../../repositories/interfaces/IPaymentRepository';
import { CreditCard, CheckCircle2, XCircle, RotateCcw, MonitorPlay, AlertTriangle } from 'lucide-react';

export function PaymentGatewayPanel() {
  const { paymentRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState<'intents'|'config'|'webhooks'>('intents');
  const [intents, setIntents] = useState<PaymentIntentRecord[]>([]);
  const [config, setConfig] = useState<PaymentProviderConfigRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const pIntents = await paymentRepo.getIntents();
      setIntents(pIntents);
      const conf = await paymentRepo.getProviderConfig();
      setConfig(conf);
    } catch (e) {
      console.warn("Erro ao carregar pagamentos", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await paymentRepo.markAsPaidManual(id);
      fetchData(); // refresh
    } catch(e) {
      alert("Erro ao marcar como pago");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await paymentRepo.cancelIntent(id);
      fetchData();
    } catch(e) {
      alert("Erro ao cancelar intention");
    }
  };

  const renderConfig = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
       <h3 className="font-heading font-medium text-white mb-4">Configuração do Gateway</h3>
       <div className="space-y-4 max-w-sm">
         <div>
           <label className="block text-xs font-medium text-zinc-500 mb-1">Provider</label>
           <select 
             className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-zinc-300 pointer-events-none opacity-70"
             value={config?.provider || 'mock'}
             disabled
           >
             <option value="mock">Simulado (Mock/Sandbox)</option>
             <option value="manual">Manual (Offline/Depósito)</option>
             <option value="stripe">Stripe</option>
           </select>
           <p className="text-[10px] text-zinc-500 mt-1">* A implementação de gateways de pagamento online reais requer configuração externa via variáveis de ambiente seguras.</p>
         </div>
         <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Public Label</label>
            <input 
              readOnly
              value={config?.publicLabel || 'Pagamento Seguro'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-zinc-300 pointer-events-none opacity-70" 
            />
         </div>
       </div>
    </div>
  );

  const renderIntents = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium">ID da Intenção</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
                {intents.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-zinc-500 text-sm">Nenhuma intenção de pagamento encontrada.</td></tr>
                )}
                {intents.map(i => (
                    <tr key={i.id} className="hover:bg-zinc-800/20 transition-colors group">
                        <td className="p-4 text-zinc-400 text-sm">{new Date(i.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 font-medium text-zinc-100">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: i.currency }).format(i.amount)}
                        </td>
                        <td className="p-4 text-xs font-mono text-zinc-500">{i.id.slice(0,13)}...</td>
                        <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${i.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : i.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                {i.status}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                           {i.status === 'pending' && (
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleMarkPaid(i.id)} className="p-1 px-2 text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-emerald-950 rounded transition-colors font-medium">Baixar e Reconciliar</button>
                                <button onClick={() => handleCancel(i.id)} className="p-1 px-2 text-xs bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500 hover:text-zinc-50 font-medium rounded transition-colors">Cancelar</button>
                             </div>
                           )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="flex overflow-x-auto pb-2 border-b border-zinc-800 gap-6 no-scrollbar">
            <button 
                onClick={() => setActiveTab('intents')}
                className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'intents' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
               <CreditCard size={16} /> Intenções de Pagamento (Checkout)
               {activeTab === 'intents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
            </button>
            <button 
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'config' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
               <MonitorPlay size={16} /> Gateway
               {activeTab === 'config' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
            </button>
        </div>

        {activeTab === 'intents' && renderIntents()}
        {activeTab === 'config' && renderConfig()}
    </div>
  );
}
