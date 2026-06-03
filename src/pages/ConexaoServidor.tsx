import React, { useState, useEffect } from 'react';
import { Server, Activity, Shield, Trash2, Database, Wifi, Loader2, Globe, Cpu } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, clearApiBaseUrl, safeFetch } from '../repositories/api/apiClient';

export function ConexaoServidor() {
  const [dataMode, setDataMode] = useState<'mock' | 'api'>(
    (localStorage.getItem('DATA_MODE') as any) || 'mock'
  );
  const [baseUrl, setLocalBaseUrl] = useState(getApiBaseUrl());
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    details?: any;
    uptime?: number;
  }>({ status: null, message: '' });

  const handleSave = () => {
    let finalUrl = baseUrl.trim();
    if (finalUrl.endsWith('/')) {
       finalUrl = finalUrl.slice(0, -1);
    }
    
    const token = localStorage.getItem('gestaoos_token');

    if (dataMode === 'api') {
      setApiBaseUrl(finalUrl);
      localStorage.setItem('DATA_MODE', 'api');
    } else {
      clearApiBaseUrl();
      localStorage.setItem('DATA_MODE', 'mock');
    }

    if (token) {
        if (confirm("Ao alterar a conexão com o servidor, é necessário fazer login novamente. Deseja continuar?")) {
            localStorage.removeItem('gestaoos_token');
            window.location.reload();
        }
    } else {
        window.location.reload();
    }
  };

  const testConnection = async () => {
      setIsTesting(true);
      setTestResult({ status: null, message: '' });
      
      let testUrl = baseUrl.trim();
      if (testUrl.endsWith('/')) testUrl = testUrl.slice(0, -1);
      if (!testUrl && dataMode === 'api') {
          // If empty string but api mode, implies same origin
          testUrl = window.location.origin;
      }
      
      try {
          // Temporarily use the normal fetch instead of safeFetch to isolate connection issues cleanly
          // without headers or interception just for basic connection.
          const res = await fetch(`${testUrl}/api/system/status`);
          if (!res.ok) {
              setTestResult({ status: 'error', message: `Erro HTTP: ${res.status}` });
              return;
          }
          
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
              setTestResult({ status: 'error', message: 'Servidor retornou HTML/Inválido em vez de JSON. Verifique a URL.'});
              return;
          }
          
          const data = await res.json();
          setTestResult({
              status: 'success',
              message: 'Conexão estabelecida com sucesso',
              details: data,
              uptime: data.uptime
          });
      } catch (err: any) {
          setTestResult({ status: 'error', message: err.message || 'Falha ao conectar no servidor (Offline ou Erro de CORS)'});
      } finally {
          setIsTesting(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-medium text-zinc-50">Conexão com Servidor</h1>
        <p className="text-zinc-400">
          Gerencie o acesso do aplicativo à base de dados. O banco de dados fica protegido
          num servidor remoto ou local, e este app consome esses dados via API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Config */}
        <div className="md:col-span-2 space-y-6">
           <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6">
              <h2 className="text-lg font-medium text-zinc-50 mb-6 flex items-center gap-2">
                <Globe size={18} className="text-amber-500" /> 
                Configuração da API
              </h2>
              
              <div className="space-y-5">
                 
                 <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-3">Modo de Operação</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button
                         onClick={() => setDataMode('mock')}
                         className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                             dataMode === 'mock' 
                             ? 'bg-zinc-800 border-amber-500/50 text-amber-500' 
                             : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                         }`}
                       >
                          <Wifi size={24} className={dataMode === 'mock' ? '' : 'opacity-50'} />
                          <div className="text-center">
                              <div className="font-semibold text-sm">Demo / Offline</div>
                              <div className="text-[10px] mt-0.5 opacity-70">Dados falsos em memória</div>
                          </div>
                       </button>
                       <button
                         onClick={() => setDataMode('api')}
                         className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                             dataMode === 'api' 
                             ? 'bg-zinc-800 border-amber-500/50 text-amber-500' 
                             : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                         }`}
                       >
                          <Server size={24} className={dataMode === 'api' ? '' : 'opacity-50'} />
                          <div className="text-center">
                             <div className="font-semibold text-sm">Servidor Real</div>
                             <div className="text-[10px] mt-0.5 opacity-70">PostgreSQL Cloud/Local</div>
                          </div>
                       </button>
                    </div>
                 </div>

                 {dataMode === 'api' && (
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
                               URL do Servidor (Base URL)
                               <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Avançado</span>
                            </label>
                            <input
                              type="url"
                              value={baseUrl}
                              onChange={e => setLocalBaseUrl(e.target.value)}
                              placeholder="ex: http://192.168.1.100:3000 ou https://api.empresa.com"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 font-mono text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all outline-none"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                               Deixe em branco para usar a mesma origem deste site ({window.location.origin}).
                            </p>
                        </div>
                    </div>
                 )}
                 
                 <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                    <div>
                        {dataMode === 'api' && (
                            <button
                                onClick={testConnection}
                                disabled={isTesting}
                                className="text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                                Testar Servidor
                            </button>
                        )}
                    </div>
                    
                    <button
                        onClick={handleSave}
                        className="text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-6 py-2.5 rounded-lg transition-colors shadow-lg hover:shadow-amber-500/20"
                    >
                        Salvar e Reiniciar
                    </button>
                 </div>
              </div>
           </div>

           {/* Test Results */}
           {testResult.status && (
               <div className={`p-5 rounded-xl border ${
                   testResult.status === 'success' 
                   ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                   : 'bg-red-500/10 border-red-500/20 text-red-400'
               }`}>
                  <div className="flex items-start gap-3">
                     <span className="mt-0.5">
                        {testResult.status === 'success' ? <Shield size={20} /> : <Activity size={20} />}
                     </span>
                     <div>
                        <h3 className="font-semibold text-sm mb-1">
                            {testResult.status === 'success' ? 'Comunicação Concluída' : 'Falha na Comunicação'}
                        </h3>
                        <p className="text-xs opacity-90">{testResult.message}</p>
                        
                        {testResult.details && (
                           <div className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                 <span className="block opacity-70 mb-0.5">Versão</span>
                                 <span className="font-mono">{testResult.details.appVersion || 'N/A'}</span>
                              </div>
                              <div>
                                 <span className="block opacity-70 mb-0.5">DB Connected</span>
                                 <span className="font-mono">{testResult.details.dbConnected ? 'Sim' : 'Não'}</span>
                              </div>
                              <div>
                                 <span className="block opacity-70 mb-0.5">Ambiente</span>
                                 <span className="font-mono">{testResult.details.nodeEnv || 'N/A'}</span>
                              </div>
                              <div>
                                 <span className="block opacity-70 mb-0.5">Modo</span>
                                 <span className="font-mono">{testResult.details.dataMode || 'N/A'}</span>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
           )}
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5">
                <h3 className="text-sm font-medium text-zinc-50 mb-4 flex items-center gap-2">
                    <Database size={16} className="text-zinc-400" />
                    Status Atual
                </h3>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                        <span className="text-xs text-zinc-500">Modo de Operação</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            localStorage.getItem('DATA_MODE') === 'api' 
                            ? 'bg-sky-500/10 text-sky-400' 
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                            {localStorage.getItem('DATA_MODE') === 'api' ? 'SERVIDOR REAL' : 'DEMO/MOCK'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1 pb-3 border-b border-zinc-800">
                        <span className="text-xs text-zinc-500">Base URL Aplicada</span>
                        <span className="text-xs font-mono text-zinc-300 break-all">
                            {getApiBaseUrl() || window.location.origin}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Token JWT Presente</span>
                        <span className="text-xs font-semibold text-zinc-300">
                            {localStorage.getItem('gestaoos_token') ? 'Sim' : 'Não'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-2">
                    <Cpu size={16} /> Sobre o Self-Hosted
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                    Quando conectado a um servidor remoto, os dados deixam de ficar armazenados apenas na memória deste dispositivo
                    (modo Demo) e passam a ser lidos de um banco de dados real em PostgreeSQL, criptografado e servido via API.
                </p>
                <a href="https://github.com/ArthurAlvesZzz/GestaoArthur01/blob/main/SELF_HOSTED.md" target="_blank" className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                    Leia a documentação Oficial &rarr;
                </a>
            </div>
        </div>

      </div>
    </div>
  );
}
