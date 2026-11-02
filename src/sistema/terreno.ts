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
  for (let i = 0; i < (lato * lato) / 90; i++) r(caso.intero(0, lato - 2), caso.intero(0, lato - 1), caso.intero(1, 2), 1, c.macchia);

  for (let y = 0; y < lato; y += cella) {
    for (let x = 0; x < lato; x += cella) {
      const p = caso.numero();
      const sx = x + caso.intero(2, 6);
      const sy = y + caso.intero(2, 5);
      if (p < TERRENO.tombe) {
        r(sx - 1, sy + 14, 12, 2, c.ombra);
        r(sx + 1, sy, 8, 2, c.pietra);
        r(sx, sy + 2, 10, 12, c.pietra);
        r(sx + 1, sy + 1, 6, 1, c.pietraLuce);
        r(sx, sy + 3, 1, 10, c.pietraLuce);
        r(sx + 3, sy + 5, 4, 1, c.ombra);
      } else if (p < TERRENO.tombe + TERRENO.croci) {
        r(sx + 1, sy + 15, 9, 2, c.ombra);
        r(sx + 4, sy, 3, 16, c.croce);
        r(sx, sy + 4, 11, 3, c.croce);
      } else if (p < TERRENO.tombe + TERRENO.croci + TERRENO.erba) {
        r(sx + 2, sy + 9, 1, 3, c.erba);
        r(sx, sy + 10, 1, 2, c.erba);
        r(sx + 4, sy + 8, 1, 4, c.erba);
      }
    }
  }
  tela.refresh();
}
