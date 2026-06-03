import React, { useState, useEffect } from 'react';
import { Save, Plus, Settings } from 'lucide-react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { TenantProfile, Branch, BusinessRules, ProductionRules, ModuleFlags } from '../domain/types';

export function Configuracoes() {
  const { settingsRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(true);

  // States
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRules | null>(null);
  const [productionRules, setProductionRules] = useState<ProductionRules | null>(null);
  const [flags, setFlags] = useState<ModuleFlags | null>(null);

  useEffect(() => {
    loadAll();
  }, [settingsRepo]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, b, br, pr, f] = await Promise.all([
        settingsRepo.getProfile(),
        settingsRepo.getBranches(),
        settingsRepo.getBusinessRules(),
        settingsRepo.getProductionRules(),
        settingsRepo.getModuleFlags()
      ]);
      setProfile(p);
      setBranches(b);
      setBusinessRules(br);
      setProductionRules(pr);
      setFlags(f);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if(!profile) return;
    try {
      const updated = await settingsRepo.updateProfile(profile);
      setProfile(updated);
      alert('Perfil salvo com sucesso');
    } catch (e) { alert('Erro ao salvar'); }
  };

  const handleSaveBusinessRules = async () => {
    if(!businessRules) return;
    try {
      const updated = await settingsRepo.updateBusinessRules(businessRules);
      setBusinessRules(updated);
      alert('Regras salvas.');
    } catch (e) { alert('Erro ao salvar'); }
  };

  const handleSaveProductionRules = async () => {
    if(!productionRules) return;
    try {
      const updated = await settingsRepo.updateProductionRules(productionRules);
      setProductionRules(updated);
      alert('Regras salvas.');
    } catch (e) { alert('Erro ao salvar'); }
  };

  const handleSaveFlags = async () => {
    if(!flags) return;
    try {
      const updated = await settingsRepo.updateModuleFlags(flags);
      setFlags(updated);
      alert('Módulos salvos.');
    } catch (e) { alert('Erro ao salvar'); }
  };

  // Branch simple toggle
  const toggleBranch = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await settingsRepo.updateBranch(id, { status: newStatus });
    loadAll();
  };

  if(loading) return <div className="p-8 text-zinc-500">Caregando configurações...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-semibold text-zinc-50">Configurações do Sistema</h1>
        <p className="text-zinc-400 mt-1">Gerencie perfil, filiais e regras centrais do seu ERP.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex flex-col gap-1">
          {['empresa', 'unidades', 'comercial', 'producao', 'modulos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-left rounded-lg font-medium transition-colors ${
                activeTab === tab ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              }`}
            >
              {tab === 'empresa' ? 'Perfil da Empresa' : 
               tab === 'unidades' ? 'Unidades / Filiais' :
               tab === 'comercial' ? 'Regras Comerciais' :
               tab === 'producao' ? 'Regras de Produção' : 'Módulos do Sistema'}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 overflow-y-auto">
          {activeTab === 'empresa' && profile && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-zinc-100 border-b border-zinc-800 pb-2">Perfil da Empresa</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-zinc-400 mb-1">Nome Fantasia</label>
                  <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-zinc-400 mb-1">Razão Social</label>
                  <input value={profile.legalName || ''} onChange={e => setProfile({...profile, legalName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Documento (CNPJ/CPF)</label>
                  <input value={profile.document || ''} onChange={e => setProfile({...profile, document: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">E-mail de Contato</label>
                  <input value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Endereço Principal</label>
                  <input value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
              </div>
              <button onClick={handleSaveProfile} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
                <Save size={16} /> Salvar Perfil
              </button>
            </div>
          )}

          {activeTab === 'unidades' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h2 className="text-xl font-heading text-zinc-100">Unidades e Filiais</h2>
              </div>
              <div className="space-y-4">
                {branches.map(b => (
                  <div key={b.id} className="bg-zinc-800/20 border border-zinc-800 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="flex flex-col">
                         <div className="font-heading font-medium text-zinc-100 flex items-center gap-2">
                           {b.name}
                           {b.isDefault && <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase">Padrão</span>}
                         </div>
                         <div className="text-sm text-zinc-400 mt-1">{b.type} · {b.city}/{b.state}</div>
                      </div>
                    </div>
                    <div>
                       <span className={`text-xs px-2 py-1 rounded cursor-pointer ${b.status==='active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`} onClick={() => toggleBranch(b.id, b.status)}>
                         {b.status === 'active' ? 'Ativa' : 'Inativa'}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comercial' && businessRules && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-zinc-100 border-b border-zinc-800 pb-2">Regras Comerciais</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Prazo Padrão B2C (Dias)</label>
                  <input type="number" value={businessRules.defaultB2CPaymentTermsDays} onChange={e => setBusinessRules({...businessRules, defaultB2CPaymentTermsDays: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Prazo Padrão B2B (Dias)</label>
                  <input type="number" value={businessRules.defaultB2BPaymentTermsDays} onChange={e => setBusinessRules({...businessRules, defaultB2BPaymentTermsDays: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Prazo Acerto Consignação (Dias)</label>
                  <input type="number" value={businessRules.defaultConsignmentSettleDays} onChange={e => setBusinessRules({...businessRules, defaultConsignmentSettleDays: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Meta Faturamento Mensal (R$)</label>
                  <input type="number" value={businessRules.monthlyRevenueTarget} onChange={e => setBusinessRules({...businessRules, monthlyRevenueTarget: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div className="col-span-2 flex items-center gap-3 mt-2 bg-zinc-900 p-4 border border-zinc-800 rounded-lg">
                  <input type="checkbox" id="allowNeg" checked={businessRules.allowNegativeStock} onChange={e => setBusinessRules({...businessRules, allowNegativeStock: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                  <div>
                    <label htmlFor="allowNeg" className="text-zinc-100 font-medium">Permitir Estoque Negativo</label>
                    <p className="text-xs text-zinc-400">Ao faturar sem saldo, o estoque ficará no vermelho.</p>
                  </div>
                </div>
              </div>
              <button onClick={handleSaveBusinessRules} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
                <Save size={16} /> Salvar Regras
              </button>
            </div>
          )}

          {activeTab === 'producao' && productionRules && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-zinc-100 border-b border-zinc-800 pb-2">Regras de Produção</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Custo Hora Padrão (R$)</label>
                  <input type="number" value={productionRules.defaultHourCost} onChange={e => setProductionRules({...productionRules, defaultHourCost: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Custo Mestre de Torra (R$)</label>
                  <input type="number" value={productionRules.masterRoasterHourCost} onChange={e => setProductionRules({...productionRules, masterRoasterHourCost: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Rendimento Min. Esperado (%)</label>
                  <input type="number" value={productionRules.minExpectedYieldPercent} onChange={e => setProductionRules({...productionRules, minExpectedYieldPercent: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Perda Máx. Esperada (%)</label>
                  <input type="number" value={productionRules.maxExpectedLossPercent} onChange={e => setProductionRules({...productionRules, maxExpectedLossPercent: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none" />
                </div>
              </div>
              <button onClick={handleSaveProductionRules} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
                <Save size={16} /> Salvar Produção
              </button>
            </div>
          )}

          {activeTab === 'modulos' && flags && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-zinc-100 border-b border-zinc-800 pb-2">Módulos Dinâmicos</h2>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                   <div>
                     <div className="font-medium text-zinc-100">Módulo Comercial</div>
                     <div className="text-xs text-zinc-400">Vendas, pedidos e propostas.</div>
                   </div>
                   <input type="checkbox" checked={flags.sales} onChange={e => setFlags({...flags, sales: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                   <div>
                     <div className="font-medium text-zinc-100">Fiscal / NFe (Em breve)</div>
                     <div className="text-xs text-zinc-400">Emissão de notas fiscais.</div>
                   </div>
                   <input type="checkbox" checked={flags.fiscal_placeholder} disabled className="w-5 h-5 accent-amber-500 opacity-50" />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                   <div>
                     <div className="font-medium text-zinc-100">Storefront B2C (Em breve)</div>
                     <div className="text-xs text-zinc-400">E-commerce e Checkout Integrado.</div>
                   </div>
                   <input type="checkbox" checked={flags.storefront_placeholder} disabled className="w-5 h-5 accent-amber-500 opacity-50" />
                 </div>
              </div>
              <button onClick={handleSaveFlags} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
                <Save size={16} /> Salvar Módulos
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
