import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, mockListings, mockBids } from '@/lib/supabase/admin';

// In-memory active sessions tracker for online count (with 3-minute TTL)
const activeSessions = new Map<string, number>();
const SESSION_TTL_MS = 3 * 60 * 1000;

function cleanupOldSessions() {
  const now = Date.now();
  for (const [id, lastSeen] of activeSessions.entries()) {
    if (now - lastSeen > SESSION_TTL_MS) {
      activeSessions.delete(id);
    }
  }
}

function getOnlineCount(): number {
  cleanupOldSessions();
  return Math.max(1, activeSessions.size);
}

export async function GET() {
  try {
    const online = getOnlineCount();

    if (isSupabaseConfigured && supabaseAdmin) {
      // Get visits from settings
      const { data: settingsData } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'site_stats')
        .maybeSingle();

      const visits = Number(settingsData?.value?.total_visits) || 1;

      // Get total clicks
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('click_count');
      const totalClicks = listings?.reduce((acc, l) => acc + (l.click_count || 0), 0) ?? 0;

      // Get total bids
      const { count: totalBids } = await supabaseAdmin
        .from('bids')
        .select('*', { count: 'exact', head: true });

      return NextResponse.json({
        online,
        visits,
        clicks: totalClicks,
        bids: totalBids ?? 0,
      });
    }

    // Fallback if supabase not connected
    const totalClicks = mockListings.reduce((acc, l) => acc + (l.click_count || 0), 0);
    return NextResponse.json({
      online,
      visits: 1,
      clicks: totalClicks,
      bids: mockBids.length,
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json({
      online: 1,
      visits: 1,
      clicks: 0,
      bids: 0,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim() : 'guest_' + Math.random().toString(36).slice(2, 9);
    const isNewVisit = Boolean(body.isNewVisit);

    // Record session heartbeat for online count
    activeSessions.set(sessionId, Date.now());
    cleanupOldSessions();
    const online = Math.max(1, activeSessions.size);

    let visits = 1;
    let totalClicks = 0;
    let totalBids = 0;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Get current site_stats from settings
      const { data: settingsData } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'site_stats')
        .maybeSingle();

      let currentVisits = Number(settingsData?.value?.total_visits);
      if (isNaN(currentVisits) || currentVisits < 1) {
        currentVisits = 1;
      }

      if (isNewVisit) {
        currentVisits += 1;
        await supabaseAdmin.from('settings').upsert({
          key: 'site_stats',
          value: {
            total_visits: currentVisits,
            last_visit_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        });
      }

      visits = currentVisits;

      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('click_count');
      totalClicks = listings?.reduce((acc, l) => acc + (l.click_count || 0), 0) ?? 0;

      const { count: bidsCount } = await supabaseAdmin
        .from('bids')
        .select('*', { count: 'exact', head: true });
      totalBids = bidsCount ?? 0;
    } else {
      totalClicks = mockListings.reduce((acc, l) => acc + (l.click_count || 0), 0);
      totalBids = mockBids.length;
    }

    return NextResponse.json({
      online,
      visits,
      clicks: totalClicks,
      bids: totalBids,
    });
  } catch (error) {
    console.error('Error recording stat heartbeat:', error);
    return NextResponse.json({
      online: 1,
      visits: 1,
      clicks: 0,
      bids: 0,
    });
  }
}
