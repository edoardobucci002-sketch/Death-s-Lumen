/*
 * Anime: i cristalli che cadono dai nemici; si disegnano sopra il buio, così brillano nella notte.
 * Quando il personaggio arriva entro il raggio di raccolta volano verso di lui sempre più veloci;
 * raccolte, diventano esperienza.
 * Al massimo ANIME.massimeATerra: oltre, le nuove si sommano a una già presente (pool, niente allocazioni).
 */
import type Phaser from 'phaser';
import { PROFONDITA } from './effetti';
import type { Caso } from './caso';
import { ANIME } from '../data/progressione';

export class Anime {
  numero = 0;
  private x = new Float32Array(ANIME.massimeATerra);
  private y = new Float32Array(ANIME.massimeATerra);
  private valore = new Float32Array(ANIME.massimeATerra);
  private volo = new Float32Array(ANIME.massimeATerra); // 0 = ferma a terra, altrimenti velocità verso il personaggio
  private sprite: Phaser.GameObjects.Sprite[] = [];

  constructor(
    scena: Phaser.Scene,
    private caso: Caso,
  ) {
    for (let i = 0; i < ANIME.massimeATerra; i++) {
      this.sprite.push(scena.add.sprite(0, 0, ANIME.sprite.piccola).setScale(ANIME.ingrandimento).setDepth(PROFONDITA.anime).setVisible(false));
    }
  }

  aggiungi(x: number, y: number, valore: number): void {
    if (this.numero >= ANIME.massimeATerra) {
      const i = this.caso.intero(0, this.numero - 1);
      this.valore[i] += valore;
      this.aspetto(i);
      return;
    }
    const i = this.numero++;
    this.x[i] = x;
    this.y[i] = y;
    this.valore[i] = valore;
    this.volo[i] = 0;
    this.aspetto(i);
  }

  /** Muove le anime verso il personaggio (gx, gy) e restituisce quante ne ha raccolte in questo passo. */
  aggiorna(dt: number, gx: number, gy: number, raccolta: number): number {
    let raccolte = 0;
    for (let i = this.numero - 1; i >= 0; i--) {
      const dx = gx - this.x[i];
      const dy = gy - this.y[i];
      const d = Math.hypot(dx, dy);
      if (d < ANIME.presa) {
        raccolte += this.valore[i];
        this.togli(i);
        continue;
      }
      if (!this.volo[i] && d < raccolta) this.volo[i] = ANIME.volo;
      if (this.volo[i]) {
        this.volo[i] += ANIME.accelerazione * dt;
        const passo = Math.min(d, this.volo[i] * dt);
        this.x[i] += (dx / d) * passo;
        this.y[i] += (dy / d) * passo;
      }
    }
    return raccolte;
  }

  disegna(cam: Phaser.Cameras.Scene2D.Camera): void {
    for (let i = 0; i < this.numero; i++) {
      const x = Math.round(this.x[i]);
      const y = Math.round(this.y[i]);
      const visibile = x > cam.scrollX - 16 && x < cam.scrollX + cam.width + 16 && y > cam.scrollY - 16 && y < cam.scrollY + cam.height + 16;
      this.sprite[i].setVisible(visibile);
      if (visibile) this.sprite[i].setPosition(x, y);
    }
  }

  /** Colore secondo il valore: azzurro, verde da 6, ambra da 20. */
  private aspetto(i: number): void {
    const v = this.valore[i];
    const chiave = v >= ANIME.grande ? ANIME.sprite.grande : v >= ANIME.media ? ANIME.sprite.media : ANIME.sprite.piccola;
    const s = this.sprite[i];
    if (s.texture.key !== chiave || !s.anims.isPlaying) s.play(`${chiave}:idle`);
  }

  private togli(i: number): void {
    const u = --this.numero;
    const s = this.sprite[i];
    s.stop();
    s.setVisible(false);
    if (i === u) return;
    this.x[i] = this.x[u];
    this.y[i] = this.y[u];
    this.valore[i] = this.valore[u];
    this.volo[i] = this.volo[u];
    this.sprite[i] = this.sprite[u];
    this.sprite[u] = s;
  }
}
