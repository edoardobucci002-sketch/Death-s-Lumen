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
 * retino. Gli Echi sono le armi automatiche del survivor (Arsenale), con i nemici nella sua Orda. Dal 17/11 le stanze sono
 * una mappa alla Isaac (src/sistema/mappa.ts); dal 18/11 la porta del Boss si apre con la chiave del Campanaro, entrati dal
 * Boss le porte si chiudono alle spalle e dopo un attimo compare la fine provvisoria, «Il capo arriverà qui». Tesoro e
 * Sosta (18/11): al centro un oggetto da toccare, il forziere (3 carte rare) e la fonte (fiaschetta piena).
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
import { ABILITA_STANZA, ATTACCO, COMBATTIMENTO_STANZA, GRAZIA_STANZA, IMPATTO, JOYSTICK_STANZE, ONDATA, PERCORSO, PORTE, STANZA } from '../data/stanze';
import { Arsenale, type Bonus } from '../sistema/armi';
import { CODICE_AFFINITA, F } from '../sistema/armi-colpo';
import { FONTE } from '../sistema/nemici-stanza';
import { Percorso } from '../sistema/percorso';
import { MURI, Porte, davantiAlMuro, type Muro } from '../sistema/porte';
import { Doni, type Dono } from '../sistema/doni';
import { ComparsaCarte } from '../sistema/comparsa-carte';
import { ECHI_STANZE, LANTERNA_STANZE } from '../data/armi-stanze';
import { PASSIVI, RICARICA_MINIMA, SPECCHIO_STANZE, effettoDono, ricaricaDono, type IdDono, type Passivo } from '../data/doni';
import { Impatto } from '../sistema/impatto';
import { ABILITA } from '../data/abilita';
import { BOT_STANZE } from '../data/bot';
import { BotStanze } from '../sistema/bot-stanze';
import { SimStanze } from '../sistema/sim-stanze';
import { AbilitaStanza } from '../sistema/abilita-stanza';
import { FiaschettaStanza } from '../sistema/fiaschetta-stanza';
import { FIASCHETTA } from '../data/sopravvivenza';
import { ARTE_JOYSTICK, preparaJoystickStanze } from '../sistema/joystick-stanze';
import { NemiciStanza } from '../sistema/nemici-stanza';
import { BarraSalute } from '../sistema/barra-salute';
import { POTENZIALI } from '../data/armi-stanze';
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
import { RompibiliStanza } from '../sistema/rompibili-stanza';
import { BAGLIORE } from '../data/sopravvivenza';
import { BarraCapo } from '../sistema/barra-capo';
import { CAMPANARO } from '../data/campanaro';
import { MINIMAPPA, STANZE_SPECIALI } from '../data/mappa';
import { disegnaMinimappa } from '../sistema/minimappa';
import { generaMappa, opposto, type Mappa } from '../sistema/mappa';

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
  seme: number = ONDATA.seme;
  /** Il bot che gioca al posto del giocatore (null = gioca il giocatore). Con ?bot va veloce e senza disegno. */
  bot: BotStanze | null = null;
  private botVeloce = false;
  /** Il resoconto della partita per le simulazioni del bot (window.__sim alla fine). */
  sim = new SimStanze();
  private comandi!: Comandi;
  private casoLuce = new Caso(STANZA.seme); // solo per il tremolio: non tocca la logica
  private attesaTremolio = 0;
  private fiamma = 1;
  private buio!: Phaser.GameObjects.Image;
  private alone!: Phaser.GameObjects.Image;
  private misureBuio = { w: 0, h: 0 };
  private radice!: HTMLElement;
  private tastoPausa!: HTMLButtonElement;
  private minimappa?: HTMLCanvasElement; // nell'angolo in alto (passo 4 della mappa, 18/11)
  private mappaPausa!: HTMLCanvasElement; // la mappa intera nella pausa
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
  extra = 0; // salute in più (Falce al potenziale): assorbe i colpi prima della salute, dura tutta la Veglia, al massimo POTENZIALI.falce.tetto della massima
  immortale = false; // LAB
  morto = false;
  grazia = 0; // secondi di Grazia rimasti
  schivatePerfette = 0; // in questa stanza (per il LAB e le prove)
  ferite = 0; // colpi subiti (per il LAB e le prove)
  ondate = 0; // ondate comparse
  ondateAutomatiche = true; // LAB: spente, la stanza resta vuota finché non si chiama un nemico
  nemici!: NemiciStanza;
  abilita!: AbilitaStanza;
  fiaschetta!: FiaschettaStanza; // sorsi contati, si beve da sola sotto il 15% di salute (17/11)
  /** Statistiche che le carte potranno migliorare (passo 6): Quiete del Lampionaio e Grazia. Si azzerano in create. */
  quiete: number = COMBATTIMENTO_STANZA.quiete;
  readonly statGrazia = { durata: 0, danno: 0, velocita: 0, finestra: 0, sfioro: 0 };
  private inQuiete = 0; // secondi di Quiete rimasti
  private rallentatore = 0; // secondi veri di rallentatore rimasti
  private fermoColpo = 0; // fermo d'impatto del Lampionaio: secondi in cui non si muove
  private impatto!: Impatto;
  private lampoFerita = 0;
  private feritaAnim = 0; // secondi dell'animazione hurt rimasti (0 se lo sprite non ce l'ha)
  private colpiVisti = 0;
  private durataMossa = 0; // secondi dell'animazione attack (0 se lo sprite non ce l'ha) // per far ripartire l'animazione attack a ogni colpo nuovo
  private attesaFine = 0;
  private orologio = 0;
  private scrittaVita = 0;
  private scrittaGrazia!: Phaser.GameObjects.Image;
  private avvisoVita = 0; // la scritta sopra la testa per la porta del capo (aperta, o chiusa quando ci si spinge contro)
  private avviso!: Phaser.GameObjects.Image;
  private attesaCapo = 0; // nella stanza del Boss: secondi alla fine provvisoria
  private oggetto!: Phaser.GameObjects.Image; // il forziere del tesoro o la fonte della Sosta, al centro della stanza (18/11)
  private barra!: BarraSalute;
  private barraCapo!: BarraCapo; // la salute del Campanaro, in cima allo schermo (17/11)
  private pannelloFine!: HTMLElement;
  // passo 6: build (Echi e doni), percorso, porte, carte, passaggio tra le stanze
  arsenale!: Arsenale;
  rompibili!: RompibiliStanza; // urne, giare e lanterne (dal 16/11), con Cera, mosaico, olio e luce
  percorso!: Percorso;
  porte!: Porte;
  // la mappa del Mondo (17/11, src/sistema/mappa.ts): generata con il seme a ogni Veglia; si gira di porta in porta
  mappa!: Mappa;
  /** LAB: la prossima Veglia (Ricomincia) usa questo seme, per avere un'altra mappa. */
  semeDopo: number | null = null;
  /** LAB e prove: le porte aperte non si attraversano (per provare i muri). */
  porteBloccate = false;
  private verso: number[] = []; // dove porta ogni porta della stanza (indice della mappa), nell'ordine di porte.muri
  private durataPassaggio: number = PERCORSO.passaggio;
  doni!: Doni;
  private comparsa!: ComparsaCarte;
  private readonly bonus: Bonus = { danno: 0, ricarica: 1, area: 0, quantita: 0, durata: 0, critico: 0 };
  private dannoLanterna: number = LANTERNA_STANZE.livelli[0].danno; // il colpo più debole del livello: il più forte va all'arsenale (forbice)
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
    // ?seme=N: un'altra partita (ondate, carte); ?bot: gioca il bot, veloce e senza disegno (npm run sim-stanze);
    // ?esplora=1: il bot sceglie carte e porte a caso. Dal LAB il bot gioca invece alla velocità normale
    const parametri = new URLSearchParams(location.search);
    this.seme = this.semeDopo ?? (Number(parametri.get('seme')) || ONDATA.seme);
    this.semeDopo = null;
    this.mappa = generaMappa(this.seme);
    this.porteBloccate = false;
    this.botVeloce = parametri.has('bot');
    this.bot = this.botVeloce ? new BotStanze() : null;
    if (this.bot && parametri.get('esplora') === '1') this.bot.esplorando(this.seme);
    this.sim = new SimStanze();
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
    this.extra = 0;
    this.saluteMassima = this.salute = BASE.salute + this.pg.salute; // nel gioco a stanze niente rigenerazione (da rivedere)
    this.morto = this.immortale = false;
    this.ondateAutomatiche = true;
    this.fermoColpo = 0;
    this.grazia = this.inQuiete = this.rallentatore = this.lampoFerita = this.feritaAnim = this.attesaFine = this.orologio = this.scrittaVita = this.avvisoVita = this.attesaCapo = 0;
    this.quiete = COMBATTIMENTO_STANZA.quiete;
    const G = GRAZIA_STANZA;
    Object.assign(this.statGrazia, { durata: G.durata, danno: G.danno, velocita: G.velocita, finestra: G.finestra, sfioro: G.sfioro });
    this.anims.globalTimeScale = 1;
    this.schivatePerfette = this.ferite = this.ondate = 0;
    this.passaggio = 0;
    this.portaScelta = -1;
    this.finita = false;
    // si comincia al centro dell'ingresso della mappa: vuoto, sicuro, con le porte già aperte (Edoardo, 17/11)
    this.x = Math.round(STANZA.larghezza / 2);
    this.y = Math.round(STANZA.altezza / 2);
    this.cameras.main.setBackgroundColor(STANZA.colori.fondo);

    creaStanza(this, this.semeStanza(this.mappa.ingresso + 1));
    this.giocatore = this.add.sprite(0, 0, this.chiaveSprite).setDepth(PROFONDITA.personaggio);
    if (voce(this, this.chiaveSprite)?.versioneFile === 0) {
      this.giocatore.setOrigin(PIEDI_SEGNAPOSTO.x / this.giocatore.frame.realWidth, PIEDI_SEGNAPOSTO.y / this.giocatore.frame.realHeight);
    } else {
      this.giocatore.setOrigin(0.5, 1);
    }
    this.anima('idle');
    this.durataMossa = this.durataAnim('attack');
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height);
    this.buio = this.add.image(0, 0, CHIAVI_BUIO[1]).setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.buio);
    this.alone = this.add.image(0, 0, CHIAVI_ALONE[1]).setDepth(PROFONDITA.terreno + 1).setBlendMode(Phaser.BlendModes.ADD);
    this.effetti = new Effetti(this);
    this.impatto = new Impatto(this);
    this.nemici = new NemiciStanza(this, new Caso(this.seme), this.effetti, this.impatto);
    Object.assign(this.bonus, { danno: 0, ricarica: 1, area: 0, quantita: 0, durata: 0, critico: 0 });
    this.arsenale = new Arsenale(this, this.nemici.orda, new Caso(this.seme + 2), this.bonus, this.effetti);
    // la Lanterna a mano e il Cerchio di luce feriscono attraverso l'arsenale: bonus, stato di Luce, reazioni, numeri
    // potenziali degli Echi (gioco a stanze): interrompere gli attacchi, le lapidi che fanno da muro, il Cerchio che abbaglia
    this.arsenale.interrompi = (j) => this.nemici.interrompi(j);
    this.arsenale.inAvviso = (j) => this.nemici.inAvviso(j);
    this.arsenale.campo = { x0: STANZA.muroLati, y0: STANZA.muroAlto, x1: STANZA.larghezza - STANZA.muroLati, y1: STANZA.altezza - STANZA.muroBasso };
    this.nemici.muri = this.arsenale.muri;
    this.nemici.statoArma = (j) => this.arsenale.statoDaFuori(j, CODICE_AFFINITA.luce, F.abilita);
    this.nemici.colpoArma = (j, danno, dx, dy, fonte) => this.arsenale.colpoDaFuori(j, danno, dx, dy, CODICE_AFFINITA.luce, fonte === FONTE.lanterna ? F.lanterna : F.abilita);
    this.percorso = new Percorso(this.arsenale, this.mappa, this.seme);
    this.percorso.entra(this.mappa.ingresso);
    // ?potenziale=candela (per le simulazioni): la partita parte con quell'Eco già al livello 5
    const eco = ECHI_STANZE.find((a) => a.id === parametri.get('potenziale'));
    if (eco) {
      this.arsenale.aggiungi(eco);
      while (this.arsenale.livello(eco) < eco.livelli.length) this.arsenale.potenzia(eco);
    }
    this.porte = new Porte(this);
    // l'oggetto di tesoro e Sosta (segnaposto: il simbolo del medaglione, ingrandito 3 volte)
    this.oggetto = this.add.image(STANZA.larghezza / 2, STANZA.altezza / 2, 'stanze-simbolo-tesoro').setScale(3).setDepth(PROFONDITA.aTerra - 1).setVisible(false);
    this.mostraPorte();
    this.barra = new BarraSalute(this, this.salute);
    const scritta = 'stanze-scritta-grazia';
    if (!this.textures.exists(scritta)) this.textures.addCanvas(scritta, tela('Grazia', '#86c5e8', '#000000'));
    this.scrittaGrazia = this.add.image(0, 0, scritta).setOrigin(0.5, 1).setScale(2).setDepth(PROFONDITA.barra).setVisible(false);
    this.avviso = this.add.image(0, 0, scritta).setOrigin(0.5, 1).setDepth(PROFONDITA.barra).setVisible(false);

    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    preparaJoystickStanze(this.pg.colore);
    document.documentElement.style.setProperty('--opacita-comandi', String(JOYSTICK_STANZE.opacita));
    this.comandi = new Comandi(interfaccia, {
      metaSinistra: true, mouseAttacca: true, classe: 'joystick-stanze',
      arte: { base: ARTE_JOYSTICK.movimentoBase, pomello: ARTE_JOYSTICK.movimentoPomello },
    });
    this.creaInterfaccia(interfaccia);
    this.rompibili = new RompibiliStanza(this, this.nemici.orda, this.arsenale, interfaccia, this.seme, this.effetti, () => this.cambiaLuce());
    this.rompibili.nuovaStanza(this.semeStanza(this.mappa.ingresso + 1), 0, true); // l'ingresso è vuoto
    this.nemici.ostacoli = this.rompibili;
    this.attacco = new AttaccoATasto(this, this.radice, this.effetti, () => this.fermo(), (cx, cy) => {
      const px = misureHud().px, cam = this.cameras.main;
      return { x: cam.scrollX + cx / px, y: cam.scrollY + cy / px };
    }, () => this.corpo(), (verso) => this.mira(verso), (angolo) => this.colpisci(angolo));
    this.abilita = new AbilitaStanza(this, this.radice, this.pg.colore, () => this.fermo());
    this.fiaschetta = new FiaschettaStanza();
    // le carte: verticali (Carta_Stanza), con le carte decise dal percorso e la spiegazione del survivor
    const nessuno = new Set<never>();
    this.doni = new Doni(this.radice, this.arsenale, LANTERNA_STANZE, this.percorso.passivi, new Caso(this.seme + 3),
      () => ({ usati: 0, totale: 0, unioni: false, scoperte: nessuno, metaRaccolta: 0 }), () => {}, () => true);
    this.radice.querySelector<HTMLElement>('.doni-aiuto')?.setAttribute('hidden', '');
    this.doni.verticali = PERCORSO.carte; // in fila, perché lo schermo è in orizzontale, e compaiono a pop
    this.comparsa = new ComparsaCarte(this);
    this.ricalcola();
    this.effetti.preparaFendente(this.attacco.raggio, this.attacco.ampiezza);
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
      this.rompibili.distruggi();
      this.comparsa.ferma();
      this.anims.globalTimeScale = 1;
      this.radice.remove();
    });
    this.disegna(0);
  }

  update(_t: number, delta: number): void {
    if (this.botVeloce) {
      // simulazione: niente disegno, la logica corre più veloce possibile fino alla fine della partita
      const fine = performance.now() + BOT_STANZE.msPerFotogramma;
      while (!this.morto && !this.finita && performance.now() < fine) this.passo(PASSO);
      return;
    }
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
    this.rompibili.rompibili.colpitoArco(this.x, this.y, angolo, this.attacco.raggio, this.attacco.ampiezza);
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
    // lo Specchio delle stanze (17/11): colpi in più e il loro danno, livello per livello (SPECCHIO_STANZE)
    const sp = p.specchio;
    b.quantita = sp > 0 ? SPECCHIO_STANZE.colpi[sp - 1] : 0;
    b.riflesso = sp > 0 ? SPECCHIO_STANZE.danno[sp - 1] : 1;
    b.durata = per('ceraVotiva');
    b.critico = per('chiodoDiBara');
    const massima = BASE.salute + this.pg.salute + per('cuoreDiCera');
    if (massima > this.saluteMassima) this.salute += massima - this.saluteMassima; // più salute massima: la salute sale
    this.saluteMassima = massima;
    this.fiaschetta?.impostaMassimo(FIASCHETTA.sorsi + Math.round(per('lacrimaDiLumen'))); // il Calice riverso: +1 sorso per livello
    this.velocita = BASE.velocita * (1 + this.pg.velocita + per('aliDiFalena') + (this.rompibili && this.rompibili.bagliore > 0 ? BAGLIORE.velocita : 0));
    this.rigenerazione = per('erbeAmare');
    this.scudo = per('scudoDiFerro');
    this.statGrazia.finestra = GRAZIA_STANZA.finestra + per('campanellaDArgento');
    // la Lanterna a mano: i numeri del suo livello nel gioco a stanze (data/armi-stanze.ts), danno a intervallo
    const L = LANTERNA_STANZE.livelli, liv = L[Math.min(L.length, this.percorso.livelloLanterna) - 1];
    this.dannoLanterna = liv.danno;
    this.arsenale.intervalloDaFuori(F.lanterna, liv.danno, liv.dannoMassimo);
    this.arsenale.ricalcolaForbici(); // gli Echi: così anche un numero cambiato dal LAB vale subito
    this.arsenale.intervalloDaFuori(F.abilita, ABILITA_STANZA.colpo.danno, ABILITA_STANZA.colpo.dannoMassimo); // il colpo del Cerchio di luce
    this.attacco.ricarica = liv.ricarica * b.ricarica;
    this.attacco.raggio = liv.raggio * (1 + area);
    this.attacco.ampiezza = liv.ampiezza;
    this.attacco.spalle = liv.spalle;
    // la mossa dura quanto l'animazione attack, se lo sprite ce l'ha; il colpo ferisce quando l'asta cala
    const mossa = this.durataMossa;
    this.attacco.durataPosa = mossa > 0 ? mossa : ATTACCO.posa;
    this.attacco.anticipo = mossa > 0 ? Math.min(ATTACCO.anticipo, mossa) : 0;
  }

  /** Il Lampionaio subisce un colpo (se non è in Quiete, o sempre con «forza»): lampo, scossa, vibrazione; poi la Quiete; a zero salute cade. */
  ferisci(danno: number, forza = false): void {
    if ((this.inQuiete > 0 && !forza) || this.morto) return;
    if (this.rompibili.bagliore > 0 && !forza) return; // il Bagliore: nessun danno
    const C = COMBATTIMENTO_STANZA;
    this.ferite++;
    this.inQuiete = this.quiete;
    this.lampoFerita = C.lampo;
    this.feritaAnim = this.durataAnim('hurt');
    this.effetti.scuoti(C.scossa.forza, C.scossa.durata);
    suona('danno');
    vibra('media');
    if (this.immortale) return;
    // la salute in più va via per prima
    let netto = danno * (1 - this.scudo);
    const assorbito = Math.min(this.extra, netto);
    this.extra -= assorbito;
    netto -= assorbito;
    this.sim.ferita(Math.min(this.salute, netto));
    this.salute = Math.max(0, this.salute - netto);
    if (this.salute <= 0) {
      this.morto = true;
      this.attesaFine = C.attesaFine;
      this.grazia = 0;
      this.comandi.lascia();
      this.attacco.lascia();
      this.tastoPausa.hidden = true;
      suona('morte');
      vibra('forte');
      this.chiudiSim(false);
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
    this.rompibili.nascondiMosaico();
    this.comandi.lascia();
    this.attacco.lascia();
    this.anims.pauseAll();
    disegnaMinimappa(this.mappaPausa, this.mappa, this.percorso.corrente, null);
    this.pannelloPausa.hidden = false;
    this.disponi();
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
    if (this.feritaAnim > 0) this.feritaAnim -= dt;
    if (this.scrittaVita > 0) this.scrittaVita -= dt;
    if (this.avvisoVita > 0) this.avvisoVita -= dt;
    this.ricalcola();
    if (this.rigenerazione > 0) this.salute = Math.min(this.saluteMassima, this.salute + this.rigenerazione * dt);
    this.comandi.aggiorna();
    let dx = this.comandi.dx, dy = this.comandi.dy;
    if (this.bot && !this.morto) {
      this.bot.guida(this.x, this.y, this.nemici, this.velocita * (1 + (this.grazia > 0 ? this.statGrazia.velocita : 0)), this.attacco.raggio,
        COMBATTIMENTO_STANZA.raggio, this.salute / this.saluteMassima, this.abilita.pronta(), ABILITA.cerchioDiLuce.raggio);
      dx = this.bot.dx;
      dy = this.bot.dy;
      if (this.bot.colpisce && this.attacco.attesa <= 0) this.attacco.automatico();
      if (this.bot.abilita) this.abilita.usa();
    }
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
    // urne, giare e lanterne intere: ci si sbatte contro
    this.rompibili.spingiPersonaggio(this.x, this.y, COMBATTIMENTO_STANZA.raggio);
    this.x = Phaser.Math.Clamp(this.rompibili.spintoX, a.x0, a.x1);
    this.y = Phaser.Math.Clamp(this.rompibili.spintoY, a.y0, a.y1);
    this.attacco.aggiorna(dt, this.guardaX, this.guardaY);
    // l'abilità (il cerchio segue il Lampionaio e rallenta chi c'è dentro), poi i nemici: il colpo più forte che arriva
    // in questo passo e le schivate perfette (finestra e sfioro vengono dalla Grazia del Lampionaio)
    this.abilita.aggiorna(dt, this.x, this.y, this.nemici, ABILITA_STANZA.colpo.danno);
    this.nemici.finestra = this.statGrazia.finestra;
    this.nemici.sfioro = this.statGrazia.sfioro;
    const mezzaL = this.scale.width / 2, mezzaA = this.scale.height / 2;
    this.arsenale.senzaBersagli = this.nemici.orda.numero === 0; // senza nemici gli Echi non sparano (Edoardo, 18/11)
    this.arsenale.aggiorna(dt, this.x, this.y, this.guardaX, this.guardaY, mezzaL, mezzaA);
    // il Cerchio di luce acceso rompe ciò che tocca; poi olio, raccolta di gocce e frammenti, Bagliore
    if (this.abilita.attiva > 0) this.rompibili.rompibili.colpitoDa(this.x, this.y - COLPI.corpo, ABILITA.cerchioDiLuce.raggio);
    this.rompibili.aggiorna(dt, this.x, this.y, mezzaL, mezzaA, COMBATTIMENTO_STANZA.raggio);
    // le zone che curano (Acqua santa al potenziale): dentro una pozza si recupera salute
    const cura = this.arsenale.cura(this.saluteMassima);
    if (cura > 0 && !this.morto) this.salute = Math.min(this.saluteMassima, this.salute + cura * dt);
    // la fiaschetta automatica: sotto la soglia si beve da sola, e il sorso cura una parte della salute massima in un secondo
    const sorso = this.fiaschetta.aggiorna(dt, this.salute, this.saluteMassima, !this.morto);
    if (sorso > 0 && !this.morto) this.salute = Math.min(this.saluteMassima, this.salute + sorso * this.saluteMassima);
    // la Falce al potenziale ruba salute solo a salute piena: diventa salute in più (sotto il massimo il furto si perde)
    if (this.arsenale.rubato > 0) {
      if (!this.morto && this.salute >= this.saluteMassima) this.extra = Math.min(POTENZIALI.falce.tetto * this.saluteMassima, this.extra + this.arsenale.rubato);
      this.arsenale.rubato = 0;
    }
    this.nemici.lama = this.arsenale.lama(); // la Lama di luce accieca chi schivi
    const danno = this.nemici.aggiorna(dt, this.x, this.y, mezzaL, mezzaA);
    if (danno > 0) this.ferisci(danno);
    if (this.nemici.schivate > 0) {
      this.schivatePerfette += this.nemici.schivate;
      this.nemici.schivate = 0;
      if (!this.morto) this.iniziaGrazia();
    }
    this.sim.passo(dt, this.salute);
    if (this.morto) return;
    // la stanza del Boss: le porte chiuse alle spalle, poi la fine provvisoria (finché non c'è Seth)
    if (this.percorso.fase === 'fine' && (this.attesaCapo -= dt) <= 0) {
      this.mostraFineFetta();
      return;
    }
    // il percorso: ondate della stanza, carte a stanza ripulita (con «ondate automatiche» spente nel LAB resta fermo)
    if (this.ondateAutomatiche && this.percorso.aggiorna(dt, this.nemici, this.x, this.y)) this.apriCarte();
    // tesoro e Sosta: camminando contro l'oggetto lo si usa
    if (this.percorso.fase === 'porte' && this.oggetto.visible && !this.percorso.qui.ripulita
      && Math.hypot(this.x - this.oggetto.x, this.y - this.oggetto.y) < STANZE_SPECIALI.tocco) this.usaOggetto();
    // le porte aperte: camminandoci contro si passa alla stanza accanto (il bot prima usa l'oggetto, se gli serve)
    if (this.percorso.fase === 'porte' && !this.porteBloccate && !(this.bot && this.oggettoDaUsare())) {
      let k = this.bot ? this.bot.scegliPorta(this.mappa, this.percorso.corrente, this.verso, this.porte.ricompense, this.arsenale.possedute.map((p) => p.arma)) : this.porte.attraversata(this.x, this.y);
      if (this.porte.chiuse[k]) k = -1; // la porta del capo senza la chiave non si attraversa (nemmeno il bot)
      if (k < 0 && this.avvisoVita <= 0 && this.porte.controChiusa(this.x, this.y)) this.avvisa('Serve la chiave del Campanaro');
      if (k >= 0 && this.botVeloce) {
        // simulazione: niente passaggio a retino, si cambia stanza subito
        this.portaScelta = k;
        this.nuovaStanza();
      } else if (k >= 0) this.attraversa(k);
    }
  }

  /** L'oggetto della stanza: il forziere del tesoro o la fonte della Sosta (spenti quando sono già stati usati). */
  private mostraOggetto(): void {
    const s = this.percorso.qui, speciale = s.tipo === 'tesoro' || s.tipo === 'sosta';
    this.oggetto.setVisible(speciale);
    if (!speciale) return;
    this.oggetto.setTexture(s.tipo === 'tesoro' ? 'stanze-simbolo-tesoro' : 'stanze-simbolo-sosta');
    if (s.ripulita) this.oggetto.setTint(0x55504a).setTintMode(Phaser.TintModes.MULTIPLY);
    else this.oggetto.clearTint();
  }

  /** C'è un oggetto che serve ancora: il forziere chiuso, o la fonte con la fiaschetta non piena. */
  oggettoDaUsare(): boolean {
    const s = this.percorso.qui;
    if (s.ripulita) return false;
    return s.tipo === 'tesoro' || (s.tipo === 'sosta' && this.fiaschetta.sorsi < this.fiaschetta.massimo);
  }

  /** Usa l'oggetto: il forziere apre il Reliquiario del tesoro; la fonte riempie la fiaschetta (se non è già piena). */
  usaOggetto(): void {
    const s = this.percorso.qui;
    if (s.ripulita || this.percorso.fase !== 'porte') return;
    if (s.tipo === 'sosta') {
      if (this.fiaschetta.sorsi >= this.fiaschetta.massimo) {
        if (this.avvisoVita <= 0) this.avvisa('La fiaschetta è già piena');
        return;
      }
      this.fiaschetta.sorsi = this.fiaschetta.massimo;
      this.percorso.ripulita();
      this.avvisa('La fiaschetta è piena');
      if (!this.bot) suona('cura');
      this.mostraOggetto();
      this.aggiornaMinimappa();
      this.mostraPorte();
    } else if (s.tipo === 'tesoro') {
      this.percorso.fase = 'carte';
      this.radice.classList.add('con-carte');
      this.comandi.lascia();
      this.attacco.lascia();
      this.mostraCarte(this.percorso.carteTesoro(), 'Un tesoro');
    }
  }

  /** Un'ondata di nemici, lontano dal Lampionaio (LAB). */
  nuovaOndata(): void {
    this.nemici.ondata(this.x, this.y);
    this.ondate++;
  }

  /** Stanza ripulita: le carte. Scelta la carta, si aprono le porte. */
  apriCarte(): void {
    this.percorso.fase = 'carte';
    this.radice.classList.add('con-carte');
    const carte = this.percorso.carte();
    this.comandi.lascia();
    this.attacco.lascia();
    this.sim.stanzaRipulita(this.percorso.stanza, this.salute);
    if (this.percorso.miniboss && !this.morto) {
      // il Campanaro battuto: un sorso della fiaschetta (17/11) e Cera, oltre alle carte della porta scelta
      this.fiaschetta.premio(CAMPANARO.premio.sorsi); // a fiaschetta piena si beve subito
      this.rompibili.cera += CAMPANARO.premio.cera;
      suona('cura');
    }
    this.mostraCarte(carte, 'Un nuovo dono');
  }

  /** Le carte da scegliere (a stanza ripulita, o il Reliquiario del tesoro); il bot sceglie da solo. */
  private mostraCarte(carte: Dono[], titolo: string): void {
    if (!carte.length) {
      this.dopoCarta(null);
      return;
    }
    if (this.bot) {
      this.sim.offerte(carte);
      const d = this.bot.scegliCarta(carte, LANTERNA_STANZE.id);
      this.sim.carta(d);
      this.dopoCarta(d);
      return;
    }
    suona('livello');
    this.doni.mostraReliquiario(carte, (d) => this.dopoCarta(d), titolo);
    this.comparsa.suCarte([...this.radice.querySelectorAll<HTMLElement>('.doni-carta')], this.doni.zoomCarte, misureHud());
  }

  private dopoCarta(d: Parameters<Percorso['scegli']>[0] | null): void {
    this.comparsa.ferma();
    this.radice.classList.remove('con-carte');
    const chiave = this.percorso.chiave;
    if (d) this.percorso.scegli(d);
    else this.percorso.ripulita();
    if (!chiave && this.percorso.chiave) this.avvisa('La porta del capo è aperta'); // il Campanaro battuto: la chiave
    this.mostraOggetto(); // il forziere del tesoro, aperto
    this.ricalcola();
    this.effetti.preparaFendente(this.attacco.raggio, this.attacco.ampiezza); // la carta può aver cambiato la Lanterna
    this.mostraPorte();
    suona('campana');
  }

  /**
   * Le porte della stanza in cui si è: a stanza da ripulire chiuse e senza medaglione; a stanza vuota (ingresso, ripulita)
   * aperte, con il medaglione della ricompensa della stanza dopo.
   */
  private mostraPorte(): void {
    this.aggiornaMinimappa();
    const p = this.percorso.porte();
    this.verso = p.verso;
    if (this.percorso.fase !== 'porte') {
      this.porte.chiudi(p.muri);
      return;
    }
    this.porte.imposta(p.muri, p.ricompense, p.chiuse);
    this.porte.apri();
  }

  /** LAB: le porte della stanza in cui si è, di nuovo (è cambiata la chiave del Campanaro). */
  ridisegnaPorte(): void {
    this.mostraPorte();
  }

  /** Il seme del disegno della stanza n (lastre, muri e rompibili; n = indice della mappa + 1): separato dal caso della logica. */
  semeStanza(n: number): number {
    return (this.seme ^ Math.imul(n, 0x9e3779b1)) >>> 0;
  }

  /** Il Lampionaio entra nella porta k: passaggio a retino, a metà si cambia stanza. */
  attraversa(k: number): void {
    if (this.passaggio > 0 || this.percorso.fase !== 'porte' || k < 0 || k >= this.verso.length || this.porte.chiuse[k]) return;
    this.portaScelta = k;
    // verso una stanza già ripulita il passaggio è più veloce (Edoardo, 17/11)
    this.durataPassaggio = this.mappa.stanze[this.verso[k]].ripulita ? PERCORSO.passaggioRipulita : PERCORSO.passaggio;
    this.passaggio = this.durataPassaggio;
    this.comandi.lascia();
    this.attacco.lascia();
  }

  private avanzaPassaggio(dt: number): void {
    const prima = this.passaggio, meta = this.durataPassaggio / 2;
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

  /** Si passa dalla porta scelta: si entra nella stanza accanto dalla porta sul muro opposto (chi esce a destra entra da sinistra). */
  nuovaStanza(): void {
    const k = this.portaScelta, muro = this.porte.muri[k];
    if (!muro) return;
    this.entraInStanza(this.verso[k], MURI[opposto(MURI.indexOf(muro))]);
  }

  /**
   * Entra nella stanza i della mappa, davanti alla porta sul muro «da» (null: al centro, per il LAB). Lastre e rompibili
   * sono sempre gli stessi per quella stanza (i rompibili già rotti restano rotti); una stanza già ripulita è vuota e aperta.
   */
  entraInStanza(i: number, da: Muro | null): void {
    this.percorso.qui.rotti = this.rompibili.rotti(); // la stanza che si lascia ricorda cosa è rotto
    this.nemici.svuota();
    this.percorso.entra(i);
    const s = this.percorso.qui;
    creaStanza(this, this.semeStanza(i + 1));
    this.rompibili.nuovaStanza(this.semeStanza(i + 1), s.rotti, s.tipo === 'ingresso' || s.tipo === 'tesoro' || s.tipo === 'sosta');
    this.mostraOggetto();
    if (this.percorso.fase === 'lotta') this.sim.entra(this.percorso.stanza, this.percorso.ricompensa, this.salute, s.distanza, s.tipo);
    this.mostraPorte();
    const p = da ? davantiAlMuro(da, PORTE.entrata) : { x: STANZA.larghezza / 2, y: STANZA.altezza / 2 };
    this.x = Math.round(p.x);
    this.y = Math.round(p.y);
    // guarda verso il centro della stanza
    this.guardaX = da === 'sinistra' ? 1 : da === 'destra' ? -1 : 0;
    this.guardaY = da === 'alto' ? 1 : da === 'basso' || !da ? -1 : 0;
    // il Boss: le porte si sono chiuse alle spalle (mostraPorte); dopo un attimo la fine provvisoria (finché non c'è Seth)
    if (this.percorso.fase === 'fine') this.attesaCapo = this.botVeloce ? 0 : PERCORSO.attesaCapo;
  }

  /** Una scritta breve sopra la testa del Lampionaio (la porta del capo), per PERCORSO.avviso secondi. */
  avvisa(testo: string): void {
    const chiave = `stanze-avviso-${testo}`;
    if (!this.textures.exists(chiave)) this.textures.addCanvas(chiave, tela(testo, PORTE.colori.echi, '#000000'));
    this.avviso.setTexture(chiave);
    this.avvisoVita = PERCORSO.avviso;
    if (!this.bot) suona('campana');
  }

  /** Fine della partita: il resoconto per le simulazioni (window.__sim), solo quando gioca il bot. */
  private chiudiSim(completata: boolean): void {
    if (!this.bot) return;
    (window as unknown as { __sim?: unknown }).__sim = this.sim.risultato({
      seme: this.seme, completata, tesoro: !!this.mappa.stanze[this.mappa.tesoro]?.ripulita, sosta: !!this.mappa.stanze[this.mappa.sosta]?.ripulita, stanza: this.percorso.stanza, salute: this.salute, saluteMassima: this.saluteMassima,
      uccisi: this.nemici.uccisi, rinascite: this.nemici.rinascite, schivate: this.schivatePerfette, colpiLanterna: this.attacco.colpi,
      usiAbilita: this.abilita.usi, livelloLanterna: this.percorso.livelloLanterna, arsenale: this.arsenale,
      doni: PERCORSO.doniAttivi.filter((id) => this.percorso.passivi[id] > 0).map((id) => `${DONO[id].nome} ${this.percorso.passivi[id]}`),
    });
  }

  /** La fine provvisoria del Mondo, «Il capo arriverà qui» (finché non c'è Seth): nemici battuti, schivate perfette, la build presa; Ricomincia e Menu. */
  private mostraFineFetta(): void {
    this.finita = true;
    this.chiudiSim(true);
    if (this.botVeloce) return;
    this.comandi.lascia();
    this.attacco.lascia();
    this.tastoPausa.hidden = true;
    const p = this.percorso, righe: string[] = [`${this.nemici.uccisi} nemici battuti`, `${this.schivatePerfette} schivate perfette`, `Lanterna ${p.livelloLanterna}`];
    const cera = this.rompibili.portaCera(!this.immortale && !this.bot);
    if (cera > 0) righe.push(`Cera +${cera}`);
    for (const e of this.arsenale.possedute) righe.push(`${e.arma.nome} ${e.livello}`);
    for (const id of PERCORSO.doniAttivi) if (p.passivi[id]) righe.push(`${DONO[id].nome} ${p.passivi[id]}`);
    this.pannelloFine.replaceChildren(
      this.scrittaPixel('Il capo arriverà qui', 'stanze-titolo'),
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
    // caduto: l'animazione death una volta sola; ferito: hurt, che interrompe anche il colpo
    const cade = this.morto && this.haAnim('death');
    const nuovo = this.attacco.colpi !== this.colpiVisti;
    this.colpiVisti = this.attacco.colpi;
    const tag = this.morto ? (cade ? 'death' : 'idle') : this.feritaAnim > 0 ? 'hurt' : colpo ? 'attack' : this.inMoto && !this.fermo() ? 'walk' : 'idle';
    this.anima(tag, tag === 'attack' && nuovo);
    // ferito: lampo bianco, poi lampeggia finché è in Quiete; in Grazia si illumina a lampi; caduto senza death: steso e scuro
    const C = COMBATTIMENTO_STANZA;
    this.giocatore.setAngle(this.morto && !cade ? (this.versoSinistra ? 90 : -90) : 0);
    this.giocatore.setVisible(this.morto || this.inQuiete <= 0 || Math.floor(this.orologio * C.lampeggio) % 2 === 0);
    if (this.morto && !cade) this.giocatore.setTint(0x5a4a4a).setTintMode(Phaser.TintModes.MULTIPLY);
    else if (this.morto) this.giocatore.clearTint();
    else if (this.lampoFerita > 0) this.giocatore.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (this.grazia > 0 && Math.floor(this.orologio * GRAZIA_STANZA.lampi) % 2 === 0) this.giocatore.setTint(GRAZIA_STANZA.alone).setTintMode(Phaser.TintModes.ADD);
    else if (this.rompibili.bagliore > 0 && Math.floor(this.orologio * (this.rompibili.bagliore < BAGLIORE.ultimi ? BAGLIORE.lampiFine : BAGLIORE.lampi)) % 2 === 0) this.giocatore.setTint(BAGLIORE.alone).setTintMode(Phaser.TintModes.ADD);
    else this.giocatore.clearTint();
    this.scrittaGrazia.setPosition(px, py - C.scritta.sopra).setVisible(this.scrittaVita > 0);
    this.avviso.setPosition(px, py - C.scritta.sopra - (this.scrittaVita > 0 ? 24 : 0)).setScale(2).setVisible(this.avvisoVita > 0);
    this.barra.disegna(px, py, this.salute, this.saluteMassima, dt, !this.morto, this.extra);
    this.nemici.disegna(cam, px, py);
    const capo = this.nemici.indiceCapo(), o = this.nemici.orda;
    this.barraCapo.aggiorna(capo >= 0 ? o.salute[capo] / o.saluteMassima[capo] : null);
    this.arsenale.disegna();
    this.abilita.disegna(px, py - COLPI.corpo);
    this.impatto.disegna(dt);
    this.attacco.disegna();
    const bx = px - cam.scrollX - Math.floor(this.misureBuio.w / 2);
    const by = py - LUCE.altezza - cam.scrollY - Math.floor(this.misureBuio.h / 2);
    this.rompibili.disegna(cam, this.fiamma, dt);
    this.porte.luce(px, py);
    this.buio.setTexture(this.rompibili.buio(CHIAVI_BUIO[this.fiamma], this.fiamma, bx, by, this.misureBuio.w, this.misureBuio.h, cam)).setPosition(bx, by);
    this.alone.setTexture(CHIAVI_ALONE[this.fiamma]).setPosition(px, py - LUCE.altezza);
  }

  /** Avvia un'animazione; se lo sprite non ha quel tag, resta su idle. death e attack si giocano una volta sola. */
  private anima(tag: string, daCapo = false): void {
    const chiave = this.haAnim(tag) ? `${this.chiaveSprite}:${tag}` : `${this.chiaveSprite}:idle`;
    const una = tag === 'death' || tag === 'attack';
    const a = this.giocatore.anims;
    // già in corso, oppure finita e ferma sull'ultimo fotogramma (death, attack): non si ricomincia
    if (!daCapo && a.currentAnim?.key === chiave && (a.isPlaying || una)) return;
    this.giocatore.play({ key: chiave, repeat: una ? 0 : -1 });
  }

  /** Lo sprite del personaggio ha il tag di Aseprite «tag»? */
  private haAnim(tag: string): boolean {
    return this.anims.exists(`${this.chiaveSprite}:${tag}`);
  }

  /** Quanto dura un'animazione del personaggio, in secondi (0 se lo sprite non ha quel tag). */
  durataAnim(tag: string): number {
    const a = this.anims.get(`${this.chiaveSprite}:${tag}`);
    if (!a) return 0;
    let ms = 0;
    for (const f of a.frames) ms += f.duration;
    return ms / 1000;
  }

  /** «Sei caduto»: quanti nemici sono stati battuti, Ricomincia (la stessa stanza da capo) e Menu. */
  private mostraFine(): void {
    const n = this.nemici.uccisi;
    const conto = this.scrittaPixel(`${n} ${n === 1 ? 'nemico battuto' : 'nemici battuti'}`, 'stanze-etichetta');
    const cera = this.rompibili.portaCera(!this.immortale && !this.bot);
    this.pannelloFine.replaceChildren(
      this.scrittaPixel('Sei caduto', 'stanze-titolo'),
      conto,
      ...(cera > 0 ? [this.scrittaPixel(`Cera +${cera}`, 'stanze-etichetta')] : []),
      this.tastoScritta('Ricomincia', () => this.scene.restart()),
      this.tastoScritta('Menu', () => this.scene.start('Menu')),
    );
    this.pannelloFine.hidden = false;
    this.disponi();
  }

  /** Il Bagliore allarga la luce del personaggio (BAGLIORE.luce); finito, torna com'era. */
  cambiaLuce(): void {
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height, LUCE.raggio * (this.rompibili.bagliore > 0 ? BAGLIORE.luce : 1));
    this.ricalcola();
  }

  private ridimensiona(): void {
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height, LUCE.raggio * (this.rompibili && this.rompibili.bagliore > 0 ? BAGLIORE.luce : 1));
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
    this.mappaPausa = document.createElement('canvas');
    this.mappaPausa.className = 'stanze-mappa-pausa';
    this.pannelloPausa.append(this.scrittaPixel('Pausa', 'stanze-titolo'), this.mappaPausa, riprendi, menu);
    this.minimappa = document.createElement('canvas');
    this.minimappa.className = 'stanze-minimappa';
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
    this.radice.append(this.lineaJoystick, this.minimappa, this.tastoPausa, this.velaPassaggio, this.pannelloPausa, this.pannelloFine, this.avvisoRuota);
    this.barraCapo = new BarraCapo(this.radice);
    interfaccia.append(this.radice);
    this.aggiornaMinimappa();
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
    // la minimappa: in alto a sinistra, o a destra accanto alla pausa (MINIMAPPA.lato, dal LAB)
    if (this.minimappa?.dataset.l) {
      const w = Number(this.minimappa.dataset.l), h = Number(this.minimappa.dataset.a), zm = MINIMAPPA.ingrandimento;
      posa(this.minimappa, MINIMAPPA.lato === 'destra' ? m.W - b.d - lato * z - 4 - w * zm : b.s, b.a, m);
      misura(this.minimappa, w, h, zm, m);
    }
    if (this.mappaPausa.dataset.l) {
      // nella pausa: grande quanto MINIMAPPA.ingrandimentoPausa, o meno se non ci sta (al massimo 80% della larghezza e 45% dell'altezza)
      const w = Number(this.mappaPausa.dataset.l), h = Number(this.mappaPausa.dataset.a);
      const zp = Math.max(1, Math.min(MINIMAPPA.ingrandimentoPausa, Math.floor((m.W * 0.8) / w), Math.floor((m.H * 0.45) / h)));
      misura(this.mappaPausa, w, h, zp, m);
    }
    for (const c of this.radice.querySelectorAll<HTMLCanvasElement>('.stanze-scritta')) {
      const k = c.classList.contains('stanze-titolo') ? 4 : c.classList.contains('stanze-etichetta') ? 2 : 3;
      misura(c, Number(c.dataset.l), Number(c.dataset.a), k, m);
    }
  }

  private ridisponi = (): void => this.disponi();

  /** La minimappa nell'angolo: si ridisegna entrando in una stanza (e quando il LAB cambia la mappa). */
  aggiornaMinimappa(): void {
    if (!this.minimappa) return;
    disegnaMinimappa(this.minimappa, this.mappa, this.percorso.corrente, MINIMAPPA.finestra);
    this.disponi();
  }

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
