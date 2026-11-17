/*
 * La mappa del Mondo (decisioni di Edoardo del 17/11): genera con il seme le stanze di una Veglia, alla The Binding of
 * Isaac. Si parte dall'ingresso al centro della griglia e la mappa cresce di lato in lato; una stanza nuova nasce solo se
 * tocca una stanza sola, così la mappa resta fatta di corridoi e rami (niente blocchi né anelli). Poi:
 * - il Boss è la stanza più lontana dall'ingresso, in un vicolo cieco (una porta sola);
 * - il Campanaro sta a metà strada, mai attaccato all'ingresso né al Boss;
 * - le stanze attaccate all'ingresso danno gli Echi d'inizio, le altre una ricompensa a caso (MAPPA.ricompense).
 * Ingresso vuoto e sicuro con le porte già aperte. Tutto è dato semplice (numeri e testi), pronto per il salvataggio.
 * Numeri in MAPPA (src/data/mappa.ts). controllaMappa dice quali regole una mappa non rispetta (npm run prova).
 */
import { MAPPA } from '../data/mappa';
import { Caso } from './caso';
import type { Ricompensa } from './porte';

export type TipoStanzaMappa = 'ingresso' | 'combattimento' | 'campanaro' | 'boss';
/** I quattro lati, nell'ordine di StanzaMappa.vicine. */
export type Lato = 'alto' | 'destra' | 'basso' | 'sinistra';
export const LATI: readonly Lato[] = ['alto', 'destra', 'basso', 'sinistra'];
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

export interface StanzaMappa {
  x: number; // casella della griglia (0 a sinistra)
  y: number; // casella della griglia (0 in alto)
  tipo: TipoStanzaMappa;
  /** da dove pescano le carte quando la si ripulisce: null per ingresso e Boss */
  ricompensa: Ricompensa | 'echi' | null;
  /** quante porte bisogna attraversare dall'ingresso per arrivarci */
  distanza: number;
  /** la stanza attaccata su ogni lato (alto, destra, basso, sinistra): il suo indice, -1 se lì c'è muro */
  vicine: [number, number, number, number];
  visitata: boolean;
  ripulita: boolean;
}

export interface Mappa {
  seme: number;
  stanze: StanzaMappa[];
  ingresso: number;
  campanaro: number;
  boss: number;
}

/** Il lato opposto: chi esce a destra entra dalla porta di sinistra. */
export function opposto(lato: number): number {
  return (lato + 2) % 4;
}

/** La mappa di una Veglia: a parità di seme, sempre la stessa. */
export function generaMappa(seme: number): Mappa {
  const caso = new Caso((seme ^ 0x6a09e667) >>> 0); // un caso tutto suo: non sposta ondate, carte e rompibili
  for (let t = 0; t < MAPPA.tentativi; t++) {
    const m = prova(caso, seme);
    if (m) return m;
  }
  return provaSenzaRegole(caso, seme);
}

/** Un tentativo: la mappa, o null se non rispetta le regole (troppo piccola, Boss senza vicolo cieco, niente Campanaro). */
function prova(caso: Caso, seme: number): Mappa | null {
  const celle = cresci(caso);
  if (!celle) return null;
  return completa(caso, seme, celle);
}

/** Solo per non restare mai senza mappa: la prima crescita qualsiasi, con il Boss nella stanza più lontana. */
function provaSenzaRegole(caso: Caso, seme: number): Mappa {
  const celle = cresci(caso, true) ?? [[MAPPA.griglia.larghezza >> 1, MAPPA.griglia.altezza >> 1]];
  return completa(caso, seme, celle, true) as Mappa;
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
function completa(caso: Caso, seme: number, celle: [number, number][], comunque = false): Mappa | null {
  const indice = new Map<number, number>();
  celle.forEach(([x, y], i) => indice.set(y * 100 + x, i));
  const stanze: StanzaMappa[] = celle.map(([x, y]) => ({
    x, y, tipo: 'combattimento', ricompensa: null, distanza: -1, visitata: false, ripulita: false,
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
  // tipi e ricompense
  stanze[0].tipo = 'ingresso';
  stanze[0].visitata = stanze[0].ripulita = true; // vuota e sicura, con le porte già aperte
  stanze[capo].tipo = 'boss';
  if (campanaro >= 0) stanze[campanaro].tipo = 'campanaro';
  const pesi = Object.entries(MAPPA.ricompense) as [Ricompensa, number][];
  for (let i = 1; i < stanze.length; i++) {
    const s = stanze[i];
    if (s.tipo === 'boss') continue;
    s.ricompensa = s.distanza === 1 ? 'echi' : pesca(caso, pesi);
  }
  return { seme, stanze, ingresso: 0, campanaro, boss: capo };
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
  for (const s of S) {
    if (s.distanza === 1 && s.ricompensa !== 'echi') e.push("una stanza accanto all'ingresso non dà gli Echi");
    if (s.tipo !== 'ingresso' && s.tipo !== 'boss' && !s.ricompensa) e.push('una stanza senza ricompensa');
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
