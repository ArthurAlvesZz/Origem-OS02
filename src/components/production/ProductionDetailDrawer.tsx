import { X, Beaker, Factory, FileText } from 'lucide-react';
import { ProductionBatch } from '../../domain/types';

interface ProductionDetailDrawerProps {
  onClose: () => void;
  batch: ProductionBatch;
}

export function ProductionDetailDrawer({ onClose, batch }: ProductionDetailDrawerProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950">
          <div>
            <h2 className="text-lg font-heading font-semibold text-zinc-50 tracking-tight">Ficha Técnica de Produção</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{batch.code} &bull; {new Date(batch.date).toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">Produto Final</div>
                   <div className="text-lg font-medium text-zinc-50">{batch.finalProductName}</div>
                </div>
                <div className="text-right">
                   <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Quantidade</div>
                   <div className="text-lg font-medium text-zinc-100">{batch.finalQty} un</div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4">
                <div>
                   <div className="text-xs text-zinc-500 mb-1">Peso Inicial (Insumos)</div>
                   <div className="font-medium text-zinc-300">{batch.initialWeight} kg</div>
                </div>
                <div>
                   <div className="text-xs text-zinc-500 mb-1">Peso Final (Torrado)</div>
                   <div className="font-medium text-zinc-300">{batch.finalWeight} kg</div>
                </div>
                <div>
                   <div className="text-xs text-zinc-500 mb-1">Quebra / Perda</div>
                   <div className="font-medium text-red-400">{batch.lossPercent.toFixed(1)}%</div>
                </div>
                <div>
                   <div className="text-xs text-zinc-500 mb-1">Rendimento Volumétrico</div>
                   <div className="font-medium text-emerald-400">{batch.yieldPercent.toFixed(1)}%</div>
                </div>
             </div>
          </div>

          <div>
             <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Custos Diretos (CPV)</h3>
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-zinc-800">
                    {/* Insumos */}
                    <tr>
                      <td className="p-3 text-zinc-400 bg-zinc-900/50" colSpan={2}><Factory size={14} className="inline mr-2"/> Insumos</td>
                    </tr>
                    {batch.inputs.map(i => (
                      <tr key={i.productId}>
                        <td className="p-3 text-zinc-300 pl-8">{i.name} ({i.qty})</td>
                        <td className="p-3 text-right text-zinc-300">R$ {(i.qty * i.unitCost).toFixed(2)}</td>
                      </tr>
                    ))}
                    {/* Extras */}
                    {batch.extraCosts.length > 0 && (
                      <tr>
                        <td className="p-3 text-zinc-400 bg-zinc-900/50" colSpan={2}><Beaker size={14} className="inline mr-2"/> Custos Extras</td>
                      </tr>
                    )}
                    {batch.extraCosts.map((e, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-zinc-300 pl-8">{e.description}</td>
                        <td className="p-3 text-right text-zinc-300">R$ {e.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {/* Labor */}
                    <tr>
                      <td className="p-3 text-zinc-400 bg-zinc-900/50" colSpan={2}><FileText size={14} className="inline mr-2"/> Mão de Obra</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-zinc-300 pl-8">{batch.hours}h de trabalho</td>
                      <td className="p-3 text-right text-zinc-300">R$ {batch.totalLaborCost.toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-zinc-950 font-medium">
                    <tr>
                      <td className="p-3 text-zinc-400">Custo Total de Produção</td>
                      <td className="p-3 text-right text-amber-400">R$ {batch.totalCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-emerald-400 font-semibold border-t border-zinc-800">Custo Unitário</td>
                      <td className="p-3 text-right text-emerald-400 font-semibold border-t border-zinc-800">R$ {batch.unitCost.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
             </div>
          </div>

          {batch.notes && (
             <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm">
                <strong>Observações:</strong> {batch.notes}
             </div>
          )}

        </div>
      </div>
    </>
  );
}
