import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { ProductionRecipeRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { Plus } from 'lucide-react';
import { RecipeDrawer } from './RecipeDrawer';

export function RecipeList() {
  const { advancedProductionRepo } = useRepositories();
  const [recipes, setRecipes] = useState<ProductionRecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    try {
      const data = await advancedProductionRepo.getRecipes();
      setRecipes(data);
    } catch(e) {}
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Fichas Técnicas (Receitas)</h3>
        <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
          <Plus size={14} /> Nova Receita
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-zinc-500">Carregando receitas...</div>
        ) : recipes.length === 0 ? (
           <div className="p-8 text-center text-zinc-500">Nenhuma ficha técnica encontrada.</div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                 <th className="px-6 py-4 font-medium">Produto / Receita</th>
                 <th className="px-6 py-4 font-medium text-right">Rendimento (Padrão)</th>
                 <th className="px-6 py-4 font-medium text-right">Insumos (Blend)</th>
                 <th className="px-6 py-4 font-medium text-right">Extras</th>
                 <th className="px-6 py-4 font-medium text-right">Custo Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {recipes.map(r => (
                <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                   <td className="px-6 py-4">
                     <div className="font-medium text-white">{r.name}</div>
                     <div className="text-xs text-zinc-500">{r.productId}</div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      {(r.targetYield * 100).toFixed(1)}%
                   </td>
                   <td className="px-6 py-4 text-right">
                      {r.inputs?.length || 0} verdes
                   </td>
                   <td className="px-6 py-4 text-right">
                      {r.extras?.length || 0} itens
                   </td>
                   <td className="px-6 py-4 text-right">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.defaultCostPerHour)}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isDrawerOpen && (
         <RecipeDrawer 
            onClose={() => setIsDrawerOpen(false)} 
            onSuccess={() => { setIsDrawerOpen(false); loadRecipes(); }} 
         />
      )}
    </div>
  );
}
