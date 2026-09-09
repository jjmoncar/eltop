'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { CurrencyCode } from '@/types/database';
import { Activity, Flame } from 'lucide-react';
import Link from 'next/link';

export default function ActividadPage() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Feed Transparente de Pujas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Actividad en Tiempo Real
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto">
            Monitorea los movimientos de puestos, adquisiciones de nuevos líderes y el volumen de subasta en toda América Latina.
          </p>
        </div>

        {/* Live Feed */}
        <LiveActivityFeed currency={currency} />

        {/* CTA banner */}
        <div className="p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm text-center space-y-4">
          <h3 className="text-lg font-bold text-stone-900">¿Listo para poner tu proyecto en la cima?</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Sé parte de la lista más codiciada de LATAM y capta miles de clics y prospectos calificados.
          </p>
          <div>
            <Link
              href="/saas/reclamar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>Pujar por un Puesto Ahora</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
