/*
 * Legenda: spiega in una schermata che cosa vogliono dire i simboli sopra i nemici e quali reazioni nascono
 * da due stati diversi. Si apre dalla pausa («Stati») e dal «?» della scelta dei doni. I testi vengono dai numeri veri.
 */
import { AFFINITA_TUTTE, INFO_AFFINITA, INFO_REAZIONI } from '../data/spiegazioni';
import { immagine, misura, misureHud, retino } from './arte';

export class Legenda {
  private radice = document.createElement('div');

  constructor(contenitore: HTMLElement) {
    this.radice.className = 'legenda';
    this.radice.hidden = true;
    this.radice.style.backgroundImage = `url(${retino(14)})`;
    this.radice.addEventListener('click', () => this.chiudi());
    contenitore.append(this.radice);
  }

  apri(): void {
    const m = misureHud(), k = Math.max(1, Math.round(24 / (11 * m.px)));
    const simbolo = (s: string): HTMLElement => {
      const im = immagine(s);
      misura(im, 11, 11, k, m);
      return im;
    };
    const voce = (figure: HTMLElement[], nome: string, colore: string, testo: string): HTMLElement => {
      const v = document.createElement('div');
      v.className = 'legenda-voce';
      const t = document.createElement('span'), b = document.createElement('b');
      b.textContent = nome;
      b.style.color = colore;
      t.append(b, ` ${testo}`);
      v.append(...figure, t);
      return v;
    };
    const titolo = (t: string): HTMLElement => {
      const h = document.createElement('h2');
      h.textContent = t;
      return h;
    };
    const nota = (t: string): HTMLElement => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    };
    const chiudi = document.createElement('button');
    chiudi.type = 'button';
    chiudi.className = 'legenda-chiudi';
    chiudi.textContent = 'Chiudi';
    this.radice.replaceChildren(
      titolo('Stati'),
      nota('Le armi a volte lasciano un simbolo sopra il nemico.'),
      ...AFFINITA_TUTTE.map((a) => {
        const i = INFO_AFFINITA[a];
        return voce([simbolo(i.simbolo)], i.stato, i.colore, `(${i.nome}): ${i.effetto()}`);
      }),
      titolo('Reazioni'),
      nota('Due stati diversi sullo stesso nemico si consumano e fanno:'),
      ...INFO_REAZIONI.map((r) => voce(
        r.stati[1] ? [simbolo(INFO_AFFINITA[r.stati[0]].simbolo), simbolo(INFO_AFFINITA[r.stati[1]].simbolo)] : [simbolo(INFO_AFFINITA[r.stati[0]].simbolo)],
        r.nome, r.colore, `${r.stati[1] ? '' : '(con qualsiasi altro stato) '}${r.effetto()}`,
      )),
      chiudi,
    );
    this.radice.hidden = false;
    window.addEventListener('keydown', this.tasto, true);
    chiudi.focus();
  }

  private chiudi(): void {
    this.radice.hidden = true;
    window.removeEventListener('keydown', this.tasto, true);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code === 'Escape') {
      e.stopImmediatePropagation(); // Esc chiude solo la legenda, non anche la pausa sotto
      this.chiudi();
    }
  };
}
