/*
 * Lettura dello schermo per il Laboratorio (scheda «Schermo»): quello che il telefono dichiara davvero
 * (dove gira il gioco, punti, pixel fisici, aree sicure) e quanto campo resterebbe con le fasce di FASCE in src/data/hud.ts.
 * Solo lettura: non cambia niente nel gioco. Serve a misurare sul telefono vero ciò che l'emulatore non sa.
 */
import { FASCE } from '../data/hud';
import { ingr, misureHud } from './arte';
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
  const sicuraAlta = fis(Math.max(env.alto, cap?.alto ?? 0)), sicuraBassa = fis(Math.max(env.basso, cap?.basso ?? 0));

  const z = ingr('barre', m); // pixel di gioco per pixel disegnato
  const fisiciRiga = z * m.scala; // pixel fisici per pixel disegnato
  const alta = FASCE.alta * z, bassa = FASCE.bassa * z;
  const campo = m.H - alta - bassa;
  const minimoAlta = sicuraAlta + FASCE.righeAlta * fisiciRiga;
  const minimoCartiglio = FASCE.righeCartiglio * fisiciRiga;
  const minimoBassa = sicuraBassa + FASCE.righeBassa * fisiciRiga;
  const altaFis = alta * m.scala, bassaFis = bassa * m.scala;
  const esito = (ok: boolean): string => (ok ? 'ci sta' : 'NON ci sta');

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
    ['Fasce (src/data/hud.ts)', ''],
    ['Fascia alta', `${FASCE.alta} disegnati = ${altaFis} fisici`],
    ['Fascia bassa', `${FASCE.bassa} disegnati = ${bassaFis} fisici`],
    ['Campo', `${m.W}×${campo} pixel di gioco (minimo ${FASCE.campoMinimo}: ${campo >= FASCE.campoMinimo ? 'sì' : 'NO'})`],
    ['Contenuto alto', `serve ${minimoAlta} fisici compresa l'area sicura: ${esito(minimoAlta <= altaFis)}`],
    ['Cartiglio', `serve ${minimoCartiglio} fisici: ${esito(minimoCartiglio <= altaFis)}; la sua scritta inizia a ${FASCE.testoCartiglio * fisiciRiga} fisici dal bordo, area sicura ${sicuraAlta}: ${FASCE.testoCartiglio * fisiciRiga >= sicuraAlta ? 'libera' : 'COPERTA'}`],
    ['Contenuto basso', `serve ${minimoBassa} fisici compresa l'area sicura: ${esito(minimoBassa <= bassaFis)}`],
  ];
}
