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
 * con lo stesso effetto al massimo di prima. Dal 17/11 (Edoardo) anche Specchio, Calice riverso e Campanella d'argento hanno 3 livelli: ogni dono ne ha 3.
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
  { id: 'specchio', nome: 'Specchio', icona: 'Icona_Specchio', massimo: 3, totale: 3, testo: '+1 colpo a ogni arma per livello.' }, // 3 livelli dal 17/11 (Edoardo); così nel survivor; nel gioco a stanze vale SPECCHIO_STANZE, qui sotto
  { id: 'ceraVotiva', nome: 'Cera votiva', icona: 'Icona_Cera_votiva', massimo: 3, totale: 0.75, testo: '+75% durata di zone e stati in 3 livelli.' },
  { id: 'chiodoDiBara', nome: 'Chiodo di bara', icona: 'Icona_Chiodo_di_bara', massimo: 3, totale: 0.3, testo: '+30% probabilità di colpo critico (danno doppio) in 3 livelli.' },
  { id: 'lacrimaDiLumen', nome: 'Calice riverso', icona: 'Icona_Lacrima_di_lumen', // nome nuovo del 12/11 (proposta del pivot); id e icona restano finché Edoardo disegna Icona_Calice_riverso
    massimo: 3, totale: 3, testo: '+1 sorso della fiaschetta.' }, // 3 livelli come gli altri doni, +1 sorso per livello (confermati da Edoardo il 17/11)
  { id: 'campanellaDArgento', nome: "Campanella d'argento", icona: 'Icona_Campanella_d_argento', massimo: 3, totale: 0.3, testo: '+0,1 s di tempo per la schivata perfetta.' }, // 3 livelli dal 17/11 (Edoardo); +0,1 s per livello, da rivedere
];

/** Quanto dà il dono q al livello l: una parte uguale del totale per livello (la Clessidra si moltiplica: vedi ricaricaDono). */
export const effettoDono = (q: Passivo, l: number): number => (q.totale * l) / q.massimo;
/** Anime in più della Calamita al livello l. */
export const animeDono = (q: Passivo, l: number): number => ((q.anime ?? 0) * l) / q.massimo;
/** Clessidra: la ricarica si moltiplica a ogni livello; al massimo vale 1 − totale. Restituisce il moltiplicatore (1 = nessun effetto). */
export const ricaricaDono = (q: Passivo, l: number): number => (1 - q.totale) ** (l / q.massimo);

/**
 * Lo Specchio nel gioco a stanze (decisione di Edoardo del 17/11, «colpi riflessi»): per livello, quanti colpi in più ha ogni
 * arma e a che parte del danno feriscono, con la riga della carta (parole di Edoardo). Al massimo +2 colpi, non +3.
 * Il survivor resta con PASSIVI (+1 colpo per livello).
 */
export const SPECCHIO_STANZE = {
  colpi: [1, 2, 2],
  danno: [0.5, 0.5, 1],
  righe: ['+1 colpo a ogni arma, al 50% del danno.', '+1 colpo a ogni arma.', 'I colpi in più feriscono al 100% del danno.'],
};

export const MAX_PASSIVI = 6;
export const MOLTIPLICA_CRITICO = 2; // un colpo critico (Chiodo di bara) fa il doppio del danno
export const RICARICA_MINIMA = 0.4; // la Clessidra non scende sotto il 40% della ricarica base
