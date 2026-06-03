import { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { calculateProductionCosts } from '../../domain/production';
import { ProductionStatus, ProductionExtraCost, Product } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';

interface ProductionBatchDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

export function ProductionBatchDrawer({ onClose, onComplete }: ProductionBatchDrawerProps) {
  const [status, setStatus] = useState<ProductionStatus>('Em Produção');
  const [finalProductId, setFinalProductId] = useState('');
  const [finalQty, setFinalQty] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [hours, setHours] = useState('');
  const [laborCostPerHour, setLaborCostPerHour] = useState('25');
  const [responsible, setResponsible] = useState('Mestre de Torra');
  const [notes, setNotes] = useState('');

  const [inputs, setInputs] = useState<{ productId: string; name: string; qty: number; unitCost: number }[]>([]);
  const [inputId, setInputId] = useState('');
  const [inputQty, setInputQty] = useState('');

  const [extraCosts, setExtraCosts] = useState<ProductionExtraCost[]>([]);
  const [extraDesc, setExtraDesc] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  const { productRepo, productionRepo, inventoryRepo, settingsRepo } = useRepositories();
  const [productsData, setProductsData] = useState<(Product & { currentStock: number })[]>([]);

  useEffect(() => {
    settingsRepo.getProductionRules().then(rules => {
      setLaborCostPerHour(rules.defaultHourCost ? rules.defaultHourCost.toString() : '25');
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
  }, [productRepo, inventoryRepo]);

  const availableProducts = productsData.filter(p => p.category !== 'Insumo');
  const insumos = productsData.filter(p => p.category === 'Insumo');

  const selectedInput = insumos.find(p => p.id === inputId);

  const handleAddInput = () => {
    if (!selectedInput) return;
    const q = parseFloat(inputQty);
    if (!q || q <= 0) return;
    
    setInputs(prev => {
      const existing = prev.find(i => i.productId === selectedInput.id);
      if (existing) {
        return prev.map(i => i.productId === selectedInput.id ? { ...i, qty: i.qty + q } : i);
      }
      return [...prev, { productId: selectedInput.id, name: selectedInput.name, qty: q, unitCost: selectedInput.cost }];
    });
    setInputId('');
    setInputQty('');
  };

  const handleAddExtra = () => {
    const amt = parseFloat(extraAmount);
    if (!extraDesc || !amt || amt <= 0) return;
    setExtraCosts(prev => [...prev, { description: extraDesc, amount: amt }]);
    setExtraDesc('');
    setExtraAmount('');
  };

  const handleFinalize = async () => {
    if (!finalProductId) return alert('Selecione o produto final.');
    if (inputs.length === 0) return alert('Adicione pelo menos um insumo.');

    const qtyFinalNum = parseFloat(finalQty) || 0;
    const initialNum = parseFloat(initialWeight) || 0;
    const finalWNum = parseFloat(finalWeight) || 0;
    const hNum = parseFloat(hours) || 0;
    const laborHNum = parseFloat(laborCostPerHour) || 0;

    if (status === 'Concluído' && finalWNum > initialNum) {
       const proceed = window.confirm('Peso final está MAIOR que peso inicial. Deseja continuar?');
       if (!proceed) return;
    }

    const warnings: string[] = [];
    for (const input of inputs) {
      const p = insumos.find(x => x.id === input.productId);
      if (p && p.currentStock < input.qty) {
        warnings.push(`O insumo ${p.name} excederá o estoque (Disponível: ${p.currentStock}, Necessário: ${input.qty}).`);
      }
    }

    if (warnings.length > 0) {
      const proceed = window.confirm(warnings.join('\n') + '\n\nDeseja realizar a produção mesmo assim? O estoque ficará negativo.');
      if (!proceed) return;
    }

    try {
      const pFinal = availableProducts.find(p => p.id === finalProductId);
      await (productionRepo as any).createProductionBatch({
        finalProductId: pFinal!.id,
        finalProductName: pFinal!.name,
        expectedDate: new Date().toISOString(),
        initialWeight: initialNum,
        finalWeight: finalWNum,
        finalQty: qtyFinalNum,
        inputs: inputs.map(i => ({ productId: i.productId, name: i.name, qty: i.qty, unitCost: i.unitCost })),
        extraCosts,
        estimatedHours: hNum,
        laborCostPerHour: laborHNum,
        status,
        responsible,
        notes
      });
      alert(`Ordem de Produção salva como ${status}.`);
      onComplete();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const { totalCost } = calculateProductionCosts(inputs, extraCosts, parseFloat(hours) || 0, parseFloat(laborCostPerHour) || 0, parseFloat(finalQty) || 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[700px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950">
          <h2 className="text-lg font-heading font-semibold text-zinc-50 tracking-tight">Nova Produção</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {(['Rascunho', 'Em Produção', 'Concluído'] as ProductionStatus[]).map(s => (
              <button
                key={s} onClick={() => setStatus(s)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${status === s ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <section className="space-y-4">
             <h3 className="text-sm font-medium text-emerald-400">1. Produto Desejado</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Produto Final</label>
                  <select value={finalProductId} onChange={e => setFinalProductId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Qtd Final Produzida ({availableProducts.find(p => p.id === finalProductId)?.unit || 'un'})</label>
                  <input type="number" value={finalQty} onChange={e => setFinalQty(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" placeholder="Ex: 50" />
                </div>
             </div>
          </section>

          <section className="space-y-3">
             <h3 className="text-sm font-medium text-emerald-400">2. Insumos (Café Cru, etc)</h3>
             <div className="flex items-end gap-2">
               <div className="flex-1">
                 <select value={inputId} onChange={e => setInputId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm">
                    <option value="">Buscar insumo...</option>
                    {insumos.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Estoque: {p.currentStock})</option>
                    ))}
                  </select>
               </div>
               <div className="w-24">
                 <input type="number" placeholder="Qtd" value={inputQty} onChange={e => setInputQty(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" />
               </div>
               <button onClick={handleAddInput} type="button" className="bg-zinc-800 text-zinc-50 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700">Incluir</button>
             </div>
             {inputs.map(i => (
                <div key={i.productId} className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg text-sm">
                  <span className="text-zinc-300">{i.name}</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-zinc-400">{i.qty} {availableProducts.find(p=>p.id===i.productId)?.unit}</span>
                    <button onClick={() => setInputs(prev => prev.filter(x => x.productId !== i.productId))} className="text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
             ))}
          </section>

          <section className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
             <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Peso Inicial Seco (kg)</label>
                <input type="number" value={initialWeight} onChange={e => setInitialWeight(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" placeholder="Ex: 60" />
             </div>
             <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Peso Final Torrado (kg)</label>
                <input type="number" value={finalWeight} onChange={e => setFinalWeight(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" placeholder="Ex: 50.4" />
             </div>
          </section>

          <section className="pt-4 border-t border-zinc-800/50 space-y-3">
             <h3 className="text-sm font-medium text-emerald-400">3. Custos Adicionais & Mão de Obra</h3>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Tempo Gasto (Horas)</label>
                  <input type="number" value={hours} onChange={e => setHours(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" placeholder="Ex: 2.5" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Custo da Hora (R$)</label>
                  <input type="number" value={laborCostPerHour} onChange={e => setLaborCostPerHour(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" placeholder="Ex: 25.00" />
               </div>
             </div>

             <div className="flex items-end gap-2 mt-4">
               <div className="flex-1">
                 <input type="text" placeholder="Ex: Embalagem 250g, Gás..." value={extraDesc} onChange={e => setExtraDesc(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" />
               </div>
               <div className="w-24">
                 <input type="number" placeholder="R$" value={extraAmount} onChange={e => setExtraAmount(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" />
               </div>
               <button onClick={handleAddExtra} type="button" className="bg-zinc-800 text-zinc-50 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700"><Plus size={16}/></button>
             </div>
             {extraCosts.map((e, idx) => (
                <div key={idx} className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg text-sm">
                  <span className="text-zinc-300">{e.description}</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-zinc-400">R$ {e.amount.toFixed(2)}</span>
                    <button onClick={() => setExtraCosts(prev => prev.filter((_, i) => i !== idx))} className="text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
             ))}
          </section>

          <section>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Observações do Mestre</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Perfil de torra, notas sensoriais..."></textarea>
          </section>

        </div>

        <div className="border-t border-zinc-900 bg-zinc-950 p-6 flex items-center justify-between gap-4">
           <div>
             <div className="text-xs text-zinc-500 uppercase font-semibold">Custo Total Projetado</div>
             <div className="text-xl font-semibold text-emerald-400">R$ {totalCost.toFixed(2)}</div>
           </div>
          <button 
            onClick={handleFinalize}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold py-3.5 rounded-xl transition-colors"
          >
            <Check size={20} />
            Salvar Lote
          </button>
        </div>
      </div>
    </>
  );
}
