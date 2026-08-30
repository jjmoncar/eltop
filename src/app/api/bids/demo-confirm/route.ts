import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulBid } from '@/app/api/webhooks/mercadopago/route';

export async function POST(req: NextRequest) {
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
