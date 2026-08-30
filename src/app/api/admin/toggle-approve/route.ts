import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockListings, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { listingId, isApproved } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Falta listingId' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('listings')
        .update({ is_approved: isApproved, updated_at: new Date().toISOString() })
        .eq('id', listingId);

      if (error) throw error;
    } else {
      const item = mockListings.find((l) => l.id === listingId);
      if (item) {
        item.is_approved = isApproved;
        item.updated_at = new Date().toISOString();
      }
    }

    return NextResponse.json({ success: true, isApproved });
  } catch (error) {
    console.error('Error toggling approval:', error);
    return NextResponse.json({ error: 'Error actualizando estado' }, { status: 500 });
  }
}
