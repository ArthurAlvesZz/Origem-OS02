import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { RoastProfileRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { Plus } from 'lucide-react';
import { ProfileDrawer } from './ProfileDrawer';

export function ProfileList() {
  const { advancedProductionRepo } = useRepositories();
  const [profiles, setProfiles] = useState<RoastProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);
    try {
      const data = await advancedProductionRepo.getRoastProfiles();
      setProfiles(data);
    } catch(e) {}
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Perfis de Torra</h3>
        <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
          <Plus size={14} /> Novo Perfil
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-zinc-500">Carregando perfis...</div>
        ) : profiles.length === 0 ? (
           <div className="p-8 text-center text-zinc-500">Nenhum perfil de torra encontrado.</div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                 <th className="px-6 py-4 font-medium">Perfil</th>
                 <th className="px-6 py-4 font-medium">Ponto de Torra</th>
                 <th className="px-6 py-4 font-medium text-right">Tempo Total</th>
                 <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                   <td className="px-6 py-4">
                     <div className="font-medium text-white">{p.name}</div>
                     <div className="text-xs text-zinc-500">Receita ID: {p.recipeId}</div>
                   </td>
                   <td className="px-6 py-4 capitalize">{p.roastLevel}</td>
                   <td className="px-6 py-4 text-right">{p.totalTime} seg <span className="text-xs text-zinc-500">({(p.totalTime / 60).toFixed(1)} min)</span></td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                       {p.active ? 'Ativo' : 'Inativo'}
                     </span>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isDrawerOpen && (
         <ProfileDrawer 
            onClose={() => setIsDrawerOpen(false)} 
            onSuccess={() => { setIsDrawerOpen(false); loadProfiles(); }} 
         />
      )}
    </div>
  );
}
