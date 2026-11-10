/*
 * Avvio: carica l'elenco degli asset e tutti gli sprite esportati da Aseprite (più gli elementi dell'HUD),
 * poi crea le animazioni dai tag (idle, walk, attack, special, hurt, death), prepara l'arte dell'HUD e apre il menu
 * (o direttamente la partita, se l'indirizzo sceglie già il personaggio con ?pg=).
 */
import Phaser from 'phaser';
import { preparaArte } from '../sistema/arte';
import { creaIconeAmuleti } from '../sistema/amuleti';
import { creaIconeOggetti, creaIconeUnioni } from '../sistema/segnaposto-oggetti';
import { caricaScritte } from '../sistema/scritte';
import type { ElencoAsset } from '../sistema/asset';
import { caricataAlVolo } from '../sistema/al-volo';

export class Avvio extends Phaser.Scene {
  constructor() {
    super('Avvio');
  }

  preload(): void {
    this.load.json('elenco', 'assets/elenco.json');
    this.load.once('filecomplete-json-elenco', (_k: string, _t: string, elenco: ElencoAsset) => {
      // le Pozze pixelfx no: si caricano al volo, una misura per volta (src/sistema/al-volo.ts)
      for (const a of elenco.asset) if (!caricataAlVolo(a.chiave)) this.load.aseprite(a.chiave, a.immagine, a.dati);
    });
    this.load.json('elencoHud', 'assets/hud/elenco.json');
    this.load.once('filecomplete-json-elencoHud', (_k: string, _t: string, elenco: ElencoAsset) => {
      for (const a of elenco.asset) this.load.aseprite(a.chiave, a.immagine, a.dati);
    });
  }

  create(): void {
    const elenco = this.cache.json.get('elenco') as ElencoAsset;
    for (const a of elenco.asset) {
      if (caricataAlVolo(a.chiave)) continue;
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
      // uno sprite senza tag vale come "idle" con tutti i suoi fotogrammi, con le durate di Aseprite
      if (!anims.length) {
        const dati = this.cache.json.get(a.chiave) as { frames: { duration: number }[] };
        this.anims.create({
          key: `${a.chiave}:idle`,
          frames: dati.frames.map((f, i) => ({ key: a.chiave, frame: String(i), duration: f.duration })),
          repeat: -1,
        });
      }
    }
    // l'interfaccia HTML usa gli elementi dell'HUD e le icone come immagini intere
    const hud = this.cache.json.get('elencoHud') as ElencoAsset;
    preparaArte(this, [...hud.asset.map((a) => a.chiave), ...elenco.asset.filter((a) => a.categoria === 'icone').map((a) => a.chiave)]);
    creaIconeAmuleti();
    creaIconeOggetti();
    creaIconeUnioni();
    // le scritte a pixel si disegnano su tela: prima serve il carattere caricato
    void caricaScritte().then(() => this.scene.start(new URLSearchParams(location.search).has('pg') ? 'Gioco' : 'Menu'));
  }
}
