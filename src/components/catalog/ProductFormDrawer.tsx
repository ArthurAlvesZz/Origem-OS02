import { useState, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { Product } from '../../domain/types';
import { calculateProductMargin } from '../../domain/products';
import { useRepositories } from '../../repositories/RepositoryProvider';

interface ProductFormDrawerProps {
  onClose: () => void;
  onComplete: () => void;
  product?: Product;
}

export function ProductFormDrawer({ onClose, onComplete, product }: ProductFormDrawerProps) {
  const { productRepo } = useRepositories();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'Café Torrado',
    sku: product?.sku || '',
    unit: product?.unit || 'un',
    price: product?.price?.toString() || '',
    cost: product?.cost?.toString() || '',
    minStock: product?.minStock?.toString() || '10',
    active: product !== undefined ? product.active : true
  });

  const priceNum = parseFloat(formData.price) || 0;
  const costNum = parseFloat(formData.cost) || 0;
  
  const marginStr = useMemo(() => {
    const margin = calculateProductMargin(priceNum, costNum);
    return margin.toFixed(1);
  }, [priceNum, costNum]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (priceNum <= 0) {
        alert('O preço de venda deve ser maior que zero.');
        return;
      }
      
      const payload: Omit<Product, 'id'> = {
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        unit: formData.unit,
        price: priceNum,
        cost: costNum,
        stock: product ? product.stock : 0,
        minStock: parseInt(formData.minStock, 10) || 0,
        score: product ? product.score : 0,
        active: formData.active
      };

      if (product) {
        await productRepo.updateProduct(product.id, payload);
      } else {
        await productRepo.createProduct(payload);
      }

      onComplete();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950">
          <h2 className="text-lg font-heading font-semibold text-zinc-50 tracking-tight">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.active} 
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="text-sm font-medium text-zinc-300">Produto Ativo</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome do Produto</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700" 
                  placeholder="Ex: Cerrado Natural 250g"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">SKU</label>
                  <input 
                    type="text" 
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 uppercase" 
                    placeholder="EX-PROD-250"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  >
                    <option value="Café Torrado">Café Torrado</option>
                    <option value="Insumo">Insumo</option>
                    <option value="Acessório">Acessório</option>
                    <option value="Embalagem">Embalagem</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Unidade</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="l">Litro (l)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Estoque Mínimo</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 tabular-nums" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/50 space-y-4">
              <h3 className="text-sm font-medium text-zinc-300">Precificação</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Custo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 tabular-nums" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Preço Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 tabular-nums" 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="bg-zinc-900 p-4 rounded-lg flex items-center justify-between">
                <span className="text-sm text-zinc-400">Margem Estimada</span>
                <span className={`text-lg font-semibold tabular-nums ${parseFloat(marginStr) > 30 ? 'text-emerald-400' : parseFloat(marginStr) > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                  {marginStr}%
                </span>
              </div>
            </div>

          </form>
        </div>

        <div className="border-t border-zinc-900 bg-zinc-950 p-6">
          <button 
            type="submit"
            form="product-form"
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold py-3.5 rounded-xl transition-colors"
          >
            <Save size={20} />
            Salvar Produto
          </button>
        </div>
      </div>
    </>
  );
}
