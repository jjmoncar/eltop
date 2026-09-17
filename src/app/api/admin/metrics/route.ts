import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, mockListings, mockLeaderboardEntries, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { validateAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado. Se requiere token de administrador válido.' }, { status: 401 });
  }

  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: listings } = await supabaseAdmin.from('listings').select('*');
      const { data: entries } = await supabaseAdmin
        .from('leaderboard_entries')
        .select('*')
        .order('position', { ascending: true, nullsFirst: false })
        .order('registered_at', { ascending: true });
      const { data: bids } = await supabaseAdmin.from('bids').select('*');
      const { data: categories } = await supabaseAdmin.from('categories').select('*');

      const organicByCategory = new Map<string, number>();
      const freemiumListings = (entries || []).map((entry) => {
        const organicIndex = organicByCategory.get(entry.category_id) || 0;
        if (entry.position === null) organicByCategory.set(entry.category_id, organicIndex + 1);
        return {
          id: entry.id,
          category_id: entry.category_id,
          rank_type: 'all_time',
          position: entry.position === null ? 21 + organicIndex : entry.position,
          name: entry.display_name,
          tagline: entry.tagline || '',
          url: entry.link_url || '#',
          logo_url: entry.logo_url,
          email: '',
          current_bid_cents: Math.round(Number(entry.current_price || 0) * 100),
          click_count: entry.click_count || 0,
          is_approved: entry.is_approved,
          is_paid: entry.is_paid,
          created_at: entry.created_at,
          updated_at: entry.created_at,
        };
      });
      const allListings = [...(listings || []), ...freemiumListings];

      const paidBids = bids?.filter((b) => b.payment_status === 'paid') || [];
      const pendingPaypalBids = bids?.filter((b) => b.payment_status === 'pending' && (b.payment_provider === 'paypal' || b.payment_provider === 'usdt_manual')) || [];
      const totalRevenueCents = paidBids.reduce((acc, b) => acc + (b.bid_amount_cents || 0), 0);
      const totalClicks = allListings.reduce((acc, l) => acc + (l.click_count || 0), 0);

      return NextResponse.json({
        totalRevenueCents,
        totalClicks,
        totalListings: allListings.length,
        pendingPaypalCount: pendingPaypalBids.length,
        pendingUsdtCount: pendingPaypalBids.length,
        listings: allListings,
        bids: bids || [],
        categories: categories || [],
      });
    }

    const paidBids = mockBids.filter((b) => b.payment_status === 'paid');
    const pendingPaypal = mockBids.filter((b) => b.payment_status === 'pending' && (b.payment_provider === 'paypal' || b.payment_provider === 'usdt_manual'));
    const totalRevenueCents = paidBids.reduce((acc, b) => acc + b.bid_amount_cents, 0);
    const organicByCategory = new Map<string, number>();
    const freemiumListings = mockLeaderboardEntries.map((entry) => {
      const organicIndex = organicByCategory.get(entry.category_id) || 0;
      if (entry.position === null) organicByCategory.set(entry.category_id, organicIndex + 1);
      return {
        id: entry.id,
        category_id: entry.category_id,
        rank_type: 'all_time' as const,
        position: entry.position === null ? 21 + organicIndex : entry.position,
        name: entry.display_name,
        tagline: entry.tagline || '',
        url: entry.link_url || '#',
        logo_url: entry.logo_url,
        email: '',
        current_bid_cents: Math.round(Number(entry.current_price || 0) * 100),
        click_count: entry.click_count || 0,
        is_approved: entry.is_approved,
        is_paid: entry.is_paid,
        created_at: entry.created_at,
        updated_at: entry.created_at,
      };
    });
    const allListings = [...mockListings, ...freemiumListings];
    const totalClicks = allListings.reduce((acc, l) => acc + l.click_count, 0);

    return NextResponse.json({
      totalRevenueCents,
      totalClicks,
      totalListings: allListings.length,
      pendingPaypalCount: pendingPaypal.length,
      pendingUsdtCount: pendingPaypal.length,
      listings: allListings,
      bids: mockBids,
      categories: mockCategories,
    });
  } catch (error) {
    console.error('Error in admin metrics:', error);
    return NextResponse.json({ error: 'Error fetching metrics' }, { status: 500 });
  }
}
