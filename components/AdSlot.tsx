'use client';

import { useEffect } from 'react';

type Props = {
  slot: string;
  style?: React.CSSProperties;
};

// Map our semantic slot names → Ezoic numeric placeholder IDs.
// Configure these IDs in the Ezoic dashboard (Monetization → Ad Tester → Placeholders).
// 100-series is conventional; bump if Ezoic assigns different numbers.
const EZOIC_PLACEHOLDERS: Record<string, number> = {
  'answer-top': 101,
  'answer-bottom': 102,
  'sidebar': 103,
  'in-article': 104,
};

declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds: (...ids: number[]) => void;
      destroyPlaceholders: (...ids: number[]) => void;
      define: (id: number) => void;
      enable: () => void;
      display: () => void;
      refresh: () => void;
    };
  }
}

export default function AdSlot({ slot, style }: Props) {
  const enabled = !!process.env.NEXT_PUBLIC_EZOIC_ENABLED;
  const placeholderId = EZOIC_PLACEHOLDERS[slot];

  useEffect(() => {
    if (!enabled || !placeholderId || typeof window === 'undefined') return;
    window.ezstandalone = window.ezstandalone || ({ cmd: [] } as any);
    window.ezstandalone!.cmd.push(() => {
      try {
        window.ezstandalone!.showAds(placeholderId);
      } catch {}
    });
    return () => {
      try {
        window.ezstandalone?.cmd.push(() => {
          window.ezstandalone!.destroyPlaceholders(placeholderId);
        });
      } catch {}
    };
  }, [enabled, placeholderId]);

  // No ad network configured → render nothing. Dev placeholder removed:
  // it was leaking '[Ad slot: …]' dashed boxes into production.
  if (!enabled || !placeholderId) return null;

  return (
    <div
      id={`ezoic-pub-ad-placeholder-${placeholderId}`}
      style={{ minHeight: 90, margin: '1rem 0', ...style }}
    />
  );
}
