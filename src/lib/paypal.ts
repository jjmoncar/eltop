export const getPayPalConfig = () => {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
  const baseUrl =
    mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  return {
    clientId,
    clientSecret,
    mode,
    baseUrl,
    isConfigured: Boolean(clientId && clientSecret),
  };
};

/**
 * Obtiene el access_token OAuth 2.0 de la API de PayPal.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret, baseUrl, isConfigured } = getPayPalConfig();

  if (!isConfigured) {
    throw new Error('Credenciales de PayPal no configuradas en las variables de entorno.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error al obtener token de PayPal:', errorText);
    throw new Error(`Error de autenticación con PayPal: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Crea una orden de pago en PayPal (v2/checkout/orders)
 */
export async function createPayPalOrder(params: {
  bidId: string;
  amountUsd: string;
  description: string;
}) {
  const { baseUrl } = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.bidId,
        custom_id: params.bidId,
        description: params.description.slice(0, 127),
        amount: {
          currency_code: 'USD',
          value: params.amountUsd,
        },
      },
    ],
    application_context: {
      brand_name: 'ELTOP.LAT',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Error creando orden en PayPal:', data);
    throw new Error(data.message || 'Error al crear la orden de PayPal.');
  }

  return data;
}

/**
 * Captura una orden aprobada por el usuario en PayPal (v2/checkout/orders/{id}/capture)
 */
export async function capturePayPalOrder(orderId: string) {
  const { baseUrl } = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Error capturando orden de PayPal:', data);
    throw new Error(data.message || 'Error al capturar el pago en PayPal.');
  }

  return data;
}
