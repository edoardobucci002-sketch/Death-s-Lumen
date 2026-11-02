/*
 * Avvio: carica l'elenco degli asset e tutti gli sprite esportati da Aseprite,
 * poi crea le animazioni dai tag (idle, walk, attack, special, hurt, death).
 */
import Phaser from 'phaser';
import type { ElencoAsset } from '../sistema/asset';

export class Avvio extends Phaser.Scene {
  constructor() {
    super('Avvio');
  }

  preload(): void {
    this.load.json('elenco', 'assets/elenco.json');
    this.load.once('filecomplete-json-elenco', (_k: string, _t: string, elenco: ElencoAsset) => {
      for (const a of elenco.asset) this.load.aseprite(a.chiave, a.immagine, a.dati);
    });
  }

  create(): void {
    const elenco = this.cache.json.get('elenco') as ElencoAsset;
    for (const a of elenco.asset) {
      // le animazioni si chiamano "<chiave>:<tag>", es. "Il_Lampionaio:walk"
      const anims = this.anims.createFromAseprite(a.chiave);
      for (const anim of anims) {
        const tag = anim.key;
        this.anims.remove(tag);
        this.anims.create({
          key: `${a.chiave}:${tag}`,
          frames: anim.frames.map((f) => ({ key: a.chiave, frame: f.textureFrame, duration: f.duration })),
          repeat: -1,
        });
      }
    }
    this.scene.start('Gioco');
  }
}
