/*
 * Gioco (tappa M2): il personaggio cammina nel cimitero, i nemici arrivano dal buio e feriscono al contatto.
 * La logica avanza a passo fisso (60 al secondo), il disegno arrotonda tutto al pixel.
 * Nell'indirizzo, per le prove: ?pg=becchino (personaggio), ?minuto=5 (parte da quel minuto),
 * ?nemici=400 (riempie subito il campo), ?immortale (non si muore).
 */
import Phaser from 'phaser';
import type { ElencoAsset } from '../sistema/asset';
import { BASE, PERSONAGGI, type Personaggio } from '../data/personaggi';
import { LUCE, PIEDI_SEGNAPOSTO, SEME_PREDEFINITO } from '../data/mondo';
import { COMBATTIMENTO, COMPARSA } from '../data/nemici';
import { Caso } from '../sistema/caso';
import { Comandi } from '../sistema/comandi';
import { Hud } from '../sistema/hud';
import { vibra } from '../sistema/mobile';
import { Orda } from '../sistema/orda';
import { creaTerreno } from '../sistema/terreno';
import { CHIAVI_BUIO, creaBuio } from '../sistema/luce';

const PASSO = 1 / 60;
const PASSO_MS = 1000 * PASSO;
const RITARDO_MASSIMO_MS = 250; // dopo un blocco lungo non recupera all'infinito
const SOPRA_TUTTO = 1e7; // profondità del buio: copre personaggio e nemici

export class Gioco extends Phaser.Scene {
  pg!: Personaggio;
  x = 0; // posizione dei piedi nel mondo, in pixel di gioco
  y = 0;
  secondi = 0; // tempo di gioco
  salute = 0;
  saluteMassima = 0;
  morto = false;
  orda!: Orda;
  private velocita = 0;
  private armatura = 0;
  private invulnerabile = 0; // secondi rimasti
  private attesaFine = 0;
  private immortale = false;
  private inMoto = false;
  private versoSinistra = false;
  private chiaveSprite = '';
  private giocatore!: Phaser.GameObjects.Sprite;
  private terreno!: Phaser.GameObjects.TileSprite;
  private buio!: Phaser.GameObjects.Image;
  private misureBuio = { w: 0, h: 0 };
  private comandi!: Comandi;
  private hud!: Hud;
  private caso!: Caso;
  private accumulo = 0;
  private attesaTremolio = 0;
  private fiamma = 1;

  constructor() {
    super('Gioco');
  }

  create(): void {
    const parametri = new URLSearchParams(location.search);
    this.pg = PERSONAGGI.find((p) => p.id === parametri.get('pg')) ?? PERSONAGGI[0];
    document.documentElement.style.setProperty('--accento', this.pg.colore);
    // finché un personaggio non ha il suo sprite in gioco, usa quello del Lampionaio (segnaposto)
    this.chiaveSprite = this.textures.exists(this.pg.sprite) ? this.pg.sprite : PERSONAGGI[0].sprite;
    this.velocita = BASE.velocita * (1 + this.pg.velocita);
    this.saluteMassima = this.salute = BASE.salute + this.pg.salute;
    this.armatura = BASE.armatura + this.pg.armatura;
    this.immortale = parametri.has('immortale');
    this.caso = new Caso(SEME_PREDEFINITO);
    this.x = this.y = 0;
    this.secondi = 60 * Number(parametri.get('minuto') ?? 0) || 0;
    this.morto = false;
    this.invulnerabile = this.attesaFine = this.accumulo = 0;

    creaTerreno(this, 'terreno', SEME_PREDEFINITO);
    this.terreno = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'terreno').setOrigin(0).setScrollFactor(0).setDepth(-SOPRA_TUTTO);
    this.orda = new Orda(this, this.caso);
    this.giocatore = this.add.sprite(0, 0, this.chiaveSprite);
    this.anima('idle');
    const voce = (this.cache.json.get('elenco') as ElencoAsset).asset.find((a) => a.chiave === this.chiaveSprite);
    if (voce?.versioneFile === 0) {
      this.giocatore.setOrigin(PIEDI_SEGNAPOSTO.x / this.giocatore.frame.realWidth, PIEDI_SEGNAPOSTO.y / this.giocatore.frame.realHeight);
    } else {
      this.giocatore.setOrigin(0.5, 1);
    }
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height);
    this.buio = this.add.image(0, 0, CHIAVI_BUIO[1]).setOrigin(0).setScrollFactor(0).setDepth(SOPRA_TUTTO);

    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    this.comandi = new Comandi(interfaccia);
    this.hud = new Hud(interfaccia, () => this.scene.restart());

    const riempi = Number(parametri.get('nemici'));
    if (riempi > 0) this.orda.riempi(riempi, this.secondi, this.x, this.y, this.scale.width / 2, this.scale.height / 2);

    this.scale.on('resize', this.ridimensiona, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.ridimensiona, this);
      this.comandi.distruggi();
      this.hud.distruggi();
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
    this.attesaTremolio -= dt;
    if (this.attesaTremolio <= 0) {
      this.attesaTremolio = LUCE.intervalloTremolio;
      this.fiamma = this.caso.intero(0, CHIAVI_BUIO.length - 1);
    }
    if (this.morto) {
      if (this.attesaFine > 0 && (this.attesaFine -= dt) <= 0) this.hud.mostraFine(this.secondi);
      return;
    }

    this.secondi += dt;
    const c = this.comandi;
    c.aggiorna();
    this.x += c.dx * this.velocita * dt;
    this.y += c.dy * this.velocita * dt;
    this.inMoto = c.dx !== 0 || c.dy !== 0;
    if (c.dx < 0) this.versoSinistra = true;
    else if (c.dx > 0) this.versoSinistra = false;
    this.salute = Math.min(this.saluteMassima, this.salute + this.pg.rigenerazione * dt);

    this.orda.aggiorna(dt, this.secondi, this.x, this.y, c.dx, c.dy, this.scale.width / 2, this.scale.height / 2);
    this.contatti(dt);
  }

  /** Danno da contatto: il colpo più forte tra i nemici che toccano il personaggio, poi un attimo di invulnerabilità. */
  private contatti(dt: number): void {
    if (this.invulnerabile > 0) {
      this.invulnerabile -= dt;
      return;
    }
    const o = this.orda;
    let colpo = 0;
    for (let i = 0; i < o.numero; i++) {
      const r = o.raggio[i] + COMBATTIMENTO.raggioGiocatore;
      const dx = o.x[i] - this.x;
      const dy = o.y[i] - this.y;
      if (dx * dx + dy * dy < r * r && o.danno[i] > colpo) colpo = o.danno[i];
    }
    if (!colpo) return;
    this.invulnerabile = COMBATTIMENTO.invulnerabilita;
    if (this.immortale) return;
    this.salute -= Math.max(1, colpo - this.armatura);
    vibra('leggera');
    if (this.salute <= 0) {
      this.salute = 0;
      this.morto = true;
      this.attesaFine = COMBATTIMENTO.attesaFine;
      this.inMoto = false;
      vibra('forte');
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
    this.giocatore.setPosition(px, py).setDepth(py).setFlipX(this.versoSinistra);
    // lampo bianco appena colpito; da morto il personaggio lampeggia e poi sparisce
    const lampo = this.invulnerabile > COMBATTIMENTO.invulnerabilita - COMBATTIMENTO.lampo || (this.morto && this.attesaFine > 0 && Math.floor(this.attesaFine * 12) % 2 === 0);
    if (lampo) this.giocatore.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.giocatore.clearTint();
    this.giocatore.setVisible(!this.morto || this.attesaFine > 0);
    this.anima(this.inMoto ? 'walk' : 'idle');
    this.orda.disegna(cam, COMPARSA.margine);
    this.terreno.setTilePosition(cam.scrollX, cam.scrollY);
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]);
    this.buio.setPosition(
      px - cam.scrollX - Math.floor(this.misureBuio.w / 2),
      py - LUCE.altezza - cam.scrollY - Math.floor(this.misureBuio.h / 2),
    );
    this.hud.aggiorna(this.secondi, this.salute / this.saluteMassima, !this.morto && this.salute < this.saluteMassima * COMBATTIMENTO.saluteBassa);
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
