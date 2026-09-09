'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { Category, Listing, CurrencyCode } from '@/types/database';
import { formatUSDOnly } from '@/lib/currencies';
import { useRouter } from 'next/navigation';
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
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [activeTimeTab, setActiveTimeTab] = useState<'all_time' | 'daily'>('all_time');
  const [isLoading, setIsLoading] = useState(true);

  // Quick claim input states
  const [quickUrl, setQuickUrl] = useState('');
  const [quickCategory, setQuickCategory] = useState('saas');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          setListings(data.listings || []);
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

  // Highest top #1 price or default floor
  const topListing = listings.find((l) => l.position === 1);
  const top1ClaimPrice = topListing
    ? Math.round(topListing.current_bid_cents / 100 + 5)
    : 25;

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

  // Top 3 featured listings
  const topRank1: Listing = listings.find((l) => l.position === 1) || {
    id: 'demo-1',
    name: 'see.io · see your idea live',
    tagline: 'Just describe your idea. AI turns it into a fully built, live website in minutes. Get your own...',
    url: 'https://see.io',
    current_bid_cents: 1700000,
    click_count: 47716,
    position: 1,
    category_id: categories[0]?.id || 'saas',
    rank_type: 'all_time',
    email: 'hello@see.io',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const topRank2: Listing = listings.find((l) => l.position === 2) || {
    id: 'demo-2',
    name: 'Tutti — Your all-in-one marketplace',
    tagline: 'Join campaigns from real brands and get paid on effective exposure and engagement...',
    url: 'https://tutti.so',
    current_bid_cents: 1600000,
    click_count: 11511,
    position: 2,
    category_id: categories[1]?.id || 'marketing',
    rank_type: 'all_time',
    email: 'team@tutti.so',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const topRank3: Listing = listings.find((l) => l.position === 3) || {
    id: 'demo-3',
    name: 'JONI | Your Personal AI Computer',
    tagline: 'JONI is your personal AI computer. Chat once and a team of AI agents and skills gets to work...',
    url: 'https://joni.ai',
    current_bid_cents: 1402800,
    click_count: 21586,
    position: 3,
    category_id: categories[2]?.id || 'cripto',
    rank_type: 'all_time',
    email: 'info@joni.ai',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleQuickClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCat = quickCategory || categories[0]?.slug || 'saas';
    const params = new URLSearchParams();
    if (quickUrl) params.set('url', quickUrl);
    router.push(`/${targetCat}/reclamar?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

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

          {/* Extra pills like in screenshot */}
          {categories.length <= 4 && (
            <>
              <button
                onClick={() => setActiveCategorySlug('saas')}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-white text-stone-700 hover:text-stone-950 border border-[#EAE6DF] hover:bg-stone-50 shrink-0"
              >
                Productivity
              </button>
              <button
                onClick={() => setActiveCategorySlug('cripto')}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-white text-stone-700 hover:text-stone-950 border border-[#EAE6DF] hover:bg-stone-50 shrink-0"
              >
                Agents
              </button>
            </>
          )}
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

      {/* Featured Top 3 Rank Cards (Matching the screenshot cards layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card #1 (Blue accent) */}
          <div className="relative rounded-3xl bg-white p-6 border-2 border-[#3B82F6] shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
            {/* Ribbon Badge #1 */}
            <div className="absolute top-0 left-6 bg-[#2563EB] text-white font-black text-xs px-2.5 pt-2 pb-3 rounded-b-md shadow-xs flex items-center justify-center">
              #1
            </div>

            {/* Price at top right */}
            <div className="text-right text-sm font-bold text-[#1E40AF]">
              ${formatUSDOnly(topRank1.current_bid_cents)}
            </div>

            {/* Center Logo */}
            <div className="my-6 flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-stone-900 flex items-center justify-center overflow-hidden shadow-inner text-white">
                {topRank1.logo_url ? (
                  <img src={topRank1.logo_url} alt={topRank1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-white" />
                    <span className="h-3 w-3 rounded-full bg-[#3B82F6]" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-6">
              <h3 className="font-bold text-stone-900 text-base leading-snug">
                {topRank1.name}
              </h3>
              <div className="text-xs text-[#2563EB] font-medium">
                {topRank1.url ? new URL(topRank1.url.startsWith('http') ? topRank1.url : `https://${topRank1.url}`).hostname : 'see.io'} · semana actual
              </div>
              <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                {topRank1.tagline}
              </p>
            </div>

            {/* Bottom: Tag & Visit */}
            <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between gap-2">
              <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                <span>🤖 {topRank1.click_count?.toLocaleString()} clics</span>
              </span>
              <a
                href={`/l/${topRank1.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <span>Visit</span>
                <span className="text-[10px]">›</span>
              </a>
            </div>
          </div>

          {/* Card #2 (Teal / Green accent) */}
          <div className="relative rounded-3xl bg-white p-6 border-2 border-[#0D9488] shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
            {/* Ribbon Badge #2 */}
            <div className="absolute top-0 left-6 bg-[#0D9488] text-white font-black text-xs px-2.5 pt-2 pb-3 rounded-b-md shadow-xs flex items-center justify-center">
              #2
            </div>

            {/* Price at top right */}
            <div className="text-right text-sm font-bold text-[#0F766E]">
              ${formatUSDOnly(topRank2.current_bid_cents)}
            </div>

            {/* Center Logo */}
            <div className="my-6 flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-[#0D9488] flex items-center justify-center overflow-hidden shadow-inner text-white font-black text-2xl">
                {topRank2.logo_url ? (
                  <img src={topRank2.logo_url} alt={topRank2.name} className="w-full h-full object-cover" />
                ) : (
                  <span>Tu</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-6">
              <h3 className="font-bold text-stone-900 text-base leading-snug">
                {topRank2.name}
              </h3>
              <div className="text-xs text-[#0D9488] font-medium">
                {topRank2.url ? new URL(topRank2.url.startsWith('http') ? topRank2.url : `https://${topRank2.url}`).hostname : 'tutti.so'} · semana actual
              </div>
              <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                {topRank2.tagline}
              </p>
            </div>

            {/* Bottom: Tag & Visit */}
            <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between gap-2">
              <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                <span>📢 {topRank2.click_count?.toLocaleString()} clics</span>
              </span>
              <a
                href={`/l/${topRank2.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <span>Visit</span>
                <span className="text-[10px]">›</span>
              </a>
            </div>
          </div>

          {/* Card #3 (Charcoal / Black accent) */}
          <div className="relative rounded-3xl bg-white p-6 border border-[#EAE6DF] shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
            {/* Ribbon Badge #3 */}
            <div className="absolute top-0 left-6 bg-[#18181B] text-white font-black text-xs px-2.5 pt-2 pb-3 rounded-b-md shadow-xs flex items-center justify-center">
              #3
            </div>

            {/* Price at top right */}
            <div className="text-right text-sm font-bold text-stone-900">
              ${formatUSDOnly(topRank3.current_bid_cents)}
            </div>

            {/* Center Logo */}
            <div className="my-6 flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-stone-100 border border-[#EAE6DF] flex items-center justify-center overflow-hidden shadow-xs text-stone-900 font-bold text-xl">
                {topRank3.logo_url ? (
                  <img src={topRank3.logo_url} alt={topRank3.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐙</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-6">
              <h3 className="font-bold text-stone-900 text-base leading-snug">
                {topRank3.name}
              </h3>
              <div className="text-xs text-stone-500 font-medium">
                {topRank3.url ? new URL(topRank3.url.startsWith('http') ? topRank3.url : `https://${topRank3.url}`).hostname : 'joni.ai'} · semana actual
              </div>
              <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                {topRank3.tagline}
              </p>
            </div>

            {/* Bottom: Tag & Visit */}
            <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between gap-2">
              <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                <span>🤖 {topRank3.click_count?.toLocaleString()} clics</span>
              </span>
              <a
                href={`/l/${topRank3.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <span>Visit</span>
                <span className="text-[10px]">›</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Leaderboard Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
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
                1. <strong>Supera al puesto:</strong> Para subir al puesto #1 o a cualquier otro lugar, paga la puja actual + el incremento ($5 USD).
              </p>
              <p className="text-xs text-stone-600 leading-relaxed">
                2. <strong>Tráfico garantizado:</strong> Recibes un enlace exclusivo <code>/l/[id]</code> que redirige directamente a tu web contando cada clic.
              </p>
              <p className="text-xs text-stone-600 leading-relaxed">
                3. <strong>Alertas de Outbid:</strong> Si alguien te supera, te avisamos por correo al instante.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
