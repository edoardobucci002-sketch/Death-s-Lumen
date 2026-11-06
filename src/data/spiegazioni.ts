/*
 * Le parole con cui il gioco spiega stati, reazioni e dati degli oggetti: strisce dei doni, legenda, nomi delle reazioni.
 * I numeri non si scrivono qui: si leggono da stati.ts e doni.ts, così cambiando un numero (anche dal Laboratorio) cambia il testo.
 */
import { REAZIONI, STATI, type IdAffinita } from './stati';
import type { IdDono, Passivo } from './doni';

export const virgola = (v: number): string => String(Math.round(v * 100) / 100).replace('.', ',');
const percento = (v: number): string => `${virgola(Math.round(v * 1000) / 10)}%`;

export interface InfoAffinita {
  nome: string;
  stato: string; // nome dello stato sul nemico
  verbo: string; // cosa fa l'arma, sulla striscia
  simbolo: string; // sprite del simbolo
  colore: string;
  effetto(): string;
}

export const INFO_AFFINITA: Record<IdAffinita, InfoAffinita> = {
  luce: { nome: 'Luce', stato: 'Abbagliato', verbo: 'Abbaglia', simbolo: 'Simbolo_Abbagliato', colore: '#e3913a', effetto: () => `subisce +${percento(STATI.abbagliato.danno)} danno` },
  sacro: { nome: 'Sacro', stato: 'Consacrato', verbo: 'Consacra', simbolo: 'Simbolo_Consacrato', colore: '#dcc07a', effetto: () => `rallenta del ${percento(STATI.consacrato.lento)}` },
  ombra: { nome: 'Ombra', stato: 'Maledetto', verbo: 'Maledice', simbolo: 'Simbolo_Maledetto', colore: '#a57ae0', effetto: () => `perde il ${percento(STATI.maledetto.perSecondo)} di salute al secondo` },
  terra: { nome: 'Terra', stato: 'Sepolto', verbo: 'Seppellisce', simbolo: 'Simbolo_Sepolto', colore: '#b89a74', effetto: () => `resta fermo ${virgola(STATI.sepolto.fermo)} s` },
};

export interface InfoReazione {
  nome: string;
  stati: [IdAffinita, IdAffinita | null]; // null = con qualsiasi altro stato
  colore: string;
  coloreNome: number; // colore del nome che compare sul campo
  effetto(): string;
}

/** Nello stesso ordine dei numeri delle reazioni in orda.ts (ECLISSI = 1, RIVELAZIONE, ESORCISMO, INTERRAMENTO). */
export const INFO_REAZIONI: InfoReazione[] = [
  { nome: 'Eclissi', stati: ['luce', 'ombra'], coloreNome: REAZIONI.etichetta.colori.eclissi, colore: REAZIONI.eclissi.colore, effetto: () => 'esplosione intorno al nemico' },
  { nome: 'Rivelazione', stati: ['luce', 'sacro'], coloreNome: REAZIONI.etichetta.colori.rivelazione, colore: REAZIONI.rivelazione.colore, effetto: () => `anime ×${REAZIONI.rivelazione.anime}` },
  { nome: 'Esorcismo', stati: ['sacro', 'ombra'], coloreNome: REAZIONI.etichetta.colori.esorcismo, colore: REAZIONI.esorcismo.colore, effetto: () => `${REAZIONI.esorcismo.fiammelle} fiammelle inseguono i vicini` },
  { nome: 'Interramento', stati: ['terra', null], coloreNome: REAZIONI.etichetta.colori.interramento, colore: REAZIONI.interramento.colore, effetto: () => `fermo ${virgola(REAZIONI.interramento.fermo)} s e +${percento(REAZIONI.interramento.danno)} danno subito` },
];

/** La reazione tra due affinità diverse. */
export function reazioneTra(a: IdAffinita, b: IdAffinita): InfoReazione | undefined {
  if (a === b) return undefined;
  return INFO_REAZIONI.find((r) => r.stati[1] === null ? r.stati[0] === a || r.stati[0] === b : r.stati.includes(a) && r.stati.includes(b));
}

/** Nomi dei numeri delle armi sulle strisce; meglioBasso = scendere è un miglioramento. */
export const CAMPI_ARMA: Record<string, { nome: string; unita?: string; meglioBasso?: boolean }> = {
  danno: { nome: 'Danno' },
  ricarica: { nome: 'Ricarica', unita: ' s', meglioBasso: true },
  quantita: { nome: 'Quantità' },
  raggio: { nome: 'Area' },
  ampiezza: { nome: 'Ampiezza' },
  lunghezza: { nome: 'Portata' },
  durata: { nome: 'Durata', unita: ' s' },
  trapassa: { nome: 'Trapassa' },
  giri: { nome: 'Giri' },
  rimbalzi: { nome: 'Rimbalzi' },
  anime: { nome: 'Anime' },
};

/** Il dato principale di ogni dono passivo a un dato livello. */
const piu = (v: number): string => `+${percento(v)}`;
const meno = (v: number): string => `−${percento(v)}`;
export const DATI_DONI: Record<IdDono, (q: Passivo, l: number) => { nome: string; valore: string }[]> = {
  cuoreDiCera: (q, l) => [{ nome: 'Salute', valore: `+${q.per * l}` }],
  saleNero: (q, l) => [{ nome: 'Danno', valore: piu(q.per * l) }],
  clessidra: (q, l) => [{ nome: 'Ricarica', valore: meno(q.per * l) }],
  stoppinoLungo: (q, l) => [{ nome: 'Area', valore: piu(q.per * l) }],
  aliDiFalena: (q, l) => [{ nome: 'Velocità', valore: piu(q.per * l) }],
  calamita: (q, l) => [{ nome: 'Raccolta', valore: piu(q.per * l) }, { nome: 'Anime', valore: piu((q.anime ?? 0) * l) }],
  erbeAmare: (q, l) => [{ nome: 'Salute/s', valore: `+${virgola(q.per * l)}` }],
  scudoDiFerro: (q, l) => [{ nome: 'Danno subito', valore: meno(q.per * l) }],
  specchio: (q, l) => [{ nome: 'Quantità', valore: `+${q.per * l}` }],
  ceraVotiva: (q, l) => [{ nome: 'Durata', valore: piu(q.per * l) }],
  chiodoDiBara: (q, l) => [{ nome: 'Critico', valore: percento(q.per * l) }],
  lacrimaDiLumen: (q, l) => [{ nome: 'Sorsi', valore: `+${q.per * l}` }],
  campanellaDArgento: (q, l) => [{ nome: 'Schivata', valore: `+${virgola(q.per * l)} s` }],
};

/** Che cosa fa ogni dono, in parole: i numeri stanno già nei dati grandi. */
export const SPIEGA_DONI: Record<IdDono, string> = {
  cuoreDiCera: 'Più salute massima.',
  saleNero: 'Tutte le armi fanno più male.',
  clessidra: 'Tutte le armi colpiscono più spesso.',
  stoppinoLungo: 'Più grandi raggi, archi, nubi, pozze, abilità e alone di luce.',
  aliDiFalena: 'Cammini più veloce.',
  calamita: 'Raccogli da più lontano e trovi più anime.',
  erbeAmare: 'Ti curi da solo, piano piano.',
  scudoDiFerro: 'Ogni colpo pesa meno.',
  specchio: '+1 proiettile, nube, fiala, fuoco o falce.',
  ceraVotiva: 'Nubi, pozze, abilità e stati durano di più.',
  chiodoDiBara: 'Ogni colpo può fare il doppio del danno.',
  lacrimaDiLumen: 'Una fiaschetta più capiente, subito piena di un sorso.',
  campanellaDArgento: 'Più tempo per la Grazia: uscire dai cerchi rossi all\'ultimo istante è più facile.',
};

/** Un bonus in percentuale con il suo segno, per le statistiche nella pausa: «+10%», «−14%», «0%». */
export const segnoPercento = (v: number): string => (Math.abs(v) < 0.0005 ? '0%' : v > 0 ? `+${percento(v)}` : `−${percento(-v)}`);

/** Nella pausa c'è spazio per parole più chiare di quelle corte delle strisce. Da rivedere. */
export const NOMI_CHIARI: Record<string, string> = { Ricarica: 'Attesa colpi', Quantità: 'Colpi', Durata: 'Durata zone' };
export const NOME_COLPI_IN_PIU = 'Colpi extra'; // la Quantità come bonus: Specchio e Specchio rotto
export const chiaro = (nome: string): string => NOMI_CHIARI[nome] ?? nome;

export const AFFINITA_TUTTE = Object.keys(INFO_AFFINITA) as IdAffinita[];
