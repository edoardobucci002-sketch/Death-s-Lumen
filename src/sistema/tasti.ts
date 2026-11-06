/*
 * Pulsanti disegnati (Pulsante_Acceso, _Scuro, …) con la scritta in Tiny5 al centro della loro targhetta:
 * li usano la pausa e la schermata di fine, a pixel interi.
 */
import { INTERNI, TESTI } from '../data/hud';
import { arte, immagine, misura, posa, type MisureHud } from './arte';
import { scalaScritta, scritta, scriviNel } from './scritte';

const MAX_SCRITTA_PULSANTI = 3; // pixel di gioco per pixel della lettera nei pulsanti: come i pixel del pulsante (×3)
const OMBRA = '#000'; // ombra di un pixel sotto le scritte chiare su fondo scuro
/** Pulsante chiaro (pergamena): scritta scura, senza ombra. Sugli altri, anche l'arancio, scritta chiara con l'ombra. */
const chiaro = (arte: string): boolean => arte === 'Pulsante_Chiaro';

export function tasto(chiave: string, testo: string, dati: Record<string, string>): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'hud-tasto';
  b.dataset.arte = chiave;
  Object.assign(b.dataset, dati);
  const s = document.createElement('span');
  scritta(s, testo);
  b.append(immagine(chiave), s);
  return b;
}

/** Tutte le scritte di un gruppo di pulsanti con lo stesso ingrandimento: quello della più lunga. */
export function scalaTasti(tasti: HTMLElement[], z: number): number {
  return Math.min(...tasti.map((t) => {
    const r = INTERNI[t.dataset.arte!]?.testo;
    return (r && scalaScritta((t.lastElementChild as HTMLElement).dataset.testo ?? '', r, z, MAX_SCRITTA_PULSANTI)) || MAX_SCRITTA_PULSANTI;
  }));
}

/** Mette il pulsante in (x, y) dentro il suo contenitore; riga: altezza che si tocca, in pixel di gioco. */
export function disponiTasto(t: HTMLElement, x: number, y: number, z: number, riga: number, k: number, m: MisureHud): void {
  const a = arte(t.dataset.arte!);
  if (!a) return;
  posa(t, x, y, m);
  misura(t, a.w, riga / z, z, m);
  const im = t.firstElementChild as HTMLElement;
  misura(im, a.w, a.h, z, m);
  im.style.top = `${Math.round((riga - a.h * z) / 2) * m.px}px`;
  const s = t.lastElementChild as HTMLElement, r = INTERNI[t.dataset.arte!]?.testo ?? { x: 0, y: 0, l: a.w, a: a.h };
  scriviNel(s, { ...r, y: r.y + Math.round((riga / z - a.h) / 2) }, z, k, m, TESTI.pulsante, chiaro(t.dataset.arte!) ? null : OMBRA);
}
