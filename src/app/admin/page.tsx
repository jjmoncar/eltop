'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Listing, Bid, Category, AdminUser } from '@/types/database';
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
  Users,
  UserPlus,
  Mail,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminPage() {
  // Login form state
  const [loginMode, setLoginMode] = useState<'credentials' | 'secret'>('credentials');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Authenticated state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<{
    totalRevenueCents: number;
    totalClicks: number;
    totalListings: number;
    pendingUsdtCount: number;
    listings: Listing[];
    bids: Bid[];
    categories: Category[];
  } | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Navigation and actions
  const [activeTab, setActiveTab] = useState<'listings' | 'usdt' | 'bids' | 'users'>('listings');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Create User Modal state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'moderator' | 'superadmin'>('admin');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  useEffect(() => {
    // Check saved token and user session
    const savedToken = sessionStorage.getItem('eltop_admin_token') || sessionStorage.getItem('eltop_admin_secret');
    const savedUserStr = sessionStorage.getItem('eltop_admin_user');

    if (savedToken) {
      setAuthToken(savedToken);
      if (savedUserStr) {
        try {
          setCurrentUser(JSON.parse(savedUserStr));
        } catch {
          // ignore
        }
      }
      fetchMetrics(savedToken);
      fetchAdminUsers(savedToken);
    }
  }, []);

  const fetchMetrics = async (token: string) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setIsAuthenticated(true);
        sessionStorage.setItem('eltop_admin_token', token);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminUsers = async (token: string) => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      const payload =
        loginMode === 'credentials'
          ? { email: loginEmail, password: loginPassword }
          : { secretKey: adminSecret };

      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        sessionStorage.setItem('eltop_admin_token', data.token);
        sessionStorage.setItem('eltop_admin_user', JSON.stringify(data.user));
        fetchMetrics(data.token);
        fetchAdminUsers(data.token);
      } else {
        setLoginError(data.error || 'Credenciales incorrectas o no autorizadas.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('eltop_admin_token');
    sessionStorage.removeItem('eltop_admin_secret');
    sessionStorage.removeItem('eltop_admin_user');
    setIsAuthenticated(false);
    setAuthToken('');
    setCurrentUser(null);
    setMetrics(null);
    setAdminUsers([]);
    setActionMessage(null);
  };

  const toggleApproval = async (listingId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/toggle-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ listingId, isApproved: !currentStatus }),
      });
      if (res.ok) {
        setActionMessage(`Estado del listado actualizado a: ${!currentStatus ? 'Aprobado' : 'Oculto'}`);
        fetchMetrics(authToken);
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
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ bidId, txHash }),
      });
      if (res.ok) {
        setActionMessage('Pago USDT confirmado y puesto asignado con éxito.');
        fetchMetrics(authToken);
      } else if (res.status === 401) {
        alert('Sesión expirada o no autorizada.');
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setIsCreatingUser(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`Usuario administrador "${newUserName}" creado exitosamente.`);
        setShowCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchAdminUsers(authToken);
      } else {
        setCreateUserError(data.error || 'Error al crear usuario.');
      }
    } catch (err) {
      setCreateUserError('Error de red al crear usuario.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (res.ok) {
        setActionMessage(`Estado del usuario actualizado a: ${!currentStatus ? 'Activo' : 'Inactivo'}`);
        fetchAdminUsers(authToken);
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo actualizar el estado del usuario.');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente al administrador "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setActionMessage(`Usuario "${userName}" eliminado correctamente.`);
        fetchAdminUsers(authToken);
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo eliminar el usuario.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
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
                Inicia sesión con tu cuenta de administrador conectada a la base de datos.
              </p>
            </div>

            {/* Login Mode Switcher */}
            <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('credentials');
                  setLoginError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === 'credentials'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Correo y Contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('secret');
                  setLoginError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === 'secret'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Clave Maestra (API)
              </button>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {loginMode === 'credentials' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="admin@eltop.lat"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Clave Maestra ADMIN_SECRET_KEY
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Clave maestra de servidor"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:outline-none"
                    />
                    <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 shadow-xs"
              >
                {isLoading ? 'Verificando con la Base de Datos...' : 'Acceder al Panel →'}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="space-y-8">
            {/* Header with User Info and Logout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#E05A38]">
                  <Shield className="w-4 h-4" />
                  <span>Modo Administrador Activo</span>
                  {currentUser && (
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono uppercase">
                      Rol: {currentUser.role}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-black text-stone-900 mt-1">
                  Métricas & Moderación
                </h1>
                {currentUser && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    Conectado como <strong>{currentUser.name}</strong> ({currentUser.email})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <button
                  onClick={() => {
                    fetchMetrics(authToken);
                    fetchAdminUsers(authToken);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 border border-stone-200 transition"
                  title="Actualizar datos del servidor"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingUsers ? 'animate-spin' : ''}`} />
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
                <CheckCircle className="w-4 h-4 shrink-0" />
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
            <div className="flex flex-wrap items-center gap-2 border-b border-[#EAE6DF] pb-3">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'listings'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Listados & Moderación ({metrics?.listings.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('usdt')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'usdt'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Pagos USDT / Manuales ({metrics?.pendingUsdtCount || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('bids')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'bids'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Historial de Pujas ({metrics?.bids.length || 0})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('users');
                  fetchAdminUsers(authToken);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'users'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Administradores ({adminUsers.length})</span>
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
                      {metrics.listings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-500">
                            No hay proyectos activos registrados en la base de datos.
                          </td>
                        </tr>
                      ) : (
                        metrics.listings.map((l) => {
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
                        })
                      )}
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
                      {metrics.bids.filter((b) => b.payment_provider === 'usdt_manual').length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-500">
                            No hay pagos en USDT pendientes de verificación.
                          </td>
                        </tr>
                      ) : (
                        metrics.bids
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
                          ))
                      )}
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
                      {metrics.bids.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-500">
                            Aún no se han generado transacciones ni pujas.
                          </td>
                        </tr>
                      ) : (
                        metrics.bids.map((b) => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Admin Users Management (Direct Database) */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#EAE6DF]">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#E05A38]" />
                      Usuarios Administradores en Base de Datos
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Gestiona credenciales, roles y accesos autenticados a la plataforma.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCreateUserError(null);
                      setShowCreateUserModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear Nuevo Administrador</span>
                  </button>
                </div>

                {/* Create Admin Modal */}
                {showCreateUserModal && (
                  <div className="p-6 rounded-2xl bg-white border-2 border-[#E05A38] shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#E05A38]" />
                        Nuevo Usuario Administrador
                      </h4>
                      <button
                        onClick={() => setShowCreateUserModal(false)}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {createUserError && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                        {createUserError}
                      </div>
                    )}

                    <form onSubmit={handleCreateAdminUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej. Carlos Mendoza"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="ej. carlos@empresa.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Contraseña Temporal * (Mín. 6 caracteres)
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Rol de Acceso *
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none cursor-pointer"
                        >
                          <option value="admin">Administrador (Control total)</option>
                          <option value="moderator">Moderador (Solo aprobación)</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateUserModal(false)}
                          className="px-4 py-2 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingUser}
                          className="px-5 py-2 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                        >
                          {isCreatingUser ? 'Guardando en BD...' : 'Guardar en Base de Datos'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Users Table */}
                <div className="rounded-2xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-stone-600 uppercase font-bold border-b border-[#EAE6DF]">
                        <tr>
                          <th className="p-4">Administrador</th>
                          <th className="p-4">Correo</th>
                          <th className="p-4">Rol</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4">Último Ingreso</th>
                          <th className="p-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0ECE4]">
                        {adminUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-stone-500">
                              {isLoadingUsers ? 'Consultando administradores en la base de datos...' : 'No hay usuarios administrativos registrados.'}
                            </td>
                          </tr>
                        ) : (
                          adminUsers.map((user) => {
                            const isMe = currentUser?.id === user.id || currentUser?.email === user.email;
                            return (
                              <tr key={user.id} className="hover:bg-[#FAF8F5] transition">
                                <td className="p-4">
                                  <div className="font-bold text-stone-900 flex items-center gap-2">
                                    <span>{user.name}</span>
                                    {isMe && (
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                        (Tú)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                    ID: {user.id}
                                  </div>
                                </td>
                                <td className="p-4 font-mono text-stone-700">
                                  {user.email}
                                </td>
                                <td className="p-4">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200">
                                    {user.role}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      user.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                                  >
                                    {user.is_active ? 'Activo' : 'Desactivado'}
                                  </span>
                                </td>
                                <td className="p-4 text-stone-500">
                                  {user.last_login
                                    ? new Date(user.last_login).toLocaleString()
                                    : 'Nunca'}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  {!isMe && (
                                    <>
                                      <button
                                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                        className={`px-3 py-1 rounded-full font-bold transition inline-flex items-center gap-1 ${
                                          user.is_active
                                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                        }`}
                                      >
                                        {user.is_active ? (
                                          <>
                                            <UserX className="w-3 h-3" />
                                            <span>Desactivar</span>
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="w-3 h-3" />
                                            <span>Activar</span>
                                          </>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                        className="px-3 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold transition inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Eliminar</span>
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
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
