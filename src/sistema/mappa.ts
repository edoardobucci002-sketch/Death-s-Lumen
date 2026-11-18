/*
 * La mappa del Mondo (decisioni di Edoardo del 17/11): genera con il seme le stanze di una Veglia, alla The Binding of
 * Isaac. Si parte dall'ingresso al centro della griglia e la mappa cresce di lato in lato; una stanza nuova nasce solo se
 * tocca una stanza sola, così la mappa resta fatta di corridoi e rami (niente blocchi né anelli). Poi:
 * - il Boss è la stanza più lontana dall'ingresso, in un vicolo cieco (una porta sola);
 * - il Campanaro sta a metà strada, mai attaccato all'ingresso né al Boss;
 * - l'ingresso ha almeno MAPPA.porteIngresso porte;
 * - la Sosta è la stanza da cui si entra nel Boss (18/11), lontana almeno 2 porte dall'ingresso;
 * - il tesoro sta in un vicolo cieco (non il Boss né il Campanaro), lontano almeno 2 porte dall'ingresso (18/11);
 * - le stanze attaccate all'ingresso danno gli Echi d'inizio, le altre di combattimento una ricompensa a caso (MAPPA.ricompense).
 * Tesoro e Sosta sono vuoti, senza ricompensa (hanno il loro oggetto: STANZE_SPECIALI in src/data/mappa.ts).
 * Porte chiuse a chiave (18/11): da MAPPA.serrate.minimo a .massimo stanze «serrate», sempre vicoli ciechi (mai la strada per
 * il Boss): il tesoro sempre, le altre sono stanze di combattimento con la ricompensa doppia. Una stanza sempre aperta ha
 * come ricompensa la chiave sicura. La porta delle candele (18/11) porta a un altro vicolo cieco con la ricompensa doppia;
 * le sue 3 candele stanno in tre stanze di combattimento sempre aperte.
 * Ingresso vuoto e sicuro con le porte già aperte. Tutto è dato semplice (numeri e testi), pronto per il salvataggio.
 * Numeri in MAPPA (src/data/mappa.ts). controllaMappa dice quali regole una mappa non rispetta (npm run prova).
 */
import { MAPPA } from '../data/mappa';
import { Caso } from './caso';
import { MURI, type Muro, type Ricompensa } from './porte';

export type TipoStanzaMappa = 'ingresso' | 'combattimento' | 'campanaro' | 'boss' | 'tesoro' | 'sosta';
/** I quattro lati, nell'ordine di StanzaMappa.vicine: gli stessi muri delle porte. */
export type Lato = Muro;
export const LATI: readonly Lato[] = MURI;
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

export interface StanzaMappa {
  x: number; // casella della griglia (0 a sinistra)
  y: number; // casella della griglia (0 in alto)
  tipo: TipoStanzaMappa;
  /** da dove pescano le carte quando la si ripulisce (o la chiave sicura): null per ingresso, Boss, tesoro e Sosta */
  ricompensa: Ricompensa | 'echi' | 'chiave' | null;
  /** la porta che porta qui è chiusa a chiave, finché non la si apre (18/11) */
  serrata: boolean;
  /** dietro una porta chiusa a chiave: a stanza ripulita due giri di carte (PERCORSO.giriDoppia) */
  doppia: boolean;
  /** la chiave sicura di questa stanza è già stata raccolta */
  chiavePresa: boolean;
  /** dietro la porta delle candele (18/11): si apre quando le 3 candele del Mondo sono accese */
  candele: boolean;
  /** la candela di questa stanza: 0 nessuna, 1 spenta, 2 accesa */
  candela: number;
  /** quante porte bisogna attraversare dall'ingresso per arrivarci */
  distanza: number;
  /** la stanza attaccata su ogni lato (alto, destra, basso, sinistra): il suo indice, -1 se lì c'è muro */
  vicine: [number, number, number, number];
  visitata: boolean;
  /** ripulita (e con le porte aperte); per tesoro e Sosta: il loro oggetto è già stato usato */
  ripulita: boolean;
  /** i rompibili già rotti (un bit per ognuno, nell'ordine in cui la stanza li mette): tornando restano rotti */
  rotti: number;
}

export interface Mappa {
  seme: number;
  stanze: StanzaMappa[];
  ingresso: number;
  campanaro: number;
  boss: number;
  tesoro: number; // -1 solo nelle mappe di riserva senza regole
  sosta: number;
}

/** Il lato opposto: chi esce a destra entra dalla porta di sinistra. */
export function opposto(lato: number): number {
  return (lato + 2) % 4;
}

/** Il LAB può mettere la porta delle candele in ogni Veglia del Lampionaio (scheda Stanze → «Candele in ogni Veglia»). */
export const CANDELE_LAB = { sempre: false };

/**
 * La mappa di una Veglia: a parità di seme (e di personaggio), sempre la stessa. personaggio: chi gioca; la porta delle
 * candele c'è solo per il Lampionaio, a caso (MAPPA.candele.probabilita).
 */
export function generaMappa(seme: number, personaggio = ''): Mappa {
  const caso = new Caso((seme ^ 0x6a09e667) >>> 0); // un caso tutto suo: non sposta ondate, carte e rompibili
  const C = MAPPA.candele, candele = personaggio === C.personaggio && (CANDELE_LAB.sempre || new Caso((seme ^ 0x3c6ef372) >>> 0).numero() < C.probabilita);
  for (let t = 0; t < MAPPA.tentativi; t++) {
    const m = prova(caso, seme, candele);
    if (m) return m;
  }
  return provaSenzaRegole(caso, seme, candele);
}

/** Un tentativo: la mappa, o null se non rispetta le regole (troppo piccola, Boss senza vicolo cieco, niente Campanaro). */
function prova(caso: Caso, seme: number, candele: boolean): Mappa | null {
  const celle = cresci(caso);
  if (!celle) return null;
  return completa(caso, seme, celle, candele);
}

/** Solo per non restare mai senza mappa: la prima crescita qualsiasi, con il Boss nella stanza più lontana. */
function provaSenzaRegole(caso: Caso, seme: number, candele: boolean): Mappa {
  const celle = cresci(caso, true) ?? [[MAPPA.griglia.larghezza >> 1, MAPPA.griglia.altezza >> 1]];
  return completa(caso, seme, celle, candele, true) as Mappa;
}

/** Fa crescere la mappa dall'ingresso: le caselle occupate, l'ingresso per primo; null se non arriva al numero scelto. */
function cresci(caso: Caso, comunque = false): [number, number][] | null {
  const { larghezza: L, altezza: A } = MAPPA.griglia;
  const quante = caso.intero(MAPPA.stanze.minimo, MAPPA.stanze.massimo);
  const occupata = new Uint8Array(L * A);
  const celle: [number, number][] = [[L >> 1, A >> 1]];
  occupata[(A >> 1) * L + (L >> 1)] = 1;
  const libera = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < L && y < A && !occupata[y * L + x];
  // a ogni giro ogni stanza già nata prova ad aprirne di nuove; se un giro intero non ne aggiunge, si ricomincia da capo
  for (let giro = 0; giro < 50 && celle.length < quante; giro++) {
    let aggiunte = 0;
    for (let i = 0; i < celle.length && celle.length < quante; i++) {
      const [cx, cy] = celle[i];
      for (const l of mescola([0, 1, 2, 3], caso)) {
        if (celle.length >= quante) break;
        const nx = cx + DX[l], ny = cy + DY[l];
        if (!libera(nx, ny) || caso.numero() >= MAPPA.crescita) continue;
        // la casella nuova deve toccare una stanza sola (quella da cui nasce): niente blocchi né anelli
        let tocca = 0;
        for (let k = 0; k < 4; k++) {
          const vx = nx + DX[k], vy = ny + DY[k];
          if (vx >= 0 && vy >= 0 && vx < L && vy < A && occupata[vy * L + vx]) tocca++;
        }
        if (tocca > 1) continue;
        occupata[ny * L + nx] = 1;
        celle.push([nx, ny]);
        aggiunte++;
      }
    }
    if (!aggiunte && !comunque) return null;
  }
  return celle.length >= quante || comunque ? celle : null;
}

/** Dalle caselle alla mappa: porte, distanze, Boss, Campanaro e ricompense. null se le regole non tornano. */
function completa(caso: Caso, seme: number, celle: [number, number][], candele: boolean, comunque = false): Mappa | null {
  const indice = new Map<number, number>();
  celle.forEach(([x, y], i) => indice.set(y * 100 + x, i));
  const stanze: StanzaMappa[] = celle.map(([x, y]) => ({
    x, y, tipo: 'combattimento', ricompensa: null, distanza: -1, visitata: false, ripulita: false, rotti: 0, serrata: false, doppia: false, chiavePresa: false, candele: false, candela: 0,
    vicine: [0, 1, 2, 3].map((l) => indice.get((y + DY[l]) * 100 + x + DX[l]) ?? -1) as [number, number, number, number],
  }));
  // le distanze dall'ingresso, porta dopo porta
  stanze[0].distanza = 0;
  const coda = [0];
  for (let q = 0; q < coda.length; q++) {
    for (const v of stanze[coda[q]].vicine) {
      if (v >= 0 && stanze[v].distanza < 0) {
        stanze[v].distanza = stanze[coda[q]].distanza + 1;
        coda.push(v);
      }
    }
  }
  const porte = (s: StanzaMappa): number => s.vicine.filter((v) => v >= 0).length;
  if (porte(stanze[0]) < MAPPA.porteIngresso && !comunque) return null;
  // il Boss: la stanza più lontana, in un vicolo cieco
  const lontana = Math.max(...stanze.map((s) => s.distanza));
  const boss = scegli(caso, stanze.map((_, i) => i).filter((i) => i > 0 && stanze[i].distanza === lontana && porte(stanze[i]) === 1));
  if (boss < 0 && !comunque) return null;
  const capo = boss >= 0 ? boss : stanze.length - 1;
  // il Campanaro: a metà strada, mai accanto all'ingresso né al Boss
  const meta = Math.round(stanze[capo].distanza * MAPPA.campanaro);
  const adatte = stanze.map((_, i) => i).filter((i) => i !== capo && stanze[i].distanza >= 2 && !stanze[capo].vicine.includes(i));
  const scarto = Math.min(...adatte.map((i) => Math.abs(stanze[i].distanza - meta)));
  const campanaro = scegli(caso, adatte.filter((i) => Math.abs(stanze[i].distanza - meta) === scarto));
  if (campanaro < 0 && !comunque) return null;
  // la Sosta: la stanza da cui si entra nel Boss
  const sosta = stanze[capo].vicine.find((v) => v >= 0) ?? -1;
  if ((sosta < 0 || stanze[sosta].distanza < 2 || sosta === campanaro) && !comunque) return null;
  // il tesoro: un vicolo cieco qualsiasi, a più di una porta dall'ingresso, che non sia già di un capo o della Sosta
  const tesoro = scegli(caso, stanze.map((_, i) => i).filter((i) => i !== capo && i !== campanaro && i !== sosta && stanze[i].distanza >= 2 && porte(stanze[i]) === 1));
  if (tesoro < 0 && !comunque) return null;
  // tipi e ricompense
  stanze[0].tipo = 'ingresso';
  stanze[0].visitata = stanze[0].ripulita = true; // vuota e sicura, con le porte già aperte
  stanze[capo].tipo = 'boss';
  if (campanaro >= 0) stanze[campanaro].tipo = 'campanaro';
  if (sosta > 0 && sosta !== campanaro) stanze[sosta].tipo = 'sosta';
  if (tesoro > 0) stanze[tesoro].tipo = 'tesoro';
  const pesi = Object.entries(MAPPA.ricompense) as [Ricompensa, number][];
  for (let i = 1; i < stanze.length; i++) {
    const s = stanze[i];
    if (s.tipo === 'boss' || s.tipo === 'tesoro' || s.tipo === 'sosta') continue;
    s.ricompensa = s.distanza === 1 ? 'echi' : pesca(caso, pesi);
  }
  // le porte chiuse a chiave (18/11): il tesoro, più altri vicoli ciechi di combattimento con la ricompensa doppia
  if (tesoro > 0) stanze[tesoro].serrata = true;
  const vicoli = mescola(stanze.map((_, i) => i).filter((i) => stanze[i].tipo === 'combattimento' && stanze[i].distanza >= 2 && porte(stanze[i]) === 1), caso);
  const altre = Math.min(vicoli.length, caso.intero(MAPPA.serrate.minimo, MAPPA.serrate.massimo) - 1);
  for (let k = 0; k < altre; k++) stanze[vicoli[k]].serrata = stanze[vicoli[k]].doppia = true;
  // la porta delle candele (18/11): un altro vicolo cieco, con la ricompensa doppia; le 3 candele in stanze sempre aperte
  if (candele) {
    if (vicoli.length <= altre && !comunque) return null;
    if (vicoli.length > altre) stanze[vicoli[altre]].candele = stanze[vicoli[altre]].doppia = true;
    const conCandela = mescola(stanze.map((_, i) => i).filter((i) => stanze[i].tipo === 'combattimento' && !stanze[i].serrata && !stanze[i].candele), caso);
    if (conCandela.length < MAPPA.candele.quante && !comunque) return null;
    for (let k = 0; k < Math.min(MAPPA.candele.quante, conCandela.length); k++) stanze[conCandela[k]].candela = 1;
  }
  // la chiave sicura: la ricompensa di una stanza di combattimento sempre aperta, lontana dall'ingresso
  const aperta = scegli(caso, stanze.map((_, i) => i).filter((i) => stanze[i].tipo === 'combattimento' && !stanze[i].serrata && !stanze[i].candele && stanze[i].distanza >= MAPPA.chiaveSicura.distanzaMinima));
  if (aperta < 0 && !comunque) return null;
  if (aperta >= 0) stanze[aperta].ricompensa = 'chiave';
  return { seme, stanze, ingresso: 0, campanaro, boss: capo, tesoro: stanze[tesoro]?.tipo === 'tesoro' ? tesoro : -1, sosta: stanze[sosta]?.tipo === 'sosta' ? sosta : -1 };
}

/**
 * Le regole che ogni mappa deve rispettare (decisioni del 17/11): l'elenco di quelle violate, vuoto se va tutto bene.
 * Le controlla npm run prova su mille semi.
 */
export function controllaMappa(m: Mappa): string[] {
  const e: string[] = [], S = m.stanze, n = S.length;
  if (n < MAPPA.stanze.minimo || n > MAPPA.stanze.massimo) e.push(`${n} stanze`);
  if (S[m.ingresso]?.tipo !== 'ingresso' || S[m.ingresso].distanza !== 0) e.push('ingresso sbagliato');
  if (S.some((s) => s.distanza < 0)) e.push('una stanza non si raggiunge');
  if (S[m.ingresso] && S[m.ingresso].vicine.filter((v) => v >= 0).length < MAPPA.porteIngresso) e.push("l'ingresso ha troppo poche porte");
  for (let i = 0; i < n; i++) {
    S[i].vicine.forEach((v, l) => {
      if (v >= 0 && S[v].vicine[opposto(l)] !== i) e.push(`porta senza ritorno tra ${i} e ${v}`);
    });
  }
  const B = S[m.boss], lontana = Math.max(...S.map((s) => s.distanza));
  if (!B || B.tipo !== 'boss') e.push('niente Boss');
  else {
    if (B.distanza !== lontana) e.push('il Boss non è la stanza più lontana');
    if (B.vicine.filter((v) => v >= 0).length !== 1) e.push('il Boss non è in un vicolo cieco');
  }
  const C = S[m.campanaro];
  if (!C || C.tipo !== 'campanaro') e.push('niente Campanaro');
  else {
    if (C.distanza < 2) e.push("il Campanaro è attaccato all'ingresso");
    if (B && B.vicine.includes(m.campanaro)) e.push('il Campanaro è attaccato al Boss');
  }
  if (S.filter((s) => s.tipo === 'campanaro').length > 1 || S.filter((s) => s.tipo === 'boss').length > 1) e.push('capi doppi');
  const T = S[m.tesoro], So = S[m.sosta];
  if (!T || T.tipo !== 'tesoro' || S.filter((s) => s.tipo === 'tesoro').length !== 1) e.push('niente tesoro (o più di uno)');
  else if (T.vicine.filter((v) => v >= 0).length !== 1 || T.distanza < 2) e.push('il tesoro non è in un vicolo cieco lontano dall\'ingresso');
  if (!So || So.tipo !== 'sosta' || S.filter((s) => s.tipo === 'sosta').length !== 1) e.push('niente Sosta (o più di una)');
  else if (!B || !B.vicine.includes(m.sosta)) e.push('la Sosta non è la stanza prima del Boss');
  // porte chiuse a chiave (18/11): da 1 a 3, sempre vicoli ciechi, mai capi né Sosta; il tesoro sempre; una chiave sicura
  const serrate = S.filter((s) => s.serrata);
  if (serrate.length < MAPPA.serrate.minimo || serrate.length > MAPPA.serrate.massimo) e.push(`${serrate.length} porte chiuse a chiave`);
  if (serrate.some((s) => s.vicine.filter((v) => v >= 0).length !== 1 || s.tipo === 'boss' || s.tipo === 'campanaro' || s.tipo === 'sosta' || s.tipo === 'ingresso')) e.push('una porta chiusa a chiave non porta a un vicolo cieco qualsiasi');
  if (T && !T.serrata) e.push('il tesoro non è chiuso a chiave');
  if (serrate.some((s) => s.tipo === 'combattimento' && !s.doppia)) e.push('una stanza chiusa a chiave senza la ricompensa doppia');
  // la porta delle candele (18/11): una, verso un vicolo cieco di combattimento; 3 candele in stanze diverse sempre aperte
  // (la porta delle candele c'è solo in alcune Veglie del Lampionaio: o tutto, o niente)
  const dietro = S.filter((s) => s.candele);
  if (dietro.length > 1 || (dietro.length === 0 && S.some((s) => s.candela))) e.push(`${dietro.length} porte delle candele`);
  else if (dietro.length === 0) { /* niente candele in questa Veglia */ }
  else if (dietro[0].vicine.filter((v) => v >= 0).length !== 1 || dietro[0].tipo !== 'combattimento' || dietro[0].serrata || !dietro[0].doppia) e.push('la porta delle candele non porta a un vicolo cieco con la ricompensa doppia');
  const candele = S.filter((s) => s.candela);
  if (dietro.length && (candele.length !== MAPPA.candele.quante || candele.some((s) => s.tipo !== 'combattimento' || s.serrata || s.candele))) e.push(`${candele.length} candele, o in stanze sbagliate`);
  const chiavi = S.filter((s) => s.ricompensa === 'chiave');
  if (chiavi.length !== 1) e.push(`${chiavi.length} chiavi sicure`);
  else if (chiavi[0].serrata || chiavi[0].candele || chiavi[0].distanza < MAPPA.chiaveSicura.distanzaMinima || chiavi[0].tipo !== 'combattimento') e.push('la chiave sicura non è in una stanza sempre aperta');
  for (const s of S) {
    if (s.distanza === 1 && s.ricompensa !== 'echi') e.push("una stanza accanto all'ingresso non dà gli Echi");
    if ((s.tipo === 'combattimento' || s.tipo === 'campanaro') && !s.ricompensa) e.push('una stanza senza ricompensa');
    if ((s.tipo === 'tesoro' || s.tipo === 'sosta') && s.ricompensa) e.push(`${s.tipo} con una ricompensa`);
  }
  return e;
}

function mescola<T>(v: T[], caso: Caso): T[] {
  for (let i = v.length - 1; i > 0; i--) {
    const j = caso.intero(0, i);
    [v[i], v[j]] = [v[j], v[i]];
  }
  return v;
}

/** La stanza più vicina a «da» (per numero di porte) che rispetta la condizione: il suo indice, -1 se non ce n'è. */
export function piuVicina(m: Mappa, da: number, va: (s: StanzaMappa, i: number) => boolean, passa: (i: number) => boolean = () => true): number {
  const visto = new Uint8Array(m.stanze.length);
  visto[da] = 1;
  const coda = [da];
  for (let q = 0; q < coda.length; q++) {
    const i = coda[q];
    if (i !== da && va(m.stanze[i], i)) return i;
    if (i !== da && !passa(i)) continue; // da qui non si passa (ci si può solo arrivare)
    for (const v of m.stanze[i].vicine) {
      if (v >= 0 && !visto[v]) {
        visto[v] = 1;
        coda.push(v);
      }
    }
  }
  return -1;
}

/**
 * Il cammino più breve dalla stanza «da» alla stanza «a»: il lato della prima porta da prendere (-1 se si è già lì o se
 * non c'è strada). passa(i): se si può attraversare la stanza i per arrivare più in là (il bot evita il Campanaro).
 */
export function primoPasso(m: Mappa, da: number, a: number, passa: (i: number) => boolean = () => true): number {
  if (da === a) return -1;
  const prima = new Int16Array(m.stanze.length).fill(-1); // da quale stanza si è arrivati a ognuna
  prima[da] = da;
  const coda = [da];
  for (let q = 0; q < coda.length; q++) {
    const i = coda[q];
    for (const v of m.stanze[i].vicine) {
      if (v < 0 || prima[v] >= 0) continue;
      prima[v] = i;
      if (v === a) {
        let passo = v;
        while (prima[passo] !== da) passo = prima[passo];
        return m.stanze[da].vicine.indexOf(passo);
      }
      if (passa(v)) coda.push(v);
    }
  }
  return -1;
}

/** Un elemento a caso dell'elenco (-1 se è vuoto). */
function scegli(caso: Caso, v: number[]): number {
  return v.length ? v[caso.intero(0, v.length - 1)] : -1;
}

function pesca<T>(caso: Caso, pesi: [T, number][]): T {
  const tot = pesi.reduce((a, [, p]) => a + p, 0);
  let r = caso.numero() * tot;
  for (const [v, p] of pesi) if ((r -= p) < 0) return v;
  return pesi[pesi.length - 1][0];
}
