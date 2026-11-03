/*
 * Fiaschetta di lumen: cure contate. Pulsante accanto all'anello dell'abilità (o tasto F).
 * Ogni sorso cura una parte della salute massima nell'arco di un secondo; i sorsi tornano uccidendo
 * élite e Mietitore. Il disegno è di Edoardo (un fotogramma per piena, 2/3, 1/3, vuota); se mancasse,
 * la fiala è fatta dal codice: il lumen ambra cala a ogni sorso e sotto ci sono le tacche dei sorsi rimasti.
 */
import { FIASCHETTA } from '../data/sopravvivenza';
import { arte, bordiHud, ingr, misura, misureHud, posa, type Arte } from './arte';

const L = 15; // misure della fiala fatta dal codice (riserva), in pixel dell'immagine
const A = 27;
const C = FIASCHETTA.colori;

export class Fiaschetta {
  sorsi: number = FIASCHETTA.sorsi;
  private curaRimasta = 0; // secondi di cura ancora in corso
  private pulsante: HTMLButtonElement;
  private tela: HTMLCanvasElement;
  private disegnati = -1;
  private attesaMisure = 0;
  private disegno: Arte | undefined = arte(FIASCHETTA.arte);

  constructor(
    contenitore: HTMLElement,
    private chiaveSpeciale: string, // l'anello dell'abilità, per mettersi accanto (es. "Speciale_Il_Lampionaio")
    private puo: () => boolean, // chiamata appena prima di bere: false se ora non si può (gioco fermo, salute piena)
  ) {
    this.pulsante = document.createElement('button');
    this.pulsante.type = 'button';
    this.pulsante.className = 'fiaschetta';
    this.pulsante.setAttribute('aria-label', 'Fiaschetta di lumen');
    this.tela = document.createElement('canvas');
    this.tela.className = 'arte';
    this.tela.width = this.disegno ? this.disegno.w : L;
    this.tela.height = this.disegno ? this.disegno.h : A;
    this.pulsante.append(this.tela);
    this.pulsante.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.bevi();
    });
    contenitore.append(this.pulsante);
    window.addEventListener('keydown', this.tasto);
    window.addEventListener('resize', this.ridimensiona);
    this.disegna();
    this.disponi();
  }

  /** Beve un sorso se ce n'è uno e se ora si può; restituisce true se ha bevuto. */
  bevi(): boolean {
    if (this.sorsi <= 0 || this.curaRimasta > 0 || !this.puo()) return false;
    this.sorsi--;
    this.curaRimasta = FIASCHETTA.durata;
    this.disegna();
    return true;
  }

  get curando(): boolean {
    return this.curaRimasta > 0;
  }

  /** Un passo: restituisce la parte di salute massima da curare in questo passo. */
  aggiorna(dt: number): number {
    if (this.curaRimasta <= 0) return 0;
    const t = Math.min(dt, this.curaRimasta);
    this.curaRimasta -= t;
    return (FIASCHETTA.cura * t) / FIASCHETTA.durata;
  }

  /** Aggiunge sorsi (élite), senza superare il massimo. */
  ricarica(n: number): void {
    this.sorsi = Math.min(FIASCHETTA.sorsi, this.sorsi + n);
    this.disegna();
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    window.removeEventListener('resize', this.ridimensiona);
    cancelAnimationFrame(this.attesaMisure);
    this.pulsante.remove();
  }

  /** Il fotogramma dei sorsi rimasti (0 = piena); senza disegno, la fiala fatta dal codice. */
  private disegna(): void {
    if (this.sorsi === this.disegnati) return;
    this.disegnati = this.sorsi;
    const g = this.tela.getContext('2d')!;
    g.clearRect(0, 0, this.tela.width, this.tela.height);
    const d = this.disegno;
    if (d) {
      g.drawImage(d.fotogrammi[Math.min(d.fotogrammi.length - 1, FIASCHETTA.sorsi - this.sorsi)], 0, 0);
      return;
    }
    // riserva: collo, pancia rotonda, lumen fino all'altezza dei sorsi rimasti, tacche sotto
    const dentro = (x: number, y: number): boolean => {
      if (y >= 1 && y <= 7 && x >= 5 && x <= 9) return true; // collo
      const dx = (x + 0.5 - 7.5) / 6.5, dy = (y + 0.5 - 15) / 7.5;
      return y >= 7 && y <= 22 && dx * dx + dy * dy <= 1;
    };
    const livello = 21 - (this.sorsi / FIASCHETTA.sorsi) * 13; // riga da cui comincia il lumen
    for (let y = 0; y < 23; y++) {
      for (let x = 0; x < L; x++) {
        if (!dentro(x, y)) continue;
        const bordo = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
        g.fillStyle = bordo ? C.bordo : y < 3 ? C.vetro : y >= livello ? (x === 4 ? C.luce : C.liquido) : C.vuoto;
        g.fillRect(x, y, 1, 1);
      }
    }
    for (let k = 0; k < FIASCHETTA.sorsi; k++) {
      const x = 1 + k * 5;
      g.fillStyle = C.bordo;
      g.fillRect(x - 1, 23, 5, 4);
      g.fillStyle = k < this.sorsi ? C.liquido : C.vuoto;
      g.fillRect(x, 24, 3, 2);
    }
  }

  private ridimensiona = (): void => {
    cancelAnimationFrame(this.attesaMisure);
    this.attesaMisure = requestAnimationFrame(() => this.disponi());
  };

  /** A destra dell'anello dell'abilità, staccata di FIASCHETTA.distanza pixel disegnati, appoggiata in basso. */
  private disponi(): void {
    const m = misureHud(), b = bordiHud(m), za = ingr('speciale', m), anello = arte(this.chiaveSpeciale);
    const z = this.disegno ? za : za * FIASCHETTA.ingrandimentoSegnaposto;
    const w = this.tela.width, h = this.tela.height;
    const dopo = anello ? anello.w * za : 0;
    posa(this.pulsante, b.s + 4 + dopo + FIASCHETTA.distanza * za, m.H - b.b - h * z, m);
    misura(this.pulsante, w, h, z, m);
    misura(this.tela, w, h, z, m);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyF') return;
    e.preventDefault();
    if (!e.repeat) this.bevi();
  };
}
