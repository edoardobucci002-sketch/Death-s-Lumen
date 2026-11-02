/*
 * Generatore del caso con seme (mulberry32): a parità di seme dà sempre gli stessi numeri.
 * Serve per riprodurre i bug e per le simulazioni. Non usare Math.random nel gioco.
 */
export class Caso {
  private stato: number;

  constructor(seme: number) {
    this.stato = seme >>> 0;
  }

  /** Numero tra 0 (compreso) e 1 (escluso). */
  numero(): number {
    let t = (this.stato = (this.stato + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Intero tra min e max, entrambi compresi. */
  intero(min: number, max: number): number {
    return min + Math.floor(this.numero() * (max - min + 1));
  }
}
