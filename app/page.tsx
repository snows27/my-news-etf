export default function Home() {
  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '600px' }}>
      <h1>📰 Portfolio News Bot</h1>
      <p>Daily Portfolio Brief — runs at 08:00 ICT via Vercel Cron.</p>
      <h2>Endpoints</h2>
      <ul>
        <li><code>GET /api/daily-brief</code> — cron trigger (requires Bearer token)</li>
        <li><code>GET /api/test-discord</code> — test Discord webhook (requires Bearer token)</li>
      </ul>
      <h2>Portfolio</h2>
      <ul>
        <li>SCB Fund Click: SCBSP500E, SCBNASDAQ100E, SCBWORLDE, SCBGOLDE</li>
        <li>Webull: NVDA</li>
      </ul>
      <p><em>News monitoring only — not a trading system.</em></p>
    </main>
  );
}
