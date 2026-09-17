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
  FolderTree,
  Edit3,
  Plus,
  Tag,
  Globe,
  Cpu,
  ShoppingBag,
  Sparkles,
  Zap,
  Flame,
  Code,
  Heart,
  Trophy,
} from 'lucide-react';

const CATEGORY_ICON_OPTIONS = [
  'Layers',
  'Cpu',
  'Coins',
  'ShoppingBag',
  'TrendingUp',
  'Sparkles',
  'Zap',
  'Globe',
  'Flame',
  'Tag',
  'Shield',
  'Heart',
  'Trophy',
  'Code',
];

function renderCategoryIcon(iconName: string, className = 'w-4 h-4') {
  switch (iconName) {
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Tag':
      return <Tag className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Code':
      return <Code className={className} />;
    default:
      return <Layers className={className} />;
  }
}

function checkPasswordStrength(password: string) {
  return {
    length: Boolean(password && password.length >= 8),
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
    special: /[^A-Za-z0-9]/.test(password || ''),
    isValid:
      Boolean(password && password.length >= 8) &&
      /[A-Z]/.test(password || '') &&
      /[a-z]/.test(password || '') &&
      /[0-9]/.test(password || '') &&
      /[^A-Za-z0-9]/.test(password || ''),
  };
}

function PasswordChecklist({ password }: { password: string }) {
  const strength = checkPasswordStrength(password);
  const items = [
    { label: 'Mínimo 8 caracteres', pass: strength.length },
    { label: 'Una mayúscula (A-Z)', pass: strength.uppercase },
    { label: 'Una minúscula (a-z)', pass: strength.lowercase },
    { label: 'Un número (0-9)', pass: strength.number },
    { label: 'Un carácter especial (!@#$%^&*)', pass: strength.special },
  ];

  return (
    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] space-y-1.5 sm:col-span-2">
      <div className="font-bold text-stone-700 flex items-center justify-between">
        <span>Requisitos de seguridad de la contraseña:</span>
        <span className={strength.isValid ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
          {strength.isValid ? '✓ Cumple todas las reglas' : 'Obligatorio'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {items.map((it, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors ${
              it.pass ? 'text-emerald-700 font-semibold' : 'text-stone-400'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                it.pass ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'
              }`}
            >
              {it.pass ? '✓' : '•'}
            </span>
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    pendingPaypalCount?: number;
    pendingUsdtCount?: number;
    listings: Listing[];
    bids: Bid[];
    categories: Category[];
  } | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Category management states
  const [categoriesList, setCategoriesList] = useState<(Category & { listings_count?: number })[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<(Category & { listings_count?: number }) | null>(null);
  const [catNameEs, setCatNameEs] = useState('');
  const [catNamePt, setCatNamePt] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescEs, setCatDescEs] = useState('');
  const [catDescPt, setCatDescPt] = useState('');
  const [catFloorUSD, setCatFloorUSD] = useState(20);
  const [catIncrementUSD, setCatIncrementUSD] = useState(5);
  const [catIcon, setCatIcon] = useState('Layers');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<(Category & { listings_count?: number }) | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Navigation and actions
  const [activeTab, setActiveTab] = useState<'listings' | 'categories' | 'paypal' | 'usdt' | 'bids' | 'users'>('listings');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Create User Modal state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'moderator' | 'superadmin'>('admin');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Edit User Modal state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'moderator' | 'superadmin'>('admin');
  const [editUserIsActive, setEditUserIsActive] = useState(true);
  const [editUserPassword, setEditUserPassword] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);

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
      fetchCategories(savedToken);
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

  const fetchCategories = async (token: string) => {
    if (!token) return;
    setIsLoadingCategories(true);
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching admin categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const resetCategoryForm = () => {
    setCatNameEs('');
    setCatNamePt('');
    setCatSlug('');
    setCatDescEs('');
    setCatDescPt('');
    setCatFloorUSD(20);
    setCatIncrementUSD(5);
    setCatIcon('Layers');
    setCategoryError(null);
    setEditingCategory(null);
  };

  const openCreateCategoryModal = () => {
    resetCategoryForm();
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat: Category & { listings_count?: number }) => {
    setEditingCategory(cat);
    setCatNameEs(cat.name_es);
    setCatNamePt(cat.name_pt || cat.name_es);
    setCatSlug(cat.slug);
    setCatDescEs(cat.description_es || '');
    setCatDescPt(cat.description_pt || '');
    setCatFloorUSD(cat.min_floor_cents / 100);
    setCatIncrementUSD(cat.min_bid_increment_cents / 100);
    setCatIcon(cat.icon || 'Layers');
    setCategoryError(null);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameEs.trim()) {
      setCategoryError('El nombre de la categoría en español es obligatorio.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    const isEditing = Boolean(editingCategory);
    const url = '/api/admin/categories';
    const method = isEditing ? 'PATCH' : 'POST';

    const payload: Record<string, any> = {
      name_es: catNameEs.trim(),
      name_pt: catNamePt.trim() || catNameEs.trim(),
      slug: catSlug.trim() || undefined,
      description_es: catDescEs.trim() || undefined,
      description_pt: catDescPt.trim() || undefined,
      min_floor_cents: Math.round(Number(catFloorUSD) * 100),
      min_bid_increment_cents: Math.round(Number(catIncrementUSD) * 100),
      icon: catIcon || 'Layers',
    };

    if (isEditing && editingCategory) {
      payload.id = editingCategory.id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(
          isEditing
            ? `Categoría "${catNameEs}" actualizada con éxito.`
            : `Categoría "${catNameEs}" creada con éxito en la base de datos.`
        );
        setShowCategoryModal(false);
        resetCategoryForm();
        fetchCategories(authToken);
        fetchMetrics(authToken);
      } else {
        setCategoryError(data.error || 'No se pudo guardar la categoría.');
      }
    } catch (err) {
      setCategoryError('Error de conexión al guardar la categoría.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeletingCategory(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id: deletingCategory.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`Categoría "${deletingCategory.name_es}" eliminada con éxito.`);
        setDeletingCategory(null);
        fetchCategories(authToken);
        fetchMetrics(authToken);
      } else {
        alert(data.error || 'No se pudo eliminar la categoría.');
      }
    } catch (err) {
      alert('Error de conexión al eliminar la categoría.');
    } finally {
      setIsDeletingCategory(false);
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
        fetchCategories(data.token);
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

  const editListing = async (listing: Listing) => {
    const name = prompt('Nombre del proyecto:', listing.name);
    if (name === null) return;
    const url = prompt('URL del proyecto:', listing.url);
    if (url === null) return;
    const tagline = prompt('Descripción corta:', listing.tagline);
    if (tagline === null) return;
    const logoUrl = prompt('URL del logo (opcional):', listing.logo_url || '');
    if (logoUrl === null) return;

    try {
      const res = await fetch('/api/admin/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id: listing.id, name, url, tagline, logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo editar el listado.');
      setActionMessage(`Listado "${name}" actualizado.`);
      fetchMetrics(authToken);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al editar el listado.');
    }
  };

  const deleteListing = async (listing: Listing) => {
    if (!window.confirm(`¿Eliminar definitivamente "${listing.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch('/api/admin/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id: listing.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el listado.');
      setActionMessage(`Listado "${listing.name}" eliminado.`);
      fetchMetrics(authToken);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar el listado.');
    }
  };

  const confirmPayPalPayment = async (bidId: string) => {
    const txHash = prompt('Ingresa el ID de transacción PayPal o comprobante (ej: 8XX99876YY):');
    if (!txHash) return;

    try {
      const res = await fetch('/api/admin/confirm-paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ bidId, txHash }),
      });
      if (res.ok) {
        setActionMessage('Pago PayPal confirmado y puesto asignado con éxito.');
        fetchMetrics(authToken);
      } else if (res.status === 401) {
        alert('Sesión expirada o no autorizada.');
        handleLogout();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al confirmar el pago.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmUsdtPayment = confirmPayPalPayment;

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);

    const strength = checkPasswordStrength(newUserPassword);
    if (!strength.isValid) {
      setCreateUserError('La contraseña debe cumplir con los 5 requisitos de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial).');
      return;
    }

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

  const openEditUserModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role as any);
    setEditUserIsActive(user.is_active);
    setEditUserPassword('');
    setEditUserError(null);
    setShowEditUserModal(true);
  };

  const handleUpdateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserError(null);

    if (editUserPassword) {
      const strength = checkPasswordStrength(editUserPassword);
      if (!strength.isValid) {
        setEditUserError('La nueva contraseña debe cumplir con los 5 requisitos de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial).');
        return;
      }
    }

    setIsUpdatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editUserName,
          email: editUserEmail,
          role: editUserRole,
          isActive: editUserIsActive,
          newPassword: editUserPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`Usuario "${editUserName}" actualizado exitosamente.`);
        setShowEditUserModal(false);
        setEditingUser(null);
        fetchAdminUsers(authToken);

        if (currentUser?.id === editingUser.id || currentUser?.email === editingUser.email) {
          const updated = {
            ...currentUser,
            name: editUserName,
            email: editUserEmail,
            role: editUserRole,
          };
          setCurrentUser(updated);
          sessionStorage.setItem('eltop_admin_user', JSON.stringify(updated));
        }
      } else {
        setEditUserError(data.error || 'Error al actualizar usuario.');
      }
    } catch (err) {
      setEditUserError('Error de red al actualizar usuario.');
    } finally {
      setIsUpdatingUser(false);
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
                    fetchCategories(authToken);
                    fetchAdminUsers(authToken);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 border border-stone-200 transition"
                  title="Actualizar datos del servidor"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingUsers || isLoadingCategories ? 'animate-spin' : ''}`} />
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
                    <Globe className="w-3.5 h-3.5 text-[#0070BA]" />
                    PayPal Pendientes
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#0070BA]">
                    {metrics.pendingPaypalCount ?? metrics.pendingUsdtCount ?? 0}
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
                onClick={() => {
                  setActiveTab('categories');
                  fetchCategories(authToken);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'categories'
                    ? 'bg-[#E05A38] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Categorías ({categoriesList.length || metrics?.categories.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('paypal')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'paypal' || activeTab === 'usdt'
                    ? 'bg-[#0070BA] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EAE6DF]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Pagos PayPal / Manuales ({metrics?.pendingPaypalCount ?? metrics?.pendingUsdtCount ?? 0})</span>
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
                                  onClick={() => editListing(l)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>

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

                                <button
                                  onClick={() => deleteListing(l)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Eliminar</span>
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

            {/* Tab: Categories Management */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                {/* Categories Tab Header with Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs">
                  <div>
                    <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-[#E05A38]" />
                      <span>Clasificación y Categorías de la Plataforma</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Gestiona las categorías en la base de datos. Se reflejan en tiempo real en la navegación, el selector y filtros públicos.
                    </p>
                  </div>
                  <button
                    onClick={openCreateCategoryModal}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white text-xs font-bold shadow-xs transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Categoría</span>
                  </button>
                </div>

                {/* Categories Table */}
                <div className="rounded-2xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-stone-600 uppercase font-bold border-b border-[#EAE6DF]">
                        <tr>
                          <th className="p-4">Categoría / Ícono</th>
                          <th className="p-4">Ruta (Slug)</th>
                          <th className="p-4">Precio Piso</th>
                          <th className="p-4">Incremento Mínimo</th>
                          <th className="p-4">Listados Activos</th>
                          <th className="p-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0ECE4]">
                        {categoriesList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-stone-500">
                              {isLoadingCategories ? 'Cargando categorías desde la base de datos...' : 'No hay categorías configuradas.'}
                            </td>
                          </tr>
                        ) : (
                          categoriesList.map((cat) => (
                            <tr key={cat.id} className="hover:bg-[#FAF8F5] transition">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] text-[#E05A38] flex items-center justify-center shrink-0">
                                    {renderCategoryIcon(cat.icon, 'w-4 h-4')}
                                  </div>
                                  <div>
                                    <div className="font-bold text-stone-900">{cat.name_es}</div>
                                    <div className="text-[11px] text-stone-400 italic">
                                      PT: {cat.name_pt || cat.name_es}
                                    </div>
                                    {cat.description_es && (
                                      <p className="text-[10px] text-stone-500 line-clamp-1 max-w-xs mt-0.5">
                                        {cat.description_es}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 font-mono text-stone-700">
                                  <span className="text-stone-400">/</span>
                                  <span className="font-semibold text-stone-900">{cat.slug}</span>
                                  <a
                                    href={`/${cat.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-stone-400 hover:text-[#E05A38] transition ml-1"
                                    title="Ver categoría en vivo"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-stone-900">
                                ${(cat.min_floor_cents / 100).toFixed(0)} USD
                              </td>
                              <td className="p-4 text-stone-700">
                                +${(cat.min_bid_increment_cents / 100).toFixed(0)} USD
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                                  {cat.listings_count ?? 0} {cat.listings_count === 1 ? 'listado' : 'listados'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => openEditCategoryModal(cat)}
                                  className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition inline-flex items-center gap-1 border border-stone-300"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => setDeletingCategory(cat)}
                                  className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 font-bold transition inline-flex items-center gap-1 border border-red-200"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Eliminar</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: PayPal Pending Payments */}
            {(activeTab === 'paypal' || activeTab === 'usdt') && metrics && (
              <div className="rounded-2xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-stone-600 uppercase font-bold border-b border-[#EAE6DF]">
                      <tr>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Proyecto / Comprador</th>
                        <th className="p-4">Monto Ofrecido</th>
                        <th className="p-4">Proveedor</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE4]">
                      {metrics.bids.filter((b) => b.payment_provider === 'paypal' || b.payment_provider === 'usdt_manual').length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-stone-500">
                            No hay pagos en PayPal pendientes de verificación.
                          </td>
                        </tr>
                      ) : (
                        metrics.bids
                          .filter((b) => b.payment_provider === 'paypal' || b.payment_provider === 'usdt_manual')
                          .map((b) => (
                            <tr key={b.id} className="hover:bg-[#FAF8F5] transition">
                              <td className="p-4 text-stone-500 font-mono">
                                {new Date(b.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-stone-900">{b.target_name}</div>
                                <div className="text-[11px] text-stone-500">{b.buyer_name}</div>
                              </td>
                              <td className="p-4 font-bold text-[#0070BA]">
                                {formatUSDOnly(b.bid_amount_cents)} USD
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#0070BA] border border-sky-100">
                                  {b.payment_provider === 'paypal' ? 'PayPal' : 'Manual / USDT'}
                                </span>
                              </td>
                              <td className="p-4 text-stone-700 font-mono">
                                {b.buyer_email}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                    b.payment_status === 'paid'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {b.payment_status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {b.payment_status !== 'paid' && (
                                  <button
                                    onClick={() => confirmPayPalPayment(b.id)}
                                    className="px-3.5 py-1.5 rounded-full bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold transition flex items-center gap-1 inline-flex shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Confirmar Pago PayPal</span>
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
                          Contraseña * (Mín. 8 caracteres, mayúscula, minúscula, número y especial)
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none"
                        />
                      </div>

                      <PasswordChecklist password={newUserPassword} />

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

                {/* Edit Admin Modal */}
                {showEditUserModal && editingUser && (
                  <div className="p-6 rounded-2xl bg-white border-2 border-sky-500 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                          <Edit3 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">
                            Editar Administrador
                          </h4>
                          <p className="text-[11px] text-stone-500 font-mono">
                            {editingUser.email} (ID: {editingUser.id})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEditUserModal(false)}
                        className="text-stone-400 hover:text-stone-700 p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {editUserError && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                        {editUserError}
                      </div>
                    )}

                    <form onSubmit={handleUpdateAdminUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          value={editUserEmail}
                          onChange={(e) => setEditUserEmail(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Rol de Acceso *
                        </label>
                        <select
                          value={editUserRole}
                          onChange={(e) => setEditUserRole(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-sky-500 focus:outline-none cursor-pointer"
                        >
                          <option value="admin">Administrador (Control total)</option>
                          <option value="moderator">Moderador (Solo aprobación)</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Estado de la Cuenta *
                        </label>
                        <select
                          value={editUserIsActive ? 'active' : 'inactive'}
                          onChange={(e) => setEditUserIsActive(e.target.value === 'active')}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-sky-500 focus:outline-none cursor-pointer"
                        >
                          <option value="active">Activo (Acceso permitido)</option>
                          <option value="inactive">Desactivado (Acceso revocado)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Nueva Contraseña (Opcional — dejar en blanco para conservar la actual)
                        </label>
                        <input
                          type="password"
                          placeholder="•••••••• (Escribe aquí solo si deseas cambiarla)"
                          value={editUserPassword}
                          onChange={(e) => setEditUserPassword(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      {editUserPassword && (
                        <PasswordChecklist password={editUserPassword} />
                      )}

                      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => setShowEditUserModal(false)}
                          className="px-4 py-2 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingUser}
                          className="px-5 py-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                        >
                          {isUpdatingUser ? 'Guardando Cambios...' : 'Guardar Cambios'}
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
                                <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => openEditUserModal(user)}
                                    className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold transition inline-flex items-center gap-1 text-xs shadow-2xs"
                                    title="Editar datos y credenciales"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>

                                  {!isMe && (
                                    <button
                                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                      className={`px-3 py-1 rounded-full font-bold transition inline-flex items-center gap-1 text-xs shadow-2xs ${
                                        user.is_active
                                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                      }`}
                                      title={user.is_active ? 'Desactivar acceso' : 'Reactivar acceso'}
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
                                  )}

                                  <button
                                    onClick={() => {
                                      if (isMe) {
                                        alert('No puedes eliminar tu propia cuenta mientras estás en sesión activa.');
                                        return;
                                      }
                                      handleDeleteUser(user.id, user.name);
                                    }}
                                    disabled={isMe}
                                    className={`px-3 py-1 rounded-full font-bold transition inline-flex items-center gap-1 text-xs shadow-2xs ${
                                      isMe
                                        ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-50'
                                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                    }`}
                                    title={isMe ? 'No puedes eliminar tu propia cuenta en sesión' : 'Eliminar administrador permanentemente'}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Eliminar</span>
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
              </div>
            )}

            {/* Modal: Create or Edit Category */}
            {showCategoryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
                <div className="w-full max-w-xl rounded-3xl bg-white border border-[#EAE6DF] shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-4">
                    <div className="flex items-center gap-2 text-stone-900">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#E05A38] flex items-center justify-center">
                        {renderCategoryIcon(catIcon, 'w-5 h-5')}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-stone-900">
                          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría en Base de Datos'}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {editingCategory ? 'Modifica los parámetros de la categoría existente.' : 'Crea una nueva clasificación para la subasta y escaparate.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCategoryModal(false);
                        resetCategoryForm();
                      }}
                      className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {categoryError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{categoryError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveCategory} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name ES */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Nombre (Español) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej: SaaS & Software"
                          value={catNameEs}
                          onChange={(e) => {
                            setCatNameEs(e.target.value);
                            if (!editingCategory && !catSlug) {
                              setCatSlug(
                                e.target.value
                                  .toLowerCase()
                                  .normalize('NFD')
                                  .replace(/[\u0300-\u036f]/g, '')
                                  .replace(/[^a-z0-9]+/g, '-')
                                  .replace(/^-+|-+$/g, '')
                              );
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none"
                        />
                      </div>

                      {/* Name PT */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Nombre (Portugués)
                        </label>
                        <input
                          type="text"
                          placeholder="ej: SaaS e Software"
                          value={catNamePt}
                          onChange={(e) => setCatNamePt(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none"
                        />
                      </div>

                      {/* Slug */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Ruta URL (Slug) *
                        </label>
                        <div className="flex items-center">
                          <span className="px-3 py-2 rounded-l-xl bg-stone-100 border border-r-0 border-[#EAE6DF] text-stone-500 font-mono text-xs">
                            eltop.lat/
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="saas"
                            value={catSlug}
                            onChange={(e) => setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="w-full px-3.5 py-2 rounded-r-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs font-mono focus:border-[#E05A38] focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Identificador único para enlaces directos y la navegación superior.
                        </p>
                      </div>

                      {/* Description ES */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Descripción (Español)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Herramientas de software, apps y plataformas para empresas y creadores..."
                          value={catDescEs}
                          onChange={(e) => setCatDescEs(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none resize-none"
                        />
                      </div>

                      {/* Description PT */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Descripción (Portugués)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ferramentas de software, aplicativos e plataformas para empresas..."
                          value={catDescPt}
                          onChange={(e) => setCatDescPt(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs focus:border-[#E05A38] focus:outline-none resize-none"
                        />
                      </div>

                      {/* Floor Price USD */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Precio Piso Inicial ($ USD)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            required
                            value={catFloorUSD}
                            onChange={(e) => setCatFloorUSD(Number(e.target.value))}
                            className="w-full pl-7 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs font-bold text-stone-900 focus:border-[#E05A38] focus:outline-none"
                          />
                          <span className="absolute left-3 top-2 text-xs text-stone-400">$</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Precio mínimo para reclamar un puesto vacío.
                        </p>
                      </div>

                      {/* Increment USD */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Incremento Mínimo por Puja ($ USD)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            required
                            value={catIncrementUSD}
                            onChange={(e) => setCatIncrementUSD(Number(e.target.value))}
                            className="w-full pl-7 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs font-bold text-stone-900 focus:border-[#E05A38] focus:outline-none"
                          />
                          <span className="absolute left-3 top-2 text-xs text-stone-400">+$</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Cantidad mínima a superar para adelantar puestos.
                        </p>
                      </div>

                      {/* Icon Selector */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-2">
                          Ícono de la Categoría
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_ICON_OPTIONS.map((iconName) => {
                            const isSelected = catIcon === iconName;
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => setCatIcon(iconName)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                                  isSelected
                                    ? 'bg-[#E05A38] text-white border-[#E05A38] shadow-xs'
                                    : 'bg-[#FAF8F5] text-stone-700 hover:bg-stone-100 border-[#EAE6DF]'
                                }`}
                              >
                                {renderCategoryIcon(iconName, 'w-3.5 h-3.5')}
                                <span>{iconName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F0ECE4]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryModal(false);
                          resetCategoryForm();
                        }}
                        className="px-4 py-2 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCategory}
                        className="px-6 py-2 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        {isSavingCategory ? 'Guardando en BD...' : editingCategory ? 'Actualizar Categoría' : 'Crear en Base de Datos'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Delete Category Confirmation */}
            {deletingCategory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <div className="w-full max-w-md rounded-3xl bg-white border border-[#EAE6DF] shadow-2xl p-6 sm:p-8 space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                    <Trash2 className="w-6 h-6" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-base text-stone-900">
                      ¿Eliminar categoría &quot;{deletingCategory.name_es}&quot;?
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Esta acción eliminará la categoría permanentemente de la base de datos de Supabase.
                    </p>
                  </div>

                  {deletingCategory.listings_count && deletingCategory.listings_count > 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Advertencia:</strong>
                        Esta categoría tiene <strong>{deletingCategory.listings_count} listado(s)</strong> activo(s). La base de datos eliminará en cascada estos listados y sus pujas asociadas.
                      </div>
                    </div>
                  ) : null}

                  {categoriesList.length <= 1 && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      No puedes eliminar la única categoría restante de la plataforma.
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(null)}
                      className="flex-1 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingCategory || categoriesList.length <= 1}
                      onClick={handleDeleteCategory}
                      className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                    >
                      {isDeletingCategory ? 'Eliminando...' : 'Sí, Eliminar de la BD'}
                    </button>
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
