/*
 * Oggetti a terra: pane (salute), calamita (attira tutte le anime) e reliquiari (potenziamenti).
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
const SPRITE = [DROP.pane.sprite, DROP.calamita.sprite, DROP.reliquiario.sprite];
const MAX_OGGETTI = 64;
const MAX_SEGNALI = 6;

export class Oggetti {
  numero = 0;
  private x = new Float32Array(MAX_OGGETTI);
  private y = new Float32Array(MAX_OGGETTI);
  private tipo = new Uint8Array(MAX_OGGETTI);
  private sprite: Phaser.GameObjects.Sprite[] = [];
  private segnali: Phaser.GameObjects.Sprite[] = [];
  private tempo = 0;
  private zSegnale = ingr('segnale', misureHud());

  constructor(scena: Phaser.Scene) {
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
    this.sprite[i].setTexture(SPRITE[tipo]).setVisible(true).play(`${SPRITE[tipo]}:idle`);
  }

  /** Raccoglie ciò che il personaggio (gx, gy) tocca; per ognuno chiama raccogli(tipo). */
  aggiorna(gx: number, gy: number, raccogli: (tipo: number) => void): void {
    for (let i = this.numero - 1; i >= 0; i--) {
      const dx = gx - this.x[i];
      const dy = gy - this.y[i];
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
      const sx = Math.min(Math.max(x - cam.scrollX, m), cam.width - m);
      const sy = Math.min(Math.max(y - cam.scrollY, m), cam.height - m);
      // la freccia disegnata punta in alto a destra: si ribalta verso il quarto dove sta il reliquiario
      const sinistra = x < cam.scrollX + cam.width / 2, sotto = y > cam.scrollY + cam.height / 2;
      this.segnali[segnale++].setPosition(Math.round(sx), Math.round(sy)).setFlip(sinistra, sotto).setScale(this.zSegnale)
        .setVisible(Math.floor(this.tempo * LAMPEGGIO_SEGNALE) % 2 === 0);
    }
    for (let k = segnale; k < MAX_SEGNALI; k++) this.segnali[k].setVisible(false);
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
