# Development toolchain

The Astro application and its development tools use separate npm lockfiles.

- Root `package.json` and `package-lock.json` contain application and deployment dependencies.
- `tools/package.json` and `tools/package-lock.json` contain exact versions of Prettier, `prettier-plugin-astro`, and Playwright Test.

Install both environments:

```bash
npm ci
npm run tools:install
```

Run the normal quality checks:

```bash
npm run format
npm run format:check
npm run check
```

Install Chromium once for the locked Playwright version and run the browser suite:

```bash
npm run --prefix tools playwright:install -- chromium
npm run test:smoke
```

`prettier.config.mjs` is the canonical formatting configuration. It explicitly loads `prettier-plugin-astro` and selects the Astro parser for `.astro` files. Generated wrappers, download artifacts, build output, and lockfiles remain excluded through `.prettierignore`.

When upgrading development tools, update `tools/package.json`, regenerate `tools/package-lock.json`, and run the full quality suite. Do not add floating formatter or browser-test installations to CI.
