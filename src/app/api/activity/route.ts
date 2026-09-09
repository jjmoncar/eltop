import { NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: bids, error } = await supabaseAdmin
        .from('bids')
        .select('id, listing_id, category_id, bid_amount_cents, buyer_name, target_name, tagline, target_url, logo_url, created_at, categories(id, slug, name_es, icon)')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      return NextResponse.json({ bids: bids || [] });
    }

    // Mock data with populated category, sanitized of sensitive info
    const paidMockBids = mockBids
      .filter((b) => b.payment_status === 'paid')
      .map((b) => ({
        id: b.id,
        listing_id: b.listing_id,
        category_id: b.category_id,
        bid_amount_cents: b.bid_amount_cents,
        buyer_name: b.buyer_name,
        target_name: b.target_name,
        tagline: b.tagline,
        target_url: b.target_url,
        logo_url: b.logo_url,
        created_at: b.created_at,
        category: mockCategories.find((c) => c.id === b.category_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ bids: paidMockBids });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Error fetching activity' }, { status: 500 });
  }
}
