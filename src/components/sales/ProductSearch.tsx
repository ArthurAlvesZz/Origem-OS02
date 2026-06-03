import { Search, Plus, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
}

export function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { productRepo } = useRepositories();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productRepo.getProducts().then(setProducts);
  }, [productRepo]);

  const filteredProducts = searchTerm.trim() 
    ? products.filter(p => 
        p.active && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar produto por nome ou código..." 
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700"
        />
      </div>

      {searchTerm && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 shadow-sm">
          {filteredProducts.length > 0 ? (
            <ul className="divide-y divide-zinc-800/50 max-h-60 overflow-y-auto">
              {filteredProducts.map(p => (
                <li key={p.id} className="p-3 hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500">
                      <Package size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-zinc-50">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-zinc-500">{p.sku}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">Estoque: {p.stock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-zinc-300">R$ {p.price.toFixed(2)}</div>
                    <button 
                      onClick={() => onSelectProduct(p)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-zinc-500">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
