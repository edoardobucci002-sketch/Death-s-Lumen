/*
 * Gioco: una notte nel cimitero. Il personaggio cammina, le armi colpiscono da sole, i nemici arrivano dal buio;
 * i nemici uccisi lasciano anime e a volte pane, calamite e reliquiari; a ogni livello si sceglie un dono.
 * La notte ha i suoi eventi: élite ogni 55 s, sciami a inizio minuto, orde in formazione ogni 80 s dal 2:30,
 * il Mietitore ai minuti 5 e 10 (con le sue mosse), l'alba al 15.
 * Pausa con il pulsante, P o Esc, Indietro su Android e quando l'app va in secondo piano; M accende e spegne i suoni.
 * La logica avanza a passo fisso (60 al secondo), il disegno arrotonda tutto al pixel.
 * Nell'indirizzo, per le prove: ?pg=becchino (salta il menu), ?minuto=5 (parte da quel minuto),
 * ?nemici=400 (riempie subito il campo), ?immortale (non si muore), ?livello=8 (armi già a quel livello),
 * ?automatico (sceglie da solo la prima carta a ogni livello), ?armi=candela,falce (armi in più, per provarle),
 * ?seme=7 (un'altra notte), ?bot (gioca il bot, senza disegno e più veloce possibile: lo usa npm run sim).
 */
import Phaser from 'phaser';
import { voce } from '../sistema/asset';
import { arte, ingr, misureHud } from '../sistema/arte';
import { FINESTRE } from '../data/hud';
import { BASE, PERSONAGGI, type Personaggio } from '../data/personaggi';
import { BARRA_SALUTE, LUCE, PIEDI_SEGNAPOSTO, SEME_PREDEFINITO } from '../data/mondo';
import { COMBATTIMENTO, COMPARSA, ELITE, MIETITORE, NEMICI, ORDE, SCIAMI } from '../data/nemici';
import { EFFETTI } from '../data/effetti';
import { ARMI_COMUNI, ARMI_INIZIALI, COLPI } from '../data/armi';
import { ABILITA } from '../data/abilita';
import { PASSIVI, RICARICA_MINIMA, type IdDono } from '../data/doni';
import { animePerLivello, CARTE } from '../data/progressione';
import { ALBA, DROP } from '../data/oggetti';
import { BOT } from '../data/bot';
import { Anime } from '../sistema/anime';
import { Arsenale, type Bonus } from '../sistema/armi';
import { Bot } from '../sistema/bot';
import { suona, audioAttivo, impostaAudio } from '../sistema/audio';
import { Caso } from '../sistema/caso';
import { Comandi } from '../sistema/comandi';
import { Doni, type Dono } from '../sistema/doni';
import { Effetti, PROFONDITA } from '../sistema/effetti';
import { Hud, type VoceBuild } from '../sistema/hud';
import { vibra } from '../sistema/mobile';
import { CALAMITA, Oggetti, PANE, RELIQUIARIO } from '../sistema/oggetti';
import { Orda } from '../sistema/orda';
import { Minacce } from '../sistema/minacce';
import { leggiRecord, salvaRecord } from '../sistema/record';
import { Simulazione } from '../sistema/simulazione';
import { Speciale } from '../sistema/speciale';
import { creaTerreno } from '../sistema/terreno';
import { CHIAVI_BUIO, creaBuio } from '../sistema/luce';

const PASSO = 1 / 60;
const PASSO_MS = 1000 * PASSO;
const RITARDO_MASSIMO_MS = 250; // dopo un blocco lungo non recupera all'infinito
const ID_PIPISTRELLO = NEMICI.findIndex((t) => t.id === 'pipistrello');
const ID_FANTASMA = NEMICI.findIndex((t) => t.id === 'fantasma');

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
  private effetti!: Effetti;
  private doni!: Doni;
  private raccolta = 0;
  private rigenerazione = 0;
  private bonus: Bonus = { danno: 0, ricarica: 1, area: 0, quantita: 0 };
  private areaLuce = 0;
  private dirX = 1; // ultima direzione in cui ha camminato (le armi colpiscono da quella parte)
  private dirY = 0;
  private velocita = 0;
  private armatura = 0;
  private invulnerabile = 0; // secondi rimasti
  private attesaFine = 0;
  private immortale = false;
  private automatico = false;
  private bot: Bot | null = null; // con ?bot gioca lui
  private sim: Simulazione | null = null;
  private inMoto = false;
  private versoSinistra = false;
  private chiaveSprite = '';
  // eventi della notte
  private prossimaElite = 0;
  private ultimoSciame = 0;
  private prossimaOrda = 0;
  private prossimoPane = 0; // secondi: prima di allora non cade altro pane
  private prossimaCalamita = 0;
  private mietitoriArrivati = 0;
  private terreno!: Phaser.GameObjects.TileSprite;
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
    this.ultimoSciame = Math.ceil(this.secondi / 60) - 1;
    this.prossimoPane = this.prossimaCalamita = 0;
    this.prossimaOrda = ORDE.primo + Math.max(0, Math.ceil((this.secondi - ORDE.primo) / ORDE.ogni)) * ORDE.ogni;
    this.mietitoriArrivati = MIETITORE.minuti.filter((m) => m * 60 < this.secondi).length;

    creaTerreno(this, 'terreno', SEME_PREDEFINITO);
    this.terreno = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'terreno').setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.terreno);
    this.minacce = new Minacce(this);
    this.orda = new Orda(this, this.caso, this.minacce);
    this.anime = new Anime(this);
    this.oggetti = new Oggetti(this);
    this.effetti = new Effetti(this);
    this.arsenale = new Arsenale(this, this.orda, this.caso, this.bonus, this.effetti);
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
    this.areaLuce = this.bonus.area;
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height, LUCE.raggio * (1 + this.areaLuce));
    this.buio = this.add.image(0, 0, CHIAVI_BUIO[1]).setOrigin(0).setScrollFactor(0).setDepth(PROFONDITA.buio);
    // barra della salute sotto i piedi, sopra il buio così si vede sempre
    // (disegnata da Edoardo: cornice col cuore e riempimento che si taglia da sinistra)
    this.saluteCornice = this.add.image(0, 0, 'Barra_Salute_Cornice').setOrigin(0).setDepth(PROFONDITA.barra);
    this.salutePiena = this.add.image(0, 0, 'Barra_Salute_Piena').setOrigin(0).setDepth(PROFONDITA.barra + 0.1);
    this.scalaSalute();

    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    this.comandi = new Comandi(interfaccia);
    this.hud = new Hud(interfaccia, {
      pausa: () => this.apriPausa(),
      riprendi: () => this.riprendi(),
      riprova: () => this.scene.restart({ pg: this.pg.id }),
      menu: () => this.scene.start('Menu'),
    });
    this.doni = new Doni(interfaccia, this.arsenale, arma, this.passivi, this.caso);
    this.speciale = new Speciale(interfaccia, ABILITA[this.pg.abilita], this.pg.nome.replace(/ /g, '_'), () => {
      if (this.finito || this.pausa || this.doni.aperta) return false;
      this.arsenale.abilita(ABILITA[this.pg.abilita]);
      suona('speciale');
      vibra('media');
      return true;
    });
    this.aggiornaBuild();
    this.bot = parametri.has('bot') ? new Bot(this.orda, this.anime, this.oggetti, this.minacce, arma) : null;
    this.sim = this.bot ? new Simulazione() : null;
    this.cameras.main.setVisible(!this.bot);

    const riempi = Number(parametri.get('nemici'));
    if (riempi > 0) this.orda.riempi(riempi, this.secondi, this.x, this.y, this.scale.width / 2, this.scale.height / 2);

    this.scale.on('resize', this.ridimensiona, this);
    this.game.events.on('sfondo', this.apriPausa, this);
    window.addEventListener('keydown', this.tasto);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.ridimensiona, this);
      this.game.events.off('sfondo', this.apriPausa, this);
      window.removeEventListener('keydown', this.tasto);
      this.comandi.distruggi();
      this.hud.distruggi();
      this.doni.distruggi();
      this.speciale.distruggi();
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
    if (!this.fermo()) this.effetti.aggiorna(delta / 1000);
    this.disegna(delta / 1000);
  }

  /** Tasto Indietro di Android: pausa, riprende, o dalla fine torna al menu. Restituisce sempre true (gestito). */
  indietro(): boolean {
    if (this.finito && this.hud.fineAperta) this.scene.start('Menu');
    else if (this.pausa) this.riprendi();
    else this.apriPausa();
    return true;
  }

  /** Il gioco è fermo: pausa o scelta del dono. */
  private fermo(): boolean {
    return this.pausa || this.doni.aperta;
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
    this.speciale.aggiorna(dt, this.bonus.ricarica);
    if (this.bot && this.speciale.attesa <= 0) {
      const a = ABILITA[this.pg.abilita];
      if (this.bot.abilita(this.x, this.y - COLPI.corpo, a.raggio * (1 + this.bonus.area), a.cura > 0, this.salute / this.saluteMassima)) this.speciale.prova();
    }

    const mezzaL = this.scale.width / 2;
    const mezzaA = this.scale.height / 2;
    this.notte(mezzaL, mezzaA);
    if (this.finito) return;
    this.orda.aggiorna(dt, this.secondi, this.x, this.y, dx, dy, this.velocita, mezzaL, mezzaA);
    this.arsenale.aggiorna(dt, this.x, this.y, this.dirX, this.dirY, this.versoSinistra ? -1 : 1, mezzaL, mezzaA);
    const cura = this.arsenale.cura();
    if (cura && this.salute < this.saluteMassima) suona('cura');
    const primaCura = this.salute;
    this.salute = Math.min(this.saluteMassima, this.salute + (this.rigenerazione + cura) * dt);
    this.sim?.curato('altro', this.salute - primaCura);
    this.orda.rimuoviMorti(this.muore);
    const minaccia = this.minacce.aggiorna(dt, this.x, this.y, COMBATTIMENTO.raggioGiocatore);
    if (this.minacce.colpita) {
      this.minacce.colpita = false;
      this.effetti.scuoti(EFFETTI.minacce.scossa.forza, EFFETTI.minacce.scossa.durata);
    }
    this.contatti(dt, minaccia);
    const raccolte = this.anime.aggiorna(dt, this.x, this.y - COLPI.corpo, this.raccolta);
    if (raccolte) {
      this.esperienza += raccolte;
      this.animeTotali += raccolte;
      suona('anima');
    }
    this.oggetti.aggiorna(this.x, this.y - COLPI.corpo, this.raccogli);
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

  /** Eventi della notte (GDD, sezione 1): élite, sciami, Mietitore, alba. */
  private notte(mezzaL: number, mezzaA: number): void {
    while (this.secondi >= this.prossimaElite) {
      this.orda.nasciElite(this.secondi, this.x, this.y, mezzaL, mezzaA);
      this.prossimaElite += ELITE.ogni;
    }
    const minuto = Math.floor(this.secondi / 60);
    if (minuto > this.ultimoSciame) {
      this.ultimoSciame = minuto;
      if (minuto >= 1 && minuto <= SCIAMI.ultimoMinuto && !(SCIAMI.saltaMinuti as readonly number[]).includes(minuto)) {
        const quanti = Math.min(SCIAMI.massimo, SCIAMI.base + SCIAMI.perMinuto * minuto);
        this.orda.sciame(this.secondi, minuto <= SCIAMI.pipistrelliFinoAl ? ID_PIPISTRELLO : ID_FANTASMA, quanti, this.x, this.y, mezzaL, mezzaA);
        this.hud.avviso('Lo sciame', 'ti circonda');
      }
    }
    if (this.secondi >= this.prossimaOrda && this.prossimaOrda <= ORDE.ultimo) {
      this.prossimaOrda += ORDE.ogni;
      const m = this.secondi / 60;
      const quanti = Math.min(ORDE.massimo, Math.round(ORDE.base + ORDE.perMinuto * m));
      let tipo = ORDE.tipi[0].tipo;
      for (const t of ORDE.tipi) if (this.secondi >= t.dal) tipo = t.tipo;
      const id = NEMICI.findIndex((t) => t.id === tipo);
      const angolo = this.caso.numero() * Math.PI * 2;
      this.orda.orda(this.secondi, id, quanti, angolo, this.x, this.y, mezzaL, mezzaA);
      const tenaglia = this.secondi >= ORDE.tenagliaDal;
      if (tenaglia) this.orda.orda(this.secondi, id, quanti, angolo + Math.PI, this.x, this.y, mezzaL, mezzaA);
      this.hud.avviso(tenaglia ? 'Due orde ti stringono' : "Un'orda marcia verso di te");
    }
    if (this.mietitoriArrivati < MIETITORE.minuti.length && this.secondi >= MIETITORE.minuti[this.mietitoriArrivati] * 60) {
      this.orda.nasciMietitore(this.secondi, this.mietitoriArrivati, this.x, this.y, mezzaL, mezzaA);
      this.mietitoriArrivati++;
      this.sim?.mietitoreArrivato(this.secondi);
      this.hud.avviso('Il Mietitore', 'è venuto per te');
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

  /** Ricalcola statistiche e bonus delle armi da personaggio e doni passivi (GDD, sezioni 2 e 5). */
  private ricalcola(): void {
    const per = (id: IdDono): number => this.passivi[id] * PASSIVI.find((q) => q.id === id)!.per;
    this.saluteMassima = BASE.salute + this.pg.salute + per('cuoreDiCera');
    this.velocita = BASE.velocita * (1 + this.pg.velocita + per('aliDiFalena'));
    this.raccolta = BASE.raccolta * (1 + per('calamita'));
    this.rigenerazione = this.pg.rigenerazione + per('erbeAmare');
    this.armatura = BASE.armatura + this.pg.armatura + per('scudoDiFerro');
    this.bonus.danno = this.pg.danno + per('saleNero');
    this.bonus.ricarica = Math.max(RICARICA_MINIMA, (1 - this.pg.ricarica) * (1 - PASSIVI.find((q) => q.id === 'clessidra')!.per) ** this.passivi.clessidra);
    this.bonus.area = this.pg.area + per('stoppinoLungo');
    this.bonus.quantita = per('specchio');
  }

  /** Dopo un dono passivo: statistiche, salute in più del Cuore di cera, alone più ampio con lo Stoppino lungo. */
  private dopoPassivo(): void {
    const prima = this.saluteMassima;
    this.ricalcola();
    this.salute += this.saluteMassima - prima;
    if (this.bonus.area !== this.areaLuce) {
      this.areaLuce = this.bonus.area;
      this.ridimensiona();
    }
  }

  /** Un nemico muore: anime, scoppio, e a volte pane, calamita o reliquiari. */
  private muore = (x: number, y: number, valore: number, reliquiari: number): void => {
    this.anime.aggiungi(x, y, valore, this.x, this.y);
    this.effetti.scoppio(x, y);
    this.sim?.ucciso();
    for (let k = 0; k < reliquiari; k++) this.oggetti.aggiungi(RELIQUIARIO, x + k * 30, y);
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
    if (tipo === PANE) {
      const prima = this.salute;
      this.salute = Math.min(this.saluteMassima, this.salute + DROP.pane.cura);
      this.sim?.curato('pane', this.salute - prima);
      suona('cura');
    } else if (tipo === CALAMITA) {
      this.anime.attiraTutte();
      suona('reliquiario');
    } else {
      this.apriReliquiario();
    }
  };

  /** Reliquiario: 1 potenziamento (75%) o 3 (25%) di ciò che possiedi; se è tutto al massimo, salute. */
  private apriReliquiario(): void {
    const quanti = this.caso.numero() < DROP.reliquiario.tre ? 3 : 1;
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
      if (this.livelliDaScegliere > 0) this.apriDoni();
      else if (!this.pausa) this.anims.resumeAll();
    });
    if (this.bot) this.doni.scegliCon((carte) => this.bot!.carta(carte, this.arsenale.possedute.length));
    else if (this.automatico) this.doni.scegliPrima();
  }

  private apriPausa(): void {
    if (this.finito || this.pausa) return;
    this.pausa = true;
    this.anims.pauseAll();
    this.comandi.lascia();
    this.hud.mostraPausa(this.build());
  }

  private riprendi(): void {
    if (!this.pausa) return;
    this.pausa = false;
    this.hud.nascondiPausa();
    if (!this.doni.aperta) this.anims.resumeAll();
  }

  private mostraFine(vittoria: boolean): void {
    if (this.sim) {
      this.sim.fine({
        vittoria, secondi: Math.round(this.secondi), livello: this.livello, anime: this.animeTotali, danno: Math.round(this.arsenale.dannoTotale),
        build: this.build().map((v) => `${v.nome} ${v.livello}`),
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
    });
  }

  /** Armi e doni posseduti, per le icone in alto e i riepiloghi. */
  private build(): VoceBuild[] {
    const voci: VoceBuild[] = this.arsenale.possedute.map((p) => ({ nome: p.arma.nome, icona: p.arma.icona, livello: p.livello, arma: true }));
    for (const q of PASSIVI) {
      if (this.passivi[q.id]) voci.push({ nome: q.nome, icona: q.icona, livello: this.passivi[q.id], arma: false });
    }
    return voci;
  }

  private aggiornaBuild(): void {
    this.hud.build(this.build());
  }

  /**
   * Danno da contatto: il colpo più forte tra i nemici che toccano il personaggio e le mosse del Mietitore
   * (minaccia), poi un attimo di invulnerabilità.
   */
  private contatti(dt: number, minaccia: number): void {
    if (this.invulnerabile > 0) {
      this.invulnerabile -= dt;
      return;
    }
    const o = this.orda;
    let colpo = minaccia;
    for (let i = 0; i < o.numero; i++) {
      const r = o.raggio[i] + COMBATTIMENTO.raggioGiocatore;
      const dx = o.x[i] - this.x;
      const dy = o.y[i] - this.y;
      if (dx * dx + dy * dy < r * r && o.danno[i] > colpo) colpo = o.danno[i];
    }
    if (!colpo) return;
    this.invulnerabile = COMBATTIMENTO.invulnerabilita;
    if (this.immortale) return;
    const danno = Math.max(1, colpo - this.armatura);
    this.salute -= danno;
    this.sim?.colpito(danno);
    suona('danno');
    vibra('leggera');
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
    this.oggetti.disegna(cam, this.fermo() ? 0 : dt);
    this.arsenale.disegna();
    this.minacce.disegna();
    this.terreno.setTilePosition(cam.scrollX, cam.scrollY);
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]);
    this.buio.setPosition(
      px - cam.scrollX - Math.floor(this.misureBuio.w / 2),
      py - LUCE.altezza - cam.scrollY - Math.floor(this.misureBuio.h / 2),
    );
    const z = this.zSalute, f = FINESTRE.Barra_Salute_Cornice;
    const bx = px - Math.floor(((arte('Barra_Salute_Cornice')?.w ?? 0) * z) / 2);
    const by = py + BARRA_SALUTE.distanza;
    const piena = Math.round(f.l * Math.max(0, this.salute / this.saluteMassima));
    this.saluteCornice.setPosition(bx, by).setVisible(!this.morto);
    this.salutePiena.setPosition(bx + f.x * z, by + f.y * z).setCrop(0, 0, piena, f.a).setVisible(!this.morto && piena > 0);
    const boss = this.orda.mietitore();
    this.hud.aggiorna(
      this.secondi, !this.finito && this.salute < this.saluteMassima * COMBATTIMENTO.saluteBassa, this.livello,
      this.esperienza / animePerLivello(this.livello), this.animeTotali,
      boss >= 0 ? Math.max(0, this.orda.salute[boss] / this.orda.saluteMassima[boss]) : -1,
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

  private ridimensiona(): void {
    this.scalaSalute();
    this.terreno.setSize(this.scale.width, this.scale.height);
    this.misureBuio = creaBuio(this, this.scale.width, this.scale.height, LUCE.raggio * (1 + this.areaLuce));
    this.buio.setTexture(CHIAVI_BUIO[this.fiamma]);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.pausa) this.riprendi();
      else this.apriPausa();
    } else if (e.code === 'KeyM') {
      impostaAudio(!audioAttivo());
      this.hud.avviso(audioAttivo() ? 'Suoni accesi' : 'Suoni spenti');
    } else {
      return;
    }
    e.preventDefault();
  };
}
