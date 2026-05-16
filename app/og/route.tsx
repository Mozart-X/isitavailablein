// Dynamic OG image generator. Returns a 1200x630 PNG with the page's
// title rendered on a branded background. Edge-runtime, no fonts loaded
// (uses default sans-serif via system stack so we don't blow the bundle).
//
// Usage from any metadata block:
//   openGraph: { images: [`/og?t=${encodeURIComponent(title)}&s=blocked`] }
//
// Why this matters: without OG images, every share on Twitter/Reddit/
// LinkedIn/Discord shows a blank unfurl. With one, the unfurl gets a
// branded card that 2-5× increases click-through. Free viral surface.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const COLORS = {
  default: { bg1: '#0a2540', bg2: '#0066cc', accent: '#ffc107' },
  blocked: { bg1: '#5a0e0e', bg2: '#cc2222', accent: '#ffc107' },
  available: { bg1: '#0a4a2e', bg2: '#0aa05c', accent: '#ffc107' },
  vpn: { bg1: '#1a4d8a', bg2: '#0099ff', accent: '#ffc107' },
  deal: { bg1: '#4a2700', bg2: '#ff7a00', accent: '#fff' },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = (url.searchParams.get('t') || 'IsItAvailableIn').slice(0, 120);
  const sub = (url.searchParams.get('s') || '').slice(0, 80);
  const variant = (url.searchParams.get('v') || 'default') as keyof typeof COLORS;
  const c = COLORS[variant] || COLORS.default;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${c.bg1} 0%, ${c.bg2} 100%)`,
          color: 'white',
          padding: '70px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: c.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: c.bg1,
            }}
          >
            i?
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
            IsItAvailableIn<span style={{ opacity: 0.7 }}>.com</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: title.length > 60 ? 56 : title.length > 40 ? 68 : 80,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-1.5px',
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          {sub && (
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                opacity: 0.88,
                maxWidth: 980,
              }}
            >
              {sub}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 22,
            opacity: 0.85,
          }}
        >
          <div>Availability · Pricing · Workarounds</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: c.accent, fontWeight: 700 }}>4,600+</span>
            <span>checks · updated daily</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
