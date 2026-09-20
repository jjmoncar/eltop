import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { createDLocalGoPayment, dLocalGoConfig } from '@/lib/dlocalgo';
import { Bid, Category } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const { bidId } = await req.json().catch(() => ({}));
    if (!bidId) return NextResponse.json({ error: 'Falta el identificador de la puja (bidId).' }, { status: 400 });
    if (!dLocalGoConfig.isConfigured) {
      return NextResponse.json({ error: 'DLOCALGO_API_KEY y DLOCALGO_SECRET_KEY no están configuradas.', notConfigured: true }, { status: 400 });
    }

    let bid: Bid | null = null;
    let category: Category | null = null;
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('bids').select('*').eq('id', bidId).single();
      bid = (data as Bid) || null;
      if (bid) {
        const { data: categoryData } = await supabaseAdmin.from('categories').select('*').eq('id', bid.category_id).single();
        category = (categoryData as Category) || null;
      }
    } else {
      bid = mockBids.find((item) => item.id === bidId) || null;
      category = bid ? mockCategories.find((item) => item.id === bid!.category_id) || null : null;
    }

    if (!bid) return NextResponse.json({ error: 'La puja no existe o expiró.' }, { status: 404 });
    const rawData = (bid.raw_payment_data as Record<string, string>) || {};
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${origin}/${category?.slug || 'saas'}/reclamar`;
    const payment = await createDLocalGoPayment({
      bidId: bid.id,
      amountUsd: bid.bid_amount_cents / 100,
      country: rawData.country || 'AR',
      buyerName: bid.buyer_name,
      buyerEmail: bid.buyer_email,
      docType: rawData.doc_type || 'DNI',
      docNumber: rawData.doc_number || '',
      description: `ELTOP - ${bid.target_name} (${category?.name_es || 'Leaderboard'})`,
      successUrl: `${returnUrl}?payment=success&bid_id=${bid.id}`,
      backUrl: `${returnUrl}?payment=cancelled&bid_id=${bid.id}`,
      notificationUrl: `${origin}/api/webhooks/dlocalgo`,
    });

    return NextResponse.json({ success: true, paymentId: payment.id, redirectUrl: payment.redirect_url });
  } catch (error: any) {
    console.error('Error en /api/checkout/dlocalgo:', error);
    return NextResponse.json({ error: error?.message || 'Error al generar el checkout de dLocal Go.' }, { status: 500 });
  }
}