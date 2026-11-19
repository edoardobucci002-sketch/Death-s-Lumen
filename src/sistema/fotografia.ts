/**
 * Fotografia dello stato di un sistema, per il salvataggio della Veglia in corso (gioco a stanze, 19/11). Copia i numeri,
 * i sì/no e le scritte di un oggetto, le sue tabelle di numeri, i generatori del caso (il punto in cui sono arrivati) e
 * gli oggetti semplici che contiene (anche in elenco, come le stanze della mappa); salta sprite, pulsanti, funzioni e
 * riferimenti ad altri sistemi. Ripristinare rimette ogni valore al suo posto nello stesso oggetto: così chi lo usa
 * continua a vederlo. Ogni sistema nuovo nasce salvabile: basta che tenga il suo stato in campi semplici.
 */
import { Caso } from './caso';

type Valore = number | boolean | string | null | { i: string } | { t: (number | { i: string })[] } | { c: number } | { a: unknown[] } | { o: Foto } | { l: Foto[] };
export type Foto = { [chiave: string]: Valore };

const semplice = (v: unknown): v is object => v !== null && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const primitivo = (v: unknown): boolean => v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string';
// JSON perde Infinity e NaN: si scrivono come testo
const numero = (n: number): number | { i: string } => (Number.isFinite(n) ? n : { i: String(n) });
const daNumero = (v: unknown): unknown => (v !== null && typeof v === 'object' && 'i' in v ? Number((v as { i: string }).i) : v);

/** La fotografia di «o»: tutti i campi salvabili, tranne quelli in «salta» (o solo quelli in «solo»). */
export function fotografa(o: object, salta: readonly string[] = [], solo?: readonly string[]): Foto {
  const f: Foto = {};
  const r = o as Record<string, unknown>;
  for (const k of solo ?? Object.keys(o)) {
    if (salta.includes(k)) continue;
    const v = r[k];
    if (typeof v === 'number') f[k] = numero(v);
    else if (primitivo(v)) f[k] = v as Valore;
    else if (ArrayBuffer.isView(v) && !(v instanceof DataView)) f[k] = { t: Array.from(v as unknown as ArrayLike<number>, numero) };
    else if (v instanceof Caso) f[k] = { c: v.punto };
    else if (Array.isArray(v) && v.every(primitivo)) f[k] = { a: v.map((x) => (typeof x === 'number' ? numero(x) : x)) };
    else if (Array.isArray(v) && v.length > 0 && v.every(semplice)) f[k] = { l: v.map((x) => fotografa(x)) };
    else if (semplice(v)) f[k] = { o: fotografa(v) };
  }
  return f;
}

/** Un oggetto semplice nuovo da una fotografia (quando al suo posto oggi non c'è niente). */
function ricostruisci(f: Foto): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  ripristina(o, f);
  return o;
}

/** Rimette in «o» i valori della fotografia «f». */
export function ripristina(o: object, f: Foto): void {
  const r = o as Record<string, unknown>;
  for (const k of Object.keys(f)) {
    const v = f[k], ora = r[k];
    if (v === null || typeof v !== 'object' || 'i' in v) r[k] = daNumero(v);
    else if ('t' in v) {
      if (ArrayBuffer.isView(ora) && (ora as unknown as ArrayLike<number>).length === v.t.length) (ora as unknown as { set(a: number[]): void }).set(v.t.map((x) => daNumero(x) as number));
    } else if ('c' in v) {
      if (ora instanceof Caso) ora.riprendi(v.c);
    } else if ('a' in v) {
      const a = v.a.map(daNumero);
      if (Array.isArray(ora)) ora.splice(0, ora.length, ...a);
      else r[k] = a;
    } else if ('l' in v) {
      if (Array.isArray(ora) && ora.length === v.l.length && ora.every(semplice)) v.l.forEach((x, n) => ripristina(ora[n], x));
      else if (Array.isArray(ora)) ora.splice(0, ora.length, ...v.l.map(ricostruisci));
      else r[k] = v.l.map(ricostruisci);
    } else if ('o' in v) {
      if (semplice(ora)) ripristina(ora, v.o);
      else r[k] = ricostruisci(v.o);
    }
  }
}
