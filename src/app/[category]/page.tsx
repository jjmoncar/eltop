'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Category, Listing, CurrencyCode } from '@/types/database';
import { Plus, Trophy, Calendar } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Category Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2EE] border border-[#FADCD3] text-[#E05A38] text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard Oficial</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {currentCategory ? currentCategory.name_es : categorySlug.toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
              {currentCategory?.description_es || 'Compite por el podio de tu industria en Latinoamérica.'}
            </p>
          </div>

          <Link
            href={`/${categorySlug}/reclamar`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Pujar por un Puesto</span>
          </Link>
        </div>

        {/* Time Tabs */}
        <div className="flex items-center gap-3 border-b border-[#EAE6DF] pb-3 text-xs font-semibold">
          <button
            onClick={() => setTimeTab('all_time')}
            className={`flex items-center gap-1.5 pb-1 transition relative ${
              timeTab === 'all_time'
                ? 'text-[#E05A38] border-b-2 border-[#E05A38] font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#E05A38]" />
            <span>Todo el Tiempo (All-Time)</span>
          </button>

          <button
            onClick={() => setTimeTab('daily')}
            className={`flex items-center gap-1.5 pb-1 transition relative ${
              timeTab === 'daily'
                ? 'text-[#E05A38] border-b-2 border-[#E05A38] font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#E05A38]" />
            <span>Hoy (Daily)</span>
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-sm animate-pulse">
            Cargando ranking de {categorySlug}...
          </div>
        ) : currentCategory ? (
          <LeaderboardTable
            category={currentCategory}
            listings={categoryListings}
            currency={currency}
          />
        ) : (
          <div className="py-16 text-center text-stone-500">
            Categoría no encontrada.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
