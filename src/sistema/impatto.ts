/*
 * Impatto dei colpi (gioco a stanze, 13/11): le scintille che schizzano da un nemico colpito, nella direzione del colpo,
 * più tante quando lo batti. Quadratini di luce a pixel interi che volano e si spengono. Solo da vedere: hanno un loro
 * generatore del caso, così non cambiano la partita. Fermo d'impatto e schiacciamento stanno in nemici-stanza.ts, la
 * scossa e il suono nella scena. Numeri in IMPATTO (src/data/stanze.ts).
 */
import Phaser from 'phaser';
import { IMPATTO } from '../data/stanze';
import { PROFONDITA } from './effetti';
import { Caso } from './caso';

const MAX = 64;
const S = IMPATTO.scintille;
const COLORI = S.colori.map((c) => parseInt(c.slice(1), 16));

export class Impatto {
  private x = new Float32Array(MAX);
  private y = new Float32Array(MAX);
  private vx = new Float32Array(MAX);
  private vy = new Float32Array(MAX);
  private vita = new Float32Array(MAX);
  private colore = new Uint8Array(MAX);
  private prossima = 0;
  private readonly caso = new Caso(7331); // solo per il disegno
  private readonly grafica: Phaser.GameObjects.Graphics;

  constructor(scena: Phaser.Scene) {
    this.grafica = scena.add.graphics().setDepth(PROFONDITA.sopra);
  }

  /** «quante» scintille da (x, y) verso (dx, dy) (lunga 1), sparse a ventaglio. */
  scintille(x: number, y: number, dx: number, dy: number, quante: number): void {
    const base = Math.atan2(dy, dx);
    for (let k = 0; k < quante; k++) {
      const i = this.prossima;
      this.prossima = (i + 1) % MAX;
      const a = base + (this.caso.numero() * 2 - 1) * 1.1, v = S.velocita * (0.5 + this.caso.numero() * 0.7);
      this.x[i] = x;
      this.y[i] = y;
      this.vx[i] = Math.cos(a) * v;
      this.vy[i] = Math.sin(a) * v;
      this.vita[i] = S.durata * (0.6 + this.caso.numero() * 0.4);
      this.colore[i] = this.caso.intero(0, COLORI.length - 1);
    }
  }

  /** Avanza e disegna (al disegno, con il tempo del fotogramma). */
  disegna(dt: number): void {
    const g = this.grafica.clear(), l = S.lato;
    for (let i = 0; i < MAX; i++) {
      if (this.vita[i] <= 0) continue;
      this.vita[i] -= dt;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.vx[i] *= 0.9;
      this.vy[i] *= 0.9;
      if (this.vita[i] <= 0) continue;
      // nell'ultimo terzo diventano di un pixel solo: si spengono senza trasparenza
      const lato = this.vita[i] < S.durata / 3 ? 1 : l;
      g.fillStyle(COLORI[this.colore[i]]).fillRect(Math.round(this.x[i]), Math.round(this.y[i]), lato, lato);
    }
  }
}
