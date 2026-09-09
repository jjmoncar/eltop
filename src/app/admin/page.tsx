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
  LogOut,
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

  useEffect(() => {
    // Check if session token exists in sessionStorage
    const savedSecret = sessionStorage.getItem('eltop_admin_secret');
    if (savedSecret) {
      setAdminSecret(savedSecret);
      fetchMetrics(savedSecret);
    }
  }, []);

  const fetchMetrics = async (secret: string) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setIsAuthenticated(true);
        sessionStorage.setItem('eltop_admin_secret', secret);
      } else {
        sessionStorage.removeItem('eltop_admin_secret');
        setIsAuthenticated(false);
        alert('Clave de administrador incorrecta o no autorizada.');
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

  const handleLogout = () => {
    sessionStorage.removeItem('eltop_admin_secret');
    setIsAuthenticated(false);
    setAdminSecret('');
    setMetrics(null);
    setActionMessage(null);
  };

  const toggleApproval = async (listingId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/toggle-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({ listingId, isApproved: !currentStatus }),
      });
      if (res.ok) {
        setActionMessage(`Estado del listado actualizado a: ${!currentStatus ? 'Aprobado' : 'Oculto'}`);
        fetchMetrics(adminSecret);
      } else if (res.status === 401) {
        alert('Sesión expirada o no autorizada.');
        handleLogout();
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({ bidId, txHash }),
      });
      if (res.ok) {
        setActionMessage('Pago USDT confirmado y puesto asignado con éxito.');
        fetchMetrics(adminSecret);
      } else if (res.status === 401) {
        alert('Sesión expirada o no autorizada.');
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
      <Navbar currency="USD" onCurrencyChange={() => {}} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {!isAuthenticated ? (
          /* Login Box */
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2EE] text-[#E05A38] flex items-center justify-center mx-auto border border-[#FADCD3]">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Panel de Control eltop.lat</h2>
              <p className="text-xs text-stone-500">
                Ingresa tu clave maestra de administración para gestionar listados y pagos.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Clave Admin
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Clave (por defecto: admin123)"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:outline-none"
                  />
                  <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 shadow-xs"
              >
                {isLoading ? 'Verificando...' : 'Acceder al Panel →'}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="space-y-8">
            {/* Header with Refresh and Logout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#E05A38]">
                  <Shield className="w-4 h-4" />
                  <span>Modo Administrador Activo</span>
                </div>
                <h1 className="text-2xl font-black text-stone-900 mt-1">
                  Métricas & Moderación
                </h1>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <button
                  onClick={() => fetchMetrics(adminSecret)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 border border-stone-200 transition"
                  title="Actualizar datos del servidor"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 border border-red-200 transition shadow-xs"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>

            {actionMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] space-y-1 shadow-xs">
                  <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#E05A38]" />
                    Total Recaudado
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#E05A38]">
                    {formatUSDOnly(metrics.totalRevenueCents)} USD
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] space-y-1 shadow-xs">
                  <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
                    Clics Totales
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    {metrics.totalClicks.toLocaleString()}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] space-y-1 shadow-xs">
                  <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    Listados Activos
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    {metrics.totalListings}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] space-y-1 shadow-xs">
                  <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-600" />
                    USDT Pendientes
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-600">
                    {metrics.pendingUsdtCount}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#EAE6DF] pb-3">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  activeTab === 'listings'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                Listados & Moderación ({metrics?.listings.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('usdt')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  activeTab === 'usdt'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                Pagos USDT / Manuales ({metrics?.pendingUsdtCount || 0})
              </button>

              <button
                onClick={() => setActiveTab('bids')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  activeTab === 'bids'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                Historial de Pujas ({metrics?.bids.length || 0})
              </button>
            </div>

            {/* Tab: Listings Moderation */}
            {activeTab === 'listings' && metrics && (
              <div className="rounded-2xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-stone-600 uppercase font-bold border-b border-[#EAE6DF]">
                      <tr>
                        <th className="p-4">Posición / Proyecto</th>
                        <th className="p-4">Categoría</th>
                        <th className="p-4">Puja Actual</th>
                        <th className="p-4">Clics</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE4]">
                      {metrics.listings.map((l) => {
                        const cat = metrics.categories.find((c) => c.id === l.category_id);
                        return (
                          <tr key={l.id} className="hover:bg-[#FAF8F5] transition">
                            <td className="p-4">
                              <div className="font-bold text-stone-900 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-stone-100 text-[#E05A38] font-bold font-mono">
                                  #{l.position}
                                </span>
                                <span>{l.name}</span>
                              </div>
                              <div className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5">
                                {l.tagline}
                              </div>
                            </td>
                            <td className="p-4 text-stone-700">
                              {cat?.name_es || l.category_id}
                            </td>
                            <td className="p-4 font-bold text-[#E05A38]">
                              {formatUSDOnly(l.current_bid_cents)} USD
                            </td>
                            <td className="p-4 text-emerald-600 font-semibold">
                              {l.click_count} clics
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                  l.is_approved
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
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
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-stone-700 hover:text-stone-900"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Ver Web</span>
                              </a>

                              <button
                                onClick={() => toggleApproval(l.id, l.is_approved)}
                                className={`px-3 py-1 rounded-full font-bold transition ${
                                  l.is_approved
                                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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
              <div className="rounded-2xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-stone-600 uppercase font-bold border-b border-[#EAE6DF]">
                      <tr>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Proyecto / Comprador</th>
                        <th className="p-4">Monto Ofrecido</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE4]">
                      {metrics.bids
                        .filter((b) => b.payment_provider === 'usdt_manual')
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-[#FAF8F5] transition">
                            <td className="p-4 text-stone-500 font-mono">
                              {new Date(b.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-stone-900">{b.target_name}</div>
                              <div className="text-[11px] text-stone-500">{b.buyer_name}</div>
                            </td>
                            <td className="p-4 font-bold text-[#E05A38]">
                              {formatUSDOnly(b.bid_amount_cents)} USDT
                            </td>
                            <td className="p-4 text-stone-700 font-mono">
                              {b.buyer_email}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                  b.payment_status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-[#FDF2EE] text-[#E05A38]'
                                }`}
                              >
                                {b.payment_status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {b.payment_status !== 'paid' && (
                                <button
                                  onClick={() => confirmUsdtPayment(b.id)}
                                  className="px-3.5 py-1.5 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white font-bold transition flex items-center gap-1 inline-flex shadow-xs"
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
              <div className="rounded-2xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-stone-600 uppercase font-bold border-b border-[#EAE6DF]">
                      <tr>
                        <th className="p-4">ID / Fecha</th>
                        <th className="p-4">Proyecto</th>
                        <th className="p-4">Monto</th>
                        <th className="p-4">Proveedor</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE4]">
                      {metrics.bids.map((b) => (
                        <tr key={b.id} className="hover:bg-[#FAF8F5] transition">
                          <td className="p-4 text-stone-500 font-mono text-[11px]">
                            <div>{b.id}</div>
                            <div className="text-[10px] text-stone-400">
                              {new Date(b.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-stone-900">{b.target_name}</div>
                            <div className="text-[11px] text-stone-500 truncate max-w-xs">{b.tagline}</div>
                          </td>
                          <td className="p-4 font-bold text-[#E05A38]">
                            {formatUSDOnly(b.bid_amount_cents)} USD
                          </td>
                          <td className="p-4 text-stone-700 font-semibold">
                            {b.payment_provider}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                b.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-[#FDF2EE] text-[#E05A38]'
                              }`}
                            >
                              {b.payment_status}
                            </span>
                          </td>
                          <td className="p-4 text-stone-500 font-mono">
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
