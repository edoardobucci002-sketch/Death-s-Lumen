/*
 * Fiaschetta di lumen: cure contate. Pulsante accanto all'anello dell'abilità (o tasto F).
 * Ogni sorso cura una parte della salute massima nell'arco di un secondo; i sorsi tornano uccidendo
 * élite e Mietitore. Pulsante tondo uguale a quello dell'abilità: finché manca Fiaschetta_Lumen_Tonda, il codice
 * compone la stessa cornice dell'abilità con dentro una fiala. I sorsi si leggono sulle tacche, una per sorso massimo.
 */
import { FIASCHETTA } from '../data/sopravvivenza';
import { ANELLI, FASCE } from '../data/hud';
import { angoliFascia, arte, bordiHud, fasce, ingr, misura, misureHud, posa } from './arte';
import { Tacche } from './tacche';

const L = 15; // misure della fiala fatta dal codice, in pixel dell'immagine
const A = 23;
const C = FIASCHETTA.colori;

export class Fiaschetta {
  sorsi: number = FIASCHETTA.sorsi;
  massimo: number = FIASCHETTA.sorsi; // la Lacrima di lumen lo alza
  private curaRimasta = 0; // secondi di cura ancora in corso
  private pulsante: HTMLButtonElement;
  private tela: HTMLCanvasElement;
  private tacche: Tacche;
  private attesaMisure = 0;

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
    const anello = arte(chiaveSpeciale), c = ANELLI[chiaveSpeciale];
    this.tela.width = anello?.w ?? 2 * L;
    this.tela.height = anello?.h ?? 2 * A;
    this.tacche = new Tacche(this.tela.width, this.tela.height, c?.x ?? L, c?.y ?? A);
    this.disegnaPulsante();
    this.pulsante.append(this.tela, this.tacche.tela);
    this.pulsante.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.bevi();
    });
    contenitore.append(this.pulsante);
    window.addEventListener('keydown', this.tasto);
    window.addEventListener('resize', this.ridimensiona);
    this.mostraTacche();
    this.disponi();
  }

  /** Beve un sorso se ce n'è uno e se ora si può; restituisce true se ha bevuto. */
  bevi(): boolean {
    if (this.sorsi <= 0 || this.curaRimasta > 0 || !this.puo()) return false;
    this.sorsi--;
    this.curaRimasta = FIASCHETTA.durata;
    this.mostraTacche();
    return true;
  }

  get curando(): boolean {
    return this.curaRimasta > 0;
  }

  /** Un passo: restituisce la parte di salute massima da curare in questo passo. */
  aggiorna(dt: number): number {
    this.tacche.passa(dt);
    if (this.curaRimasta <= 0) return 0;
    const t = Math.min(dt, this.curaRimasta);
    this.curaRimasta -= t;
    return (FIASCHETTA.cura * t) / FIASCHETTA.durata;
  }

  /** Aggiunge sorsi (élite), senza superare il massimo. */
  ricarica(n: number): void {
    this.sorsi = Math.min(this.massimo, this.sorsi + n);
    this.mostraTacche();
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    window.removeEventListener('resize', this.ridimensiona);
    cancelAnimationFrame(this.attesaMisure);
    this.pulsante.remove();
  }

  private mostraTacche(): void {
    this.tacche.mostra(this.sorsi, this.massimo);
  }

  /** Il disegno di Edoardo se c'è; altrimenti la cornice dell'abilità, con il disco vuotato e la fiala al centro. */
  private disegnaPulsante(): void {
    const g = this.tela.getContext('2d')!, vero = arte(FIASCHETTA.arte);
    if (vero) {
      g.drawImage(vero.tela, 0, 0);
      return;
    }
    const anello = arte(this.chiaveSpeciale), c = ANELLI[this.chiaveSpeciale];
    if (anello) g.drawImage(anello.tela, 0, 0);
    const cx = c?.x ?? L, cy = c?.y ?? A, r = c?.r ?? L;
    g.fillStyle = C.vuoto;
    for (let y = -r; y < r; y++) for (let x = -r; x < r; x++) if ((x + 0.5) ** 2 + (y + 0.5) ** 2 <= r * r) g.fillRect(cx + x, cy + y, 1, 1);
    const x0 = cx - Math.floor(L / 2), y0 = cy - Math.floor(A / 2);
    const dentro = (x: number, y: number): boolean => {
      if (y >= 1 && y <= 7 && x >= 5 && x <= 9) return true; // collo
      const dx = (x + 0.5 - 7.5) / 6.5, dy = (y + 0.5 - 15) / 7.5;
      return y >= 7 && y <= 22 && dx * dx + dy * dy <= 1;
    };
    for (let y = 0; y < A; y++) {
      for (let x = 0; x < L; x++) {
        if (!dentro(x, y)) continue;
        const bordo = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
        g.fillStyle = bordo ? C.bordo : y < 3 ? C.vetro : x === 4 ? C.luce : C.liquido;
        g.fillRect(x0 + x, y0 + y, 1, 1);
      }
    }
  }

  private ridimensiona = (): void => {
    cancelAnimationFrame(this.attesaMisure);
    this.attesaMisure = requestAnimationFrame(() => this.disponi());
  };

  /** Sul telefono in un angolo della fascia bassa; altrove a destra dell'abilità, staccata di FIASCHETTA.distanza pixel disegnati. */
  private disponi(): void {
    const m = misureHud(), b = bordiHud(m), za = ingr('speciale', m), anello = arte(this.chiaveSpeciale);
    const z = za;
    const w = this.tela.width, h = this.tela.height;
    const dopo = anello ? anello.w * za : 0, f = fasce(m);
    if (f.attive) {
      const p = angoliFascia(m, f);
      posa(this.pulsante, FASCE.scambiaAngoli ? p.destra - w * z : p.sinistra, p.centroY - Math.round((h * z) / 2), m);
    } else posa(this.pulsante, b.s + 4 + dopo + FIASCHETTA.distanza * za, m.H - b.b - h * z, m);
    misura(this.pulsante, w, h, z, m);
    misura(this.tela, w, h, z, m);
    misura(this.tacche.tela, w, h, z, m);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyF') return;
    e.preventDefault();
    if (!e.repeat) this.bevi();
  };
}
