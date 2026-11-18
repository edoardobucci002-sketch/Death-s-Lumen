/*
 * Seth, il Rinnovato, Boss del Mondo 1 (18/11): il suo «cervello», i suoi avvisi a terra e i suoi proiettili (falci e
 * detriti). Vive nella Orda come gli altri nemici (così Echi, stati e reazioni lo toccano); NemiciStanza chiama passo()
 * al posto della logica di Ricaduto e Cantore, e proiettili() a ogni passo.
 * Tra un attacco e l'altro cammina verso il personaggio; poi sceglie: vicino la Falciata (uno spicchio a mezzaluna), lontano
 * le Falci spettrali (linee a ventaglio, poi le falci), un attacco su tre il Passo della Morte (affonda, un cerchio sotto
 * il personaggio, poi riappare lì e colpisce; in fase 2 con i detriti a raggiera fino ai muri e subito una Falciata).
 * Uscire dall'area nell'ultimo istante dell'avviso, o farsi sfiorare da un proiettile, è una schivata perfetta.
 * Numeri in SETH (src/data/seth.ts). Una sola istanza, niente allocazioni nel ciclo di gioco.
 */
import Phaser from 'phaser';
import { SETH } from '../data/seth';
import { areaCamminabile } from './stanza';
import { suona } from './audio';
import type { CampoCapo } from './campanaro';

const K = SETH;
const colore = (h: string): number => parseInt(h.slice(1), 16);
const MAX_PROIETTILI = 48;
const MEZZA_FALCIATA = Phaser.Math.DegToRad(K.falciata.ampiezza / 2);

/** Cosa sta facendo Seth. */
export const MOSSA_SETH = { cammina: 0, falciata: 1, falci: 2, passo: 3, recupero: 4 } as const;
/** I proiettili: le falci spettrali e i detriti della fase 2. */
export const PROIETTILE_SETH = { falce: 0, detrito: 1 } as const;

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

export class Seth {
  mossa: number = MOSSA_SETH.cammina;
  fase = 1;
  tempo = 0; // secondi alla fine della mossa
  durata = 1; // durata intera della mossa (per riempire l'avviso)
  dirX = 1;
  dirY = 0;
  /** Il Passo della Morte: dove riapparirà (fermo dove era il personaggio quando è cominciato). */
  passoX = 0;
  passoY = 0;
  /** Le Falci spettrali: da dove partono e in che direzioni (una per falce). */
  origineX = 0;
  origineY = 0;
  readonly falciX = new Float32Array(K.falci.quante);
  readonly falciY = new Float32Array(K.falci.quante);
  /** I detriti: le direzioni a raggiera (sempre le stesse) e quanto è lunga ogni linea fino al muro. */
  readonly detritiX = Float32Array.from({ length: K.detriti.quanti }, (_, k) => Math.cos((k / K.detriti.quanti) * Math.PI * 2 + Math.PI / K.detriti.quanti));
  readonly detritiY = Float32Array.from({ length: K.detriti.quanti }, (_, k) => Math.sin((k / K.detriti.quanti) * Math.PI * 2 + Math.PI / K.detriti.quanti));
  private readonly detritiL = new Float32Array(K.detriti.quanti);
  private readonly falciL = new Float32Array(K.falci.quante);
  private dentro = Infinity; // secondi al colpo l'ultima volta che il personaggio era nell'area
  private attacchi = 0;
  /** LAB: il prossimo attacco scelto a mano (−1 = come vuole lui). */
  prossimo = -1;
  /** Statistiche per il LAB e le prove. */
  falciate = 0;
  lanci = 0;
  passi = 0;
  detriti = 0;
  // i proiettili in volo: posizione, velocità, raggio, danno, tipo, sfiorato (0 no, 1 vicino, 2 già contato)
  numero = 0;
  readonly pX = new Float32Array(MAX_PROIETTILI);
  readonly pY = new Float32Array(MAX_PROIETTILI);
  readonly pVX = new Float32Array(MAX_PROIETTILI);
  readonly pVY = new Float32Array(MAX_PROIETTILI);
  readonly pR = new Float32Array(MAX_PROIETTILI);
  private readonly pD = new Float32Array(MAX_PROIETTILI);
  readonly pTipo = new Uint8Array(MAX_PROIETTILI);
  private readonly pS = new Uint8Array(MAX_PROIETTILI);

  nasce(): void {
    this.mossa = MOSSA_SETH.cammina;
    this.fase = 1;
    this.tempo = K.pausa;
    this.attacchi = this.falciate = this.lanci = this.passi = this.detriti = 0;
    this.prossimo = -1;
    this.numero = 0;
  }

  /** Via i proiettili (stanza nuova, Seth battuto). */
  svuota(): void {
    this.numero = 0;
  }

  /** Il ritmo della fase: in fase 2 avvisi e pause più brevi. */
  private get ritmo(): number {
    return this.fase === 2 ? K.fase2.ritmo : 1;
  }

  /** In avviso: per l'impatto (niente spinta) e per il bot. */
  get inAvviso(): boolean {
    return this.mossa === MOSSA_SETH.falciata || this.mossa === MOSSA_SETH.falci || this.mossa === MOSSA_SETH.passo;
  }

  /**
   * Un passo di Seth (indice i nella Orda). passo: dt con i rallentamenti (stati, Cerchio di luce). Restituisce il danno
   * che fa al personaggio in (px, py) in questo passo (i proiettili a parte, in proiettili()).
   */
  passo(n: CampoCapo, i: number, dt: number, passo: number, px: number, py: number): number {
    const o = n.orda, x = o.x[i], y = o.y[i], dx = px - x, dy = py - y, d = Math.hypot(dx, dy) || 1;
    if (this.fase === 1 && o.salute[i] <= o.saluteMassima[i] * K.fase2.soglia) {
      // fase 2: subito il Passo della Morte, con i detriti
      this.fase = 2;
      suona('campana');
      this.iniziaPasso(px, py);
      return 0;
    }
    let danno = 0;
    const prima = this.tempo;
    this.tempo -= dt;
    switch (this.mossa) {
      case MOSSA_SETH.cammina: {
        if (d > K.raggio + n.corpo + 8) {
          o.x[i] += (dx / d) * K.velocita * passo;
          o.y[i] += (dy / d) * K.velocita * passo;
        }
        if (this.tempo <= 0) this.scegli(i, n, dx / d, dy / d, d, px, py);
        break;
      }
      case MOSSA_SETH.falciata: {
        const dentro = this.nellaFalciata(x, y, px, py, n.corpo);
        if (dentro) this.dentro = prima;
        if (this.tempo > 0) break;
        suona('sparo');
        this.falciate++;
        if (dentro) danno = K.falciata.danno;
        else if (this.dentro <= n.finestra) n.schivate++;
        this.inizia(MOSSA_SETH.recupero, K.falciata.recupero);
        break;
      }
      case MOSSA_SETH.falci: {
        if (this.tempo > 0) break;
        suona('sparo');
        this.lanci++;
        for (let k = 0; k < K.falci.quante; k++) {
          this.lancia(this.origineX, this.origineY, this.falciX[k] * K.falci.velocita, this.falciY[k] * K.falci.velocita, K.falci.raggio, K.falci.danno, PROIETTILE_SETH.falce);
        }
        this.inizia(MOSSA_SETH.recupero, K.falci.recupero);
        break;
      }
      case MOSSA_SETH.passo: {
        const dentro = Math.hypot(px - this.passoX, py - this.passoY) < K.passo.raggio + n.corpo;
        if (dentro) this.dentro = prima;
        if (this.tempo > 0) break;
        // riappare nel cerchio e colpisce
        suona('danno');
        this.passi++;
        o.x[i] = this.passoX;
        o.y[i] = this.passoY;
        if (dentro) danno = K.passo.danno;
        else if (this.dentro <= n.finestra) n.schivate++;
        if (this.fase === 2) {
          // i detriti a raggiera fino ai muri, poi subito una Falciata verso il personaggio
          this.detriti++;
          for (let k = 0; k < K.detriti.quanti; k++) {
            this.lancia(this.passoX, this.passoY, this.detritiX[k] * K.detriti.velocita, this.detritiY[k] * K.detriti.velocita, K.detriti.raggio, K.detriti.danno, PROIETTILE_SETH.detrito);
          }
          const ex = px - this.passoX, ey = py - this.passoY, e = Math.hypot(ex, ey) || 1;
          this.dirX = ex / e;
          this.dirY = ey / e;
          this.inizia(MOSSA_SETH.falciata, K.falciata.avviso * this.ritmo);
        } else this.inizia(MOSSA_SETH.recupero, K.passo.recupero);
        break;
      }
      default:
        if (this.tempo <= 0) this.inizia(MOSSA_SETH.cammina, K.pausa * this.ritmo);
    }
    return danno;
  }

  /** Il prossimo attacco: un attacco su tre il Passo della Morte; se no vicino la Falciata, lontano le Falci spettrali. */
  private scegli(i: number, n: CampoCapo, ux: number, uy: number, d: number, px: number, py: number): void {
    this.attacchi++;
    let m: number = this.attacchi % K.passoOgni === 0 ? MOSSA_SETH.passo : d < K.vicino ? MOSSA_SETH.falciata : MOSSA_SETH.falci;
    if (this.prossimo >= 0) {
      m = this.prossimo;
      this.prossimo = -1;
    }
    this.dirX = ux;
    this.dirY = uy;
    if (m === MOSSA_SETH.passo) this.iniziaPasso(px, py);
    else if (m === MOSSA_SETH.falciata) this.inizia(m, K.falciata.avviso * this.ritmo);
    else {
      // le linee a ventaglio, centrate sul personaggio, dal punto in cui sta Seth fino al muro
      const o = n.orda, base = Math.atan2(uy, ux), passoA = K.falci.quante > 1 ? Phaser.Math.DegToRad(K.falci.ventaglio) / (K.falci.quante - 1) : 0;
      this.origineX = o.x[i];
      this.origineY = o.y[i];
      for (let k = 0; k < K.falci.quante; k++) {
        const a = base + (k - (K.falci.quante - 1) / 2) * passoA;
        this.falciX[k] = Math.cos(a);
        this.falciY[k] = Math.sin(a);
        this.falciL[k] = finoAlMuro(this.origineX, this.origineY, this.falciX[k], this.falciY[k]);
      }
      this.inizia(MOSSA_SETH.falci, K.falci.avviso * this.ritmo);
    }
  }

  /** Il Passo della Morte: il cerchio sotto il personaggio; in fase 2 anche le linee dei detriti. */
  private iniziaPasso(px: number, py: number): void {
    const a = areaCamminabile();
    this.passoX = Phaser.Math.Clamp(px, a.x0, a.x1);
    this.passoY = Phaser.Math.Clamp(py, a.y0, a.y1);
    for (let k = 0; k < K.detriti.quanti; k++) this.detritiL[k] = finoAlMuro(this.passoX, this.passoY, this.detritiX[k], this.detritiY[k]);
    this.inizia(MOSSA_SETH.passo, K.passo.avviso * this.ritmo);
  }

  private inizia(m: number, durata: number): void {
    this.mossa = m;
    this.tempo = this.durata = durata;
    this.dentro = Infinity;
  }

  /** Il personaggio in (px, py) è nello spicchio della Falciata di Seth in (x, y)? */
  nellaFalciata(x: number, y: number, px: number, py: number, corpo: number): boolean {
    const ex = px - x, ey = py - y, d = Math.hypot(ex, ey);
    if (d >= K.falciata.raggio + corpo) return false;
    if (d <= corpo) return true;
    const coseno = (ex * this.dirX + ey * this.dirY) / d;
    return Math.acos(Phaser.Math.Clamp(coseno, -1, 1)) <= MEZZA_FALCIATA + Math.asin(Math.min(1, corpo / d));
  }

  /** Un proiettile nuovo (se c'è posto). */
  private lancia(x: number, y: number, vx: number, vy: number, r: number, danno: number, tipo: number): void {
    if (this.numero >= MAX_PROIETTILI) return;
    const k = this.numero++;
    this.pX[k] = x;
    this.pY[k] = y;
    this.pVX[k] = vx;
    this.pVY[k] = vy;
    this.pR[k] = r;
    this.pD[k] = danno;
    this.pTipo[k] = tipo;
    this.pS[k] = 0;
  }

  private togli(k: number): void {
    const u = --this.numero;
    this.pX[k] = this.pX[u];
    this.pY[k] = this.pY[u];
    this.pVX[k] = this.pVX[u];
    this.pVY[k] = this.pVY[u];
    this.pR[k] = this.pR[u];
    this.pD[k] = this.pD[u];
    this.pTipo[k] = this.pTipo[u];
    this.pS[k] = this.pS[u];
  }

  /**
   * Falci e detriti: volano dritti fino al muro. Su di te feriscono e spariscono; se ti passano vicino senza toccarti
   * (entro n.sfioro oltre il contatto) è una schivata perfetta. Restituisce il danno più forte in questo passo.
   */
  proiettili(n: CampoCapo, dt: number, px: number, py: number): number {
    let danno = 0;
    const a = areaCamminabile();
    for (let k = this.numero - 1; k >= 0; k--) {
      const x = (this.pX[k] += this.pVX[k] * dt), y = (this.pY[k] += this.pVY[k] * dt);
      const d = Math.hypot(px - x, py - y), r = this.pR[k] + n.corpo;
      if (d < r) {
        danno = Math.max(danno, this.pD[k]);
        this.togli(k);
        continue;
      }
      if (d < r + n.sfioro) {
        if (this.pS[k] === 0) this.pS[k] = 1;
      } else if (this.pS[k] === 1) {
        this.pS[k] = 2; // ti è passato accanto senza toccarti
        n.schivate++;
      }
      if (x < a.x0 - this.pR[k] || x > a.x1 + this.pR[k] || y < a.y0 - this.pR[k] || y > a.y1 + this.pR[k]) {
        if (this.pS[k] === 1) n.schivate++;
        this.togli(k);
      }
    }
    return danno;
  }

  /** Il fotogramma della posa (null = la camminata di sempre): negli avvisi la posa special, che si compie verso il colpo. */
  posa(sp: Phaser.GameObjects.Sprite): string | null {
    const spe = sp.scene.anims.get(`${K.sprite}:special`);
    if (!spe || !this.inAvviso) return null;
    const pieno = 1 - Math.max(0, this.tempo) / this.durata, n = spe.frames.length;
    // il Passo: affonda (gli ultimi fotogrammi); le altre mosse: la posa cresce con l'avviso
    const k = this.mossa === MOSSA_SETH.passo ? n - 1 : Math.min(n - 1, Math.floor(pieno * n));
    return String(spe.frames[k].textureFrame);
  }

  /** Nel Passo della Morte Seth è affondato: si vede appena (a retino, lo decide chi disegna). */
  get affondato(): boolean {
    return this.mossa === MOSSA_SETH.passo;
  }

  /**
   * Gli avvisi a terra: lo spicchio della Falciata, le linee delle Falci, il cerchio del Passo (in fase 2 con le linee dei
   * detriti). Il pieno va in g, sotto il personaggio; i bordi in b, sopra il buio, così si leggono anche lontano dalla Lanterna.
   */
  disegna(g: Phaser.GameObjects.Graphics, b: Phaser.GameObjects.Graphics, x: number, y: number, orologio: number): void {
    const C = K.colori, pieno = 1 - Math.max(0, this.tempo) / this.durata, rosso = colore(C.avviso), chiaro = colore(C.bordo);
    if (this.mossa === MOSSA_SETH.falciata) {
      const a = Math.atan2(this.dirY, this.dirX), r = K.falciata.raggio;
      g.fillStyle(rosso, 1).slice(x, y, Math.max(4, Math.round(r * pieno)), a - MEZZA_FALCIATA, a + MEZZA_FALCIATA, false).fillPath();
      b.lineStyle(2, chiaro, 1).slice(x, y, r, a - MEZZA_FALCIATA, a + MEZZA_FALCIATA, false).strokePath();
    } else if (this.mossa === MOSSA_SETH.falci) {
      // le linee lampeggiano, poi restano accese nell'ultimo terzo
      if (pieno > 0.66 || Math.floor(orologio * 8) % 2 === 0) {
        const ox = Math.round(this.origineX), oy = Math.round(this.origineY);
        for (let k = 0; k < K.falci.quante; k++) {
          const fx = Math.round(ox + this.falciX[k] * this.falciL[k]), fy = Math.round(oy + this.falciY[k] * this.falciL[k]);
          g.lineStyle(K.falci.raggio * 2, rosso, 1).lineBetween(ox, oy, fx, fy);
          b.lineStyle(2, colore(C.falce), 1).lineBetween(ox, oy, fx, fy);
        }
      }
    } else if (this.mossa === MOSSA_SETH.passo) {
      const cx = Math.round(this.passoX), cy = Math.round(this.passoY);
      g.fillStyle(rosso, 1).fillCircle(cx, cy, Math.max(4, Math.round(K.passo.raggio * pieno)));
      b.lineStyle(2, chiaro, 1).strokeCircle(cx, cy, K.passo.raggio);
      if (this.fase === 2 && (pieno > 0.66 || Math.floor(orologio * 8) % 2 === 0)) {
        for (let k = 0; k < K.detriti.quanti; k++) {
          const l = this.detritiL[k];
          g.lineStyle(K.detriti.raggio * 2, rosso, 1).lineBetween(cx, cy, Math.round(cx + this.detritiX[k] * l), Math.round(cy + this.detritiY[k] * l));
          b.lineStyle(2, colore(C.detritoChiaro), 1).lineBetween(cx, cy, Math.round(cx + this.detritiX[k] * l), Math.round(cy + this.detritiY[k] * l));
        }
      }
    }
  }

  /** Falci e detriti in volo, sopra il buio: le falci come archi rossi che girano, i detriti come zolle squadrate. */
  disegnaProiettili(b: Phaser.GameObjects.Graphics, orologio: number): void {
    const C = K.colori;
    for (let k = 0; k < this.numero; k++) {
      const x = Math.round(this.pX[k]), y = Math.round(this.pY[k]), r = Math.round(this.pR[k]);
      if (this.pTipo[k] === PROIETTILE_SETH.falce) {
        const giro = orologio * 14 + k;
        b.lineStyle(4, colore(C.falce), 1).beginPath().arc(x, y, r, giro, giro + 3.6, false).strokePath();
        b.lineStyle(2, colore(C.falceChiara), 1).beginPath().arc(x, y, r - 2, giro + 0.4, giro + 2.4, false).strokePath();
      } else {
        b.fillStyle(colore(C.detrito), 1).fillRect(x - r, y - r, 2 * r, 2 * r);
        b.fillStyle(colore(C.detritoChiaro), 1).fillRect(x - r, y - r, 2 * r, 2);
      }
    }
  }
}
