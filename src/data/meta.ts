/*
 * Meta progressione: la Cera che si riporta da ogni veglia, i ceri votivi della Cappella (potenziamenti
 * permanenti piccoli, che si possono spegnere), la Seconda candela e i personaggi da sbloccare.
 * Proposta: https://claude.ai/artifact/VKX48n68RY3LhBKW8SBqBD. Ogni modifica qui va riportata anche nel GDD.
 */
import type { Personaggio } from './personaggi';

/** Cera guadagnata a fine veglia, anche persa. */
export const CERA = {
  perMinuto: 10, // ogni minuto intero sopravvissuto
  perElite: 5,
  perSeth: 40, // ogni volta che Seth viene sconfitto
  alba: 100, // vittoria
} as const;

export type IdCero = 'vita' | 'forza' | 'passo' | 'raccolto' | 'rito' | 'anime' | 'scelta';

export interface Cero {
  id: IdCero;
  nome: string;
  per: number; // effetto per livello (0,05 = +5%; per la Scelta: rimescolate)
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
  { id: 'scelta', nome: 'Cero della scelta', per: 0.5, testo: '+1 rimescolata ogni 2 livelli' }, // 1, 1, 2, 2, 3 (arrotondato in su)
];

/** Una volta per veglia, a salute zero ti rialzi con una parte della salute. */
export const SECONDA_CANDELA = { costo: 400, salute: 0.3, invulnerabilita: 2 } as const;

/** Come si sblocca ogni personaggio: un'impresa, oppure la Cera. Il Lampionaio è libero da subito. */
export const SBLOCCHI: Record<Personaggio['id'], { impresa: string; cera: number } | null> = {
  lampionaio: null,
  becchino: { impresa: 'Sopravvivi 5 minuti', cera: 200 },
  badessa: { impresa: 'Sconfiggi Seth', cera: 400 },
  strega: { impresa: 'Arriva all\'alba', cera: 700 },
};

/** Per la simulazione (?meta=): la Cappella a metà (livello 3 di ogni cero) o completa (5 e Seconda candela). */
export const META_SIMULAZIONE = { meta: 3, max: 5 } as const;
