import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulBid } from '@/app/api/webhooks/mercadopago/route';

export async function POST(req: NextRequest) {
  try {
    const { bidId, txHash } = await req.json();

    if (!bidId) {
      return NextResponse.json({ error: 'Falta bidId' }, { status: 400 });
    }

    await processSuccessfulBid(bidId, txHash || `usdt_manual_${Date.now()}`, {
      status: 'approved',
      provider: 'usdt_manual',
      txHash,
    });

    return NextResponse.json({ success: true, message: 'Pago USDT confirmado y puesto asignado.' });
  } catch (error) {
    console.error('Error confirming USDT payment:', error);
    return NextResponse.json({ error: 'Error confirmando pago USDT' }, { status: 500 });
  }
}
