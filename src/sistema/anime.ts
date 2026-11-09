/*
 * Anime: i cristalli che cadono dai nemici; si disegnano sopra il buio, così brillano nella notte.
 * Quando il personaggio arriva entro il raggio di raccolta volano verso di lui sempre più veloci;
 * raccolte, diventano esperienza.
 * Al massimo ANIME.massimeATerra (pool, niente allocazioni): oltre, la nuova nasce comunque dove muore il nemico
 * e prende il posto (e il valore) dell'anima più lontana dal personaggio, così le anime vicine si vedono sempre.
 */
import type Phaser from 'phaser';
import { PROFONDITA } from './effetti';
import { ANIME } from '../data/progressione';

export class Anime {
  numero = 0;
  readonly x = new Float32Array(ANIME.massimeATerra);
  readonly y = new Float32Array(ANIME.massimeATerra);
  private valore = new Float32Array(ANIME.massimeATerra);
  private volo = new Float32Array(ANIME.massimeATerra); // 0 = ferma a terra, altrimenti velocità verso il personaggio
  private sprite: Phaser.GameObjects.Sprite[] = [];

  constructor(scena: Phaser.Scene) {
    for (let i = 0; i < ANIME.massimeATerra; i++) {
      this.sprite.push(scena.add.sprite(0, 0, ANIME.sprite.piccola).setScale(ANIME.ingrandimento).setDepth(PROFONDITA.anime).setVisible(false));
    }
  }

  /** Nuova anima in (x, y); (gx, gy) è il personaggio, per sapere quale anima riciclare se sono troppe. */
  aggiungi(x: number, y: number, valore: number, gx: number, gy: number): void {
    // accorpate come in Vampire Survivors: se ce n'è una ferma vicina, il valore va a lei e cresce di dimensione e colore
    const r2 = ANIME.accorpa * ANIME.accorpa;
    for (let k = 0; k < this.numero; k++) {
      if (this.volo[k]) continue;
      const dx = this.x[k] - x, dy = this.y[k] - y;
      if (dx * dx + dy * dy < r2) {
        this.valore[k] += valore;
        this.aspetto(k);
        return;
      }
    }
    let i = this.numero;
    if (i >= ANIME.massimeATerra) {
      // la più lontana dal personaggio lascia il posto alla nuova e le passa il suo valore
      let d2max = -1;
      for (let k = 0; k < this.numero; k++) {
        const dx = this.x[k] - gx;
        const dy = this.y[k] - gy;
        const d2 = dx * dx + dy * dy;
        if (d2 > d2max) {
          d2max = d2;
          i = k;
        }
      }
      valore += this.valore[i];
    } else {
      this.numero++;
    }
    this.x[i] = x;
    this.y[i] = y;
    this.valore[i] = valore;
    this.volo[i] = 0;
    this.aspetto(i);
  }

  /** Calamita: tutte le anime della mappa volano verso il personaggio. */
  attiraTutte(): void {
    for (let i = 0; i < this.numero; i++) if (!this.volo[i]) this.volo[i] = ANIME.volo;
  }

  /** Fuochi erranti: le anime ferme entro raggio da (x, y) volano verso il personaggio. */
  attiraVicino(x: number, y: number, raggio: number): void {
    const r2 = raggio * raggio;
    for (let i = 0; i < this.numero; i++) {
      if (this.volo[i]) continue;
      const dx = this.x[i] - x, dy = this.y[i] - y;
      if (dx * dx + dy * dy <= r2) this.volo[i] = ANIME.volo;
    }
  }

  /** Corvo: le n anime ferme più lontane dal personaggio volano verso di lui. */
  richiama(n: number, gx: number, gy: number): void {
    for (let k = 0; k < n; k++) {
      let scelta = -1, d2max = -1;
      for (let i = 0; i < this.numero; i++) {
        if (this.volo[i]) continue;
        const dx = this.x[i] - gx, dy = this.y[i] - gy, d2 = dx * dx + dy * dy;
        if (d2 > d2max) {
          d2max = d2;
          scelta = i;
        }
      }
      if (scelta < 0) return;
      this.volo[scelta] = ANIME.volo;
    }
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

  /** Colore secondo il valore: rosso, ambra da 6, azzurro da 20 (colori delle stelle). */
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
