import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulBid } from '@/app/api/webhooks/mercadopago/route';
import { isMercadoPagoConfigured } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
  // Por seguridad, jamás permitir confirmaciones simuladas en producción o con pasarela real
  if (process.env.NODE_ENV === 'production' || isMercadoPagoConfigured) {
    return NextResponse.json(
      { error: 'Confirmación demo no permitida en entorno con pasarela real activa.' },
      { status: 403 }
    );
  }

  try {
    const { bidId } = await req.json();

    if (!bidId) {
      return NextResponse.json({ error: 'Falta el bidId' }, { status: 400 });
    }

    await processSuccessfulBid(bidId, `demo_tx_${Date.now()}`, {
      status: 'approved',
      status_detail: 'accredited',
      payment_type_id: 'demo_instant',
    });

    return NextResponse.json({ success: true, message: 'Pago simulado y ranking recalculado con éxito.' });
  } catch (error) {
    console.error('Error in /api/bids/demo-confirm:', error);
    return NextResponse.json({ error: 'Error al simular pago' }, { status: 500 });
  }
}
