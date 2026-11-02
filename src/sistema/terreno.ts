/*
 * Terreno: disegna una volta sola un riquadro di cimitero (terra, erba, tombe, croci)
 * che si ripete senza bordi. Le cose stanno dentro la loro cella, così le giunture non si vedono.
 */
import Phaser from 'phaser';
import { TERRENO } from '../data/mondo';
import { Caso } from './caso';

export function creaTerreno(scena: Phaser.Scene, chiave: string, seme: number): void {
  if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
  const { lato, cella, colori: c } = TERRENO;
  const tela = scena.textures.createCanvas(chiave, lato, lato)!;
  const g = tela.getContext();
  const caso = new Caso(seme);
  const r = (x: number, y: number, w: number, h: number, colore: string) => {
    g.fillStyle = colore;
    g.fillRect(x, y, w, h);
  };

  r(0, 0, lato, lato, c.terra);
  // macchie di terra più chiara, per sentire il movimento anche dove non c'è niente
  for (let i = 0; i < (lato * lato) / 90; i++) r(caso.intero(0, lato - 3), caso.intero(0, lato - 2), caso.intero(1, 3), caso.intero(1, 2), c.macchia);

  // forme pensate per personaggi alti circa 80 px; ogni cosa resta dentro la sua cella
  for (let y = 0; y < lato; y += cella) {
    for (let x = 0; x < lato; x += cella) {
      const p = caso.numero();
      const sx = x + caso.intero(4, 24);
      const sy = y + caso.intero(4, 14);
      if (p < TERRENO.tombe) {
        r(sx - 2, sy + 32, 28, 4, c.ombra);
        r(sx + 4, sy, 16, 2, c.pietra);
        r(sx + 2, sy + 2, 20, 2, c.pietra);
        r(sx, sy + 4, 24, 29, c.pietra);
        r(sx + 4, sy + 1, 14, 1, c.pietraLuce);
        r(sx + 2, sy + 3, 3, 1, c.pietraLuce);
        r(sx + 1, sy + 5, 2, 26, c.pietraLuce);
        r(sx + 7, sy + 11, 10, 2, c.ombra);
        r(sx + 9, sy + 16, 6, 1, c.ombra);
        r(sx + 22, sy + 6, 2, 27, c.ombra);
      } else if (p < TERRENO.tombe + TERRENO.croci) {
        r(sx + 2, sy + 35, 22, 4, c.ombra);
        r(sx + 10, sy, 6, 37, c.croce);
        r(sx, sy + 9, 26, 6, c.croce);
        r(sx + 10, sy, 1, 37, c.pietraLuce);
        r(sx, sy + 9, 26, 1, c.pietraLuce);
      } else if (p < TERRENO.tombe + TERRENO.croci + TERRENO.erba) {
        r(sx + 4, sy + 20, 1, 7, c.erba);
        r(sx + 3, sy + 18, 1, 2, c.erba);
        r(sx, sy + 22, 1, 5, c.erba);
        r(sx + 8, sy + 19, 1, 8, c.erba);
        r(sx + 9, sy + 17, 1, 2, c.erba);
        r(sx + 12, sy + 23, 1, 4, c.erba);
      }
    }
  }
  tela.refresh();
}
