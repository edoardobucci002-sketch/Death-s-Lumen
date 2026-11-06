/*
 * Tasto Indietro fuori dall'app (link in Home e Chrome): in partita apre la pausa e basta, come nell'APK;
 * nei menu il browser fa quello che ha sempre fatto.
 * All'inizio della partita si aggiunge una sola voce alla cronologia. Indietro torna alla voce di prima: il gioco se ne
 * accorge e rimette il piede su quella già esistente con history.forward(), senza crearne di nuove a ogni pressione.
 * Si aggiunge solo dopo un tocco dell'utente: senza, Chrome salterebbe la voce e Indietro chiuderebbe la pagina.
 */
const PAUSA_USCITA = 100; // millisecondi: «Riprova» esce e rientra subito, e la voce deve restare dov'è

let azione: (() => boolean) | null = null;
let inPartita = false;
let suLaVoce = history.state?.dlPartita === true; // true anche se si ricarica la pagina mentre si è in partita
let tornando = false; // stiamo togliendo il piede dalla voce perché la partita è finita
let attesa = 0;

function aggiungiVoce(): void {
  document.removeEventListener('pointerdown', aggiungiVoce);
  document.removeEventListener('keydown', aggiungiVoce);
  if (!inPartita || suLaVoce) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
    document.addEventListener('pointerdown', aggiungiVoce);
    document.addEventListener('keydown', aggiungiVoce);
    return;
  }
  history.pushState({ dlPartita: true }, '');
  suLaVoce = true;
}

function cambiataVoce(e: PopStateEvent): void {
  suLaVoce = e.state?.dlPartita === true;
  if (tornando) {
    tornando = false;
    aggiungiVoce();
    return;
  }
  if (!inPartita) {
    if (suLaVoce) history.back(); // dal menu si è andati avanti sulla vecchia voce: non significa nulla
    return;
  }
  if (suLaVoce) return; // è il ritorno del forward qui sotto
  azione?.();
  history.forward();
}

/** Da chiamare una volta, solo fuori dall'app: nell'app Indietro lo gestisce Capacitor. */
export function avviaIndietro(fai: () => boolean): void {
  azione = fai;
  window.addEventListener('popstate', cambiataVoce);
}

export function entraInPartita(): void {
  if (!azione) return;
  inPartita = true;
  clearTimeout(attesa);
  aggiungiVoce();
}

export function esciDallaPartita(): void {
  if (!azione) return;
  inPartita = false;
  clearTimeout(attesa);
  attesa = window.setTimeout(() => {
    if (inPartita || !suLaVoce) return;
    tornando = true;
    history.back();
  }, PAUSA_USCITA);
}
