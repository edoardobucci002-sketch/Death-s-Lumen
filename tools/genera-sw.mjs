// Dopo la build: scrive dist/sw.js con l'elenco di tutti i file, così la PWA funziona offline.
// Online prende sempre i file nuovi dalla rete; offline usa la copia salvata.
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
// prima la rete (così chi riapre il link vede sempre l'ultima versione), la copia salvata solo offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./'))));
});
`);
console.log(`sw.js: ${file.length} file in cache (${cache})`);
