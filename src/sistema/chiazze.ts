/*
 * Chiazze d'olio: una lanterna rotta lascia a terra una pozza che rallenta i nemici. Un'arma di fuoco la accende:
 * allora brucia per qualche secondo, ferisce chi ci sta dentro e fa luce. Il personaggio non subisce niente.
 * I disegni sono provvisori, fatti qui a retino (il terreno sta sotto, niente trasparenze), finché Edoardo non li disegna:
 * Chiazza_olio_0…2 (l'ultimo è il più asciutto) e Chiazza_fuoco_0…2 (si alternano) possono diventare suoi file.
 */
import Phaser from 'phaser';
import { CHIAZZE } from '../data/rompibili';
import type { Arsenale } from './armi';
import { Caso } from './caso';
import { PROFONDITA } from './effetti';
import { CHIAVI_ALONE_LUME } from './luce';
import type { Orda } from './orda';

const MAX = 12;
const CHIAVI_OLIO = ['Chiazza_olio_0', 'Chiazza_olio_1', 'Chiazza_olio_2'];
const CHIAVI_FUOCO = ['Chiazza_fuoco_0', 'Chiazza_fuoco_1', 'Chiazza_fuoco_2'];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const OLIO = ['#1d170c', '#33280f', '#5a4518', '#8a6a24'];
const FUOCO = ['#a82e24', '#e3913a', '#ffd27e'];

/** Il bordo irregolare della chiazza: stessa forma per olio e fuoco. */
function forma(ang: number): number {
  return 0.86 + 0.09 * Math.sin(ang * 3 + 1) + 0.05 * Math.sin(ang * 7 + 2);
}

function creaDisegni(scena: Phaser.Scene): void {
  const lato = 2 * CHIAZZE.raggio;
  const c = CHIAZZE.raggio;
  const punti = (chiave: string, colore: (x: number, y: number, d: number) => string | null): void => {
    if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
    const tela = scena.textures.createCanvas(chiave, lato, lato)!;
    const g = tela.getContext();
    for (let y = 0; y < lato; y++) {
      for (let x = 0; x < lato; x++) {
        const dx = x + 0.5 - c, dy = (y + 0.5 - c) * 1.25; // schiacciata: è a terra
        const d = Math.hypot(dx, dy) / c / forma(Math.atan2(dy, dx));
        if (d >= 1) continue;
        const k = colore(x, y, d);
        if (!k) continue;
        g.fillStyle = k;
        g.fillRect(x, y, 1, 1);
      }
    }
    tela.refresh();
  };
  const olio = (x: number, y: number, d: number): string => {
    const b = BAYER[(y & 3) * 4 + (x & 3)];
    if (d > 0.93) return OLIO[3]; // orlo lucido
    const riflesso = Math.sin((x + y * 2) * 0.09) * 0.5 + 0.5;
    return b < riflesso * 0.55 * (1 - d) + 0.1 ? OLIO[2] : b < 0.55 ? OLIO[1] : OLIO[0];
  };
  CHIAVI_OLIO.forEach((chiave, n) => punti(chiave, (x, y, d) => (BAYER[(y & 3) * 4 + (x & 3)] < 1 - n * 0.33 ? olio(x, y, d) : null)));
  CHIAVI_FUOCO.forEach((chiave, n) => {
    const caso = new Caso(77 + n);
    const lingue = new Map<number, number>(); // per ogni colonna da 4 px, dove stanno le lingue di fuoco
    for (let i = 0; i < 420; i++) lingue.set(caso.intero(0, lato >> 2) * 1000 + caso.intero(0, lato >> 2), Math.min(2, caso.intero(0, 3)));
    punti(chiave, (x, y, d) => {
      const lingua = lingue.get((x >> 2) * 1000 + (y >> 2)); // al centro le fiamme sono più chiare
      if (lingua !== undefined && BAYER[(y & 3) * 4 + (x & 3)] < 0.95 - d * 0.5) return FUOCO[d > 0.75 ? Math.min(lingua, 1) : lingua];
      return BAYER[(y & 3) * 4 + (x & 3)] < 0.3 ? FUOCO[0] : OLIO[0];
    });
  });
}

export class Chiazze {
  numero = 0;
  readonly x = new Float32Array(MAX);
  readonly y = new Float32Array(MAX);
  readonly fuoco = new Float32Array(MAX); // secondi di fuoco rimasti: 0 = spenta
  private vita = new Float32Array(MAX); // secondi di olio rimasti
  private attesa = new Float32Array(MAX);
  private sprite: Phaser.GameObjects.Image[] = [];
  private alone: Phaser.GameObjects.Image[] = [];
  private corrente = 0;
  private colpo = 0;
  private tempo = 0;
  private visita = (j: number): void => this.tocca(j);

  constructor(scena: Phaser.Scene, private orda: Orda, private arsenale: Arsenale) {
    creaDisegni(scena);
    for (let i = 0; i < MAX; i++) {
      this.sprite.push(scena.add.image(0, 0, CHIAVI_OLIO[0]).setDepth(PROFONDITA.aTerra - 1).setVisible(false));
      this.alone.push(scena.add.image(0, 0, CHIAVI_ALONE_LUME[1]).setDepth(PROFONDITA.terreno + 1).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
    }
  }

  aggiungi(x: number, y: number): void {
    if (this.numero >= MAX) return;
    const i = this.numero++;
    this.x[i] = Math.round(x);
    this.y[i] = Math.round(y);
    this.vita[i] = CHIAZZE.olio;
    this.fuoco[i] = 0;
    this.attesa[i] = 0;
    this.sprite[i].setPosition(this.x[i], this.y[i]).setVisible(true);
  }

  /** Un'arma di fuoco è passata in (x, y): accende la chiazza che tocca. */
  accendi(x: number, y: number): void {
    const r2 = CHIAZZE.raggio * CHIAZZE.raggio;
    for (let i = 0; i < this.numero; i++) {
      const dx = this.x[i] - x, dy = this.y[i] - y;
      if (!this.fuoco[i] && dx * dx + dy * dy < r2) this.fuoco[i] = CHIAZZE.fuoco;
    }
  }

  /** Laboratorio: accende tutte le chiazze. */
  accendiTutte(): void {
    for (let i = 0; i < this.numero; i++) if (!this.fuoco[i]) this.fuoco[i] = CHIAZZE.fuoco;
  }

  /** Da chiamare dopo le armi: la griglia dei nemici è aggiornata. */
  aggiorna(dt: number): void {
    this.tempo += dt;
    for (let i = this.numero - 1; i >= 0; i--) {
      const accesa = this.fuoco[i] > 0;
      if (accesa) this.fuoco[i] -= dt;
      else this.vita[i] -= dt;
      if ((accesa && this.fuoco[i] <= 0) || (!accesa && this.vita[i] <= 0)) {
        this.togli(i);
        continue;
      }
      this.attesa[i] -= dt;
      if (this.attesa[i] > 0) continue;
      this.attesa[i] += CHIAZZE.intervallo;
      this.corrente = i;
      this.colpo = this.arsenale.nuovoColpo();
      this.orda.griglia.nelRaggio(this.x[i], this.y[i], CHIAZZE.raggio + 40, this.visita);
    }
  }

  disegna(): void {
    const scatto = Math.floor(this.tempo / CHIAZZE.scintilla) % CHIAVI_FUOCO.length;
    for (let i = 0; i < this.numero; i++) {
      const accesa = this.fuoco[i] > 0;
      const asciutta = Math.min(CHIAVI_OLIO.length - 1, Math.floor((1 - this.vita[i] / CHIAZZE.dissolvenza) * CHIAVI_OLIO.length));
      this.sprite[i].setTexture(accesa ? CHIAVI_FUOCO[(scatto + i) % CHIAVI_FUOCO.length] : CHIAVI_OLIO[Math.max(0, asciutta)]);
      this.alone[i].setVisible(accesa);
      if (accesa) this.alone[i].setTexture(CHIAVI_ALONE_LUME[scatto]).setPosition(this.x[i], this.y[i]);
    }
  }

  private tocca(j: number): void {
    const o = this.orda, i = this.corrente;
    if (o.segno[j] === this.colpo || o.salute[j] <= 0) return;
    const dx = o.x[j] - this.x[i], dy = o.y[j] - this.y[i];
    if (dx * dx + dy * dy > CHIAZZE.raggio * CHIAZZE.raggio) return;
    o.segno[j] = this.colpo;
    o.rallenta(j, CHIAZZE.rallenta, CHIAZZE.intervallo + 0.05);
    if (this.fuoco[i] > 0) this.arsenale.brucia(j, CHIAZZE.danno);
  }

  private togli(i: number): void {
    const u = --this.numero;
    const s = this.sprite[i], a = this.alone[i];
    s.setVisible(false);
    a.setVisible(false);
    if (i === u) return;
    this.x[i] = this.x[u];
    this.y[i] = this.y[u];
    this.fuoco[i] = this.fuoco[u];
    this.vita[i] = this.vita[u];
    this.attesa[i] = this.attesa[u];
    this.sprite[i] = this.sprite[u];
    this.alone[i] = this.alone[u];
    this.sprite[u] = s;
    this.alone[u] = a;
  }
}
