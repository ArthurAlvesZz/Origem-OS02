import { getMpCredentials } from '../controllers/paymentMercadoPago';

export interface PaymentIntentResult {
  paymentIntentId: string;
  pixQrCode?: string;
  pixQrCodeText?: string;
  checkoutUrl?: string;
}

export class PaymentProviderAdapter {
  static async createIntent(
    provider: string,
    params: {
      tenantId: string;
      slug?: string;
      orderId: string;
      trackingNumber?: string;
      total: number;
      paymentMethod: string;
      customerName: string;
      platformFeeType?: string;
      platformFeeValue?: number;
      pixKeyManual?: string | null;
      items: any[];
    }
  ): Promise<PaymentIntentResult> {
    
    // Simulate GestaoOS Platform Fee calculation (Marketplace feature)
    let fee = 0;
    if (params.platformFeeType === 'fixed') {
      fee = params.platformFeeValue || 0;
    } else if (params.platformFeeType === 'percent') {
      fee = params.total * ((params.platformFeeValue || 0) / 100);
    }
    
    if (provider === 'mercadopago') {
      const creds = await getMpCredentials(params.tenantId);
      
      if (!creds?.accessToken) {
        console.warn('Mercado Pago credentials not configured for tenant. Falling back to PIX Manual.');
        // Fallback to manual_pix when NO MP is configured, to not break checkout
        return {
          paymentIntentId: `PIXM-${Date.now()}`,
          pixQrCode: params.pixKeyManual || 'CHAVE-PIX-NAO-CONFIGURADA',
          pixQrCodeText: params.pixKeyManual || 'CHAVE-PIX-NAO-CONFIGURADA'
        };
      }
      
      try {
        const platformFeeVal = Math.round(fee * 100) / 100;
        const totalVal = Math.round(params.total * 100) / 100;
        
        let mpItems = params.items.map(item => ({
          title: item.name,
          quantity: item.qty,
          unit_price: Math.round(item.unitPrice * 100) / 100,
          currency_id: 'BRL'
        }));
        
        if (totalVal > mpItems.reduce((a,c) => a + (c.unit_price * c.quantity), 0)) {
            // Probably delivery fee
            mpItems.push({
               title: 'Taxa de Entrega',
               quantity: 1,
               unit_price: Math.round((totalVal - mpItems.reduce((a,c) => a + (c.unit_price * c.quantity), 0)) * 100) / 100,
               currency_id: 'BRL'
            });
        }
        
        const slug = params.slug || params.tenantId;
        const baseAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
        const pubId = params.trackingNumber || params.orderId;
        
        const payload: any = {
           items: mpItems,
           external_reference: params.orderId, // We keep orderId as external reference safely internal to MP webhook
           statement_descriptor: 'GESTAOOS',
           back_urls: {
             success: `${baseAppUrl}/menu/${slug}?checkout=success&order=${pubId}`,
             pending: `${baseAppUrl}/menu/${slug}?checkout=pending&order=${pubId}`,
             failure: `${baseAppUrl}/menu/${slug}?checkout=failure&order=${pubId}`,
           },
           notification_url: `${baseAppUrl}/api/payments/mercadopago/webhook?tenantId=${params.tenantId}&orderId=${params.orderId}`,
           auto_return: 'approved'
        };
        
        if (platformFeeVal > 0) {
            payload.marketplace_fee = platformFeeVal;
        }

        const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${creds.accessToken}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(payload)
        });
        
        const pref = await res.json();
        if (pref.error || !pref.init_point) {
            console.error('MP Preference Error:', pref);
            throw new Error('Failed to create Mercado Pago preference');
        }
        
        return {
          paymentIntentId: pref.id,
          checkoutUrl: pref.init_point
        };
      } catch (err) {
        console.error('MP Error:', err);
        return {
          paymentIntentId: `PIXM-FAIL-${Date.now()}`,
          pixQrCode: params.pixKeyManual || 'CHAVE-PIX-NAO-CONFIGURADA',
          pixQrCodeText: params.pixKeyManual || 'CHAVE-PIX-NAO-CONFIGURADA'
        };
      }
    } 
    
    // Default to manual_pix or other manual integrations
    return {
      paymentIntentId: `MANUAL-${Date.now()}`,
      pixQrCodeText: params.pixKeyManual || '00020126... (Sem chave cadastrada)'
    };
  }
}
