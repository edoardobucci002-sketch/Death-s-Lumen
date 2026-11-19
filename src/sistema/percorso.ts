/*
 * Percorso nella mappa del Mondo (dal 17/11, passo 2; prima la fila di tre stanze della fetta). Tiene la stanza in cui si
 * è (un indice della mappa, src/sistema/mappa.ts) e la sua fase: lotta, attesa, carte, porte. Entrando in una stanza:
 * - l'ingresso e le stanze già ripulite sono vuote, con le porte aperte;
 * - le altre hanno le loro ondate (PERCORSO.ondate, secondo quante porte distano dall'ingresso: la successiva dopo
 *   PERCORSO.intervallo secondi, o subito se la stanza si svuota prima); a stanza ripulita, dopo un attimo, le carte
 *   (PERCORSO.quanteCarte), che pescano dalla ricompensa della stanza: gli Echi d'inizio accanto all'ingresso, Echi nuovi e
 *   livelli di un'affinità (dalla Luce anche la Lanterna), o doni;
 * - nella stanza del Campanaro (mini-boss, src/sistema/campanaro.ts) niente ondate: arriva lui da solo, lontano da te;
 * - tesoro e Sosta (18/11) sono vuoti e aperti: il loro oggetto (il forziere con le carte rare, la fonte che riempie la
 *   fiaschetta) lo usa la scena (src/scene/Stanze.ts); usato, la stanza è «ripulita»;
 * - la porta del Boss resta chiusa (il lucchetto) finché il Campanaro non è battuto: lui ha la chiave (passo 3, 18/11);
 * - entrati dal Boss le porte si chiudono alle spalle e non si torna; arriva Seth (src/sistema/seth.ts, 18/11), da solo
 *   come il Campanaro; battuto lui la fase è «fine»: il Mondo 1 è completato.
 * Unioni (19/11, src/data/unioni-stanze.ts): quando un Eco o la Lanterna è al livello 4 e il suo dono al massimo, la stanza
 * ripulita offre la carta Unione in più (il forziere del tesoro al posto di una carta); una per stanza, finché non la prendi.
 * Rarità (17/11, src/data/rarita.ts): ogni carta tira prima il grado (Fioca, Chiara, Ardente) tra quelli che la stanza può
 * dare, poi un oggetto di quel grado. Le carte si estraggono con un generatore del caso con seme (riproducibili).
 */
import { ONDATA, PERCORSO } from '../data/stanze';
import { SETH } from '../data/seth';
import { STANZE_SPECIALI } from '../data/mappa';
import type { Arma } from '../data/armi';
import { ECHI_STANZE, LANTERNA_STANZE } from '../data/armi-stanze';
import { PASSIVI, type IdDono } from '../data/doni';
import { AFFINITA_ARMI, type IdAffinita } from '../data/stati';
import { GRADI, ORDINE_GRADI, type IdGrado } from '../data/rarita';
import { LIVELLO_ARMA_UNIONE_STANZE, UNIONI_STANZE } from '../data/unioni-stanze';
import { livelloDonoUnione, type Unione } from '../data/unioni';
import { Caso } from './caso';
import type { Arsenale } from './armi';
import { gradoCarta, type Dono } from './doni';
import type { NemiciStanza } from './nemici-stanza';
import { MURI, type Medaglione, type Muro, type Ricompensa } from './porte';
import type { Mappa, StanzaMappa } from './mappa';
import { MISURA, areaCamminabile } from './stanza';

export type Fase = 'lotta' | 'attesa' | 'carte' | 'porte' | 'fine';
const AFFINITA: readonly IdAffinita[] = ['luce', 'sacro', 'ombra', 'terra'];

export class Percorso {
  /** la stanza della mappa in cui si è (un indice di mappa.stanze) */
  corrente = 0;
  /** quante stanze nuove con dei nemici si sono combattute (per le simulazioni e il LAB): 0 all'ingresso */
  stanza = 0;
  fase: Fase = 'porte';
  ricompensa: Ricompensa | 'echi' | 'chiave' = 'echi'; // da dove pescano le carte di questa stanza (o la chiave sicura)
  /** Le chiavi in tasca (18/11): aprono le porte chiuse a chiave; si perdono a fine Veglia. */
  chiavi = 0;
  livelloLanterna = 1;
  /** LAB: le carte escono di questo grado, quando la stanza lo può dare (null = il caso di sempre). */
  forzaGrado: IdGrado | null = null;
  /** Simulazioni (?unione=…&unita=0): la carta Unione non esce mai, per confrontare la stessa build senza Unione. */
  senzaUnioni = false;
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

  /** La chiave della porta del Boss: il Campanaro è battuto (la sua stanza è ripulita). Si salva con la mappa. */
  get chiave(): boolean {
    return this.mappa.stanze[this.mappa.campanaro]?.ripulita ?? true;
  }

  /** La stanza del Campanaro. */
  get miniboss(): boolean {
    return this.qui.tipo === 'campanaro';
  }

  /** Le ondate di questa stanza: secondo quante porte dista dall'ingresso (da 3 in su l'ultima riga). */
  private get ondate(): readonly { ricaduti: number; cantori: number }[] {
    return PERCORSO.ondate[Math.min(PERCORSO.ondate.length, Math.max(1, this.qui.distanza)) - 1];
  }

  /** Quante «ondate» ha la stanza: nelle arene dei capi una sola, il Campanaro o Seth. */
  private get quanteOndate(): number {
    return this.miniboss || this.ultima ? 1 : this.ondate.length;
  }

  /** Si entra nella stanza i della mappa: vuota e aperta (ingresso, già ripulita), da combattere, o la fine (il Boss). */
  entra(i: number): void {
    this.corrente = i;
    const s = this.qui;
    s.visitata = true;
    this.ondata = 0;
    this.attesa = ONDATA.attesaPrima;
    if (s.tipo === 'boss') {
      // Seth (18/11): si combatte; battuto lui, la fine del Mondo 1 (fase «fine»)
      this.stanza++;
      this.attesa = SETH.attesa;
      this.fase = 'lotta';
      return;
    }
    if (s.tipo === 'tesoro' || s.tipo === 'sosta') {
      this.fase = 'porte'; // vuota e aperta: c'è solo il suo oggetto
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
      if ((this.miniboss || this.ultima) && this.ondata === 0) {
        // l'arena doppia: dopo un attimo il capo (Campanaro o Seth) compare al centro (Edoardo, 18/11), lontano dalla porta da
        // cui si entra; se il personaggio è già lì (solo dal LAB), dalla parte opposta
        if ((this.attesa -= dt) <= 0) {
          const a = areaCamminabile(), mx = MISURA.larghezza / 2, my = MISURA.altezza / 2;
          const vicino = Math.hypot(px - mx, py - my) < PERCORSO.capoLontano;
          const cx = vicino ? Math.min(a.x1, Math.max(a.x0, MISURA.larghezza - px)) : mx, cy = vicino ? Math.min(a.y1, Math.max(a.y0, MISURA.altezza - py)) : my;
          if (this.ultima) nemici.aggiungiSeth(cx, cy);
          else nemici.aggiungiCampanaro(cx, cy);
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
        if (this.ultima) {
          this.fase = 'fine'; // Seth battuto: il Mondo 1 è completato
          this.qui.ripulita = true;
          return false;
        }
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
    if (this.fase === 'lotta' && this.ultima) {
      this.fase = 'fine';
      this.qui.ripulita = true;
    } else if (this.fase === 'lotta') {
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
      const r = this.ricompensa;
      const possibili: Dono[] = r === 'dono' || r === 'chiave' ? this.doni() : this.dallAffinita(r);
      this.riempi(scelte, possibili, n);
    }
    // niente (o non abbastanza) da dare da lì, per esempio gli Echi con la build piena: il resto sono doni
    this.riempi(scelte, this.doni(), n);
    // un'Unione pronta: la carta in più (Edoardo, 19/11)
    const u = this.cartaUnione();
    if (u) scelte.push(u);
    return scelte;
  }

  /** La prima Unione pronta (arma al livello 4, dono al massimo, non ancora unita), o null. */
  unionePronta(): Unione | null {
    if (this.senzaUnioni) return null;
    return this.unioniPronte()[0] ?? null;
  }

  /** Le Unioni pronte, nell'ordine di UNIONI_STANZE (per il LAB e la scoperta). */
  unioniPronte(): Unione[] {
    return UNIONI_STANZE.filter((u) => {
      const arma = this.armaUnione(u);
      if (!arma || this.arsenale.unitaId(u.arma)) return false;
      const l = arma === LANTERNA_STANZE ? this.livelloLanterna : this.arsenale.livello(arma);
      return l >= LIVELLO_ARMA_UNIONE_STANZE && this.passivi[u.dono] >= livelloDonoUnione(u.dono);
    });
  }

  /** L'arma di un'Unione, se è nella build (la Lanterna c'è sempre). */
  armaUnione(u: Unione): Arma | undefined {
    if (u.arma === LANTERNA_STANZE.id) return LANTERNA_STANZE;
    return this.arsenale.possedute.find((p) => p.arma.id === u.arma)?.arma;
  }

  /** La carta della prima Unione pronta, o null. */
  private cartaUnione(): Dono | null {
    const u = this.unionePronta();
    return u ? { tipo: 'unione', unione: u, arma: this.armaUnione(u)! } : null;
  }

  /**
   * Il Reliquiario del tesoro (18/11): STANZE_SPECIALI.tesoro.carte carte pescate da tutte le fonti (Echi nuovi e livelli di
   * ogni affinità, doni) tra quelle dei gradi rari; se non bastano, le altre.
   */
  carteTesoro(): Dono[] {
    const T = STANZE_SPECIALI.tesoro, tutte: Dono[] = [];
    for (const aff of AFFINITA) tutte.push(...this.dallAffinita(aff));
    tutte.push(...this.doni());
    const scelte: Dono[] = [];
    // un'Unione pronta prende il posto di una delle carte rare (19/11)
    const u = this.cartaUnione();
    if (u) scelte.push(u);
    this.riempi(scelte, tutte.filter((d) => T.gradi.includes(gradoCarta(d))), T.carte);
    this.riempi(scelte, tutte, T.carte);
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
    } else if (d.tipo === 'unione') {
      this.arsenale.unisci(d.arma); // anche la Lanterna: l'arsenale ricorda che è unita (si salva con la Veglia)
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
   * (niente medaglione se è già ripulita), e dove porta ognuna (indice della mappa). La porta del Boss ha il medaglione del
   * capo; senza la chiave del Campanaro ha il lucchetto e resta chiusa (chiuse[k]). Le porte chiuse a chiave (18/11) hanno la
 * serratura e restano chiuse finché non le si apre con una chiave (apriSerratura).
   */
  porte(): { muri: Muro[]; ricompense: Medaglione[]; verso: number[]; chiuse: boolean[] } {
    const muri: Muro[] = [], ricompense: Medaglione[] = [], verso: number[] = [], chiuse: boolean[] = [];
    const chiave = this.chiave;
    this.qui.vicine.forEach((v, l) => {
      if (v < 0) return;
      const s = this.mappa.stanze[v], boss = s.tipo === 'boss', speciale = s.tipo === 'tesoro' || s.tipo === 'sosta';
      muri.push(MURI[l]);
      const candele = s.candele && !this.candeleAccese;
      ricompense.push(boss ? (chiave ? 'capo' : 'chiusa') : s.serrata ? 'serratura' : candele ? 'candele' : s.ripulita ? null : speciale ? (s.tipo as 'tesoro' | 'sosta') : s.ricompensa);
      verso.push(v);
      chiuse.push((boss && !chiave) || s.serrata || candele);
    });
    return { muri, ricompense, verso, chiuse };
  }

  /** Le candele accese del Mondo (18/11). */
  get candeleAccese(): boolean {
    return this.mappa.stanze.every((s) => s.candela !== 1);
  }

  /** Quante candele sono accese, e quante sono in tutto. */
  contaCandele(): [number, number] {
    let accese = 0, tutte = 0;
    for (const s of this.mappa.stanze) if (s.candela) {
      tutte++;
      if (s.candela === 2) accese++;
    }
    return [accese, tutte];
  }

  /** Apre con una chiave la porta chiusa a chiave verso la stanza v (18/11): true se l'ha aperta. */
  apriSerratura(v: number): boolean {
    const s = this.mappa.stanze[v];
    if (!s?.serrata || this.chiavi <= 0) return false;
    this.chiavi--;
    s.serrata = false;
    return true;
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
