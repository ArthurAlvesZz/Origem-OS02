import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { TransactionStatus } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';

interface ExpenseDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

const CATEGORIES = [
  'Matéria-prima', 'Embalagem', 'Mão de obra', 'Aluguel', 
  'Energia', 'Logística', 'Marketing', 'Impostos', 'Software', 'Outros'
];

export function ExpenseDrawer({ onClose, onComplete }: ExpenseDrawerProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<TransactionStatus>('Agendado');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState('');

  const { financialRepo } = useRepositories();

  const handleSave = async () => {
    const val = parseFloat(amount);
    if (!description || !val || val <= 0) {
      alert('Preencha descrição e um valor válido.');
      return;
    }

    await financialRepo.createTransaction({
      type: 'Despesa',
      description,
      amount: val,
      date,
      status,
      category,
      paymentMethod
    });

    onComplete();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950">
          <h2 className="text-lg font-heading font-semibold text-zinc-50 tracking-tight">Nova Despesa</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
             <button
               onClick={() => setStatus('Agendado')}
               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${status === 'Agendado' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               A Pagar
             </button>
             <button
               onClick={() => setStatus('Efetivado')}
               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${status === 'Efetivado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               Já Pago
             </button>
          </div>

          <div className="space-y-4">
             <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Descrição</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Fornecedor Caixas" />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor (R$)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Ex: 150.00" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Data (Venc/Pgto)</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm" />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Categoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Método Pgto.</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg px-3 py-2 text-sm">
                    <option value="">(Nenhum/A definir)</option>
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão">Cartão</option>
                  </select>
               </div>
             </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 bg-zinc-950 p-6 flex items-center justify-between gap-4">
          <button 
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold py-3.5 rounded-xl transition-colors"
          >
            <Check size={20} />
            Salvar Despesa
          </button>
        </div>
      </div>
    </>
  );
}
