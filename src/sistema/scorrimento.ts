/*
 * Scorrimento delle barre della salute (personaggio e Seth): il valore mostrato non salta al valore vero,
 * lo raggiunge in BARRA_SALUTE.scorrimento.durata secondi, così danno e cura si vedono scorrere.
 * Solo disegno: la salute vera cambia subito, come prima.
 */
import { BARRA_SALUTE } from '../data/mondo';

/** Un passo del valore mostrato verso quello vero; dt in secondi (0 = fermo, per esempio in pausa). */
export function scorri(vista: number, vera: number, massima: number, dt: number): number {
  const d = vera - vista;
  if (d === 0 || dt <= 0) return vista;
  const s = BARRA_SALUTE.scorrimento;
  const passo = Math.max(Math.abs(d) / s.durata, massima * s.minimo) * dt;
  return Math.abs(d) <= passo ? vera : vista + Math.sign(d) * passo;
}
