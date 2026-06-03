import { PageHeader } from '../components/ui/PageHeader';
import { AlertTriangle, FileText } from 'lucide-react';

export function Fiscal() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Central do Contador (Fiscal)" 
        description="Área exclusiva para integrações fiscais contábeis oficiais." 
      />

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4">
        <div className="mt-0.5 text-amber-500">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-amber-500">Módulo Conceitual (Roadmap)</h4>
          <p className="text-sm text-amber-500 mt-1 leading-relaxed">
            A emissão fiscal direta contábil oficial (NFC-e / NF-e), cálculo de impostos como ICMS/ST, SAT, certificados A1 e PIS/COFINS dependem de integrações via plataforma de terceiros (ex: Focus NFE) na Fase 3. 
            Não emita ou confie em documentos sem valor fiscal se você precisar de comprovação tributária perante a SEFAZ.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="w-12 h-12 bg-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-400 mb-4">
            <FileText size={24} />
          </div>
          <h3 className="font-heading font-semibold text-zinc-50 text-lg mb-2">Relatórios Gerenciais Exportáveis</h3>
          <p className="text-sm text-zinc-400 mb-6">
            Para prover dados financeiros e comerciais atualizados ao seu contador de forma não-fiscal, utilize a aba "Relatórios". Exporte arquivos JSON ou CSV já consolidados.
          </p>
        </div>

      </div>
    </div>
  );
}
