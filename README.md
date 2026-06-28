# Erich's Lab

A low-ceremony public shelf for small tools, studies, data experiments, and prototypes. Astro builds the catalog and project notes; standalone experiments remain portable under `public/experiments/`.

## Current experiment

- **Music-Credit Graph Study Lab** — an adaptive architecture guide and quiz for a collection-seeded graph built with Python, Docker Swarm, columnar data, compact graph snapshots, and a static-first public game.

## Run locally

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Validate content and create a production build:

```bash
npm run check
```

## Content editing with Pages CMS

Pages CMS edits content and media directly in this repository.

- Homepage copy, global links, and the default social image live in `src/data/site.json`.
- Experiment entries live in `src/content/experiments/`.
- Preview media lives in `public/images/`.
- Runnable applications live in `public/experiments/`.
- `.pages.yml` defines status choices, publication controls, and media fields.

The experiment filename and its `slug` form stable URLs:

```text
src/content/experiments/music-graph-study.md
→ /projects/music-graph-study/
→ /experiments/music-graph-study/
```

The public launch path is derived from the slug, so it is not maintained as a second CMS field.

## Add an experiment

1. Create `public/experiments/<slug>/` with an `index.html` entry point.
2. Add the application assets to that folder.
3. Create `src/content/experiments/<slug>.md` through Pages CMS or Git.
4. Keep the filename and frontmatter `slug` identical.
5. Add an optional preview image under `public/images/experiments/`.
6. Run `npm run check`.

## Theme contract

The public lab defaults to dark and stores its preference independently from the main website.

```text
Storage key: erich-lab-theme
Root attribute: data-theme="dark" | data-theme="light"
Default: dark
```

Every Astro page uses the shared header toggle. Standalone experiment wrappers must expose the same toggle and make embedded applications follow the selected theme. An experiment may keep its own visual identity, but it should map its colors to both dark and light presentation states rather than ignoring the lab preference.

## Delivery and maintenance

Astro outputs the static site to `dist/`; Wrangler deploys that directory through Workers Static Assets.

```bash
npm run deploy
```

Cloudflare build settings:

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

The repository also includes:

- `public/_headers` for conservative browser headers and immutable Astro asset caching
- `package-lock.json` for repeatable installs
- low-volume Dependabot updates for npm and GitHub Actions
- GitHub Actions validation and a complete Astro production build

## Relationship to the main website

The lab and main website are separate repositories, builds, and Cloudflare projects, but remain lightly connected:

- Astro pages link to `erichdonahue.com` in the footer.
- Standalone experiment wrappers link to both the lab and the main website.
- The main site's Open Workbench and global footer link back to `lab.erichdonahue.com`.
- A later design project may align typography, spacing, and other visual details without making the sites identical.

The division is intentional: the main website curates project narratives and case studies, while the lab hosts live, runnable artifacts that can be useful before they are fully polished.

## Design intent

- GitHub is the source of truth.
- Pages CMS is the editorial interface, not a separate database.
- Cloudflare serves the Astro output and future edge APIs.
- A workstation-class development and build machine is not a required public host.
- A local control node can later provide bounded APIs for experiments that genuinely need a home backend.
- Public project pages describe roles and data flow; exact home infrastructure and operational runbooks stay private.
- Small standalone HTML builds remain first-class projects.
