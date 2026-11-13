/*
 * Nemici del gioco a stanze (passo 4 della fetta): il Ricaduto e il Cantore, e i grumi di Lumen spento del Cantore.
 * Ogni attacco ha un avviso a terra (lo spicchio del graffio che si riempie, la linea del canto) e lascia spazio alla
 * schivata perfetta, che dà la Grazia: uscire dallo spicchio all'ultimo istante, farsi sfiorare da un grumo.
 * Quiete: dopo un colpo, per un attimo la stessa arma («fonte») non ferisce più quel nemico; le altre sì.
 * Il Ricaduto battuto resta sempre a terra un attimo, intoccabile; poi a volte si rialza (una volta sola).
 * Impatto della Lanterna: il nemico colpito si ferma un attimo (fermo d'impatto), si schiaccia e sprizza scintille.
 * Tutto in array preparati all'inizio (niente allocazioni nel ciclo di gioco); la logica è separata dal disegno.
 * Posizioni ai piedi, in pixel di gioco. Numeri in NEMICI_STANZA e ONDATA (src/data/stanze.ts).
 * Con al massimo ONDATA.massimo nemici, le spinte tra nemici si calcolano a coppie: la griglia spaziale non serve.
 */
import Phaser from 'phaser';
import { COMBATTIMENTO_STANZA, GRAZIA_STANZA, IMPATTO, NEMICI_STANZA, ONDATA, STANZA } from '../data/stanze';
import type { Impatto } from './impatto';
import { PROFONDITA, type Effetti } from './effetti';
import { ingrandimento } from './asset';
import { areaCamminabile } from './stanza';
import type { Caso } from './caso';
import { suona } from './audio';

export const TIPI_STANZA = ['ricaduto', 'cantore'] as const;
export type TipoStanza = (typeof TIPI_STANZA)[number];

/** Cosa sta facendo un nemico. */
export const STATO = { comparsa: 0, cammina: 1, avviso: 2, recupero: 3, aTerra: 4 } as const;

const N = ONDATA.massimo;
/** Le armi che feriscono i nemici, ognuna con la sua Quiete: la Lanterna, il Cerchio di luce (gli Echi arrivano dopo). */
export const FONTE = { lanterna: 0, abilita: 1 } as const;
const FONTI = 4;
const FERITO = { no: 0, inPiedi: 1, battuto: 2 } as const;
const MAX_GRUMI = 16;
const R = NEMICI_STANZA.ricaduto;
const C = NEMICI_STANZA.cantore;
const RICADUTO = 0;
const CANTORE = 1;
const colore = (h: string): number => parseInt(h.slice(1), 16);

interface Aspetto {
  ingrandimento: number;
  piedi: number; // origine verticale dello sprite (la riga dei piedi)
}

export class NemiciStanza {
  numero = 0;
  readonly tipo = new Uint8Array(N);
  readonly x = new Float32Array(N);
  readonly y = new Float32Array(N);
  readonly salute = new Float32Array(N);
  readonly saluteMassima = new Float32Array(N);
  readonly stato = new Uint8Array(N);
  readonly tempo = new Float32Array(N); // secondi alla fine dello stato (comparsa, avviso, recupero, a terra)
  readonly dirX = new Float32Array(N); // direzione dell'attacco, decisa all'inizio dell'avviso
  readonly dirY = new Float32Array(N);
  private ricarica = new Float32Array(N); // Cantore: secondi prima di poter cantare
  private rinato = new Uint8Array(N); // Ricaduto: è già tornato in vita una volta
  private dentro = new Float32Array(N); // secondi al graffio l'ultima volta che il personaggio era nello spicchio
  private lampo = new Float32Array(N);
  private quiete = new Float32Array(N * FONTI); // secondi di Quiete rimasti, per nemico e per arma
  private fermo = new Float32Array(N); // fermo d'impatto: il nemico non fa niente
  private schiaccia = new Float32Array(N); // secondi di schiacciamento rimasti (solo disegno)
  /** LAB: il fermo d'impatto acceso o spento. */
  fermoImpatto = true;
  private colpo = new Float32Array(N); // il graffio appena scattato, da disegnare pieno per un attimo
  private versoSinistra = new Uint8Array(N);
  private sprite: Phaser.GameObjects.Sprite[] = [];
  grumi = 0;
  readonly gX = new Float32Array(MAX_GRUMI);
  readonly gY = new Float32Array(MAX_GRUMI);
  private gVX = new Float32Array(MAX_GRUMI);
  private gVY = new Float32Array(MAX_GRUMI);
  private gSfiorato = new Uint8Array(MAX_GRUMI);
  private gSprite: Phaser.GameObjects.Image[] = [];
  private aspetto: Aspetto[];
  private terra: Phaser.GameObjects.Graphics; // avvisi a terra (sotto i nemici)
  private sopra: Phaser.GameObjects.Graphics; // barre della salute e segno della rinascita
  private orologio = 0;
  schivate = 0; // schivate perfette da quando la scena le ha lette (le rimette a 0)
  uccisi = 0; // nemici morti per davvero (per il LAB e le prove)
  rinascite = 0; // Ricaduti tornati in vita
  /** LAB: forza la rinascita del Ricaduto (null = la probabilità normale). */
  rinascitaForzata: boolean | null = null;
  /** Il raggio del corpo del personaggio, per i colpi dei nemici. */
  readonly corpo: number = COMBATTIMENTO_STANZA.raggio;
  /** Schivata perfetta: li imposta la scena dalla Grazia del personaggio (le carte potranno migliorarli). */
  finestra: number = GRAZIA_STANZA.finestra;
  sfioro: number = GRAZIA_STANZA.sfioro;
  /** Il Cerchio di luce in corso: chi ci sta dentro cammina più lento (raggio 0 = nessun cerchio). */
  cerchioX = 0;
  cerchioY = 0;
  cerchioR = 0;
  cerchioLento = 0;

  constructor(
    private readonly scena: Phaser.Scene,
    private readonly caso: Caso,
    private readonly effetti: Effetti,
    private readonly impatto: Impatto,
  ) {
    this.aspetto = TIPI_STANZA.map((t) => {
      const chiave = NEMICI_STANZA[t].sprite;
      const dati = scena.cache.json.get(chiave) as { frames: { spriteSourceSize: { y: number; h: number }; sourceSize: { h: number } }[] };
      const fondo = Math.max(...dati.frames.map((f) => f.spriteSourceSize.y + f.spriteSourceSize.h));
      return { ingrandimento: ingrandimento(scena, chiave), piedi: fondo / dati.frames[0].sourceSize.h };
    });
    for (let i = 0; i < N; i++) this.sprite.push(scena.add.sprite(0, 0, R.sprite).setVisible(false));
    // il grumo: un tondo pieno di Lumen spento con il bordo scuro, disegnato una volta
    const r = C.grumo.raggio, chiave = 'stanze-grumo';
    if (!scena.textures.exists(chiave)) {
      const g = scena.add.graphics();
      g.fillStyle(colore(NEMICI_STANZA.colori.grumoBordo)).fillCircle(r + 1, r + 1, r + 1);
      g.fillStyle(colore(NEMICI_STANZA.colori.grumo)).fillCircle(r + 1, r + 1, r);
      g.fillStyle(colore(NEMICI_STANZA.colori.linea)).fillRect(r - 2, r - 3, 3, 2);
      g.generateTexture(chiave, 2 * r + 2, 2 * r + 2);
      g.destroy();
    }
    for (let i = 0; i < MAX_GRUMI; i++) this.gSprite.push(scena.add.image(0, 0, chiave).setDepth(PROFONDITA.sopra - 2).setVisible(false));
    this.terra = scena.add.graphics().setDepth(PROFONDITA.aTerra + 1);
    this.sopra = scena.add.graphics().setDepth(PROFONDITA.sopra - 1);
  }

  /** Un nemico nuovo in (x, y); con comparsa > 0 prima compare il segno a terra e il nemico arriva dopo. */
  aggiungi(t: TipoStanza, x: number, y: number, comparsa: number = ONDATA.comparsa): boolean {
    if (this.numero >= N) return false;
    const i = this.numero++, d = NEMICI_STANZA[t], a = areaCamminabile();
    this.tipo[i] = t === 'ricaduto' ? RICADUTO : CANTORE;
    this.x[i] = Phaser.Math.Clamp(x, a.x0, a.x1);
    this.y[i] = Phaser.Math.Clamp(y, a.y0, a.y1);
    this.salute[i] = this.saluteMassima[i] = d.salute;
    this.stato[i] = comparsa > 0 ? STATO.comparsa : STATO.cammina;
    this.tempo[i] = comparsa;
    this.ricarica[i] = C.primoCanto;
    this.rinato[i] = 0;
    this.lampo[i] = this.colpo[i] = this.fermo[i] = this.schiaccia[i] = 0;
    this.quiete.fill(0, i * FONTI, i * FONTI + FONTI);
    this.dirX[i] = 1;
    this.dirY[i] = 0;
    this.dentro[i] = Infinity;
    return true;
  }

  /** Un'ondata: ricaduti e cantori in punti a caso della stanza, lontani almeno ONDATA.distanzaMinima da (px, py). */
  ondata(px: number, py: number): void {
    const a = areaCamminabile();
    const metti = (t: TipoStanza): void => {
      let x = 0, y = 0;
      for (let k = 0; k < 30; k++) {
        x = a.x0 + this.caso.numero() * (a.x1 - a.x0);
        y = a.y0 + this.caso.numero() * (a.y1 - a.y0);
        if (Math.hypot(x - px, y - py) >= ONDATA.distanzaMinima) break;
      }
      this.aggiungi(t, x, y);
    };
    for (let k = 0; k < ONDATA.ricaduti; k++) metti('ricaduto');
    for (let k = 0; k < ONDATA.cantori; k++) metti('cantore');
  }

  /** Nemici ancora da battere (anche quelli che stanno comparendo o che sono a terra in attesa di rialzarsi). */
  vivi(): number {
    return this.numero;
  }

  svuota(): void {
    this.numero = 0;
    this.grumi = 0;
  }

  /**
   * Un passo di logica. (px, py): i piedi del personaggio. Restituisce il danno più forte che lo raggiunge in questo
   * passo (la scena decide se lo subisce: invulnerabilità, immortale). Conta le schivate perfette in «schivate».
   */
  aggiorna(dt: number, px: number, py: number): number {
    this.orologio += dt;
    let danno = 0;
    const a = areaCamminabile();
    for (let i = this.numero - 1; i >= 0; i--) {
      if (this.lampo[i] > 0) this.lampo[i] -= dt;
      for (let f = i * FONTI; f < i * FONTI + FONTI; f++) if (this.quiete[f] > 0) this.quiete[f] -= dt;
      if (this.schiaccia[i] > 0) this.schiaccia[i] -= dt;
      if (this.fermo[i] > 0) {
        this.fermo[i] -= dt; // fermo d'impatto: niente passi, niente avviso che scorre
        continue;
      }
      if (this.colpo[i] > 0) this.colpo[i] -= dt;
      const st = this.stato[i];
      const dx = px - this.x[i], dy = py - this.y[i], d = Math.hypot(dx, dy) || 1;
      if (st === STATO.comparsa) {
        if ((this.tempo[i] -= dt) <= 0) this.stato[i] = STATO.cammina;
        continue;
      }
      if (st === STATO.aTerra) {
        // a terra: allo scadere si tira la rinascita (nessun segno prima); se non esce, sparisce
        if ((this.tempo[i] -= dt) <= 0) {
          if (!this.rinato[i] && (this.rinascitaForzata ?? this.caso.numero() < R.rinascita.probabilita)) {
            this.rinato[i] = 1;
            this.stato[i] = STATO.cammina;
            this.salute[i] = this.saluteMassima[i] * R.rinascita.salute;
            this.rinascite++;
            suona('danno');
          } else this.sparisce(i);
        }
        continue;
      }
      // dentro il Cerchio di luce si cammina più lenti
      const passo = dt * (this.cerchioR > 0 && (this.x[i] - this.cerchioX) ** 2 + (this.y[i] - this.cerchioY) ** 2 <= this.cerchioR ** 2 ? 1 - this.cerchioLento : 1);
      if (st === STATO.recupero) {
        if ((this.tempo[i] -= dt) <= 0) this.stato[i] = STATO.cammina;
      } else if (st === STATO.avviso) {
        const prima = this.tempo[i];
        this.tempo[i] -= dt;
        if (this.tipo[i] === RICADUTO) {
          const dentro = this.nelGraffio(i, px, py);
          if (dentro) this.dentro[i] = prima;
          if (this.tempo[i] <= 0) {
            this.colpo[i] = NEMICI_STANZA.lampo * 1.2;
            if (dentro) danno = Math.max(danno, R.graffio.danno);
            else if (this.dentro[i] <= this.finestra) this.schivate++; // uscito dallo spicchio all'ultimo istante
            this.stato[i] = STATO.recupero;
            this.tempo[i] = R.recupero;
          }
        } else if (this.tempo[i] <= 0) {
          this.lancia(this.x[i] + this.dirX[i] * C.raggio, this.y[i] + this.dirY[i] * C.raggio, this.dirX[i], this.dirY[i]);
          this.stato[i] = STATO.recupero;
          this.tempo[i] = C.recupero;
          this.ricarica[i] = C.ricarica;
        }
      } else if (this.tipo[i] === RICADUTO) {
        // cammina dritto verso il personaggio; vicino si ferma e prepara il graffio
        if (d <= R.portata) this.iniziaAvviso(i, dx / d, dy / d, R.avviso);
        else this.muovi(i, (dx / d) * R.velocita * passo, (dy / d) * R.velocita * passo);
      } else {
        // resta tra la distanza minima e la massima; quando ha ricaricato e sei a portata, canta
        this.ricarica[i] -= dt;
        if (this.ricarica[i] <= 0 && d <= C.portata) this.iniziaAvviso(i, dx / d, dy / d, C.avviso);
        else if (d < C.distanza.minima) this.muovi(i, (-dx / d) * C.velocita * passo, (-dy / d) * C.velocita * passo);
        else if (d > C.distanza.massima) this.muovi(i, (dx / d) * C.velocita * passo, (dy / d) * C.velocita * passo);
      }
      if (this.stato[i] === STATO.cammina && Math.abs(dx) > 1) this.versoSinistra[i] = dx < 0 ? 1 : 0;
    }
    // i nemici non si sovrappongono tra loro (a coppie: sono pochi)
    for (let i = 0; i < this.numero; i++) {
      if (this.stato[i] === STATO.comparsa || this.stato[i] === STATO.aTerra) continue;
      for (let j = i + 1; j < this.numero; j++) {
        if (this.stato[j] === STATO.comparsa || this.stato[j] === STATO.aTerra) continue;
        const ri = NEMICI_STANZA[TIPI_STANZA[this.tipo[i]]].raggio, rj = NEMICI_STANZA[TIPI_STANZA[this.tipo[j]]].raggio;
        const dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i], d = Math.hypot(dx, dy), min = ri + rj;
        if (d >= min || d === 0) continue;
        const k = (min - d) / (2 * d);
        this.x[i] = Phaser.Math.Clamp(this.x[i] - dx * k, a.x0, a.x1);
        this.y[i] = Phaser.Math.Clamp(this.y[i] - dy * k, a.y0, a.y1);
        this.x[j] = Phaser.Math.Clamp(this.x[j] + dx * k, a.x0, a.x1);
        this.y[j] = Phaser.Math.Clamp(this.y[j] + dy * k, a.y0, a.y1);
      }
    }
    return Math.max(danno, this.aggiornaGrumi(dt, px, py));
  }

  /** Il personaggio in (px, py) è dentro lo spicchio del graffio del Ricaduto i? */
  private nelGraffio(i: number, px: number, py: number): boolean {
    const dx = px - this.x[i], dy = py - this.y[i], d = Math.hypot(dx, dy), r = R.graffio.raggio + this.corpo;
    if (d >= r) return false;
    if (d <= this.corpo) return true; // addosso: preso comunque
    const coseno = (dx * this.dirX[i] + dy * this.dirY[i]) / d;
    // l'angolo si allarga del corpo del personaggio, visto dalla distanza d
    return Math.acos(Phaser.Math.Clamp(coseno, -1, 1)) <= Phaser.Math.DegToRad(R.graffio.ampiezza / 2) + Math.asin(Math.min(1, this.corpo / d));
  }

  private iniziaAvviso(i: number, dx: number, dy: number, durata: number): void {
    this.stato[i] = STATO.avviso;
    this.tempo[i] = durata;
    this.dirX[i] = dx;
    this.dirY[i] = dy;
    this.dentro[i] = Infinity;
    if (Math.abs(dx) > 0.01) this.versoSinistra[i] = dx < 0 ? 1 : 0;
  }

  private muovi(i: number, dx: number, dy: number): void {
    const a = areaCamminabile();
    this.x[i] = Phaser.Math.Clamp(this.x[i] + dx, a.x0, a.x1);
    this.y[i] = Phaser.Math.Clamp(this.y[i] + dy, a.y0, a.y1);
  }

  private lancia(x: number, y: number, dx: number, dy: number): void {
    suona('sparo');
    if (this.grumi >= MAX_GRUMI) return;
    const k = this.grumi++;
    this.gX[k] = x;
    this.gY[k] = y;
    this.gVX[k] = dx * C.grumo.velocita;
    this.gVY[k] = dy * C.grumo.velocita;
    this.gSfiorato[k] = 0;
  }

  /** I grumi volano dritti; contro il muro si fermano (spariscono con uno sbuffo). */
  private aggiornaGrumi(dt: number, px: number, py: number): number {
    let danno = 0;
    const r = C.grumo.raggio + this.corpo, vicino = r + this.sfioro;
    for (let k = this.grumi - 1; k >= 0; k--) {
      this.gX[k] += this.gVX[k] * dt;
      this.gY[k] += this.gVY[k] * dt;
      const x = this.gX[k], y = this.gY[k];
      if (x < 0 || x > STANZA.larghezza || y < 0 || y > STANZA.altezza) {
        this.effetti.scoppio(Phaser.Math.Clamp(x, 0, STANZA.larghezza), Phaser.Math.Clamp(y, 0, STANZA.altezza) - C.grumo.altezza);
        this.togliGrumo(k);
        continue;
      }
      const d2 = (x - px) ** 2 + (y - py) ** 2;
      if (d2 < r * r) {
        danno = Math.max(danno, C.grumo.danno);
        this.effetti.scoppio(x, y - C.grumo.altezza);
        this.togliGrumo(k);
        continue;
      }
      if (d2 < vicino * vicino) this.gSfiorato[k] = 1;
      else if (this.gSfiorato[k] === 1) {
        this.gSfiorato[k] = 2; // ti è passato vicino senza toccarti: schivata perfetta, una volta sola
        this.schivate++;
      }
    }
    return danno;
  }

  private togliGrumo(k: number): void {
    const u = --this.grumi;
    this.gX[k] = this.gX[u];
    this.gY[k] = this.gY[u];
    this.gVX[k] = this.gVX[u];
    this.gVY[k] = this.gVY[u];
    this.gSfiorato[k] = this.gSfiorato[u];
  }

  /**
   * Il colpo della Lanterna: un arco di raggio «raggio» e «ampiezza» gradi da (ox, oy) verso «angolo».
   * Ferisce ogni nemico dentro, se non è in Quiete per la Lanterna (a terra non si colpisce). Restituisce quanti nemici ha preso.
   */
  colpisci(ox: number, oy: number, angolo: number, raggio: number, ampiezza: number, danno: number): number {
    let presi = 0;
    const mezza = Phaser.Math.DegToRad(ampiezza / 2);
    for (let i = this.numero - 1; i >= 0; i--) {
      if (this.stato[i] === STATO.comparsa || this.stato[i] === STATO.aTerra) continue;
      const rn = NEMICI_STANZA[TIPI_STANZA[this.tipo[i]]].raggio;
      const dx = this.x[i] - ox, dy = this.y[i] - oy, d = Math.hypot(dx, dy);
      if (d > raggio + rn) continue;
      if (d > rn && Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - angolo)) > mezza + Math.asin(Math.min(1, rn / d))) continue;
      const esito = this.ferisci(i, danno, FONTE.lanterna);
      if (esito === FERITO.no) continue;
      presi++;
      // ancora in piedi: impatto (fermo, schiacciamento, scintille verso dove va il colpo) e spinta, tranne durante l'avviso
      if (esito !== FERITO.inPiedi) continue; // battuto: le scintille grandi le fa muore()
      if (this.fermoImpatto) this.fermo[i] = IMPATTO.fermo;
      this.schiaccia[i] = IMPATTO.schiaccia.durata;
      const sx = d > 0 ? dx / d : Math.cos(angolo), sy = d > 0 ? dy / d : Math.sin(angolo);
      this.impatto.scintille(this.x[i], this.y[i] - this.testa(i) / 2, sx, sy, IMPATTO.scintille.colpo);
      if (this.stato[i] !== STATO.avviso && d > 0) this.muovi(i, sx * NEMICI_STANZA.spinta, sy * NEMICI_STANZA.spinta);
    }
    return presi;
  }

  /** Ferisce ogni nemico entro r da (x, y) con l'arma «fonte» (il Cerchio di luce). Restituisce quanti ne ha presi. */
  colpisciCerchio(x: number, y: number, r: number, danno: number, fonte: number): number {
    let presi = 0;
    for (let i = this.numero - 1; i >= 0; i--) {
      if (this.stato[i] === STATO.comparsa || this.stato[i] === STATO.aTerra) continue;
      const rn = NEMICI_STANZA[TIPI_STANZA[this.tipo[i]]].raggio;
      if ((this.x[i] - x) ** 2 + (this.y[i] - y) ** 2 > (r + rn) ** 2) continue;
      if (this.ferisci(i, danno, fonte) !== FERITO.no) presi++;
    }
    return presi;
  }

  /**
   * Un colpo dell'arma «fonte» sul nemico i: niente se è in Quiete per quell'arma. Dice com'è andata: non ferito, ferito
   * e ancora in piedi, oppure battuto (attenzione: un nemico battuto può essere già tolto, e al posto i c'è un altro).
   */
  private ferisci(i: number, danno: number, fonte: number): number {
    const q = i * FONTI + fonte;
    if (this.quiete[q] > 0) return FERITO.no;
    this.quiete[q] = NEMICI_STANZA.quiete;
    this.salute[i] -= danno;
    this.lampo[i] = NEMICI_STANZA.lampo;
    this.effetti.numero(this.x[i], this.y[i] - this.testa(i), danno, false);
    if (this.salute[i] > 0) return FERITO.inPiedi;
    this.muore(i);
    return FERITO.battuto;
  }

  /** Un nemico finisce la salute: il Ricaduto resta a terra (poi forse si rialza); il Cantore sparisce. */
  private muore(i: number): void {
    if (this.tipo[i] === RICADUTO) {
      this.stato[i] = STATO.aTerra;
      this.tempo[i] = R.rinascita.attesa;
      this.salute[i] = 0;
      this.lampo[i] = 0;
      this.impatto.scintille(this.x[i], this.y[i] - this.testa(i) / 2, 0, -1, IMPATTO.scintille.battuto);
      return;
    }
    this.sparisce(i);
  }

  /** Battuto per davvero: uno scoppio e via. */
  private sparisce(i: number): void {
    this.impatto.scintille(this.x[i], this.y[i] - this.testa(i) / 2, 0, -1, IMPATTO.scintille.battuto);
    this.effetti.scoppio(this.x[i], this.y[i] - this.testa(i) / 2);
    this.uccisi++;
    this.togli(i);
  }

  private togli(i: number): void {
    const u = --this.numero;
    this.tipo[i] = this.tipo[u];
    this.x[i] = this.x[u];
    this.y[i] = this.y[u];
    this.salute[i] = this.salute[u];
    this.saluteMassima[i] = this.saluteMassima[u];
    this.stato[i] = this.stato[u];
    this.tempo[i] = this.tempo[u];
    this.dirX[i] = this.dirX[u];
    this.dirY[i] = this.dirY[u];
    this.ricarica[i] = this.ricarica[u];
    this.rinato[i] = this.rinato[u];
    this.dentro[i] = this.dentro[u];
    this.lampo[i] = this.lampo[u];
    this.quiete.copyWithin(i * FONTI, u * FONTI, u * FONTI + FONTI);
    this.fermo[i] = this.fermo[u];
    this.schiaccia[i] = this.schiaccia[u];
    this.colpo[i] = this.colpo[u];
    this.versoSinistra[i] = this.versoSinistra[u];
  }

  /** Il nemico più vicino a (x, y) entro «massimo» px, escluso chi sta comparendo o è a terra; -1 se non c'è. */
  vicino(x: number, y: number, massimo: number): number {
    let migliore = -1, d2min = massimo * massimo;
    for (let i = 0; i < this.numero; i++) {
      if (this.stato[i] === STATO.comparsa || this.stato[i] === STATO.aTerra) continue;
      const d2 = (this.x[i] - x) ** 2 + (this.y[i] - y) ** 2;
      if (d2 <= d2min) {
        d2min = d2;
        migliore = i;
      }
    }
    return migliore;
  }

  /** Altezza dello sprite dai piedi alla testa, in pixel di gioco. */
  private testa(i: number): number {
    return this.sprite[i].displayHeight * this.aspetto[this.tipo[i]].piedi;
  }

  /** Disegno: sprite, avvisi a terra, grumi, barre della salute dei feriti e segno della rinascita. */
  disegna(): void {
    const t = this.terra.clear(), s = this.sopra.clear(), col = NEMICI_STANZA.colori, B = NEMICI_STANZA.barra;
    for (let i = 0; i < this.numero; i++) {
      const sp = this.sprite[i], tipo = TIPI_STANZA[this.tipo[i]], a = this.aspetto[this.tipo[i]], st = this.stato[i];
      const x = Math.round(this.x[i]), y = Math.round(this.y[i]);
      if (st === STATO.comparsa) {
        // il segno a terra dove sta per comparire: un anello che si stringe
        const r = Math.max(4, Math.round(6 + 14 * (this.tempo[i] / ONDATA.comparsa)));
        t.lineStyle(2, colore(col.bordo), 1).strokeEllipse(x, y, 2 * r, r);
        t.fillStyle(colore(col.comparsa)).fillEllipse(x, y, r, Math.max(2, Math.round(r / 2)));
        sp.setVisible(false);
        continue;
      }
      const chiave = NEMICI_STANZA[tipo].sprite;
      const anim = `${chiave}:walk`;
      if (sp.texture.key !== chiave) sp.setTexture(chiave);
      // schiacciamento: largo e basso subito dopo il colpo, poi torna come prima
      const k = Math.max(0, this.schiaccia[i]) / IMPATTO.schiaccia.durata, S = IMPATTO.schiaccia;
      sp.setOrigin(0.5, a.piedi).setScale(a.ingrandimento * (1 + (S.largo - 1) * k), a.ingrandimento * (1 + (S.basso - 1) * k)).setVisible(true).setDepth(PROFONDITA.aTerra + 10 + y);
      const fermo = st !== STATO.cammina || this.fermo[i] > 0;
      if (this.scena.anims.exists(anim)) {
        sp.play(anim, true);
        if (fermo) sp.anims.pause();
        else sp.anims.resume();
      }
      let ox = 0, oy = 0;
      if (st === STATO.avviso) {
        // l'avviso: il nemico trema e si solleva un poco (segnaposto dell'animazione «attack»)
        ox = Math.floor(this.orologio * 30) % 2 === 0 ? -1 : 1;
        oy = -2;
      }
      sp.setPosition(x + ox, y + oy).setFlipX(this.versoSinistra[i] === 1);
      sp.setAngle(st === STATO.aTerra ? (this.versoSinistra[i] ? 90 : -90) : 0);
      if (this.lampo[i] > 0) sp.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (st === STATO.aTerra) sp.setTint(0x5a4a4a).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (st === STATO.avviso && Math.floor(this.orologio * 12) % 2 === 0) sp.setTint(colore(col.bordo)).setTintMode(Phaser.TintModes.ADD);
      else sp.clearTint();
      if (st === STATO.avviso || this.colpo[i] > 0) this.disegnaAvviso(t, i, x, y);
      if (st !== STATO.aTerra && this.salute[i] < this.saluteMassima[i]) {
        const z = a.ingrandimento, L = B.larghezza * z, H = B.altezza * z, bx = x - Math.floor(L / 2), by = y + B.distanza;
        const pieno = Math.round((B.larghezza - 2) * Math.max(0, this.salute[i] / this.saluteMassima[i])) * z;
        s.fillStyle(0x120606).fillRect(bx, by, L, H);
        s.fillStyle(0x3a0c10).fillRect(bx + z, by + z, L - 2 * z, H - 2 * z);
        s.fillStyle(0xc0262d).fillRect(bx + z, by + z, pieno, H - 2 * z);
      }
    }
    for (let i = this.numero; i < N; i++) this.sprite[i].setVisible(false);
    for (let k = 0; k < this.grumi; k++) {
      const x = Math.round(this.gX[k]), y = Math.round(this.gY[k]);
      t.fillStyle(0x000000).fillEllipse(x, y, 2 * C.grumo.raggio, C.grumo.raggio); // ombra a terra
      this.gSprite[k].setPosition(x, y - C.grumo.altezza).setVisible(true);
    }
    for (let k = this.grumi; k < MAX_GRUMI; k++) this.gSprite[k].setVisible(false);
  }

  /** Avviso a terra: lo spicchio del graffio che si riempie, o la linea del canto fino al muro. */
  private disegnaAvviso(g: Phaser.GameObjects.Graphics, i: number, x: number, y: number): void {
    const col = NEMICI_STANZA.colori, a = Math.atan2(this.dirY[i], this.dirX[i]);
    if (this.tipo[i] === RICADUTO) {
      const mezza = Phaser.Math.DegToRad(R.graffio.ampiezza / 2), r = R.graffio.raggio;
      const pieno = this.colpo[i] > 0 ? 1 : 1 - Math.max(0, this.tempo[i]) / R.avviso;
      g.fillStyle(colore(this.colpo[i] > 0 ? col.graffio : col.avviso));
      g.slice(x, y, Math.max(2, Math.round(r * pieno)), a - mezza, a + mezza, false).fillPath();
      g.lineStyle(2, colore(col.bordo), 1);
      g.slice(x, y, r, a - mezza, a + mezza, false).strokePath();
      return;
    }
    // la linea del Cantore: dal Cantore al muro, nella direzione del grumo; lampeggia, poi resta accesa nell'ultimo terzo
    if (this.colpo[i] > 0) return;
    const acceso = this.tempo[i] <= C.avviso / 3 || Math.floor(this.orologio * 8) % 2 === 0;
    if (!acceso) return;
    const lung = this.finoAlMuro(x, y, this.dirX[i], this.dirY[i]);
    g.lineStyle(2, colore(col.linea), 1).lineBetween(x, y, Math.round(x + Math.cos(a) * lung), Math.round(y + Math.sin(a) * lung));
    // il grumo che si forma davanti al Cantore
    const r = Math.max(2, Math.round(C.grumo.raggio * (1 - Math.max(0, this.tempo[i]) / C.avviso)));
    g.fillStyle(colore(col.grumo)).fillCircle(Math.round(x + this.dirX[i] * C.raggio), Math.round(y + this.dirY[i] * C.raggio) - C.grumo.altezza, r);
  }

  /** Distanza da (x, y) al bordo del pavimento andando in direzione (dx, dy). */
  private finoAlMuro(x: number, y: number, dx: number, dy: number): number {
    let t = Infinity;
    if (dx > 0) t = Math.min(t, (STANZA.larghezza - x) / dx);
    else if (dx < 0) t = Math.min(t, -x / dx);
    if (dy > 0) t = Math.min(t, (STANZA.altezza - y) / dy);
    else if (dy < 0) t = Math.min(t, -y / dy);
    return Number.isFinite(t) ? t : 0;
  }
}
