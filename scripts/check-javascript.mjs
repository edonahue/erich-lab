import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const roots = [path.join(root, 'scripts'), path.join(root, 'public', 'experiments')];
const ignored = new Set(['node_modules', 'dist', 'public/downloads']);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relative = path.relative(root, fullPath).replaceAll(path.sep, '/');
    if (ignored.has(relative)) continue;
    if (entry.isDirectory()) await walk(fullPath);
    else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(fullPath);
  }
}

for (const directory of roots) await walk(directory);

let failed = false;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(result.stderr || result.stdout);
  }
}

if (failed) process.exit(1);
console.log(`✓ JavaScript syntax valid in ${files.length} file(s).`);
