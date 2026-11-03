/*
 * Doni passivi: si scelgono tra le carte a ogni livello e migliorano il personaggio e tutte le armi.
 * Valori dal GDD (docs/GDD_base.md, sezione 5). Ogni modifica qui va riportata anche nel GDD.
 */
export type IdDono = 'cuoreDiCera' | 'saleNero' | 'clessidra' | 'stoppinoLungo' | 'aliDiFalena' | 'calamita' | 'erbeAmare' | 'scudoDiFerro' | 'specchio';

export interface Passivo {
  id: IdDono;
  nome: string;
  icona: string;
  massimo: number; // livello massimo
  per: number; // quanto aggiunge ogni livello
  testo: string; // sulla carta
  anime?: number; // anime in più per livello (Calamita)
}

export const PASSIVI: Passivo[] = [
  { id: 'cuoreDiCera', nome: 'Cuore di cera', icona: 'Icona_Cuore_di_cera', massimo: 5, per: 20, testo: '+20 salute massima.' },
  { id: 'saleNero', nome: 'Sale nero', icona: 'Icona_Sale_nero', massimo: 5, per: 0.1, testo: '+10% danno.' },
  { id: 'clessidra', nome: 'Clessidra', icona: 'Icona_Clessidra', massimo: 5, per: 0.07, testo: '−7% ricarica.' },
  { id: 'stoppinoLungo', nome: 'Stoppino lungo', icona: 'Icona_Stoppino_lungo', massimo: 5, per: 0.1, testo: '+10% area: raggi, archi, nubi, pozze, abilità e alone di luce.' },
  { id: 'aliDiFalena', nome: 'Ali di falena', icona: 'Icona_Ali_di_falena', massimo: 5, per: 0.08, testo: '+8% velocità.' },
  { id: 'calamita', nome: 'Calamita', icona: 'Icona_Calamita', massimo: 5, per: 0.3, anime: 0.05, testo: '+30% raggio di raccolta e +5% anime.' },
  { id: 'erbeAmare', nome: 'Erbe amare', icona: 'Icona_Erbe_amare', massimo: 5, per: 0.25, testo: '+0,25 salute al secondo.' },
  { id: 'scudoDiFerro', nome: 'Scudo di ferro', icona: 'Icona_Scudo_di_ferro', massimo: 4, per: 0.06, testo: '−6% danno subito.' },
  { id: 'specchio', nome: 'Specchio', icona: 'Icona_Specchio', massimo: 1, per: 1, testo: '+1 proiettile, nube, fiala, fuoco o falce.' },
];

export const MAX_PASSIVI = 6;
export const RICARICA_MINIMA = 0.4; // la Clessidra non scende sotto il 40% della ricarica base
