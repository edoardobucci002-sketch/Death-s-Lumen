/*
 * Doni passivi: si scelgono tra le carte a ogni livello e migliorano il personaggio e tutte le armi.
 * Valori dal GDD (docs/GDD_base.md, sezione 5). Ogni modifica qui va riportata anche nel GDD.
 */
export type IdDono = 'cuoreDiCera' | 'saleNero' | 'clessidra' | 'stoppinoLungo' | 'aliDiFalena' | 'calamita' | 'erbeAmare' | 'scudoDiFerro' | 'specchio' | 'ceraVotiva' | 'chiodoDiBara' | 'lacrimaDiLumen' | 'campanellaDArgento';

export interface Passivo {
  id: IdDono;
  nome: string;
  icona: string;
  massimo: number; // livello massimo
  totale: number; // quanto dà al livello massimo (ogni livello ne dà una parte uguale: vedi effettoDono)
  testo: string; // sulla carta
  anime?: number; // anime in più al livello massimo (Calamita)
}

/*
 * Doni a 3 livelli (decisione di Edoardo del 10/11, da rivedere): i doni che arrivavano a 4 o 5 arrivano a 3,
 * con lo stesso effetto al massimo di prima. Specchio, Lacrima di lumen e Campanella d'argento restano come sono.
 */
export const PASSIVI: Passivo[] = [
  { id: 'cuoreDiCera', nome: 'Cuore di cera', icona: 'Icona_Cuore_di_cera', massimo: 3, totale: 100, testo: '+100 salute massima in 3 livelli.' },
  { id: 'saleNero', nome: 'Sale nero', icona: 'Icona_Sale_nero', massimo: 3, totale: 0.5, testo: '+50% danno in 3 livelli.' },
  // la Clessidra si moltiplica: al massimo la ricarica è il 69,57% (era 0,93 alla quinta, in 5 livelli)
  { id: 'clessidra', nome: 'Clessidra', icona: 'Icona_Clessidra', massimo: 3, totale: 0.3043, testo: '−30% ricarica in 3 livelli.' },
  { id: 'stoppinoLungo', nome: 'Stoppino lungo', icona: 'Icona_Stoppino_lungo', massimo: 3, totale: 0.5, testo: '+50% area in 3 livelli: raggi, archi, nubi, pozze, abilità e alone di luce.' },
  { id: 'aliDiFalena', nome: 'Ali di falena', icona: 'Icona_Ali_di_falena', massimo: 3, totale: 0.4, testo: '+40% velocità in 3 livelli.' },
  { id: 'calamita', nome: 'Calamita', icona: 'Icona_Calamita', massimo: 3, totale: 5, anime: 0.25, testo: '+500% raggio di raccolta e +25% anime in 3 livelli.' },
  { id: 'erbeAmare', nome: 'Erbe amare', icona: 'Icona_Erbe_amare', massimo: 3, totale: 1.25, testo: '+1,25 salute al secondo in 3 livelli.' },
  { id: 'scudoDiFerro', nome: 'Scudo di ferro', icona: 'Icona_Scudo_di_ferro', massimo: 3, totale: 0.24, testo: '−24% danno subito in 3 livelli.' },
  { id: 'specchio', nome: 'Specchio', icona: 'Icona_Specchio', massimo: 1, totale: 1, testo: '+1 proiettile, nube, fiala, fuoco o falce.' },
  { id: 'ceraVotiva', nome: 'Cera votiva', icona: 'Icona_Cera_votiva', massimo: 3, totale: 0.75, testo: '+75% durata di zone e stati in 3 livelli.' },
  { id: 'chiodoDiBara', nome: 'Chiodo di bara', icona: 'Icona_Chiodo_di_bara', massimo: 3, totale: 0.3, testo: '+30% probabilità di colpo critico (danno doppio) in 3 livelli.' },
  { id: 'lacrimaDiLumen', nome: 'Lacrima di lumen', icona: 'Icona_Lacrima_di_lumen', massimo: 2, totale: 2, testo: '+1 sorso della fiaschetta.' },
  { id: 'campanellaDArgento', nome: "Campanella d'argento", icona: 'Icona_Campanella_d_argento', massimo: 2, totale: 0.2, testo: '+0,1 s di tempo per la schivata perfetta.' },
];

/** Quanto dà il dono q al livello l: una parte uguale del totale per livello (la Clessidra si moltiplica: vedi ricaricaDono). */
export const effettoDono = (q: Passivo, l: number): number => (q.totale * l) / q.massimo;
/** Anime in più della Calamita al livello l. */
export const animeDono = (q: Passivo, l: number): number => ((q.anime ?? 0) * l) / q.massimo;
/** Clessidra: la ricarica si moltiplica a ogni livello; al massimo vale 1 − totale. Restituisce il moltiplicatore (1 = nessun effetto). */
export const ricaricaDono = (q: Passivo, l: number): number => (1 - q.totale) ** (l / q.massimo);

export const MAX_PASSIVI = 6;
export const MOLTIPLICA_CRITICO = 2; // un colpo critico (Chiodo di bara) fa il doppio del danno
export const RICARICA_MINIMA = 0.4; // la Clessidra non scende sotto il 40% della ricarica base
