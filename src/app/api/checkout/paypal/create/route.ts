import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { Bid, Category } from '@/types/database';
import { createPayPalOrder, getPayPalConfig } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bidId } = body;

    if (!bidId) {
      return NextResponse.json({ error: 'Falta el identificador de la puja (bidId).' }, { status: 400 });
    }

    let bid: Bid | null = null;
    let category: Category | null = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: bidData } = await supabaseAdmin
        .from('bids')
        .select('*')
        .eq('id', bidId)
        .single();

      if (bidData) {
        bid = bidData as Bid;
        const { data: catData } = await supabaseAdmin
          .from('categories')
          .select('*')
          .eq('id', bid.category_id)
          .single();
        if (catData) category = catData as Category;
      }
    } else {
      bid = mockBids.find((b) => b.id === bidId) || null;
      if (bid) {
        category = mockCategories.find((c) => c.id === bid!.category_id) || null;
      }
    }

    if (!bid) {
      return NextResponse.json({ error: 'La puja no existe o expiró.' }, { status: 404 });
    }

    const amountUsd = (bid.bid_amount_cents / 100).toFixed(2);
    const itemName = `ELTOP - ${bid.target_name} (${category?.name_es || 'Leaderboard'})`;

    const config = getPayPalConfig();

    if (!config.isConfigured) {
      console.error('[PAYPAL ERROR] Credenciales no configuradas (NEXT_PUBLIC_PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET ausentes).');
      return NextResponse.json(
        {
          error:
            'Las credenciales de PayPal (NEXT_PUBLIC_PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET) no están configuradas en las variables de entorno de tu servidor/hosting (ej. Vercel). Agrégalas para procesar pagos.',
          notConfigured: true,
        },
        { status: 400 }
      );
    }

    const order = await createPayPalOrder({
      bidId: bid.id,
      amountUsd,
      description: itemName,
    });

    return NextResponse.json({
      orderId: order.id,
      amountUsd,
    });
  } catch (error: any) {
    console.error('Error en /api/checkout/paypal/create:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al generar la orden de PayPal.' },
      { status: 500 }
    );
  }
}
