import React from 'react';
import Link from 'next/link';
import { Flame, Shield, Zap, TrendingUp, HelpCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                eltop<span className="text-amber-400">.lat</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              El leaderboard de pago tipo subasta para los proyectos, SaaS, tiendas y comunidades más destacadas de América Latina.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-1">
              <span>🇦🇷</span>
              <span>🇧🇷</span>
              <span>🇨🇴</span>
              <span>🇨🇱</span>
              <span>🇵🇪</span>
              <span>🇻🇪</span>
              <span className="text-[11px] text-slate-400 ml-1">Hecho para toda LATAM</span>
            </div>
          </div>

          {/* Col 2: Reglas del Leaderboard */}
          <div className="space-y-3 text-xs">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              ¿Cómo funciona?
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>• Cada puesto se gana pujando más que el ocupante actual.</li>
              <li>• Tu enlace y logo quedan activos con tracking directo de clics.</li>
              <li>• Pagos instantáneos con Mercado Pago, Pix y USDT.</li>
              <li>• Los puestos nunca caducan hasta que alguien te supere.</li>
            </ul>
          </div>

          {/* Col 3: Categorías */}
          <div className="space-y-3 text-xs">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Categorías
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/saas" className="hover:text-amber-400 transition">SaaS & Software</Link>
              </li>
              <li>
                <Link href="/cripto" className="hover:text-amber-400 transition">Cripto & Web3</Link>
              </li>
              <li>
                <Link href="/ecommerce" className="hover:text-amber-400 transition">E-commerce & Afiliados</Link>
              </li>
              <li>
                <Link href="/marketing" className="hover:text-amber-400 transition">Marketing & Agencias</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Transparencia & Admin */}
          <div className="space-y-3 text-xs">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Transparencia
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Todos los clics y pujas son auditados y verificados en tiempo real.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition border border-slate-800 rounded-md px-2 py-1 bg-slate-900/50"
              >
                Panel de Administración →
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} eltop.lat — Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/actividad" className="hover:text-white transition">Feed de Actividad</Link>
            <a href="https://mercadopago.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Pagos protegidos por Mercado Pago
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
