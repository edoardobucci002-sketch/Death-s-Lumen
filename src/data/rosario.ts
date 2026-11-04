/*
 * Il Rosario (tappa 4 della proposta su oggetti e build, M8): si parte con 3 grani, +1 per ogni Seth sconfitto
 * (al massimo 5). Ogni amuleto costa da 1 a 3 grani, dà un vantaggio e ha un rovescio. Gli amuleti si trovano nei
 * reliquiari; se i grani non bastano si è in Peccato e si subisce il doppio del danno, finché non se ne spegne uno
 * (dalla pausa, toccando l'amuleto). Ogni modifica qui va riportata anche nel GDD (sezione 8e).
 * Tempi in secondi, distanze in pixel di gioco.
 */

export type IdAmuleto =
  | 'specchioRotto' | 'lanternaCieca' | 'cuoreAvido' | 'sangueFreddo' | 'martire'
  | 'danzaMacabra' | 'ceriGemelli' | 'lucciola' | 'ossaDelite' | 'pattoDiSangue';

export const ROSARIO = {
  grani: 3, // all'inizio
  perSeth: 1, // grani in più per ogni Seth sconfitto…
  massimo: 5, // …fino a questo totale
  peccato: 1, // danno subito in più oltre i grani (1 = il doppio)
  proposte: 3, // amuleti offerti da un reliquiario, accanto al potenziamento
  proposteConUnione: 2, // amuleti offerti quando il reliquiario offre anche un'unione
  // all'inizio nessuno li ha: il Rosario si sblocca nella Cappella (data/meta.ts, SBLOCCO_ROSARIO)
} as const;

/** I numeri di ogni amuleto, per chi li usa nel codice. */
export const AMULETI_NUMERI = {
  specchioRotto: { proiettili: 1, dannoSubito: 0.25 },
  lanternaCieca: { danno: 0.35, alone: 0.15 }, // l'alone resta al 15%: buio quasi pieno
  cuoreAvido: { anime: 0.3, cura: 0.5 }, // pane e fiaschetta curano la metà
  sangueFreddo: { sotto: 0.3, danno: 0.4 },
  martire: { raggio: 150, danno: 30, salute: -0.2 }, // l'onda ferisce per 30 (come ogni colpo: più danno, più forte)
  danzaMacabra: { sfiora: 16, durataGrazia: 2, recupero: 3 }, // sfiorare = entro 16 px dal contatto; non più di una Grazia ogni 3 s
  ceriGemelli: { cariche: 2, ricarica: 0.3 },
  lucciola: { alone: 0.2, intervallo: 0.5 }, // i nemici nell'alone sono abbagliati, controllato ogni mezzo secondo
  ossaDelite: { reliquiari: 2, salute: 0.4 },
  pattoDiSangue: { cura: 0.2 }, // salute per ogni uccisione
} as const;

export interface Amuleto {
  id: IdAmuleto;
  nome: string;
  grani: number;
  vantaggio: string;
  rovescio: string;
  colore: string; // del grano disegnato dal codice, finché Edoardo non disegna le icone
}

export const AMULETI: Amuleto[] = [
  { id: 'specchioRotto', nome: 'Specchio rotto', grani: 3, vantaggio: '+1 proiettile, nube, fiala, fuoco o falce per tutte le armi.', rovescio: 'Subisci +25% danno.', colore: '#c9d6e8' },
  { id: 'lanternaCieca', nome: 'Lanterna cieca', grani: 2, vantaggio: '+35% danno.', rovescio: 'Alone di luce quasi spento.', colore: '#6a5a8a' },
  { id: 'cuoreAvido', nome: 'Cuore avido', grani: 2, vantaggio: '+30% anime.', rovescio: 'Pane e fiaschetta curano la metà.', colore: '#c2412d' },
  { id: 'sangueFreddo', nome: 'Sangue freddo', grani: 1, vantaggio: 'Sotto il 30% di salute, +40% danno.', rovescio: 'Nessuno.', colore: '#4f8fb8' },
  { id: 'martire', nome: 'Martire', grani: 3, vantaggio: 'Ogni colpo subito libera un\'onda sacra intorno a te.', rovescio: '−20% salute massima.', colore: '#dcc07a' },
  { id: 'danzaMacabra', nome: 'Danza macabra', grani: 2, vantaggio: 'La Grazia scatta anche sfiorando i nemici normali.', rovescio: 'La Grazia dura 2 s invece di 3.', colore: '#a57ae0' },
  { id: 'ceriGemelli', nome: 'Ceri gemelli', grani: 2, vantaggio: 'L\'abilità speciale ha 2 cariche.', rovescio: 'Ricarica +30%.', colore: '#e3913a' },
  { id: 'lucciola', nome: 'Lucciola', grani: 1, vantaggio: 'Alone di luce più grande del 20%; i nemici nell\'alone sono abbagliati.', rovescio: 'Nessuno.', colore: '#f2e46a' },
  { id: 'ossaDelite', nome: 'Ossa d\'élite', grani: 1, vantaggio: 'Le élite lasciano 2 reliquiari.', rovescio: 'Le élite hanno +40% salute.', colore: '#e8dcc4' },
  { id: 'pattoDiSangue', nome: 'Patto di sangue', grani: 2, vantaggio: 'Ogni uccisione cura 0,2 di salute.', rovescio: 'Non puoi più usare la fiaschetta.', colore: '#8a1f2a' },
];

export const amuleto = (id: IdAmuleto): Amuleto => AMULETI.find((a) => a.id === id)!;
