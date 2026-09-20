import crypto from 'crypto';

const apiKey = process.env.DLOCALGO_API_KEY || '';
const secretKey = process.env.DLOCALGO_SECRET_KEY || '';
const mode = (process.env.DLOCALGO_MODE || 'sandbox').toLowerCase();

export const dLocalGoConfig = {
  apiKey,
  secretKey,
  baseUrl: mode === 'live' ? 'https://api.dlocalgo.com' : 'https://api-sbx.dlocalgo.com',
  isConfigured: Boolean(apiKey && secretKey),
};

async function dLocalRequest(path: string, init?: RequestInit) {
  if (!dLocalGoConfig.isConfigured) {
    throw new Error('Las credenciales de dLocal Go no están configuradas.');
  }

  const response = await fetch(`${dLocalGoConfig.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${dLocalGoConfig.apiKey}:${dLocalGoConfig.secretKey}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `dLocal Go respondió con HTTP ${response.status}.`);
  }

  return data;
}

export async function createDLocalGoPayment(params: {
  bidId: string;
  amountUsd: number;
  country: string;
  buyerName: string;
  buyerEmail: string;
  docType: string;
  docNumber: string;
  successUrl: string;
  backUrl: string;
  notificationUrl: string;
  description: string;
}) {
  const nameParts = params.buyerName.trim().split(/\s+/);
  const payment = await dLocalRequest('/v1/payments', {
    method: 'POST',
    body: JSON.stringify({
      currency: 'USD',
      amount: Number(params.amountUsd.toFixed(2)),
      country: params.country.toUpperCase(),
      order_id: params.bidId,
      description: params.description.slice(0, 255),
      success_url: params.successUrl,
      back_url: params.backUrl,
      notification_url: params.notificationUrl,
      payer: {
        first_name: nameParts[0] || 'Comprador',
        last_name: nameParts.slice(1).join(' ') || 'eltop.lat',
        email: params.buyerEmail,
        ...(params.docNumber
          ? { document_type: params.docType, document: params.docNumber.replace(/[^\w]/g, '') }
          : {}),
      },
    }),
  });

  if (!payment.redirect_url) throw new Error('dLocal Go no devolvió una URL de checkout.');
  return payment;
}

export async function getDLocalGoPayment(paymentId: string) {
  return dLocalRequest(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

export function verifyDLocalGoNotification(rawBody: string, authorization: string | null) {
  if (!dLocalGoConfig.isConfigured || !authorization) return false;
  const signature = authorization.match(/Signature:\s*([^,\s]+)/i)?.[1];
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', dLocalGoConfig.secretKey)
    .update(`${dLocalGoConfig.apiKey}${rawBody}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(signature, 'utf8');
  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function isDLocalGoPaymentSuccessful(status: unknown) {
  return ['APPROVED', 'COMPLETED', 'PAID', 'SUCCESS', 'SUCCEEDED'].includes(String(status).toUpperCase());
}