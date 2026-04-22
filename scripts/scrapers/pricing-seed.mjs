// Pricing seed: curated regional prices for top paid services.
// Data is version-controlled and re-applied every scrape run — "automated enough".
// Sources (checked periodically): each service's official /premium or /plans page per country.
// Feel free to update values here; pushes flow to prod on next scrape cron.

import { applyPricing } from '../lib/update.mjs';

// Loose USD conversions used only when the service publishes in local currency.
// Ballpark; the USD field is meant for sorting/filtering cheapness, not invoicing.
const FX = {
  USD: 1, EUR: 1.08, GBP: 1.27, INR: 0.012, NPR: 0.0075, PKR: 0.0036,
  BRL: 0.20, MXN: 0.058, TRY: 0.031, JPY: 0.0066, KRW: 0.00072,
  IDR: 0.000063, PHP: 0.018, VND: 0.000040, THB: 0.028, MYR: 0.22,
  SGD: 0.74, AUD: 0.66, NZD: 0.60, CAD: 0.73, CHF: 1.12,
  ZAR: 0.054, EGP: 0.021, AED: 0.27, SAR: 0.27, NGN: 0.00068,
  PLN: 0.25, RON: 0.22, CZK: 0.044, HUF: 0.0028, RUB: 0.011,
  CLP: 0.0011, COP: 0.00025, ARS: 0.0012, PEN: 0.27,
  DKK: 0.14, SEK: 0.095, NOK: 0.094,
};

const usd = (amt, cur) => {
  const f = FX[cur];
  if (!f) return null;
  return Math.round(amt * f * 100) / 100;
};

const p = (iso, price_local, currency, tier = 'standard', period = 'month') => ({
  iso, tier, price_local, currency, price_usd: usd(price_local, currency), period
});

// ============== NETFLIX (Standard tier, monthly) ==============
const netflix = [
  p('US', 15.49, 'USD'), p('GB', 10.99, 'GBP'), p('CA', 16.49, 'CAD'),
  p('DE', 12.99, 'EUR'), p('FR', 13.49, 'EUR'), p('IT', 12.99, 'EUR'),
  p('ES', 12.99, 'EUR'), p('NL', 11.99, 'EUR'), p('IE', 13.85, 'EUR'),
  p('AU', 16.99, 'AUD'), p('NZ', 17.99, 'NZD'),
  p('JP', 1490, 'JPY'), p('KR', 13500, 'KRW'), p('SG', 13.98, 'SGD'),
  p('IN', 499, 'INR'), p('PK', 850, 'PKR'), p('BD', 399, 'INR'),
  p('BR', 39.90, 'BRL'), p('MX', 219, 'MXN'), p('AR', 4999, 'ARS'),
  p('TR', 149.99, 'TRY'), p('RU', 599, 'RUB'),
  p('AE', 39, 'AED'), p('SA', 37, 'SAR'), p('ZA', 159, 'ZAR'),
  p('EG', 165, 'EGP'), p('NG', 2900, 'NGN'),
  p('PL', 43, 'PLN'), p('SE', 119, 'SEK'), p('NO', 149, 'NOK'), p('DK', 99, 'DKK'),
];

// ============== SPOTIFY Premium Individual ==============
const spotify = [
  p('US', 10.99, 'USD'), p('GB', 10.99, 'GBP'), p('CA', 10.99, 'CAD'),
  p('DE', 10.99, 'EUR'), p('FR', 10.99, 'EUR'), p('IT', 10.99, 'EUR'),
  p('ES', 10.99, 'EUR'), p('NL', 10.99, 'EUR'), p('IE', 10.99, 'EUR'),
  p('AU', 13.99, 'AUD'), p('NZ', 14.99, 'NZD'),
  p('JP', 980, 'JPY'), p('KR', 10900, 'KRW'), p('SG', 10.98, 'SGD'),
  p('IN', 119, 'INR'), p('PK', 339, 'PKR'),
  p('BR', 21.90, 'BRL'), p('MX', 129, 'MXN'), p('AR', 1999, 'ARS'),
  p('TR', 29.99, 'TRY'),
  p('AE', 21.99, 'AED'), p('SA', 21.99, 'SAR'), p('ZA', 69.99, 'ZAR'),
  p('EG', 59.99, 'EGP'), p('NG', 900, 'NGN'),
  p('PL', 23.99, 'PLN'), p('SE', 129, 'SEK'), p('NO', 119, 'NOK'), p('DK', 109, 'DKK'),
  p('NP', 119, 'NPR'),
];

// ============== YOUTUBE (Premium Individual) — service slug may not exist yet; guard via try ==============
const youtubePremium = [
  p('US', 13.99, 'USD'), p('GB', 12.99, 'GBP'), p('DE', 12.99, 'EUR'),
  p('FR', 12.99, 'EUR'), p('CA', 13.99, 'CAD'), p('AU', 16.99, 'AUD'),
  p('IN', 149, 'INR'), p('BR', 24.90, 'BRL'), p('JP', 1280, 'JPY'),
];

// ============== CHATGPT Plus (flat USD worldwide where available) ==============
const chatgpt = [
  p('US', 20, 'USD'), p('GB', 20, 'USD'), p('CA', 20, 'USD'), p('AU', 20, 'USD'),
  p('DE', 20, 'USD'), p('FR', 20, 'USD'), p('JP', 20, 'USD'), p('IN', 20, 'USD'),
  p('BR', 20, 'USD'), p('MX', 20, 'USD'),
];

// ============== CLAUDE Pro (flat USD) ==============
const claude = [
  p('US', 20, 'USD'), p('GB', 20, 'USD'), p('CA', 20, 'USD'), p('AU', 20, 'USD'),
  p('DE', 20, 'USD'), p('FR', 20, 'USD'), p('JP', 20, 'USD'), p('IN', 20, 'USD'),
];

async function seed(slug, rows) {
  try {
    await applyPricing(slug, 'pricing-seed', rows);
  } catch (e) {
    // If a service slug isn't in DB yet, skip quietly.
    console.warn(`[pricing-seed] skip ${slug}: ${e.message}`);
  }
}

async function run() {
  await seed('netflix', netflix);
  await seed('spotify', spotify);
  await seed('youtube-premium', youtubePremium);
  await seed('chatgpt', chatgpt);
  await seed('claude', claude);
  console.log('pricing-seed done');
}

run().catch((e) => { console.error(e); process.exit(1); });
