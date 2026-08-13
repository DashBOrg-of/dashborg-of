import { execFile } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { makeDiagnostic, nowIso } from '../../core/src/states.mjs';

const execFileAsync = promisify(execFile);

export async function collect(config, context = {}) {
  const observedAt = nowIso();
  const baseDir = context.baseDir || process.cwd();
  const root = path.resolve(baseDir, config.root || '.');
  const exclude = new Set(config.exclude || []);
  const diagnostics = [];
  const gitDirs = [];

  await walk(root, exclude, gitDirs, diagnostics);

  const records = [];
  for (const gitDir of gitDirs) {
    const repoPath = path.dirname(gitDir);
    records.push(await inspectRepo(repoPath));
  }

  return {
    source: config.name || 'git-local',
    type: 'git-local',
    observedAt,
    state: records.length ? 'verified' : 'verified-empty',
    records,
    diagnostics,
  };
}

async function walk(dir, exclude, gitDirs, diagnostics) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    diagnostics.push(makeDiagnostic('warn', 'cannot read directory', { dir, error: error.message }));
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.name === '.git') {
      gitDirs.push(fullPath);
      continue;
    }
    if (exclude.has(entry.name)) continue;
    await walk(fullPath, exclude, gitDirs, diagnostics);
  }
}

async function inspectRepo(repoPath) {
  const [branch, remote, status] = await Promise.all([
    git(repoPath, ['branch', '--show-current']),
    git(repoPath, ['remote', 'get-url', 'origin']),
    git(repoPath, ['status', '--short', '--branch']),
  ]);

  const statusLines = status.stdout.split(/\r?\n/).filter(Boolean);
  const dirtyLines = statusLines.filter((line) => !line.startsWith('## '));

  return {
    path: repoPath,
    branch: branch.stdout.trim() || '(detached)',
    remote: remote.ok ? remote.stdout.trim() : null,
    status: statusLines[0] || null,
    dirty: dirtyLines.length > 0,
    changeCount: dirtyLines.length,
  };
}

async function git(cwd, args) {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, { cwd, windowsHide: true });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
  }
}
