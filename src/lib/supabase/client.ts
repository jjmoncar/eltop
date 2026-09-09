import { createBrowserClient } from '@supabase/ssr';

export function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const url = sanitizeSupabaseUrl(rawUrl);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(url, key);
}
