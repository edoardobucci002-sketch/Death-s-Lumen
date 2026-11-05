import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';

const prova = process.env.VITE_CANALE === 'prova';

/** Firma delle versioni di prova: codice del commit e ora della build (Europe/Rome). */
function firma(): string {
  if (!prova) return '';
  const commit = execSync('git rev-parse --short=7 HEAD').toString().trim();
  const ora = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date()).replace(', ', ' ');
  return `${commit} ${ora}`;
}
const FIRMA = firma();

// base './': gli indirizzi relativi funzionano sia su GitHub Pages sia dentro l'app nativa.
export default defineConfig({
  base: './',
  define: { __FIRMA__: JSON.stringify(FIRMA) },
  build: { outDir: 'dist', assetsDir: 'codice', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { host: true },
  plugins: [{
    // versione di prova: scrive versione.json (lo legge src/sistema/aggiornamenti.ts) e dà al link in Home il nome «DL link»
    name: 'versione-di-prova',
    apply: 'build',
    writeBundle(opzioni) {
      if (!prova) return;
      const cartella = opzioni.dir ?? 'dist';
      writeFileSync(join(cartella, 'versione.json'), JSON.stringify({ firma: FIRMA }));
    },
    closeBundle() {
      if (!prova) return;
      const file = join(this.environment.config.build.outDir, 'manifest.webmanifest');
      const manifest = JSON.parse(readFileSync(file, 'utf8'));
      writeFileSync(file, JSON.stringify({ ...manifest, name: 'DL link', short_name: 'DL link' }, null, 2));
    },
  }],
});
