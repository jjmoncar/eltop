'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { CurrencyCode } from '@/types/database';
import { Activity, Flame, Users, Eye, MousePointerClick, Award } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveStats } from '@/hooks/useLiveStats';

export default function ActividadPage() {
  const locale = usePathname().split('/')[1] || 'es';
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const stats = useLiveStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Métricas & Feed Transparente</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Actividad & Estadísticas en Vivo
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto">
            Monitorea el tráfico en tiempo real, movimientos de puestos, adquisiciones de nuevos líderes y el volumen de subasta en toda América Latina.
          </p>
        </div>

        {/* Real Platform Statistics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Online Ahora</span>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {stats.online}
            </div>
            <p className="text-[10px] text-stone-400">usuarios activos en vivo</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              <span>Visitas Totales</span>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {stats.visits.toLocaleString()}
            </div>
            <p className="text-[10px] text-stone-400">visitas a la plataforma</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <MousePointerClick className="w-3.5 h-3.5 text-[#E05A38]" />
              <span>Clics a Proyectos</span>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {stats.clicks.toLocaleString()}
            </div>
            <p className="text-[10px] text-stone-400">redirecciones verificadas</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Pujas Totales</span>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {stats.bids.toLocaleString()}
            </div>
            <p className="text-[10px] text-stone-400">ofertas en la subasta</p>
          </div>
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
              href={`/${locale}/saas/reclamar`}
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
