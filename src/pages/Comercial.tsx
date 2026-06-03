import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Plus, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NewSaleDrawer } from '../components/sales/NewSaleDrawer';
import { useRepositories } from '../repositories/RepositoryProvider';
import { Order } from '../domain/types';

export function Comercial() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { orderRepo } = useRepositories();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    orderRepo.getOrders().then(setOrders);
  }, [orderRepo, refreshKey]);

  const handleSaleComplete = () => {
    setIsDrawerOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" key={refreshKey}>
      <PageHeader 
        title="Comercial" 
        description="Gestão de vendas, PDV e orçamentos." 
        action={
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} /> Nova Venda
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar pedido ou cliente..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-zinc-50 transition-colors">
          <Filter size={16} /> Filtros
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Pedido</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium text-right">Total</th>
                <th className="px-6 py-4 font-medium">Status Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-zinc-50">{order.id}</td>
                  <td className="px-6 py-4">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium text-zinc-50">{order.customer}</td>
                  <td className="px-6 py-4 text-emerald-400 font-medium text-right">R$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge 
                      status={order.status} 
                      variant={order.status === 'Pago' ? 'success' : order.status === 'Parcial' ? 'info' : 'warning'} 
                    />
                  </td>
                </tr>
              ))}
              
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                        <Search className="text-zinc-500" size={20} />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">Nenhuma venda encontrada</p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm">Os pedidos registrados aparecerão nesta lista. Clique em "Nova Venda" para começar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDrawerOpen && (
        <NewSaleDrawer 
          onClose={() => setIsDrawerOpen(false)} 
          onComplete={handleSaleComplete} 
        />
      )}
    </div>
  );
}
