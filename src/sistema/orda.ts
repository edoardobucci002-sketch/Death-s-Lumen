/*
 * Orda: tutti i nemici in campo. Li fa nascere appena fuori dallo schermo, li muove verso
 * il giocatore, li tiene separati con la griglia spaziale e ricolloca chi resta troppo indietro.
 * Quando un'arma li colpisce perdono salute, si illuminano, vengono respinti; a zero salute muoiono.
 * I nemici vivono in array preparati all'inizio (pool): durante la partita non si crea niente di nuovo.
 */
import Phaser from 'phaser';
import { ingrandimento } from './asset';
import type { Caso } from './caso';
import { Griglia } from './griglia';
import { COMPARSA, DIFFICOLTA, NEMICI, SEPARAZIONE } from '../data/nemici';
import { COLPI } from '../data/armi';

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
  readonly tipo = new Uint8Array(CAPIENZA);
  readonly id = new Uint32Array(CAPIENZA); // numero unico di ogni nemico nato, anche se cambia posto
  readonly segno = new Uint32Array(CAPIENZA); // l'ultimo colpo che l'ha già toccato (vedi Griglia.nelRaggio)
  readonly griglia = new Griglia(64, CAPIENZA);
  private velocita = new Float32Array(CAPIENZA);
  private respintaX = new Float32Array(CAPIENZA);
  private respintaY = new Float32Array(CAPIENZA);
  private lento = new Float32Array(CAPIENZA); // parte di velocità tolta (0,3 = −30%)
  private lentoPer = new Float32Array(CAPIENZA); // secondi rimasti di rallentamento
  private lampo = new Float32Array(CAPIENZA);
  private versoSinistra = new Uint8Array(CAPIENZA);
  private sprite: Phaser.GameObjects.Sprite[] = [];
  private aspetto: AspettoNemico[];
  private daFare = 0; // comparse accumulate (frazioni di nemico)
  private prossimoId = 1;
  // usati dentro la separazione, per non creare funzioni nel ciclo di gioco
  private corrente = 0;
  private spingi = (j: number): void => this.separa(j);
  // tutti i valori decimali di un nemico, per spostarli insieme quando cambia posto
  private campi = [this.x, this.y, this.raggio, this.danno, this.salute, this.velocita, this.respintaX, this.respintaY, this.lento, this.lentoPer, this.lampo];

  constructor(
    scena: Phaser.Scene,
    private caso: Caso,
  ) {
    this.aspetto = NEMICI.map((t) => {
      // i piedi sono la riga più bassa usata in tutti i fotogrammi (negli sprite V0 non è il bordo della tela)
      const dati = scena.cache.json.get(t.sprite) as { frames: { spriteSourceSize: { y: number; h: number }; sourceSize: { h: number } }[] };
      const fondo = Math.max(...dati.frames.map((f) => f.spriteSourceSize.y + f.spriteSourceSize.h));
      return { ingrandimento: ingrandimento(scena, t.sprite), piedi: fondo / dati.frames[0].sourceSize.h };
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

    // verso il giocatore, più la respinta che si spegne a poco a poco
    const frena = Math.exp(-COLPI.attrito * dt);
    for (let i = 0; i < this.numero; i++) {
      const dx = gx - this.x[i];
      const dy = gy - this.y[i];
      const d = Math.hypot(dx, dy);
      if (this.lentoPer[i] > 0) this.lentoPer[i] -= dt;
      if (this.lampo[i] > 0) this.lampo[i] -= dt;
      if (d > 0.5) {
        const v = this.velocita[i] * (this.lentoPer[i] > 0 ? 1 - this.lento[i] : 1);
        const passo = Math.min(d, v * dt);
        this.x[i] += (dx / d) * passo;
        this.y[i] += (dy / d) * passo;
        if (dx < -0.5) this.versoSinistra[i] = 1;
        else if (dx > 0.5) this.versoSinistra[i] = 0;
      }
      this.x[i] += this.respintaX[i] * dt;
      this.y[i] += this.respintaY[i] * dt;
      this.respintaX[i] *= frena;
      this.respintaY[i] *= frena;
    }

    // griglia con tutti i nemici: serve alle armi e alla separazione
    this.griglia.svuota();
    for (let i = 0; i < this.numero; i++) this.griglia.inserisci(i, this.x[i], this.y[i]);
    // separazione: ognuno si allontana dai vicini che lo toccano (i fantasmi attraversano tutti)
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
        this.respintaX[i] = this.respintaY[i] = 0;
      }
    }
  }

  /** Colpisce il nemico i: toglie salute, lo illumina e lo spinge nella direzione (dx, dy), lunga 1. */
  colpisci(i: number, danno: number, respinta: number, dx: number, dy: number): void {
    this.salute[i] -= danno;
    this.lampo[i] = COLPI.lampoNemico;
    if (respinta) {
      const r = respinta * (NEMICI[this.tipo[i]].pesante ? COLPI.respintaPesanti : 1);
      this.respintaX[i] = dx * r;
      this.respintaY[i] = dy * r;
    }
  }

  /** Rallenta il nemico i per qualche istante; resta il rallentamento più forte. */
  rallenta(i: number, quanto: number, secondi: number): void {
    if (this.lentoPer[i] <= 0 || quanto >= this.lento[i]) this.lento[i] = quanto;
    this.lentoPer[i] = Math.max(this.lentoPer[i], secondi);
  }

  /** Toglie dal campo i nemici senza salute; per ognuno chiama muore(x, y, anime). */
  rimuoviMorti(muore: (x: number, y: number, anime: number) => void): void {
    for (let i = this.numero - 1; i >= 0; i--) {
      if (this.salute[i] > 0) continue;
      muore(this.x[i], this.y[i] - this.raggio[i], NEMICI[this.tipo[i]].anime);
      this.togli(i);
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
      if (!visibile) continue;
      s.setPosition(x, y).setDepth(y).setFlipX(this.versoSinistra[i] === 1);
      if (this.lampo[i] > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (s.tintMode !== Phaser.TintModes.MULTIPLY) s.clearTint();
    }
  }

  private nasci(secondi: number, gx: number, gy: number, dirX: number, dirY: number, mezzaL: number, mezzaA: number): void {
    const i = this.numero++;
    const t = this.scegliTipo(secondi);
    const tipo = NEMICI[t];
    const m = secondi / 60;
    this.tipo[i] = t;
    this.id[i] = this.prossimoId++;
    this.segno[i] = 0;
    this.raggio[i] = tipo.raggio;
    this.salute[i] = tipo.salute * (1 + DIFFICOLTA.salutePerMinuto * m);
    this.danno[i] = tipo.danno * (1 + DIFFICOLTA.dannoPerMinuto * m);
    this.velocita[i] = tipo.velocita * (1 + (this.caso.numero() * 2 - 1) * DIFFICOLTA.variazioneVelocita);
    this.respintaX[i] = this.respintaY[i] = this.lentoPer[i] = this.lampo[i] = 0;
    this.posiziona(i, gx, gy, dirX, dirY, mezzaL, mezzaA);

    const a = this.aspetto[t];
    const s = this.sprite[i];
    s.setTexture(tipo.sprite).setOrigin(0.5, a.piedi).setScale(a.ingrandimento).setActive(true).clearTint();
    const anim = s.scene.anims.get(`${tipo.sprite}:walk`);
    if (anim) s.play({ key: anim.key, startFrame: this.caso.intero(0, anim.frames.length - 1) });
  }

  /** Toglie il nemico i spostando l'ultimo al suo posto (con il suo sprite). */
  private togli(i: number): void {
    const u = --this.numero;
    const s = this.sprite[i];
    s.stop();
    s.setVisible(false).setActive(false);
    if (i === u) return;
    for (const a of this.campi) a[i] = a[u];
    this.tipo[i] = this.tipo[u];
    this.id[i] = this.id[u];
    this.segno[i] = this.segno[u];
    this.versoSinistra[i] = this.versoSinistra[u];
    this.sprite[i] = this.sprite[u];
    this.sprite[u] = s;
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
    if (j === i || NEMICI[this.tipo[j]].attraversa) return;
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
