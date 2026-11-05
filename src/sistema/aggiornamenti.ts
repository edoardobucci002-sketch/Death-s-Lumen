/*
 * Link di prova: si accorge da solo che c'è una versione nuova, anche se la pagina è aperta da tempo o torna dal secondo piano.
 * Guarda versione.json quando si torna sulla pagina e a intervalli; poi ricarica, ma solo fuori dalla partita:
 * ricaricare nella pausa farebbe perdere la partita, che ancora non si salva. Finita la partita, ricarica nel menu.
 */
import { AGGIORNAMENTI } from '../data/mondo';
import { FIRMA } from './firma';

const CHIAVE = 'dl-ricarica-per'; // per quale versione si è già ricaricato: se la rete dà ancora la vecchia, niente giri a vuoto

export function avviaAggiornamenti(inPartita: () => boolean): void {
  let nuova = '';

  const ricarica = (): void => {
    if (!nuova || document.hidden || inPartita()) return;
    try {
      if (sessionStorage.getItem(CHIAVE) === nuova) return;
      sessionStorage.setItem(CHIAVE, nuova);
    } catch { /* niente memoria: si ricarica lo stesso */ }
    location.reload();
  };

  const controlla = async (): Promise<void> => {
    if (nuova) return ricarica();
    try {
      const r = await fetch(`versione.json?${Date.now()}`, { cache: 'no-store' });
      const firma = ((await r.json()) as { firma?: string }).firma;
      if (!firma || firma === FIRMA) return;
      nuova = firma;
      void (await navigator.serviceWorker?.getRegistration())?.update();
      ricarica();
    } catch { /* offline: si riprova la prossima volta */ }
  };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) void controlla(); });
  setInterval(() => void controlla(), AGGIORNAMENTI.ogni * 1000);
}
