/*
 * Anima uno sprite di Aseprite dentro una tela HTML (schede dei personaggi), con le immagini già caricate dal gioco.
 * Disegna pixel per pixel, senza sfumature; l'ingrandimento lo decide il CSS.
 */
import type Phaser from 'phaser';

export class TelaAnimata {
  private fermata = false;

  constructor(tela: HTMLCanvasElement, scena: Phaser.Scene, chiave: string, tag: string) {
    const anim = scena.anims.get(`${chiave}:${tag}`) ?? scena.anims.get(`${chiave}:idle`);
    const g = tela.getContext('2d');
    if (!anim || !g) return;
    const primo = anim.frames[0].frame;
    tela.width = primo.realWidth;
    tela.height = primo.realHeight;
    g.imageSmoothingEnabled = false;
    let n = 0;
    let prossimo = 0;
    const disegna = (ora: number): void => {
      if (this.fermata) return;
      if (ora >= prossimo) {
        const f = anim.frames[n];
        const fr = f.frame;
        g.clearRect(0, 0, tela.width, tela.height);
        // fr.x e fr.y: dove va il ritaglio dentro la tela intera (Aseprite toglie i bordi vuoti)
        g.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, fr.x, fr.y, fr.cutWidth, fr.cutHeight);
        prossimo = ora + (f.duration || 100);
        n = (n + 1) % anim.frames.length;
      }
      requestAnimationFrame(disegna);
    };
    requestAnimationFrame(disegna);
  }

  ferma(): void {
    this.fermata = true;
  }
}
