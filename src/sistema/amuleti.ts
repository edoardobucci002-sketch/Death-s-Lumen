/*
 * Icone provvisorie degli amuleti del Rosario: un grano tondo del colore dell'amuleto (24×24 pixel, a pixel interi).
 * Finché Edoardo non disegna le sue (`Icona_Amuleto_<id>`), il gioco usa queste.
 */
import { AMULETI } from '../data/rosario';
import { arte, registraArte } from './arte';

export const iconaAmuleto = (id: string): string => `Icona_Amuleto_${id}`;

export function creaIconeAmuleti(): void {
  for (const a of AMULETI) {
    const k = iconaAmuleto(a.id);
    if (arte(k)) continue;
    const t = document.createElement('canvas');
    t.width = t.height = 24;
    const g = t.getContext('2d')!;
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 12);
        if (d > 10) continue;
        // bordo scuro, corpo del colore dell'amuleto, riflesso chiaro in alto a sinistra
        g.fillStyle = d > 8.5 ? '#1b1514' : Math.hypot(x - 8, y - 8) < 2.5 ? '#ffffff' : a.colore;
        g.fillRect(x, y, 1, 1);
      }
    }
    // un puntino in più per ogni grano che costa
    g.fillStyle = '#1b1514';
    for (let n = 0; n < a.grani; n++) g.fillRect(8 + n * 3, 20, 2, 2);
    registraArte(k, t);
  }
}
