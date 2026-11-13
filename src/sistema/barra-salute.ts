/*
 * Barra della salute del personaggio nel gioco a stanze: la stessa del survivor (BARRA_SALUTE in src/data/mondo.ts),
 * sotto i piedi e sopra il buio. Il rosso si accorcia da destra, «rimasta/massima» al centro; il valore mostrato scorre
 * verso quello vero (il pezzo perso resta ambra e si consuma, quello guadagnato è verde). Si ridisegna solo quando cambia.
 * Il survivor ha ancora la sua copia dentro Gioco.ts: quando il survivor si toglie resta solo questa.
 */
import Phaser from 'phaser';
import { BARRA_SALUTE } from '../data/mondo';
import { PROFONDITA } from './effetti';
import { scorri } from './scorrimento';

const esadecimale = (h: string): number => parseInt(h.slice(1), 16);
/** Quante cifre ha un numero intero (senza creare stringhe a ogni fotogramma). */
const quanteCifre = (n: number): number => {
  let c = 1;
  while (n >= 10) { n = Math.floor(n / 10); c++; }
  return c;
};

export class BarraSalute {
  private rett: Phaser.GameObjects.Graphics;
  private numeri: Phaser.GameObjects.BitmapText;
  private vista: number;
  private mostrata = -1;
  private larga: number = BARRA_SALUTE.larghezza;
  private testoX = 0;
  private z = 1;

  constructor(scena: Phaser.Scene, salute: number) {
    this.rett = scena.add.graphics().setDepth(PROFONDITA.barra);
    this.numeri = scena.add.bitmapText(0, 0, 'cifre-nette', '').setOrigin(0).setDepth(PROFONDITA.barra + 0.1);
    this.vista = salute;
  }

  /** Ingrandimento della barra (dipende dallo schermo). */
  scala(z: number): void {
    this.z = z;
    this.rett.setScale(z);
    this.numeri.setScale(z);
  }

  /** Disegno: (px, py) i piedi del personaggio, già arrotondati. */
  disegna(px: number, py: number, salute: number, massima: number, dt: number, visibile: boolean): void {
    const b = BARRA_SALUTE, z = this.z;
    const vera = Math.max(0, Math.min(salute, massima)), max = Math.max(1, Math.round(massima));
    this.vista = scorri(this.vista, vera, massima, dt);
    const ora = Math.max(0, Math.ceil(this.vista));
    const testo = (quanteCifre(ora) + 1 + quanteCifre(max)) * 4 - 1; // cifre larghe 3 più una colonna vuota, l'ultima non conta
    const L = Math.max(b.larghezza, testo + 4), dentro = L - 2;
    const pxVista = Math.round(dentro * Math.min(1, this.vista / max)), pxVera = Math.round(dentro * Math.min(1, vera / max));
    const chiave = ((ora * 10000 + max) * 1000 + pxVista) * 1000 + pxVera;
    if (chiave !== this.mostrata) {
      this.mostrata = chiave;
      this.numeri.setText(`${ora}/${max}`);
      this.larga = L;
      const rosso = Math.min(pxVista, pxVera), scia = Math.max(pxVista, pxVera) - rosso;
      const g = this.rett.clear();
      g.fillStyle(esadecimale(b.bordo)).fillRect(0, 0, L, b.altezza);
      g.fillStyle(esadecimale(b.vuoto)).fillRect(1, 1, dentro, b.altezza - 2);
      if (rosso > 0) g.fillStyle(esadecimale(b.rosso)).fillRect(1, 1, rosso, b.altezza - 2);
      if (scia > 0) g.fillStyle(esadecimale(pxVista > pxVera ? b.danno : b.cura)).fillRect(1 + rosso, 1, scia, b.altezza - 2);
      this.testoX = Math.floor((L - testo) / 2);
    }
    const sx = px - Math.floor((this.larga * z) / 2), sy = py + b.distanza;
    this.rett.setPosition(sx, sy).setVisible(visibile);
    this.numeri.setPosition(sx + this.testoX * z, sy + Math.floor((b.altezza - 5) / 2) * z).setVisible(visibile);
  }
}
