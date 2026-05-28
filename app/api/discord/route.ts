// /api/discord — Discord interactions webhook endpoint.
//
// Slash command flow: /iia <service> <country>
//   → bot replies with availability + workaround + affiliate link
//   → distributed wherever the bot is installed (any Discord server)
//
// To set up (one-time, outside this code):
//   1. Create Discord application at discord.com/developers/applications
//   2. Add slash command: /iia with options 'service' and 'country'
//   3. Set Interactions Endpoint URL to https://isitavailablein.com/api/discord
//   4. Set DISCORD_PUBLIC_KEY env var on CF Pages from the app's settings
//   5. Generate install link from OAuth2 URL Generator (scopes: bot, applications.commands)
//   6. Share the install link — anyone with Manage Server can add the bot
//
// Discord requires Ed25519 signature verification on every request.
// On CF Pages edge runtime we use Web Crypto's Ed25519 (now supported).

import { NextRequest, NextResponse } from 'next/server';
import { queryRaw } from '@/lib/db';

export const runtime = 'edge';

// Discord interaction types
const PING = 1;
const APPLICATION_COMMAND = 2;
// Discord response types
const PONG = 1;
const CHANNEL_MESSAGE_WITH_SOURCE = 4;

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const pubKey = process.env.DISCORD_PUBLIC_KEY;
  if (!pubKey) return false;
  const signature = req.headers.get('X-Signature-Ed25519') || '';
  const timestamp = req.headers.get('X-Signature-Timestamp') || '';
  if (!signature || !timestamp) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(pubKey),
      { name: 'Ed25519' } as any,
      false,
      ['verify']
    );
    const sigBytes = hexToBytes(signature);
    const data = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify({ name: 'Ed25519' } as any, key, sigBytes, data);
  } catch {
    return false;
  }
}

function escapeMd(s: string): string {
  return s.replace(/[*_`~|>]/g, (c) => '\\' + c);
}

function statusEmoji(s: string): string {
  return s === 'yes' ? '✅' : s === 'no' ? '❌' : s === 'partial' ? '⚠️' : s === 'vpn_only' ? '🔐' : '❓';
}

async function handleCommand(name: string, options: any[]) {
  const get = (k: string) => options?.find((o) => o.name === k)?.value as string | undefined;
  if (name !== 'iia') {
    return { content: 'Unknown command.' };
  }
  const serviceQuery = (get('service') || '').toLowerCase().trim();
  const countryQuery = (get('country') || '').toLowerCase().trim();
  if (!serviceQuery || !countryQuery) {
    return { content: 'Usage: `/iia service:<name> country:<name>`. Example: `/iia service:chatgpt country:nepal`' };
  }

  try {
    // Look up service + country by slug, name, or ISO2
    const svc = await queryRaw(
      `SELECT id, slug, name FROM services WHERE lower(slug) = ? OR lower(name) = ? LIMIT 1`,
      [serviceQuery, serviceQuery]
    );
    if (!svc.length) {
      return { content: `Couldn't find service "${escapeMd(serviceQuery)}". Browse the full list: <https://isitavailablein.com/services>` };
    }
    const country = await queryRaw(
      `SELECT iso2, slug, name, flag FROM countries
       WHERE lower(slug) = ? OR lower(name) = ? OR lower(iso2) = ?
       LIMIT 1`,
      [countryQuery, countryQuery, countryQuery]
    );
    if (!country.length) {
      return { content: `Couldn't find country "${escapeMd(countryQuery)}". Browse the full list: <https://isitavailablein.com/countries>` };
    }
    const s = svc[0] as any;
    const c = country[0] as any;

    const av = await queryRaw(
      `SELECT status, workaround, last_verified FROM availability WHERE service_id = ? AND country_iso2 = ?`,
      [Number(s.id), String(c.iso2)]
    );
    const a = av[0] as any || { status: 'unknown' };

    const emoji = statusEmoji(a.status);
    const url = `https://isitavailablein.com/is-${s.slug}-available-in-${c.slug}`;
    const blocked = a.status === 'no' || a.status === 'vpn_only';

    let content = `**${emoji} ${escapeMd(s.name)} in ${c.flag || ''} ${escapeMd(c.name)}: ${a.status}**`;
    if (a.workaround) content += `\n📝 Workaround: ${escapeMd(a.workaround)}`;
    content += `\n🔗 Full details: <${url}>`;
    if (blocked) {
      content += `\n💡 Unblock with NordVPN: <https://isitavailablein.com/best-vpn-for/${c.slug}>`;
    }
    if (a.last_verified) content += `\n_Last verified: ${a.last_verified}_`;
    return { content };
  } catch (e: any) {
    return { content: `Error looking that up. Try the website: https://isitavailablein.com` };
  }
}

// Browser GET — returns a friendly placeholder so route registers + humans
// who hit the URL directly see something useful, not a 404.
export async function GET() {
  return NextResponse.json({
    name: 'IsItAvailableIn — Discord interactions endpoint',
    description: 'POST endpoint for Discord slash-command interactions. Configured for the /iia command. Direct GET requests are not supported.',
    docs: 'https://isitavailablein.com/api-docs',
    configured: !!process.env.DISCORD_PUBLIC_KEY,
  });
}

export async function POST(req: NextRequest) {
  let body = '';
  try {
    body = await req.text();
    const valid = await verifySignature(req, body);
    if (!valid) {
      return new NextResponse('invalid signature', { status: 401 });
    }
    const payload = JSON.parse(body);
    if (payload.type === PING) {
      return NextResponse.json({ type: PONG });
    }
    if (payload.type === APPLICATION_COMMAND) {
      const data = payload.data || {};
      const result = await handleCommand(data.name, data.options);
      return NextResponse.json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: result,
      });
    }
    return new NextResponse('unsupported', { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: 'discord_handler_error', message: e?.message || 'unknown' }, { status: 500 });
  }
}
