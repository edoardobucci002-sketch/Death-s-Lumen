/*
 * Simulazione: con ?bot registra la partita minuto per minuto (livello, salute, nemici, danno subito, uccisi)
 * e quanto dura e quanto fa male ogni Mietitore. Alla fine mette il risultato in window.__sim,
 * dove lo legge tools/sim.mjs.
 */
import { NEMICI } from '../data/nemici';
import type { Orda } from './orda';

const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');

export interface MinutoSim {
  minuto: number;
  livello: number;
  salute: number; // alla fine del minuto
  saluteMinima: number; // la più bassa nel minuto
  nemici: number;
  dannoSubito: number;
  uccisi: number;
}

export interface MietitoreSim {
  arrivo: number; // secondi
  morte: number | null; // secondi, null se è ancora vivo alla fine
  dannoSubito: number; // danno preso dal personaggio mentre il Mietitore era in campo
}

export interface RisultatoSim {
  vittoria: boolean;
  secondi: number;
  livello: number;
  anime: number;
  danno: number;
  build: string[];
  minuti: MinutoSim[];
  mietitori: MietitoreSim[];
}

export class Simulazione {
  readonly minuti: MinutoSim[] = [];
  readonly mietitori: MietitoreSim[] = [];
  private dannoSubito = 0; // nel minuto in corso
  private uccisi = 0;
  private saluteMinima = Infinity;
  private prossimo = 1; // minuto da registrare

  /** Una volta per passo: chiude il minuto quando passa. */
  passo(secondi: number, livello: number, salute: number, orda: Orda): void {
    if (salute < this.saluteMinima) this.saluteMinima = salute;
    if (secondi >= this.prossimo * 60) {
      this.minuti.push({
        minuto: this.prossimo, livello, salute: Math.round(salute), saluteMinima: Math.round(this.saluteMinima),
        nemici: orda.numero, dannoSubito: Math.round(this.dannoSubito), uccisi: this.uccisi,
      });
      this.prossimo++;
      this.dannoSubito = this.uccisi = 0;
      this.saluteMinima = salute;
    }
    // un Mietitore in meno in campo: è morto il più vecchio ancora vivo
    let inCampo = 0;
    for (let i = 0; i < orda.numero; i++) if (orda.tipo[i] === ID_MIETITORE) inCampo++;
    let vivi = 0;
    let primo: MietitoreSim | null = null;
    for (const m of this.mietitori) {
      if (m.morte !== null) continue;
      vivi++;
      primo ??= m;
    }
    if (primo && inCampo < vivi) primo.morte = secondi;
  }

  mietitoreArrivato(secondi: number): void {
    this.mietitori.push({ arrivo: secondi, morte: null, dannoSubito: 0 });
  }

  colpito(danno: number): void {
    this.dannoSubito += danno;
    for (const m of this.mietitori) if (m.morte === null) m.dannoSubito += danno;
  }

  ucciso(): void {
    this.uccisi++;
  }

  fine(r: Omit<RisultatoSim, 'minuti' | 'mietitori'>): void {
    for (const m of this.mietitori) m.dannoSubito = Math.round(m.dannoSubito);
    (window as unknown as { __sim: RisultatoSim }).__sim = { ...r, minuti: this.minuti, mietitori: this.mietitori };
  }
}
