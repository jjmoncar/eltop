import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, sanitizeText, validateListingInput } from '@/lib/anti-abuse';
import { mockCategories, mockLeaderboardEntries, mockListings, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { LeaderboardEntry } from '@/types/database';
import { normalizeListingUrl } from '@/lib/listing-url';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!checkRateLimit(`free:${ip}`, 5)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { categoryId, name, tagline, url, logoUrl } = body;
    const validation = validateListingInput({
      name,
      tagline,
      url,
      email: 'free-registration@eltop.lat',
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const category = isSupabaseConfigured
      ? null
      : mockCategories.find((item) => item.id === categoryId || item.slug === categoryId);
    const resolvedCategoryId = category?.id || categoryId;
    const cleanName = sanitizeText(name);
    const cleanTagline = sanitizeText(tagline);
    const cleanLogoUrl = logoUrl ? sanitizeText(logoUrl) : null;
    const cleanUrl = normalizeListingUrl(url);

    if (!resolvedCategoryId) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('register_free_entry', {
        p_category_id: resolvedCategoryId,
        p_display_name: cleanName,
        p_link_url: cleanUrl,
        p_tagline: cleanTagline,
        p_logo_url: cleanLogoUrl,
      });

      if (error || !data) {
        if (error?.message.includes('LISTING_URL_ALREADY_EXISTS')) {
          return NextResponse.json({ error: 'Esta URL ya está registrada en otro anuncio.' }, { status: 409 });
        }
        console.error('Free entry registration error:', error);
        return NextResponse.json({ error: 'No se pudo registrar la entrada gratuita.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, entry: data });
    }

    const existingUrl = mockLeaderboardEntries.some((entry) => entry.link_url && normalizeListingUrl(entry.link_url) === cleanUrl)
      || mockListings.some((listing) => listing.url && normalizeListingUrl(listing.url) === cleanUrl);
    if (existingUrl) {
      return NextResponse.json({ error: 'Esta URL ya está registrada en otro anuncio.' }, { status: 409 });
    }

    const categoryEntries = mockLeaderboardEntries.filter((entry) => entry.category_id === resolvedCategoryId);
    const usedPositions = new Set(categoryEntries.map((entry) => entry.position).filter((position) => position !== null));
    const openPosition = Array.from({ length: 20 }, (_, index) => index + 1).find((position) => !usedPositions.has(position)) || null;
    const entry: LeaderboardEntry = {
      id: `entry_${Date.now()}`,
      category_id: resolvedCategoryId,
      display_name: cleanName,
      link_url: cleanUrl,
      tagline: cleanTagline,
      logo_url: cleanLogoUrl,
      position: openPosition,
      current_price: null,
      is_paid: false,
      is_approved: true,
      click_count: 0,
      registered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockLeaderboardEntries.push(entry);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error in /api/entries/register:', error);
    return NextResponse.json({ error: 'Ocurrió un error inesperado al registrar la entrada.' }, { status: 500 });
  }
}