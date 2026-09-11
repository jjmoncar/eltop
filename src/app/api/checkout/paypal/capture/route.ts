import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder, getPayPalConfig } from '@/lib/paypal';
import { processSuccessfulBid } from '@/app/api/webhooks/mercadopago/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, bidId } = body;

    if (!orderId || !bidId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (orderId, bidId).' },
        { status: 400 }
      );
    }

    const config = getPayPalConfig();

    let captureId = `paypal_${orderId}`;
    let captureData: any = {};

    if (!config.isConfigured || orderId.startsWith('MOCK_ORDER_')) {
      console.warn('PayPal: Capturando orden simulada sin API real.');
      captureId = `mock_paypal_${Date.now()}`;
      captureData = { status: 'COMPLETED', simulated: true };
    } else {
      captureData = await capturePayPalOrder(orderId);

      const status = captureData.status;
      if (status !== 'COMPLETED') {
        return NextResponse.json(
          { error: `El pago no se completó en PayPal. Estado: ${status}` },
          { status: 400 }
        );
      }

      const captureObj = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      if (captureObj?.id) {
        captureId = captureObj.id;
      }
    }

    // Activar inmediatamente la puja y crear o actualizar el listing en la base de datos
    await processSuccessfulBid(bidId, captureId, {
      provider: 'paypal',
      orderId,
      ...captureData,
    });

    return NextResponse.json({
      success: true,
      captureId,
      orderId,
      message: 'Pago de PayPal verificado y acreditado exitosamente.',
    });
  } catch (error: any) {
    console.error('Error en /api/checkout/paypal/capture:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al capturar y confirmar el pago de PayPal.' },
      { status: 500 }
    );
  }
}
