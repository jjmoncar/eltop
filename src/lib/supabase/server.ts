import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

export async function createClient() {
  const cookieStore = await cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const url = sanitizeSupabaseUrl(rawUrl);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Can happen in Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Can happen in Server Components
        }
      },
    },
  });
}
