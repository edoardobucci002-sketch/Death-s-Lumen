/*
 * Gioco (tappa M1): il personaggio cammina nel cimitero, la telecamera lo segue, intorno è buio.
 * La logica avanza a passo fisso (60 al secondo), il disegno arrotonda tutto al pixel.
 * Prova un altro personaggio con ?pg=becchino nell'indirizzo.
 */
import Phaser from 'phaser';
import type { ElencoAsset } from '../sistema/asset';
import { BASE, PERSONAGGI, type Personaggio } from '../data/personaggi';
import { LUCE, PIEDI_SEGNAPOSTO, SEME_PREDEFINITO } from '../data/mondo';
import { Caso } from '../sistema/caso';
import { Comandi } from '../sistema/comandi';
import { creaTerreno } from '../sistema/terreno';
import { CHIAVI_BUIO, creaBuio } from '../sistema/luce';

const PASSO = 1 / 60;
const PASSO_MS = 1000 * PASSO;
const RITARDO_MASSIMO_MS = 250; // dopo un blocco lungo non recupera all'infinito

export class Gioco extends Phaser.Scene {
  pg!: Personaggio;
  x = 0; // posizione dei piedi nel mondo, in pixel di gioco
  y = 0;
  private velocita = 0;
  private inMoto = false;
  private versoSinistra = false;
  private chiaveSprite = '';
  private giocatore!: Phaser.GameObjects.Sprite;
  private terreno!: Phaser.GameObjects.TileSprite;
  private buio!: Phaser.GameObjects.Image;
  private misureBuio = { w: 0, h: 0 };
  private comandi!: Comandi;
  private caso!: Caso;
  private accumulo = 0;
  private attesaTremolio = 0;
  private fiamma = 1;

  constructor() {
    super('Gioco');
  }

  create(): void {
    const scelta = new URLSearchParams(location.search).get('pg');
    this.pg = PERSONAGGI.find((p) => p.id === scelta) ?? PERSONAGGI[0];
    document.documentElement.style.setProperty('--accento', this.pg.colore);
    // finché un personaggio non ha il suo sprite in gioco, usa quello del Lampionaio (segnaposto)
    this.chiaveSprite = this.textures.exists(this.pg.sprite) ? this.pg.sprite : PERSONAGGI[0].sprite;
    this.velocita = BASE.velocita * (1 + this.pg.velocita);
    this.caso = new Caso(SEME_PREDEFINITO);
    this.x = this.y = 0;
    this.accumulo = 0;

    creaTerreno(this, 'terreno', SEME_PREDEFINITO);
    this.terreno = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'terreno').setOrigin(0).setScrollFactor(0);
    this.giocatore = this.add.sprite(0, 0, this.chiaveSprite);
    this.anima('idle');
    const voce = (this.cache.json.get('elenco') as ElencoAsset).asset.find((a) => a.chiave === this.chiaveSprite);
    if (voce?.versioneFile === 0) {
      this.giocatore.setOrigin(PIEDI_SEGNAPOSTO.x / this.giocatore.frame.realWidth, PIEDI_SEGNAPOSTO.y / this.giocatore.frame.realHeight);
    } else {
      this.giocatore.setOrigin(0.5, 1);
    }
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height);
    this.buio = this.add.image(0, 0, CHIAVI_BUIO[1]).setOrigin(0).setScrollFactor(0);

    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    this.comandi = new Comandi(interfaccia);

    this.scale.on('resize', this.ridimensiona, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.ridimensiona, this);
      this.comandi.distruggi();
    });
    this.disegna();
  }

  update(_t: number, delta: number): void {
    this.accumulo = Math.min(this.accumulo + delta, RITARDO_MASSIMO_MS);
    while (this.accumulo >= PASSO_MS) {
      this.passo(PASSO);
      this.accumulo -= PASSO_MS;
    }
    this.disegna();
  }

  /** Un passo di logica: niente disegno qui. */
  private passo(dt: number): void {
    const c = this.comandi;
    c.aggiorna();
    this.x += c.dx * this.velocita * dt;
    this.y += c.dy * this.velocita * dt;
    this.inMoto = c.dx !== 0 || c.dy !== 0;
    if (c.dx < 0) this.versoSinistra = true;
    else if (c.dx > 0) this.versoSinistra = false;

    this.attesaTremolio -= dt;
    if (this.attesaTremolio <= 0) {
      this.attesaTremolio = LUCE.intervalloTremolio;
      this.fiamma = this.caso.intero(0, CHIAVI_BUIO.length - 1);
    }
  }

  /** Disegna lo stato attuale, con tutte le posizioni arrotondate al pixel. */
  private disegna(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const cam = this.cameras.main;
    cam.setScroll(px - Math.floor(w / 2), py - Math.floor(h / 2));
    this.giocatore.setPosition(px, py).setFlipX(this.versoSinistra);
    this.anima(this.inMoto ? 'walk' : 'idle');
    this.terreno.setTilePosition(cam.scrollX, cam.scrollY);
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]);
    this.buio.setPosition(
      px - cam.scrollX - Math.floor(this.misureBuio.w / 2),
      py - LUCE.altezza - cam.scrollY - Math.floor(this.misureBuio.h / 2),
    );
  }

  /** Avvia un'animazione; se lo sprite non ha quel tag (per esempio walk), resta su idle. */
  private anima(tag: string): void {
    const chiave = `${this.chiaveSprite}:${tag}`;
    this.giocatore.play(this.anims.exists(chiave) ? chiave : `${this.chiaveSprite}:idle`, true);
  }

  private ridimensiona(): void {
    this.terreno.setSize(this.scale.width, this.scale.height);
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height);
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]);
  }
}
