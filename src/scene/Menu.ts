/*
 * Menu: selezione del personaggio con le schede (nome, motto, ritratto animato, biografia, sprite in gioco,
 * arma iniziale, abilità speciale, barre delle statistiche, citazione, record).
 * È tutto HTML sopra il gioco; frecce o tasti ← → per cambiare, Invio o «Inizia la notte» per partire.
 */
import Phaser from 'phaser';
import { PERSONAGGI, type Personaggio } from '../data/personaggi';
import { ARMI_INIZIALI } from '../data/armi';
import { ABILITA } from '../data/abilita';
import { voce } from '../sistema/asset';
import { leggiRecord } from '../sistema/record';
import { TelaAnimata } from '../sistema/ritratto';
import { tempo } from '../sistema/hud';

const BARRE = ['Vitalità', 'Danno', 'Velocità', 'Raggio', 'Controllo'];

export class Menu extends Phaser.Scene {
  private scelto = 0;
  private radice!: HTMLElement;
  private tele: TelaAnimata[] = [];

  constructor() {
    super('Menu');
  }

  create(): void {
    const interfaccia = document.getElementById('interfaccia')!;
    interfaccia.replaceChildren();
    this.radice = document.createElement('div');
    this.radice.className = 'menu';
    this.radice.innerHTML = `
      <header class="menu-testata">
        <h1>Death's Lumen</h1>
        <p>Sopravvivi alla veglia, fino all'alba.</p>
      </header>
      <nav class="menu-nomi">${PERSONAGGI.map((p, n) => `<button type="button" data-n="${n}" style="--colore:${p.colore}">${p.nome}</button>`).join('')}</nav>
      <div class="menu-scorri">
        <button type="button" class="menu-freccia" data-passo="-1" aria-label="Personaggio precedente">‹</button>
        <article class="scheda"></article>
        <button type="button" class="menu-freccia" data-passo="1" aria-label="Personaggio successivo">›</button>
      </div>
      <button type="button" class="menu-inizia">Inizia la notte</button>`;
    this.radice.addEventListener('click', (e) => {
      const b = (e.target as Element).closest('button');
      if (!b) return;
      if (b.dataset.n) this.mostra(Number(b.dataset.n));
      else if (b.dataset.passo) this.mostra((this.scelto + Number(b.dataset.passo) + PERSONAGGI.length) % PERSONAGGI.length);
      else if (b.classList.contains('menu-inizia')) this.inizia();
    });
    interfaccia.append(this.radice);
    window.addEventListener('keydown', this.tasto);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.tasto);
      this.fermaTele();
      this.radice.remove();
    });
    this.mostra(this.scelto);
  }

  private mostra(n: number): void {
    this.scelto = n;
    const p = PERSONAGGI[n];
    document.documentElement.style.setProperty('--accento', p.colore);
    this.radice.querySelectorAll<HTMLElement>('.menu-nomi button').forEach((b, k) => b.classList.toggle('scelto', k === n));
    const scheda = this.radice.querySelector('.scheda')!;
    scheda.innerHTML = this.scheda(p);
    // le icone della v0 sono piccole: si ingrandiscono di 2 volte esatte
    scheda.querySelectorAll('img').forEach((im) => im.addEventListener('load', () => (im.style.width = `${im.naturalWidth * 2}px`), { once: true }));
    this.fermaTele();
    const tele = scheda.querySelectorAll('canvas');
    this.tele = [
      new TelaAnimata(tele[0], this, p.ritratto, 'idle'),
      new TelaAnimata(tele[1], this, p.sprite, 'idle'),
      new TelaAnimata(tele[2], this, p.sprite, 'walk'),
    ];
  }

  private scheda(p: Personaggio): string {
    const arma = ARMI_INIZIALI[p.armaIniziale];
    const abilita = ABILITA[p.abilita];
    const img = (chiave: string): string => {
      const v = voce(this, chiave);
      return v ? `<img alt="" src="${v.immagine}">` : '';
    };
    const record = leggiRecord(p.id);
    return `
      <div class="scheda-ritratto"><canvas aria-label="Ritratto: ${p.nome}"></canvas></div>
      <div class="scheda-testi">
        <h2>${p.nome}</h2>
        <p class="scheda-motto">${p.motto}</p>
        <p class="scheda-bio">${p.biografia}</p>
        <div class="scheda-sprite"><canvas aria-label="Fermo"></canvas><canvas aria-label="In cammino"></canvas></div>
        <dl class="scheda-doti">
          <div><dt>Arma iniziale</dt><dd>${img(arma.icona)}${arma.nome}</dd></div>
          <div><dt>Abilità speciale</dt><dd>${img(abilita.icona)}${abilita.nome}</dd></div>
        </dl>
        <div class="scheda-barre">${p.barre.map((v, k) => `<div><span>${BARRE[k]}</span><i>${'<b></b>'.repeat(v)}${'<b class="vuota"></b>'.repeat(6 - v)}</i></div>`).join('')}</div>
        <blockquote class="scheda-citazione">«${p.citazione}»</blockquote>
        <p class="scheda-record">${record ? `Record: ${tempo(record)}` : 'Nessun record: la prima notte ti aspetta.'}</p>
      </div>`;
  }

  private inizia(): void {
    this.scene.start('Gioco', { pg: PERSONAGGI[this.scelto].id });
  }

  private fermaTele(): void {
    for (const t of this.tele) t.ferma();
    this.tele = [];
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.mostra((this.scelto + PERSONAGGI.length - 1) % PERSONAGGI.length);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.mostra((this.scelto + 1) % PERSONAGGI.length);
    else if (e.code === 'Enter' || e.code === 'Space') this.inizia();
    else return;
    e.preventDefault();
  };
}
