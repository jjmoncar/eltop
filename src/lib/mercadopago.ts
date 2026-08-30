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

export async function createPaymentPreference({
  bidId,
  title,
  unitPriceUsd,
  buyerEmail,
  backUrl,
}: {
  bidId: string;
  title: string;
  unitPriceUsd: number;
  buyerEmail: string;
  backUrl: string;
}) {
  if (!mpClient) {
    // Return a mock sandbox checkout URL for local testing and demonstration
    return {
      id: `pref_mock_${bidId}`,
      init_point: `${backUrl}?demo_payment=success&bid_id=${bidId}`,
      sandbox_init_point: `${backUrl}?demo_payment=success&bid_id=${bidId}`,
    };
  }

  const preference = new Preference(mpClient);
  const response = await preference.create({
    body: {
      items: [
        {
          id: bidId,
          title: `eltop.lat — ${title}`,
          description: `Puesto en eltop.lat (Leaderboard LATAM)`,
          quantity: 1,
          unit_price: unitPriceUsd,
          currency_id: 'USD',
        },
      ],
      payer: {
        email: buyerEmail,
      },
      external_reference: bidId,
      back_urls: {
        success: `${backUrl}?payment=success&bid_id=${bidId}`,
        failure: `${backUrl}?payment=failure&bid_id=${bidId}`,
        pending: `${backUrl}?payment=pending&bid_id=${bidId}`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://eltop.lat'}/api/webhooks/mercadopago`,
    },
  });

  return response;
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
