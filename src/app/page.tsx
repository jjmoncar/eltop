'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { AdsterraLeftBanner } from '@/components/AdsterraLeftBanner';
import { Category, Listing, CurrencyCode } from '@/types/database';
import { formatUSDOnly } from '@/lib/currencies';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  Globe,
  ChevronDown,
  Layers,
  Flame,
  Zap,
  TrendingUp,
  Cpu,
  ShoppingBag,
  Shield,
  Code,
  Heart,
  Compass,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [activeTimeTab, setActiveTimeTab] = useState<'all_time' | 'daily'>('all_time');
  const [isLoading, setIsLoading] = useState(true);

  // Quick claim input states
  const [quickUrl, setQuickUrl] = useState('');
  const [quickCategory, setQuickCategory] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const fetchedCats = data.categories || [];
          setCategories(fetchedCats);
          setListings(data.listings || []);
          if (fetchedCats.length > 0) {
            setQuickCategory((prev) => prev || fetchedCats[0].slug);
          }
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalClicks = listings.reduce((acc, l) => acc + (l.click_count || 0), 0);
  const totalVolumeUSD = listings.reduce((acc, l) => acc + l.current_bid_cents, 0) / 100;

  // Highest top #1 price or default floor from categories
  const topListing = listings.find((l) => l.position === 1);
  const minFloorUSD = 5;
  const top1ClaimPrice = topListing
    ? Math.round((topListing.current_bid_cents / 100) * 1.2 * 100) / 100
    : minFloorUSD;

  const filteredCategories =
    activeCategorySlug === 'all'
      ? categories
      : categories.filter((c) => c.slug === activeCategorySlug);

  // All listings filtered by category
  const filteredListings =
    activeCategorySlug === 'all'
      ? listings
      : listings.filter((l) => {
          const cat = categories.find((c) => c.slug === activeCategorySlug);
          return l.category_id === cat?.id;
        });

  // Top 3 featured listings (only actual listings saved in database)
  const topListings = filteredListings
    .filter((l) => l.is_approved)
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3);

  const handleQuickClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCat = quickCategory || categories[0]?.slug || 'saas';
    const params = new URLSearchParams();
    if (quickUrl) params.set('url', quickUrl);
    router.push(`/${locale}/${targetCat}/reclamar?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} categories={categories} />

      {/* Category Pills Bar (Matching the screenshot top row) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {/* All button */}
          <button
            onClick={() => setActiveCategorySlug('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              activeCategorySlug === 'all'
                ? 'bg-[#E05A38] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:text-stone-950 border border-[#EAE6DF] hover:bg-stone-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All</span>
          </button>

          {/* Dynamic / Standard Category Pills */}
          {categories.map((cat) => {
            const isSelected = activeCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategorySlug(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#E05A38] text-white font-bold shadow-xs'
                    : 'bg-white text-stone-700 hover:text-stone-950 border border-[#EAE6DF] hover:bg-stone-50'
                }`}
              >
                <span>{cat.name_es}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Hero Section: Tab Switcher + "Claim #1 for $X" + Quick Input Bar */}
      <section className="relative pt-6 pb-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 w-full">
        {/* Time switcher tab (All-time vs Today) */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTimeTab('all_time')}
            className={`flex items-center gap-1.5 pb-1 transition relative ${
              activeTimeTab === 'all_time'
                ? 'text-[#E05A38] border-b-2 border-[#E05A38] font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#E05A38]" />
            <span>All-time</span>
          </button>
          <button
            onClick={() => setActiveTimeTab('daily')}
            className={`flex items-center gap-1.5 pb-1 transition relative ${
              activeTimeTab === 'daily'
                ? 'text-[#E05A38] border-b-2 border-[#E05A38] font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#E05A38]" />
            <span>Today</span>
          </button>
        </div>

        {/* Hero Title: Claim #1 for $X */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <span>Claim #1 for</span>
            <div className="inline-flex items-center gap-1.5 text-[#E05A38]">
              <span className="text-lg sm:text-2xl text-stone-300 font-normal">−</span>
              <span>${top1ClaimPrice.toLocaleString()}</span>
              <span className="text-lg sm:text-2xl text-stone-300 font-normal">+</span>
            </div>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto">
            El podio de productos y startups más visible de América Latina. Pujas en vivo con tráfico garantizado.
          </p>
        </div>

        {/* Quick Claim Bar (Matching the screenshot input container) */}
        <form
          onSubmit={handleQuickClaim}
          className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl sm:rounded-full bg-white border border-[#EAE6DF] shadow-sm hover:border-[#D8D2C6] transition"
        >
          {/* URL Input */}
          <div className="flex items-center gap-2.5 px-4 py-2 flex-1 w-full text-stone-900">
            <Globe className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Your product URL or @handle"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none placeholder-stone-400 text-stone-800"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-auto px-3 py-1.5 border-t sm:border-t-0 sm:border-l border-[#F0ECE4]">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              aria-label="Seleccionar categoría"
              className="w-full sm:w-auto text-xs font-medium text-stone-700 bg-transparent border-0 focus:outline-none cursor-pointer pr-4 py-1"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name_es}
                </option>
              ))}
            </select>
          </div>

          {/* Claim Rank Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#E8A28E] hover:bg-[#E05A38] text-white text-xs sm:text-sm font-bold shadow-xs transition shrink-0"
          >
            Claim rank
          </button>
        </form>
      </section>

      {/* Featured Top Rank Cards (Rendered ONLY if real listings exist in database) */}
      {topListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topListings.map((item, idx) => {
              const pos = item.position || idx + 1;
              const isFirst = pos === 1;
              const isSecond = pos === 2;
              const borderColor = isFirst
                ? 'border-[#3B82F6]'
                : isSecond
                ? 'border-[#0D9488]'
                : 'border-stone-300';
              const badgeBg = isFirst
                ? 'bg-[#2563EB]'
                : isSecond
                ? 'bg-[#0D9488]'
                : 'bg-stone-900';
              const textColor = isFirst
                ? 'text-[#1E40AF]'
                : isSecond
                ? 'text-[#0F766E]'
                : 'text-stone-900';
              const btnBg = isFirst
                ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                : isSecond
                ? 'bg-[#0D9488] hover:bg-[#0F766E]'
                : 'bg-stone-900 hover:bg-black';

              let hostname = '';
              try {
                hostname = new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`).hostname;
              } catch {
                hostname = item.url;
              }

              return (
                <div
                  key={item.id}
                  className={`relative rounded-3xl bg-white p-6 border-2 ${borderColor} shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden`}
                >
                  {/* Ribbon Badge */}
                  <div className={`absolute top-0 left-6 ${badgeBg} text-white font-black text-xs px-2.5 pt-2 pb-3 rounded-b-md shadow-xs flex items-center justify-center`}>
                    #{pos}
                  </div>

                  {/* Price at top right */}
                  <div className={`text-right text-sm font-bold ${textColor}`}>
                    ${formatUSDOnly(item.current_bid_cents)}
                  </div>

                  {/* Center Logo */}
                  <div className="my-6 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-stone-100 border border-[#EAE6DF] flex items-center justify-center overflow-hidden shadow-inner text-stone-800 font-bold">
                      {item.logo_url ? (
                        <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Flame className="w-8 h-8 text-[#E05A38]" />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6">
                    <h3 className="font-bold text-stone-900 text-base leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-xs text-stone-500 font-medium">
                      {hostname}
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                      {item.tagline}
                    </p>
                  </div>

                  {/* Bottom: Clics & Visit */}
                  <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                      <span>🚀 {item.click_count?.toLocaleString() || 0} clics</span>
                    </span>
                    <a
                      href={`/l/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-1.5 rounded-full ${btnBg} text-white text-xs font-bold transition flex items-center gap-1 shadow-xs`}
                    >
                      <span>Visitar</span>
                      <span className="text-[10px]">›</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Leaderboard Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        <div className="flex items-start gap-8">
          <AdsterraLeftBanner />

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Leaderboard Tables */}
              <div className="lg:col-span-8 space-y-8">
                {isLoading ? (
                  <div className="py-20 text-center text-stone-400 text-sm animate-pulse">
                    Cargando rankings de LATAM...
                  </div>
                ) : (
                  filteredCategories.map((category) => {
                    const catListings = listings.filter(
                      (l) => l.category_id === category.id && (l.rank_type === activeTimeTab || (!l.rank_type && activeTimeTab === 'all_time'))
                    );
                    return (
                      <LeaderboardTable
                        key={category.id}
                        category={category}
                        listings={catListings}
                        currency={currency}
                      />
                    );
                  })
                )}
              </div>

              {/* Sidebar Activity & Rules */}
              <div className="lg:col-span-4 space-y-6">
                <LiveActivityFeed currency={currency} />

                {/* Subasta 101 Card */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm space-y-3">
                  <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E05A38]" />
                    Mecánica de Subasta
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    1. <strong>Supera al puesto:</strong> Para subir al puesto #1 o a cualquier otro lugar, paga la puja actual + el incremento ($1 USD).
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    2. <strong>Tráfico garantizado:</strong> Recibes un enlace exclusivo <code>/l/[id]</code> que redirige directamente a tu web contando cada clic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer categories={categories} />
    </div>
  );
}
