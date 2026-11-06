/*
 * Contatore dei fotogrammi del Laboratorio: nell'angolo in alto a destra, in tutte le schermate, selezione compresa.
 * Ogni secondo mostra la media e il peggiore di quel secondo, in fotogrammi al secondo. Conta i disegni veri del gioco,
 * non i battiti dello schermo. Si accende dalla scheda Schermo.
 */
import type Phaser from 'phaser';

const CHIAVE = 'dl-lab-contatore';

let scritta: HTMLElement | null = null;
let fermaGiro: (() => void) | null = null;

const ricordato = (): boolean => {
  try { return localStorage.getItem(CHIAVE) === '1'; } catch { return false; }
};

export const contatoreAcceso = (): boolean => scritta !== null;

export function accendiContatore(gioco: Phaser.Game, acceso: boolean): void {
  try { localStorage.setItem(CHIAVE, acceso ? '1' : '0'); } catch { /* niente memoria */ }
  fermaGiro?.();
  fermaGiro = null;
  scritta?.remove();
  scritta = null;
  if (!acceso) return;
  const el = document.createElement('div');
  el.className = 'lab-contatore';
  el.textContent = '… fps';
  document.body.append(el);
  scritta = el;
  let ultimo = performance.now(), inizio = ultimo, fotogrammi = 0, peggiore = 0;
  const giro = (): void => {
    const ora = performance.now();
    peggiore = Math.max(peggiore, ora - ultimo);
    ultimo = ora;
    fotogrammi++;
    if (ora - inizio >= 1000) {
      el.textContent = `${Math.round((fotogrammi * 1000) / (ora - inizio))} fps · peggiore ${Math.round(1000 / Math.max(peggiore, 1))}`;
      inizio = ora;
      fotogrammi = 0;
      peggiore = 0;
    }
  };
  gioco.events.on('postrender', giro);
  fermaGiro = () => gioco.events.off('postrender', giro);
}

export function riprendiContatore(gioco: Phaser.Game): void {
  if (ricordato()) accendiContatore(gioco, true);
}
