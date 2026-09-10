import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { Bid, Category } from '@/types/database';

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

    const hostUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://eltop.lat';
    const categorySlug = category ? category.slug : 'saas';
    const successUrl = `${hostUrl}/${categorySlug}/reclamar?payment=success&bid_id=${bid.id}&provider=paypal`;
    const cancelUrl = `${hostUrl}/${categorySlug}/reclamar?payment=cancelled&bid_id=${bid.id}`;

    const amountUsd = (bid.bid_amount_cents / 100).toFixed(2);
    const itemName = `eltop.lat — ${bid.target_name} (${category?.name_es || 'Leaderboard'})`;
    const paypalEmail = process.env.PAYPAL_EMAIL || process.env.NEXT_PUBLIC_PAYPAL_EMAIL || 'pagos@eltop.lat';

    // Generar enlace universal de pago PayPal
    const paypalParams = new URLSearchParams({
      cmd: '_xclick',
      business: paypalEmail,
      item_name: itemName,
      amount: amountUsd,
      currency_code: 'USD',
      custom: bid.id,
      return: successUrl,
      cancel_return: cancelUrl,
      no_shipping: '1',
    });

    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?${paypalParams.toString()}`;

    return NextResponse.json({
      success: true,
      bidId: bid.id,
      amountUsd,
      paypalEmail,
      itemName,
      paypalUrl,
      successUrl,
    });
  } catch (error: any) {
    console.error('Error in /api/checkout/paypal:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al generar la pasarela de PayPal.' },
      { status: 500 }
    );
  }
}
