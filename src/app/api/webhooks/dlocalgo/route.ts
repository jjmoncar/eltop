import { NextRequest, NextResponse } from 'next/server';
import { getDLocalGoPayment, isDLocalGoPaymentSuccessful, verifyDLocalGoNotification } from '@/lib/dlocalgo';
import { processSuccessfulBid } from '@/app/api/webhooks/mercadopago/route';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifyDLocalGoNotification(rawBody, req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Firma de notificación dLocal Go no válida.' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as { payment_id?: string };
    if (!body.payment_id) return NextResponse.json({ received: true, note: 'No payment_id provided.' });

    const payment = await getDLocalGoPayment(body.payment_id);
    if (!isDLocalGoPaymentSuccessful(payment.status)) {
      return NextResponse.json({ received: true, status: payment.status });
    }
    if (!payment.order_id) throw new Error('El pago dLocal Go no contiene order_id.');

    await processSuccessfulBid(payment.order_id, body.payment_id, { provider: 'dlocalgo', ...payment });
    return NextResponse.json({ success: true, processedBidId: payment.order_id });
  } catch (error) {
    console.error('Error procesando webhook de dLocal Go:', error);
    return NextResponse.json({ error: 'Internal dLocal Go webhook error.' }, { status: 500 });
  }
}