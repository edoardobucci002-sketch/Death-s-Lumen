/*
 * Telefoni su cui la bozza prova l'HUD: misure dello schermo in punti (CSS, in verticale), pixel fisici per punto
 * e safe area (zone coperte da tacca, isola, foro della fotocamera, barra dei gesti), anche in orizzontale.
 * Da qui la bozza calcola i pixel di gioco con la stessa regola del gioco (src/sistema/pixel.ts).
 */
import { ALTEZZA_MINIMA, LARGHEZZA_MINIMA } from '../sistema/pixel';

export interface Bordi { a: number; b: number; s: number; d: number } // alto, basso, sinistra, destra

export interface Telefono {
  id: string;
  nome: string;
  l: number; // larghezza in punti, in verticale
  a: number; // altezza in punti, in verticale
  dpr: number; // pixel fisici per punto
  verticale: Bordi; // safe area in punti
  orizzontale: Bordi;
  taglio: 'isola' | 'tacca' | 'foro' | 'nessuno';
}

export const TELEFONI: Telefono[] = [
  { id: 'iphone-se', nome: 'iPhone SE', l: 375, a: 667, dpr: 2, verticale: { a: 20, b: 0, s: 0, d: 0 }, orizzontale: { a: 0, b: 0, s: 0, d: 0 }, taglio: 'nessuno' },
  { id: 'iphone-13', nome: 'iPhone 13', l: 390, a: 844, dpr: 3, verticale: { a: 47, b: 34, s: 0, d: 0 }, orizzontale: { a: 0, b: 21, s: 47, d: 47 }, taglio: 'tacca' },
  { id: 'iphone-15-pro-max', nome: 'iPhone 15 Pro Max', l: 430, a: 932, dpr: 3, verticale: { a: 59, b: 34, s: 0, d: 0 }, orizzontale: { a: 0, b: 21, s: 59, d: 59 }, taglio: 'isola' },
  { id: 'galaxy-s25', nome: 'Galaxy S25 (Edoardo)', l: 384, a: 832, dpr: 2.8125, verticale: { a: 32, b: 24, s: 0, d: 0 }, orizzontale: { a: 0, b: 24, s: 32, d: 0 }, taglio: 'foro' },
  { id: 'pixel-7', nome: 'Pixel 7', l: 412, a: 915, dpr: 2.625, verticale: { a: 40, b: 24, s: 0, d: 0 }, orizzontale: { a: 0, b: 24, s: 40, d: 0 }, taglio: 'foro' },
  { id: 'android-piccolo', nome: 'Android piccolo (720×1560)', l: 360, a: 780, dpr: 2, verticale: { a: 28, b: 24, s: 0, d: 0 }, orizzontale: { a: 0, b: 24, s: 28, d: 0 }, taglio: 'foro' },
  { id: 'ipad-mini', nome: 'iPad mini', l: 744, a: 1133, dpr: 2, verticale: { a: 24, b: 20, s: 0, d: 0 }, orizzontale: { a: 24, b: 20, s: 0, d: 0 }, taglio: 'nessuno' },
];

export interface MisureTelefono {
  W: number; // pixel di gioco
  H: number;
  scala: number; // pixel fisici per pixel di gioco
  dpr: number;
  safe: Bordi; // safe area in pixel di gioco
}

/** Stessa regola di calcolaMisure() in src/sistema/pixel.ts, ma per un telefono dell'elenco. */
export function misureTelefono(t: Telefono, orientamento: 'verticale' | 'orizzontale'): MisureTelefono {
  const ver = orientamento === 'verticale';
  const fisL = Math.round((ver ? t.l : t.a) * t.dpr), fisA = Math.round((ver ? t.a : t.l) * t.dpr);
  const scala = Math.max(1, Math.round(Math.min(fisA / ALTEZZA_MINIMA, fisL / LARGHEZZA_MINIMA)));
  const s = t[orientamento], p = (v: number): number => Math.ceil((v * t.dpr) / scala);
  return { W: Math.ceil(fisL / scala), H: Math.ceil(fisA / scala), scala, dpr: t.dpr, safe: { a: p(s.a), b: p(s.b), s: p(s.s), d: p(s.d) } };
}
