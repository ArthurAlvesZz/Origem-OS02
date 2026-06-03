import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { QualityReviewRecord } from '../../../repositories/interfaces/IQualityRepository';
import { Search, Filter, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { QualityReviewDrawer } from './QualityReviewDrawer';

export function QualityList() {
  const { qualityRepo } = useRepositories();
  const [reviews, setReviews] = useState<QualityReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviewId, setSelectedReviewId] = useState<string>();

  const loadData = () => {
    setLoading(true);
    qualityRepo.getReviews().then(setReviews).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [qualityRepo]);

  if (loading) {
     return <div className="p-8 text-center text-zinc-500">Carregando fila de qualidade...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review': return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-medium">Avaliação Pendente</span>;
      case 'approved': return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-medium">Aprovado</span>;
      case 'rejected': return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-xs font-medium">Reprovado</span>;
      case 'blocked': return <span className="bg-zinc-800 text-red-400 border border-red-900/50 px-2 py-0.5 rounded text-xs font-medium">Bloqueado</span>;
      default: return <span className="text-zinc-500">{status}</span>;
    }
  };

  return (
     <div className="space-y-6">
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
         <div className="flex gap-2 w-full sm:w-auto">
           <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
             <input type="text" placeholder="Buscar lote..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-amber-500" />
           </div>
           <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
             <Filter size={18} />
           </button>
         </div>
       </div>

       <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-zinc-800">
               <tr>
                 <th className="px-6 py-4 font-medium">Lote de Produção</th>
                 <th className="px-6 py-4 font-medium">Produto</th>
                 <th className="px-6 py-4 font-medium">Status</th>
                 <th className="px-6 py-4 font-medium">Data</th>
                 <th className="px-6 py-4 font-medium text-right">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-zinc-800">
               {reviews.map(r => (
                 <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                       <span className="text-white font-mono">{r.batch?.code || r.productionBatchId || 'Lote Avulso'}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-zinc-300">{r.product?.name || r.productId || 'Não especificado'}</span>
                    </td>
                    <td className="px-6 py-4">
                       {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                       {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => setSelectedReviewId(r.id)} className="text-amber-500 hover:text-amber-400 font-medium text-xs bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded transition">
                          Avaliar
                       </button>
                    </td>
                 </tr>
               ))}
               {reviews.length === 0 && (
                  <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                        Nenhuma avaliação de qualidade pendente ou registrada.
                     </td>
                  </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

       {selectedReviewId && (
          <QualityReviewDrawer 
             reviewId={selectedReviewId}
             onClose={() => setSelectedReviewId(undefined)}
             onSuccess={() => {
                setSelectedReviewId(undefined);
                loadData();
             }}
          />
       )}
     </div>
  );
}
