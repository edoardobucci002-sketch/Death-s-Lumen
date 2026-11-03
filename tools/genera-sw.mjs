// Dopo la build: scrive dist/sw.js con l'elenco di tutti i file, così la PWA funziona offline.
// Online prende sempre i file nuovi dalla rete; offline usa la copia salvata.
// Il link pubblico e quello di prova (sottocartella prova/) stanno sullo stesso sito:
// ognuno tiene la sua copia e lascia stare quella dell'altro.
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
const versione = hash.digest('hex').slice(0, 10);
writeFileSync(join(dist, 'sw.js'), `// generato da tools/genera-sw.mjs: non modificare a mano
const PREFISSO = 'dl ' + self.registration.scope + ' ';
const CACHE = PREFISSO + '${versione}';
const FILE = ${JSON.stringify(['./', ...file])};
// le pagine nella sottocartella prova/ hanno il loro service worker
const PROVA = new URL('prova/', self.registration.scope).pathname;
const mia = (k) => k.startsWith(PREFISSO) || k.startsWith('dl-'); // 'dl-…': nome delle copie prima dei due link
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => mia(k) && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
// prima la rete (così chi riapre il link vede sempre l'ultima versione), la copia salvata solo offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  if (new URL(e.request.url).pathname.startsWith(PROVA)) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true, cacheName: CACHE }).then((r) => r || caches.match('./', { cacheName: CACHE }))));
});
`);
console.log(`sw.js: ${file.length} file in cache (versione ${versione})`);
