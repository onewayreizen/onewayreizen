import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Pas dit aan zodra je je eigen domein hebt gekocht
  site: 'https://onewayreizen.nl',
  integrations: [sitemap()],
});
