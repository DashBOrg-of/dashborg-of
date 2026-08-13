export function renderHtml(snapshot, policy = {}) {
  const sources = snapshot.sources || [];
  const sourceCards = sources.map(renderSource).join('\n');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(snapshot.identity?.displayName || 'DashBOrg')}</title>
  </head>
  <body>
    <header>
      <p>dashborg-of</p>
      <h1>${escapeHtml(snapshot.identity?.displayName || snapshot.identity?.slug || 'DashBOrg')}</h1>
      <p>Scope: ${escapeHtml(snapshot.identity?.type || 'unknown')} | Policy: ${escapeHtml(policy.name || 'unspecified')}</p>
    </header>
    <main>
      <section>
        <h2>Health</h2>
        <dl>
          <dt>State</dt><dd>${escapeHtml(snapshot.health?.state)}</dd>
          <dt>Observed</dt><dd>${escapeHtml(snapshot.observedAt)}</dd>
          <dt>Sources</dt><dd>${escapeHtml(snapshot.health?.sourceCount)}</dd>
          <dt>Records</dt><dd>${escapeHtml(snapshot.health?.recordCount)}</dd>
        </dl>
      </section>
      <section>
        <h2>Sources</h2>
        ${sourceCards}
      </section>
    </main>
  </body>
</html>`;
}

function renderSource(source) {
  return `<article>
    <h3>${escapeHtml(source.source)} <small>${escapeHtml(source.type)}</small></h3>
    <dl>
      <dt>State</dt><dd>${escapeHtml(source.state)}</dd>
      <dt>Observed</dt><dd>${escapeHtml(source.observedAt)}</dd>
      <dt>Records</dt><dd>${escapeHtml(source.records?.length || 0)}</dd>
      <dt>Diagnostics</dt><dd>${escapeHtml(source.diagnostics?.length || 0)}</dd>
    </dl>
  </article>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
