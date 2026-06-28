import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const reportPath = path.join(root, process.env.LINK_REPORT || 'link-report.md');
const includedExtensions = new Set(['.astro', '.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.yml', '.yaml']);
const ignoredDirectories = new Set(['.git', '.astro', '.wrangler', 'dist', 'node_modules', 'playwright-report', 'public/downloads', 'test-results']);
const ignoredFiles = new Set(['package-lock.json']);
const urlPattern = /https:\/\/[^\s"'<>`)\]]+/g;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relative = path.relative(root, fullPath).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(relative) && !ignoredDirectories.has(entry.name)) files.push(...(await walk(fullPath)));
    } else if (includedExtensions.has(path.extname(entry.name)) && !ignoredFiles.has(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function cleanUrl(value) {
  return value.replace(/[.,;:!?]+$/, '').replaceAll('&amp;', '&');
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'erich-lab-link-check/1.0',
        Range: 'bytes=0-0',
      },
    });
    await response.body?.cancel();
    const softBlocked = [401, 403, 405, 429].includes(response.status);
    return {
      url,
      ok: response.ok || softBlocked,
      status: response.status,
      note: softBlocked ? 'reachable but automated checks are restricted' : response.statusText,
    };
  } catch (error) {
    return { url, ok: false, status: 0, note: error.name === 'AbortError' ? 'timed out' : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

const files = await walk(root);
const locations = new Map();
for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(urlPattern)) {
    const url = cleanUrl(match[0]);
    if (!locations.has(url)) locations.set(url, new Set());
    locations.get(url).add(relative);
  }
}

const urls = [...locations.keys()].sort();
const results = [];
const concurrency = 5;
for (let index = 0; index < urls.length; index += concurrency) {
  results.push(...(await Promise.all(urls.slice(index, index + concurrency).map(checkUrl))));
}

const failures = results.filter((result) => !result.ok);
const warnings = results.filter((result) => result.ok && [401, 403, 405, 429].includes(result.status));
const lines = [
  '# External link check',
  '',
  `Checked ${results.length} unique HTTPS links on ${new Date().toISOString()}.`,
  '',
];

if (failures.length) {
  lines.push('## Failures', '');
  for (const result of failures) {
    lines.push(`- ${result.url} — ${result.status || 'network error'} ${result.note}`);
    lines.push(`  - Referenced by: ${[...locations.get(result.url)].join(', ')}`);
  }
  lines.push('');
}

if (warnings.length) {
  lines.push('## Warnings', '');
  for (const result of warnings) lines.push(`- ${result.url} — ${result.status} ${result.note}`);
  lines.push('');
}

if (!failures.length) lines.push('No broken external links were detected.', '');
await writeFile(reportPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Checked ${results.length} external links: ${failures.length} failure(s), ${warnings.length} warning(s).`);
if (failures.length) process.exit(1);
