import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { makeDiagnostic, nowIso } from '../../core/src/states.mjs';

export async function collect(config, context = {}) {
  const observedAt = nowIso();
  const baseDir = context.baseDir || process.cwd();
  const sourcePath = path.resolve(baseDir, config.path);

  if (!existsSync(sourcePath)) {
    return {
      source: config.name || 'heartbeat-jsonl',
      type: 'heartbeat-jsonl',
      observedAt,
      state: 'missing',
      records: [],
      diagnostics: [makeDiagnostic('info', 'heartbeat file does not exist', { path: sourcePath })],
    };
  }

  const text = await readFile(sourcePath, 'utf8');
  const records = [];
  const diagnostics = [];
  let lineNumber = 0;

  for (const line of text.split(/\r?\n/)) {
    lineNumber += 1;
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch (error) {
      diagnostics.push(makeDiagnostic('warn', 'invalid heartbeat JSONL line', {
        lineNumber,
        error: error.message,
      }));
    }
  }

  return {
    source: config.name || 'heartbeat-jsonl',
    type: 'heartbeat-jsonl',
    observedAt,
    state: records.length ? (diagnostics.length ? 'partial' : 'verified') : 'verified-empty',
    records,
    diagnostics,
  };
}
