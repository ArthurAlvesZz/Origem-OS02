import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Plus, Coffee, Scale, Beaker, Clock, List, FileText, Activity, CheckCircle } from 'lucide-react';
import { ProductionBatchTable } from '../components/production/ProductionBatchTable';
import { ProductionBatchDrawer } from '../components/production/ProductionBatchDrawer';
import { ProductionDetailDrawer } from '../components/production/ProductionDetailDrawer';
import { ProductionBatch } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryProvider';

import { GreenLotsList } from '../components/production/advanced/GreenLotsList';
import { RecipeList } from '../components/production/advanced/RecipeList';
import { ProfileList } from '../components/production/advanced/ProfileList';
import { DemandList } from '../components/production/advanced/DemandList';
import { QualityList } from '../components/production/quality/QualityList';
import { TraceabilityList } from '../components/production/traceability/TraceabilityList';

import { AdvancedBatchDrawer } from '../components/production/advanced/AdvancedBatchDrawer';

type Tab = 'demand' | 'orders' | 'greens' | 'recipes' | 'profiles' | 'quality' | 'traceability';

export function Producao() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [demandInitialProduct, setDemandInitialProduct] = useState<string>();
  const [demandInitialQty, setDemandInitialQty] = useState<number>();
  const [detailBatch, setDetailBatch] = useState<ProductionBatch | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { productionRepo, advancedProductionRepo } = useRepositories();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);

  useEffect(() => {
    productionRepo.getBatches().then(setBatches);
  }, [productionRepo, refreshKey]);

  const handleComplete = () => {
    setIsNewOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  // Calculate metrics
  const totalProducedStr = batches.filter(b => b.status === 'Concluído').reduce((acc, b) => acc + b.finalWeight, 0).toFixed(1);
  const avgYieldStr = (batches.filter(b => b.status === 'Concluído' && b.yieldPercent > 0).reduce((acc, b) => acc + b.yieldPercent, 0) / Math.max(1, batches.filter(b => b.status === 'Concluído' && b.yieldPercent > 0).length)).toFixed(1);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" key={refreshKey}>
      <PageHeader 
        title="Controle de Produção" 
        description="Gestão de grãos verdes, receitas, perfis de torra e custeio." 
        action={
          <button 
            onClick={() => setIsNewOpen(true)}
            className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors shadow"
          >
            <Plus size={16} /> Nova Produção
          </button>
        }
      />

      <div className="flex overflow-x-auto pb-2 border-b border-zinc-800 gap-6 no-scrollbar mb-6">
        <button onClick={() => setActiveTab('demand')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'demand' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Activity size={16} /> Demanda (Sob Demanda)
           {activeTab === 'demand' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'orders' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <List size={16} /> Ordens de Produção
           {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('greens')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'greens' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Coffee size={16} /> Grãos Verdes
           {activeTab === 'greens' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('recipes')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'recipes' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <FileText size={16} /> Receitas
           {activeTab === 'recipes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('profiles')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'profiles' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Beaker size={16} /> Perfis de Torra
           {activeTab === 'profiles' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('quality')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'quality' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <CheckCircle size={16} /> Qualidade (CQ)
           {activeTab === 'quality' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('traceability')} className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'traceability' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
           <Activity size={16} /> Rastreabilidade
           {activeTab === 'traceability' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
               <div className="flex items-center gap-3 mb-2 text-zinc-400">
                  <Coffee size={18} className="text-amber-400" />
                  <span className="text-sm font-medium">Torrado no Mês</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{totalProducedStr} <span className="text-sm font-normal text-zinc-500">kg</span></div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
           <div className="flex items-center gap-3 mb-2 text-zinc-400">
              <Scale size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">Rendimento Médio</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{avgYieldStr}%</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
           <div className="flex items-center gap-3 mb-2 text-zinc-400">
              <Beaker size={18} className="text-sky-400" />
              <span className="text-sm font-medium">Lotes Ativos</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{batches.filter(b => b.status === 'Em Produção').length}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
           <div className="flex items-center gap-3 mb-2 text-zinc-400">
              <Clock size={18} className="text-purple-400" />
              <span className="text-sm font-medium">Total de Lotes</span>
           </div>
           <div className="text-2xl font-semibold text-zinc-50">{batches.length}</div>
        </div>
      </div>

      <ProductionBatchTable 
        batches={batches} 
        onOpenDetail={setDetailBatch} 
        onFinalize={() => {
          alert('Para testar finalização de um lote "Em Produção", use o botão de Ficha Técnica para visualizar ou crie um novo lote como Concluído.');
        }}
      />
      </>
      )}

      {activeTab === 'greens' && <GreenLotsList />}
      {activeTab === 'recipes' && <RecipeList />}
      {activeTab === 'profiles' && <ProfileList />}
      {activeTab === 'quality' && <QualityList />}
      {activeTab === 'traceability' && <TraceabilityList />}
      {activeTab === 'demand' && <DemandList onProduce={(productId, qty) => {
         setDemandInitialProduct(productId);
         setDemandInitialQty(qty);
         setIsNewOpen(true);
      }} />}

      {isNewOpen && (
        <AdvancedBatchDrawer 
            initialProductId={demandInitialProduct} 
            initialQuantity={demandInitialQty} 
            onClose={() => {
                setIsNewOpen(false);
                setDemandInitialProduct(undefined);
                setDemandInitialQty(undefined);
            }} 
            onSuccess={() => {
                setIsNewOpen(false);
                setDemandInitialProduct(undefined);
                setDemandInitialQty(undefined);
                handleComplete();
            }} 
        />
      )}

      {detailBatch && (
        <ProductionDetailDrawer onClose={() => setDetailBatch(null)} batch={detailBatch} />
      )}

    </div>
  );
}
