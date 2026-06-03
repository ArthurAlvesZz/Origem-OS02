import React, { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { DigitalMenuCategory, DigitalMenuConfig, DigitalMenuOrderPayload } from '../domain/digitalMenu';
import { Store, ShoppingBag, ArrowLeft, Clock, MapPin, Check, QrCode } from 'lucide-react';

export function PublicMenu({ slug }: { slug: string }) {
  const { digitalMenuRepo } = useRepositories();
  const [config, setConfig] = useState<DigitalMenuConfig | null>(null);
  const [categories, setCategories] = useState<DigitalMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<{ id: string, name: string, price: number, qty: number }[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'menu' | 'cart' | 'checkout' | 'success'>('menu');
  const [orderSummary, setOrderSummary] = useState<{ id: string, trackingNumber?: string, qrcode?: string, checkoutUrl?: string, total: number } | null>(null);

  // Form info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');

  const [orderStatus, setOrderStatus] = useState<string>('received');
  
  const mapStatus = (st: string) => {
    switch (st) {
      case 'received': return 'Recebido';
      case 'preparing': return 'Em Preparo';
      case 'ready': return 'Pronto (Liberado)';
      case 'out_for_delivery': return 'Saiu para Entrega';
      case 'delivered': return 'Concluído';
      case 'canceled': return 'Cancelado';
      default: return st;
    }
  };

  useEffect(() => {
    digitalMenuRepo.getPublicMenu(slug).then(res => {
      if (res) {
        setConfig(res.config);
        setCategories(res.categories);
        setPaymentMethod(res.config.paymentProvider || 'manual_pix');
      }
      
      const searchParams = new URLSearchParams(window.location.search);
      const checkoutStatus = searchParams.get('checkout');
      const orderIdParam = searchParams.get('order');
      
      if (checkoutStatus && orderIdParam) {
        setCheckoutStep('success');
        setOrderSummary({ 
          id: orderIdParam, 
          trackingNumber: orderIdParam, 
          total: 0 // Will be updated by status checker
        });
        if (checkoutStatus === 'failure') {
           setOrderStatus('canceled');
        }
      }
      
      setLoading(false);
    });
  }, [slug]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const finalTotal = cartTotal + (deliveryMethod === 'delivery' && config?.deliveryFee ? config.deliveryFee : 0);

  const placeOrder = async () => {
    if (!customerName.trim()) {
      alert('Informe seu nome para continuar.');
      return;
    }
    setLoading(true);
    try {
      const payload: DigitalMenuOrderPayload = {
        customerName,
        customerPhone,
        deliveryMethod,
        paymentMethod,
        notes: deliveryMethod === 'delivery' ? `Endereço: ${customerAddress}` : '',
        items: cart.map(c => ({ itemId: c.id, qty: c.qty }))
      };
      
      const res = await digitalMenuRepo.createPublicOrder(slug, payload);
      setOrderSummary({ 
        id: res.orderId, 
        trackingNumber: res.trackingNumber || res.orderId,
        qrcode: res.pixQrCode, 
        checkoutUrl: res.checkoutUrl, 
        total: res.total 
      });
      
      if (res.checkoutUrl) {
         // Se tiver checkoutUrl, já manda o cliente pra lá e o retorno processará sucesso
         window.location.href = res.checkoutUrl;
         return;
      }
      
      setCheckoutStep('success');
      setCart([]);
    } catch(e) {
      alert('Erro ao criar pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (checkoutStep === 'success' && orderSummary && orderSummary.trackingNumber) {
      interval = setInterval(async () => {
        try {
          const res = await digitalMenuRepo.getPublicOrder(slug, orderSummary.trackingNumber!);
          if (res) {
            setOrderStatus(res.status);
            setOrderSummary(prev => prev ? { ...prev, total: res.total } : null);
          }
        } catch (e) {
            // ignore
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [checkoutStep, orderSummary, slug, digitalMenuRepo]);

  if (loading && checkoutStep === 'menu') {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-amber-500">Montando cardápio...</div>;
  }

  if (!config) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-red-400">Cardápio não encontrado ou indisponível.</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900/80 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {checkoutStep !== 'menu' && checkoutStep !== 'success' && (
            <button onClick={() => setCheckoutStep(checkoutStep === 'checkout' ? 'cart' : 'menu')} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-heading font-semibold text-lg text-zinc-50 tracking-tight leading-tight">{config.publicName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${config.isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {config.isOpen ? 'Aberto' : 'Fechado'}
              </span>
              {config.estimatedPrepMinutes > 0 && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock size={12} /> ~{config.estimatedPrepMinutes} min
                </span>
              )}
            </div>
          </div>
        </div>
        
        {checkoutStep === 'menu' && (
           <button 
             onClick={() => setCart([])} 
             className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 relative"
           >
             <Store size={20} />
           </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto pb-32">
        {checkoutStep === 'menu' && (
          <div className="p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {config.description && (
              <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-amber-500/50 pl-3">
                {config.description}
              </p>
            )}

            <div className="space-y-8">
              {categories.map(cat => cat.items && cat.items.length > 0 && (
                <div key={cat.id} className="space-y-4">
                  <h2 className="text-xl font-heading font-medium text-zinc-100 sticky top-16 bg-zinc-950/95 py-2 z-30">{cat.name}</h2>
                  <div className="grid gap-3">
                    {cat.items.map((item: any) => (
                      <div key={item.id} className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-4 gap-4 transition-transform active:scale-[0.98]">
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="font-medium text-zinc-100 mb-1">{item.name}</h3>
                          {item.description && <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{item.description}</p>}
                          <div className="mt-auto flex items-center justify-between">
                            <span className="font-mono font-medium text-amber-500">R$ {item.price.toFixed(2)}</span>
                            {config.isOpen ? (
                              <button 
                                onClick={() => addToCart(item)}
                                className="bg-zinc-800 text-zinc-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                              >
                                Adicionar
                              </button>
                            ) : (
                              <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">Fechado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {checkoutStep === 'cart' && (
          <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-heading font-medium">Seu Pedido</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              {cart.map(c => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-md text-xs font-medium text-zinc-300">{c.qty}x</div>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-amber-500">R$ {(c.price * c.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(c.id)} className="text-xs text-red-400 uppercase font-medium">Remover</button>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-zinc-950/50 flex justify-between items-center font-medium">
                <span className="text-zinc-400 text-sm">Subtotal</span>
                <span className="font-mono">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => setCheckoutStep('checkout')}
              className="w-full bg-amber-600 hover:bg-amber-500 text-amber-50 py-4 rounded-xl font-medium tracking-wide shadow-[0_0_20px_-5px_rgba(217,177,133,0.3)] transition-all"
            >
              Confirmar e Avançar
            </button>
          </div>
        )}

        {checkoutStep === 'checkout' && (
          <div className="p-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Identificação</h3>
              <input 
                type="text" 
                placeholder="Seu nome completo" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
              />
              <input 
                type="tel" 
                placeholder="Seu telefone / WhatsApp" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Entrega ou Retirada?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${deliveryMethod === 'pickup' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <MapPin size={24} />
                  <span className="font-medium text-sm">Retirar na Loja</span>
                </button>
                <button 
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${deliveryMethod === 'delivery' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <ShoppingBag size={24} />
                  <span className="font-medium text-sm">Entrega</span>
                </button>
              </div>
              
              {deliveryMethod === 'delivery' && (
                <div className="space-y-3 pt-2">
                  <input 
                    type="text" 
                    placeholder="Endereço completo (Rua, Número, Bairro, CEP)" 
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" 
                  />
                  <p className="text-xs text-zinc-500">Adicional de entrega será calculado na fatura.</p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-zinc-900 py-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              {deliveryMethod === 'delivery' && (
                 <div className="flex justify-between text-sm">
                   <span className="text-zinc-400">Taxa de Entrega</span>
                   <span>R$ {(config.deliveryFee || 0).toFixed(2)}</span>
                 </div>
              )}
              <div className="flex justify-between text-lg font-medium pt-2 border-t border-zinc-900">
                <span>Total</span>
                <span className="text-amber-500 font-mono">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={placeOrder}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-amber-50 py-4 rounded-xl font-medium tracking-wide shadow-lg transition-all"
            >
              {loading ? 'Processando...' : (paymentMethod === 'mercadopago' ? 'Pagar online via Mercado Pago' : 'Finalizar Pedido')}
            </button>
          </div>
        )}

        {checkoutStep === 'success' && orderSummary && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 mt-10 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <Check size={40} className="stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-heading font-medium text-zinc-50">Pedido Confirmado!</h2>
              <p className="text-zinc-400">Número do pedido: <span className="font-mono text-zinc-300">#{orderSummary.id.split('-').pop()}</span></p>
              
              <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center justify-between border border-zinc-700 mt-4">
                <span className="text-zinc-300 font-medium">Status Atual:</span>
                <span className="text-amber-500 font-medium tracking-wide uppercase">{mapStatus(orderStatus)}</span>
              </div>
            </div>

            {orderSummary.qrcode && (
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm mt-6">
                <p className="text-sm border-l-2 border-amber-500 pl-2 text-left mb-4">Aguardando Pagamento</p>
                <div className="bg-white p-4 rounded-xl flex items-center justify-center aspect-square text-zinc-900 mb-4">
                  <QrCode size={120} className="text-zinc-900" />
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(orderSummary.qrcode!);
                    alert("Chave Copiada!");
                  }}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                >
                  PIX Copia e Cola
                </button>
              </div>
            )}

            <button 
              onClick={() => {
                setCheckoutStep('menu');
                setOrderSummary(null);
                setCart([]);
              }}
              className="mt-8 text-amber-500 hover:text-amber-400 text-sm font-medium"
            >
              Fazer novo pedido
            </button>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {checkoutStep === 'menu' && cart.length > 0 && (
         <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
           <button 
             onClick={() => setCheckoutStep('cart')}
             className="w-full flex items-center justify-between bg-amber-600 text-amber-50 px-6 py-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(217,177,133,0.5)] active:scale-95 transition-all"
           >
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-amber-700/50 flex items-center justify-center font-medium text-sm">
                 {cart.reduce((a,c) => a + c.qty, 0)}
               </div>
               <span className="font-medium tracking-wide">Ver Carrinho</span>
             </div>
             <span className="font-mono font-semibold tracking-tight">
               R$ {cartTotal.toFixed(2)}
             </span>
           </button>
         </div>
      )}
    </div>
  );
}
