import { NextRequest, NextResponse } from 'next/server';
import { locales, Locale } from './src/lib/i18n';

function detectLocale(request: NextRequest): Locale {
  const country = (request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || '').toUpperCase();
  if (country === 'BR') return 'pt-br';
  if (country === 'US') return 'en';

  const accepted = request.headers.get('accept-language')?.toLowerCase() || '';
  if (accepted.startsWith('pt')) return 'pt-br';
  if (accepted.startsWith('en')) return 'en';
  return 'es';
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const firstSegment = pathname.split('/')[1];

  if (locales.includes(firstSegment as Locale)) {
    const pathnameWithoutLocale = pathname.replace(/^\/(es|en|pt-br)(?=\/|$)/, '') || '/';
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathnameWithoutLocale;
    return NextResponse.rewrite(rewriteUrl);
  }

  const locale = detectLocale(request);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};