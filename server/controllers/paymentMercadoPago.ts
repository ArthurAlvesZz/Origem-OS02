import { Request, Response } from 'express';
import prisma from '../lib/prisma';

import crypto from 'crypto';

const MP_CLIENT_ID = process.env.MP_CLIENT_ID;
const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
const MP_REDIRECT_URI = process.env.MP_REDIRECT_URI || `${process.env.PUBLIC_APP_URL}/api/payments/mercadopago/callback`;
const ENCRYPTION_KEY = process.env.PAYMENTS_ENCRYPTION_KEY;

function getValidEncryptionKey(): Buffer | null {
  if (!ENCRYPTION_KEY) return null;
  // Ensure the key is exactly 32 bytes for AES-256-GCM
  // If it's a hex string (e.g., 64 chars), we could parse it, but let's assume it's just a 32-char string for simplicity or pad it.
  const keyBuffer = Buffer.from(ENCRYPTION_KEY);
  if (keyBuffer.length !== 32) {
      if (keyBuffer.length > 32) return keyBuffer.subarray(0, 32);
      const padded = Buffer.alloc(32);
      keyBuffer.copy(padded);
      return padded;
  }
  return keyBuffer;
}

function encrypt(text: string): string {
  const key = getValidEncryptionKey();
  if (!key) throw new Error('PAYMENTS_ENCRYPTION_KEY is missing or invalid. Cannot encrypt tokens.');
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

function decrypt(hash: string): string {
  const key = getValidEncryptionKey();
  if (!key) throw new Error('PAYMENTS_ENCRYPTION_KEY is missing or invalid. Cannot decrypt tokens.');
  
  if (!hash.includes(':')) {
     // Legacy fallback just in case or mock
     if (Buffer.from(hash, 'base64').toString('base64') === hash) {
       return Buffer.from(hash, 'base64').toString('utf-8');
     }
  }

  const parts = hash.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted string format');
  
  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export const getConnectUrl = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  
  if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) {
    return res.status(400).json({ error: 'Mercado Pago App Credentials not configured on server (requires MP_CLIENT_ID, SECRET)' });
  }

  if (!ENCRYPTION_KEY) {
    return res.status(400).json({ error: 'missing_encryption_key', message: 'PAYMENTS_ENCRYPTION_KEY is required to secure OAuth.' });
  }

  // Generate PKCE code_verifier and code_challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const stateHash = crypto.randomBytes(16).toString('hex');
  const expiresAtDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  try {
     await prisma.oAuthState.create({
        data: {
            tenantId,
            userId: (req as any).user?.id,
            stateHash,
            codeVerifierEncrypted: encrypt(codeVerifier),
            expiresAt: expiresAtDate
        }
     });
  } catch (err) {
     return res.status(500).json({ error: 'Database error while generating OAuth state' });
  }
  
  const connectUrl = `https://auth.mercadopago.com/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&state=${stateHash}&redirect_uri=${MP_REDIRECT_URI}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  
  res.json({ url: connectUrl });
};

export const oauthCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect('/app/config?mp_error=' + error);
  }
  
  try {
    const oauthState = await prisma.oAuthState.findUnique({
      where: { stateHash: state as string }
    });

    if (!oauthState) throw new Error('Invalid state or state duplicated');
    if (oauthState.consumedAt) throw new Error('State already consumed');
    if (oauthState.expiresAt < new Date()) throw new Error('State expired');

    await prisma.oAuthState.update({
      where: { id: oauthState.id },
      data: { consumedAt: new Date() }
    });

    const tenantId = oauthState.tenantId;
    const codeVerifier = decrypt(oauthState.codeVerifierEncrypted);

    // Exchange code for token with PKCE
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_secret: MP_CLIENT_SECRET!,
        client_id: MP_CLIENT_ID!,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: MP_REDIRECT_URI!,
        code_verifier: codeVerifier
      })
    });

    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.message || tokenData.error);
    }

    // Save tokens in provider config or create a new config
    const config = await prisma.paymentProviderConfig.findFirst({
      where: { tenantId, provider: 'mercadopago' }
    });

    const tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    if (config) {
      await prisma.paymentProviderConfig.update({
        where: { id: config.id },
        data: {
          accessToken: encrypt(tokenData.access_token),
          refreshToken: encrypt(tokenData.refresh_token),
          publicKey: tokenData.public_key,
          userId: tokenData.user_id?.toString(),
          expiresAt: tokenExpiresAt,
          enabled: true,
          mode: tokenData.live_mode ? 'live' : 'sandbox'
        }
      });
    } else {
      await prisma.paymentProviderConfig.create({
        data: {
          tenantId,
          provider: 'mercadopago',
          enabled: true,
          mode: tokenData.live_mode ? 'live' : 'sandbox',
          accessToken: encrypt(tokenData.access_token),
          refreshToken: encrypt(tokenData.refresh_token),
          publicKey: tokenData.public_key,
          userId: tokenData.user_id?.toString(),
          expiresAt: tokenExpiresAt
        }
      });
    }

    res.redirect('/digital_menu' /* Back to settings or digital menu */);
  } catch (err) {
    console.error('MP OAuth Error:', err);
    res.redirect('/digital_menu?mp_error=auth_failed');
  }
};

export const getStatus = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  
  if (!ENCRYPTION_KEY) {
     return res.json({ connected: false, status: 'missing_encryption_key' });
  }

  const config = await prisma.paymentProviderConfig.findFirst({
    where: { tenantId, provider: 'mercadopago' }
  });

  if (!config || !config.accessToken) {
    return res.json({ connected: false, status: 'not_configured' });
  }

  // Check if token is nearing expiration
  const expiresInSeconds = config.expiresAt ? Math.floor((config.expiresAt.getTime() - Date.now()) / 1000) : 0;
  
  let status = 'connected';
  if (expiresInSeconds < 0) {
     status = 'expired';
  } else if (expiresInSeconds < 86400 * 3) {
     // Less than 3 days
     status = 'token_expiring';
  }

  res.json({
    connected: true,
    status,
    mode: config.mode,
    publicKey: config.publicKey,
    expiresInSeconds
  });
};

export const disconnect = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  await prisma.paymentProviderConfig.deleteMany({
    where: { tenantId, provider: 'mercadopago' }
  });
  res.json({ success: true });
};

// Also we need to export the helper to get decrypt for preferences
export const getMpCredentials = async (tenantId: string) => {
  const config = await prisma.paymentProviderConfig.findFirst({
    where: { tenantId, provider: 'mercadopago', enabled: true }
  });
  if (!config || !config.accessToken) return null;
  
  let accessToken = decrypt(config.accessToken);

  // Check if token needs refresh (if within 10 minutes of expiry or already expired)
  const isExpiring = config.expiresAt && (config.expiresAt.getTime() - Date.now() < 10 * 60 * 1000);
  
  if (isExpiring && config.refreshToken) {
      try {
          const refreshToken = decrypt(config.refreshToken);
          const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                  client_id: MP_CLIENT_ID!,
                  client_secret: MP_CLIENT_SECRET!,
                  grant_type: 'refresh_token',
                  refresh_token: refreshToken
              })
          });
          
          if (tokenRes.ok) {
              const tokenData = await tokenRes.json();
              if (tokenData.access_token) {
                  accessToken = tokenData.access_token;
                  const tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
                  
                  await prisma.paymentProviderConfig.update({
                      where: { id: config.id },
                      data: {
                          accessToken: encrypt(accessToken),
                          refreshToken: encrypt(tokenData.refresh_token),
                          expiresAt: tokenExpiresAt
                      }
                  });
              }
          }
      } catch (err) {
          console.error('Failed to refresh MP token', err);
      }
  }

  return {
    accessToken,
    publicKey: config.publicKey
  };
};

export const webhook = async (req: Request, res: Response) => {
  const { type, 'data.id': dataId, tenantId, orderId } = req.query;
  const signatureHeader = req.headers['x-signature'] as string;
  const requestId = req.headers['x-request-id'] as string;
  
  const eventId = (req.body?.id || dataId || Date.now().toString()).toString();
  const providerEventId = `mp_${eventId}`;
  
  if (type === 'payment' && dataId && tenantId && orderId) {
     
     // Webhook Signature Validation (if secret is configured)
     const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;
     if (MP_WEBHOOK_SECRET && signatureHeader) {
         try {
             // x-signature format: ts=123456,v1=hash
             const parts = signatureHeader.split(',');
             const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
             const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];
             
             if (ts && hash) {
                 const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
                 const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET);
                 hmac.update(manifest);
                 const calculatedHash = hmac.digest('hex');
                 
                 if (calculatedHash !== hash) {
                     console.error('Invalid MP Webhook signature');
                     // In production we should return 403. For mock/dev we might allow it.
                     if (process.env.NODE_ENV === 'production') {
                         return res.status(403).send('Invalid Signature');
                     }
                 }
             }
         } catch(e) {
             console.error('Error validating signature', e);
         }
     } else if (process.env.NODE_ENV === 'production') {
         // In production, we require secret and signature
         console.warn('Webhook received without signature or secret in production');
         return res.status(403).send('Signature required in production');
     }

     const existing = await prisma.paymentWebhookEvent.findFirst({
       where: { provider: 'mercadopago', eventId: providerEventId }
     });
   
     if (existing && existing.processed) {
       return res.status(200).send('OK');
     }
     
     if (!existing) {
       await prisma.paymentWebhookEvent.create({
         data: {
           provider: 'mercadopago',
           eventId: providerEventId,
           eventType: 'payment',
           rawJson: JSON.stringify(req.body),
           processed: false // Will mark true after reconciliation
         }
       });
     }

     // Implement actual reconciliation!
     try {
       // Implement secondary verification using Mercado Pago API
       const creds = await getMpCredentials(tenantId as string);
       let isApproved = false;
       if (creds && creds.accessToken) {
            const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, { headers: { Authorization: `Bearer ${creds.accessToken}` } });
            if (paymentRes.ok) {
                const paymentDetails = await paymentRes.json();
                if (paymentDetails.status === 'approved') {
                    isApproved = true;
                } else {
                    return res.status(200).send('OK (Not approved yet)'); 
                }
            } else {
                console.warn('Failed to fetch payment details from MP API. Status:', paymentRes.status);
                // In production, we MUST verify against MP API
                if (process.env.NODE_ENV === 'production') {
                   return res.status(400).send('Failed to verify payment with MP API');
                }
                // allow fallback for mock
                isApproved = true;
            }
       } else {
            console.warn('No credentials found to verify payment');
            if (process.env.NODE_ENV === 'production') {
               return res.status(400).send('No credentials to verify payment');
            }
            isApproved = true;
       }

       if (isApproved) {
           // Updates the Order to Paid
           const order = await prisma.order.findUnique({ where: { id: orderId as string, tenantId: tenantId as string }});
           if (order && order.paymentStatus !== 'paid') {
              await prisma.order.update({
                 where: { id: order.id },
                 data: { paymentStatus: 'paid' }
              });
              
              // Get the payment intent to extract platform fee
              const intent = await prisma.paymentIntent.findFirst({
                 where: { orderId: order.id, tenantId: tenantId as string }
              });

              if (intent) {
                 await prisma.paymentIntent.update({
                    where: { id: intent.id },
                    data: { status: 'paid', paidAt: new Date() }
                 });

                 // Save PlatformFeeLedger
                 if (intent.platformFeeAmount && intent.platformFeeAmount > 0) {
                    await prisma.platformFeeLedger.create({
                        data: {
                            tenantId: tenantId as string,
                            orderId: order.id,
                            amount: intent.platformFeeAmount,
                            paymentIntentId: intent.id,
                            description: `Comissão do pedido #${order.trackingNumber || order.id.slice(-4)}`
                        }
                    });
                 }
              }

              // Create Financial Transaction so we don't duplicate revenue
              const existingTx = await prisma.financialTransaction.findFirst({
                 where: { tenantId: tenantId as string, referenceId: order.id }
              });
              
              if (!existingTx) {
                 const grossAmount = order.total;
                 const platformFee = intent?.platformFeeAmount || 0;
                 const providerFee = Number((grossAmount * 0.0399).toFixed(2));
                 const netAmount = Number((grossAmount - platformFee - providerFee).toFixed(2));

                 await prisma.financialTransaction.create({
                   data: {
                     tenantId: tenantId as string,
                     type: 'revenue',
                     category: 'venda',
                     amount: netAmount,  // Net revenue to the tenant
                     paidAmount: netAmount,
                     grossAmount: grossAmount,
                     providerFee: providerFee,
                     platformFee: platformFee,
                     netAmount: netAmount,
                     date: new Date(),
                     paidAt: new Date(),
                     description: `Venda Cardápio Digital #${order.trackingNumber || order.id.slice(-4)}`,
                     status: 'paid',
                     paymentMethod: 'mercadopago',
                     referenceId: order.id,
                     source: 'digital_menu',
                     orderId: order.id
                   }
                 });
              }
           }
       }
       
       // Mark as processed
       await prisma.paymentWebhookEvent.updateMany({
           where: { provider: 'mercadopago', eventId: providerEventId },
           data: { processed: true }
       });
       
     } catch (e) {
       console.error('Webhook reconciliation error', e);
     }
     
     return res.status(200).send('OK');
  }
  
  res.status(200).send('OK');
};
