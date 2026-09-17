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
  const sortedListings = [...listings].sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
  const minFloorUSD = 5;

  return (
    <div className="w-full space-y-4">
      {/* Category Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2EE] border border-[#FADCD3] flex items-center justify-center text-[#E05A38]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              {category.name_es}
              <span className="text-xs font-normal text-stone-500">({sortedListings.length} en el ranking)</span>
            </h2>
            <p className="text-xs text-stone-500 line-clamp-1">{category.description_es}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-stone-400 font-medium">Piso / Incremento</div>
            <div className="text-xs font-semibold text-stone-700">
              $${minFloorUSD} / +20% USD
            </div>
          </div>
          <Link
            href={`/${category.slug}/reclamar`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Pujar Puesto</span>
          </Link>
        </div>
      </div>

      {/* Leaderboard Entries */}
      {sortedListings.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-dashed border-[#EAE6DF] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FDF2EE] text-[#E05A38] flex items-center justify-center mx-auto">
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">¡Nadie ha reclamado este podio todavía!</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Sé el primero en aparecer en la cima de <strong>{category.name_es}</strong> y llévate todo el tráfico de LATAM por solo ${minFloorUSD} USD.
          </p>
          <div className="pt-2">
            <Link
              href={`/${category.slug}/reclamar`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white text-xs font-bold transition shadow-xs"
            >
              <Zap className="w-4 h-4 fill-white" />
              Reclamar #1 Ahora
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedListings.map((listing) => {
            const isFirst = listing.position === 1;
            const isSecond = listing.position === 2;
            const isThird = listing.position === 3;
            const nextPriceCents = listing.is_paid
              ? Math.round(listing.current_bid_cents * 1.2)
              : listing.position === 1
              ? 500
              : Math.round(listing.current_bid_cents * 1.2) || 500;

            return (
              <div
                key={listing.id}
                className={`relative group rounded-2xl p-4 sm:p-5 transition-all duration-200 bg-white ${
                  isFirst
                    ? 'border-2 border-[#3B82F6] shadow-sm hover:shadow-md'
                    : isSecond
                    ? 'border-2 border-[#0D9488] shadow-sm hover:shadow-md'
                    : isThird
                    ? 'border border-stone-300 shadow-sm hover:shadow-md'
                    : 'border border-[#EAE6DF] hover:border-stone-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Rank badge, Logo, Details */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="shrink-0 pt-0.5 sm:pt-0">
                      {isFirst ? (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2563EB] text-white flex flex-col items-center justify-center font-black shadow-xs">
                          <span className="text-[12px] leading-tight font-black">#1</span>
                        </div>
                      ) : isSecond ? (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0D9488] text-white flex flex-col items-center justify-center font-black shadow-xs">
                          <span className="text-[12px] leading-tight font-black">#2</span>
                        </div>
                      ) : isThird ? (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#18181B] text-white flex flex-col items-center justify-center font-black shadow-xs">
                          <span className="text-[12px] leading-tight font-black">#3</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xs border border-stone-200">
                          #{listing.position}
                        </div>
                      )}
                    </div>

                    {/* Logo */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-stone-100 border border-[#EAE6DF] overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {listing.logo_url ? (
                        <img
                          src={listing.logo_url}
                          alt={listing.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-black text-stone-800">
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
                          className="font-bold text-stone-900 text-sm sm:text-base hover:text-[#E05A38] transition flex items-center gap-1 group-hover:underline underline-offset-4"
                        >
                          <span>{listing.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#E05A38] transition" />
                        </a>

                        {isFirst && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            👑 Top 1 Líder
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-[11px] text-stone-500 px-2 py-0.5 rounded-full bg-stone-50 border border-stone-200">
                          <MousePointerClick className="w-3 h-3 text-emerald-600" />
                          <span>{listing.click_count?.toLocaleString()} clics</span>
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {listing.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Right: Pricing and Outbid Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0ECE4]">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                        Puja Actual
                      </div>
                      <div className={`text-sm sm:text-base font-black ${
                        isFirst ? 'text-[#1E40AF]' : isSecond ? 'text-[#0F766E]' : 'text-stone-900'
                      }`}>
                        {formatUSDOnly(listing.current_bid_cents)}
                      </div>
                      {currency !== 'USD' && (
                        <div className="text-[10px] font-medium text-stone-400">
                          ≈ {formatCents(listing.current_bid_cents, currency)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/l/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-3.5 py-1.5 rounded-full text-white text-xs font-bold transition flex items-center gap-1 shadow-xs ${
                          isFirst
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                            : isSecond
                            ? 'bg-[#0D9488] hover:bg-[#0F766E]'
                            : 'bg-stone-900 hover:bg-black'
                        }`}
                      >
                        <span>Visit</span>
                        <span className="text-[10px]">›</span>
                      </a>

                      <Link
                        href={`/${category.slug}/reclamar?targetPos=${listing.position}`}
                        className="px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#FDF2EE] text-stone-700 hover:text-[#E05A38] text-xs font-semibold border border-[#EAE6DF] hover:border-[#E05A38]/30 transition flex items-center gap-1 group/btn"
                        title={`Superar por $${formatUSDOnly(nextPriceCents)}`}
                      >
                        <Zap className="w-3 h-3 text-[#E05A38]" />
                        <span className="hidden sm:inline">Pujar</span>
                      </Link>
                    </div>
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
