/*
 * Interfaccia in partita (HTML sopra il gioco), con gli elementi disegnati da Edoardo (cartella HUD/), a pixel interi.
 * Sul telefono in verticale tutto sta in due fasce fisse fuori dal campo (disponiFasce): in alto stemma, esperienza,
 * orologio e barra rossa di Seth, con il cartiglio che copre stemma ed esperienza finché dura; in basso la pausa.
 * Anime, Cera, Rosario e caselle stanno nella pausa (pausa.ts) e nella fine; salute bassa e Peccato sono segnali sul bordo del campo.
 * Altrove, in alto: stemma del livello, barra dell'esperienza, anime e orologio a destra, caselle di armi e doni, barra rossa di Seth (con i numeri della salute),
 * e sotto gli avvisi nel nastro. In basso a destra: pausa. Poi la schermata di fine partita.
 * La barra della salute è nel gioco, sotto il personaggio; l'abilità speciale in basso a sinistra (speciale.ts).
 */
import { BARRA_SALUTE } from '../data/mondo';
import { AVVISO, BARRA_SETH, PREAVVISO_ORDA, CASELLA, FASCE, FINESTRE, INTERNI, MARGINE_TOCCO, OROLOGIO, PAUSA_PICCOLA, SEGNALE_PECCATO, TESTI, TOCCO_MINIMO } from '../data/hud';
import { adattaZoom, angoliFascia, arte, bordiHud, fasce, immagine, ingr, mascheraRetino, misura, misureHud, posa, retino, scriviIn, type Fasce, type MisureHud } from './arte';
import { Pausa, type DatiPausa, type SchedaPausa } from './pausa';
import { scritta, scriviNel, tela } from './scritte';
import { disponiTasto, scalaTasti, tasto } from './tasti';

/** Un'arma o un dono posseduto, per le caselle e i riepiloghi. */
export interface VoceBuild {
  nome: string;
  icona: string; // chiave dell'icona (Icona_<Nome>)
  livello: number;
  arma: boolean; // armi nella prima fila, doni nella seconda
  amuleto?: string; // id dell'amuleto del Rosario (il numero è il suo costo in grani)
  acceso?: boolean;
}

export interface Riepilogo {
  vittoria: boolean;
  secondi: number;
  livello: number;
  anime: number;
  danno: number;
  record: number; // miglior tempo con questo personaggio, in secondi
  nuovoRecord: boolean;
  build: VoceBuild[];
  cera: number; // Cera guadagnata nella veglia (meta progressione)
  sbloccato: string | null; // personaggio sbloccato con un'impresa in questa veglia
}

export interface AzioniHud {
  pausa(): void;
  riprendi(): void;
  riprova(): void;
  menu(): void;
  amuleto(id: string): void; // dalla pausa: accende o spegne un amuleto
}

const ALTEZZA_OROLOGIO = 24; // pixel di gioco per ogni volta dell'ingrandimento delle barre (testo da 16 più il respiro)
const CLIC_FANTASMA_MS = 60; // quanto dopo l'alzata del dito arriva il clic generato dal telefono
const PER_FILA = 6; // caselle per fila: 6 armi, poi 6 doni

/** Un elemento posizionato a mano dentro l'HUD. */
function blocco(classe: string, ...figli: HTMLElement[]): HTMLElement {
  const d = document.createElement('div');
  d.className = classe;
  d.append(...figli);
  return d;
}

/** Barra con cornice e riempimento che si taglia da sinistra (esperienza). */
class Barra {
  el: HTMLElement;
  private finestra: HTMLElement;
  private parte = -1;
  private z = 1;
  constructor(classe: string, private cornice: string, piena: string) {
    this.finestra = blocco('hud-finestra', immagine(piena));
    this.el = blocco(classe, immagine(cornice), this.finestra);
  }
  disponi(x: number, y: number, z: number, m: MisureHud): void {
    const a = arte(this.cornice), f = FINESTRE[this.cornice];
    if (!a || !f) return;
    this.z = z;
    posa(this.el, x, y, m);
    misura(this.el, a.w, a.h, z, m);
    misura(this.el.firstElementChild as HTMLElement, a.w, a.h, z, m);
    posa(this.finestra, f.x * z, f.y * z, m);
    misura(this.finestra.firstElementChild as HTMLElement, f.l, f.a, z, m);
    this.finestra.style.height = `${f.a * z * m.px}px`;
    this.mostra(this.parte < 0 ? 0 : this.parte, m, true);
  }
  /** parte da 0 a 1; la larghezza va a pixel disegnati interi. */
  mostra(parte: number, m: MisureHud, sempre = false): void {
    const f = FINESTRE[this.cornice];
    if (!f) return;
    const l = Math.round(f.l * Math.max(0, Math.min(1, parte)));
    if (l === Math.round(f.l * this.parte) && !sempre) return;
    this.parte = parte;
    this.finestra.style.width = `${l * this.z * m.px}px`;
  }
}

/**
 * Barra della salute di Seth: rettangolo rosso semplice (come quella del personaggio, BARRA_SALUTE) con dentro
 * «rimasta/massima». La lunghezza è quella della finestra della barra disegnata che sostituisce.
 */
class BarraSalute {
  el: HTMLElement;
  private piena = blocco('hud-salute-piena');
  private numeri = blocco('hud-salute-numeri');
  private dentro = 1; // larghezza interna, pixel di gioco
  private z = 1;
  private ora = -1;
  private max = 1;
  constructor(classe: string, private finestra: string) {
    this.el = blocco(`${classe} hud-salute`, blocco('hud-salute-vuota', this.piena), this.numeri);
    Object.assign(this.el.style, { background: BARRA_SALUTE.bordo });
    Object.assign((this.el.firstElementChild as HTMLElement).style, { background: BARRA_SALUTE.vuoto });
    this.piena.style.background = BARRA_SALUTE.rosso;
  }
  get altezza(): number {
    return BARRA_SETH.altezza;
  }
  get larghezza(): number {
    return (FINESTRE[this.finestra]?.l ?? 200) + 2;
  }
  disponi(x: number, y: number, z: number, m: MisureHud): void {
    const L = this.larghezza, H = BARRA_SETH.altezza, px = m.px;
    this.z = z;
    this.dentro = L - 2;
    posa(this.el, x, y, m);
    misura(this.el, L, H, z, m);
    const v = this.el.firstElementChild as HTMLElement;
    posa(v, z, z, m);
    misura(v, L - 2, H - 2, z, m);
    this.piena.style.height = '100%';
    Object.assign(this.numeri.style, { left: '0', top: '0', width: '100%', height: `${H * z * px}px`, lineHeight: `${H * z * px}px`, fontSize: `${TESTI.seth * z * px}px` });
    this.mostra(this.ora, this.max, m, true);
  }
  /** Salute rimasta e massima; la larghezza del rosso va a pixel di gioco interi. */
  mostra(ora: number, max: number, m: MisureHud, sempre = false): void {
    if (ora === this.ora && max === this.max && !sempre) return;
    this.ora = ora;
    this.max = max;
    const l = Math.round(this.dentro * Math.max(0, Math.min(1, ora / Math.max(1, max))));
    this.piena.style.width = `${l * this.z * m.px}px`;
    this.numeri.textContent = ora < 0 ? '' : `${ora}/${max}`;
  }
}

export class Hud {
  private radice: HTMLElement;
  private xp = new Barra('hud-xp', 'Barra_Esperienza_Cornice', 'Barra_Esperienza_Piena');
  private mietitore = new BarraSalute('hud-boss', 'Barra_Mietitore_Cornice');
  private seth = new BarraSalute('hud-boss', 'Barra_Seth_Cornice'); // la barra della fascia alta
  private fasciaAlta = blocco('hud-fascia', immagine('Fascia_Alta'));
  private fasciaBassa = blocco('hud-fascia', immagine('Fascia_Bassa'));
  private peccato = blocco('hud-peccato');
  private conFasce = false;
  private clicFantasma = false; // il dito che ha aperto la pausa non si è ancora alzato del tutto
  private inPeccato = false;
  private peccatoProva = false;
  private orologio = blocco('hud-orologio');
  private livello = blocco('hud-livello', immagine('Stemma_Livello'), blocco('hud-livello-numero'));
  private anime = blocco('hud-anime');
  private cera = blocco('hud-cera');
  private rosario = blocco('hud-rosario');
  private ultimoRosario = '';
  private icone = blocco('hud-icone');
  private avvisoEl = blocco('hud-avviso', blocco('hud-avviso-testo'), blocco('hud-avviso-sotto'));
  private preavvisoEl = blocco('hud-preavviso');
  private timerPreavviso = 0;
  private kAvviso = 2; // pixel di gioco per pixel della scritta
  private pausaTasto = document.createElement('button');
  private bordo = blocco('hud-bordo');
  private quadro: Pausa;
  private fine: HTMLElement;
  private voci: VoceBuild[] = [];
  private m: MisureHud = misureHud();
  private ultimoSecondo = -1;
  private ultimoLivello = -1;
  private ultimaCera = -1;
  private ultimeAnime = -1;
  private ultimoBoss = -2;
  private timerAvviso = 0;
  private passoAvviso = 0;
  private inizioAvviso = 0;
  private altezzaPersonaggio = 0; // pixel di gioco dai piedi (a metà schermo) alla testa
  private lamaAvviso = 1; // pixel dello schermo per quadretto del retino
  private attesa = 0;

  constructor(contenitore: HTMLElement, private azioni: AzioniHud) {
    this.radice = blocco('hud');
    this.bordo.hidden = true;
    this.mietitore.el.hidden = true;
    this.seth.el.hidden = true;
    this.peccato.hidden = true;
    this.preavvisoEl.hidden = true;
    this.mietitore.el.setAttribute('aria-label', 'Seth, il Rinnovato');
    this.avvisoEl.hidden = true;
    this.avvisoEl.setAttribute('aria-live', 'polite');
    this.pausaTasto.type = 'button';
    this.pausaTasto.className = 'hud-pausa-tasto';
    this.pausaTasto.setAttribute('aria-label', 'Pausa');
    this.pausaTasto.append(immagine('Pulsante_Pausa'));
    // appena il dito si appoggia, come abilità e fiaschetta: il «clic» il telefono lo genera solo per il primo dito
    this.pausaTasto.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.azioni.pausa();
      // alzando il dito il telefono genera un clic, che cadrebbe sul pulsante apparso sotto il dito (su iPhone SE «Abbandona»)
      this.clicFantasma = true;
      const fine = (u: PointerEvent): void => {
        if (u.pointerId !== e.pointerId) return;
        window.removeEventListener('pointerup', fine);
        window.removeEventListener('pointercancel', fine);
        window.setTimeout(() => (this.clicFantasma = false), CLIC_FANTASMA_MS);
      };
      window.addEventListener('pointerup', fine);
      window.addEventListener('pointercancel', fine);
    });
    this.pausaTasto.addEventListener('click', (e) => { if (e.detail === 0) this.azioni.pausa(); }); // con la tastiera
    this.quadro = new Pausa({ riprendi: () => this.azioni.riprendi(), abbandona: () => this.azioni.menu(), amuleto: (id) => this.azioni.amuleto(id) });
    this.fine = blocco('hud-schermo hud-fine', blocco('hud-nastro', immagine('Nastro_Titolo'), document.createElement('h1')), blocco('hud-pannello'), blocco('hud-altre'), blocco('hud-pulsanti'));
    this.fine.hidden = true;
    this.fine.style.backgroundImage = `url(${retino(12)})`;
    this.fine.querySelector('.hud-pulsanti')!.append(
      tasto('Pulsante_Acceso', 'Riprova', { azione: 'riprova' }),
      tasto('Pulsante_Chiaro', 'Personaggi', { azione: 'menu' }),
    );
    this.radice.append(this.bordo, this.peccato, this.preavvisoEl, this.xp.el, this.orologio, this.livello, this.anime, this.cera, this.rosario, this.icone, this.mietitore.el, this.seth.el, this.avvisoEl, this.quadro.el, this.fine);
    this.radice.addEventListener('click', (e) => {
      if (this.clicFantasma || this.quadro.clic(e.target as Element)) return;
      const azione = (e.target as Element).closest<HTMLElement>('button')?.dataset.azione;
      if (azione === 'menu') this.azioni.menu();
      else if (azione === 'riprova') this.azioni.riprova();
    });
    contenitore.append(this.fasciaAlta, this.fasciaBassa, this.radice, this.pausaTasto); // la pausa ha il suo strato: sta sopra le carte dei doni
    window.addEventListener('resize', this.ridimensiona);
    window.visualViewport?.addEventListener('resize', this.ridimensiona);
    this.disponi();
  }

  get pausaAperta(): boolean {
    return this.quadro.aperta;
  }

  /** La finestra di conferma di Abbandona è aperta sopra la pausa. */
  get confermaAperta(): boolean {
    return this.quadro.confermaAperta;
  }

  chiudiConferma(): void {
    this.quadro.chiudiConferma();
  }

  /** Dalla tastiera: la scheda numero n della pausa, da 0. */
  schedaPausa(n: number): void {
    this.quadro.vaiAScheda(n);
  }

  get fineAperta(): boolean {
    return !this.fine.hidden;
  }

  /** Aggiorna solo quando qualcosa cambia davvero, per non toccare la pagina a ogni fotogramma. */
  aggiorna(secondi: number, saluteBassa: boolean, livello: number, parteEsperienza: number, anime: number, boss: number, cera = 0, bossMassima = 1): void {
    const s = Math.floor(secondi);
    if (s !== this.ultimoSecondo) {
      this.ultimoSecondo = s;
      this.orologio.textContent = tempo(s);
    }
    if (livello !== this.ultimoLivello) {
      this.ultimoLivello = livello;
      this.livello.lastElementChild!.textContent = String(livello);
    }
    const a = Math.floor(anime);
    if (a !== this.ultimeAnime) {
      this.ultimeAnime = a;
      this.anime.textContent = `◆ ${a}`;
    }
    if (cera !== this.ultimaCera) {
      this.ultimaCera = cera;
      this.cera.textContent = `Cera ${cera}`;
    }
    this.xp.mostra(parteEsperienza, this.m);
    // boss: salute rimasta (bossMassima è quella piena), oppure −1 se non c'è
    const b = boss < 0 ? -1 : Math.ceil(boss);
    if (b !== this.ultimoBoss) {
      const cambia = (b < 0) !== (this.ultimoBoss < 0);
      this.ultimoBoss = b;
      this.mietitore.el.hidden = b < 0 || this.conFasce;
      this.seth.el.hidden = b < 0 || !this.conFasce;
      if (b >= 0) {
        const mx = Math.round(bossMassima);
        this.mietitore.mostra(b, mx, this.m);
        this.seth.mostra(b, mx, this.m);
      }
      if (cambia) this.disponi(); // l'avviso scende sotto la barra
    }
    this.bordo.hidden = !saluteBassa;
  }

  /** Il Rosario: grani usati e grani che si hanno; in rosso se sono troppi (Peccato). Senza amuleti non si vede. */
  mostraRosario(usati: number, grani: number, amuleti: number): void {
    const t = amuleti ? `${usati > grani ? 'Peccato' : 'Rosario'} ${usati}/${grani}` : '';
    if (t === this.ultimoRosario) return;
    this.ultimoRosario = t;
    this.rosario.textContent = t;
    this.rosario.classList.toggle('peccato', usati > grani);
    this.inPeccato = usati > grani;
    this.segnalePeccato();
  }

  /** Con le fasce il Peccato non è una scritta: è una cornice a retino sul bordo del campo. */
  private segnalePeccato(): void {
    this.peccato.hidden = !this.conFasce || !(this.inPeccato || this.peccatoProva);
  }

  /** Dal Laboratorio: accende il segnale senza dover comporre un Rosario. */
  provaPeccato(acceso: boolean): void {
    this.peccatoProva = acceso;
    this.segnalePeccato();
  }

  /** Caselle di armi e doni posseduti, con il livello. */
  build(voci: VoceBuild[]): void {
    this.voci = voci;
    this.icone.replaceChildren(...voci.map((v) => casella(v)));
    this.disponi();
  }

  /** L'avviso non deve mai scendere sulla testa del personaggio: serve sapere quanto è alto. */
  impostaPersonaggio(altezza: number): void {
    this.altezzaPersonaggio = altezza;
    this.disponi();
  }

  /** Scritta nel nastro in alto, che sparisce da sola a retino; «sotto» è una riga in più sotto il nastro. */
  avviso(testo: string, sotto = ''): void {
    this.scriviAvviso(testo, sotto);
    this.avvisoEl.hidden = false;
    this.mascheraAvviso('');
    this.passoAvviso = 0;
    this.disponi();
    clearTimeout(this.timerAvviso);
    this.inizioAvviso = performance.now();
    this.prossimoGradino();
  }

  /** Dopo un cambio di misure: riscrive l'avviso in corso alla grandezza nuova. */
  private ridisegnaAvviso(): void {
    const c = this.avvisoEl.querySelector('canvas');
    if (c) this.scriviAvviso(c.getAttribute('aria-label') ?? '', this.avvisoEl.children[1].textContent ?? '');
  }

  /** Titolo in Tiny5 a pixel interi e riga sotto, ognuno sul suo fondo scuro. */
  private scriviAvviso(testo: string, sotto: string): void {
    const k = this.kAvviso, px = this.m.px, titolo = this.avvisoEl.children[0] as HTMLElement, riga = this.avvisoEl.children[1] as HTMLElement;
    const c = tela(testo, AVVISO.colore, null);
    c.className = 'hud-avviso-tela';
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', testo);
    misura(c, c.width, c.height, k, this.m);
    titolo.replaceChildren(c);
    titolo.style.padding = `${2 * k * px}px ${4 * k * px}px`;
    riga.textContent = sotto;
    riga.hidden = !sotto;
    Object.assign(riga.style, { fontSize: `${TESTI.avvisoSotto * k * px}px`, padding: `${k * px}px ${4 * k * px}px`, marginTop: `${k * px}px` });
    for (const e of [titolo, riga]) e.style.background = AVVISO.fondo;
  }

  /** Preavviso di un'orda: per «secondi» lampeggiano i bordi del campo da cui arriva. */
  preavviso(sopra: boolean, sotto: boolean, sinistra: boolean, destra: boolean, secondi: number): void {
    const t = PREAVVISO_ORDA.spessore * this.kAvviso * this.m.px, c = PREAVVISO_ORDA.colore, ombre: string[] = [];
    if (sopra) ombre.push(`inset 0 ${t}px 0 0 ${c}`);
    if (sotto) ombre.push(`inset 0 ${-t}px 0 0 ${c}`);
    if (sinistra) ombre.push(`inset ${t}px 0 0 0 ${c}`);
    if (destra) ombre.push(`inset ${-t}px 0 0 0 ${c}`);
    this.preavvisoEl.style.boxShadow = ombre.join(', ');
    this.preavvisoEl.hidden = !ombre.length;
    clearTimeout(this.timerPreavviso);
    this.timerPreavviso = window.setTimeout(() => { this.preavvisoEl.hidden = true; }, secondi * 1000);
  }

  /** Un gradino della dissolvenza a retino; dopo l'ultimo l'avviso sparisce. */
  private sfumaAvviso = (): void => {
    const passi = Math.max(1, Math.round(AVVISO.passi));
    if (++this.passoAvviso > passi) {
      this.avvisoEl.hidden = true;
      this.mascheraAvviso('');
      return;
    }
    this.mascheraAvviso(mascheraRetino(Math.round(16 * (1 - this.passoAvviso / (passi + 1))), this.lamaAvviso));
    this.prossimoGradino();
  };

  /** I tempi si contano dall'inizio dell'avviso: così i ritardi del browser non si sommano. */
  private prossimoGradino(): void {
    const quando = AVVISO.durata - AVVISO.dissolvenza + (this.passoAvviso * AVVISO.dissolvenza) / Math.max(1, Math.round(AVVISO.passi));
    this.timerAvviso = window.setTimeout(this.sfumaAvviso, Math.max(0, this.inizioAvviso + quando * 1000 - performance.now()));
  }

  private mascheraAvviso(url: string): void {
    const lato = (4 * this.lamaAvviso) / this.m.dpr;
    Object.assign(this.avvisoEl.style, { maskImage: url ? `url(${url})` : '', webkitMaskImage: url ? `url(${url})` : '', maskSize: `${lato}px`, webkitMaskSize: `${lato}px` });
  }

  /** Apre la pausa; scheda: quella da mostrare, se non è la regola normale (ultima usata, Rosario se c'è urgenza). */
  mostraPausa(dati: DatiPausa, scheda?: SchedaPausa): void {
    this.quadro.apri(dati, scheda);
    this.pausaTasto.hidden = true;
    this.radice.classList.add('sopra');
    this.disponi();
    this.quadro.focoIniziale();
  }

  /** Numeri nuovi con la pausa già aperta (un amuleto acceso o spento). */
  aggiornaPausa(dati: DatiPausa): void {
    this.quadro.aggiorna(dati);
  }

  nascondiPausa(): void {
    this.quadro.chiudi();
    this.pausaTasto.hidden = false;
    this.radice.classList.remove('sopra');
  }

  mostraFine(r: Riepilogo): void {
    this.fine.classList.toggle('vittoria', r.vittoria);
    scritta(this.fine.querySelector('h1')!, r.vittoria ? "L'alba" : 'Si è spenta');
    const numeri = [
      r.vittoria ? 'Hai attraversato la notte.' : `La lanterna ha resistito ${tempo(Math.floor(r.secondi))}`,
      `Livello ${r.livello} · ${Math.floor(r.anime)} anime · danno ${Math.round(r.danno)}`,
      `Record ${tempo(Math.floor(r.record))}${r.nuovoRecord ? ' · nuovo!' : ''}`,
      `+${r.cera} Cera per la Cappella`,
    ];
    if (r.sbloccato) numeri.push(`Sbloccato: ${r.sbloccato}`);
    this.riempiPannello(this.fine, r.build, '', numeri.join('\n'));
    this.bordo.hidden = true;
    this.quadro.chiudi();
    this.pausaTasto.hidden = true;
    this.fine.hidden = false;
    this.disponi();
    (this.fine.querySelector('[data-azione="riprova"]') as HTMLElement).focus();
  }

  distruggi(): void {
    clearTimeout(this.timerAvviso);
    cancelAnimationFrame(this.attesa);
    window.removeEventListener('resize', this.ridimensiona);
    window.visualViewport?.removeEventListener('resize', this.ridimensiona);
    this.radice.remove();
    this.pausaTasto.remove();
    this.fasciaAlta.remove();
    this.fasciaBassa.remove();
  }

  private ridimensiona = (): void => {
    cancelAnimationFrame(this.attesa);
    this.attesa = requestAnimationFrame(() => this.disponi());
  };

  /** Pannello grande: titolo o testo in alto, le prime 4 armi nelle sue caselle, il resto in fila sotto. */
  private riempiPannello(schermo: HTMLElement, build: VoceBuild[], titolo: string, testo: string): void {
    const p = schermo.querySelector('.hud-pannello')!;
    const testoEl = document.createElement(titolo ? 'h1' : 'p');
    testoEl.className = 'hud-pannello-testo';
    if (titolo) scritta(testoEl, titolo);
    else testoEl.textContent = testo;
    const nelle = build.slice(0, 4), altre = build.slice(4);
    p.replaceChildren(immagine('Pannello_Grande'), testoEl, ...nelle.map((v) => icona(v)));
    schermo.querySelector('.hud-altre')!.replaceChildren(...altre.map((v) => icona(v)));
  }

  /** Mette ogni elemento al suo posto, in pixel di gioco interi. */
  private disponi(): void {
    const m = (this.m = misureHud()), b = bordiHud(m), px = m.px;
    const f = fasce(m);
    this.conFasce = f.attive;
    // con le fasce restano fuori anime, Cera, Rosario e caselle; display, perché nel CSS le caselle hanno il loro
    for (const el of [this.anime, this.cera, this.rosario, this.icone]) el.style.display = f.attive ? 'none' : '';
    this.fasciaAlta.hidden = this.fasciaBassa.hidden = !f.attive;
    this.mietitore.el.hidden = this.ultimoBoss < 0 || f.attive;
    this.seth.el.hidden = this.ultimoBoss < 0 || !f.attive;
    this.segnalePeccato();
    this.bordo.style.inset = f.attive ? `${f.alta * px}px 0 ${f.bassa * px}px` : '';
    if (f.attive) this.disponiFasce(m, f);
    else this.disponiSenzaFasce(m, b);
    if (this.quadro.aperta) this.quadro.disponi(m, f, f.attive ? parseFloat(this.pausaTasto.style.top) / px : 0);
    if (!this.fine.hidden) this.disponiPannello(this.fine, m);
  }

  /** Telefono in verticale: tutto nelle fasce, a pixel disegnati interi. Le altezze le calcola fasce() per ogni telefono. */
  private disponiFasce(m: MisureHud, f: Fasce): void {
    const { W, H, px } = m, z = f.z, margine = FASCE.margine * z;
    const ms = arte('Stemma_Livello'), me = arte('Barra_Esperienza_Cornice'), an = arte('Nastro_Titolo');
    const su = arte('Fascia_Alta'), giu = arte('Fascia_Bassa'), ap = arte('Pulsante_Pausa_Piccolo');
    if (!ms || !me || !an || !su || !giu || !ap) return;
    // le due fasce: la parte che tocca il campo è quella che si vede, il resto della tela è per i telefoni più grandi
    for (const [el, a, y, h, top] of [[this.fasciaAlta, su, 0, f.alta, f.alta - su.h * z], [this.fasciaBassa, giu, H - f.bassa, f.bassa, 0]] as const) {
      posa(el, 0, y, m);
      el.style.width = `${W * px}px`;
      el.style.height = `${h * px}px`;
      const im = el.firstElementChild as HTMLElement;
      misura(im, a.w, a.h, z, m);
      posa(im, Math.round((W - a.w * z) / 2), top, m);
    }
    // dal basso verso l'alto: filo, riga dell'orologio e di Seth, poi stemma ed esperienza
    const yRiga = f.alta - 17 * z, yStemma = yRiga - (ms.h + 2) * z;
    posa(this.livello, margine, yStemma, m);
    misura(this.livello.firstElementChild as HTMLElement, ms.w, ms.h, z, m);
    const rn = INTERNI.Stemma_Livello.numero, num = this.livello.lastElementChild as HTMLElement;
    posa(num, rn.x * z, rn.y * z, m);
    misura(num, rn.l, rn.a, z, m);
    num.style.fontSize = `${TESTI.livello * z * px}px`;
    this.xp.disponi(margine + (ms.w + 2) * z, yStemma + Math.round(((ms.h - me.h) * z) / 2), z, m);
    Object.assign(this.orologio.style, { right: `${margine * px}px`, top: `${yRiga * px}px`, fontSize: `${16 * z * px}px`, lineHeight: `${16 * z * px}px` });
    this.seth.disponi(margine, yRiga + z, z, m);
    // avvisi: nel campo, subito sotto la fascia alta, più grandi di un ingrandimento
    this.kAvviso = z + AVVISO.inPiuTelefono;
    this.lamaAvviso = Math.max(1, Math.round(this.kAvviso * px * m.dpr));
    posa(this.avvisoEl, 0, f.alta + AVVISO.sottoFascia, m);
    this.avvisoEl.style.width = `${W * px}px`;
    this.ridisegnaAvviso();
    // preavviso delle orde: sul bordo del campo, a retino
    const lamaP = Math.max(1, Math.round(z * px * m.dpr)), latoP = (4 * lamaP) / m.dpr, urlP = mascheraRetino(PREAVVISO_ORDA.livello, lamaP);
    Object.assign(this.preavvisoEl.style, { inset: `${f.alta * px}px 0 ${f.bassa * px}px`, maskImage: `url(${urlP})`, webkitMaskImage: `url(${urlP})`, maskSize: `${latoP}px`, webkitMaskSize: `${latoP}px` });
    // Peccato: cornice a retino sul bordo del campo
    const lama = Math.max(1, Math.round(z * px * m.dpr)), lato = (4 * lama) / m.dpr, url = mascheraRetino(SEGNALE_PECCATO.livello, lama);
    Object.assign(this.peccato.style, {
      inset: `${f.alta * px}px 0 ${f.bassa * px}px`, boxShadow: `inset 0 0 0 ${SEGNALE_PECCATO.spessore * z * px}px ${SEGNALE_PECCATO.colore}`,
      maskImage: `url(${url})`, webkitMaskImage: `url(${url})`, maskSize: `${lato}px`, webkitMaskSize: `${lato}px`,
    });
    // pausa piccola: si ingrandisce solo se così non arriverebbe alla misura di un dito
    const zp = z * Math.ceil(TOCCO_MINIMO / (PAUSA_PICCOLA.lato * z * px) - 1e-9);
    (this.pausaTasto.firstElementChild as HTMLImageElement).src = ap.url;
    this.pausaTasto.style.setProperty('--margine-tocco', `${PAUSA_PICCOLA.margineTocco}px`);
    posa(this.pausaTasto, Math.round((W - ap.w * zp) / 2), angoliFascia(m, f).centroY - Math.round((ap.h * zp) / 2), m);
    misura(this.pausaTasto, ap.w, ap.h, zp, m);
    misura(this.pausaTasto.firstElementChild as HTMLElement, ap.w, ap.h, zp, m);
  }

  /** Computer, tablet e telefono in orizzontale: la disposizione di sempre. */
  private disponiSenzaFasce(m: MisureHud, b: ReturnType<typeof bordiHud>): void {
    const { W, H, px } = m;
    const zb = ingr('barre', m), zc = ingr('caselle', m), za = ingr('avvisi', m), zp = ingr('pausa', m);
    const me = arte('Barra_Esperienza_Cornice'), ms = arte('Stemma_Livello'), mm = { w: this.mietitore.larghezza, h: this.mietitore.altezza };
    if (!me || !ms) return;
    const ori = W > H;
    // esperienza al centro in alto
    const ye = b.a;
    this.xp.disponi(Math.round(W / 2 - (me.w * zb) / 2), ye, zb, m);
    // livello a sinistra, anime a destra
    posa(this.livello, b.s, b.a, m);
    misura(this.livello.firstElementChild as HTMLElement, ms.w, ms.h, zc, m);
    const rn = INTERNI.Stemma_Livello.numero, num = this.livello.lastElementChild as HTMLElement;
    posa(num, rn.x * zc, rn.y * zc, m);
    misura(num, rn.l, rn.a, zc, m);
    Object.assign(num.style, { fontSize: `${TESTI.livello * zc * px}px`, lineHeight: `${rn.a * zc * px}px` });
    Object.assign(this.anime.style, { right: `${b.d * px}px`, top: `${(b.a + 4) * px}px`, fontSize: `${16 * zc * px}px` });
    Object.assign(this.cera.style, { right: `${b.d * px}px`, top: `${(b.a + 4 + 14 * zc) * px}px`, fontSize: `${14 * zc * px}px` });
    Object.assign(this.rosario.style, { right: `${b.d * px}px`, top: `${(b.a + 4 + 26 * zc) * px}px`, fontSize: `${12 * zc * px}px` });
    // orologio nella stessa colonna: le caselle non ci arrivano mai
    Object.assign(this.orologio.style, { right: `${b.d * px}px`, top: `${(b.a + OROLOGIO.sopra * zc) * px}px`, fontSize: `${16 * zb * px}px`, lineHeight: `${16 * zb * px}px` });
    // caselle: armi nella prima fila, doni nella seconda
    const yc = b.a + ms.h * zc + 4, passo = (CASELLA.lato + CASELLA.spazio) * zc;
    let file = 0;
    const armi = this.voci.filter((v) => v.arma).length;
    [...this.icone.children].forEach((el, i) => {
      const fila = i < armi ? Math.floor(i / PER_FILA) : Math.ceil(armi / PER_FILA) + Math.floor((i - armi) / PER_FILA);
      const col = i < armi ? i % PER_FILA : (i - armi) % PER_FILA;
      file = Math.max(file, fila + 1);
      disponiCasella(el as HTMLElement, b.s + col * passo, yc + fila * passo, zc, m);
    });
    // sotto l'orologio, o sotto le caselle se scendono di più
    let y = Math.max(ye + me.h * zb + 2 + ALTEZZA_OROLOGIO * zb, yc + file * passo) + 2;
    // il Mietitore: in orizzontale sta in alto, sotto l'orologio (le caselle sono a sinistra e c'è posto)
    if (ori) y = ye + me.h * zb + 2 + ALTEZZA_OROLOGIO * zb + 4;
    this.mietitore.disponi(Math.round(W / 2 - (mm.w * zb) / 2), y, zb, m);
    if (!this.mietitore.el.hidden) y += mm.h * zb + 6;
    // avvisi: in alto, sotto barre e caselle; se sono troppe salgono sopra di loro per non toccare il personaggio
    {
      const z = Math.max(AVVISO.minimo, Math.round(za * AVVISO.scala)); // numero intero: le lettere non si deformano
      this.kAvviso = z;
      const ya = Math.max(b.a, Math.min(y, Math.floor(H / 2) - this.altezzaPersonaggio - AVVISO.margine - AVVISO.altezza * z));
      this.lamaAvviso = Math.max(1, Math.round(z * px * m.dpr));
      posa(this.avvisoEl, 0, ya, m);
      this.avvisoEl.style.width = `${W * px}px`;
      this.ridisegnaAvviso();
      const lamaP = Math.max(1, Math.round(z * px * m.dpr)), latoP = (4 * lamaP) / m.dpr, urlP = mascheraRetino(PREAVVISO_ORDA.livello, lamaP);
      Object.assign(this.preavvisoEl.style, { inset: '0', maskImage: `url(${urlP})`, webkitMaskImage: `url(${urlP})`, maskSize: `${latoP}px`, webkitMaskSize: `${latoP}px` });
    }
    // pausa in basso a destra, con un'area di tocco un po' più grande del disegno (MARGINE_TOCCO, in CSS)
    const ap = arte('Pulsante_Pausa');
    if (ap) {
      (this.pausaTasto.firstElementChild as HTMLImageElement).src = ap.url;
      this.pausaTasto.style.setProperty('--margine-tocco', `${MARGINE_TOCCO}px`);
      posa(this.pausaTasto, W - b.d - ap.w * zp, H - b.b - ap.h * zp, m);
      misura(this.pausaTasto, ap.w, ap.h, zp, m);
      misura(this.pausaTasto.firstElementChild as HTMLElement, ap.w, ap.h, zp, m);
    }
  }

  /** Fine: pannello con il nastro del titolo, icone in più, pulsanti sotto o a destra. */
  private disponiPannello(schermo: HTMLElement, m: MisureHud): void {
    const b = bordiHud(m), W = m.W, H = m.H, px = m.px, ori = W > H, conFasce = fasce(m).attive;
    const ap = arte('Pannello_Grande'), an = arte('Nastro_Titolo'), zt = ingr('pulsanti', m), zc = ingr('caselle', m);
    if (!ap || !an) return;
    schermo.style.backgroundSize = `${4 * px}px ${4 * px}px`;
    const tasti = [...schermo.querySelectorAll<HTMLElement>('.hud-tasto')];
    const riga = Math.max(...tasti.map((t) => arte(t.dataset.arte!)?.h ?? 0)) * zt, largo = Math.max(...tasti.map((t) => arte(t.dataset.arte!)?.w ?? 0)) * zt;
    const altezzaTasti = tasti.length * (riga + 3 * zt) - 3 * zt;
    const altre = [...schermo.querySelector('.hud-altre')!.children] as HTMLElement[];
    const alta = H - b.a - b.b, larga = W - b.s - b.d;
    // con le fasce le icone vanno a capo invece di uscire dallo schermo
    const perRiga = conFasce ? Math.max(1, Math.floor(larga / (26 * zc))) : altre.length || 1;
    const hAltre = altre.length ? Math.ceil(altre.length / perRiga) * 26 * zc + 4 - 2 * zc : 0;
    const nastro = (k: number): number => an.h * k - 6 * k;
    const zz = adattaZoom(ingr('pannelli', m), (k) => (ori
      ? nastro(k) + ap.h * k + hAltre <= alta && ap.w * k + 12 + largo <= larga
      : nastro(k) + ap.h * k + hAltre + 6 + altezzaTasti <= alta && ap.w * k <= larga));
    const tot = ori ? ap.w * zz + 12 + largo : ap.w * zz;
    const x = Math.round(W / 2 - tot / 2);
    let y = ori ? Math.round(b.a + (alta - nastro(zz) - ap.h * zz - hAltre) / 2) : b.a + 6;
    const n = schermo.querySelector('.hud-nastro') as HTMLElement;
    posa(n, Math.round(x + (ap.w * zz) / 2 - (an.w * zz) / 2), y, m);
    misura(n, an.w, an.h, zz, m);
    misura(n.firstElementChild as HTMLElement, an.w, an.h, zz, m);
    scriviNel(n.lastElementChild as HTMLElement, INTERNI.Nastro_Titolo.testo, zz, zz, m, TESTI.avviso);
    y += nastro(zz);
    const p = schermo.querySelector('.hud-pannello') as HTMLElement, r = INTERNI.Pannello_Grande;
    posa(p, x, y, m);
    misura(p, ap.w, ap.h, zz, m);
    misura(p.firstElementChild as HTMLElement, ap.w, ap.h, zz, m);
    scriviIn(p.children[1] as HTMLElement, r.testo, zz, 7, m); // il riepilogo della fine resta in Garamond, a più righe
    [...p.querySelectorAll<HTMLElement>('.hud-icona')].forEach((el, i) => {
      const c = r[`casella${i + 1}`];
      disponiIcona(el, x + (c.x + c.l / 2) * zz - 12 * zz - x, (c.y + c.a / 2) * zz - 12 * zz, zz, m);
    });
    const yAltre = y + ap.h * zz + 4;
    if (conFasce) altre.forEach((el, i) => disponiIcona(el, b.s + (i % perRiga) * 26 * zc, yAltre + Math.floor(i / perRiga) * 26 * zc, zc, m));
    else altre.forEach((el, i) => disponiIcona(el, x + i * 26 * zc, yAltre, zc, m));
    // pulsanti: ogni riga alta come il pulsante più alto, si tocca tutta la riga
    const cx = ori ? x + ap.w * zz + 12 + largo / 2 : W / 2;
    let yt = ori ? Math.round(b.a + (alta - altezzaTasti) / 2) : yAltre + hAltre + 6;
    const kTasti = scalaTasti(tasti, zt);
    for (const t of tasti) {
      const a = arte(t.dataset.arte!)!;
      disponiTasto(t, Math.round(cx - (a.w * zt) / 2), yt, zt, riga, kTasti, m);
      yt += riga + 3 * zt;
    }
  }
}

/** Casella di un'arma o di un dono: riquadro scuro, icona da 24 px, livello in basso a destra. */
function casella(v: VoceBuild): HTMLElement {
  const lv = blocco('hud-lv');
  lv.textContent = String(v.livello);
  const d = blocco('hud-casella', immagine(v.icona), lv);
  d.title = v.amuleto ? `${v.nome} · ${v.livello} grani` : `${v.nome} · livello ${v.livello}`;
  d.classList.toggle('spento', v.acceso === false);
  return d;
}

function disponiCasella(el: HTMLElement, x: number, y: number, z: number, m: MisureHud): void {
  const l = CASELLA.lato;
  posa(el, x, y, m);
  misura(el, l, l, z, m);
  el.style.borderWidth = `${CASELLA.bordo * z * m.px}px`;
  const im = el.children[0] as HTMLElement;
  posa(im, (l / 2 - 12 - CASELLA.bordo) * z, (l / 2 - 12 - CASELLA.bordo) * z, m);
  misura(im, 24, 24, z, m);
  const lv = el.children[1] as HTMLElement;
  Object.assign(lv.style, { right: `${-2 * z * m.px}px`, bottom: `${-3 * z * m.px}px`, fontSize: `${TESTI.casella * z * m.px}px` });
}

/** Icona con il livello, senza cornice (schermata di fine). */
function icona(v: VoceBuild): HTMLElement {
  const lv = blocco('hud-lv');
  lv.textContent = String(v.livello);
  const d = blocco('hud-icona', immagine(v.icona), lv);
  d.title = v.amuleto ? `${v.nome} · ${v.livello} grani` : `${v.nome} · livello ${v.livello}`;
  d.classList.toggle('spento', v.acceso === false);
  return d;
}

function disponiIcona(el: HTMLElement, x: number, y: number, z: number, m: MisureHud): void {
  posa(el, x, y, m);
  misura(el, 24, 24, z, m);
  misura(el.firstElementChild as HTMLElement, 24, 24, z, m);
  // nel pannello le icone sono ingrandite: il numero cresce meno, per non coprirle
  (el.lastElementChild as HTMLElement).style.fontSize = `${Math.max(TESTI.casella, 7 * z) * m.px}px`;
}

export function tempo(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
