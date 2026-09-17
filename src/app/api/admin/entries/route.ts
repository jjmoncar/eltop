import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, mockLeaderboardEntries, mockListings, supabaseAdmin } from '@/lib/supabase/admin';
import { validateAdminRequest } from '@/lib/auth';
import { normalizeListingUrl } from '@/lib/listing-url';

export async function PATCH(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  try {
    const { id, name, tagline, url, logoUrl } = await req.json();
    if (!id || !name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: 'Nombre y URL son obligatorios.' }, { status: 400 });
    }
    const cleanUrl = normalizeListingUrl(url);

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: currentEntry } = await supabaseAdmin
        .from('leaderboard_entries')
        .select('link_url')
        .eq('id', id)
        .maybeSingle();
      const { data: currentListing } = currentEntry ? { data: null } : await supabaseAdmin
        .from('listings')
        .select('url')
        .eq('id', id)
        .maybeSingle();
      const previousUrl = currentEntry?.link_url || currentListing?.url;
      const previousNormalizedUrl = previousUrl ? normalizeListingUrl(previousUrl) : null;
      if (previousNormalizedUrl !== cleanUrl) {
        const { error: claimError } = await supabaseAdmin.rpc('claim_listing_url', {
          p_url: cleanUrl,
          ...(currentEntry ? { p_entry_id: id } : { p_listing_id: id }),
        });
        if (claimError) return NextResponse.json({ error: 'Esta URL ya está registrada en otro anuncio.' }, { status: 409 });
      }

      const entryUpdate = await supabaseAdmin
        .from('leaderboard_entries')
        .update({ display_name: name.trim(), tagline: tagline?.trim() || null, link_url: cleanUrl, logo_url: logoUrl?.trim() || null })
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (!entryUpdate.error && entryUpdate.data) {
        if (previousNormalizedUrl !== cleanUrl) {
          await supabaseAdmin.rpc('release_listing_url', { p_entry_id: id, p_keep_url: cleanUrl });
        }
        return NextResponse.json({ success: true });
      }

      const listingUpdate = await supabaseAdmin
        .from('listings')
        .update({ name: name.trim(), tagline: tagline?.trim() || '', url: cleanUrl, logo_url: logoUrl?.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (listingUpdate.error || !listingUpdate.data) return NextResponse.json({ error: 'Listado no encontrado.' }, { status: 404 });
      if (previousNormalizedUrl !== cleanUrl) {
        await supabaseAdmin.rpc('release_listing_url', { p_listing_id: id, p_keep_url: cleanUrl });
      }
      return NextResponse.json({ success: true });
    }

    const entry = mockLeaderboardEntries.find((item) => item.id === id);
    if (entry) {
      const duplicate = [...mockLeaderboardEntries, ...mockListings].some((item) => {
        const itemId = item.id;
        const itemUrl = 'link_url' in item ? item.link_url : 'url' in item ? item.url : null;
        return itemId !== id && itemUrl && normalizeListingUrl(itemUrl) === cleanUrl;
      });
      if (duplicate) return NextResponse.json({ error: 'Esta URL ya está registrada en otro anuncio.' }, { status: 409 });
      entry.display_name = name.trim();
      entry.tagline = tagline?.trim() || null;
      entry.link_url = cleanUrl;
      entry.logo_url = logoUrl?.trim() || null;
      return NextResponse.json({ success: true });
    }
    const listing = mockListings.find((item) => item.id === id);
    if (!listing) return NextResponse.json({ error: 'Listado no encontrado.' }, { status: 404 });
    const duplicate = [...mockLeaderboardEntries, ...mockListings].some((item) => {
      const itemUrl = 'link_url' in item ? item.link_url : 'url' in item ? item.url : null;
      return item.id !== id && itemUrl && normalizeListingUrl(itemUrl) === cleanUrl;
    });
    if (duplicate) return NextResponse.json({ error: 'Esta URL ya está registrada en otro anuncio.' }, { status: 409 });
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
      if (!entryDelete.error && entryDelete.data) {
        await supabaseAdmin.rpc('release_listing_url', { p_entry_id: id });
        return NextResponse.json({ success: true });
      }
      const listingDelete = await supabaseAdmin.from('listings').delete().eq('id', id).select('id').maybeSingle();
      if (listingDelete.error || !listingDelete.data) return NextResponse.json({ error: 'Listado no encontrado.' }, { status: 404 });
      await supabaseAdmin.rpc('release_listing_url', { p_listing_id: id });
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