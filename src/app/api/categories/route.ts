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
        .select('*')
        .eq('is_approved', true)
        .order('position', { ascending: true });

      if (listErr) throw listErr;

      return NextResponse.json({ categories, listings });
    }

    return NextResponse.json({
      categories: mockCategories,
      listings: mockListings.filter((l) => l.is_approved).sort((a, b) => a.position - b.position),
    });
  } catch (error) {
    console.error('Error in /api/categories:', error);
    return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 });
  }
}
