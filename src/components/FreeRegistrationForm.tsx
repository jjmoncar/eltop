'use client';

import { useState } from 'react';
import { CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { Category } from '@/types/database';

interface Props {
  categories: Category[];
  currentCategory: Category;
}

export function FreeRegistrationForm({ categories, currentCategory }: Props) {
  const [categoryId, setCategoryId] = useState(currentCategory.id);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [url, setUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/entries/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, name, tagline, url, logoUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar tu entrada.');
      setStatus('success');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar tu entrada.');
      setStatus('idle');
    }
  }

  if (status === 'success') {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <h2 className="mt-3 text-lg font-black text-emerald-950">Entrada registrada gratis</h2>
        <p className="mt-1 text-sm text-emerald-800">Tu proyecto ya aparece en el ranking. Puedes desafiar un puesto con una puja cuando quieras.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[#EAE6DF] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-600"><Gift className="h-5 w-5" /></div>
        <div>
          <h2 className="text-xl font-black text-stone-900">Aparece gratis en el ranking</h2>
          <p className="mt-1 text-sm text-stone-500">Las entradas gratuitas ocupan los huecos disponibles y después se ordenan por antigüedad.</p>
        </div>
      </div>
      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <input required minLength={2} maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del proyecto" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name_es}</option>)}
        </select>
        <input required minLength={5} maxLength={120} value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="Qué haces, en una frase" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 sm:col-span-2" />
        <input required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://tu-proyecto.com" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
        <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="Logo URL (opcional)" className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
        <button disabled={status === 'loading'} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:col-span-2">
          {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar gratis
        </button>
      </form>
    </section>
  );
}