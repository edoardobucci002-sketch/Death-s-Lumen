/*
 * Scritte a pixel con Tiny5, sempre in maiuscolo, per i testi dentro gli elementi disegnati (pulsanti, nastri, titoli).
 * Scelto da Edoardo il 3/11/2026 (Jacquard 12 si leggeva poco). Il carattere è disegnato su una griglia:
 * 1 pixel della lettera = 1/8 della sua grandezza, maiuscole alte 5.
 * Nei pulsanti (×3) e nei nastri (×2) un pixel della lettera è grande come un pixel del disegno.
 * Ogni scritta si disegna su una piccola tela a 1 pixel per pixel della lettera, con i bordi tagliati netti,
 * poi si ingrandisce di un numero intero di volte come gli sprite: niente sfumature, niente mezzi pixel.
 */
import type { Riquadro } from '../data/hud';
import { misura, posa, scriviIn, type MisureHud } from './arte';

const FONT = '400 8px "Tiny5"';
const ALTO = 8; // la tela: 7 sopra la linea di base, 1 sotto
const BASE = 7;
const MAIUSCOLE = 5;
const maiuscolo = (t: string): string => t.toLocaleUpperCase('it');

/** Da chiamare all'avvio: senza il carattere caricato la tela uscirebbe con quello di riserva. */
export const caricaScritte = (): Promise<unknown> => document.fonts.load(FONT).catch(() => undefined);

const misuratore = document.createElement('canvas').getContext('2d')!;

/** Larghezza della scritta in pixel della lettera. */
function larghezza(testo: string): number {
  misuratore.font = FONT;
  return Math.ceil(misuratore.measureText(maiuscolo(testo)).width);
}

/** Il più grande ingrandimento (fino a kMax) per cui la scritta sta nel riquadro; 0 se non ci sta neanche a 1. */
export function scalaScritta(testo: string, r: Riquadro, z: number, kMax: number): number {
  const w = larghezza(testo) + 1;
  for (let k = kMax; k >= 1; k--) if (w * k <= r.l * z && MAIUSCOLE * k <= (r.a + 1) * z) return k;
  return 0;
}

/** La tela della scritta, con un'ombra di un pixel sotto se serve (per i testi su fondo scuro). */
export function tela(testo: string, colore: string, ombra: string | null): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = larghezza(testo) + 1;
  c.height = ALTO + 1;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  const passate: [string, number][] = ombra ? [[ombra, 1], [colore, 0]] : [[colore, 0]];
  for (const [col, dy] of passate) {
    const t = document.createElement('canvas');
    t.width = c.width;
    t.height = c.height;
    const x = t.getContext('2d', { willReadFrequently: true })!;
    x.font = FONT;
    x.fillStyle = col;
    x.fillText(maiuscolo(testo), 0, BASE + dy);
    const d = x.getImageData(0, 0, t.width, t.height);
    for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
    x.putImageData(d, 0, 0);
    g.drawImage(t, 0, 0);
  }
  return c;
}

/** La scritta con un contorno pieno di un pixel: si legge sopra qualsiasi sfondo (nomi delle reazioni). */
export function telaContorno(testo: string, colore: string, bordo: string): HTMLCanvasElement {
  const t = tela(testo, colore, null);
  const c = document.createElement('canvas');
  c.width = t.width + 2;
  c.height = t.height + 2;
  const g = c.getContext('2d')!;
  const d = t.getContext('2d')!.getImageData(0, 0, t.width, t.height);
  g.fillStyle = bordo;
  for (let y = 0; y < t.height; y++) {
    for (let x = 0; x < t.width; x++) if (d.data[(y * t.width + x) * 4 + 3]) g.fillRect(x, y, 3, 3);
  }
  g.drawImage(t, 1, 1);
  return c;
}

/**
 * Scrive dentro el (posizionato in un'arte ingrandita z volte) centrata nel riquadro r, ingrandita k volte.
 * Le maiuscole stanno al centro del riquadro.
 */
export function scriviPixel(el: HTMLElement, testo: string, r: Riquadro, z: number, k: number, m: MisureHud, colore: string, ombra: string | null = null, sinistra = false): void {
  const c = tela(testo, colore, ombra);
  c.className = 'scritta';
  el.replaceChildren(c);
  el.setAttribute('aria-label', testo);
  el.style.overflow = 'visible';
  posa(el, 0, 0, m);
  misura(el, 0, 0, z, m);
  const x = sinistra ? r.x * z : Math.round(r.x * z + (r.l * z - c.width * k) / 2);
  const y = Math.round(r.y * z + (r.a * z) / 2 - (BASE - MAIUSCOLE / 2) * k);
  posa(c, x, y, m);
  misura(c, c.width, c.height, k, m);
}

/** Cambia la scritta di un elemento; la disegna chi lo dispone (scriviNel). */
export function scritta(el: Element, testo: string): void {
  (el as HTMLElement).dataset.testo = testo;
  el.textContent = testo;
}

/**
 * Scrive il testo dell'elemento nel riquadro r con Tiny5, ingrandito al massimo kMax volte.
 * Se non ci sta neanche a 1, torna al carattere del CSS rimpicciolito (scriviIn), grande al massimo «riserva».
 * Restituisce l'ingrandimento usato (0 = carattere di riserva).
 */
export function scriviNel(el: HTMLElement, r: Riquadro, z: number, kMax: number, m: MisureHud, riserva: number, ombra: string | null = null, sinistra = false): number {
  const testo = el.dataset.testo ?? el.textContent ?? '';
  el.dataset.testo = testo;
  const k = scalaScritta(testo, r, z, kMax);
  if (k) {
    scriviPixel(el, testo, r, z, k, m, getComputedStyle(el).color, ombra, sinistra);
    return k;
  }
  el.replaceChildren(testo);
  el.style.overflow = '';
  scriviIn(el, r, z, riserva, m);
  return 0;
}
