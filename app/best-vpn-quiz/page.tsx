// /best-vpn-quiz — interactive 4-question quiz that recommends a VPN.
// Quizzes are the highest-converting affiliate format because they feel
// like advice, not advertising. Client-side state machine — no backend.

'use client';

import { useState } from 'react';
import { vpnLink } from '@/lib/affiliate';

type Use = 'streaming' | 'banking' | 'gaming' | 'travel' | 'china';
type Budget = 'cheap' | 'midrange' | 'premium';
type Devices = 'few' | 'many';
type Tech = 'easy' | 'advanced';

type Pick = { provider: 'nord' | 'surfshark' | 'express'; tagline: string; rationale: string };

function recommend(use: Use, budget: Budget, devices: Devices, tech: Tech): Pick {
  // China / restricted countries: NordVPN obfuscated servers are the only
  // ones that consistently work behind the Great Firewall + similar.
  if (use === 'china') {
    return {
      provider: 'nord',
      tagline: 'NordVPN — only one with reliable obfuscated servers for China',
      rationale: 'In restrictive countries (China, Iran, UAE, Russia) most VPNs get blocked by deep-packet inspection. NordVPN\'s obfuscated server category works around it; Surfshark sometimes works; ExpressVPN works sometimes. Pick NordVPN for the highest reliability.',
    };
  }
  // Budget-first picks
  if (budget === 'cheap' || devices === 'many') {
    return {
      provider: 'surfshark',
      tagline: 'Surfshark — cheapest premium VPN, unlimited devices',
      rationale: 'Cheapest of the top 3 (~$2.19/mo on the 2-year plan) and the only one allowing unlimited simultaneous connections. Households with many devices or budget-conscious users win here.',
    };
  }
  // Speed-first / streaming-heavy / advanced users
  if (use === 'streaming' && tech === 'advanced') {
    return {
      provider: 'express',
      tagline: 'ExpressVPN — fastest, best polish for streaming',
      rationale: 'Lightway protocol consistently tops benchmark speeds. Cleanest apps across platforms. Best Netflix region unblocking. Premium price reflects premium product.',
    };
  }
  // Default: NordVPN as the safe all-rounder
  return {
    provider: 'nord',
    tagline: 'NordVPN — the safe all-rounder',
    rationale: 'Best balance of price, speed, server count and unblocking reliability. Works for streaming, banking, gaming. 6,400+ servers in 111 countries.',
  };
}

const QUESTIONS = [
  {
    key: 'use' as const,
    text: 'What\'s your main use?',
    options: [
      { v: 'streaming', label: '📺 Streaming (Netflix/Hulu/HBO)' },
      { v: 'banking', label: '🏦 Banking / payment apps' },
      { v: 'gaming', label: '🎮 Gaming / low-ping' },
      { v: 'travel', label: '✈️ Travel / public WiFi' },
      { v: 'china', label: '🧱 Behind a national firewall (China, Iran, etc.)' },
    ],
  },
  {
    key: 'budget' as const,
    text: 'Budget?',
    options: [
      { v: 'cheap', label: '💸 Cheap as possible' },
      { v: 'midrange', label: '⚖️ Reasonable mid-range' },
      { v: 'premium', label: '💎 Whatever works best, money is fine' },
    ],
  },
  {
    key: 'devices' as const,
    text: 'How many devices?',
    options: [
      { v: 'few', label: '1-5 devices' },
      { v: 'many', label: '6+ devices / shared household' },
    ],
  },
  {
    key: 'tech' as const,
    text: 'Tech comfort?',
    options: [
      { v: 'easy', label: '🙂 Want it simple, one-click' },
      { v: 'advanced', label: '🧠 Comfortable tweaking settings' },
    ],
  },
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<string, string>>>({});

  function pick(key: string, value: string) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    setStep(step + 1);
  }

  function reset() {
    setAnswers({});
    setStep(0);
  }

  if (step >= QUESTIONS.length) {
    const result = recommend(
      (answers.use || 'streaming') as Use,
      (answers.budget || 'midrange') as Budget,
      (answers.devices || 'few') as Devices,
      (answers.tech || 'easy') as Tech,
    );
    const aff = vpnLink(result.provider);

    return (
      <article>
        <h1>✨ Your VPN match</h1>
        <div style={{ background: 'linear-gradient(135deg, #0a2540, #0066cc)', color: 'white', padding: '2rem', borderRadius: 16, margin: '1.5rem 0' }}>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.6rem' }}>
            {result.tagline}
          </div>
          <p style={{ fontSize: '1.05rem', opacity: 0.95, lineHeight: 1.5, margin: '0 0 1.5rem' }}>
            {result.rationale}
          </p>
          <a
            href={aff.href}
            rel="nofollow sponsored noopener"
            target="_blank"
            style={{ display: 'inline-block', padding: '0.95rem 1.8rem', background: '#ffc107', color: '#1a1a1a', borderRadius: 10, fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' }}
          >
            Get {aff.label.replace('Get ', '')} — 30-day refund →
          </a>
        </div>

        <h2>Want to compare?</h2>
        <p>
          Our pick above is based on your answers, but you can see the side-by-side ranking
          of all three on the <a href="/best-vpn">Best VPN comparison page</a>, or read full
          reviews of each:
        </p>
        <div className="grid">
          <a href="/review/nordvpn">NordVPN review</a>
          <a href="/review/surfshark">Surfshark review</a>
          <a href="/review/expressvpn">ExpressVPN review</a>
        </div>

        <p style={{ marginTop: '2rem' }}>
          <button onClick={reset} style={{ padding: '0.55rem 1rem', background: 'white', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>↺ Retake quiz</button>
        </p>
      </article>
    );
  }

  const q = QUESTIONS[step];
  const pct = Math.round(((step + 1) / QUESTIONS.length) * 100);

  return (
    <article>
      <h1>Find your VPN match</h1>
      <p style={{ color: '#666' }}>4 questions. 20 seconds. Personalized recommendation at the end.</p>

      <div style={{ height: 8, background: '#eee', borderRadius: 4, margin: '1.25rem 0' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#0066cc', borderRadius: 4, transition: 'width 0.2s' }} />
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>{step + 1}. {q.text}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {q.options.map((opt) => (
            <button
              key={opt.v}
              onClick={() => pick(q.key, opt.v)}
              style={{ padding: '0.85rem 1.1rem', background: 'white', border: '1px solid #ccc', borderRadius: 10, fontSize: '1rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f6ff'; e.currentTarget.style.borderColor = '#0066cc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ccc'; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ marginTop: '1rem', background: 'none', border: 0, color: '#666', cursor: 'pointer', fontSize: '0.9rem' }}>← Back</button>
        )}
      </div>
    </article>
  );
}
