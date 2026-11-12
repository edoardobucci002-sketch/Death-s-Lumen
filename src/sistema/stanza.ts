/*
 * Stanza (gioco a stanze, segnaposto dal codice finché Edoardo non la disegna): prepara le texture del pavimento a
 * lastre e dei muri a mattoni, e le dispone intorno al pavimento. Il pavimento va da (0, 0) a (larghezza, altezza);
 * i muri stanno fuori da quel rettangolo. Tutto a pixel interi, senza sfumature.
 */
import Phaser from 'phaser';
import { STANZA } from '../data/stanze';
import { PROFONDITA } from './effetti';
import { Caso } from './caso';

const PAVIMENTO = 'stanza-pavimento';
const FACCIATA = 'stanza-facciata';
const LATO = 'stanza-lato';

type Disegna = (x: number, y: number, w: number, h: number, colore: string) => void;

function tela(scena: Phaser.Scene, chiave: string, w: number, h: number, disegna: (r: Disegna) => void): void {
  if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
  const t = scena.textures.createCanvas(chiave, w, h)!;
  const g = t.getContext();
  disegna((x, y, l, a, colore) => {
    g.fillStyle = colore;
    g.fillRect(x, y, l, a);
  });
  t.refresh();
}

/** Lastre di pietra: quattro per riquadro, ognuna con qualche macchia e una crepa ogni tanto. */
function creaPavimento(scena: Phaser.Scene): void {
  const { piastrella: p, colori: c } = STANZA;
  const lato = p * 2;
  const caso = new Caso(STANZA.seme);
  tela(scena, PAVIMENTO, lato, lato, (r) => {
    r(0, 0, lato, lato, c.pavimento);
    for (let y = 0; y < lato; y += p) {
      for (let x = 0; x < lato; x += p) {
        for (let i = 0; i < 14; i++) r(x + caso.intero(2, p - 5), y + caso.intero(2, p - 4), caso.intero(1, 3), caso.intero(1, 2), c.pavimentoChiaro);
        if (caso.numero() < 0.35) {
          let cx = x + caso.intero(8, p - 16), cy = y + caso.intero(8, p - 16);
          for (let k = 0; k < 6; k++) {
            r(cx, cy, 2, 1, c.crepa);
            cx += caso.intero(1, 3);
            cy += caso.intero(0, 2);
          }
        }
        r(x, y, p, 1, c.fuga); // fughe tra le lastre
        r(x, y, 1, p, c.fuga);
      }
    }
  });
}

/** Facciata a mattoni sfalsati (muro in alto) e pietra scura per i lati e il muro in basso. */
function creaMuri(scena: Phaser.Scene): void {
  const { mattone: m, colori: c } = STANZA;
  const caso = new Caso(STANZA.seme + 1);
  tela(scena, FACCIATA, m.l * 2, m.a * 2, (r) => {
    r(0, 0, m.l * 2, m.a * 2, c.malta);
    for (let riga = 0; riga < 2; riga++) {
      const sposta = riga ? m.l / 2 : 0;
      for (let k = -1; k < 2; k++) {
        const x = k * m.l + sposta;
        r(x + 1, riga * m.a + 1, m.l - 2, m.a - 2, c.muro);
        r(x + 1, riga * m.a + 1, m.l - 2, 1, c.mattoneChiaro);
        if (caso.numero() < 0.5) r(x + caso.intero(4, m.l - 8), riga * m.a + caso.intero(4, m.a - 5), 3, 1, c.mattoneChiaro);
      }
    }
  });
  tela(scena, LATO, 16, 16, (r) => {
    r(0, 0, 16, 16, c.lato);
    r(0, 0, 16, 1, c.malta);
    r(caso.intero(2, 10), caso.intero(3, 12), 3, 1, c.muro);
  });
}

/** Il rettangolo dove possono stare i piedi del personaggio. */
export function areaCamminabile(): { x0: number; y0: number; x1: number; y1: number } {
  const s = STANZA;
  return { x0: s.margineLati, y0: s.margineAlto, x1: s.larghezza - s.margineLati, y1: s.altezza - s.margineBasso };
}

/** Disegna pavimento e muri della stanza (sotto il personaggio e sotto il buio). */
export function creaStanza(scena: Phaser.Scene): void {
  creaPavimento(scena);
  creaMuri(scena);
  const s = STANZA, c = s.colori;
  const fuoriL = s.larghezza + 2 * s.muroLati;
  scena.add.tileSprite(0, 0, s.larghezza, s.altezza, PAVIMENTO).setOrigin(0).setDepth(PROFONDITA.terreno);
  // ombra del muro in alto sul pavimento
  scena.add.rectangle(0, 0, s.larghezza, s.ombraMuro, Phaser.Display.Color.HexStringToColor(c.ombra).color).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5);
  scena.add.tileSprite(-s.muroLati, -s.muroAlto, fuoriL, s.muroAlto, FACCIATA).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5);
  scena.add.rectangle(-s.muroLati, -s.muroAlto, fuoriL, 4, Phaser.Display.Color.HexStringToColor(c.cima).color).setOrigin(0).setDepth(PROFONDITA.terreno + 0.6);
  scena.add.tileSprite(-s.muroLati, 0, s.muroLati, s.altezza + s.muroBasso, LATO).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5);
  scena.add.tileSprite(s.larghezza, 0, s.muroLati, s.altezza + s.muroBasso, LATO).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5);
  scena.add.tileSprite(0, s.altezza, s.larghezza, s.muroBasso, LATO).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5);
}
