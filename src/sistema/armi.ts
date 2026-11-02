/*
 * Armi: ogni arma posseduta si ricarica e colpisce da sola.
 * - Lanterna: arco di luce davanti (e a Lv 8 anche dietro).
 * - Pala: impatto circolare davanti (a Lv 8 un secondo colpo alle spalle).
 * - Turibolo: nubi che feriscono e rallentano chi ci sta dentro.
 * - Bastone: raffiche di proiettili verso il nemico più vicino.
 * Nubi, proiettili ed effetti sono pool preparati all'inizio: niente allocazioni durante la partita.
 */
import Phaser from 'phaser';
import { ingrandimento, raggioDisegnato } from './asset';
import type { Caso } from './caso';
import type { Orda } from './orda';
import { BASTONE, COLPI, LANTERNA, PALA, TURIBOLO, type Arma } from '../data/armi';

const MAX_EFFETTI = 48;
const MAX_NUBI = 16;
const MAX_PROIETTILI = 48;
const PROFONDITA_EFFETTI = 5e6; // sopra personaggio e nemici, sotto il buio

export interface Posseduta {
  arma: Arma;
  livello: number; // da 1 a 8
}

/** I bonus del personaggio che cambiano le armi. */
export interface Bonus {
  danno: number; // 0,15 = +15%
  ricarica: number; // 0,1 = −10% di attesa
  area: number; // 0,15 = raggi +15%
}

export class Arsenale {
  readonly possedute: Posseduta[] = [];
  private attesa: number[] = [];
  private scena: Phaser.Scene;
  private orda: Orda;
  private caso: Caso;
  private bonus: Bonus;
  private colpo = 0; // numero del colpo in corso, per non toccare due volte lo stesso nemico
  // centro e direzione del personaggio in questo passo
  private px = 0;
  private py = 0;
  private dx = 1;
  private dy = 0;

  // effetti solo da vedere (arco, impatto, esplosione)
  private effetti: Phaser.GameObjects.Sprite[] = [];
  private vitaEffetto = new Float32Array(MAX_EFFETTI);
  private raggioEffetto = new Map<string, number>();

  // nubi del turibolo
  private nubi = 0;
  private nubeX = new Float32Array(MAX_NUBI);
  private nubeY = new Float32Array(MAX_NUBI);
  private nubeR = new Float32Array(MAX_NUBI);
  private nubeDanno = new Float32Array(MAX_NUBI);
  private nubeVita = new Float32Array(MAX_NUBI);
  private nubeTick = new Float32Array(MAX_NUBI);
  private nubeSprite: Phaser.GameObjects.Sprite[] = [];

  // proiettili del bastone
  private proiettili = 0;
  private prX = new Float32Array(MAX_PROIETTILI);
  private prY = new Float32Array(MAX_PROIETTILI);
  private prVX = new Float32Array(MAX_PROIETTILI);
  private prVY = new Float32Array(MAX_PROIETTILI);
  private prVita = new Float32Array(MAX_PROIETTILI);
  private prDanno = new Float32Array(MAX_PROIETTILI);
  private prResto = new Uint8Array(MAX_PROIETTILI); // nemici che può ancora trapassare
  private prColpiti = new Uint32Array(MAX_PROIETTILI * 4); // id dei nemici già colpiti (fino a 4)
  private prSprite: Phaser.GameObjects.Sprite[] = [];
  private raffica = 0; // proiettili ancora da sparare nella raffica in corso
  private attesaRaffica = 0;
  private dannoRaffica = 0;
  private trapassaRaffica = 0;
  private doppio = -1; // secondi al colpo doppio della pala (-1 = nessuno)
  private dannoDoppio = 0;
  private raggioDoppio = 0;

  // usati dentro le ricerche nella griglia, per non creare funzioni nel ciclo di gioco
  private cx = 0;
  private cy = 0;
  private cr = 0;
  private cDanno = 0;
  private cRespinta = 0;
  private cCos = 0; // per l'arco: metà ampiezza come coseno
  private dxArco = 1; // per l'arco: direzione
  private dyArco = 0;
  private cRallenta = 0;
  private cDurata = 0;
  private visitaCerchio = (j: number): void => this.tocca(j, false);
  private visitaArco = (j: number): void => this.tocca(j, true);
  private visitaNube = (j: number): void => this.toccaNube(j);
  private visitaProiettile = (j: number): void => this.toccaProiettile(j);
  private cProiettile = 0;

  constructor(scena: Phaser.Scene, orda: Orda, caso: Caso, bonus: Bonus) {
    this.scena = scena;
    this.orda = orda;
    this.caso = caso;
    this.bonus = bonus;
    for (let i = 0; i < MAX_EFFETTI; i++) this.effetti.push(scena.add.sprite(0, 0, LANTERNA.effetto).setVisible(false).setDepth(PROFONDITA_EFFETTI));
    for (let i = 0; i < MAX_NUBI; i++) this.nubeSprite.push(scena.add.sprite(0, 0, TURIBOLO.effetto).setVisible(false).setDepth(PROFONDITA_EFFETTI - 1));
    const scalaPr = ingrandimento(scena, BASTONE.effetto);
    for (let i = 0; i < MAX_PROIETTILI; i++) {
      // il proiettile della v0 attraversa la tela nei suoi fotogrammi: si usa l'ultimo, con l'origine sulla punta
      this.prSprite.push(scena.add.sprite(0, 0, BASTONE.effetto, '3').setOrigin(88 / 128, 0.5).setScale(scalaPr).setVisible(false).setDepth(PROFONDITA_EFFETTI));
    }
    for (const chiave of [LANTERNA.effetto, PALA.effetto, TURIBOLO.effetto, BASTONE.esplosione]) this.raggioEffetto.set(chiave, raggioDisegnato(scena, chiave));
  }

  aggiungi(arma: Arma): void {
    this.possedute.push({ arma, livello: 1 });
    this.attesa.push(0.5);
  }

  livello(arma: Arma): number {
    return this.possedute.find((p) => p.arma === arma)?.livello ?? 0;
  }

  potenzia(arma: Arma): void {
    const p = this.possedute.find((q) => q.arma === arma);
    if (p) p.livello++;
  }

  /** Un passo di logica. (x, y) sono i piedi del personaggio, (dx, dy) la direzione in cui guarda. */
  aggiorna(dt: number, x: number, y: number, dx: number, dy: number): void {
    this.px = x;
    this.py = y - COLPI.corpo;
    this.dx = dx;
    this.dy = dy;
    for (let n = 0; n < this.possedute.length; n++) {
      this.attesa[n] -= dt;
      if (this.attesa[n] > 0) continue;
      const p = this.possedute[n];
      const ricarica = this.spara(p);
      this.attesa[n] += ricarica * (1 - this.bonus.ricarica);
      if (this.attesa[n] < 0) this.attesa[n] = 0;
    }
    this.aggiornaDoppio(dt);
    this.aggiornaRaffica(dt);
    this.aggiornaNubi(dt);
    this.aggiornaProiettili(dt);
    for (let i = 0; i < MAX_EFFETTI; i++) {
      if (this.vitaEffetto[i] > 0 && (this.vitaEffetto[i] -= dt) <= 0) this.effetti[i].stop().setVisible(false);
    }
  }

  /** Disegna nubi e proiettili; gli effetti restano dove sono nati. Posizioni arrotondate al pixel. */
  disegna(): void {
    for (let i = 0; i < this.nubi; i++) this.nubeSprite[i].setPosition(Math.round(this.nubeX[i]), Math.round(this.nubeY[i]));
    for (let i = 0; i < this.proiettili; i++) this.prSprite[i].setPosition(Math.round(this.prX[i]), Math.round(this.prY[i]));
  }

  /** Fa partire il colpo di un'arma; restituisce la ricarica del suo livello. */
  private spara(p: Posseduta): number {
    const a = p.arma;
    const area = 1 + this.bonus.area;
    switch (a.id) {
      case 'lanterna': {
        const l = a.livelli[p.livello - 1];
        this.arco(this.dx, this.dy, l.raggio * area, l.ampiezza, l.danno);
        if (l.spalle) this.arco(-this.dx, -this.dy, l.raggio * area, l.ampiezza, l.danno);
        return l.ricarica;
      }
      case 'pala': {
        const l = a.livelli[p.livello - 1];
        this.impatto(this.dx, this.dy, l.raggio * area, l.danno);
        if (l.doppio) {
          this.doppio = a.ritardoDoppio;
          this.dannoDoppio = l.danno;
          this.raggioDoppio = l.raggio * area;
        }
        return l.ricarica;
      }
      case 'turibolo': {
        const l = a.livelli[p.livello - 1];
        for (let k = 0; k < l.quantita; k++) {
          let nx = this.px + this.dx * a.distanzaPrima;
          let ny = this.py + this.dy * a.distanzaPrima;
          if (k > 0) {
            const ang = this.caso.numero() * Math.PI * 2;
            const d = this.caso.numero() * a.distanzaAltre;
            nx = this.px + Math.cos(ang) * d;
            ny = this.py + Math.sin(ang) * d;
          }
          this.nube(nx, ny, l.raggio * area, l.danno, l.durata);
        }
        return l.ricarica;
      }
      case 'bastone': {
        const l = a.livelli[p.livello - 1];
        this.raffica = l.quantita;
        this.attesaRaffica = 0;
        this.dannoRaffica = l.danno;
        this.trapassaRaffica = l.trapassa;
        return l.ricarica;
      }
    }
  }

  private danno(base: number): number {
    return base * (1 + this.bonus.danno) * (COLPI.casoMinimo + this.caso.numero() * (COLPI.casoMassimo - COLPI.casoMinimo));
  }

  // ——— Lanterna ———
  private arco(dx: number, dy: number, raggio: number, ampiezza: number, danno: number): void {
    this.cx = this.px;
    this.cy = this.py;
    this.cr = raggio;
    this.dxArco = dx;
    this.dyArco = dy;
    this.cCos = Math.cos(((ampiezza / 2) * Math.PI) / 180);
    this.cDanno = danno;
    this.cRespinta = LANTERNA.respinta;
    this.colpo++;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaArco);
    this.effetto(LANTERNA.effetto, this.px, this.py, Math.atan2(dy, dx), raggio);
  }
  // ——— Pala ———
  private impatto(dx: number, dy: number, raggio: number, danno: number): void {
    this.cx = this.px + dx * PALA.distanza;
    this.cy = this.py + dy * PALA.distanza;
    this.cr = raggio;
    this.cDanno = danno;
    this.cRespinta = PALA.respinta;
    this.colpo++;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaCerchio);
    this.effetto(PALA.effetto, this.cx, this.cy, 0, raggio);
  }

  private aggiornaDoppio(dt: number): void {
    if (this.doppio < 0) return;
    this.doppio -= dt;
    if (this.doppio < 0) this.impatto(-this.dx, -this.dy, this.raggioDoppio, this.dannoDoppio);
  }

  /** Il nemico j è nel cerchio (o nell'arco) del colpo in corso? Se sì, lo colpisce. */
  private tocca(j: number, arco: boolean): void {
    const o = this.orda;
    if (o.segno[j] === this.colpo || o.salute[j] <= 0) return;
    const ex = o.x[j] - this.cx;
    const ey = o.y[j] - o.raggio[j] - this.cy;
    const r = this.cr + o.raggio[j];
    const d2 = ex * ex + ey * ey;
    if (d2 > r * r) return;
    const d = Math.sqrt(d2) || 1;
    if (arco && (ex * this.dxArco + ey * this.dyArco) / d < this.cCos && d > o.raggio[j]) return;
    o.segno[j] = this.colpo;
    o.colpisci(j, this.danno(this.cDanno), this.cRespinta, ex / d, ey / d);
  }

  // ——— Turibolo ———
  private nube(x: number, y: number, raggio: number, danno: number, durata: number): void {
    if (this.nubi >= MAX_NUBI) return;
    const i = this.nubi++;
    this.nubeX[i] = x;
    this.nubeY[i] = y;
    this.nubeR[i] = raggio;
    this.nubeDanno[i] = danno;
    this.nubeVita[i] = durata;
    this.nubeTick[i] = 0;
    const s = this.nubeSprite[i];
    s.setScale(raggio / this.raggioEffetto.get(TURIBOLO.effetto)!).setVisible(true);
    s.play({ key: `${TURIBOLO.effetto}:idle`, duration: durata * 1000, repeat: 0 });
  }

  private aggiornaNubi(dt: number): void {
    for (let i = this.nubi - 1; i >= 0; i--) {
      this.nubeVita[i] -= dt;
      if (this.nubeVita[i] <= 0) {
        this.togliNube(i);
        continue;
      }
      this.nubeTick[i] -= dt;
      if (this.nubeTick[i] > 0) continue;
      this.nubeTick[i] += TURIBOLO.intervallo;
      this.cx = this.nubeX[i];
      this.cy = this.nubeY[i];
      this.cr = this.nubeR[i];
      this.cDanno = this.nubeDanno[i];
      this.cRallenta = TURIBOLO.rallenta;
      this.cDurata = TURIBOLO.intervallo + 0.05;
      this.colpo++;
      this.orda.griglia.nelRaggio(this.cx, this.cy, this.cr + 40, this.visitaNube);
    }
  }

  private toccaNube(j: number): void {
    const o = this.orda;
    if (o.segno[j] === this.colpo || o.salute[j] <= 0) return;
    const ex = o.x[j] - this.cx;
    const ey = o.y[j] - o.raggio[j] - this.cy;
    const r = this.cr + o.raggio[j];
    if (ex * ex + ey * ey > r * r) return;
    o.segno[j] = this.colpo;
    o.colpisci(j, this.danno(this.cDanno), 0, 0, 0);
    o.rallenta(j, this.cRallenta, this.cDurata);
  }

  private togliNube(i: number): void {
    const u = --this.nubi;
    const s = this.nubeSprite[i];
    s.stop();
    s.setVisible(false);
    if (i === u) return;
    this.nubeX[i] = this.nubeX[u];
    this.nubeY[i] = this.nubeY[u];
    this.nubeR[i] = this.nubeR[u];
    this.nubeDanno[i] = this.nubeDanno[u];
    this.nubeVita[i] = this.nubeVita[u];
    this.nubeTick[i] = this.nubeTick[u];
    this.nubeSprite[i] = this.nubeSprite[u];
    this.nubeSprite[u] = s;
  }

  // ——— Bastone ———
  private aggiornaRaffica(dt: number): void {
    if (this.raffica <= 0) return;
    this.attesaRaffica -= dt;
    if (this.attesaRaffica > 0) return;
    this.attesaRaffica += BASTONE.intervallo;
    this.raffica--;
    const bersaglio = this.piuVicino(BASTONE.portata);
    if (bersaglio < 0 || this.proiettili >= MAX_PROIETTILI) return;
    const o = this.orda;
    const tx = o.x[bersaglio] - this.px;
    const ty = o.y[bersaglio] - o.raggio[bersaglio] - this.py;
    const d = Math.hypot(tx, ty) || 1;
    const i = this.proiettili++;
    this.prX[i] = this.px;
    this.prY[i] = this.py;
    this.prVX[i] = (tx / d) * BASTONE.velocita;
    this.prVY[i] = (ty / d) * BASTONE.velocita;
    this.prVita[i] = BASTONE.vita;
    this.prDanno[i] = this.dannoRaffica;
    this.prResto[i] = this.trapassaRaffica;
    this.prColpiti.fill(0, i * 4, i * 4 + 4);
    this.prSprite[i].setRotation(Math.atan2(ty, tx)).setVisible(true);
  }

  private piuVicino(portata: number): number {
    const o = this.orda;
    let migliore = -1;
    let d2min = portata * portata;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= 0) continue;
      const ex = o.x[j] - this.px;
      const ey = o.y[j] - o.raggio[j] - this.py;
      const d2 = ex * ex + ey * ey;
      if (d2 < d2min) {
        d2min = d2;
        migliore = j;
      }
    }
    return migliore;
  }

  private aggiornaProiettili(dt: number): void {
    for (let i = this.proiettili - 1; i >= 0; i--) {
      this.prVita[i] -= dt;
      this.prX[i] += this.prVX[i] * dt;
      this.prY[i] += this.prVY[i] * dt;
      if (this.prVita[i] > 0) {
        this.cProiettile = i;
        this.cx = this.prX[i];
        this.cy = this.prY[i];
        this.orda.griglia.vicini(this.cx, this.cy, this.visitaProiettile);
      }
      if (this.prVita[i] <= 0 || this.prResto[i] === 0) this.togliProiettile(i);
    }
  }

  private toccaProiettile(j: number): void {
    const i = this.cProiettile;
    const o = this.orda;
    if (this.prResto[i] === 0 || o.salute[j] <= 0) return;
    for (let k = 0; k < 4; k++) if (this.prColpiti[i * 4 + k] === o.id[j]) return;
    const ex = o.x[j] - this.cx;
    const ey = o.y[j] - o.raggio[j] - this.cy;
    const r = BASTONE.raggio + o.raggio[j];
    if (ex * ex + ey * ey > r * r) return;
    for (let k = 0; k < 4; k++) {
      if (this.prColpiti[i * 4 + k] === 0) {
        this.prColpiti[i * 4 + k] = o.id[j];
        break;
      }
    }
    this.prResto[i]--;
    const v = Math.hypot(this.prVX[i], this.prVY[i]) || 1;
    o.colpisci(j, this.danno(this.prDanno[i]), BASTONE.respinta, this.prVX[i] / v, this.prVY[i] / v);
    this.effetto(BASTONE.esplosione, this.cx, this.cy, 0, 0);
  }

  private togliProiettile(i: number): void {
    const u = --this.proiettili;
    const s = this.prSprite[i];
    s.setVisible(false);
    if (i === u) return;
    this.prX[i] = this.prX[u];
    this.prY[i] = this.prY[u];
    this.prVX[i] = this.prVX[u];
    this.prVY[i] = this.prVY[u];
    this.prVita[i] = this.prVita[u];
    this.prDanno[i] = this.prDanno[u];
    this.prResto[i] = this.prResto[u];
    this.prColpiti.copyWithin(i * 4, u * 4, u * 4 + 4);
    this.prSprite[i] = this.prSprite[u];
    this.prSprite[u] = s;
  }

  // ——— Effetti solo da vedere ———
  /** Mostra un effetto centrato in (x, y). Con raggio > 0 lo ingrandisce fino a coprire quell'area. */
  private effetto(chiave: string, x: number, y: number, angolo: number, raggio: number): void {
    let i = 0;
    while (i < MAX_EFFETTI && this.vitaEffetto[i] > 0) i++;
    if (i === MAX_EFFETTI) return;
    const s = this.effetti[i];
    const anim = this.scena.anims.get(`${chiave}:idle`);
    if (!anim) return;
    const scala = raggio > 0 ? raggio / this.raggioEffetto.get(chiave)! : ingrandimento(this.scena, chiave);
    s.setTexture(chiave).setPosition(Math.round(x), Math.round(y)).setRotation(angolo).setScale(scala).setVisible(true);
    s.play({ key: anim.key, repeat: 0 });
    this.vitaEffetto[i] = anim.duration / 1000;
  }
}
