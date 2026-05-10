// Reusable VPN affiliate CTA. Two variants:
//   - "banner": big, colorful, bottom-of-content placement
//   - "inline": compact, fits inline with text
// Place liberally — at our traffic level this is the only revenue path that works.

import { vpnLink } from '@/lib/affiliate';

type Props = {
  variant?: 'banner' | 'inline' | 'compact';
  serviceName?: string;
  countryName?: string;
};

export default function VpnCta({ variant = 'banner', serviceName, countryName }: Props) {
  const vpn = vpnLink('nord');

  // Headline copy — switch based on context.
  const headline = serviceName && countryName
    ? `Unblock ${serviceName} from ${countryName} in 60 seconds`
    : serviceName
      ? `Watch ${serviceName} from anywhere`
      : countryName
        ? `Unblock blocked services from ${countryName}`
        : 'Unblock anything, from anywhere';

  const sub = serviceName && countryName
    ? `NordVPN works in ${countryName} and gives you a ${serviceName}-supported region with one click. 30-day money-back guarantee.`
    : 'NordVPN: 6,400+ servers in 111 countries. Top-rated for streaming, banking and crypto. 30-day money-back guarantee.';

  if (variant === 'compact') {
    return (
      <a
        href={vpn.href}
        rel="nofollow sponsored noopener"
        target="_blank"
        className="vpn-compact"
      >
        🔐 Unblock with NordVPN →
      </a>
    );
  }

  if (variant === 'inline') {
    return (
      <p className="vpn-inline">
        <strong>Need access?</strong>{' '}
        <a href={vpn.href} rel="nofollow sponsored noopener" target="_blank">
          NordVPN works {countryName ? `from ${countryName}` : 'globally'}
        </a>
        {' '}and gives you a supported region in one click.
        {' '}<small>(affiliate link)</small>
      </p>
    );
  }

  // banner (default)
  return (
    <aside className="vpn-banner" role="complementary">
      <div className="vpn-banner-text">
        <div className="vpn-banner-heading">{headline}</div>
        <div className="vpn-banner-sub">{sub}</div>
        <div className="vpn-banner-stars">
          ⭐⭐⭐⭐⭐ <span>Editor's choice — works for streaming, banking, crypto</span>
        </div>
      </div>
      <a
        href={vpn.href}
        rel="nofollow sponsored noopener"
        target="_blank"
        className="vpn-banner-cta"
      >
        Get NordVPN →
      </a>
    </aside>
  );
}
