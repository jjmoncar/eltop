'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Category, Listing, CurrencyCode } from '@/types/database';
import { Plus, Trophy, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [timeTab, setTimeTab] = useState<'all_time' | 'daily'>('all_time');
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
        console.error('Error fetching category data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const currentCategory = categories.find((c) => c.slug === categorySlug);
  const categoryListings = listings.filter(
    (l) => l.category_id === currentCategory?.id && (l.rank_type === timeTab || (!l.rank_type && timeTab === 'all_time'))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Category Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard Oficial</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {currentCategory ? currentCategory.name_es : categorySlug.toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {currentCategory?.description_es || 'Compite por el podio de tu industria en Latinoamérica.'}
            </p>
          </div>

          <Link
            href={`/${categorySlug}/reclamar`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Pujar por un Puesto</span>
          </Link>
        </div>

        {/* Time Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setTimeTab('all_time')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              timeTab === 'all_time'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Todo el Tiempo (All-Time)</span>
          </button>

          <button
            onClick={() => setTimeTab('daily')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              timeTab === 'daily'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Hoy (Daily)</span>
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-sm animate-pulse">
            Cargando ranking de {categorySlug}...
          </div>
        ) : currentCategory ? (
          <LeaderboardTable
            category={currentCategory}
            listings={categoryListings}
            currency={currency}
          />
        ) : (
          <div className="py-16 text-center text-slate-400">
            Categoría no encontrada.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
