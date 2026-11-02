/*
 * Comandi: tastiera (WASD e frecce) e joystick virtuale che compare dove si appoggia il dito
 * (o dove si preme il mouse). La logica legge dx e dy: una direzione lunga da 0 a 1.
 */
import { JOYSTICK } from '../data/mondo';

const SU = new Set(['KeyW', 'ArrowUp']);
const GIU = new Set(['KeyS', 'ArrowDown']);
const SINISTRA = new Set(['KeyA', 'ArrowLeft']);
const DESTRA = new Set(['KeyD', 'ArrowRight']);

export class Comandi {
  dx = 0;
  dy = 0;
  private su = false;
  private giu = false;
  private sinistra = false;
  private destra = false;
  private dito: number | null = null;
  private ox = 0; // dove si è appoggiato il dito
  private oy = 0;
  private jx = 0; // spostamento del dito, tra -1 e 1
  private jy = 0;
  private base: HTMLElement;
  private pomello: HTMLElement;

  constructor(contenitore: HTMLElement) {
    this.base = document.createElement('div');
    this.base.className = 'joystick';
    this.base.hidden = true;
    this.base.style.setProperty('--raggio', `${JOYSTICK.raggio}px`);
    this.pomello = document.createElement('div');
    this.pomello.className = 'joystick-pomello';
    this.base.append(this.pomello);
    contenitore.append(this.base);
    window.addEventListener('keydown', this.tasto);
    window.addEventListener('keyup', this.tasto);
    window.addEventListener('blur', this.lascia);
    document.addEventListener('pointerdown', this.appoggia);
    window.addEventListener('pointermove', this.muovi);
    window.addEventListener('pointerup', this.solleva);
    window.addEventListener('pointercancel', this.solleva);
  }

  /** Calcola la direzione: il joystick, se in uso, ha la precedenza sulla tastiera. */
  aggiorna(): void {
    let x: number;
    let y: number;
    if (this.dito !== null) {
      x = this.jx;
      y = this.jy;
      const l = Math.hypot(x, y);
      if (l < JOYSTICK.zonaMorta) {
        x = 0;
        y = 0;
      }
    } else {
      x = (this.destra ? 1 : 0) - (this.sinistra ? 1 : 0);
      y = (this.giu ? 1 : 0) - (this.su ? 1 : 0);
      if (x && y) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
    }
    this.dx = x;
    this.dy = y;
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    window.removeEventListener('keyup', this.tasto);
    window.removeEventListener('blur', this.lascia);
    document.removeEventListener('pointerdown', this.appoggia);
    window.removeEventListener('pointermove', this.muovi);
    window.removeEventListener('pointerup', this.solleva);
    window.removeEventListener('pointercancel', this.solleva);
    this.base.remove();
  }

  private tasto = (e: KeyboardEvent): void => {
    const giu = e.type === 'keydown';
    if (SU.has(e.code)) this.su = giu;
    else if (GIU.has(e.code)) this.giu = giu;
    else if (SINISTRA.has(e.code)) this.sinistra = giu;
    else if (DESTRA.has(e.code)) this.destra = giu;
    else return;
    e.preventDefault();
  };

  /** Lascia tutti i tasti e il joystick (per esempio quando il gioco si ferma). */
  lascia = (): void => {
    this.su = this.giu = this.sinistra = this.destra = false;
    this.solleva();
  };

  private appoggia = (e: PointerEvent): void => {
    if (this.dito !== null || (e.target as Element).closest('button')) return;
    this.dito = e.pointerId;
    this.ox = e.clientX;
    this.oy = e.clientY;
    this.jx = this.jy = 0;
    this.base.style.transform = `translate(${this.ox}px, ${this.oy}px)`;
    this.pomello.style.transform = '';
    this.base.hidden = false;
  };

  private muovi = (e: PointerEvent): void => {
    if (e.pointerId !== this.dito) return;
    let x = (e.clientX - this.ox) / JOYSTICK.raggio;
    let y = (e.clientY - this.oy) / JOYSTICK.raggio;
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    this.jx = x;
    this.jy = y;
    this.pomello.style.transform = `translate(${Math.round(x * JOYSTICK.raggio)}px, ${Math.round(y * JOYSTICK.raggio)}px)`;
  };

  private solleva = (e?: PointerEvent): void => {
    if (e && e.pointerId !== this.dito) return;
    this.dito = null;
    this.jx = this.jy = 0;
    this.base.hidden = true;
  };
}
