/*
 * Armi: ogni arma posseduta si ricarica e colpisce da sola. Sono di quattro famiglie:
 * - colpi istantanei: Lanterna (arco), Pala e Campana (cerchio), Lama di luce (fendente);
 * - proiettili: Bastone e Candela (verso il nemico più vicino), Fuoco fatuo (lo insegue);
 * - zone che feriscono a intervalli: nubi del Turibolo, pozze dell'Acqua santa, abilità speciali;
 * - lame che girano intorno al personaggio: Falce;
 * - Lapide (cade dall'alto), Rosario spezzato (grano che rimbalza), Corvo (vola e becca), Velo funebre (aura).
 * Ogni arma ha un'affinità (data/stati.ts): colpendo lascia uno stato; quando due stati fanno una reazione,
 * la reazione va in coda e si esegue alla fine del passo (esplosioni, fiammelle), fuori dalle ricerche nella griglia.
 * Proiettili, zone, coda ed effetti sono pool preparati all'inizio: niente allocazioni durante la partita.
 */
import Phaser from 'phaser';
import { ingrandimento, raggioDisegnato } from './asset';
import { Caso } from './caso';
import { ECLISSI, ESORCISMO, INTERRAMENTO, LUCE, OMBRA, RIVELAZIONE, SACRO, TERRA, type Orda } from './orda';
import { AFFINITA_ABILITA, REAZIONI, RUOLI, STATI } from '../data/stati';
import { NEMICI } from '../data/nemici';
import { suona } from './audio';
import { PROFONDITA, type Effetti } from './effetti';
import { EFFETTI } from '../data/effetti';
import type { Abilita } from '../data/abilita';
import {
  BASTONE, CAMPANA, CANDELA, COLPI, CORVO, FALCE, FUOCO_FATUO, LAMA_DI_LUCE, LANTERNA, LAPIDE, PALA, ROSARIO_SPEZZATO, TURIBOLO, type Arma,
} from '../data/armi';
import { MOLTIPLICA_CRITICO } from '../data/doni';
import { NUMERI_UNIONI as U } from '../data/unioni';
import type { Anime } from './anime';
import type { Chiazze } from './chiazze';
import type { Rompibili } from './rompibili';
import { CHIAZZE, ROMPIBILI } from '../data/rompibili';
import { creaSpriteOggetti, RAGGIO_VELO, SPRITE_CORVO, SPRITE_GRANO, SPRITE_LAPIDE, SPRITE_SCIA, SPRITE_VELO } from './segnaposto-oggetti';

const NUBE = 1;
const POZZA = 2;
const ESPLOSIONE = 5; // in coda insieme alle reazioni: l'esplosione del dardo del Bastone
const MAX_CODA = 48;
const CODICE_AFFINITA = { luce: LUCE, sacro: SACRO, ombra: OMBRA, terra: TERRA } as const;
const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');
const MAX_EFFETTI = 48;
const MAX_ZONE = 64;
const MAX_PROIETTILI = 96;
const MAX_LAME = 8;
const MAX_RITARDATI = 8;
const MAX_LAPIDI = 8;
const MAX_GRANI = 6;
const MAX_RIMBALZI = 12; // un grano ricorda fino a tanti nemici già colpiti
const MAX_CORVI = 5;
const PASSI_STORIA = 64; // posizioni ricordate per la Lama dell'alba (più di un secondo)
const SCIA = 1; // proiettile che lascia una scia (Candelabro funebre)
const RACCOGLIE = 2; // proiettile che raccoglie le anime (Fuochi erranti)
// i proiettili della v0 attraversano la tela nei loro fotogrammi: si usa l'ultimo, con l'origine sulla punta
const PROIETTILI_V0: Record<string, { fotogramma: string; x: number; y: number }> = {
  [BASTONE.effetto]: { fotogramma: '3', x: 88, y: 64 },
  [CANDELA.effetto]: { fotogramma: '3', x: 86, y: 64 },
  [FUOCO_FATUO.effetto]: { fotogramma: '3', x: 84, y: 60 },
};

export interface Posseduta {
  arma: Arma;
  livello: number; // da 1 a 8
  unita?: boolean; // arma unita (data/unioni.ts)
}

/** I bonus del personaggio e dei doni passivi che cambiano le armi (li aggiorna la scena). */
export interface Bonus {
  danno: number; // 0,15 = +15%
  ricarica: number; // moltiplica le attese: 0,9 = −10%
  area: number; // 0,15 = raggi +15%
  quantita: number; // proiettili, nubi, fiale, fuochi, falci in più (Specchio)
  durata: number; // 0,15 = zone +15% (Cera votiva)
  critico: number; // 0,06 = 6% di colpi critici (Chiodo di bara)
}

export class Arsenale {
  readonly possedute: Posseduta[] = [];
  dannoTotale = 0; // per il riepilogo di fine partita
  reazioni = 0; // reazioni tra stati in questa notte (per la simulazione)
  eclissi = 0; // Eclissi in questa notte (impresa del Rosario spezzato)
  richiami = 0; // anime che il Corvo vuole riportare: le legge e le azzera la scena
  sorsiGuadagnati = 0; // sorsi dell'Acquasantiera: li legge e li azzera la scena
  anime: Anime | null = null; // per i Fuochi erranti
  rompibili: Rompibili | null = null; // le armi li rompono con il loro impatto
  chiazze: Chiazze | null = null; // le armi di fuoco accendono l'olio
  private unite: Partial<Record<Arma['id'], boolean>> = {};
  private raffiche = 0; // raffiche del Bastone (Verga dei nomi)
  private uccisiPozze = 0; // uccisioni nelle pozze (Acquasantiera)
  private attesaScia = 0;
  private storiaX = new Float32Array(PASSI_STORIA); // dove era il personaggio (Lama dell'alba)
  private storiaY = new Float32Array(PASSI_STORIA);
  private storiaI = 0;
  private attesa: number[] = [];
  private scena: Phaser.Scene;
  private orda: Orda;
  private caso: Caso;
  private casoStati = new Caso(29); // gli stati hanno il loro caso: così non cambiano carte, comparse e drop della notte
  private bonus: Bonus;
  private effetti: Effetti;
  private colpo = 0; // numero del colpo in corso, per non toccare due volte lo stesso nemico
  private toccati = 0; // nemici toccati dal colpo in corso
  // centro del personaggio, direzione in cui cammina, metà dello schermo
  private px = 0;
  private py = 0;
  private dx = 1;
  private dy = 0;
  private mezzaL = 300;
  private mezzaA = 300;

  // effetti solo da vedere disegnati da Edoardo (impatto, rintocco, fendente, esplosione)
  private sprEffetti: Phaser.GameObjects.Sprite[] = [];
  private vitaEffetto = new Float32Array(MAX_EFFETTI);
  private raggioEffetto = new Map<string, number>();
  private lamaMisure: { x: number; l: number; lunghezza: number; altezza: number } | null = null;

  // zone: nubi, pozze, abilità
  private zone = 0;
  private zX = new Float32Array(MAX_ZONE);
  private zY = new Float32Array(MAX_ZONE);
  private zR = new Float32Array(MAX_ZONE);
  private zDanno = new Float32Array(MAX_ZONE);
  private zVita = new Float32Array(MAX_ZONE);
  private zIntervallo = new Float32Array(MAX_ZONE);
  private zTick = new Float32Array(MAX_ZONE);
  private zRallenta = new Float32Array(MAX_ZONE);
  private zAttira = new Float32Array(MAX_ZONE);
  private zCura = new Float32Array(MAX_ZONE);
  private zSegue = new Uint8Array(MAX_ZONE);
  private zTipo = new Uint8Array(MAX_ZONE); // 0 abilità, 1 nube, 2 pozza (nubi e pozze non si sommano: COLPI.zoneNonCumulative)
  private zAff = new Uint8Array(MAX_ZONE); // affinità della zona
  private zCampi = [this.zX, this.zY, this.zR, this.zDanno, this.zVita, this.zIntervallo, this.zTick, this.zRallenta, this.zAttira, this.zCura];
  private zSprite: Phaser.GameObjects.Sprite[] = [];

  // proiettili
  private proiettili = 0;
  private prX = new Float32Array(MAX_PROIETTILI);
  private prY = new Float32Array(MAX_PROIETTILI);
  private prVX = new Float32Array(MAX_PROIETTILI);
  private prVY = new Float32Array(MAX_PROIETTILI);
  private prVel = new Float32Array(MAX_PROIETTILI);
  private prVita = new Float32Array(MAX_PROIETTILI);
  private prDanno = new Float32Array(MAX_PROIETTILI);
  private prRaggio = new Float32Array(MAX_PROIETTILI);
  private prSterzo = new Float32Array(MAX_PROIETTILI); // 0 = dritto, altrimenti insegue
  private prPortata = new Float32Array(MAX_PROIETTILI);
  private prOX = new Float32Array(MAX_PROIETTILI); // fiammelle dell'Esorcismo: il punto della reazione
  private prOY = new Float32Array(MAX_PROIETTILI);
  private prCampi = [this.prX, this.prY, this.prVX, this.prVY, this.prVel, this.prVita, this.prDanno, this.prRaggio, this.prSterzo, this.prPortata, this.prOX, this.prOY];
  private prReazione = new Uint32Array(MAX_PROIETTILI); // la reazione a cui appartiene la fiammella (0 = nessuna)
  private prEsplode = new Uint8Array(MAX_PROIETTILI);
  private prAff = new Uint8Array(MAX_PROIETTILI);
  private prFuoco = new Uint8Array(MAX_PROIETTILI); // accende l'olio
  private prResto = new Uint8Array(MAX_PROIETTILI); // nemici che può ancora trapassare
  private prUnione = new Uint8Array(MAX_PROIETTILI); // SCIA o RACCOGLIE
  private prColpiti = new Uint32Array(MAX_PROIETTILI * 4); // id dei nemici già colpiti (fino a 4)
  private prSprite: Phaser.GameObjects.Sprite[] = [];
  private raffica = 0; // dardi del bastone ancora da sparare nella raffica in corso
  private attesaRaffica = 0;
  private dannoRaffica = 0;
  private trapassaRaffica = 0;

  // lapidi che cadono
  private lapidi = 0;
  private lpX = new Float32Array(MAX_LAPIDI);
  private lpY = new Float32Array(MAX_LAPIDI);
  private lpR = new Float32Array(MAX_LAPIDI);
  private lpDanno = new Float32Array(MAX_LAPIDI);
  private lpVita = new Float32Array(MAX_LAPIDI);
  private lpCaduta = new Uint8Array(MAX_LAPIDI); // 1 = deve ancora toccare terra
  private lpCampi = [this.lpX, this.lpY, this.lpR, this.lpDanno, this.lpVita];
  private lpSprite: Phaser.GameObjects.Sprite[] = [];

  // grani del Rosario spezzato
  private grani = 0;
  private grX = new Float32Array(MAX_GRANI);
  private grY = new Float32Array(MAX_GRANI);
  private grResto = new Uint8Array(MAX_GRANI);
  private grTempo = new Float32Array(MAX_GRANI);
  private grDanno = new Float32Array(MAX_GRANI);
  private grColpiti = new Uint32Array(MAX_GRANI * MAX_RIMBALZI);
  private grSprite: Phaser.GameObjects.Sprite[] = [];

  // corvi e aura del Velo
  private corvi = 0;
  private angoloCorvi = 0;
  private cvX = new Float32Array(MAX_CORVI);
  private cvY = new Float32Array(MAX_CORVI);
  private cvMX = new Float32Array(MAX_CORVI); // dove sta beccando
  private cvMY = new Float32Array(MAX_CORVI);
  private cvMira = new Float32Array(MAX_CORVI); // secondi in cui resta sul bersaglio
  private cvSprite: Phaser.GameObjects.Sprite[] = [];
  private velo!: Phaser.GameObjects.Image;
  private raggioVelo = 0;

  // falci
  private angoloFalci = 0;
  private falceCresce = 0; // lama più lunga dopo le uccisioni (0,1 = +10%)
  private falceDura = 0; // secondi prima che torni normale
  private scalaLama = 1;
  private lame: Phaser.GameObjects.Sprite[] = [];

  // colpi ritardati: secondo colpo della pala e della campana, fendente alle spalle
  private ritardati = 0;
  private rtTempo = new Float32Array(MAX_RITARDATI);
  private rtArma: Arma[] = [];
  private rtA = new Float32Array(MAX_RITARDATI); // raggio o lunghezza
  private rtB = new Float32Array(MAX_RITARDATI); // danno
  private rtC = new Float32Array(MAX_RITARDATI); // direzione (angolo); per la Campana 1 = rintocco che ferma

  // usati dentro le ricerche nella griglia, per non creare funzioni nel ciclo di gioco
  private cx = 0;
  private cy = 0;
  private cr = 0;
  private cDanno = 0;
  private cRespinta = 0;
  private cForma = 0; // 0 cerchio, 1 arco, 2 rettangolo
  private cCos = 0; // arco: metà ampiezza come coseno
  private cDX = 1; // arco e rettangolo: direzione
  private cDY = 0;
  private cX0 = 0; // rettangolo
  private cX1 = 0;
  private cY0 = 0;
  private cY1 = 0;
  private cZona = 0;
  private cAff = 0; // affinità del colpo in corso
  private cProb: number = STATI.probabilita; // probabilità di lasciare lo stato
  private cFerma = 0; // secondi per cui il colpo in corso ferma i nemici (secondo rintocco)
  private critico = false; // l'ultimo colpo calcolato è un critico?
  private cReazione = 0; // la reazione a cui appartiene il colpo in corso (0 = nessuna): il suo danno va in un solo numero
  private cRX = 0; // il centro della sua zona
  private cRY = 0;
  private cRAperta = 0; // secondi in cui quella reazione può ancora colpire (per il numero)
  private prossimaIdReazione = 0x80000000; // solo da vedere: lontani dai numeri dei nemici, che condividono lo stesso campo
  private cLampo = true; // il colpo in corso fa lampeggiare i nemici? (no per chi ferisce a intervalli, come il Velo)
  // coda delle reazioni e delle esplosioni, eseguite alla fine del passo
  private code = 0;
  private qTipo = new Uint8Array(MAX_CODA);
  private qJ = new Int32Array(MAX_CODA);
  private qX = new Float32Array(MAX_CODA);
  private qY = new Float32Array(MAX_CODA);
  private qDanno = new Float32Array(MAX_CODA);
  private cDt = 0;
  private cProiettile = 0;
  private cMigliore = -1;
  private cDistanza = 0;
  private visitaColpo = (j: number): void => this.tocca(j);
  private visitaZona = (j: number): void => this.toccaZona(j);
  private visitaAttira = (j: number): void => this.attiraZona(j);
  private visitaProiettile = (j: number): void => this.toccaProiettile(j);
  private visitaFalce = (j: number): void => this.toccaFalce(j);
  private visitaVicino = (j: number): void => this.vicino(j);
  private visitaGrano = (j: number): void => this.vicinoGrano(j);
  private scelti = new Int32Array(8); // bersagli già presi dalla raffica di candele

  constructor(scena: Phaser.Scene, orda: Orda, caso: Caso, bonus: Bonus, effetti: Effetti) {
    this.scena = scena;
    this.orda = orda;
    this.caso = caso;
    this.bonus = bonus;
    this.effetti = effetti;
    for (let i = 0; i < MAX_EFFETTI; i++) this.sprEffetti.push(scena.add.sprite(0, 0, PALA.effetto).setVisible(false));
    for (let i = 0; i < MAX_ZONE; i++) this.zSprite.push(scena.add.sprite(0, 0, TURIBOLO.effetto).setVisible(false).setDepth(PROFONDITA.aTerra));
    for (let i = 0; i < MAX_PROIETTILI; i++) this.prSprite.push(scena.add.sprite(0, 0, BASTONE.effetto, '3').setVisible(false).setDepth(PROFONDITA.sopra));
    this.scalaLama = ingrandimento(scena, FALCE.lama);
    for (let i = 0; i < MAX_LAME; i++) this.lame.push(scena.add.sprite(0, 0, FALCE.lama).setScale(this.scalaLama).setVisible(false).setDepth(PROFONDITA.sopra));
    for (let i = 0; i < MAX_RITARDATI; i++) this.rtArma.push(PALA);
    creaSpriteOggetti(scena);
    for (let i = 0; i < MAX_LAPIDI; i++) this.lpSprite.push(scena.add.sprite(0, 0, SPRITE_LAPIDE).setOrigin(0.5, 1).setScale(LAPIDE.ingrandimento).setDepth(PROFONDITA.sopra).setVisible(false));
    for (let i = 0; i < MAX_GRANI; i++) this.grSprite.push(scena.add.sprite(0, 0, SPRITE_GRANO).setDepth(PROFONDITA.sopra).setVisible(false));
    for (let i = 0; i < MAX_CORVI; i++) this.cvSprite.push(scena.add.sprite(0, 0, SPRITE_CORVO).setScale(CORVO.ingrandimento).setDepth(PROFONDITA.sopra).setVisible(false));
    this.velo = scena.add.image(0, 0, SPRITE_VELO).setDepth(PROFONDITA.aTerra).setVisible(false);
  }

  aggiungi(arma: Arma): void {
    this.possedute.push({ arma, livello: 1 });
    this.attesa.push(0.5);
  }

  livello(arma: Arma): number {
    for (const p of this.possedute) if (p.arma === arma) return p.livello;
    return 0;
  }

  /** L'arma diventa la sua versione unita. */
  unisci(arma: Arma): void {
    for (const p of this.possedute) if (p.arma === arma) p.unita = true;
    this.unite[arma.id] = true;
  }

  unita(arma: Arma): boolean {
    return !!this.unite[arma.id];
  }

  potenzia(arma: Arma): void {
    for (const p of this.possedute) if (p.arma === arma) p.livello++;
  }

  /**
   * Un passo di logica. (x, y) sono i piedi del personaggio, (dx, dy) la direzione in cui cammina,
   * mezzaL e mezzaA sono metà dello schermo.
   */
  aggiorna(dt: number, x: number, y: number, dx: number, dy: number, mezzaL: number, mezzaA: number): void {
    this.px = x;
    this.py = y - COLPI.corpo;
    this.dx = dx;
    this.dy = dy;
    this.mezzaL = mezzaL;
    this.mezzaA = mezzaA;
    this.storiaI = (this.storiaI + 1) % PASSI_STORIA;
    this.storiaX[this.storiaI] = this.px;
    this.storiaY[this.storiaI] = this.py;
    for (let n = 0; n < this.possedute.length; n++) {
      const p = this.possedute[n];
      if (p.arma.id === 'falce') continue; // sempre attiva
      this.attesa[n] -= dt;
      if (this.attesa[n] > 0) continue;
      this.attesa[n] += this.spara(p) * this.bonus.ricarica;
      if (this.attesa[n] < 0) this.attesa[n] = 0;
    }
    this.aggiornaRitardati(dt);
    this.aggiornaRaffica(dt);
    this.aggiornaFalci(dt);
    this.aggiornaZone(dt);
    this.aggiornaProiettili(dt);
    this.aggiornaLapidi(dt);
    this.aggiornaGrani(dt);
    this.aggiornaCorvi(dt);
    this.eseguiCoda();
    if (this.falceDura > 0 && (this.falceDura -= dt) <= 0) this.falceCresce = 0;
    for (let i = 0; i < MAX_EFFETTI; i++) {
      if (this.vitaEffetto[i] > 0 && (this.vitaEffetto[i] -= dt) <= 0) this.sprEffetti[i].stop().setVisible(false);
    }
  }

  /** Lancia un'abilità speciale nel punto del personaggio. */
  abilita(a: Abilita): void {
    const area = 1 + this.bonus.area;
    this.zona(a.effetto, this.px, this.py, a.raggio * area, a.danno, a.durata, a.intervallo, a.rallenta, a.attira, a.cura, a.segue, a.animazione === 'ciclo',
      0, CODICE_AFFINITA[AFFINITA_ABILITA[a.id]]);
  }

  /** Martire: un'onda sacra intorno al personaggio quando subisce un colpo. */
  onda(raggio: number, danno: number): void {
    this.prepara(0, this.px, this.py, raggio, danno, 0);
    this.cAff = SACRO;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.rompiForma();
    this.effetti.reazione(this.px, this.py, raggio, REAZIONI.rivelazione.colore, REAZIONI.rivelazione.bordo, REAZIONI.durataEffetto);
  }

  /** Lucciola (e Laboratorio): lascia lo stato dell'affinità aff ai nemici entro raggio (senza danno); le reazioni si eseguono a fine passo. */
  abbaglia(x: number, y: number, raggio: number, aff: number = LUCE): void {
    const o = this.orda, r2 = raggio * raggio;
    for (let j = 0; j < o.numero; j++) {
      const dx = o.x[j] - x, dy = o.y[j] - y;
      if (dx * dx + dy * dy > r2) continue;
      const r = o.marca(j, aff);
      if (r) this.accoda(r, j, 0);
    }
  }

  /** Salute al secondo che il personaggio riceve dalle zone che curano (Benedizione) in cui si trova. */
  cura(): number {
    let c = 0, nube = 0;
    for (let i = 0; i < this.zone; i++) {
      if (!this.zCura[i]) continue;
      const dx = this.px - this.zX[i];
      const dy = this.py - this.zY[i];
      if (dx * dx + dy * dy > this.zR[i] * this.zR[i]) continue;
      if (this.zTipo[i] === NUBE) nube = this.zCura[i]; // le nubi non si sommano
      else c += this.zCura[i];
    }
    return c + nube;
  }

  /** Secondi che il personaggio passa dentro le nubi del Turibolo: 1 se è dentro una nube adesso (impresa del Velo funebre). */
  dentroNube(): boolean {
    for (let i = 0; i < this.zone; i++) {
      if (this.zTipo[i] !== NUBE) continue;
      const dx = this.px - this.zX[i], dy = this.py - this.zY[i];
      if (dx * dx + dy * dy <= this.zR[i] * this.zR[i]) return true;
    }
    return false;
  }

  /** Disegna ciò che si muove; gli effetti istantanei restano dove sono nati. Posizioni arrotondate al pixel. */
  disegna(): void {
    for (let i = 0; i < this.zone; i++) this.zSprite[i].setPosition(Math.round(this.zX[i]), Math.round(this.zY[i]));
    for (let i = 0; i < this.proiettili; i++) {
      this.prSprite[i].setPosition(Math.round(this.prX[i]), Math.round(this.prY[i])).setRotation(Math.atan2(this.prVY[i], this.prVX[i]));
    }
    for (let i = 0; i < this.lapidi; i++) {
      const sale = this.lpCaduta[i] ? (LAPIDE.altezza * (this.lpVita[i] - LAPIDE.resta)) / LAPIDE.caduta : 0;
      this.lpSprite[i].setPosition(Math.round(this.lpX[i]), Math.round(this.lpY[i] - sale));
    }
    for (let i = 0; i < this.grani; i++) this.grSprite[i].setPosition(Math.round(this.grX[i]), Math.round(this.grY[i]));
    for (let i = 0; i < this.corvi; i++) this.cvSprite[i].setPosition(Math.round(this.cvX[i]), Math.round(this.cvY[i]));
    if (this.raggioVelo) this.velo.setPosition(Math.round(this.px), Math.round(this.py)).setScale(this.raggioVelo / RAGGIO_VELO).setVisible(true);
    // il numero sommato segue la testa di élite e Seth, così non finisce mai sul loro corpo
    const o = this.orda;
    for (let j = 0; j < o.numero; j++) {
      if (o.elite[j] || o.tipo[j] === ID_MIETITORE) this.effetti.seguiSomma(o.id[j], o.x[j], o.y[j] - o.altezza(j));
    }
  }

  /** Fa partire il colpo di un'arma; restituisce la ricarica del suo livello. */
  private spara(p: Posseduta): number {
    const a = p.arma;
    const area = 1 + this.bonus.area;
    const piu = this.bonus.quantita;
    switch (a.id) {
      case 'lanterna': {
        const l = a.livelli[p.livello - 1];
        if (this.unite.lanterna) {
          this.arco(this.dx, this.dy, l.raggio * area, 360, l.danno, U.faro.abbaglia);
          return l.ricarica;
        }
        this.arco(this.dx, this.dy, l.raggio * area, l.ampiezza, l.danno);
        if (l.spalle) this.arco(-this.dx, -this.dy, l.raggio * area, l.ampiezza, l.danno);
        return l.ricarica;
      }
      case 'pala': {
        const l = a.livelli[p.livello - 1];
        this.impatto(this.dx, this.dy, l.raggio * area, l.danno);
        if (l.doppio) this.ritarda(a, a.ritardoDoppio, l.raggio * area, l.danno, Math.atan2(-this.dy, -this.dx));
        return l.ricarica;
      }
      case 'campana': {
        const l = a.livelli[p.livello - 1];
        this.rintocco(l.raggio * area, l.danno, this.unite.campana ? U.campana.fermo : 0);
        if (l.doppio) this.ritarda(a, a.ritardoDoppio, l.raggio * area, l.danno, 1); // il secondo rintocco ferma
        return l.ricarica;
      }
      case 'lamaDiLuce': {
        const l = a.livelli[p.livello - 1];
        // il fendente segue la direzione in cui cammini (prima solo destra o sinistra)
        this.fendente(this.dx, this.dy, l.lunghezza * area, l.danno);
        if (this.unite.lamaDiLuce) {
          const k = (this.storiaI + PASSI_STORIA - Math.min(PASSI_STORIA - 1, Math.round(U.lama.ritardo * 60))) % PASSI_STORIA;
          this.fendente(this.dx, this.dy, l.lunghezza * area, l.danno, this.storiaX[k], this.storiaY[k]);
        }
        if (l.spalle) this.ritarda(a, a.ritardoSpalle, l.lunghezza * area, l.danno, Math.atan2(-this.dy, -this.dx));
        return l.ricarica;
      }
      case 'turibolo': {
        const l = a.livelli[p.livello - 1];
        for (let k = 0; k < l.quantita + piu; k++) {
          let nx = this.px + this.dx * a.distanzaPrima;
          let ny = this.py + this.dy * a.distanzaPrima;
          if (k > 0) {
            const ang = this.caso.numero() * Math.PI * 2;
            const d = this.caso.numero() * a.distanzaAltre;
            nx = this.px + Math.cos(ang) * d;
            ny = this.py + Math.sin(ang) * d;
          }
          this.zona(a.effetto, nx, ny, l.raggio * area, l.danno, l.durata, a.intervallo, a.rallenta, 0, this.unite.turibolo ? U.incensiere.cura : 0, false, false, NUBE, SACRO);
        }
        return l.ricarica;
      }
      case 'acquaSanta': {
        const l = a.livelli[p.livello - 1];
        const o = this.orda;
        for (let k = 0; k < l.quantita + piu; k++) {
          const j = this.nemicoVisibile();
          if (j < 0) break;
          this.zona(a.effetto, o.x[j], o.y[j] - o.raggio[j], l.raggio * area, l.danno, l.durata, a.intervallo, 0, 0, 0, false, true, POZZA, SACRO);
        }
        return l.ricarica;
      }
      case 'bastone': {
        const l = a.livelli[p.livello - 1];
        this.raffica = l.quantita + piu;
        this.attesaRaffica = 0;
        this.dannoRaffica = l.danno;
        this.trapassaRaffica = l.trapassa;
        if (this.unite.bastone && ++this.raffiche % U.verga.ogni === 0) this.colpisciMaledetti(l.danno * U.verga.danno);
        return l.ricarica;
      }
      case 'candela': {
        const l = a.livelli[p.livello - 1];
        // ogni fiammella verso un nemico diverso, dal più vicino in poi
        const n = Math.min(l.quantita + piu, this.scelti.length);
        for (let k = 0; k < n; k++) {
          const j = this.piuVicino(a.portata, k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.lancia(a.effetto, j, a.velocita, a.vita, l.danno, l.trapassa, a.raggio, 0, 0, false, 0, LUCE);
          if (this.unite.candela && this.proiettili) this.prUnione[this.proiettili - 1] = SCIA;
        }
        return l.ricarica;
      }
      case 'fuocoFatuo': {
        const l = a.livelli[p.livello - 1];
        const n = l.quantita + piu;
        // partono a raggiera e poi girano verso i nemici
        for (let k = 0; k < n; k++) {
          this.lancia(a.effetto, -1, a.velocita, a.vita, l.danno, l.trapassa, a.raggio, a.sterzo, a.portata, false, (k / n) * Math.PI * 2, OMBRA);
          if (this.unite.fuocoFatuo && this.proiettili) this.prUnione[this.proiettili - 1] = RACCOGLIE;
        }
        return l.ricarica;
      }
      case 'lapide': {
        const l = a.livelli[p.livello - 1];
        const n = Math.min(l.quantita + piu, this.scelti.length);
        for (let k = 0; k < n; k++) {
          const j = this.piuForte(k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.lapideCade(this.orda.x[j], this.orda.y[j], l.raggio * area, l.danno);
        }
        return l.ricarica;
      }
      case 'rosarioSpezzato': {
        const l = a.livelli[p.livello - 1];
        const n = Math.min(l.quantita + piu, this.scelti.length);
        for (let k = 0; k < n; k++) {
          const j = this.piuVicino(a.portata, k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.lanciaGrano(j, l.danno, l.rimbalzi);
        }
        return l.ricarica;
      }
      case 'corvo': {
        const l = a.livelli[p.livello - 1];
        const o = this.orda;
        this.corvi = Math.min(l.quantita + piu, MAX_CORVI, this.scelti.length);
        for (let k = 0; k < this.corvi; k++) {
          const j = this.piuVicino(a.portata, k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.cvMX[k] = o.x[j];
          this.cvMY[k] = o.y[j] - o.raggio[j];
          this.cvMira[k] = 0.18;
          this.ferisci(j, l.danno, 0, 0, 0, LUCE);
          this.rompibili?.colpitoDa(this.cvMX[k], this.cvMY[k], ROMPIBILI.raggio);
        }
        this.richiami += l.anime;
        return l.ricarica;
      }
      case 'veloFunebre': {
        const l = a.livelli[p.livello - 1];
        this.raggioVelo = l.raggio * area;
        this.prepara(0, this.px, this.py, this.raggioVelo, l.danno, 0);
        this.cAff = SACRO;
        this.cProb = RUOLI.veloConsacra;
        this.cLampo = false;
        this.orda.griglia.nelRaggio(this.cx, this.cy, this.raggioVelo + 40, this.visitaColpo);
        this.rompiForma();
        return l.ricarica;
      }
      case 'falce':
        return 1;
    }
  }

  /** Verga dei nomi: colpisce tutti i nemici maledetti sullo schermo. */
  private colpisciMaledetti(danno: number): void {
    const o = this.orda;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= 0 || !o.maledetto(j) || Math.abs(o.x[j] - this.px) > this.mezzaL || Math.abs(o.y[j] - this.py) > this.mezzaA) continue;
      this.ferisci(j, danno, 0, 0, 0);
      this.effetti.scoppio(o.x[j], o.y[j] - o.raggio[j]);
    }
  }

  /** Il nemico sullo schermo con più salute, saltando i primi «salta» già scelti. */
  private piuForte(salta: number): number {
    const o = this.orda;
    let migliore = -1;
    let massima = 0;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= massima || Math.abs(o.x[j] - this.px) > this.mezzaL || Math.abs(o.y[j] - this.py) > this.mezzaA) continue;
      let preso = false;
      for (let k = 0; k < salta; k++) if (this.scelti[k] === j) preso = true;
      if (preso) continue;
      massima = o.salute[j];
      migliore = j;
    }
    return migliore;
  }

  // ——— Lapide ———
  private lapideCade(x: number, y: number, raggio: number, danno: number): void {
    if (this.lapidi >= MAX_LAPIDI) return;
    const i = this.lapidi++;
    this.lpX[i] = x;
    this.lpY[i] = y;
    this.lpR[i] = raggio;
    this.lpDanno[i] = danno;
    this.lpVita[i] = LAPIDE.caduta + LAPIDE.resta;
    this.lpCaduta[i] = 1;
    this.lpSprite[i].setVisible(true);
  }

  private aggiornaLapidi(dt: number): void {
    for (let i = this.lapidi - 1; i >= 0; i--) {
      this.lpVita[i] -= dt;
      if (this.lpCaduta[i] && this.lpVita[i] <= LAPIDE.resta) {
        this.lpCaduta[i] = 0;
        if (this.lpDanno[i]) this.prepara(0, this.lpX[i], this.lpY[i], this.lpR[i], this.lpDanno[i], 0);
        if (this.lpDanno[i]) {
          this.cAff = TERRA;
          this.cProb = RUOLI.lapideSeppellisce;
          this.orda.griglia.nelRaggio(this.cx, this.cy, this.lpR[i] + 40, this.visitaColpo);
          this.rompiForma();
          this.effetto(LAPIDE.effetto, this.cx, this.cy, this.lpR[i], PROFONDITA.aTerra, EFFETTI.impattoPala);
          if (this.toccati) this.effetti.scuoti(EFFETTI.scossaPala.forza, EFFETTI.scossaPala.durata);
        }
      }
      if (this.lpVita[i] > 0) continue;
      const u = --this.lapidi, s = this.lpSprite[i];
      s.setVisible(false);
      for (const a of this.lpCampi) a[i] = a[u];
      this.lpCaduta[i] = this.lpCaduta[u];
      this.lpSprite[i] = this.lpSprite[u];
      this.lpSprite[u] = s;
    }
  }

  // ——— Rosario spezzato ———
  private lanciaGrano(j: number, danno: number, rimbalzi: number): void {
    if (this.grani >= MAX_GRANI) return;
    const i = this.grani++;
    this.grColpiti.fill(0, i * MAX_RIMBALZI, (i + 1) * MAX_RIMBALZI);
    this.grResto[i] = Math.min(rimbalzi, MAX_RIMBALZI);
    this.grDanno[i] = danno;
    this.grSprite[i].setVisible(true);
    this.rimbalza(i, j);
  }

  /** Il grano i colpisce il nemico j e ci si posa sopra. */
  private rimbalza(i: number, j: number): void {
    const o = this.orda;
    this.grX[i] = o.x[j];
    this.grY[i] = o.y[j] - o.raggio[j];
    this.grColpiti[i * MAX_RIMBALZI + this.grResto[i] - 1] = o.id[j];
    this.grResto[i]--;
    this.grTempo[i] = ROSARIO_SPEZZATO.intervallo;
    this.ferisci(j, this.grDanno[i], 0, 0, 0, OMBRA, RUOLI.rosarioMaledice);
  }

  private aggiornaGrani(dt: number): void {
    for (let i = this.grani - 1; i >= 0; i--) {
      this.grTempo[i] -= dt;
      if (this.grTempo[i] > 0) continue;
      this.rompibili?.colpitoDa(this.grX[i], this.grY[i], ROMPIBILI.raggio);
      let j = -1;
      if (this.grResto[i] > 0) {
        this.cProiettile = i;
        this.cMigliore = -1;
        this.cDistanza = ROSARIO_SPEZZATO.salto * ROSARIO_SPEZZATO.salto;
        this.cx = this.grX[i];
        this.cy = this.grY[i];
        this.orda.griglia.nelRaggio(this.cx, this.cy, ROSARIO_SPEZZATO.salto, this.visitaGrano);
        j = this.cMigliore;
      }
      if (j >= 0) {
        this.rimbalza(i, j);
        continue;
      }
      const u = --this.grani, s = this.grSprite[i];
      s.setVisible(false);
      this.grX[i] = this.grX[u];
      this.grY[i] = this.grY[u];
      this.grResto[i] = this.grResto[u];
      this.grTempo[i] = this.grTempo[u];
      this.grDanno[i] = this.grDanno[u];
      this.grColpiti.copyWithin(i * MAX_RIMBALZI, u * MAX_RIMBALZI, (u + 1) * MAX_RIMBALZI);
      this.grSprite[i] = this.grSprite[u];
      this.grSprite[u] = s;
    }
  }

  private vicinoGrano(j: number): void {
    const o = this.orda, i = this.cProiettile;
    if (o.salute[j] <= 0) return;
    for (let k = 0; k < MAX_RIMBALZI; k++) if (this.grColpiti[i * MAX_RIMBALZI + k] === o.id[j]) return;
    const ex = o.x[j] - this.cx, ey = o.y[j] - o.raggio[j] - this.cy, d2 = ex * ex + ey * ey;
    if (d2 < this.cDistanza) {
      this.cDistanza = d2;
      this.cMigliore = j;
    }
  }

  // ——— Corvo ———
  private aggiornaCorvi(dt: number): void {
    if (!this.corvi) return;
    this.angoloCorvi = (this.angoloCorvi + CORVO.giri * Math.PI * 2 * dt) % (Math.PI * 2);
    for (let k = 0; k < this.corvi; k++) {
      let mx = this.cvMX[k], my = this.cvMY[k];
      if (this.cvMira[k] > 0) this.cvMira[k] -= dt;
      else {
        const ang = this.angoloCorvi + (k / this.corvi) * Math.PI * 2;
        mx = this.px + Math.cos(ang) * CORVO.orbita;
        my = this.py + Math.sin(ang) * CORVO.orbita;
      }
      const dx = mx - this.cvX[k], dy = my - this.cvY[k], d = Math.hypot(dx, dy) || 1, passo = Math.min(d, CORVO.velocita * dt);
      this.cvX[k] += (dx / d) * passo;
      this.cvY[k] += (dy / d) * passo;
      if (Math.abs(dx) > 1) this.cvSprite[k].setFlipX(dx < 0);
      this.cvSprite[k].setVisible(true);
    }
  }

  private danno(base: number): number {
    const d = base * (1 + this.bonus.danno) * (COLPI.casoMinimo + this.caso.numero() * (COLPI.casoMassimo - COLPI.casoMinimo));
    this.critico = this.bonus.critico > 0 && this.casoStati.numero() < this.bonus.critico;
    return this.critico ? d * MOLTIPLICA_CRITICO : d;
  }

  /** Colpisce il nemico j, gli lascia lo stato dell'affinità aff e mostra il numero del danno; lampeggia = false per le zone e le aure, reazione = id della reazione a cui appartiene il colpo. */
  private ferisci(j: number, base: number, respinta: number, dx: number, dy: number, aff = 0, probabilita: number = STATI.probabilita, lampeggia = true, reazione = 0): void {
    const o = this.orda;
    const danno = this.danno(base);
    o.colpisci(j, danno, respinta, dx, dy, lampeggia);
    const r = aff && this.casoStati.numero() < probabilita ? o.marca(j, aff) : 0;
    if (r) this.accoda(r, j, 0);
    this.dannoTotale += danno;
    suona('colpo');
    if (reazione) this.effetti.sommaReazione(reazione, this.cRX, this.cRY, danno, this.cRAperta);
    else if (o.elite[j] || o.tipo[j] === ID_MIETITORE) this.effetti.sommaDanno(o.id[j], o.x[j], o.y[j] - o.altezza(j), danno);
    else this.effetti.numero(o.x[j], o.y[j] - 2 * o.raggio[j], danno, this.critico);
  }

  // ——— Colpi istantanei ———
  private arco(dx: number, dy: number, raggio: number, ampiezza: number, danno: number, probabilita: number = STATI.probabilita): void {
    this.prepara(1, this.px, this.py, raggio, danno, LANTERNA.respinta);
    this.cDX = dx;
    this.cDY = dy;
    this.cCos = Math.cos(((ampiezza / 2) * Math.PI) / 180);
    this.cAff = LUCE;
    this.cProb = probabilita;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.rompiForma();
    this.effetti.arco(this.px, this.py, Math.atan2(dy, dx), raggio, ampiezza);
  }

  /** Mette in coda una reazione (o un'esplosione) sul nemico j, da eseguire alla fine del passo. */
  private accoda(tipo: number, j: number, danno: number): void {
    if (this.code >= MAX_CODA) return;
    const k = this.code++;
    const o = this.orda;
    this.qTipo[k] = tipo;
    this.qJ[k] = j;
    this.qX[k] = o.x[j];
    this.qY[k] = o.y[j] - o.raggio[j];
    // l'Eclissi toglie una parte della salute massima, con un tetto (il Mietitore subisce sempre il tetto)
    const eclissi = o.tipo[j] === ID_MIETITORE ? REAZIONI.eclissi.tetto : Math.min(REAZIONI.eclissi.tetto, REAZIONI.eclissi.parte * o.saluteMassima[j]);
    this.qDanno[k] = tipo === ECLISSI ? eclissi : danno;
  }

  /** Esegue le reazioni e le esplosioni in coda (i nemici non hanno ancora cambiato posto: i morti si tolgono dopo). */
  private eseguiCoda(): void {
    const o = this.orda;
    for (let k = 0; k < this.code; k++) {
      const x = this.qX[k], y = this.qY[k], j = this.qJ[k];
      const t = this.qTipo[k];
      if (t === ESPLOSIONE || t === ECLISSI) {
        const r = t === ECLISSI ? REAZIONI.eclissi.raggio : RUOLI.esplosioneBastone.raggio;
        this.prepara(0, x, y, r, this.qDanno[k], 0);
        this.cReazione = t === ECLISSI ? this.prossimaIdReazione++ : 0;
        this.cRX = x;
        this.cRY = y;
        this.cRAperta = 0;
        if (t === ESPLOSIONE) o.segno[j] = this.colpo; // il dardo l'ha già colpito
        this.orda.griglia.nelRaggio(x, y, r + 40, this.visitaColpo);
        this.rompiForma();
        if (t === ECLISSI) this.eclissi++;
        if (t === ECLISSI) this.effetti.reazione(x, y, r, REAZIONI.eclissi.colore, REAZIONI.eclissi.bordo, REAZIONI.durataEffetto);
      } else if (t === ESORCISMO) {
        const e = REAZIONI.esorcismo, id = this.prossimaIdReazione++;
        for (let f = 0; f < e.fiammelle; f++) {
          const prima = this.proiettili;
          this.lancia(FUOCO_FATUO.effetto, -1, e.velocita, e.vita, e.danno, 1, FUOCO_FATUO.raggio, FUOCO_FATUO.sterzo, FUOCO_FATUO.portata, false, (f / e.fiammelle) * Math.PI * 2, 0, x, y);
          if (this.proiettili > prima) {
            this.prReazione[prima] = id;
            this.prOX[prima] = x;
            this.prOY[prima] = y;
          }
        }
        this.effetti.reazione(x, y, e.raggio, e.colore, e.bordo, REAZIONI.durataEffetto);
      } else if (t === RIVELAZIONE) {
        this.effetti.reazione(x, y, REAZIONI.rivelazione.raggio, REAZIONI.rivelazione.colore, REAZIONI.rivelazione.bordo, REAZIONI.durataEffetto);
      } else if (t === INTERRAMENTO) {
        this.effetti.reazione(x, y, REAZIONI.interramento.raggio, REAZIONI.interramento.colore, REAZIONI.interramento.bordo, REAZIONI.durataEffetto);
      }
      if (t !== ESPLOSIONE) {
        this.reazioni++;
        this.effetti.etichetta(t, x, y - REAZIONI.etichetta.sopra);
      }
    }
    this.code = 0;
  }

  private impatto(dx: number, dy: number, raggio: number, danno: number): void {
    this.prepara(0, this.px + dx * PALA.distanza, this.py + dy * PALA.distanza, raggio, danno, PALA.respinta);
    this.cAff = TERRA;
    if (this.unite.pala) {
      this.cFerma = U.vanga.fermo;
      this.lapideCade(this.cx, this.cy, raggio, 0); // solo da vedere: il colpo è già questo
    }
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.rompiForma();
    this.effetto(PALA.effetto, this.cx, this.cy, raggio, PROFONDITA.aTerra, EFFETTI.impattoPala);
    if (this.toccati) this.effetti.scuoti(EFFETTI.scossaPala.forza, EFFETTI.scossaPala.durata);
  }

  private rintocco(raggio: number, danno: number, ferma = 0): void {
    this.prepara(0, this.px, this.py, raggio, danno, CAMPANA.respinta);
    this.cAff = SACRO;
    this.cFerma = ferma;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.rompiForma();
    this.effetto(CAMPANA.effetto, this.px, this.py, raggio, PROFONDITA.aTerra, CAMPANA.durataEffetto);
    suona('campana');
  }

  /** Fendente dritto nella direzione (dx, dy), lunga 1: un rettangolo che parte dal personaggio. */
  private fendente(dx: number, dy: number, lunghezza: number, danno: number, ox = this.px, oy = this.py): void {
    const h = LAMA_DI_LUCE.altezza / 2;
    this.prepara(2, ox + (dx * lunghezza) / 2, oy + (dy * lunghezza) / 2, Math.hypot(lunghezza / 2, h), danno, LAMA_DI_LUCE.respinta);
    this.cAff = LUCE;
    this.cX0 = ox; // inizio del fendente
    this.cY0 = oy;
    this.cX1 = lunghezza;
    this.cY1 = h;
    this.cDX = dx;
    this.cDY = dy;
    this.orda.griglia.nelRaggio(this.cx, this.cy, this.cr + 40, this.visitaColpo);
    this.rompiForma();
    // il fendente della v0 parte dal bordo sinistro della tela e va a destra: si allunga e si gira nella direzione;
    // verso sinistra si capovolge anche in verticale, così il disegno non resta sottosopra
    const s = this.effetto(LAMA_DI_LUCE.effetto, ox, oy, 0, PROFONDITA.aTerra, LAMA_DI_LUCE.durataEffetto);
    if (!s) return;
    const m = this.misureLama();
    s.setOrigin(m.x / m.l, 0.5).setScale(lunghezza / m.lunghezza, LAMA_DI_LUCE.altezza / m.altezza).setRotation(Math.atan2(dy, dx)).setFlipY(dx < 0);
  }

  private misureLama(): { x: number; l: number; lunghezza: number; altezza: number } {
    if (!this.lamaMisure) {
      const dati = this.scena.cache.json.get(LAMA_DI_LUCE.effetto) as { frames: { spriteSourceSize: { x: number; w: number; h: number }; sourceSize: { w: number } }[] };
      let x = Infinity;
      let fine = 0;
      let alt = 1;
      for (const f of dati.frames) {
        x = Math.min(x, f.spriteSourceSize.x);
        fine = Math.max(fine, f.spriteSourceSize.x + f.spriteSourceSize.w);
        alt = Math.max(alt, f.spriteSourceSize.h);
      }
      this.lamaMisure = { x, l: dati.frames[0].sourceSize.w, lunghezza: fine - x, altezza: alt };
    }
    return this.lamaMisure;
  }

  private prepara(forma: number, x: number, y: number, r: number, danno: number, respinta: number): void {
    this.cForma = forma;
    this.cx = x;
    this.cy = y;
    this.cr = r;
    this.cDanno = danno;
    this.cRespinta = respinta;
    this.cAff = 0;
    this.cProb = STATI.probabilita;
    this.cFerma = 0;
    this.cLampo = true;
    this.cReazione = 0;
    this.colpo++;
    this.toccati = 0;
  }

  /** Il nemico j è dentro la forma del colpo in corso? Se sì, lo colpisce. */
  private tocca(j: number): void {
    const o = this.orda;
    if (o.segno[j] === this.colpo || o.salute[j] <= 0) return;
    const ex = o.x[j];
    const ey = o.y[j] - o.raggio[j];
    const rx = ex - this.cx;
    const ry = ey - this.cy;
    let spintaX = 0;
    let spintaY = 0;
    if (this.cForma === 2) {
      // rettangolo girato: lungo la direzione da 0 a cX1, di lato al massimo cY1
      const r = o.raggio[j];
      const lx = ex - this.cX0, ly = ey - this.cY0;
      const lungo = lx * this.cDX + ly * this.cDY;
      const largo = Math.abs(-lx * this.cDY + ly * this.cDX);
      if (lungo < -r || lungo > this.cX1 + r || largo > this.cY1 + r) return;
      spintaX = this.cDX;
      spintaY = this.cDY;
    } else {
      const r = this.cr + o.raggio[j];
      const d2 = rx * rx + ry * ry;
      if (d2 > r * r) return;
      const d = Math.sqrt(d2) || 1;
      if (this.cForma === 1 && (rx * this.cDX + ry * this.cDY) / d < this.cCos && d > o.raggio[j]) return;
      spintaX = rx / d;
      spintaY = ry / d;
    }
    o.segno[j] = this.colpo;
    this.toccati++;
    const aff = this.cAff, ferma = this.cFerma;
    this.ferisci(j, this.cDanno, this.cRespinta, spintaX, spintaY, aff, this.cProb, this.cLampo, this.cReazione);
    if (ferma) o.ferma(j, ferma);
  }

  /** Rompe gli oggetti dentro la forma del colpo in corso: stessa geometria di tocca. */
  private rompiForma(): void {
    const R = this.rompibili;
    if (!R) return;
    const r = ROMPIBILI.raggio;
    for (let i = 0; i < R.capienza; i++) {
      if (!R.intero(i)) continue;
      const ex = R.x[i], ey = R.y[i] - ROMPIBILI.centro;
      if (this.cForma === 2) {
        const lx = ex - this.cX0, ly = ey - this.cY0;
        const lungo = lx * this.cDX + ly * this.cDY;
        if (lungo < -r || lungo > this.cX1 + r || Math.abs(-lx * this.cDY + ly * this.cDX) > this.cY1 + r) continue;
      } else {
        const rx = ex - this.cx, ry = ey - this.cy, d = Math.hypot(rx, ry) || 1;
        if (d > this.cr + r || (this.cForma === 1 && (rx * this.cDX + ry * this.cDY) / d < this.cCos && d > r)) continue;
      }
      R.rompi(i);
    }
  }

  /** Il fuoco di una chiazza ferisce il nemico j, come una zona. */
  brucia(j: number, danno: number): void {
    this.ferisci(j, danno, 0, 0, 0, 0, 0, false);
  }

  /** Numero nuovo per segnare i nemici già toccati (lo usano le chiazze). */
  nuovoColpo(): number {
    return ++this.colpo;
  }

  private ritarda(arma: Arma, tempo: number, a: number, b: number, c: number): void {
    if (this.ritardati >= MAX_RITARDATI) return;
    const i = this.ritardati++;
    this.rtTempo[i] = tempo;
    this.rtArma[i] = arma;
    this.rtA[i] = a;
    this.rtB[i] = b;
    this.rtC[i] = c;
  }

  private aggiornaRitardati(dt: number): void {
    for (let i = this.ritardati - 1; i >= 0; i--) {
      this.rtTempo[i] -= dt;
      if (this.rtTempo[i] > 0) continue;
      const arma = this.rtArma[i];
      if (arma === PALA) this.impatto(Math.cos(this.rtC[i]), Math.sin(this.rtC[i]), this.rtA[i], this.rtB[i]);
      else if (arma === CAMPANA) this.rintocco(this.rtA[i], this.rtB[i], Math.max(this.rtC[i] ? RUOLI.campanaFermo : 0, this.unite.campana ? U.campana.fermo : 0));
      else this.fendente(Math.cos(this.rtC[i]), Math.sin(this.rtC[i]), this.rtA[i], this.rtB[i]);
      const u = --this.ritardati;
      this.rtTempo[i] = this.rtTempo[u];
      this.rtArma[i] = this.rtArma[u];
      this.rtA[i] = this.rtA[u];
      this.rtB[i] = this.rtB[u];
      this.rtC[i] = this.rtC[u];
    }
  }

  // ——— Zone ———
  private zona(chiave: string, x: number, y: number, raggio: number, danno: number, durata: number, intervallo: number,
    rallenta: number, attira: number, cura: number, segue: boolean, ciclo: boolean, tipo = 0, aff = 0): void {
    if (this.zone >= MAX_ZONE) return;
    const i = this.zone++;
    this.zX[i] = x;
    this.zY[i] = y;
    this.zR[i] = raggio;
    this.zDanno[i] = danno;
    this.zVita[i] = durata * (1 + this.bonus.durata);
    this.zIntervallo[i] = intervallo;
    this.zTick[i] = 0;
    this.zRallenta[i] = rallenta;
    this.zAttira[i] = attira;
    this.zCura[i] = cura;
    this.zSegue[i] = segue ? 1 : 0;
    this.zTipo[i] = tipo;
    this.zAff[i] = aff;
    const s = this.zSprite[i];
    if (chiave === SPRITE_SCIA) {
      s.stop();
      s.setTexture(chiave).setScale(2).setVisible(true);
      return;
    }
    s.setTexture(chiave).setScale(raggio / this.raggioDi(chiave)).setVisible(true);
    s.play(ciclo ? { key: `${chiave}:idle`, repeat: -1 } : { key: `${chiave}:idle`, duration: durata * 1000, repeat: 0 });
  }

  private aggiornaZone(dt: number): void {
    this.cDt = dt;
    for (let i = this.zone - 1; i >= 0; i--) {
      this.zVita[i] -= dt;
      if (this.zVita[i] <= 0) {
        this.togliZona(i);
        continue;
      }
      if (this.zSegue[i]) {
        this.zX[i] = this.px;
        this.zY[i] = this.py;
      }
      this.cZona = i;
      if (this.zAttira[i]) this.orda.griglia.nelRaggio(this.zX[i], this.zY[i], this.zR[i] + 40, this.visitaAttira);
      this.zTick[i] -= dt;
      if (this.zTick[i] > 0) continue;
      this.zTick[i] += this.zIntervallo[i];
      this.colpo++;
      this.orda.griglia.nelRaggio(this.zX[i], this.zY[i], this.zR[i] + 40, this.visitaZona);
      this.rompibili?.colpitoDa(this.zX[i], this.zY[i], this.zR[i]);
    }
  }

  private dentroZona(j: number): boolean {
    const o = this.orda;
    const i = this.cZona;
    const ex = o.x[j] - this.zX[i];
    const ey = o.y[j] - o.raggio[j] - this.zY[i];
    const r = this.zR[i] + o.raggio[j];
    return ex * ex + ey * ey <= r * r;
  }

  private toccaZona(j: number): void {
    const o = this.orda;
    if (o.segno[j] === this.colpo || o.salute[j] <= 0 || !this.dentroZona(j)) return;
    const i = this.cZona;
    if (COLPI.zoneNonCumulative && this.zTipo[i]) {
      // già ferito da un'altra nube (o pozza) in questo intervallo: questa non si somma
      const pausa = this.zTipo[i] === NUBE ? o.pausaNube : o.pausaPozza;
      if (pausa[j] > 0) return;
      pausa[j] = this.zIntervallo[i] - 0.01;
    }
    o.segno[j] = this.colpo;
    this.ferisci(j, this.zDanno[i], 0, 0, 0, this.zAff[i], STATI.probabilitaZone, false);
    if (this.zTipo[i] === POZZA && this.unite.acquaSanta && o.salute[j] <= 0 && ++this.uccisiPozze >= U.acquasantiera.uccisioni) {
      this.uccisiPozze = 0;
      this.sorsiGuadagnati++;
    }
    if (this.zRallenta[i]) o.rallenta(j, this.zRallenta[i], this.zIntervallo[i] + 0.05);
  }

  private attiraZona(j: number): void {
    if (!this.dentroZona(j)) return;
    const i = this.cZona;
    this.orda.attira(j, this.zX[i], this.zY[i] + this.orda.raggio[j], this.zAttira[i] * this.cDt);
  }

  private togliZona(i: number): void {
    const u = --this.zone;
    const s = this.zSprite[i];
    s.stop();
    s.setVisible(false);
    if (i === u) return;
    for (const a of this.zCampi) a[i] = a[u];
    this.zSegue[i] = this.zSegue[u];
    this.zTipo[i] = this.zTipo[u];
    this.zAff[i] = this.zAff[u];
    this.zSprite[i] = this.zSprite[u];
    this.zSprite[u] = s;
  }

  // ——— Falci ———
  private aggiornaFalci(dt: number): void {
    let n = 0;
    const livello = this.livello(FALCE);
    if (livello) {
      const l = FALCE.livelli[livello - 1];
      n = Math.min(MAX_LAME, l.quantita + this.bonus.quantita);
      const r = l.raggio * (1 + this.bonus.area);
      this.angoloFalci = (this.angoloFalci + l.giri * Math.PI * 2 * dt) % (Math.PI * 2);
      this.cDanno = l.danno;
      this.cr = FALCE.raggioLama * (1 + this.falceCresce);
      for (let k = 0; k < n; k++) {
        const ang = this.angoloFalci + (k / n) * Math.PI * 2;
        this.cx = this.px + Math.cos(ang) * r;
        this.cy = this.py + Math.sin(ang) * r;
        this.orda.griglia.vicini(this.cx, this.cy, this.visitaFalce);
        this.rompibili?.colpitoDa(this.cx, this.cy, this.cr);
        this.lame[k].setPosition(Math.round(this.cx), Math.round(this.cy)).setRotation(ang * 3).setScale(this.scalaLama * (1 + this.falceCresce)).setVisible(true);
      }
    }
    for (let k = n; k < MAX_LAME; k++) this.lame[k].setVisible(false);
  }

  private toccaFalce(j: number): void {
    const o = this.orda;
    if (o.pausaFalce[j] > 0 || o.salute[j] <= 0) return;
    const rx = o.x[j] - this.cx;
    const ry = o.y[j] - o.raggio[j] - this.cy;
    const r = this.cr + o.raggio[j];
    if (rx * rx + ry * ry > r * r) return;
    o.pausaFalce[j] = FALCE.pausa;
    const ex = o.x[j] - this.px;
    const ey = o.y[j] - o.raggio[j] - this.py;
    const d = Math.hypot(ex, ey) || 1;
    this.ferisci(j, this.cDanno, FALCE.respinta, ex / d, ey / d, OMBRA);
    if (this.unite.falce && o.salute[j] > 0 && !o.elite[j] && o.tipo[j] !== ID_MIETITORE && o.salute[j] < U.falce.sotto * o.saluteMassima[j]) o.colpisci(j, o.salute[j], 0, 0, 0);
    if (o.salute[j] <= 0) {
      // ogni uccisione allunga la lama per qualche secondo
      const c = RUOLI.falceCrescita;
      this.falceCresce = Math.min(c.massimo, this.falceCresce + c.perUccisione);
      this.falceDura = c.durata;
    }
  }

  // ——— Proiettili ———
  /** Un proiettile verso il nemico j; con j = −1 parte nella direzione angolo (solo per quelli che inseguono). */
  private lancia(chiave: string, j: number, velocita: number, vita: number, danno: number, trapassa: number, raggio: number,
    sterzo: number, portata: number, esplode: boolean, angolo: number, aff = 0, ox = this.px, oy = this.py): void {
    if (this.proiettili >= MAX_PROIETTILI) return;
    let ang = angolo;
    if (j >= 0) {
      const o = this.orda;
      ang = Math.atan2(o.y[j] - o.raggio[j] - oy, o.x[j] - ox);
    } else if (!sterzo) {
      return;
    }
    const i = this.proiettili++;
    suona('sparo');
    this.prX[i] = ox;
    this.prY[i] = oy;
    this.prAff[i] = aff;
    this.prFuoco[i] = (CHIAZZE.accendono as readonly string[]).includes(chiave) ? 1 : 0;
    this.prVX[i] = Math.cos(ang) * velocita;
    this.prVY[i] = Math.sin(ang) * velocita;
    this.prVel[i] = velocita;
    this.prVita[i] = vita;
    this.prDanno[i] = danno;
    this.prRaggio[i] = raggio;
    this.prSterzo[i] = sterzo;
    this.prPortata[i] = portata;
    this.prEsplode[i] = esplode ? 1 : 0;
    this.prUnione[i] = 0;
    this.prReazione[i] = 0;
    this.prResto[i] = trapassa;
    this.prColpiti.fill(0, i * 4, i * 4 + 4);
    const v0 = PROIETTILI_V0[chiave];
    const s = this.prSprite[i];
    s.setTexture(chiave, v0 ? v0.fotogramma : '0').setScale(ingrandimento(this.scena, chiave)).setVisible(true);
    if (v0) s.setOrigin(v0.x / 128, v0.y / 128);
    else s.setOrigin(0.5);
  }

  private aggiornaRaffica(dt: number): void {
    if (this.raffica <= 0) return;
    this.attesaRaffica -= dt;
    if (this.attesaRaffica > 0) return;
    this.attesaRaffica += BASTONE.intervallo;
    this.raffica--;
    const j = this.piuVicino(BASTONE.portata, 0);
    if (j >= 0) this.lancia(BASTONE.effetto, j, BASTONE.velocita, BASTONE.vita, this.dannoRaffica, this.trapassaRaffica, BASTONE.raggio, 0, 0, true, 0, OMBRA);
  }

  /** Il nemico più vicino al personaggio entro portata, saltando i primi «salta» già scelti dalla stessa raffica. */
  private piuVicino(portata: number, salta: number): number {
    const o = this.orda;
    let migliore = -1;
    let d2min = portata * portata;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= 0) continue;
      let preso = false;
      for (let k = 0; k < salta; k++) if (this.scelti[k] === j) preso = true;
      if (preso) continue;
      const ex = o.x[j] - this.px;
      const ey = o.y[j] - o.raggio[j] - this.py;
      const d2 = ex * ex + ey * ey;
      if (d2 < d2min) {
        d2min = d2;
        migliore = j;
      }
    }
    return migliore;
  }

  /** Un nemico a caso tra quelli sullo schermo (−1 se non ce ne sono). */
  private nemicoVisibile(): number {
    const o = this.orda;
    let visti = 0;
    let scelto = -1;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= 0 || Math.abs(o.x[j] - this.px) > this.mezzaL || Math.abs(o.y[j] - this.py) > this.mezzaA) continue;
      visti++;
      if (this.caso.numero() * visti < 1) scelto = j; // ognuno ha la stessa probabilità, senza fare elenchi
    }
    return scelto;
  }

  private aggiornaProiettili(dt: number): void {
    const scia = (this.attesaScia -= dt) <= 0;
    if (scia) this.attesaScia += U.candelabro.ogni;
    for (let i = this.proiettili - 1; i >= 0; i--) {
      this.prVita[i] -= dt;
      if (this.prSterzo[i]) this.sterza(i, dt);
      this.prX[i] += this.prVX[i] * dt;
      this.prY[i] += this.prVY[i] * dt;
      if (this.prUnione[i] === RACCOGLIE) this.anime?.attiraVicino(this.prX[i], this.prY[i], U.fuochi.raggio);
      else if (scia && this.prUnione[i] === SCIA) {
        const c = U.candelabro;
        this.zona(SPRITE_SCIA, this.prX[i], this.prY[i], c.raggio, this.prDanno[i] * c.danno, c.durata, c.intervallo, 0, 0, 0, false, false, 0, LUCE);
      }
      if (this.prVita[i] > 0) {
        this.cProiettile = i;
        this.cx = this.prX[i];
        this.cy = this.prY[i];
        this.orda.griglia.vicini(this.cx, this.cy, this.visitaProiettile);
        this.rompibili?.colpitoDa(this.cx, this.cy, this.prRaggio[i]);
        if (this.prFuoco[i]) this.chiazze?.accendi(this.cx, this.cy);
      }
      if (this.prVita[i] <= 0 || this.prResto[i] === 0) this.togliProiettile(i);
    }
  }

  /** Il fuoco fatuo gira a poco a poco verso il nemico più vicino a lui. */
  private sterza(i: number, dt: number): void {
    const cerca = Math.min(this.prPortata[i], 300);
    this.cMigliore = -1;
    this.cDistanza = cerca * cerca;
    this.cx = this.prX[i];
    this.cy = this.prY[i];
    this.orda.griglia.nelRaggio(this.cx, this.cy, cerca, this.visitaVicino);
    const j = this.cMigliore;
    if (j < 0) return;
    const o = this.orda;
    const voluto = Math.atan2(o.y[j] - o.raggio[j] - this.prY[i], o.x[j] - this.prX[i]);
    const attuale = Math.atan2(this.prVY[i], this.prVX[i]);
    let diff = voluto - attuale;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const max = this.prSterzo[i] * dt;
    const nuovo = attuale + Math.max(-max, Math.min(max, diff));
    this.prVX[i] = Math.cos(nuovo) * this.prVel[i];
    this.prVY[i] = Math.sin(nuovo) * this.prVel[i];
  }

  private vicino(j: number): void {
    const o = this.orda;
    if (o.salute[j] <= 0) return;
    const ex = o.x[j] - this.cx;
    const ey = o.y[j] - o.raggio[j] - this.cy;
    // élite e Mietitore sembrano più vicini: il fuoco fatuo li insegue per primi
    const d2 = (ex * ex + ey * ey) * (o.elite[j] || o.tipo[j] === ID_MIETITORE ? RUOLI.fuocoFatuoPreda : 1);
    if (d2 < this.cDistanza) {
      this.cDistanza = d2;
      this.cMigliore = j;
    }
  }

  private toccaProiettile(j: number): void {
    const i = this.cProiettile;
    const o = this.orda;
    if (this.prResto[i] === 0 || o.salute[j] <= 0) return;
    for (let k = 0; k < 4; k++) if (this.prColpiti[i * 4 + k] === o.id[j]) return;
    const ex = o.x[j] - this.cx;
    const ey = o.y[j] - o.raggio[j] - this.cy;
    const r = this.prRaggio[i] + o.raggio[j];
    if (ex * ex + ey * ey > r * r) return;
    for (let k = 0; k < 4; k++) {
      if (this.prColpiti[i * 4 + k] === 0) {
        this.prColpiti[i * 4 + k] = o.id[j];
        break;
      }
    }
    this.prResto[i]--;
    const v = this.prVel[i] || 1;
    this.cRX = this.prOX[i];
    this.cRY = this.prOY[i];
    this.cRAperta = REAZIONI.esorcismo.vita;
    this.ferisci(j, this.prDanno[i], 0, this.prVX[i] / v, this.prVY[i] / v, this.prAff[i], STATI.probabilita, true, this.prReazione[i]);
    if (this.prEsplode[i]) {
      this.effetto(BASTONE.esplosione, this.cx, this.cy, 0, PROFONDITA.sopra, EFFETTI.esplosione);
      this.accoda(ESPLOSIONE, j, this.prDanno[i] * RUOLI.esplosioneBastone.danno); // ferisce anche intorno
    }
  }

  private togliProiettile(i: number): void {
    const r = this.prReazione[i];
    if (r) {
      // l'ultima fiammella di un Esorcismo chiude il suo numero
      let ultima = true;
      for (let k = 0; k < this.proiettili; k++) if (k !== i && this.prReazione[k] === r) ultima = false;
      if (ultima) this.effetti.chiudiReazione(r);
    }
    const u = --this.proiettili;
    const s = this.prSprite[i];
    s.setVisible(false);
    if (i === u) return;
    for (const a of this.prCampi) a[i] = a[u];
    this.prEsplode[i] = this.prEsplode[u];
    this.prAff[i] = this.prAff[u];
    this.prFuoco[i] = this.prFuoco[u];
    this.prResto[i] = this.prResto[u];
    this.prUnione[i] = this.prUnione[u];
    this.prReazione[i] = this.prReazione[u];
    this.prColpiti.copyWithin(i * 4, u * 4, u * 4 + 4);
    this.prSprite[i] = this.prSprite[u];
    this.prSprite[u] = s;
  }

  // ——— Effetti solo da vedere ———
  private raggioDi(chiave: string): number {
    let r = this.raggioEffetto.get(chiave);
    if (r === undefined) {
      r = raggioDisegnato(this.scena, chiave);
      this.raggioEffetto.set(chiave, r);
    }
    return r;
  }

  /** Mostra un effetto centrato in (x, y) per durata secondi; con raggio > 0 lo ingrandisce fino a coprire quell'area. */
  private effetto(chiave: string, x: number, y: number, raggio: number, profondita: number, durata: number): Phaser.GameObjects.Sprite | null {
    let i = 0;
    while (i < MAX_EFFETTI && this.vitaEffetto[i] > 0) i++;
    if (i === MAX_EFFETTI) return null;
    const anim = this.scena.anims.get(`${chiave}:idle`);
    if (!anim) return null;
    const s = this.sprEffetti[i];
    const k = raggio > 0 ? raggio / this.raggioDi(chiave) : ingrandimento(this.scena, chiave);
    s.setTexture(chiave).setOrigin(0.5).setFlipX(false).setRotation(0).setPosition(Math.round(x), Math.round(y)).setScale(k).setDepth(profondita).setVisible(true);
    s.play({ key: anim.key, repeat: 0, duration: durata * 1000 });
    this.vitaEffetto[i] = durata;
    return s;
  }
}
