import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulBid } from '@/app/api/webhooks/mercadopago/route';
import { validateAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado. Se requiere token de administrador válido.' }, { status: 401 });
  }

  try {
    const { bidId, txHash } = await req.json();

    if (!bidId) {
      return NextResponse.json({ error: 'Falta el identificador de la puja (bidId).' }, { status: 400 });
    }

    await processSuccessfulBid(bidId, txHash || `paypal_${Date.now()}`, {
      status: 'approved',
      provider: 'paypal',
      txHash,
    });

    return NextResponse.json({ success: true, message: 'Pago PayPal confirmado y puesto asignado con éxito.' });
  } catch (error) {
    console.error('Error confirming PayPal payment:', error);
    return NextResponse.json({ error: 'Error al confirmar pago de PayPal' }, { status: 500 });
  }
}
