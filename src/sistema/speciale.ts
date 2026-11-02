/*
 * Abilità speciale: pulsante rotondo in basso a sinistra (o tasto Spazio) con la ricarica che si riempie in cerchio.
 * Quando è pronta e si preme, chiama usa(); la ricarica segue la Clessidra e il personaggio.
 */
import type Phaser from 'phaser';
import { voce } from './asset';
import { PRONTA_DOPO, type Abilita } from '../data/abilita';

export class Speciale {
  attesa: number = PRONTA_DOPO; // secondi alla prossima volta che è pronta
  private pulsante: HTMLButtonElement;
  private ultimaParte = -1;
  private ricaricaAttuale: number;

  constructor(
    contenitore: HTMLElement,
    scena: Phaser.Scene,
    private abilita: Abilita,
    private usa: () => boolean, // restituisce false se ora non si può usare (gioco fermo)
  ) {
    this.ricaricaAttuale = abilita.ricarica;
    this.pulsante = document.createElement('button');
    this.pulsante.type = 'button';
    this.pulsante.className = 'speciale';
    this.pulsante.setAttribute('aria-label', abilita.nome);
    const v = voce(scena, abilita.icona);
    if (v) this.pulsante.innerHTML = `<img alt="" src="${v.immagine}">`;
    const im = this.pulsante.querySelector('img');
    if (im) im.addEventListener('load', () => (im.style.width = `${im.naturalWidth * 2}px`), { once: true });
    this.pulsante.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.prova();
    });
    contenitore.append(this.pulsante);
    window.addEventListener('keydown', this.tasto);
  }

  /** Avanza la ricarica; fattore è il moltiplicatore delle attese (Clessidra, Strega). */
  aggiorna(dt: number, fattore: number): void {
    this.ricaricaAttuale = this.abilita.ricarica * fattore;
    if (this.attesa > 0) this.attesa = Math.max(0, this.attesa - dt);
    const parte = Math.round((1 - this.attesa / Math.max(this.ricaricaAttuale, PRONTA_DOPO)) * 100);
    if (parte !== this.ultimaParte) {
      this.ultimaParte = parte;
      this.pulsante.style.setProperty('--carica', `${this.attesa > 0 ? Math.min(parte, 99) : 100}%`);
      this.pulsante.classList.toggle('pronta', this.attesa <= 0);
    }
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    this.pulsante.remove();
  }

  /** Usa l'abilità se è pronta (pulsante, Spazio o bot). */
  prova(): void {
    if (this.attesa > 0 || !this.usa()) return;
    this.attesa = this.ricaricaAttuale;
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (!e.repeat) this.prova();
  };
}
