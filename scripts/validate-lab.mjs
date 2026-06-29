import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentRoot = path.join(root, "src", "content", "experiments");
const experimentsRoot = path.join(root, "public", "experiments");
const publicRoot = path.join(root, "public");

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory, pattern) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) matches.push(...(await walk(fullPath, pattern)));
    else if (pattern.test(entry.name)) matches.push(fullPath);
  }
  return matches;
}

function scalar(frontmatter, field) {
  return frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, "m"))?.[1]?.trim().replace(/^['"]|['"]$/g, "");
}

const sitePath = path.join(root, "src", "data", "site.json");
if (!(await exists(sitePath))) {
  fail("Missing src/data/site.json");
} else {
  const site = JSON.parse(await readFile(sitePath, "utf8"));
  for (const field of [
    "title",
    "eyebrow",
    "headline",
    "introduction",
    "experimentsHeading",
    "principlesHeading",
    "mainSiteUrl",
    "repositoryUrl",
    "socialImage",
  ]) {
    if (!site[field]) fail(`site.json: missing ${field}`);
  }
  if (!Array.isArray(site.principles) || !site.principles.length) {
    fail("site.json: principles must contain at least one item");
  }
  if (site.socialImage?.startsWith("/")) {
    const socialImagePath = path.join(publicRoot, site.socialImage.slice(1));
    if (!(await exists(socialImagePath))) fail(`site.json: social image not found at ${site.socialImage}`);
  }
}

const contentFiles = await walk(contentRoot, /\.mdx?$/);
if (!contentFiles.length) fail("No experiment content files found.");
let offlineDownloads = 0;

for (const contentPath of contentFiles) {
  const relative = path.relative(contentRoot, contentPath).replaceAll(path.sep, "/");
  const filenameSlug = path.basename(contentPath).replace(/\.mdx?$/, "");
  const text = await readFile(contentPath, "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (!frontmatter) {
    fail(`${relative}: missing YAML frontmatter`);
    continue;
  }

  const slug = scalar(frontmatter, "slug");
  const title = scalar(frontmatter, "title");
  const status = scalar(frontmatter, "status");
  const created = scalar(frontmatter, "created");
  const updated = scalar(frontmatter, "updated");
  const destinationUrl = scalar(frontmatter, "destinationUrl");

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) fail(`${relative}: invalid slug`);
  if (slug !== filenameSlug) fail(`${relative}: frontmatter slug must match the filename`);
  if (status === "Graduated" && !destinationUrl) fail(`${relative}: Graduated experiments require destinationUrl`);
  if (created && updated && new Date(updated) < new Date(created)) fail(`${relative}: updated date precedes created date`);

  const experimentDirectory = path.join(experimentsRoot, slug || filenameSlug);
  const manifestPath = path.join(experimentDirectory, "experiment.json");
  if (!(await exists(manifestPath))) {
    fail(`${relative}: missing public/experiments/${slug || filenameSlug}/experiment.json`);
    continue;
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1) fail(`${relative}: unsupported experiment manifest schema`);
  if (manifest.slug !== slug) fail(`${relative}: manifest slug does not match content slug`);
  if (manifest.title !== title) fail(`${relative}: manifest title does not match content title`);
  if (manifest.projectPath !== `/projects/${slug}/`) fail(`${relative}: manifest projectPath is not canonical`);

  const entryPath = path.join(experimentDirectory, manifest.entry || "");
  if (!(await exists(entryPath))) {
    fail(`${relative}: manifest entry does not exist: ${manifest.entry}`);
  } else {
    const entry = await readFile(entryPath, "utf8");
    if (!entry.includes('name="robots" content="noindex"')) fail(`${relative}: inner app must declare noindex`);
  }

  const wrapperPath = path.join(experimentDirectory, "index.html");
  if (!(await exists(wrapperPath))) {
    fail(`${relative}: generated experiment wrapper is missing`);
  } else {
    const wrapper = await readFile(wrapperPath, "utf8");
    for (const marker of ["erich-lab-theme", "data-theme-toggle", `./${manifest.entry}`]) {
      if (!wrapper.includes(marker)) fail(`${relative}: wrapper is missing ${marker}`);
    }
    if (wrapper.includes("{{")) fail(`${relative}: wrapper still contains an unreplaced template token`);
  }

  for (const legacyEntry of manifest.legacyEntries || []) {
    const legacyPath = path.join(experimentDirectory, legacyEntry);
    if (!(await exists(legacyPath))) fail(`${relative}: legacy compatibility entry is missing: ${legacyEntry}`);
  }

  for (const download of manifest.downloads || []) {
    offlineDownloads += 1;
    if (!download.href?.startsWith("/downloads/")) {
      fail(`${relative}: download href must live under /downloads/: ${download.href}`);
      continue;
    }
    const downloadPath = path.join(publicRoot, download.href.slice(1));
    if (!(await exists(downloadPath))) {
      fail(`${relative}: declared download is missing: ${download.href}`);
      continue;
    }
    if (download.href.endsWith(".html")) {
      const downloadHtml = await readFile(downloadPath, "utf8");
      if (!downloadHtml.includes("Generated by scripts/build-experiments.mjs")) {
        fail(`${relative}: offline HTML is missing its generated marker`);
      }
      for (const remoteMarker of ['<script src=', '<link rel="stylesheet" href=']) {
        if (downloadHtml.includes(remoteMarker)) fail(`${relative}: offline HTML retains ${remoteMarker}`);
      }
    }
  }
}

const layoutPath = path.join(root, "src", "layouts", "BaseLayout.astro");
if (await exists(layoutPath)) {
  const layout = await readFile(layoutPath, "utf8");
  for (const marker of ["erich-lab-theme", "data-theme-toggle"]) {
    if (!layout.includes(marker)) fail(`BaseLayout.astro: missing ${marker}`);
  }
}

for (const file of [
  "astro.config.mjs",
  "src/content.config.ts",
  "src/pages/index.astro",
  "src/pages/404.astro",
  "src/pages/sitemap.xml.ts",
  ".pages.yml",
  "wrangler.jsonc",
  "public/_headers",
  "public/robots.txt",
  "docs/LAB_CONTRACT.md",
  "docs/templates/EXPERIMENT_BRIEF.md",
  "docs/templates/ADR.md",
]) {
  if (!(await exists(path.join(root, file)))) fail(`Missing ${file}`);
}

const headers = await readFile(path.join(publicRoot, "_headers"), "utf8");
for (const rule of ["/downloads/*", "/experiments/*/app.html"]) {
  if (!headers.includes(rule)) fail(`public/_headers: missing noindex rule for ${rule}`);
}

if (!process.exitCode) {
  console.log(
    `✓ Validated ${contentFiles.length} experiment content file(s), ${offlineDownloads} download(s), manifests, wrappers, indexing rules, and public routes.`,
  );
}
