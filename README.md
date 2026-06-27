# Erich's Lab

A low-ceremony public shelf for small tools, studies, data experiments, and prototypes. Experiments can remain simple static builds or later graduate into their own repositories and services.

## Current experiment

- **Music-Credit Graph Study Lab** — an adaptive architecture quiz with its full study guide embedded in one portable HTML file.

## Run locally

No build step is required.

```bash
python3 -m http.server 8000 -d public
```

Then open <http://localhost:8000>.

Validate the catalog and experiment files with Node 22 or newer:

```bash
node scripts/validate-lab.mjs
```

## Add an experiment

1. Create `public/experiments/<slug>/`.
2. Add an `index.html` clean-route entry point.
3. Add the actual experiment assets.
4. Add `experiment.json` using the existing experiment as a template.
5. Add the same record to `public/experiments/experiments.json`.
6. Run `node scripts/validate-lab.mjs`.

The catalog homepage is rendered from `public/experiments/experiments.json`. The duplicated per-experiment manifest keeps each experiment portable and self-describing; validation prevents the two records from drifting apart.

## Deploy to Cloudflare Workers Static Assets

The repository includes `wrangler.jsonc` and serves the `public/` directory directly.

Manual deployment:

```bash
npx wrangler deploy
```

For automatic deployments, import this GitHub repository in **Cloudflare Workers & Pages → Create application → Import a repository**. Use the Worker name `erich-lab` so it matches `wrangler.jsonc`, and use `npx wrangler deploy` as the deploy command.

Cloudflare will initially provide a `workers.dev` address. A custom hostname such as `lab.erichdonahue.com` can be attached later.

## Repository structure

```text
public/
├── index.html                  # Lab catalog
├── styles.css
├── lab.js
├── 404.html
└── experiments/
    ├── experiments.json       # Catalog source
    └── music-graph-study/
        ├── index.html          # Stable clean route
        ├── experiment.json     # Portable metadata
        └── music_graph_study_lab_complete_fixed.html
scripts/
└── validate-lab.mjs
.github/workflows/
└── validate.yml
wrangler.jsonc
```

## Design intent

- GitHub is the source of truth.
- Cloudflare serves public static assets.
- The x600 is a development and build machine, not a required public host.
- The ZimaBoard can later provide APIs for experiments that genuinely need a home backend.
- Small standalone HTML builds are first-class projects; frameworks are introduced only when they earn their complexity.
