// Edge-safe auth: uses Web Crypto (globalThis.crypto.subtle), no node:crypto.

const COOKIE_NAME = 'admin_session';
const encoder = new TextEncoder();

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'dev-insecure-secret-change-me';
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return acc === 0;
}

export async function makeToken(): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacHex(ts);
  return `${ts}.${sig}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > 1000 * 60 * 60 * 24 * 30) return false;
  const expected = await hmacHex(ts);
  return timingSafeEqualStr(sig, expected);
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqualStr(password, expected);
}

export const ADMIN_COOKIE = COOKIE_NAME;
