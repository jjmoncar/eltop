'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface PlatformStats {
  online: number;
  visits: number;
  clicks: number;
  bids: number;
  isLoading: boolean;
}

export function useLiveStats(): PlatformStats {
  const [stats, setStats] = useState<PlatformStats>({
    online: 1,
    visits: 1,
    clicks: 0,
    bids: 0,
    isLoading: true,
  });

  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    // 1. Generate or retrieve unique browser session ID
    let sessionId = '';
    let isNewVisit = false;
    try {
      sessionId = sessionStorage.getItem('eltop_session_id') || '';
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 12);
        sessionStorage.setItem('eltop_session_id', sessionId);
      }

      if (!sessionStorage.getItem('eltop_visit_recorded')) {
        isNewVisit = true;
        sessionStorage.setItem('eltop_visit_recorded', 'true');
      }
    } catch {
      sessionId = 'guest_' + Math.random().toString(36).substring(2, 8);
      isNewVisit = true;
    }
    sessionIdRef.current = sessionId;

    // 2. Report visit / heartbeat to backend
    const sendHeartbeat = async (firstVisit: boolean) => {
      try {
        const res = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            isNewVisit: firstVisit,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setStats((prev) => ({
            online: Math.max(1, typeof data.online === 'number' ? data.online : prev.online),
            visits: Math.max(1, typeof data.visits === 'number' ? data.visits : prev.visits),
            clicks: typeof data.clicks === 'number' ? data.clicks : prev.clicks,
            bids: typeof data.bids === 'number' ? data.bids : prev.bids,
            isLoading: false,
          }));
        }
      } catch (err) {
        console.error('Error recording stat heartbeat:', err);
      }
    };

    sendHeartbeat(isNewVisit);

    // Heartbeat every 45 seconds to keep online presence alive
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat(false);
    }, 45000);

    // 3. Supabase Realtime Presence channel for instantaneous multi-tab / multi-user counting
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase.channel('online_presence', {
        config: {
          presence: { key: sessionId },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          try {
            const state = channel.presenceState();
            const activeKeys = Object.keys(state);
            const count = activeKeys.length;
            if (count > 0) {
              setStats((prev) => ({
                ...prev,
                online: count,
                isLoading: false,
              }));
            }
          } catch (e) {
            console.error('Presence parse error:', e);
          }
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });
    } catch (err) {
      console.warn('Realtime presence unavailable, fallback to server heartbeat:', err);
    }

    return () => {
      clearInterval(heartbeatInterval);
      if (channel) {
        try {
          channel.unsubscribe();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return stats;
}
