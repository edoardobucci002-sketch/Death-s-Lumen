/*
 * Orda: tutti i nemici in campo. Li fa nascere appena fuori dallo schermo, li muove verso
 * il giocatore, li tiene separati con la griglia spaziale e ricolloca chi resta troppo indietro.
 * Quando un'arma li colpisce perdono salute, si illuminano, vengono respinti; a zero salute muoiono.
 * Ogni tipo si muove a modo suo (IA): dritto, accerchiando, tagliando la strada o a zig-zag.
 * Fa nascere anche le élite (più grosse, con alone ambra), gli sciami che circondano, le orde in formazione
 * che marciano compatte e poi caricano, e il Mietitore, che cammina e poi fa una mossa con preavviso:
 * scatto, falciata, falci spettrali o chiamata dei morti (le ultime tre passano da Minacce).
 * Gli stati lasciati dalle armi (abbagliato, consacrato, maledetto, sepolto) cambiano danno e movimento;
 * due stati diversi fanno una reazione (marca restituisce quale: la esegue Arsenale, che può ferire e lanciare).
 * I nemici vivono in array preparati all'inizio (pool): durante la partita non si crea niente di nuovo.
 */
import Phaser from 'phaser';
import { ingrandimento } from './asset';
import type { Caso } from './caso';
import { Griglia } from './griglia';
import type { Minacce } from './minacce';
import { COMPARSA, COPIONE, DIFFICOLTA, RESPIRO, ELITE, IA, MIETITORE, NEMICI, ORDE, SCIAMI, SEPARAZIONE } from '../data/nemici';
import { ATTRAZIONE_PESANTI } from '../data/abilita';
import { REAZIONI, STATI } from '../data/stati';
import { Simboli } from './simboli';
import { COLPI } from '../data/armi';

/** Più posti del massimo in campo: servono anche alla prova con 400 nemici, alle orde e alla chiamata dei morti. */
export const CAPIENZA = Math.max(DIFFICOLTA.tetto, 400) + SCIAMI.massimo + 2 * ORDE.massimo + MIETITORE.chiamata.quanti + 20;
/** Che tipo di nemico è morto: decide reliquiari, Cera e fiaschetta. */
export type CategoriaNemico = 'comune' | 'elite' | 'seth';
const ID_MIETITORE = NEMICI.findIndex((t) => t.id === 'mietitore');
const ID_CHIAMATA = NEMICI.findIndex((t) => t.id === MIETITORE.chiamata.tipo);
const COMPORTAMENTO = NEMICI.map((t) => ['diretto', 'accerchia', 'intercetta', 'zigzag'].indexOf(t.comportamento));
const [DIRETTO, ACCERCHIA, INTERCETTA, ZIGZAG] = [0, 1, 2, 3];
// mosse del Mietitore
const MOSSE = ['scatto', 'falciata', 'falci', 'chiamata'] as const;
const [SCATTO, FALCIATA, FALCI, CHIAMATA] = [0, 1, 2, 3];
const MAX_BRANCHI = 4; // orde in campo insieme
/** Affinità come numeri, per gli array: 0 = nessuna. */
export const [LUCE, SACRO, OMBRA, TERRA] = [1, 2, 3, 4];
/** Reazioni, come le restituisce marca (0 = nessuna). */
export const [ECLISSI, RIVELAZIONE, ESORCISMO, INTERRAMENTO] = [1, 2, 3, 4];

interface AspettoNemico {
  ingrandimento: number;
  piedi: number; // origine verticale (0-1) all'altezza dei piedi
  testa: number; // pixel di gioco dai piedi alla cima dello sprite
}

export class Orda {
  moltSaluteElite = 1; // Ossa d'élite: le élite sono più resistenti
  numero = 0; // nemici in campo: occupano i posti da 0 a numero-1
  readonly x = new Float32Array(CAPIENZA); // posizione dei piedi
  readonly y = new Float32Array(CAPIENZA);
  readonly raggio = new Float32Array(CAPIENZA);
  readonly danno = new Float32Array(CAPIENZA);
  readonly salute = new Float32Array(CAPIENZA);
  readonly saluteMassima = new Float32Array(CAPIENZA);
  readonly elite = new Uint8Array(CAPIENZA);
  readonly tipo = new Uint8Array(CAPIENZA);
  readonly id = new Uint32Array(CAPIENZA); // numero unico di ogni nemico nato, anche se cambia posto
  readonly segno = new Uint32Array(CAPIENZA); // l'ultimo colpo che l'ha già toccato (vedi Griglia.nelRaggio)
  readonly griglia = new Griglia(64, CAPIENZA);
  private velocita = new Float32Array(CAPIENZA);
  private respintaX = new Float32Array(CAPIENZA);
  private respintaY = new Float32Array(CAPIENZA);
  private lento = new Float32Array(CAPIENZA); // parte di velocità tolta (0,3 = −30%)
  private lentoPer = new Float32Array(CAPIENZA); // secondi rimasti di rallentamento
  private lampo = new Float32Array(CAPIENZA);
  private pausaLampo = new Float32Array(CAPIENZA); // secondi prima che possa lampeggiare di nuovo
  readonly pausaFalce = new Float32Array(CAPIENZA); // secondi prima che una falce possa colpirlo di nuovo
  readonly pausaNube = new Float32Array(CAPIENZA); // …una nube del Turibolo
  readonly pausaPozza = new Float32Array(CAPIENZA); // …una pozza dell'Acqua santa
  // stati: secondi rimasti (0 = assente)
  private sAbbagliato = new Float32Array(CAPIENZA);
  private sConsacrato = new Float32Array(CAPIENZA);
  private sMaledetto = new Float32Array(CAPIENZA);
  private sSepolto = new Float32Array(CAPIENZA);
  private sInterrato = new Float32Array(CAPIENZA);
  private pausaSepolto = new Float32Array(CAPIENZA); // prima di allora non può essere sepolto di nuovo
  private fermo = new Float32Array(CAPIENZA); // fermato da altro (secondo rintocco della Campana)
  private ultimoStato = new Uint8Array(CAPIENZA); // affinità dell'ultimo stato, per il colore
  private rivelato = new Uint8Array(CAPIENZA); // 1 = le sue anime sono già raddoppiate (Rivelazione una volta sola)
  private tempo = 0;
  // Mietitore: 0 cammina, 1 si ferma e pulsa (preavviso), 2 fa la mossa (letti anche dal bot, per schivare)
  readonly fase = new Uint8Array(CAPIENZA);
  readonly mossa = new Uint8Array(CAPIENZA);
  private volta = new Uint8Array(CAPIENZA); // 1 per il Mietitore del minuto 10
  private faseTempo = new Float32Array(CAPIENZA);
  readonly scattoX = new Float32Array(CAPIENZA);
  readonly scattoY = new Float32Array(CAPIENZA);
  private anime = new Float32Array(CAPIENZA);
  private fianco = new Float32Array(CAPIENZA); // accerchia: di quanto gira intorno al giocatore (radianti, ±)
  // orde: a quale orda appartiene (0 = nessuna) e il suo posto nella formazione rispetto al centro
  private branco = new Uint8Array(CAPIENZA);
  private postoX = new Float32Array(CAPIENZA);
  private postoY = new Float32Array(CAPIENZA);
  private bAttiva = new Uint8Array(MAX_BRANCHI);
  private bCarica = new Uint8Array(MAX_BRANCHI);
  private bMembri = new Uint16Array(MAX_BRANCHI);
  private bX = new Float32Array(MAX_BRANCHI);
  private bY = new Float32Array(MAX_BRANCHI);
  // chiamata dei morti: dove usciranno gli scheletri
  private chiamataX = new Float32Array(MIETITORE.chiamata.quanti);
  private chiamataY = new Float32Array(MIETITORE.chiamata.quanti);
  private pesoMosse = MOSSE.map((m) => MIETITORE.mosse[m]);
  private versoSinistra = new Uint8Array(CAPIENZA);
  private sprite: Phaser.GameObjects.Sprite[] = [];
  private aspetto: AspettoNemico[];
  private simboli: Simboli;
  // chi ha uno stato da mostrare, scelto a ogni disegno senza creare elenchi nuovi: élite, poi i bruti più vicini
  private eliteStato = new Uint16Array(STATI.simboli.massimi);
  private brutiStato = new Uint16Array(STATI.simboli.massimi);
  private distanzaStato = new Float32Array(STATI.simboli.massimi); // in ordine crescente, come brutiStato
  durataStati = 1; // la Cera votiva allunga gli stati
  private daFare = 0; // comparse accumulate (frazioni di nemico)
  private prossimoId = 1;
  // usati dentro la separazione, per non creare funzioni nel ciclo di gioco
  private corrente = 0;
  private spingi = (j: number): void => this.separa(j);
  // tutti i valori decimali di un nemico, per spostarli insieme quando cambia posto
  private campi = [this.x, this.y, this.raggio, this.danno, this.salute, this.velocita, this.respintaX, this.respintaY, this.lento, this.lentoPer, this.lampo, this.pausaLampo, this.pausaFalce, this.pausaNube, this.pausaPozza,
    this.sAbbagliato, this.sConsacrato, this.sMaledetto, this.sSepolto, this.sInterrato, this.pausaSepolto, this.fermo,
    this.saluteMassima, this.faseTempo, this.scattoX, this.scattoY, this.anime, this.fianco, this.postoX, this.postoY];

  constructor(
    scena: Phaser.Scene,
    private caso: Caso,
    private minacce: Minacce,
  ) {
    this.aspetto = NEMICI.map((t) => {
      // i piedi sono la riga più bassa usata in tutti i fotogrammi (negli sprite V0 non è il bordo della tela)
      const dati = scena.cache.json.get(t.sprite) as { frames: { spriteSourceSize: { y: number; h: number }; sourceSize: { h: number } }[] };
      const fondo = Math.max(...dati.frames.map((f) => f.spriteSourceSize.y + f.spriteSourceSize.h));
      const cima = Math.min(...dati.frames.map((f) => f.spriteSourceSize.y));
      const ing = ingrandimento(scena, t.sprite);
      return { ingrandimento: ing, piedi: fondo / dati.frames[0].sourceSize.h, testa: (fondo - cima) * ing };
    });
    for (let i = 0; i < CAPIENZA; i++) {
      this.sprite.push(scena.add.sprite(0, 0, NEMICI[0].sprite).setVisible(false).setActive(false));
    }
    this.simboli = new Simboli(scena);
  }

  /**
   * Un passo di logica: comparse, movimento, separazione, ricollocamento.
   * (dirX, dirY) è il comando di movimento del giocatore (lungo da 0 a 1), vel la sua velocità.
   */
  aggiorna(dt: number, secondi: number, gx: number, gy: number, dirX: number, dirY: number, vel: number, mezzaL: number, mezzaA: number): void {
    const m = secondi / 60;
    const massimi = Math.min(DIFFICOLTA.tetto, DIFFICOLTA.massimiBase + DIFFICOLTA.massimiPerMinuto * m);
    const calma = secondi >= RESPIRO.dal && secondi % RESPIRO.ciclo >= RESPIRO.marea;
    this.daFare += (DIFFICOLTA.comparseBase + DIFFICOLTA.comparsePerMinuto * m) * (calma ? RESPIRO.comparse : 1) * dt;
    let nascite = Math.min(Math.floor(this.daFare), DIFFICOLTA.comparsePerFotogramma);
    this.daFare -= nascite;
    if (this.daFare > DIFFICOLTA.comparsePerFotogramma) this.daFare = DIFFICOLTA.comparsePerFotogramma;
    if (!calma && this.numero < massimi * DIFFICOLTA.sogliaRinforzo) nascite += DIFFICOLTA.rinforzoPerFotogramma;
    for (; nascite > 0 && this.numero < massimi; nascite--) this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA);

    // orde: la formazione marcia verso il giocatore; abbastanza vicina, carica
    for (let b = 0; b < MAX_BRANCHI; b++) {
      if (!this.bAttiva[b]) continue;
      if (!this.bMembri[b]) {
        this.bAttiva[b] = 0;
        continue;
      }
      this.bMembri[b] = 0; // ricontati qui sotto
      if (this.bCarica[b]) continue;
      const ox = gx - this.bX[b];
      const oy = gy - this.bY[b];
      const od = Math.hypot(ox, oy);
      if (od < ORDE.distanzaCarica) this.bCarica[b] = 1;
      else {
        this.bX[b] += (ox / od) * ORDE.marcia * dt;
        this.bY[b] += (oy / od) * ORDE.marcia * dt;
      }
    }

    // ognuno verso dove punta (IA), più la respinta che si spegne a poco a poco
    const frena = Math.exp(-COLPI.attrito * dt);
    this.tempo += dt;
    const pvx = dirX * vel; // velocità del giocatore, per chi gli taglia la strada
    const pvy = dirY * vel;
    for (let i = 0; i < this.numero; i++) {
      const dx = gx - this.x[i];
      const dy = gy - this.y[i];
      const d = Math.hypot(dx, dy);
      if (this.lentoPer[i] > 0) this.lentoPer[i] -= dt;
      if (this.lampo[i] > 0) this.lampo[i] -= dt;
      if (this.pausaLampo[i] > 0) this.pausaLampo[i] -= dt;
      if (this.pausaFalce[i] > 0) this.pausaFalce[i] -= dt;
      if (this.pausaNube[i] > 0) this.pausaNube[i] -= dt;
      if (this.pausaPozza[i] > 0) this.pausaPozza[i] -= dt;
      const fermo = this.aggiornaStati(i, dt);
      if (!fermo && this.tipo[i] === ID_MIETITORE && this.muoviMietitore(i, dt, dx, dy, d, gx, gy, secondi)) continue;
      let v = fermo ? 0 : this.velocita[i] * (this.lentoPer[i] > 0 ? 1 - this.lento[i] : 1);
      if (this.sConsacrato[i] > 0) v *= 1 - STATI.consacrato.lento * (this.tipo[i] === ID_MIETITORE ? MIETITORE.rallentamento : 1);
      let tx = gx;
      let ty = gy;
      const b = this.branco[i] - 1;
      const comportamento = b >= 0 ? DIRETTO : COMPORTAMENTO[this.tipo[i]];
      if (b >= 0) {
        this.bMembri[b]++;
        if (this.bCarica[b]) v *= ORDE.carica;
        else {
          tx = this.bX[b] + this.postoX[i];
          ty = this.bY[b] + this.postoY[i];
        }
      } else if (comportamento === ACCERCHIA && d > IA.accerchia.vicino) {
        // punta a un punto girato di lato intorno al giocatore e più vicino: arriva dal fianco
        const c = Math.cos(this.fianco[i]);
        const sn = Math.sin(this.fianco[i]);
        tx = gx + (-dx * c + dy * sn) * IA.accerchia.stringe;
        ty = gy + (-dx * sn - dy * c) * IA.accerchia.stringe;
      } else if (comportamento === INTERCETTA && v > 0) {
        const t = Math.min(d / v, IA.intercetta.anticipo);
        tx = gx + pvx * t;
        ty = gy + pvy * t;
      }
      const mx = tx - this.x[i];
      const my = ty - this.y[i];
      const md = Math.hypot(mx, my);
      if (md > 0.5) {
        let ux = mx / md;
        let uy = my / md;
        if (comportamento === ZIGZAG) {
          // ondeggia di lato: ognuno con il suo ritmo
          const o = Math.sin(secondi * IA.zigzag.frequenza + this.id[i] * 1.7) * IA.zigzag.ampiezza;
          ux -= uy * o;
          uy += (mx / md) * o;
          const l = Math.hypot(ux, uy);
          ux /= l;
          uy /= l;
        }
        const passo = Math.min(md, v * dt);
        this.x[i] += ux * passo;
        this.y[i] += uy * passo;
        if (ux < -0.05) this.versoSinistra[i] = 1;
        else if (ux > 0.05) this.versoSinistra[i] = 0;
      }
      this.x[i] += this.respintaX[i] * dt;
      this.y[i] += this.respintaY[i] * dt;
      this.respintaX[i] *= frena;
      this.respintaY[i] *= frena;
    }

    // griglia con tutti i nemici: serve alle armi e alla separazione
    this.griglia.svuota();
    for (let i = 0; i < this.numero; i++) this.griglia.inserisci(i, this.x[i], this.y[i]);
    // separazione: ognuno si allontana dai vicini che lo toccano (i fantasmi attraversano tutti)
    for (let i = 0; i < this.numero; i++) {
      if (NEMICI[this.tipo[i]].attraversa) continue;
      this.corrente = i;
      this.griglia.vicini(this.x[i], this.y[i], this.spingi);
    }

    // chi è rimasto troppo indietro torna davanti al giocatore
    const limiteX = mezzaL + COMPARSA.margine * COMPARSA.lontananza;
    const limiteY = mezzaA + COMPARSA.margine * COMPARSA.lontananza;
    for (let i = 0; i < this.numero; i++) {
      if (Math.abs(this.x[i] - gx) > limiteX || Math.abs(this.y[i] - gy) > limiteY) {
        // un'orda che marcia nasce lontana: resta in formazione finché non è troppo indietro
        const b = this.branco[i] - 1;
        if (b >= 0 && !this.bCarica[b] && Math.abs(this.bX[b] - gx) < limiteX * 2 && Math.abs(this.bY[b] - gy) < limiteY * 2) continue;
        this.branco[i] = 0;
        this.posiziona(i, gx, gy, dirX, dirY, mezzaL, mezzaA);
        this.respintaX[i] = this.respintaY[i] = 0;
      }
    }
  }

  /** Colpisce il nemico i: toglie salute, lo illumina (se lampeggia e non l'ha fatto da poco) e lo spinge nella direzione (dx, dy), lunga 1. */
  colpisci(i: number, danno: number, respinta: number, dx: number, dy: number, lampeggia = true): void {
    // abbagliato e interrato subiscono di più
    this.salute[i] -= danno * (1 + (this.sAbbagliato[i] > 0 ? STATI.abbagliato.danno : 0) + (this.sInterrato[i] > 0 ? REAZIONI.interramento.danno : 0));
    if (lampeggia && this.pausaLampo[i] <= 0) {
      this.lampo[i] = COLPI.lampoNemico;
      this.pausaLampo[i] = COLPI.lampoNemicoPausa;
    }
    if (respinta && this.tipo[i] !== ID_MIETITORE) {
      const r = respinta * (NEMICI[this.tipo[i]].pesante || this.elite[i] ? COLPI.respintaPesanti : 1);
      this.respintaX[i] = dx * r;
      this.respintaY[i] = dy * r;
    }
  }

  /**
   * Lascia sul nemico i lo stato dell'affinità aff. Se aveva già uno stato diverso, li consuma e restituisce
   * la reazione (ECLISSI, RIVELAZIONE, ESORCISMO, INTERRAMENTO); Rivelazione e Interramento li applica qui.
   */
  marca(i: number, aff: number): number {
    if (!aff || this.salute[i] <= 0) return 0;
    if (aff === TERRA && this.pausaSepolto[i] > 0) return 0;
    const abb = this.sAbbagliato[i] > 0, cons = this.sConsacrato[i] > 0, mal = this.sMaledetto[i] > 0, sep = this.sSepolto[i] > 0;
    let r = 0;
    if (aff === TERRA ? abb || cons || mal : sep) r = INTERRAMENTO;
    else if ((aff === LUCE && mal) || (aff === OMBRA && abb)) r = ECLISSI;
    else if ((aff === LUCE && cons) || (aff === SACRO && abb)) r = RIVELAZIONE;
    else if ((aff === SACRO && mal) || (aff === OMBRA && cons)) r = ESORCISMO;
    const resiste = this.tipo[i] === ID_MIETITORE ? STATI.mietitore.fermo : 1;
    if (r) {
      this.sAbbagliato[i] = this.sConsacrato[i] = this.sMaledetto[i] = this.sSepolto[i] = 0;
      this.ultimoStato[i] = 0;
      if (r === INTERRAMENTO) {
        this.sInterrato[i] = REAZIONI.interramento.fermo * resiste;
        this.pausaSepolto[i] = STATI.sepolto.pausa;
      } else if (r === RIVELAZIONE && !this.rivelato[i]) {
        // una volta sola: sul Mietitore, colpito di continuo, le anime raddoppiavano all'infinito
        this.anime[i] *= REAZIONI.rivelazione.anime;
        this.rivelato[i] = 1;
      }
      return r;
    }
    if (aff === LUCE) this.sAbbagliato[i] = STATI.durata * this.durataStati;
    else if (aff === SACRO) this.sConsacrato[i] = STATI.durata * this.durataStati;
    else if (aff === OMBRA) this.sMaledetto[i] = STATI.durata * this.durataStati;
    else {
      this.sSepolto[i] = STATI.sepolto.fermo * resiste;
      this.pausaSepolto[i] = STATI.sepolto.pausa;
    }
    this.ultimoStato[i] = aff;
    return 0;
  }

  /** Ferma il nemico i per qualche secondo, senza stato (secondo rintocco della Campana); il Mietitore a metà. */
  maledetto(i: number): boolean {
    return this.sMaledetto[i] > 0;
  }

  ferma(i: number, secondi: number): void {
    const s = secondi * (this.tipo[i] === ID_MIETITORE ? STATI.mietitore.fermo : 1);
    if (s > this.fermo[i]) this.fermo[i] = s;
  }

  /** Avanza gli stati del nemico i (la maledizione toglie salute); restituisce true se è fermo. */
  private aggiornaStati(i: number, dt: number): boolean {
    if (this.sAbbagliato[i] > 0) this.sAbbagliato[i] -= dt;
    if (this.sConsacrato[i] > 0) this.sConsacrato[i] -= dt;
    if (this.pausaSepolto[i] > 0) this.pausaSepolto[i] -= dt;
    if (this.sMaledetto[i] > 0) {
      this.sMaledetto[i] -= dt;
      const f = this.tipo[i] === ID_MIETITORE ? STATI.mietitore.maledetto : this.elite[i] ? STATI.elite.maledetto : 1;
      this.salute[i] -= this.saluteMassima[i] * STATI.maledetto.perSecondo * f * dt;
    }
    let fermo = false;
    if (this.sSepolto[i] > 0) {
      this.sSepolto[i] -= dt;
      fermo = true;
    }
    if (this.sInterrato[i] > 0) {
      this.sInterrato[i] -= dt;
      fermo = true;
    }
    if (this.fermo[i] > 0) {
      this.fermo[i] -= dt;
      fermo = true;
    }
    if (this.ultimoStato[i] && this.sAbbagliato[i] <= 0 && this.sConsacrato[i] <= 0 && this.sMaledetto[i] <= 0 && this.sSepolto[i] <= 0) this.ultimoStato[i] = 0;
    return fermo;
  }

  /** Rallenta il nemico i per qualche istante; resta il rallentamento più forte. */
  rallenta(i: number, quanto: number, secondi: number): void {
    if (this.tipo[i] === ID_MIETITORE) quanto *= MIETITORE.rallentamento;
    if (this.lentoPer[i] <= 0 || quanto >= this.lento[i]) this.lento[i] = quanto;
    this.lentoPer[i] = Math.max(this.lentoPer[i], secondi);
  }

  /** Tira il nemico i verso (tx, ty) di passo pixel (bruti ed élite a metà, il Mietitore a un quarto). */
  attira(i: number, tx: number, ty: number, passo: number): void {
    const dx = tx - this.x[i];
    const dy = ty - this.y[i];
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    const f = this.tipo[i] === ID_MIETITORE ? MIETITORE.attrazione : NEMICI[this.tipo[i]].pesante || this.elite[i] ? ATTRAZIONE_PESANTI : 1;
    const p = Math.min(d, passo * f);
    this.x[i] += (dx / d) * p;
    this.y[i] += (dy / d) * p;
  }

  /** Toglie dal campo i nemici senza salute; per ognuno chiama muore(x, y, anime, categoria). */
  rimuoviMorti(muore: (x: number, y: number, anime: number, categoria: CategoriaNemico) => void): void {
    for (let i = this.numero - 1; i >= 0; i--) {
      if (this.salute[i] > 0) continue;
      const categoria = this.tipo[i] === ID_MIETITORE ? 'seth' : this.elite[i] ? 'elite' : 'comune';
      muore(this.x[i], this.y[i] - this.raggio[i], this.anime[i], categoria);
      this.togli(i);
    }
  }

  /** Un'élite: un nemico normale potenziato, con un alone ambra. */
  nasciElite(secondi: number, gx: number, gy: number, mezzaL: number, mezzaA: number): void {
    if (this.numero >= CAPIENZA) return;
    const i = this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA);
    this.elite[i] = 1;
    this.salute[i] = this.saluteMassima[i] *= ELITE.salute * this.moltSaluteElite;
    this.danno[i] *= ELITE.danno;
    this.anime[i] *= ELITE.anime;
    this.raggio[i] *= ELITE.dimensione;
    this.velocita[i] *= ELITE.velocita;
    this.sprite[i].setScale(this.aspetto[this.tipo[i]].ingrandimento * ELITE.dimensione);
  }

  /** Il Mietitore; volta è 0 al primo arrivo, 1 al secondo (più resistente). */
  nasciMietitore(secondi: number, volta: number, gx: number, gy: number, mezzaL: number, mezzaA: number): void {
    if (this.numero >= CAPIENZA) return;
    const i = this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA, ID_MIETITORE);
    if (volta > 0) this.salute[i] = this.saluteMassima[i] *= MIETITORE.saluteSecondo;
    this.volta[i] = volta > 0 ? 1 : 0;
    this.fase[i] = 0;
    this.faseTempo[i] = this.camminata(i);
  }

  /**
   * Un'orda: quanti nemici del tipo dato in formazione (file di ORDE.perFila), appena fuori dallo schermo
   * nella direzione angolo; marciano compatti verso il giocatore e caricano quando sono vicini.
   */
  orda(secondi: number, tipo: number, quanti: number, angolo: number, gx: number, gy: number, mezzaL: number, mezzaA: number): void {
    const b = this.bAttiva.indexOf(0);
    if (b < 0) return;
    const c = Math.cos(angolo);
    const sn = Math.sin(angolo);
    const bordo = Math.min(Math.abs(c) > 1e-6 ? mezzaL / Math.abs(c) : Infinity, Math.abs(sn) > 1e-6 ? mezzaA / Math.abs(sn) : Infinity);
    const spazio = NEMICI[tipo].raggio * ORDE.spazio;
    this.bAttiva[b] = 1;
    this.bCarica[b] = 0;
    this.bMembri[b] = quanti;
    this.bX[b] = gx + c * (bordo + COMPARSA.margine);
    this.bY[b] = gy + sn * (bordo + COMPARSA.margine);
    for (let k = 0; k < quanti && this.numero < CAPIENZA; k++) {
      const fila = Math.floor(k / ORDE.perFila);
      const inFila = Math.min(ORDE.perFila, quanti - fila * ORDE.perFila);
      const lato = (k % ORDE.perFila - (inFila - 1) / 2) * spazio; // lungo il fronte
      const dietro = fila * spazio; // le file dopo la prima stanno più lontane
      const i = this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA, tipo);
      this.branco[i] = b + 1;
      this.postoX[i] = -sn * lato + c * dietro;
      this.postoY[i] = c * lato + sn * dietro;
      this.x[i] = this.bX[b] + this.postoX[i];
      this.y[i] = this.bY[b] + this.postoY[i];
    }
  }

  /** Uno sciame di quanti nemici del tipo dato, in cerchio appena fuori dallo schermo, un po' più veloci. */
  sciame(secondi: number, tipo: number, quanti: number, gx: number, gy: number, mezzaL: number, mezzaA: number): void {
    for (let k = 0; k < quanti && this.numero < CAPIENZA; k++) {
      const i = this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA, tipo);
      const ang = (k / quanti) * Math.PI * 2;
      this.x[i] = gx + Math.cos(ang) * (mezzaL + COMPARSA.margine);
      this.y[i] = gy + Math.sin(ang) * (mezzaA + COMPARSA.margine);
      this.velocita[i] *= SCIAMI.velocita;
    }
  }

  /** Quanto sta in alto la cima dello sprite del nemico i, in pixel di gioco dai piedi (le élite sono più grandi). */
  altezza(i: number): number {
    return this.aspetto[this.tipo[i]].testa * (this.elite[i] ? ELITE.dimensione : 1);
  }

  /** Il Mietitore in campo (−1 se non c'è). */
  mietitore(): number {
    for (let i = 0; i < this.numero; i++) if (this.tipo[i] === ID_MIETITORE) return i;
    return -1;
  }

  /** Riempie il campo di nemici in un colpo: per la prova delle prestazioni. */
  riempi(quanti: number, secondi: number, gx: number, gy: number, mezzaL: number, mezzaA: number): void {
    while (this.numero < Math.min(quanti, CAPIENZA)) this.nasci(secondi, gx, gy, 0, 0, mezzaL, mezzaA);
  }

  /** Disegna: posizioni arrotondate al pixel, profondità secondo i piedi, niente disegno fuori schermo; (gx, gy) è il personaggio. */
  disegna(cam: Phaser.Cameras.Scene2D.Camera, margine: number, gx: number, gy: number): void {
    const sx = cam.scrollX - margine;
    const sy = cam.scrollY - margine;
    const ex = cam.scrollX + cam.width + margine;
    const ey = cam.scrollY + cam.height + margine * 2;
    this.simboli.inizio();
    const chiaro = Math.round(255 * COLPI.lampoNemicoPesanti) * 0x010101; // grigio da aggiungere ai pesanti colpiti
    const posti = this.brutiStato.length;
    let seth = -1, elite = 0, bruti = 0;
    for (let i = 0; i < this.numero; i++) {
      const s = this.sprite[i];
      const x = Math.round(this.x[i]);
      const y = Math.round(this.y[i]);
      const visibile = x > sx && x < ex && y > sy && y < ey;
      s.setVisible(visibile);
      if (!visibile) continue;
      s.setPosition(x, y).setDepth(y).setFlipX(this.versoSinistra[i] === 1);
      const pesante = this.elite[i] === 1 || this.tipo[i] === ID_MIETITORE || NEMICI[this.tipo[i]].pesante;
      if (this.lampo[i] > 0 && pesante) {
        // bruti, élite e Seth colpiti si schiariscono e basta: la sagoma resta visibile
        s.setTint(chiaro).setTintMode(Phaser.TintModes.ADD);
      } else if (this.lampo[i] > 0 || (this.fase[i] === 1 && Math.floor(this.faseTempo[i] * 10) % 2 === 0)) {
        // colpito: bianco; il Mietitore che sta per scattare pulsa di rosso
        s.setTint(this.lampo[i] > 0 ? 0xffffff : 0xc2412d).setTintMode(Phaser.TintModes.FILL);
      } else if (this.elite[i]) {
        s.setTint(ELITE.alone).setTintMode(Phaser.TintModes.ADD);
      } else if (s.tintMode !== Phaser.TintModes.MULTIPLY) {
        s.clearTint();
      }
      // lo stato si legge dal simbolo solo su bruti, élite e Seth; sui comuni non si mostra
      if (!pesante || !this.statoDaMostrare(i)) continue;
      if (this.tipo[i] === ID_MIETITORE) seth = i;
      else if (this.elite[i]) {
        if (elite < posti) this.eliteStato[elite++] = i;
      } else {
        const d = (x - gx) * (x - gx) + (y - gy) * (y - gy);
        if (bruti === posti && (!posti || d >= this.distanzaStato[bruti - 1])) continue;
        let k = bruti < posti ? bruti++ : posti - 1;
        for (; k > 0 && this.distanzaStato[k - 1] > d; k--) {
          this.distanzaStato[k] = this.distanzaStato[k - 1];
          this.brutiStato[k] = this.brutiStato[k - 1];
        }
        this.distanzaStato[k] = d;
        this.brutiStato[k] = i;
      }
    }
    // precedenza: prima Seth, poi le élite, poi i bruti più vicini; oltre il massimo non si disegnano
    if (seth >= 0) this.mostraSimbolo(seth);
    for (let k = 0; k < elite; k++) this.mostraSimbolo(this.eliteStato[k]);
    for (let k = 0; k < bruti; k++) this.mostraSimbolo(this.brutiStato[k]);
    this.simboli.fine();
  }

  /** L'affinità da mostrare sul nemico i (0 = nessuna); l'Interramento è la lapide, come Sepolto. */
  private statoDaMostrare(i: number): number {
    return this.ultimoStato[i] || (this.sInterrato[i] > 0 ? TERRA : 0);
  }

  private mostraSimbolo(i: number): void {
    this.simboli.mostra(this.statoDaMostrare(i), Math.round(this.x[i]), Math.round(this.y[i]) - this.aspetto[this.tipo[i]].testa);
  }

  private nasci(secondi: number, gx: number, gy: number, dirX: number, dirY: number, mezzaL: number, mezzaA: number, tipoScelto = -1): number {
    const i = this.numero++;
    const t = tipoScelto >= 0 ? tipoScelto : this.scegliTipo(secondi);
    const tipo = NEMICI[t];
    const m = secondi / 60;
    this.tipo[i] = t;
    this.id[i] = this.prossimoId++;
    this.segno[i] = 0;
    this.raggio[i] = tipo.raggio;
    const oltre = Math.max(0, m - DIFFICOLTA.saluteDopo);
    this.salute[i] = this.saluteMassima[i] = tipo.salute * (1 + DIFFICOLTA.salutePerMinuto * m + DIFFICOLTA.saluteAccelera * oltre * oltre);
    this.anime[i] = tipo.anime;
    this.elite[i] = 0;
    this.fase[i] = this.mossa[i] = this.volta[i] = this.branco[i] = 0;
    this.fianco[i] = (this.caso.numero() < 0.5 ? -1 : 1) * (IA.accerchia.angolo[0] + this.caso.numero() * (IA.accerchia.angolo[1] - IA.accerchia.angolo[0]));
    this.danno[i] = tipo.danno * (1 + DIFFICOLTA.dannoPerMinuto * m);
    this.velocita[i] = tipo.velocita * (1 + (this.caso.numero() * 2 - 1) * DIFFICOLTA.variazioneVelocita);
    this.respintaX[i] = this.respintaY[i] = this.lentoPer[i] = this.lampo[i] = this.pausaLampo[i] = this.pausaFalce[i] = this.pausaNube[i] = this.pausaPozza[i] = 0;
    this.sAbbagliato[i] = this.sConsacrato[i] = this.sMaledetto[i] = this.sSepolto[i] = this.sInterrato[i] = this.pausaSepolto[i] = this.fermo[i] = 0;
    this.ultimoStato[i] = this.rivelato[i] = 0;
    this.posiziona(i, gx, gy, dirX, dirY, mezzaL, mezzaA);

    const a = this.aspetto[t];
    const s = this.sprite[i];
    s.setTexture(tipo.sprite).setOrigin(0.5, a.piedi).setScale(a.ingrandimento).setActive(true).clearTint();
    const anim = s.scene.anims.get(`${tipo.sprite}:walk`);
    if (anim) s.play({ key: anim.key, startFrame: this.caso.intero(0, anim.frames.length - 1) });
    return i;
  }

  /** Movimento del Mietitore; restituisce true se ha già mosso lui (preavviso, mossa, pausa dopo la mossa). */
  private muoviMietitore(i: number, dt: number, dx: number, dy: number, d: number, gx: number, gy: number, secondi: number): boolean {
    this.faseTempo[i] -= dt;
    if (this.faseTempo[i] <= 0) {
      if (this.fase[i] === 0) this.preparaMossa(i, dx, dy, d, gx, gy);
      else if (this.fase[i] === 1) this.faiMossa(i, dx, dy, d, secondi, gx, gy);
      else {
        this.fase[i] = 0;
        this.faseTempo[i] = this.camminata(i);
        this.sprite[i].play(`${NEMICI[ID_MIETITORE].sprite}:walk`, true);
      }
    }
    if (this.fase[i] === 1) return true;
    if (this.fase[i] === 2) {
      if (this.mossa[i] === SCATTO) {
        const v = this.velocita[i] * MIETITORE.velocitaScatto;
        this.x[i] += this.scattoX[i] * v * dt;
        this.y[i] += this.scattoY[i] * v * dt;
        this.versoSinistra[i] = this.scattoX[i] < 0 ? 1 : 0;
      }
      return true;
    }
    return false;
  }

  /** Secondi di cammino prima della prossima mossa (meno per il Mietitore del minuto 10). */
  private camminata(i: number): number {
    const c = MIETITORE.cammina[0] + this.caso.numero() * (MIETITORE.cammina[1] - MIETITORE.cammina[0]);
    return this.volta[i] ? c * MIETITORE.camminaSecondo : c;
  }

  /** Sceglie una mossa e mostra il preavviso: pulsa di rosso, e per falciata e chiamata compaiono i cerchi a terra. */
  private preparaMossa(i: number, dx: number, dy: number, d: number, gx: number, gy: number): void {
    let totale = 0;
    for (const p of this.pesoMosse) totale += p;
    let r = this.caso.numero() * totale;
    let m = 0;
    while (m < MOSSE.length - 1 && (r -= this.pesoMosse[m]) >= 0) m++;
    this.mossa[i] = m;
    this.fase[i] = 1;
    this.sprite[i].play(`${NEMICI[ID_MIETITORE].sprite}:special`, true);
    const forza = this.danno[i] / NEMICI[ID_MIETITORE].danno; // il danno delle mosse cresce con il tempo come il suo
    if (m === SCATTO) {
      this.faseTempo[i] = MIETITORE.carica;
      this.scattoX[i] = d > 0.5 ? dx / d : 1; // scatterà verso dove sei adesso
      this.scattoY[i] = d > 0.5 ? dy / d : 0;
    } else if (m === FALCIATA) {
      const f = MIETITORE.falciata;
      this.faseTempo[i] = f.carica;
      this.minacce.area(this.x[i], this.y[i], f.raggio, f.carica, f.danno * forza);
    } else if (m === FALCI) {
      this.faseTempo[i] = MIETITORE.falci.carica;
    } else {
      const c = MIETITORE.chiamata;
      this.faseTempo[i] = c.carica;
      const giro = this.caso.numero() * Math.PI * 2;
      for (let k = 0; k < c.quanti; k++) {
        const a = giro + (k / c.quanti) * Math.PI * 2;
        this.chiamataX[k] = gx + Math.cos(a) * c.distanza;
        this.chiamataY[k] = gy + Math.sin(a) * c.distanza;
        this.minacce.area(this.chiamataX[k], this.chiamataY[k], NEMICI[ID_CHIAMATA].raggio * 1.4, c.carica, 0);
      }
    }
  }

  /** Allo scadere del preavviso: scatta, lancia le falci o fa uscire i morti (la falciata colpisce da sola). */
  private faiMossa(i: number, dx: number, dy: number, d: number, secondi: number, gx: number, gy: number): void {
    this.fase[i] = 2;
    const m = this.mossa[i];
    this.faseTempo[i] = m === SCATTO ? MIETITORE.scatto : MIETITORE.riprende;
    if (m === FALCI) {
      const f = MIETITORE.falci;
      const forza = this.danno[i] / NEMICI[ID_MIETITORE].danno;
      const verso = d > 0.5 ? Math.atan2(dy, dx) : 0;
      for (let k = 0; k < f.quante; k++) {
        const a = verso + (f.quante > 1 ? k / (f.quante - 1) - 0.5 : 0) * f.ventaglio;
        this.minacce.falce(this.x[i], this.y[i], Math.cos(a) * f.velocita, Math.sin(a) * f.velocita, f.raggio, f.danno * forza, f.durata);
      }
    } else if (m === CHIAMATA) {
      for (let k = 0; k < MIETITORE.chiamata.quanti && this.numero < CAPIENZA; k++) {
        const n = this.nasci(secondi, gx, gy, 0, 0, 0, 0, ID_CHIAMATA);
        this.x[n] = this.chiamataX[k];
        this.y[n] = this.chiamataY[k];
      }
    }
  }

  /** Toglie il nemico i spostando l'ultimo al suo posto (con il suo sprite). */
  private togli(i: number): void {
    const u = --this.numero;
    const s = this.sprite[i];
    s.stop();
    s.setVisible(false).setActive(false);
    if (i === u) return;
    for (const a of this.campi) a[i] = a[u];
    this.tipo[i] = this.tipo[u];
    this.elite[i] = this.elite[u];
    this.fase[i] = this.fase[u];
    this.mossa[i] = this.mossa[u];
    this.volta[i] = this.volta[u];
    this.branco[i] = this.branco[u];
    this.ultimoStato[i] = this.ultimoStato[u];
    this.rivelato[i] = this.rivelato[u];
    this.id[i] = this.id[u];
    this.segno[i] = this.segno[u];
    this.versoSinistra[i] = this.versoSinistra[u];
    this.sprite[i] = this.sprite[u];
    this.sprite[u] = s;
  }

  /** Mette il nemico i appena fuori dallo schermo: a caso, o davanti al giocatore se si sta muovendo. */
  private posiziona(i: number, gx: number, gy: number, dirX: number, dirY: number, mezzaL: number, mezzaA: number): void {
    const angolo = dirX || dirY
      ? Math.atan2(dirY, dirX) + (this.caso.numero() * 2 - 1) * COMPARSA.ventaglio
      : this.caso.numero() * Math.PI * 2;
    const c = Math.cos(angolo);
    const s = Math.sin(angolo);
    // distanza dal centro al bordo dello schermo in quella direzione, più il margine
    const bordo = Math.min(Math.abs(c) > 1e-6 ? mezzaL / Math.abs(c) : Infinity, Math.abs(s) > 1e-6 ? mezzaA / Math.abs(s) : Infinity);
    const d = bordo + COMPARSA.margine;
    this.x[i] = gx + c * d;
    this.y[i] = gy + s * d;
  }

  private scegliTipo(secondi: number): number {
    const riga = COPIONE[Math.min(COPIONE.length - 1, Math.floor(secondi / 60))];
    let totale = 0;
    for (const t of NEMICI) totale += riga[t.id] ?? 0;
    let r = this.caso.numero() * totale;
    for (let t = 0; t < NEMICI.length; t++) {
      r -= riga[NEMICI[t].id] ?? 0;
      if (r < 0) return t;
    }
    return 0;
  }

  private separa(j: number): void {
    const i = this.corrente;
    if (j === i || NEMICI[this.tipo[j]].attraversa) return;
    const dx = this.x[i] - this.x[j];
    const dy = this.y[i] - this.y[j];
    const minima = (this.raggio[i] + this.raggio[j]) * SEPARAZIONE.tolleranza;
    const d2 = dx * dx + dy * dy;
    if (d2 >= minima * minima) return;
    const d = Math.sqrt(d2);
    if (d < 0.01) {
      this.x[i] += i < j ? -0.5 : 0.5; // sovrapposti esattamente: li scosta un poco
      return;
    }
    const spinta = ((minima - d) / d) * SEPARAZIONE.forza * 0.5;
    this.x[i] += dx * spinta;
    this.y[i] += dy * spinta;
  }
}
