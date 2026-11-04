/*
 * Simboli degli stati: un piccolo disegno sopra la testa del nemico, al posto dei lampi di colore.
 * Sole = Abbagliato, croce = Consacrato, teschio = Maledetto, lapide = Sepolto (anche durante l'Interramento).
 * Provvisori, disegnati qui in pixel art (9×9 più il contorno) finché Edoardo non disegna i suoi:
 * un file EFFETTI/Simbolo_Abbagliato_V1.aseprite (e così per gli altri) prende il posto di quello del codice.
 * Si disegnano sopra il buio, come le anime, e con un numero fisso di sprite: niente allocazioni nel ciclo di gioco.
 */
import type Phaser from 'phaser';
import { preparaArte, registraArte } from './arte';
import { PROFONDITA } from './effetti';
import { STATI } from '../data/stati';

const LATO = 9;
/** C = colore dello stato, A = lo stesso più scuro, W = chiaro, D = scuro; attorno il contorno lo aggiunge il codice. */
const DISEGNI: { sprite: string; colore: number; righe: string[] }[] = [
  { sprite: 'Simbolo_Abbagliato', colore: STATI.abbagliato.colore, righe: ['....C....', '.C..C..C.', '..CCCCC..', '..CWWWC..', 'CCCWWWCCC', '..CWWWC..', '..CCCCC..', '.C..C..C.', '....C....'] },
  { sprite: 'Simbolo_Consacrato', colore: STATI.consacrato.colore, righe: ['...CCC...', '...CWC...', 'CCCCWCCCC', 'CWWWWWWWC', 'CCCCWCCCC', '...CWC...', '...CWC...', '...CWC...', '...CCC...'] },
  { sprite: 'Simbolo_Maledetto', colore: STATI.maledetto.colore, righe: ['..CCCCC..', '.CCCCCCC.', '.CCCCCCC.', '.CDDCDDC.', '.CDDCDDC.', '.CCCDCCC.', '..CCCCC..', '..CDCDC..', '..CDCDC..'] },
  { sprite: 'Simbolo_Sepolto', colore: STATI.sepolto.colore, righe: ['...CCC...', '..CCCCC..', '.CCCWCCC.', '.CCWWWCC.', '.CCCWCCC.', '.CCCWCCC.', '.CCCCCCC.', '.CCCCCCC.', 'AAAAAAAAA'] },
];

const esadecimale = (c: number, f = 1): string => `rgb(${Math.round((c >> 16 & 255) * f)},${Math.round((c >> 8 & 255) * f)},${Math.round((c & 255) * f)})`;

function creaTexture(scena: Phaser.Scene): void {
  for (const d of DISEGNI) {
    if (scena.textures.exists(d.sprite)) {
      if (scena.cache.json.has(d.sprite)) preparaArte(scena, [d.sprite]); // quello di Edoardo, anche per legenda e strisce
      continue;
    }
    const c = scena.textures.createCanvas(d.sprite, LATO + 2, LATO + 2)!;
    const piena = (x: number, y: number): boolean => (d.righe[y]?.[x] ?? '.') !== '.';
    for (let y = -1; y <= LATO; y++) {
      for (let x = -1; x <= LATO; x++) {
        if (piena(x, y)) {
          const ch = d.righe[y][x];
          c.context.fillStyle = ch === 'W' ? '#fff8e0' : ch === 'D' ? '#1b1514' : esadecimale(d.colore, ch === 'A' ? 0.6 : 1);
        } else if (piena(x - 1, y) || piena(x + 1, y) || piena(x, y - 1) || piena(x, y + 1)) c.context.fillStyle = '#1b1514';
        else continue;
        c.context.fillRect(x + 1, y + 1, 1, 1);
      }
    }
    c.refresh();
    registraArte(d.sprite, c.canvas);
  }
}

export class Simboli {
  private sprite: Phaser.GameObjects.Sprite[] = [];
  private usati = 0;
  private usatiPrima = 0;

  constructor(scena: Phaser.Scene) {
    creaTexture(scena);
    for (let i = 0; i < STATI.simboli.massimi; i++) {
      this.sprite.push(scena.add.sprite(0, 0, DISEGNI[0].sprite).setOrigin(0.5, 1).setDepth(PROFONDITA.anime).setVisible(false));
    }
  }

  /** Da chiamare prima di disegnare i nemici. */
  inizio(): void {
    this.usatiPrima = this.usati;
    this.usati = 0;
  }

  /** Mette il simbolo dell'affinità aff (1-4) con il bordo inferiore al punto (x, y). Oltre il massimo non si disegna. */
  mostra(aff: number, x: number, y: number): void {
    if (this.usati >= this.sprite.length) return;
    this.sprite[this.usati++].setTexture(DISEGNI[aff - 1].sprite).setScale(STATI.simboli.ingrandimento).setPosition(x, y - STATI.simboli.distanza).setVisible(true);
  }

  /** Da chiamare dopo aver disegnato i nemici: nasconde quelli rimasti dal fotogramma prima. */
  fine(): void {
    for (let i = this.usati; i < this.usatiPrima; i++) this.sprite[i].setVisible(false);
  }
}
