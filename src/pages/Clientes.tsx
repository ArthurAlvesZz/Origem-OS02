import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Mail, Phone, MapPin, Briefcase, FileText } from 'lucide-react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { Customer } from '../domain/types';

export function Clientes() {
  const { customerRepo } = useRepositories();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('todos');

  // drawer
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  useEffect(() => {
    loadCustomers();
  }, [customerRepo]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerRepo.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c => filterType === 'todos' || c.type === filterType || (filterType === 'bloqueados' && c.status === 'blocked'));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-zinc-50">Clientes & Parceiros</h1>
          <p className="text-zinc-400 mt-1">Gerencie sua rede de contatos B2B, B2C e distribuidores.</p>
        </div>
        <button 
          onClick={() => { setSelectedCustomer(undefined); setDrawerOpen(true); }}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Contato
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
           <input 
             type="text"
             placeholder="Buscar por nome, e-mail ou documento..."
             className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-amber-500/50 transition-colors"
           />
         </div>
         <select 
           value={filterType}
           onChange={(e) => setFilterType(e.target.value)}
           className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 outline-none focus:border-amber-500/50 min-w-[200px]"
         >
           <option value="todos">Todos os Contatos (Ativos)</option>
           <option value="b2c">Clientes Final (B2C)</option>
           <option value="b2b">Clientes Atacado (B2B)</option>
           <option value="partner">Parceiros (Consignação)</option>
           <option value="supplier">Fornecedores</option>
           <option value="bloqueados">Bloqueados / Inativos</option>
         </select>
      </div>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">Caregando...</div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
              <Briefcase size={48} className="mb-4 opacity-20" />
              <p>Nenhum contato encontrado para este filtro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome / Documento</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Contato</th>
                    <th className="px-6 py-4 font-medium">Localidade</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filtered.map(customer => (
                    <tr 
                      key={customer.id} 
                      onClick={() => { setSelectedCustomer(customer); setDrawerOpen(true); }}
                      className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-100">{customer.name}</div>
                        {(customer.document || customer.legalName) && (
                          <div className="text-xs text-zinc-500 mt-1">
                            {customer.document} {customer.legalName ? `· ${customer.legalName}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded inline-flex text-[10px] font-bold uppercase tracking-wider ${
                          customer.type === 'partner' ? 'bg-indigo-500/10 text-indigo-400' :
                          customer.type === 'b2b' ? 'bg-amber-500/10 text-amber-400' :
                          customer.type === 'b2c' ? 'bg-zinc-800 text-zinc-300' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                           {customer.email && (
                             <div className="flex items-center gap-2 text-zinc-400"><Mail size={12} /> {customer.email}</div>
                           )}
                           {Math.random() /* only fake presentation for now */ && customer.phone && (
                             <div className="flex items-center gap-2 text-zinc-400"><Phone size={12} /> {customer.phone}</div>
                           )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {customer.city && customer.state ? (
                          <div className="flex items-center gap-2"><MapPin size={12}/> {customer.city}, {customer.state}</div>
                        ) : 'Não informado'}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                           customer.status === 'blocked' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                           customer.status === 'inactive' ? 'bg-zinc-800 text-zinc-500 border-zinc-700' :
                           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                         }`}>
                           {customer.status === 'blocked' ? 'Bloqueado' : customer.status === 'inactive' ? 'Inativo' : 'Ativo'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {isDrawerOpen && (
        <CustomerDrawer 
          customer={selectedCustomer} 
          onClose={() => setDrawerOpen(false)} 
          onSave={() => { setDrawerOpen(false); loadCustomers(); }} 
        />
      )}
    </div>
  );
}

function CustomerDrawer({ customer, onClose, onSave }: { customer?: Customer, onClose: () => void, onSave: () => void }) {
  const { customerRepo } = useRepositories();
  const [saving, setSaving] = useState(false);
  
  // Basic states
  const [name, setName] = useState(customer?.name || '');
  const [legalName, setLegalName] = useState(customer?.legalName || '');
  const [documentType, setDocumentType] = useState(customer?.documentType || 'none');
  const [documentVal, setDocumentVal] = useState(customer?.document || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [type, setType] = useState(customer?.type || 'b2c');
  const [status, setStatus] = useState(customer?.status || 'active');
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState(customer?.defaultPaymentTermsDays || 0);

  const [balance, setBalance] = useState<{openReceivables: number, consignmentBalance: number, totalExposure: number} | null>(null);

  useEffect(() => {
    if (customer?.id) {
      customerRepo.getCustomerBalance(customer.id).then(setBalance).catch(console.error);
    }
  }, [customer?.id]);

  const handleSubmit = async () => {
    if (!name) { alert('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        name, legalName, documentType, document: documentVal, email, phone, type, status, defaultPaymentTermsDays
      };
      if (customer) {
        await customerRepo.updateCustomer(customer.id, payload);
      } else {
        await customerRepo.createCustomer(payload as any);
      }
      onSave();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-zinc-950 h-full flex flex-col border-l border-zinc-800 shadow-2xl animate-in slide-in-from-right-full">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-heading font-semibold text-zinc-50">{customer ? 'Editar Contato' : 'Novo Contato'}</h2>
            <p className="text-sm text-zinc-400 mt-1">{customer ? `ID: ${customer.id}` : 'Preencha os dados básicos'}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Balance/Exposure card if editing */}
          {customer && balance && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-6">
              <div>
                 <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">A Receber</div>
                 <div className="text-xl font-heading text-amber-500">R$ {balance.openReceivables.toFixed(2)}</div>
              </div>
              <div className="w-px bg-zinc-800" />
              <div>
                 <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Consignado</div>
                 <div className="text-xl font-heading text-indigo-400">R$ {balance.consignmentBalance.toFixed(2)}</div>
              </div>
              <div className="w-px bg-zinc-800" />
              <div>
                 <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Exposição Total</div>
                 <div className="text-xl font-heading text-zinc-50">R$ {balance.totalExposure.toFixed(2)}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome / Fantasia</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Razão Social</label>
              <input value={legalName} onChange={e => setLegalName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo do Contato</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none">
                <option value="b2c">Cliente Final (B2C)</option>
                <option value="b2b">Cliente Atacado (B2B)</option>
                <option value="partner">Parceiro (Consignação)</option>
                <option value="supplier">Fornecedor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo Documento</label>
              <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none">
                <option value="none">Isento / Nenhum</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Número Documento</label>
              <input value={documentVal} onChange={e => setDocumentVal(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">E-mail</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Telefone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Prazo Padrão Pgmto (Dias)</label>
              <input type="number" value={defaultPaymentTermsDays} onChange={e => setDefaultPaymentTermsDays(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:border-amber-500/50 outline-none" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3 bg-zinc-900/50">
          <button onClick={onClose} className="flex-1 py-2.5 font-medium text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Contato'}
          </button>
        </div>
      </div>
    </div>
  );
}
