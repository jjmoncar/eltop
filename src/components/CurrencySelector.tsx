'use client';

import React, { useState } from 'react';
import { CURRENCIES } from '@/lib/currencies';
import { CurrencyCode } from '@/types/database';
import { ChevronDown, Globe } from 'lucide-react';

interface Props {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
}

export function CurrencySelector({ selectedCurrency, onCurrencyChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const current = CURRENCIES[selectedCurrency] || CURRENCIES.USD;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition shadow-inner backdrop-blur-sm"
      >
        <span className="text-sm">{current.flag}</span>
        <span className="font-semibold text-amber-400">{current.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl z-50 backdrop-blur-md overflow-hidden py-1">
            <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-800 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-amber-400" />
              Moneda & País
            </div>
            {Object.values(CURRENCIES).map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  onCurrencyChange(curr.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition ${
                  selectedCurrency === curr.code
                    ? 'bg-amber-500/15 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{curr.flag}</span>
                  <span>{curr.code}</span>
                </div>
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                  {curr.symbol} ({curr.name.split('(')[0]})
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
