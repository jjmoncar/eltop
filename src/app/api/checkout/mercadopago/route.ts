import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { createPaymentPreference } from '@/lib/mercadopago';
import { Bid, Category } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bidId, paymentProvider } = body;

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

    const hostUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const backUrl = `${hostUrl}/${category ? category.slug : 'saas'}/reclamar`;

    const rawData = (bid.raw_payment_data as any) || {};
    const buyerCountry = rawData.country || 'BR';
    const docType = rawData.doc_type || 'CPF';
    const docNumber = rawData.doc_number || '';

    const unitPriceUsd = bid.bid_amount_cents / 100;
    const prefResult = await createPaymentPreference({
      bidId: bid.id,
      title: `${bid.target_name} (${category?.name_es || 'Leaderboard'})`,
      unitPriceUsd,
      buyerEmail: bid.buyer_email,
      buyerName: bid.buyer_name,
      country: buyerCountry,
      docType,
      docNumber,
      backUrl,
      paymentProvider: paymentProvider || bid.payment_provider,
    });

    return NextResponse.json({
      success: true,
      preferenceId: prefResult.id,
      initPoint: prefResult.init_point,
      sandboxInitPoint: prefResult.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('Error in /api/checkout/mercadopago:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al generar la pasarela de pago.' },
      { status: 500 }
    );
  }
}
