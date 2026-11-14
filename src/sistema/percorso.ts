/*
 * Percorso della fetta (passo 6): tre stanze una dopo l'altra. In ogni stanza arrivano le sue ondate (PERCORSO.ondate:
 * la successiva dopo PERCORSO.intervallo secondi, o subito se la stanza si svuota prima); a stanza ripulita, dopo un attimo, le 3 carte. La prima stanza offre
 * 3 Echi di affinità diverse; poi la porta scelta decide da dove pescano: una porta d'affinità dà Echi nuovi e livelli
 * degli Echi di quell'affinità (dalla Luce anche livelli della Lanterna), la porta del dono dà doni (solo quelli che nelle
 * stanze funzionano). Gli Echi e la Lanterna hanno i numeri del gioco a stanze (data/armi-stanze.ts: 5 livelli, danno a intervallo). Scelta la carta si aprono le porte; dopo la terza stanza la fetta è finita.
 * Le carte si estraggono con un generatore del caso con seme (riproducibili). La scena mostra le carte e le porte.
 */
import { ONDATA, PERCORSO } from '../data/stanze';
import type { Arma } from '../data/armi';
import { ECHI_STANZE, LANTERNA_STANZE } from '../data/armi-stanze';
import { PASSIVI, type IdDono } from '../data/doni';
import { AFFINITA_ARMI, type IdAffinita } from '../data/stati';
import { Caso } from './caso';
import type { Arsenale } from './armi';
import type { Dono } from './doni';
import type { NemiciStanza } from './nemici-stanza';
import { MURI, type Muro, type Ricompensa } from './porte';

export type Fase = 'lotta' | 'attesa' | 'carte' | 'porte' | 'fine';
const AFFINITA: readonly IdAffinita[] = ['luce', 'sacro', 'ombra', 'terra'];

export class Percorso {
  stanza = 1; // da 1 a PERCORSO.ondate.length
  fase: Fase = 'lotta';
  ricompensa: Ricompensa | 'echi' = 'echi'; // da dove pescano le carte di questa stanza
  livelloLanterna = 1;
  readonly passivi: Record<IdDono, number>;
  private ondata = 0; // ondate già arrivate in questa stanza
  private attesa = 0;
  private readonly caso = new Caso(ONDATA.seme + 1);

  constructor(private readonly arsenale: Arsenale) {
    this.passivi = Object.fromEntries(PASSIVI.map((q) => [q.id, 0])) as Record<IdDono, number>;
  }

  get ultima(): boolean {
    return this.stanza >= PERCORSO.ondate.length;
  }

  /** Comincia la stanza n, con le carte che pescano da «ricompensa». */
  entra(n: number, ricompensa: Ricompensa | 'echi'): void {
    this.stanza = n;
    this.ricompensa = ricompensa;
    this.fase = 'lotta';
    this.ondata = 0;
    this.attesa = ONDATA.attesaPrima;
  }

  /**
   * Un passo: fa arrivare le ondate e si accorge della stanza ripulita. Restituisce true quando è il momento delle carte.
   * (px, py): il personaggio, perché nessuno compaia addosso a lui.
   */
  aggiorna(dt: number, nemici: NemiciStanza, px: number, py: number): boolean {
    const ondate = PERCORSO.ondate[this.stanza - 1];
    if (this.fase === 'lotta') {
      if (this.ondata < ondate.length) {
        // la prima dopo un attimo; le altre a tempo, o subito se la stanza è (quasi) vuota
        const prima = this.ondata === 0;
        this.attesa -= dt;
        if (this.attesa <= 0 || (!prima && nemici.vivi() <= PERCORSO.restanti)) {
          const o = ondate[this.ondata++];
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
    this.ondata = PERCORSO.ondate[this.stanza - 1].length;
    if (this.fase === 'lotta') {
      this.fase = 'attesa';
      this.attesa = 0;
    }
  }

  /** Le 3 carte di questa stanza. */
  carte(): Dono[] {
    const scelte: Dono[] = [];
    if (this.ricompensa === 'echi') {
      // tre Echi nuovi di tre affinità diverse
      for (const aff of this.mescola([...AFFINITA])) {
        if (scelte.length >= 3) break;
        const nuovi = this.echiNuovi(aff);
        if (nuovi.length) scelte.push({ tipo: 'arma', arma: nuovi[this.caso.intero(0, nuovi.length - 1)], livello: 1 });
      }
      return scelte;
    }
    const possibili: Dono[] = this.ricompensa === 'dono' ? this.doni() : this.dallAffinita(this.ricompensa);
    const pool = possibili.length ? possibili : this.doni(); // niente da dare in quell'affinità: doni
    return this.mescola(pool).slice(0, 3);
  }

  /** La carta scelta entra nella build. Poi si aprono le porte, o la fetta è finita. */
  scegli(d: Dono): void {
    if (d.tipo === 'arma') {
      if (d.arma.id === LANTERNA_STANZE.id) this.livelloLanterna = d.livello;
      else if (d.livello === 1) this.arsenale.aggiungi(d.arma);
      else this.arsenale.potenzia(d.arma);
    } else if (d.tipo === 'passivo') {
      this.passivi[d.passivo.id] = d.livello;
    }
    this.fase = this.ultima ? 'fine' : 'porte';
  }

  /** Le porte della prossima stanza: 2 o 3, su muri diversi, con ricompense diverse. */
  porte(): { muri: Muro[]; ricompense: Ricompensa[] } {
    const n = this.caso.intero(PERCORSO.porte.minimo, PERCORSO.porte.massimo);
    const muri = this.mescola([...MURI]).slice(0, n);
    const ricompense = this.mescola<Ricompensa>([...AFFINITA, 'dono']).slice(0, n);
    return { muri, ricompense };
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
  private mescola<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.caso.intero(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
