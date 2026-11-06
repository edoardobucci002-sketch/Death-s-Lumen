/*
 * Scelta del dono a ogni livello: il gioco si ferma e mostra fino a 3 carte estratte a caso con i pesi del GDD.
 * Si sceglie toccando una striscia o con i tasti 1-2-3 (4 nei reliquiari); «Rimescola» estrae carte nuove (2 volte per partita).
 * Escono: armi possedute da potenziare, armi comuni nuove (fino a 6 armi), doni passivi (fino a 6).
 * Quando non resta nulla da potenziare esce «Pane e vino».
 * Lo stesso schermo serve ai reliquiari (mostraReliquiario): tre amuleti del Rosario e il potenziamento, senza Rimescola.
 * Le scelte sono strisce orizzontali una sotto l'altra (Striscia_Dono, e Striscia_Dono_Scelta sotto il dito o il cursore):
 * icona, nome, numeri che cambiano e spiegazione, a colpo d'occhio (src/sistema/scheda.ts). Se non ci stanno, scendono di un ingrandimento intero.
 */
import type { Caso } from './caso';
import type { Arsenale } from './armi';
import { adattaZoom, arte, bordiHud, fasce, immagine, ingr, misura, misureHud, posa, retino, scriviIn } from './arte';
import { INTERNI, STRISCIA, TESTI } from '../data/hud';
import { scalaScritta, scritta, scriviNel } from './scritte';
import { CARTE } from '../data/progressione';
import { ARMI_COMUNI, MAX_ARMI, type Arma } from '../data/armi';
import { MAX_PASSIVI, PASSIVI, type IdDono, type Passivo } from '../data/doni';
import type { Amuleto } from '../data/rosario';
import type { Unione } from '../data/unioni';
import { creaStrisce, schedaDono, type Riga } from './scheda';

export type Dono =
  | { tipo: 'arma'; arma: Arma; livello: number }
  | { tipo: 'passivo'; passivo: Passivo; livello: number }
  | { tipo: 'pane' }
  | { tipo: 'amuleto'; amuleto: Amuleto } // dal reliquiario (Rosario)
  | { tipo: 'unione'; unione: Unione; arma: Arma } // dal reliquiario: l'arma diventa la sua versione unita
  | { tipo: 'potenziamento' }; // dal reliquiario: il potenziamento a caso di prima

export class Doni {
  sospesa = false; // la pausa è aperta sopra la scelta: i tasti 1-2-3-4 non scelgono
  private radice: HTMLElement;
  private elenco: HTMLElement;
  private rimescola: HTMLButtonElement;
  private rimescolate: number = CARTE.rimescolate;
  private conRimescola = true;
  private carte: Dono[] = [];
  private scegli: ((d: Dono) => void) | null = null;

  constructor(
    contenitore: HTMLElement,
    private arsenale: Arsenale,
    private armaIniziale: Arma,
    private passivi: Record<IdDono, number>, // livello di ogni dono passivo (0 = non posseduto)
    private caso: Caso,
    private rosario: () => { usati: number; totale: number; unioni: boolean },
    private legenda: () => void,
    private disponibile: (id: string) => boolean, // armi e doni nuovi: solo se sbloccati nella Cappella
  ) {
    creaStrisce();
    this.radice = document.createElement('div');
    this.radice.className = 'doni';
    this.radice.hidden = true;
    this.radice.style.backgroundImage = `url(${retino(11)})`;
    this.radice.innerHTML = `
      <h2>Un nuovo dono</h2>
      <div class="doni-carte"></div>
      <button type="button" class="doni-rimescola"><span></span></button>
      <button type="button" class="doni-aiuto" aria-label="Stati e reazioni">?</button>
      <p class="doni-rimaste"></p>`;
    this.radice.querySelector('.doni-rimescola')!.prepend(immagine('Pulsante_Scuro'));
    this.elenco = this.radice.querySelector('.doni-carte')!;
    this.rimescola = this.radice.querySelector('.doni-rimescola')!;
    this.rimescola.addEventListener('click', () => {
      if (this.rimescolate <= 0) return;
      this.rimescolate--;
      this.estrai();
    });
    this.radice.querySelector('.doni-aiuto')!.addEventListener('click', () => this.legenda());
    contenitore.append(this.radice);
    window.addEventListener('keydown', this.tasto);
    window.addEventListener('resize', this.ridimensiona);
  }

  /** Rimescolate in più per tutta la veglia (Cero della scelta). */
  aggiungiRimescolate(n: number): void {
    this.rimescolate += n;
  }

  get aperta(): boolean {
    return !this.radice.hidden;
  }

  /** La scelta aperta è quella di un reliquiario. */
  get reliquiario(): boolean {
    return this.aperta && !this.conRimescola;
  }

  /** Stesse carte, numeri di oggi: dopo aver acceso o spento un amuleto dalla pausa. Non tira il caso e non consuma rimescolate. */
  aggiornaCarte(): void {
    if (this.aperta) this.disegnaCarte(this.conRimescola);
  }

  /** Mostra le carte; quando il giocatore sceglie, chiama scegli(dono). */
  mostra(scegli: (d: Dono) => void): void {
    this.scegli = scegli;
    this.radice.hidden = false;
    this.estrai();
  }

  /** Il reliquiario: le carte sono già scelte (amuleti e potenziamento), niente rimescolate. */
  mostraReliquiario(carte: Dono[], scegli: (d: Dono) => void): void {
    this.scegli = scegli;
    this.carte = carte;
    this.radice.hidden = false;
    this.disegnaCarte(false);
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
    // sbloccare oggetti aggiunge varietà, non toglie potenziamenti: il peso degli oggetti nuovi si divide tra tutti quelli disponibili
    const fattoreArmi = CARTE.pool.armi / ARMI_COMUNI.filter((a) => this.disponibile(a.id)).length;
    const fattoreDoni = CARTE.pool.doni / PASSIVI.filter((q) => this.disponibile(q.id)).length;
    for (const p of this.arsenale.possedute) {
      if (p.livello >= CARTE.livelloMassimo) continue;
      possibili.push({
        dono: { tipo: 'arma', arma: p.arma, livello: p.livello + 1 },
        peso: p.arma === this.armaIniziale ? CARTE.armaIniziale : CARTE.armaPosseduta,
      });
    }
    if (this.arsenale.possedute.length < MAX_ARMI) {
      for (const a of ARMI_COMUNI) if (!this.arsenale.livello(a) && this.disponibile(a.id)) possibili.push({ dono: { tipo: 'arma', arma: a, livello: 1 }, peso: CARTE.armaNuova * fattoreArmi });
    }
    const posseduti = PASSIVI.filter((q) => this.passivi[q.id] > 0).length;
    for (const q of PASSIVI) {
      const l = this.passivi[q.id];
      if (l >= q.massimo || (!l && (posseduti >= MAX_PASSIVI || !this.disponibile(q.id)))) continue;
      possibili.push({ dono: { tipo: 'passivo', passivo: q, livello: l + 1 }, peso: l ? CARTE.donoPosseduto : CARTE.donoNuovo * fattoreDoni });
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
    this.disegnaCarte(true);
  }

  /** Mette le carte sullo schermo; Rimescola e le sue righe solo per i livelli, non per i reliquiari. */
  private disegnaCarte(conRimescola: boolean): void {
    this.conRimescola = conRimescola;
    this.rimescola.hidden = !conRimescola;
    (this.radice.querySelector('.doni-rimaste') as HTMLElement).hidden = !conRimescola;
    scritta(this.radice.querySelector('h2')!, conRimescola ? 'Un nuovo dono' : 'Un reliquiario');
    this.elenco.replaceChildren(...this.carte.map((d, n) => this.carta(d, n)));
    // «Rimescola (2)» non stava nella targhetta: quante ne restano lo dice la riga sotto
    scritta(this.rimescola.lastElementChild!, 'Rimescola');
    this.rimescola.setAttribute('aria-label', `Rimescola, ne restano ${this.rimescolate}`);
    scritta(this.radice.querySelector('.doni-rimaste')!, this.rimescolate ? `ancora ${this.rimescolate}` : 'finite');
    this.rimescola.disabled = this.rimescolate <= 0;
    this.disponi();
    (this.elenco.firstElementChild as HTMLElement | null)?.focus();
  }

  private carta(d: Dono, n: number): HTMLElement {
    const r = this.rosario();
    const sc = schedaDono(d, { armi: this.arsenale.possedute.map((p) => p.arma), graniUsati: r.usati, graniTotali: r.totale, doni: this.passivi, unioni: r.unioni });
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `doni-carta ${sc.categoria}`;
    const pezzo = (tag: string, classe: string, testo = ''): HTMLElement => {
      const e = document.createElement(tag);
      e.className = classe;
      e.textContent = testo;
      return e;
    };
    const titolo = pezzo('strong', 'doni-titolo');
    scritta(titolo, sc.nome);
    const dati = pezzo('span', 'doni-dati');
    for (const x of sc.dati) {
      const e = pezzo('span', `doni-dato ${x.tono ?? ''}`);
      e.append(pezzo('i', '', x.nome), ...(x.prima ? [pezzo('s', '', x.prima), pezzo('u', '', '›')] : []), pezzo('b', '', x.dopo));
      dati.append(e);
    }
    const righe = pezzo('span', 'doni-righe');
    righe.append(...sc.righe.map((x) => this.riga(x)));
    b.append(immagine('Striscia_Dono', 'doni-fondo'), immagine('Striscia_Dono_Scelta', 'doni-scelta'));
    if (sc.icona && arte(sc.icona)) b.append(immagine(sc.icona, 'doni-icona'));
    else b.append(pezzo('span', 'doni-segno', '+'));
    b.append(titolo, pezzo('span', 'doni-tag', sc.tag), dati, righe, pezzo('span', 'doni-tasto', String(n + 1)));
    b.addEventListener('click', () => this.chiudi(d));
    return b;
  }

  private riga(x: Riga): HTMLElement {
    const e = document.createElement('span');
    e.className = `doni-riga ${x.tono ?? ''}`;
    if (x.colore) e.style.color = x.colore;
    if (x.simbolo && arte(x.simbolo)) e.append(immagine(x.simbolo, 'doni-simbolo'));
    e.append(x.testo);
    return e;
  }

  private ridimensiona = (): void => {
    if (this.aperta) this.disponi();
  };

  /** Titolo, strisce una sotto l'altra e Rimescola, in pixel di gioco interi. */
  private disponi(): void {
    const m = misureHud(), b = bordiHud(m), px = m.px;
    const c = arte('Striscia_Dono'), r = arte('Pulsante_Scuro'), alto = arte('Pulsante_Acceso');
    if (!c || !r || !alto) return;
    this.radice.style.backgroundSize = `${4 * px}px ${4 * px}px`;
    // Rimescola si tocca su tutta l'altezza dei pulsanti più alti (il pulsante scuro è disegnato più basso)
    const zt = ingr('pulsanti', m), titolo = 32 * m.raddoppio, riga = Math.max(r.h, alto.h), rimaste = 14 * m.raddoppio;
    const carte = [...this.elenco.children] as HTMLElement[], n = carte.length;
    // sul telefono in verticale le scelte stanno dentro il campo: non sbordano sulle fasce e la pausa resta libera
    const f = fasce(m), sopra = f.attive ? f.alta : b.a, sotto = f.attive ? m.H - f.bassa : m.H - b.b;
    const alta = sotto - sopra, larga = m.W - b.s - b.d;
    const sottoCarte = this.rimescola.hidden ? 0 : 8 + riga * zt + rimaste;
    const totale = (k: number): number => titolo + n * c.h * k + (n - 1) * STRISCIA.spazio * k + sottoCarte;
    const zz = adattaZoom(STRISCIA.ingrandimentoMassimo * m.raddoppio, (k) => c.w * k <= larga && totale(k) <= alta);
    const x0 = Math.round(m.W / 2 - (c.w * zz) / 2);
    let y = sopra + Math.max(0, Math.round((alta - totale(zz)) / 2));
    const h2 = this.radice.querySelector('h2') as HTMLElement;
    posa(h2, 0, y, m);
    Object.assign(h2.style, { width: `${m.W * px}px`, fontSize: `${22 * m.raddoppio * px}px`, lineHeight: `${titolo * px}px` });
    scriviNel(h2, { x: 0, y: 0, l: m.W, a: titolo }, 1, 4 * m.raddoppio, m, 22 * m.raddoppio, '#000');
    posa(h2, 0, y, m);
    // il «?» apre la legenda: almeno 44 punti di lato, in alto a destra delle strisce
    const aiuto = this.radice.querySelector('.doni-aiuto') as HTMLElement, lato = Math.ceil(44 / px);
    posa(aiuto, Math.min(m.W - b.d - lato, x0 + c.w * zz - lato), y + titolo - lato - 2, m);
    misura(aiuto, lato, lato, 1, m);
    aiuto.style.fontSize = `${28 * px}px`;
    y += titolo;
    const ri = STRISCIA.interni;
    // i nomi di tutte le strisce alla stessa grandezza: quella del nome più lungo
    const kTitoli = Math.min(...carte.map((el) => scalaScritta((el.querySelector('.doni-titolo') as HTMLElement).dataset.testo ?? '', ri.titolo, zz, zz) || zz));
    carte.forEach((el, i) => {
      posa(el, x0, y + i * (c.h + STRISCIA.spazio) * zz, m);
      misura(el, c.w, c.h, zz, m);
      for (const im of el.querySelectorAll<HTMLElement>('.doni-fondo, .doni-scelta')) misura(im, c.w, c.h, zz, m);
      const se = el.querySelector<HTMLElement>('.doni-segno');
      if (se) {
        posa(se, ri.icona.x * zz, ri.icona.y * zz, m);
        misura(se, ri.icona.l, ri.icona.a, zz, m);
        se.style.fontSize = `${TESTI.strisciaDato * 2 * zz * px}px`;
      }
      const ic = el.querySelector<HTMLElement>('.doni-icona');
      if (ic) {
        posa(ic, (ri.icona.x + ri.icona.l / 2 - 12) * zz, (ri.icona.y + ri.icona.a / 2 - 12) * zz, m);
        misura(ic, 24, 24, zz, m);
      }
      for (const s of el.querySelectorAll<HTMLElement>('.doni-simbolo')) misura(s, 11, 11, Math.max(1, zz - 1), m);
      scriviNel(el.querySelector('.doni-titolo') as HTMLElement, ri.titolo, zz, kTitoli, m, TESTI.cartaTitolo, '#000', true);
      scriviIn(el.querySelector('.doni-tag') as HTMLElement, ri.tag, zz, TESTI.strisciaTag, m);
      scriviIn(el.querySelector('.doni-dati') as HTMLElement, ri.dati, zz, TESTI.strisciaDato, m);
      scriviIn(el.querySelector('.doni-righe') as HTMLElement, ri.righe, zz, TESTI.strisciaRiga, m);
      const t = el.querySelector('.doni-tasto') as HTMLElement;
      posa(t, (ri.icona.x + 2) * zz, (ri.icona.y + 1) * zz, m);
      t.style.fontSize = `${TESTI.strisciaTag * zz * px}px`;
    });
    if (this.rimescola.hidden) return;
    y += n * (c.h + STRISCIA.spazio) * zz - STRISCIA.spazio * zz + 8;
    posa(this.rimescola, Math.round(m.W / 2 - (r.w * zt) / 2), y, m);
    misura(this.rimescola, r.w, riga, zt, m);
    const im = this.rimescola.firstElementChild as HTMLElement, su = Math.round(((riga - r.h) * zt) / 2);
    misura(im, r.w, r.h, zt, m);
    im.style.top = `${su * px}px`;
    const rt = INTERNI.Pulsante_Scuro.testo;
    scriviNel(this.rimescola.lastElementChild as HTMLElement, { ...rt, y: rt.y + Math.round((riga - r.h) / 2) }, zt, 3, m, TESTI.pulsante, '#000');
    scriviNel(this.radice.querySelector('.doni-rimaste') as HTMLElement, { x: 0, y: y + riga * zt + 2, l: m.W, a: 12 }, 1, 2 * m.raddoppio, m, TESTI.cartaTasto, '#000');
  }

  private chiudi(d: Dono): void {
    if (!this.aperta) return;
    this.radice.hidden = true;
    const scegli = this.scegli;
    this.scegli = null;
    scegli?.(d);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (!this.aperta || this.sospesa) return;
    const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
    if (n >= 0 && this.carte[n]) {
      e.preventDefault();
      this.chiudi(this.carte[n]);
    }
  };
}
