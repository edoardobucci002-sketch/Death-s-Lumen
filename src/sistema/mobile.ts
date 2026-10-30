/*
 * Integrazione con il telefono. Nell'app nativa usa i plugin di Capacitor;
 * nel browser ripiega sulle funzioni web equivalenti, quando esistono.
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar } from '@capacitor/status-bar';
import { KeepAwake } from '@capacitor-community/keep-awake';

export const nativo = Capacitor.isNativePlatform();

let vibrazioneAttiva = leggi('dl-vibrazione') !== '0';

export function impostaVibrazione(attiva: boolean): void {
  vibrazioneAttiva = attiva;
  scrivi('dl-vibrazione', attiva ? '1' : '0');
}
export function vibrazione(): boolean {
  return vibrazioneAttiva;
}

/** Vibrazione breve: 'leggera' per i colpi subiti, 'media' per i livelli, 'forte' per boss e abilità. */
export function vibra(forza: 'leggera' | 'media' | 'forte'): void {
  if (!vibrazioneAttiva) return;
  if (nativo) {
    const stile = forza === 'leggera' ? ImpactStyle.Light : forza === 'forte' ? ImpactStyle.Heavy : ImpactStyle.Medium;
    Haptics.impact({ style: stile }).catch(() => {});
  } else if ('vibrate' in navigator) {
    navigator.vibrate(forza === 'leggera' ? 12 : forza === 'forte' ? [30, 40, 60] : 25);
  }
}

let blocco: WakeLockSentinel | null = null;
/** Tiene lo schermo acceso durante la partita. */
export async function schermoAcceso(acceso: boolean): Promise<void> {
  try {
    if (nativo) {
      await (acceso ? KeepAwake.keepAwake() : KeepAwake.allowSleep());
    } else if (acceso && 'wakeLock' in navigator && !blocco) {
      blocco = await navigator.wakeLock.request('screen');
      blocco.addEventListener('release', () => (blocco = null));
    } else if (!acceso && blocco) {
      await blocco.release();
      blocco = null;
    }
  } catch {
    /* il dispositivo può rifiutare: il gioco va avanti lo stesso */
  }
}

export interface Ascoltatori {
  /** L'app va in secondo piano o si cambia scheda: metti in pausa. */
  sfondo(): void;
  /** L'app torna in primo piano. */
  primoPiano(): void;
  /** Tasto Indietro di Android: restituisce false se l'app deve chiudersi. */
  indietro(): boolean;
}

export function avviaMobile(a: Ascoltatori): void {
  document.addEventListener('visibilitychange', () => (document.hidden ? a.sfondo() : a.primoPiano()));
  // niente zoom con pizzico o doppio tocco su iOS
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  if (!nativo) return;
  StatusBar.hide().catch(() => {});
  App.addListener('backButton', () => {
    if (!a.indietro()) App.exitApp();
  });
}

function leggi(chiave: string): string | null {
  try {
    return localStorage.getItem(chiave);
  } catch {
    return null;
  }
}
function scrivi(chiave: string, valore: string): void {
  try {
    localStorage.setItem(chiave, valore);
  } catch {
    /* archivio non disponibile */
  }
}
