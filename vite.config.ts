import { defineConfig } from 'vite';

// base './': gli indirizzi relativi funzionano sia su GitHub Pages sia dentro l'app nativa.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsDir: 'codice', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { host: true },
});
