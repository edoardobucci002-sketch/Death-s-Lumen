/*
 * Scelta del dono a ogni livello: il gioco si ferma e mostra fino a 3 carte estratte a caso con i pesi del GDD.
 * Si sceglie toccando una carta o con i tasti 1-2-3; «Rimescola» estrae carte nuove (2 volte per partita).
 * Escono: armi possedute da potenziare, armi comuni nuove (fino a 6 armi), doni passivi (fino a 6).
 * Quando non resta nulla da potenziare esce «Pane e vino».
 * Le carte sono quelle disegnate da Edoardo (Carta_Dono, e Carta_Dono_Scelta sotto il dito o il cursore),
 * messe a pixel di gioco interi; se tre carte non ci stanno, scendono di un ingrandimento intero.
 */
import type { Caso } from './caso';
import type { Arsenale } from './armi';
import { adattaZoom, arte, bordiHud, immagine, ingr, misura, misureHud, posa, retino, scriviIn } from './arte';
import { INTERNI, TESTI } from '../data/hud';
import { CARTE } from '../data/progressione';
import { ARMI_COMUNI, MAX_ARMI, type Arma } from '../data/armi';
import { MAX_PASSIVI, PASSIVI, type IdDono, type Passivo } from '../data/doni';

export type Dono = { tipo: 'arma'; arma: Arma; livello: number } | { tipo: 'passivo'; passivo: Passivo; livello: number } | { tipo: 'pane' };

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
    private passivi: Record<IdDono, number>, // livello di ogni dono passivo (0 = non posseduto)
    private caso: Caso,
  ) {
    this.radice = document.createElement('div');
    this.radice.className = 'doni';
    this.radice.hidden = true;
    this.radice.style.backgroundImage = `url(${retino(11)})`;
    this.radice.innerHTML = `
      <h2>Un nuovo dono</h2>
      <div class="doni-carte"></div>
      <button type="button" class="doni-rimescola"><span></span></button>`;
    this.radice.querySelector('.doni-rimescola')!.prepend(immagine('Pulsante_Scuro'));
    this.elenco = this.radice.querySelector('.doni-carte')!;
    this.rimescola = this.radice.querySelector('.doni-rimescola')!;
    this.rimescola.addEventListener('click', () => {
      if (this.rimescolate <= 0) return;
      this.rimescolate--;
      this.estrai();
    });
    contenitore.append(this.radice);
    window.addEventListener('keydown', this.tasto);
    window.addEventListener('resize', this.ridimensiona);
  }

  get aperta(): boolean {
    return !this.radice.hidden;
  }

  /** Mostra le carte; quando il giocatore sceglie, chiama scegli(dono). */
  mostra(scegli: (d: Dono) => void): void {
    this.scegli = scegli;
    this.radice.hidden = false;
    this.estrai();
  }

  /** Sceglie da sola la prima carta (prove automatiche). */
  scegliPrima(): void {
    if (this.carte[0]) this.chiudi(this.carte[0]);
  }

  /** Sceglie la carta indicata da quale(carte) (il bot delle simulazioni). */
  scegliCon(quale: (carte: readonly Dono[]) => number): void {
    const d = this.carte[quale(this.carte)];
    if (d) this.chiudi(d);
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    window.removeEventListener('resize', this.ridimensiona);
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
    if (this.arsenale.possedute.length < MAX_ARMI) {
      for (const a of ARMI_COMUNI) if (!this.arsenale.livello(a)) possibili.push({ dono: { tipo: 'arma', arma: a, livello: 1 }, peso: CARTE.armaNuova });
    }
    const posseduti = PASSIVI.filter((q) => this.passivi[q.id] > 0).length;
    for (const q of PASSIVI) {
      const l = this.passivi[q.id];
      if (l >= q.massimo || (!l && posseduti >= MAX_PASSIVI)) continue;
      possibili.push({ dono: { tipo: 'passivo', passivo: q, livello: l + 1 }, peso: l ? CARTE.donoPosseduto : CARTE.donoNuovo });
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
    this.rimescola.lastElementChild!.textContent = `Rimescola (${this.rimescolate})`;
    this.rimescola.disabled = this.rimescolate <= 0;
    this.disponi();
    (this.elenco.firstElementChild as HTMLElement | null)?.focus();
  }

  private carta(d: Dono, n: number): HTMLElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'doni-carta';
    const icona = d.tipo === 'arma' ? d.arma.icona : d.tipo === 'passivo' ? d.passivo.icona : null;
    const titolo = d.tipo === 'arma' ? d.arma.nome : d.tipo === 'passivo' ? d.passivo.nome : 'Pane e vino';
    const sotto = d.tipo === 'pane' ? `+${CARTE.paneEVino} salute`
      : d.livello === 1 ? (d.tipo === 'arma' ? 'Nuova arma' : 'Nuovo dono') : `Livello ${d.livello}`;
    const testo = d.tipo === 'arma' ? d.arma.livelli[d.livello - 1].testo : d.tipo === 'passivo' ? d.passivo.testo : 'Un ristoro nella notte.';
    b.innerHTML = `<strong class="doni-titolo"></strong><span class="doni-testo"><em></em> <span></span></span><span class="doni-tasto">${n + 1}</span>`;
    b.querySelector('strong')!.textContent = titolo;
    b.querySelector('em')!.textContent = sotto;
    b.querySelector('.doni-testo span')!.textContent = testo;
    b.prepend(immagine('Carta_Dono', 'doni-fondo'), immagine('Carta_Dono_Scelta', 'doni-scelta'));
    if (icona && arte(icona)) b.querySelector('strong')!.before(immagine(icona, 'doni-icona'));
    b.addEventListener('click', () => this.chiudi(d));
    return b;
  }

  private ridimensiona = (): void => {
    if (this.aperta) this.disponi();
  };

  /** Titolo, tre carte affiancate e Rimescola, in pixel di gioco interi (come nella bozza). */
  private disponi(): void {
    const m = misureHud(), b = bordiHud(m), px = m.px;
    const c = arte('Carta_Dono'), r = arte('Pulsante_Scuro'), alto = arte('Pulsante_Acceso');
    if (!c || !r || !alto) return;
    this.radice.style.backgroundSize = `${4 * px}px ${4 * px}px`;
    // Rimescola si tocca su tutta l'altezza dei pulsanti più alti (il pulsante scuro è disegnato più basso)
    const zt = ingr('pulsanti', m), titolo = 32 * m.raddoppio, sotto = (TESTI.cartaTasto + 4) * m.raddoppio, riga = Math.max(r.h, alto.h);
    const carte = [...this.elenco.children] as HTMLElement[], n = carte.length;
    const alta = m.H - b.a - b.b, larga = m.W - b.s - b.d;
    const zz = adattaZoom(ingr('carte', m), (k) => n * c.w * k + (n - 1) * 4 * k <= larga && titolo + c.h * k + sotto + 8 + riga * zt <= alta);
    const tot = n * c.w * zz + (n - 1) * 4 * zz, x0 = Math.round(m.W / 2 - tot / 2);
    const altezza = titolo + c.h * zz + sotto + 8 + riga * zt;
    let y = b.a + Math.max(0, Math.round((alta - altezza) / 2));
    const h2 = this.radice.querySelector('h2') as HTMLElement;
    posa(h2, 0, y, m);
    Object.assign(h2.style, { width: `${m.W * px}px`, fontSize: `${22 * m.raddoppio * px}px`, lineHeight: `${titolo * px}px` });
    y += titolo;
    const ri = INTERNI.Carta_Dono;
    carte.forEach((el, i) => {
      posa(el, x0 + i * (c.w + 4) * zz, y, m);
      misura(el, c.w, c.h, zz, m);
      for (const im of el.querySelectorAll<HTMLElement>('.doni-fondo, .doni-scelta')) misura(im, c.w, c.h, zz, m);
      const ic = el.querySelector<HTMLElement>('.doni-icona'), zi = Math.max(1, zz - 1);
      if (ic) {
        posa(ic, (ri.icona.x + ri.icona.l / 2) * zz - 12 * zi, (ri.icona.y + ri.icona.a / 2) * zz - 12 * zi, m);
        misura(ic, 24, 24, zi, m);
      }
      scriviIn(el.querySelector('.doni-titolo') as HTMLElement, ri.titolo, zz, TESTI.cartaTitolo, m);
      scriviIn(el.querySelector('.doni-testo') as HTMLElement, ri.testo, zz, TESTI.cartaTesto, m);
      const t = el.querySelector('.doni-tasto') as HTMLElement;
      posa(t, 0, c.h * zz + 2, m);
      Object.assign(t.style, { width: `${c.w * zz * px}px`, fontSize: `${TESTI.cartaTasto * m.raddoppio * px}px` });
    });
    y += c.h * zz + sotto + 8;
    posa(this.rimescola, Math.round(m.W / 2 - (r.w * zt) / 2), y, m);
    misura(this.rimescola, r.w, riga, zt, m);
    const im = this.rimescola.firstElementChild as HTMLElement, su = Math.round(((riga - r.h) * zt) / 2);
    misura(im, r.w, r.h, zt, m);
    im.style.top = `${su * px}px`;
    const rt = INTERNI.Pulsante_Scuro.testo;
    scriviIn(this.rimescola.lastElementChild as HTMLElement, { ...rt, y: rt.y + Math.round((riga - r.h) / 2) }, zt, TESTI.pulsante, m);
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
