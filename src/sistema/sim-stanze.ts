/*
 * Resoconto di una partita del gioco a stanze per le simulazioni del bot (npm run sim-stanze): per ogni stanza quanto è
 * durata, quanto danno ha preso il Lampionaio e con quanta salute ne è uscito; alla fine la build, le carte scelte e il
 * danno fatto da ogni arma (per vedere quali Echi e quali intervalli pesano di più). Scrive window.__sim alla fine.
 * Si aggiorna a ogni passo senza creare niente; gli oggetti si creano solo alla fine.
 */
import { FONTI, type Arsenale } from './armi';
import type { Dono } from './doni';

export interface StanzaSim {
  stanza: number;
  porta: string; // da dove pescavano le carte (la porta scelta per entrare)
  secondi: number; // dall'ingresso alla stanza ripulita (o alla morte)
  dannoSubito: number;
  saluteEntrata: number;
  saluteUscita: number | null; // null = morto lì
}

export interface RisultatoStanze {
  seme: number;
  completata: boolean;
  stanza: number; // l'ultima stanza raggiunta
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
  stanze: StanzaSim[];
  danno: Record<string, number>; // danno fatto da ogni fonte (Lanterna, Echi, Cerchio di luce, reazioni)
}

export class SimStanze {
  private secondi = 0;
  private saluteMinima = Infinity;
  private readonly stanze: StanzaSim[] = [{ stanza: 1, porta: 'echi', secondi: 0, dannoSubito: 0, saluteEntrata: 0, saluteUscita: null }];
  private readonly carte: string[] = [];
  private inizio = 0; // secondi all'ingresso nella stanza in corso
  private ripulita = false;

  /** Un passo di logica. */
  passo(dt: number, salute: number): void {
    if (this.secondi === 0) this.stanze[0].saluteEntrata = salute;
    this.secondi += dt;
    if (salute < this.saluteMinima) this.saluteMinima = salute;
  }

  ferita(danno: number): void {
    this.stanze[this.stanze.length - 1].dannoSubito += danno;
  }

  stanzaRipulita(_stanza: number, salute: number): void {
    const s = this.stanze[this.stanze.length - 1];
    s.secondi = this.secondi - this.inizio;
    s.saluteUscita = salute;
    this.ripulita = true;
  }

  entra(stanza: number, porta: string, salute: number): void {
    this.inizio = this.secondi;
    this.ripulita = false;
    this.stanze.push({ stanza, porta, secondi: 0, dannoSubito: 0, saluteEntrata: salute, saluteUscita: null });
  }

  carta(d: Dono): void {
    this.carte.push(d.tipo === 'arma' ? `${d.arma.nome} ${d.livello}` : d.tipo === 'passivo' ? `${d.passivo.nome} ${d.livello}` : d.tipo);
  }

  risultato(r: {
    seme: number; completata: boolean; stanza: number; salute: number; saluteMassima: number; uccisi: number; rinascite: number;
    schivate: number; colpiLanterna: number; usiAbilita: number; livelloLanterna: number; arsenale: Arsenale; doni: string[];
  }): RisultatoStanze {
    const ultima = this.stanze[this.stanze.length - 1];
    if (!this.ripulita) ultima.secondi = this.secondi - this.inizio;
    const danno: Record<string, number> = {};
    FONTI.forEach((f, i) => {
      if (r.arsenale.dannoFonti[i] > 0) danno[f] = Math.round(r.arsenale.dannoFonti[i]);
    });
    return {
      seme: r.seme, completata: r.completata, stanza: r.stanza, secondi: Math.round(this.secondi * 10) / 10,
      salute: Math.round(r.salute), saluteMinima: Math.round(Math.min(this.saluteMinima, r.salute)),
      uccisi: r.uccisi, rinascite: r.rinascite, schivate: r.schivate, colpiLanterna: r.colpiLanterna, usiAbilita: r.usiAbilita,
      build: [`Lanterna ${r.livelloLanterna}`, ...r.arsenale.possedute.map((p) => `${p.arma.nome} ${p.livello}`), ...r.doni],
      carte: this.carte, stanze: this.stanze.map((s) => ({ ...s, secondi: Math.round(s.secondi * 10) / 10, dannoSubito: Math.round(s.dannoSubito), saluteEntrata: Math.round(s.saluteEntrata), saluteUscita: s.saluteUscita === null ? null : Math.round(s.saluteUscita) })),
      danno,
    };
  }
}
