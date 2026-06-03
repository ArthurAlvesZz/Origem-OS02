import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';

interface NewConsignmentDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

export function NewConsignmentDrawer({ onClose, onComplete }: NewConsignmentDrawerProps) {
  const [partnerId, setPartnerId] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<{ productId: string; name: string; qtySent: number; unitPrice: number; unitCost: number }[]>([]);
  
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');

  const { productRepo, consignmentRepo, inventoryRepo, settingsRepo } = useRepositories();
  const [partners, setPartners] = useState<{id: string, name: string, defaultTermDays?: number}[]>([]);
  const [productsData, setProductsData] = useState<(Product & { currentStock: number })[]>([]);

  useEffect(() => {
    consignmentRepo.getPartners().then(setPartners);

    settingsRepo.getBusinessRules().then(rules => {
      const defaultDays = rules.defaultConsignmentSettleDays || 15;
      const d = new Date();
      d.setDate(d.getDate() + defaultDays);
      setDueDate(d.toISOString().split('T')[0]);
    }).catch(console.error);
    
    const fetchProducts = async () => {
      const prods = await productRepo.getProducts();
      const withStock = await Promise.all(
        prods.filter(p => p.active).map(async p => ({
          ...p,
          currentStock: await inventoryRepo.calculateCurrentStock(p.id)
        }))
      );
      setProductsData(withStock);
    };
    fetchProducts();
  }, [consignmentRepo, productRepo, inventoryRepo]);

  const selectedProduct = productsData.find(p => p.id === productId);

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) return;

    if (q > selectedProduct.currentStock) {
      const proceed = window.confirm(`Cuidado: O produto ${selectedProduct.name} tem apenas ${selectedProduct.currentStock} disponíveis. Deseja adicionar mesmo assim? O estoque ficará negativo.`);
      if (!proceed) return;
    }

    setItems(prev => {
      const existing = prev.find(i => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map(i => i.productId === selectedProduct.id ? { ...i, qtySent: i.qtySent + q } : i);
      }
      return [...prev, {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        qtySent: q,
        unitPrice: selectedProduct.price,
        unitCost: selectedProduct.cost
      }];
    });

    setProductId('');
    setQty('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.productId !== id));
  };

  const handlePartnerSelect = (e: any) => {
    const id = e.target.value;
    setPartnerId(id);
    const partner = partners.find(p => p.id === id);
    if (partner) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + (partner.defaultTermDays || 30));
      setDueDate(defaultDate.toISOString().slice(0, 10));
    }
  };

  const handleFinalize = async () => {
    if (!partnerId) {
      alert('Selecione um parceiro.');
      return;
    }
    if (!dueDate) {
      alert('Informe a data de vencimento.');
      return;
    }
    if (items.length === 0) {
      alert('Adicione pelo menos um produto na remessa.');
      return;
    }

    try {
      const partner = partners.find(p => p.id === partnerId);
      await consignmentRepo.createConsignment({
        partnerId: partnerId,
        partnerName: partner?.name || 'Desconhecido',
        date: new Date().toISOString(),
        expectedReturnDate: dueDate,
        totalValue,
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          sentQty: i.qtySent,
          unitPrice: i.unitPrice,
          unitCost: i.unitCost
        }))
      });
      alert('Remessa de consignação gerada com sucesso! O estoque foi deduzido.');
      onComplete();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalValue = items.reduce((acc, item) => acc + (item.qtySent * item.unitPrice), 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950">
          <h2 className="text-lg font-heading font-semibold text-zinc-50 tracking-tight">Nova Remessa em Consignação</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Parceiro (Local B2B)</label>
              <select 
                value={partnerId}
                onChange={handlePartnerSelect}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              >
                <option value="" disabled>Selecione o parceiro</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Prazo: {p.defaultTermDays}d)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Data Limite de Acerto</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
          </section>

          <section className="pt-4 border-t border-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Itens da Remessa</h3>
            
            <div className="flex gap-2 items-end mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Produto</label>
                <select 
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
                >
                  <option value="">Selecione...</option>
                  {productsData.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Disp: {p.currentStock})</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Qtd</label>
                <input 
                  type="number" 
                  min="0"
                  step="1"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <button 
                type="button"
                onClick={handleAddItem}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Incluir
              </button>
            </div>

            {items.length > 0 ? (
              <ul className="space-y-2 mt-4">
                {items.map(item => (
                  <li key={item.productId} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-sm">
                    <div>
                      <span className="font-medium text-zinc-300">{item.name}</span>
                      <div className="text-zinc-500 text-xs">R$ {item.unitPrice.toFixed(2)} / un</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="tabular-nums font-semibold text-zinc-100">{item.qtySent} un</span>
                      <button onClick={() => handleRemoveItem(item.productId)} className="text-zinc-500 hover:text-red-400 p-1">
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center border border-dashed border-zinc-800 rounded-lg text-sm text-zinc-500">
                Nenhum produto adicionado à remessa.
              </div>
            )}
          </section>

        </div>

        <div className="border-t border-zinc-900 bg-zinc-950 p-6">
          <div className="flex justify-between mb-4">
            <span className="text-sm text-zinc-400">Total Potencial (Estimado)</span>
            <span className="text-xl font-semibold text-emerald-400">R$ {totalValue.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleFinalize}
            disabled={items.length === 0 || !partnerId}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 font-semibold py-3.5 rounded-xl transition-colors"
          >
            <Check size={20} />
            Gerar Consignação
          </button>
        </div>
      </div>
    </>
  );
}
