/*
 * Meta progressione: la Cera che si riporta da ogni veglia, i ceri votivi della Cappella (potenziamenti
 * permanenti piccoli, che si possono spegnere), la Seconda candela e i personaggi da sbloccare.
 * Proposta: https://claude.ai/artifact/VKX48n68RY3LhBKW8SBqBD. Ogni modifica qui va riportata anche nel GDD.
 */
import type { Personaggio } from './personaggi';
import type { IdArma } from './armi';
import type { IdDono } from './doni';

/**
 * Cera di una veglia: le gocce raccolte durante la partita (cadono da nemici, élite e Seth: vedi DROP.cera in
 * data/oggetti.ts, una goccia vale 1) più il premio dell'alba. La si porta a casa anche morendo.
 */
export const CERA = {
  goccia: 1,
  alba: 100, // vittoria
} as const;

export type IdCero = 'vita' | 'forza' | 'passo' | 'raccolto' | 'rito' | 'anime' | 'scelta';

export interface Cero {
  id: IdCero;
  nome: string;
  per: number; // effetto per livello (0,05 = +5%; per la Scelta: rimescolate ogni «ogniLivelli» livelli)
  ogniLivelli?: number; // solo per la Scelta
  testo: string; // cosa fa un livello, per la Cappella
}

/** Costo di ogni livello di un cero, dal primo al quinto. */
export const COSTI_CERO = [30, 60, 100, 150, 220] as const;

export const CERI: Cero[] = [
  { id: 'vita', nome: 'Cero della vita', per: 0.05, testo: '+5% salute massima' },
  { id: 'forza', nome: 'Cero della forza', per: 0.04, testo: '+4% danno' },
  { id: 'passo', nome: 'Cero del passo', per: 0.03, testo: '+3% velocità' },
  { id: 'raccolto', nome: 'Cero del raccolto', per: 0.1, testo: '+10% raggio di raccolta delle anime' },
  { id: 'rito', nome: 'Cero del rito', per: 0.04, testo: '−4% ricarica dell\'abilità speciale' },
  { id: 'anime', nome: 'Cero delle anime', per: 0.04, testo: '+4% anime' },
  { id: 'scelta', nome: 'Cero della scelta', per: 1, ogniLivelli: 2, testo: '+1 rimescolata ogni 2 livelli' }, // ai livelli 1-5: 1, 1, 2, 2, 3
];

/** Rimescolate in più date dal Cero della scelta a quel livello (un gruppo di livelli appena cominciato vale già). */
export function rimescolateCero(livello: number): number {
  const c = CERI.find((x) => x.id === 'scelta')!;
  return c.per * Math.ceil(livello / c.ogniLivelli!);
}

/** Una volta per veglia, a salute zero ti rialzi con una parte della salute. */
export const SECONDA_CANDELA = { costo: 400, salute: 0.3, invulnerabilita: 2 } as const;

/** Come si sblocca ogni personaggio: un'impresa, oppure la Cera. Il Lampionaio è libero da subito. */
export const SBLOCCHI: Record<Personaggio['id'], { impresa: string; cera: number } | null> = {
  lampionaio: null,
  becchino: { impresa: 'Sopravvivi 5 minuti', cera: 200 },
  badessa: { impresa: 'Sconfiggi Seth', cera: 400 },
  strega: { impresa: 'Arriva all\'alba', cera: 700 },
};

/** Il Rosario (amuleti nei reliquiari) si sblocca con un'impresa, oppure con la Cera. */
export const SBLOCCO_ROSARIO = { impresa: 'Sopravvivi 8 minuti', minuti: 8, cera: 300 } as const;

/**
 * Armi e doni nuovi (tappa 5) da sbloccare: le armi con un'impresa, i doni con un'impresa o con la Cera.
 * Tutto il resto è disponibile da subito, compresa la Cera votiva. Le imprese si contano veglia per veglia.
 */
export type IdOggetto = Extract<IdArma, 'lapide' | 'rosarioSpezzato' | 'corvo' | 'veloFunebre'> | Extract<IdDono, 'campanellaDArgento' | 'chiodoDiBara' | 'lacrimaDiLumen'>;
export interface SbloccoOggetto { id: IdOggetto; nome: string; tipo: 'arma' | 'dono'; impresa?: string; soglia?: number; cera?: number; testo: string }
export const SBLOCCHI_OGGETTI: SbloccoOggetto[] = [
  { id: 'lapide', nome: 'Lapide', tipo: 'arma', impresa: 'Sconfiggi Seth con il Becchino', testo: 'Cade sul nemico più forte in vista.' },
  { id: 'rosarioSpezzato', nome: 'Rosario spezzato', tipo: 'arma', impresa: 'Fai 10 Eclissi in una veglia', soglia: 10, testo: 'Un grano rimbalza tra i nemici.' },
  { id: 'corvo', nome: 'Corvo', tipo: 'arma', impresa: 'Raccogli 30000 anime in una veglia', soglia: 30000, testo: 'Becca i nemici e ti riporta le anime.' },
  { id: 'veloFunebre', nome: 'Velo funebre', tipo: 'arma', impresa: 'Resta 3 minuti dentro le tue nubi in una veglia', soglia: 180, testo: 'Un\'aura che consacra chi entra.' },
  { id: 'campanellaDArgento', nome: "Campanella d'argento", tipo: 'dono', impresa: 'Fai 20 schivate perfette in una veglia', soglia: 20, cera: 120, testo: 'Più tempo per la schivata perfetta.' },
  { id: 'chiodoDiBara', nome: 'Chiodo di bara', tipo: 'dono', cera: 120, testo: 'Colpi critici.' },
  { id: 'lacrimaDiLumen', nome: 'Lacrima di lumen', tipo: 'dono', cera: 120, testo: 'Più sorsi nella fiaschetta.' },
];

/** Le unioni delle armi si sbloccano con un'impresa, oppure con la Cera. */
export const SBLOCCO_UNIONI = { impresa: 'Sopravvivi 10 minuti', minuti: 10, cera: 500 } as const;

/** Per la simulazione (?meta=): la Cappella a metà (livello 3 di ogni cero) o completa (5 e Seconda candela). */
export const META_SIMULAZIONE = { meta: 3, max: 5 } as const;
/** A metà Cappella si è sbloccata circa metà di armi e doni nuovi; completa, tutti. */
export const OGGETTI_A_META: IdOggetto[] = ['lapide', 'rosarioSpezzato', 'chiodoDiBara', 'lacrimaDiLumen'];
