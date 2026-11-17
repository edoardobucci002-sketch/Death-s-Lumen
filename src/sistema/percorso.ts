/*
 * Percorso nella mappa del Mondo (dal 17/11, passo 2; prima la fila di tre stanze della fetta). Tiene la stanza in cui si
 * è (un indice della mappa, src/sistema/mappa.ts) e la sua fase: lotta, attesa, carte, porte. Entrando in una stanza:
 * - l'ingresso e le stanze già ripulite sono vuote, con le porte aperte;
 * - le altre hanno le loro ondate (PERCORSO.ondate, secondo quante porte distano dall'ingresso: la successiva dopo
 *   PERCORSO.intervallo secondi, o subito se la stanza si svuota prima); a stanza ripulita, dopo un attimo, le carte
 *   (PERCORSO.quanteCarte), che pescano dalla ricompensa della stanza: gli Echi d'inizio accanto all'ingresso, Echi nuovi e
 *   livelli di un'affinità (dalla Luce anche la Lanterna), o doni;
 * - nella stanza del Campanaro (mini-boss, src/sistema/campanaro.ts) niente ondate: arriva lui da solo, lontano da te;
 * - la stanza del Boss oggi chiude la partita (fine provvisoria: Seth e la porta chiusa arrivano con il passo 3).
 * Rarità (17/11, src/data/rarita.ts): ogni carta tira prima il grado (Fioca, Chiara, Ardente) tra quelli che la stanza può
 * dare, poi un oggetto di quel grado. Le carte si estraggono con un generatore del caso con seme (riproducibili).
 */
import { ONDATA, PERCORSO, STANZA } from '../data/stanze';
import type { Arma } from '../data/armi';
import { ECHI_STANZE, LANTERNA_STANZE } from '../data/armi-stanze';
import { PASSIVI, type IdDono } from '../data/doni';
import { AFFINITA_ARMI, type IdAffinita } from '../data/stati';
import { GRADI, ORDINE_GRADI, type IdGrado } from '../data/rarita';
import { Caso } from './caso';
import type { Arsenale } from './armi';
import { gradoCarta, type Dono } from './doni';
import type { NemiciStanza } from './nemici-stanza';
import { MURI, type Medaglione, type Muro, type Ricompensa } from './porte';
import type { Mappa, StanzaMappa } from './mappa';
import { areaCamminabile } from './stanza';

export type Fase = 'lotta' | 'attesa' | 'carte' | 'porte' | 'fine';
const AFFINITA: readonly IdAffinita[] = ['luce', 'sacro', 'ombra', 'terra'];

export class Percorso {
  /** la stanza della mappa in cui si è (un indice di mappa.stanze) */
  corrente = 0;
  /** quante stanze nuove con dei nemici si sono combattute (per le simulazioni e il LAB): 0 all'ingresso */
  stanza = 0;
  fase: Fase = 'porte';
  ricompensa: Ricompensa | 'echi' = 'echi'; // da dove pescano le carte di questa stanza
  livelloLanterna = 1;
  /** LAB: le carte escono di questo grado, quando la stanza lo può dare (null = il caso di sempre). */
  forzaGrado: IdGrado | null = null;
  readonly passivi: Record<IdDono, number>;
  private ondata = 0; // ondate già arrivate in questa stanza
  private attesa = 0;
  private readonly caso: Caso;

  /** seme: il seme della partita (?seme= nell'indirizzo, per il bot; di solito ONDATA.seme). */
  constructor(private readonly arsenale: Arsenale, public mappa: Mappa, seme: number = ONDATA.seme) {
    this.caso = new Caso(seme + 1);
    this.passivi = Object.fromEntries(PASSIVI.map((q) => [q.id, 0])) as Record<IdDono, number>;
  }

  /** La stanza della mappa in cui si è. */
  get qui(): StanzaMappa {
    return this.mappa.stanze[this.corrente];
  }

  /** La stanza del Boss: oggi la fine della partita. */
  get ultima(): boolean {
    return this.qui.tipo === 'boss';
  }

  /** La stanza del Campanaro. */
  get miniboss(): boolean {
    return this.qui.tipo === 'campanaro';
  }

  /** Le ondate di questa stanza: secondo quante porte dista dall'ingresso (da 3 in su l'ultima riga). */
  private get ondate(): readonly { ricaduti: number; cantori: number }[] {
    return PERCORSO.ondate[Math.min(PERCORSO.ondate.length, Math.max(1, this.qui.distanza)) - 1];
  }

  /** Quante «ondate» ha la stanza: nell'arena una sola, il Campanaro. */
  private get quanteOndate(): number {
    return this.miniboss ? 1 : this.ondate.length;
  }

  /** Si entra nella stanza i della mappa: vuota e aperta (ingresso, già ripulita), da combattere, o la fine (il Boss). */
  entra(i: number): void {
    this.corrente = i;
    const s = this.qui;
    s.visitata = true;
    this.ondata = 0;
    this.attesa = ONDATA.attesaPrima;
    if (s.tipo === 'boss') {
      this.fase = 'fine';
      return;
    }
    if (s.ripulita) {
      this.fase = 'porte';
      return;
    }
    this.stanza++;
    this.ricompensa = s.ricompensa ?? 'dono';
    this.fase = 'lotta';
  }

  /**
   * Un passo: fa arrivare le ondate e si accorge della stanza ripulita. Restituisce true quando è il momento delle carte.
   * (px, py): il personaggio, perché nessuno compaia addosso a lui.
   */
  aggiorna(dt: number, nemici: NemiciStanza, px: number, py: number): boolean {
    if (this.fase === 'lotta') {
      if (this.miniboss && this.ondata === 0) {
        // l'arena: dopo un attimo il Campanaro compare dalla parte opposta della stanza, lontano dalla porta da cui si entra
        if ((this.attesa -= dt) <= 0) {
          const a = areaCamminabile();
          const cx = Math.min(a.x1, Math.max(a.x0, STANZA.larghezza - px)), cy = Math.min(a.y1, Math.max(a.y0, STANZA.altezza - py));
          nemici.aggiungiCampanaro(cx, cy);
          this.ondata = 1;
        }
      } else if (this.ondata < this.quanteOndate) {
        // la prima dopo un attimo; le altre a tempo, o subito se la stanza è (quasi) vuota
        const prima = this.ondata === 0;
        this.attesa -= dt;
        if (this.attesa <= 0 || (!prima && nemici.vivi() <= PERCORSO.restanti)) {
          const o = this.ondate[this.ondata++];
          nemici.ondata(px, py, o.ricaduti, o.cantori);
          this.attesa = PERCORSO.intervallo;
        }
      } else if (nemici.vivi() === 0) {
        this.fase = 'attesa';
        this.attesa = PERCORSO.attesaCarte;
      }
    } else if (this.fase === 'attesa' && (this.attesa -= dt) <= 0) {
      this.fase = 'carte';
      return true;
    }
    return false;
  }

  /** LAB: la stanza è ripulita subito (le ondate non arrivano più). */
  ripulisci(): void {
    this.ondata = this.quanteOndate;
    if (this.fase === 'lotta') {
      this.fase = 'attesa';
      this.attesa = 0;
    }
  }

  /** Le carte di questa stanza (PERCORSO.quanteCarte). */
  carte(): Dono[] {
    const n = PERCORSO.quanteCarte, scelte: Dono[] = [];
    if (this.ricompensa === 'echi') {
      // gli Echi d'inizio: Echi nuovi di affinità diverse
      for (const aff of this.mescola([...AFFINITA])) {
        if (scelte.length >= n) break;
        const nuovi = this.echiNuovi(aff);
        if (nuovi.length) scelte.push(this.pesca(nuovi.map((arma) => ({ tipo: 'arma', arma, livello: 1 }) as Dono)));
      }
    } else {
      const possibili: Dono[] = this.ricompensa === 'dono' ? this.doni() : this.dallAffinita(this.ricompensa);
      this.riempi(scelte, possibili, n);
    }
    // niente (o non abbastanza) da dare da lì, per esempio gli Echi con la build piena: il resto sono doni
    this.riempi(scelte, this.doni(), n);
    return scelte;
  }

  /** Aggiunge a «scelte» carte pescate da «pool» (senza ripetere quelle che ci sono già) finché non sono n. */
  private riempi(scelte: Dono[], pool: Dono[], n: number): void {
    const uguali = (a: Dono, b: Dono): boolean => a.tipo === b.tipo && (a.tipo === 'arma' && b.tipo === 'arma' ? a.arma.id === b.arma.id : a.tipo === 'passivo' && b.tipo === 'passivo' ? a.passivo.id === b.passivo.id : false);
    const resto = pool.filter((d) => !scelte.some((c) => uguali(c, d)));
    while (scelte.length < n && resto.length) {
      const d = this.pesca(resto);
      scelte.push(d);
      resto.splice(resto.indexOf(d), 1);
    }
  }

  /**
   * Una carta da «pool» con la rarità: tira il grado tra quelli presenti (GRADI[].probabilita, ripartite di nuovo su
   * quelli che ci sono), poi un oggetto a caso di quel grado. Con forzaGrado (LAB) prende quel grado, se c'è.
   */
  private pesca(pool: readonly Dono[]): Dono {
    const presenti = ORDINE_GRADI.filter((g) => pool.some((d) => gradoCarta(d) === g));
    let grado = presenti[0];
    if (this.forzaGrado && presenti.includes(this.forzaGrado)) grado = this.forzaGrado;
    else {
      const totale = presenti.reduce((t, g) => t + GRADI[g].probabilita, 0);
      let r = this.caso.numero() * totale;
      for (const g of presenti) {
        r -= GRADI[g].probabilita;
        if (r < 0) { grado = g; break; }
      }
    }
    const tra = pool.filter((d) => gradoCarta(d) === grado);
    return tra[this.caso.intero(0, tra.length - 1)];
  }

  /** La carta scelta entra nella build. Poi la stanza è ripulita e si aprono le porte. */
  scegli(d: Dono): void {
    if (d.tipo === 'arma') {
      if (d.arma.id === LANTERNA_STANZE.id) this.livelloLanterna = d.livello;
      else if (d.livello === 1) this.arsenale.aggiungi(d.arma);
      else this.arsenale.potenzia(d.arma);
    } else if (d.tipo === 'passivo') {
      this.passivi[d.passivo.id] = d.livello;
    }
    this.ripulita();
  }

  /** La stanza è ripulita (carta scelta, o niente da scegliere): resta vuota e con le porte aperte, anche tornandoci. */
  ripulita(): void {
    this.qui.ripulita = true;
    this.fase = 'porte';
  }

  /**
   * Le porte della stanza in cui si è: una per ogni lato con una stanza accanto, con il medaglione della stanza dopo
   * (niente medaglione se è già ripulita o se è il Boss), e dove porta ognuna (indice della mappa).
   */
  porte(): { muri: Muro[]; ricompense: Medaglione[]; verso: number[] } {
    const muri: Muro[] = [], ricompense: Medaglione[] = [], verso: number[] = [];
    this.qui.vicine.forEach((v, l) => {
      if (v < 0) return;
      const s = this.mappa.stanze[v];
      muri.push(MURI[l]);
      ricompense.push(s.ripulita || s.tipo === 'boss' ? null : s.ricompensa);
      verso.push(v);
    });
    return { muri, ricompense, verso };
  }

  /** Echi dell'affinità aff che non si hanno ancora (solo se c'è posto nella build). */
  private echiNuovi(aff: IdAffinita): Arma[] {
    if (this.arsenale.possedute.length >= PERCORSO.echi) return [];
    return ECHI_STANZE.filter((a) => AFFINITA_ARMI[a.id] === aff && !this.arsenale.livello(a));
  }

  /** Dalla porta di un'affinità: Echi nuovi, livelli degli Echi di quell'affinità, e per la Luce livelli della Lanterna. */
  private dallAffinita(aff: IdAffinita): Dono[] {
    const d: Dono[] = this.echiNuovi(aff).map((arma) => ({ tipo: 'arma', arma, livello: 1 }) as Dono);
    for (const p of this.arsenale.possedute) {
      if (AFFINITA_ARMI[p.arma.id] === aff && p.livello < p.arma.livelli.length) d.push({ tipo: 'arma', arma: p.arma, livello: p.livello + 1 });
    }
    if (aff === AFFINITA_ARMI.lanterna && this.livelloLanterna < LANTERNA_STANZE.livelli.length) d.push({ tipo: 'arma', arma: LANTERNA_STANZE, livello: this.livelloLanterna + 1 });
    return d;
  }

  /** Dalla porta del dono: livelli dei doni che si hanno, e doni nuovi se c'è posto. */
  private doni(): Dono[] {
    const posseduti = PERCORSO.doniAttivi.filter((id) => this.passivi[id] > 0).length;
    const d: Dono[] = [];
    for (const id of PERCORSO.doniAttivi) {
      const q = PASSIVI.find((p) => p.id === id)!, l = this.passivi[id];
      if (l >= q.massimo || (!l && posseduti >= PERCORSO.doni)) continue;
      d.push({ tipo: 'passivo', passivo: q, livello: l + 1 });
    }
    return d;
  }

  /** Mescola un elenco con il caso del percorso (Fisher-Yates). */
  private mescola<T>(a: T[], caso: Caso = this.caso): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = caso.intero(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
