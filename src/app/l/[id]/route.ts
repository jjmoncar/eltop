import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockListings, mockLeaderboardEntries, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let targetUrl = 'https://eltop.lat';

  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      // Freemium entries are the primary ranking source; keep legacy listings as fallback.
      const { data: entry } = await supabaseAdmin
        .from('leaderboard_entries')
        .select('link_url')
        .eq('id', id)
        .eq('is_approved', true)
        .maybeSingle();

      if (entry?.link_url) {
        targetUrl = entry.link_url;
      } else {
        const { data: listing } = await supabaseAdmin
        .from('listings')
        .select('url')
        .eq('id', id)
          .eq('is_approved', true)
          .maybeSingle();

        if (listing?.url) targetUrl = listing.url;
      }

      if (targetUrl !== 'https://eltop.lat') {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || '';

        if (entry?.link_url) {
          supabaseAdmin.rpc('increment_entry_click_count', { target_entry_id: id }).then();
        } else {
          supabaseAdmin.rpc('increment_click_count', { target_listing_id: id }).then();
          supabaseAdmin.from('click_events').insert({
            listing_id: id,
            ip_hash: Buffer.from(ip).toString('base64').slice(0, 16),
            user_agent: userAgent.slice(0, 200),
            referer: referer.slice(0, 200),
          }).then();
        }
      }
    } else {
      const entry = mockLeaderboardEntries.find((item) => item.id === id && item.is_approved);
      if (entry?.link_url) {
        targetUrl = entry.link_url;
        entry.click_count += 1;
      } else {
        const listing = mockListings.find((l) => l.id === id && l.is_approved);
        if (listing) {
          targetUrl = listing.url;
          listing.click_count += 1;
        }
      }
    }
  } catch (err) {
    console.error('Error tracking click redirect:', err);
  }

  // Ensure valid URL protocol
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  return NextResponse.redirect(targetUrl, 302);
}
