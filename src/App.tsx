import { useState } from 'react';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { Comercial } from './pages/Comercial';
import { Catalogo } from './pages/Catalogo';
import { Estoque } from './pages/Estoque';
import { Consignacao } from './pages/Consignacao';
import { Clientes } from './pages/Clientes';
import { Producao } from './pages/Producao';
import { Financeiro } from './pages/Financeiro';
import { Fiscal } from './pages/Fiscal';
import { Configuracoes } from './pages/Configuracoes';
import { Relatorios } from './pages/Relatorios';
import { RepositoryProvider, DataProviderType } from './repositories/RepositoryProvider';

import { Equipe } from './pages/Equipe';
import { AssinaturasAdmin } from './pages/AssinaturasAdmin';
import { LojaPublica } from './pages/LojaPublica';
import { RastreabilidadePublica } from './pages/RastreabilidadePublica';
import { Crm } from './pages/Crm';
import { ConexaoServidor } from './pages/ConexaoServidor';

import { B2BCatalog } from './pages/B2BCatalog';

export type Page = 'dashboard' | 'comercial' | 'clientes' | 'crm' | 'catalogo' | 'b2bcatalog' | 'estoque' | 'producao' | 'financeiro' | 'rh' | 'fiscal' | 'consignacao' | 'assinaturas' | 'config' | 'relatorios' | 'conexao';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [providerType, setProviderType] = useState<DataProviderType>(
    localStorage.getItem('DATA_MODE') === 'api' ? 'api' : 'mock'
  );
  const [hasFallenBack, setHasFallenBack] = useState(false);

  if (window.location.pathname === '/loja') {
    return (
      <RepositoryProvider providerType={providerType} onFallbackToMock={() => setHasFallenBack(true)}>
        <LojaPublica />
      </RepositoryProvider>
    );
  }

  if (window.location.pathname.startsWith('/lote/')) {
    return (
      <RepositoryProvider providerType={providerType} onFallbackToMock={() => setHasFallenBack(true)}>
        <RastreabilidadePublica />
      </RepositoryProvider>
    );
  }

  const toggleProvider = () => {
    const next = providerType === 'mock' ? 'api' : 'mock';
    localStorage.setItem('DATA_MODE', next);
    setProviderType(next);
    window.location.reload();
  };

  const handleFallback = () => {
    setHasFallenBack(true);
    // don't change providerType manually or localStorage to avoid forcing users, 
    // it will just fallback dynamically for this session.
  };

  // Helper attached to window for manual testing of API directly in preview
  // without building a full UI right now.
  (window as any).loginAdmin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.local', password: 'admin123' })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('gestaoos_token', data.token);
      alert('Login feito! Token salvo.');
    } else {
      alert('Falha: ' + JSON.stringify(data));
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': 
        return <Dashboard />;
      case 'comercial':
        return <Comercial />;
      case 'clientes':
        return <Clientes />;
      case 'crm':
        return <Crm />;
      case 'catalogo':
        return <Catalogo />;
      case 'b2bcatalog':
        return <B2BCatalog />;
      case 'estoque':
        return <Estoque />;
      case 'producao':
        return <Producao />;
      case 'financeiro':
        return <Financeiro />;
      case 'rh':
        return <Equipe />;
      case 'fiscal':
        return <Fiscal />;
      case 'consignacao':
        return <Consignacao />;
      case 'assinaturas':
        return <AssinaturasAdmin />;
      case 'conexao':
        return <ConexaoServidor />;
      case 'config':
        return <Configuracoes />;
      case 'relatorios':
        return <Relatorios />;
      default: 
        return (
          <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center text-center mt-20">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-2xl flex items-center justify-center mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 2 6 6-6-6Z"/><path d="M4 22h14a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>
            </div>
            <h2 className="text-2xl font-heading font-semibold text-zinc-50 capitalize mb-2">{String(currentPage).replace('-', ' ')}</h2>
            <p className="text-zinc-400 text-sm max-w-md">Este módulo será implementado na próxima fase. A estrutura visual base de navegação e layouts já está consolidada.</p>
          </div>
        );
    }
  };

  return (
    <RepositoryProvider providerType={providerType} onFallbackToMock={handleFallback}>
      {hasFallenBack && (
        <div className="bg-red-950 border-b border-red-900/50 text-red-500 text-sm px-4 py-3 text-center relative z-[60] flex flex-col sm:flex-row items-center justify-center gap-2">
          <span><strong>Erro de Conexão:</strong> Não foi possível acessar o servidor da base de dados ({localStorage.getItem('gestaoos_api_base_url') || 'Local'}).</span>
          <button onClick={() => setCurrentPage('conexao')} className="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ml-2">Configurar Conexão</button>
        </div>
      )}
      <Shell currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Shell>
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 md:bottom-6 right-6 flex flex-col gap-2 z-50 items-end opacity-50 hover:opacity-100 transition-opacity">
          <button 
            onClick={toggleProvider}
            className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-500 px-3 py-1.5 rounded-md hover:text-amber-500 hover:border-amber-500/50 shadow-xl transition-all"
          >
            {hasFallenBack ? 'MOCK FLBK' : providerType.toUpperCase()}
          </button>
        </div>
      )}
    </RepositoryProvider>
  );
}
