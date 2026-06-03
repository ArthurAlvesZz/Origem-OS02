import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuItem } from '../domain/digitalMenu';
import { Order } from '../domain/types';
import { PageHeader } from '../components/ui/PageHeader';
import { QrCode, Link as LinkIcon, Plus, Store, Check, Target, Settings, Layers, Package, ShoppingBag } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export function DigitalMenu() {
  const { digitalMenuRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'items' | 'orders' | 'settings'>('overview');
  const [config, setConfig] = useState<DigitalMenuConfig | null>(null);
  const [categories, setCategories] = useState<DigitalMenuCategory[]>([]);
  const [items, setItems] = useState<DigitalMenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mpStatus, setMpStatus] = useState<{ connected: boolean; status?: string; mode?: string; publicKey?: string } | null>(null);

  useEffect(() => {
    loadData();
    checkMpStatus();
  }, []);

  const checkMpStatus = async () => {
    try {
      const res = await fetch('/api/payments/mercadopago/status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }
      });
      const data = await res.json();
      if (data.connected !== undefined) setMpStatus(data);
    } catch(e) {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [_config, _cats, _items, _orders] = await Promise.all([
        digitalMenuRepo.getConfig(),
        digitalMenuRepo.getCategories(),
        digitalMenuRepo.getItems(),
        digitalMenuRepo.getOrders()
      ]);
      setConfig(_config);
      setCategories(_cats);
      setItems(_items);
      setOrders(_orders);
    } catch (e) {
      console.error('Failed to load digital menu data', e);
    } finally {
      setLoading(false);
    }
  };

  const updateConfigStatus = async (isOpen: boolean) => {
    if (!config) return;
    const updated = await digitalMenuRepo.updateConfig({ isOpen });
    setConfig(updated);
  };

  const copyLink = () => {
    if (!config?.slug) return;
    const url = `${window.location.origin}/menu/${config.slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado: ' + url);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando Cardápio Digital...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cardápio Digital"
        description="Gerencie seu cardápio público e pedidos online"
        action={
          <button 
            onClick={() => window.open(`/menu/${config?.slug || 'demo'}`, '_blank')}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Store size={18} />
            Ver Cardápio
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex bg-zinc-900 overflow-x-auto p-1 border border-zinc-800/50 rounded-xl max-w-fit">
         {[
           { id: 'overview', label: 'Visão Geral', icon: Target },
           { id: 'categories', label: 'Categorias', icon: Layers },
           { id: 'items', label: 'Itens', icon: Package },
           { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
           { id: 'settings', label: 'Configurações', icon: Settings },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
               activeTab === tab.id
                 ? 'bg-zinc-800 text-amber-500 shadow-sm'
                 : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
             }`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
               <div className="relative z-10 flex flex-col items-start gap-4">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${config?.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                   <h3 className="text-xl font-heading font-medium text-zinc-50">{config?.publicName || 'Cardápio Digital'}</h3>
                 </div>
                 
                 <p className="text-zinc-400 text-sm max-w-md">
                   Seu cardápio está {config?.isOpen ? 'aberto para receber pedidos' : 'fechado temporariamente'}. 
                   Compartilhe o link abaixo com seus clientes.
                 </p>
                 
                 <div className="flex items-center gap-2 w-full max-w-sm mt-2">
                   <div className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 rounded-lg font-mono text-sm truncate">
                     {window.location.host}/menu/{config?.slug || 'demo'}
                   </div>
                   <button onClick={copyLink} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors">
                     <LinkIcon size={18} />
                   </button>
                 </div>

                 <div className="flex gap-3 mt-4">
                   <button 
                     onClick={() => updateConfigStatus(!config?.isOpen)}
                     className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                       config?.isOpen 
                         ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                         : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                     }`}
                   >
                     {config?.isOpen ? 'Pausar Pedidos' : 'Abrir Cardápio'}
                   </button>
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
               <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-4">Métricas Hoje</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-zinc-300 text-sm">Pedidos Totais</span>
                   <span className="text-zinc-50 font-medium">{orders.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-zinc-300 text-sm">Faturamento</span>
                   <span className="text-amber-500 font-medium font-mono">
                     R$ {orders.reduce((acc, o) => acc + o.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-medium text-zinc-50">Pedidos Recentes</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Nenhum pedido recebido ainda.</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-zinc-50 font-medium">{order.customer || 'Cliente'}</span>
                      <StatusBadge status={order.status as any} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                      <span>{order.id}</span>
                      <span>•</span>
                      <span>{order.items} itens</span>
                      <span>•</span>
                      <span className="text-amber-500">R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'received' && (
                      <button 
                        onClick={() => digitalMenuRepo.updateOrderStatus(order.id, 'preparing').then(loadData)}
                        className="bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Aceitar
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => digitalMenuRepo.updateOrderStatus(order.id, 'ready').then(loadData)}
                        className="bg-sky-600/20 text-sky-500 hover:bg-sky-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Marcar Pronto
                      </button>
                    )}
                    {(order.status === 'ready' || order.status === 'out_for_delivery') && (
                      <button 
                        onClick={() => digitalMenuRepo.updateOrderStatus(order.id, 'delivered').then(loadData)}
                        className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6">
          <h3 className="font-medium text-zinc-50 mb-4">Categorias do Cardápio</h3>
          <p className="text-zinc-400 text-sm mb-6">Cadastre as categorias para organizar seu cardápio (ex: Bebidas, Lanches)</p>
          <div className="divide-y divide-zinc-800">
            {categories.map(c => (
              <div key={c.id} className="py-3 flex justify-between items-center text-sm">
                <span className="text-zinc-300 font-medium">{c.name}</span>
                <span className="text-zinc-500 text-xs px-2 py-1 bg-zinc-800 rounded">{c.active ? 'Ativa' : 'Inativa'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6">
          <h3 className="font-medium text-zinc-50 mb-4">Itens do Cardápio</h3>
          <p className="text-zinc-400 text-sm mb-6">Produtos disponíveis para venda online.</p>
          <div className="divide-y divide-zinc-800">
            {items.map(i => (
              <div key={i.id} className="py-3 flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-zinc-300 font-medium">{i.name}</span>
                  <span className="text-zinc-500 text-xs">R$ {i.price.toFixed(2)}</span>
                </div>
                <span className="text-zinc-500 text-xs px-2 py-1 bg-zinc-800 rounded">{i.active ? 'Ativo' : 'Inativo'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6">
          <h3 className="font-medium text-zinc-50 mb-4">Configurações Base</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nome Público</label>
                <input type="text" value={config?.publicName || ''} onChange={(e) => setConfig(prev => prev ? {...prev, publicName: e.target.value} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Taxa de Entrega (R$)</label>
                <input type="number" step="0.01" value={config?.deliveryFee || 0} onChange={(e) => setConfig(prev => prev ? {...prev, deliveryFee: parseFloat(e.target.value)} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tempo Médio Preparo (min)</label>
                <input type="number" value={config?.estimatedPrepMinutes || 0} onChange={(e) => setConfig(prev => prev ? {...prev, estimatedPrepMinutes: parseInt(e.target.value, 10)} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Provedor de Pagamento</label>
                <select value={config?.paymentProvider || 'manual_pix'} onChange={(e) => setConfig(prev => prev ? {...prev, paymentProvider: e.target.value} : null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none">
                  <option value="manual_pix">PIX Manual / Offline</option>
                  <option value="mercadopago">Mercado Pago (Checkout Pro)</option>
                </select>
              </div>
              
              {(!config?.paymentProvider || config.paymentProvider === 'manual_pix') ? (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Chave PIX Manual</label>
                  <input type="text" value={config?.pixKeyManual || ''} onChange={(e) => setConfig(prev => prev ? {...prev, pixKeyManual: e.target.value} : null)} placeholder="ex: CNPJ, Email ou Celular" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:border-amber-500 focus:outline-none" />
                  <p className="text-[10px] text-zinc-500 mt-1">Esta chave será exibida para o cliente copiar e colar. A baixa é manual.</p>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950 border border-amber-900/30 rounded-lg">
                  <p className="text-sm text-zinc-300 mb-2 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Mercago Pago Checkout Pro
                  </p>
                  
                  {mpStatus?.status === 'not_configured' || mpStatus?.status === 'disconnected' ? (
                    <div className="mt-2 space-y-3">
                      <p className="text-xs text-zinc-400">Conta não conectada. Permite receber cartões e PIX dinâmico.</p>
                      <button 
                         onClick={async () => {
                           try {
                             const res = await fetch('/api/payments/mercadopago/connect-url', { headers: { 'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }});
                             const data = await res.json();
                             if (data.url) window.location.href = data.url;
                             else if (data.error) alert(`Erro: ${data.message || data.error}`);
                           } catch(e) { alert('Erro ao iniciar conexão.'); }
                         }}
                         className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                         Conectar Integrador
                      </button>
                    </div>
                  ) : mpStatus?.status === 'missing_encryption_key' ? (
                     <div className="mt-2 space-y-3">
                        <p className="text-xs text-red-400 font-medium tracking-wide uppercase">Falha de Segurança no Servidor</p>
                        <p className="text-xs text-zinc-400">A chave de criptografia de pagamentos não está configurada no servidor. Por segurança, a integração Mercado Pago está desabilitada.</p>
                     </div>
                  ) : mpStatus?.connected ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-emerald-500 font-medium tracking-wide uppercase">
                        Conectado ({mpStatus.mode}) 
                        {mpStatus.status === 'token_expiring' && <span className="text-amber-500 ml-2">⚠️ Expirando</span>}
                        {mpStatus.status === 'expired' && <span className="text-red-500 ml-2">⚠️ Expirado</span>}
                      </p>
                      <button 
                        onClick={() => {
                          fetch('/api/payments/mercadopago/disconnect', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }})
                            .then(() => checkMpStatus());
                        }}
                        className="text-xs text-red-400 underline hover:text-red-300"
                      >
                        Desconectar Conta
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2"><p className="text-xs text-zinc-500">Carregando status...</p></div>
                  )}
                </div>
              )}
              
              <div className="pt-4 border-t border-zinc-800">
                <button 
                  onClick={() => config && digitalMenuRepo.updateConfig(config).then(res => alert('Salvo!'))}
                  className="bg-amber-600 hover:bg-amber-500 text-amber-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
