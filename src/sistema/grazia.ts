/*
 * Grazia a tacche: sfiorare un nemico normale (né élite né Seth) senza toccarlo dà una tacca; lo stesso nemico
 * non più di una volta ogni tanto. Piene le tacche, parte la Grazia; senza sfiorare calano piano.
 * Qui ci sono anche l'indicatore (tre posti da provare dal Laboratorio: arco sotto la barra della salute,
 * anello intorno al personaggio, tacche nella fascia accanto all'abilità) e la scintilla di ogni tacca.
 * Numeri in GRAZIA.tacche (src/data/sopravvivenza.ts); scelte del Laboratorio in INTERRUTTORI.
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
  readonly fascia = document.createElement('canvas'); // il posto «fascia»: la mette Speciale accanto al pulsante dell'abilità
  private fasciaVista = '';
  fasciaCambiata = false; // la tela della fascia ha cambiato misura: va rimessa a posto sopra l'abilità

  constructor(scena: Phaser.Scene, private colore: number, private disegna: boolean) {
    this.disegno = scena.add.graphics().setDepth(PROFONDITA.barra);
    this.scintille = scena.add.graphics().setDepth(PROFONDITA.sopra);
    this.fascia.className = 'arte grazia-fascia';
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
   * Disegno, a ogni fotogramma: (px, py) piedi del personaggio già arrotondati, yBarra il bordo basso della barra
   * della salute, z l'ingrandimento della barra, corpo l'altezza del centro del corpo. In Grazia le tacche sono tutte piene.
   */
  mostra(px: number, py: number, yBarra: number, z: number, corpo: number, massimo: number, inGrazia: boolean): void {
    this.fasciaCambiata = false;
    const T = GRAZIA.tacche, g = this.disegno, piene = inGrazia ? massimo : this.tacche, posto = INTERRUTTORI.tacchePosto;
    g.clear();
    if (this.disegna && piene > 0 && posto !== 'fascia') {
      const l = T.lato * z;
      for (let k = 0; k < massimo; k++) {
        let x: number, y: number;
        if (posto === 'arco') {
          // un arco a sorriso sotto la barra, largo quanto la barra
          const t = massimo > 1 ? k / (massimo - 1) - 0.5 : 0;
          x = px + t * (massimo * (T.lato + 1)) * z;
          y = yBarra + T.sottoBarra * z + Math.round(t * t * 4) * z;
        } else {
          const a = -Math.PI / 2 + (k / massimo) * Math.PI * 2;
          x = px + Math.cos(a) * T.raggioAnello * z;
          y = py - corpo + Math.sin(a) * T.raggioAnello * z;
        }
        x = Math.round(x - l / 2);
        y = Math.round(y);
        g.fillStyle(T.bordo).fillRect(x - z, y - z, l + 2 * z, l + 2 * z);
        g.fillStyle(k < piene ? this.colore : T.vuota).fillRect(x, y, l, l);
      }
    }
    // scintille: una crocetta che si spegne
    const s = this.scintille.clear(), S = T.scintilla, m = Math.round(S.lato * z);
    for (let k = 0; k < MAX_SCINTILLE; k++) {
      if (this.sVita[k] <= 0) continue;
      const x = Math.round(this.sX[k]), y = Math.round(this.sY[k]);
      s.fillStyle(S.colore).fillRect(x - m, y - Math.round(z / 2), 2 * m, Math.max(1, Math.round(z))).fillRect(x - Math.round(z / 2), y - m, Math.max(1, Math.round(z)), 2 * m);
    }
    this.mostraFascia(posto === 'fascia' ? piene : -1, massimo);
  }

  /** Il posto «fascia»: una fila di tacche su una piccola tela sopra il pulsante dell'abilità (pixel disegnati). */
  private mostraFascia(piene: number, massimo: number): void {
    const chiave = `${piene}/${massimo}`;
    if (chiave === this.fasciaVista) return;
    this.fasciaVista = chiave;
    this.fascia.hidden = piene < 0;
    if (piene < 0) return;
    const T = GRAZIA.tacche, lato = T.fascia.lato, passo = lato + 2, c = this.fascia, larga = massimo * passo + 1;
    if (c.width !== larga || c.height !== lato + 2) {
      c.width = larga;
      c.height = lato + 2;
      this.fasciaCambiata = true;
    }
    const g = c.getContext('2d')!;
    const esa = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
    for (let k = 0; k < massimo; k++) {
      g.fillStyle = esa(T.bordo);
      g.fillRect(k * passo, 0, lato + 2, lato + 2);
      g.fillStyle = esa(k < piene ? this.colore : T.vuota);
      g.fillRect(k * passo + 1, 1, lato, lato);
    }
  }

  distruggi(): void {
    this.fascia.remove();
  }
}
