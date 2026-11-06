/*
 * La pausa: il posto dove si legge tutta la partita. Striscia fissa in alto (tempo, livello, Anime, Cera, Uccisi, Rosario,
 * Frammenti), una pagina che scorre, Riprendi e le schede Build, Rosario, Stati, Opzioni. Sul telefono in verticale le schede
 * stanno in basso e coprono il punto del pulsante della pausa, così il secondo tocco di una doppia pressione non riprende
 * la partita; su computer e tablet sono una colonna a sinistra. Cornici e schede per ora le disegna il CSS: Edoardo le
 * ridisegna con le misure di docs/asset_da_creare.md. Tutto sta in pixel interi; le misure sono in PAUSA (data/hud.ts).
 */
import { PAUSA, TOCCO_MINIMO } from '../data/hud';
import { MAX_ARMI } from '../data/armi';
import { MAX_PASSIVI } from '../data/doni';
import { AFFINITA_TUTTE, INFO_AFFINITA, INFO_REAZIONI } from '../data/spiegazioni';
import type { IdAffinita } from '../data/stati';
import { arte, bordiHud, immagine, ingr, misura, posa, retino, type Fasce, type MisureHud } from './arte';
import { audioAttivo, impostaAudio } from './audio';
import { impostaVibrazione, vibrazione } from './mobile';
import type { Riga, VoceDettaglio } from './scheda';
import { tela } from './scritte';
import { disponiTasto, scalaTasti, tasto } from './tasti';

export type SchedaPausa = 'build' | 'rosario' | 'stati' | 'opzioni';

export interface VoceUnione { nome: string; icona: string; testo: string; ricetta: string; stato: 'Pronta' | 'Manca' | 'Unita' } // testo vuoto finché non è stata unita una volta
export interface VoceUnioneFatta { nome: string; icona: string; ricetta: string; testo: string }
export interface VoceAmuleto { id: string; nome: string; icona: string; grani: number; vantaggio: string; rovescio: string; acceso: boolean }

/** Tutto quello che la pausa mostra, preparato dalla scena di gioco ogni volta che si apre o cambia qualcosa. */
export interface DatiPausa {
  tempo: string;
  livello: number;
  anime: number;
  cera: number;
  uccisi: number;
  frammenti: { ora: number; servono: number };
  rosario: { usati: number; grani: number; amuleti: VoceAmuleto[] } | null; // null: non ancora sbloccato
  armi: VoceDettaglio[];
  doni: VoceDettaglio[];
  unioni: { voci: VoceUnione[]; scoperte: number; totali: number } | null; // null: non ancora sbloccate
  unite: VoceUnioneFatta[]; // fatte almeno una volta, in qualsiasi notte: restano per sempre in Stati
  statistiche: { nome: string; valore: string }[];
  affinita: IdAffinita[]; // gli stati che la build può lasciare
  attesa: 'dono' | 'reliquiario' | null; // la scelta aperta sotto la pausa
}

export interface AzioniPausa {
  riprendi(): void;
  abbandona(): void;
  amuleto(id: string): void;
}

const NOMI: Record<SchedaPausa, string> = { build: 'Build', rosario: 'Rosario', stati: 'Stati', opzioni: 'Opzioni' };
const ATTESA = { dono: 'Un dono in attesa', reliquiario: 'Reliquiario in attesa' };
const TITOLO_CONFERMA = 'Abbandonare la veglia?';
const TESTO_CONFERMA = 'La veglia finisce qui e la Cera raccolta in questa notte va persa.';

function div(classe: string, ...figli: (Node | string)[]): HTMLElement {
  const d = document.createElement('div');
  d.className = classe;
  d.append(...figli);
  return d;
}

export class Pausa {
  el = div('hud-schermo hud-pausa');
  private quadro = div('pausa-quadro');
  private testa = div('pausa-testa');
  private avviso = div('pausa-attesa');
  private pagina = div('pausa-pagina');
  private fondoRiprendi = div('pausa-riprendi');
  private riprendi = tasto('Pulsante_Acceso', 'Riprendi', { azione: 'riprendi' });
  private schede = div('pausa-schede');
  private conferma = div('pausa-conferma');
  private riquadroConferma = div('pausa-conferma-riquadro');
  private annulla = tasto('Pulsante_Scuro', 'Annulla', { azione: 'annulla' });
  private abbandona = tasto('Pulsante_Pericolo', 'Abbandona', { azione: 'conferma-abbandona' });
  private dati: DatiPausa | null = null;
  private scheda: SchedaPausa = 'build';
  private ultima: SchedaPausa = 'build'; // l'ultima scelta con un tocco
  private voce = ''; // l'oggetto scelto nella Build
  private m: MisureHud | null = null;
  private lettera = 3; // pixel di gioco per pixel di lettera
  private z = 1; // pixel di gioco per pixel disegnato
  private altaCasella = 34;
  private latoCasella = 28;

  constructor(private azioni: AzioniPausa) {
    this.el.hidden = true;
    this.conferma.hidden = true;
    this.el.style.backgroundImage = `url(${retino(PAUSA.retino)})`;
    this.conferma.style.backgroundImage = `url(${retino(PAUSA.retinoConferma)})`;
    this.conferma.setAttribute('role', 'dialog');
    this.conferma.setAttribute('aria-modal', 'true');
    this.fondoRiprendi.append(this.riprendi);
    this.quadro.append(this.testa, this.avviso, this.pagina, this.fondoRiprendi, this.schede);
    this.conferma.append(this.riquadroConferma);
    this.el.append(this.quadro, this.conferma);
  }

  get aperta(): boolean {
    return !this.el.hidden;
  }

  get confermaAperta(): boolean {
    return !this.conferma.hidden;
  }

  private get elenco(): SchedaPausa[] {
    return ['build', ...(this.dati?.rosario ? ['rosario' as const] : []), 'stati', 'opzioni'];
  }

  apri(dati: DatiPausa, scheda?: SchedaPausa): void {
    this.dati = dati;
    const r = dati.rosario, urgente = !!r && (r.usati > r.grani || dati.attesa === 'reliquiario');
    this.scheda = scheda ?? (urgente ? 'rosario' : this.ultima);
    if (!this.elenco.includes(this.scheda)) this.scheda = 'build';
    this.pagina.scrollTop = 0;
    this.el.hidden = false;
  }

  aggiorna(dati: DatiPausa): void {
    this.dati = dati;
    this.disegna();
  }

  chiudi(): void {
    this.el.hidden = true;
    this.chiudiConferma();
  }

  chiudiConferma(): void {
    this.conferma.hidden = true;
  }

  focoIniziale(): void {
    this.riprendi.focus();
  }

  vaiAScheda(n: number): void {
    const s = this.elenco[n];
    if (s && !this.confermaAperta) this.cambia(s);
  }

  private cambia(s: SchedaPausa): void {
    this.scheda = this.ultima = s;
    this.pagina.scrollTop = 0;
    this.disegna();
  }

  /** Un tocco dentro la pausa: restituisce true se era per lei. */
  clic(bersaglio: Element): boolean {
    if (!this.aperta) return false;
    const b = bersaglio.closest<HTMLElement>('button');
    if (!b) return !!bersaglio.closest('.hud-pausa');
    const d = b.dataset;
    if (d.azione === 'riprendi') this.azioni.riprendi();
    else if (d.azione === 'abbandona') this.apriConferma();
    else if (d.azione === 'annulla') this.chiudiConferma();
    else if (d.azione === 'conferma-abbandona') this.azioni.abbandona();
    else if (d.scheda) this.cambia(d.scheda as SchedaPausa);
    else if (d.voce) {
      this.voce = d.voce;
      this.disegna();
    } else if (d.amuleto) this.azioni.amuleto(d.amuleto);
    else if (d.opzione) {
      if (d.opzione === 'audio') impostaAudio(!audioAttivo());
      else impostaVibrazione(!vibrazione());
      this.disegna();
    }
    return true;
  }

  private apriConferma(): void {
    this.conferma.hidden = false;
    this.disponiConferma();
    this.annulla.focus();
  }

  /** Mette tutto a posto; ySopra: dove inizia il pulsante della pausa, in pixel di gioco (sul telefono in verticale). */
  disponi(m: MisureHud, f: Fasce, ySopra: number): void {
    this.m = m;
    const px = m.px, b = bordiHud(m), z = (this.z = ingr('barre', m)), largo = !f.attive, margine = PAUSA.margine * z;
    this.lettera = Math.max(1, Math.round(PAUSA.lettera / px));
    this.altaCasella = Math.max(PAUSA.casellaAlta, Math.ceil(TOCCO_MINIMO / (z * px)));
    this.latoCasella = Math.max(z, Math.floor(PAUSA.casellaPunti / (PAUSA.casella * px)));
    this.el.style.backgroundSize = `${4 * px}px ${4 * px}px`;
    this.quadro.classList.toggle('larga', largo);
    const q = this.quadro.style, s = this.schede.style;
    this.el.style.setProperty('--u', `${z * px}px`);
    this.el.style.setProperty('--px', `${px}px`);
    if (largo) {
      const l = Math.min(m.W - b.s - b.d, Math.ceil(PAUSA.larghezzaMassima / px)), a = Math.min(m.H - b.a - b.b, Math.ceil(PAUSA.altezzaMassima / px));
      posa(this.quadro, Math.round((m.W + b.s - b.d - l) / 2), Math.round((m.H + b.a - b.b - a) / 2), m);
      Object.assign(q, { width: `${l * px}px`, height: `${a * px}px`, paddingTop: '0', paddingLeft: '0', paddingRight: '0' });
      Object.assign(s, { height: '', paddingBottom: '' });
    } else {
      // le schede arrivano fino al pulsante della pausa: Riprendi sta sopra di loro
      const alte = Math.max(PAUSA.schedaAlta * z + m.safe.b, m.H - ySopra + PAUSA.stacco * z);
      posa(this.quadro, 0, 0, m);
      Object.assign(q, { width: `${m.W * px}px`, height: `${m.H * px}px`, paddingTop: `${m.safe.a * px}px`, paddingLeft: `${m.safe.s * px}px`, paddingRight: `${m.safe.d * px}px` });
      Object.assign(s, { height: `${alte * px}px`, paddingBottom: `${m.safe.b * px}px` });
    }
    const a = arte('Pulsante_Acceso');
    if (a) {
      // l'ingrandimento più piccolo che arriva alla misura di un dito; su computer e tablet la colonna è larga quanto lui
      const zr = Math.ceil(TOCCO_MINIMO / (a.h * px) - 1e-9), colonna = a.w * zr + 2 * margine;
      const larghezza = largo ? colonna : m.W - m.safe.s - m.safe.d;
      this.el.style.setProperty('--colonna', `${colonna * px}px`);
      this.el.style.setProperty('--scheda', `${Math.max(PAUSA.schedaAlta * z, Math.ceil(TOCCO_MINIMO / px)) * px}px`);
      this.fondoRiprendi.style.height = `${(a.h * zr + 2 * margine) * px}px`;
      scritturaRiprendi(this.riprendi, this.dati?.attesa ? 'Torna alla scelta' : 'Riprendi');
      disponiTasto(this.riprendi, Math.floor((larghezza - a.w * zr) / 2), margine, zr, a.h * zr, scalaTasti([this.riprendi], zr), m);
    }
    this.disegna();
    if (this.confermaAperta) this.disponiConferma();
  }

  private disegna(): void {
    const d = this.dati, m = this.m;
    if (!d || !m) return;
    const sopra = this.pagina.scrollTop;
    this.disegnaTesta(d);
    this.avviso.hidden = !d.attesa;
    this.avviso.textContent = d.attesa ? ATTESA[d.attesa] : '';
    this.schede.replaceChildren(...this.elenco.map((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pausa-scheda';
      b.dataset.scheda = s;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(s === this.scheda));
      b.append(this.parola(NOMI[s], s === this.scheda ? 'var' : '#9c907c', this.lettera));
      if (s === 'rosario' && d.rosario && d.rosario.usati > d.rosario.grani) b.append(div('pausa-segno'));
      return b;
    }));
    this.pagina.replaceChildren(...({ build: () => this.paginaBuild(d), rosario: () => this.paginaRosario(d), stati: () => this.paginaStati(d), opzioni: () => this.paginaOpzioni() })[this.scheda]());
    if (this.scheda === 'opzioni') this.disponiOpzioni();
    this.pagina.scrollTop = sopra;
  }

  private disegnaTesta(d: DatiPausa): void {
    const r = d.rosario, peccato = !!r && r.usati > r.grani;
    const dato = (classe: string, t: string): HTMLElement => div(`pausa-dato ${classe}`, t);
    this.testa.replaceChildren(
      div('pausa-testa-riga', this.parola('Pausa', 'var', Math.max(1, Math.round(PAUSA.letteraTitolo / this.m!.px))), div('pausa-tempo', `${d.tempo} · Liv ${d.livello}`)),
      div('pausa-dati',
        dato('anime', `◆ ${d.anime}`), dato('cera', `Cera ${d.cera}`), dato('', `Uccisi ${d.uccisi}`),
        ...(r ? [dato(peccato ? 'male' : 'rosario', `${peccato ? 'Peccato' : 'Rosario'} ${r.usati}/${r.grani}`)] : []),
        dato('', `Frammenti ${d.frammenti.ora} di ${d.frammenti.servono}`)),
    );
  }

  /** Una parola in Tiny5 a pixel interi; se non sta in «massimo» pixel di gioco scende di un ingrandimento. */
  private parola(testo: string, colore: string, k: number, massimo = Infinity): HTMLElement {
    const m = this.m!, c = tela(testo, colore === 'var' ? getComputedStyle(this.el).getPropertyValue('--accento').trim() : colore, null);
    const kk = Math.max(1, Math.min(k, Math.floor(massimo / c.width)));
    c.className = 'pausa-scritta';
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', testo);
    misura(c, c.width, c.height, kk, m);
    return c;
  }

  private sezione(titolo: string, destra = ''): HTMLElement {
    return div('pausa-sezione', this.parola(titolo, '#9c907c', this.lettera), div('pausa-conto', destra));
  }

  private larghezzaPagina(): number {
    return Math.floor(this.pagina.clientWidth / this.m!.px) - 2 * PAUSA.margine * this.z;
  }

  // ——— Build ———
  private paginaBuild(d: DatiPausa): HTMLElement[] {
    const tutte = [...d.armi, ...d.doni];
    if (!tutte.some((v) => v.chiave === this.voce)) this.voce = tutte[0]?.chiave ?? '';
    const scelta = tutte.find((v) => v.chiave === this.voce);
    return [
      this.sezione('Armi', `${d.armi.length}/${MAX_ARMI}`), this.griglia(d.armi, MAX_ARMI),
      this.sezione('Doni', `${d.doni.length}/${MAX_PASSIVI}`), this.griglia(d.doni, MAX_PASSIVI),
      ...(scelta ? [this.dettaglio(scelta)] : []),
      this.sezione('Statistiche'),
      div('pausa-statistiche', ...d.statistiche.map((s) => div('pausa-statistica', div('', s.nome), div('pausa-valore', s.valore)))),
      ...this.blocchiUnioni(d),
    ];
  }

  private griglia(voci: VoceDettaglio[], posti: number): HTMLElement {
    const m = this.m!, celle: HTMLElement[] = [];
    const lato = PAUSA.casella * this.latoCasella;
    for (let i = 0; i < Math.max(posti, voci.length); i++) {
      const v = voci[i], cella = v ? document.createElement('button') : div('pausa-cella vuota');
      cella.style.height = `${this.altaCasella * this.z * m.px}px`;
      const cornice = div('pausa-cornice');
      misura(cornice, lato, lato, 1, m);
      cella.append(cornice);
      if (v) {
        const b = cella as HTMLButtonElement;
        b.type = 'button';
        b.className = `pausa-cella${v.unita ? ' unita' : ''}`;
        b.dataset.voce = v.chiave;
        b.setAttribute('aria-pressed', String(v.chiave === this.voce));
        b.setAttribute('aria-label', `${v.nome}, livello ${v.livello} di ${v.massimo}`);
        const im = immagine(v.icona), lv = div('pausa-livello', String(v.livello));
        misura(im, 24, 24, this.latoCasella, m);
        const dentro = ((PAUSA.casella - 24) * this.latoCasella) / 2 - 1; // la cornice è spessa un pixel di gioco
        posa(im, dentro, dentro, m);
        cornice.append(im, lv);
      }
      celle.push(cella);
    }
    return div('pausa-griglia', ...celle);
  }

  private riga(x: Riga): HTMLElement {
    const r = div(`pausa-riga ${x.tono ?? ''}`);
    if (x.colore) r.style.color = x.colore;
    if (x.simbolo && arte(x.simbolo)) r.append(this.simbolo(x.simbolo));
    r.append(x.testo);
    return r;
  }

  private simbolo(chiave: string): HTMLElement {
    const im = immagine(chiave, 'pausa-simbolo');
    misura(im, 11, 11, this.z, this.m!);
    return im;
  }

  private dettaglio(v: VoceDettaglio): HTMLElement {
    const d = div('pausa-dettaglio', this.parola(v.nome, 'var', this.lettera, this.larghezzaPagina()), div('pausa-sotto', `Livello ${v.livello} di ${v.massimo}`));
    d.style.minHeight = `${PAUSA.dettaglio * this.z * this.m!.px}px`;
    if (v.numeri.length) d.append(div('pausa-numeri', ...v.numeri.map((n) => div('pausa-numero', `${n.nome} `, div('pausa-valore', n.valore)))));
    d.append(...v.righe.map((r) => this.riga(r)));
    return d;
  }

  private blocchiUnioni(d: DatiPausa): HTMLElement[] {
    const u = d.unioni;
    if (!u) return [];
    const conto = this.sezione('Unioni', `${u.scoperte} di ${u.totali} scoperte`);
    if (!u.voci.length) return [conto, div('pausa-vuoto', 'Tieni insieme un\'arma e il suo dono per scoprire la loro Unione.')];
    return [conto, ...u.voci.map((v) => {
      const im = immagine(v.icona, 'pausa-simbolo');
      misura(im, 24, 24, this.z, this.m!);
      return div(`pausa-unione ${v.stato.toLowerCase()}`, im,
        div('pausa-unione-testo', this.parola(v.nome, v.stato === 'Manca' ? '#e8dcc4' : '#ffe08a', this.lettera, this.larghezzaPagina() - 44 * this.z), div('pausa-sotto', v.ricetta), ...(v.testo ? [div('pausa-riga', v.testo)] : [])),
        div('pausa-stato', v.stato));
    })];
  }

  // ——— Rosario ———
  private paginaRosario(d: DatiPausa): HTMLElement[] {
    const r = d.rosario!, peccato = r.usati > r.grani, posti = Math.max(r.usati, r.grani), grani: HTMLElement[] = [];
    for (let i = 0; i < posti; i++) {
      const g = div(`pausa-grano ${i >= r.grani ? 'troppo' : i < r.usati ? 'pieno' : ''}`);
      misura(g, PAUSA.grano, PAUSA.grano, this.z, this.m!);
      grani.push(g);
    }
    return [
      div('pausa-grani', ...grani, div('pausa-conto', `${r.usati}/${r.grani} grani`)),
      ...(peccato ? [div('pausa-peccato', 'Peccato: subisci il doppio del danno. Spegni un amuleto per uscirne.')] : []),
      ...(r.amuleti.length ? r.amuleti.map((a) => this.amuleto(a)) : [div('pausa-vuoto', 'Nessun amuleto: si trovano nei reliquiari.')]),
    ];
  }

  private amuleto(a: VoceAmuleto): HTMLElement {
    const b = document.createElement('button'), im = immagine(a.icona, 'pausa-simbolo');
    b.type = 'button';
    b.className = 'pausa-amuleto';
    b.dataset.amuleto = a.id;
    b.setAttribute('aria-pressed', String(a.acceso));
    misura(im, 24, 24, this.z, this.m!);
    b.append(im,
      div('pausa-amuleto-testo', this.parola(`${a.nome}`, '#e8dcc4', this.lettera, this.larghezzaPagina() - 100 * this.z), div('pausa-sotto', `${a.grani} ${a.grani === 1 ? 'grano' : 'grani'}`), div('pausa-riga bene', a.vantaggio), div('pausa-riga male', a.rovescio)),
      div('pausa-interruttore', a.acceso ? 'Acceso' : 'Spento'));
    return b;
  }

  // ——— Stati ———
  private paginaStati(d: DatiPausa): HTMLElement[] {
    const tuoi = AFFINITA_TUTTE.filter((a) => d.affinita.includes(a)), altri = AFFINITA_TUTTE.filter((a) => !d.affinita.includes(a));
    const stato = (a: IdAffinita, spenta: boolean): HTMLElement => {
      const i = INFO_AFFINITA[a];
      return div(`pausa-voce ${spenta ? 'spenta' : ''}`, this.simbolo(i.simbolo), div('', this.parola(i.stato, spenta ? '#9c907c' : i.colore, this.lettera), div('pausa-riga', `${i.nome}: ${i.effetto()}`)));
    };
    const reazioni = INFO_REAZIONI.map((r) => {
      const [a, b] = r.stati, possibile = d.affinita.includes(a) && (b ? d.affinita.includes(b) : d.affinita.length > 1);
      return { r, possibile, el: div(`pausa-voce ${possibile ? '' : 'spenta'}`, this.simbolo(INFO_AFFINITA[a].simbolo), ...(b ? [this.simbolo(INFO_AFFINITA[b].simbolo)] : []),
        div('', div('pausa-titolo-voce', this.parola(r.nome, possibile ? r.colore : '#9c907c', this.lettera), ...(possibile ? [div('pausa-possibile', 'Possibile')] : [])), div('pausa-riga', `${b ? '' : 'Con qualsiasi altro stato: '}${r.effetto()}`))) };
    });
    return [
      this.sezione('Le tue armi lasciano'), ...tuoi.map((a) => stato(a, false)),
      ...(altri.length ? [this.sezione('Gli altri stati'), ...altri.map((a) => stato(a, true))] : []),
      this.sezione('Reazioni'), div('pausa-vuoto', 'Due stati diversi sullo stesso nemico si consumano e fanno:'),
      ...reazioni.filter((x) => x.possibile).map((x) => x.el), ...reazioni.filter((x) => !x.possibile).map((x) => x.el),
      ...(d.unite.length ? [this.sezione('Unioni'), ...d.unite.map((u) => {
        const im = immagine(u.icona, 'pausa-simbolo');
        misura(im, 24, 24, this.z, this.m!);
        return div('pausa-voce pausa-unita', im, div('', this.parola(u.nome, '#ffe08a', this.lettera, this.larghezzaPagina() - 32 * this.z), div('pausa-sotto', u.ricetta), div('pausa-riga', u.testo)));
      })] : []),
    ];
  }

  // ——— Opzioni ———
  private paginaOpzioni(): HTMLElement[] {
    const suoni = tasto(audioAttivo() ? 'Pulsante_Scuro' : 'Pulsante_Spento', 'Suoni', { opzione: 'audio' });
    const vibra = tasto(vibrazione() ? 'Pulsante_Scuro' : 'Pulsante_Spento', 'Vibrazione', { opzione: 'vibrazione' });
    suoni.setAttribute('aria-pressed', String(audioAttivo()));
    vibra.setAttribute('aria-pressed', String(vibrazione()));
    return [div('pausa-opzioni', suoni, vibra, tasto('Pulsante_Pericolo', 'Abbandona', { azione: 'abbandona' }))];
  }

  private disponiOpzioni(): void {
    const m = this.m!, zt = ingr('pulsanti', m), scatola = this.pagina.firstElementChild as HTMLElement, tasti = [...scatola.children] as HTMLElement[];
    const riga = Math.max(Math.max(...tasti.map((t) => arte(t.dataset.arte!)?.h ?? 0)) * zt, Math.ceil(TOCCO_MINIMO / m.px)), passo = riga + 3 * zt, l = this.larghezzaPagina(), k = scalaTasti(tasti, zt);
    scatola.style.height = `${tasti.length * passo * m.px}px`;
    tasti.forEach((t, i) => {
      const a = arte(t.dataset.arte!);
      if (a) disponiTasto(t, Math.round((l - a.w * zt) / 2), i * passo, zt, riga, k, m);
    });
  }

  // ——— Conferma di Abbandona: una piccola finestra sopra tutto il resto ———
  private disponiConferma(): void {
    const m = this.m, a = arte('Pulsante_Pericolo'), c = this.riquadroConferma;
    if (!m || !a) return;
    const z = ingr('barre', m), zt = ingr('pulsanti', m), riga = Math.max(a.h * zt, Math.ceil(TOCCO_MINIMO / m.px)), spazio = PAUSA.margine * z, largo = a.w * zt + 2 * spazio;
    this.conferma.style.backgroundSize = `${4 * m.px}px ${4 * m.px}px`;
    const titolo = this.parola(TITOLO_CONFERMA, 'var', this.lettera, largo - 2 * spazio), testo = div('pausa-conferma-testo', TESTO_CONFERMA);
    const tasti = div('pausa-opzioni', this.annulla, this.abbandona);
    tasti.style.height = `${(2 * riga + spazio) * m.px}px`;
    c.replaceChildren(titolo, testo, tasti);
    c.style.width = `${largo * m.px}px`;
    c.style.padding = `${spazio * m.px}px`;
    c.style.gap = `${spazio * m.px}px`;
    const k = scalaTasti([this.annulla, this.abbandona], zt);
    disponiTasto(this.annulla, 0, 0, zt, riga, k, m);
    disponiTasto(this.abbandona, 0, riga + spazio, zt, riga, k, m);
    posa(c, Math.round((m.W - largo) / 2), Math.round((m.H - c.offsetHeight / m.px) / 2), m);
  }
}

/** La scritta di Riprendi cambia sopra una scelta. */
function scritturaRiprendi(t: HTMLElement, testo: string): void {
  (t.lastElementChild as HTMLElement).dataset.testo = testo;
  t.setAttribute('aria-label', testo);
}
