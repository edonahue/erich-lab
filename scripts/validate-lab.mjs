import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const contentDir = path.join(root, 'src', 'content', 'experiments');
const publicDir = path.join(root, 'public');
const requiredFields = [
  'slug',
  'title',
  'summary',
  'status',
  'kind',
  'technologies',
  'sourceUrl',
  'published',
  'featured',
  'created',
  'updated',
];
const validStatuses = new Set(['Idea', 'Prototype', 'Active', 'Paused', 'Archived']);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

const sitePath = path.join(root, 'src', 'data', 'site.json');
if (!(await exists(sitePath))) {
  fail('Missing src/data/site.json');
} else {
  const site = JSON.parse(await readFile(sitePath, 'utf8'));
  for (const field of ['title', 'eyebrow', 'headline', 'introduction', 'experimentsHeading', 'principlesHeading', 'mainSiteUrl', 'repositoryUrl', 'socialImage']) {
    if (!site[field]) fail(`site.json: missing ${field}`);
  }
  if (!Array.isArray(site.principles) || !site.principles.length) fail('site.json: principles must contain at least one item');
  if (site.socialImage?.startsWith('/')) {
    const socialImagePath = path.join(publicDir, site.socialImage.slice(1));
    if (!(await exists(socialImagePath))) fail(`site.json: social image not found at ${site.socialImage}`);
  }
}

const files = (await readdir(contentDir)).filter((file) => /\.mdx?$/.test(file));
if (!files.length) fail('No experiment content files found in src/content/experiments.');

for (const file of files) {
  const filenameSlug = file.replace(/\.mdx?$/, '');
  const text = await readFile(path.join(contentDir, file), 'utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    fail(`${file}: missing YAML frontmatter`);
    continue;
  }

  for (const field of requiredFields) {
    if (!new RegExp(`^${field}:`, 'm').test(frontmatter[1])) fail(`${file}: missing ${field}`);
  }

  const slug = frontmatter[1].match(/^slug:\s*(.+)$/m)?.[1]?.trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) fail(`${file}: slug must contain lowercase letters, numbers, and hyphens only`);
  if (slug && slug !== filenameSlug) fail(`${file}: frontmatter slug must match the filename`);

  const status = frontmatter[1].match(/^status:\s*(.+)$/m)?.[1]?.trim();
  if (!status || !validStatuses.has(status)) fail(`${file}: invalid status ${status || '(missing)'}`);

  const experimentDir = path.join(publicDir, 'experiments', slug || filenameSlug);
  if (!(await exists(path.join(experimentDir, 'index.html')))) fail(`${file}: missing public/experiments/${slug || filenameSlug}/index.html`);
}

for (const file of ['astro.config.mjs', 'src/content.config.ts', 'src/pages/index.astro', 'src/pages/404.astro', '.pages.yml', 'wrangler.jsonc', 'public/_headers']) {
  if (!(await exists(path.join(root, file)))) fail(`Missing ${file}`);
}

if (!process.exitCode) console.log(`✓ Validated ${files.length} Astro experiment content file(s), site settings, headers, and public launch routes.`);
