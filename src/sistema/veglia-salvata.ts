/**
 * La Veglia in corso del gioco a stanze, salvata sul dispositivo (decisioni di Edoardo del 19/11): si salva entrando in
 * ogni stanza, come un punto di controllo; si riprende dal menu con «Continua la Veglia», all'ingresso di quella stanza.
 * Uscire dalla pausa con «Menu» non la perde; cadere o battere Seth la cancella. La fotografia la fa la scena Stanze.
 */
import type { Foto } from './fotografia';

const CHIAVE = 'dl-veglia';
export const VERSIONE_VEGLIA = 1;

export interface VegliaSalvata {
  versione: number;
  personaggio: string;
  seme: number;
  stanza: number; // quante stanze combattute (per il menu)
  verso: number; // la stanza della mappa in cui si stava entrando
  da: string | null; // il muro da cui si entra
  echi: { id: string; livello: number }[];
  sistemi: Record<string, Foto>;
}

export function salvaVeglia(v: VegliaSalvata): void {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(v));
  } catch {
    // spazio pieno o salvataggi bloccati: la Veglia continua lo stesso
  }
}

export function caricaVeglia(): VegliaSalvata | null {
  try {
    const t = localStorage.getItem(CHIAVE);
    if (!t) return null;
    const v = JSON.parse(t) as VegliaSalvata;
    return v && v.versione === VERSIONE_VEGLIA ? v : null;
  } catch {
    return null;
  }
}

export function cancellaVeglia(): void {
  try {
    localStorage.removeItem(CHIAVE);
  } catch {
    // niente da fare
  }
}
