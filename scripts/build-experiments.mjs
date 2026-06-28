import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const experimentsRoot = path.join(root, "public", "experiments");
const downloadsRoot = path.join(root, "public", "downloads");
const wrapperTemplatePath = path.join(root, "scripts", "templates", "experiment-wrapper.html");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const safeScript = (source) => source.replaceAll("</script>", "<\\/script>");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assertManifest(manifest, directoryName) {
  const requiredStrings = ["slug", "title", "description", "entry", "projectPath", "mainSiteUrl"];
  if (manifest.schemaVersion !== 1) throw new Error(`${directoryName}: unsupported manifest schema`);
  for (const field of requiredStrings) {
    if (!manifest[field] || typeof manifest[field] !== "string") {
      throw new Error(`${directoryName}: manifest is missing ${field}`);
    }
  }
  if (manifest.slug !== directoryName) throw new Error(`${directoryName}: manifest slug must match its directory`);
  if (!manifest.projectPath.startsWith("/projects/")) throw new Error(`${directoryName}: invalid projectPath`);
  if (!Array.isArray(manifest.downloads)) throw new Error(`${directoryName}: downloads must be an array`);
  if (manifest.offline?.mode && manifest.offline.mode !== "single-html") {
    throw new Error(`${directoryName}: unsupported offline mode ${manifest.offline.mode}`);
  }
}

async function readManifests() {
  const entries = await readdir(experimentsRoot, { withFileTypes: true });
  const manifests = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(experimentsRoot, entry.name, "experiment.json");
    if (!(await exists(manifestPath))) continue;
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assertManifest(manifest, entry.name);
    manifests.push({ manifest, directory: path.dirname(manifestPath) });
  }
  return manifests;
}

function renderDownloads(downloads) {
  return downloads
    .map(
      (download) =>
        `<a class="download-link" href="${escapeHtml(download.href)}" download="${escapeHtml(download.filename || true)}">${escapeHtml(download.label)}</a>`,
    )
    .join("\n        ");
}

async function buildWrapper(template, manifest, directory) {
  const entryPath = path.join(directory, manifest.entry);
  if (!(await exists(entryPath))) throw new Error(`${manifest.slug}: missing entry ${manifest.entry}`);

  const tokens = {
    "{{SLUG}}": manifest.slug,
    "{{TITLE}}": escapeHtml(manifest.title),
    "{{DESCRIPTION}}": escapeHtml(manifest.description),
    "{{PROJECT_PATH}}": escapeHtml(manifest.projectPath),
    "{{MAIN_SITE_URL}}": escapeHtml(manifest.mainSiteUrl),
    "{{ENTRY}}": escapeHtml(manifest.entry),
    "{{DOWNLOAD_LINKS}}": renderDownloads(manifest.downloads),
  };

  let output = template;
  for (const [token, value] of Object.entries(tokens)) output = output.replaceAll(token, value);
  await writeFile(path.join(directory, "index.html"), output, "utf8");

  for (const legacyEntry of manifest.legacyEntries || []) {
    const redirect = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=./${escapeHtml(manifest.entry)}" />
    <link rel="canonical" href="./${escapeHtml(manifest.entry)}" />
    <title>Moved · ${escapeHtml(manifest.title)}</title>
  </head>
  <body>
    <p>This entry moved to <a href="./${escapeHtml(manifest.entry)}">${escapeHtml(manifest.entry)}</a>.</p>
    <script>window.location.replace("./${escapeHtml(manifest.entry)}");</script>
  </body>
</html>
`;
    await writeFile(path.join(directory, legacyEntry), redirect, "utf8");
  }
}

async function buildOffline(manifest, directory) {
  if (!manifest.offline) return;
  const { output, styles = [], scripts = [] } = manifest.offline;
  if (!output) throw new Error(`${manifest.slug}: offline output is required`);

  let html = await readFile(path.join(directory, manifest.entry), "utf8");
  for (const style of styles) {
    const source = await readFile(path.join(directory, style), "utf8");
    const pattern = new RegExp(`<link\\s+rel=["']stylesheet["']\\s+href=["']\\./${escapeRegExp(style)}["']\\s*/?>`);
    if (!pattern.test(html)) throw new Error(`${manifest.slug}: stylesheet marker not found for ${style}`);
    html = html.replace(pattern, `<style>\n${source}\n</style>`);
  }

  for (const script of scripts) {
    const source = await readFile(path.join(directory, script), "utf8");
    const pattern = new RegExp(`<script\\s+src=["']\\./${escapeRegExp(script)}["']\\s*><\\/script>`);
    if (!pattern.test(html)) throw new Error(`${manifest.slug}: script marker not found for ${script}`);
    html = html.replace(pattern, `<script>\n${safeScript(source)}\n</script>`);
  }

  const themeBootstrap = `<script>(()=>{const key="erich-lab-theme";let theme="dark";try{theme=localStorage.getItem(key)==="light"?"light":"dark"}catch{}document.documentElement.dataset.theme=theme;})();</script>`;
  const offlineCss = `<style>
.offline-toolbar{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid var(--l);background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(14px);font-size:.82rem;color:var(--m)}
.offline-toolbar button{border:1px solid var(--l);border-radius:8px;padding:6px 10px;background:var(--ctl);color:var(--i);cursor:pointer}
@media print{.offline-toolbar{display:none}}
</style>`;
  const offlineBar = `<div class="offline-toolbar"><span>Offline copy · ${escapeHtml(manifest.title)}</span><button type="button" data-offline-theme>Toggle theme</button></div>`;
  const themeToggle = `<script>(()=>{const key="erich-lab-theme";const button=document.querySelector("[data-offline-theme]");button?.addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="light"?"dark":"light";document.documentElement.dataset.theme=next;try{localStorage.setItem(key,next)}catch{}});})();</script>`;

  html = html
    .replace("</head>", `${themeBootstrap}${offlineCss}</head>`)
    .replace("<body>", `<body>${offlineBar}`)
    .replace("</body>", `${themeToggle}</body>`);

  const generated = `<!-- Generated by scripts/build-experiments.mjs. Edit the experiment source files instead. -->\n${html}`;
  await mkdir(downloadsRoot, { recursive: true });
  await writeFile(path.join(downloadsRoot, output), generated, "utf8");
}

const wrapperTemplate = await readFile(wrapperTemplatePath, "utf8");
const manifests = await readManifests();
if (!manifests.length) throw new Error("No experiment manifests found");

for (const { manifest, directory } of manifests) {
  await buildWrapper(wrapperTemplate, manifest, directory);
  await buildOffline(manifest, directory);
  console.log(`✓ Built ${manifest.slug} wrapper${manifest.offline ? " and offline artifact" : ""}`);
}
