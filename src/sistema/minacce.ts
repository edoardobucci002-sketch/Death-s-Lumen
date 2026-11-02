/*
 * Minacce: i colpi del Mietitore che non sono il suo corpo.
 * Aree con preavviso (falciata, segni della chiamata): un cerchio rosso a retino che pulsa e, allo scadere,
 * colpisce chi c'è dentro. Falci spettrali: proiettili che volano dritti e feriscono al tocco.
 * Tutto in pool preparati all'inizio; la logica è separata dal disegno. Posizioni all'altezza dei piedi.
 */
import Phaser from 'phaser';
import { PROFONDITA } from './effetti';
import { EFFETTI } from '../data/effetti';
import { COLPI } from '../data/armi';

const MAX_AREE = 24;
const MAX_FALCI = 32;
const SPRITE_FALCE = 'Icona_Falce';
const M = EFFETTI.minacce;

export class Minacce {
  aree = 0;
  readonly aX = new Float32Array(MAX_AREE);
  readonly aY = new Float32Array(MAX_AREE);
  readonly aR = new Float32Array(MAX_AREE);
  readonly aAttesa = new Float32Array(MAX_AREE); // secondi al colpo (poi negativo: lampo)
  readonly aDanno = new Float32Array(MAX_AREE);
  private aChiave: string[] = [];
  private aSprite: Phaser.GameObjects.Image[] = [];
  falci = 0;
  readonly fX = new Float32Array(MAX_FALCI);
  readonly fY = new Float32Array(MAX_FALCI);
  readonly fVX = new Float32Array(MAX_FALCI);
  readonly fVY = new Float32Array(MAX_FALCI);
  readonly fR = new Float32Array(MAX_FALCI);
  private fVita = new Float32Array(MAX_FALCI);
  private fDanno = new Float32Array(MAX_FALCI);
  private fSprite: Phaser.GameObjects.Image[] = [];
  private tempo = 0;
  colpita = false; // una falciata è appena scattata (Gioco la legge per scuotere lo schermo e la rimette a false)

  constructor(private scena: Phaser.Scene) {
    for (let i = 0; i < MAX_AREE; i++) {
      // sopra i nemici: un pericolo si deve vedere anche in mezzo alla folla (il retino rado non li copre)
      this.aSprite.push(scena.add.image(0, 0, '__WHITE').setDepth(PROFONDITA.sopra - 1).setVisible(false));
      this.aChiave.push('');
    }
    for (let i = 0; i < MAX_FALCI; i++) {
      this.fSprite.push(scena.add.image(0, 0, SPRITE_FALCE).setScale(2).setTint(M.falce).setDepth(PROFONDITA.sopra).setVisible(false));
    }
  }

  /** Un cerchio di raggio r che colpisce dopo attesa secondi (danno 0: solo un segno). */
  area(x: number, y: number, r: number, attesa: number, danno: number): void {
    if (this.aree >= MAX_AREE) return;
    const i = this.aree++;
    this.aX[i] = x;
    this.aY[i] = y;
    this.aR[i] = r;
    this.aAttesa[i] = attesa;
    this.aDanno[i] = danno;
    const chiave = `minaccia-${Math.round(r)}`;
    if (!this.scena.textures.exists(`${chiave}-0`)) creaCerchio(this.scena, chiave, Math.round(r));
    this.aChiave[i] = chiave;
    this.aSprite[i].setTexture(`${chiave}-0`);
  }

  /** Una falce che parte da (x, y) con velocità (vx, vy). */
  falce(x: number, y: number, vx: number, vy: number, raggio: number, danno: number, vita: number): void {
    if (this.falci >= MAX_FALCI) return;
    const i = this.falci++;
    this.fX[i] = x;
    this.fY[i] = y;
    this.fVX[i] = vx;
    this.fVY[i] = vy;
    this.fR[i] = raggio;
    this.fDanno[i] = danno;
    this.fVita[i] = vita;
  }

  /** Un passo di logica; restituisce il danno più forte che tocca il personaggio in (gx, gy), di raggio rg. */
  aggiorna(dt: number, gx: number, gy: number, rg: number): number {
    this.tempo += dt;
    let colpo = 0;
    let falciata = false;
    for (let i = this.aree - 1; i >= 0; i--) {
      const prima = this.aAttesa[i];
      this.aAttesa[i] -= dt;
      if (prima > 0 && this.aAttesa[i] <= 0 && this.aDanno[i] > 0) {
        falciata = true;
        const r = this.aR[i] + rg;
        if ((gx - this.aX[i]) ** 2 + (gy - this.aY[i]) ** 2 < r * r) colpo = Math.max(colpo, this.aDanno[i]);
      }
      if (this.aAttesa[i] <= -M.lampo || (this.aAttesa[i] <= 0 && !this.aDanno[i])) this.togliArea(i);
    }
    if (falciata) this.colpita = true;
    for (let i = this.falci - 1; i >= 0; i--) {
      this.fX[i] += this.fVX[i] * dt;
      this.fY[i] += this.fVY[i] * dt;
      const r = this.fR[i] + rg;
      if ((gx - this.fX[i]) ** 2 + (gy - this.fY[i]) ** 2 < r * r) {
        colpo = Math.max(colpo, this.fDanno[i]);
        this.togliFalce(i);
      } else if ((this.fVita[i] -= dt) <= 0) {
        this.togliFalce(i);
      }
    }
    return colpo;
  }

  /** Disegna: il preavviso lampeggia, poi resta acceso; quando colpisce diventa pieno. */
  disegna(): void {
    for (let i = 0; i < this.aree; i++) {
      const s = this.aSprite[i];
      const t = this.aAttesa[i];
      const acceso = t <= M.acceso || Math.floor(this.tempo * M.pulsazioni * 2) % 2 === 0;
      s.setTexture(`${this.aChiave[i]}-${t <= 0 ? 1 : 0}`).setPosition(Math.round(this.aX[i]), Math.round(this.aY[i])).setVisible(acceso);
    }
    for (let i = this.aree; i < MAX_AREE; i++) this.aSprite[i].setVisible(false);
    for (let i = 0; i < this.falci; i++) {
      this.fSprite[i].setPosition(Math.round(this.fX[i]), Math.round(this.fY[i] - COLPI.corpo)).setRotation(this.tempo * M.giro).setVisible(true);
    }
    for (let i = this.falci; i < MAX_FALCI; i++) this.fSprite[i].setVisible(false);
  }

  private togliArea(i: number): void {
    const u = --this.aree;
    this.aX[i] = this.aX[u];
    this.aY[i] = this.aY[u];
    this.aR[i] = this.aR[u];
    this.aAttesa[i] = this.aAttesa[u];
    this.aDanno[i] = this.aDanno[u];
    this.aChiave[i] = this.aChiave[u];
  }

  private togliFalce(i: number): void {
    const u = --this.falci;
    this.fX[i] = this.fX[u];
    this.fY[i] = this.fY[u];
    this.fVX[i] = this.fVX[u];
    this.fVY[i] = this.fVY[u];
    this.fR[i] = this.fR[u];
    this.fDanno[i] = this.fDanno[u];
    this.fVita[i] = this.fVita[u];
  }
}

/** Cerchio rosso grande quanto l'area che colpisce: «-0» preavviso (retino rado con il bordo), «-1» colpo (retino fitto). */
function creaCerchio(scena: Phaser.Scene, chiave: string, r: number): void {
  const L = 2 * r + 2;
  const A = L;
  for (const pieno of [0, 1]) {
    const tela = scena.textures.createCanvas(`${chiave}-${pieno}`, L, A)!;
    const g = tela.getContext();
    for (let y = 0; y < A; y++) {
      for (let x = 0; x < L; x++) {
        const dx = (x + 0.5 - L / 2) / r;
        const dy = (y + 0.5 - A / 2) / r;
        const d = Math.hypot(dx, dy);
        if (d > 1) continue;
        const bordo = d > 1 - 3 / r;
        // retino di Bayer: 1 pixel su 4 nel preavviso, 1 su 2 nel colpo
        const dentro = pieno ? (x + y) % 2 === 0 : x % 2 === 0 && y % 2 === 0;
        if (!bordo && !dentro) continue;
        g.fillStyle = bordo ? M.bordo : M.colore;
        g.fillRect(x, y, 1, 1);
      }
    }
    tela.refresh();
  }
}
