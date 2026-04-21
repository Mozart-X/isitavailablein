'use client';

import { useEffect } from 'react';

type Props = {
  slot: string;
  format?: string;
  layout?: 'display' | 'in-article';
  style?: React.CSSProperties;
};

export default function AdSlot({ slot, format = 'auto', layout = 'display', style }: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [client]);

  if (!client) {
    // Dev/placeholder: shows a dashed box so you know where ads will appear.
    return (
      <div style={{
        border: '2px dashed #ccc', padding: '1rem', textAlign: 'center',
        color: '#888', fontSize: '0.85rem', margin: '1rem 0', ...style
      }}>
        [Ad slot: {slot}] — set NEXT_PUBLIC_ADSENSE_CLIENT to enable
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-ad-layout={layout === 'in-article' ? 'in-article' : undefined}
      data-full-width-responsive="true"
    />
  );
}
