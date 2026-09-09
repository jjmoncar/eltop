import React from 'react';
import Link from 'next/link';
import { Flame, Shield, Zap, TrendingUp } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#FAF8F5] border-t border-[#EAE6DF] text-stone-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-[3px] justify-center items-start w-5">
                <span className="w-5 h-[3.5px] bg-[#E05A38] rounded-full" />
                <span className="w-4 h-[3.5px] bg-stone-900 rounded-full" />
                <span className="w-5 h-[3.5px] bg-stone-900 rounded-full" />
              </div>
              <span className="font-extrabold text-stone-900 text-base tracking-tight">
                eltop<span className="text-[#E05A38]">.lat</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              El leaderboard de pago tipo subasta para los proyectos, SaaS, tiendas y comunidades más destacadas de América Latina.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-stone-700 pt-1">
              <span>🇦🇷</span>
              <span>🇧🇷</span>
              <span>🇨🇴</span>
              <span>🇨🇱</span>
              <span>🇵🇪</span>
              <span>🇻🇪</span>
              <span className="text-[11px] text-stone-500 ml-1">Hecho para toda LATAM</span>
            </div>
          </div>

          {/* Col 2: Reglas del Leaderboard */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#E05A38]" />
              ¿Cómo funciona?
            </h4>
            <ul className="space-y-2 text-stone-500">
              <li>• Cada puesto se gana pujando más que el ocupante actual.</li>
              <li>• Tu enlace y logo quedan activos con tracking directo de clics.</li>
              <li>• Pagos instantáneos con Mercado Pago, Pix y USDT.</li>
              <li>• Los puestos nunca caducan hasta que alguien te supere.</li>
            </ul>
          </div>

          {/* Col 3: Categorías */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#E05A38]" />
              Categorías
            </h4>
            <ul className="space-y-2 text-stone-500">
              <li>
                <Link href="/saas" className="hover:text-[#E05A38] transition">SaaS & Software</Link>
              </li>
              <li>
                <Link href="/cripto" className="hover:text-[#E05A38] transition">Cripto & Web3</Link>
              </li>
              <li>
                <Link href="/ecommerce" className="hover:text-[#E05A38] transition">E-commerce & Afiliados</Link>
              </li>
              <li>
                <Link href="/marketing" className="hover:text-[#E05A38] transition">Marketing & Agencias</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Transparencia & Admin */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#E05A38]" />
              Transparencia
            </h4>
            <p className="text-stone-500 leading-relaxed">
              Todos los clics y pujas son auditados y verificados en tiempo real.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-[#E05A38] transition border border-[#EAE6DF] rounded-full px-3 py-1 bg-white shadow-xs"
              >
                Panel de Administración →
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#EAE6DF] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div>
            © {new Date().getFullYear()} eltop.lat — Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/actividad" className="hover:text-stone-900 transition">Feed de Actividad</Link>
            <a href="https://mercadopago.com" target="_blank" rel="noopener noreferrer" className="hover:text-stone-900 transition">
              Pagos protegidos por Mercado Pago
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
