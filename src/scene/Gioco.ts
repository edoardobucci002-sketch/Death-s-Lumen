/*
 * Gioco: una notte nel cimitero. Il personaggio cammina, le armi colpiscono da sole, i nemici arrivano dal buio;
 * i nemici uccisi lasciano anime e a volte pane, calamite e reliquiari; a ogni livello si sceglie un dono.
 * La notte ha i suoi eventi: élite ogni 55 s, sciami a inizio minuto, orde in formazione ogni 80 s dal 2:30,
 * il Mietitore ai minuti 5 e 10 (con le sue mosse), l'alba al 15.
 * La fiaschetta (pulsante o F) cura a sorsi contati; schivare all'ultimo istante le mosse del Mietitore dà la Grazia.
 * Meta progressione: i ceri accesi della Cappella entrano nelle statistiche; a fine veglia si conta e si salva la Cera
 * e si controllano gli sblocchi dei personaggi. ?meta=0|meta|max finge la Cappella vuota, a metà o completa.
 * Pausa con il pulsante, P o Esc, Indietro su Android e quando l'app va in secondo piano; M accende e spegne i suoni.
 * La logica avanza a passo fisso (60 al secondo), il disegno arrotonda tutto al pixel.
 * Nell'indirizzo, per le prove: ?pg=becchino (salta il menu), ?minuto=5 (parte da quel minuto),
 * ?nemici=400 (riempie subito il campo), ?immortale (non si muore), ?livello=8 (armi già a quel livello),
 * ?automatico (sceglie da solo la prima carta a ogni livello), ?armi=candela,falce (armi in più, per provarle),
 * ?seme=7 (un'altra notte), ?bot (gioca il bot, senza disegno e più veloce possibile: lo usa npm run sim).
 */
import Phaser from 'phaser';
import { voce } from '../sistema/asset';
import { arte, fasce, ingr, misureHud } from '../sistema/arte';
import { entraInPartita, esciDallaPartita } from '../sistema/indietro';
import { preparaSegnapostoFasce } from '../sistema/segnaposto-fasce';
import { FINESTRE } from '../data/hud';
import { BASE, PERSONAGGI, type Personaggio } from '../data/personaggi';
import { BARRA_SALUTE, LUCE, PRESTAZIONI, PIEDI_SEGNAPOSTO, SEME_PREDEFINITO } from '../data/mondo';
import { COMBATTIMENTO, COMPARSA, DIFFICOLTA, ELITE, MIETITORE, NEMICI, ORDE, type FormaOrda } from '../data/nemici';
import { EFFETTI } from '../data/effetti';
import { ARMI_COMUNI, ARMI_INIZIALI, COLPI, MAX_ARMI, type Arma } from '../data/armi';
import { ABILITA } from '../data/abilita';
import { PASSIVI, RICARICA_MINIMA, type IdDono } from '../data/doni';
import { animePerLivello, CARTE } from '../data/progressione';
import { ALBA, DROP } from '../data/oggetti';
import { BOT } from '../data/bot';
import { Anime } from '../sistema/anime';
import { Arsenale, FONTI, type Bonus } from '../sistema/armi';
import { Bot } from '../sistema/bot';
import { suona, audioAttivo, impostaAudio } from '../sistema/audio';
import { Caso } from '../sistema/caso';
import { Comandi } from '../sistema/comandi';
import { Doni, type Dono } from '../sistema/doni';
import { Effetti, PROFONDITA } from '../sistema/effetti';
import { Hud, tempo, type VoceBuild } from '../sistema/hud';
import type { DatiPausa, SchedaPausa, VoceUnione } from '../sistema/pausa';
import { Rivelazione } from '../sistema/rivelazione';
import { Mosaico } from '../sistema/mosaico';
import { voceArma, voceDono } from '../sistema/scheda';
import { vibra } from '../sistema/mobile';
import { CALAMITA, CERA_GOCCIA, FRAMMENTO, Oggetti, PANE, RELIQUIARIO } from '../sistema/oggetti';
import { LUCE as LUCE_AFF, OMBRA as OMBRA_AFF, SACRO as SACRO_AFF, TERRA as TERRA_AFF } from '../sistema/orda';
import { Orda, type CategoriaNemico } from '../sistema/orda';
import { Minacce } from '../sistema/minacce';
import { leggiRecord, salvaRecord } from '../sistema/record';
import { Simulazione, type RisultatoSim } from '../sistema/simulazione';
import { Speciale } from '../sistema/speciale';
import { Fiaschetta } from '../sistema/fiaschetta';
import { BAGLIORE, FIASCHETTA, GRAZIA } from '../data/sopravvivenza';
import { CERA, SBLOCCHI, SBLOCCHI_OGGETTI, SBLOCCO_ROSARIO, SBLOCCO_UNIONI, SECONDA_CANDELA, type IdOggetto } from '../data/meta';
import { iconaUnione, livelloDonoUnione, unioneDi, UNIONI, type IdUnione, type Unione } from '../data/unioni';
import { AMULETI, AMULETI_NUMERI as AM, ROSARIO, amuleto, type IdAmuleto } from '../data/rosario';
import { iconaAmuleto } from '../sistema/amuleti';
import { chiaro, INFO_REAZIONI, NOME_COLPI_IN_PIU, segnoPercento, virgola } from '../data/spiegazioni';
import { AFFINITA_ABILITA, AFFINITA_ARMI } from '../data/stati';
import { bonusMeta, carica, salva, type BonusMeta, type VoceVeglia } from '../sistema/salvataggio';
import { Rompibili } from '../sistema/rompibili';
import { Chiazze } from '../sistema/chiazze';
import { FRAMMENTI, ROMPIBILI } from '../data/rompibili';
import { creaTerreno } from '../sistema/terreno';
import { CHIAVI_ALONE, CHIAVI_BUIO, creaBuio } from '../sistema/luce';

const PASSO = 1 / 60;
const PASSO_MS = 1000 * PASSO;
const RITARDO_MASSIMO_MS = 250; // dopo un blocco lungo non recupera all'infinito

/** Quanto chiede l'impresa dell'oggetto id. */
const SOGLIA = (id: IdOggetto): number => SBLOCCHI_OGGETTI.find((o) => o.id === id)!.soglia ?? Infinity;

export class Gioco extends Phaser.Scene {
  pg!: Personaggio;
  x = 0; // posizione dei piedi nel mondo, in pixel di gioco
  y = 0;
  secondi = 0; // tempo di gioco
  salute = 0;
  saluteMassima = 0;
  morto = false;
  finito = false; // morto o arrivato all'alba
  pausa = false;
  orda!: Orda;
  arsenale!: Arsenale;
  livello = 1;
  esperienza = 0; // anime raccolte verso il prossimo livello
  animeTotali = 0;
  /** Livello di ogni dono passivo (0 = non posseduto). */
  passivi = {} as Record<IdDono, number>;
  giocatore!: Phaser.GameObjects.Sprite;
  speciale!: Speciale;
  private livelliDaScegliere = 0;
  private anime!: Anime;
  private oggetti!: Oggetti;
  private minacce!: Minacce;
  private rompibili: Rompibili | null = null; // nelle simulazioni non ci sono: il bot non li cerca
  private chiazze: Chiazze | null = null;
  private frammenti = 0; // frammenti di vetro raccolti verso il prossimo reliquiario
  private urneRotte = 0; // in questa notte: serve a tarare la probabilità dei frammenti
  private frammentiCaduti = 0; // quanti ne sono usciti dalle urne in questa notte
  private mosaiciAperti = false; // i frammenti escono solo dopo la prima alba
  private bagliore = 0; // secondi di Bagliore rimasti
  private alone!: Phaser.GameObjects.Image;
  private effetti!: Effetti;
  private doni!: Doni;
  private rivelazione!: Rivelazione; // l'animazione della scoperta di un'Unione
  private mosaico!: Mosaico; // il mosaico dei frammenti di vetro
  private raccolta = 0;
  private rigenerazione = 0;
  private bonus: Bonus = { danno: 0, ricarica: 1, area: 0, quantita: 0, durata: 0, critico: 0 };
  private areaLuce = 0;
  private dirX = 1; // ultima direzione in cui ha camminato (le armi colpiscono da quella parte)
  private dirY = 0;
  private velocita = 0;
  private armatura = 0; // parte di danno in meno (0,15 = −15%)
  private moltAnime = 1; // Calamita: anime in più
  private invulnerabile = 0; // secondi rimasti
  private attesaFine = 0;
  private immortale = false;
  private automatico = false;
  private bot: Bot | null = null; // con ?bot gioca lui
  private sim: Simulazione | null = null;
  private fiaschetta!: Fiaschetta;
  private grazia = 0; // secondi di Grazia rimasti
  private meta!: BonusMeta; // ceri accesi della Cappella
  private candelaUsata = false; // Seconda candela
  private eliteUccise = 0;
  private uccisi = 0; // nemici uccisi in questa veglia
  private ceraRaccolta = 0; // gocce di Cera raccolte in questa veglia
  private schivateNotte = 0; // schivate perfette in questa veglia (imprese)
  private secondiNubi = 0; // secondi passati dentro le nubi in questa veglia (imprese)
  private oggettiSbloccati = new Set<string>();
  private sethSconfitti = 0;
  // Rosario: amuleti trovati nei reliquiari e quali sono accesi (si spengono dalla pausa)
  private amuletiPosseduti: IdAmuleto[] = [];
  private amuletiAccesi = new Set<IdAmuleto>();
  private rosarioSbloccato = false;
  private unioniSbloccate = false;
  private unioniScoperte = new Set<IdUnione>(); // arma e dono sono stati insieme, anche nelle notti passate
  private unioniUnite = new Set<IdUnione>(); // fatte almeno una volta: restano per sempre nella scheda Stati
  private scoperteDiProva = false; // il Laboratorio ha forzato le unioni: non si salvano
  private sangueFreddoAttivo = false;
  private ultimaDanza = -99; // secondi dell'ultima Grazia data dalla Danza macabra
  private prossimoAbbaglio = 0;
  private reliquiariInAttesa = 0; // reliquiari raccolti mentre era già aperta una scelta
  private pausaLab = false; // il Laboratorio tiene fermo il gioco
  private inMoto = false;
  private versoSinistra = false;
  private chiaveSprite = '';
  // eventi della notte
  private prossimaElite = 0;
  private prossimaOrda = 0; // indice in ORDE.copione
  private ordaAnnunciata = false;
  private angoloOrda = 0;
  private prossimoPane = 0; // secondi: prima di allora non cade altro pane
  private prossimaCalamita = 0;
  private mietitoriArrivati = 0;
  private terreno!: Phaser.GameObjects.TileSprite;
  private fineFinta = 0; // Prova prestazioni: la notte non va oltre questi secondi
  private foriBuio = true; // solo il Laboratorio li spegne
  private campoL = 0; // pixel di gioco del campo: sul telefono in verticale è meno dello schermo
  private campoA = 0;
  private buio!: Phaser.GameObjects.Image;
  private saluteCornice!: Phaser.GameObjects.Image;
  private salutePiena!: Phaser.GameObjects.Image;
  private zSalute = 1;
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

  create(dati: { pg?: string }): void {
    const parametri = new URLSearchParams(location.search);
    const scelto = dati?.pg ?? parametri.get('pg');
    this.pg = PERSONAGGI.find((p) => p.id === scelto) ?? PERSONAGGI[0];
    document.documentElement.style.setProperty('--accento', this.pg.colore);
    // finché un personaggio non ha il suo sprite in gioco, usa quello del Lampionaio (segnaposto)
    this.chiaveSprite = this.textures.exists(this.pg.sprite) ? this.pg.sprite : PERSONAGGI[0].sprite;
    for (const q of PASSIVI) this.passivi[q.id] = 0;
    this.grazia = 0;
    this.candelaUsata = false;
    this.eliteUccise = this.sethSconfitti = this.ceraRaccolta = this.uccisi = 0;
    this.meta = bonusMeta(carica(), parametri.get('meta') ?? (parametri.has('bot') ? '0' : null));
    this.oggettiSbloccati = new Set(parametri.has('senzaoggetti') ? [] : parametri.has('oggetti') ? SBLOCCHI_OGGETTI.map((o) => o.id) : this.meta.oggetti); // ?senzaoggetti, ?oggetti: per confrontare le simulazioni
    for (const id of (parametri.get('blocca') ?? '').split(',')) this.oggettiSbloccati.delete(id as IdOggetto); // ?blocca=corvo,lapide: per le simulazioni
    this.unioniSbloccate = (this.meta.unioni && !parametri.has('senzaunioni')) || parametri.has('unioni');
    this.unioniScoperte = new Set(carica().unioniScoperte);
    this.unioniUnite = new Set(carica().unioniUnite);
    this.scoperteDiProva = false;
    this.rosarioSbloccato = (this.meta.rosario && !parametri.has('senzarosario')) || parametri.has('rosario'); // ?senzarosario: per confrontare le simulazioni
    this.amuletiPosseduti = [];
    this.amuletiAccesi.clear();
    this.sangueFreddoAttivo = false;
    this.ultimaDanza = -99;
    this.prossimoAbbaglio = this.reliquiariInAttesa = 0;
    this.pausaLab = false;
    this.fineFinta = 0; // la scena si riusa: ciò che fa la Prova prestazioni non deve restare nella notte dopo
    this.foriBuio = true;
    this.ricalcola();
    this.salute = this.saluteMassima;
    this.immortale = parametri.has('immortale');
    this.automatico = parametri.has('automatico');
    this.caso = new Caso(Number(parametri.get('seme')) || SEME_PREDEFINITO);
    this.x = this.y = 0;
    this.secondi = 60 * Number(parametri.get('minuto') ?? 0) || 0;
    this.morto = this.finito = this.pausa = false;
    this.invulnerabile = this.attesaFine = this.accumulo = 0;
    this.livello = 1;
    this.esperienza = this.livelliDaScegliere = this.animeTotali = 0;
    this.dirX = 1;
    this.dirY = 0;
    // se la partita parte più avanti (prove), gli eventi già passati non si ripetono
    this.prossimaElite = Math.max(ELITE.primo, Math.ceil(this.secondi / ELITE.ogni) * ELITE.ogni);
    this.prossimoPane = this.prossimaCalamita = 0;
    this.prossimaOrda = Math.max(0, ORDE.copione.findIndex((o) => o.minuto * 60 >= this.secondi));
    if (ORDE.copione.every((o) => o.minuto * 60 < this.secondi)) this.prossimaOrda = ORDE.copione.length;
    this.ordaAnnunciata = false;
    this.mietitoriArrivati = MIETITORE.minuti.filter((m) => m * 60 < this.secondi).length;

    this.misuraCampo();
    creaTerreno(this, 'terreno', SEME_PREDEFINITO);
    this.terreno = this.add.tileSprite(0, 0, this.campoL, this.campoA, 'terreno').setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.terreno);
    this.minacce = new Minacce(this);
    this.orda = new Orda(this, this.caso, this.minacce);
    this.anime = new Anime(this);
    this.oggetti = new Oggetti(this);
    this.effetti = new Effetti(this);
    this.arsenale = new Arsenale(this, this.orda, this.caso, this.bonus, this.effetti);
    this.arsenale.anime = this.anime;
    this.rompibili = parametri.has('bot') && !parametri.has('rompibili') ? null : new Rompibili(this, Number(parametri.get('seme')) || Date.now() % 2147483647, this.oggettoRotto);
    this.chiazze = this.rompibili ? new Chiazze(this, this.orda, this.arsenale) : null;
    this.arsenale.rompibili = this.rompibili;
    this.arsenale.chiazze = this.chiazze;
    this.frammenti = 0;
    this.bagliore = 0;
    this.frammentiCaduti = this.urneRotte = 0;
    this.mosaiciAperti = carica().vittorie >= FRAMMENTI.vittorie;
    const arma = ARMI_INIZIALI[this.pg.armaIniziale];
    this.arsenale.aggiungi(arma);
    const livelloProva = Math.min(CARTE.livelloMassimo, Number(parametri.get('livello')) || 1);
    for (let l = 1; l < livelloProva; l++) this.arsenale.potenzia(arma);
    for (const id of (parametri.get('armi') ?? '').split(',')) {
      const extra = ARMI_COMUNI.find((a) => a.id === id);
      if (!extra || this.arsenale.livello(extra)) continue;
      this.arsenale.aggiungi(extra);
      for (let l = 1; l < livelloProva; l++) this.arsenale.potenzia(extra);
    }
    this.giocatore = this.add.sprite(0, 0, this.chiaveSprite);
    this.anima('idle');
    if (voce(this, this.chiaveSprite)?.versioneFile === 0) {
      this.giocatore.setOrigin(PIEDI_SEGNAPOSTO.x / this.giocatore.frame.realWidth, PIEDI_SEGNAPOSTO.y / this.giocatore.frame.realHeight);
    } else {
      this.giocatore.setOrigin(0.5, 1);
    }
    this.areaLuce = this.fattoreLuce();
    this.misureBuio = creaBuio(this, this.campoL, this.campoA, LUCE.raggio * this.areaLuce);
    this.buio = this.add.image(0, 0, CHIAVI_BUIO[1]).setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.buio);
    this.alone = this.add.image(0, 0, CHIAVI_ALONE[1]).setDepth(PROFONDITA.terreno + 1).setBlendMode(Phaser.BlendModes.ADD);
    // barra della salute sotto i piedi, sopra il buio così si vede sempre
    // (disegnata da Edoardo: cornice col cuore e riempimento che si taglia da sinistra)
    this.saluteCornice = this.add.image(0, 0, 'Barra_Salute_Cornice').setOrigin(0).setDepth(PROFONDITA.barra);
    this.salutePiena = this.add.image(0, 0, 'Barra_Salute_Piena').setOrigin(0).setDepth(PROFONDITA.barra + 0.1);
    this.scalaSalute();

    const interfaccia = document.getElementById('interfaccia')!;
    preparaSegnapostoFasce();
    interfaccia.replaceChildren();
    this.comandi = new Comandi(interfaccia);
    this.hud = new Hud(interfaccia, {
      pausa: () => this.apriPausa(),
      riprendi: () => this.riprendi(),
      riprova: () => this.scene.restart({ pg: this.pg.id }),
      menu: () => this.scene.start('Menu'),
      amuleto: (id) => this.commutaAmuleto(id),
    });
    // altezza vera del personaggio: dalla riga più alta a quella più bassa usate nei fotogrammi
    const fotogrammi = (this.cache.json.get(this.chiaveSprite) as { frames: { spriteSourceSize: { y: number; h: number } }[] }).frames;
    this.hud.impostaPersonaggio((Math.max(...fotogrammi.map((f) => f.spriteSourceSize.y + f.spriteSourceSize.h)) - Math.min(...fotogrammi.map((f) => f.spriteSourceSize.y))) * this.giocatore.scaleY);
    this.rivelazione = new Rivelazione(interfaccia, () => {
      this.doni.sospesa = this.pausa;
      if (!this.fermo()) this.anims.resumeAll();
    });
    this.mosaico = new Mosaico(interfaccia);
    this.doni = new Doni(interfaccia, this.arsenale, arma, this.passivi, this.caso, () => ({ usati: this.graniUsati(), totale: this.grani(), unioni: this.unioniSbloccate, scoperte: this.unioniScoperte }), () => this.apriPausa('stati'), (id) => this.disponibile(id));
    this.doni.aggiungiRimescolate(this.meta.rimescolate);
    this.speciale = new Speciale(interfaccia, ABILITA[this.pg.abilita], this.pg.nome.replace(/ /g, '_'), () => {
      if (this.finito || this.fermo()) return false;
      this.arsenale.abilita(ABILITA[this.pg.abilita]);
      suona('speciale');
      vibra('media');
      return true;
    });
    this.fiaschetta = new Fiaschetta(interfaccia, `Speciale_${this.pg.nome.replace(/ /g, '_')}`, () => {
      if (this.finito || this.fermo() || this.salute >= this.saluteMassima || this.ha('pattoDiSangue')) return false;
      suona('cura');
      vibra('leggera');
      this.sim?.bevuto();
      return true;
    });
    this.aggiornaBuild();
    this.bot = parametri.has('bot') ? new Bot(this.orda, this.anime, this.oggetti, this.minacce, arma) : null;
    if (this.bot && parametri.has('cercaurne')) this.bot.urne = this.rompibili;
    this.sim = this.bot ? new Simulazione() : null;
    this.cameras.main.setVisible(!this.bot);

    const riempi = Number(parametri.get('nemici'));
    if (riempi > 0) this.orda.riempi(riempi, this.secondi, this.x, this.y, this.campoL / 2, this.campoA / 2);

    this.scale.on('resize', this.ridimensiona, this);
    if (!this.bot) entraInPartita();
    this.game.events.on('sfondo', this.apriPausa, this);
    window.addEventListener('keydown', this.tasto);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.ridimensiona, this);
      esciDallaPartita();
      this.game.events.off('sfondo', this.apriPausa, this);
      window.removeEventListener('keydown', this.tasto);
      this.comandi.distruggi();
      this.hud.distruggi();
      this.doni.distruggi();
      this.rivelazione.distruggi();
      this.mosaico.distruggi();
      this.speciale.distruggi();
      this.fiaschetta.distruggi();
      this.anims.resumeAll();
    });
    this.disegna();
  }

  update(_t: number, delta: number): void {
    if (this.bot) {
      // simulazione: niente disegno, la logica corre più veloce possibile fino alla fine della partita
      const fine = performance.now() + BOT.msPerFotogramma;
      while (!this.hud.fineAperta && performance.now() < fine) this.passo(PASSO);
      return;
    }
    this.accumulo = Math.min(this.accumulo + delta, RITARDO_MASSIMO_MS);
    while (this.accumulo >= PASSO_MS) {
      this.passo(PASSO);
      this.accumulo -= PASSO_MS;
    }
    if (!this.fermo()) this.effetti.aggiorna(delta / 1000, this.x, this.y - COLPI.corpo);
    this.disegna(delta / 1000);
  }

  /**
   * Tasto Indietro: in partita apre la pausa e basta; nella pausa chiude solo la conferma di Abbandona, la partita riparte
   * solo toccando il pulsante (scelta voluta: una doppia pressione per sbaglio la faceva ripartire);
   * dalla fine torna al menu. Restituisce sempre true (gestito).
   */
  indietro(): boolean {
    if (this.finito && this.hud.fineAperta) this.scene.start('Menu');
    else if (this.hud.confermaAperta) this.hud.chiudiConferma();
    else if (!this.pausa) this.apriPausa();
    return true;
  }

  /** Il gioco è fermo: pausa o scelta del dono. */
  private fermo(): boolean {
    return this.pausa || this.doni.aperta || this.pausaLab || this.rivelazione.attiva;
  }

  /** Un passo di logica: niente disegno qui. */
  private passo(dt: number): void {
    this.attesaTremolio -= dt;
    if (this.attesaTremolio <= 0) {
      this.attesaTremolio = LUCE.intervalloTremolio;
      this.fiamma = this.caso.intero(0, CHIAVI_BUIO.length - 1);
    }
    if (this.finito) {
      if (this.attesaFine > 0 && (this.attesaFine -= dt) <= 0) this.mostraFine(false);
      return;
    }
    if (this.fermo()) return;

    this.secondi += dt;
    if (this.fineFinta > 0) { // Prova prestazioni: l'alba non arriva e non si sale di livello, le scelte falserebbero la misura
      this.secondi = Math.min(this.secondi, this.fineFinta);
      this.esperienza = 0;
    }
    this.comandi.aggiorna();
    let dx = this.comandi.dx;
    let dy = this.comandi.dy;
    if (this.bot) {
      this.bot.guida(dt, this.x, this.y, this.salute / this.saluteMassima);
      dx = this.bot.dx;
      dy = this.bot.dy;
    }
    this.x += dx * this.velocita * dt;
    this.y += dy * this.velocita * dt;
    this.inMoto = dx !== 0 || dy !== 0;
    if (dx < 0) this.versoSinistra = true;
    else if (dx > 0) this.versoSinistra = false;
    if (this.inMoto) {
      const l = Math.hypot(dx, dy);
      this.dirX = dx / l;
      this.dirY = dy / l;
    }
    this.speciale.aggiorna(dt, this.bonus.ricarica * (1 - this.meta.rito) * (this.ha('ceriGemelli') ? 1 + AM.ceriGemelli.ricarica : 1));
    if (this.bot && this.speciale.cariche > 0) {
      const a = ABILITA[this.pg.abilita];
      if (this.bot.abilita(this.x, this.y - COLPI.corpo, a.raggio * (1 + this.bonus.area), a.cura > 0, this.salute / this.saluteMassima)) this.speciale.prova();
    }
    if (this.bot && this.salute < this.saluteMassima * BOT.beviSotto) this.fiaschetta.bevi();
    if (this.grazia > 0 && (this.grazia -= dt) <= 0) this.ricalcola();
    if (this.bagliore > 0 && (this.bagliore -= dt) <= 0) {
      this.bagliore = 0;
      this.dopoPassivo();
    }

    const mezzaL = this.campoL / 2;
    const mezzaA = this.campoA / 2;
    this.notte(mezzaL, mezzaA);
    if (this.finito) return;
    this.orda.aggiorna(dt, this.secondi, this.x, this.y, dx, dy, this.velocita, mezzaL, mezzaA);
    if (this.ha('lucciola') && (this.prossimoAbbaglio -= dt) <= 0) {
      this.prossimoAbbaglio = AM.lucciola.intervallo;
      this.arsenale.abbaglia(this.x, this.y - COLPI.corpo, LUCE.raggio * this.areaLuce);
    }
    this.arsenale.aggiorna(dt, this.x, this.y, this.dirX, this.dirY, mezzaL, mezzaA);
    this.chiazze?.aggiorna(dt);
    const cura = this.arsenale.cura();
    if (cura && this.salute < this.saluteMassima) suona('cura');
    const primaCura = this.salute;
    this.salute = Math.min(this.saluteMassima, this.salute + (this.rigenerazione + cura) * dt);
    this.sim?.curato('altro', this.salute - primaCura);
    const primaSorso = this.salute;
    this.salute = Math.min(this.saluteMassima, this.salute + this.fiaschetta.aggiorna(dt) * this.saluteMassima * (this.ha('cuoreAvido') ? AM.cuoreAvido.cura : 1));
    this.sim?.curato('fiaschetta', this.salute - primaSorso);
    this.orda.rimuoviMorti(this.muore);
    const minaccia = this.minacce.aggiorna(dt, this.x, this.y, COMBATTIMENTO.raggioGiocatore);
    if (this.minacce.colpita) {
      this.minacce.colpita = false;
      this.effetti.scuoti(EFFETTI.minacce.scossa.forza, EFFETTI.minacce.scossa.durata);
    }
    if (this.minacce.schivate) {
      this.schivateNotte += this.minacce.schivate;
      this.minacce.schivate = 0;
      this.iniziaGrazia();
    }
    this.contatti(dt, minaccia);
    const freddo = this.ha('sangueFreddo') && this.salute < this.saluteMassima * AM.sangueFreddo.sotto;
    if (freddo !== this.sangueFreddoAttivo) {
      this.sangueFreddoAttivo = freddo;
      this.ricalcola();
    }
    if (this.arsenale.sorsiGuadagnati) {
      const prima = this.fiaschetta.sorsi;
      this.fiaschetta.ricarica(this.arsenale.sorsiGuadagnati);
      this.sim?.acquasantiera(this.arsenale.sorsiGuadagnati, this.fiaschetta.sorsi - prima);
      this.arsenale.sorsiGuadagnati = 0;
    }
    if (this.arsenale.richiami) {
      this.anime.richiama(this.arsenale.richiami, this.x, this.y);
      this.arsenale.richiami = 0;
    }
    if (this.arsenale.dentroNube()) this.secondiNubi += dt;
    const raccolte = this.anime.aggiorna(dt, this.x, this.y - COLPI.corpo, this.raccolta);
    if (raccolte) {
      this.esperienza += raccolte * this.moltAnime;
      this.animeTotali += raccolte;
      suona('anima');
    }
    this.oggetti.aggiorna(dt, this.x, this.y - COLPI.corpo, this.raccolta * 0.6, this.raccogli);
    this.rompibili?.aggiorna(this.x, this.y, mezzaL, mezzaA);
    this.sim?.passo(this.secondi, this.livello, this.salute, this.orda);
    while (this.esperienza >= animePerLivello(this.livello)) {
      this.esperienza -= animePerLivello(this.livello);
      this.livello++;
      this.livelliDaScegliere++;
    }
    if (this.livelliDaScegliere > 0) {
      suona('livello');
      vibra('media');
      this.apriDoni();
    }
  }

  /** Il preavviso di un'orda: la scritta e il bordo del campo da cui arriva (tutti per l'anello). */
  private annunciaOrda(forma: FormaOrda, angolo: number): void {
    const testi: Record<FormaOrda, [string, string]> = { muro: ["Un'orda", 'marcia verso di te'], cuneo: ["Un'orda a cuneo", 'punta verso di te'], tenaglia: ['Due orde', 'ti stringono'], anello: ['Lo sciame', 'ti circonda'] };
    this.hud.avviso(...testi[forma]);
    const c = Math.cos(angolo), sn = Math.sin(angolo), orizzontale = Math.abs(c) * this.campoA > Math.abs(sn) * this.campoL;
    const tutti = forma === 'anello', doppio = forma === 'tenaglia';
    const destra = orizzontale && c > 0, sinistra = orizzontale && c < 0, sotto = !orizzontale && sn > 0, sopra = !orizzontale && sn < 0;
    this.hud.preavviso(tutti || sopra || (doppio && sotto), tutti || sotto || (doppio && sopra), tutti || sinistra || (doppio && destra), tutti || destra || (doppio && sinistra), ORDE.preavviso);
  }

  /** Fa nascere l'orda del minuto, di un solo tipo, nella sua forma. */
  private lanciaOrda(forma: FormaOrda, tipo: number, minuto: number, angolo: number, mezzaL: number, mezzaA: number): void {
    const campo = Math.min(DIFFICOLTA.tetto, DIFFICOLTA.massimiBase + DIFFICOLTA.massimiPerMinuto * minuto);
    const quanti = Math.max(ORDE.minimo, Math.min(ORDE.massimo, Math.round(campo * ORDE.parteDelCampo))), s = this.secondi;
    if (forma === 'anello') this.orda.sciame(s, tipo, quanti, this.x, this.y, mezzaL, mezzaA);
    else if (forma === 'tenaglia') {
      this.orda.orda(s, tipo, Math.ceil(quanti / 2), angolo, this.x, this.y, mezzaL, mezzaA);
      this.orda.orda(s, tipo, Math.floor(quanti / 2), angolo + Math.PI, this.x, this.y, mezzaL, mezzaA);
    } else this.orda.orda(s, tipo, quanti, angolo, this.x, this.y, mezzaL, mezzaA, forma === 'cuneo');
  }

  /** Laboratorio: un'orda della forma scelta, subito, con la scritta e il bordo. */
  labOrda(forma: FormaOrda): void {
    const minuto = Math.max(1, Math.floor(this.secondi / 60)), angolo = this.caso.numero() * Math.PI * 2;
    const tipo = forma === 'anello' ? 'fantasma' : 'scheletro';
    this.annunciaOrda(forma, angolo);
    this.lanciaOrda(forma, NEMICI.findIndex((t) => t.id === tipo), minuto, angolo, this.campoL / 2, this.campoA / 2);
  }

  /** Eventi della notte (GDD, sezione 1): élite, sciami, Mietitore, alba. */
  private notte(mezzaL: number, mezzaA: number): void {
    while (this.secondi >= this.prossimaElite) {
      this.orda.nasciElite(this.secondi, this.x, this.y, mezzaL, mezzaA);
      this.prossimaElite += ELITE.ogni;
    }
    // orde: all'inizio del minuto del copione; qualche secondo prima lampeggia il bordo da cui arrivano
    const o = ORDE.copione[this.prossimaOrda];
    if (o) {
      if (!this.ordaAnnunciata && this.secondi >= o.minuto * 60 - ORDE.preavviso) {
        this.ordaAnnunciata = true;
        this.angoloOrda = this.caso.numero() * Math.PI * 2;
        this.annunciaOrda(o.forma, this.angoloOrda);
      }
      if (this.secondi >= o.minuto * 60) {
        this.prossimaOrda++;
        this.ordaAnnunciata = false;
        this.lanciaOrda(o.forma, NEMICI.findIndex((t) => t.id === o.tipo), o.minuto, this.angoloOrda, mezzaL, mezzaA);
      }
    }
    if (this.mietitoriArrivati < MIETITORE.minuti.length && this.secondi >= MIETITORE.minuti[this.mietitoriArrivati] * 60) {
      this.orda.nasciMietitore(this.secondi, this.mietitoriArrivati, this.x, this.y, mezzaL, mezzaA);
      this.mietitoriArrivati++;
      this.sim?.mietitoreArrivato(this.secondi);
      this.hud.avviso('Seth', 'il Rinnovato è venuto per te');
      suona('mietitore');
      vibra('forte');
    }
    if (this.secondi >= ALBA) {
      this.finito = true;
      this.inMoto = false;
      suona('alba');
      this.mostraFine(true);
    }
  }

  /** Schivata perfetta: qualche secondo di Grazia (più danno, più velocità); un'altra schivata la rinnova. */
  private iniziaGrazia(): void {
    const giaAttiva = this.grazia > 0;
    this.grazia = this.ha('danzaMacabra') ? AM.danzaMacabra.durataGrazia : GRAZIA.durata;
    if (!giaAttiva) this.ricalcola();
    this.hud.avviso('Grazia');
    suona('speciale');
    vibra('leggera');
    this.sim?.grazia();
  }

  /** Il Bagliore: nessun danno, e chi tocca il personaggio brucia, tranne élite e Seth. */
  private bruciaAlTocco(): void {
    const o = this.orda;
    for (let i = 0; i < o.numero; i++) {
      if (o.elite[i] || NEMICI[o.tipo[i]].id === 'mietitore') continue;
      const r = o.raggio[i] + COMBATTIMENTO.raggioGiocatore, dx = o.x[i] - this.x, dy = o.y[i] - this.y;
      if (dx * dx + dy * dy < r * r) o.salute[i] = 0;
    }
  }

  /** Il mosaico è completo: parte il Bagliore. */
  private iniziaBagliore(): void {
    this.bagliore = BAGLIORE.durata;
    this.dopoPassivo();
    suona('alba');
    vibra('forte');
  }

  /** Ricalcola statistiche e bonus delle armi da personaggio e doni passivi (GDD, sezioni 2 e 5). */
  private ricalcola(): void {
    const per = (id: IdDono): number => this.passivi[id] * PASSIVI.find((q) => q.id === id)!.per;
    const m = this.meta;
    this.saluteMassima = (BASE.salute + this.pg.salute + per('cuoreDiCera')) * (1 + m.salute) * (1 + (this.ha('martire') ? AM.martire.salute : 0));
    const grazia = this.grazia > 0;
    this.velocita = BASE.velocita * (1 + this.pg.velocita + per('aliDiFalena') + m.velocita + (grazia ? GRAZIA.velocita : 0) + (this.bagliore > 0 ? BAGLIORE.velocita : 0));
    this.raccolta = BASE.raccolta * (1 + per('calamita') + m.raccolta);
    this.rigenerazione = this.pg.rigenerazione + per('erbeAmare');
    this.armatura = Math.min(BASE.armaturaMassima, BASE.armatura + this.pg.armatura + per('scudoDiFerro'));
    this.moltAnime = 1 + this.passivi.calamita * (PASSIVI.find((q) => q.id === 'calamita')!.anime ?? 0) + m.anime + (this.ha('cuoreAvido') ? AM.cuoreAvido.anime : 0);
    this.bonus.danno = this.pg.danno + per('saleNero') + m.danno + (grazia ? GRAZIA.danno : 0)
      + (this.ha('lanternaCieca') ? AM.lanternaCieca.danno : 0) + (this.sangueFreddoAttivo ? AM.sangueFreddo.danno : 0);
    this.bonus.ricarica = Math.max(RICARICA_MINIMA, (1 - this.pg.ricarica) * (1 - PASSIVI.find((q) => q.id === 'clessidra')!.per) ** this.passivi.clessidra);
    this.bonus.area = this.pg.area + per('stoppinoLungo');
    this.bonus.quantita = per('specchio') + (this.ha('specchioRotto') ? AM.specchioRotto.proiettili : 0);
    this.bonus.durata = per('ceraVotiva');
    this.bonus.critico = per('chiodoDiBara');
    if (this.speciale) this.speciale.caricheMassime = this.ha('ceriGemelli') ? AM.ceriGemelli.cariche : 1;
    if (this.orda) this.orda.moltSaluteElite = this.ha('ossaDelite') ? 1 + AM.ossaDelite.salute : 1;
  }

  // ——— Laboratorio (solo link di prova e sviluppo: sistema/laboratorio.ts) ———
  // Comandi per andare subito a qualsiasi punto della partita e vedere una cosa sola, senza rigiocare tutto.

  /** Per il pannello: a che punto è la partita. */
  labStato(): { secondi: number; livello: number; salute: number; saluteMassima: number; immortale: boolean; fermo: boolean; nemici: number; rosario: boolean; pg: string; urne: number } {
    return {
      urne: this.urneRotte, secondi: this.secondi, livello: this.livello, salute: this.salute, saluteMassima: this.saluteMassima, immortale: this.immortale,
      fermo: this.pausaLab, nemici: this.orda.numero, rosario: this.rosarioSbloccato, pg: this.pg.id,
    };
  }

  labFerma(on: boolean): void {
    this.pausaLab = on;
    if (on) this.anims.pauseAll();
    else if (!this.fermo()) this.anims.resumeAll();
  }

  labImmortale(on: boolean): void {
    this.immortale = on;
  }

  /** Porta la notte al minuto m: gli eventi già passati non si ripetono, gli altri partono al loro turno. */
  labMinuto(m: number): void {
    this.secondi = Math.max(0, m) * 60;
    this.prossimaElite = Math.max(ELITE.primo, Math.ceil(this.secondi / ELITE.ogni) * ELITE.ogni);
    this.prossimaOrda = Math.max(0, ORDE.copione.findIndex((o) => o.minuto * 60 >= this.secondi));
    if (ORDE.copione.every((o) => o.minuto * 60 < this.secondi)) this.prossimaOrda = ORDE.copione.length;
    this.ordaAnnunciata = false;
    this.mietitoriArrivati = MIETITORE.minuti.filter((q) => q * 60 < this.secondi).length;
  }

  /** Livello n, con le armi e i doni che hai. */
  labLivello(n: number): void {
    this.livello = Math.max(1, Math.floor(n));
    this.esperienza = 0;
  }

  /** Un livello in più con la sua scelta di doni. */
  labSceltaDono(): void {
    this.livelliDaScegliere++;
    this.livello++;
    this.apriDoni();
  }

  labReliquiario(): void {
    this.apriReliquiario();
  }

  /** Porta l'arma al livello l (la aggiunge se non c'è); non si scende, per togliere si riavvia. */
  labArma(arma: Arma, l: number): void {
    if (!this.arsenale.livello(arma)) this.arsenale.aggiungi(arma);
    while (this.arsenale.livello(arma) < Math.min(l, CARTE.livelloMassimo)) this.arsenale.potenzia(arma);
    this.aggiornaBuild();
  }

  labDono(id: IdDono, l: number): void {
    this.passivi[id] = Math.max(0, l);
    this.dopoPassivo();
    this.aggiornaBuild();
  }

  labAmuleto(id: IdAmuleto, on: boolean): void {
    if (on && !this.amuletiPosseduti.includes(id)) this.amuletiPosseduti.push(id);
    if (!on) this.amuletiPosseduti = this.amuletiPosseduti.filter((x) => x !== id);
    if (on) this.amuletiAccesi.add(id);
    else this.amuletiAccesi.delete(id);
    this.dopoPassivo();
    this.aggiornaBuild();
  }

  labAmuletiSnapshot(): { posseduti: IdAmuleto[]; accesi: IdAmuleto[] } {
    return { posseduti: [...this.amuletiPosseduti], accesi: [...this.amuletiAccesi] };
  }

  labLivelli(): { armi: { arma: Arma; livello: number }[]; doni: Record<IdDono, number> } {
    return { armi: this.arsenale.possedute.map((p) => ({ arma: p.arma, livello: p.livello })), doni: { ...this.passivi } };
  }

  /** Prova prestazioni: la scena più pesante, senza poter morire né arrivare all'alba; i doni si scelgono da soli. */
  labProvaPrestazioni(): void {
    const P = PRESTAZIONI;
    this.labImmortale(true);
    this.automatico = true;
    this.labMinuto(P.minuto);
    this.fineFinta = P.secondiFine;
    this.labLivello(P.livello);
    for (const a of ARMI_COMUNI.slice(0, MAX_ARMI - 1)) this.labArma(a, P.livelloArmi);
    this.rompibili?.piazzaFissa(ROMPIBILI.tipi.findIndex((t) => t.luce > 0), this.x + P.lanterna.dx, this.y + P.lanterna.dy);
    this.labProvaRiempi();
  }

  /** Prova prestazioni: la stessa ricostruzione che avviene quando un dono allarga la luce. */
  labRicostruisciBuio(): void {
    this.ridimensiona();
  }

  labProvaRiempi(): void {
    this.orda.riempi(PRESTAZIONI.nemici, this.secondi, this.x, this.y, this.campoL / 2, this.campoA / 2);
  }

  /** Diagnosi dei fotogrammi: spegne i fori di lanterne e fuochi nel buio, per misurarne il costo sul telefono. */
  labForiBuio(accesi: boolean): void {
    this.foriBuio = accesi;
  }

  /** Accende o spegne a mano il segnale del Peccato sul bordo del campo, per vederlo senza comporre un Rosario. */
  labPeccato(acceso: boolean): void {
    this.hud.provaPeccato(acceso);
  }

  /** Mostra un avviso nel cartiglio, per provarne posto e durata. */
  labAvviso(testo: string, sotto: string): void {
    this.hud.avviso(testo, sotto);
  }

  labRosario(on: boolean): void {
    this.rosarioSbloccato = on;
  }

  labEvento(nome: 'elite' | 'seth1' | 'seth2' | 'orda' | 'sciame' | 'pane' | 'calamita' | 'reliquiarioATerra' | 'reliquiarioLontano' | 'cera' | 'anime' | 'cura' | 'grazia' | 'eliminaNemici' | 'riempi' | 'vittoria' | 'morte'): void {
    const mezzaL = this.campoL / 2, mezzaA = this.campoA / 2, s = this.secondi;
    switch (nome) {
      case 'elite': this.orda.nasciElite(s, this.x, this.y, mezzaL, mezzaA); break;
      case 'seth1': this.orda.nasciMietitore(s, 0, this.x, this.y, mezzaL, mezzaA); break;
      case 'seth2': this.orda.nasciMietitore(s, 1, this.x, this.y, mezzaL, mezzaA); break;
      case 'orda': this.labOrda('muro'); break;
      case 'sciame': this.labOrda('anello'); break;
      case 'pane': this.oggetti.aggiungi(PANE, this.x + 40, this.y - 40); break;
      case 'calamita': this.oggetti.aggiungi(CALAMITA, this.x - 40, this.y - 40); break;
      case 'reliquiarioATerra': this.oggetti.aggiungi(RELIQUIARIO, this.x, this.y - 70); break;
      case 'reliquiarioLontano': this.oggetti.aggiungi(RELIQUIARIO, this.x + 200, this.y - this.campoA); break;
      case 'cera': for (let k = 0; k < 10; k++) this.oggetti.aggiungi(CERA_GOCCIA, this.x - 60 + k * 14, this.y + 40); break;
      case 'anime': this.anime.aggiungi(this.x + 60, this.y, 50, this.x, this.y); break;
      case 'cura': this.salute = this.saluteMassima; break;
      case 'grazia': this.iniziaGrazia(); break;
      case 'eliminaNemici': for (let i = 0; i < this.orda.numero; i++) this.orda.salute[i] = 0; break;
      case 'riempi': this.orda.riempi(400, s, this.x, this.y, mezzaL, mezzaA); break;
      case 'vittoria':
        this.finito = true;
        this.inMoto = false;
        this.mostraFine(true);
        break;
      case 'morte':
        this.salute = 0;
        this.morto = this.finito = true;
        this.attesaFine = COMBATTIMENTO.attesaFine;
        this.inMoto = false;
        break;
    }
  }

  /** Lascia lo stato dell'affinità (luce, sacro, ombra, terra) ai nemici vicini: due stati diversi fanno la reazione. */
  labStatoVicini(aff: 'luce' | 'sacro' | 'ombra' | 'terra'): void {
    this.arsenale.abbaglia(this.x, this.y - COLPI.corpo, 260, { luce: LUCE_AFF, sacro: SACRO_AFF, ombra: OMBRA_AFF, terra: TERRA_AFF }[aff]);
  }

  /** Sblocca (o ripristina) armi e doni nuovi in questa partita, così escono subito nella scelta. */
  labOggetti(on: boolean): void {
    this.oggettiSbloccati = new Set(on ? SBLOCCHI_OGGETTI.map((o) => o.id) : this.meta.oggetti);
  }

  /** Laboratorio: urna, giara e lanterna accanto al personaggio (a sinistra, così non si rompono subito). */
  labRompibili(): void {
    ROMPIBILI.tipi.forEach((_, n) => this.rompibili?.piazza(n, this.x - 90 - n * 70, this.y + 10));
  }

  labRompiVicino(): void {
    this.rompibili?.rompiVicino(this.x, this.y);
  }

  labChiazza(): void {
    this.chiazze?.aggiungi(this.x + 130, this.y);
  }

  labAccendiChiazze(): void {
    this.chiazze?.accendiTutte();
  }

  /** Come raccogliere un frammento: accende il pezzo dopo del mosaico. */
  labMosaico(): void {
    this.frammento();
  }

  labBagliore(): void {
    this.iniziaBagliore();
  }

  labFrammento(): void {
    this.lasciaFrammento(this.x + 60, this.y - 60);
  }

  /** Apre la pausa sulla scheda indicata; se è già aperta la richiude prima. */
  labPausa(scheda?: SchedaPausa): void {
    this.riprendi();
    this.apriPausa(scheda);
  }

  /** Il caso pieno: 6 armi, 6 doni, tutti gli amuleti e le unioni in tutti gli stati. Non tocca il salvataggio. */
  labPausaPiena(scheda: SchedaPausa = 'build'): void {
    this.scoperteDiProva = true;
    const mia = UNIONI.find((u) => u.arma === this.pg.armaIniziale)!;
    [mia, ...UNIONI.filter((u) => u !== mia).slice(0, MAX_ARMI - 1)].forEach((u, i) => this.labUnione(u.id, i % 3 === 0));
    this.rosarioSbloccato = true;
    for (const a of AMULETI) this.labAmuleto(a.id, true);
    for (const u of UNIONI) this.unioniScoperte.add(u.id);
    this.labPausa(scheda);
  }

  /** Peccato: amuleti accesi oltre i grani; la pausa si apre da sola sul Rosario. */
  labPausaPeccato(): void {
    this.rosarioSbloccato = true;
    for (const a of AMULETI.slice(0, 3)) this.labAmuleto(a.id, true);
    this.labPausa();
  }

  /** La prima partita: niente Rosario né Unioni. */
  labPausaPrima(): void {
    for (const id of [...this.amuletiPosseduti]) this.labAmuleto(id, false);
    this.rosarioSbloccato = this.unioniSbloccate = false;
    this.unioniScoperte.clear();
    this.unioniUnite.clear();
    this.labPausa();
  }

  /** La pausa sopra una scelta di doni o di reliquiario. */
  labPausaSopra(reliquiario: boolean): void {
    this.riprendi();
    if (reliquiario) {
      this.rosarioSbloccato = true;
      this.labReliquiario();
    } else this.labSceltaDono();
    this.apriPausa();
  }

  /** Dimentica le unioni scoperte, per riprovare la scoperta da capo. */
  labDimenticaUnioni(): void {
    this.unioniScoperte.clear();
    this.unioniUnite.clear();
    const s = carica();
    s.unioniScoperte = [];
    s.unioniUnite = [];
    salva(s);
  }

  private armaDi(id: Arma['id']): Arma | undefined {
    return this.arsenale.possedute.find((p) => p.arma.id === id)?.arma;
  }

  /** Le unioni pronte: arma al massimo, dono al livello giusto, non ancora unite. */
  private unioniPronte(): Unione[] {
    if (!this.unioniSbloccate) return [];
    return UNIONI.filter((u) => {
      const a = this.armaDi(u.arma);
      return a && this.arsenale.livello(a) >= CARTE.livelloMassimo && !this.arsenale.unita(a) && this.passivi[u.dono] >= livelloDonoUnione(u.dono);
    });
  }

  /** Porta arma e dono ai livelli giusti: con unisci li unisce subito, altrimenti aspetta il reliquiario. */
  labUnione(id: IdUnione, unisci: boolean): void {
    const u = UNIONI.find((x) => x.id === id)!;
    this.unioniSbloccate = this.scoperteDiProva = true;
    this.unioniScoperte.add(u.id); // qui non si vuole l'animazione: la mostra LAB → Schermate
    const arma = this.armaDi(u.arma) ?? ARMI_COMUNI.find((a) => a.id === u.arma) ?? Object.values(ARMI_INIZIALI).find((a) => a.id === u.arma)!;
    this.labArma(arma, CARTE.livelloMassimo);
    this.labDono(u.dono, Math.max(this.passivi[u.dono], livelloDonoUnione(u.dono)));
    if (unisci) {
      this.arsenale.unisci(arma);
      this.segnaUnita(id);
      this.aggiornaBuild();
    }
  }

  labStatoUnioni(): { sbloccate: boolean; unite: IdUnione[] } {
    return { sbloccate: this.unioniSbloccate, unite: UNIONI.filter((u) => { const a = this.armaDi(u.arma); return a && this.arsenale.unita(a); }).map((u) => u.id) };
  }

  /** Può uscire nella scelta: tutto ciò che non è in SBLOCCHI_OGGETTI, o quello che è stato sbloccato. */
  private disponibile(id: string): boolean {
    return this.oggettiSbloccati.has(id) || !SBLOCCHI_OGGETTI.some((o) => o.id === id);
  }

  // ——— Rosario ———
  private ha(id: IdAmuleto): boolean {
    return this.amuletiAccesi.has(id);
  }

  /** Grani del Rosario: 3, più uno per ogni Seth sconfitto, al massimo 5. */
  private grani(): number {
    return Math.min(ROSARIO.massimo, ROSARIO.grani + this.sethSconfitti * ROSARIO.perSeth);
  }

  private graniUsati(): number {
    let n = 0;
    for (const id of this.amuletiAccesi) n += amuleto(id).grani;
    return n;
  }

  /** Raggio dell'alone di luce, in multipli di LUCE.raggio: Stoppino lungo e Lucciola lo allargano, la Lanterna cieca lo spegne. */
  private fattoreLuce(): number {
    return (1 + this.bonus.area + (this.ha('lucciola') ? AM.lucciola.alone : 0)) * (this.ha('lanternaCieca') ? AM.lanternaCieca.alone : 1) * (this.bagliore > 0 ? BAGLIORE.luce : 1);
  }

  /** Dalla pausa: accende o spegne un amuleto (in Peccato il danno subito raddoppia). */
  private commutaAmuleto = (id: string): void => {
    if (!this.amuletiPosseduti.includes(id as IdAmuleto)) return;
    const a = id as IdAmuleto;
    if (!this.amuletiAccesi.delete(a)) this.amuletiAccesi.add(a);
    this.dopoPassivo();
    this.aggiornaBuild();
    this.doni.aggiornaCarte(); // sopra una scelta: stesse carte, grani di adesso
    if (this.pausa) this.hud.aggiornaPausa(this.datiPausa());
  };

  /** Dopo un dono passivo: statistiche, salute in più del Cuore di cera, alone più ampio con lo Stoppino lungo. */
  private dopoPassivo(): void {
    const prima = this.saluteMassima;
    this.ricalcola();
    const dono = (id: IdDono): number => this.passivi[id] * PASSIVI.find((q) => q.id === id)!.per;
    this.orda.durataStati = 1 + dono('ceraVotiva');
    this.minacce.finestra = GRAZIA.finestra + dono('campanellaDArgento');
    const sorsi = FIASCHETTA.sorsi + dono('lacrimaDiLumen'), inPiu = sorsi - this.fiaschetta.massimo;
    this.fiaschetta.massimo = sorsi;
    if (inPiu > 0) this.fiaschetta.ricarica(inPiu);
    this.salute = Math.min(this.saluteMassima, this.salute + Math.max(0, this.saluteMassima - prima)); // più salute massima: la salute sale; meno (Martire): non supera il nuovo massimo
    const luce = this.fattoreLuce();
    if (luce !== this.areaLuce) {
      this.areaLuce = luce;
      this.ridimensiona();
    }
  }

  /** Un nemico muore: anime, scoppio, e a volte pane, calamita o reliquiari. */
  private muore = (x: number, y: number, valore: number, categoria: CategoriaNemico): void => {
    this.anime.aggiungi(x, y, valore, this.x, this.y);
    this.effetti.scoppio(x, y);
    this.uccisi++;
    this.sim?.ucciso();
    const seth = categoria === 'seth', elite = categoria === 'elite';
    const daLasciare = seth ? MIETITORE.reliquiari : elite ? ELITE.reliquiari * (this.ha('ossaDelite') ? AM.ossaDelite.reliquiari : 1) : 0;
    for (let k = 0; k < daLasciare; k++) this.oggetti.aggiungi(RELIQUIARIO, x + k * 30, y);
    if (this.ha('pattoDiSangue')) {
      const prima = this.salute;
      this.salute = Math.min(this.saluteMassima, this.salute + AM.pattoDiSangue.cura);
      this.sim?.patto(this.salute - prima);
    }
    // gocce di Cera: rare dai nemici comuni, qualcuna in più da élite e Seth
    const gocce = seth ? DROP.cera.perSeth : elite ? DROP.cera.perElite : this.caso.numero() < DROP.cera.probabilita ? 1 : 0;
    for (let k = 0; k < gocce; k++) this.oggetti.aggiungi(CERA_GOCCIA, x + (k - (gocce - 1) / 2) * 14, y + 10);
    // la fiaschetta si ricarica: un sorso per un'élite, tutta per il Mietitore
    if (seth) {
      this.fiaschetta.ricarica(this.fiaschetta.massimo);
      this.sethSconfitti++;
    } else if (elite) {
      this.fiaschetta.ricarica(FIASCHETTA.perElite);
      this.eliteUccise++;
    }
    const r = this.caso.numero();
    if (r < DROP.pane.probabilita) {
      if (this.secondi < this.prossimoPane) return;
      this.prossimoPane = this.secondi + DROP.pane.ogni;
      this.oggetti.aggiungi(PANE, x, y);
    } else if (r < DROP.pane.probabilita + DROP.calamita.probabilita) {
      if (this.secondi < this.prossimaCalamita) return;
      this.prossimaCalamita = this.secondi + DROP.calamita.ogni;
      this.oggetti.aggiungi(CALAMITA, x, y);
    }
  };

  private raccogli = (tipo: number): void => {
    this.sim?.raccolto(tipo);
    if (tipo === CERA_GOCCIA) {
      this.ceraRaccolta += CERA.goccia;
      suona('cera');
    } else if (tipo === PANE) {
      const prima = this.salute;
      this.salute = Math.min(this.saluteMassima, this.salute + DROP.pane.cura * (this.ha('cuoreAvido') ? AM.cuoreAvido.cura : 1));
      this.sim?.curato('pane', this.salute - prima);
      suona('cura');
    } else if (tipo === CALAMITA) {
      this.anime.attiraTutte();
      suona('reliquiario');
    } else if (tipo === FRAMMENTO) {
      this.frammento();
    } else {
      this.apriReliquiario();
    }
  };

  /**
   * Reliquiario: se il Rosario è sbloccato e c'è ancora un amuleto da trovare, scegli tra due amuleti e il
   * potenziamento; altrimenti (o se scegli il potenziamento) vale il potenziamento di prima.
   */
  private apriReliquiario(): void {
    const liberi = this.rosarioSbloccato ? AMULETI.filter((a) => !this.amuletiPosseduti.includes(a.id)) : [];
    const pronte = this.unioniPronte();
    if (!liberi.length && !pronte.length) {
      this.potenziaReliquiario();
      return;
    }
    if (this.doni.aperta) {
      this.reliquiariInAttesa++;
      return;
    }
    // prima l'unione pronta (una per reliquiario), poi gli amuleti: con l'unione se ne offrono meno, per restare a quattro strisce
    const carte: Dono[] = pronte.slice(0, 1).map((u) => ({ tipo: 'unione', unione: u, arma: this.armaDi(u.arma)! }));
    const proposte = carte.length ? ROSARIO.proposteConUnione : ROSARIO.proposte;
    for (let k = 0; k < proposte && liberi.length; k++) carte.push({ tipo: 'amuleto', amuleto: liberi.splice(this.caso.intero(0, liberi.length - 1), 1)[0] });
    carte.push({ tipo: 'potenziamento' });
    this.anims.pauseAll();
    this.comandi.lascia();
    suona('reliquiario');
    this.doni.mostraReliquiario(carte, (d: Dono) => {
      if (d.tipo === 'unione') {
        this.arsenale.unisci(d.arma);
        this.segnaUnita(d.unione.id);
        this.aggiornaBuild();
        this.hud.avviso(d.unione.nome, 'arma unita');
      } else if (d.tipo === 'amuleto') {
        this.amuletiPosseduti.push(d.amuleto.id);
        this.amuletiAccesi.add(d.amuleto.id);
        this.dopoPassivo();
        this.aggiornaBuild();
        const peccato = this.graniUsati() > this.grani();
        this.hud.avviso(d.amuleto.nome, peccato ? 'Peccato: spegnine uno' : `Rosario ${this.graniUsati()}/${this.grani()}`);
      } else {
        this.potenziaReliquiario();
      }
      this.dopoScelta();
    });
    if (this.bot) this.doni.scegliCon((c) => this.sceltaBot(c, this.bot!.amuleto(c, this.grani() - this.graniUsati())));
    else if (this.automatico) this.doni.scegliPrima();
  }

  /** La scelta del bot, registrata dalla simulazione (carte offerte e scelte). */
  private sceltaBot(carte: readonly Dono[], k: number): number {
    this.sim?.scelta(carte, k, this.secondi);
    return k;
  }

  /** Dopo una scelta (dono o reliquiario): la prossima in coda, oppure si riprende a giocare. */
  private dopoScelta(): void {
    if (this.livelliDaScegliere > 0) this.apriDoni();
    else if (this.reliquiariInAttesa > 0) {
      this.reliquiariInAttesa--;
      this.apriReliquiario();
    } else if (!this.pausa) this.anims.resumeAll();
  }

  /** Il potenziamento del reliquiario: di solito pochi, a volte di più (DROP.reliquiario), scelti tra ciò che possiedi; se è tutto al massimo, salute. */
  private potenziaReliquiario(): void {
    const quanti = this.caso.numero() < DROP.reliquiario.raro ? DROP.reliquiario.potenziamentiRari : DROP.reliquiario.potenziamenti;
    const nomi: string[] = [];
    for (let k = 0; k < quanti; k++) {
      const possibili: (() => string)[] = [];
      for (const p of this.arsenale.possedute) {
        if (p.livello < CARTE.livelloMassimo) possibili.push(() => (this.arsenale.potenzia(p.arma), p.arma.nome));
      }
      for (const q of PASSIVI) {
        if (this.passivi[q.id] > 0 && this.passivi[q.id] < q.massimo) possibili.push(() => (this.passivi[q.id]++, this.dopoPassivo(), q.nome));
      }
      if (!possibili.length) {
        this.salute = Math.min(this.saluteMassima, this.salute + DROP.reliquiario.cura);
        nomi.push('salute');
        break;
      }
      nomi.push(possibili[this.caso.intero(0, possibili.length - 1)]());
    }
    this.aggiornaBuild();
    this.hud.avviso('Reliquiario', nomi.join(', '));
    suona('reliquiario');
    vibra('media');
  }

  /** Ferma il gioco e mostra le carte; dopo la scelta, se ci sono altri livelli da scegliere, le rimostra. */
  private apriDoni(): void {
    if (this.doni.aperta) return; // un reliquiario è già aperto: i livelli aspettano
    this.anims.pauseAll();
    this.comandi.lascia();
    this.doni.mostra((d: Dono) => {
      if (d.tipo === 'arma') {
        if (this.arsenale.livello(d.arma)) this.arsenale.potenzia(d.arma);
        else this.arsenale.aggiungi(d.arma);
      } else if (d.tipo === 'passivo') {
        this.passivi[d.passivo.id]++;
        this.dopoPassivo();
      } else {
        this.salute = Math.min(this.saluteMassima, this.salute + CARTE.paneEVino);
      }
      this.aggiornaBuild();
      this.livelliDaScegliere--;
      this.dopoScelta();
    });
    if (this.bot) this.doni.scegliCon((carte) => this.sceltaBot(carte, this.bot!.carta(carte, this.arsenale.possedute.length)));
    else if (this.automatico) this.doni.scegliPrima();
  }

  private apriPausa(scheda?: SchedaPausa): void {
    if (this.finito || this.pausa) return;
    this.rivelazione.salta();
    this.mosaico.nascondi();
    this.pausa = true;
    this.doni.sospesa = true;
    this.anims.pauseAll();
    this.comandi.lascia();
    this.hud.mostraPausa(this.datiPausa(), typeof scheda === 'string' ? scheda : undefined);
  }

  private riprendi(): void {
    if (!this.pausa) return;
    this.pausa = false;
    this.doni.sospesa = false;
    this.hud.nascondiPausa();
    if (!this.doni.aperta) this.anims.resumeAll();
  }

  private mostraFine(vittoria: boolean): void {
    const veglia = this.contaCera(vittoria);
    if (this.sim) {
      this.sim.fine({
        vittoria, secondi: Math.round(this.secondi), livello: this.livello, anime: this.animeTotali, danno: Math.round(this.arsenale.dannoTotale),
        build: this.build().map((v) => `${v.nome} ${v.livello}`), reazioni: this.arsenale.reazioni, cera: veglia.totale,
        ...this.misureSim(),
      });
    }
    const nuovo = this.sim ? false : salvaRecord(this.pg.id, this.secondi);
    this.comandi.lascia();
    this.hud.mostraFine({
      vittoria,
      secondi: this.secondi,
      livello: this.livello,
      anime: this.animeTotali,
      danno: this.arsenale.dannoTotale,
      record: leggiRecord(this.pg.id),
      nuovoRecord: nuovo,
      build: this.build(),
      cera: veglia.totale,
      sbloccato: veglia.sbloccato,
    });
  }

  /** Per la simulazione: oggetti posseduti, danno di ogni fonte e reazioni per tipo. */
  private misureSim(): Pick<RisultatoSim, 'oggetti' | 'dannoArmi' | 'dannoReazioni' | 'reazioniPerTipo'> {
    const a = this.arsenale, nomiArmi = new Map<string, string>([...ARMI_COMUNI, ...Object.values(ARMI_INIZIALI)].map((x) => [x.id, x.nome]));
    const dannoArmi: Record<string, number> = {}, dannoReazioni: Record<string, number> = {};
    const altre: Record<string, string> = { abilita: 'Abilità speciale', martire: 'Martire', fuoco: "Fuoco dell'olio" };
    const reazioni: Record<string, string> = { eclissi: 'Eclissi', esorcismo: 'Esorcismo', interramento: 'Interramento' };
    FONTI.forEach((f, i) => {
      const v = Math.round(a.dannoFonti[i]);
      if (!v) return;
      if (reazioni[f]) dannoReazioni[reazioni[f]] = v;
      else dannoArmi[nomiArmi.get(f) ?? altre[f]] = v;
    });
    const reazioniPerTipo: Record<string, number> = {};
    INFO_REAZIONI.forEach((r, k) => (reazioniPerTipo[r.nome] = a.reazioniPerTipo[k + 1]));
    return {
      oggetti: {
        armi: a.possedute.map((p) => ({ nome: p.arma.nome, livello: p.livello, unione: p.unita ? unioneDi(p.arma.id)?.nome ?? null : null })),
        doni: PASSIVI.filter((q) => this.passivi[q.id] > 0).map((q) => ({ nome: q.nome, livello: this.passivi[q.id] })),
        amuleti: this.amuletiPosseduti.map((id) => ({ nome: amuleto(id).nome, acceso: this.ha(id) })),
      },
      dannoArmi, dannoReazioni, reazioniPerTipo,
    };
  }

  /**
   * Cera della veglia, voce per voce; fuori dalle simulazioni la aggiunge al salvataggio e controlla
   * se un personaggio si è sbloccato con un'impresa. Restituisce il totale e il nome sbloccato (o null).
   */
  private contaCera(vittoria: boolean): { totale: number; sbloccato: string | null } {
    const voci: VoceVeglia[] = [{ nome: 'Gocce raccolte', cera: this.ceraRaccolta }];
    if (vittoria) voci.push({ nome: "L'alba", cera: CERA.alba });
    const totale = voci.reduce((t, v) => t + v.cera, 0);
    if (this.sim || this.immortale) return { totale, sbloccato: null };
    const s = carica();
    s.cera += totale;
    let sbloccatoOggetto: string | null = null;
    if (vittoria) s.vittorie++;
    if (!s.unioni && s.vittorie >= SBLOCCO_UNIONI.vittorie) {
      s.unioni = true;
      sbloccatoOggetto = 'Le Unioni';
    }
    // imprese di armi e doni nuovi (SBLOCCHI_OGGETTI)
    const imprese: Partial<Record<IdOggetto, boolean>> = {
      lapide: this.pg.id === 'becchino' && this.sethSconfitti > 0,
      rosarioSpezzato: this.arsenale.eclissi >= SOGLIA('rosarioSpezzato'),
      corvo: this.animeTotali >= SOGLIA('corvo'),
      veloFunebre: this.secondiNubi >= SOGLIA('veloFunebre'),
      campanellaDArgento: this.schivateNotte >= SOGLIA('campanellaDArgento'),
    };
    const nuovi = SBLOCCHI_OGGETTI.filter((o) => imprese[o.id] && !s.oggetti.includes(o.id));
    if (nuovi.length) {
      s.oggetti.push(...nuovi.map((o) => o.id));
      sbloccatoOggetto = [sbloccatoOggetto, ...nuovi.map((o) => o.nome)].filter(Boolean).join(', ');
    }
    if (!s.rosario && this.secondi >= SBLOCCO_ROSARIO.minuti * 60) {
      s.rosario = true;
      sbloccatoOggetto = sbloccatoOggetto ? `Il Rosario, ${sbloccatoOggetto}` : 'Il Rosario';
    }
    // imprese che sbloccano i personaggi (prima solo il primo che si sblocca, per avvisarlo)
    let sbloccato: string | null = null;
    const fatte: Record<string, boolean> = { becchino: this.secondi >= 300, badessa: this.sethSconfitti > 0, strega: vittoria };
    for (const p of PERSONAGGI) {
      if (!SBLOCCHI[p.id] || s.sbloccati.includes(p.id) || !fatte[p.id]) continue;
      s.sbloccati.push(p.id);
      sbloccato ??= p.nome;
    }
    sbloccato ??= sbloccatoOggetto;
    s.ultimaVeglia = { voci, totale, sbloccato };
    salva(s);
    return { totale, sbloccato };
  }

  /** Armi e doni posseduti, per le icone in alto e i riepiloghi. */
  private build(): VoceBuild[] {
    const voci: VoceBuild[] = this.arsenale.possedute.map((p) => {
      const u = p.unita ? unioneDi(p.arma.id) : undefined;
      return { nome: u?.nome ?? p.arma.nome, icona: u ? iconaUnione(u.id) : p.arma.icona, livello: p.livello, arma: true };
    });
    for (const q of PASSIVI) {
      if (this.passivi[q.id]) voci.push({ nome: q.nome, icona: q.icona, livello: this.passivi[q.id], arma: false });
    }
    for (const id of this.amuletiPosseduti) {
      const a = amuleto(id);
      voci.push({ nome: a.nome, icona: iconaAmuleto(id), livello: a.grani, arma: false, amuleto: id, acceso: this.ha(id) });
    }
    return voci;
  }

  private aggiornaBuild(): void {
    this.hud.build(this.build());
    this.scopriUnioni();
  }

  /** Un'unione si scopre quando arma e dono arrivano ai livelli che servono: la partita si ferma per l'animazione e da allora la si nomina, anche nelle notti dopo. */
  private scopriUnioni(): void {
    const nuove = this.unioniPronte().filter((u) => !this.unioniScoperte.has(u.id));
    if (!nuove.length) return;
    for (const u of nuove) this.unioniScoperte.add(u.id);
    if (this.sim) return;
    if (this.automatico) this.hud.avviso('Unione scoperta', nuove[0].nome);
    else for (const u of nuove) this.mostraScoperta(u);
    this.salvaUnioni();
  }

  /** L'animazione della scoperta: ferma la partita finché dura. */
  private mostraScoperta(u: Unione): void {
    this.anims.pauseAll();
    this.comandi.lascia();
    this.doni.sospesa = true; // sotto può esserci una scelta: i tasti non devono sceglierla
    suona('reliquiario');
    vibra('media');
    const armi = [...Object.values(ARMI_INIZIALI), ...ARMI_COMUNI];
    this.rivelazione.mostra({ nome: u.nome, ricetta: this.ricettaUnione(u), arma: armi.find((a) => a.id === u.arma)!.icona, dono: PASSIVI.find((q) => q.id === u.dono)!.icona, unione: iconaUnione(u.id) });
  }

  /** Dal Laboratorio: rivede l'animazione, senza toccare scoperte né salvataggio. */
  labScoperta(): void {
    this.mostraScoperta(UNIONI.find((u) => u.arma === this.pg.armaIniziale) ?? UNIONI[0]);
  }

  /** Scoperte e unite restano sul dispositivo; le prove con il Laboratorio e il bot non contano. */
  private salvaUnioni(): void {
    if (this.sim || this.immortale || this.scoperteDiProva) return;
    const s = carica();
    s.unioniScoperte = [...this.unioniScoperte];
    s.unioniUnite = [...this.unioniUnite];
    salva(s);
  }

  /** L'arma si è unita: da ora l'unione è nella scheda Stati, per sempre. */
  private segnaUnita(id: IdUnione): void {
    this.unioniScoperte.add(id);
    this.unioniUnite.add(id);
    this.salvaUnioni();
  }

  /** Le unioni da mostrare: sbloccate, già scoperte e con l'arma in mano. Prima quelle pronte. */
  private vociUnioni(): VoceUnione[] {
    const ordine = { Pronta: 0, Manca: 1, Unita: 2 };
    return UNIONI.filter((u) => this.unioniScoperte.has(u.id) && this.armaDi(u.arma)).map((u): VoceUnione => {
      const a = this.armaDi(u.arma)!, q = PASSIVI.find((x) => x.id === u.dono)!, serve = livelloDonoUnione(u.dono), l = this.arsenale.livello(a);
      const stato = this.arsenale.unita(a) ? 'Unita' : l >= CARTE.livelloMassimo && this.passivi[u.dono] >= serve ? 'Pronta' : 'Manca';
      return { nome: u.nome, icona: iconaUnione(u.id), testo: this.unioniUnite.has(u.id) ? u.testo : '', stato, ricetta: `${a.nome} ${l}/${CARTE.livelloMassimo} · ${q.nome} ${Math.min(serve, this.passivi[u.dono])}/${serve}` };
    }).sort((x, y) => ordine[x.stato] - ordine[y.stato]);
  }

  /** Le statistiche vere del personaggio in questo momento, con doni, ceri e amuleti già contati. */
  private statistiche(): { nome: string; valore: string }[] {
    const subito = (1 - this.armatura) * (1 + (this.ha('specchioRotto') ? AM.specchioRotto.dannoSubito : 0)) * (1 + (this.graniUsati() > this.grani() ? ROSARIO.peccato : 0)) - 1;
    return [
      { nome: 'Salute', valore: `${Math.ceil(this.salute)}/${Math.ceil(this.saluteMassima)}` },
      { nome: 'Salute/s', valore: `+${virgola(this.rigenerazione)}` },
      { nome: 'Danno', valore: segnoPercento(this.bonus.danno) },
      { nome: 'Danno subito', valore: segnoPercento(subito) },
      { nome: chiaro('Ricarica'), valore: segnoPercento(this.bonus.ricarica - 1) },
      { nome: 'Area', valore: segnoPercento(this.bonus.area) },
      { nome: NOME_COLPI_IN_PIU, valore: `+${this.bonus.quantita}` },
      { nome: chiaro('Durata'), valore: segnoPercento(this.bonus.durata) },
      { nome: 'Critico', valore: segnoPercento(this.bonus.critico) },
      { nome: 'Velocità', valore: segnoPercento(this.velocita / BASE.velocita - 1) },
      { nome: 'Raccolta', valore: segnoPercento(this.raccolta / BASE.raccolta - 1) },
      { nome: 'Anime', valore: segnoPercento(this.moltAnime - 1) },
      { nome: 'Sorsi', valore: `${this.fiaschetta.sorsi}/${this.fiaschetta.massimo}` },
    ];
  }

  /** Come si combina: «Lanterna 8 + Stoppino lungo 3». */
  private ricettaUnione(u: Unione): string {
    const armi = [...Object.values(ARMI_INIZIALI), ...ARMI_COMUNI];
    return `${armi.find((a) => a.id === u.arma)!.nome} ${CARTE.livelloMassimo} + ${PASSIVI.find((q) => q.id === u.dono)!.nome} ${livelloDonoUnione(u.dono)}`;
  }

  /** Tutto quello che la pausa mostra, letto ora. */
  private datiPausa(): DatiPausa {
    const voci = this.unioniSbloccate ? this.vociUnioni() : [];
    const unioneDiArma = (id: Arma['id']): { u: Unione; stato: string } | undefined => {
      const u = unioneDi(id), v = u && voci.find((x) => x.nome === u.nome);
      return u && v ? { u, stato: v.stato } : undefined;
    };
    return {
      tempo: tempo(Math.floor(this.secondi)), livello: this.livello, anime: Math.floor(this.animeTotali), cera: this.ceraRaccolta, uccisi: this.uccisi,
      frammenti: { ora: this.frammenti, servono: FRAMMENTI.perReliquiario, aperti: this.mosaiciAperti || this.frammenti > 0 },
      rosario: this.rosarioSbloccato ? {
        usati: this.graniUsati(), grani: this.grani(),
        amuleti: this.amuletiPosseduti.map((id) => { const a = amuleto(id); return { id, nome: a.nome, icona: iconaAmuleto(id), grani: a.grani, vantaggio: a.vantaggio, rovescio: a.rovescio, acceso: this.ha(id) }; }),
      } : null,
      armi: this.arsenale.possedute.map((p) => voceArma(p.arma, p.livello, !!p.unita, unioneDiArma(p.arma.id))),
      doni: PASSIVI.filter((q) => this.passivi[q.id]).map((q) => voceDono(q, this.passivi[q.id])),
      unioni: this.unioniSbloccate ? { voci, scoperte: this.unioniScoperte.size, totali: UNIONI.length } : null,
      unite: UNIONI.filter((u) => this.unioniUnite.has(u.id)).map((u) => ({ nome: u.nome, icona: iconaUnione(u.id), testo: u.testo, ricetta: this.ricettaUnione(u) })),
      statistiche: this.statistiche(),
      affinita: [...new Set([...this.arsenale.possedute.map((p) => AFFINITA_ARMI[p.arma.id]), AFFINITA_ABILITA[this.pg.abilita]])],
      attesa: !this.doni.aperta ? null : this.doni.reliquiario ? 'reliquiario' : 'dono',
    };
  }

  /**
   * Danno da contatto: il colpo più forte tra i nemici che toccano il personaggio e le mosse del Mietitore
   * (minaccia), poi un attimo di invulnerabilità.
   */
  private contatti(dt: number, minaccia: number): void {
    if (this.bagliore > 0) {
      this.bruciaAlTocco();
      return;
    }
    if (this.invulnerabile > 0) {
      this.invulnerabile -= dt;
      return;
    }
    const o = this.orda;
    let colpo = minaccia;
    const sfiora = this.ha('danzaMacabra') ? AM.danzaMacabra.sfiora : 0;
    let sfiorato = false;
    for (let i = 0; i < o.numero; i++) {
      const r = o.raggio[i] + COMBATTIMENTO.raggioGiocatore;
      const dx = o.x[i] - this.x;
      const dy = o.y[i] - this.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        if (o.danno[i] > colpo) colpo = o.danno[i];
      } else if (sfiora && !sfiorato && d2 < (r + sfiora) * (r + sfiora)) {
        sfiorato = true;
      }
    }
    // Danza macabra: sfiorare i nemici senza farsi toccare dà la Grazia (non più di una ogni tanto)
    if (!colpo && sfiorato && this.secondi - this.ultimaDanza > AM.danzaMacabra.recupero) {
      this.ultimaDanza = this.secondi;
      this.iniziaGrazia();
    }
    if (!colpo) return;
    this.invulnerabile = COMBATTIMENTO.invulnerabilita;
    if (this.immortale) return;
    // Specchio rotto: +25% danno subito; in Peccato (troppi grani) il doppio
    const danno = Math.max(1, colpo * (1 - this.armatura)) * (1 + (this.ha('specchioRotto') ? AM.specchioRotto.dannoSubito : 0)) * (1 + (this.graniUsati() > this.grani() ? ROSARIO.peccato : 0));
    this.salute -= danno;
    if (this.ha('martire') && this.salute > 0) this.arsenale.onda(AM.martire.raggio, AM.martire.danno);
    this.sim?.colpito(danno);
    suona('danno');
    vibra('leggera');
    if (this.salute <= 0 && this.meta.secondaCandela && !this.candelaUsata) {
      // Seconda candela: una volta per veglia ci si rialza
      this.candelaUsata = true;
      this.salute = this.saluteMassima * SECONDA_CANDELA.salute;
      this.invulnerabile = SECONDA_CANDELA.invulnerabilita;
      this.hud.avviso('La seconda candela', 'ti rialza');
      suona('cura');
      vibra('forte');
      return;
    }
    if (this.salute <= 0) {
      this.salute = 0;
      this.morto = this.finito = true;
      this.attesaFine = COMBATTIMENTO.attesaFine;
      this.inMoto = false;
      suona('morte');
      vibra('forte');
    }
  }

  /** Disegna lo stato attuale, con tutte le posizioni arrotondate al pixel. */
  private disegna(dt = 0): void {
    const w = this.campoL;
    const h = this.campoA;
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const cam = this.cameras.main;
    cam.setScroll(px - Math.floor(w / 2) + this.effetti.scossaX, py - Math.floor(h / 2) + this.effetti.scossaY);
    this.giocatore.setPosition(px, py).setDepth(PROFONDITA.personaggio).setFlipX(this.versoSinistra);
    // lampo bianco appena colpito; da morto il personaggio lampeggia e poi sparisce
    const lampo = this.invulnerabile > COMBATTIMENTO.invulnerabilita - COMBATTIMENTO.lampo || (this.morto && this.attesaFine > 0 && Math.floor(this.attesaFine * 12) % 2 === 0);
    if (lampo) this.giocatore.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (this.bagliore > 0 && Math.floor(this.secondi * (this.bagliore < BAGLIORE.ultimi ? BAGLIORE.lampiFine : BAGLIORE.lampi)) % 2 === 0) this.giocatore.setTint(BAGLIORE.alone).setTintMode(Phaser.TintModes.ADD);
    else if (this.grazia > 0 && Math.floor(this.secondi * GRAZIA.lampi) % 2 === 0) this.giocatore.setTint(GRAZIA.alone).setTintMode(Phaser.TintModes.ADD);
    else this.giocatore.clearTint();
    this.giocatore.setVisible(!this.morto || this.attesaFine > 0);
    this.anima(this.inMoto ? 'walk' : 'idle');
    this.orda.disegna(cam, COMPARSA.margine, px, py);
    this.anime.disegna(cam);
    this.oggetti.disegna(cam, this.fermo() ? 0 : dt);
    this.rompibili?.disegna(cam, this.fiamma);
    this.chiazze?.disegna();
    this.arsenale.disegna();
    this.minacce.disegna();
    this.terreno.setTilePosition(cam.scrollX, cam.scrollY);
    const bx = px - cam.scrollX - Math.floor(this.misureBuio.w / 2);
    const by = py - LUCE.altezza - cam.scrollY - Math.floor(this.misureBuio.h / 2);
    const chiaveBuio = CHIAVI_BUIO[this.fiamma];
    this.buio.setTexture(this.foriBuio && this.rompibili && this.chiazze ? this.rompibili.buio(chiaveBuio, this.fiamma, bx, by, this.misureBuio.w, this.misureBuio.h, cam, this.chiazze) : chiaveBuio);
    this.alone.setTexture(CHIAVI_ALONE[this.fiamma]).setPosition(px, py - LUCE.altezza);
    this.buio.setPosition(bx, by);
    const z = this.zSalute, f = FINESTRE.Barra_Salute_Cornice;
    const sx = px - Math.floor(((arte('Barra_Salute_Cornice')?.w ?? 0) * z) / 2);
    const sy = py + BARRA_SALUTE.distanza;
    const piena = Math.round(f.l * Math.max(0, this.salute / this.saluteMassima));
    this.saluteCornice.setPosition(sx, sy).setVisible(!this.morto);
    this.salutePiena.setPosition(sx + f.x * z, sy + f.y * z).setCrop(0, 0, piena, f.a).setVisible(!this.morto && piena > 0);
    this.hud.mostraRosario(this.graniUsati(), this.grani(), this.amuletiPosseduti.length);
    const boss = this.orda.mietitore();
    this.hud.aggiorna(
      this.secondi, !this.finito && this.salute < this.saluteMassima * COMBATTIMENTO.saluteBassa, this.livello,
      this.esperienza / animePerLivello(this.livello), this.animeTotali,
      boss >= 0 ? Math.max(0, this.orda.salute[boss] / this.orda.saluteMassima[boss]) : -1, this.ceraRaccolta,
    );
  }

  /** Avvia un'animazione; se lo sprite non ha quel tag (per esempio walk), resta su idle. */
  private anima(tag: string): void {
    const chiave = `${this.chiaveSprite}:${tag}`;
    this.giocatore.play(this.anims.exists(chiave) ? chiave : `${this.chiaveSprite}:idle`, true);
  }

  /** La barra della salute segue l'ingrandimento dell'HUD (×2 sui telefoni con la scala ×1). */
  private scalaSalute(): void {
    this.zSalute = ingr('salute', misureHud());
    this.saluteCornice.setScale(this.zSalute);
    this.salutePiena.setScale(this.zSalute);
  }

  /** Il campo vero: sul telefono in verticale finisce al bordo delle fasce, per la telecamera e per tutta la logica «sullo schermo». */
  private misuraCampo(): void {
    const f = fasce(misureHud());
    this.campoL = this.scale.width;
    this.campoA = this.scale.height - f.alta - f.bassa;
    this.cameras.main.setViewport(0, f.alta, this.campoL, this.campoA);
  }

  private ridimensiona(): void {
    this.scalaSalute();
    this.misuraCampo();
    this.terreno.setSize(this.campoL, this.campoA);
    this.misureBuio = creaBuio(this, this.campoL, this.campoA, LUCE.raggio * this.areaLuce);
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]);
  }

  /** Frammento di vetro: accende un pezzo del mosaico; al terzo il mosaico intero si illumina e parte il Bagliore. */
  private frammento(): void {
    const servono = FRAMMENTI.perReliquiario, n = ++this.frammenti;
    this.mosaico.mostra(n, servono);
    if (n < servono) {
      suona('cera');
      vibra('leggera');
      return;
    }
    this.frammenti = 0;
    this.iniziaBagliore();
  }

  /** L'urna fortunata: esce un frammento, con un anello di luce, una scossa e il suono del vetro. */
  private lasciaFrammento(x: number, y: number): void {
    this.frammentiCaduti++;
    this.oggetti.aggiungi(FRAMMENTO, x, y);
    this.effetti.reazione(x, y - ROMPIBILI.centro, FRAMMENTI.anello, FRAMMENTI.coloreAnello, FRAMMENTI.bordoAnello, FRAMMENTI.durataAnello);
    this.effetti.scuoti(FRAMMENTI.scossa, FRAMMENTI.durataScossa);
    suona('vetro');
    vibra('media');
  }

  /** Un oggetto rompibile lascia ciò che contiene. */
  private oggettoRotto = (tipo: number, x: number, y: number): void => {
    const { gocce, frammenti, olio } = ROMPIBILI.tipi[tipo];
    for (let k = 0; k < gocce; k++) this.oggetti.aggiungi(CERA_GOCCIA, x + (k - (gocce - 1) / 2) * ROMPIBILI.dispersione, y);
    if (frammenti) {
      this.urneRotte++;
      this.sim?.urna();
    }
    if (frammenti && this.mosaiciAperti && this.frammentiCaduti < FRAMMENTI.perNotte && this.caso.numero() < FRAMMENTI.probabilita) this.lasciaFrammento(x, y);
    if (olio) this.chiazze?.aggiungi(x, y);
    suona('colpo');
    vibra('leggera');
  };

  private tasto = (e: KeyboardEvent): void => {
    const cifra = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.hud.confermaAperta) this.hud.chiudiConferma();
      else if (this.pausa) this.riprendi();
      else this.apriPausa();
    } else if (this.pausa && cifra >= 0) {
      this.hud.schedaPausa(cifra);
    } else if (e.code === 'KeyM') {
      impostaAudio(!audioAttivo());
      this.hud.avviso(audioAttivo() ? 'Suoni accesi' : 'Suoni spenti');
    } else {
      return;
    }
    e.preventDefault();
  };
}
