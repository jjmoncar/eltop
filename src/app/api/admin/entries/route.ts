import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, mockLeaderboardEntries, mockListings, supabaseAdmin } from '@/lib/supabase/admin';
import { validateAdminRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  try {
    const { id, name, tagline, url, logoUrl } = await req.json();
    if (!id || !name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: 'Nombre y URL son obligatorios.' }, { status: 400 });
    }
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;

    if (isSupabaseConfigured && supabaseAdmin) {
      const entryUpdate = await supabaseAdmin
        .from('leaderboard_entries')
        .update({ display_name: name.trim(), tagline: tagline?.trim() || null, link_url: cleanUrl, logo_url: logoUrl?.trim() || null })
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (!entryUpdate.error && entryUpdate.data) return NextResponse.json({ success: true });

      const listingUpdate = await supabaseAdmin
        .from('listings')
        .update({ name: name.trim(), tagline: tagline?.trim() || '', url: cleanUrl, logo_url: logoUrl?.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (listingUpdate.error || !listingUpdate.data) return NextResponse.json({ error: 'Listado no encontrado.' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    const entry = mockLeaderboardEntries.find((item) => item.id === id);
    if (entry) {
      entry.display_name = name.trim();
      entry.tagline = tagline?.trim() || null;
      entry.link_url = cleanUrl;
      entry.logo_url = logoUrl?.trim() || null;
      return NextResponse.json({ success: true });
    }
    const listing = mockListings.find((item) => item.id === id);
    if (!listing) return NextResponse.json({ error: 'Listado no encontrado.' }, { status: 404 });
    listing.name = name.trim();
    listing.tagline = tagline?.trim() || '';
    listing.url = cleanUrl;
    listing.logo_url = logoUrl?.trim() || null;
    listing.updated_at = new Date().toISOString();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating admin entry:', error);
    return NextResponse.json({ error: 'Error actualizando el listado.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta el ID del listado.' }, { status: 400 });

    if (isSupabaseConfigured && supabaseAdmin) {
      const entryDelete = await supabaseAdmin.from('leaderboard_entries').delete().eq('id', id).select('id').maybeSingle();
      if (!entryDelete.error && entryDelete.data) return NextResponse.json({ success: true });
      const listingDelete = await supabaseAdmin.from('listings').delete().eq('id', id).select('id').maybeSingle();
      if (listingDelete.error || !listingDelete.data) return NextResponse.json({ error: 'Listado no encontrado.' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    const entryIndex = mockLeaderboardEntries.findIndex((item) => item.id === id);
    if (entryIndex >= 0) mockLeaderboardEntries.splice(entryIndex, 1);
    else {
      const listingIndex = mockListings.findIndex((item) => item.id === id);
      if (listingIndex < 0) return NextResponse.json({ error: 'Listado no encontrado.' }, { status: 404 });
      mockListings.splice(listingIndex, 1);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin entry:', error);
    return NextResponse.json({ error: 'Error eliminando el listado.' }, { status: 500 });
  }
}