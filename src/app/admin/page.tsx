'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Listing, Bid, Category } from '@/types/database';
import { formatUSDOnly } from '@/lib/currencies';
import {
  Shield,
  Key,
  TrendingUp,
  MousePointerClick,
  Layers,
  Coins,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<{
    totalRevenueCents: number;
    totalClicks: number;
    totalListings: number;
    pendingUsdtCount: number;
    listings: Listing[];
    bids: Bid[];
    categories: Category[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'listings' | 'usdt' | 'bids'>('listings');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchMetrics = async (secret: string) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/metrics?key=${secret}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setIsAuthenticated(true);
      } else {
        alert('Clave de administrador incorrecta.');
      }
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret) return;
    fetchMetrics(adminSecret);
  };

  const toggleApproval = async (listingId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/toggle-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, isApproved: !currentStatus }),
      });
      if (res.ok) {
        setActionMessage(`Estado del listado actualizado a: ${!currentStatus ? 'Aprobado' : 'Oculto'}`);
        fetchMetrics(adminSecret);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmUsdtPayment = async (bidId: string) => {
    const txHash = prompt('Ingresa el ID de transacción USDT o comprobante:');
    if (!txHash) return;

    try {
      const res = await fetch('/api/admin/confirm-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, txHash }),
      });
      if (res.ok) {
        setActionMessage('Pago USDT confirmado y puesto asignado con éxito.');
        fetchMetrics(adminSecret);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar currency="USD" onCurrencyChange={() => {}} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {!isAuthenticated ? (
          /* Login Box */
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Panel de Control eltop.lat</h2>
              <p className="text-xs text-slate-400">
                Ingresa tu clave maestra de administración para gestionar listados y pagos.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Clave Admin
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Clave (por defecto: admin123)"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Acceder al Panel →'}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Shield className="w-4 h-4" />
                  <span>Modo Administrador Activo</span>
                </div>
                <h1 className="text-2xl font-black text-white mt-1">
                  Métricas & Moderación
                </h1>
              </div>

              <button
                onClick={() => fetchMetrics(adminSecret)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos</span>
              </button>
            </div>

            {actionMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Total Recaudado
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">
                    {formatUSDOnly(metrics.totalRevenueCents)} USD
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                    Clics Totales
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    {metrics.totalClicks.toLocaleString()}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Listados Activos
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {metrics.totalListings}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-400" />
                    USDT Pendientes
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-400">
                    {metrics.pendingUsdtCount}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'listings'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Listados & Moderación ({metrics?.listings.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('usdt')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'usdt'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Pagos USDT / Manuales ({metrics?.pendingUsdtCount || 0})
              </button>

              <button
                onClick={() => setActiveTab('bids')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'bids'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Historial de Pujas ({metrics?.bids.length || 0})
              </button>
            </div>

            {/* Tab: Listings Moderation */}
            {activeTab === 'listings' && metrics && (
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">Posición / Proyecto</th>
                        <th className="p-4">Categoría</th>
                        <th className="p-4">Puja Actual</th>
                        <th className="p-4">Clics</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {metrics.listings.map((l) => {
                        const cat = metrics.categories.find((c) => c.id === l.category_id);
                        return (
                          <tr key={l.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-4">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                                  #{l.position}
                                </span>
                                <span>{l.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {l.tagline}
                              </div>
                            </td>
                            <td className="p-4 text-slate-300">
                              {cat?.name_es || l.category_id}
                            </td>
                            <td className="p-4 font-bold text-amber-400">
                              {formatUSDOnly(l.current_bid_cents)} USD
                            </td>
                            <td className="p-4 text-emerald-400 font-semibold">
                              {l.click_count} clics
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                  l.is_approved
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {l.is_approved ? 'Aprobado / Visible' : 'Oculto / Bloqueado'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <a
                                href={l.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Ver Web</span>
                              </a>

                              <button
                                onClick={() => toggleApproval(l.id, l.is_approved)}
                                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                                  l.is_approved
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {l.is_approved ? 'Ocultar' : 'Aprobar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: USDT Pending Payments */}
            {activeTab === 'usdt' && metrics && (
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Proyecto / Comprador</th>
                        <th className="p-4">Monto Ofrecido</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {metrics.bids
                        .filter((b) => b.payment_provider === 'usdt_manual')
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-4 text-slate-400 font-mono">
                              {new Date(b.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-white">{b.target_name}</div>
                              <div className="text-[11px] text-slate-400">{b.buyer_name}</div>
                            </td>
                            <td className="p-4 font-bold text-amber-400">
                              {formatUSDOnly(b.bid_amount_cents)} USDT
                            </td>
                            <td className="p-4 text-slate-300 font-mono">
                              {b.buyer_email}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                  b.payment_status === 'paid'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {b.payment_status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {b.payment_status !== 'paid' && (
                                <button
                                  onClick={() => confirmUsdtPayment(b.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1 inline-flex"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Confirmar Pago USDT</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: All Bids History */}
            {activeTab === 'bids' && metrics && (
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">ID / Fecha</th>
                        <th className="p-4">Proyecto</th>
                        <th className="p-4">Monto</th>
                        <th className="p-4">Proveedor</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {metrics.bids.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 text-slate-400 font-mono text-[11px]">
                            <div>{b.id}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(b.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white">{b.target_name}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{b.tagline}</div>
                          </td>
                          <td className="p-4 font-bold text-amber-400">
                            {formatUSDOnly(b.bid_amount_cents)} USD
                          </td>
                          <td className="p-4 text-slate-300 font-semibold">
                            {b.payment_provider}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                b.payment_status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {b.payment_status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 font-mono">
                            {b.buyer_email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
