'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CurrencySelector } from './CurrencySelector';
import { CurrencyCode } from '@/types/database';
import { Flame, Trophy, Activity, Zap, PlusCircle } from 'lucide-react';

interface Props {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
}

export function Navbar({ currency, onCurrencyChange }: Props) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Explorar Todo', icon: Trophy },
    { href: '/saas', label: 'SaaS', badge: 'Popular' },
    { href: '/cripto', label: 'Cripto', badge: 'Hot' },
    { href: '/ecommerce', label: 'E-commerce' },
    { href: '/marketing', label: 'Marketing' },
    { href: '/actividad', label: 'En Vivo', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition transform">
            <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-amber-300 transition">
                eltop<span className="text-amber-400">.lat</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                LATAM
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium leading-none">
              El leaderboard de subasta
            </span>
          </div>
        </Link>

        {/* Navigation Categories */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {link.label}
                {link.badge && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencySelector
            selectedCurrency={currency}
            onCurrencyChange={onCurrencyChange}
          />

          <Link
            href="/saas/reclamar"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition transform"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Pujar Puesto</span>
          </Link>
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
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
