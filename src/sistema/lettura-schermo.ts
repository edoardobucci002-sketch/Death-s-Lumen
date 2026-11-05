/*
 * Lettura dello schermo per il Laboratorio (scheda «Schermo»): quello che il telefono dichiara davvero
 * (dove gira il gioco, punti, pixel fisici, aree sicure) e le fasce che ne risultano (fasce() in arte.ts).
 * Solo lettura: non cambia niente nel gioco. Serve a misurare sul telefono vero ciò che l'emulatore non sa.
 */
import { FASCE } from '../data/hud';
import { fasce, ingr, misureHud } from './arte';
import { nativo } from './mobile';

type Lati = { alto: number; destra: number; basso: number; sinistra: number };

/** Aree sicure dichiarate dal browser con env(safe-area-inset-*), in punti. */
function areeEnv(): Lati {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.append(d);
  const s = getComputedStyle(d);
  const lati = { alto: parseFloat(s.paddingTop), destra: parseFloat(s.paddingRight), basso: parseFloat(s.paddingBottom), sinistra: parseFloat(s.paddingLeft) };
  d.remove();
  return lati;
}

/** Aree sicure scritte da Capacitor (solo nell'app Android), in punti; null se non ci sono. */
function areeCapacitor(): Lati | null {
  const s = getComputedStyle(document.documentElement);
  const v = (nome: string): number => parseFloat(s.getPropertyValue(`--safe-area-inset-${nome}`));
  const alto = v('top');
  return Number.isNaN(alto) ? null : { alto, destra: v('right'), basso: v('bottom'), sinistra: v('left') };
}

function doveGira(): string {
  if (nativo) return 'App (APK)';
  if (matchMedia('(display-mode: fullscreen)').matches) return 'Link in Home, schermo intero';
  if (matchMedia('(display-mode: standalone)').matches) return 'Link in Home, con la barra di stato';
  return 'Browser normale';
}

/** Le righe da mostrare e copiare: [nome, valore]; il titolo di un gruppo ha il valore vuoto. */
export function letturaSchermo(): [string, string][] {
  const m = misureHud();
  const dpr = window.devicePixelRatio || 1;
  const fis = (punti: number): number => Math.round(punti * dpr);
  const fisL = fis(window.innerWidth), fisA = fis(window.innerHeight);
  const schermoA = fis(Math.max(screen.width, screen.height)), schermoL = fis(Math.min(screen.width, screen.height));
  const env = areeEnv(), cap = areeCapacitor();
  const testoLati = (a: Lati): string => `alto ${a.alto}, destra ${a.destra}, basso ${a.basso}, sinistra ${a.sinistra} punti (alto ${fis(a.alto)}, basso ${fis(a.basso)} fisici)`;
  // l'area sicura che conta è la più grande tra le due fonti
  const sicuraAlta = fis(Math.max(env.alto, cap?.alto ?? 0));

  const f = fasce(m);
  const z = f.attive ? f.z : ingr('barre', m); // pixel di gioco per pixel disegnato
  const fisiciRiga = z * m.scala; // pixel fisici per pixel disegnato
  const scrittaCartiglio = f.sopraCartiglio * m.scala + FASCE.testoCartiglio * fisiciRiga;

  return [
    ['Dove gira', ''],
    ['Modo', doveGira()],
    ['In verticale', fisA >= fisL ? 'sì' : 'NO: gira il telefono e tocca Aggiorna'],
    ['Browser', navigator.userAgent],
    ['Schermo', ''],
    ['Schermo intero', `${schermoL}×${schermoA} fisici`],
    ['Finestra del gioco', `${fisL}×${fisA} fisici (${window.innerWidth}×${window.innerHeight} punti)`],
    ['Tolti dalle barre', `${Math.max(0, schermoA - fisA)} fisici in altezza`],
    ['Punti', `larghezza ${window.innerWidth}, ${dpr} fisici per punto`],
    ['Aree sicure', ''],
    ['env()', testoLati(env)],
    ['Capacitor', cap ? testoLati(cap) : 'non presente'],
    ['Scala', ''],
    ['Scala', `×${m.scala}: ${m.W}×${m.H} pixel di gioco`],
    ['Pixel disegnato', `×${z}: ${fisiciRiga} fisici`],
    ['Gesti di sistema', ''],
    ['Zone dei gesti', 'non raggiungibili da qui: servono codice nativo Android, che non è stato aggiunto'],
    ['Fasce', ''],
    ['Fasce attive', f.attive ? 'sì' : 'no: computer, tablet o telefono in orizzontale'],
    ['Fascia alta', `${f.alta / z} disegnati = ${f.alta * m.scala} fisici`],
    ['Fascia bassa', `${f.bassa / z} disegnati = ${f.bassa * m.scala} fisici`],
    ['Campo', `${m.W}×${f.campoA} pixel di gioco (minimo ${FASCE.campoMinimo}: ${f.campoA >= FASCE.campoMinimo ? 'sì' : 'NO'})`],
    ['Cartiglio', `scritta a ${scrittaCartiglio} fisici dal bordo, area sicura ${sicuraAlta}: ${scrittaCartiglio >= sicuraAlta ? 'libera' : 'COPERTA'}`],
  ];
}
