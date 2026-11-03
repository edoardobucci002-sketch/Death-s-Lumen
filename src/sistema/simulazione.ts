/*
 * Simulazione: con ?bot registra la partita minuto per minuto (livello, salute, nemici, danno subito, uccisi),
 * quanto dura e quanto fa male ogni Mietitore, quanti pani e calamite raccoglie e quanta salute recupera.
 * Alla fine mette il risultato in window.__sim, dove lo legge tools/sim.mjs.
 */
import { NEMICI } from '../data/nemici';
import type { Orda } from './orda';
import { CALAMITA, PANE } from './oggetti';

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
  pani: number;
  calamite: number;
  curaPane: number; // salute recuperata con il pane
  curaAltro: number; // con rigenerazione e Benedizione
  curaFiaschetta: number;
  sorsi: number; // sorsi della fiaschetta bevuti
  grazie: number; // schivate perfette
}

export class Simulazione {
  readonly minuti: MinutoSim[] = [];
  readonly mietitori: MietitoreSim[] = [];
  private dannoSubito = 0; // nel minuto in corso
  private uccisi = 0;
  private saluteMinima = Infinity;
  private prossimo = 1; // minuto da registrare
  private pani = 0;
  private calamite = 0;
  private curaPane = 0;
  private curaAltro = 0;
  private curaFiaschetta = 0;
  private sorsi = 0;
  private grazie = 0;

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

  raccolto(tipo: number): void {
    if (tipo === PANE) this.pani++;
    else if (tipo === CALAMITA) this.calamite++;
  }

  curato(da: 'pane' | 'fiaschetta' | 'altro', quanto: number): void {
    if (da === 'pane') this.curaPane += quanto;
    else if (da === 'fiaschetta') this.curaFiaschetta += quanto;
    else this.curaAltro += quanto;
  }

  bevuto(): void {
    this.sorsi++;
  }

  grazia(): void {
    this.grazie++;
  }

  fine(r: Omit<RisultatoSim, 'minuti' | 'mietitori' | 'pani' | 'calamite' | 'curaPane' | 'curaAltro' | 'curaFiaschetta' | 'sorsi' | 'grazie'>): void {
    for (const m of this.mietitori) m.dannoSubito = Math.round(m.dannoSubito);
    (window as unknown as { __sim: RisultatoSim }).__sim = {
      ...r, minuti: this.minuti, mietitori: this.mietitori,
      pani: this.pani, calamite: this.calamite, curaPane: Math.round(this.curaPane), curaAltro: Math.round(this.curaAltro),
      curaFiaschetta: Math.round(this.curaFiaschetta), sorsi: this.sorsi, grazie: this.grazie,
    };
  }
}
