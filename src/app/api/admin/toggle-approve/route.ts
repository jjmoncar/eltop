import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockListings, isSupabaseConfigured } from '@/lib/supabase/admin';
import { validateAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado. Se requiere token de administrador válido.' }, { status: 401 });
  }

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
