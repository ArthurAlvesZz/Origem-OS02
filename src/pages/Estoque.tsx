import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Search, Plus, ArrowDownToLine, ArrowUpToLine, Settings2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { StockMovementDrawer } from '../components/inventory/StockMovementDrawer';
import { StockMovementsTable } from '../components/inventory/StockMovementsTable';
import { MovementType, Product } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';

export function Estoque() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [initialType, setInitialType] = useState<MovementType>('Entrada');
  const [refreshKey, setRefreshKey] = useState(0);

  const { productRepo, inventoryRepo } = useRepositories();
  const [productsData, setProductsData] = useState<(Product & { currentStock: number })[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const prods = await productRepo.getProducts();
      const withStock = await Promise.all(
        prods.map(async p => ({
          ...p,
          currentStock: await inventoryRepo.calculateCurrentStock(p.id)
        }))
      );
      setProductsData(withStock);
    };
    fetchData();
  }, [productRepo, inventoryRepo, refreshKey]);

  const handleOpenNew = (type: MovementType) => {
    setInitialType(type);
    setIsDrawerOpen(true);
  };

  const handleComplete = () => {
    setIsDrawerOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" key={refreshKey}>
      <PageHeader 
        title="Estoque" 
        description="Controle de saldos físicos e inventário." 
        action={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOpenNew('Entrada')}
              className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-50 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700 hover:border-zinc-600 transition-all"
            >
              <ArrowDownToLine size={16} className="text-emerald-400" /> Entrada
            </button>
            <button 
              onClick={() => handleOpenNew('Perda')}
              className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-50 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700 hover:border-zinc-600 transition-all"
            >
              <ArrowUpToLine size={16} className="text-red-400" /> Perda
            </button>
            <button 
              onClick={() => handleOpenNew('Ajuste')}
              className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              <Settings2 size={16} /> Ajustar
            </button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar item em estoque..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Item</th>
                <th className="px-6 py-4 font-medium text-right">Saldo Atual</th>
                <th className="px-6 py-4 font-medium text-right">Min. Seguro</th>
                <th className="px-6 py-4 font-medium">Status do Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {productsData.map((p) => {
                const isLow = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-50">{p.name}</div>
                      <div className="font-mono text-zinc-500 text-xs mt-0.5">{p.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-zinc-50">{p.currentStock}</span> <span className="text-zinc-500 text-xs">{p.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500">
                      {p.minStock} {p.unit}
                    </td>
                    <td className="px-6 py-4">
                      {p.active ? (
                        <StatusBadge 
                          status={isLow ? 'Baixo Estoque' : 'Normal'} 
                          variant={isLow ? 'error' : 'success'} 
                        />
                      ) : (
                        <StatusBadge status="Inativo" variant="warning" />
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {productsData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12">
                     <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                          <Search className="text-zinc-500" size={20} />
                        </div>
                        <p className="text-sm font-medium text-zinc-300">Nenhum produto rastreado</p>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm">Adicione produtos no painel de Produtos para começar a rastrear o estoque.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockMovementsTable />

      {isDrawerOpen && (
        <StockMovementDrawer
          onClose={() => setIsDrawerOpen(false)}
          onComplete={handleComplete}
          initialType={initialType}
        />
      )}
    </div>
  );
}
