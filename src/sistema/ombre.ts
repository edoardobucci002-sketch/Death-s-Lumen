/**
 * Ombre a terra del gioco a stanze, come le ombre dipinte sui fogli d'acetato dell'animazione classica (idea di Edoardo
 * del 19/11): la sagoma del personaggio schiacciata a terra e ribaltata sotto i piedi, a tinta piatta e bordi netti, che
 * scurisce il pavimento lasciandolo vedere sotto (fusione «moltiplica»: niente trasparenza né sfumature). Prende lo stesso
 * fotogramma dello sprite, quindi è larga quanto il personaggio e si anima con lui. Sta sopra il pavimento e sotto avvisi,
 * pozze e sprite. Le immagini sono preparate una volta; durante la partita si spostano soltanto.
 */
import Phaser from 'phaser';
import { OMBRE } from '../data/stanze';
import { PROFONDITA } from './effetti';

/** Un gruppo di ombre: a ogni disegno inizia(), un'ombra() per chi è in campo, fine() nasconde quelle avanzate. */
export class Ombre {
  /** LAB: ombre accese o spente (per tutte le ombre della stanza). */
  static accese: boolean = OMBRE.accese;
  private readonly immagini: Phaser.GameObjects.Image[] = [];
  private usate = 0;

  constructor(scena: Phaser.Scene, quante: number) {
    for (let i = 0; i < quante; i++) {
      this.immagini.push(scena.add.image(0, 0, '__WHITE').setDepth(PROFONDITA.ombre).setBlendMode(Phaser.BlendModes.MULTIPLY).setVisible(false));
    }
  }

  inizia(): void {
    this.usate = 0;
  }

  /** L'ombra dello sprite `sp`, con i piedi in (x, y): stesso fotogramma, ribaltata in giù e schiacciata. */
  ombra(sp: Phaser.GameObjects.Sprite, x: number, y: number): void {
    if (!Ombre.accese || this.usate >= this.immagini.length) return;
    const im = this.immagini[this.usate++];
    if (im.texture !== sp.texture) im.setTexture(sp.texture.key);
    if (im.frame !== sp.frame) im.setFrame(sp.frame.name);
    im.setOrigin(sp.originX, sp.originY).setScale(sp.scaleX, -sp.scaleY * OMBRE.schiaccia).setFlipX(sp.flipX).setAngle(-sp.angle);
    im.setTint(OMBRE.colore).setTintMode(Phaser.TintModes.FILL);
    im.setPosition(Math.round(x), Math.round(y)).setVisible(true);
  }

  fine(): void {
    for (let i = this.usate; i < this.immagini.length; i++) {
      if (!this.immagini[i].visible) break;
      this.immagini[i].setVisible(false);
    }
  }
}
