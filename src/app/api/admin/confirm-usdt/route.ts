import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulBid } from '@/app/api/webhooks/mercadopago/route';
import { validateAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: 'No autorizado. Se requiere token de administrador válido.' }, { status: 401 });
  }

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
