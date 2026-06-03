import React, { useEffect, useState } from 'react';
import { Coffee, MapPin, Calendar, Activity, CheckCircle2, Award, ChevronRight } from 'lucide-react';
import { PublicLotTrace } from '../domain/types';
import { safeFetch } from '../repositories/api/apiClient';
import { useRepositories } from '../repositories/RepositoryProvider';

export function RastreabilidadePublica() {
  const publicCode = window.location.pathname.split('/').pop() || '';
  const [loading, setLoading] = useState(true);
  const [trace, setTrace] = useState<PublicLotTrace | null>(null);
  const [error, setError] = useState('');
  
  const { traceabilityRepo } = useRepositories();

  useEffect(() => {
    if (!publicCode || publicCode === 'lote') {
      setError('Código de lote inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    traceabilityRepo.getByPublicCode(publicCode)
      .then(res => {
        if (!res) throw new Error('Não encontrado');
        setTrace(res);
      })
      .catch(err => {
        console.error(err);
        setError('Rastreabilidade não encontrada ou indisponível.');
      })
      .finally(() => setLoading(false));
  }, [publicCode, traceabilityRepo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
         <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-sm tracking-widest uppercase">Carregando lote...</p>
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 p-6">
         <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
           <MapPin size={24} className="text-zinc-600" />
         </div>
         <h1 className="text-xl font-heading text-zinc-300 font-medium mb-2">Lote não encontrado</h1>
         <p className="text-sm text-center max-w-sm mb-8">{error}</p>
         <a href="/" className="text-sm uppercase tracking-wider font-bold text-amber-500 hover:text-amber-400">Voltar para o início</a>
      </div>
    );
  }

  // Parse JSONs
  let descriptors: string[] = [];
  try { if (trace.publicDescriptorsJson) descriptors = JSON.parse(trace.publicDescriptorsJson); } catch (e) {}

  let origin: any = null;
  try { if (trace.publicOriginJson) origin = JSON.parse(trace.publicOriginJson); } catch (e) {}

  let roast: any = null;
  try { if (trace.roastInfoJson) roast = JSON.parse(trace.roastInfoJson); } catch (e) {}

  let product: any = null;
  try { if (trace.productInfoJson) product = JSON.parse(trace.productInfoJson); } catch (e) {}

  const publishedDate = trace.publishedAt ? new Date(trace.publishedAt).toLocaleDateString('pt-BR') : '';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans pb-20 sm:pb-0">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-20 px-6 overflow-hidden border-b border-zinc-900">
        <div className="absolute inset-0 bg-amber-950/10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-zinc-950/50 to-zinc-950"></div>
        <div className="relative max-w-lg mx-auto text-center flex flex-col items-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-8">
             <CheckCircle2 size={12} />
             Lote Aprovado pela Torrefação
           </div>
           
           <h1 className="text-4xl md:text-5xl font-heading font-semibold tracking-tight mb-4">
             {trace.title}
           </h1>
           
           <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-500 mb-8">
              <span>LOTE #{trace.publicCode}</span>
              <span>•</span>
              <span>{publishedDate}</span>
           </div>

           {trace.summary && (
             <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-md">
               {trace.summary}
             </p>
           )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12 space-y-12">
         {/* Score Section */}
         {trace.publicScore && (
           <div className="flex flex-col items-center">
             <div className="w-24 h-24 rounded-full border-2 border-amber-500/30 flex flex-col items-center justify-center bg-amber-500/5 relative">
                <div className="absolute top-0 -translate-y-1/2 bg-zinc-950 px-2 text-amber-500">
                  <Award size={20} />
                </div>
                <span className="text-3xl font-heading font-bold text-amber-500">{trace.publicScore}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">SCA Pts</span>
             </div>
           </div>
         )}

         {/* Origins Info */}
         {origin && (
           <section className="space-y-4">
             <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
               <MapPin size={14} /> Origem do Grão
             </h3>
             <div className="grid grid-cols-2 gap-px bg-zinc-800/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <div className="bg-zinc-900 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide mb-1">Fazenda/Sítio</div>
                  <div className="text-sm font-medium">{origin.farm || '-'}</div>
                </div>
                <div className="bg-zinc-900 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide mb-1">Região</div>
                  <div className="text-sm font-medium">{origin.region || '-'}</div>
                </div>
                <div className="bg-zinc-900 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide mb-1">Altitude</div>
                  <div className="text-sm font-medium">{origin.altitude || '-'}</div>
                </div>
                <div className="bg-zinc-900 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide mb-1">Safra</div>
                  <div className="text-sm font-medium">{origin.cropYear || '-'}</div>
                </div>
             </div>
           </section>
         )}

         {/* Sensorial Profile */}
         {descriptors.length > 0 && (
           <section className="space-y-4">
             <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
               <Coffee size={14} /> Perfil Sensorial
             </h3>
             <div className="flex flex-wrap gap-2">
               {descriptors.map((desc: string, i: number) => (
                 <div key={i} className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-sm font-medium">
                   {desc}
                 </div>
               ))}
             </div>
           </section>
         )}

         {/* Roast details */}
         {roast && (
           <section className="space-y-4">
             <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
               <Activity size={14} /> Torra
             </h3>
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                   <div>
                     <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide mb-1">Data da Torra</div>
                     <div className="text-sm font-medium">{roast.roastDate ? new Date(roast.roastDate).toLocaleDateString('pt-BR') : '-'}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide mb-1">Ponto de Torra</div>
                     <div className="text-sm font-medium text-amber-500">{roast.roastLevel || '-'}</div>
                   </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  Este lote foi torrado sob rigoroso controle de parâmetros, acompanhando a curva ideal de desenvolvimento para evidenciar suas características nativas.
                </p>
             </div>
           </section>
         )}
      </div>

      {/* Footer / CTA */}
      <div className="bg-zinc-900 border-t border-zinc-800 mt-12 py-12 px-6 text-center">
         <div className="max-w-md mx-auto">
            <h2 className="text-lg font-heading font-medium text-zinc-300 mb-4">Gostou deste café?</h2>
            <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto">Receba lotes premiados e exclusivos como este torrados sob demanda na sua porta.</p>
            <a href="/loja" className="inline-flex items-center gap-2 bg-zinc-50 text-zinc-950 px-8 py-4 uppercase font-bold tracking-wider text-sm hover:bg-zinc-200 transition-colors">
              Conhecer Assinatura <ChevronRight size={18} />
            </a>
         </div>
      </div>
    </div>
  );
}
