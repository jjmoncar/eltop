'use client';

import React from 'react';
import Link from 'next/link';
import { Listing, Category, CurrencyCode } from '@/types/database';
import { formatCents, formatUSDOnly } from '@/lib/currencies';
import { Trophy, ExternalLink, MousePointerClick, Zap, Crown, Award, ArrowUpRight, Plus } from 'lucide-react';

interface Props {
  category: Category;
  listings: Listing[];
  currency: CurrencyCode;
}

export function LeaderboardTable({ category, listings, currency }: Props) {
  const sortedListings = [...listings].sort((a, b) => a.position - b.position);
  const minFloorUSD = (category.min_floor_cents || 2000) / 100;
  const minIncrementUSD = (category.min_bid_increment_cents || 500) / 100;

  return (
    <div className="w-full space-y-4">
      {/* Category Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {category.name_es}
              <span className="text-xs font-normal text-slate-400">({sortedListings.length} en el ranking)</span>
            </h2>
            <p className="text-xs text-slate-400 line-clamp-1">{category.description_es}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400 font-medium">Piso / Incremento</div>
            <div className="text-xs font-semibold text-slate-300">
              ${minFloorUSD} / +${minIncrementUSD} USD
            </div>
          </div>
          <Link
            href={`/${category.slug}/reclamar`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Pujar Puesto</span>
          </Link>
        </div>
      </div>

      {/* Leaderboard Entries */}
      {sortedListings.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">¡Nadie ha reclamado este podio todavía!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Sé el primero en aparecer en la cima de <strong>{category.name_es}</strong> y llévate todo el tráfico de LATAM por solo ${minFloorUSD} USD.
          </p>
          <div className="pt-2">
            <Link
              href={`/${category.slug}/reclamar`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Reclamar #1 Ahora
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedListings.map((listing) => {
            const isFirst = listing.position === 1;
            const isSecond = listing.position === 2;
            const isThird = listing.position === 3;
            const nextPriceCents = listing.current_bid_cents + (category.min_bid_increment_cents || 500);

            return (
              <div
                key={listing.id}
                className={`relative group rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/90 border border-amber-500/40 shadow-xl shadow-amber-500/5 hover:border-amber-400/70'
                    : isSecond
                    ? 'bg-slate-900/80 border border-slate-700/80 hover:border-slate-500 shadow-md'
                    : isThird
                    ? 'bg-slate-900/70 border border-amber-900/40 hover:border-amber-700/50 shadow-md'
                    : 'bg-slate-950/60 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Rank badge, Logo, Details */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="shrink-0 pt-0.5 sm:pt-0">
                      {isFirst ? (
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/30">
                          <Crown className="w-4 h-4 fill-slate-950" />
                          <span className="text-[11px] leading-tight">#1</span>
                        </div>
                      ) : isSecond ? (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-700 text-slate-200 flex flex-col items-center justify-center font-bold border border-slate-600">
                          <Award className="w-3.5 h-3.5" />
                          <span className="text-[10px] leading-tight">#2</span>
                        </div>
                      ) : isThird ? (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-900/60 text-amber-300 flex flex-col items-center justify-center font-bold border border-amber-700/50">
                          <Award className="w-3.5 h-3.5" />
                          <span className="text-[10px] leading-tight">#3</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 text-slate-400 flex items-center justify-center font-semibold text-xs border border-slate-800">
                          #{listing.position}
                        </div>
                      )}
                    </div>

                    {/* Logo */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                      {listing.logo_url ? (
                        <img
                          src={listing.logo_url}
                          alt={listing.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-bold text-amber-400">
                          {listing.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/l/${listing.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-white text-sm sm:text-base hover:text-amber-400 transition flex items-center gap-1 group-hover:underline underline-offset-4"
                        >
                          <span>{listing.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition" />
                        </a>

                        {isFirst && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            👑 Top 1 Líder
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60">
                          <MousePointerClick className="w-3 h-3 text-emerald-400" />
                          <span>{listing.click_count} clics</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {listing.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Right: Pricing and Outbid Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Puja Actual
                      </div>
                      <div className="text-sm sm:text-base font-black text-amber-400">
                        {formatUSDOnly(listing.current_bid_cents)}
                      </div>
                      {currency !== 'USD' && (
                        <div className="text-[10px] font-medium text-slate-400">
                          ≈ {formatCents(listing.current_bid_cents, currency)}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/${category.slug}/reclamar?targetPos=${listing.position}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold border border-slate-700 hover:border-amber-400 transition flex items-center gap-1.5 shadow-sm group/btn"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 group-hover/btn:text-slate-950 group-hover/btn:fill-slate-950 transition" />
                      <span>Superar por ${formatUSDOnly(nextPriceCents)}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
