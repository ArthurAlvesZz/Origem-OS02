import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, PackageX, Clock, AlertCircle, ChevronRight, FileText, Factory, Loader2 } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { useRepositories } from '../repositories/RepositoryProvider';
import { DashboardSummary, DashboardAlert, DashboardActivity } from '../domain/types';

const revenueData = [
  { name: '1', recebido: 1200, previsto: 1500 },
  { name: '5', recebido: 2100, previsto: 2400 },
  { name: '10', recebido: 3400, previsto: 3400 },
  { name: '15', recebido: 4800, previsto: 5200 },
  { name: '20', recebido: 5900, previsto: 7000 },
  { name: '25', recebido: 8000, previsto: 9100 },
  { name: '30', recebido: 12500, previsto: 14000 },
];

export function Dashboard() {
  const { dashboardRepo } = useRepositories();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [dashboardRepo]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, alts] = await Promise.all([
        dashboardRepo.getSummary(),
        dashboardRepo.getAlerts()
      ]);
      setSummary(sum);
      setAlerts(alts);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error || 'Não foi possível carregar os dados.'}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-zinc-800 rounded text-zinc-100">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Metric Cards - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <MetricCard 
          title="Faturamento Mensal"
          value={`R$ ${(summary.faturamentoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${summary.faturamentoMes >= summary.metaFaturamento ? '+' : ''}${((summary.faturamentoMes / summary.metaFaturamento) * 100).toFixed(1)}%`}
          trendUp={summary.faturamentoMes >= summary.metaFaturamento}
          subtitle={`Meta: R$ ${summary.metaFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />

        <MetricCard 
          title="Lucro Estimado"
          value={`R$ ${summary.lucroEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${summary.margemBruta.toFixed(1)}%`}
          trendUp={summary.margemBruta > 30}
          subtitle="Margem Bruta"
        />

        <MetricCard 
          title="Contas a Receber"
          value={<span className="text-amber-400">R$ {summary.contasReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
          trend=""
          trendUp={false}
          subtitle="Valores pendentes"
        />

        <div className="bg-zinc-900 border border-zinc-500/30 p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <PackageX size={64} className="text-zinc-50" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-zinc-400 mb-1">Estoque Crítico</div>
            <div className="text-2xl font-heading font-semibold text-zinc-50">{summary.estoqueCritico} produtos</div>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${summary.estoqueCritico > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {summary.estoqueCritico > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                    Requer Atenção
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Normal
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-semibold text-zinc-50">Fluxo de Caixa (Mês Atual)</h3>
              <p className="text-sm text-zinc-400">Receitas consolidadas vs Previsão</p>
            </div>
            <button className="text-sm font-medium text-zinc-400 hover:text-zinc-50 flex items-center gap-1 transition-colors">
              Detalhes
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#8E7A68' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#8E7A68' }}
                  tickFormatter={(val) => `R$ ${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#26221E' }}
                  contentStyle={{ backgroundColor: '#181512', borderRadius: '8px', border: '1px solid #3B342E', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                  labelStyle={{ fontWeight: 600, color: '#FAF9F7', marginBottom: '4px' }}
                  itemStyle={{ color: '#D8D0C9' }}
                />
                <Bar dataKey="recebido" name="Recebido" fill="#C59868" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="previsto" name="Previsto a Receber" fill="#3B342E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-6">
          {/* Important Tasks */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-zinc-50">Atenção Necessária</h3>
              <span className="bg-zinc-800 text-zinc-300 text-xs font-semibold px-2 py-1 rounded-full">{alerts.length}</span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-950/20">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                    <AlertCircle size={18} />
                  </div>
                  <p className="text-sm font-medium text-zinc-300">Tudo sob controle</p>
                  <p className="text-xs text-zinc-500 mt-1">Nenhum alerta crítico ou atenção necessária no momento.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="px-5 py-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                    <div className="flex gap-3">
                      <div className={`mt-0.5 ${
                        alert.severity === 'high' ? 'text-red-500' :
                        alert.severity === 'medium' ? 'text-amber-500' : 'text-zinc-400'
                      }`}>
                        {alert.type === 'consignacao_vencida' || alert.type === 'conta_vencida' ? <Clock size={18} /> : null}
                        {alert.type === 'estoque_baixo' ? <AlertCircle size={18} /> : null}
                        {alert.type === 'outro' ? <FileText size={18} /> : null}
                        {alert.type === 'producao_aberta' ? <Factory size={18} /> : null}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-50 group-hover:underline decoration-zinc-500 underline-offset-2">{alert.title}</p>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

          {/* Quick Stats Mini */}
          <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-5">
             <div className="flex justify-between items-start">
               <div>
                 <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Café Produzido (Mês)</div>
                 <div className="text-2xl font-heading font-semibold text-zinc-50">{summary.producaoMes.toFixed(1)} kg</div>
               </div>
               <div className="p-2 bg-zinc-700/50 rounded-lg text-zinc-300">
                 <Factory size={20} />
               </div>
             </div>
             <div className="mt-4 text-xs font-medium text-emerald-400">
               Custo estimado: R$ {summary.custoProducao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
