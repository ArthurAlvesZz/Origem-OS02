import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { ProductionRecipeRecord, GreenCoffeeLotRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { X, Save, Plus, Trash } from 'lucide-react';

interface RecipeDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RecipeDrawer({ onClose, onSuccess }: RecipeDrawerProps) {
  const { advancedProductionRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<GreenCoffeeLotRecord[]>([]);
  
  const [formData, setFormData] = useState<Partial<ProductionRecipeRecord>>({
    name: '', productId: '', targetYield: 0.85, defaultCostPerHour: 0,
    inputs: [], extras: []
  });

  useEffect(() => {
    advancedProductionRepo.getGreenLots().then(setLots);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.inputs?.length === 0) {
        alert('Adicione pelo menos um grão no blend.');
        return;
      }
      await advancedProductionRepo.createRecipe(formData);
      onSuccess();
    } catch (err) {
      alert('Erro ao salvar receita.');
    } finally {
      setLoading(false);
    }
  };

  const addInput = () => {
    setFormData(prev => ({
      ...prev,
      inputs: [...(prev.inputs || []), { id: Date.now().toString(), greenLotId: '', percent: 1, estimatedWaste: 0.15 }]
    }));
  };

  const removeInput = (id: string) => {
    setFormData(prev => ({
      ...prev,
      inputs: (prev.inputs || []).filter(i => i.id !== id)
    }));
  };

  const addExtra = () => {
    setFormData(prev => ({
      ...prev,
      extras: [...(prev.extras || []), { id: Date.now().toString(), itemName: '', cost: 0 }]
    }));
  };

  const removeExtra = (id: string) => {
    setFormData(prev => ({
      ...prev,
      extras: (prev.extras || []).filter(i => i.id !== id)
    }));
  };

  // Calculate estimated cost
  // Sum of lots avg costs weighted by percentage / targetYield + fixed extras + hourCost
  const totalBaseYield = formData.targetYield || 1;
  const inputCost = (formData.inputs || []).reduce((acc, input) => {
     const lot = lots.find(l => l.id === input.greenLotId);
     const kgPrice = lot ? lot.costPerKg : 0;
     const costPer1KgInput = kgPrice * (input.percent || 0.0);
     return acc + costPer1KgInput;
  }, 0);
  const rawCostPerKgOut = totalBaseYield > 0 ? (inputCost / totalBaseYield) : 0;
  
  const totalExtras = (formData.extras || []).reduce((acc, ex) => acc + (ex.cost || 0), 0);
  const estimatedCostPerKgOut = rawCostPerKgOut + totalExtras + (formData.defaultCostPerHour || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full flex flex-col pt-16 md:pt-0">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10 w-full overflow-hidden">
          <div>
            <h2 className="text-xl font-medium text-white">Nova Receita / Ficha Técnica</h2>
            <p className="text-sm text-zinc-400 mt-1">Configure o blend e insumos.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nome da Receita *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Ex: Blend Clássico 500g"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-zinc-300 mb-1">ID Produto Final (SKU)</label>
                 <input type="text" required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-zinc-300 mb-1">Rendimento Esperado (%)</label>
                 <input type="number" step="0.01" min="0" max="1" required value={formData.targetYield} onChange={e => setFormData({ ...formData, targetYield: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
            </div>

            <div className="border border-zinc-800 p-4 rounded-xl bg-zinc-900">
               <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">Adicionar Grãos Verdes (Blend)</h4>
                  <button type="button" onClick={addInput} className="text-amber-500 text-xs font-medium hover:text-amber-400 flex items-center gap-1">
                     <Plus size={14}/> Insumo
                  </button>
               </div>
               
               <div className="space-y-3">
                 {(!formData.inputs || formData.inputs.length === 0) && (
                    <div className="text-xs text-zinc-500">Nenhum grão verde adicionado ao blend.</div>
                 )}
                 {formData.inputs?.map((input, index) => (
                    <div key={input.id} className="flex gap-2 items-center">
                       <select value={input.greenLotId} onChange={e => {
                         const newInputs = [...(formData.inputs || [])];
                         newInputs[index].greenLotId = e.target.value;
                         setFormData({ ...formData, inputs: newInputs });
                       }} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-xs focus:outline-none">
                          <option value="">Selecione o Lote</option>
                          {lots.map(l => <option key={l.id} value={l.id}>{l.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.costPerKg)}/kg)</option>)}
                       </select>
                       <input type="number" step="0.01" value={input.percent} onChange={e => {
                         const newInputs = [...(formData.inputs || [])];
                         newInputs[index].percent = parseFloat(e.target.value) || 0;
                         setFormData({ ...formData, inputs: newInputs });
                       }} className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-xs" placeholder="Kg" title="Kg de insumo para compor a receita de 1kg" />
                       <button type="button" onClick={() => removeInput(input.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash size={14} />
                       </button>
                    </div>
                 ))}
               </div>
            </div>

            <div className="border border-zinc-800 p-4 rounded-xl bg-zinc-900">
               <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">Custos Extras</h4>
                  <button type="button" onClick={addExtra} className="text-emerald-500 text-xs font-medium hover:text-emerald-400 flex items-center gap-1">
                     <Plus size={14}/> Extra
                  </button>
               </div>
               
               <div className="space-y-3">
                 {(!formData.extras || formData.extras.length === 0) && (
                    <div className="text-xs text-zinc-500">Nenhum custo extra mapeado.</div>
                 )}
                 {formData.extras?.map((extra, index) => (
                    <div key={extra.id} className="flex gap-2 items-center">
                       <input type="text" value={extra.itemName} onChange={e => {
                         const newExtras = [...(formData.extras || [])];
                         newExtras[index].itemName = e.target.value;
                         setFormData({ ...formData, extras: newExtras });
                       }} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-xs" placeholder="Embalagem, Energia..." />
                       <input type="number" step="0.01" value={extra.cost} onChange={e => {
                         const newExtras = [...(formData.extras || [])];
                         newExtras[index].cost = parseFloat(e.target.value) || 0;
                         setFormData({ ...formData, extras: newExtras });
                       }} className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-xs" placeholder="Custo R$" />
                       <button type="button" onClick={() => removeExtra(extra.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash size={14} />
                       </button>
                    </div>
                 ))}
               </div>
               
               <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-300">Custo Mão de Obra Fixo / H</label>
                  <input type="number" step="0.01" value={formData.defaultCostPerHour} onChange={e => setFormData({ ...formData, defaultCostPerHour: parseFloat(e.target.value) || 0 })} className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-xs" placeholder="R$" />
               </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-4 sticky bottom-0">
          <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
             <span className="text-sm text-zinc-400 font-medium">Custo Estimado (R$/Kg Torrado):</span>
             <span className="text-lg text-emerald-400 font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedCostPerKgOut)}</span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-lg font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors">Cancelar</button>
            <button type="submit" form="recipe-form" disabled={loading} className="flex-1 px-4 py-3 rounded-lg font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Salvando...' : <><Save size={18} /> Salvar Receita</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
