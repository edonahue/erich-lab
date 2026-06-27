import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const catalogPath = path.join(publicDir, 'experiments', 'experiments.json');
const required = ['slug', 'title', 'summary', 'href', 'source', 'status', 'kind', 'technologies', 'created', 'updated', 'entry_file'];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
if (catalog.schema_version !== 1) fail('experiments.json must use schema_version 1');
if (!Array.isArray(catalog.experiments) || !catalog.experiments.length) fail('experiments.json must contain at least one experiment');

const slugs = new Set();
for (const experiment of catalog.experiments || []) {
  const label = experiment.slug || experiment.title || 'unnamed experiment';
  for (const field of required) {
    if (experiment[field] === undefined || experiment[field] === '') fail(`${label}: missing ${field}`);
  }
  if (slugs.has(experiment.slug)) fail(`${label}: duplicate slug`);
  slugs.add(experiment.slug);
  if (!Array.isArray(experiment.technologies)) fail(`${label}: technologies must be an array`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(experiment.created || '')) fail(`${label}: created must be YYYY-MM-DD`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(experiment.updated || '')) fail(`${label}: updated must be YYYY-MM-DD`);

  const directory = path.join(publicDir, 'experiments', experiment.slug);
  const manifestPath = path.join(directory, 'experiment.json');
  const routePath = path.join(directory, 'index.html');
  const entryPath = path.join(directory, experiment.entry_file);

  for (const [name, file] of [['manifest', manifestPath], ['clean-route index', routePath], ['entry file', entryPath]]) {
    if (!(await exists(file))) fail(`${label}: ${name} not found at ${path.relative(root, file)}`);
  }

  if (await exists(manifestPath)) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    for (const field of required) {
      if (JSON.stringify(manifest[field]) !== JSON.stringify(experiment[field])) {
        fail(`${label}: experiment.json field ${field} does not match experiments.json`);
      }
    }
  }
}

for (const file of ['index.html', 'styles.css', 'lab.js', '404.html']) {
  if (!(await exists(path.join(publicDir, file)))) fail(`Missing public/${file}`);
}

if (!process.exitCode) console.log(`✓ Validated ${catalog.experiments.length} experiment(s) and the lab shell.`);
