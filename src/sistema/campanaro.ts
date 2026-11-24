/*
 * Il Campanaro, mini-boss del Mondo 1 (17/11): il suo «cervello» e i suoi avvisi a terra. Vive nella Orda come gli altri
 * nemici (così Echi, stati e reazioni lo toccano); NemiciStanza chiama passo() al posto della logica di Ricaduto e Cantore.
 * Tra un attacco e l'altro cammina verso il personaggio; poi sceglie: vicino il Rintocco (un disco che si riempie, poi
 * l'onda; in fase 2 segue un anello più largo), lontano la Carica (una linea fino al muro, poi corre; contro il muro resta
 * stordito), in fase 2 ogni tanto la Chiamata (Ricaduti). Uscire dall'area nell'ultimo istante dell'avviso è una schivata
 * perfetta. Sotto metà salute passa alla fase 2: avvisi e pause più brevi. Numeri in CAMPANARO (src/data/campanaro.ts).
 * Una sola istanza, niente allocazioni nel ciclo di gioco.
 */
import Phaser from 'phaser';
import { CAMPANARO } from '../data/campanaro';
import { areaCamminabile } from './stanza';
import { suona } from './audio';

const K = CAMPANARO;
const colore = (h: string): number => parseInt(h.slice(1), 16);

/** Cosa sta facendo il Campanaro. */
export const MOSSA_CAPO = { cammina: 0, rintocco: 1, anello: 2, mira: 3, carica: 4, stordito: 5, chiamata: 6, recupero: 7 } as const;

/** Quello che il Campanaro usa di NemiciStanza (per non legare i due file in tondo). */
export interface CampoCapo {
  readonly orda: { x: Float32Array; y: Float32Array; salute: Float32Array; saluteMassima: Float32Array };
  readonly corpo: number;
  finestra: number;
  sfioro: number;
  schivate: number;
  aggiungi(t: 'ricaduto', x: number, y: number, comparsa?: number): boolean;
}

export class Campanaro {
  mossa: number = MOSSA_CAPO.cammina;
  fase = 1;
  tempo = 0; // secondi alla fine della mossa
  durata = 1; // durata intera della mossa (per riempire l'avviso)
  dirX = 1;
  dirY = 0;
  fineX = 0; // dove finisce la linea della Carica (al muro)
  fineY = 0;
  onda = 0; // secondi dell'onda che si vede dopo il colpo
  ondaAnello = false;
  private dentro = Infinity; // secondi al colpo l'ultima volta che il personaggio era nell'area
  private colpito = false; // la Carica ha già preso il personaggio
  private attacchi = 0;
  /** LAB: il prossimo attacco scelto a mano (−1 = come vuole lui). */
  prossimo = -1;
  /** Statistiche per il LAB e le prove. */
  rintocchi = 0;
  cariche = 0;
  chiamate = 0;

  nasce(): void {
    this.mossa = MOSSA_CAPO.cammina;
    this.fase = 1;
    this.tempo = K.pausa;
    this.onda = 0;
    this.attacchi = this.rintocchi = this.cariche = this.chiamate = 0;
    this.prossimo = -1;
  }

  /** Il ritmo della fase: in fase 2 avvisi e pause più brevi. */
  private get ritmo(): number {
    return this.fase === 2 ? K.fase2.ritmo : 1;
  }

  /** In avviso: per l'impatto (niente spinta) e per il bot. */
  get inAvviso(): boolean {
    return this.mossa === MOSSA_CAPO.rintocco || this.mossa === MOSSA_CAPO.anello || this.mossa === MOSSA_CAPO.mira || this.mossa === MOSSA_CAPO.chiamata;
  }

  /**
   * Un passo del Campanaro i. passo: dt con i rallentamenti (stati, Cerchio di luce). Restituisce il danno che fa al
   * personaggio in (px, py) in questo passo.
   */
  passo(n: CampoCapo, i: number, dt: number, passo: number, px: number, py: number): number {
    const o = n.orda, x = o.x[i], y = o.y[i], dx = px - x, dy = py - y, d = Math.hypot(dx, dy) || 1;
    if (this.onda > 0) this.onda -= dt;
    if (this.fase === 1 && o.salute[i] <= o.saluteMassima[i] * K.fase2.soglia) {
      // fase 2: un rintocco subito, poi tutto più in fretta
      this.fase = 2;
      suona('campana');
      this.inizia(MOSSA_CAPO.rintocco, K.rintocco.avviso * this.ritmo, dx / d, dy / d);
      return 0;
    }
    let danno = 0;
    const prima = this.tempo;
    this.tempo -= dt;
    switch (this.mossa) {
      case MOSSA_CAPO.cammina: {
        if (d > K.raggio + n.corpo + 8) {
          o.x[i] += (dx / d) * K.velocita * passo;
          o.y[i] += (dy / d) * K.velocita * passo;
        }
        if (this.tempo <= 0) this.scegli(i, n, dx / d, dy / d, d);
        break;
      }
      case MOSSA_CAPO.rintocco:
      case MOSSA_CAPO.anello: {
        const anello = this.mossa === MOSSA_CAPO.anello;
        const dentro = anello ? d > K.rintocco.raggio - n.corpo && d < K.anello.raggio + n.corpo : d < K.rintocco.raggio + n.corpo;
        if (dentro) this.dentro = prima;
        if (this.tempo > 0) break;
        suona('campana');
        this.onda = K.rintocco.onda;
        this.ondaAnello = anello;
        if (dentro) danno = anello ? K.anello.danno : K.rintocco.danno;
        else if (this.dentro <= n.finestra) n.schivate++;
        if (!anello) this.rintocchi++;
        // in fase 2 dopo il disco viene l'anello (il posto sicuro torna vicino a lui)
        if (!anello && this.fase === 2) this.inizia(MOSSA_CAPO.anello, K.anello.avviso * this.ritmo, this.dirX, this.dirY);
        else this.inizia(MOSSA_CAPO.recupero, K.rintocco.recupero, this.dirX, this.dirY);
        break;
      }
      case MOSSA_CAPO.mira: {
        if (this.sullaLinea(x, y, px, py, n.corpo)) this.dentro = prima;
        if (this.tempo > 0) break;
        if (this.dentro <= n.finestra && !this.sullaLinea(x, y, px, py, n.corpo)) n.schivate++;
        this.colpito = false;
        this.cariche++;
        suona('sparo');
        this.inizia(MOSSA_CAPO.carica, Infinity, this.dirX, this.dirY);
        break;
      }
      case MOSSA_CAPO.carica: {
        const a = areaCamminabile(), v = K.carica.velocita * passo;
        let nx = x + this.dirX * v, ny = y + this.dirY * v, muro = false;
        if (nx < a.x0 || nx > a.x1 || ny < a.y0 || ny > a.y1) {
          nx = Phaser.Math.Clamp(nx, a.x0, a.x1);
          ny = Phaser.Math.Clamp(ny, a.y0, a.y1);
          muro = true;
        }
        o.x[i] = nx;
        o.y[i] = ny;
        if (!this.colpito && Math.hypot(px - nx, py - ny) < K.raggio + n.corpo) {
          this.colpito = true;
          danno = K.carica.danno;
        }
        if (muro) {
          suona('danno');
          this.inizia(MOSSA_CAPO.stordito, K.carica.stordito, this.dirX, this.dirY);
        }
        break;
      }
      case MOSSA_CAPO.chiamata: {
        if (this.tempo > 0) break;
        suona('campana');
        this.chiamate++;
        for (let k = 0; k < K.chiamata.ricaduti; k++) {
          const ang = (k / K.chiamata.ricaduti) * Math.PI * 2 + Math.atan2(dy, dx) + Math.PI / 2;
          n.aggiungi('ricaduto', x + Math.cos(ang) * 90, y + Math.sin(ang) * 90);
        }
        this.inizia(MOSSA_CAPO.recupero, K.chiamata.recupero, this.dirX, this.dirY);
        break;
      }
      case MOSSA_CAPO.stordito:
        if (this.tempo <= 0) this.inizia(MOSSA_CAPO.recupero, K.carica.recupero, this.dirX, this.dirY);
        break;
      default:
        if (this.tempo <= 0) this.inizia(MOSSA_CAPO.cammina, K.pausa * this.ritmo, this.dirX, this.dirY);
    }
    return danno;
  }

  /** Il prossimo attacco: vicino il Rintocco, lontano la Carica, in fase 2 ogni tanto la Chiamata. */
  private scegli(i: number, n: CampoCapo, ux: number, uy: number, d: number): void {
    this.attacchi++;
    let m: number = d < K.vicino ? MOSSA_CAPO.rintocco : MOSSA_CAPO.mira;
    if (this.fase === 2 && this.attacchi % K.chiamata.ogni === 0) m = MOSSA_CAPO.chiamata;
    if (this.prossimo >= 0) {
      m = this.prossimo;
      this.prossimo = -1;
    }
    if (m === MOSSA_CAPO.rintocco) this.inizia(m, K.rintocco.avviso * this.ritmo, ux, uy);
    else if (m === MOSSA_CAPO.chiamata) this.inizia(m, K.chiamata.avviso * this.ritmo, ux, uy);
    else {
      this.inizia(MOSSA_CAPO.mira, K.carica.avviso * this.ritmo, ux, uy);
      const o = n.orda, l = finoAlMuro(o.x[i], o.y[i], ux, uy);
      this.fineX = o.x[i] + ux * l;
      this.fineY = o.y[i] + uy * l;
    }
  }

  private inizia(m: number, durata: number, dx: number, dy: number): void {
    this.mossa = m;
    this.tempo = this.durata = durata;
    this.dirX = dx;
    this.dirY = dy;
    this.dentro = Infinity;
  }

  /** Il personaggio in (px, py) è sulla linea della Carica che parte da (x, y)? */
  sullaLinea(x: number, y: number, px: number, py: number, corpo: number): boolean {
    const lx = this.fineX - x, ly = this.fineY - y, l2 = lx * lx + ly * ly || 1;
    const t = Phaser.Math.Clamp(((px - x) * lx + (py - y) * ly) / l2, 0, 1);
    return Math.hypot(px - (x + lx * t), py - (y + ly * t)) < K.carica.larghezza / 2 + corpo;
  }

  /** Il fotogramma della posa (null = la camminata di sempre). */
  posa(sp: Phaser.GameObjects.Sprite): string | null {
    const att = sp.scene.anims.get(`${K.sprite}:attack`), spe = sp.scene.anims.get(`${K.sprite}:special`);
    if (!att || !spe) return null;
    const f = (a: Phaser.Animations.Animation, k: number): string => String(a.frames[Math.min(a.frames.length - 1, k)].textureFrame);
    const meta = Math.floor(att.frames.length / 2), pieno = 1 - Math.max(0, this.tempo) / this.durata;
    switch (this.mossa) {
      case MOSSA_CAPO.rintocco:
      case MOSSA_CAPO.anello:
      case MOSSA_CAPO.chiamata:
        return f(att, Math.min(meta - 1, Math.floor(pieno * meta)));
      case MOSSA_CAPO.mira:
        return f(spe, this.spicchio(spe));
      case MOSSA_CAPO.carica:
        return f(spe, this.spicchio(spe) + 1);
      case MOSSA_CAPO.stordito:
        return f(att, att.frames.length - 1);
      case MOSSA_CAPO.recupero: // subito dopo il Rintocco, finché si vede l'onda, la campana a terra (il colpo)
        return f(att, this.onda > 0 ? meta : att.frames.length - 1);
      default:
        return this.onda > 0 ? f(att, meta) : null;
    }
  }

  /**
   * Quale coppia di «special» (mira, corsa) secondo la direzione della Carica: 0 di lato, 2 in diagonale in su, 4 in
   * diagonale in giù. Con uno sprite di sole 2 pose resta di lato.
   */
  private spicchio(spe: Phaser.Animations.Animation): number {
    if (spe.frames.length < 6 || Math.abs(this.dirY) <= Math.sin((K.carica.diagonale * Math.PI) / 180)) return 0;
    return this.dirY < 0 ? 2 : 4;
  }

  /** Durante la mira e la corsa guarda dove corre, non il personaggio (−1 sinistra, 1 destra, 0 = come prima). */
  get versoCarica(): number {
    if (this.mossa !== MOSSA_CAPO.mira && this.mossa !== MOSSA_CAPO.carica) return 0;
    return this.dirX < -0.01 ? -1 : this.dirX > 0.01 ? 1 : 0;
  }

  /**
   * Gli avvisi a terra: il disco o l'anello che si riempiono, la linea della Carica, l'onda dopo il colpo. Il pieno va in
   * g, sotto il personaggio; i bordi in b, sopra il buio, così l'avviso si legge anche lontano dalla Lanterna.
   */
  disegna(g: Phaser.GameObjects.Graphics, b: Phaser.GameObjects.Graphics, x: number, y: number, orologio: number): void {
    const C = K.colori, pieno = 1 - Math.max(0, this.tempo) / this.durata, R1 = K.rintocco.raggio, R2 = K.anello.raggio;
    const chiaro = colore(C.onda), rosso = colore(C.avviso);
    // cerchi veri, come lo spicchio del Ricaduto: quello che si vede è quello che colpisce
    if (this.mossa === MOSSA_CAPO.rintocco) {
      g.fillStyle(rosso, 1).fillCircle(x, y, Math.max(4, Math.round(R1 * pieno)));
      b.lineStyle(2, chiaro, 1).strokeCircle(x, y, R1);
    } else if (this.mossa === MOSSA_CAPO.anello) {
      // l'anello si riempie dal bordo interno verso quello esterno
      const spesso = Math.max(2, Math.round((R2 - R1) * pieno));
      g.lineStyle(spesso, rosso, 1).strokeCircle(x, y, Math.round(R1 + spesso / 2));
      b.lineStyle(2, chiaro, 1).strokeCircle(x, y, R1).strokeCircle(x, y, R2);
    } else if (this.mossa === MOSSA_CAPO.mira) {
      // la linea della Carica lampeggia, poi resta accesa nell'ultimo terzo; i bordi sopra il buio
      if (pieno > 0.66 || Math.floor(orologio * 8) % 2 === 0) {
        const fx = Math.round(this.fineX), fy = Math.round(this.fineY), m = K.carica.larghezza / 2;
        g.lineStyle(K.carica.larghezza, rosso, 1).lineBetween(x, y, fx, fy);
        b.lineStyle(2, chiaro, 1).lineBetween(Math.round(x - this.dirY * m), Math.round(y + this.dirX * m), Math.round(fx - this.dirY * m), Math.round(fy + this.dirX * m));
        b.lineBetween(Math.round(x + this.dirY * m), Math.round(y - this.dirX * m), Math.round(fx + this.dirY * m), Math.round(fy - this.dirX * m));
      }
    } else if (this.mossa === MOSSA_CAPO.chiamata) {
      b.lineStyle(2, chiaro, 1).strokeCircle(x, y, Math.round(20 + 30 * pieno));
    }
    // l'onda: un anello chiaro che si allarga fino al bordo dell'area colpita
    if (this.onda > 0) {
      const t = 1 - this.onda / K.rintocco.onda, da = this.ondaAnello ? R1 : 0, a = this.ondaAnello ? R2 : R1;
      b.lineStyle(4, chiaro, 1).strokeCircle(x, y, Math.max(4, Math.round(da + (a - da) * t)));
    }
    // il Campanaro stesso: un segno chiaro ai piedi, per trovarlo nel buio
    b.lineStyle(2, chiaro, 1).strokeEllipse(x, y, 2 * K.raggio, K.raggio);
  }
}

/** Distanza da (x, y) al bordo del pavimento andando in direzione (dx, dy). */
function finoAlMuro(x: number, y: number, dx: number, dy: number): number {
  const a = areaCamminabile();
  let t = Infinity;
  if (dx > 0.001) t = Math.min(t, (a.x1 - x) / dx);
  else if (dx < -0.001) t = Math.min(t, (a.x0 - x) / dx);
  if (dy > 0.001) t = Math.min(t, (a.y1 - y) / dy);
  else if (dy < -0.001) t = Math.min(t, (a.y0 - y) / dy);
  return Number.isFinite(t) ? Math.max(0, t) : 0;
}
