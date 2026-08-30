import { CurrencyCode, CurrencyRate } from '@/types/database';

export const CURRENCIES: Record<CurrencyCode, CurrencyRate> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólares (USD)',
    flag: '🇺🇸',
    rateAgainstUSD: 1.0,
    decimals: 2,
  },
  ARS: {
    code: 'ARS',
    symbol: '$',
    name: 'Pesos Argentinos (ARS)',
    flag: '🇦🇷',
    rateAgainstUSD: 1250.0,
    decimals: 0,
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Reais Brasileiros (BRL / Pix)',
    flag: '🇧🇷',
    rateAgainstUSD: 5.60,
    decimals: 2,
  },
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Pesos Colombianos (COP)',
    flag: '🇨🇴',
    rateAgainstUSD: 4150.0,
    decimals: 0,
  },
  CLP: {
    code: 'CLP',
    symbol: '$',
    name: 'Pesos Chilenos (CLP)',
    flag: '🇨🇱',
    rateAgainstUSD: 940.0,
    decimals: 0,
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    name: 'Soles Peruanos (PEN)',
    flag: '🇵🇪',
    rateAgainstUSD: 3.75,
    decimals: 2,
  },
  VES: {
    code: 'VES',
    symbol: 'Bs.',
    name: 'Bolívares / USDT (VES)',
    flag: '🇻🇪',
    rateAgainstUSD: 65.0,
    decimals: 2,
  },
};

export function formatCents(cents: number, currency: CurrencyCode = 'USD'): string {
  const usdAmount = cents / 100;
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  const converted = usdAmount * config.rateAgainstUSD;

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(usdAmount);
  }

  const formattedValue = new Intl.NumberFormat('es-419', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(converted);

  return `${config.symbol} ${formattedValue} ${config.code}`;
}

export function formatUSDOnly(cents: number): string {
  const usdAmount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(usdAmount);
}
