/*
 * Nemici del gioco a stanze: il Ricaduto e il Cantore, e i grumi di Lumen spento del Cantore, che ti cercano per un attimo
 * e contro il muro, o su di te, scoppiano in una pozza di cera che ferisce chi ci passa sopra.
 * I nemici vivono nella Orda del survivor (src/sistema/orda.ts), così gli Echi, gli stati e le reazioni li toccano come
 * nel survivor; qui c'è il loro «cervello»: comparsa, camminata, avviso, attacco, a terra. Ogni attacco ha un avviso a terra
 * (lo spicchio rosso del graffio che si riempie, la linea arancione del canto) e lascia spazio alla schivata perfetta, che
 * dà la Grazia: uscire dallo spicchio all'ultimo istante, farsi sfiorare da un grumo.
 * Quiete: dopo un colpo, per un attimo la stessa arma a mano (Lanterna, Cerchio di luce) non ferisce più quel nemico.
 * Il Ricaduto battuto resta sempre a terra un attimo, intoccabile; poi a volte si rialza (una volta sola).
 * Animazioni (dal 14/11, se lo sprite ha i tag): l'avviso è la prima metà di «attack», stirata sulla durata dell'avviso, così
 * il colpo cade nell'istante del danno; la seconda metà scorre nel recupero. Battuto, «death»; il Ricaduto che si rialza la
 * fa al contrario; il Cantore la fa e poi sparisce. Senza i tag: tremolio, steso e scuro, come prima.
 * Impatto della Lanterna: il nemico colpito diventa bianco, si ferma un attimo (fermo d'impatto), si schiaccia e sprizza
 * scintille (il bianco è quello del survivor, ma dura NEMICI_STANZA.lampo: abbastanza da vederlo).
 * Chi è sepolto, interrato o fermato da uno stato non fa niente, nemmeno l'avviso: il suo attacco aspetta.
 * Tutto in array preparati all'inizio (niente allocazioni nel ciclo di gioco); la logica è separata dal disegno.
 * Posizioni ai piedi, in pixel di gioco. Numeri in NEMICI_STANZA e ONDATA (src/data/stanze.ts).
 */
import Phaser from 'phaser';
import { COMBATTIMENTO_STANZA, GRAZIA_STANZA, IMPATTO, NEMICI_STANZA, ONDATA, STANZA } from '../data/stanze';
import { PROFONDITA, type Effetti } from './effetti';
import { areaCamminabile } from './stanza';
import type { Caso } from './caso';
import type { Impatto } from './impatto';
import { suona } from './audio';
import { CAPIENZA, ID_CANTORE, ID_RICADUTO, Orda } from './orda';
import { Minacce } from './minacce';

export const TIPI_STANZA = ['ricaduto', 'cantore'] as const;
export type TipoStanza = (typeof TIPI_STANZA)[number];

/** Cosa sta facendo un nemico. */
export const STATO = { cammina: 1, avviso: 2, recupero: 3, aTerra: 4 } as const;

/** Le armi a mano, ognuna con la sua Quiete. */
export const FONTE = { lanterna: 0, abilita: 1 } as const;

const MAX_COMPARSE = ONDATA.massimo;
const MAX_GRUMI = 16;
const MAX_POZZE = 16;
const P = NEMICI_STANZA.pozza;
const R = NEMICI_STANZA.ricaduto;
const C = NEMICI_STANZA.cantore;
const colore = (h: string): number => parseInt(h.slice(1), 16);

export class NemiciStanza {
  /** La Orda che tiene i nemici: la usano anche le armi automatiche. */
  readonly orda: Orda;
  // dati propri del gioco a stanze, uno per posto della Orda: seguono i nemici quando cambiano posto (registraCampi)
  readonly stato = new Uint8Array(CAPIENZA);
  readonly tempo = new Float32Array(CAPIENZA); // secondi alla fine dello stato (avviso, recupero, a terra)
  readonly dirX = new Float32Array(CAPIENZA); // direzione dell'attacco, decisa all'inizio dell'avviso
  readonly dirY = new Float32Array(CAPIENZA);
  private ricarica = new Float32Array(CAPIENZA); // Cantore: secondi prima di poter cantare
  private rinato = new Uint8Array(CAPIENZA); // Ricaduto: è già tornato in vita una volta
  private dentro = new Float32Array(CAPIENZA); // secondi al graffio l'ultima volta che il personaggio era nello spicchio
  private colpo = new Float32Array(CAPIENZA); // il graffio appena scattato, da disegnare pieno per un attimo
  private quieteLanterna = new Float32Array(CAPIENZA);
  private quieteAbilita = new Float32Array(CAPIENZA);
  private fermo = new Float32Array(CAPIENZA); // fermo d'impatto: il nemico non fa niente
  private schiaccia = new Float32Array(CAPIENZA); // secondi di schiacciamento rimasti (solo disegno)
  private bianco = new Float32Array(CAPIENZA); // secondi in cui resta bianco dopo un colpo della Lanterna
  private verso = new Uint8Array(CAPIENZA); // 1 = guarda a sinistra
  private rialza = new Float32Array(CAPIENZA); // secondi di «death» al contrario rimasti (il Ricaduto che si rialza)
  // fotogrammi e durate (secondi) di attack e death per tipo, presi dalle animazioni dello sprite (null se mancano)
  private readonly mosse: ({ attacco: Mossa | null; morte: Mossa | null })[] = [];
  private fermi = new Uint8Array(CAPIENZA); // fermo per uno stato (lo scrive la Orda)
  // comparse: il segno a terra dove sta per arrivare un nemico (non è ancora nella Orda: le armi non lo toccano)
  comparse = 0;
  private cTipo = new Uint8Array(MAX_COMPARSE);
  private cX = new Float32Array(MAX_COMPARSE);
  private cY = new Float32Array(MAX_COMPARSE);
  private cTempo = new Float32Array(MAX_COMPARSE);
  grumi = 0;
  readonly gX = new Float32Array(MAX_GRUMI);
  readonly gY = new Float32Array(MAX_GRUMI);
  private gVX = new Float32Array(MAX_GRUMI);
  private gVY = new Float32Array(MAX_GRUMI);
  private gSfiorato = new Uint8Array(MAX_GRUMI);
  private gVita = new Float32Array(MAX_GRUMI); // secondi da quando è partito (cerca solo all'inizio)
  // dove si disegna appena sputato, rispetto al punto a terra: scostamento in orizzontale e altezza (la bocca del Cantore)
  private gBX = new Float32Array(MAX_GRUMI);
  private gBH = new Float32Array(MAX_GRUMI);
  // pozze di cera a terra: dove, e quanti secondi restano
  pozze = 0;
  readonly pX = new Float32Array(MAX_POZZE);
  readonly pY = new Float32Array(MAX_POZZE);
  private pTempo = new Float32Array(MAX_POZZE);
  private gSprite: Phaser.GameObjects.Image[] = [];
  private pSprite: Phaser.GameObjects.Image[] = []; // le pozze di cera (effetto pixelfx), se il foglio c'è
  private pFotogrammi = 0;
  private terra: Phaser.GameObjects.Graphics; // avvisi e comparse a terra (sotto i nemici)
  private sopra: Phaser.GameObjects.Graphics; // barre della salute
  private orologio = 0;
  schivate = 0; // schivate perfette da quando la scena le ha lette (le rimette a 0)
  uccisi = 0; // nemici battuti per davvero (per il LAB e le prove)
  rinascite = 0; // Ricaduti tornati in vita
  /** LAB: forza la rinascita del Ricaduto (null = la probabilità normale). */
  rinascitaForzata: boolean | null = null;
  /** LAB: il fermo d'impatto acceso o spento. */
  fermoImpatto = true;
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
  /** Il colpo di un'arma a mano sul nemico j: lo dà l'arsenale (danno con i bonus, stato, reazioni, numero). */
  colpoArma: (j: number, danno: number, dx: number, dy: number, fonte: number) => void = () => {};

  constructor(
    scena: Phaser.Scene,
    private readonly caso: Caso,
    private readonly effetti: Effetti,
    private readonly impatto: Impatto,
  ) {
    this.orda = new Orda(scena, caso, new Minacce(scena));
    this.orda.registraCampi(this.stato, this.tempo, this.dirX, this.dirY, this.ricarica, this.rinato, this.dentro, this.colpo,
      this.quieteLanterna, this.quieteAbilita, this.fermo, this.schiaccia, this.verso, this.bianco, this.rialza);
    for (const sprite of [R.sprite, C.sprite]) this.mosse.push({ attacco: mossa(scena, `${sprite}:attack`), morte: mossa(scena, `${sprite}:death`) });
    // il grumo: un tondo pieno di Lumen spento con il bordo scuro, disegnato una volta
    const r = C.grumo.raggio, chiave = 'stanze-grumo';
    if (!scena.textures.exists(chiave)) {
      const g = scena.add.graphics();
      g.fillStyle(colore(NEMICI_STANZA.colori.grumoBordo)).fillCircle(r + 1, r + 1, r + 1);
      g.fillStyle(colore(NEMICI_STANZA.colori.grumo)).fillCircle(r + 1, r + 1, r);
      g.fillStyle(0x9fb8c8).fillRect(r - 2, r - 3, 3, 2);
      g.generateTexture(chiave, 2 * r + 2, 2 * r + 2);
      g.destroy();
    }
    // grumo e pozza di cera: l'effetto pixelfx se il foglio c'è, se no il tondo disegnato qui sopra e l'ellisse del codice
    const E = NEMICI_STANZA.effetti, conFoglio = (k: string): boolean => scena.textures.exists(k);
    const grumo = conFoglio(E.grumo) ? E.grumo : chiave;
    for (let i = 0; i < MAX_GRUMI; i++) {
      const im = scena.add.image(0, 0, grumo, grumo === chiave ? undefined : '0').setDepth(PROFONDITA.sopra - 2).setVisible(false);
      if (grumo !== chiave) im.setOrigin(E.pernoGrumo[0] / im.width, E.pernoGrumo[1] / im.height);
      this.gSprite.push(im);
    }
    if (conFoglio(E.pozza)) {
      this.pFotogrammi = scena.textures.get(E.pozza).frameTotal - 1; // senza il fotogramma __BASE
      for (let i = 0; i < MAX_POZZE; i++) {
        const im = scena.add.image(0, 0, E.pozza, '0').setDepth(PROFONDITA.aTerra + 0.5).setVisible(false);
        this.pSprite.push(im.setOrigin(E.pernoPozza[0] / im.width, E.pernoPozza[1] / im.height));
      }
    }
    this.terra = scena.add.graphics().setDepth(PROFONDITA.aTerra + 1);
    this.sopra = scena.add.graphics().setDepth(PROFONDITA.sopra - 1);
  }

  /** Nemici in campo (nella Orda). */
  get numero(): number {
    return this.orda.numero;
  }

  get x(): Float32Array {
    return this.orda.x;
  }

  get y(): Float32Array {
    return this.orda.y;
  }

  /** Un nemico nuovo in (x, y); con comparsa > 0 prima compare il segno a terra e il nemico arriva dopo. */
  aggiungi(t: TipoStanza, x: number, y: number, comparsa: number = ONDATA.comparsa): boolean {
    if (this.vivi() >= ONDATA.massimo) return false;
    const a = areaCamminabile(), px = Phaser.Math.Clamp(x, a.x0, a.x1), py = Phaser.Math.Clamp(y, a.y0, a.y1);
    const k = t === 'ricaduto' ? 0 : 1;
    if (comparsa > 0) {
      const c = this.comparse++;
      this.cTipo[c] = k;
      this.cX[c] = px;
      this.cY[c] = py;
      this.cTempo[c] = comparsa;
    } else this.nasce(k, px, py);
    return true;
  }

  /** Il nemico entra davvero nella Orda. */
  private nasce(k: number, x: number, y: number): void {
    const i = this.orda.nasciStanza(k === 0 ? ID_RICADUTO : ID_CANTORE, x, y, k === 0 ? R.salute : C.salute);
    this.stato[i] = STATO.cammina;
    this.tempo[i] = this.colpo[i] = this.fermo[i] = this.schiaccia[i] = this.bianco[i] = this.quieteLanterna[i] = this.quieteAbilita[i] = 0;
    this.ricarica[i] = C.primoCanto;
    this.rinato[i] = this.verso[i] = 0;
    this.rialza[i] = 0;
    this.dirX[i] = 1;
    this.dirY[i] = 0;
    this.dentro[i] = Infinity;
  }

  /** Un'ondata: «ricaduti» e «cantori» in punti a caso della stanza, lontani almeno ONDATA.distanzaMinima da (px, py). */
  ondata(px: number, py: number, ricaduti: number = ONDATA.ricaduti, cantori: number = ONDATA.cantori): void {
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
    for (let k = 0; k < ricaduti; k++) metti('ricaduto');
    for (let k = 0; k < cantori; k++) metti('cantore');
  }

  /** Nemici ancora da battere: in campo (anche a terra in attesa di rialzarsi) e in arrivo. */
  vivi(): number {
    return this.orda.numero + this.comparse;
  }

  svuota(): void {
    while (this.orda.numero > 0) this.orda.togliStanza(this.orda.numero - 1);
    this.comparse = 0;
    this.grumi = 0;
    this.pozze = 0;
  }

  /**
   * Un passo di logica. (px, py): i piedi del personaggio; mezzaL e mezzaA metà del campo visibile. Restituisce il danno
   * più forte che lo raggiunge in questo passo (la scena decide se lo subisce). Conta le schivate perfette in «schivate».
   */
  aggiorna(dt: number, px: number, py: number, mezzaL: number, mezzaA: number): number {
    this.orologio += dt;
    for (let c = this.comparse - 1; c >= 0; c--) {
      if ((this.cTempo[c] -= dt) > 0) continue;
      this.nasce(this.cTipo[c], this.cX[c], this.cY[c]);
      const u = --this.comparse;
      this.cTipo[c] = this.cTipo[u];
      this.cX[c] = this.cX[u];
      this.cY[c] = this.cY[u];
      this.cTempo[c] = this.cTempo[u];
    }
    const o = this.orda;
    o.aggiornaStanza(dt, px, py, mezzaL, mezzaA, this.fermi);
    let danno = 0;
    for (let i = o.numero - 1; i >= 0; i--) {
      if (this.colpo[i] > 0) this.colpo[i] -= dt;
      if (this.rialza[i] > 0) this.rialza[i] -= dt;
      if (this.quieteLanterna[i] > 0) this.quieteLanterna[i] -= dt;
      if (this.quieteAbilita[i] > 0) this.quieteAbilita[i] -= dt;
      if (this.schiaccia[i] > 0) this.schiaccia[i] -= dt;
      if (this.bianco[i] > 0) this.bianco[i] -= dt;
      const ricaduto = o.tipo[i] === ID_RICADUTO;
      // salute finita (Lanterna, Echi, maledizione, reazioni): il Ricaduto va a terra, il Cantore sparisce
      if (o.salute[i] <= 0 && this.stato[i] !== STATO.aTerra) {
        const morte = this.mosse[ricaduto ? 0 : 1].morte;
        if (ricaduto) this.aTerra(i);
        else if (morte) {
          // il Cantore fa la sua animazione a terra, intoccabile, e poi sparisce (non si rialza)
          this.aTerra(i);
          this.rinato[i] = 1;
          this.tempo[i] = morte.totale;
        } else this.sparisce(i);
        continue;
      }
      if (this.stato[i] === STATO.aTerra) {
        // allo scadere si tira la rinascita (nessun segno prima); se non esce, sparisce
        if ((this.tempo[i] -= dt) <= 0) {
          if (!this.rinato[i] && (this.rinascitaForzata ?? this.caso.numero() < R.rinascita.probabilita)) {
            this.rinato[i] = 1;
            this.stato[i] = STATO.cammina;
            // si rialza: la morte al contrario, fermo finché non è in piedi
            const m = this.mosse[0].morte;
            if (m) this.fermo[i] = this.rialza[i] = m.totale - m.durate[m.durate.length - 1];
            o.salute[i] = o.saluteMassima[i] * R.rinascita.salute;
            this.rinascite++;
            suona('danno');
          } else this.sparisce(i);
        }
        continue;
      }
      if (this.fermo[i] > 0) {
        this.fermo[i] -= dt; // fermo d'impatto: niente passi, niente avviso che scorre
        continue;
      }
      if (this.fermi[i]) continue; // sepolto, interrato o fermato: anche l'attacco aspetta
      // dentro il Cerchio di luce, rallentamenti e Consacrato: si cammina più lenti
      const dentroCerchio = this.cerchioR > 0 && (o.x[i] - this.cerchioX) ** 2 + (o.y[i] - this.cerchioY) ** 2 <= this.cerchioR ** 2;
      const passo = dt * o.fattoreVelocita(i, false) * (dentroCerchio ? 1 - this.cerchioLento : 1);
      const dx = px - o.x[i], dy = py - o.y[i], d = Math.hypot(dx, dy) || 1;
      const st = this.stato[i];
      if (st === STATO.recupero) {
        if ((this.tempo[i] -= dt) <= 0) this.stato[i] = STATO.cammina;
      } else if (st === STATO.avviso) {
        const prima = this.tempo[i];
        this.tempo[i] -= dt;
        if (ricaduto) {
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
          const sx = o.x[i] + this.dirX[i] * C.raggio, lato = this.verso[i] ? -1 : 1;
          this.lancia(sx, o.y[i] + this.dirY[i] * C.raggio, this.dirX[i], this.dirY[i], o.x[i] + lato * C.bocca.lancio[0] - sx, C.bocca.lancio[1]);
          this.stato[i] = STATO.recupero;
          this.tempo[i] = C.recupero;
          this.ricarica[i] = C.ricarica;
        }
      } else if (ricaduto) {
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
      if (this.stato[i] === STATO.cammina && Math.abs(dx) > 1) this.verso[i] = dx < 0 ? 1 : 0;
    }
    // i muri: dopo spinte e separazione della Orda, tutti dentro il pavimento
    const a = areaCamminabile();
    for (let i = 0; i < o.numero; i++) {
      o.x[i] = Phaser.Math.Clamp(o.x[i], a.x0, a.x1);
      o.y[i] = Phaser.Math.Clamp(o.y[i], a.y0, a.y1);
    }
    return Math.max(danno, this.aggiornaGrumi(dt, px, py));
  }

  /** Il personaggio in (px, py) è dentro lo spicchio del graffio del Ricaduto i? */
  private nelGraffio(i: number, px: number, py: number): boolean {
    const dx = px - this.orda.x[i], dy = py - this.orda.y[i], d = Math.hypot(dx, dy), r = R.graffio.raggio + this.corpo;
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
    if (Math.abs(dx) > 0.01) this.verso[i] = dx < 0 ? 1 : 0;
  }

  private muovi(i: number, dx: number, dy: number): void {
    this.orda.x[i] += dx;
    this.orda.y[i] += dy;
  }

  /** Il Ricaduto battuto resta a terra, steso e scuro, intoccabile (salute a zero: le armi lo ignorano). */
  private aTerra(i: number): void {
    const o = this.orda;
    this.stato[i] = STATO.aTerra;
    this.tempo[i] = R.rinascita.attesa;
    o.salute[i] = 0;
    this.fermo[i] = 0;
    this.impatto.scintille(o.x[i], o.y[i] - o.altezza(i) / 2, 0, -1, IMPATTO.scintille.battuto);
  }

  /** Battuto per davvero: scintille, uno scoppio e via. */
  private sparisce(i: number): void {
    const o = this.orda;
    this.impatto.scintille(o.x[i], o.y[i] - o.altezza(i) / 2, 0, -1, IMPATTO.scintille.battuto);
    this.effetti.scoppio(o.x[i], o.y[i] - o.altezza(i) / 2);
    this.uccisi++;
    o.togliStanza(i);
  }

  /** Un grumo parte da (x, y) a terra in direzione (dx, dy); si disegna dalla bocca (bx px di lato, bh in alto) e scende. */
  private lancia(x: number, y: number, dx: number, dy: number, bx: number, bh: number): void {
    suona('sparo');
    if (this.grumi >= MAX_GRUMI) return;
    const k = this.grumi++;
    this.gX[k] = x;
    this.gY[k] = y;
    this.gVX[k] = dx * C.grumo.velocita;
    this.gVY[k] = dy * C.grumo.velocita;
    this.gSfiorato[k] = 0;
    this.gVita[k] = 0;
    this.gBX[k] = bx;
    this.gBH[k] = bh;
  }

  /**
   * I grumi ti cercano per C.grumo.ricerca secondi, girando di al massimo C.grumo.virata gradi al secondo (così una
   * curva stretta li semina), poi vanno dritti; contro il muro o su di te scoppiano in una pozza di cera. Le pozze feriscono chi ci sta
   * sopra (il danno segue la Quiete del personaggio) e negli ultimi istanti si restringono.
   */
  private aggiornaGrumi(dt: number, px: number, py: number): number {
    let danno = 0;
    const r = C.grumo.raggio + this.corpo, vicino = r + this.sfioro;
    const giro = Phaser.Math.DegToRad(C.grumo.virata) * dt;
    for (let k = this.grumi - 1; k >= 0; k--) {
      this.gVita[k] += dt;
      if (this.gVita[k] <= C.grumo.ricerca) {
        const ora = Math.atan2(this.gVY[k], this.gVX[k]), voluto = Math.atan2(py - this.gY[k], px - this.gX[k]);
        const nuovo = ora + Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(voluto - ora), -giro, giro);
        this.gVX[k] = Math.cos(nuovo) * C.grumo.velocita;
        this.gVY[k] = Math.sin(nuovo) * C.grumo.velocita;
      }
      this.gX[k] += this.gVX[k] * dt;
      this.gY[k] += this.gVY[k] * dt;
      const x = this.gX[k], y = this.gY[k];
      if (x < 0 || x > STANZA.larghezza || y < 0 || y > STANZA.altezza) {
        const cx = Phaser.Math.Clamp(x, 0, STANZA.larghezza), cy = Phaser.Math.Clamp(y, 0, STANZA.altezza);
        this.effetti.scoppio(cx, cy - C.grumo.altezza);
        this.pozza(Phaser.Math.Clamp(cx, P.raggio, STANZA.larghezza - P.raggio), Phaser.Math.Clamp(cy, P.raggio / 2, STANZA.altezza - P.raggio / 2));
        this.togliGrumo(k);
        continue;
      }
      const d2 = (x - px) ** 2 + (y - py) ** 2;
      if (d2 < r * r) {
        danno = Math.max(danno, C.grumo.danno);
        this.effetti.scoppio(x, y - C.grumo.altezza);
        this.pozza(Phaser.Math.Clamp(x, P.raggio, STANZA.larghezza - P.raggio), Phaser.Math.Clamp(y, P.raggio / 2, STANZA.altezza - P.raggio / 2));
        this.togliGrumo(k);
        continue;
      }
      // 0 = non ancora vicino, 1 = ti sta sfiorando, 2 = schivata già contata (un grumo che ti cerca può ripassarti vicino)
      if (this.gSfiorato[k] === 2) continue;
      if (d2 < vicino * vicino) this.gSfiorato[k] = 1;
      else if (this.gSfiorato[k] === 1) {
        this.gSfiorato[k] = 2; // ti è passato vicino senza toccarti: schivata perfetta, una volta sola
        this.schivate++;
      }
    }
    for (let k = this.pozze - 1; k >= 0; k--) {
      this.pTempo[k] -= dt;
      if (this.pTempo[k] <= 0) {
        this.togliPozza(k);
        continue;
      }
      // la pozza è un'ellisse a terra (larga il doppio di quanto è alta); i piedi del personaggio con il suo corpo
      const rp = this.raggioPozza(k) + this.corpo, ex = (px - this.pX[k]) / rp, ey = (py - this.pY[k]) / (rp / 2);
      if (ex * ex + ey * ey < 1) danno = Math.max(danno, P.danno);
    }
    return danno;
  }

  /** Una pozza di cera a terra in (x, y) (anche dal LAB). Se sono troppe, la più vecchia lascia il posto. */
  pozza(x: number, y: number): void {
    if (this.pozze >= MAX_POZZE) this.togliPozza(0);
    const k = this.pozze++;
    this.pX[k] = x;
    this.pY[k] = y;
    this.pTempo[k] = P.durata;
  }

  /** Raggio di adesso: pieno, poi negli ultimi P.svanisce secondi si restringe fino a sparire. */
  private raggioPozza(k: number): number {
    return P.raggio * Math.min(1, this.pTempo[k] / P.svanisce);
  }

  private togliPozza(k: number): void {
    const u = --this.pozze;
    this.pX[k] = this.pX[u];
    this.pY[k] = this.pY[u];
    this.pTempo[k] = this.pTempo[u];
  }

  private togliGrumo(k: number): void {
    const u = --this.grumi;
    this.gX[k] = this.gX[u];
    this.gY[k] = this.gY[u];
    this.gVX[k] = this.gVX[u];
    this.gVY[k] = this.gVY[u];
    this.gSfiorato[k] = this.gSfiorato[u];
    this.gVita[k] = this.gVita[u];
    this.gBX[k] = this.gBX[u];
    this.gBH[k] = this.gBH[u];
  }

  /** Si può colpire: in campo, con la salute, non a terra. */
  private colpibile(i: number): boolean {
    return this.orda.salute[i] > 0 && this.stato[i] !== STATO.aTerra;
  }

  /**
   * Il colpo della Lanterna: un arco di raggio «raggio» e «ampiezza» gradi da (ox, oy) verso «angolo». Ferisce ogni nemico
   * dentro che non è in Quiete per la Lanterna, con l'impatto se resta in piedi. Restituisce quanti nemici ha preso.
   */
  colpisci(ox: number, oy: number, angolo: number, raggio: number, ampiezza: number, danno: number): number {
    const o = this.orda, mezza = Phaser.Math.DegToRad(ampiezza / 2);
    let presi = 0;
    for (let i = 0; i < o.numero; i++) {
      if (!this.colpibile(i) || this.quieteLanterna[i] > 0) continue;
      const rn = o.raggio[i], dx = o.x[i] - ox, dy = o.y[i] - oy, d = Math.hypot(dx, dy);
      if (d > raggio + rn) continue;
      if (d > rn && Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - angolo)) > mezza + Math.asin(Math.min(1, rn / d))) continue;
      const sx = d > 0 ? dx / d : Math.cos(angolo), sy = d > 0 ? dy / d : Math.sin(angolo);
      this.quieteLanterna[i] = NEMICI_STANZA.quiete;
      this.colpoArma(i, danno, sx, sy, FONTE.lanterna);
      presi++;
      if (o.salute[i] <= 0) continue; // battuto: le scintille grandi le fa il passo dopo
      // ancora in piedi: impatto (fermo, schiacciamento, scintille verso dove va il colpo) e spinta, tranne durante l'avviso
      if (this.fermoImpatto) this.fermo[i] = IMPATTO.fermo;
      this.schiaccia[i] = IMPATTO.schiaccia.durata;
      this.bianco[i] = NEMICI_STANZA.lampo;
      this.impatto.scintille(o.x[i], o.y[i] - o.altezza(i) / 2, sx, sy, IMPATTO.scintille.colpo);
      if (this.stato[i] !== STATO.avviso) this.muovi(i, sx * NEMICI_STANZA.spinta, sy * NEMICI_STANZA.spinta);
    }
    return presi;
  }

  /** Il Cerchio di luce: ferisce ogni nemico entro r da (x, y) che non è in Quiete per l'abilità. */
  colpisciCerchio(x: number, y: number, r: number, danno: number): number {
    const o = this.orda;
    let presi = 0;
    for (let i = 0; i < o.numero; i++) {
      if (!this.colpibile(i) || this.quieteAbilita[i] > 0) continue;
      const dx = o.x[i] - x, dy = o.y[i] - y, d = Math.hypot(dx, dy);
      if (d > r + o.raggio[i]) continue;
      this.quieteAbilita[i] = NEMICI_STANZA.quiete;
      this.colpoArma(i, danno, d > 0 ? dx / d : 0, d > 0 ? dy / d : 0, FONTE.abilita);
      presi++;
    }
    return presi;
  }

  /** Il nemico più vicino a (x, y) entro «massimo» px, escluso chi è a terra; -1 se non c'è. */
  vicino(x: number, y: number, massimo: number): number {
    const o = this.orda;
    let migliore = -1, d2min = massimo * massimo;
    for (let i = 0; i < o.numero; i++) {
      if (!this.colpibile(i)) continue;
      const d2 = (o.x[i] - x) ** 2 + (o.y[i] - y) ** 2;
      if (d2 <= d2min) {
        d2min = d2;
        migliore = i;
      }
    }
    return migliore;
  }

  /** Il fotogramma da mostrare per avviso, recupero, morte e rialzo (null: la camminata di sempre). */
  private posa(i: number, st: number, ricaduto: boolean, M: { attacco: Mossa | null; morte: Mossa | null }): string | null {
    const A = M.attacco, D = M.morte;
    // a terra il tempo scende da R.rinascita.attesa (Ricaduto) o dalla durata della morte (Cantore)
    if (st === STATO.aTerra && D) return D.a((ricaduto ? R.rinascita.attesa : D.totale) - this.tempo[i]);
    if (this.rialza[i] > 0 && D) return D.a(this.rialza[i]); // al contrario: dal fondo verso l'inizio
    if (!A) return null;
    const meta = Math.floor(A.fotogrammi.length / 2);
    if (st === STATO.avviso) {
      const durata = ricaduto ? R.avviso : C.avviso;
      return A.fotogrammi[Math.min(meta - 1, Math.floor((1 - this.tempo[i] / durata) * meta))];
    }
    if (st === STATO.recupero) return A.a(A.inizio[meta] + (ricaduto ? R.recupero : C.recupero) - this.tempo[i]);
    return null;
  }

  /** Disegno: sprite (dalla Orda, poi ritoccati), avvisi a terra, comparse, grumi, barre della salute dei feriti. */
  disegna(cam: Phaser.Cameras.Scene2D.Camera, gx: number, gy: number): void {
    const o = this.orda, t = this.terra.clear(), s = this.sopra.clear(), col = NEMICI_STANZA.colori, B = NEMICI_STANZA.barra, E = NEMICI_STANZA.effetti;
    o.disegna(cam, 64, gx, gy);
    for (let i = 0; i < o.numero; i++) {
      const sp = o.spriteDi(i), st = this.stato[i], x = Math.round(o.x[i]), y = Math.round(o.y[i]);
      // schiacciamento: largo e basso subito dopo il colpo, poi torna come prima
      const k = Math.max(0, this.schiaccia[i]) / IMPATTO.schiaccia.durata, S = IMPATTO.schiaccia, ing = o.ingrandimentoDi(i);
      sp.setScale(ing * (1 + (S.largo - 1) * k), ing * (1 + (S.basso - 1) * k)).setDepth(PROFONDITA.aTerra + 10 + y);
      if (sp.anims.currentAnim) {
        if (st !== STATO.cammina || this.fermo[i] > 0 || this.fermi[i]) sp.anims.pause();
        else sp.anims.resume();
      }
      const ricaduto = o.tipo[i] === ID_RICADUTO, M = this.mosse[ricaduto ? 0 : 1];
      const posa = this.posa(i, st, ricaduto, M);
      if (posa) sp.anims.pause(), sp.setFrame(posa);
      let ox = 0, oy = 0;
      if (st === STATO.avviso && !this.fermi[i] && !M.attacco) {
        // l'avviso senza l'animazione «attack»: il nemico trema e si solleva un poco
        ox = Math.floor(this.orologio * 30) % 2 === 0 ? -1 : 1;
        oy = -2;
      }
      const steso = st === STATO.aTerra && !M.morte; // senza «death»: steso di lato e scuro
      sp.setPosition(x + ox, y + oy).setFlipX(this.verso[i] === 1);
      sp.setAngle(steso ? (this.verso[i] ? 90 : -90) : 0);
      if (steso) sp.setTint(0x5a4a4a).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (st === STATO.aTerra) sp.clearTint();
      else if (this.bianco[i] > 0 || o.inLampo(i)) sp.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (st === STATO.avviso && Math.floor(this.orologio * 12) % 2 === 0) sp.setTint(colore(o.tipo[i] === ID_RICADUTO ? col.bordo : col.linea)).setTintMode(Phaser.TintModes.ADD);
      else sp.clearTint();
      if (st === STATO.avviso || this.colpo[i] > 0) this.disegnaAvviso(t, s, i, x, y);
      if (st !== STATO.aTerra && o.salute[i] < o.saluteMassima[i]) {
        const L = B.larghezza * 2, H = B.altezza * 2, bx = x - Math.floor(L / 2), by = y + B.distanza;
        const pieno = Math.round((B.larghezza - 2) * Math.max(0, o.salute[i] / o.saluteMassima[i])) * 2;
        s.fillStyle(0x120606).fillRect(bx, by, L, H);
        s.fillStyle(0x3a0c10).fillRect(bx + 2, by + 2, L - 4, H - 4);
        s.fillStyle(0xc0262d).fillRect(bx + 2, by + 2, pieno, H - 4);
      }
    }
    // il segno a terra dove sta per comparire un nemico: un anello che si stringe
    for (let c = 0; c < this.comparse; c++) {
      const x = Math.round(this.cX[c]), y = Math.round(this.cY[c]);
      const r = Math.max(4, Math.round(6 + 14 * (this.cTempo[c] / ONDATA.comparsa)));
      t.lineStyle(2, colore(col.bordo), 1).strokeEllipse(x, y, 2 * r, r);
      t.fillStyle(colore(col.comparsa)).fillEllipse(x, y, r, Math.max(2, Math.round(r / 2)));
    }
    // le pozze di cera: l'effetto pixelfx, con il fotogramma scelto dal tempo passato (così sparisce insieme al suo danno);
    // senza foglio, un'ellisse con il bordo scuro e un riflesso, a pixel interi
    if (this.pSprite.length) {
      for (let k = 0; k < MAX_POZZE; k++) {
        const im = this.pSprite[k];
        if (k >= this.pozze) {
          im.setVisible(false);
          continue;
        }
        const f = Math.min(this.pFotogrammi - 1, Math.floor(((P.durata - this.pTempo[k]) / P.durata) * this.pFotogrammi));
        im.setFrame(String(f)).setPosition(Math.round(this.pX[k]), Math.round(this.pY[k])).setVisible(true);
      }
    }
    for (let k = 0; k < (this.pSprite.length ? 0 : this.pozze); k++) {
      const x = Math.round(this.pX[k]), y = Math.round(this.pY[k]), r = Math.round(this.raggioPozza(k));
      if (r < 2) continue;
      t.fillStyle(colore(col.pozzaBordo)).fillEllipse(x, y, 2 * r + 4, r + 4);
      t.fillStyle(colore(col.pozza)).fillEllipse(x, y, 2 * r, r);
      t.fillStyle(colore(col.pozzaLuce)).fillEllipse(x - Math.round(r / 3), y - Math.round(r / 6), Math.round(r / 2), Math.max(2, Math.round(r / 5)));
    }
    for (let k = 0; k < this.grumi; k++) {
      const x = Math.round(this.gX[k]), y = Math.round(this.gY[k]);
      t.fillStyle(0x000000).fillEllipse(x, y, 2 * C.grumo.raggio, C.grumo.raggio); // ombra a terra
      // appena sputato è alla bocca: scende in volo fino alla sua altezza (C.bocca.discesa)
      const resta = 1 - Math.min(1, this.gVita[k] / C.bocca.discesa), e = resta * resta;
      const gx = Math.round(x + this.gBX[k] * e), alto = Math.round(C.grumo.altezza + (this.gBH[k] - C.grumo.altezza) * e);
      const sp = this.gSprite[k].setPosition(gx, y - alto).setVisible(true);
      if (sp.texture.key === E.grumo) sp.setFrame(String(Math.floor(this.gVita[k] * E.fps) % (sp.texture.frameTotal - 1)));
      // la scia: qualche goccia che resta indietro, sempre più piccola
      const v = Math.hypot(this.gVX[k], this.gVY[k]) || 1, ux = this.gVX[k] / v, uy = this.gVY[k] / v;
      for (let n = 1; n <= E.scia; n++) {
        const d = C.grumo.raggio + n * 5, l = Math.max(1, 4 - n);
        s.fillStyle(colore(n === 1 ? col.grumo : col.grumoBordo)).fillRect(Math.round(gx - ux * d - l / 2), Math.round(y - alto - uy * d - l / 2), l, l);
      }
    }
    for (let k = this.grumi; k < MAX_GRUMI; k++) this.gSprite[k].setVisible(false);
  }

  /** Avviso a terra: lo spicchio del graffio che si riempie, o la linea del canto fino al muro. */
  private disegnaAvviso(g: Phaser.GameObjects.Graphics, sopra: Phaser.GameObjects.Graphics, i: number, x: number, y: number): void {
    const col = NEMICI_STANZA.colori, a = Math.atan2(this.dirY[i], this.dirX[i]);
    if (this.orda.tipo[i] === ID_RICADUTO) {
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
    // il grumo che si forma nella bocca del Cantore mentre canta (sopra lo sprite)
    const r = Math.max(2, Math.round(C.grumo.raggio * (1 - Math.max(0, this.tempo[i]) / C.avviso)));
    sopra.fillStyle(colore(col.grumo)).fillCircle(x + (this.verso[i] ? -1 : 1) * C.bocca.canto[0], y - C.bocca.canto[1], r);
    const acceso = this.tempo[i] <= C.avviso / 3 || Math.floor(this.orologio * 8) % 2 === 0;
    if (!acceso) return;
    const lung = this.finoAlMuro(x, y, this.dirX[i], this.dirY[i]);
    g.lineStyle(2, colore(col.linea), 1).lineBetween(x, y, Math.round(x + Math.cos(a) * lung), Math.round(y + Math.sin(a) * lung));
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

/** Un'animazione dello sprite vista come fotogrammi con il loro inizio (secondi): si sceglie il fotogramma per tempo. */
interface Mossa {
  fotogrammi: string[];
  durate: number[];
  inizio: number[];
  totale: number;
  /** Il fotogramma al tempo t (secondi dall'inizio); oltre la fine resta sull'ultimo. */
  a(t: number): string;
}

function mossa(scena: Phaser.Scene, chiave: string): Mossa | null {
  const anim = scena.anims.get(chiave);
  if (!anim || anim.frames.length < 2) return null;
  const fotogrammi = anim.frames.map((f) => String(f.textureFrame));
  const durate = anim.frames.map((f) => (f.duration || 100) / 1000);
  const inizio: number[] = [];
  let totale = 0;
  for (const d of durate) inizio.push(totale), (totale += d);
  return {
    fotogrammi, durate, inizio, totale,
    a(t: number): string {
      let k = 0;
      while (k < inizio.length - 1 && t >= inizio[k + 1]) k++;
      return fotogrammi[k];
    },
  };
}
