/*
 * Limite ai disegni: pixel art con logica a 60 passi, disegnare a 90 o 120 costerebbe batteria e calore senza vantaggi.
 * Il valore è in FOTOGRAMMI (src/data/mondo.ts) e vale subito, anche se cambiato dal LAB; a 0 non c'è limite.
 * Il limite di Phaser (fps.limit) non va usato: conta due volte il tempo residuo e fa correre notte e animazioni.
 * Qui si salta il passo del gioco e al primo passo buono si consegna tutto il tempo davvero trascorso.
 * Il margine serve agli schermi a 60 Hz: con 60 esatti, un fotogramma da 16,6 ms verrebbe saltato, creando uno scatto.
 */
import type Phaser from 'phaser';
import { FOTOGRAMMI } from '../data/mondo';

/** Da chiamare subito dopo aver creato il gioco, prima che parta il suo ciclo. */
export function limitaDisegni(gioco: Phaser.Game): void {
  const passo = gioco.step.bind(gioco);
  let credito = 0; // decide quando disegnare
  let trascorso = 0; // tempo vero da consegnare al gioco
  gioco.step = (tempo: number, delta: number): void => {
    if (FOTOGRAMMI.limite <= 0) return passo(tempo, delta);
    const ogni = 1000 / (FOTOGRAMMI.limite + FOTOGRAMMI.margine);
    credito += delta;
    trascorso += delta;
    if (credito < ogni) return;
    credito %= ogni;
    const dare = trascorso;
    trascorso = 0;
    passo(tempo, dare);
  };
}

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
