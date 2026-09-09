'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CurrencySelector } from './CurrencySelector';
import { CurrencyCode, Category } from '@/types/database';
import { Trophy, Activity, Plus, Search, Sparkles } from 'lucide-react';

interface Props {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  categories?: Category[];
}

export function Navbar({ currency, onCurrencyChange, categories }: Props) {
  const pathname = usePathname();
  const [liveCategories, setLiveCategories] = React.useState<Category[]>(categories || []);

  React.useEffect(() => {
    if (categories && categories.length > 0) {
      setLiveCategories(categories);
    } else {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          if (data?.categories && data.categories.length > 0) {
            setLiveCategories(data.categories);
          }
        })
        .catch((err) => console.error('Error fetching categories for navbar:', err));
    }
  }, [categories]);

  const navLinks = [
    { href: '/', label: 'Explorar' },
    { href: '/actividad', label: 'Actividad' },
  ];

  const primaryClaimSlug = liveCategories[0]?.slug || 'saas';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE6DF] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Live Stats */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            {/* Logo Mark with outbid-inspired warm style */}
            <div className="flex flex-col gap-[3px] justify-center items-start w-5">
              <span className="w-5 h-[3.5px] bg-[#E05A38] rounded-full" />
              <span className="w-4 h-[3.5px] bg-stone-900 rounded-full" />
              <span className="w-5 h-[3.5px] bg-stone-900 rounded-full" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-stone-900 group-hover:text-[#E05A38] transition">
              eltop<span className="text-[#E05A38]">.lat</span>
            </span>
          </Link>

          {/* Online stats badge matching screenshot */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-stone-500 bg-white px-3 py-1 rounded-full border border-[#EAE6DF] shadow-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              140 online
            </span>
            <span className="text-stone-300">·</span>
            <span>1,475,684 visitas</span>
            <span className="text-stone-300">·</span>
            <Link href="/actividad" className="text-stone-700 hover:text-[#E05A38] font-medium flex items-center gap-0.5 transition">
              stats →
            </Link>
          </div>
        </div>

        {/* Center / Right Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-stone-600">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-stone-950 ${
                  isActive ? 'text-[#E05A38] font-semibold' : ''
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencySelector
            selectedCurrency={currency}
            onCurrencyChange={onCurrencyChange}
          />

          <Link
            href={`/${primaryClaimSlug}/reclamar`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white text-xs font-bold shadow-sm shadow-[#E05A38]/25 hover:scale-[1.02] active:scale-[0.98] transition transform"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Pujar Puesto</span>
          </Link>
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="md:hidden flex items-center justify-center gap-3 px-4 py-2 border-t border-[#EAE6DF] bg-[#FAF8F5]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition ${
                isActive
                  ? 'bg-[#E05A38] text-white font-bold'
                  : 'bg-white text-stone-700 border border-[#EAE6DF]'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
