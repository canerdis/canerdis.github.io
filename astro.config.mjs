import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://canerdis.github.io',
  // No `base`: this is a user site served at the domain root.
  // Setting `base` here is the classic cause of "deploys fine, every asset 404s".
  build: { inlineStylesheets: 'never' },
});
