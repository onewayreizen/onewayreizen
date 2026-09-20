import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeFotos from './src/lib/rehype-fotos.mjs';

export default defineConfig({
  // Pas dit aan zodra je je eigen domein hebt gekocht
  site: 'https://onewayreizen.nl',
  integrations: [sitemap()],
  // Zorgt dat foto's in artikelen een bijschrift en positie kunnen krijgen
  markdown: { rehypePlugins: [rehypeFotos] },
});
