/*
 * Stanze: il gioco a stanze (pivot del 12/11), accanto al survivor e raggiungibile solo dal link di prova.
 * Passo 2 della fetta verticale: una stanza chiusa da muri, il Lampionaio che cammina con il joystick o con WASD,
 * la telecamera che lo tiene al centro, luce e buio come nel survivor.
 * Passo 3: l'attacco a tasto con la Lanterna (src/sistema/attacco.ts): tasto in basso a destra sul telefono, clic e J su computer.
 * Passo 4: i nemici (src/sistema/nemici-stanza.ts) a ondate, la salute del Lampionaio, la Grazia dalla schivata perfetta
 * e «Sei caduto» con Ricomincia e Menu. Dal 13/11: Quiete (tempo senza danni dopo un colpo), attimo al rallentatore della
 * Grazia, joystick disegnati dal codice (src/sistema/joystick-stanze.ts). Passo 5: il Cerchio di luce caricato colpendo
 * (src/sistema/abilita-stanza.ts), con il pulsante accanto al joystick d'attacco o Spazio.
 * Passo 6: tre stanze (src/sistema/percorso.ts) collegate da porte (src/sistema/porte.ts): a stanza ripulita le 3 carte
 * (le strisce del survivor, src/sistema/doni.ts), poi si aprono 2 o 3 porte con la ricompensa mostrata; ci si passa a
 * retino. Gli Echi sono le armi automatiche del survivor (Arsenale), con i nemici nella sua Orda. Dopo la terza stanza:
 * «Fetta completata».
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
import { ATTACCO, COMBATTIMENTO_STANZA, GRAZIA_STANZA, IMPATTO, JOYSTICK_STANZE, ONDATA, PERCORSO, STANZA } from '../data/stanze';
import { Arsenale, type Bonus } from '../sistema/armi';
import { CODICE_AFFINITA, F } from '../sistema/armi-colpo';
import { FONTE } from '../sistema/nemici-stanza';
import { Percorso } from '../sistema/percorso';
import { Porte } from '../sistema/porte';
import { Doni } from '../sistema/doni';
import { ComparsaCarte } from '../sistema/comparsa-carte';
import { LANTERNA } from '../data/armi';
import { PASSIVI, RICARICA_MINIMA, effettoDono, ricaricaDono, type IdDono, type Passivo } from '../data/doni';
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
const DONO = Object.fromEntries(PASSIVI.map((q) => [q.id, q])) as Record<IdDono, Passivo>;

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
  private orologio = 0;
  private scrittaVita = 0;
  private scrittaGrazia!: Phaser.GameObjects.Image;
  private barra!: BarraSalute;
  private pannelloFine!: HTMLElement;
  // passo 6: build (Echi e doni), percorso, porte, carte, passaggio tra le stanze
  arsenale!: Arsenale;
  percorso!: Percorso;
  porte!: Porte;
  doni!: Doni;
  private comparsa!: ComparsaCarte;
  private readonly bonus: Bonus = { danno: 0, ricarica: 1, area: 0, quantita: 0, durata: 0, critico: 0 };
  private dannoLanterna: number = ATTACCO.danno;
  private rigenerazione = 0; // salute al secondo (Erbe amare)
  private scudo = 0; // parte di danno tolta (Scudo di ferro)
  private passaggio = 0; // secondi di passaggio a retino rimasti (0 = nessuno)
  private portaScelta = -1;
  private velaPassaggio!: HTMLElement;
  finita = false; // la fetta è completata

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
    this.passaggio = 0;
    this.portaScelta = -1;
    this.finita = false;
    // si entra dalla porta in basso
    this.x = Math.round(STANZA.larghezza / 2);
    this.y = Math.round(areaCamminabile().y1);
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
    Object.assign(this.bonus, { danno: 0, ricarica: 1, area: 0, quantita: 0, durata: 0, critico: 0 });
    this.arsenale = new Arsenale(this, this.nemici.orda, new Caso(ONDATA.seme + 2), this.bonus, this.effetti);
    // la Lanterna a mano e il Cerchio di luce feriscono attraverso l'arsenale: bonus, stato di Luce, reazioni, numeri
    this.nemici.colpoArma = (j, danno, dx, dy, fonte) => this.arsenale.colpoDaFuori(j, danno, dx, dy, CODICE_AFFINITA.luce, fonte === FONTE.lanterna ? F.lanterna : F.abilita);
    this.percorso = new Percorso(this.arsenale);
    this.percorso.entra(1, 'echi');
    this.porte = new Porte(this);
    this.porte.togli();
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
    // le carte: verticali (Carta_Stanza), con le carte decise dal percorso e la spiegazione del survivor
    const nessuno = new Set<never>();
    this.doni = new Doni(this.radice, this.arsenale, LANTERNA, this.percorso.passivi, new Caso(ONDATA.seme + 3),
      () => ({ usati: 0, totale: 0, unioni: false, scoperte: nessuno, metaRaccolta: 0 }), () => {}, () => true);
    this.radice.querySelector<HTMLElement>('.doni-aiuto')?.setAttribute('hidden', '');
    this.doni.verticali = PERCORSO.carte; // in fila, perché lo schermo è in orizzontale, e compaiono a pop
    // la carta della Lanterna dice la ricarica della Lanterna a mano, non quella automatica del survivor
    this.doni.numeriArma = (arma, livello) => {
      if (arma !== LANTERNA) return null;
      const L = LANTERNA.livelli, liv = L[Math.min(L.length, livello) - 1];
      return { ricarica: Math.round(ATTACCO.ricarica * (liv.ricarica / L[0].ricarica) * 100) / 100 };
    };
    this.comparsa = new ComparsaCarte(this);
    this.ricalcola();
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
      this.doni.distruggi();
      this.comparsa.ferma();
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
    // il passaggio a retino tra due stanze: a metà si cambia stanza
    if (this.passaggio > 0 && !this.pausa && !this.pausaLab && !this.ruota) this.avanzaPassaggio(delta / 1000);
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
    const presi = this.nemici.colpisci(this.x, this.y, angolo, this.attacco.raggio, this.attacco.ampiezza, this.dannoLanterna);
    this.abilita.colpo(presi); // l'abilità si carica solo così
    if (presi > 0) {
      // impatto: un attimo fermo anche il Lampionaio, lo schermo trema appena, un colpo sordo
      if (this.nemici.fermoImpatto) this.fermoColpo = IMPATTO.fermo;
      this.effetti.scuoti(IMPATTO.scossa.forza, IMPATTO.scossa.durata);
      suona('impatto');
    }
  }

  /**
   * Statistiche dalla build: doni (solo quelli che nelle stanze funzionano), livello della Lanterna e Grazia. Si chiama a
   * ogni passo (senza creare niente): la Grazia cambia il danno di tutte le armi.
   */
  private ricalcola(): void {
    const p = this.percorso.passivi, per = (id: IdDono): number => effettoDono(DONO[id], p[id]);
    const b = this.bonus, area = per('stoppinoLungo');
    b.danno = per('saleNero') + (this.grazia > 0 ? this.statGrazia.danno : 0);
    b.ricarica = Math.max(RICARICA_MINIMA, ricaricaDono(DONO.clessidra, p.clessidra));
    b.area = area;
    b.quantita = per('specchio');
    b.durata = per('ceraVotiva');
    b.critico = per('chiodoDiBara');
    const massima = BASE.salute + this.pg.salute + per('cuoreDiCera');
    if (massima > this.saluteMassima) this.salute += massima - this.saluteMassima; // più salute massima: la salute sale
    this.saluteMassima = massima;
    this.velocita = BASE.velocita * (1 + this.pg.velocita + per('aliDiFalena'));
    this.rigenerazione = per('erbeAmare');
    this.scudo = per('scudoDiFerro');
    this.statGrazia.finestra = GRAZIA_STANZA.finestra + per('campanellaDArgento');
    // la Lanterna a mano: i numeri del suo livello nel survivor, con la ricarica del gioco a stanze in proporzione
    const L = LANTERNA.livelli, liv = L[Math.min(L.length, this.percorso.livelloLanterna) - 1];
    this.dannoLanterna = ATTACCO.danno + liv.danno - L[0].danno;
    this.attacco.ricarica = ATTACCO.ricarica * (liv.ricarica / L[0].ricarica) * b.ricarica;
    this.attacco.raggio = ATTACCO.raggio * (liv.raggio / L[0].raggio) * (1 + area);
    this.attacco.ampiezza = ATTACCO.ampiezza * (liv.ampiezza / L[0].ampiezza);
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
    this.salute = Math.max(0, this.salute - danno * (1 - this.scudo));
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

  /** Il gioco è fermo: pausa, Laboratorio aperto, telefono da ruotare, Lampionaio caduto, carte aperte, passaggio, fine. */
  fermo(): boolean {
    return this.pausa || this.pausaLab || this.ruota || this.morto || this.doni?.aperta || this.passaggio > 0 || this.finita;
  }

  /** Tasto Indietro: apre la pausa e basta (dentro la pausa non fa niente: si riprende solo dal pulsante); dalla fine torna al menu. */
  indietro(): boolean {
    if (!this.pannelloFine.hidden) this.scene.start('Menu');
    else if (!this.pausa) this.apriPausa();
    return true;
  }

  apriPausa(): void {
    if (this.pausa || this.morto || this.finita) return;
    this.pausa = true;
    this.doni.sospesa = true;
    this.comandi.lascia();
    this.attacco.lascia();
    this.anims.pauseAll();
    this.pannelloPausa.hidden = false;
  }

  riprendi(): void {
    this.pausa = false;
    this.doni.sospesa = false;
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
    this.ricalcola();
    if (this.rigenerazione > 0) this.salute = Math.min(this.saluteMassima, this.salute + this.rigenerazione * dt);
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
    this.abilita.aggiorna(dt, this.x, this.y, this.nemici, ABILITA.cerchioDiLuce.danno);
    this.nemici.finestra = this.statGrazia.finestra;
    this.nemici.sfioro = this.statGrazia.sfioro;
    const mezzaL = this.scale.width / 2, mezzaA = this.scale.height / 2;
    this.arsenale.aggiorna(dt, this.x, this.y, this.guardaX, this.guardaY, mezzaL, mezzaA);
    const danno = this.nemici.aggiorna(dt, this.x, this.y, mezzaL, mezzaA);
    if (danno > 0) this.ferisci(danno);
    if (this.nemici.schivate > 0) {
      this.schivatePerfette += this.nemici.schivate;
      this.nemici.schivate = 0;
      if (!this.morto) this.iniziaGrazia();
    }
    if (this.morto) return;
    // il percorso: ondate della stanza, carte a stanza ripulita (con «ondate automatiche» spente nel LAB resta fermo)
    if (this.ondateAutomatiche && this.percorso.aggiorna(dt, this.nemici, this.x, this.y)) this.apriCarte();
    // le porte aperte: camminandoci contro si passa alla stanza dopo
    if (this.percorso.fase === 'porte') {
      const k = this.porte.attraversata(this.x, this.y);
      if (k >= 0) this.attraversa(k);
    }
  }

  /** Un'ondata di nemici, lontano dal Lampionaio (LAB). */
  nuovaOndata(): void {
    this.nemici.ondata(this.x, this.y);
    this.ondate++;
  }

  /** Stanza ripulita: le 3 carte. Scelta la carta, si aprono le porte (o la fetta è finita). */
  apriCarte(): void {
    this.percorso.fase = 'carte';
    this.radice.classList.add('con-carte');
    const carte = this.percorso.carte();
    this.comandi.lascia();
    this.attacco.lascia();
    if (!carte.length) {
      this.dopoCarta(null);
      return;
    }
    suona('livello');
    this.doni.mostraReliquiario(carte, (d) => this.dopoCarta(d), 'Un nuovo dono');
    this.comparsa.suCarte([...this.radice.querySelectorAll<HTMLElement>('.doni-carta')], this.doni.zoomCarte, misureHud());
  }

  private dopoCarta(d: Parameters<Percorso['scegli']>[0] | null): void {
    this.comparsa.ferma();
    this.radice.classList.remove('con-carte');
    if (d) this.percorso.scegli(d);
    else this.percorso.fase = this.percorso.ultima ? 'fine' : 'porte';
    this.ricalcola();
    if (this.percorso.fase === 'fine') {
      this.mostraFineFetta();
      return;
    }
    const p = this.percorso.porte();
    this.porte.imposta(p.muri, p.ricompense);
    this.porte.apri();
    suona('campana');
  }

  /** Il Lampionaio entra nella porta k: passaggio a retino, a metà si cambia stanza. */
  attraversa(k: number): void {
    if (this.passaggio > 0 || this.percorso.fase !== 'porte') return;
    this.portaScelta = k;
    this.passaggio = PERCORSO.passaggio;
    this.comandi.lascia();
    this.attacco.lascia();
  }

  private avanzaPassaggio(dt: number): void {
    const prima = this.passaggio, meta = PERCORSO.passaggio / 2;
    this.passaggio = Math.max(0, this.passaggio - dt);
    if (prima > meta && this.passaggio <= meta) this.nuovaStanza();
    // il retino si infittisce fino al nero, poi si dirada (16 = tutto nero)
    const t = this.passaggio > meta ? 1 - (this.passaggio - meta) / meta : this.passaggio / meta;
    const livello = Math.round(16 * Phaser.Math.Clamp(t, 0, 1));
    this.velaPassaggio.hidden = this.passaggio <= 0 || livello <= 0;
    if (!this.velaPassaggio.hidden && this.velaPassaggio.dataset.livello !== String(livello)) {
      this.velaPassaggio.dataset.livello = String(livello);
      this.velaPassaggio.style.backgroundImage = `url(${retino(livello)})`;
    }
  }

  /** La stanza dopo: vuota, con le carte che pescano dalla porta scelta; il Lampionaio entra dal basso. */
  private nuovaStanza(): void {
    const ricompensa = this.porte.ricompense[this.portaScelta] ?? 'dono';
    this.nemici.svuota();
    this.percorso.entra(this.percorso.stanza + 1, ricompensa);
    this.porte.togli();
    this.x = Math.round(STANZA.larghezza / 2);
    this.y = Math.round(areaCamminabile().y1);
    this.guardaX = 0;
    this.guardaY = -1;
  }

  /** «Fetta completata»: nemici battuti, schivate perfette, la build presa; Ricomincia e Menu. */
  private mostraFineFetta(): void {
    this.finita = true;
    this.comandi.lascia();
    this.attacco.lascia();
    this.tastoPausa.hidden = true;
    const p = this.percorso, righe: string[] = [`${this.nemici.uccisi} nemici battuti`, `${this.schivatePerfette} schivate perfette`, `Lanterna ${p.livelloLanterna}`];
    for (const e of this.arsenale.possedute) righe.push(`${e.arma.nome} ${e.livello}`);
    for (const id of PERCORSO.doniAttivi) if (p.passivi[id]) righe.push(`${DONO[id].nome} ${p.passivi[id]}`);
    this.pannelloFine.replaceChildren(
      this.scrittaPixel('Fetta completata', 'stanze-titolo'),
      ...righe.map((t) => this.scrittaPixel(t, 'stanze-etichetta')),
      this.tastoScritta('Ricomincia', () => this.scene.restart()),
      this.tastoScritta('Menu', () => this.scene.start('Menu')),
    );
    this.pannelloFine.hidden = false;
    suona('alba');
    this.disponi();
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
    this.nemici.disegna(cam, px, py);
    this.arsenale.disegna();
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
    this.velaPassaggio = document.createElement('div');
    this.velaPassaggio.className = 'stanze-passaggio';
    this.velaPassaggio.hidden = true;
    this.pannelloFine = document.createElement('div');
    this.pannelloFine.className = 'stanze-pausa stanze-fine';
    this.pannelloFine.hidden = true;
    this.pannelloFine.style.backgroundImage = `url(${retino(12)})`;
    this.lineaJoystick = document.createElement('div');
    this.lineaJoystick.className = 'stanze-linea';
    this.lineaJoystick.hidden = true;
    this.radice.append(this.lineaJoystick, this.tastoPausa, this.velaPassaggio, this.pannelloPausa, this.pannelloFine, this.avvisoRuota);
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
    this.pannelloPausa.style.backgroundSize = this.pannelloFine.style.backgroundSize = this.velaPassaggio.style.backgroundSize = `${4 * m.px}px ${4 * m.px}px`;
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
