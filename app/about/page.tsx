export const metadata = { title: 'About', description: 'About IsItAvailableIn.' };

export default function About() {
  return (
    <article>
      <h1>About IsItAvailableIn.com</h1>
      <p>We track whether popular online services — AI tools, streaming, banking, crypto exchanges, payment apps — are available in your country.</p>

      <h2>How we stay current</h2>
      <ul>
        <li>We monitor official sources and re-verify availability continuously.</li>
        <li>Community reports from real users in each country sharpen the data.</li>
        <li>Changes are logged on the <a href="/changes">recent changes</a> page.</li>
      </ul>

      <h2>Accuracy</h2>
      <p>We cite sources on every page and show the last verification date. This site is informational — always check the service's official site before making decisions. Not legal advice.</p>

      <h2>VPN &amp; affiliate disclosure</h2>
      <p>When a service is unavailable, we link to trusted VPN providers. We may earn a commission if you sign up. This does not influence our ratings.</p>
    </article>
  );
}
