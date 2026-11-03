/*
 * Armi: ogni arma posseduta si ricarica e colpisce da sola. Sono di quattro famiglie:
 * - colpi istantanei: Lanterna (arco), Pala e Campana (cerchio), Lama di luce (fendente);
 * - proiettili: Bastone e Candela (verso il nemico più vicino), Fuoco fatuo (lo insegue);
 * - zone che feriscono a intervalli: nubi del Turibolo, pozze dell'Acqua santa, abilità speciali;
 * - lame che girano intorno al personaggio: Falce.
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
  BASTONE, CAMPANA, CANDELA, COLPI, FALCE, FUOCO_FATUO, LAMA_DI_LUCE, LANTERNA, PALA, TURIBOLO, type Arma,
} from '../data/armi';

const NUBE = 1;
const POZZA = 2;
const ESPLOSIONE = 5; // in coda insieme alle reazioni: l'esplosione del dardo del Bastone
const MAX_CODA = 48;
const CODICE_AFFINITA = { luce: LUCE, sacro: SACRO, ombra: OMBRA, terra: TERRA } as const;
const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');
const MAX_EFFETTI = 48;
const MAX_ZONE = 32;
const MAX_PROIETTILI = 96;
const MAX_LAME = 8;
const MAX_RITARDATI = 8;
// i proiettili della v0 attraversano la tela nei loro fotogrammi: si usa l'ultimo, con l'origine sulla punta
const PROIETTILI_V0: Record<string, { fotogramma: string; x: number; y: number }> = {
  [BASTONE.effetto]: { fotogramma: '3', x: 88, y: 64 },
  [CANDELA.effetto]: { fotogramma: '3', x: 86, y: 64 },
  [FUOCO_FATUO.effetto]: { fotogramma: '3', x: 84, y: 60 },
};

export interface Posseduta {
  arma: Arma;
  livello: number; // da 1 a 8
}

/** I bonus del personaggio e dei doni passivi che cambiano le armi (li aggiorna la scena). */
export interface Bonus {
  danno: number; // 0,15 = +15%
  ricarica: number; // moltiplica le attese: 0,9 = −10%
  area: number; // 0,15 = raggi +15%
  quantita: number; // proiettili, nubi, fiale, fuochi, falci in più (Specchio)
}

export class Arsenale {
  readonly possedute: Posseduta[] = [];
  dannoTotale = 0; // per il riepilogo di fine partita
  reazioni = 0; // reazioni tra stati in questa notte (per la simulazione)
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
  private prCampi = [this.prX, this.prY, this.prVX, this.prVY, this.prVel, this.prVita, this.prDanno, this.prRaggio, this.prSterzo, this.prPortata];
  private prEsplode = new Uint8Array(MAX_PROIETTILI);
  private prAff = new Uint8Array(MAX_PROIETTILI);
  private prResto = new Uint8Array(MAX_PROIETTILI); // nemici che può ancora trapassare
  private prColpiti = new Uint32Array(MAX_PROIETTILI * 4); // id dei nemici già colpiti (fino a 4)
  private prSprite: Phaser.GameObjects.Sprite[] = [];
  private raffica = 0; // dardi del bastone ancora da sparare nella raffica in corso
  private attesaRaffica = 0;
  private dannoRaffica = 0;
  private trapassaRaffica = 0;

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
  private cFerma = 0; // secondi per cui il colpo in corso ferma i nemici (secondo rintocco)
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
  }

  aggiungi(arma: Arma): void {
    this.possedute.push({ arma, livello: 1 });
    this.attesa.push(0.5);
  }

  livello(arma: Arma): number {
    for (const p of this.possedute) if (p.arma === arma) return p.livello;
    return 0;
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
    this.effetti.reazione(this.px, this.py, raggio, REAZIONI.rivelazione.colore, REAZIONI.rivelazione.bordo, REAZIONI.durataEffetto);
  }

  /** Lucciola: abbaglia i nemici entro raggio dal personaggio (senza danno); le reazioni si eseguono a fine passo. */
  abbaglia(x: number, y: number, raggio: number): void {
    const o = this.orda, r2 = raggio * raggio;
    for (let j = 0; j < o.numero; j++) {
      const dx = o.x[j] - x, dy = o.y[j] - y;
      if (dx * dx + dy * dy > r2) continue;
      const r = o.marca(j, LUCE);
      if (r) this.accoda(r, j, 0);
    }
  }

  /** Salute al secondo che il personaggio riceve dalle zone che curano (Benedizione) in cui si trova. */
  cura(): number {
    let c = 0;
    for (let i = 0; i < this.zone; i++) {
      if (!this.zCura[i]) continue;
      const dx = this.px - this.zX[i];
      const dy = this.py - this.zY[i];
      if (dx * dx + dy * dy <= this.zR[i] * this.zR[i]) c += this.zCura[i];
    }
    return c;
  }

  /** Disegna ciò che si muove; gli effetti istantanei restano dove sono nati. Posizioni arrotondate al pixel. */
  disegna(): void {
    for (let i = 0; i < this.zone; i++) this.zSprite[i].setPosition(Math.round(this.zX[i]), Math.round(this.zY[i]));
    for (let i = 0; i < this.proiettili; i++) {
      this.prSprite[i].setPosition(Math.round(this.prX[i]), Math.round(this.prY[i])).setRotation(Math.atan2(this.prVY[i], this.prVX[i]));
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
        this.rintocco(l.raggio * area, l.danno);
        if (l.doppio) this.ritarda(a, a.ritardoDoppio, l.raggio * area, l.danno, 1); // il secondo rintocco ferma
        return l.ricarica;
      }
      case 'lamaDiLuce': {
        const l = a.livelli[p.livello - 1];
        // il fendente segue la direzione in cui cammini (prima solo destra o sinistra)
        this.fendente(this.dx, this.dy, l.lunghezza * area, l.danno);
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
          this.zona(a.effetto, nx, ny, l.raggio * area, l.danno, l.durata, a.intervallo, a.rallenta, 0, 0, false, false, NUBE, SACRO);
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
        }
        return l.ricarica;
      }
      case 'fuocoFatuo': {
        const l = a.livelli[p.livello - 1];
        const n = l.quantita + piu;
        // partono a raggiera e poi girano verso i nemici
        for (let k = 0; k < n; k++) this.lancia(a.effetto, -1, a.velocita, a.vita, l.danno, l.trapassa, a.raggio, a.sterzo, a.portata, false, (k / n) * Math.PI * 2, OMBRA);
        return l.ricarica;
      }
      case 'falce':
        return 1;
    }
  }

  private danno(base: number): number {
    return base * (1 + this.bonus.danno) * (COLPI.casoMinimo + this.caso.numero() * (COLPI.casoMassimo - COLPI.casoMinimo));
  }

  /** Colpisce il nemico j, gli lascia lo stato dell'affinità aff e mostra il numero del danno. */
  private ferisci(j: number, base: number, respinta: number, dx: number, dy: number, aff = 0, probabilita: number = STATI.probabilita): void {
    const o = this.orda;
    const danno = this.danno(base);
    o.colpisci(j, danno, respinta, dx, dy);
    const r = aff && this.casoStati.numero() < probabilita ? o.marca(j, aff) : 0;
    if (r) this.accoda(r, j, 0);
    this.dannoTotale += danno;
    suona('colpo');
    this.effetti.numero(o.x[j], o.y[j] - 2 * o.raggio[j], danno);
  }

  // ——— Colpi istantanei ———
  private arco(dx: number, dy: number, raggio: number, ampiezza: number, danno: number): void {
    this.prepara(1, this.px, this.py, raggio, danno, LANTERNA.respinta);
    this.cDX = dx;
    this.cDY = dy;
    this.cCos = Math.cos(((ampiezza / 2) * Math.PI) / 180);
    this.cAff = LUCE;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
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
        if (t === ESPLOSIONE) o.segno[j] = this.colpo; // il dardo l'ha già colpito
        this.orda.griglia.nelRaggio(x, y, r + 40, this.visitaColpo);
        if (t === ECLISSI) this.effetti.reazione(x, y, r, REAZIONI.eclissi.colore, REAZIONI.eclissi.bordo, REAZIONI.durataEffetto);
      } else if (t === ESORCISMO) {
        const e = REAZIONI.esorcismo;
        for (let f = 0; f < e.fiammelle; f++) {
          this.lancia(FUOCO_FATUO.effetto, -1, e.velocita, e.vita, e.danno, 1, FUOCO_FATUO.raggio, FUOCO_FATUO.sterzo, FUOCO_FATUO.portata, false, (f / e.fiammelle) * Math.PI * 2, 0, x, y);
        }
        this.effetti.reazione(x, y, e.raggio, e.colore, e.bordo, REAZIONI.durataEffetto);
      } else if (t === RIVELAZIONE) {
        this.effetti.reazione(x, y, REAZIONI.rivelazione.raggio, REAZIONI.rivelazione.colore, REAZIONI.rivelazione.bordo, REAZIONI.durataEffetto);
      } else if (t === INTERRAMENTO) {
        this.effetti.reazione(x, y, REAZIONI.interramento.raggio, REAZIONI.interramento.colore, REAZIONI.interramento.bordo, REAZIONI.durataEffetto);
      }
      if (t !== ESPLOSIONE) this.reazioni++;
    }
    this.code = 0;
  }

  private impatto(dx: number, dy: number, raggio: number, danno: number): void {
    this.prepara(0, this.px + dx * PALA.distanza, this.py + dy * PALA.distanza, raggio, danno, PALA.respinta);
    this.cAff = TERRA;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.effetto(PALA.effetto, this.cx, this.cy, raggio, PROFONDITA.aTerra, EFFETTI.impattoPala);
    if (this.toccati) this.effetti.scuoti(EFFETTI.scossaPala.forza, EFFETTI.scossaPala.durata);
  }

  private rintocco(raggio: number, danno: number, ferma = 0): void {
    this.prepara(0, this.px, this.py, raggio, danno, CAMPANA.respinta);
    this.cAff = SACRO;
    this.cFerma = ferma;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.effetto(CAMPANA.effetto, this.px, this.py, raggio, PROFONDITA.aTerra, CAMPANA.durataEffetto);
    suona('campana');
  }

  /** Fendente dritto nella direzione (dx, dy), lunga 1: un rettangolo che parte dal personaggio. */
  private fendente(dx: number, dy: number, lunghezza: number, danno: number): void {
    const h = LAMA_DI_LUCE.altezza / 2;
    this.prepara(2, this.px + (dx * lunghezza) / 2, this.py + (dy * lunghezza) / 2, Math.hypot(lunghezza / 2, h), danno, LAMA_DI_LUCE.respinta);
    this.cAff = LUCE;
    this.cX0 = this.px; // inizio del fendente
    this.cY0 = this.py;
    this.cX1 = lunghezza;
    this.cY1 = h;
    this.cDX = dx;
    this.cDY = dy;
    this.orda.griglia.nelRaggio(this.cx, this.cy, this.cr + 40, this.visitaColpo);
    // il fendente della v0 parte dal bordo sinistro della tela e va a destra: si allunga e si gira nella direzione;
    // verso sinistra si capovolge anche in verticale, così il disegno non resta sottosopra
    const s = this.effetto(LAMA_DI_LUCE.effetto, this.px, this.py, 0, PROFONDITA.aTerra, LAMA_DI_LUCE.durataEffetto);
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
    this.cFerma = 0;
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
    this.ferisci(j, this.cDanno, this.cRespinta, spintaX, spintaY, aff);
    if (ferma) o.ferma(j, ferma);
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
      else if (arma === CAMPANA) this.rintocco(this.rtA[i], this.rtB[i], this.rtC[i] ? RUOLI.campanaFermo : 0);
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
    this.zVita[i] = durata;
    this.zIntervallo[i] = intervallo;
    this.zTick[i] = 0;
    this.zRallenta[i] = rallenta;
    this.zAttira[i] = attira;
    this.zCura[i] = cura;
    this.zSegue[i] = segue ? 1 : 0;
    this.zTipo[i] = tipo;
    this.zAff[i] = aff;
    const s = this.zSprite[i];
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
    this.ferisci(j, this.zDanno[i], 0, 0, 0, this.zAff[i], STATI.probabilitaZone);
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
    this.prVX[i] = Math.cos(ang) * velocita;
    this.prVY[i] = Math.sin(ang) * velocita;
    this.prVel[i] = velocita;
    this.prVita[i] = vita;
    this.prDanno[i] = danno;
    this.prRaggio[i] = raggio;
    this.prSterzo[i] = sterzo;
    this.prPortata[i] = portata;
    this.prEsplode[i] = esplode ? 1 : 0;
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
    for (let i = this.proiettili - 1; i >= 0; i--) {
      this.prVita[i] -= dt;
      if (this.prSterzo[i]) this.sterza(i, dt);
      this.prX[i] += this.prVX[i] * dt;
      this.prY[i] += this.prVY[i] * dt;
      if (this.prVita[i] > 0) {
        this.cProiettile = i;
        this.cx = this.prX[i];
        this.cy = this.prY[i];
        this.orda.griglia.vicini(this.cx, this.cy, this.visitaProiettile);
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
    this.ferisci(j, this.prDanno[i], 0, this.prVX[i] / v, this.prVY[i] / v, this.prAff[i]);
    if (this.prEsplode[i]) {
      this.effetto(BASTONE.esplosione, this.cx, this.cy, 0, PROFONDITA.sopra, EFFETTI.esplosione);
      this.accoda(ESPLOSIONE, j, this.prDanno[i] * RUOLI.esplosioneBastone.danno); // ferisce anche intorno
    }
  }

  private togliProiettile(i: number): void {
    const u = --this.proiettili;
    const s = this.prSprite[i];
    s.setVisible(false);
    if (i === u) return;
    for (const a of this.prCampi) a[i] = a[u];
    this.prEsplode[i] = this.prEsplode[u];
    this.prAff[i] = this.prAff[u];
    this.prResto[i] = this.prResto[u];
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
