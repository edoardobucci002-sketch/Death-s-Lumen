/*
 * La barra della salute del capo in campo, il Campanaro (mini-boss, 17/11) o Seth (Boss, 18/11): in cima allo schermo,
 * con il nome in Tiny5 sopra e i colori del capo. È HTML
 * sopra il gioco, come la pausa; la barra è una tela piccola ingrandita a pixel interi. Si vede solo con il capo in campo.
 */
import { CAMPANARO } from '../data/campanaro';
import { SETH } from '../data/seth';
import { tela } from './scritte';

const LARGO = 120; // pixel disegnati della barra
const ALTO = 6;
const ZOOM = 3; // ingrandimento intero

export class BarraCapo {
  private readonly radice = document.createElement('div');
  private readonly barra = document.createElement('canvas');
  private ultimo = -1;
  private readonly nomi: HTMLCanvasElement[];
  private seth = false;

  constructor(contenitore: HTMLElement) {
    this.radice.className = 'stanze-capo';
    this.radice.hidden = true;
    this.nomi = [CAMPANARO.nome, SETH.nome].map((t) => {
      const nome = tela(t, '#efe3c8', '#000000');
      nome.style.width = `${nome.width * 2}px`;
      nome.style.height = `${nome.height * 2}px`;
      return nome;
    });
    this.nomi[1].hidden = true;
    this.barra.width = LARGO;
    this.barra.height = ALTO;
    this.barra.style.width = `${LARGO * ZOOM}px`;
    this.barra.style.height = `${ALTO * ZOOM}px`;
    this.radice.append(...this.nomi, this.barra);
    contenitore.append(this.radice);
  }

  /** parte: la salute rimasta da 0 a 1; null = nessun capo in campo. seth: il capo è Seth (se no il Campanaro). */
  aggiorna(parte: number | null, seth = false): void {
    this.radice.hidden = parte === null;
    if (parte === null) return;
    const pieno = Math.round((LARGO - 2) * Math.max(0, Math.min(1, parte)));
    if (pieno === this.ultimo && seth === this.seth) return;
    this.ultimo = pieno;
    if (seth !== this.seth) {
      this.seth = seth;
      this.nomi[0].hidden = seth;
      this.nomi[1].hidden = !seth;
    }
    const g = this.barra.getContext('2d')!, C = seth ? SETH.colori : CAMPANARO.colori;
    g.fillStyle = C.bordoBarra;
    g.fillRect(0, 0, LARGO, ALTO);
    g.fillStyle = C.fondoBarra;
    g.fillRect(1, 1, LARGO - 2, ALTO - 2);
    g.fillStyle = C.barra;
    g.fillRect(1, 1, pieno, ALTO - 2);
  }
}
