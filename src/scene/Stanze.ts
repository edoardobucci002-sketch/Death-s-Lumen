/*
 * Stanze: il gioco a stanze (pivot del 12/11), accanto al survivor e raggiungibile solo dal link di prova.
 * Passo 2 della fetta verticale: una stanza chiusa da muri, il Lampionaio che cammina con il joystick o con WASD,
 * la telecamera che lo tiene al centro, luce e buio come nel survivor.
 * Passo 3: l'attacco a tasto con la Lanterna (src/sistema/attacco.ts): tasto in basso a destra sul telefono, clic e J su computer.
 * Passo 4: i nemici (src/sistema/nemici-stanza.ts) a ondate, la salute del Lampionaio, la Grazia dalla schivata perfetta
 * e «Sei caduto» con Ricomincia e Menu. Dal 13/11: Quiete (tempo senza danni dopo un colpo), attimo al rallentatore della
 * Grazia, joystick disegnati dal codice (src/sistema/joystick-stanze.ts). Passo 5: il Cerchio di luce caricato colpendo
 * (src/sistema/abilita-stanza.ts), con il pulsante accanto al joystick d'attacco o Spazio.
 * Il gioco a stanze è in orizzontale: sul telefono in verticale si ferma e chiede di ruotarlo.
 * Pausa con il pulsante provvisorio in alto a destra (piccolo, area di tocco di 44 punti), P o Esc, Indietro e quando l'app va in secondo piano (pausa provvisoria:
 * Riprendi e Menu). La logica avanza a passo fisso (60 al secondo), il disegno arrotonda tutto al pixel.
 * Nell'indirizzo, per le prove: ?stanze (salta il menu; solo sul link di prova, in sviluppo e nelle prove automatiche).
 */
import Phaser from 'phaser';
import { voce } from '../sistema/asset';
import { bordiHud, ingr, misura, misureHud, posa, retino } from '../sistema/arte';
import { TOCCO_MINIMO } from '../data/hud';
import { entraInPartita, esciDallaPartita } from '../sistema/indietro';
import { BASE, PERSONAGGI, type Personaggio } from '../data/personaggi';
import { LUCE, PIEDI_SEGNAPOSTO } from '../data/mondo';
import { ATTACCO, COMBATTIMENTO_STANZA, GRAZIA_STANZA, IMPATTO, JOYSTICK_STANZE, ONDATA, STANZA } from '../data/stanze';
import { Impatto } from '../sistema/impatto';
import { ABILITA } from '../data/abilita';
import { AbilitaStanza } from '../sistema/abilita-stanza';
import { ARTE_JOYSTICK, preparaJoystickStanze } from '../sistema/joystick-stanze';
import { NemiciStanza } from '../sistema/nemici-stanza';
import { BarraSalute } from '../sistema/barra-salute';
import { vibra } from '../sistema/mobile';
import { Caso } from '../sistema/caso';
import { Comandi } from '../sistema/comandi';
import { Effetti, PROFONDITA } from '../sistema/effetti';
import { AttaccoATasto } from '../sistema/attacco';
import { COLPI } from '../data/armi';
import { audioAttivo, impostaAudio, suona } from '../sistema/audio';
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
  attacco!: AttaccoATasto;
  private effetti!: Effetti;
  private guardaX = 1; // dove guarda il personaggio (l'ultima direzione in cui ha camminato), lunga 1
  private guardaY = 0;
  private readonly puntoCorpo = { x: 0, y: 0 }; // riusato: niente allocazioni nel ciclo di gioco
  // passo 4: salute, ferite, Grazia, morte, nemici e ondate
  salute = 0;
  saluteMassima = 0;
  immortale = false; // LAB
  morto = false;
  grazia = 0; // secondi di Grazia rimasti
  schivatePerfette = 0; // in questa stanza (per il LAB e le prove)
  ferite = 0; // colpi subiti (per il LAB e le prove)
  ondate = 0; // ondate comparse
  ondateAutomatiche = true; // LAB: spente, la stanza resta vuota finché non si chiama un nemico
  nemici!: NemiciStanza;
  abilita!: AbilitaStanza;
  /** Statistiche che le carte potranno migliorare (passo 6): Quiete del Lampionaio e Grazia. Si azzerano in create. */
  quiete: number = COMBATTIMENTO_STANZA.quiete;
  readonly statGrazia = { durata: 0, danno: 0, velocita: 0, finestra: 0, sfioro: 0 };
  private inQuiete = 0; // secondi di Quiete rimasti
  private rallentatore = 0; // secondi veri di rallentatore rimasti
  private fermoColpo = 0; // fermo d'impatto del Lampionaio: secondi in cui non si muove
  private impatto!: Impatto;
  private lampoFerita = 0;
  private attesaFine = 0;
  private attesaOndata = 0;
  private orologio = 0;
  private scrittaVita = 0;
  private scrittaGrazia!: Phaser.GameObjects.Image;
  private barra!: BarraSalute;
  private pannelloFine!: HTMLElement;

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
    this.guardaX = 1;
    this.guardaY = 0;
    this.fiamma = 1;
    this.casoLuce = new Caso(STANZA.seme);
    this.velocita = BASE.velocita * (1 + this.pg.velocita);
    this.saluteMassima = this.salute = BASE.salute + this.pg.salute; // nel gioco a stanze niente rigenerazione (da rivedere)
    this.morto = this.immortale = false;
    this.ondateAutomatiche = true;
    this.fermoColpo = 0;
    this.grazia = this.inQuiete = this.rallentatore = this.lampoFerita = this.attesaFine = this.orologio = this.scrittaVita = 0;
    this.quiete = COMBATTIMENTO_STANZA.quiete;
    const G = GRAZIA_STANZA;
    Object.assign(this.statGrazia, { durata: G.durata, danno: G.danno, velocita: G.velocita, finestra: G.finestra, sfioro: G.sfioro });
    this.anims.globalTimeScale = 1;
    this.schivatePerfette = this.ferite = this.ondate = 0;
    this.attesaOndata = ONDATA.attesaPrima;
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
    this.effetti = new Effetti(this);
    this.impatto = new Impatto(this);
    this.nemici = new NemiciStanza(this, new Caso(ONDATA.seme), this.effetti, this.impatto);
    this.barra = new BarraSalute(this, this.salute);
    const scritta = 'stanze-scritta-grazia';
    if (!this.textures.exists(scritta)) this.textures.addCanvas(scritta, tela('Grazia', '#86c5e8', '#000000'));
    this.scrittaGrazia = this.add.image(0, 0, scritta).setOrigin(0.5, 1).setScale(2).setDepth(PROFONDITA.barra).setVisible(false);

    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    preparaJoystickStanze(this.pg.colore);
    document.documentElement.style.setProperty('--opacita-comandi', String(JOYSTICK_STANZE.opacita));
    this.comandi = new Comandi(interfaccia, {
      metaSinistra: true, mouseAttacca: true, classe: 'joystick-stanze',
      arte: { base: ARTE_JOYSTICK.movimentoBase, pomello: ARTE_JOYSTICK.movimentoPomello },
    });
    this.creaInterfaccia(interfaccia);
    this.attacco = new AttaccoATasto(this, this.radice, this.effetti, () => this.fermo(), (cx, cy) => {
      const px = misureHud().px, cam = this.cameras.main;
      return { x: cam.scrollX + cx / px, y: cam.scrollY + cy / px };
    }, () => this.corpo(), (verso) => this.mira(verso), (angolo) => this.colpisci(angolo));
    this.abilita = new AbilitaStanza(this, this.radice, this.pg.colore, () => this.fermo());
    this.disponi();
    this.controllaVerso();

    this.scale.on('resize', this.ridimensiona, this);
    entraInPartita();
    this.game.events.on('sfondo', this.apriPausa, this);
    window.addEventListener('keydown', this.tasto);
    window.addEventListener('resize', this.ridisponi); // anche quando il LAB cambia una misura senza cambiare lo schermo
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.ridimensiona, this);
      esciDallaPartita();
      this.game.events.off('sfondo', this.apriPausa, this);
      window.removeEventListener('keydown', this.tasto);
      window.removeEventListener('resize', this.ridisponi);
      this.comandi.distruggi();
      this.attacco.distruggi();
      this.abilita.distruggi();
      this.anims.globalTimeScale = 1;
      this.radice.remove();
    });
    this.disegna(0);
  }

  update(_t: number, delta: number): void {
    // dopo la morte: una breve attesa, poi «Sei caduto» (si ferma anche lei con la pausa del LAB e con il telefono da ruotare)
    if (this.morto && this.attesaFine > 0 && !this.pausaLab && !this.ruota) {
      this.attesaFine -= delta / 1000;
      if (this.attesaFine <= 0) this.mostraFine();
    }
    if (this.fermo()) {
      this.accumulo = 0;
      this.disegna(0);
      return;
    }
    // l'attimo al rallentatore della Grazia: parte al 60% e torna normale con una curva morbida. La logica avanza sempre
    // 60 volte al secondo vero, ma a passi più corti: così tutto si muove a ogni fotogramma e non va a scatti
    let scala = 1;
    if (this.rallentatore > 0) {
      this.rallentatore -= delta / 1000;
      const R = GRAZIA_STANZA.rallentatore, t = Phaser.Math.Clamp(1 - this.rallentatore / R.durata, 0, 1);
      scala = R.scala + (1 - R.scala) * t * t * (3 - 2 * t);
    }
    this.anims.globalTimeScale = scala;
    const tempo = delta * scala;
    this.accumulo = Math.min(this.accumulo + delta, RITARDO_MASSIMO_MS);
    while (this.accumulo >= PASSO_MS) {
      this.passo(PASSO * scala);
      this.accumulo -= PASSO_MS;
    }
    this.effetti.aggiorna(tempo / 1000, this.x, this.y - COLPI.corpo);
    this.disegna(tempo / 1000);
  }

  /** Il tocco breve e J: verso il nemico più vicino entro ATTACCO.miraMassima (dai piedi ai piedi). */
  private mira(verso: { x: number; y: number }): boolean {
    const i = this.nemici.vicino(this.x, this.y, ATTACCO.miraMassima);
    if (i < 0) return false;
    const dx = this.nemici.x[i] - this.x, dy = this.nemici.y[i] - this.y, l = Math.hypot(dx, dy);
    if (l < 0.5) return false;
    verso.x = dx / l;
    verso.y = dy / l;
    return true;
  }

  /** Il colpo della Lanterna è partito: ferisce i nemici dentro l'arco (in Grazia fa più male). */
  private colpisci(angolo: number): void {
    const presi = this.nemici.colpisci(this.x, this.y, angolo, ATTACCO.raggio, ATTACCO.ampiezza, ATTACCO.danno * this.bonusGrazia());
    this.abilita.colpo(presi); // l'abilità si carica solo così
    if (presi > 0) {
      // impatto: un attimo fermo anche il Lampionaio, lo schermo trema appena, un colpo sordo
      if (this.nemici.fermoImpatto) this.fermoColpo = IMPATTO.fermo;
      this.effetti.scuoti(IMPATTO.scossa.forza, IMPATTO.scossa.durata);
      suona('impatto');
    }
  }

  /** Il moltiplicatore del danno: in Grazia più alto. */
  private bonusGrazia(): number {
    return 1 + (this.grazia > 0 ? this.statGrazia.danno : 0);
  }

  /** Il Lampionaio subisce un colpo (se non è in Quiete): lampo, scossa, vibrazione; poi la Quiete; a zero salute cade. */
  private ferisci(danno: number): void {
    if (this.inQuiete > 0 || this.morto) return;
    const C = COMBATTIMENTO_STANZA;
    this.ferite++;
    this.inQuiete = this.quiete;
    this.lampoFerita = C.lampo;
    this.effetti.scuoti(C.scossa.forza, C.scossa.durata);
    suona('danno');
    vibra('media');
    if (this.immortale) return;
    this.salute = Math.max(0, this.salute - danno);
    if (this.salute <= 0) {
      this.morto = true;
      this.attesaFine = C.attesaFine;
      this.grazia = 0;
      this.comandi.lascia();
      this.attacco.lascia();
      this.tastoPausa.hidden = true;
      suona('morte');
      vibra('forte');
    }
  }

  /** Schivata perfetta: parte la Grazia (più danno e più velocità per qualche secondo; una nuova non accorcia quella in corso). */
  iniziaGrazia(): void {
    this.grazia = Math.max(this.grazia, this.statGrazia.durata);
    this.rallentatore = GRAZIA_STANZA.rallentatore.durata; // un attimo al rallentatore: si sente che è riuscita
    this.scrittaVita = COMBATTIMENTO_STANZA.scritta.durata;
    suona('speciale');
    vibra('leggera');
  }

  /** Il centro del corpo del personaggio, da cui partono i colpi (sempre lo stesso oggetto). */
  private corpo(): { x: number; y: number } {
    this.puntoCorpo.x = this.x;
    this.puntoCorpo.y = this.y - COLPI.corpo;
    return this.puntoCorpo;
  }

  /** Il gioco è fermo: pausa, Laboratorio aperto, telefono da ruotare o Lampionaio caduto. */
  fermo(): boolean {
    return this.pausa || this.pausaLab || this.ruota || this.morto;
  }

  /** Tasto Indietro: apre la pausa e basta (dentro la pausa non fa niente: si riprende solo dal pulsante); dalla fine torna al menu. */
  indietro(): boolean {
    if (!this.pannelloFine.hidden) this.scene.start('Menu');
    else if (!this.pausa) this.apriPausa();
    return true;
  }

  apriPausa(): void {
    if (this.pausa || this.morto) return;
    this.pausa = true;
    this.comandi.lascia();
    this.attacco.lascia();
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
    this.orologio += dt;
    if (this.grazia > 0) this.grazia -= dt;
    if (this.inQuiete > 0) this.inQuiete -= dt;
    if (this.lampoFerita > 0) this.lampoFerita -= dt;
    if (this.scrittaVita > 0) this.scrittaVita -= dt;
    this.comandi.aggiorna();
    const dx = this.comandi.dx, dy = this.comandi.dy;
    // durante il fermo d'impatto il Lampionaio non avanza (il resto della stanza sì)
    const fermoColpo = this.fermoColpo > 0;
    if (fermoColpo) this.fermoColpo -= dt;
    const passo = fermoColpo ? 0 : this.velocita * (1 + (this.grazia > 0 ? this.statGrazia.velocita : 0)) * dt;
    this.inMoto = dx !== 0 || dy !== 0;
    if (dx < 0) this.versoSinistra = true;
    else if (dx > 0) this.versoSinistra = false;
    if (this.inMoto) {
      const l = Math.hypot(dx, dy);
      this.guardaX = dx / l;
      this.guardaY = dy / l;
    }
    // i muri: i piedi restano dentro l'area camminabile
    const a = areaCamminabile();
    this.x = Phaser.Math.Clamp(this.x + dx * passo, a.x0, a.x1);
    this.y = Phaser.Math.Clamp(this.y + dy * passo, a.y0, a.y1);
    this.attacco.aggiorna(dt, this.guardaX, this.guardaY);
    // l'abilità (il cerchio segue il Lampionaio e rallenta chi c'è dentro), poi i nemici: il colpo più forte che arriva
    // in questo passo e le schivate perfette (finestra e sfioro vengono dalla Grazia del Lampionaio)
    this.abilita.aggiorna(dt, this.x, this.y, this.nemici, ABILITA.cerchioDiLuce.danno * this.bonusGrazia());
    this.nemici.finestra = this.statGrazia.finestra;
    this.nemici.sfioro = this.statGrazia.sfioro;
    const danno = this.nemici.aggiorna(dt, this.x, this.y);
    if (danno > 0) this.ferisci(danno);
    if (this.nemici.schivate > 0) {
      this.schivatePerfette += this.nemici.schivate;
      this.nemici.schivate = 0;
      if (!this.morto) this.iniziaGrazia();
    }
    // ondate provvisorie (passo 4): a stanza ripulita, dopo un attimo, ne arriva un'altra
    if (this.ondateAutomatiche && !this.morto && this.nemici.vivi() === 0 && (this.attesaOndata -= dt) <= 0) this.nuovaOndata();
  }

  /** Un'ondata di nemici, lontano dal Lampionaio. */
  nuovaOndata(): void {
    this.nemici.ondata(this.x, this.y);
    this.ondate++;
    this.attesaOndata = ONDATA.attesaNuova;
  }

  /**
   * La telecamera tiene il personaggio sempre al centro, come nel survivor: il buio è grande quanto lo schermo e segue
   * la lanterna, quindi con il personaggio fuori centro lascerebbe scoperto un pezzo di stanza. Oltre i muri c'è il fondo scuro.
   */
  private disegna(dt: number): void {
    const w = this.scale.width, h = this.scale.height;
    const px = Math.round(this.x), py = Math.round(this.y);
    const cam = this.cameras.main;
    cam.setScroll(px - Math.floor(w / 2) + this.effetti.scossaX, py - Math.floor(h / 2) + this.effetti.scossaY);
    // durante il colpo il personaggio guarda dove colpisce e si sporge un poco (segnaposto dell'animazione attack)
    const colpo = this.attacco.posa > 0, sl = colpo ? ATTACCO.slancio : 0;
    this.giocatore.setPosition(px + Math.round(this.attacco.dx * sl), py + Math.round(this.attacco.dy * sl)).setFlipX(colpo ? this.attacco.dx < 0 : this.versoSinistra);
    this.anima(this.morto ? 'idle' : colpo ? 'attack' : this.inMoto && !this.fermo() ? 'walk' : 'idle');
    // ferito: lampo bianco, poi lampeggia finché è in Quiete; in Grazia si illumina a lampi; caduto: steso e scuro
    const C = COMBATTIMENTO_STANZA;
    this.giocatore.setAngle(this.morto ? (this.versoSinistra ? 90 : -90) : 0);
    this.giocatore.setVisible(this.morto || this.inQuiete <= 0 || Math.floor(this.orologio * C.lampeggio) % 2 === 0);
    if (this.morto) this.giocatore.setTint(0x5a4a4a).setTintMode(Phaser.TintModes.MULTIPLY);
    else if (this.lampoFerita > 0) this.giocatore.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (this.grazia > 0 && Math.floor(this.orologio * GRAZIA_STANZA.lampi) % 2 === 0) this.giocatore.setTint(GRAZIA_STANZA.alone).setTintMode(Phaser.TintModes.ADD);
    else this.giocatore.clearTint();
    this.scrittaGrazia.setPosition(px, py - C.scritta.sopra).setVisible(this.scrittaVita > 0);
    this.barra.disegna(px, py, this.salute, this.saluteMassima, dt, !this.morto);
    this.nemici.disegna();
    this.abilita.disegna(px, py - COLPI.corpo);
    this.impatto.disegna(dt);
    this.attacco.disegna();
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

  /** «Sei caduto»: quanti nemici sono stati battuti, Ricomincia (la stessa stanza da capo) e Menu. */
  private mostraFine(): void {
    const n = this.nemici.uccisi;
    const conto = this.scrittaPixel(`${n} ${n === 1 ? 'nemico battuto' : 'nemici battuti'}`, 'stanze-etichetta');
    this.pannelloFine.replaceChildren(
      this.scrittaPixel('Sei caduto', 'stanze-titolo'),
      conto,
      this.tastoScritta('Ricomincia', () => this.scene.restart()),
      this.tastoScritta('Menu', () => this.scene.start('Menu')),
    );
    this.pannelloFine.hidden = false;
    this.disponi();
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
      this.attacco?.lascia();
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
    this.pannelloFine = document.createElement('div');
    this.pannelloFine.className = 'stanze-pausa stanze-fine';
    this.pannelloFine.hidden = true;
    this.pannelloFine.style.backgroundImage = `url(${retino(12)})`;
    this.lineaJoystick = document.createElement('div');
    this.lineaJoystick.className = 'stanze-linea';
    this.lineaJoystick.hidden = true;
    this.radice.append(this.lineaJoystick, this.tastoPausa, this.pannelloPausa, this.pannelloFine, this.avvisoRuota);
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
    this.attacco?.disponi(m, b);
    if (this.attacco) this.abilita?.disponi(m, this.attacco.riquadro);
    this.pannelloPausa.style.backgroundSize = this.pannelloFine.style.backgroundSize = `${4 * m.px}px ${4 * m.px}px`;
    this.barra?.scala(ingr('salute', m));
    // pulsante piccolo, ma l'area di tocco arriva comunque a TOCCO_MINIMO punti (regola dei 44 punti)
    posa(this.tastoPausa, m.W - b.d - lato * z, b.a, m);
    misura(this.tastoPausa, lato, lato, z, m);
    misura(this.tastoPausa.firstElementChild as HTMLElement, lato, lato, z, m);
    this.tastoPausa.style.setProperty('--margine-tocco', `${Math.max(4, Math.ceil((TOCCO_MINIMO - lato * z * m.px) / 2))}px`);
    for (const c of this.radice.querySelectorAll<HTMLCanvasElement>('.stanze-scritta')) {
      const k = c.classList.contains('stanze-titolo') ? 4 : c.classList.contains('stanze-etichetta') ? 2 : 3;
      misura(c, Number(c.dataset.l), Number(c.dataset.a), k, m);
    }
  }

  private ridisponi = (): void => this.disponi();

  private tasto = (e: KeyboardEvent): void => {
    if (this.morto && e.code !== 'KeyM') return;
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.pausa) this.riprendi();
      else this.apriPausa();
    } else if (e.code === 'KeyJ') {
      if (!this.fermo()) this.attacco.automatico();
    } else if (e.code === 'Space') {
      this.abilita.usa();
    } else if (e.code === 'KeyM') {
      impostaAudio(!audioAttivo());
    } else {
      return;
    }
    e.preventDefault();
  };
}
