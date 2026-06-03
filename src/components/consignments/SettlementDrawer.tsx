import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Consignment } from '../../domain/types';
import { useRepositories } from '../../repositories/RepositoryProvider';

interface SettlementDrawerProps {
  onClose: () => void;
  onComplete: () => void;
  consignment: Consignment;
}

export function SettlementDrawer({ onClose, onComplete, consignment }: SettlementDrawerProps) {
  const { consignmentRepo, orderRepo, inventoryRepo, actualType } = useRepositories();

  // state for settlement inputs
  const [settlements, setSettlements] = useState<Record<string, { qtySold: string; qtyReturned: string; qtyLost: string }>>(() => {
    const init: Record<string, any> = {};
    for (const item of consignment.items) {
      init[item.productId] = { qtySold: '', qtyReturned: '', qtyLost: '' };
    }
    return init;
  });

  const handleChange = (productId: string, field: 'qtySold' | 'qtyReturned' | 'qtyLost', val: string) => {
    setSettlements(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: val
      }
    }));
  };

  const handleFinalize = async (isFinal: boolean) => {
    try {
      const entries = Object.entries(settlements) as [string, { qtySold: string; qtyReturned: string; qtyLost: string }][];
      
      const payload = entries.map(([productId, vals]) => {
        const item = consignment.items.find(i => i.productId === productId);
        return {
          productId,
          name: item?.name || '',
          unitPrice: item?.unitPrice || 0,
          unitCost: item?.unitCost || 0,
          soldQty: parseFloat(vals.qtySold) || 0,
          returnedQty: parseFloat(vals.qtyReturned) || 0,
          lostQty: parseFloat(vals.qtyLost) || 0
        };
      });

      const hasAny = payload.some(p => p.soldQty > 0 || p.returnedQty > 0 || p.lostQty > 0);
      if (!hasAny) {
        alert('Informe pelo menos uma quantidade para realizar o acerto.');
        return;
      }
      
      // Update the consignment via repository
      await consignmentRepo.settleConsignment({
        consignmentId: consignment.id,
        items: payload,
        totalSold: payload.reduce((acc, p) => acc + (p.soldQty * p.unitPrice), 0),
        paymentMethod: 'Acerto de Consignação',
        isPaid: true,
        date: new Date().toISOString(),
        status: isFinal ? 'closed' : 'partially_settled'
      });

      if (actualType === 'mock') {
        // Create order for the sold valid items
        const soldItems = payload.filter(p => p.soldQty > 0);
        if (soldItems.length > 0) {
          // Mock issue: orderRepo creates order AND decreases stock. 
          // We need to temporarily increase stock so the double reduction balances out since stock was removed early when consigned.
          for (const p of soldItems) {
             await inventoryRepo.createMovement({
               productId: p.productId,
               qty: p.soldQty,
               type: 'Ajuste',
               reason: `Ajuste Temporário p/ Criação de Pedido Consig ${consignment.id}`
             });
          }
          
          await orderRepo.createOrder({
            customerName: consignment.partnerName,
            items: soldItems.map(p => ({
               productId: p.productId,
               name: p.name,
               qty: p.soldQty,
               unitPrice: p.unitPrice,
               unitCost: p.unitCost,
               discount: 0
            })),
            status: 'Pago',
            paymentMethod: 'Acerto de Consignação',
            subtotal: soldItems.reduce((acc, p) => acc + (p.soldQty * p.unitPrice), 0),
            total: soldItems.reduce((acc, p) => acc + (p.soldQty * p.unitPrice), 0),
            discount: 0
          });
        }
  
        // Add back returned items and lost items
        for (const p of payload) {
          if (p.returnedQty > 0) {
            await inventoryRepo.createMovement({
              productId: p.productId,
               qty: p.returnedQty,
               type: 'Entrada',
               reason: `Devolução Consig ${consignment.id}`
            });
          }
          if (p.lostQty > 0) {
            await inventoryRepo.createMovement({
              productId: p.productId,
               qty: p.lostQty,
               type: 'Ajuste',
               reason: `Reposição temp. p/ registro de perda Consig ${consignment.id}`
            });
            await inventoryRepo.createMovement({
              productId: p.productId,
               qty: -p.lostQty,
               type: 'Perda',
               reason: `Perda Consig ${consignment.id}`
            });
          }
        }
      }
      
      alert(`Acerto ${isFinal ? 'fechado' : 'parcial'} registrado com sucesso!\n- Vendas viraram pedidos.\n- Devoluções voltaram pro estoque.\n- Perdas foram registradas.`);
      onComplete();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // calculate current totals being typed
  let typingSaleTotal = 0;
  for (const item of consignment.items) {
    const sold = parseFloat(settlements[item.productId]?.qtySold) || 0;
    typingSaleTotal += sold * item.unitPrice;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[700px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        <div className="flex flex-col border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-heading font-semibold text-zinc-50 tracking-tight">Acerto de Consignação</h2>
              <p className="text-sm text-zinc-400 mt-0.5">{consignment.partnerName} &bull; {consignment.id}</p>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            {consignment.items.map(item => {
              const allocated = item.qtySold + item.qtyReturned + item.qtyLost;
              const unallocated = item.qtySent - allocated;
              const isSettled = unallocated <= 0;

              return (
                <div key={item.productId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-medium text-zinc-50">{item.name}</div>
                      <div className="text-xs text-zinc-500 flex gap-2 mt-1">
                        <span>Enviado: {item.qtySent}</span>
                        <span>&bull;</span>
                        <span>Acertado até agora: {allocated}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-amber-400">Restante: {unallocated} un</div>
                      <div className="text-xs text-zinc-500 mt-1">R$ {item.unitPrice.toFixed(2)}/un</div>
                    </div>
                  </div>

                  {!isSettled ? (
                     <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5 line-clamp-1">Vendida (Cobra)</label>
                        <input 
                          type="number" min="0" max={unallocated}
                          value={settlements[item.productId]?.qtySold}
                          onChange={e => handleChange(item.productId, 'qtySold', e.target.value)}
                          className="w-full bg-zinc-950 border border-emerald-500/20 focus:border-emerald-500 text-emerald-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5 line-clamp-1">Devolvida (Estoque)</label>
                        <input 
                          type="number" min="0" max={unallocated}
                          value={settlements[item.productId]?.qtyReturned}
                          onChange={e => handleChange(item.productId, 'qtyReturned', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-500 text-sky-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5 line-clamp-1">Perda (Baixa)</label>
                        <input 
                          type="number" min="0" max={unallocated}
                          value={settlements[item.productId]?.qtyLost}
                          onChange={e => handleChange(item.productId, 'qtyLost', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 text-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 text-emerald-400 text-sm font-medium p-2 rounded-lg text-center border border-emerald-500/20">
                      100% Acertado
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-zinc-900 bg-zinc-950 p-6 space-y-4">
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
             <div>
               <div className="text-zinc-400 text-sm">Novo Pedido/Faturamento a Gerar</div>
               <div className="text-xs text-zinc-500">Isso criará uma Venda no sistema.</div>
             </div>
             <div className="text-2xl font-semibold text-emerald-400">R$ {typingSaleTotal.toFixed(2)}</div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => handleFinalize(false)}
              className="flex-1 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-50 font-semibold py-3.5 rounded-xl transition-colors"
            >
              Acerto Parcial
            </button>
            <button 
              onClick={() => {
                const proceed = window.confirm('Deseja realmente FECHAR esta consignação? Nenhum acerto adicional poderá ser feito depois.');
                if (proceed) handleFinalize(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold py-3.5 rounded-xl transition-colors"
            >
              <Check size={20} /> Fechar Consignação
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
