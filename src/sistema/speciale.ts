/*
 * Abilità speciale: anello del personaggio in basso (o tasto Spazio). In ricarica l'anello è grigio
 * (Speciale_<Nome>_Ricarica) e si colora in senso orario, pixel per pixel; quando è pronto è tutto colorato.
 * Quando è pronta e si preme, chiama usa(); la ricarica segue la Clessidra e il personaggio.
 * Con i Ceri gemelli (Rosario) ha più cariche: si ricarica una alla volta.
 * Finché non c'è nessuna carica, sopra l'icona si leggono i secondi che mancano (conto alla rovescia).
 */
import { PRONTA_DOPO, type Abilita } from '../data/abilita';
import { ANELLI, FASCE, TESTI } from '../data/hud';
import { angoliFascia, arte, bordiHud, fasce, immagine, ingr, misura, misureHud, posa } from './arte';
import { Tacche } from './tacche';

export class Speciale {
  attesa: number = PRONTA_DOPO; // secondi alla prossima volta che è pronta (0 se ha tutte le cariche)
  cariche = 0; // quante volte si può usare adesso
  caricheMassime = 1;
  private pulsante: HTMLButtonElement;
  private tela: HTMLCanvasElement;
  private tacche: Tacche;
  private icona: HTMLImageElement;
  private conto = document.createElement('div'); // i secondi che mancano
  private ultimoConto = -1;
  private colore: ImageData | null = null;
  private grigio: ImageData | null = null;
  private uscita: ImageData | null = null;
  private ultimaParte = -1;
  private ricaricaAttuale: number;
  private chiave: string;
  private attesaMisure = 0;
  private sopra: { tela: HTMLCanvasElement; spazio: number } | null = null; // tacche della Grazia (posto «fascia»), accanto al pulsante

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
    const col = arte(this.chiave), gr = arte(`${this.chiave}_Ricarica`), c = ANELLI[this.chiave];
    this.tacche = new Tacche(col?.w ?? 1, col?.h ?? 1, c?.x ?? 0, c?.y ?? 0); // solo con più cariche (Ceri gemelli)
    this.conto.className = 'speciale-conto';
    this.pulsante.append(this.tela, this.icona, this.tacche.tela, this.conto);
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
    this.tacche.passa(dt);
    this.ricaricaAttuale = this.abilita.ricarica * fattore;
    if (this.attesa > 0) {
      this.attesa = Math.max(0, this.attesa - dt);
      if (this.attesa <= 0) {
        this.cariche++;
        if (this.cariche < this.caricheMassime) this.attesa = this.ricaricaAttuale;
      }
    } else if (this.cariche < this.caricheMassime) {
      this.attesa = this.ricaricaAttuale; // più cariche massime di colpo (amuleto acceso)
    }
    this.tacche.mostra(this.cariche, this.caricheMassime > 1 ? this.caricheMassime : 0);
    const parte = this.cariche > 0 ? 100 : this.attesa > 0 ? Math.min(99, Math.round((1 - this.attesa / Math.max(this.ricaricaAttuale, PRONTA_DOPO)) * 100)) : 100;
    if (parte !== this.ultimaParte) {
      this.ultimaParte = parte;
      this.disegna(parte / 100);
      this.pulsante.classList.toggle('pronta', parte >= 100);
    }
    const conto = this.cariche > 0 || this.attesa <= 0 ? 0 : Math.ceil(this.attesa);
    if (conto !== this.ultimoConto) {
      this.ultimoConto = conto;
      this.conto.textContent = conto > 0 ? String(conto) : '';
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
    if (this.cariche <= 0 || !this.usa()) return;
    this.cariche--;
    if (this.attesa <= 0) this.attesa = this.ricaricaAttuale;
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

  /** In basso a sinistra (sul telefono in verticale in un angolo della fascia bassa); l'icona dell'abilità al centro del disco. */
  private disponi(): void {
    const m = misureHud(), b = bordiHud(m), z = ingr('speciale', m), a = arte(this.chiave), c = ANELLI[this.chiave];
    if (!a || !c) return;
    const f = fasce(m);
    if (f.attive) {
      const p = angoliFascia(m, f);
      posa(this.pulsante, FASCE.scambiaAngoli ? p.sinistra : p.destra - a.w * z, p.centroY - Math.round((a.h * z) / 2), m);
    } else posa(this.pulsante, b.s + 4, m.H - b.b - a.h * z, m);
    misura(this.pulsante, a.w, a.h, z, m);
    misura(this.tela, a.w, a.h, z, m);
    misura(this.tacche.tela, a.w, a.h, z, m);
    const ic = arte(this.abilita.icona), iw = ic?.w ?? 24, ih = ic?.h ?? 24; // segnaposto 24×24, icone vere 38×38 (tutto il disco)
    posa(this.icona, (c.x - iw / 2) * z, (c.y - ih / 2) * z, m);
    misura(this.icona, iw, ih, z, m);
    posa(this.conto, (c.x - c.r) * z, (c.y - c.r) * z, m); // un quadrato attorno al disco: il numero sta al centro
    misura(this.conto, c.r * 2, c.r * 2, z, m);
    Object.assign(this.conto.style, { fontSize: `${TESTI.ricarica * z * m.px}px`, lineHeight: '1' });
    if (this.sopra) {
      // accanto al pulsante, verso il centro dello schermo, all'altezza del disco
      const t = this.sopra.tela, aSinistra = this.pulsante.getBoundingClientRect().left < innerWidth / 2;
      posa(t, aSinistra ? (a.w + this.sopra.spazio) * z : -(t.width + this.sopra.spazio) * z, (c.y - t.height / 2) * z, m);
      misura(t, t.width, t.height, z, m);
    }
  }

  /** Una piccola tela accanto al pulsante, verso il centro (le tacche della Grazia), a pixel disegnati come il pulsante. */
  mettiSopra(tela: HTMLCanvasElement, spazio: number): void {
    this.sopra = { tela, spazio };
    this.pulsante.append(tela);
    this.disponi();
  }

  /** Da chiamare quando la tela sopra cambia misura. */
  ridisponi(): void {
    this.disponi();
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (!e.repeat) this.prova();
  };
}
