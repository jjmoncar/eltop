import { NextResponse } from 'next/server';
import { supabaseAdmin, mockCategories, mockListings, mockLeaderboardEntries, isSupabaseConfigured } from '@/lib/supabase/admin';

function sortRanking<T extends { position: number | null; registered_at?: string }>(entries: T[]) {
  return entries.sort((a, b) => {
    if (a.position !== null && b.position !== null) return a.position - b.position;
    if (a.position !== null) return -1;
    if (b.position !== null) return 1;
    return new Date(a.registered_at || 0).getTime() - new Date(b.registered_at || 0).getTime();
  });
}

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: categories, error: catErr } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (catErr) throw catErr;

      const { data: entries, error: entryErr } = await supabaseAdmin
        .from('leaderboard_entries')
        .select('id, category_id, display_name, tagline, link_url, logo_url, position, current_price, is_paid, is_approved, registered_at, created_at')
        .eq('is_approved', true);

      if (!entryErr && entries) {
        const organicByCategory = new Map<string, number>();
        const listings = sortRanking([...entries]).map((entry) => {
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
            current_bid_cents: Math.round(Number(entry.current_price || 0) * 100),
            click_count: 0,
            is_approved: entry.is_approved,
            is_paid: entry.is_paid,
            registered_at: entry.registered_at,
            created_at: entry.created_at,
            updated_at: entry.created_at,
          };
        });
        return NextResponse.json({ categories, listings });
      }

      // Keep legacy listings readable until the freemium migration is applied.
      const { data: listings, error: listErr } = await supabaseAdmin
        .from('listings')
        .select('id, category_id, rank_type, position, name, tagline, url, logo_url, current_bid_cents, click_count, is_approved, created_at, updated_at')
        .eq('is_approved', true)
        .order('position', { ascending: true });

      if (listErr) throw listErr;

      return NextResponse.json({ categories, listings });
    }

    const sanitizedMockListings = mockListings
      .filter((l) => l.is_approved)
      .map(({ email, ...rest }) => rest)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    const organicByCategory = new Map<string, number>();
    const freemiumListings = sortRanking([...mockLeaderboardEntries])
      .filter((entry) => entry.is_approved)
      .map((entry) => {
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
          current_bid_cents: Math.round(Number(entry.current_price || 0) * 100),
          click_count: 0,
          is_approved: true,
          is_paid: entry.is_paid,
          registered_at: entry.registered_at,
          created_at: entry.created_at,
          updated_at: entry.created_at,
        };
      });

    return NextResponse.json({
      categories: mockCategories,
      listings: [...sanitizedMockListings, ...freemiumListings],
    });
  } catch (error) {
    console.error('Error in /api/categories:', error);
    return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 });
  }
}
