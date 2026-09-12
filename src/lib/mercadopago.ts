import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

export const isMercadoPagoConfigured = Boolean(
  mpAccessToken && !mpAccessToken.includes('placeholder')
);

// Initialize client if token is available
export const mpClient = isMercadoPagoConfigured
  ? new MercadoPagoConfig({
      accessToken: mpAccessToken,
      options: { timeout: 8000 },
    })
  : null;

import { CURRENCIES } from '@/lib/currencies';
import { CurrencyCode } from '@/types/database';

export async function createPaymentPreference({
  bidId,
  title,
  unitPriceUsd,
  buyerEmail,
  buyerName,
  country = 'BR',
  docType = 'CPF',
  docNumber = '',
  backUrl,
  paymentProvider = 'stripe_pix',
}: {
  bidId: string;
  title: string;
  unitPriceUsd: number;
  buyerEmail: string;
  buyerName?: string;
  country?: string;
  docType?: string;
  docNumber?: string;
  backUrl: string;
  paymentProvider?: string;
}) {
  if (!mpClient) {
    // Return a mock sandbox checkout URL for local testing and demonstration
    return {
      id: `pref_mock_${bidId}`,
      init_point: `${backUrl}?demo_payment=success&bid_id=${bidId}`,
      sandbox_init_point: `${backUrl}?demo_payment=success&bid_id=${bidId}`,
    };
  }

  // Pix se procesa exclusivamente en Reales Brasileños (BRL) a través de Mercado Pago
  const targetCurrency: CurrencyCode = 'BRL';
  const currencyConfig = CURRENCIES.BRL;
  const rate = currencyConfig.rateAgainstUSD || 5.60;
  const unitPrice = Math.max(0.5, Number((unitPriceUsd * rate).toFixed(2)));

  const preference = new Preference(mpClient);

  const cleanDoc = docNumber ? docNumber.replace(/[^\w]/g, '') : '';
  const nameParts = (buyerName || 'Comprador').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Comprador';
  const lastName = nameParts.slice(1).join(' ') || 'eltop.lat';

  const body: Record<string, any> = {
    items: [
      {
        id: bidId,
        title: `eltop.lat — ${title}`,
        description: `Puesto en eltop.lat (Pix Brasil - ${docType}: ${docNumber || 'N/A'}) - Eq. $${unitPriceUsd} USD`,
        quantity: 1,
        unit_price: unitPrice,
        currency_id: targetCurrency,
      },
    ],
    payer: {
      name: firstName,
      surname: lastName,
      email: buyerEmail || 'comprador@eltop.lat',
      ...(cleanDoc
        ? {
            identification: {
              type: docType || 'CPF',
              number: cleanDoc,
            },
          }
        : {}),
    },
    // Excluir tarjetas de crédito y débito: Mercado Pago se utiliza únicamente para Pix
    payment_methods: {
      default_payment_method_id: 'pix',
      excluded_payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'prepaid_card' },
      ],
      installments: 1,
    },
    external_reference: bidId,
    back_urls: {
      success: `${backUrl}?payment=success&bid_id=${bidId}`,
      failure: `${backUrl}?payment=failure&bid_id=${bidId}`,
      pending: `${backUrl}?payment=pending&bid_id=${bidId}`,
    },
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://eltop.lat'}/api/webhooks/mercadopago`,
  };

  // Mercado Pago solo acepta auto_return si la URL de éxito usa HTTPS
  if (body.back_urls.success.startsWith('https://')) {
    body.auto_return = 'approved';
  }

  try {
    const response = await preference.create({ body: body as any });
    return response;
  } catch (error: any) {
    console.error('[MERCADOPAGO PREFERENCE ERROR]', {
      message: error?.message,
      cause: error?.cause,
      status: error?.status,
    });
    throw error;
  }
}

export async function getPaymentDetails(paymentId: string) {
  if (!mpClient) return null;
  try {
    const payment = new Payment(mpClient);
    const details = await payment.get({ id: paymentId });
    return details;
  } catch (err) {
    console.error('Error fetching Mercado Pago payment:', err);
    return null;
  }
}
