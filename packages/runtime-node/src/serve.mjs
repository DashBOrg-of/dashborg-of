import { readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createSnapshot, redactSnapshot } from '../../core/src/snapshot.mjs';
import { collect as collectHeartbeats } from '../../data-source-heartbeats/src/index.mjs';
import { collect as collectGitLocal } from '../../data-source-git-local/src/index.mjs';

// HTTP server for a dashborg instance's surfaces (agent/network per
// dashborg.instance.json). Fills the gap flagged in
// Agents-Of/PlayFieldMultiplier#210: collect-snapshot.mjs produces a
// snapshot, but nothing previously bound the configured surfaces to an
// actual listening endpoint, so "confirm the outer surface rejects writes
// and redacts raw/local-only evidence" (#210's own acceptance criterion)
// could not be verified for any instance built against this package.
//
// Deliberately minimal: reuses createSnapshot/redactSnapshot from core
// as-is rather than reimplementing redaction, and only adds the one write
// capability (POST /heartbeat) needed to make canWrite:true/false a real,
// enforced distinction rather than an unused config label.

const configPath = process.argv[2];
if (!configPath) {
  console.error('usage: node packages/runtime-node/src/serve.mjs <dashborg.instance.json>');
  process.exit(2);
}

const absoluteConfigPath = path.resolve(process.cwd(), configPath);
const baseDir = path.dirname(absoluteConfigPath);
const instance = JSON.parse(await readFile(absoluteConfigPath, 'utf8'));

async function collectAll() {
  const results = [];
  for (const source of instance.sources || []) {
    if (source.type === 'heartbeat-jsonl') {
      results.push(await collectHeartbeats(source, { baseDir }));
    } else if (source.type === 'git-local') {
      results.push(await collectGitLocal(source, { baseDir }));
    } else {
      results.push({
        source: source.name || source.type,
        type: source.type,
        observedAt: new Date().toISOString(),
        state: 'unsupported',
        records: [],
        diagnostics: [{ level: 'info', message: 'source type is not implemented yet' }],
      });
    }
  }
  return results;
}

function heartbeatSource() {
  return (instance.sources || []).find((s) => s.type === 'heartbeat-jsonl');
}

function startSurface(surface) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/snapshot') {
      const results = await collectAll();
      const snapshot = createSnapshot(instance, results);
      const body = surface.exposeRaw ? snapshot : redactSnapshot(snapshot, { exposeRaw: false });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body, null, 2));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/heartbeat') {
      if (!surface.canWrite) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'this surface does not accept writes' }));
        return;
      }
      const hb = heartbeatSource();
      if (!hb) {
        res.writeHead(501, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'instance has no heartbeat-jsonl source configured' }));
        return;
      }
      let body = '';
      for await (const chunk of req) body += chunk;
      let entry;
      try {
        entry = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'body must be JSON' }));
        return;
      }
      entry.ts = entry.ts || new Date().toISOString();
      const hbPath = path.resolve(baseDir, hb.path);
      await appendFile(hbPath, JSON.stringify(entry) + '\n', 'utf8');
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found', routes: ['GET /snapshot', 'POST /heartbeat'] }));
  });

  server.listen(surface.port, surface.host, () => {
    console.log(`dashborg surface "${surface.name}" listening on ${surface.host}:${surface.port} (canWrite=${!!surface.canWrite}, exposeRaw=${!!surface.exposeRaw})`);
  });

  return server;
}

const servers = (instance.surfaces || []).map(startSurface);

process.on('SIGINT', () => {
  for (const s of servers) s.close();
  process.exit(0);
});
