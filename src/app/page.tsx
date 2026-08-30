'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { Category, Listing, Bid, CurrencyCode } from '@/types/database';
import { formatUSDOnly } from '@/lib/currencies';
import {
  Flame,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
  MousePointerClick,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredCategories =
    activeCategorySlug === 'all'
      ? categories
      : categories.filter((c) => c.slug === activeCategorySlug);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden border-b border-slate-900">
        {/* Background glow halos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-amber-400 shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>El escaparate de subastas #1 en LATAM</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">🇦🇷 🇧🇷 🇨🇴 🇨🇱 🇵🇪 🇻🇪</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Lidera el ranking de tu industria en{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              América Latina
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Compra tu puesto en el leaderboard mediante subasta continua. Consigue visibilidad ininterrumpida, backlinks dofollow y tráfico directo de fundadores y clientes.
          </p>

          {/* Metrics Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">Proyectos Activos</div>
              <div className="text-lg font-black text-white">{listings.length} proyectos</div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">Clics Distribuidos</div>
              <div className="text-lg font-black text-emerald-400 flex items-center gap-1">
                <MousePointerClick className="w-4 h-4" />
                {totalClicks.toLocaleString()}
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">Volumen en Subasta</div>
              <div className="text-lg font-black text-amber-400">
                ${totalVolumeUSD.toLocaleString()} USD
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/saas/reclamar"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition transform flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Pujar por un Puesto
            </Link>
            <Link
              href="/actividad"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2"
            >
              <span>Ver Feed de Actividad</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setActiveCategorySlug('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeCategorySlug === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas las Categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategorySlug(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeCategorySlug === cat.slug
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name_es}
            </button>
          ))}
        </div>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Leaderboard Tables */}
          <div className="lg:col-span-8 space-y-10">
            {isLoading ? (
              <div className="py-20 text-center text-slate-500 text-sm animate-pulse">
                Cargando leaderboards de LATAM...
              </div>
            ) : (
              filteredCategories.map((category) => {
                const catListings = listings.filter(
                  (l) => l.category_id === category.id && l.rank_type === 'all_time'
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
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Mecánica de Subasta
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                1. <strong>Supera al puesto:</strong> Para subir al puesto #1 o a cualquier otro lugar, paga la puja actual + el incremento ($5 USD).
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                2. <strong>Tráfico garantizado:</strong> Recibes un enlace exclusivo <code>/l/[id]</code> que redirige directamente a tu web contando cada clic.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
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
