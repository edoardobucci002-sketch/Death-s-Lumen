/*
 * Resoconto di una partita del gioco a stanze per le simulazioni del bot (npm run sim-stanze): per ogni stanza quanto è
 * durata, quanto danno ha preso il Lampionaio e con quanta salute ne è uscito; alla fine la build, le carte scelte e il
 * danno fatto da ogni arma (per vedere quali Echi e quali intervalli pesano di più). Scrive window.__sim alla fine.
 * Si aggiorna a ogni passo senza creare niente; gli oggetti si creano solo alla fine.
 * Mappa del Mondo (17/11): le stanze sono quelle nuove con dei nemici, nell'ordine in cui il bot le combatte (l'ingresso e
 * le stanze già ripulite non contano), con quante porte distano dall'ingresso e se è l'arena del Campanaro.
 */
import { FONTI, type Arsenale } from './armi';
import { gradoCarta, type Dono } from './doni';
import type { IdGrado } from '../data/rarita';

export interface StanzaSim {
  stanza: number; // la n-esima stanza combattuta
  distanza: number; // quante porte dall'ingresso
  tipo: string; // «combattimento» o «campanaro»
  porta: string; // da dove pescavano le carte (la porta scelta per entrare)
  secondi: number; // dall'ingresso alla stanza ripulita (o alla morte)
  dannoSubito: number;
  saluteEntrata: number;
  saluteUscita: number | null; // null = morto lì
}

export interface RisultatoStanze {
  seme: number;
  completata: boolean;
  /** il forziere del tesoro aperto, la fonte della Sosta usata (18/11) */
  tesoro: boolean;
  sosta: boolean;
  stanza: number; // quante stanze ha combattuto (l'ultima raggiunta)
  secondi: number;
  salute: number;
  saluteMinima: number;
  uccisi: number;
  rinascite: number;
  schivate: number;
  colpiLanterna: number;
  usiAbilita: number;
  build: string[]; // «Lanterna 2», «Falce 3», doni
  carte: string[]; // le carte scelte, in ordine
  gradi: { offerte: Record<IdGrado, number>; scelte: Record<IdGrado, number> }; // quante carte di ogni grado ha visto e preso (rarità, 17/11)
  stanze: StanzaSim[];
  danno: Record<string, number>; // danno fatto da ogni fonte (Lanterna, Echi, Cerchio di luce, reazioni)
  /** le Unioni (19/11): offerte (nomi, una volta per stanza in cui la carta è comparsa), prese, nella stanza n; cura dello Stormo del lutto */
  unioni: { offerte: number; prese: { nome: string; stanza: number }[]; curaLutto: number };
  /** quanto hanno agito gli effetti delle Unioni (19/11): lampi del Faro e loro danno, uccisioni dei Fuochi (ognuna toglie ricarica), esecuzioni della Falce e salute tolta, secondi di Grazia tenuti dal Sudario */
  effetti: { lampi: number; dannoLampi: number; fuochi: number; esecuzioni: number; dannoEsecuzioni: number; sudario: number };
}

export class SimStanze {
  private secondi = 0;
  private saluteMinima = Infinity;
  private readonly stanze: StanzaSim[] = [];
  private readonly carte: string[] = [];
  private readonly gradi = { offerte: { fioca: 0, chiara: 0, ardente: 0 }, scelte: { fioca: 0, chiara: 0, ardente: 0 } };
  private inizio = 0; // secondi all'ingresso nella stanza in corso
  private ripulita = false;
  private unioniOfferte = 0;
  private readonly unioniPrese: { nome: string; stanza: number }[] = [];
  private lutto = 0;

  /** Stormo del lutto: salute curata. */
  curaLutto(n: number): void {
    this.lutto += n;
  }

  /** Un passo di logica. */
  passo(dt: number, salute: number): void {
    this.secondi += dt;
    if (salute < this.saluteMinima) this.saluteMinima = salute;
  }

  ferita(danno: number): void {
    const s = this.stanze[this.stanze.length - 1];
    if (s) s.dannoSubito += danno;
  }

  stanzaRipulita(_stanza: number, salute: number): void {
    const s = this.stanze[this.stanze.length - 1];
    if (!s) return;
    s.secondi = this.secondi - this.inizio;
    s.saluteUscita = salute;
    this.ripulita = true;
  }

  entra(stanza: number, porta: string, salute: number, distanza: number, tipo: string): void {
    this.inizio = this.secondi;
    this.ripulita = false;
    this.stanze.push({ stanza, distanza, tipo, porta, secondi: 0, dannoSubito: 0, saluteEntrata: salute, saluteUscita: null });
  }

  /** Le carte offerte in una stanza: per contare i gradi. */
  offerte(carte: readonly Dono[]): void {
    for (const d of carte) {
      if (d.tipo === 'unione') this.unioniOfferte++;
      else this.gradi.offerte[gradoCarta(d)]++;
    }
  }

  carta(d: Dono): void {
    if (d.tipo === 'unione') this.unioniPrese.push({ nome: d.unione.nome, stanza: this.stanze[this.stanze.length - 1]?.stanza ?? 0 });
    else this.gradi.scelte[gradoCarta(d)]++;
    this.carte.push(d.tipo === 'arma' ? `${d.arma.nome} ${d.livello}` : d.tipo === 'passivo' ? `${d.passivo.nome} ${d.livello}` : d.tipo === 'unione' ? `Unione: ${d.unione.nome}` : d.tipo);
  }

  risultato(r: {
    seme: number; completata: boolean; tesoro: boolean; sosta: boolean; stanza: number; salute: number; saluteMassima: number; uccisi: number; rinascite: number;
    schivate: number; colpiLanterna: number; usiAbilita: number; livelloLanterna: number; arsenale: Arsenale; doni: string[]; sudarioSecondi: number;
  }): RisultatoStanze {
    const ultima = this.stanze[this.stanze.length - 1];
    if (ultima && !this.ripulita) ultima.secondi = this.secondi - this.inizio;
    const danno: Record<string, number> = {};
    FONTI.forEach((f, i) => {
      if (r.arsenale.dannoFonti[i] > 0) danno[f] = Math.round(r.arsenale.dannoFonti[i]);
    });
    return {
      seme: r.seme, completata: r.completata, tesoro: r.tesoro, sosta: r.sosta, stanza: r.stanza, secondi: Math.round(this.secondi * 10) / 10,
      salute: Math.round(r.salute), saluteMinima: Math.round(Math.min(this.saluteMinima, r.salute)),
      uccisi: r.uccisi, rinascite: r.rinascite, schivate: r.schivate, colpiLanterna: r.colpiLanterna, usiAbilita: r.usiAbilita,
      build: [`Lanterna ${r.livelloLanterna}`, ...r.arsenale.possedute.map((p) => `${p.arma.nome} ${p.livello}`), ...r.doni],
      carte: this.carte, gradi: this.gradi, stanze: this.stanze.map((s) => ({ ...s, secondi: Math.round(s.secondi * 10) / 10, dannoSubito: Math.round(s.dannoSubito), saluteEntrata: Math.round(s.saluteEntrata), saluteUscita: s.saluteUscita === null ? null : Math.round(s.saluteUscita) })),
      danno, unioni: { offerte: this.unioniOfferte, prese: this.unioniPrese, curaLutto: Math.round(this.lutto) },
      effetti: { lampi: r.arsenale.lampiFaro, dannoLampi: Math.round(r.arsenale.dannoLampi), fuochi: r.arsenale.uccisiFuochi, esecuzioni: r.arsenale.esecuzioni, dannoEsecuzioni: Math.round(r.arsenale.dannoEsecuzioni), sudario: Math.round(r.sudarioSecondi * 10) / 10 },
    };
  }
}
