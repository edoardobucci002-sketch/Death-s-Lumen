/**
 * Ombre a terra del gioco a stanze, come le ombre dipinte sui fogli d'acetato dell'animazione classica (idea di Edoardo
 * del 19/11): un'ellisse piatta a bordi netti, senza contorno, che scurisce il pavimento lasciandolo vedere sotto
 * (fusione «moltiplica»: niente trasparenza né sfumature). Sta sopra il pavimento e sotto avvisi, pozze e sprite.
 * Le ellissi sono disegnate pixel per pixel e preparate una volta per misura; durante la partita si spostano soltanto.
 */
import Phaser from 'phaser';
import { OMBRE } from '../data/stanze';
import { PROFONDITA } from './effetti';

const chiavi = new Map<number, string>(); // larghezza → chiave della texture: niente stringhe nuove durante la partita
let fattoColore = -1, fattaProporzione = -1; // con cui sono fatte (dal LAB → Numeri si possono cambiare)
/** La texture dell'ombra larga `larghezza` pixel (alta larghezza / OMBRE.proporzione, entrambe arrotondate al pari), preparata la prima volta. */
function texturaOmbra(scena: Phaser.Scene, larghezza: number): string {
  if (OMBRE.colore !== fattoColore || OMBRE.proporzione !== fattaProporzione) {
    chiavi.clear();
    fattoColore = OMBRE.colore;
    fattaProporzione = OMBRE.proporzione;
  }
  const pronta = chiavi.get(larghezza);
  if (pronta !== undefined && scena.textures.exists(pronta)) return pronta;
  // misure pari: con il centro a metà, l'ombra cade su pixel interi
  const w = Math.max(2, 2 * Math.round(larghezza / 2)), h = Math.max(2, 2 * Math.round(w / OMBRE.proporzione / 2));
  const chiave = `ombra-${w}x${h}-${OMBRE.colore}`;
  chiavi.set(larghezza, chiave);
  if (scena.textures.exists(chiave)) return chiave;
  const tela = scena.textures.createCanvas(chiave, w, h)!;
  const cx = tela.getContext(), dati = cx.createImageData(w, h);
  const r = (OMBRE.colore >> 16) & 255, g = (OMBRE.colore >> 8) & 255, b = OMBRE.colore & 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
      if (dx * dx + dy * dy > 1) continue;
      const k = (y * w + x) * 4;
      dati.data[k] = r;
      dati.data[k + 1] = g;
      dati.data[k + 2] = b;
      dati.data[k + 3] = 255;
    }
  }
  cx.putImageData(dati, 0, 0);
  tela.refresh(); // in Phaser 4 il disegno arriva alla scheda grafica solo così
  return chiave;
}

/** Un gruppo di ombre: a ogni disegno inizia(), un'ombra() per chi è in campo, fine() nasconde quelle avanzate. */
export class Ombre {
  /** LAB: ombre accese o spente (per tutte le ombre della stanza). */
  static accese: boolean = OMBRE.accese;
  private readonly immagini: Phaser.GameObjects.Image[] = [];
  private usate = 0;

  constructor(private readonly scena: Phaser.Scene, quante: number) {
    for (let i = 0; i < quante; i++) {
      this.immagini.push(scena.add.image(0, 0, '__WHITE').setDepth(PROFONDITA.ombre).setBlendMode(Phaser.BlendModes.MULTIPLY).setVisible(false));
    }
  }

  inizia(): void {
    this.usate = 0;
  }

  /** L'ombra larga `larghezza` pixel centrata sui piedi in (x, y). */
  ombra(x: number, y: number, larghezza: number): void {
    if (!Ombre.accese || this.usate >= this.immagini.length) return;
    const im = this.immagini[this.usate++], chiave = texturaOmbra(this.scena, larghezza);
    if (im.texture.key !== chiave) im.setTexture(chiave);
    im.setPosition(Math.round(x), Math.round(y)).setVisible(true);
  }

  fine(): void {
    for (let i = this.usate; i < this.immagini.length; i++) {
      if (!this.immagini[i].visible) break;
      this.immagini[i].setVisible(false);
    }
  }
}
