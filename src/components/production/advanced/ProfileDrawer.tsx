import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { RoastProfileRecord, ProductionRecipeRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { X, Save } from 'lucide-react';

interface ProfileDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ProfileDrawer({ onClose, onSuccess }: ProfileDrawerProps) {
  const { advancedProductionRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<ProductionRecipeRecord[]>([]);

  const [formData, setFormData] = useState<Partial<RoastProfileRecord>>({
    name: '', recipeId: '', roastLevel: 'medium', totalTime: 600, notes: '', active: true
  });

  useEffect(() => {
    advancedProductionRepo.getRecipes().then(setRecipes);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await advancedProductionRepo.createRoastProfile(formData);
      onSuccess();
    } catch (err) {
      alert('Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-zinc-950 border-l border-zinc-800 h-full flex flex-col pt-16 md:pt-0">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10 w-full overflow-hidden">
          <div>
            <h2 className="text-xl font-medium text-white">Novo Perfil de Torra</h2>
            <p className="text-sm text-zinc-400 mt-1">Configure o perfil e vincule a receita.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nome do Perfil *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Ex: Omni Roast Médio"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Receita Associada *</label>
              <select required value={formData.recipeId} onChange={e => setFormData({ ...formData, recipeId: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                <option value="">Selecione a Receita</option>
                {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-zinc-300 mb-1">Duração (seg)</label>
                 <input type="number" min="0" required value={formData.totalTime} onChange={e => setFormData({ ...formData, totalTime: parseInt(e.target.value) || 0 })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Ponto de Torra</label>
                <select value={formData.roastLevel} onChange={e => setFormData({ ...formData, roastLevel: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                  <option value="light">Clara</option>
                  <option value="medium">Média</option>
                  <option value="medium-dark">Média-Escura</option>
                  <option value="dark">Escura</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Observações do Mestre</label>
              <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 h-24" placeholder="Notas de curva, desenvolvimento, RoR..." />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex gap-3 sticky bottom-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-lg font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors">Cancelar</button>
          <button type="submit" form="profile-form" disabled={loading} className="flex-1 px-4 py-3 rounded-lg font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Perfil</>}
          </button>
        </div>
      </div>
    </div>
  );
}
