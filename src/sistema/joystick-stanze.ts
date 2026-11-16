/*
 * I joystick del gioco a stanze (decisione di Edoardo del 13/11), disegnati dal codice a pixel interi, senza sfumature:
 * - movimento: un anello sottile color crema con il contorno scuro e un pomello pieno color crema, neutro;
 * - attacco: un disco nel colore del personaggio (più scuro dentro) con una fiammella come pomello.
 * Si registrano come «arte» (come i disegni di Edoardo) e si usano con immagine() e arte(). Misure in JOYSTICK_STANZE.
 * I file di Edoardo Joystick_Base e Joystick_Pomello restano al survivor.
 */
import { JOYSTICK_STANZE } from '../data/stanze';
import { registraArte } from './arte';

export const ARTE_JOYSTICK = {
  movimentoBase: 'Stanze_Joystick_Movimento',
  movimentoPomello: 'Stanze_Pomello_Movimento',
  attaccoBase: 'Stanze_Joystick_Attacco',
  attaccoPomello: 'Stanze_Pomello_Attacco',
} as const;

type Pixel = (x: number, y: number) => string | null;

/** Una tela quadrata di lato l: per ogni pixel, il colore che dice «colore» (null = trasparente). */
function tela(l: number, colore: Pixel): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = l;
  const g = c.getContext('2d')!;
  for (let y = 0; y < l; y++) {
    for (let x = 0; x < l; x++) {
      const k = colore(x, y);
      if (!k) continue;
      g.fillStyle = k;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** Distanza del centro del pixel (x, y) dal centro di una tela di lato l. */
const dal = (x: number, y: number, l: number): number => Math.hypot(x + 0.5 - l / 2, y + 0.5 - l / 2);

/** Mescola un colore '#rrggbb' con il nero (f = quanto resta del colore). */
function scurisci(h: string, f: number): string {
  const n = parseInt(h.slice(1), 16);
  const c = (v: number): string => Math.round(v * f).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/** Mescola due colori '#rrggbb' (f = quanto resta del primo). */
function mescola(a: string, b: string, f: number): string {
  const n = parseInt(a.slice(1), 16), m = parseInt(b.slice(1), 16);
  const c = (s: number): string => Math.round(((n >> s) & 255) * f + ((m >> s) & 255) * (1 - f)).toString(16).padStart(2, '0');
  return `#${c(16)}${c(8)}${c(0)}`;
}

/** Il lato del pixel rispetto alla luce (in alto a sinistra): > 0 in luce, < 0 in ombra. */
const luce = (x: number, y: number, l: number): number => -(x + 0.5 - l / 2) - (y + 0.5 - l / 2);

/** Prepara le quattro arti dei joystick; il disco dell'attacco prende il colore del personaggio. */
export function preparaJoystickStanze(coloreAttacco: string): void {
  const J = JOYSTICK_STANZE, C = J.colori, B = J.base, P = J.pomello, rb = B / 2, rp = P / 2;
  const cremaLuce = mescola(C.crema, '#ffffff', 0.55), cremaOmbra = scurisci(C.crema, 0.72);
  // movimento: anello crema con il contorno scuro dentro e fuori, in luce in alto a sinistra e in ombra in basso a destra
  registraArte(ARTE_JOYSTICK.movimentoBase, tela(B, (x, y) => {
    const d = dal(x, y, B);
    if (d > rb) return null;
    if (d > rb - 1) return C.bordo;
    if (d > rb - 1 - J.anello) {
      const l = luce(x, y, B) / rb;
      return l > 0.55 ? cremaLuce : l < -0.55 ? cremaOmbra : C.crema;
    }
    if (d > rb - 2 - J.anello) return C.bordo;
    return null;
  }));
  // pomello del movimento: tondo pieno crema, un riflesso in alto a sinistra e l'ombra in basso a destra
  registraArte(ARTE_JOYSTICK.movimentoPomello, tela(P, (x, y) => {
    const d = dal(x, y, P);
    if (d > rp) return null;
    if (d > rp - 1) return C.bordo;
    if (Math.hypot(x + 0.5 - rp + 5, y + 0.5 - rp + 5) < 2.5) return cremaLuce;
    const ombra = Math.hypot(x + 0.5 - rp + 3, y + 0.5 - rp + 3) > rp - 1;
    return ombra ? cremaOmbra : C.crema;
  }));
  // attacco: disco pieno; il bordo nel colore del personaggio, in luce e in ombra, una riga scura dentro, il fondo più scuro
  const bordoLuce = mescola(coloreAttacco, '#ffffff', 0.7), bordoOmbra = scurisci(coloreAttacco, 0.7);
  const fondo = scurisci(coloreAttacco, 0.5), riga = scurisci(coloreAttacco, 0.32);
  registraArte(ARTE_JOYSTICK.attaccoBase, tela(B, (x, y) => {
    const d = dal(x, y, B);
    if (d > rb) return null;
    if (d > rb - 1) return C.bordo;
    if (d > rb - 1 - J.anello) {
      const l = luce(x, y, B) / rb;
      return l > 0.55 ? bordoLuce : l < -0.55 ? bordoOmbra : coloreAttacco;
    }
    if (d > rb - 2 - J.anello) return riga;
    return fondo;
  }));
  // pomello dell'attacco: tondo ambra con il bordo chiaro e una fiammella a tre colori (brace, fiamma, cuore)
  const ambra = mescola(coloreAttacco, '#ffffff', 0.82), ambraLuce = mescola(coloreAttacco, '#ffffff', 0.5);
  registraArte(ARTE_JOYSTICK.attaccoPomello, tela(P, (x, y) => {
    const d = dal(x, y, P);
    if (d > rp) return null;
    const fiamma = (sx: number, sy: number, k: number): boolean => {
      // la parte bassa è un cerchio, quella alta si stringe fino alla punta
      const cx = rp, cy = rp + 3 * k, r = 7 * k, punta = rp - 11 * k;
      const px = sx + 0.5, py = sy + 0.5;
      if (py >= cy) return Math.hypot(px - cx, py - cy) <= r;
      if (py < punta) return false;
      return Math.abs(px - cx) <= r * ((py - punta) / (cy - punta)) ** 0.8;
    };
    if (d > rp - 1) return C.bordo;
    if (fiamma(x, y, 0.42)) return C.cuore;
    if (fiamma(x, y, 0.72)) return C.fiamma;
    if (fiamma(x, y, 0.95)) return C.brace;
    if (d > rp - 2) return ambraLuce;
    return ambra;
  }));
}
