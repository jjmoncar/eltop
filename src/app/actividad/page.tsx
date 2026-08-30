'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { CurrencyCode } from '@/types/database';
import { Activity, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ActividadPage() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Feed Transparente de Pujas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Actividad en Tiempo Real
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Monitorea los movimientos de puestos, adquisiciones de nuevos líderes y el volumen de subasta en toda América Latina.
          </p>
        </div>

        {/* Live Feed */}
        <LiveActivityFeed currency={currency} />

        {/* CTA banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 text-center space-y-4">
          <h3 className="text-lg font-bold text-white">¿Listo para poner tu proyecto en la cima?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Sé parte de la lista más codiciada de LATAM y capta miles de clics y prospectos calificados.
          </p>
          <div>
            <Link
              href="/saas/reclamar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>Pujar por un Puesto Ahora</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
