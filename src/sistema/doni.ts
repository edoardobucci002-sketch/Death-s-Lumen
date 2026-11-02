/*
 * Scelta del dono a ogni livello: il gioco si ferma e mostra fino a 3 carte estratte a caso con i pesi del GDD.
 * Si sceglie toccando una carta o con i tasti 1-2-3; «Rimescola» estrae carte nuove (2 volte per partita).
 * Nella M3 si può solo potenziare l'arma iniziale; quando è al massimo esce «Pane e vino».
 */
import type Phaser from 'phaser';
import type { Caso } from './caso';
import type { Arsenale } from './armi';
import { voce } from './asset';
import { CARTE } from '../data/progressione';
import type { Arma } from '../data/armi';

export type Dono = { tipo: 'arma'; arma: Arma; livello: number } | { tipo: 'pane' };

export class Doni {
  private radice: HTMLElement;
  private elenco: HTMLElement;
  private rimescola: HTMLButtonElement;
  private rimescolate: number = CARTE.rimescolate;
  private carte: Dono[] = [];
  private scegli: ((d: Dono) => void) | null = null;

  constructor(
    contenitore: HTMLElement,
    private arsenale: Arsenale,
    private armaIniziale: Arma,
    private caso: Caso,
    private scena: Phaser.Scene,
  ) {
    this.radice = document.createElement('div');
    this.radice.className = 'doni';
    this.radice.hidden = true;
    this.radice.innerHTML = `
      <h2>Un nuovo dono</h2>
      <div class="doni-carte"></div>
      <button type="button" class="doni-rimescola"></button>`;
    this.elenco = this.radice.querySelector('.doni-carte')!;
    this.rimescola = this.radice.querySelector('.doni-rimescola')!;
    this.rimescola.addEventListener('click', () => {
      if (this.rimescolate <= 0) return;
      this.rimescolate--;
      this.estrai();
    });
    contenitore.append(this.radice);
    window.addEventListener('keydown', this.tasto);
  }

  get aperta(): boolean {
    return !this.radice.hidden;
  }

  /** Mostra le carte; quando il giocatore sceglie, chiama scegli(dono). */
  mostra(scegli: (d: Dono) => void): void {
    this.scegli = scegli;
    this.estrai();
    this.radice.hidden = false;
  }

  /** Sceglie da sola la prima carta (prove automatiche e simulazioni). */
  scegliPrima(): void {
    if (this.carte[0]) this.chiudi(this.carte[0]);
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    this.radice.remove();
  }

  private estrai(): void {
    // possibili doni con il loro peso
    const possibili: { dono: Dono; peso: number }[] = [];
    for (const p of this.arsenale.possedute) {
      if (p.livello >= CARTE.livelloMassimo) continue;
      possibili.push({
        dono: { tipo: 'arma', arma: p.arma, livello: p.livello + 1 },
        peso: p.arma === this.armaIniziale ? CARTE.armaIniziale : CARTE.armaPosseduta,
      });
    }
    this.carte = [];
    while (this.carte.length < CARTE.quante && possibili.length) {
      let totale = 0;
      for (const q of possibili) totale += q.peso;
      let r = this.caso.numero() * totale;
      let k = 0;
      while (k < possibili.length - 1 && (r -= possibili[k].peso) >= 0) k++;
      this.carte.push(possibili[k].dono);
      possibili.splice(k, 1);
    }
    if (!this.carte.length) this.carte.push({ tipo: 'pane' });

    this.elenco.replaceChildren(...this.carte.map((d, n) => this.carta(d, n)));
    this.rimescola.textContent = `Rimescola (${this.rimescolate})`;
    this.rimescola.disabled = this.rimescolate <= 0;
    (this.elenco.firstElementChild as HTMLElement | null)?.focus();
  }

  private carta(d: Dono, n: number): HTMLElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'doni-carta';
    const icona = d.tipo === 'arma' ? d.arma.icona : null;
    const img = icona && voce(this.scena, icona) ? `<img alt="" src="${voce(this.scena, icona)!.immagine}">` : '<span class="doni-vuota"></span>';
    const titolo = d.tipo === 'arma' ? d.arma.nome : 'Pane e vino';
    const sotto = d.tipo === 'arma' ? (d.livello === 1 ? 'Nuova' : `Livello ${d.livello}`) : `+${CARTE.paneEVino} salute`;
    const testo = d.tipo === 'arma' ? d.arma.livelli[d.livello - 1].testo : 'Un ristoro nella notte.';
    b.innerHTML = `<span class="doni-tasto">${n + 1}</span>${img}<span class="doni-testi"><strong>${titolo}</strong><em>${sotto}</em><span>${testo}</span></span>`;
    // le icone della v0 sono piccole: si ingrandiscono di un numero intero di volte
    const im = b.querySelector('img');
    if (im) im.addEventListener('load', () => (im.style.width = `${im.naturalWidth * 3}px`), { once: true });
    b.addEventListener('click', () => this.chiudi(d));
    return b;
  }

  private chiudi(d: Dono): void {
    if (!this.aperta) return;
    this.radice.hidden = true;
    const scegli = this.scegli;
    this.scegli = null;
    scegli?.(d);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (!this.aperta) return;
    const n = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
    if (n >= 0 && this.carte[n]) {
      e.preventDefault();
      this.chiudi(this.carte[n]);
    }
  };
}
