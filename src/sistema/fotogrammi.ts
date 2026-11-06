/*
 * Misura dei disegni veri del gioco, non dei battiti dello schermo (Prova prestazioni).
 */
import type Phaser from 'phaser';

/** Chiama fai a ogni disegno vero, per tot secondi. Restituisce i tempi tra un disegno e l'altro, in millisecondi. */
export function misuraDisegni(gioco: Phaser.Game, secondi: number, fai?: (trascorsi: number) => void): Promise<Float64Array> {
  const tempi = new Float64Array(Math.ceil(secondi * 400));
  return new Promise((fine) => {
    const inizio = performance.now();
    let ultimo = inizio, n = 0;
    const disegno = (): void => {
      const ora = performance.now();
      if (n < tempi.length) tempi[n++] = ora - ultimo;
      ultimo = ora;
      fai?.((ora - inizio) / 1000);
      if (ora - inizio < secondi * 1000) return;
      gioco.events.off('postrender', disegno);
      fine(tempi.slice(0, n));
    };
    gioco.events.on('postrender', disegno);
  });
}
