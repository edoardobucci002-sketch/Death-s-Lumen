/*
 * Bot delle simulazioni: gioca al posto del giocatore quando l'indirizzo contiene ?bot.
 * A ogni passo prova 16 direzioni e sceglie quella più lontana dai nemici (élite e Mietitore pesano di più),
 * andando verso anime, pane e reliquiari quando può; senza obiettivi cammina in cerchio.
 * Quando il Mietitore pulsa di rosso (sta per scattare) si sposta di lato, come farebbe un giocatore;
 * esce dai cerchi rossi prima che colpiscano e sta lontano dalle falci spettrali.
 * Con un'arma che colpisce dove cammina (Lanterna, Pala) gira intorno ai nemici tenendoli davanti.
 * Sceglie le carte con le preferenze di data/bot.ts e usa l'abilità quando è circondato.
 * Non usa il caso: a parità di seme gioca sempre la stessa partita.
 * Modo «esplora» (?esplora=1): carte, amuleti e Unioni a caso tra quelle offerte, per misurare anche gli oggetti
 * che con le preferenze non prenderebbe mai. Il caso del bot ha un suo generatore: comparse e drop non cambiano.
 */
import { BOT } from '../data/bot';
import { COMBATTIMENTO, NEMICI } from '../data/nemici';
import { MAX_ARMI, type Arma } from '../data/armi';
import type { Dono } from './doni';
import type { Orda } from './orda';
import type { Anime } from './anime';
import type { Rompibili } from './rompibili';
import type { Minacce } from './minacce';
import { PANE, type Oggetti } from './oggetti';
import { Caso } from './caso';

const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');
const ID_BRUTO = NEMICI.findIndex((t) => t.id === 'bruto');
const COS = Float32Array.from({ length: BOT.direzioni }, (_, k) => Math.cos((k / BOT.direzioni) * Math.PI * 2));
const SIN = Float32Array.from({ length: BOT.direzioni }, (_, k) => Math.sin((k / BOT.direzioni) * Math.PI * 2));

export class Bot {
  dx = 0;
  dy = 0;
  private angolo = 0; // direzione del giro quando non ha obiettivi
  // nemici vicini, preparati a ogni passo (niente allocazioni nel ciclo)
  private vicini: Int32Array;
  private pesi: Float32Array;
  private quanti = 0;
  private aggressione: number;
  urne: Rompibili | null = null; // solo per misurare: con ?cercaurne va apposta verso le urne
  private esplora: Caso | null = null; // modo «esplora»: sceglie a caso, con un generatore suo

  constructor(
    private orda: Orda,
    private anime: Anime,
    private oggetti: Oggetti,
    private minacce: Minacce,
    private armaIniziale: Arma,
  ) {
    this.vicini = new Int32Array(orda.x.length);
    this.pesi = new Float32Array(orda.x.length);
    this.aggressione = BOT.attaccoDavanti[armaIniziale.id] ?? 0;
  }

  /** Modo «esplora»: da ora sceglie a caso tra le carte offerte (seme diverso da quello della notte). */
  esplorando(seme: number): void {
    this.esplora = new Caso((seme * 7919 + BOT.semeEsplora) >>> 0);
  }

  /** Una carta a caso tra quelle che vanno bene. */
  private aCaso(carte: readonly Dono[], va: (d: Dono) => boolean): number {
    const buone: number[] = [];
    carte.forEach((d, n) => { if (va(d)) buone.push(n); });
    return buone.length ? buone[this.esplora!.intero(0, buone.length - 1)] : 0;
  }

  /**
   * Decide dove camminare; (gx, gy) sono i piedi del personaggio, salute tra 0 e 1;
   * sfioro = distanza di sfioramento per le tacche della Grazia (0 = non cercarle, per esempio in Grazia).
   */
  guida(dt: number, gx: number, gy: number, salute: number, sfioro = 0): void {
    const cercaSfioro = sfioro > 0 && salute >= BOT.sfioro.sopra;
    const o = this.orda;
    this.quanti = 0;
    const p2 = BOT.pericolo * BOT.pericolo;
    const a2 = BOT.portataAttacco * BOT.portataAttacco;
    let versoX = 0; // verso dove stanno i nemici a portata d'arma
    let versoY = 0;
    let schivaX = 0; // direzione dello scatto da schivare (0 = nessuno)
    let schivaY = 0;
    for (let i = 0; i < o.numero; i++) {
      const ex = o.x[i] - gx;
      const ey = o.y[i] - gy;
      if (o.tipo[i] === ID_MIETITORE && o.fase[i] > 0 && ex * ex + ey * ey < BOT.distanzaSchivata ** 2) {
        schivaX = o.scattoX[i];
        schivaY = o.scattoY[i];
      }
      const e2 = ex * ex + ey * ey;
      if (e2 < a2 && e2 > 1) {
        const e = Math.sqrt(e2);
        versoX += ex / e;
        versoY += ey / e;
      }
      if (e2 > p2) continue;
      this.vicini[this.quanti] = i;
      this.pesi[this.quanti++] = o.tipo[i] === ID_MIETITORE ? BOT.pesoMietitore : o.elite[i] ? BOT.pesoElite : o.tipo[i] === ID_BRUTO ? BOT.pesoBruto : 1;
    }

    // obiettivo: pane se ferito, poi calamite e reliquiari, poi l'anima più vicina
    let tx = 0;
    let ty = 0;
    let obiettivo = false;
    let migliore = BOT.cercaOggetti * BOT.cercaOggetti;
    const g = this.oggetti;
    for (let i = 0; i < g.numero; i++) {
      if (g.tipo[i] === PANE && salute >= BOT.feritoSotto) continue;
      const d = (g.x[i] - gx) ** 2 + (g.y[i] - gy) ** 2;
      if (d < migliore) {
        migliore = d;
        tx = g.x[i];
        ty = g.y[i];
        obiettivo = true;
      }
    }
    const urna = !obiettivo && this.urne ? this.urne.urnaVicina(gx, gy) : -1;
    if (urna >= 0) {
      const u = this.urne!.posizione(urna);
      tx = u.x;
      ty = u.y;
      obiettivo = true;
    }
    if (!obiettivo) {
      migliore = BOT.cercaAnime * BOT.cercaAnime;
      const a = this.anime;
      for (let i = 0; i < a.numero; i++) {
        const d = (a.x[i] - gx) ** 2 + (a.y[i] - gy) ** 2;
        if (d < migliore) {
          migliore = d;
          tx = a.x[i];
          ty = a.y[i];
          obiettivo = true;
        }
      }
    }
    this.angolo += BOT.giro * dt;
    const dObiettivo = obiettivo ? Math.hypot(tx - gx, ty - gy) : 0;
    const lv = Math.hypot(versoX, versoY);
    if (lv > 0) {
      versoX /= lv;
      versoY /= lv;
    }

    // Grazia a tacche: il nemico normale più vicino che si può sfiorare adesso (senza pausa)
    let bersaglio = -1, distanzaGiusta = 0;
    if (cercaSfioro) {
      let vicino = BOT.sfioro.cerca * BOT.sfioro.cerca;
      for (let n = 0; n < this.quanti; n++) {
        const i = this.vicini[n];
        if (this.pesi[n] !== 1 || o.pausaSfioro[i] > 0) continue;
        const d2 = (o.x[i] - gx) ** 2 + (o.y[i] - gy) ** 2;
        if (d2 < vicino) {
          vicino = d2;
          bersaglio = i;
        }
      }
      if (bersaglio >= 0) distanzaGiusta = o.raggio[bersaglio] + COMBATTIMENTO.raggioGiocatore + sfioro / 2;
    }
    let scelta = 0;
    let costoMinimo = Infinity;
    for (let k = 0; k < BOT.direzioni; k++) {
      const px = gx + COS[k] * BOT.sguardo;
      const py = gy + SIN[k] * BOT.sguardo;
      let costo = 0;
      for (let n = 0; n < this.quanti; n++) {
        const i = this.vicini[n];
        const d2 = ((o.x[i] - px) ** 2 + (o.y[i] - py) ** 2) / (BOT.sguardo * BOT.sguardo);
        costo += this.pesi[n] / (0.15 + d2);
      }
      if (obiettivo) costo += (BOT.pesoObiettivo * (Math.hypot(tx - px, ty - py) - dObiettivo)) / BOT.sguardo;
      else costo -= BOT.pesoObiettivo * 0.5 * (COS[k] * Math.cos(this.angolo) + SIN[k] * Math.sin(this.angolo));
      costo -= BOT.pesoInerzia * (COS[k] * this.dx + SIN[k] * this.dy);
      costo -= this.aggressione * (COS[k] * versoX + SIN[k] * versoY);
      // fuori dai cerchi che stanno per colpire, lontano dalle falci (dove saranno tra un attimo)
      const mi = this.minacce;
      for (let a = 0; a < mi.aree; a++) {
        if (mi.aAttesa[a] <= 0 || mi.aR[a] < BOT.areaMinima) continue;
        const r = mi.aR[a] + BOT.margineArea;
        if ((px - mi.aX[a]) ** 2 + (py - mi.aY[a]) ** 2 < r * r) costo += BOT.pesoArea;
      }
      for (let f = 0; f < mi.falci; f++) {
        const fx = mi.fX[f] + mi.fVX[f] * BOT.anticipoFalci;
        const fy = mi.fY[f] + mi.fVY[f] * BOT.anticipoFalci;
        costo += BOT.pesoFalce / (0.15 + ((fx - px) ** 2 + (fy - py) ** 2) / (BOT.sguardo * BOT.sguardo));
      }
      // Grazia a tacche: resta alla distanza giusta dal nemico normale più vicino, per sfiorarlo senza toccarlo
      if (bersaglio >= 0) {
        const qx = gx + COS[k] * BOT.sfioro.passo, qy = gy + SIN[k] * BOT.sfioro.passo;
        const d = Math.hypot(o.x[bersaglio] - qx, o.y[bersaglio] - qy);
        costo += (BOT.sfioro.peso * Math.abs(d - distanzaGiusta)) / BOT.sfioro.passo;
      }
      // di lato rispetto allo scatto: il prodotto vettoriale è 1 in perpendicolare, 0 lungo la linea
      if (schivaX || schivaY) costo -= BOT.schivata * Math.abs(COS[k] * schivaY - SIN[k] * schivaX);
      if (costo < costoMinimo) {
        costoMinimo = costo;
        scelta = k;
      }
    }
    this.dx = COS[scelta];
    this.dy = SIN[scelta];
  }

  /** Usare l'abilità adesso? raggio è quello dell'abilità; cura dice se è la Benedizione. */
  abilita(gx: number, gy: number, raggio: number, cura: boolean, salute: number): boolean {
    if (cura && salute < BOT.curaSotto) return true;
    const o = this.orda;
    const r2 = raggio * raggio;
    let dentro = 0;
    for (let i = 0; i < o.numero; i++) {
      if ((o.x[i] - gx) ** 2 + (o.y[i] - gy) ** 2 > r2) continue;
      if (o.tipo[i] === ID_MIETITORE) return true;
      dentro++;
    }
    return dentro >= BOT.nemiciPerAbilita;
  }

  /** Reliquiario: l'amuleto migliore che sta nei grani liberi, altrimenti il potenziamento. Restituisce la posizione della carta. */
  amuleto = (carte: readonly Dono[], graniLiberi: number): number => {
    // a caso, ma senza andare in Peccato: il bot non sa spegnere gli amuleti
    if (this.esplora) return this.aCaso(carte, (d) => d.tipo !== 'amuleto' || d.amuleto.grani <= graniLiberi);
    const unione = carte.findIndex((d) => d.tipo === 'unione');
    if (unione >= 0) return unione;
    let scelta = carte.findIndex((d) => d.tipo === 'potenziamento');
    let meglio = 0;
    carte.forEach((d, n) => {
      if (d.tipo !== 'amuleto' || d.amuleto.grani > graniLiberi) return;
      const v = BOT.amuletiPreferiti[d.amuleto.id];
      if (v > meglio) {
        meglio = v;
        scelta = n;
      }
    });
    return Math.max(0, scelta);
  };

  /** Quale carta prendere: restituisce la sua posizione. armi è quante ne possiede. */
  carta = (carte: readonly Dono[], armi: number): number => {
    if (this.esplora) return this.aCaso(carte, () => true);
    let scelta = 0;
    let meglio = -Infinity;
    carte.forEach((d, n) => {
      let v: number;
      if (d.tipo === 'arma') {
        if (d.arma === this.armaIniziale) v = BOT.carte.armaIniziale;
        else if (d.livello > 1) v = BOT.carte.armaPosseduta;
        else v = armi < Math.min(BOT.massimoArmi, MAX_ARMI) ? BOT.carte.armaNuova * (BOT.armiPreferite[d.arma.id] ?? 1) : -1;
      } else if (d.tipo === 'passivo') {
        v = (d.livello > 1 ? BOT.carte.passivoPosseduto : BOT.carte.passivoNuovo) * BOT.passiviPreferiti[d.passivo.id];
      } else {
        v = BOT.carte.pane;
      }
      if (v > meglio) {
        meglio = v;
        scelta = n;
      }
    });
    return scelta;
  };
}
