'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ClaimForm } from '@/components/ClaimForm';
import { FreeRegistrationForm } from '@/components/FreeRegistrationForm';
import { Category, Listing, CurrencyCode } from '@/types/database';

function ReclamarContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categorySlug = params.category as string;
  const targetPosParam = searchParams.get('targetPos') ? parseInt(searchParams.get('targetPos')!, 10) : undefined;

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
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
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const currentCategory = categories.find((c) => c.slug === categorySlug) || categories[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} categories={categories} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {isLoading || !currentCategory ? (
          <div className="py-24 text-center text-stone-400 text-sm animate-pulse">
            Cargando subasta...
          </div>
        ) : (
          <div className="space-y-8">
            <FreeRegistrationForm categories={categories} currentCategory={currentCategory} />
            <ClaimForm
              categories={categories}
              currentCategory={currentCategory}
              listings={listings}
              targetPosParam={targetPosParam}
              currency={currency}
            />
          </div>
        )}
      </main>

      <Footer categories={categories} />
    </div>
  );
}

export default function ReclamarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <ReclamarContent />
    </Suspense>
  );
}
