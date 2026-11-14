/*
 * Armi, primo strato: lo stato di tutte le armi (pool di zone, proiettili, lapidi, sassi, grani, corvi, falci, effetti)
 * e ciò che hanno in comune: il danno, gli stati, la coda delle reazioni, la mira, la forma del colpo.
 * Gli strati sopra aggiungono le famiglie: armi-zone.ts, armi-proiettili.ts, armi-vicine.ts; armi.ts le dirige.
 * Proiettili, zone, coda ed effetti sono pool preparati all'inizio: niente allocazioni durante la partita.
 */
import Phaser from 'phaser';
import { ingrandimento, raggioDisegnato } from './asset';
import { Caso } from './caso';
import { ECLISSI, ESORCISMO, INTERRAMENTO, LUCE, OMBRA, RIVELAZIONE, SACRO, TERRA, type Orda } from './orda';
import { REAZIONI, RUOLI, STATI, STATI_CERTI } from '../data/stati';
import { INTERRUTTORI } from './interruttori';
import { NEMICI } from '../data/nemici';
import { suona } from './audio';
import { PROFONDITA, type Effetti } from './effetti';
import { PIXELFX } from '../data/effetti';
import { BASTONE, CANDELA, COLPI, CORVO, FALCE, FUOCO_FATUO, LAPIDE, PALA, TURIBOLO, type Arma } from '../data/armi';
import { MOLTIPLICA_CRITICO } from '../data/doni';
import { NUMERI_VOTI } from '../data/voti';
import type { Anime } from './anime';
import type { Chiazze } from './chiazze';
import type { Rompibili } from './rompibili';
import { ROMPIBILI } from '../data/rompibili';
import { creaSpriteOggetti, SPRITE_CORVO, SPRITE_GRANO, SPRITE_LAPIDE, SPRITE_SASSO, SPRITE_VELO } from './segnaposto-oggetti';

export const NUBE = 1;
export const POZZA = 2;
// prova pixelfx: le Pozze a sprite, una per raggio (Pixelfx_Pozza_089 …), con i nomi preparati prima della partita
export const CHIAVI_POZZA = PIXELFX.pozza.raggi.map((r) => `${PIXELFX.pozza.prefisso}${String(r).padStart(3, '0')}`);
export function chiavePozzaPixelfx(raggio: number): string {
  let m = 0;
  for (let k = 1; k < PIXELFX.pozza.raggi.length; k++) if (Math.abs(PIXELFX.pozza.raggi[k] - raggio) < Math.abs(PIXELFX.pozza.raggi[m] - raggio)) m = k;
  return CHIAVI_POZZA[m];
}
export const ESPLOSIONE = 5; // in coda insieme alle reazioni: l'esplosione del dardo del Bastone
export const MAX_CODA = 48;
export const CODICE_AFFINITA = { luce: LUCE, sacro: SACRO, ombra: OMBRA, terra: TERRA } as const;
export const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');
export const ID_BRUTO = NEMICI.findIndex((t) => t.id === 'bruto');
export const MAX_EFFETTI = 48;
export const MAX_ZONE = 64;
export const MAX_PROIETTILI = 96;
export const MAX_LAME = 8;
export const MAX_RITARDATI = 8;
export const MAX_LAPIDI = 12; // con la Lapide inchiodata le lapidi restano a terra più a lungo
export const MAX_GRANI = 6;
export const MAX_SASSI = 24; // sampietrini in volo insieme
export const MAX_RIMBALZI = 12; // un grano ricorda fino a tanti nemici già colpiti
export const MAX_CORVI = 5;
export const PASSI_STORIA = 64; // posizioni ricordate per la Lama dell'alba (più di un secondo)
export const SCIA = 1; // proiettile che lascia una scia (Candelabro funebre)
export const RACCOGLIE = 2; // proiettile che raccoglie le anime (Fuochi erranti)
// i proiettili della v0 attraversano la tela nei loro fotogrammi: si usa l'ultimo, con l'origine sulla punta
export const PROIETTILI_V0: Record<string, { fotogramma: string; x: number; y: number }> = {
  [BASTONE.effetto]: { fotogramma: '3', x: 88, y: 64 },
  [CANDELA.effetto]: { fotogramma: '3', x: 86, y: 64 },
  [FUOCO_FATUO.effetto]: { fotogramma: '3', x: 84, y: 60 },
};

/** Da dove viene il danno (per la simulazione): le armi, l'abilità, il Martire, il fuoco dell'olio e le reazioni che feriscono. */
export const FONTI = [
  'lanterna', 'pala', 'turibolo', 'bastone', 'candela', 'falce', 'campana', 'fuocoFatuo', 'acquaSanta', 'lamaDiLuce',
  'lapide', 'rosarioSpezzato', 'corvo', 'veloFunebre', 'sampietrini', 'abilita', 'martire', 'fuoco', 'eclissi', 'esorcismo', 'interramento',
] as const;
export const F = Object.fromEntries(FONTI.map((f, i) => [f, i])) as Record<(typeof FONTI)[number], number>;

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

export abstract class ArsenaleColpo {
  readonly possedute: Posseduta[] = [];

  /** L'arma posseduta con questo id (undefined se non c'è); senza creare niente, si chiama a ogni passo. */
  posseduta(id: Arma['id']): Posseduta | undefined {
    for (const p of this.possedute) if (p.arma.id === id) return p;
    return undefined;
  }
  dannoTotale = 0; // per il riepilogo di fine partita
  reazioni = 0; // reazioni tra stati in questa notte (per la simulazione)
  readonly reazioniPerTipo = new Uint32Array(5); // per la simulazione: indice = ECLISSI, RIVELAZIONE, ESORCISMO, INTERRAMENTO
  readonly dannoFonti = new Float64Array(FONTI.length); // per la simulazione: danno di ogni fonte (stessa misura di dannoTotale)
  readonly statiFonti = new Float64Array(FONTI.length); // …stati lasciati da ogni fonte
  readonly reazioniFonti = new Float64Array(FONTI.length); // …reazioni fatte partire dai colpi di ogni fonte
  protected fonte = 0; // la fonte del colpo in corso
  /**
   * Gioco a stanze, danno a intervallo: per ogni fonte, il danno massimo diviso il minimo del livello di adesso
   * (src/data/armi-stanze.ts). 0 = niente intervallo: il colpo varia di poco come nel survivor (COLPI.casoMinimo–casoMassimo).
   */
  readonly forbice = new Float32Array(FONTI.length);
  eclissi = 0; // Eclissi in questa notte (impresa del Rosario spezzato)
  sorsiGuadagnati = 0; // sorsi dell'Acquasantiera: li legge e li azzera la scena
  fiaschettaPiena = false; // la scena lo aggiorna a ogni passo: con la fiaschetta piena il sorso diventa una pozza che cura
  pozzeCuranti = 0; // pozze che hanno curato in questa notte (per la simulazione)
  curaPozzaOra = 0; // salute al secondo che danno le pozze adesso (l'ultimo cura(); per la simulazione)
  anime: Anime | null = null; // per i Fuochi erranti e il Corvo
  rompibili: Rompibili | null = null; // le armi li rompono con il loro impatto
  chiazze: Chiazze | null = null; // le armi di fuoco accendono l'olio
  protected unite: Partial<Record<Arma['id'], boolean>> = {};
  protected raffiche = 0; // raffiche del Bastone (Verga dei nomi)
  protected uccisiPozze = 0; // uccisioni nelle pozze (Acquasantiera)
  protected attesaSorso = 0; // secondi prima che l'Acquasantiera possa ridare un sorso
  protected attesaScia = 0;
  protected storiaX = new Float32Array(PASSI_STORIA); // dove era il personaggio (Lama dell'alba)
  protected storiaY = new Float32Array(PASSI_STORIA);
  protected storiaI = 0;
  protected attesa: number[] = [];
  protected scena: Phaser.Scene;
  protected orda: Orda;
  protected caso: Caso;
  protected casoStati = new Caso(29); // gli stati hanno il loro caso: così non cambiano carte, comparse e drop della notte
  protected bonus: Bonus;
  protected effetti: Effetti;
  protected colpo = 0; // numero del colpo in corso, per non toccare due volte lo stesso nemico
  protected toccati = 0; // nemici toccati dal colpo in corso
  // centro del personaggio, direzione in cui cammina, metà dello schermo
  protected px = 0;
  protected py = 0;
  protected dx = 1;
  protected dy = 0;
  protected mezzaL = 300;
  protected mezzaA = 300;

  // effetti solo da vedere disegnati da Edoardo (impatto, rintocco, fendente, esplosione)
  protected sprEffetti: Phaser.GameObjects.Sprite[] = [];
  protected vitaEffetto = new Float32Array(MAX_EFFETTI);
  protected raggioEffetto = new Map<string, number>();
  protected lamaMisure: { x: number; l: number; lunghezza: number; altezza: number } | null = null;

  // zone: nubi, pozze, abilità
  protected zone = 0;
  protected zX = new Float32Array(MAX_ZONE);
  protected zY = new Float32Array(MAX_ZONE);
  protected zR = new Float32Array(MAX_ZONE);
  protected zDanno = new Float32Array(MAX_ZONE);
  protected zVita = new Float32Array(MAX_ZONE);
  protected zIntervallo = new Float32Array(MAX_ZONE);
  protected zTick = new Float32Array(MAX_ZONE);
  protected zRallenta = new Float32Array(MAX_ZONE);
  protected zAttira = new Float32Array(MAX_ZONE);
  protected zCura = new Float32Array(MAX_ZONE);
  protected zCuraPozza = new Float32Array(MAX_ZONE); // Acquasantiera: secondi in cui la pozza cura ancora (0 = non cura)
  protected zSegue = new Uint8Array(MAX_ZONE);
  protected zTipo = new Uint8Array(MAX_ZONE); // 0 abilità, 1 nube, 2 pozza (nubi e pozze non si sommano: COLPI.zoneNonCumulative)
  protected zAff = new Uint8Array(MAX_ZONE); // affinità della zona
  protected zFonte = new Uint8Array(MAX_ZONE); // da dove viene (FONTI)
  protected zPrimo = new Uint8Array(MAX_ZONE); // 1 = abilità speciale che non ha ancora fatto il primo scatto (Stati certi: ignora la quiete)
  protected zCampi = [this.zX, this.zY, this.zR, this.zDanno, this.zVita, this.zIntervallo, this.zTick, this.zRallenta, this.zAttira, this.zCura, this.zCuraPozza];
  protected zSprite: Phaser.GameObjects.Sprite[] = [];

  // proiettili
  protected proiettili = 0;
  protected prX = new Float32Array(MAX_PROIETTILI);
  protected prY = new Float32Array(MAX_PROIETTILI);
  protected prVX = new Float32Array(MAX_PROIETTILI);
  protected prVY = new Float32Array(MAX_PROIETTILI);
  protected prVel = new Float32Array(MAX_PROIETTILI);
  protected prVita = new Float32Array(MAX_PROIETTILI);
  protected prDanno = new Float32Array(MAX_PROIETTILI);
  protected prRaggio = new Float32Array(MAX_PROIETTILI);
  protected prSterzo = new Float32Array(MAX_PROIETTILI); // 0 = dritto, altrimenti insegue
  protected prPortata = new Float32Array(MAX_PROIETTILI);
  protected prOX = new Float32Array(MAX_PROIETTILI); // fiammelle dell'Esorcismo: il punto della reazione
  protected prOY = new Float32Array(MAX_PROIETTILI);
  protected prCampi = [this.prX, this.prY, this.prVX, this.prVY, this.prVel, this.prVita, this.prDanno, this.prRaggio, this.prSterzo, this.prPortata, this.prOX, this.prOY];
  protected prReazione = new Uint32Array(MAX_PROIETTILI); // la reazione a cui appartiene la fiammella (0 = nessuna)
  protected prEsplode = new Uint8Array(MAX_PROIETTILI);
  protected prAff = new Uint8Array(MAX_PROIETTILI);
  protected prFonte = new Uint8Array(MAX_PROIETTILI); // da dove viene (FONTI)
  protected prFuoco = new Uint8Array(MAX_PROIETTILI); // accende l'olio
  protected prResto = new Uint8Array(MAX_PROIETTILI); // nemici che può ancora trapassare
  protected prUnione = new Uint8Array(MAX_PROIETTILI); // SCIA o RACCOGLIE
  protected prColpiti = new Uint32Array(MAX_PROIETTILI * 4); // id dei nemici già colpiti (fino a 4)
  protected prSprite: Phaser.GameObjects.Sprite[] = [];
  protected raffica = 0; // dardi del bastone ancora da sparare nella raffica in corso
  protected attesaRaffica = 0;
  protected dannoRaffica = 0;
  protected trapassaRaffica = 0;

  // lapidi che cadono
  protected lapidi = 0;
  protected lpX = new Float32Array(MAX_LAPIDI);
  protected lpY = new Float32Array(MAX_LAPIDI);
  protected lpR = new Float32Array(MAX_LAPIDI);
  protected lpDanno = new Float32Array(MAX_LAPIDI);
  protected lpVita = new Float32Array(MAX_LAPIDI);
  protected lpCaduta = new Uint8Array(MAX_LAPIDI); // 1 = deve ancora toccare terra
  protected lpResta = new Float32Array(MAX_LAPIDI); // secondi a terra (Lapide inchiodata: di più)
  protected lpChiodo = new Uint8Array(MAX_LAPIDI); // 1 = Lapide inchiodata: a terra seppellisce chi la tocca
  protected lpCampi = [this.lpX, this.lpY, this.lpR, this.lpDanno, this.lpVita, this.lpResta];
  protected visitaChiodo = (j: number): void => this.toccaLapide(j);
  protected lpSprite: Phaser.GameObjects.Sprite[] = [];

  // sampietrini in volo: da (x0, y0) a (x1, y1) in «durata» secondi, con un arco alto «alto»; poi colpiscono e rimbalzano
  protected sassi = 0;
  protected ssX0 = new Float32Array(MAX_SASSI);
  protected ssY0 = new Float32Array(MAX_SASSI);
  protected ssX1 = new Float32Array(MAX_SASSI);
  protected ssY1 = new Float32Array(MAX_SASSI);
  protected ssDX = new Float32Array(MAX_SASSI); // direzione del lancio, lunga 1: i rimbalzi vanno avanti di lì
  protected ssDY = new Float32Array(MAX_SASSI);
  protected ssT = new Float32Array(MAX_SASSI);
  protected ssDurata = new Float32Array(MAX_SASSI);
  protected ssAlto = new Float32Array(MAX_SASSI);
  protected ssDanno = new Float32Array(MAX_SASSI);
  protected ssR = new Float32Array(MAX_SASSI);
  protected ssResto = new Uint8Array(MAX_SASSI); // rimbalzi ancora da fare
  protected ssUnito = new Uint8Array(MAX_SASSI); // Selciato: 1 = il rimbalzo in più l'ha già avuto
  protected ssCampi = [this.ssX0, this.ssY0, this.ssX1, this.ssY1, this.ssDX, this.ssDY, this.ssT, this.ssDurata, this.ssAlto, this.ssDanno, this.ssR];
  protected ssSprite: Phaser.GameObjects.Sprite[] = [];
  protected trovatoFermo = false;
  protected visitaFermo = (j: number): void => {
    const o = this.orda, dx = o.x[j] - this.cx, dy = o.y[j] - o.raggio[j] - this.cy, r = this.cr + o.raggio[j];
    if (o.salute[j] > 0 && dx * dx + dy * dy <= r * r && o.fermoOra(j) && !o.fuoriSchermo(j)) this.trovatoFermo = true;
  };

  // grani del Rosario spezzato
  protected grani = 0;
  protected grX = new Float32Array(MAX_GRANI);
  protected grY = new Float32Array(MAX_GRANI);
  protected grResto = new Uint8Array(MAX_GRANI);
  protected grTempo = new Float32Array(MAX_GRANI);
  protected grDanno = new Float32Array(MAX_GRANI);
  protected grPieni = new Uint8Array(MAX_GRANI); // rimbalzi del livello (Rosario dei vespri: il grano che riparte ne ha altrettanti)
  protected grRipartito = new Uint8Array(MAX_GRANI); // ripartenze già usate da questo lancio (Rosario dei vespri)
  protected grColpiti = new Uint32Array(MAX_GRANI * MAX_RIMBALZI);
  protected grSprite: Phaser.GameObjects.Sprite[] = [];

  // corvi e aura del Velo
  protected corvi = 0;
  protected angoloCorvi = 0;
  protected cvX = new Float32Array(MAX_CORVI);
  protected cvY = new Float32Array(MAX_CORVI);
  protected cvMX = new Float32Array(MAX_CORVI); // dove sta beccando
  protected cvMY = new Float32Array(MAX_CORVI);
  protected cvMira = new Float32Array(MAX_CORVI); // secondi in cui resta sul bersaglio
  protected cvSprite: Phaser.GameObjects.Sprite[] = [];
  protected velo!: Phaser.GameObjects.Image;
  protected raggioVelo = 0;

  // falci
  protected angoloFalci = 0;
  protected falceCresce = 0; // lama più lunga dopo le uccisioni (0,1 = +10%)
  protected falceDura = 0; // secondi prima che torni normale
  protected scalaLama = 1;
  protected lame: Phaser.GameObjects.Sprite[] = [];

  // colpi ritardati: secondo colpo della pala e della campana, fendente alle spalle
  protected ritardati = 0;
  protected rtTempo = new Float32Array(MAX_RITARDATI);
  protected rtArma: Arma[] = [];
  protected rtA = new Float32Array(MAX_RITARDATI); // raggio o lunghezza
  protected rtB = new Float32Array(MAX_RITARDATI); // danno
  protected rtC = new Float32Array(MAX_RITARDATI); // direzione (angolo); per la Campana 1 = rintocco che ferma

  // usati dentro le ricerche nella griglia, per non creare funzioni nel ciclo di gioco
  protected cx = 0;
  protected cy = 0;
  protected cr = 0;
  protected cDanno = 0;
  protected cRespinta = 0;
  protected cForma = 0; // 0 cerchio, 1 arco, 2 rettangolo
  protected cCos = 0; // arco: metà ampiezza come coseno
  protected cDX = 1; // arco e rettangolo: direzione
  protected cDY = 0;
  protected cX0 = 0; // rettangolo
  protected cX1 = 0;
  protected cY0 = 0;
  protected cY1 = 0;
  protected cZona = 0;
  protected cAff = 0; // affinità del colpo in corso
  protected cProb: number = STATI.probabilita; // probabilità di lasciare lo stato
  protected cFerma = 0; // secondi per cui il colpo in corso ferma i nemici (secondo rintocco)
  protected cFermaTerra = false; // il fermo del colpo in corso è della Vanga: rispetta la pausa del Sepolto
  protected critico = false; // l'ultimo colpo calcolato è un critico?
  protected cReazione = 0; // la reazione a cui appartiene il colpo in corso (0 = nessuna): il suo danno va in un solo numero
  protected cForza = false; // Stati certi: il colpo in corso è il primo scatto di un'abilità, che ignora la quiete
  protected cRitmo = false; // Stati certi: il colpo in corso è di una zona, di un'abilità o del Velo funebre (STATI_CERTI.ritmo)
  protected cRX = 0; // il centro della sua zona
  protected cRY = 0;
  protected cRAperta = 0; // secondi in cui quella reazione può ancora colpire (per il numero)
  protected prossimaIdReazione = 0x80000000; // solo da vedere: lontani dai numeri dei nemici, che condividono lo stesso campo
  protected cLampo = true; // il colpo in corso fa lampeggiare i nemici? (no per chi ferisce a intervalli, come il Velo)
  // coda delle reazioni e delle esplosioni, eseguite alla fine del passo
  protected code = 0;
  protected qTipo = new Uint8Array(MAX_CODA);
  protected qJ = new Int32Array(MAX_CODA);
  protected qX = new Float32Array(MAX_CODA);
  protected qY = new Float32Array(MAX_CODA);
  protected qDanno = new Float32Array(MAX_CODA);
  protected qMolt = new Float32Array(MAX_CODA); // Devozione: moltiplicatore della reazione in coda
  protected qComune = new Uint8Array(MAX_CODA); // 1 = nemico comune (né bruto, né élite, né Seth): con gli Stati certi niente nome
  protected cDt = 0;
  protected cProiettile = 0;
  protected cMigliore = -1;
  protected cDistanza = 0;
  protected visitaColpo = (j: number): void => this.tocca(j);
  protected visitaZona = (j: number): void => this.toccaZona(j);
  protected visitaAttira = (j: number): void => this.attiraZona(j);
  protected visitaProiettile = (j: number): void => this.toccaProiettile(j);
  protected visitaFalce = (j: number): void => this.toccaFalce(j);
  protected visitaVicino = (j: number): void => this.vicino(j);
  protected visitaGrano = (j: number): void => this.vicinoGrano(j);
  protected scelti = new Int32Array(8); // bersagli già presi dalla raffica di candele
  votoFermi = false; // Voto della Terra (Becchino): +NUMERI_VOTI.dannoFermi ai nemici fermi
  protected mX = 0; // la direzione scelta da mira()
  protected mY = 0;

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
    for (let i = 0; i < MAX_SASSI; i++) this.ssSprite.push(scena.add.sprite(0, 0, SPRITE_SASSO).setDepth(PROFONDITA.sopra).setVisible(false));
    for (let i = 0; i < MAX_LAPIDI; i++) this.lpSprite.push(scena.add.sprite(0, 0, SPRITE_LAPIDE).setOrigin(0.5, 1).setScale(LAPIDE.ingrandimento).setDepth(PROFONDITA.sopra).setVisible(false));
    for (let i = 0; i < MAX_GRANI; i++) this.grSprite.push(scena.add.sprite(0, 0, SPRITE_GRANO).setDepth(PROFONDITA.sopra).setVisible(false));
    for (let i = 0; i < MAX_CORVI; i++) this.cvSprite.push(scena.add.sprite(0, 0, SPRITE_CORVO).setScale(CORVO.ingrandimento).setDepth(PROFONDITA.sopra).setVisible(false));
    this.velo = scena.add.image(0, 0, SPRITE_VELO).setDepth(PROFONDITA.aTerra).setVisible(false);
  }

  // definiti negli strati sopra (le famiglie di armi): qui servono solo i loro nomi
  protected abstract attiraZona(j: number): void;
  protected abstract lancia(chiave: string, j: number, velocita: number, vita: number, danno: number, trapassa: number, raggio: number, sterzo: number, portata: number, esplode: boolean, angolo: number, aff?: number, ox?: number, oy?: number): void;
  protected abstract toccaFalce(j: number): void;
  protected abstract toccaLapide(j: number): void;
  protected abstract toccaProiettile(j: number): void;
  protected abstract toccaZona(j: number): void;
  protected abstract vicino(j: number): void;
  protected abstract vicinoGrano(j: number): void;

  protected danno(base: number): number {
    // con l'intervallo il danno base è il minimo: il colpo esce tra il minimo e il massimo del livello
    const f = this.forbice[this.fonte];
    const caso = f > 0 ? 1 + this.caso.numero() * (f - 1) : COLPI.casoMinimo + this.caso.numero() * (COLPI.casoMassimo - COLPI.casoMinimo);
    const d = base * (1 + this.bonus.danno) * caso;
    this.critico = this.bonus.critico > 0 && this.casoStati.numero() < this.bonus.critico;
    return this.critico ? d * MOLTIPLICA_CRITICO : d;
  }

  /** Colpisce il nemico j, gli lascia lo stato dell'affinità aff e mostra il numero del danno; lampeggia = false per le zone e le aure, reazione = id della reazione a cui appartiene il colpo. */
  protected ferisci(j: number, base: number, respinta: number, dx: number, dy: number, aff = 0, probabilita: number = STATI.probabilita, lampeggia = true, reazione = 0): void {
    const o = this.orda;
    if (o.fuoriSchermo(j)) return; // prova «schermo»
    // Voto della Terra (Becchino): più danno ai nemici fermi
    const danno = this.danno(base) * (this.votoFermi && o.fermoOra(j) ? 1 + NUMERI_VOTI.dannoFermi : 1);
    this.dannoFonti[this.fonte] += danno;
    if (o.interrato(j)) this.dannoFonti[F.interramento] += danno * o.piuInterrato(j); // la parte in più dell'Interramento
    const viva = o.salute[j] > 0;
    o.colpisci(j, danno, respinta, dx, dy, lampeggia);
    if (viva && o.salute[j] <= 0) o.uccisore[j] = this.fonte + 1; // per la simulazione: chi l'ha ucciso
    // con gli Stati certi ogni colpo lascia lo stato, senza tirare il dado
    // con gli Stati certi ogni colpo lascia lo stato; zone e abilità (cRitmo) al massimo una volta ogni STATI_CERTI.ritmo s
    // per nemico e affinità, tranne il primo scatto dell'abilità (cForza)
    const ritmo = aff && this.cRitmo && INTERRUTTORI.statiCerti && !this.cForza;
    const prova = aff && (INTERRUTTORI.statiCerti ? !ritmo || o.ritmoLibero(j, aff) : this.casoStati.numero() < probabilita);
    const r = prova ? o.marca(j, aff, this.cForza) : 0;
    if (ritmo && prova && (r || o.marcato)) o.segnaRitmo(j, aff);
    if (r) this.accoda(r, j, danno);
    if (r) this.reazioniFonti[this.fonte]++;
    else if (prova && o.marcato) this.statiFonti[this.fonte]++; // solo se marca() è stata chiamata ora: marcato resta dal colpo prima
    this.dannoTotale += danno;
    suona('colpo');
    if (reazione) this.effetti.sommaReazione(reazione, this.cRX, this.cRY, danno, this.cRAperta);
    else if (o.elite[j] || o.tipo[j] === ID_MIETITORE) this.effetti.sommaDanno(o.id[j], o.x[j], o.y[j] - o.altezza(j), danno);
    else this.effetti.numero(o.x[j], o.y[j] - 2 * o.raggio[j], danno, this.critico);
  }

  /**
   * Mette in coda una reazione (o un'esplosione) sul nemico j, da eseguire alla fine del passo.
   * danno: per l'esplosione il suo danno; per una reazione il danno del colpo che l'ha innescata (0 se non c'è colpo).
   */
  protected accoda(tipo: number, j: number, danno: number): void {
    if (this.code >= MAX_CODA) return;
    const k = this.code++;
    const o = this.orda;
    this.qTipo[k] = tipo;
    this.qJ[k] = j;
    this.qX[k] = o.x[j];
    this.qY[k] = o.y[j] - o.raggio[j];
    const forte = o.tipo[j] === ID_MIETITORE || o.elite[j];
    // l'Eclissi toglie una parte della salute massima, con un tetto (il Mietitore subisce sempre il tetto)
    let eclissi = o.tipo[j] === ID_MIETITORE ? REAZIONI.eclissi.tetto : Math.min(REAZIONI.eclissi.tetto, REAZIONI.eclissi.parte * o.saluteMassima[j]);
    // Stati certi: senza tetto sui nemici normali e sui bruti; su élite e Seth il doppio del colpo (senza colpo, il tetto)
    if (INTERRUTTORI.statiCerti) eclissi = !forte ? STATI_CERTI.eclissi.parte * o.saluteMassima[j] : danno > 0 ? danno * STATI_CERTI.eclissi.colpoElite : REAZIONI.eclissi.tetto;
    // Devozione e Riti: la reazione si moltiplica per il grado dello stato consumato (orda.moltReazione, dall'ultima marca)
    const molt = tipo === ESPLOSIONE ? 1 : o.moltReazione;
    this.qMolt[k] = molt;
    this.qDanno[k] = tipo === ECLISSI ? eclissi * molt : danno;
    this.qComune[k] = forte || o.tipo[j] === ID_BRUTO ? 0 : 1;
  }

  /** Esegue le reazioni e le esplosioni in coda (i nemici non hanno ancora cambiato posto: i morti si tolgono dopo). */
  protected eseguiCoda(): void {
    const o = this.orda;
    for (let k = 0; k < this.code; k++) {
      const x = this.qX[k], y = this.qY[k], j = this.qJ[k];
      const t = this.qTipo[k];
      if (t === ESPLOSIONE || t === ECLISSI) {
        const r = t === ECLISSI ? REAZIONI.eclissi.raggio : RUOLI.esplosioneBastone.raggio;
        this.prepara(0, x, y, r, this.qDanno[k], 0);
        this.fonte = t === ECLISSI ? F.eclissi : F.bastone;
        this.cReazione = t === ECLISSI ? this.prossimaIdReazione++ : 0;
        this.cRX = x;
        this.cRY = y;
        this.cRAperta = 0;
        if (t === ESPLOSIONE) o.segno[j] = this.colpo; // il dardo l'ha già colpito
        this.orda.griglia.nelRaggio(x, y, r + 40, this.visitaColpo);
        this.rompiForma();
        if (t === ECLISSI) this.eclissi++;
        if (t === ECLISSI) {
          if (INTERRUTTORI.pixelfx) this.effetti.eclissiPixelfx(x, y);
          else this.effetti.reazione(x, y, r, REAZIONI.eclissi.colore, REAZIONI.eclissi.bordo, REAZIONI.durataEffetto);
        }
      } else if (t === ESORCISMO) {
        const e = REAZIONI.esorcismo, id = this.prossimaIdReazione++;
        this.fonte = F.esorcismo;
        // Stati certi: fiammelle al 60% del colpo che l'ha innescata (senza colpo, il danno di sempre)
        const certi = INTERRUTTORI.statiCerti, quante = certi ? STATI_CERTI.esorcismo.fiammelle : e.fiammelle;
        const dannoF = (certi && this.qDanno[k] > 0 ? this.qDanno[k] * STATI_CERTI.esorcismo.colpo : e.danno) * this.qMolt[k];
        for (let f = 0; f < quante; f++) {
          const prima = this.proiettili;
          this.lancia(FUOCO_FATUO.effetto, -1, e.velocita, e.vita, dannoF, 1, FUOCO_FATUO.raggio, FUOCO_FATUO.sterzo, FUOCO_FATUO.portata, false, (f / quante) * Math.PI * 2, 0, x, y);
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
        this.reazioniPerTipo[t]++;
        if (!(this.qComune[k] && INTERRUTTORI.statiCerti)) this.effetti.etichetta(t, x, y - REAZIONI.etichetta.sopra);
      }
    }
    this.code = 0;
  }

  /**
   * La direzione del colpo di Lanterna e Pala, in (mX, mY): con l'interruttore «mira» verso il nemico più vicino entro
   * «portata» px (ne restituisce il numero), altrimenti verso dove cammini (e restituisce −1). Non tira il caso.
   */
  protected mira(portata: number): number {
    this.mX = this.dx;
    this.mY = this.dy;
    if (!INTERRUTTORI.mira) return -1;
    const j = this.piuVicino(portata, 0), o = this.orda;
    if (j < 0) return -1;
    const ex = o.x[j] - this.px, ey = o.y[j] - o.raggio[j] - this.py, d = Math.hypot(ex, ey);
    if (d > 0) {
      this.mX = ex / d;
      this.mY = ey / d;
    }
    return j;
  }

  protected prepara(forma: number, x: number, y: number, r: number, danno: number, respinta: number): void {
    this.cForma = forma;
    this.cx = x;
    this.cy = y;
    this.cr = r;
    this.cDanno = danno;
    this.cRespinta = respinta;
    this.cAff = 0;
    this.cProb = STATI.probabilita;
    this.cFerma = 0;
    this.cFermaTerra = false;
    this.cLampo = true;
    this.cReazione = 0;
    this.colpo++;
    this.toccati = 0;
  }

  /** Il nemico j è dentro la forma del colpo in corso? Se sì, lo colpisce. */
  protected tocca(j: number): void {
    const o = this.orda;
    if (o.segno[j] === this.colpo || o.salute[j] <= 0 || o.fuoriSchermo(j)) return;
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
    const aff = this.cAff, terra = this.cFermaTerra, ferma = terra && !o.puoFermareTerra(j) ? 0 : this.cFerma;
    this.ferisci(j, this.cDanno, this.cRespinta, spintaX, spintaY, aff, this.cProb, this.cLampo, this.cReazione);
    if (ferma && terra) o.fermaTerra(j, ferma);
    else if (ferma) o.ferma(j, ferma);
  }

  /** Rompe gli oggetti dentro la forma del colpo in corso: stessa geometria di tocca. */
  protected rompiForma(): void {
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
    this.fonte = F.fuoco;
    this.ferisci(j, danno, 0, 0, 0, 0, 0, false);
  }

  /** Numero nuovo per segnare i nemici già toccati (lo usano le chiazze). */
  nuovoColpo(): number {
    return ++this.colpo;
  }

  /** Il nemico più vicino al personaggio entro portata, saltando i primi «salta» già scelti dalla stessa raffica. */
  protected piuVicino(portata: number, salta: number): number {
    const o = this.orda;
    let migliore = -1;
    let d2min = portata * portata;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= 0 || o.fuoriSchermo(j)) continue;
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

  /** Come piuVicino, ma prima cerca il più vicino che con lo stato aff farebbe una reazione; se non c'è, il più vicino. */
  protected piuVicinoCheReagisce(portata: number, salta: number, aff: number): number {
    const o = this.orda;
    let migliore = -1;
    let d2min = portata * portata;
    for (let j = 0; j < o.numero; j++) {
      if (!o.reagisceCon(j, aff) || o.fuoriSchermo(j)) continue;
      let preso = false;
      for (let k = 0; k < salta; k++) if (this.scelti[k] === j) preso = true;
      if (preso) continue;
      const ex = o.x[j] - this.px, ey = o.y[j] - o.raggio[j] - this.py, d2 = ex * ex + ey * ey;
      if (d2 < d2min) {
        d2min = d2;
        migliore = j;
      }
    }
    return migliore >= 0 ? migliore : this.piuVicino(portata, salta);
  }

  /** Un nemico a caso tra quelli sullo schermo (−1 se non ce ne sono). */
  protected nemicoVisibile(): number {
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

  // ——— Effetti solo da vedere ———
  protected raggioDi(chiave: string): number {
    let r = this.raggioEffetto.get(chiave);
    if (r === undefined) {
      r = raggioDisegnato(this.scena, chiave);
      this.raggioEffetto.set(chiave, r);
    }
    return r;
  }

  /** Mostra un effetto centrato in (x, y) per durata secondi; con raggio > 0 lo ingrandisce fino a coprire quell'area. */
  protected effetto(chiave: string, x: number, y: number, raggio: number, profondita: number, durata: number): Phaser.GameObjects.Sprite | null {
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
