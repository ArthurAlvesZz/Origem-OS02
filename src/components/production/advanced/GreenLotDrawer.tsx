import React, { useState } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { GreenCoffeeLotRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { X, Save } from 'lucide-react';

interface GreenLotDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
  lotId?: string; // If editing
}

export function GreenLotDrawer({ onClose, onSuccess, lotId }: GreenLotDrawerProps) {
  const { advancedProductionRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<GreenCoffeeLotRecord>>({
    name: '', origin: '', variety: '', processing: '', harvest: '', supplier: '',
    costPerKg: 0, stockKg: 0, status: 'available'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (lotId) {
        await advancedProductionRepo.updateGreenLot(lotId, formData);
      } else {
        await advancedProductionRepo.createGreenLot(formData);
      }
      onSuccess();
    } catch (err) {
      alert('Erro ao salvar lote de grão verde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col pt-16 md:pt-0">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-medium text-white">{lotId ? 'Editar Lote Verde' : 'Novo Lote de Grão Verde'}</h2>
            <p className="text-sm text-zinc-400 mt-1">Insira os dados do café cru.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="green-lot-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nome do Lote / Identificação *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Ex: Mundo Novo Seca 24"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Origem/Fazenda</label>
                <input type="text" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Fornecedor</label>
                <input type="text" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Variedade</label>
                <input type="text" value={formData.variety} onChange={e => setFormData({ ...formData, variety: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm" placeholder="Ex: Catuaí" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Processo</label>
                <input type="text" value={formData.processing} onChange={e => setFormData({ ...formData, processing: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm" placeholder="Ex: Natural" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Safra</label>
                <input type="text" value={formData.harvest} onChange={e => setFormData({ ...formData, harvest: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm" placeholder="Ex: 24/25" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Custo por Kg (R$)</label>
                <input type="number" step="0.01" min="0" required value={formData.costPerKg || ''} onChange={e => setFormData({ ...formData, costPerKg: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Estoque Inicial (Kg)</label>
                <input type="number" step="0.1" min="0" required value={formData.stockKg || ''} onChange={e => setFormData({ ...formData, stockKg: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                <option value="available">Disponível</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex gap-3 sticky bottom-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-lg font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors">Cancelar</button>
          <button type="submit" form="green-lot-form" disabled={loading} className="flex-1 px-4 py-3 rounded-lg font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Lote</>}
          </button>
        </div>
      </div>
    </div>
  );
}
