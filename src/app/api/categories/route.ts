import { NextResponse } from 'next/server';
import { supabaseAdmin, mockCategories, mockListings, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: categories, error: catErr } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (catErr) throw catErr;

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
      .sort((a, b) => a.position - b.position);

    return NextResponse.json({
      categories: mockCategories,
      listings: sanitizedMockListings,
    });
  } catch (error) {
    console.error('Error in /api/categories:', error);
    return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 });
  }
}
