import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { PublicLotTrace } from '../../../domain/types';

import QRCode from 'react-qr-code';
import { PrintLabel } from './PrintLabel';

interface TraceabilityDrawerProps {
  traceId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TraceabilityDrawer({ traceId, onClose, onSuccess }: TraceabilityDrawerProps) {
  const { traceabilityRepo, qualityRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<PublicLotTrace | null>(null);
  
  const [isCreating, setIsCreating] = useState(!traceId);
  const [approvedReviews, setApprovedReviews] = useState<any[]>([]);
  
  // Form fields
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  
  useEffect(() => {
    if (traceId) {
      loadTrace();
    } else {
      loadApprovedReviews();
    }
  }, [traceId]);

  const loadTrace = async () => {
    try {
      const data = await traceabilityRepo.getById(traceId!);
      if (data) {
        setTrace(data);
        setTitle(data.title);
        setSummary(data.summary || '');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar rastreio');
    }
  };

  const loadApprovedReviews = async () => {
    try {
      const all = await qualityRepo.getReviews();
      const approved = all.filter(r => r.status === 'approved' || r.status === 'approved_with_notes');
      setApprovedReviews(approved);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isCreating) {
        if (!selectedReviewId) throw new Error('Selecione um lote aprovado');
        if (!title) throw new Error('Informe o título público');
        
        // Em um app real, buscaríamos os descriptors originais para o DTO
        // Aqui, para simplificar a demo, passamos vazio ou simulamos
        await traceabilityRepo.createFromQualityReview({
          qualityReviewId: selectedReviewId,
          title,
          summary,
        });
      } else {
        await traceabilityRepo.update(trace!.id, {
          title,
          summary
        });
      }
      onSuccess();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!trace) return;
    setLoading(true);
    try {
      await traceabilityRepo.publish(trace.id);
      onSuccess();
    } catch (e) {
      alert('Erro ao publicar');
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!trace) return;
    setLoading(true);
    try {
      await traceabilityRepo.unpublish(trace.id);
      onSuccess();
    } catch (e) {
      alert('Erro ao despublicar');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm print:bg-transparent print:backdrop-blur-none">
      <div className="w-full max-w-lg bg-zinc-950 h-full shadow-2xl border-l border-zinc-800 flex flex-col print:shadow-none print:border-none print:w-auto print:max-w-none print:bg-white">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 no-print">
          <h2 className="text-lg font-heading font-semibold text-zinc-50">
            {isCreating ? 'Novo Rastreio' : 'Detalhes do Rastreio'}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 print:p-0 print:space-y-0 overflow-y-auto print:overflow-visible">
          {/* Form inside a wrapper with no-print */}
          <div className="space-y-6 no-print">
            {isCreating && (
              <div className="space-y-4">
                 <label className="block text-sm font-medium text-zinc-400">Selecionar Lote (Quality Review Aprovado)</label>
               <select
                 value={selectedReviewId}
                 onChange={e => setSelectedReviewId(e.target.value)}
                 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50"
               >
                 <option value="">Selecione...</option>
                 {approvedReviews.map(r => (
                   <option key={r.id} value={r.id}>
                      CQ#{r.id.substring(0,6)} - Score: {r.scoreTotal}
                   </option>
                 ))}
               </select>
               {approvedReviews.length === 0 && (
                 <p className="text-xs text-amber-500 flex items-center gap-1"><AlertTriangle size={14} /> Nenhum lote aprovado no CQ.</p>
               )}
            </div>
          )}

          {!isCreating && trace && (
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                 <div>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1">Código Público</p>
                   <p className="font-mono text-zinc-200 text-lg">{trace.publicCode}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1">Status</p>
                   {trace.status === 'published' ? (
                     <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><CheckCircle2 size={16}/> Publicado</span>
                   ) : trace.status === 'unpublished' ? (
                     <span className="text-rose-400 text-sm font-medium">Inativo</span>
                   ) : (
                     <span className="text-zinc-400 text-sm font-medium">Rascunho</span>
                   )}
                 </div>
              </div>
              
              {trace.status === 'published' && (
                <div className="pt-4 flex flex-col items-center border-b border-zinc-800 pb-4">
                   <div className="bg-white p-2 rounded-lg mb-4">
                     <QRCode 
                        id="QRCodePreview"
                        value={`${window.location.origin}/lote/${trace.publicCode}`} 
                        size={120} 
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                     />
                   </div>
                   
                   <p className="text-xs text-zinc-500 uppercase font-medium mb-2 w-full text-left">Link Público</p>
                   <div className="flex w-full items-center gap-2 mb-4">
                      <input 
                         type="text" 
                         readOnly
                         value={`${window.location.origin}/lote/${trace.publicCode}`}
                         className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 font-mono"
                      />
                      <button 
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/lote/${trace.publicCode}`)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center shrink-0"
                        title="Copiar"
                      >
                         Copiar
                      </button>
                      <button 
                        onClick={() => {
                          const svg = document.getElementById("QRCodePreview");
                          if (!svg) return;
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          const img = new Image();
                          img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              if (ctx) {
                                ctx.fillStyle = "white";
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0);
                              }
                              const pngFile = canvas.toDataURL("image/png");
                              const downloadLink = document.createElement("a");
                              downloadLink.download = `QR-${trace.publicCode}.png`;
                              downloadLink.href = pngFile;
                              downloadLink.click();
                          };
                          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-amber-500 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center shrink-0"
                        title="Baixar QR (PNG)"
                      >
                         PNG
                      </button>
                      <a 
                        href={`/lote/${trace.publicCode}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shrink-0"
                      >
                         <ExternalLink size={14} />
                      </a>
                   </div>
                   
                   <button 
                     onClick={() => window.print()}
                     className="w-full border py-3 rounded-lg text-sm font-bold border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                   >
                     Imprimir Etiqueta (QR Code)
                   </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
             <label className="block text-sm font-medium text-zinc-400">Título Público</label>
             <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Cerrado Ouro - Safra 2024"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50"
             />
          </div>
          
          <div className="space-y-4">
             <label className="block text-sm font-medium text-zinc-400">Resumo / História (Opcional)</label>
             <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={4}
                placeholder="Conte a história deste lote..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50 resize-none"
             />
          </div>
          
          </div>{/* Close no-print wrapper */}

          {/* Hidden label for printing - now OUTSIDE the no-print wrapper! */}
          {!isCreating && trace && trace.status === 'published' && (
            <PrintLabel trace={trace} size="small" />
          )}

        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 space-y-4 no-print">
          <button
            onClick={handleSave}
            disabled={loading || (isCreating && !selectedReviewId)}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Detalhes'}
          </button>
          
          {!isCreating && trace && (
            <div className="grid grid-cols-2 gap-4">
              {trace.status !== 'published' ? (
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600/30 px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Publicar Lote
                </button>
              ) : (
                <button
                  onClick={handleUnpublish}
                  disabled={loading}
                  className="w-full bg-rose-600/20 text-rose-500 border border-rose-500/20 hover:bg-rose-600/30 px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Despublicar Lote
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
