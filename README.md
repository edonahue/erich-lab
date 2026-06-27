# Erich's Lab

A low-ceremony public shelf for small tools, studies, data experiments, and prototypes. Astro builds the catalog and project notes; standalone experiments remain portable under `public/experiments/`.

## Current experiment

- **Music-Credit Graph Study Lab** — an adaptive architecture quiz with its full study guide embedded in one portable HTML file.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Validate content and create a production build:

```bash
npm run check
```

## Content editing with Pages CMS

Pages CMS edits Markdown and media directly in this GitHub repository.

- Experiment entries live in `src/content/experiments/`.
- Preview media lives in `public/images/`.
- The runnable applications live separately in `public/experiments/`.
- `.pages.yml` defines the editor fields and media paths.

The experiment filename becomes the stable project-notes URL. For example:

```text
src/content/experiments/music-graph-study.md
→ /projects/music-graph-study/
```

Its `launchPath` points to the independently runnable application:

```text
/experiments/music-graph-study/
```

## Add an experiment

1. Create `public/experiments/<slug>/` and add a clean-route `index.html`.
2. Add the experiment assets to that folder.
3. Create `src/content/experiments/<slug>.md` through Pages CMS or Git.
4. Add an optional preview image under `public/images/experiments/`.
5. Run `npm run check`.

## Deploy to Cloudflare Workers

Astro outputs the static site to `dist/`; Wrangler deploys that directory through Workers Static Assets.

```bash
npm run deploy
```

The Worker name is `erich-lab`, and `wrangler.jsonc` also declares the custom domain `lab.erichdonahue.com`.

### Enable automatic deployments

The existing Worker must be connected to GitHub in Cloudflare:

1. Open **Workers & Pages → erich-lab → Settings → Builds**.
2. Select **Connect** and authorize `edonahue/erich-lab`.
3. Set the production branch to `main` and root directory to `/`.
4. Use `npm run build` as the build command.
5. Use `npx wrangler deploy` as the deploy command.
6. Save and deploy.

After that, pushes to `main` deploy automatically and pull requests receive preview builds.

## Repository structure

```text
src/
├── content/experiments/       # Pages CMS-managed Markdown
├── layouts/                   # Shared Astro layout
├── pages/                     # Catalog, project notes, 404
└── styles/                    # Shared site styling
public/
├── images/experiments/        # CMS-managed preview media
└── experiments/               # Independently runnable builds
scripts/
└── validate-lab.mjs
.pages.yml
astro.config.mjs
package.json
wrangler.jsonc
```

## Design intent

- GitHub is the source of truth.
- Pages CMS is the editorial interface, not a separate database.
- Cloudflare serves the Astro output and future edge APIs.
- The x600 is a development and build machine, not a required public host.
- The ZimaBoard can later provide APIs for experiments that genuinely need a home backend.
- Small standalone HTML builds remain first-class projects.
