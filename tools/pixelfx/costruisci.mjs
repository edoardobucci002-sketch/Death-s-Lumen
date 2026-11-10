// Prova pilota pixelfx per Death's Lumen: rende tre effetti come fotogrammi PNG già a retino.
//
// Uso: node tools/pixelfx/costruisci.mjs   (serve pixelfx clonato in DEATH'S LUMEN/pixelfx, accanto a gioco)
// Scrive in DEATH'S LUMEN/prova-pixelfx/fogli/<Nome>/ i fotogrammi f000.png… e info.json (durate, perno),
// più un'anteprima ingrandita in prova-pixelfx/anteprime/<Nome>.png. Poi tools/pixelfx/in-aseprite.lua li monta
// nei segnaposto V0 (vedi tools/pixelfx/LEGGIMI.md).
//
// Regole del gioco (CLAUDE.md): nessuna trasparenza. Ogni pixel con alfa parziale (fumo, aloni, luce)
// diventa pieno o vuoto secondo una matrice di Bayer 4×4. Misure: un pixel dell'effetto = un pixel del gioco.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const ARTE = resolve(QUI, '..', '..', '..'); // la cartella DEATH'S LUMEN
const BASE = join(ARTE, 'prova-pixelfx');
const PFX = join(ARTE, 'pixelfx');
const imp = (p) => import(pathToFileURL(join(PFX, p)).href);
const { loadEffect, renderFrames } = await imp('tools/lib/fxlib.mjs');
const { encodePNG } = await imp('tools/lib/png.mjs');
const { Painter } = await imp('src/core/painter.js');

// ---- pennello in scala: l'effetto disegna con le sue misure, le coordinate si moltiplicano per S
let S = 1;
const P = Painter.prototype;
P.toX = function (x, y) { return this.tx + S * (x * this.fx * this.cs - y * this.sn); };
P.toY = function (x, y) { return this.ty + S * (x * this.fx * this.sn + y * this.cs); };
P.fromX = function (sx, sy) { const dx = (sx - this.tx) / S, dy = (sy - this.ty) / S; return (dx * this.cs + dy * this.sn) * this.fx; };
P.fromY = function (sx, sy) { const dx = (sx - this.tx) / S, dy = (sy - this.ty) / S; return -dx * this.sn + dy * this.cs; };
for (const nome of ['glow', 'glowLine', 'glowRing']) {
  const orig = P[nome];
  // i raggi della luce sono in pixel dello schermo: vanno scalati a parte
  P[nome] = function (...a) {
    if (nome === 'glow') a[2] *= S;
    if (nome === 'glowLine') a[4] *= S;
    if (nome === 'glowRing') (a[2] *= S), (a[3] *= S);
    return orig.apply(this, a);
  };
}

// ---- retino di Bayer 4×4 (soglie 0,5/16 … 15,5/16)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
function aRetino(rgba, w, h) {
  const out = new Uint8ClampedArray(rgba.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = rgba[i + 3] / 255;
      if (a <= 0 || a <= BAYER[((y & 3) << 2) | (x & 3)]) continue;
      out[i] = rgba[i]; out[i + 1] = rgba[i + 1]; out[i + 2] = rgba[i + 2]; out[i + 3] = 255;
    }
  return out;
}

// taglia i bordi vuoti comuni a tutti i fotogrammi; il perno si sposta di conseguenza
function rifila(frames, w, h, perno) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (const f of frames)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (f[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  // simmetrico in orizzontale intorno al perno: il gioco misura il raggio dal centro
  const m = Math.max(perno[0] - x0, x1 + 1 - perno[0]);
  x0 = Math.max(0, perno[0] - m); x1 = Math.min(w - 1, perno[0] + m - 1);
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const tagliati = frames.map((f) => {
    const o = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) o.set(f.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4), y * W * 4);
    return o;
  });
  return { frames: tagliati, w: W, h: H, perno: [perno[0] - x0, perno[1] - y0] };
}

// anteprima: i fotogrammi in fila su un terreno scuro, ingranditi 2×, con un'ellisse 2:1 grigia dell'area vera
function anteprima(nome, r, area) {
  const k = 2, max = 12, passo = Math.max(1, Math.ceil(r.frames.length / max)), scelti = r.frames.filter((_, i) => i % passo === 0);
  const W = r.w * k, H = r.h * k, cols = Math.min(6, scelti.length), rows = Math.ceil(scelti.length / cols);
  const img = new Uint8ClampedArray(W * cols * H * rows * 4);
  for (let i = 0; i < img.length; i += 4) (img[i] = 0x1b), (img[i + 1] = 0x16), (img[i + 2] = 0x14), (img[i + 3] = 255);
  scelti.forEach((f, n) => {
    const ox = (n % cols) * W, oy = Math.floor(n / cols) * H;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const s = (Math.floor(y / k) * r.w + Math.floor(x / k)) * 4, d = ((oy + y) * W * cols + ox + x) * 4;
        if (f[s + 3]) (img[d] = f[s]), (img[d + 1] = f[s + 1]), (img[d + 2] = f[s + 2]);
        else if (area) {
          const ex = (x / k - r.perno[0]) / area, ey = (y / k - r.perno[1]) / (area / 2), e = ex * ex + ey * ey;
          if (Math.abs(e - 1) < 0.02) (img[d] = img[d + 1] = img[d + 2] = 0x70);
        }
      }
  });
  writeFileSync(join(BASE, 'anteprime', `${nome}.png`), encodePNG(W * cols, H * rows, img));
}

function salva(nome, r, durate, area) {
  const dir = join(BASE, 'fogli', nome);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  r.frames.forEach((f, i) => writeFileSync(join(dir, `f${String(i).padStart(3, '0')}.png`), encodePNG(r.w, r.h, f)));
  writeFileSync(join(dir, 'info.json'), JSON.stringify({ nome, w: r.w, h: r.h, perno: r.perno, durate }, null, 1));
  anteprima(nome, r, area);
  const mb = (r.w * r.h * 4 * r.frames.length) / 1048576;
  console.log(`${nome.padEnd(22)} ${r.frames.length} fotogrammi ${r.w}×${r.h}  perno ${r.perno}  memoria video ≈ ${mb.toFixed(1)} MB`);
  return mb;
}

/** Rende un effetto: scala S, fps, opzioni; restituisce i fotogrammi a retino e rifilati. */
function rendi(fx, { scala = 1, fps = 15, opzioni = {}, margine = 0 }) {
  S = scala;
  const r = renderFrames(fx, { fps, bg: 'none', actor: false, options: opzioni, margin: margine });
  S = 1;
  const frames = r.frames.map((f) => aRetino(f.clear, r.w, r.h));
  return { frames, w: r.w, h: r.h, perno: [fx.meta.origin[0] + margine, fx.meta.origin[1] + margine], fps };
}

const FPS = 15; // da rivedere: gli sprite del gioco vanno a 8–10 fotogrammi al secondo
mkdirSync(join(BASE, 'anteprime'), { recursive: true });
let totale = 0;

// 1) Sepoltura: un gruppo di mani (grandezza naturale); il gioco ne mette diversi nell'area
{
  const fx = await loadEffect('shadow/grasping-hands', join(PFX, 'src/fx'));
  const r = rifila(...(() => { const x = rendi(fx, { fps: FPS, opzioni: { palette: ['#140e0a', '#2e2216', '#54402a', '#7c6246', '#b89a74', '#dcc8a2', '#f2e6cc'] } }); return [x.frames, x.w, x.h, x.perno]; })());
  totale += salva('Sepoltura_mani', r, r.frames.map(() => Math.round(1000 / FPS)));
}

// 2) Pozza dell'Acqua santa: una versione per gradino di raggio (circa +20% l'una)
const RAGGI_POZZA = [89, 107, 129, 155, 186];
for (const raggio of RAGGI_POZZA) {
  const fx = await loadEffect('water/pozza', join(QUI, 'fx'));
  fx.meta.size = [raggio * 2 + 8, raggio + 24];
  fx.meta.origin = [raggio + 4, Math.ceil(raggio / 2) + 16];
  const x = rendi(fx, { fps: FPS, opzioni: { r: raggio, palette: ['#081830', '#0e2e5a', '#14508c', '#1c76bc', '#58b4ec', '#c4ecff', '#fff6d8'] } });
  const r = rifila(x.frames, x.w, x.h, x.perno);
  totale += salva(`Pozza_${String(raggio).padStart(3, '0')}`, r, r.frames.map(() => Math.round(1000 / FPS)), raggio);
}

// 3) Eclissi: colori originali, rimpicciolita fino all'area disegnata (64 × 1,35 ≈ 86 px di raggio) e accelerata a 1,1 s
{
  const fx = await loadEffect('shadow/dark-explosion', join(PFX, 'src/fx'));
  const RAGGIO = Math.round(64 * 1.35), NATIVO = 122; // NATIVO: raggio massimo dell'anello originale, misurato sui fotogrammi
  const scala = RAGGIO / NATIVO;
  const x = rendi(fx, { fps: 30, scala, margine: 0 });
  const DUR = 1.1, n = Math.round(DUR * FPS);
  const scelti = Array.from({ length: n }, (_, i) => x.frames[Math.round((i * (x.frames.length - 1)) / (n - 1))]);
  const r = rifila(scelti, x.w, x.h, x.perno);
  const passo = Math.round((DUR * 1000) / n);
  totale += salva('Eclissi', r, r.frames.map(() => passo), RAGGIO);
}
console.log(`totale memoria video ≈ ${totale.toFixed(1)} MB`);
