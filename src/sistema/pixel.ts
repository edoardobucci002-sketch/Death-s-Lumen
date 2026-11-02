/*
 * Pixel perfect: il mondo si disegna a bassa risoluzione e il browser lo ingrandisce
 * di un numero INTERO di pixel fisici dello schermo, senza sfumature.
 * ALTEZZA_MINIMA e LARGHEZZA_MINIMA sono quanti pixel di gioco vorremmo vedere (proporzioni della v0:
 * personaggio ≈ 1/9 del lato corto). La scala intera scelta è la più VICINA a quella ideale, non per
 * forza quella che li fa stare tutti: su un telefono da 1170 pixel fisici di larghezza si vede un po' meno.
 */
export const ALTEZZA_MINIMA = 700;
export const LARGHEZZA_MINIMA = 610;

export interface Misure {
  larghezza: number; // pixel di gioco
  altezza: number;
  zoom: number; // fattore CSS (pixel fisici per pixel di gioco / devicePixelRatio)
  scala: number; // pixel fisici per pixel di gioco, sempre intero
}

export function calcolaMisure(): Misure {
  const dpr = window.devicePixelRatio || 1;
  const fisL = Math.round(window.innerWidth * dpr);
  const fisA = Math.round(window.innerHeight * dpr);
  const scala = Math.max(1, Math.round(Math.min(fisA / ALTEZZA_MINIMA, fisL / LARGHEZZA_MINIMA)));
  return {
    larghezza: Math.ceil(fisL / scala),
    altezza: Math.ceil(fisA / scala),
    zoom: scala / dpr,
    scala,
  };
}
