/*
 * Oggetti a terra: pane (salute), calamita (attira tutte le anime), reliquiari (potenziamenti), gocce di Cera
 * (la valuta della Cappella: rare, volano verso il personaggio come le anime ma più piano) e frammenti di vetro.
 * Si raccolgono passandoci sopra. Si disegnano sopra il buio, come le anime;
 * un reliquiario fuori dallo schermo è indicato da un segnale lampeggiante sul bordo (HUD/Segnali/Segnale_Reliquiario).
 */
import type Phaser from 'phaser';
import { ingr, misureHud } from './arte';
import { PROFONDITA } from './effetti';
import { LAMPEGGIO_SEGNALE } from '../data/hud';
import { DROP } from '../data/oggetti';

export const PANE = 0;
export const CALAMITA = 1;
export const RELIQUIARIO = 2;
export const CERA_GOCCIA = 3;
export const FRAMMENTO = 4;
export const CHIAVE_OGGETTO = 5; // gioco a stanze (18/11): la chiave che esce da urne e giare
const SPRITE = [DROP.pane.sprite, DROP.calamita.sprite, DROP.reliquiario.sprite, DROP.cera.sprite, DROP.frammento.sprite, DROP.chiave.sprite];
const MAX_OGGETTI = 128;

/** La goccia di cera, provvisoria, disegnata qui in pixel art (8×11) finché Edoardo non ne disegna una. */
export const GOCCIA = [
  '...OO...',
  '..OYYO..',
  '..OYYO..',
  '.OYYYYO.',
  '.OYWYYO.',
  'OYWYYYYO',
  'OYWYYYYO',
  'OYYYYYAO',
  'OYYYYAAO',
  '.OAAAAO.',
  '..OOOO..',
];
/** Il frammento di vetro, di riserva se manca il disegno: una scheggia d'oro con un bordo rotto. */
/** La chiave (gioco a stanze, 18/11), provvisoria: l'anello a sinistra, il gambo, i denti (11×7). */
export const CHIAVE_DISEGNO = [
  '.OOO.......',
  'OYYYO......',
  'OYWYOOOOOOO',
  'OYYYYYYYYYO',
  'OYAYOOOOAAO',
  'OAAAO..OAOO',
  '.OOO....O..',
];
const SCHEGGIA = [
  '....OO....',
  '...OWYO...',
  '..OWYYAO..',
  '.OWYYYAO..',
  '.OWYOYYAO.',
  '.OYYOOYAO.',
  'OYYOAAOAAO',
  'OAAO..OAO.',
  '.OO....O..',
];
const COLORI_DISEGNO: Record<string, string> = { O: '#3a2208', Y: '#f2cf6a', W: '#fff4c8', A: '#c98a2c' };
function creaDisegno(scena: Phaser.Scene, chiave: string, righe: string[]): void {
  if (scena.textures.exists(chiave)) return;
  const c = scena.textures.createCanvas(chiave, righe[0].length, righe.length)!;
  dipingi(c.context, righe);
  c.refresh();
}
function dipingi(g: CanvasRenderingContext2D, righe: readonly string[]): void {
  righe.forEach((riga, y) => [...riga].forEach((ch, x) => {
    if (ch === '.') return;
    g.fillStyle = COLORI_DISEGNO[ch];
    g.fillRect(x, y, 1, 1);
  }));
}
/** Uno dei disegni qui sopra su una tela HTML (per l'interfaccia: i contatori del gioco a stanze). */
export function telaDisegno(righe: readonly string[]): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = righe[0].length;
  c.height = righe.length;
  dipingi(c.getContext('2d')!, righe);
  return c;
}
const MAX_SEGNALI = 6;

export class Oggetti {
  numero = 0;
  readonly x = new Float32Array(MAX_OGGETTI);
  readonly y = new Float32Array(MAX_OGGETTI);
  readonly tipo = new Uint8Array(MAX_OGGETTI);
  private sprite: Phaser.GameObjects.Sprite[] = [];
  private segnali: Phaser.GameObjects.Sprite[] = [];
  private tempo = 0;
  private zSegnale = ingr('segnale', misureHud());

  constructor(scena: Phaser.Scene) {
    creaDisegno(scena, DROP.cera.sprite, GOCCIA);
    creaDisegno(scena, DROP.frammento.sprite, SCHEGGIA);
    creaDisegno(scena, DROP.chiave.sprite, CHIAVE_DISEGNO);
    for (let i = 0; i < MAX_OGGETTI; i++) {
      this.sprite.push(scena.add.sprite(0, 0, DROP.pane.sprite).setScale(DROP.ingrandimento).setDepth(PROFONDITA.anime).setVisible(false));
    }
    for (let i = 0; i < MAX_SEGNALI; i++) {
      this.segnali.push(scena.add.sprite(0, 0, 'Segnale_Reliquiario').setDepth(PROFONDITA.barra + 1).setScrollFactor(0).setVisible(false));
    }
  }

  aggiungi(tipo: number, x: number, y: number): void {
    if (this.numero >= MAX_OGGETTI) return;
    const i = this.numero++;
    this.x[i] = x;
    this.y[i] = y;
    this.tipo[i] = tipo;
    const s = this.sprite[i].setTexture(SPRITE[tipo]).setVisible(true);
    if (tipo === CERA_GOCCIA) s.stop().setScale(DROP.cera.ingrandimento);
    // il colore nasce dal punto in cui cade: non tocca il generatore del caso, che deve restare uguale per carte e comparse
    else if (tipo === CHIAVE_OGGETTO) s.stop().setScale(DROP.chiave.ingrandimento);
    else if (tipo === FRAMMENTO) s.stop().setScale(DROP.frammento.ingrandimento).setFrame(String(Math.abs(Math.floor(x * 1.7 + y * 3.1)) % DROP.frammento.colori));
    else s.setScale(DROP.ingrandimento).play(`${SPRITE[tipo]}:idle`);
  }

  /** Raccoglie ciò che il personaggio (gx, gy) tocca; per ognuno chiama raccogli(tipo). Le gocce di Cera entro `raggioCera` volano verso di lui. */
  aggiorna(dt: number, gx: number, gy: number, raggioCera: number, raccogli: (tipo: number) => void): void {
    for (let i = this.numero - 1; i >= 0; i--) {
      let dx = gx - this.x[i];
      let dy = gy - this.y[i];
      if (this.tipo[i] === CERA_GOCCIA || this.tipo[i] === FRAMMENTO || this.tipo[i] === CHIAVE_OGGETTO) {
        const d = Math.hypot(dx, dy);
        if (d < raggioCera && d > 0) {
          const passo = Math.min(d, DROP.cera.volo * dt);
          this.x[i] += (dx / d) * passo;
          this.y[i] += (dy / d) * passo;
          dx = gx - this.x[i];
          dy = gy - this.y[i];
        }
      }
      if (dx * dx + dy * dy > DROP.presa * DROP.presa) continue;
      const tipo = this.tipo[i];
      this.togli(i);
      raccogli(tipo);
    }
  }

  disegna(cam: Phaser.Cameras.Scene2D.Camera, dt: number): void {
    this.tempo += dt;
    let segnale = 0;
    const m = DROP.frecciaMargine;
    for (let i = 0; i < this.numero; i++) {
      const x = Math.round(this.x[i]);
      const y = Math.round(this.y[i]);
      this.sprite[i].setPosition(x, y);
      const fuori = x < cam.scrollX || x > cam.scrollX + cam.width || y < cam.scrollY || y > cam.scrollY + cam.height;
      if (!fuori || this.tipo[i] !== RELIQUIARIO || segnale >= MAX_SEGNALI) continue;
      // segnale sul bordo, nella direzione del reliquiario
      // mai meno di mezzo segnale dal bordo: il campo finisce alle fasce e il disegno verrebbe tagliato
      const mx = Math.max(m, (this.segnali[segnale].width * this.zSegnale) / 2), my = Math.max(m, (this.segnali[segnale].height * this.zSegnale) / 2);
      const sx = Math.min(Math.max(x - cam.scrollX, mx), cam.width - mx);
      const sy = Math.min(Math.max(y - cam.scrollY, my), cam.height - my);
      // la freccia disegnata punta in alto a destra: si ribalta verso il quarto dove sta il reliquiario
      const sinistra = x < cam.scrollX + cam.width / 2, sotto = y > cam.scrollY + cam.height / 2;
      this.segnali[segnale++].setPosition(Math.round(sx), Math.round(sy)).setFlip(sinistra, sotto).setScale(this.zSegnale)
        .setVisible(Math.floor(this.tempo * LAMPEGGIO_SEGNALE) % 2 === 0);
    }
    for (let k = segnale; k < MAX_SEGNALI; k++) this.segnali[k].setVisible(false);
  }

  /** Via tutto ciò che è a terra (gioco a stanze: una stanza nuova). */
  svuota(): void {
    while (this.numero > 0) this.togli(this.numero - 1);
  }

  private togli(i: number): void {
    const u = --this.numero;
    const s = this.sprite[i];
    s.stop();
    s.setVisible(false);
    if (i === u) return;
    this.x[i] = this.x[u];
    this.y[i] = this.y[u];
    this.tipo[i] = this.tipo[u];
    this.sprite[i] = this.sprite[u];
    this.sprite[u] = s;
  }
}
