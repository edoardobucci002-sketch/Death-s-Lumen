/*
 * Comandi: tastiera (WASD e frecce) e joystick virtuale che compare dove si appoggia il dito
 * (o dove si preme il mouse). La logica legge dx e dy: una direzione lunga da 0 a 1.
 * Base e pomello sono quelli disegnati da Edoardo (Joystick_Base, Joystick_Pomello), messi a pixel di gioco interi.
 * La sensibilità resta in punti dello schermo (JOYSTICK.raggio); il pomello disegnato si sposta fino al bordo della base.
 */
import { JOYSTICK_PICCOLO } from '../data/hud';
import { JOYSTICK } from '../data/mondo';
import { arte, fasce, immagine, ingr, misura, misureHud, type MisureHud } from './arte';

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
  private m: MisureHud = misureHud();
  private chiaveBase = 'Joystick_Base'; // sul telefono in verticale: la base piccola
  private chiavePomello = 'Joystick_Pomello';

  constructor(contenitore: HTMLElement) {
    this.base = document.createElement('div');
    this.base.className = 'joystick';
    this.base.hidden = true;
    this.pomello = immagine('Joystick_Pomello', 'joystick-pomello');
    this.base.append(immagine('Joystick_Base', 'joystick-base'), this.pomello);
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
    if (this.dito !== null || (e.target as Element).closest('button, .hud-pausa')) return; // nella pausa il dito scorre le pagine, non cammina
    this.dito = e.pointerId;
    this.ox = e.clientX;
    this.oy = e.clientY;
    this.jx = this.jy = 0;
    this.misure();
    // il centro della base va su un pixel di gioco intero
    const px = this.m.px;
    this.base.style.transform = `translate(${Math.round(this.ox / px) * px}px, ${Math.round(this.oy / px) * px}px)`;
    this.sopraIPulsanti();
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
    // corsa del pomello disegnato: dal centro fino al bordo della base, in pixel di gioco interi
    const z = ingr('joystick', this.m), b = arte(this.chiaveBase), p = arte(this.chiavePomello);
    const corsa = b && p ? ((b.w - p.w) / 2) * z : 0, px = this.m.px;
    this.pomello.style.transform = `translate(${Math.round(x * corsa) * px}px, ${Math.round(y * corsa) * px}px)`;
  };

  /** Misure della base e del pomello per questo telefono (centrati sul punto del dito). */
  private misure(): void {
    const m = (this.m = misureHud()), z = ingr('joystick', m), piccolo = fasce(m).attive;
    this.chiaveBase = piccolo ? 'Joystick_Base_Piccola' : 'Joystick_Base';
    this.chiavePomello = piccolo ? 'Joystick_Pomello_Piccolo' : 'Joystick_Pomello';
    const b = arte(this.chiaveBase), p = arte(this.chiavePomello);
    if (!b || !p) return;
    const base = this.base.firstElementChild as HTMLImageElement;
    base.src = b.url;
    (this.pomello as HTMLImageElement).src = p.url;
    misura(base, b.w, b.h, z, m);
    misura(this.pomello, p.w, p.h, z, m);
    base.style.left = `${-Math.floor((b.w * z) / 2) * m.px}px`;
    base.style.top = `${-Math.floor((b.h * z) / 2) * m.px}px`;
    this.pomello.style.left = `${-Math.floor((p.w * z) / 2) * m.px}px`;
    this.pomello.style.top = `${-Math.floor((p.h * z) / 2) * m.px}px`;
  }

  /**
   * Sul telefono in verticale la base resta sotto il dito: se copre un pulsante si disegna sopra, mezza trasparente.
   * Il tocco non può iniziare su un pulsante (appoggia) e la base non riceve tocchi, quindi i pulsanti coperti non scattano.
   */
  private sopraIPulsanti(): void {
    const b = arte(this.chiaveBase), stile = this.base.style;
    if (!b || !fasce(this.m).attive) {
      stile.zIndex = stile.opacity = '';
      return;
    }
    const r = (b.w * ingr('joystick', this.m) * this.m.px) / 2, x = this.ox, y = this.oy;
    const copre = [...document.querySelectorAll('.speciale, .fiaschetta, .hud-pausa-tasto')].some((e) => {
      const q = e.getBoundingClientRect();
      return q.left - r < x && q.right + r > x && q.top - r < y && q.bottom + r > y;
    });
    stile.zIndex = copre ? '5' : '';
    stile.opacity = copre ? String(JOYSTICK_PICCOLO.opacitaSuiPulsanti) : '';
  }

  private solleva = (e?: PointerEvent): void => {
    if (e && e.pointerId !== this.dito) return;
    this.dito = null;
    this.jx = this.jy = 0;
    this.base.hidden = true;
  };
}
