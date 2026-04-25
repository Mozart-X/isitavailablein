import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How IsItAvailableIn.com collects, uses, and protects information.'
};

export default function PrivacyPage() {
  const updated = '2026-04-22';
  return (
    <article>
      <h1>Privacy policy</h1>
      <p><em>Last updated: {updated}</em></p>

      <h2>What we collect</h2>
      <p>
        IsItAvailableIn.com is an information site. We do not require accounts.
        When you submit a report or suggestion, we store the content you typed
        and a one-way salted hash of your IP address (used only to rate-limit
        spam — we cannot recover the original IP from the hash). Optionally you
        may include an email address if you want a reply; we never share it.
      </p>

      <h2>Cookies and analytics</h2>
      <p>
        We use cookieless analytics (Cloudflare Web Analytics) to count
        anonymous page views. If Google Analytics is enabled it sets standard
        analytics cookies with IP anonymisation turned on. We do not sell or
        share visitor data.
      </p>

      <h2>Advertising</h2>
      <p>
        This website uses third-party advertising companies, including{' '}
        <a href="https://www.ezoic.com/" rel="noopener noreferrer">Ezoic</a>, to
        serve ads when you visit. These companies may use information (not
        including your name, address, email address, or telephone number) about
        your visits to this and other websites in order to provide
        advertisements about goods and services of interest to you. Please see
        Ezoic&rsquo;s{' '}
        <a href="https://www.ezoic.com/privacy-policy/" rel="noopener noreferrer">privacy policy</a>{' '}
        for more details. You can opt out of personalised advertising via{' '}
        <a href="https://www.aboutads.info/" rel="noopener noreferrer">aboutads.info</a>{' '}
        or{' '}
        <a href="https://www.youronlinechoices.com/" rel="noopener noreferrer">youronlinechoices.com</a>.
      </p>

      <h2>Third-party services</h2>
      <p>
        Pages may link to external services (Netflix, Spotify, ChatGPT, etc.).
        We do not control those sites and are not responsible for their content
        or privacy practices.
      </p>

      <h2>Data retention</h2>
      <p>
        Submitted reports and suggestions are kept indefinitely so we can
        improve the database. You may request deletion of any submission you
        recognise by emailing us via the contact page.
      </p>

      <h2>Your rights</h2>
      <p>
        Under GDPR, UK GDPR, and CCPA you have the right to access, correct,
        and delete personal information we hold about you. Contact us via the{' '}
        <a href="/contact">contact page</a> to exercise these rights.
      </p>

      <h2>Children</h2>
      <p>
        This service is not directed at children under 13 and we do not
        knowingly collect data from them.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The &ldquo;last updated&rdquo;
        date at the top reflects the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Use the <a href="/contact">contact page</a>.
      </p>
    </article>
  );
}
