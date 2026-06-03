import { ProductionBatch } from '../../domain/types';
import { Ban, Settings2, ArrowDownToLine, ArrowUpToLine, FileText } from 'lucide-react';

interface ProductionBatchTableProps {
  batches: ProductionBatch[];
  onOpenDetail: (b: ProductionBatch) => void;
  onFinalize?: (b: ProductionBatch) => void;
}

export function ProductionBatchTable({ batches, onOpenDetail, onFinalize }: ProductionBatchTableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Lote / Data</th>
              <th className="px-6 py-4 font-medium">Produto</th>
              <th className="px-6 py-4 font-medium text-right">Rendimento</th>
              <th className="px-6 py-4 font-medium text-right">Custo Un.</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-mono text-zinc-50 text-sm">{b.code}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{new Date(b.date).toLocaleDateString('pt-BR')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-50">{b.finalProductName}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{b.finalQty} un &bull; Resp: {b.responsible.split(' ')[0]}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={b.yieldPercent < 80 && b.yieldPercent > 0 ? 'text-red-400 font-medium' : 'text-zinc-300 font-medium'}>
                    {b.yieldPercent > 0 ? `${b.yieldPercent.toFixed(1)}%` : '-'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{b.initialWeight}kg &rarr; {b.finalWeight}kg</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-emerald-400 font-medium">
                    {b.unitCost > 0 ? `R$ ${b.unitCost.toFixed(2)}` : '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    ['Concluído', 'completed'].includes(b.status as string) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    ['Em Produção', 'roasting'].includes(b.status as string) ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                    ['Cancelado', 'cancelled'].includes(b.status as string) ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                    ['Rascunho', 'draft'].includes(b.status as string) ? 'bg-zinc-800 text-zinc-500 border-zinc-700' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {(b.status as string) === 'completed' ? 'Concluído' : 
                     (b.status as string) === 'roasting' ? 'Torrando' :
                     (b.status as string) === 'cancelled' ? 'Cancelado' :
                     (b.status as string) === 'draft' ? 'Rascunho' :
                     b.status}
                  </span>
                  
                  {b.qualityReviews && b.qualityReviews.length > 0 && (
                     <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                         b.qualityReviews[0].status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                         b.qualityReviews[0].status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                         'bg-amber-500/10 text-amber-500 border-amber-500/20'
                     }`}>
                        {b.qualityReviews[0].status === 'approved' ? 'CQ: Aprovado' : 
                         b.qualityReviews[0].status === 'rejected' ? 'CQ: Reprovado' : 
                         'CQ: Pendente'}
                     </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => onOpenDetail(b)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors inline-block"
                    title="Ver Ficha Técnica"
                  >
                    <FileText size={16} />
                  </button>
                  {onFinalize && b.status === 'Em Produção' && (
                    <button 
                      onClick={() => onFinalize(b)}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors inline-block"
                      title="Finalizar Lote"
                    >
                      <ArrowDownToLine size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            
            {batches.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12">
                   <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                        <FileText className="text-zinc-500" size={20} />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">Nenhum lote de produção</p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm">Os lotes de produção aparecerão aqui. Clique em "Nova Produção" ou use a tela de Demandas para criar.</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
