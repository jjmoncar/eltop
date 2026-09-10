import React from 'react';
import Link from 'next/link';
import { Flame, Shield, Zap, TrendingUp } from 'lucide-react';
import { Category } from '@/types/database';

interface FooterProps {
  categories?: Category[];
}

export function Footer({ categories }: FooterProps) {
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
        .catch(() => {});
    }
  }, [categories]);

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
              <span>🇲🇽</span>
              <span>🇻🇪</span>
            </div>
          </div>

          {/* Col 2: Dinámica */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#E05A38]" />
              ¿Cómo funciona?
            </h4>
            <ul className="space-y-2 text-stone-500">
              <li>• Compite por el puesto 1 al 10 en tu categoría.</li>
              <li>• Cada clic hacia tu web es verificado y trazable.</li>
              <li>• Pagos instantáneos con Mercado Pago, Pix y PayPal.</li>
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
              {liveCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/${cat.slug}`} className="hover:text-[#E05A38] transition">
                    {cat.name_es}
                  </Link>
                </li>
              ))}
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
