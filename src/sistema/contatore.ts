/*
 * Contatore dei fotogrammi del Laboratorio: nell'angolo in alto a destra, in tutte le schermate, selezione compresa.
 * Ogni secondo mostra la media e il peggiore di quel secondo, in fotogrammi al secondo. Si accende dalla scheda Schermo.
 */
const CHIAVE = 'dl-lab-contatore';

let scritta: HTMLElement | null = null;
let attivo = 0;

const ricordato = (): boolean => {
  try { return localStorage.getItem(CHIAVE) === '1'; } catch { return false; }
};

export const contatoreAcceso = (): boolean => scritta !== null;

export function accendiContatore(acceso: boolean): void {
  try { localStorage.setItem(CHIAVE, acceso ? '1' : '0'); } catch { /* niente memoria */ }
  cancelAnimationFrame(attivo);
  scritta?.remove();
  scritta = null;
  if (!acceso) return;
  const el = document.createElement('div');
  el.className = 'lab-contatore';
  el.textContent = '… fps';
  document.body.append(el);
  scritta = el;
  let ultimo = performance.now(), inizio = ultimo, fotogrammi = 0, peggiore = 0;
  const giro = (ora: number): void => {
    peggiore = Math.max(peggiore, ora - ultimo);
    ultimo = ora;
    fotogrammi++;
    if (ora - inizio >= 1000) {
      el.textContent = `${Math.round((fotogrammi * 1000) / (ora - inizio))} fps · peggiore ${Math.round(1000 / Math.max(peggiore, 1))}`;
      inizio = ora;
      fotogrammi = 0;
      peggiore = 0;
    }
    attivo = requestAnimationFrame(giro);
  };
  attivo = requestAnimationFrame(giro);
}

export function riprendiContatore(): void {
  if (ricordato()) accendiContatore(true);
}
