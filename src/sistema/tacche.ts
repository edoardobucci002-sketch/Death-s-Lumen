/*
 * Tacche intorno a un pulsante rotondo: una per sorso della fiaschetta, o una per carica dell'abilità (Ceri gemelli).
 * Accese se piene, scure se vuote, con un breve lampo quando una si riempie. Stanno in un arco sopra il pulsante,
 * su una tela grande come il suo disegno, a pixel disegnati interi. Misure e colori in TACCHE, src/data/hud.ts.
 */
import { TACCHE } from '../data/hud';

export class Tacche {
  readonly tela = document.createElement('canvas');
  private piene = -1;
  private massimo = -1;
  private lampo = 0; // secondi di lampo rimasti
  private primaAccesa = 0; // da quale tacca comincia il lampo

  constructor(l: number, a: number, private cx: number, private cy: number) {
    this.tela.className = 'arte';
    this.tela.width = l;
    this.tela.height = a;
  }

  /** Quante tacche ci sono e quante sono piene; ridisegna solo se cambia qualcosa. Con massimo 0 non si vede niente. */
  mostra(piene: number, massimo: number): void {
    if (piene === this.piene && massimo === this.massimo) return;
    if (this.piene >= 0 && piene > this.piene) {
      this.primaAccesa = this.piene;
      this.lampo = TACCHE.lampo;
    }
    this.piene = piene;
    this.massimo = massimo;
    this.disegna();
  }

  /** Il tempo del lampo; quando finisce, la tacca torna al colore normale. */
  passa(dt: number): void {
    if (this.lampo <= 0) return;
    this.lampo -= dt;
    if (this.lampo <= 0) this.disegna();
  }

  private disegna(): void {
    const g = this.tela.getContext('2d')!, l = TACCHE.lato, n = this.massimo;
    g.clearRect(0, 0, this.tela.width, this.tela.height);
    const passo = n > 1 ? (TACCHE.arco * Math.PI) / 180 / (n - 1) : 0;
    for (let i = 0; i < n; i++) {
      const ang = (i - (n - 1) / 2) * passo; // 0 in alto, verso destra i positivi
      const x = Math.round(this.cx + Math.sin(ang) * TACCHE.raggio - l / 2), y = Math.round(this.cy - Math.cos(ang) * TACCHE.raggio - l / 2);
      const accesa = i < this.piene, lampeggia = accesa && i >= this.primaAccesa && this.lampo > 0;
      g.fillStyle = TACCHE.colori.bordo;
      g.fillRect(x - 1, y - 1, l + 2, l + 2);
      g.fillStyle = lampeggia ? TACCHE.colori.lampo : accesa ? TACCHE.colori.accesa : TACCHE.colori.scura;
      g.fillRect(x, y, l, l);
    }
  }
}
