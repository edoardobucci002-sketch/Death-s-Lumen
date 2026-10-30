/*
 * Pixel perfect: il mondo si disegna a bassa risoluzione e il browser lo ingrandisce
 * di un numero INTERO di pixel fisici dello schermo, senza sfumature.
 * ALTEZZA_MINIMA è quanti pixel di gioco devono stare almeno in verticale.
 */
export const ALTEZZA_MINIMA = 300;
export const LARGHEZZA_MINIMA = 260;

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
  const scala = Math.max(1, Math.floor(Math.min(fisA / ALTEZZA_MINIMA, fisL / LARGHEZZA_MINIMA)));
  return {
    larghezza: Math.ceil(fisL / scala),
    altezza: Math.ceil(fisA / scala),
    zoom: scala / dpr,
    scala,
  };
}
