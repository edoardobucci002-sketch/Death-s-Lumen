/*
 * Orda: tutti i nemici in campo. Li fa nascere appena fuori dallo schermo, li muove verso
 * il giocatore, li tiene separati con la griglia spaziale e ricolloca chi resta troppo indietro.
 * I nemici vivono in array preparati all'inizio (pool): durante la partita non si crea niente di nuovo.
 */
import Phaser from 'phaser';
import type { ElencoAsset } from './asset';
import type { Caso } from './caso';
import { Griglia } from './griglia';
import { COMPARSA, DIFFICOLTA, INGRANDIMENTO_SEGNAPOSTO, NEMICI, SEPARAZIONE } from '../data/nemici';

/** Più posti del massimo in campo: servono anche alla prova con 400 nemici. */
export const CAPIENZA = Math.max(DIFFICOLTA.tetto, 400) + 20;

interface AspettoNemico {
  ingrandimento: number;
  piedi: number; // origine verticale (0-1) all'altezza dei piedi
}

export class Orda {
  numero = 0; // nemici in campo: occupano i posti da 0 a numero-1
  readonly x = new Float32Array(CAPIENZA); // posizione dei piedi
  readonly y = new Float32Array(CAPIENZA);
  readonly raggio = new Float32Array(CAPIENZA);
  readonly danno = new Float32Array(CAPIENZA);
  readonly salute = new Float32Array(CAPIENZA);
  private velocita = new Float32Array(CAPIENZA);
  private tipo = new Uint8Array(CAPIENZA);
  private versoSinistra = new Uint8Array(CAPIENZA);
  private sprite: Phaser.GameObjects.Sprite[] = [];
  private aspetto: AspettoNemico[];
  private griglia = new Griglia(64, CAPIENZA);
  private daFare = 0; // comparse accumulate (frazioni di nemico)
  // usati dentro la separazione, per non creare funzioni nel ciclo di gioco
  private corrente = 0;
  private spingi = (j: number): void => this.separa(j);

  constructor(
    scena: Phaser.Scene,
    private caso: Caso,
  ) {
    const elenco = scena.cache.json.get('elenco') as ElencoAsset;
    this.aspetto = NEMICI.map((t) => {
      const voce = elenco.asset.find((a) => a.chiave === t.sprite);
      // i piedi sono la riga più bassa usata in tutti i fotogrammi (negli sprite V0 non è il bordo della tela)
      const dati = scena.cache.json.get(t.sprite) as { frames: { spriteSourceSize: { y: number; h: number }; sourceSize: { h: number } }[] };
      const fondo = Math.max(...dati.frames.map((f) => f.spriteSourceSize.y + f.spriteSourceSize.h));
      return { ingrandimento: voce?.versioneFile === 0 ? INGRANDIMENTO_SEGNAPOSTO : 1, piedi: fondo / dati.frames[0].sourceSize.h };
    });
    for (let i = 0; i < CAPIENZA; i++) {
      this.sprite.push(scena.add.sprite(0, 0, NEMICI[0].sprite).setVisible(false).setActive(false));
    }
  }

  /** Un passo di logica: comparse, movimento, separazione, ricollocamento. */
  aggiorna(dt: number, secondi: number, gx: number, gy: number, dirX: number, dirY: number, mezzaL: number, mezzaA: number): void {
    const m = secondi / 60;
    const massimi = Math.min(DIFFICOLTA.tetto, DIFFICOLTA.massimiBase + DIFFICOLTA.massimiPerMinuto * m);
    this.daFare += (DIFFICOLTA.comparseBase + DIFFICOLTA.comparsePerMinuto * m) * dt;
    let nascite = Math.min(Math.floor(this.daFare), DIFFICOLTA.comparsePerFotogramma);
    this.daFare -= nascite;
    if (this.daFare > DIFFICOLTA.comparsePerFotogramma) this.daFare = DIFFICOLTA.comparsePerFotogramma;
    if (this.numero < massimi * DIFFICOLTA.sogliaRinforzo) nascite += DIFFICOLTA.rinforzoPerFotogramma;
    for (; nascite > 0 && this.numero < massimi; nascite--) this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA);

    // verso il giocatore
    for (let i = 0; i < this.numero; i++) {
      const dx = gx - this.x[i];
      const dy = gy - this.y[i];
      const d = Math.hypot(dx, dy);
      if (d > 0.5) {
        const passo = Math.min(d, this.velocita[i] * dt);
        this.x[i] += (dx / d) * passo;
        this.y[i] += (dy / d) * passo;
        if (dx < -0.5) this.versoSinistra[i] = 1;
        else if (dx > 0.5) this.versoSinistra[i] = 0;
      }
    }

    // separazione: ognuno si allontana dai vicini che lo toccano
    this.griglia.svuota();
    for (let i = 0; i < this.numero; i++) if (!NEMICI[this.tipo[i]].attraversa) this.griglia.inserisci(i, this.x[i], this.y[i]);
    for (let i = 0; i < this.numero; i++) {
      if (NEMICI[this.tipo[i]].attraversa) continue;
      this.corrente = i;
      this.griglia.vicini(this.x[i], this.y[i], this.spingi);
    }

    // chi è rimasto troppo indietro torna davanti al giocatore
    const limiteX = mezzaL + COMPARSA.margine * COMPARSA.lontananza;
    const limiteY = mezzaA + COMPARSA.margine * COMPARSA.lontananza;
    for (let i = 0; i < this.numero; i++) {
      if (Math.abs(this.x[i] - gx) > limiteX || Math.abs(this.y[i] - gy) > limiteY) {
        this.posiziona(i, gx, gy, dirX, dirY, mezzaL, mezzaA);
      }
    }
  }

  /** Riempie il campo di nemici in un colpo: per la prova delle prestazioni. */
  riempi(quanti: number, secondi: number, gx: number, gy: number, mezzaL: number, mezzaA: number): void {
    while (this.numero < Math.min(quanti, CAPIENZA)) this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA);
  }

  /** Disegna: posizioni arrotondate al pixel, profondità secondo i piedi, niente disegno fuori schermo. */
  disegna(cam: Phaser.Cameras.Scene2D.Camera, margine: number): void {
    const sx = cam.scrollX - margine;
    const sy = cam.scrollY - margine;
    const ex = cam.scrollX + cam.width + margine;
    const ey = cam.scrollY + cam.height + margine * 2;
    for (let i = 0; i < this.numero; i++) {
      const s = this.sprite[i];
      const x = Math.round(this.x[i]);
      const y = Math.round(this.y[i]);
      const visibile = x > sx && x < ex && y > sy && y < ey;
      s.setVisible(visibile);
      if (visibile) s.setPosition(x, y).setDepth(y).setFlipX(this.versoSinistra[i] === 1);
    }
  }

  private nasci(secondi: number, gx: number, gy: number, dirX: number, dirY: number, mezzaL: number, mezzaA: number): void {
    const i = this.numero++;
    const t = this.scegliTipo(secondi);
    const tipo = NEMICI[t];
    const m = secondi / 60;
    this.tipo[i] = t;
    this.raggio[i] = tipo.raggio;
    this.salute[i] = tipo.salute * (1 + DIFFICOLTA.salutePerMinuto * m);
    this.danno[i] = tipo.danno * (1 + DIFFICOLTA.dannoPerMinuto * m);
    this.velocita[i] = tipo.velocita * (1 + (this.caso.numero() * 2 - 1) * DIFFICOLTA.variazioneVelocita);
    this.posiziona(i, gx, gy, dirX, dirY, mezzaL, mezzaA);

    const a = this.aspetto[t];
    const s = this.sprite[i];
    s.setTexture(tipo.sprite).setOrigin(0.5, a.piedi).setScale(a.ingrandimento).setActive(true);
    const anim = s.scene.anims.get(`${tipo.sprite}:walk`);
    if (anim) s.play({ key: anim.key, startFrame: this.caso.intero(0, anim.frames.length - 1) });
  }

  /** Mette il nemico i appena fuori dallo schermo: a caso, o davanti al giocatore se si sta muovendo. */
  private posiziona(i: number, gx: number, gy: number, dirX: number, dirY: number, mezzaL: number, mezzaA: number): void {
    const angolo = dirX || dirY
      ? Math.atan2(dirY, dirX) + (this.caso.numero() * 2 - 1) * COMPARSA.ventaglio
      : this.caso.numero() * Math.PI * 2;
    const c = Math.cos(angolo);
    const s = Math.sin(angolo);
    // distanza dal centro al bordo dello schermo in quella direzione, più il margine
    const bordo = Math.min(Math.abs(c) > 1e-6 ? mezzaL / Math.abs(c) : Infinity, Math.abs(s) > 1e-6 ? mezzaA / Math.abs(s) : Infinity);
    const d = bordo + COMPARSA.margine;
    this.x[i] = gx + c * d;
    this.y[i] = gy + s * d;
  }

  private scegliTipo(secondi: number): number {
    let totale = 0;
    for (const t of NEMICI) totale += t.peso(secondi);
    let r = this.caso.numero() * totale;
    for (let t = 0; t < NEMICI.length; t++) {
      r -= NEMICI[t].peso(secondi);
      if (r < 0) return t;
    }
    return 0;
  }

  private separa(j: number): void {
    const i = this.corrente;
    if (j === i) return;
    const dx = this.x[i] - this.x[j];
    const dy = this.y[i] - this.y[j];
    const minima = (this.raggio[i] + this.raggio[j]) * SEPARAZIONE.tolleranza;
    const d2 = dx * dx + dy * dy;
    if (d2 >= minima * minima) return;
    const d = Math.sqrt(d2);
    if (d < 0.01) {
      this.x[i] += i < j ? -0.5 : 0.5; // sovrapposti esattamente: li scosta un poco
      return;
    }
    const spinta = ((minima - d) / d) * SEPARAZIONE.forza * 0.5;
    this.x[i] += dx * spinta;
    this.y[i] += dy * spinta;
  }
}
