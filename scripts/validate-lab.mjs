import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const contentDir = path.join(root, 'src', 'content', 'experiments');
const publicDir = path.join(root, 'public');
const requiredFields = ['title', 'summary', 'status', 'kind', 'technologies', 'launchPath', 'sourceUrl', 'featured', 'created', 'updated'];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

const files = (await readdir(contentDir)).filter((file) => /\.mdx?$/.test(file));
if (!files.length) fail('No experiment content files found in src/content/experiments.');

for (const file of files) {
  const slug = file.replace(/\.mdx?$/, '');
  const text = await readFile(path.join(contentDir, file), 'utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    fail(`${file}: missing YAML frontmatter`);
    continue;
  }

  for (const field of requiredFields) {
    if (!new RegExp(`^${field}:`, 'm').test(frontmatter[1])) fail(`${file}: missing ${field}`);
  }

  const launchPath = frontmatter[1].match(/^launchPath:\s*(.+)$/m)?.[1]?.trim();
  if (!launchPath?.startsWith('/experiments/')) fail(`${file}: launchPath must begin with /experiments/`);

  const experimentDir = path.join(publicDir, 'experiments', slug);
  if (!(await exists(path.join(experimentDir, 'index.html')))) fail(`${file}: missing public/experiments/${slug}/index.html`);
}

for (const file of ['astro.config.mjs', 'src/content.config.ts', 'src/pages/index.astro', 'src/pages/404.astro', '.pages.yml', 'wrangler.jsonc']) {
  if (!(await exists(path.join(root, file)))) fail(`Missing ${file}`);
}

if (!process.exitCode) console.log(`✓ Validated ${files.length} Astro experiment content file(s) and public launch routes.`);
