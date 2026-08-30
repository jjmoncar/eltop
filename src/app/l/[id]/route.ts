import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockListings, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let targetUrl = 'https://eltop.lat';

  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Fetch listing destination
      const { data: listing } = await supabaseAdmin
        .from('listings')
        .select('url')
        .eq('id', id)
        .single();

      if (listing?.url) {
        targetUrl = listing.url;

        // 2. Insert click event asynchronously (fire-and-forget or awaited)
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || '';

        // RPC atomic counter
        supabaseAdmin.rpc('increment_click_count', { target_listing_id: id }).then();

        // Click event log
        supabaseAdmin.from('click_events').insert({
          listing_id: id,
          ip_hash: Buffer.from(ip).toString('base64').slice(0, 16),
          user_agent: userAgent.slice(0, 200),
          referer: referer.slice(0, 200),
        }).then();
      }
    } else {
      // Mock mode tracking
      const listing = mockListings.find((l) => l.id === id);
      if (listing) {
        targetUrl = listing.url;
        listing.click_count += 1;
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
