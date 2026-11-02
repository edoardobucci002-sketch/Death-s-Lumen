/*
 * Gioco (tappa M3): il personaggio cammina nel cimitero, i nemici arrivano dal buio e feriscono al contatto.
 * L'arma iniziale colpisce da sola, i nemici uccisi lasciano anime, a ogni livello si sceglie un dono.
 * La logica avanza a passo fisso (60 al secondo), il disegno arrotonda tutto al pixel.
 * Nell'indirizzo, per le prove: ?pg=becchino (personaggio), ?minuto=5 (parte da quel minuto),
 * ?nemici=400 (riempie subito il campo), ?immortale (non si muore), ?livello=8 (arma già a quel livello),
 * ?automatico (sceglie da solo la prima carta a ogni livello).
 */
import Phaser from 'phaser';
import { voce } from '../sistema/asset';
import { BASE, PERSONAGGI, type Personaggio } from '../data/personaggi';
import { BARRA_SALUTE, LUCE, PIEDI_SEGNAPOSTO, SEME_PREDEFINITO } from '../data/mondo';
import { COMBATTIMENTO, COMPARSA } from '../data/nemici';
import { ARMI_INIZIALI, COLPI } from '../data/armi';
import { animePerLivello, CARTE } from '../data/progressione';
import { Anime } from '../sistema/anime';
import { Arsenale } from '../sistema/armi';
import { Doni, type Dono } from '../sistema/doni';
import { Effetti, PROFONDITA } from '../sistema/effetti';
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

export class Gioco extends Phaser.Scene {
  pg!: Personaggio;
  x = 0; // posizione dei piedi nel mondo, in pixel di gioco
  y = 0;
  secondi = 0; // tempo di gioco
  salute = 0;
  saluteMassima = 0;
  morto = false;
  orda!: Orda;
  arsenale!: Arsenale;
  livello = 1;
  esperienza = 0; // anime raccolte verso il prossimo livello
  private livelliDaScegliere = 0;
  private anime!: Anime;
  private effetti!: Effetti;
  private doni!: Doni;
  private raccolta = 0;
  private dirX = 1; // ultima direzione in cui ha camminato (le armi colpiscono da quella parte)
  private dirY = 0;
  private velocita = 0;
  private armatura = 0;
  private invulnerabile = 0; // secondi rimasti
  private attesaFine = 0;
  private immortale = false;
  private automatico = false;
  private inMoto = false;
  private versoSinistra = false;
  private chiaveSprite = '';
  giocatore!: Phaser.GameObjects.Sprite;
  private terreno!: Phaser.GameObjects.TileSprite;
  private buio!: Phaser.GameObjects.Image;
  private barraBordo!: Phaser.GameObjects.Rectangle;
  private barraVuota!: Phaser.GameObjects.Rectangle;
  private barraPiena!: Phaser.GameObjects.Rectangle;
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
    this.automatico = parametri.has('automatico');
    this.caso = new Caso(SEME_PREDEFINITO);
    this.x = this.y = 0;
    this.secondi = 60 * Number(parametri.get('minuto') ?? 0) || 0;
    this.morto = false;
    this.invulnerabile = this.attesaFine = this.accumulo = 0;
    this.livello = 1;
    this.esperienza = this.livelliDaScegliere = 0;
    this.dirX = 1;
    this.dirY = 0;
    this.raccolta = BASE.raccolta;

    creaTerreno(this, 'terreno', SEME_PREDEFINITO);
    this.terreno = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'terreno').setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.terreno);
    this.orda = new Orda(this, this.caso);
    this.anime = new Anime(this, this.caso);
    this.effetti = new Effetti(this);
    this.arsenale = new Arsenale(this, this.orda, this.caso, { danno: this.pg.danno, ricarica: this.pg.ricarica, area: this.pg.area }, this.effetti);
    const arma = ARMI_INIZIALI[this.pg.armaIniziale];
    this.arsenale.aggiungi(arma);
    const livelloProva = Math.min(CARTE.livelloMassimo, Number(parametri.get('livello')) || 1);
    for (let l = 1; l < livelloProva; l++) this.arsenale.potenzia(arma);
    this.giocatore = this.add.sprite(0, 0, this.chiaveSprite);
    this.anima('idle');
    if (voce(this, this.chiaveSprite)?.versioneFile === 0) {
      this.giocatore.setOrigin(PIEDI_SEGNAPOSTO.x / this.giocatore.frame.realWidth, PIEDI_SEGNAPOSTO.y / this.giocatore.frame.realHeight);
    } else {
      this.giocatore.setOrigin(0.5, 1);
    }
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height);
    this.buio = this.add.image(0, 0, CHIAVI_BUIO[1]).setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.buio);
    // barra della salute sotto i piedi, sopra il buio così si vede sempre
    const b = BARRA_SALUTE;
    this.barraBordo = this.add.rectangle(0, 0, b.larghezza, b.altezza, b.colori.bordo).setOrigin(0).setDepth(PROFONDITA.barra);
    this.barraVuota = this.add.rectangle(0, 0, b.larghezza - 2, b.altezza - 2, b.colori.vuota).setOrigin(0).setDepth(PROFONDITA.barra + 0.1);
    this.barraPiena = this.add.rectangle(0, 0, b.larghezza - 2, b.altezza - 2, b.colori.piena).setOrigin(0).setDepth(PROFONDITA.barra + 0.2);

    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    this.comandi = new Comandi(interfaccia);
    this.hud = new Hud(interfaccia, () => this.scene.restart());
    this.doni = new Doni(interfaccia, this.arsenale, arma, this.caso, this);

    const riempi = Number(parametri.get('nemici'));
    if (riempi > 0) this.orda.riempi(riempi, this.secondi, this.x, this.y, this.scale.width / 2, this.scale.height / 2);

    this.scale.on('resize', this.ridimensiona, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.ridimensiona, this);
      this.comandi.distruggi();
      this.hud.distruggi();
      this.doni.distruggi();
      this.anims.resumeAll();
    });
    this.disegna();
  }

  update(_t: number, delta: number): void {
    this.accumulo = Math.min(this.accumulo + delta, RITARDO_MASSIMO_MS);
    while (this.accumulo >= PASSO_MS) {
      this.passo(PASSO);
      this.accumulo -= PASSO_MS;
    }
    if (!this.doni.aperta) this.effetti.aggiorna(delta / 1000);
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
    if (this.doni.aperta) return; // il gioco è fermo mentre si sceglie il dono

    this.secondi += dt;
    const c = this.comandi;
    c.aggiorna();
    this.x += c.dx * this.velocita * dt;
    this.y += c.dy * this.velocita * dt;
    this.inMoto = c.dx !== 0 || c.dy !== 0;
    if (c.dx < 0) this.versoSinistra = true;
    else if (c.dx > 0) this.versoSinistra = false;
    if (this.inMoto) {
      const l = Math.hypot(c.dx, c.dy);
      this.dirX = c.dx / l;
      this.dirY = c.dy / l;
    }
    this.salute = Math.min(this.saluteMassima, this.salute + this.pg.rigenerazione * dt);

    this.orda.aggiorna(dt, this.secondi, this.x, this.y, c.dx, c.dy, this.scale.width / 2, this.scale.height / 2);
    this.arsenale.aggiorna(dt, this.x, this.y, this.dirX, this.dirY);
    this.orda.rimuoviMorti(this.lasciaAnima);
    this.contatti(dt);
    this.esperienza += this.anime.aggiorna(dt, this.x, this.y - COLPI.corpo, this.raccolta);
    while (this.esperienza >= animePerLivello(this.livello)) {
      this.esperienza -= animePerLivello(this.livello);
      this.livello++;
      this.livelliDaScegliere++;
    }
    if (this.livelliDaScegliere > 0) this.apriDoni();
  }

  private lasciaAnima = (x: number, y: number, valore: number): void => {
    this.anime.aggiungi(x, y, valore);
    this.effetti.scoppio(x, y);
  };

  /** Ferma il gioco e mostra le carte; dopo la scelta, se ci sono altri livelli da scegliere, le rimostra. */
  private apriDoni(): void {
    this.anims.pauseAll();
    this.comandi.lascia();
    this.doni.mostra((d: Dono) => {
      if (d.tipo === 'arma') this.arsenale.potenzia(d.arma);
      else this.salute = Math.min(this.saluteMassima, this.salute + CARTE.paneEVino);
      this.livelliDaScegliere--;
      if (this.livelliDaScegliere > 0) this.apriDoni();
      else this.anims.resumeAll();
    });
    if (this.automatico) this.doni.scegliPrima();
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
    cam.setScroll(px - Math.floor(w / 2) + this.effetti.scossaX, py - Math.floor(h / 2) + this.effetti.scossaY);
    this.giocatore.setPosition(px, py).setDepth(py).setFlipX(this.versoSinistra);
    // lampo bianco appena colpito; da morto il personaggio lampeggia e poi sparisce
    const lampo = this.invulnerabile > COMBATTIMENTO.invulnerabilita - COMBATTIMENTO.lampo || (this.morto && this.attesaFine > 0 && Math.floor(this.attesaFine * 12) % 2 === 0);
    if (lampo) this.giocatore.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.giocatore.clearTint();
    this.giocatore.setVisible(!this.morto || this.attesaFine > 0);
    this.anima(this.inMoto ? 'walk' : 'idle');
    this.orda.disegna(cam, COMPARSA.margine);
    this.anime.disegna(cam);
    this.arsenale.disegna();
    this.terreno.setTilePosition(cam.scrollX, cam.scrollY);
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]);
    this.buio.setPosition(
      px - cam.scrollX - Math.floor(this.misureBuio.w / 2),
      py - LUCE.altezza - cam.scrollY - Math.floor(this.misureBuio.h / 2),
    );
    const b = BARRA_SALUTE;
    const bx = px - Math.floor(b.larghezza / 2);
    const by = py + b.distanza;
    const piena = Math.round((b.larghezza - 2) * (this.salute / this.saluteMassima));
    this.barraBordo.setPosition(bx, by).setVisible(!this.morto);
    this.barraVuota.setPosition(bx + 1, by + 1).setVisible(!this.morto);
    this.barraPiena.setPosition(bx + 1, by + 1).setSize(piena, b.altezza - 2).setVisible(!this.morto && piena > 0);
    this.hud.aggiorna(this.secondi, !this.morto && this.salute < this.saluteMassima * COMBATTIMENTO.saluteBassa, this.livello, this.esperienza / animePerLivello(this.livello));
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
