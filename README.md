# Erich's Lab

A low-ceremony public shelf for small tools, studies, data experiments, and prototypes. Astro builds the catalog and project notes; standalone experiments remain portable under `public/experiments/`.

## Current experiment

- **Music-Credit Graph Study Lab** — a concept guide, architecture plan, adaptive quiz, flashcard deck, and offline study artifact for a collection-seeded music-credit graph.

## Run locally

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Validate manifests, generated artifacts, JavaScript, content, and the Astro production build:

```bash
npm run check
```

Run the browser smoke suite after a production build:

```bash
npm install --no-save --package-lock=false @playwright/test@1.55.0
npx playwright install chromium
npm run test:smoke
```

Formatting is available through pinned Prettier commands without adding another lockfile dependency:

```bash
npm run format
npm run format:check
```

## Experiment structure

Each experiment has two complementary records.

### Editorial entry

```text
src/content/experiments/<slug>.md
```

This owns public metadata, publication status, project notes, preview art, and declared offline availability. Pages CMS edits this layer.

### Technical manifest

```text
public/experiments/<slug>/experiment.json
```

This owns packaging details such as:

- Maintained application entry file
- Shared wrapper links
- Offline inputs and output filename
- Legacy compatibility paths
- Smoke-test hints

`npm run build:experiments` reads the manifests and generates:

```text
public/experiments/<slug>/index.html
public/downloads/<declared artifact>
legacy compatibility redirects
```

Generated wrappers and downloads are intentionally not committed.

## Add an experiment

There is no scaffold command yet. The structure should prove itself with a second experiment before automation is added.

1. Read `docs/LAB_CONTRACT.md` and choose the proportional experiment level.
2. Copy `docs/templates/EXPERIMENT_BRIEF.md` when the build is Level 3 or benefits from a written brief.
3. Add `src/content/experiments/<slug>.md` through Pages CMS or Git.
4. Create `public/experiments/<slug>/experiment.json`.
5. Add the maintained application entry and assets to that directory.
6. Add preview media under `public/images/experiments/` when useful.
7. Add or extend browser smoke coverage for interactive behavior.
8. Record consequential decisions using `docs/templates/ADR.md`.
9. Run `npm run check` and `npm run test:smoke`.

The filename, frontmatter slug, manifest slug, project URL, and experiment URL must agree:

```text
src/content/experiments/music-graph-study.md
public/experiments/music-graph-study/experiment.json
→ /projects/music-graph-study/
→ /experiments/music-graph-study/
```

## Content editing with Pages CMS

Pages CMS edits content and media directly in this repository.

- Homepage copy and global links live in `src/data/site.json`.
- Experiment entries live in `src/content/experiments/`.
- Preview media lives in `public/images/`.
- `.pages.yml` defines statuses, publication controls, destination URLs, media fields, and offline-download metadata.

The technical manifest and runnable application remain code-reviewed files rather than CMS fields.

## Experiment lifecycle

Supported statuses are:

- `Idea`
- `Prototype`
- `Active`
- `Paused`
- `Archived`
- `Graduated`

A graduated experiment keeps its lab history and stable URL but points its primary action to a required `destinationUrl`.

## Offline contract

Editorial frontmatter declares visitor-facing download metadata. The technical manifest declares how an artifact is built.

Use:

- `full` when the core experience survives offline
- `limited` when live services, large datasets, or other features are intentionally omitted

Inner app files and downloads are noindexed; public project pages and wrappers remain discoverable and are listed in `/sitemap.xml`.

## Theme contract

The public lab defaults to dark and stores its preference independently from the main website.

```text
Storage key: erich-lab-theme
Root attribute: data-theme="dark" | data-theme="light"
Default: dark
```

Generated wrappers expose the shared toggle and synchronize the preference into same-origin experiment iframes. Individual experiments may retain their own visual identity while supporting both themes.

## Quality and maintenance

The repository includes:

- Zod-validated Astro content
- Cross-file manifest and generated-artifact validation
- JavaScript syntax checks for scripts and standalone experiments
- Playwright smoke tests for public routes, iframe interaction, local state, offline use, redirects, and sitemap output
- Scheduled external-link checking that creates or updates a GitHub issue on failure
- Low-volume Dependabot updates for npm and GitHub Actions
- EditorConfig and Prettier configuration
- Conservative security and indexing headers

External links are checked on a schedule rather than blocking ordinary pull requests because documentation sites may rate-limit automation.

## Delivery

Astro outputs the static site to `dist/`; Wrangler deploys that directory through Workers Static Assets.

```bash
npm run deploy
```

Cloudflare build settings:

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

## Documentation

- `docs/LAB_CONTRACT.md` — proportional requirements for all lab builds
- `docs/templates/EXPERIMENT_BRIEF.md` — design and release brief
- `docs/templates/ADR.md` — lightweight architecture decision record
- `docs/decisions/lab/` — lab-wide decisions
- `docs/decisions/<slug>/` — experiment-specific decisions

## Relationship to the main website

The lab and main website are separate repositories, builds, and Cloudflare projects, but remain lightly connected:

- Astro pages link to `erichdonahue.com` in the footer.
- Generated experiment wrappers link to the lab, project notes, and main website.
- The main site's Open Workbench and footer can link back to `lab.erichdonahue.com`.
- A mature experiment may graduate into its own permanent project without breaking its lab history.

The division is intentional: the main website curates project narratives and case studies, while the lab hosts live, runnable artifacts that can be useful before they are fully polished.
