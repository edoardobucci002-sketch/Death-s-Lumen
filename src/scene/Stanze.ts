/*
 * Stanze: il gioco a stanze (pivot del 12/11), accanto al survivor e raggiungibile solo dal link di prova.
 * Passo 2 della fetta verticale: una stanza chiusa da muri, il Lampionaio che cammina con il joystick o con WASD,
 * la telecamera che lo tiene al centro, luce e buio come nel survivor.
 * Il gioco a stanze è in orizzontale: sul telefono in verticale si ferma e chiede di ruotarlo.
 * Pausa con il pulsante provvisorio in alto a destra (piccolo, area di tocco di 44 punti), P o Esc, Indietro e quando l'app va in secondo piano (pausa provvisoria:
 * Riprendi e Menu). La logica avanza a passo fisso (60 al secondo), il disegno arrotonda tutto al pixel.
 * Nell'indirizzo, per le prove: ?stanze (salta il menu; solo sul link di prova, in sviluppo e nelle prove automatiche).
 */
import Phaser from 'phaser';
import { voce } from '../sistema/asset';
import { bordiHud, misura, misureHud, posa, retino } from '../sistema/arte';
import { TOCCO_MINIMO } from '../data/hud';
import { entraInPartita, esciDallaPartita } from '../sistema/indietro';
import { BASE, PERSONAGGI, type Personaggio } from '../data/personaggi';
import { LUCE, PIEDI_SEGNAPOSTO } from '../data/mondo';
import { STANZA } from '../data/stanze';
import { Caso } from '../sistema/caso';
import { Comandi } from '../sistema/comandi';
import { PROFONDITA } from '../sistema/effetti';
import { audioAttivo, impostaAudio } from '../sistema/audio';
import { CHIAVI_ALONE, CHIAVI_BUIO, creaBuio } from '../sistema/luce';
import { areaCamminabile, creaStanza } from '../sistema/stanza';
import { tela } from '../sistema/scritte';
import { LabStanze } from '../sistema/lab-stanze';

const PASSO = 1 / 60;
const PASSO_MS = 1000 * PASSO;
const RITARDO_MASSIMO_MS = 250; // dopo un blocco lungo non recupera all'infinito

/** Il gioco a stanze si raggiunge solo dal link di prova, in sviluppo e nelle prove automatiche. */
export const STANZE_DISPONIBILI = import.meta.env.VITE_CANALE === 'prova' || import.meta.env.DEV || navigator.webdriver === true;

export class Stanze extends Phaser.Scene {
  pg!: Personaggio;
  x = 0; // piedi del personaggio, in pixel di gioco (il pavimento va da 0, 0 a larghezza, altezza)
  y = 0;
  giocatore!: Phaser.GameObjects.Sprite;
  pausa = false;
  pausaLab = false;
  ruota = false; // telefono in verticale: il gioco aspetta che venga ruotato
  readonly lab = new LabStanze(this);
  private chiaveSprite = '';
  private velocita = 0;
  private versoSinistra = false;
  private inMoto = false;
  private accumulo = 0;
  private comandi!: Comandi;
  private casoLuce = new Caso(STANZA.seme); // solo per il tremolio: non tocca la logica
  private attesaTremolio = 0;
  private fiamma = 1;
  private buio!: Phaser.GameObjects.Image;
  private alone!: Phaser.GameObjects.Image;
  private misureBuio = { w: 0, h: 0 };
  private radice!: HTMLElement;
  private tastoPausa!: HTMLButtonElement;
  private pannelloPausa!: HTMLElement;
  private avvisoRuota!: HTMLElement;
  lineaJoystick!: HTMLElement; // la linea invisibile al centro: il LAB la può mostrare

  constructor() {
    super('Stanze');
  }

  create(): void {
    // nella fetta c'è solo il Lampionaio (decisione di Edoardo del 12/11)
    this.pg = PERSONAGGI[0];
    document.documentElement.style.setProperty('--accento', this.pg.colore);
    this.chiaveSprite = this.textures.exists(this.pg.sprite) ? this.pg.sprite : PERSONAGGI[0].sprite;
    // la scena si riusa: tutto si azzera qui
    this.pausa = this.pausaLab = this.ruota = this.versoSinistra = this.inMoto = false;
    this.accumulo = this.attesaTremolio = 0;
    this.fiamma = 1;
    this.casoLuce = new Caso(STANZA.seme);
    this.velocita = BASE.velocita * (1 + this.pg.velocita);
    this.x = Math.round(STANZA.larghezza / 2);
    this.y = Math.round(STANZA.altezza / 2);
    this.cameras.main.setBackgroundColor(STANZA.colori.fondo);

    creaStanza(this);
    this.giocatore = this.add.sprite(0, 0, this.chiaveSprite).setDepth(PROFONDITA.personaggio);
    if (voce(this, this.chiaveSprite)?.versioneFile === 0) {
      this.giocatore.setOrigin(PIEDI_SEGNAPOSTO.x / this.giocatore.frame.realWidth, PIEDI_SEGNAPOSTO.y / this.giocatore.frame.realHeight);
    } else {
      this.giocatore.setOrigin(0.5, 1);
    }
    this.anima('idle');
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height);
    this.buio = this.add.image(0, 0, CHIAVI_BUIO[1]).setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.buio);
    this.alone = this.add.image(0, 0, CHIAVI_ALONE[1]).setDepth(PROFONDITA.terreno + 1).setBlendMode(Phaser.BlendModes.ADD);

    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    this.comandi = new Comandi(interfaccia, { metaSinistra: true });
    this.creaInterfaccia(interfaccia);
    this.controllaVerso();

    this.scale.on('resize', this.ridimensiona, this);
    entraInPartita();
    this.game.events.on('sfondo', this.apriPausa, this);
    window.addEventListener('keydown', this.tasto);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.ridimensiona, this);
      esciDallaPartita();
      this.game.events.off('sfondo', this.apriPausa, this);
      window.removeEventListener('keydown', this.tasto);
      this.comandi.distruggi();
      this.radice.remove();
    });
    this.disegna();
  }

  update(_t: number, delta: number): void {
    if (this.fermo()) {
      this.accumulo = 0;
      this.disegna();
      return;
    }
    this.accumulo = Math.min(this.accumulo + delta, RITARDO_MASSIMO_MS);
    while (this.accumulo >= PASSO_MS) {
      this.passo(PASSO);
      this.accumulo -= PASSO_MS;
    }
    this.disegna();
  }

  /** Il gioco è fermo: pausa, Laboratorio aperto o telefono da ruotare. */
  fermo(): boolean {
    return this.pausa || this.pausaLab || this.ruota;
  }

  /** Tasto Indietro: apre la pausa e basta (dentro la pausa non fa niente: si riprende solo dal pulsante). */
  indietro(): boolean {
    if (!this.pausa) this.apriPausa();
    return true;
  }

  apriPausa(): void {
    if (this.pausa) return;
    this.pausa = true;
    this.comandi.lascia();
    this.anims.pauseAll();
    this.pannelloPausa.hidden = false;
  }

  riprendi(): void {
    this.pausa = false;
    this.pannelloPausa.hidden = true;
    if (!this.fermo()) this.anims.resumeAll();
  }

  /** Un passo di logica: niente disegno qui. */
  private passo(dt: number): void {
    this.attesaTremolio -= dt;
    if (this.attesaTremolio <= 0) {
      this.attesaTremolio = LUCE.intervalloTremolio;
      this.fiamma = this.casoLuce.intero(0, CHIAVI_BUIO.length - 1);
    }
    this.comandi.aggiorna();
    const dx = this.comandi.dx, dy = this.comandi.dy;
    this.inMoto = dx !== 0 || dy !== 0;
    if (dx < 0) this.versoSinistra = true;
    else if (dx > 0) this.versoSinistra = false;
    // i muri: i piedi restano dentro l'area camminabile
    const a = areaCamminabile();
    this.x = Phaser.Math.Clamp(this.x + dx * this.velocita * dt, a.x0, a.x1);
    this.y = Phaser.Math.Clamp(this.y + dy * this.velocita * dt, a.y0, a.y1);
  }

  /**
   * La telecamera tiene il personaggio sempre al centro, come nel survivor: il buio è grande quanto lo schermo e segue
   * la lanterna, quindi con il personaggio fuori centro lascerebbe scoperto un pezzo di stanza. Oltre i muri c'è il fondo scuro.
   */
  private disegna(): void {
    const w = this.scale.width, h = this.scale.height;
    const px = Math.round(this.x), py = Math.round(this.y);
    const cam = this.cameras.main;
    cam.setScroll(px - Math.floor(w / 2), py - Math.floor(h / 2));
    this.giocatore.setPosition(px, py).setFlipX(this.versoSinistra);
    this.anima(this.inMoto && !this.fermo() ? 'walk' : 'idle');
    const bx = px - cam.scrollX - Math.floor(this.misureBuio.w / 2);
    const by = py - LUCE.altezza - cam.scrollY - Math.floor(this.misureBuio.h / 2);
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]).setPosition(bx, by);
    this.alone.setTexture(CHIAVI_ALONE[this.fiamma]).setPosition(px, py - LUCE.altezza);
  }

  /** Avvia un'animazione; se lo sprite non ha quel tag, resta su idle. */
  private anima(tag: string): void {
    const chiave = `${this.chiaveSprite}:${tag}`;
    this.giocatore.play(this.anims.exists(chiave) ? chiave : `${this.chiaveSprite}:idle`, true);
  }

  private ridimensiona(): void {
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height);
    this.controllaVerso();
    this.disponi();
  }

  /** Telefono o tablet in verticale: il gioco a stanze si ferma e chiede di ruotarlo (decisione di Edoardo del 12/11). */
  private controllaVerso(): void {
    const verticale = matchMedia('(pointer: coarse)').matches && innerHeight > innerWidth;
    if (verticale === this.ruota) return;
    this.ruota = verticale;
    this.avvisoRuota.hidden = !verticale;
    if (verticale) {
      this.comandi.lascia();
      this.anims.pauseAll();
    } else if (!this.fermo()) this.anims.resumeAll();
  }

  /** Pulsante della pausa, pannello della pausa provvisoria e avviso di rotazione (HTML sopra il gioco). */
  private creaInterfaccia(interfaccia: HTMLElement): void {
    this.radice = document.createElement('div');
    this.radice.className = 'stanze';
    this.tastoPausa = document.createElement('button');
    this.tastoPausa.type = 'button';
    this.tastoPausa.className = 'hud-pausa-tasto stanze-tasto-pausa';
    this.tastoPausa.setAttribute('aria-label', 'Pausa');
    this.tastoPausa.append(this.iconaPausa());
    this.tastoPausa.addEventListener('click', () => this.apriPausa());
    this.pannelloPausa = document.createElement('div');
    this.pannelloPausa.className = 'stanze-pausa';
    this.pannelloPausa.hidden = true;
    this.pannelloPausa.style.backgroundImage = `url(${retino(12)})`;
    const riprendi = this.tastoScritta('Riprendi', () => this.riprendi());
    const menu = this.tastoScritta('Menu', () => this.scene.start('Menu'));
    this.pannelloPausa.append(this.scrittaPixel('Pausa', 'stanze-titolo'), riprendi, menu);
    this.avvisoRuota = document.createElement('div');
    this.avvisoRuota.className = 'stanze-ruota';
    this.avvisoRuota.hidden = true;
    this.avvisoRuota.append(this.scrittaPixel('Ruota il telefono', 'stanze-titolo'));
    this.lineaJoystick = document.createElement('div');
    this.lineaJoystick.className = 'stanze-linea';
    this.lineaJoystick.hidden = true;
    this.radice.append(this.lineaJoystick, this.tastoPausa, this.pannelloPausa, this.avvisoRuota);
    interfaccia.append(this.radice);
    this.disponi();
  }

  /** Il pulsante della pausa provvisorio, disegnato dal codice: un quadratino scuro con due barre (segnaposto). */
  private iconaPausa(): HTMLCanvasElement {
    const l = STANZA.pausa.lato, c = document.createElement('canvas');
    c.width = c.height = l;
    c.className = 'stanze-scritta';
    const g = c.getContext('2d')!;
    const r = (x: number, y: number, w: number, h: number, colore: string): void => { g.fillStyle = colore; g.fillRect(x, y, w, h); };
    r(0, 0, l, l, '#000000');
    r(1, 1, l - 2, l - 2, '#2a2119');
    r(1, 1, l - 2, 1, '#4a3c31');
    const barra = Math.max(2, Math.round(l / 6)), alta = l - 6;
    r(Math.round(l / 2) - barra - 1, 3, barra, alta, '#efe3c8');
    r(Math.round(l / 2) + 1, 3, barra, alta, '#efe3c8');
    return c;
  }

  private tastoScritta(testo: string, azione: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'stanze-tasto';
    b.append(this.scrittaPixel(testo, ''));
    b.addEventListener('click', azione);
    return b;
  }

  /** Una scritta in Tiny5 a pixel interi: un pixel della lettera = 3 pixel di gioco (come nei pulsanti). */
  private scrittaPixel(testo: string, classe: string): HTMLCanvasElement {
    const c = tela(testo, '#efe3c8', '#000000');
    c.className = `stanze-scritta ${classe}`.trim();
    c.dataset.l = String(c.width);
    c.dataset.a = String(c.height);
    return c;
  }

  /** Misure e posizioni dell'interfaccia: dipendono dallo schermo. */
  private disponi(): void {
    if (!this.radice) return;
    const m = misureHud(), b = bordiHud(m), { lato, ingrandimento: z } = STANZA.pausa;
    this.pannelloPausa.style.backgroundSize = `${4 * m.px}px ${4 * m.px}px`;
    // pulsante piccolo, ma l'area di tocco arriva comunque a TOCCO_MINIMO punti (regola dei 44 punti)
    posa(this.tastoPausa, m.W - b.d - lato * z, b.a, m);
    misura(this.tastoPausa, lato, lato, z, m);
    misura(this.tastoPausa.firstElementChild as HTMLElement, lato, lato, z, m);
    this.tastoPausa.style.setProperty('--margine-tocco', `${Math.max(4, Math.ceil((TOCCO_MINIMO - lato * z * m.px) / 2))}px`);
    for (const c of this.radice.querySelectorAll<HTMLCanvasElement>('.stanze-scritta')) {
      const k = c.classList.contains('stanze-titolo') ? 4 : 3;
      misura(c, Number(c.dataset.l), Number(c.dataset.a), k, m);
    }
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.pausa) this.riprendi();
      else this.apriPausa();
    } else if (e.code === 'KeyM') {
      impostaAudio(!audioAttivo());
    } else {
      return;
    }
    e.preventDefault();
  };
}
