// MoneyStack — the full "how to actually access this service" stack.
// On every page where a service is blocked/restricted, we show 3 affiliate
// CTAs side-by-side covering the 3 things a user actually needs:
//   1. VPN — to unblock by IP
//   2. Virtual card — to pay when local card is rejected
//   3. eSIM / phone — for verification SMS or general access while travelling
//
// Why three: capture the full intent. A "blocked" page visitor needs help
// with at least one of these, often all three. Single-CTA pages leak 80%
// of revenue.

import { vpnLink, virtualCardLink, esimLink } from '@/lib/affiliate';

type Props = {
  serviceName?: string;
  countryName?: string;
  heading?: string;
};

export default function MoneyStack({ serviceName, countryName, heading }: Props) {
  const vpn = vpnLink('nord');
  const card = virtualCardLink('wise');
  const esim = esimLink('airalo');

  const title = heading
    || (serviceName && countryName
      ? `How to actually use ${serviceName} from ${countryName}`
      : serviceName
        ? `How to access ${serviceName} from anywhere`
        : countryName
          ? `How to unblock services from ${countryName}`
          : 'How to access blocked services');

  return (
    <section className="money-stack" aria-label="Recommended tools">
      <h2 className="money-stack-title">{title}</h2>
      <p className="money-stack-sub">
        Most "blocked" services need more than just a VPN. Here's the 3-tool stack
        that actually works{serviceName ? ` for ${serviceName}` : ''}
        {countryName ? ` from ${countryName}` : ''}:
      </p>
      <div className="money-stack-grid">
        <Card
          step="1"
          title="Unblock by IP"
          subtitle="A VPN gives you an IP from a supported country."
          aff={vpn}
          accent="#0066cc"
        />
        <Card
          step="2"
          title="Pay at checkout"
          subtitle="Local cards often get rejected. A virtual card with a global BIN works."
          aff={card}
          accent="#00a37a"
        />
        <Card
          step="3"
          title="Verify your account"
          subtitle="For SMS verification or local data, an eSIM gives you a real number in 5 min."
          aff={esim}
          accent="#cc6600"
        />
      </div>
      <p className="money-stack-disclaimer">
        Some links above are affiliate links. We only recommend tools we'd use ourselves.
      </p>
    </section>
  );
}

function Card({ step, title, subtitle, aff, accent }: {
  step: string;
  title: string;
  subtitle: string;
  aff: { href: string; label: string; sub?: string };
  accent: string;
}) {
  return (
    <div className="money-card" style={{ borderTopColor: accent }}>
      <div className="money-card-step" style={{ background: accent }}>{step}</div>
      <div className="money-card-title">{title}</div>
      <div className="money-card-sub">{subtitle}</div>
      <a
        href={aff.href}
        rel="nofollow sponsored noopener"
        target="_blank"
        className="money-card-cta"
        style={{ background: accent }}
      >
        {aff.label} →
      </a>
      {aff.sub && <div className="money-card-meta">{aff.sub}</div>}
    </div>
  );
}
