import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { B2BCatalogItemRecord } from '../repositories/interfaces/IB2BCatalogRepository';
import { Layers, Eye, EyeOff, Edit, Plus, CheckCircle2, Package } from 'lucide-react';

export function B2BCatalog() {
  const { b2bCatalogRepo, productRepo } = useRepositories();
  const [items, setItems] = useState<B2BCatalogItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await b2bCatalogRepo.getItems();
      setItems(data);
    } catch(e) {}
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
             <Layers className="text-amber-500" />
             Catálogo B2B
          </h1>
          <p className="text-zinc-400 mt-2">Gerencie produtos, preços B2B e quantidades mínimas.</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Plus size={16} /> Adicionar Produto
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-zinc-500">Carregando catálogo...</div>
        ) : items.length === 0 ? (
           <div className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                   <Package className="text-zinc-500" size={20} />
                 </div>
                 <p className="text-sm font-medium text-zinc-300">Nenhum produto no Catálogo B2B</p>
                 <p className="text-xs text-zinc-500 mt-1 max-w-sm">Adicione produtos e defina tabelas e quantidades mínimas para começar a atender atacadistas.</p>
              </div>
           </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Produto</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Preço B2B</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">MOQ</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Lead Time</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                   <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{item.product?.name || 'Produto Base'}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-amber-500 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">{item.moq} un</td>
                   <td className="px-6 py-4 whitespace-nowrap">{item.leadTimeDays} dias</td>
                   <td className="px-6 py-4 whitespace-nowrap">
                      {item.isVisible ? (
                         <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                            <Eye size={12} /> Visível
                         </span>
                      ) : (
                         <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                            <EyeOff size={12} /> Oculto
                         </span>
                      )}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-zinc-500 hover:text-white transition-colors">
                         <Edit size={16} />
                      </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
