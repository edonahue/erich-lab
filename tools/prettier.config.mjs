import { fileURLToPath } from 'node:url';

const astroPlugin = fileURLToPath(new URL('./node_modules/prettier-plugin-astro/dist/index.js', import.meta.url));

export default {
  plugins: [astroPlugin],
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      files: '*.astro',
      options: { parser: 'astro' },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: { singleQuote: false },
    },
  ],
};
