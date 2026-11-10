/*
 * Grazia a tacche: sfiorare un nemico normale (né élite né Seth) senza toccarlo dà una tacca; lo stesso nemico
 * non più di una volta ogni tanto. Piene le tacche, parte la Grazia; senza sfiorare calano piano.
 * Qui ci sono anche l'indicatore (un rettangolo sotto la barra della salute, largo e alto come lei, diviso in
 * caselle quante sono le tacche) e la scintilla di ogni tacca.
 * Numeri in GRAZIA.tacche (src/data/sopravvivenza.ts); scintilla e suono si spengono dal Laboratorio (INTERRUTTORI).
 */
import Phaser from 'phaser';
import { GRAZIA } from '../data/sopravvivenza';
import { COMBATTIMENTO, NEMICI } from '../data/nemici';
import { PROFONDITA } from './effetti';
import { INTERRUTTORI } from './interruttori';
import { suona } from './audio';
import type { Orda } from './orda';

const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');
const MAX_SCINTILLE = 8;

export class GraziaTacche {
  tacche = 0;
  guadagnate = 0; // tacche prese in questa notte (per la simulazione)
  private senza = 0; // secondi dall'ultima tacca (per il calo)
  private disegno: Phaser.GameObjects.Graphics;
  private scintille: Phaser.GameObjects.Graphics;
  private sX = new Float32Array(MAX_SCINTILLE);
  private sY = new Float32Array(MAX_SCINTILLE);
  private sVita = new Float32Array(MAX_SCINTILLE);
  private prossima = 0;
  private vista = -1; // «piene, caselle, larghezza» dell'ultimo disegno: si ridisegna solo quando cambia

  constructor(scena: Phaser.Scene, private disegna: boolean) {
    this.disegno = scena.add.graphics().setDepth(PROFONDITA.barra);
    this.scintille = scena.add.graphics().setDepth(PROFONDITA.sopra);
  }

  /**
   * Un passo: cerca i nemici sfiorati intorno a (gx, gy), i piedi del personaggio. Restituisce true quando le tacche
   * arrivano a «massimo» (la Grazia va fatta partire dalla scena). In Grazia le tacche non salgono.
   */
  aggiorna(dt: number, o: Orda, gx: number, gy: number, inGrazia: boolean, massimo: number, sfioro: number): boolean {
    const T = GRAZIA.tacche;
    for (let k = 0; k < MAX_SCINTILLE; k++) if (this.sVita[k] > 0) this.sVita[k] -= dt;
    this.senza += dt;
    if (!inGrazia) {
      for (let i = 0; i < o.numero; i++) {
        if (o.elite[i] || o.tipo[i] === ID_MIETITORE || o.pausaSfioro[i] > 0 || o.salute[i] <= 0) continue;
        const r = o.raggio[i] + COMBATTIMENTO.raggioGiocatore, dx = o.x[i] - gx, dy = o.y[i] - gy, d2 = dx * dx + dy * dy;
        if (d2 < r * r || d2 >= (r + sfioro) * (r + sfioro)) continue; // lo tocca, o è troppo lontano
        o.pausaSfioro[i] = T.pausaNemico;
        this.tacche++;
        this.guadagnate++;
        this.senza = 0;
        this.scintilla(gx + dx / 2, gy + dy / 2 - o.raggio[i]);
        if (this.tacche >= massimo) {
          this.tacche = 0;
          return true;
        }
      }
    }
    if (this.tacche > 0 && this.senza >= T.calo) {
      this.tacche--;
      this.senza = 0;
    }
    return false;
  }

  /** Laboratorio: tacche piene (la Grazia parte al primo sfioro) o vuote. */
  imposta(n: number): void {
    this.tacche = Math.max(0, n);
    this.senza = 0;
  }

  private scintilla(x: number, y: number): void {
    if (INTERRUTTORI.taccheSuono) suona('tacca');
    if (!this.disegna || !INTERRUTTORI.taccheScintilla) return;
    const k = this.prossima;
    this.prossima = (k + 1) % MAX_SCINTILLE;
    this.sX[k] = x;
    this.sY[k] = y;
    this.sVita[k] = GRAZIA.tacche.scintilla.durata;
  }

  /**
   * Disegno, a ogni fotogramma: (sx, sy) l'angolo in alto a sinistra della barra della salute, già arrotondato;
   * larga e alta le sue misure in pixel disegnati, z il suo ingrandimento. Il rettangolo delle tacche sta sotto la barra
   * e ne condivide il bordo di sotto. In Grazia le caselle sono tutte piene.
   */
  mostra(sx: number, sy: number, larga: number, alta: number, z: number, massimo: number, inGrazia: boolean, visibile: boolean): void {
    const T = GRAZIA.tacche, g = this.disegno, piene = inGrazia ? massimo : this.tacche;
    g.setVisible(this.disegna && visibile);
    if (this.disegna && visibile) {
      const chiave = (piene * 100 + massimo) * 1000 + larga;
      if (chiave !== this.vista) {
        this.vista = chiave;
        // caselle e stacchi tutti larghi uguali, in pixel disegnati interi, su tutta la larghezza della barra (caselleIntere):
        // la prima e l'ultima casella arrivano al bordo esterno; sopra e sotto resta la riga scura del bordo
        const c = caselleIntere(larga, massimo);
        g.clear().fillStyle(T.bordo).fillRect(0, 0, larga, alta);
        for (let k = 0; k < massimo; k++) {
          g.fillStyle(k < piene ? T.piena : T.vuota).fillRect(c.margine + k * (c.casella + c.stacco), 1, c.casella, alta - 2);
        }
      }
      g.setPosition(sx, sy + (alta - 1) * z).setScale(z);
    }
    // scintille: una crocetta che si spegne
    const s = this.scintille.clear(), S = T.scintilla, m = Math.round(S.lato * z);
    for (let k = 0; k < MAX_SCINTILLE; k++) {
      if (this.sVita[k] <= 0) continue;
      const x = Math.round(this.sX[k]), y = Math.round(this.sY[k]);
      s.fillStyle(S.colore).fillRect(x - m, y - Math.round(z / 2), 2 * m, Math.max(1, Math.round(z))).fillRect(x - Math.round(z / 2), y - m, Math.max(1, Math.round(z)), 2 * m);
    }
  }

}

/**
 * Caselle a pixel interi (richiesta di Edoardo): «n» caselle tutte larghe uguali, separate da stacchi tutti larghi uguali,
 * su «larga» pixel disegnati (la larghezza intera della barra). Prova lo stacco più stretto (da 1 in su, sempre più stretto
 * della casella) con cui caselle e stacchi fanno esattamente «larga». Se non c'è, caselle e stacchi restano uguali e i pixel
 * che avanzano diventano bordo, divisi tra i due lati (margine). Con la barra di 39: 8 caselle da 4 e 7 stacchi da 1
 * (8 × 4 + 7 = 39); con 4 tacche (Danza macabra) 4 caselle da 9 e 3 stacchi da 1 (4 × 9 + 3 = 39).
 */
export function caselleIntere(larga: number, n: number): { casella: number; stacco: number; margine: number } {
  for (let stacco = 1; stacco <= larga; stacco++) {
    const resto = larga - (n - 1) * stacco;
    if (resto < n) break;
    if (resto % n === 0 && resto / n > stacco) return { casella: resto / n, stacco, margine: 0 };
  }
  const casella = Math.max(1, Math.floor((larga - (n - 1)) / n));
  return { casella, stacco: 1, margine: Math.floor((larga - n * casella - (n - 1)) / 2) };
}
