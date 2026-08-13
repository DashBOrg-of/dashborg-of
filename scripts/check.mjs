import { readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const roots = ['packages', 'scripts'];
const files = [];

for (const root of roots) {
  await collectMjs(path.resolve(process.cwd(), root), files);
}

for (const file of files) {
  await execFileAsync(process.execPath, ['--check', file], { windowsHide: true });
}

console.log(`checked ${files.length} module files`);

async function collectMjs(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectMjs(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith('.mjs')) {
      out.push(fullPath);
    }
  }
}
