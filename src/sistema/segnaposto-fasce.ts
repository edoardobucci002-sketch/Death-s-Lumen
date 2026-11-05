/*
 * Segnaposto delle fasce del telefono, disegnati dal codice finché non arrivano quelli di Edoardo:
 * Fascia_Alta, Fascia_Bassa, Barra_Seth_Cornice, Barra_Seth_Piena, Pulsante_Pausa_Piccolo e il joystick piccolo.
 * Ogni file vero (HUD/…_V1.aseprite) sostituisce il suo da solo: qui si disegna solo ciò che manca.
 */
import { FINESTRE, JOYSTICK_PICCOLO, PAUSA_PICCOLA } from '../data/hud';
import { arte, registraArte } from './arte';

const TELA_FASCIA = { l: 376, a: 124 };
const COLORI = { fondo: '#15100f', trama: '#221917', filo: '#e8dcc0', bronzo: '#8a5a32', scuro: '#0d0a09', rosso: '#b8322a', rossoChiaro: '#e0604a', chiaro: '#e8dcc0' };

function tela(l: number, a: number, disegna: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = l;
  c.height = a;
  disegna(c.getContext('2d')!);
  return c;
}

/** Fondo neutro a trama regolare, con il filo chiaro di 1 pixel sulla riga verso il campo. */
function fascia(rigaFilo: number): HTMLCanvasElement {
  return tela(TELA_FASCIA.l, TELA_FASCIA.a, (g) => {
    g.fillStyle = COLORI.fondo;
    g.fillRect(0, 0, TELA_FASCIA.l, TELA_FASCIA.a);
    g.fillStyle = COLORI.trama;
    for (let y = 0; y < TELA_FASCIA.a; y += 2) for (let x = (y >> 1) % 2 ? 0 : 2; x < TELA_FASCIA.l; x += 4) g.fillRect(x, y, 1, 1);
    g.fillStyle = COLORI.filo;
    g.fillRect(0, rigaFilo, TELA_FASCIA.l, 1);
  });
}

/** Cerchio pieno a pixel; bordo e interno di colori diversi. */
function cerchio(lato: number, bordo: string, interno: string): HTMLCanvasElement {
  return tela(lato, lato, (g) => {
    const r = lato / 2;
    for (let y = 0; y < lato; y++) {
      for (let x = 0; x < lato; x++) {
        const d = Math.hypot(x + 0.5 - r, y + 0.5 - r);
        if (d > r) continue;
        g.fillStyle = d > r - 2 ? bordo : interno;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
}

function barraSeth(): HTMLCanvasElement {
  const f = FINESTRE.Barra_Seth_Cornice;
  return tela(f.x * 2 + f.l, f.y * 2 + f.a, (g) => {
    const l = f.x * 2 + f.l, a = f.y * 2 + f.a;
    g.fillStyle = COLORI.bronzo;
    g.fillRect(0, 0, l, a);
    g.fillStyle = COLORI.scuro;
    g.fillRect(2, 2, l - 4, a - 4);
  });
}

function pausa(): HTMLCanvasElement {
  const lato = PAUSA_PICCOLA.lato;
  return tela(lato, lato, (g) => {
    g.fillStyle = COLORI.bronzo;
    g.fillRect(0, 0, lato, lato);
    g.fillStyle = COLORI.scuro;
    g.fillRect(2, 2, lato - 4, lato - 4);
    g.fillStyle = COLORI.chiaro;
    g.fillRect(11, 10, 4, 14);
    g.fillRect(19, 10, 4, 14);
  });
}

/** Da chiamare prima di creare comandi e HUD: le immagini prendono l'arte quando nascono. */
export function preparaSegnapostoFasce(): void {
  const f = FINESTRE.Barra_Seth_Cornice;
  const segnaposto: [string, () => HTMLCanvasElement][] = [
    ['Fascia_Alta', () => fascia(TELA_FASCIA.a - 1)],
    ['Fascia_Bassa', () => fascia(0)],
    ['Barra_Seth_Cornice', barraSeth],
    ['Barra_Seth_Piena', () => tela(f.l, f.a, (g) => {
      g.fillStyle = COLORI.rosso;
      g.fillRect(0, 0, f.l, f.a);
      g.fillStyle = COLORI.rossoChiaro;
      g.fillRect(0, 0, f.l, 2);
    })],
    ['Pulsante_Pausa_Piccolo', pausa],
    ['Joystick_Base_Piccola', () => cerchio(JOYSTICK_PICCOLO.base, COLORI.bronzo, COLORI.fondo)],
    ['Joystick_Pomello_Piccolo', () => cerchio(JOYSTICK_PICCOLO.pomello, COLORI.chiaro, COLORI.bronzo)],
  ];
  for (const [chiave, disegna] of segnaposto) if (!arte(chiave)) registraArte(chiave, disegna());
}
