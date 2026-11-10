/*
 * Voti (decisione di Edoardo del 10/11): uno per personaggio, sempre attivo, legato alla sua affinità.
 * Si legge nella scheda del personaggio (menu) e nella pausa (scheda Stati). Nomi e numeri da rivedere.
 * Ogni modifica qui va riportata anche nel GDD.
 */
import type { IdAffinita } from './stati';

export interface Voto {
  nome: string;
  affinita: IdAffinita;
  testo: string; // nella scheda e nella pausa
}

export const NUMERI_VOTI = {
  quieteAlone: 1.5, // Lampionaio: dentro l'alone di luce la quiete dopo una reazione dura questi secondi (invece di STATI_CERTI.quiete)
  dannoFermi: 0.4, // Becchino: danno in più ai nemici fermi (sepolti, interrati, fermati da Campana, Vanga o Sepoltura)
  consacratiDanno: 0.2, // Badessa: i nemici consacrati fanno questa parte di danno in meno
  pesoAffinita: 1.3, // tra le carte, le armi nuove dell'affinità del personaggio pesano 1,3 invece di 1
} as const;

const N = NUMERI_VOTI;
const pct = (v: number): string => `${Math.round(v * 100)}%`;
const s = (v: number): string => String(v).replace('.', ',');

export const VOTI: Record<string, Voto> = {
  lampionaio: { nome: 'Voto della Luce', affinita: 'luce', testo: `Dentro l'alone di luce, dopo una reazione il nemico può reagire di nuovo dopo ${s(N.quieteAlone)} s invece di 3.` },
  becchino: { nome: 'Voto della Terra', affinita: 'terra', testo: `+${pct(N.dannoFermi)} danno ai nemici fermi: sepolti, interrati, fermati da Campana, Vanga o Sepoltura.` },
  badessa: { nome: 'Voto del Sacro', affinita: 'sacro', testo: `I nemici consacrati ti fanno il ${pct(N.consacratiDanno)} di danno in meno.` },
  strega: { nome: "Voto dell'Ombra", affinita: 'ombra', testo: 'Nelle reazioni il Maledetto non si consuma: gli altri stati sì.' },
};
