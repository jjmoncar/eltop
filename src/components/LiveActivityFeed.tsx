'use client';

import React, { useEffect, useState } from 'react';
import { Bid, CurrencyCode } from '@/types/database';
import { formatUSDOnly, formatCents } from '@/lib/currencies';
import { Activity, RefreshCw, Flame, Clock } from 'lucide-react';

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
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Feed de Pujas en Vivo
            </h3>
            <p className="text-[11px] text-stone-500">
              Actualizado en tiempo real (cada 12s)
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecentActivity}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E05A38]' : ''}`} />
          <span className="hidden sm:inline">Refrescar</span>
        </button>
      </div>

      {/* Feed list */}
      <div className="space-y-2.5">
        {bids.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-[#EAE6DF]">
            No hay actividad reciente registrada todavía.
          </div>
        ) : (
          bids.map((bid) => {
            const catName = (bid.category as any)?.name_es || 'General';
            return (
              <div
                key={bid.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EAE6DF] hover:border-stone-300 transition flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 border border-[#EAE6DF] flex items-center justify-center shrink-0 text-stone-800 font-bold overflow-hidden">
                    {bid.logo_url ? (
                      <img src={bid.logo_url} alt={bid.target_name} className="w-full h-full object-cover" />
                    ) : (
                      <Flame className="w-4 h-4 text-[#E05A38]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {bid.target_name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-medium">
                        {catName}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Confirmado
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5 max-w-sm sm:max-w-md">
                      {bid.tagline}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black text-[#E05A38]">
                    {formatUSDOnly(bid.bid_amount_cents)}
                  </div>
                  {currency !== 'USD' && (
                    <div className="text-[10px] text-stone-500 font-medium">
                      ≈ {formatCents(bid.bid_amount_cents, currency)}
                    </div>
                  )}
                  <div className="text-[10px] text-stone-400 flex items-center justify-end gap-1 mt-0.5">
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
