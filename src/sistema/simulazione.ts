/*
 * Simulazione: con ?bot registra la partita minuto per minuto (livello, salute, nemici, danno subito, uccisi),
 * quanto dura e quanto fa male ogni Mietitore, quanti pani e calamite raccoglie e quanta salute recupera.
 * Misura anche gli oggetti: che cosa possiede a fine notte, quali carte gli sono state offerte e quali ha scelto,
 * il danno di ogni arma e di ogni reazione, quando arriva la prima Unione, Patto di sangue e Acquasantiera.
 * Per il confronto del pivot misura anche ogni nemico che muore: categoria, quanto è vissuto, se ha mai avuto uno stato
 * o subito una reazione.
 * Alla fine mette il risultato in window.__sim, dove lo legge tools/sim.mjs. Non tira il caso: non cambia la notte.
 */
import { NEMICI } from '../data/nemici';
import { STORIA_REAZIONE, STORIA_STATO, type Orda } from './orda';
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
    case 'rito': return `rito:${d.aff}`;
  }
}

/** Gli oggetti posseduti a fine notte, con il livello (gli amuleti con i grani e se sono accesi). */
export interface OggettiSim {
  armi: { nome: string; livello: number; unione: string | null }[];
  doni: { nome: string; livello: number }[];
  amuleti: { nome: string; acceso: boolean }[];
}

const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');
const ID_BRUTO = NEMICI.findIndex((t) => t.id === 'bruto');

/** Nemici morti di una categoria: quanti, quanti senza aver mai subito una reazione, quanti senza aver mai avuto uno stato. */
export interface MortiSim {
  morti: number;
  senzaReazione: number;
  senzaStato: number;
}

/** Categorie dei nemici morti: Seth, élite (anche se bruti), bruti normali, tutti gli altri; «tutti» le somma. */
export const CATEGORIE_MORTI = ['tutti', 'seth', 'elite', 'bruti', 'altri'] as const;
/** Fasi della notte per il tempo di vita: il nemico conta nella fase in cui muore (minuti 0–5, 5–10, 10–15). */
export const FASI_VITA = ['0-5', '5-10', '10-15'] as const;

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
  secondiGrazia: number; // secondi passati in Grazia
  tacche: number; // tacche di Grazia guadagnate sfiorando i nemici
  pozzeCuranti: number; // Acquasantiera con la fiaschetta piena: pozze che hanno curato…
  curaPozze: number; // …e la salute che hanno ridato davvero
  paneDaSolo: number; // «Pane e vino» preso da solo, senza aprire la scelta
  riti: number; // Riti scelti nella notte
  primoRito: number | null; // livello a cui si è aperta la prima scelta dei Riti
  abilitaPrima5: number; // volte in cui ha usato l'abilità speciale prima del minuto 5
  causaMorte: string | null; // il colpo che ha ucciso: «Seth (mossa)», «Seth (contatto)», «élite», «orda (tipo)», «contatto (tipo)»
  dannoMaledizione: number; // salute tolta dalla maledizione (Maledetto), fuori da «danno»…
  dannoMaledizioneInterrata: number; // …e dall'Interramento che ha consumato l'Ombra (Stati certi)
  mortiPerCategoria: Record<(typeof CATEGORIE_MORTI)[number], MortiSim>;
  /** Tempo di vita dei nemici morti in ogni fase: decimi di secondo → quanti nemici (si somma tra le notti). */
  vitaPerFase: Record<(typeof FASI_VITA)[number], Record<number, number>>;
  statiArmi: Record<string, number>; // stati lasciati da ogni arma
  reazioniArmi: Record<string, number>; // reazioni fatte partire dai colpi di ogni arma
}

export type Misure = Pick<RisultatoSim, 'oggetti' | 'dannoArmi' | 'dannoReazioni' | 'reazioniPerTipo' | 'pozzeCuranti' | 'secondiGrazia' | 'tacche' | 'paneDaSolo' | 'dannoMaledizione' | 'dannoMaledizioneInterrata' | 'statiArmi' | 'reazioniArmi'>;

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
  causaMorte: string | null = null;
  private abilitaPrima5 = 0;
  private riti = 0;
  private primoRito: number | null = null;
  private mortiPerCategoria = Object.fromEntries(CATEGORIE_MORTI.map((c) => [c, { morti: 0, senzaReazione: 0, senzaStato: 0 }])) as RisultatoSim['mortiPerCategoria'];
  private vitaPerFase = Object.fromEntries(FASI_VITA.map((f) => [f, {}])) as RisultatoSim['vitaPerFase'];

  /** Il nemico i dell'orda muore adesso (secondi della notte): categoria, storia degli stati e tempo di vita. */
  morto(orda: Orda, i: number, secondi: number): void {
    const t = orda.tipo[i];
    const cat = t === ID_MIETITORE ? 'seth' : orda.elite[i] ? 'elite' : t === ID_BRUTO ? 'bruti' : 'altri';
    for (const c of ['tutti', cat] as const) {
      const m = this.mortiPerCategoria[c];
      m.morti++;
      if (!(orda.storia[i] & STORIA_REAZIONE)) m.senzaReazione++;
      if (!(orda.storia[i] & STORIA_STATO)) m.senzaStato++;
    }
    const fase = this.vitaPerFase[FASI_VITA[Math.min(2, Math.floor(secondi / 300))]];
    const decimi = Math.max(0, Math.round((secondi - orda.natoA[i]) * 10));
    fase[decimi] = (fase[decimi] ?? 0) + 1;
  }

  /** Si è aperta la scelta dei Riti al livello indicato e se ne è preso uno. */
  rito(livello: number): void {
    this.riti++;
    this.primoRito ??= livello;
  }

  /** L'abilità speciale è partita. */
  abilita(secondi: number): void {
    if (secondi < 300) this.abilitaPrima5++;
  }

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
      curaPatto: Math.round(this.curaPatto), sorsiAcquasantiera: this.sorsiAcquasantiera, sorsiAcquasantieraVeri: this.sorsiAcquasantieraVeri, curaPozze: Math.round(this.curaPozze), causaMorte: this.causaMorte, mortiPerCategoria: this.mortiPerCategoria, vitaPerFase: this.vitaPerFase, abilitaPrima5: this.abilitaPrima5, riti: this.riti, primoRito: this.primoRito,
    };
  }
}
