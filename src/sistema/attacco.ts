/*
 * Attacco a tasto (gioco a stanze, passo 3 della fetta): l'arma iniziale si usa a mano, non colpisce più da sola.
 * Sul telefono un joystick d'attacco fisso in basso a destra, stile Brawl Stars (grande come il joystick di movimento,
 * disegnato dal codice in src/sistema/joystick-stanze.ts: un disco nel colore del personaggio con una fiammella): un tocco colpisce il nemico più vicino (se non ce n'è a portata, dove guarda il
 * personaggio); trascinando il pomello segue il pollice, compare la mira a terra e lasciando il dito il colpo parte
 * in quella direzione. Su computer: clic sinistro verso il puntatore, J verso il nemico più vicino (entro ATTACCO.miraMassima).
 * Il colpo della Lanterna è un fendente di luce davanti al personaggio (pixelfx, src/sistema/effetti.ts → fendente). I numeri sono in
 * ATTACCO (src/data/stanze.ts). La richiesta di colpo aspetta la fine della ricarica: si può premere un attimo prima.
 */
import Phaser from 'phaser';
import { ATTACCO } from '../data/stanze';
import { TOCCO_MINIMO } from '../data/hud';
import { arte, immagine, ingr, misura, posa, type MisureHud } from './arte';
import { PROFONDITA, type Effetti } from './effetti';
import { suona } from './audio';
import { ARTE_JOYSTICK } from './joystick-stanze';

export class AttaccoATasto {
  attesa = 0; // secondi prima del prossimo colpo
  posa = 0; // secondi in cui il personaggio resta girato verso il colpo (la mossa attack)
  // la mossa: quanto dura e dopo quanto l'asta cala e ferisce. La scena li prende dall'animazione attack dello sprite;
  // senza animazione la posa è ATTACCO.posa e il colpo parte subito
  durataPosa: number = ATTACCO.posa;
  anticipo = 0;
  private carica = 0; // secondi prima che il colpo chiesto ferisca (0: nessun colpo in arrivo)
  private angolo = 0; // direzione del colpo in arrivo, in radianti
  dx = 1; // direzione dell'ultimo colpo, lunga 1
  dy = 0;
  colpi = 0; // colpi partiti (per il LAB e le prove)
  // il colpo di adesso: livello della Lanterna, Clessidra e Stoppino lungo li cambiano (la scena li aggiorna)
  ricarica: number = ATTACCO.ricarica;
  raggio: number = ATTACCO.raggio;
  ampiezza: number = ATTACCO.ampiezza;
  private richiesta = false;
  private rAuto = false;
  private rDX = 0;
  private rDY = 0;
  private dito: number | null = null;
  private ax = 0; // dove il dito si è appoggiato sul tasto
  private ay = 0;
  private mirando = false;
  private mDX = 1;
  private mDY = 0;
  private ricaricaVista = false;
  private corsa = 0; // pixel di gioco di cui il pomello si sposta al massimo (fino al bordo della base)
  private px = 1; // punti dello schermo per pixel di gioco
  private readonly tasto: HTMLButtonElement;
  private readonly pomello: HTMLImageElement;
  private readonly grafica: Phaser.GameObjects.Graphics;
  private readonly verso_ = { x: 0, y: 0 }; // riusato: niente allocazioni nel ciclo di gioco

  constructor(
    scena: Phaser.Scene,
    contenitore: HTMLElement,
    private readonly effetti: Effetti,
    private readonly fermo: () => boolean,
    /** Dal punto dello schermo (punti CSS) al punto della stanza (pixel di gioco). */
    private readonly nelMondo: (clientX: number, clientY: number) => { x: number; y: number },
    /** Il centro del corpo del personaggio, da cui parte il colpo. */
    private readonly corpo: () => { x: number; y: number },
    /** Punta «verso» (lunga 1) al nemico più vicino; false se non ce n'è a portata. */
    private readonly bersaglio: (verso: { x: number; y: number }) => boolean,
    /** Il colpo è partito in direzione «angolo» (radianti): chi lo riceve ferisce i nemici dentro l'arco. */
    private readonly colpito: (angolo: number) => void,
  ) {
    this.tasto = document.createElement('button');
    this.tasto.type = 'button';
    this.tasto.className = 'stanze-attacco';
    this.tasto.setAttribute('aria-label', 'Attacca');
    this.pomello = immagine(ARTE_JOYSTICK.attaccoPomello);
    this.tasto.append(immagine(ARTE_JOYSTICK.attaccoBase), this.pomello);
    this.tasto.addEventListener('pointerdown', this.appoggia);
    contenitore.append(this.tasto);
    window.addEventListener('pointermove', this.muovi);
    window.addEventListener('pointerup', this.solleva);
    window.addEventListener('pointercancel', this.annulla);
    document.addEventListener('pointerdown', this.clic);
    this.grafica = scena.add.graphics().setDepth(PROFONDITA.sopra);
  }

  /** Colpo verso il nemico più vicino (tocco breve, tasto J). */
  automatico(): void {
    this.richiesta = true;
    this.rAuto = true;
  }

  /** Colpo in una direzione (trascinamento, clic, LAB). */
  verso(dx: number, dy: number): void {
    const l = Math.hypot(dx, dy);
    if (!l) return this.automatico();
    this.richiesta = true;
    this.rAuto = false;
    this.rDX = dx / l;
    this.rDY = dy / l;
  }

  /** Un passo di logica: ricarica, posa, e il colpo se è stato chiesto e la ricarica è finita. (gx, gy): dove guarda il personaggio. */
  aggiorna(dt: number, gx: number, gy: number): void {
    if (this.attesa > 0) this.attesa -= dt;
    if (this.posa > 0) this.posa -= dt;
    if (this.carica > 0 && (this.carica -= dt) <= 0) this.scocca();
    if (!this.richiesta || this.attesa > 0) return;
    this.richiesta = false;
    // automatico: verso il nemico più vicino; se non ce n'è, dove guarda il personaggio
    if (!this.rAuto) {
      this.dx = this.rDX;
      this.dy = this.rDY;
    } else if (!this.miraVicino()) {
      this.dx = gx;
      this.dy = gy;
    }
    if (this.carica > 0) this.scocca(); // la ricarica è più corta della carica: il colpo di prima ferisce subito
    this.attesa = this.ricarica;
    this.posa = this.durataPosa;
    this.colpi++;
    this.angolo = Math.atan2(this.dy, this.dx);
    this.carica = this.anticipo;
    if (this.carica <= 0) this.scocca();
  }

  /** L'asta cala: il fendente di luce, il suono e i nemici feriti dentro l'arco. */
  private scocca(): void {
    this.carica = 0;
    const c = this.corpo();
    this.effetti.fendente(c.x, c.y, this.angolo, Math.round(this.raggio), this.ampiezza);
    suona('colpo');
    this.colpito(this.angolo);
  }

  /** Punta dx, dy verso il nemico più vicino; false se non ce n'è a portata. */
  private miraVicino(): boolean {
    if (!this.bersaglio(this.verso_)) return false;
    this.dx = this.verso_.x;
    this.dy = this.verso_.y;
    return true;
  }

  /** La mira a terra mentre si trascina e il tasto spento durante la ricarica. */
  disegna(): void {
    const g = this.grafica;
    g.clear();
    if (this.dito !== null && this.mirando) {
      const c = this.corpo(), a = Math.atan2(this.mDY, this.mDX), mezza = Phaser.Math.DegToRad(this.ampiezza / 2);
      const cx = Math.round(c.x), cy = Math.round(c.y), r = Math.round(this.raggio);
      g.lineStyle(ATTACCO.mira.spessore, Phaser.Display.Color.HexStringToColor(ATTACCO.mira.colore).color, 1);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(Math.round(cx + Math.cos(a - mezza) * r), Math.round(cy + Math.sin(a - mezza) * r));
      g.arc(cx, cy, r, a - mezza, a + mezza);
      g.closePath();
      g.strokePath();
    }
    const ricarica = this.attesa > 0;
    if (ricarica !== this.ricaricaVista) {
      this.ricaricaVista = ricarica;
      this.tasto.classList.toggle('ricarica', ricarica);
    }
  }

  /** Dove sta il joystick d'attacco, in pixel di gioco (anche su computer, dove non si vede): l'abilità ci si mette accanto. */
  readonly riquadro = { x: 0, y: 0, l: 0 };

  /** In basso a destra, dentro il bordo sicuro; l'area di tocco arriva almeno a TOCCO_MINIMO punti. */
  disponi(m: MisureHud, bordo: { b: number; d: number }): void {
    const b = arte(ARTE_JOYSTICK.attaccoBase), p = arte(ARTE_JOYSTICK.attaccoPomello);
    if (!b || !p) return;
    const z = ingr('joystick', m), margine = ATTACCO.tasto.margine;
    (this.tasto.firstElementChild as HTMLImageElement).src = b.url;
    this.pomello.src = p.url;
    this.riquadro.x = m.W - bordo.d - margine - b.w * z;
    this.riquadro.y = m.H - bordo.b - margine - b.h * z;
    this.riquadro.l = b.w * z;
    posa(this.tasto, this.riquadro.x, this.riquadro.y, m);
    misura(this.tasto, b.w, b.h, z, m);
    misura(this.tasto.firstElementChild as HTMLElement, b.w, b.h, z, m);
    misura(this.pomello, p.w, p.h, z, m);
    this.pomello.style.left = `${Math.floor(((b.w - p.w) * z) / 2) * m.px}px`;
    this.pomello.style.top = `${Math.floor(((b.h - p.h) * z) / 2) * m.px}px`;
    this.corsa = ((b.w - p.w) / 2) * z;
    this.px = m.px;
    this.tasto.style.setProperty('--margine-tocco', `${Math.max(4, Math.ceil((TOCCO_MINIMO - Math.min(b.w, b.h) * z * m.px) / 2))}px`);
  }

  /** Lascia il dito (pausa, telefono da ruotare): nessun colpo parte. */
  lascia(): void {
    this.dito = null;
    this.carica = 0;
    this.mirando = false;
    this.richiesta = false;
    this.pomello.style.transform = '';
  }

  distruggi(): void {
    window.removeEventListener('pointermove', this.muovi);
    window.removeEventListener('pointerup', this.solleva);
    window.removeEventListener('pointercancel', this.annulla);
    document.removeEventListener('pointerdown', this.clic);
    this.tasto.remove(); // la grafica della mira la toglie la scena quando si chiude
  }

  private appoggia = (e: PointerEvent): void => {
    e.preventDefault();
    if (this.fermo() || this.dito !== null) return;
    this.dito = e.pointerId;
    this.ax = e.clientX;
    this.ay = e.clientY;
    this.mirando = false;
    this.tasto.setPointerCapture?.(e.pointerId);
  };

  private muovi = (e: PointerEvent): void => {
    if (e.pointerId !== this.dito) return;
    const dx = (e.clientX - this.ax) / ATTACCO.trascina.raggio, dy = (e.clientY - this.ay) / ATTACCO.trascina.raggio;
    const l = Math.hypot(dx, dy);
    this.mirando = l >= ATTACCO.trascina.zonaMorta;
    if (this.mirando) {
      this.mDX = dx / l;
      this.mDY = dy / l;
    }
    // il pomello segue il pollice fino al bordo della base, a pixel di gioco interi (come il joystick di movimento)
    const k = l > 1 ? 1 / l : 1;
    this.pomello.style.transform = `translate(${Math.round(dx * k * this.corsa) * this.px}px, ${Math.round(dy * k * this.corsa) * this.px}px)`;
  };

  private solleva = (e: PointerEvent): void => {
    if (e.pointerId !== this.dito) return;
    this.dito = null;
    this.pomello.style.transform = '';
    if (this.fermo()) return;
    if (this.mirando) this.verso(this.mDX, this.mDY);
    else this.automatico();
    this.mirando = false;
  };

  private annulla = (e: PointerEvent): void => {
    if (e.pointerId === this.dito) this.lascia();
  };

  /** Su computer: clic sinistro verso il puntatore (non sui pulsanti né sulla pausa). */
  private clic = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !matchMedia('(pointer: fine)').matches || this.fermo()) return;
    if ((e.target as Element).closest('button, .stanze-pausa, .stanze-ruota, .lab, .lab-apri')) return;
    const p = this.nelMondo(e.clientX, e.clientY), c = this.corpo();
    this.verso(p.x - c.x, p.y - c.y);
  };
}
