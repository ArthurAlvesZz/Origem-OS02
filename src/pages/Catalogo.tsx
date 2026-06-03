import { PageHeader } from '../components/ui/PageHeader';
import { Plus, Search, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductFormDrawer } from '../components/catalog/ProductFormDrawer';
import { Product } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';

export function Catalogo() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { productRepo } = useRepositories();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productRepo.getProducts().then(setProducts);
  }, [productRepo, refreshKey]);

  const handleOpenNew = () => {
    setSelectedProduct(undefined);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setIsDrawerOpen(false);
    setSelectedProduct(undefined);
  };

  const handleComplete = () => {
    handleClose();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" key={refreshKey}>
      <PageHeader 
        title="Catálogo de Produtos" 
        description="Gerencie seus cafés, insumos e variações." 
        action={
          <button 
            onClick={handleOpenNew}
            className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} /> Novo Produto
          </button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou SKU..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Custo Unit.</th>
                <th className="px-6 py-4 font-medium">Preço (Venda)</th>
                <th className="px-6 py-4 font-medium text-right">Margem</th>
                <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((p) => {
                const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-500 text-xs">{p.sku}</td>
                    <td className="px-6 py-4 font-medium text-zinc-50">{p.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{p.category}</td>
                    <td className="px-6 py-4">
                      {p.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ativo</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">R$ {p.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium text-zinc-50">
                      {p.price > 0 ? `R$ ${p.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.price > 0 ? (
                        <span className={margin > 40 ? "text-emerald-400 font-medium" : margin > 10 ? "text-amber-400 font-medium" : "text-red-400 font-medium"}>
                          {margin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors inline-block"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isDrawerOpen && (
        <ProductFormDrawer
          onClose={handleClose}
          onComplete={handleComplete}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
