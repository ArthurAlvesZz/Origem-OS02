import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { PublicLotTrace } from '../../../domain/types';
import { Activity, Plus, Eye, Key, MapPin, Search } from 'lucide-react';
import { TraceabilityDrawer } from './TraceabilityDrawer';

export function TraceabilityList() {
  const { traceabilityRepo } = useRepositories();
  const [traces, setTraces] = useState<PublicLotTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>();

  useEffect(() => {
    loadTraces();
  }, []);

  const loadTraces = async () => {
    setLoading(true);
    try {
      const data = await traceabilityRepo.getAll();
      setTraces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full font-medium border border-emerald-500/20">Publicado</span>;
      case 'unpublished':
        return <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-full font-medium border border-rose-500/20">Inativo</span>;
      default:
        return <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 text-xs rounded-full font-medium border border-zinc-500/20">Rascunho</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold text-zinc-50">Rastreabilidade Pública</h2>
          <p className="text-sm text-zinc-400">Gerencie lotes aprovados e crie links públicos para seus clientes.</p>
        </div>
        <button
          onClick={() => {
             setSelectedTraceId(undefined);
             setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Novo Rastreio
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-zinc-500">Carregando rastreios...</div>
        ) : traces.length === 0 ? (
           <div className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                   <MapPin className="text-zinc-500" size={20} />
                 </div>
                 <p className="text-sm font-medium text-zinc-300">Nenhum rastreio configurado</p>
                 <p className="text-xs text-zinc-500 mt-1 max-w-sm">Use o botão "Novo Rastreio" para selecionar um lote aprovado do Controle de Qualidade.</p>
              </div>
           </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-4 font-medium">Lote / Código Público</th>
                <th className="p-4 font-medium">Título</th>
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {traces.map((trace) => (
                <tr key={trace.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="p-4">
                    <div className="font-mono text-zinc-200">{trace.publicCode}</div>
                  </td>
                  <td className="p-4 font-medium text-zinc-200">
                    {trace.title}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {new Date(trace.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {renderStatus(trace.status)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedTraceId(trace.id);
                        setIsDrawerOpen(true);
                      }}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-500 transition-colors inline-block"
                      title="Detalhes"
                    >
                      <Search size={18} />
                    </button>
                    {trace.status === 'published' && (
                       <a
                          href={`/lote/${trace.publicCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors inline-block"
                          title="Visualizar Página Pública"
                       >
                         <Eye size={18} />
                       </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isDrawerOpen && (
        <TraceabilityDrawer
          traceId={selectedTraceId}
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={() => {
             setIsDrawerOpen(false);
             loadTraces();
          }}
        />
      )}
    </div>
  );
}
