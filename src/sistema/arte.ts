/*
 * Arte dell'HUD: gli elementi disegnati da Edoardo (HUD/ → public/assets/hud) pronti per l'interfaccia HTML,
 * e le misure per metterli a pixel interi: ogni pixel disegnato = k pixel di gioco = k × scala pixel dello schermo.
 * Le posizioni si danno sempre in pixel di gioco interi (posa), mai centrando con il CSS, che lascerebbe mezzi pixel.
 */
import type Phaser from 'phaser';
import { GRUPPI_PARTITA, INGRANDIMENTO, PUNTI_MINIMI_PARTITA, PUNTI_MINIMI_PER_PIXEL, SENZA_RADDOPPIO, type Riquadro } from '../data/hud';
import { calcolaMisure } from './pixel';

interface R4 { x: number; y: number; w: number; h: number }
interface DatiAseprite { frames: { frame: R4; spriteSourceSize: R4; sourceSize: { w: number; h: number } }[] }

export interface Arte {
  url: string;
  w: number; // pixel disegnati, tela intera di Aseprite
  h: number;
  tela: HTMLCanvasElement; // il primo fotogramma
  fotogrammi: HTMLCanvasElement[]; // tutti, nell'ordine di Aseprite (per esempio la fiaschetta piena, 2/3, 1/3, vuota)
}

const arti = new Map<string, Arte>();

/** Prepara i fotogrammi di ogni sprite (già caricato da Phaser) come immagini intere, con i margini. */
export function preparaArte(scena: Phaser.Scene, chiavi: string[]): void {
  for (const k of chiavi) {
    if (arti.has(k) || !scena.textures.exists(k)) continue;
    const img = scena.textures.get(k).getSourceImage() as HTMLImageElement;
    const fotogrammi = (scena.cache.json.get(k) as DatiAseprite).frames.map((f) => {
      const c = document.createElement('canvas');
      c.width = f.sourceSize.w;
      c.height = f.sourceSize.h;
      c.getContext('2d')!.drawImage(img, f.frame.x, f.frame.y, f.frame.w, f.frame.h, f.spriteSourceSize.x, f.spriteSourceSize.y, f.frame.w, f.frame.h);
      return c;
    });
    const c = fotogrammi[0];
    arti.set(k, { url: c.toDataURL(), w: c.width, h: c.height, tela: c, fotogrammi });
  }
}

export const arte = (k: string): Arte | undefined => arti.get(k);

export interface MisureHud {
  W: number; // pixel di gioco
  H: number;
  px: number; // punti dello schermo (CSS) per pixel di gioco
  scala: number;
  dpr: number;
  safe: { a: number; b: number; s: number; d: number }; // safe area in pixel di gioco, arrotondata in su
  raddoppioPartita: number; // come raddoppio, ma per l'HUD della partita (soglia più alta)
  raddoppio: number; // 2 dove un pixel di gioco è troppo piccolo per il dito (scala ×1), altrimenti 1
}

let sonda: HTMLElement | null = null;

/** Misure di adesso: le stesse del gioco (pixel.ts) più la safe area del telefono. */
export function misureHud(): MisureHud {
  const m = calcolaMisure();
  const dpr = window.devicePixelRatio || 1;
  if (!sonda) {
    sonda = document.createElement('div');
    sonda.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.append(sonda);
  }
  const st = getComputedStyle(sonda);
  const p = (v: string): number => Math.ceil((parseFloat(v) * dpr) / m.scala - 1e-6);
  return {
    W: m.larghezza, H: m.altezza, px: m.zoom, scala: m.scala, dpr,
    safe: { a: p(st.paddingTop), b: p(st.paddingBottom), s: p(st.paddingLeft), d: p(st.paddingRight) },
    raddoppioPartita: Math.max(1, Math.ceil(PUNTI_MINIMI_PARTITA / (m.scala / dpr) - 1e-9)),
    raddoppio: Math.max(1, Math.ceil(PUNTI_MINIMI_PER_PIXEL / (m.scala / dpr) - 1e-9)),
  };
}

/** Ingrandimento di un gruppo di elementi su questo telefono (vedi INGRANDIMENTO in data/hud.ts). */
export const ingr = (gruppo: string, m: MisureHud): number => (INGRANDIMENTO[gruppo] ?? 1) * (SENZA_RADDOPPIO.includes(gruppo) ? 1 : GRUPPI_PARTITA.includes(gruppo) ? m.raddoppioPartita : m.raddoppio);

/** Dove l'HUD può stare: la safe area più 6 pixel di respiro (come nella bozza). */
export const bordiHud = (m: MisureHud): { a: number; b: number; s: number; d: number } => ({ a: m.safe.a + 6, b: m.safe.b + 6, s: m.safe.s + 6, d: m.safe.d + 6 });

/** Mette un elemento in (x, y) pixel di gioco, interi. */
export function posa(el: HTMLElement, x: number, y: number, m: MisureHud): void {
  el.style.left = `${Math.round(x) * m.px}px`;
  el.style.top = `${Math.round(y) * m.px}px`;
}

/** Dà a un elemento la misura di un'arte ingrandita z volte (o quella indicata, in pixel disegnati). */
export function misura(el: HTMLElement, w: number, h: number, z: number, m: MisureHud): void {
  el.style.width = `${w * z * m.px}px`;
  el.style.height = `${h * z * m.px}px`;
}

/** Un'immagine dell'HUD; la misura la mette chi la usa (misura), perché dipende dal telefono. */
export function immagine(chiave: string, classe = ''): HTMLImageElement {
  const im = document.createElement('img');
  im.alt = '';
  im.draggable = false;
  im.className = `arte ${classe}`.trim();
  const a = arte(chiave);
  if (a) im.src = a.url;
  return im;
}

/** Il più grande ingrandimento intero, non oltre quello proposto, per cui una schermata ci sta. */
export function adattaZoom(z: number, ciSta: (k: number) => boolean): number {
  let k = z;
  while (k > 1 && !ciSta(k)) k--;
  return k;
}

/** Retino scuro (Bayer 4×4) per oscurare il gioco dietro pausa, doni e fine: niente trasparenze. */
export function retino(livello: number): string {
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = '#050403';
  B.forEach((b, i) => { if (b < livello) g.fillRect(i % 4, i >> 2, 1, 1); });
  return c.toDataURL();
}

/** Mette un testo dentro un riquadro di un'arte ingrandita z volte; rimpicciolisce il carattere finché ci sta. */
export function scriviIn(el: HTMLElement, r: Riquadro, z: number, grandezza: number, m: MisureHud): void {
  posa(el, r.x * z, r.y * z, m);
  misura(el, r.l, r.a, z, m);
  let g = grandezza * z;
  el.style.fontSize = `${g * m.px}px`;
  // misura con il testo allineato a sinistra: centrato, metà di ciò che sborda non si vedrebbe nella misura
  const allinea = el.style.justifyContent;
  el.style.justifyContent = 'flex-start';
  while (g > 5 && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) {
    g -= 0.5;
    el.style.fontSize = `${g * m.px}px`;
  }
  el.style.justifyContent = allinea;
}
