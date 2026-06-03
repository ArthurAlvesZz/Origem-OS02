import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { FileText, Download, Printer, Filter, XCircle } from 'lucide-react';
import { GeneratedDocument } from '../domain/types';

export function Relatorios() {
  const { reportsRepo, settingsRepo } = useRepositories();
  const [activeTab, setActiveTab] = useState('vendas');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [salesData, setSalesData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  
  // Configs
  const [currency, setCurrency] = useState('BRL');

  useEffect(() => {
    settingsRepo.getProfile().then(p => {
      if(p.currency) setCurrency(p.currency);
    }).catch(console.error);
    
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if(activeTab === 'vendas') {
        const res = await reportsRepo.getSalesReports({});
        setSalesData(res);
      } else if (activeTab === 'financeiro') {
        const res = await reportsRepo.getFinanceReports({});
        setFinanceData(res);
      } else if (activeTab === 'documentos') {
        const res = await reportsRepo.getDocuments();
        setDocuments(res);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);
  };

  const handleGenerateDoc = async (type: string, title: string, snapshotJson: any) => {
    try {
      if (window.confirm(`Gerar documento auxiliar impresso de ${title}?`)) {
        await reportsRepo.generateDocument({
          type,
          title,
          snapshotJson
        });
        alert('Documento gerado. Você pode visualizá-lo na aba Documentos.');
      }
    } catch(err) {
      alert('Erro ao gerar documento');
    }
  };

  const handleVoidDoc = async (id: string) => {
    if(!window.confirm('Cancelar este documento? Ele ficará marcado como inválido.')) return;
    try {
      await reportsRepo.voidDocument(id);
      loadData();
    } catch(err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    // Generate simple CSV logic
    const csvData = "ID,TIPO,DATA,STATUS\n" + documents.map(d => `${d.id},${d.type},${d.createdAt || d.generatedAt},${d.status}`).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export_contador.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDoc = (doc: GeneratedDocument) => {
    // A simple trick to print specific content: Open a window or just use the print media query
    // But since this is a single page app, we will toggle a state to show ONLY the document,
    // trigger print, then restore. The easiest in React without complex state is just to 
    // rely on CSS classes for print, like 'print-only' and hiding the rest.
    // Let's create a visual printable wrapper.
    setPrintingDoc(doc);
    setTimeout(() => {
      window.print();
      setPrintingDoc(null);
    }, 100);
  };

  const [printingDoc, setPrintingDoc] = useState<GeneratedDocument | null>(null);

  if (printingDoc) {
    return (
      <div className="bg-white text-black p-8 max-w-4xl mx-auto min-h-screen">
        <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">COFCOF.CO</h1>
            <p className="text-sm text-gray-500">Documento Auxiliar Sem Valor Fiscal</p>
          </div>
          <div className="text-right text-sm">
            <p><strong>Nº Doc:</strong> #{printingDoc.sequenceNumber.toString().padStart(6, '0')}</p>
            <p><strong>Emissão:</strong> {new Date(printingDoc.createdAt || printingDoc.generatedAt).toLocaleString()}</p>
            <p className="text-red-600 font-bold mt-1">{printingDoc.status === 'voided' ? 'CANCELADO' : ''}</p>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-6 text-center underline">{printingDoc.title}</h2>
        
        <div className="mb-8">
           <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 border border-gray-200">
             {JSON.stringify(printingDoc.snapshotJson, null, 2)}
           </pre>
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Este documento não substitui a emissão de nota fiscal obrigatória.</p>
          <p>Emitido por COFCOF.CO - Sistema de Gestão Interno.</p>
        </div>
      </div>
    );
  }

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documents, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "export_contador.json");
    dlAnchorElem.click();
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'vendas', label: 'Vendas' },
      { id: 'financeiro', label: 'Financeiro' },
      { id: 'estoque', label: 'Estoque' },
      { id: 'producao', label: 'Produção' },
      { id: 'consignacao', label: 'Consignação' },
      { id: 'documentos', label: 'Documentos Emitidos' }
    ];
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-amber-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  };

  // Replace onClick={handlePrintDoc} in the button inside the list rendering
  // The list doesn't reference `handlePrintDoc` yet wait, let's just make sure we add these back first.

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col no-print">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-zinc-50">Central de Relatórios</h1>
          <p className="text-zinc-400 mt-1">Geração de documentos, extratos e relatórios pormenorizados.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-50 px-4 py-2 rounded flex items-center gap-2 transition-colors">
            <Download size={16} /> CSV Contador
          </button>
          <button onClick={handleExportJSON} className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-50 px-4 py-2 rounded flex items-center gap-2 transition-colors">
            <FileText size={16} /> JSON Dados
          </button>
        </div>
      </div>

      {renderTabs()}

      <div className="flex-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 overflow-y-auto">
        {loading ? (
          <div className="text-zinc-500">Carregando relatório...</div>
        ) : (
          <>
            {activeTab === 'vendas' && salesData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                     <p className="text-sm text-zinc-400">Total Vendido</p>
                     <p className="text-2xl font-semibold text-zinc-100">{formatCurrency(salesData.totalSales)}</p>
                   </div>
                   <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                     <p className="text-sm text-zinc-400">Descontos</p>
                     <p className="text-2xl font-semibold text-amber-500">{formatCurrency(salesData.totalDiscount)}</p>
                   </div>
                   <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                     <p className="text-sm text-zinc-400">Ticket Médio</p>
                     <p className="text-2xl font-semibold text-zinc-100">{formatCurrency(salesData.ticketMedio)}</p>
                   </div>
                </div>
                <div className="flex justify-end">
                   <button onClick={() => handleGenerateDoc('report', 'Relatório de Vendas', salesData)} className="bg-amber-600/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded text-sm hover:bg-amber-600/20 transition-colors">
                     Salvar Snapshot e Gerar Doc
                   </button>
                </div>
              </div>
            )}
            
            {activeTab === 'financeiro' && financeData && (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                     <p className="text-sm text-zinc-400">Receitas</p>
                     <p className="text-2xl font-semibold text-emerald-500">{formatCurrency(financeData.receitas)}</p>
                   </div>
                   <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                     <p className="text-sm text-zinc-400">Despesas</p>
                     <p className="text-2xl font-semibold text-red-500">{formatCurrency(financeData.despesas)}</p>
                   </div>
                   <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                     <p className="text-sm text-zinc-400">Saldo Periodo (DRE Simples)</p>
                     <p className="text-2xl font-semibold text-zinc-100">{formatCurrency(financeData.saldo)}</p>
                   </div>
                </div>
                <div className="flex justify-end">
                   <button onClick={() => handleGenerateDoc('report', 'Extrato Financeiro e DRE', financeData)} className="bg-amber-600/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded text-sm hover:bg-amber-600/20 transition-colors">
                     Salvar Snapshot e Gerar Doc
                   </button>
                </div>
               </div>
            )}

            {activeTab === 'documentos' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-amber-500 flex items-start gap-3">
                   <FileText size={20} className="shrink-0 mt-0.5" />
                   <div className="text-sm">
                     <strong>Aviso Legal Importante:</strong> Todos os documentos gerados aqui são "Documentos auxiliares sem valor fiscal". Não substituem NFe, NFCe ou relatórios contábeis oficiais enviados pelo seu contador.
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                          <th className="py-3 px-4 font-medium">Núm</th>
                          <th className="py-3 px-4 font-medium">Data</th>
                          <th className="py-3 px-4 font-medium">Título</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {documents.map(doc => (
                          <tr key={doc.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 group">
                             <td className="py-3 px-4 text-zinc-300">#{doc.sequenceNumber}</td>
                             <td className="py-3 px-4 text-zinc-400">{new Date(doc.createdAt || doc.generatedAt).toLocaleDateString()}</td>
                             <td className="py-3 px-4 font-medium text-zinc-100">{doc.title}</td>
                             <td className="py-3 px-4">
                               <span className={`px-2 py-1 text-[10px] rounded uppercase tracking-wider font-semibold border ${doc.status === 'voided' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                 {doc.status === 'voided' ? 'Cancelado' : 'Válido'}
                               </span>
                             </td>
                             <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {doc.status === 'active' && (
                                     <button title="Cancelar" onClick={() => handleVoidDoc(doc.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                       <XCircle size={16} />
                                     </button>
                                  )}
                                  <button title="Imprimir" onClick={() => handlePrintDoc(doc)} className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                     <Printer size={16} />
                                  </button>
                                </div>
                             </td>
                          </tr>
                        ))}
                        {documents.length === 0 && (
                          <tr><td colSpan={5} className="py-8 text-center text-zinc-500">Nenhum documento gerado no momento.</td></tr>
                        )}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
            
            {['estoque', 'producao', 'consignacao'].includes(activeTab) && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                 <Filter size={32} className="text-zinc-600 mb-4" />
                 <h3 className="text-lg font-medium text-zinc-50">Dados Consolidados</h3>
                 <p className="text-zinc-400 max-w-sm mt-2 text-sm">Resumo gerencial sob medida para explorar histórico e análises desta área. (Visão completa em breve)</p>
                 <button className="mt-4 bg-zinc-800 text-zinc-100 border border-zinc-700 px-4 py-2 rounded text-sm hover:bg-zinc-700">Exportar Bruto CSV</button>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
