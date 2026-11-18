/*
 * Barra della salute del personaggio nel gioco a stanze: la stessa del survivor (BARRA_SALUTE in src/data/mondo.ts),
 * sotto i piedi e sopra il buio. Il rosso si accorcia da destra, «rimasta/massima» al centro; il valore mostrato scorre
 * verso quello vero (il pezzo perso resta ambra e si consuma, quello guadagnato è verde). Si ridisegna solo quando cambia.
 * Il survivor ha ancora la sua copia dentro Gioco.ts: quando il survivor si toglie resta solo questa.
 * Sotto la barra, i sorsi della fiaschetta come pallini (18/11, FIASCHETTA_STANZA.pallini): tanti quanti i sorsi massimi,
 * pieni o vuoti. Un sorso che arriva si accende con un lampo chiaro; quello bevuto lampeggia di bianco e si svuota a scatti
 * finché dura la cura; un premio bevuto subito a fiaschetta piena fa un lampo verde su tutti i pieni.
 */
import Phaser from 'phaser';
import { BARRA_SALUTE } from '../data/mondo';
import { FIASCHETTA_STANZA } from '../data/stanze';
import { FIASCHETTA } from '../data/sopravvivenza';
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
  // i pallini della fiaschetta
  private pallini: Phaser.GameObjects.Graphics;
  private sorsi = -1;
  private premi = 0;
  private lampoNuovi = 0; // secondi di lampo dei pallini appena riempiti
  private daQui = 0; // il primo pallino appena riempito
  private lampoCura = 0; // secondi di lampo verde (premio bevuto subito)
  private chiavePallini = -1;

  constructor(scena: Phaser.Scene, salute: number) {
    this.rett = scena.add.graphics().setDepth(PROFONDITA.barra);
    this.pallini = scena.add.graphics().setDepth(PROFONDITA.barra);
    this.numeri = scena.add.bitmapText(0, 0, 'cifre-nette', '').setOrigin(0).setDepth(PROFONDITA.barra + 0.1);
    this.vista = salute;
  }

  /** Ingrandimento della barra (dipende dallo schermo). */
  scala(z: number): void {
    this.z = z;
    this.rett.setScale(z);
    this.numeri.setScale(z);
    this.pallini.setScale(z);
  }

  /**
   * I pallini dei sorsi, sotto la barra (da chiamare dopo disegna). bevendo: quanto manca alla fine del sorso in corso
   * (1 appena bevuto, 0 nessuno); premi: i premi bevuti subito finora (FiaschettaStanza.premiBevuti).
   */
  disegnaPallini(px: number, py: number, sorsi: number, massimo: number, bevendo: number, premi: number, dt: number, visibile: boolean): void {
    const P = FIASCHETTA_STANZA.pallini, b = BARRA_SALUTE, z = this.z, n = Math.max(0, massimo);
    if (this.sorsi >= 0 && sorsi > this.sorsi) {
      this.daQui = this.sorsi;
      this.lampoNuovi = P.lampo;
    }
    if (premi > this.premi) this.lampoCura = P.lampo;
    this.sorsi = sorsi;
    this.premi = premi;
    if (this.lampoNuovi > 0) this.lampoNuovi -= dt;
    if (this.lampoCura > 0) this.lampoCura -= dt;
    // il pallino che si sta bevendo (l'ultimo pieno è appena diventato vuoto): prima il lampo bianco, poi si svuota a scatti
    const durataLampo = P.lampo, interno = P.lato - 2;
    const bevuto = bevendo > 0 && sorsi < n ? sorsi : -1, passato = 1 - bevendo; // passato: parte del sorso già passata
    const lampoBianco = bevuto >= 0 && passato * FIASCHETTA.durata < durataLampo; // il lampo occupa l'inizio del sorso
    const righe = bevuto < 0 ? 0 : lampoBianco ? interno : Math.max(0, Math.ceil(interno * bevendo)); // righe ancora piene, dal basso
    const chiave = ((((sorsi * 10 + n) * 10 + (bevuto + 1)) * 10 + righe) * 2 + (lampoBianco ? 1 : 0)) * 4 + (this.lampoNuovi > 0 ? 2 : 0) + (this.lampoCura > 0 ? 1 : 0);
    if (chiave !== this.chiavePallini) {
      this.chiavePallini = chiave;
      const g = this.pallini.clear(), c = P.colori, L = P.lato;
      for (let k = 0; k < n; k++) {
        const x = k * (L + P.stacco);
        // il tondo 5 × 5: bordo scuro, dentro 3 × 3
        g.fillStyle(esadecimale(c.bordo)).fillRect(x + 1, 0, L - 2, L).fillRect(x, 1, L, L - 2);
        const pieno = k < sorsi, nuovo = pieno && this.lampoNuovi > 0 && k >= this.daQui;
        const dentro = nuovo ? c.luce : pieno && this.lampoCura > 0 ? c.cura : pieno ? c.pieno : c.vuoto;
        g.fillStyle(esadecimale(dentro)).fillRect(x + 1, 1, interno, interno);
        if (k === bevuto) {
          // il sorso che si beve: bianco, poi le righe piene scendono a scatti
          if (lampoBianco) g.fillStyle(esadecimale(c.lampo)).fillRect(x + 1, 1, interno, interno);
          else if (righe > 0) g.fillStyle(esadecimale(c.pieno)).fillRect(x + 1, 1 + interno - righe, interno, righe);
        } else if (pieno && !nuovo && this.lampoCura <= 0) g.fillStyle(esadecimale(c.luce)).fillRect(x + 1, 1, 1, 1); // il punto di luce
      }
    }
    const larga = n * P.lato + Math.max(0, n - 1) * P.stacco;
    this.pallini.setPosition(px - Math.floor((larga * z) / 2), py + b.distanza + (b.altezza + P.distanza) * z).setVisible(visibile && n > 0);
  }

  /** Disegno: (px, py) i piedi del personaggio, già arrotondati. */
  disegna(px: number, py: number, salute: number, massima: number, dt: number, visibile: boolean, extra = 0): void {
    const b = BARRA_SALUTE, z = this.z;
    const vera = Math.max(0, Math.min(salute, massima)), max = Math.max(1, Math.round(massima));
    this.vista = scorri(this.vista, vera, massima, dt);
    const ora = Math.max(0, Math.ceil(this.vista));
    const testo = (quanteCifre(ora) + 1 + quanteCifre(max)) * 4 - 1; // cifre larghe 3 più una colonna vuota, l'ultima non conta
    const L = Math.max(b.larghezza, testo + 4), dentro = L - 2;
    const pxVista = Math.round(dentro * Math.min(1, this.vista / max)), pxVera = Math.round(dentro * Math.min(1, vera / max));
    const pxExtra = Math.min(dentro, Math.round(dentro * Math.max(0, extra) / max)); // salute in più: un tratto chiaro in fondo (esiste solo a salute piena)
    const chiave = (((ora * 10000 + max) * 1000 + pxVista) * 1000 + pxVera) * 100 + pxExtra;
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
      if (pxExtra > 0) g.fillStyle(esadecimale(b.extra)).fillRect(1 + dentro - pxExtra, 1, pxExtra, b.altezza - 2);
      this.testoX = Math.floor((L - testo) / 2);
    }
    const sx = px - Math.floor((this.larga * z) / 2), sy = py + b.distanza;
    this.rett.setPosition(sx, sy).setVisible(visibile);
    this.numeri.setPosition(sx + this.testoX * z, sy + Math.floor((b.altezza - 5) / 2) * z).setVisible(visibile);
  }
}
