import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSnapshot } from '../../core/src/snapshot.mjs';
import { collect as collectHeartbeats } from '../../data-source-heartbeats/src/index.mjs';
import { collect as collectGitLocal } from '../../data-source-git-local/src/index.mjs';

const configPath = process.argv[2];
if (!configPath) {
  console.error('usage: node packages/runtime-node/src/collect-snapshot.mjs <dashborg.instance.json>');
  process.exit(2);
}

const absoluteConfigPath = path.resolve(process.cwd(), configPath);
const baseDir = path.dirname(absoluteConfigPath);
const instance = JSON.parse(await readFile(absoluteConfigPath, 'utf8'));
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

console.log(JSON.stringify(createSnapshot(instance, results), null, 2));
