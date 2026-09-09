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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-[#EAE6DF] text-xs font-semibold text-stone-700 transition shadow-xs"
      >
        <span className="text-sm">{current.flag}</span>
        <span className="font-bold text-[#E05A38]">{current.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#EAE6DF] shadow-xl z-50 overflow-hidden py-1">
            <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-stone-400 border-b border-[#F0ECE4] flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#E05A38]" />
              Moneda & País
            </div>
            {Object.values(CURRENCIES).map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  onCurrencyChange(curr.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition ${
                  selectedCurrency === curr.code
                    ? 'bg-[#FDF2EE] text-[#E05A38] font-bold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{curr.flag}</span>
                  <span>{curr.code}</span>
                </div>
                <span className="text-[11px] text-stone-400 truncate max-w-[120px]">
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
