/*
 * Attacco a tasto (gioco a stanze, passo 3 della fetta): l'arma iniziale si usa a mano, non colpisce più da sola.
 * Sul telefono un tasto tondo in basso a destra, stile Brawl Stars: un tocco colpisce il nemico più vicino (finché non
 * ci sono nemici, dove guarda il personaggio); trascinando compare la mira a terra e lasciando il dito il colpo parte
 * in quella direzione. Su computer: clic sinistro verso il puntatore, J verso il nemico più vicino.
 * Il colpo della Lanterna è un arco di luce davanti al personaggio (lo stesso effetto del survivor). I numeri sono in
 * ATTACCO (src/data/stanze.ts). La richiesta di colpo aspetta la fine della ricarica: si può premere un attimo prima.
 */
import Phaser from 'phaser';
import { ATTACCO } from '../data/stanze';
import { TOCCO_MINIMO } from '../data/hud';
import { misura, posa, type MisureHud } from './arte';
import { PROFONDITA, type Effetti } from './effetti';
import { suona } from './audio';

export class AttaccoATasto {
  attesa = 0; // secondi prima del prossimo colpo
  posa = 0; // secondi in cui il personaggio resta girato verso il colpo
  dx = 1; // direzione dell'ultimo colpo, lunga 1
  dy = 0;
  colpi = 0; // colpi partiti (per il LAB e le prove)
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
  private readonly tasto: HTMLButtonElement;
  private readonly grafica: Phaser.GameObjects.Graphics;

  constructor(
    scena: Phaser.Scene,
    contenitore: HTMLElement,
    private readonly effetti: Effetti,
    private readonly fermo: () => boolean,
    /** Dal punto dello schermo (punti CSS) al punto della stanza (pixel di gioco). */
    private readonly nelMondo: (clientX: number, clientY: number) => { x: number; y: number },
    /** Il centro del corpo del personaggio, da cui parte il colpo. */
    private readonly corpo: () => { x: number; y: number },
  ) {
    this.tasto = document.createElement('button');
    this.tasto.type = 'button';
    this.tasto.className = 'stanze-attacco';
    this.tasto.setAttribute('aria-label', 'Attacca');
    this.tasto.append(this.disegnoTasto());
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
    if (!this.richiesta || this.attesa > 0) return;
    this.richiesta = false;
    // nemico più vicino: arriva con i nemici (passo 4); per ora il colpo va dove guarda il personaggio
    if (!this.rAuto) {
      this.dx = this.rDX;
      this.dy = this.rDY;
    } else if (!this.miraVicino()) {
      this.dx = gx;
      this.dy = gy;
    }
    this.attesa = ATTACCO.ricarica;
    this.posa = ATTACCO.posa;
    this.colpi++;
    const c = this.corpo();
    this.effetti.arco(c.x, c.y, Math.atan2(this.dy, this.dx), ATTACCO.raggio, ATTACCO.ampiezza);
    suona('colpo');
  }

  /** Punta dx, dy verso il nemico più vicino; false se non ce n'è (oggi: sempre, i nemici arrivano al passo 4). */
  private miraVicino(): boolean {
    return false;
  }

  /** La mira a terra mentre si trascina e il tasto spento durante la ricarica. */
  disegna(): void {
    const g = this.grafica;
    g.clear();
    if (this.dito !== null && this.mirando) {
      const c = this.corpo(), a = Math.atan2(this.mDY, this.mDX), mezza = Phaser.Math.DegToRad(ATTACCO.ampiezza / 2);
      const cx = Math.round(c.x), cy = Math.round(c.y), r = ATTACCO.raggio;
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

  /** In basso a destra, dentro il bordo sicuro; l'area di tocco arriva almeno a TOCCO_MINIMO punti. */
  disponi(m: MisureHud, bordo: { b: number; d: number }): void {
    const { raggio, ingrandimento: z, margine } = ATTACCO.tasto, lato = raggio * 2 + 2;
    posa(this.tasto, m.W - bordo.d - margine - lato * z, m.H - bordo.b - margine - lato * z, m);
    misura(this.tasto, lato, lato, z, m);
    misura(this.tasto.firstElementChild as HTMLElement, lato, lato, z, m);
    this.tasto.style.setProperty('--margine-tocco', `${Math.max(4, Math.ceil((TOCCO_MINIMO - lato * z * m.px) / 2))}px`);
  }

  /** Lascia il dito (pausa, telefono da ruotare): nessun colpo parte. */
  lascia(): void {
    this.dito = null;
    this.mirando = false;
    this.richiesta = false;
  }

  distruggi(): void {
    window.removeEventListener('pointermove', this.muovi);
    window.removeEventListener('pointerup', this.solleva);
    window.removeEventListener('pointercancel', this.annulla);
    document.removeEventListener('pointerdown', this.clic);
    this.tasto.remove(); // la grafica della mira la toglie la scena quando si chiude
  }

  /** Il tasto disegnato dal codice (segnaposto): un disco scuro con l'anello del colore del personaggio e un arco di luce. */
  private disegnoTasto(): HTMLCanvasElement {
    const r = ATTACCO.tasto.raggio, lato = r * 2 + 2, c = document.createElement('canvas');
    c.width = c.height = lato;
    c.className = 'stanze-scritta';
    const g = c.getContext('2d')!;
    const accento = getComputedStyle(document.documentElement).getPropertyValue('--accento').trim() || ATTACCO.mira.colore;
    const centro = lato / 2;
    for (let y = 0; y < lato; y++) {
      for (let x = 0; x < lato; x++) {
        const d = Math.hypot(x + 0.5 - centro, y + 0.5 - centro);
        if (d > r + 0.5) continue;
        g.fillStyle = d > r - 1.5 ? '#000000' : d > r - 4 ? accento : '#1c1611';
        g.fillRect(x, y, 1, 1);
      }
    }
    // arco di luce stilizzato: un quarto di cerchio spesso 2 pixel
    g.fillStyle = '#efe3c8';
    for (let a = -50; a <= 50; a += 4) {
      const t = Phaser.Math.DegToRad(a), rr = r * 0.5;
      g.fillRect(Math.round(centro - rr * 0.4 + Math.cos(t) * rr), Math.round(centro + Math.sin(t) * rr) - 1, 2, 2);
    }
    return c;
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
  };

  private solleva = (e: PointerEvent): void => {
    if (e.pointerId !== this.dito) return;
    this.dito = null;
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
