import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, mockListings, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { validateAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado. Se requiere token de administrador válido.' }, { status: 401 });
  }

  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: listings } = await supabaseAdmin.from('listings').select('*');
      const { data: bids } = await supabaseAdmin.from('bids').select('*');
      const { data: categories } = await supabaseAdmin.from('categories').select('*');

      const paidBids = bids?.filter((b) => b.payment_status === 'paid') || [];
      const pendingPaypalBids = bids?.filter((b) => b.payment_status === 'pending' && (b.payment_provider === 'paypal' || b.payment_provider === 'usdt_manual')) || [];
      const totalRevenueCents = paidBids.reduce((acc, b) => acc + (b.bid_amount_cents || 0), 0);
      const totalClicks = listings?.reduce((acc, l) => acc + (l.click_count || 0), 0) || 0;

      return NextResponse.json({
        totalRevenueCents,
        totalClicks,
        totalListings: listings?.length || 0,
        pendingPaypalCount: pendingPaypalBids.length,
        pendingUsdtCount: pendingPaypalBids.length,
        listings: listings || [],
        bids: bids || [],
        categories: categories || [],
      });
    }

    const paidBids = mockBids.filter((b) => b.payment_status === 'paid');
    const pendingPaypal = mockBids.filter((b) => b.payment_status === 'pending' && (b.payment_provider === 'paypal' || b.payment_provider === 'usdt_manual'));
    const totalRevenueCents = paidBids.reduce((acc, b) => acc + b.bid_amount_cents, 0);
    const totalClicks = mockListings.reduce((acc, l) => acc + l.click_count, 0);

    return NextResponse.json({
      totalRevenueCents,
      totalClicks,
      totalListings: mockListings.length,
      pendingPaypalCount: pendingPaypal.length,
      pendingUsdtCount: pendingPaypal.length,
      listings: mockListings,
      bids: mockBids,
      categories: mockCategories,
    });
  } catch (error) {
    console.error('Error in admin metrics:', error);
    return NextResponse.json({ error: 'Error fetching metrics' }, { status: 500 });
  }
}
