/*
 * Simulazione: con ?bot registra la partita minuto per minuto (livello, salute, nemici, danno subito, uccisi),
 * quanto dura e quanto fa male ogni Mietitore, quanti pani e calamite raccoglie e quanta salute recupera.
 * Misura anche gli oggetti: che cosa possiede a fine notte, quali carte gli sono state offerte e quali ha scelto,
 * il danno di ogni arma e di ogni reazione, quando arriva la prima Unione, Patto di sangue e Acquasantiera.
 * Alla fine mette il risultato in window.__sim, dove lo legge tools/sim.mjs. Non tira il caso: non cambia la notte.
 */
import { NEMICI } from '../data/nemici';
import type { Orda } from './orda';
import { CALAMITA, PANE } from './oggetti';
import type { Dono } from './doni';

/** Il nome di una carta nelle tabelle della simulazione: «arma:Lanterna», «dono:Sale nero», «amuleto:Lucciola»… */
export function nomeCarta(d: Dono): string {
  switch (d.tipo) {
    case 'arma': return `arma:${d.arma.nome}`;
    case 'passivo': return `dono:${d.passivo.nome}`;
    case 'amuleto': return `amuleto:${d.amuleto.nome}`;
    case 'unione': return `unione:${d.unione.nome}`;
    case 'pane': return 'altro:Pane e vino';
    case 'potenziamento': return 'altro:Potenziamento';
  }
}

/** Gli oggetti posseduti a fine notte, con il livello (gli amuleti con i grani e se sono accesi). */
export interface OggettiSim {
  armi: { nome: string; livello: number; unione: string | null }[];
  doni: { nome: string; livello: number }[];
  amuleti: { nome: string; acceso: boolean }[];
}

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
  reazioni: number; // reazioni tra stati (Eclissi, Rivelazione, Esorcismo, Interramento)
  cera: number; // Cera guadagnata
  urne: number; // urne rotte (solo con ?rompibili)
  oggetti: OggettiSim; // posseduti a fine notte
  carte: Record<string, { offerta: number; scelta: number }>; // ogni carta: quante volte offerta e quante scelta
  dannoArmi: Record<string, number>; // danno di ogni arma (e dell'abilità, del Martire e del fuoco dell'olio)
  dannoReazioni: Record<string, number>; // danno di Eclissi, Esorcismo e la parte in più dell'Interramento
  reazioniPerTipo: Record<string, number>;
  unioneOfferta: number | null; // minuto (con i decimali) in cui il reliquiario ha offerto la prima Unione
  unionePresa: number | null; // minuto in cui il bot ne ha presa una
  curaPatto: number; // salute curata da Patto di sangue
  sorsiAcquasantiera: number; // sorsi guadagnati con l'Acquasantiera…
  sorsiAcquasantieraVeri: number; // …e quanti sono entrati davvero nella fiaschetta (non oltre il massimo)
  pozzeCuranti: number; // Acquasantiera con la fiaschetta piena: pozze che hanno curato…
  curaPozze: number; // …e la salute che hanno ridato davvero
}

type Misure = Pick<RisultatoSim, 'oggetti' | 'dannoArmi' | 'dannoReazioni' | 'reazioniPerTipo' | 'pozzeCuranti'>;

export class Simulazione {
  urna(): void {
    this.urne++;
  }

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
  private urne = 0;
  private grazie = 0;
  private carte: RisultatoSim['carte'] = {};
  private unioneOfferta: number | null = null;
  private unionePresa: number | null = null;
  private curaPatto = 0;
  private sorsiAcquasantiera = 0;
  private sorsiAcquasantieraVeri = 0;
  private curaPozze = 0;

  /** Il bot ha visto queste carte e ha scelto quella in posizione scelta. */
  scelta(carte: readonly Dono[], scelta: number, secondi: number): void {
    carte.forEach((d, n) => {
      const k = nomeCarta(d);
      const c = (this.carte[k] ??= { offerta: 0, scelta: 0 });
      c.offerta++;
      if (n === scelta) c.scelta++;
      if (d.tipo === 'unione') {
        this.unioneOfferta ??= secondi / 60;
        if (n === scelta) this.unionePresa ??= secondi / 60;
      }
    });
  }

  patto(quanto: number): void {
    this.curaPatto += quanto;
  }

  /** Salute ridata davvero dalle pozze che curano dell'Acquasantiera. */
  curaPozza(salute: number): void {
    this.curaPozze += salute;
  }

  acquasantiera(sorsi: number, veri: number): void {
    this.sorsiAcquasantiera += sorsi;
    this.sorsiAcquasantieraVeri += veri;
  }

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

  fine(r: Pick<RisultatoSim, 'vittoria' | 'secondi' | 'livello' | 'anime' | 'danno' | 'build' | 'reazioni' | 'cera'> & Misure): void {
    for (const m of this.mietitori) m.dannoSubito = Math.round(m.dannoSubito);
    (window as unknown as { __sim: RisultatoSim }).__sim = {
      ...r, minuti: this.minuti, mietitori: this.mietitori,
      pani: this.pani, calamite: this.calamite, curaPane: Math.round(this.curaPane), curaAltro: Math.round(this.curaAltro),
      curaFiaschetta: Math.round(this.curaFiaschetta), sorsi: this.sorsi, grazie: this.grazie,
      urne: this.urne,
      carte: this.carte, unioneOfferta: this.unioneOfferta, unionePresa: this.unionePresa,
      curaPatto: Math.round(this.curaPatto), sorsiAcquasantiera: this.sorsiAcquasantiera, sorsiAcquasantieraVeri: this.sorsiAcquasantieraVeri, curaPozze: Math.round(this.curaPozze),
    };
  }
}
