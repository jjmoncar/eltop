export const locales = ['es', 'en', 'pt-br'] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
  'pt-br': 'PT',
};

export function getLocaleFromPath(pathname: string): Locale {
  const firstSegment = pathname.split('/')[1];
  return locales.includes(firstSegment as Locale) ? firstSegment as Locale : 'es';
}

export function localizedHref(pathname: string, locale: Locale): string {
  const withoutLocale = pathname.replace(/^\/(es|en|pt-br)(?=\/|$)/, '') || '/';
  return `/${locale}${withoutLocale.startsWith('/') ? withoutLocale : `/${withoutLocale}`}`;
}