/*
 * Abilità speciale: anello del personaggio in basso a sinistra (o tasto Spazio). In ricarica l'anello è grigio
 * (Speciale_<Nome>_Ricarica) e si colora in senso orario, pixel per pixel; quando è pronto è tutto colorato.
 * Quando è pronta e si preme, chiama usa(); la ricarica segue la Clessidra e il personaggio.
 */
import { ANELLI } from '../data/hud';
import { PRONTA_DOPO, type Abilita } from '../data/abilita';
import { arte, bordiHud, immagine, ingr, misura, misureHud, posa } from './arte';

export class Speciale {
  attesa: number = PRONTA_DOPO; // secondi alla prossima volta che è pronta
  private pulsante: HTMLButtonElement;
  private tela: HTMLCanvasElement;
  private icona: HTMLImageElement;
  private colore: ImageData | null = null;
  private grigio: ImageData | null = null;
  private uscita: ImageData | null = null;
  private ultimaParte = -1;
  private ricaricaAttuale: number;
  private chiave: string;
  private attesaMisure = 0;

  constructor(
    contenitore: HTMLElement,
    private abilita: Abilita,
    personaggio: string, // es. "Il_Lampionaio"
    private usa: () => boolean, // restituisce false se ora non si può usare (gioco fermo)
  ) {
    this.ricaricaAttuale = abilita.ricarica;
    this.chiave = `Speciale_${personaggio}`;
    this.pulsante = document.createElement('button');
    this.pulsante.type = 'button';
    this.pulsante.className = 'speciale';
    this.pulsante.setAttribute('aria-label', abilita.nome);
    this.tela = document.createElement('canvas');
    this.tela.className = 'arte';
    this.icona = immagine(abilita.icona, 'speciale-icona');
    this.pulsante.append(this.tela, this.icona);
    const col = arte(this.chiave), gr = arte(`${this.chiave}_Ricarica`);
    if (col) {
      this.tela.width = col.w;
      this.tela.height = col.h;
      const g = this.tela.getContext('2d')!;
      g.drawImage(col.tela, 0, 0);
      this.colore = g.getImageData(0, 0, col.w, col.h);
      g.clearRect(0, 0, col.w, col.h);
      g.drawImage(gr?.tela ?? col.tela, 0, 0);
      this.grigio = g.getImageData(0, 0, col.w, col.h);
      this.uscita = g.createImageData(col.w, col.h);
    }
    this.pulsante.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.prova();
    });
    contenitore.append(this.pulsante);
    window.addEventListener('keydown', this.tasto);
    window.addEventListener('resize', this.ridimensiona);
    this.disponi();
  }

  /** Avanza la ricarica; fattore è il moltiplicatore delle attese (Clessidra, Strega). */
  aggiorna(dt: number, fattore: number): void {
    this.ricaricaAttuale = this.abilita.ricarica * fattore;
    if (this.attesa > 0) this.attesa = Math.max(0, this.attesa - dt);
    const parte = this.attesa > 0 ? Math.min(99, Math.round((1 - this.attesa / Math.max(this.ricaricaAttuale, PRONTA_DOPO)) * 100)) : 100;
    if (parte !== this.ultimaParte) {
      this.ultimaParte = parte;
      this.disegna(parte / 100);
      this.pulsante.classList.toggle('pronta', parte >= 100);
    }
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    window.removeEventListener('resize', this.ridimensiona);
    cancelAnimationFrame(this.attesaMisure);
    this.pulsante.remove();
  }

  /** Usa l'abilità se è pronta (pulsante, Spazio o bot). */
  prova(): void {
    if (this.attesa > 0 || !this.usa()) return;
    this.attesa = this.ricaricaAttuale;
  }

  /** L'anello colorato fino a «parte» (0 in alto, in senso orario), grigio il resto. */
  private disegna(parte: number): void {
    const a = ANELLI[this.chiave], col = this.colore, gr = this.grigio, out = this.uscita;
    if (!a || !col || !gr || !out) return;
    const w = col.width, h = col.height;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const dx = i + 0.5 - a.x, dy = j + 0.5 - a.y;
      const ang = (Math.atan2(dx, -dy) / (Math.PI * 2) + 1) % 1;
      const src = parte >= 1 || (dx * dx + dy * dy <= a.esterno * a.esterno && ang <= parte) ? col.data : gr.data;
      const k = (j * w + i) * 4;
      out.data[k] = src[k];
      out.data[k + 1] = src[k + 1];
      out.data[k + 2] = src[k + 2];
      out.data[k + 3] = src[k + 3];
    }
    this.tela.getContext('2d')!.putImageData(out, 0, 0);
  }

  private ridimensiona = (): void => {
    cancelAnimationFrame(this.attesaMisure);
    this.attesaMisure = requestAnimationFrame(() => this.disponi());
  };

  /** In basso a sinistra, come nella bozza; l'icona dell'abilità al centro del disco. */
  private disponi(): void {
    const m = misureHud(), b = bordiHud(m), z = ingr('speciale', m), a = arte(this.chiave), c = ANELLI[this.chiave];
    if (!a || !c) return;
    posa(this.pulsante, b.s + 4, m.H - b.b - a.h * z, m);
    misura(this.pulsante, a.w, a.h, z, m);
    misura(this.tela, a.w, a.h, z, m);
    posa(this.icona, (c.x - 12) * z, (c.y - 12) * z, m);
    misura(this.icona, 24, 24, z, m);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (!e.repeat) this.prova();
  };
}
