// FX rates, USD-denominated. Updated occasionally alongside pricing-seed.
// Client-safe (no secrets). Used by the price-display currency switcher.

export const FX: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, INR: 0.012, NPR: 0.0075, PKR: 0.0036,
  BRL: 0.20, MXN: 0.058, TRY: 0.031, JPY: 0.0066, KRW: 0.00072,
  IDR: 0.000063, PHP: 0.018, VND: 0.000040, THB: 0.028, MYR: 0.22,
  SGD: 0.74, AUD: 0.66, NZD: 0.60, CAD: 0.73, CHF: 1.12,
  ZAR: 0.054, EGP: 0.021, AED: 0.27, SAR: 0.27, NGN: 0.00068,
  PLN: 0.25, RON: 0.22, CZK: 0.044, HUF: 0.0028, RUB: 0.011,
  CLP: 0.0011, COP: 0.00025, ARS: 0.0012, PEN: 0.27,
  DKK: 0.14, SEK: 0.095, NOK: 0.094,
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', KRW: '₩',
  CNY: '¥', NPR: 'रू', BRL: 'R$', AUD: 'A$', CAD: 'C$',
};

// Convert an amount + source currency to a target currency.
// Returns null if either rate is missing.
export function convert(amount: number | null | undefined, from: string | null | undefined, to: string): number | null {
  if (amount == null || !from) return null;
  const src = FX[from.toUpperCase()];
  const dst = FX[to.toUpperCase()];
  if (!src || !dst) return null;
  return (amount * src) / dst;
}

export function fmt(amount: number | null, currency: string): string {
  if (amount == null) return '—';
  const sym = CURRENCY_SYMBOL[currency] || '';
  // Round sensibly by magnitude
  const abs = Math.abs(amount);
  const digits = abs >= 1000 ? 0 : abs >= 10 ? 2 : 2;
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return sym ? `${sym}${formatted}` : `${formatted} ${currency}`;
}

export const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'NPR', 'BRL', 'JPY', 'AUD', 'CAD', 'AED', 'TRY', 'MXN', 'ZAR'];
