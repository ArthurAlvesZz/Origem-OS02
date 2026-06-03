import { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { StorefrontPlan, SubscriptionRequestData } from '../repositories/interfaces/IStorefrontRepository';
import { Coffee, CheckCircle2, ChevronRight, X, ArrowRight } from 'lucide-react';

export function LojaPublica() {
  const { storefrontRepo, paymentRepo } = useRepositories();
  const [plans, setPlans] = useState<StorefrontPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<StorefrontPlan | null>(null);
  const [formData, setFormData] = useState<SubscriptionRequestData>({
    planId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const p = await storefrontRepo.getStorefrontPlans();
      setPlans(p);
    } catch (e) {
      console.warn("Erro ao carregar loja.", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: StorefrontPlan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({ ...prev, planId: plan.id }));
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      // public tenant connection, usually from domain, hardcoded here as 'demo'
      const req = await storefrontRepo.createSubscriptionRequest('demo', formData);
      
      // Criar intenção de pagamento simulado/mock
      await paymentRepo.createIntent({
        tenantId: 'demo',
        subscriptionRequestId: req.id,
        amount: selectedPlan.price,
        currency: 'BRL',
        status: 'pending',
      });

      setIsSuccess(true);
      setSelectedPlan(null);
    } catch (error) {
       alert("Erro ao enviar interesse. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      
      {/* Header Premium */}
      <header className="border-b border-white/5 relative z-10 bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-heading font-black text-2xl tracking-tighter text-white">
            COFCOF<span className="text-amber-500">.</span>CO
          </div>
          <div className="text-sm font-medium tracking-wide uppercase flex items-center gap-6">
            <span className="text-white/60 hover:text-white transition-colors cursor-pointer hidden md:block">Cafés</span>
            <span className="text-white/60 hover:text-white transition-colors cursor-pointer hidden md:block">Origem</span>
            <button className="bg-amber-600 text-white px-5 py-2 rounded-none font-semibold hover:bg-amber-700 transition-colors">
              Assinar Clube
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-amber-950 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950/10 to-zinc-950"></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-semibold uppercase tracking-widest text-amber-500 mb-8">
              <span>Cerrado Mineiro D.O.</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-heading font-medium tracking-tight mb-8 leading-[1.1]">
              O melhor café do Brasil <br/><span className="text-white/40 italic">você ainda não provou.</span>
           </h1>
           <p className="text-lg md:text-xl text-white/60 font-light mb-12 max-w-2xl mx-auto">
              Oito lotes premiados pela Cup of Excellence, torrados sob demanda no Cerrado Mineiro. Rastreáveis do pé à xícara, entregues na sua porta.
           </p>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
           <h2 className="text-3xl font-heading font-medium mb-4">Escolha sua Assinatura</h2>
           <p className="text-white/50 max-w-lg mx-auto">Cancele, pause ou mude de plano quando quiser. Experiência de fazenda, direto na sua casa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
           {plans.map(p => (
             <div 
               key={p.id} 
               className={`relative bg-zinc-900 border ${p.featured ? 'border-amber-600' : 'border-white/10'} p-8 rounded-2xl flex flex-col transition-transform hover:-translate-y-1`}
             >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-full">
                    A Curadoria
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-heading font-semibold text-white mb-2">{p.name}</h3>
                  <p className="text-white/50 text-sm h-10">{p.description}</p>
                </div>

                <div className="mb-8">
                  <div className="text-4xl font-heading text-white mb-2">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                     <span className="text-base text-white/30 font-sans font-normal"> / {p.frequency === 'monthly' ? 'mês' : p.frequency}</span>
                  </div>
                  <div className="text-sm font-medium text-amber-500">
                    {p.packageCount}x pacotes de {p.weight}g
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                   <li className="flex items-start gap-3 text-sm text-white/70">
                     <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                     Torra sob demanda (garantia de frescor)
                   </li>
                   <li className="flex items-start gap-3 text-sm text-white/70">
                     <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                     Rastreabilidade total via QR Code
                   </li>
                   <li className="flex items-start gap-3 text-sm text-white/70">
                     <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                     Acesso antecipado a Microlotes
                   </li>
                </ul>

                <button 
                  onClick={() => handleSelectPlan(p)}
                  className={`w-full py-4 text-center text-sm uppercase tracking-wider font-bold transition-colors ${p.featured ? 'bg-white text-zinc-950 hover:bg-white/90' : 'bg-transparent border border-white/20 text-white hover:bg-white/5'}`}
                >
                  Selecionar Plano
                </button>
             </div>
           ))}
        </div>
      </section>

      {/* Modal Checkout Simplificado (Lead) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-zinc-900 border border-white/10 p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto custom-scrollbar">
             <button onClick={() => setSelectedPlan(null)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
               <X size={24} />
             </button>

             <div className="mb-8">
               <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Solicitar Assinatura</div>
               <h3 className="text-2xl font-heading font-semibold text-white">{selectedPlan.name}</h3>
               <p className="text-white/50 text-sm mt-1">{selectedPlan.packageCount}x {selectedPlan.weight}g / {selectedPlan.frequency}</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-xs font-medium text-white/60 mb-1.5">NOME COMPLETO</label>
                   <input 
                     required
                     type="text" 
                     value={formData.customerName}
                     onChange={e => setFormData({...formData, customerName: e.target.value})}
                     className="w-full bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
                     placeholder="Como gosta de ser chamado"
                   />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">E-MAIL</label>
                    <input 
                      required
                      type="email" 
                      value={formData.customerEmail}
                      onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
                      placeholder="seu@endereco.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">WHATSAPP</label>
                    <input 
                      required
                      type="text" 
                      value={formData.customerPhone || ''}
                      onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
                      placeholder="(11) 90000-0000"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-medium text-white/60 mb-1.5">ENDEREÇO DE ENTREGA</label>
                   <textarea 
                     required
                     value={formData.address || ''}
                     onChange={e => setFormData({...formData, address: e.target.value})}
                     className="w-full bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors min-h-[80px]"
                     placeholder="CEP, Rua, Número, Complemento, Bairro, Cidade, Estado"
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-white/60 mb-1.5">OBSERVAÇÕES (OPCIONAL)</label>
                   <input 
                     type="text" 
                     value={formData.notes || ''}
                     onChange={e => setFormData({...formData, notes: e.target.value})}
                     className="w-full bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
                     placeholder="Moído para V60? Só em grãos?"
                   />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Garantir minha vaga'} <ArrowRight size={18} />
                  </button>
                  <p className="text-center text-[10px] text-white/30 uppercase mt-4">
                     *Uma intenção de pagamento será gerada no sistema. Nossa equipe entrará em contato para alinhar os detalhes.
                  </p>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-zinc-900 border border-amber-600/20 p-12 w-full max-w-md text-center relative">
             <div className="w-16 h-16 bg-amber-600/10 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
               <CheckCircle2 size={32} />
             </div>
             <h3 className="text-2xl font-heading font-semibold text-white mb-4">Interesse Registrado</h3>
             <p className="text-white/60 text-sm mb-8">
               Recebemos os seus dados. Um mestre de torra da COFCOF.CO entrará em contato pelo seu WhatsApp em breve para personalizar sua experiência.
             </p>
             <button 
                onClick={() => setIsSuccess(false)}
                className="bg-white text-zinc-950 px-8 py-3 uppercase tracking-wider font-bold text-sm hover:bg-white/90 transition-colors"
             >
               Voltar para a loja
             </button>
           </div>
        </div>
      )}

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 py-12 text-center text-white/30 text-xs">
        <p>COFCOF.CO © 2026. Feito no Cerrado Mineiro, Brasil.</p>
      </footer>
    </div>
  );
}
