'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category, Listing, CurrencyCode } from '@/types/database';
import { formatUSDOnly, formatCents } from '@/lib/currencies';
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
  HelpCircle,
  Eye,
} from 'lucide-react';

interface Props {
  categories: Category[];
  currentCategory: Category;
  listings: Listing[];
  targetPosParam?: number;
  currency: CurrencyCode;
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
  const [offeredAmountUSD, setOfferedAmountUSD] = useState<number>(20);
  const [paymentProvider, setPaymentProvider] = useState<'mercadopago' | 'stripe_pix' | 'usdt_manual'>('mercadopago');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<boolean>(false);
  const [txHashInput, setTxHashInput] = useState('');
  const [usdtSubmitted, setUsdtSubmitted] = useState(false);

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
        }),
      });

      const bidData = await bidRes.json();

      if (!bidRes.ok) {
        throw new Error(bidData.error || 'Error al registrar la puja.');
      }

      const bidId = bidData.bidId;

      if (paymentProvider === 'usdt_manual') {
        setUsdtSubmitted(true);
        setIsSubmitting(false);
        return;
      }

      // 2. Create Checkout Preference
      const checkoutRes = await fetch('/api/checkout/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId }),
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

  const handleManualUsdtConfirm = async () => {
    if (!txHashInput) {
      alert('Ingresa el Hash de transacción (TXID) de tu transferencia USDT.');
      return;
    }
    alert('Transacción recibida. El administrador verificará tu pago y activará el puesto en minutos.');
    router.push(`/${activeCategory.slug}`);
  };

  if (successPayment) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">¡Pago Exitoso y Puesto Reclamado!</h2>
          <p className="text-sm text-slate-300">
            Tu proyecto ha sido indexado y reordenado en el leaderboard de <strong>{activeCategory.name_es}</strong>.
            Hemos enviado un comprobante a tu correo.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
          El tracking de clics está activo de inmediato. Los clics serán redirigidos a tu web con estadísticas en tiempo real.
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/${activeCategory.slug}`)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
          >
            Ver Leaderboard Actualizado →
          </button>
          <button
            onClick={() => router.push('/actividad')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
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
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              Subasta en Tiempo Real
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Reclamar Puesto en {activeCategory.name_es}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Consigue visibilidad permanente y tráfico directo de fundadores y clientes en toda LATAM.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {usdtSubmitted ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Coins className="w-5 h-5" />
                <span>Pago con USDT (TRC20 / Polygon)</span>
              </div>
              <p className="text-xs text-slate-300">
                Transfiere exactamente <strong>${offeredAmountUSD} USDT</strong> a la siguiente wallet:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
                TY1234567890SampleWalletAddressLATAM
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold">
                  Pega aquí el Hash / TXID de tu transferencia:
                </label>
                <input
                  type="text"
                  placeholder="ej. e65487f...987a"
                  value={txHashInput}
                  onChange={(e) => setTxHashInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleManualUsdtConfirm}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Notificar Pago Enviado
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
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
                      className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition ${
                        cat.id === activeCategory.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {cat.name_es.split('&')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Position Selection */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    2. Puesto a Reclamar
                  </label>
                  <span className="text-xs text-amber-400 font-semibold">
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
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition shrink-0 ${
                          targetPos === pos
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        #{pos} {isOccupied ? '(Ocupado)' : '(Libre)'}
                      </button>
                    );
                  })}
                </div>

                {occupant && (
                  <p className="text-[11px] text-slate-400">
                    Ocupante actual: <strong className="text-white">{occupant.name}</strong> con ${formatUSDOnly(occupant.current_bid_cents)}. Para superarlo debes pujar al menos <strong>${requiredMinimumUSD} USD</strong>.
                  </p>
                )}
              </div>

              {/* Project Info */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  3. Datos de tu Proyecto
                </label>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Nombre del Proyecto / Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. FacturaFast LATAM"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Tagline / Descripción corta (máx. 120 caracteres) *</span>
                    <span>{tagline.length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="ej. La plataforma de facturación electrónica automática para toda la región"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      URL de Destino *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://tuweb.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      URL del Logo (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://tuweb.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Tu Nombre / Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Alex Gómez"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Email de Facturación & Reportes *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@tuempresa.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Amount to Bid */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    4. Monto a Pujar (USD)
                  </label>
                  <span className="text-sm font-black text-amber-400">
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
                    className="w-32 px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-white text-base font-bold focus:border-amber-400 focus:outline-none text-center"
                  />
                  <div className="flex-1 text-xs text-slate-400">
                    {currency !== 'USD' && (
                      <span className="block font-medium text-slate-300">
                        ≈ {formatCents(offeredAmountUSD * 100, currency)}
                      </span>
                    )}
                    <span className="text-[11px]">
                      Pagas una sola vez. Tu puesto permanece hasta que seas superado.
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  5. Método de Pago
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('mercadopago')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      paymentProvider === 'mercadopago'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Mercado Pago</div>
                      <div className="text-[10px] text-slate-400">Tarjetas / Saldo MP</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentProvider('stripe_pix')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      paymentProvider === 'stripe_pix'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Pix / Brasil 🇧🇷</div>
                      <div className="text-[10px] text-slate-400">Instantáneo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentProvider('usdt_manual')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      paymentProvider === 'usdt_manual'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">USDT / Cripto 🇻🇪</div>
                      <div className="text-[10px] text-slate-400">TRC20 / Polygon</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition transform disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Procesando Puja...'
                  : paymentProvider === 'usdt_manual'
                  ? `Proceder a pagar $${offeredAmountUSD} USDT →`
                  : `Pagar $${offeredAmountUSD} USD con ${paymentProvider === 'mercadopago' ? 'Mercado Pago' : 'Pix'} →`}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pago encriptado con redirección segura y factura por email</span>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Live Preview & FAQ */}
      <div className="lg:col-span-5 space-y-6">
        {/* Live Preview Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Vista Previa en Vivo
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">Como se verá en el top</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/90 border border-amber-500/50 shadow-lg space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex flex-col items-center justify-center font-black shrink-0">
                <span className="text-[11px] leading-tight">#{targetPos}</span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-amber-400">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  (name || 'TU').slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm flex items-center gap-1">
                  <span className="truncate">{name || 'Nombre de tu Proyecto'}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                  {tagline || 'Aquí aparecerá tu propuesta de valor y mensaje para atraer clics de toda Latinoamérica.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">0 clics registrados</span>
              <span className="font-black text-amber-400">${offeredAmountUSD} USD</span>
            </div>
          </div>
        </div>

        {/* Value Prop Box */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs text-slate-400">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
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
