'use client';

import React, { useEffect, useState } from 'react';
import { Bid, CurrencyCode } from '@/types/database';
import { formatUSDOnly, formatCents } from '@/lib/currencies';
import { Activity, Zap, ExternalLink, RefreshCw, Flame, Clock } from 'lucide-react';

interface Props {
  initialBids?: Bid[];
  currency: CurrencyCode;
}

export function LiveActivityFeed({ initialBids = [], currency }: Props) {
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchRecentActivity = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/activity');
      if (res.ok) {
        const data = await res.json();
        if (data.bids) {
          setBids(data.bids);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.error('Error fetching live activity:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Polling every 12 seconds
    const interval = setInterval(() => {
      fetchRecentActivity();
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  function timeAgo(dateString: string) {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }

  return (
    <div className="w-full space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Feed de Pujas en Vivo
            </h3>
            <p className="text-[11px] text-slate-400">
              Actualizado en tiempo real (cada 12s)
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecentActivity}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span className="hidden sm:inline">Refrescar</span>
        </button>
      </div>

      {/* Feed list */}
      <div className="space-y-2.5">
        {bids.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
            No hay actividad reciente registrada todavía.
          </div>
        ) : (
          bids.map((bid) => {
            const catName = (bid.category as any)?.name_es || 'General';
            return (
              <div
                key={bid.id}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-amber-400 font-bold overflow-hidden">
                    {bid.logo_url ? (
                      <img src={bid.logo_url} alt={bid.target_name} className="w-full h-full object-cover" />
                    ) : (
                      <Flame className="w-4 h-4 text-amber-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs sm:text-sm truncate">
                        {bid.target_name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {catName}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Pago Confirmado
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-sm sm:max-w-md">
                      {bid.tagline}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-extrabold text-amber-400">
                    {formatUSDOnly(bid.bid_amount_cents)}
                  </div>
                  {currency !== 'USD' && (
                    <div className="text-[10px] text-slate-400">
                      ≈ {formatCents(bid.bid_amount_cents, currency)}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{timeAgo(bid.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
