/*
 * Luce: disegna il buio intorno alla lanterna con un retino (dither Bayer 4×4), senza trasparenze.
 * Prepara tre versioni con raggi un po' diversi: alternandole la fiamma tremola.
 */
import Phaser from 'phaser';
import { LUCE } from '../data/mondo';

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((riga) => riga.map((v) => (v + 0.5) / 16));

export const CHIAVI_BUIO = ['buio-0', 'buio-1', 'buio-2'];

/** Il buio copre tutto lo schermo anche quando la luce non è al centro: margine in più. */
export function creaBuio(scena: Phaser.Scene, larghezza: number, altezza: number, raggioBase: number = LUCE.raggio): { w: number; h: number } {
  const w = larghezza + 2 * (LUCE.altezza + 8);
  const h = altezza + 2 * (LUCE.altezza + 8);
  const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt(LUCE.colore.slice(i, i + 2), 16));
  CHIAVI_BUIO.forEach((chiave, n) => {
    if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
    const tela = scena.textures.createCanvas(chiave, w, h)!;
    const g = tela.getContext();
    const img = g.createImageData(w, h);
    const raggio = raggioBase + (n - 1) * LUCE.tremolio;
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
