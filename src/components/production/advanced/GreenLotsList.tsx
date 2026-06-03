import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { GreenCoffeeLotRecord } from '../../../repositories/interfaces/IAdvancedProductionRepository';
import { Plus, Edit, Filter, Lock, Unlock } from 'lucide-react';
import { GreenLotDrawer } from './GreenLotDrawer';

export function GreenLotsList() {
  const { advancedProductionRepo } = useRepositories();
  const [lots, setLots] = useState<GreenCoffeeLotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  useEffect(() => {
    loadLots();
  }, []);

  async function loadLots() {
    setLoading(true);
    try {
      const data = await advancedProductionRepo.getGreenLots();
      setLots(data);
    } catch(e) {}
    setLoading(false);
  }

  const handleCreate = () => {
    setEditingId(undefined);
    setIsDrawerOpen(true);
  };

  const totalKg = lots.reduce((acc, l) => acc + l.stockKg, 0);
  const totalValue = lots.reduce((acc, l) => acc + (l.stockKg * l.costPerKg), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-500 text-sm mb-1">Total Disponível</div>
          <div className="text-2xl font-medium text-white">{totalKg.toFixed(1)} <span className="text-sm text-zinc-500">kg</span></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-500 text-sm mb-1">Valor em Verdes</div>
          <div className="text-2xl font-medium text-white">
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-500 text-sm mb-1">Lotes Ativos</div>
          <div className="text-2xl font-medium text-white">{lots.length}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Lotes Registrados</h3>
        <button onClick={handleCreate} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
          <Plus size={14} /> Novo Lote
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-zinc-500">Carregando lotes...</div>
        ) : lots.length === 0 ? (
           <div className="p-8 text-center text-zinc-500">Nenhum lote de grão verde encontrado.</div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                 <th className="px-6 py-4 font-medium">Lote / Origem</th>
                 <th className="px-6 py-4 font-medium">Variedade / Processo</th>
                 <th className="px-6 py-4 font-medium">Safra</th>
                 <th className="px-6 py-4 font-medium text-right">Saldo</th>
                 <th className="px-6 py-4 font-medium text-right">Custo</th>
                 <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {lots.map(lot => (
                <tr key={lot.id} className="hover:bg-zinc-800/50 transition-colors">
                   <td className="px-6 py-4">
                     <div className="font-medium text-white">{lot.name}</div>
                     <div className="text-xs text-zinc-500">{lot.origin} • {lot.supplier}</div>
                   </td>
                   <td className="px-6 py-4">
                     <div>{lot.variety}</div>
                     <div className="text-xs text-zinc-500">{lot.processing}</div>
                   </td>
                   <td className="px-6 py-4">{lot.harvest}</td>
                   <td className="px-6 py-4 text-right font-medium">{lot.stockKg.toFixed(1)} kg</td>
                   <td className="px-6 py-4 text-right">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lot.costPerKg)}/kg
                   </td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-xs font-medium ${lot.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                       {lot.status}
                     </span>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isDrawerOpen && (
         <GreenLotDrawer 
            lotId={editingId} 
            onClose={() => setIsDrawerOpen(false)} 
            onSuccess={() => { setIsDrawerOpen(false); loadLots(); }} 
         />
      )}
    </div>
  );
}
