// Dopo la build: scrive dist/sw.js con l'elenco di tutti i file, così la PWA funziona offline.
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const dist = 'dist';
const file = [];
const hash = createHash('sha1');
(function giro(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) giro(p);
    else if (n !== 'sw.js') {
      file.push(relative(dist, p).split('\\').join('/'));
      hash.update(readFileSync(p));
    }
  }
})(dist);
const cache = 'dl-' + hash.digest('hex').slice(0, 10);
writeFileSync(join(dist, 'sw.js'), `// generato da tools/genera-sw.mjs: non modificare a mano
const CACHE = '${cache}';
const FILE = ${JSON.stringify(['./', ...file])};
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).catch(() => caches.match('index.html'))));
});
`);
console.log(`sw.js: ${file.length} file in cache (${cache})`);
