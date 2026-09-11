'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category, Listing, CurrencyCode } from '@/types/database';
import { formatUSDOnly, formatCents } from '@/lib/currencies';
import { COUNTRIES, getCountryByCode } from '@/lib/countries';
import confetti from 'canvas-confetti';
import {
  Flame,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Coins,
  CheckCircle2,
  AlertCircle,
  Eye,
  Globe2,
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface Props {
  categories: Category[];
  currentCategory: Category;
  listings: Listing[];
  targetPosParam?: number;
  currency: CurrencyCode;
}

function getInitialCountry(currency: CurrencyCode): string {
  switch (currency) {
    case 'BRL':
      return 'BR';
    case 'ARS':
      return 'AR';
    case 'COP':
      return 'CO';
    case 'CLP':
      return 'CL';
    case 'PEN':
      return 'PE';
    case 'VES':
      return 'VE';
    default:
      return 'AR';
  }
}

export function ClaimForm({
  categories,
  currentCategory,
  listings,
  targetPosParam,
  currency,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCatId, setSelectedCatId] = useState(currentCategory.id);
  const [targetPos, setTargetPos] = useState<number>(targetPosParam || 1);

  // Form Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [url, setUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // Country & Identity Document Fields
  const initialCountryCode = getInitialCountry(currency);
  const [countryCode, setCountryCode] = useState<string>(initialCountryCode);
  const [docType, setDocType] = useState<string>(() => {
    const c = getCountryByCode(initialCountryCode);
    return c.documents[0]?.id || 'DNI';
  });
  const [docNumber, setDocNumber] = useState<string>('');

  const currentCountry = getCountryByCode(countryCode);
  const currentDoc = currentCountry.documents.find((d) => d.id === docType) || currentCountry.documents[0];

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const country = getCountryByCode(newCode);
    if (country && country.documents.length > 0) {
      setDocType(country.documents[0].id);
      setDocNumber('');
    }
  };

  const [offeredAmountUSD, setOfferedAmountUSD] = useState<number>(20);
  const [paymentProvider, setPaymentProvider] = useState<'mercadopago' | 'stripe_pix' | 'paypal'>('mercadopago');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<boolean>(false);
  const [paypalSubmitted, setPaypalSubmitted] = useState(false);
  const [paypalInfo, setPaypalInfo] = useState<{
    bidId?: string;
    amountUsd?: string;
  } | null>(null);

  // Active Category & Target Occupant
  const activeCategory = categories.find((c) => c.id === selectedCatId) || currentCategory;
  const catListings = listings.filter((l) => l.category_id === activeCategory.id && l.rank_type === 'all_time');
  const occupant = catListings.find((l) => l.position === targetPos);

  const minFloor = (activeCategory.min_floor_cents || 2000) / 100;
  const minIncrement = (activeCategory.min_bid_increment_cents || 500) / 100;

  // Calculate required minimum USD
  const requiredMinimumUSD = occupant
    ? occupant.current_bid_cents / 100 + minIncrement
    : catListings.length === 0
    ? minFloor
    : Math.max(minFloor, (catListings[catListings.length - 1].current_bid_cents / 100) * 0.5);

  useEffect(() => {
    // Fill from query param if available
    const qUrl = searchParams.get('url');
    if (qUrl && !url) {
      setUrl(qUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    // Reset default offered amount when target or category changes
    setOfferedAmountUSD(Math.ceil(requiredMinimumUSD));
  }, [targetPos, selectedCatId, requiredMinimumUSD]);

  // Check URL params for success/demo triggers
  useEffect(() => {
    const paymentStatus = searchParams.get('payment') || searchParams.get('demo_payment');
    const bidId = searchParams.get('bid_id');

    if (paymentStatus === 'success' && bidId) {
      setSuccessPayment(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Auto call demo confirmation if demo
      if (searchParams.get('demo_payment') === 'success') {
        fetch('/api/bids/demo-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bidId }),
        }).then();
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (offeredAmountUSD < requiredMinimumUSD) {
      setErrorMessage(
        `El monto mínimo para reclamar este puesto es de $${requiredMinimumUSD} USD.`
      );
      return;
    }

    if (!docNumber.trim()) {
      setErrorMessage(
        `Por favor ingresa tu documento de identidad (${docType} - ${currentCountry.name}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create bid record
      const bidRes = await fetch('/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: activeCategory.id,
          name,
          tagline,
          url,
          logoUrl,
          buyerName: buyerName || name,
          buyerEmail,
          bidAmountCents: Math.round(offeredAmountUSD * 100),
          paymentProvider,
          country: countryCode,
          docType,
          docNumber: docNumber.trim(),
        }),
      });

      const bidData = await bidRes.json();

      if (!bidRes.ok) {
        throw new Error(bidData.error || 'Error al registrar la puja.');
      }

      const bidId = bidData.bidId;

      if (paymentProvider === 'paypal') {
        setPaypalInfo({
          bidId,
          amountUsd: offeredAmountUSD.toFixed(2),
        });
        setPaypalSubmitted(true);
        setIsSubmitting(false);
        return;
      }

      // 2. Create Mercado Pago / Pix Checkout Preference
      const checkoutRes = await fetch('/api/checkout/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, paymentProvider }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Error al iniciar checkout.');
      }

      // Redirect to hosted Mercado Pago checkout or local demo
      const redirectUrl = checkoutData.initPoint || checkoutData.sandboxInitPoint;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        // Fallback demo confirmation
        router.push(`/${activeCategory.slug}/reclamar?demo_payment=success&bid_id=${bidId}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un problema de conexión.');
      setIsSubmitting(false);
    }
  };


  if (successPayment) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-emerald-300 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-100/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900">¡Pago Exitoso y Puesto Reclamado!</h2>
          <p className="text-sm text-stone-600">
            Tu proyecto ha sido indexado y reordenado en el leaderboard de <strong>{activeCategory.name_es}</strong>.
            Hemos enviado un comprobante a tu correo.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs text-stone-600">
          El tracking de clics está activo de inmediato. Los clics serán redirigidos a tu web con estadísticas en tiempo real.
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/${activeCategory.slug}`)}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white font-bold text-sm transition shadow-xs"
          >
            Ver Leaderboard Actualizado →
          </button>
          <button
            onClick={() => router.push('/actividad')}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm transition border border-stone-200"
          >
            Ver Feed en Vivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2EE] border border-[#FADCD3] text-[#E05A38] text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 fill-[#E05A38]" />
              Subasta en Tiempo Real
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Reclamar Puesto en {activeCategory.name_es}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Consigue visibilidad permanente y tráfico directo de fundadores y clientes en toda LATAM.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {paypalSubmitted ? (
            <div className="p-6 rounded-3xl bg-white border border-[#003087]/20 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2.5 text-[#003087] font-bold text-sm">
                  <span className="w-8 h-8 rounded-full bg-[#003087] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    P
                  </span>
                  <div>
                    <div className="leading-tight font-extrabold text-[#003087]">Pago Seguro con PayPal</div>
                    <div className="text-[10px] font-normal text-stone-500">Transacción internacional protegida</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ⚡ Verificación Automática
                </span>
              </div>

              <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 space-y-2 text-xs text-stone-700">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Proyecto a postular:</span>
                  <span className="font-bold text-stone-900 truncate max-w-[200px]">{name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Puesto a reclamar:</span>
                  <span className="font-semibold text-stone-900">Puesto #{targetPos} ({activeCategory.name_es})</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-sky-200/60">
                  <span className="font-bold text-stone-900">Total a pagar:</span>
                  <span className="font-black text-lg text-[#003087]">${offeredAmountUSD} USD</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 text-center leading-relaxed">
                Haz clic en el botón oficial de <strong>PayPal</strong> abajo para autorizar el cobro. Se abrirá la pasarela segura y tu puesto se activará automáticamente al finalizar.
              </p>

              <div className="pt-1">
                <PayPalScriptProvider
                  options={{
                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
                    currency: 'USD',
                    intent: 'capture',
                  }}
                >
                  <PayPalButtons
                    style={{
                      layout: 'vertical',
                      shape: 'rect',
                      color: 'gold',
                      label: 'pay',
                      height: 48,
                    }}
                    disabled={isSubmitting}
                    createOrder={async () => {
                      setIsSubmitting(true);
                      setErrorMessage(null);
                      try {
                        const res = await fetch('/api/checkout/paypal/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bidId: paypalInfo?.bidId }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.orderId) {
                          throw new Error(data.error || 'No se pudo generar la orden de PayPal.');
                        }
                        return data.orderId;
                      } catch (err: any) {
                        setErrorMessage(err.message || 'Error al conectar con PayPal.');
                        setIsSubmitting(false);
                        throw err;
                      }
                    }}
                    onApprove={async (data) => {
                      try {
                        setIsSubmitting(true);
                        const res = await fetch('/api/checkout/paypal/capture', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            orderId: data.orderID,
                            bidId: paypalInfo?.bidId,
                          }),
                        });
                        const captureData = await res.json();
                        if (!res.ok) {
                          throw new Error(captureData.error || 'Error al capturar el pago en PayPal.');
                        }
                        setSuccessPayment(true);
                        confetti({
                          particleCount: 140,
                          spread: 80,
                          origin: { y: 0.6 },
                        });
                      } catch (err: any) {
                        setErrorMessage(err.message || 'Error al acreditar el pago de PayPal.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    onCancel={() => {
                      setIsSubmitting(false);
                    }}
                    onError={(err) => {
                      console.error('PayPal Smart Button error:', err);
                      setErrorMessage('Hubo un inconveniente con PayPal. Verifica tu conexión o intenta nuevamente.');
                      setIsSubmitting(false);
                    }}
                  />
                </PayPalScriptProvider>
              </div>

              <div className="pt-2 text-center border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setPaypalSubmitted(false)}
                  className="text-xs text-stone-500 hover:text-stone-900 transition font-medium underline"
                >
                  ← Volver al formulario y modificar datos
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  1. Selecciona Categoría
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCatId(cat.id);
                        router.push(`/${cat.slug}/reclamar`);
                      }}
                      className={`p-2.5 rounded-full text-xs font-semibold text-center border transition ${
                        cat.id === activeCategory.id
                          ? 'bg-[#E05A38] text-white border-[#E05A38] font-bold shadow-xs'
                          : 'bg-[#FAF8F5] text-stone-600 border-[#EAE6DF] hover:text-stone-950 hover:bg-white'
                      }`}
                    >
                      {cat.name_es.split('&')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Position Selection */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    2. Puesto a Reclamar
                  </label>
                  <span className="text-xs text-[#E05A38] font-bold">
                    Mínimo requerido: ${requiredMinimumUSD} USD
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {[1, 2, 3, 4, 5].map((pos) => {
                    const isOccupied = catListings.some((l) => l.position === pos);
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setTargetPos(pos)}
                        className={`flex-1 py-2 px-3 rounded-full text-xs font-bold border transition shrink-0 ${
                          targetPos === pos
                            ? 'bg-[#E05A38] text-white border-[#E05A38] shadow-xs'
                            : 'bg-white text-stone-600 border-[#EAE6DF] hover:text-stone-900'
                        }`}
                      >
                        #{pos} {isOccupied ? '(Ocupado)' : '(Libre)'}
                      </button>
                    );
                  })}
                </div>

                {occupant && (
                  <p className="text-[11px] text-stone-500">
                    Ocupante actual: <strong className="text-stone-900">{occupant.name}</strong> con ${formatUSDOnly(occupant.current_bid_cents)}. Para superarlo debes pujar al menos <strong className="text-[#E05A38]">${requiredMinimumUSD} USD</strong>.
                  </p>
                )}
              </div>

              {/* Project Info */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  3. Datos de tu Proyecto
                </label>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">
                    Nombre del Proyecto / Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Mi Proyecto / Startup"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                    <span>Tagline / Descripción corta (máx. 120 caracteres) *</span>
                    <span>{tagline.length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="ej. La plataforma todo en uno para escalar tu negocio en LATAM"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      URL de Destino *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://tuweb.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      URL del Logo (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://tuweb.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      Tu Nombre / Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Alex Gómez"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      Email de Facturación & Reportes *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@tuempresa.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-stone-900 text-xs focus:border-[#E05A38] focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Country & Identity Document */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-[#E05A38]" />
                    <span>4. País y Documento de Identidad del Titular *</span>
                  </label>
                  <span className="text-[11px] text-stone-500 hidden sm:inline">
                    Documento oficial según tu país
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  {/* País */}
                  <div className="flex flex-col">
                    <label className="text-[11px] text-stone-600 font-medium h-6 sm:h-7 flex items-end mb-1.5 leading-tight">
                      <span>País de Residencia *</span>
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-[#EAE6DF] text-stone-900 text-xs font-semibold focus:border-[#E05A38] focus:outline-none transition cursor-pointer shadow-2xs"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Documento */}
                  <div className="flex flex-col">
                    <label className="text-[11px] text-stone-600 font-medium h-6 sm:h-7 flex items-end mb-1.5 leading-tight">
                      <span>Tipo de Documento *</span>
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-[#EAE6DF] text-stone-900 text-xs font-semibold focus:border-[#E05A38] focus:outline-none transition cursor-pointer shadow-2xs"
                    >
                      {currentCountry.documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Número de Documento */}
                  <div className="flex flex-col">
                    <label className="text-[11px] text-stone-600 font-medium h-6 sm:h-7 flex items-end mb-1.5 leading-tight truncate">
                      <span>Número de {currentDoc?.id || 'Documento'} *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={currentDoc?.placeholder || 'ej. 12345678'}
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#EAE6DF] text-stone-900 text-xs font-mono focus:border-[#E05A38] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Clarification banner adapting to selected country */}
                <div className="text-[11px] text-stone-600 bg-white p-3 rounded-xl border border-[#EAE6DF] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{currentCountry.flag}</span>
                    <span>
                      {countryCode === 'BR' ? (
                        <>Para compradores en <strong>Brasil</strong> se solicita CPF o CNPJ conforme a normativas locales.</>
                      ) : (
                        <>
                          Titular registrado con <strong>{currentDoc?.name.split('(')[0].trim()} ({currentCountry.name})</strong>.
                          Al pagar desde fuera de Brasil tu documento oficial es válido y no necesitas poseer un CPF brasileño.
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 shrink-0 font-bold uppercase">
                    {docType}
                  </span>
                </div>
              </div>

              {/* Amount to Bid */}
              <div className="p-4 rounded-2xl bg-[#FDF2EE] border border-[#FADCD3] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    5. Monto a Pujar (USD)
                  </label>
                  <span className="text-base font-black text-[#E05A38]">
                    ${offeredAmountUSD} USD
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={requiredMinimumUSD}
                    step={1}
                    value={offeredAmountUSD}
                    onChange={(e) => setOfferedAmountUSD(Math.max(requiredMinimumUSD, parseInt(e.target.value || '0', 10)))}
                    className="w-32 px-4 py-2.5 rounded-xl bg-white border border-[#E05A38] text-stone-900 text-base font-bold focus:outline-none text-center shadow-xs"
                  />
                  <div className="flex-1 text-xs text-stone-600">
                    {currency !== 'USD' && (
                      <span className="block font-semibold text-stone-800">
                        ≈ {formatCents(offeredAmountUSD * 100, currency)}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-500">
                      Pagas una sola vez. Tu puesto permanece hasta que seas superado.
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  6. Método de Pago
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('mercadopago')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      paymentProvider === 'mercadopago'
                        ? 'bg-[#FDF2EE] border-[#E05A38] text-stone-900 shadow-xs'
                        : 'bg-white border-[#EAE6DF] text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Mercado Pago</div>
                      <div className="text-[10px] text-stone-500">Tarjetas / Saldo MP</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentProvider('stripe_pix')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      paymentProvider === 'stripe_pix'
                        ? 'bg-[#FDF2EE] border-[#E05A38] text-stone-900 shadow-xs'
                        : 'bg-white border-[#EAE6DF] text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Pix / Brasil 🇧🇷</div>
                      <div className="text-[10px] text-stone-500">Instantáneo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentProvider('paypal')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      paymentProvider === 'paypal'
                        ? 'bg-[#FDF2EE] border-[#E05A38] text-stone-900 shadow-xs'
                        : 'bg-white border-[#EAE6DF] text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#003087] text-white flex items-center justify-center font-black text-xs shrink-0">
                      P
                    </div>
                    <div>
                      <div className="text-xs font-bold">PayPal 🌐</div>
                      <div className="text-[10px] text-stone-500">Internacional / USD</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#E05A38] hover:bg-[#CD4C29] text-white font-bold text-sm tracking-wide shadow-md shadow-[#E05A38]/25 hover:scale-[1.01] active:scale-[0.99] transition transform disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Procesando Puja...'
                  : paymentProvider === 'paypal'
                  ? `Proceder a pagar $${offeredAmountUSD} USD con PayPal →`
                  : paymentProvider === 'stripe_pix'
                  ? `Pagar $${offeredAmountUSD} USD con Pix →`
                  : `Pagar $${offeredAmountUSD} USD con Mercado Pago →`}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pago encriptado con redirección segura y factura por email</span>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Live Preview & FAQ */}
      <div className="lg:col-span-5 space-y-6">
        {/* Live Preview Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#E05A38]" />
              Vista Previa en Vivo
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Como se verá en el top</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-[#3B82F6] shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex flex-col items-center justify-center font-black shrink-0 shadow-xs">
                <span className="text-[11px] leading-tight">#{targetPos}</span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-stone-100 border border-[#EAE6DF] overflow-hidden shrink-0 flex items-center justify-center font-bold text-stone-800">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  (name || 'TU').slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-stone-900 text-sm flex items-center gap-1">
                  <span className="truncate">{name || 'Nombre de tu Proyecto'}</span>
                  <ArrowUpRight className="w-3 h-3 text-stone-400" />
                </div>
                <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                  {tagline || 'Aquí aparecerá tu propuesta de valor y mensaje para atraer clics de toda Latinoamérica.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-[11px]">
              <span className="text-stone-500">0 clics registrados</span>
              <span className="font-black text-[#1E40AF]">${offeredAmountUSD} USD</span>
            </div>
          </div>
        </div>

        {/* Value Prop Box */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAE6DF] shadow-sm space-y-3 text-xs text-stone-600">
          <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#E05A38]" />
            ¿Por qué pujar en eltop.lat?
          </h4>
          <ul className="space-y-2 leading-relaxed">
            <li>
              🎯 <strong>Tráfico altamente cualificado:</strong> Desarrolladores, fundadores de startups e inversores de LATAM exploran este leaderboard todos los días.
            </li>
            <li>
              ⚡ <strong>Backlink y posicionamiento:</strong> Enlace público directo dofollow con tracking granular de clics.
            </li>
            <li>
              🛡️ <strong>Sin suscripciones mensuales:</strong> Pagas una única puja y mantienes tu posición hasta que otro proyecto te supere.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
