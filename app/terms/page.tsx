import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'Terms of use for IsItAvailableIn.com.'
};

export default function TermsPage() {
  const updated = '2026-04-22';
  return (
    <article>
      <h1>Terms of use</h1>
      <p><em>Last updated: {updated}</em></p>

      <h2>What this site is</h2>
      <p>
        IsItAvailableIn.com is a free directory of service availability,
        pricing, and signup notes by country. Information is gathered from
        public sources, automated monitoring, and community reports. We try to be accurate and
        cite sources, but we make no warranty that any information is
        complete, current, or correct.
      </p>

      <h2>Use the site at your own risk</h2>
      <p>
        Nothing on this site is legal, financial, or tax advice. Service
        availability and pricing change frequently. Verify with the official
        provider before relying on anything here. We are not liable for any
        loss or damage arising from use of the site.
      </p>

      <h2>User submissions</h2>
      <p>
        When you submit a report, suggestion, or feedback, you grant us a
        non-exclusive licence to display and use that content to improve the
        service. Do not submit confidential, illegal, or defamatory content.
        We may remove submissions at our discretion.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Service names, logos, and trademarks belong to their respective owners
        and are used here for descriptive purposes only. We claim no
        affiliation with the services we describe.
      </p>

      <h2>Workarounds and VPN content</h2>
      <p>
        Where we mention VPNs or workarounds, we are describing what works
        technically. Whether using such tools complies with the terms of
        service of a given provider — or with local law — is your
        responsibility.
      </p>

      <h2>Changes</h2>
      <p>
        We may change these terms at any time. Continued use of the site means
        you accept the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Use the <a href="/contact">contact page</a>.
      </p>
    </article>
  );
}
