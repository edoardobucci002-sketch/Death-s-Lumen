/*
 * Comparsa delle carte (gioco a stanze, richiesta di Edoardo del 13/11): quando ogni striscia finisce di salire, sopra di
 * lei scoppia l'effetto pixelfx «collect-burst» ricolorato in oro (Pixelfx_Comparsa_carta, fatto con
 * tools/pixelfx/costruisci.mjs): un lampo con la croce di luce, due anelli e scintille che restano sospese e si spengono,
 * centrato sull'icona della carta.
 * Le carte sono HTML sopra il gioco: i fotogrammi si copiano dalla texture di Phaser su una tela per carta, a pixel interi.
 * Numeri in PERCORSO.carte (src/data/stanze.ts).
 */
import type Phaser from 'phaser';
import { PERCORSO } from '../data/stanze';
import { STRISCIA } from '../data/hud';
import type { MisureHud } from './arte';
import { suona } from './audio';

interface Fotogramma { img: CanvasImageSource; sx: number; sy: number; sw: number; sh: number; dx: number; dy: number }

export class ComparsaCarte {
  private fotogrammi: Fotogramma[] = [];
  private w = 0;
  private h = 0;
  private attese: number[] = [];

  constructor(scena: Phaser.Scene) {
    const k = PERCORSO.carte.effetto;
    if (!scena.textures.exists(k)) return;
    const t = scena.textures.get(k);
    const nomi = t.getFrameNames().sort((a, b) => Number(a) - Number(b));
    for (const n of nomi) {
      const f = t.get(n);
      this.w = f.realWidth;
      this.h = f.realHeight;
      // x, y: dove va il pezzo ritagliato dentro il fotogramma intero (Aseprite toglie i bordi vuoti)
      this.fotogrammi.push({ img: f.source.image as CanvasImageSource, sx: f.cutX, sy: f.cutY, sw: f.cutWidth, sh: f.cutHeight, dx: f.x, dy: f.y });
    }
  }

  /** Su ogni carta (in ordine) l'effetto parte quando la sua salita finisce; z: l'ingrandimento delle strisce. */
  suCarte(carte: HTMLElement[], z: number, m: MisureHud): void {
    this.ferma();
    if (!this.fotogrammi.length) return;
    const C = PERCORSO.carte;
    carte.forEach((carta, i) => {
      const t = window.setTimeout(() => this.scoppia(carta, z, m), (C.salita + i * C.sfasamento) * 1000);
      this.attese.push(t);
    });
  }

  /** Toglie le attese in corso (le carte si sono chiuse). */
  ferma(): void {
    for (const t of this.attese) clearTimeout(t);
    this.attese = [];
    for (const e of document.querySelectorAll('.doni-comparsa')) e.remove();
  }

  private scoppia(carta: HTMLElement, z: number, m: MisureHud): void {
    if (!carta.isConnected) return;
    const tela = document.createElement('canvas');
    tela.width = this.w;
    tela.height = this.h;
    tela.className = 'doni-comparsa';
    // centrato sul riquadro dell'icona: sembra che a comparire sia l'oggetto della carta
    const ic = STRISCIA.interni.icona, cx = (ic.x + ic.l / 2) * z, cy = (ic.y + ic.a / 2) * z;
    Object.assign(tela.style, {
      width: `${this.w * z * m.px}px`, height: `${this.h * z * m.px}px`,
      left: `${Math.round(cx - (this.w * z) / 2) * m.px}px`, top: `${Math.round(cy - (this.h * z) / 2) * m.px}px`,
    });
    carta.append(tela);
    suona('cera');
    const g = tela.getContext('2d')!;
    const passo = 1000 / PERCORSO.carte.fps;
    let n = 0;
    const disegna = (): void => {
      if (n >= this.fotogrammi.length || !tela.isConnected) {
        tela.remove();
        return;
      }
      const f = this.fotogrammi[n++];
      g.clearRect(0, 0, this.w, this.h);
      g.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, f.dx, f.dy, f.sw, f.sh);
      this.attese.push(window.setTimeout(disegna, passo));
    };
    disegna();
  }
}
