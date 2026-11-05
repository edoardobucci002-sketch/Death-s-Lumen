/*
 * Luce: disegna il buio intorno alla lanterna con un retino (dither Bayer 4×4), senza trasparenze.
 * Prepara tre versioni con raggi un po' diversi: alternandole la fiamma tremola.
 * Il terreno è già scuro, quindi il solo buio non basta: dentro la luce un alone caldo (sempre a retino) lo schiarisce.
 */
import Phaser from 'phaser';
import { LUCE } from '../data/mondo';
import { LUCE_LANTERNA } from '../data/rompibili';

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((riga) => riga.map((v) => (v + 0.5) / 16));

export const CHIAVI_BUIO = ['buio-0', 'buio-1', 'buio-2'];
export const CHIAVI_ALONE = ['alone-0', 'alone-1', 'alone-2'];
export const CHIAVI_ALONE_LUME = ['alone-lume-0', 'alone-lume-1', 'alone-lume-2'];
const CHIAVI_FORI = ['foro-lume-0', 'foro-lume-1', 'foro-lume-2'];

/** Il buio copre tutto lo schermo anche quando la luce non è al centro: margine in più. */
export function creaBuio(scena: Phaser.Scene, larghezza: number, altezza: number, raggioBase: number = LUCE.raggio): { w: number; h: number } {
  const w = larghezza + 2 * (LUCE.altezza + 8);
  const h = altezza + 2 * (LUCE.altezza + 8);
  const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt(LUCE.colore.slice(i, i + 2), 16));
  // sul telefono un raggio fisso è largo quasi come lo schermo e il buio non si vedrebbe
  const raggioVero = raggioBase * Math.min(1, (LUCE.quotaSchermo * Math.min(larghezza, altezza)) / LUCE.raggio);
  CHIAVI_BUIO.forEach((chiave, n) => {
    if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
    const tela = scena.textures.createCanvas(chiave, w, h)!;
    const g = tela.getContext();
    const img = g.createImageData(w, h);
    const raggio = raggioVero + (n - 1) * LUCE.tremolio;
    creaAlone(scena, CHIAVI_ALONE[n], raggio * LUCE.raggioAlone, LUCE.densitaAlone);
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / raggio;
        if (d <= 1 || BAYER[y & 3][x & 3] >= Math.min(LUCE.buioMassimo, (d - 1) * LUCE.sfumatura)) continue;
        const i = (y * w + x) * 4;
        img.data[i] = cr;
        img.data[i + 1] = cg;
        img.data[i + 2] = cb;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    tela.refresh();
  });
  return { w, h };
}

/** Il foro di luce di una lanterna a terra: i pixel pieni cancellano il buio. Tre versioni, come per la fiamma del personaggio. */
export function creaFori(scena: Phaser.Scene): { chiavi: string[]; lato: number } {
  const { raggio, sfumatura, tremolio, raggioAlone, densitaAlone } = LUCE_LANTERNA;
  const lato = 2 * Math.ceil((raggio + tremolio) * (1 + 1 / sfumatura));
  CHIAVI_FORI.forEach((chiave, n) => {
    if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
    const tela = scena.textures.createCanvas(chiave, lato, lato)!;
    const g = tela.getContext();
    const img = g.createImageData(lato, lato);
    const r = raggio + (n - 1) * tremolio;
    creaAlone(scena, CHIAVI_ALONE_LUME[n], raggioAlone + (n - 1) * tremolio, densitaAlone);
    for (let y = 0; y < lato; y++) {
      for (let x = 0; x < lato; x++) {
        const d = Math.hypot(x + 0.5 - lato / 2, y + 0.5 - lato / 2) / r;
        if (d > 1 && BAYER[y & 3][x & 3] < (d - 1) * sfumatura) continue;
        img.data[(y * lato + x) * 4 + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    tela.refresh();
  });
  return { chiavi: CHIAVI_FORI, lato };
}

/** Alone caldo: un disco a retino, più fitto al centro, che si somma al terreno. */
function creaAlone(scena: Phaser.Scene, chiave: string, raggio: number, densita: number): void {
  if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
  const lato = 2 * Math.ceil(raggio);
  const tela = scena.textures.createCanvas(chiave, lato, lato)!;
  const g = tela.getContext();
  g.fillStyle = LUCE.coloreAlone;
  for (let y = 0; y < lato; y++) {
    for (let x = 0; x < lato; x++) {
      const d = Math.hypot(x + 0.5 - lato / 2, y + 0.5 - lato / 2) / raggio;
      if (d < 1 && BAYER[y & 3][x & 3] < densita * (1 - d * d)) g.fillRect(x, y, 1, 1);
    }
  }
  tela.refresh();
}
