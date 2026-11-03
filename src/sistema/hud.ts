/*
 * Interfaccia in partita (HTML sopra il gioco), con gli elementi disegnati da Edoardo (cartella HUD/), a pixel interi.
 * In alto: stemma del livello, barra dell'esperienza, orologio, anime, caselle di armi e doni, barra del Mietitore.
 * Al centro: avvisi nel nastro. In basso a destra: pausa. Poi le schermate di pausa e di fine partita.
 * La disposizione è quella della bozza (bozza-hud.html), verificata su sette telefoni: se cambia qui, cambia anche là.
 * La barra della salute è nel gioco, sotto il personaggio; l'abilità speciale in basso a sinistra (speciale.ts).
 */
import { CASELLA, FINESTRE, INTERNI, TESTI } from '../data/hud';
import { adattaZoom, arte, bordiHud, immagine, ingr, misura, misureHud, posa, retino, scriviIn, type MisureHud } from './arte';
import { audioAttivo, impostaAudio } from './audio';
import { impostaVibrazione, vibrazione } from './mobile';
import { scalaScritta, scritta, scriviNel } from './scritte';

/** Un'arma o un dono posseduto, per le caselle e i riepiloghi. */
export interface VoceBuild {
  nome: string;
  icona: string; // chiave dell'icona (Icona_<Nome>)
  livello: number;
  arma: boolean; // armi nella prima fila, doni nella seconda
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
}

export interface AzioniHud {
  pausa(): void;
  riprendi(): void;
  riprova(): void;
  menu(): void;
}

const DURATA_AVVISO = 2400; // millisecondi
const ALTEZZA_OROLOGIO = 24; // pixel di gioco per ogni volta dell'ingrandimento delle barre (testo da 16 più il respiro)
const PER_FILA = 6; // caselle per fila: 6 armi, poi 6 doni
const MAX_SCRITTA_PULSANTI = 3; // pixel di gioco per pixel della lettera nei pulsanti: come i pixel del pulsante (×3)
const OMBRA = '#000'; // ombra di un pixel sotto le scritte chiare su fondo scuro
/** Pulsante chiaro (pergamena): scritta scura, senza ombra. Sugli altri, anche l'arancio, scritta chiara con l'ombra. */
const chiaro = (arte: string): boolean => arte === 'Pulsante_Chiaro';

/** Un elemento posizionato a mano dentro l'HUD. */
function blocco(classe: string, ...figli: HTMLElement[]): HTMLElement {
  const d = document.createElement('div');
  d.className = classe;
  d.append(...figli);
  return d;
}

/** Barra con cornice e riempimento che si taglia da sinistra (esperienza, Mietitore). */
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

/** Pulsante disegnato (Pulsante_Acceso, _Scuro, …) con la scritta al centro della sua targhetta. */
function tasto(chiave: string, testo: string, dati: Record<string, string>): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'hud-tasto';
  b.dataset.arte = chiave;
  Object.assign(b.dataset, dati);
  const s = document.createElement('span');
  scritta(s, testo);
  b.append(immagine(chiave), s);
  return b;
}

export class Hud {
  private radice: HTMLElement;
  private xp = new Barra('hud-xp', 'Barra_Esperienza_Cornice', 'Barra_Esperienza_Piena');
  private mietitore = new Barra('hud-boss', 'Barra_Mietitore_Cornice', 'Barra_Mietitore_Piena');
  private orologio = blocco('hud-orologio');
  private livello = blocco('hud-livello', immagine('Stemma_Livello'), blocco('hud-livello-numero'));
  private anime = blocco('hud-anime');
  private icone = blocco('hud-icone');
  private avvisoEl = blocco('hud-avviso', immagine('Nastro_Titolo'), blocco('hud-avviso-testo'), blocco('hud-avviso-sotto'));
  private pausaTasto = document.createElement('button');
  private bordo = blocco('hud-bordo');
  private pausa: HTMLElement;
  private fine: HTMLElement;
  private voci: VoceBuild[] = [];
  private m: MisureHud = misureHud();
  private ultimoSecondo = -1;
  private ultimoLivello = -1;
  private ultimeAnime = -1;
  private ultimoBoss = -2;
  private timerAvviso = 0;
  private attesa = 0;

  constructor(contenitore: HTMLElement, private azioni: AzioniHud) {
    this.radice = blocco('hud');
    this.bordo.hidden = true;
    this.mietitore.el.hidden = true;
    this.mietitore.el.setAttribute('aria-label', 'Il Mietitore');
    this.avvisoEl.hidden = true;
    this.avvisoEl.setAttribute('aria-live', 'polite');
    this.pausaTasto.type = 'button';
    this.pausaTasto.className = 'hud-pausa-tasto';
    this.pausaTasto.setAttribute('aria-label', 'Pausa');
    this.pausaTasto.append(immagine('Pulsante_Pausa'));
    this.pausaTasto.addEventListener('click', () => this.azioni.pausa());
    this.pausa = blocco('hud-schermo hud-pausa', blocco('hud-pannello'), blocco('hud-altre'), blocco('hud-pulsanti'));
    this.fine = blocco('hud-schermo hud-fine', blocco('hud-nastro', immagine('Nastro_Titolo'), document.createElement('h1')), blocco('hud-pannello'), blocco('hud-altre'), blocco('hud-pulsanti'));
    for (const s of [this.pausa, this.fine]) {
      s.hidden = true;
      s.style.backgroundImage = `url(${retino(12)})`;
    }
    this.pausa.querySelector('.hud-pulsanti')!.append(
      tasto('Pulsante_Acceso', 'Riprendi', { azione: 'riprendi' }),
      tasto('Pulsante_Scuro', '', { opzione: 'audio' }),
      tasto('Pulsante_Scuro', '', { opzione: 'vibrazione' }),
      tasto('Pulsante_Pericolo', 'Abbandona', { azione: 'abbandona' }),
    );
    this.fine.querySelector('.hud-pulsanti')!.append(
      tasto('Pulsante_Acceso', 'Riprova', { azione: 'riprova' }),
      tasto('Pulsante_Chiaro', 'Personaggi', { azione: 'menu' }),
    );
    this.radice.append(this.bordo, this.xp.el, this.orologio, this.livello, this.anime, this.icone, this.mietitore.el, this.avvisoEl, this.pausaTasto, this.pausa, this.fine);
    this.radice.addEventListener('click', (e) => {
      const b = (e.target as Element).closest('button');
      if (!b) return;
      const azione = b.dataset.azione;
      if (azione === 'riprendi') this.azioni.riprendi();
      else if (azione === 'abbandona' || azione === 'menu') this.azioni.menu();
      else if (azione === 'riprova') this.azioni.riprova();
      if (b.dataset.opzione === 'audio') impostaAudio(!audioAttivo());
      if (b.dataset.opzione === 'vibrazione') impostaVibrazione(!vibrazione());
      if (b.dataset.opzione) {
        this.opzioni();
        this.disponi();
      }
    });
    contenitore.append(this.radice);
    window.addEventListener('resize', this.ridimensiona);
    window.visualViewport?.addEventListener('resize', this.ridimensiona);
    this.disponi();
  }

  get pausaAperta(): boolean {
    return !this.pausa.hidden;
  }

  get fineAperta(): boolean {
    return !this.fine.hidden;
  }

  /** Aggiorna solo quando qualcosa cambia davvero, per non toccare la pagina a ogni fotogramma. */
  aggiorna(secondi: number, saluteBassa: boolean, livello: number, parteEsperienza: number, anime: number, boss: number): void {
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
    this.xp.mostra(parteEsperienza, this.m);
    // boss: parte di salute rimasta, oppure −1 se non c'è
    const b = boss < 0 ? -1 : Math.ceil(boss * 100);
    if (b !== this.ultimoBoss) {
      const cambia = (b < 0) !== (this.ultimoBoss < 0);
      this.ultimoBoss = b;
      this.mietitore.el.hidden = b < 0;
      if (b >= 0) this.mietitore.mostra(b / 100, this.m);
      if (cambia) this.disponi(); // l'avviso scende sotto la barra
    }
    this.bordo.hidden = !saluteBassa;
  }

  /** Caselle di armi e doni posseduti, con il livello. */
  build(voci: VoceBuild[]): void {
    this.voci = voci;
    this.icone.replaceChildren(...voci.map((v) => casella(v)));
    this.disponi();
  }

  /** Scritta nel nastro a centro schermo, che sparisce da sola; «sotto» è una riga in più sotto il nastro. */
  avviso(testo: string, sotto = ''): void {
    scritta(this.avvisoEl.children[1], testo);
    scritta(this.avvisoEl.children[2], sotto);
    this.avvisoEl.hidden = false;
    this.disponi();
    clearTimeout(this.timerAvviso);
    this.timerAvviso = window.setTimeout(() => (this.avvisoEl.hidden = true), DURATA_AVVISO);
  }

  mostraPausa(build: VoceBuild[]): void {
    this.riempiPannello(this.pausa, build, 'Pausa', '');
    this.opzioni();
    this.pausa.hidden = false;
    this.disponi();
    (this.pausa.querySelector('[data-azione="riprendi"]') as HTMLElement).focus();
  }

  nascondiPausa(): void {
    this.pausa.hidden = true;
  }

  mostraFine(r: Riepilogo): void {
    this.fine.classList.toggle('vittoria', r.vittoria);
    scritta(this.fine.querySelector('h1')!, r.vittoria ? "L'alba" : 'Si è spenta');
    const numeri = [
      r.vittoria ? 'Hai attraversato la notte.' : `La lanterna ha resistito ${tempo(Math.floor(r.secondi))}`,
      `Livello ${r.livello} · ${Math.floor(r.anime)} anime · danno ${Math.round(r.danno)}`,
      `Record ${tempo(Math.floor(r.record))}${r.nuovoRecord ? ' · nuovo!' : ''}`,
    ];
    this.riempiPannello(this.fine, r.build, '', numeri.join('\n'));
    this.bordo.hidden = true;
    this.pausa.hidden = true;
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
  }

  private ridimensiona = (): void => {
    cancelAnimationFrame(this.attesa);
    this.attesa = requestAnimationFrame(() => this.disponi());
  };

  private opzioni(): void {
    // acceso: pulsante scuro con il bordo dorato; spento: pulsante grigio (le scritte lunghe «: sì» non stavano nella targhetta)
    for (const [opzione, nome, acceso] of [['audio', 'Suoni', audioAttivo()], ['vibrazione', 'Vibrazione', vibrazione()]] as const) {
      const b = this.pausa.querySelector<HTMLElement>(`[data-opzione="${opzione}"]`)!;
      b.dataset.arte = acceso ? 'Pulsante_Scuro' : 'Pulsante_Spento';
      (b.firstElementChild as HTMLImageElement).src = arte(b.dataset.arte)?.url ?? '';
      b.setAttribute('aria-pressed', String(acceso));
      scritta(b.lastElementChild!, nome);
    }
  }

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

  /** Mette ogni elemento al suo posto, in pixel di gioco interi (come nella bozza). */
  private disponi(): void {
    const m = (this.m = misureHud()), b = bordiHud(m), W = m.W, H = m.H, px = m.px;
    const zb = ingr('barre', m), zc = ingr('caselle', m), za = ingr('avvisi', m), zp = ingr('pausa', m);
    const me = arte('Barra_Esperienza_Cornice'), ms = arte('Stemma_Livello'), mm = arte('Barra_Mietitore_Cornice');
    if (!me || !ms || !mm) return;
    const ori = W > H;
    // esperienza al centro in alto, orologio sotto
    const ye = b.a;
    this.xp.disponi(Math.round(W / 2 - (me.w * zb) / 2), ye, zb, m);
    posa(this.orologio, 0, ye + me.h * zb + 2, m);
    Object.assign(this.orologio.style, { width: `${W * px}px`, fontSize: `${16 * zb * px}px`, lineHeight: `${ALTEZZA_OROLOGIO * zb * px}px` });
    // livello a sinistra, anime a destra
    posa(this.livello, b.s, b.a, m);
    misura(this.livello.firstElementChild as HTMLElement, ms.w, ms.h, zc, m);
    const rn = INTERNI.Stemma_Livello.numero, num = this.livello.lastElementChild as HTMLElement;
    posa(num, rn.x * zc, rn.y * zc, m);
    misura(num, rn.l, rn.a, zc, m);
    Object.assign(num.style, { fontSize: `${TESTI.livello * zc * px}px`, lineHeight: `${rn.a * zc * px}px` });
    Object.assign(this.anime.style, { right: `${b.d * px}px`, top: `${(b.a + 4) * px}px`, fontSize: `${16 * zc * px}px` });
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
    // avviso nel nastro: in alto, sotto barre e caselle, per non coprire il personaggio
    const an = arte('Nastro_Titolo');
    if (an) {
      const xa = Math.round(W / 2 - (an.w * za) / 2), ya = y;
      posa(this.avvisoEl, xa, ya, m);
      misura(this.avvisoEl, an.w, an.h, za, m);
      misura(this.avvisoEl.firstElementChild as HTMLElement, an.w, an.h, za, m);
      scriviNel(this.avvisoEl.children[1] as HTMLElement, INTERNI.Nastro_Titolo.testo, za, za, m, TESTI.avviso);
      // la riga sotto il nastro, larga quanto lo schermo, con l'ombra perché sta sopra il gioco
      const sotto = this.avvisoEl.children[2] as HTMLElement;
      sotto.style.width = `${W * px}px`;
      sotto.style.fontSize = `${TESTI.avvisoSotto * za * px}px`;
      scriviNel(sotto, { x: -xa, y: (an.h - 8) * za, l: W, a: 12 * zb }, 1, 2 * zb, m, TESTI.avvisoSotto * za, OMBRA); // a pixel doppi: a pixel singoli era minuscola
    }
    // pausa in basso a destra, con un'area di tocco un po' più grande del disegno (MARGINE_TOCCO, in CSS)
    const ap = arte('Pulsante_Pausa');
    if (ap) {
      posa(this.pausaTasto, W - b.d - ap.w * zp, H - b.b - ap.h * zp, m);
      misura(this.pausaTasto, ap.w, ap.h, zp, m);
      misura(this.pausaTasto.firstElementChild as HTMLElement, ap.w, ap.h, zp, m);
    }
    if (!this.pausa.hidden) this.disponiPannello(this.pausa, false, m);
    if (!this.fine.hidden) this.disponiPannello(this.fine, true, m);
  }

  /** Pausa e fine: pannello (con il nastro del titolo nella fine), icone in più, pulsanti sotto o a destra. */
  private disponiPannello(schermo: HTMLElement, conNastro: boolean, m: MisureHud): void {
    const b = bordiHud(m), W = m.W, H = m.H, px = m.px, ori = W > H;
    const ap = arte('Pannello_Grande'), an = arte('Nastro_Titolo'), zt = ingr('pulsanti', m), zc = ingr('caselle', m);
    if (!ap || !an) return;
    schermo.style.backgroundSize = `${4 * px}px ${4 * px}px`;
    const tasti = [...schermo.querySelectorAll<HTMLElement>('.hud-tasto')];
    const riga = Math.max(...tasti.map((t) => arte(t.dataset.arte!)?.h ?? 0)) * zt, largo = Math.max(...tasti.map((t) => arte(t.dataset.arte!)?.w ?? 0)) * zt;
    const altezzaTasti = tasti.length * (riga + 3 * zt) - 3 * zt;
    const altre = [...schermo.querySelector('.hud-altre')!.children] as HTMLElement[];
    const hAltre = altre.length ? 24 * zc + 4 : 0, alta = H - b.a - b.b, larga = W - b.s - b.d;
    const nastro = (k: number): number => (conNastro ? an.h * k - 6 * k : 0);
    const zz = adattaZoom(ingr('pannelli', m), (k) => (ori
      ? nastro(k) + ap.h * k + hAltre <= alta && ap.w * k + 12 + largo <= larga
      : nastro(k) + ap.h * k + hAltre + 6 + altezzaTasti <= alta && ap.w * k <= larga));
    const tot = ori ? ap.w * zz + 12 + largo : ap.w * zz;
    const x = Math.round(W / 2 - tot / 2);
    let y = ori ? Math.round(b.a + (alta - nastro(zz) - ap.h * zz - hAltre) / 2) : b.a + 6;
    if (conNastro) {
      const n = schermo.querySelector('.hud-nastro') as HTMLElement;
      posa(n, Math.round(x + (ap.w * zz) / 2 - (an.w * zz) / 2), y, m);
      misura(n, an.w, an.h, zz, m);
      misura(n.firstElementChild as HTMLElement, an.w, an.h, zz, m);
      scriviNel(n.lastElementChild as HTMLElement, INTERNI.Nastro_Titolo.testo, zz, zz, m, TESTI.avviso);
      y += nastro(zz);
    }
    const p = schermo.querySelector('.hud-pannello') as HTMLElement, r = INTERNI.Pannello_Grande;
    posa(p, x, y, m);
    misura(p, ap.w, ap.h, zz, m);
    misura(p.firstElementChild as HTMLElement, ap.w, ap.h, zz, m);
    // il titolo (Pausa) a pixel grandi quanto quelli del pannello; il riepilogo della fine resta in Garamond, a più righe
    if (conNastro) scriviIn(p.children[1] as HTMLElement, r.testo, zz, 7, m);
    else scriviNel(p.children[1] as HTMLElement, r.testo, zz, 2 * zz, m, 20, OMBRA); // titolo: lettere il doppio dei pixel del pannello
    [...p.querySelectorAll<HTMLElement>('.hud-icona')].forEach((el, i) => {
      const c = r[`casella${i + 1}`];
      disponiIcona(el, x + (c.x + c.l / 2) * zz - 12 * zz - x, (c.y + c.a / 2) * zz - 12 * zz, zz, m);
    });
    const yAltre = y + ap.h * zz + 4;
    altre.forEach((el, i) => disponiIcona(el, x + i * 26 * zc, yAltre, zc, m));
    // pulsanti: ogni riga alta come il pulsante più alto, si tocca tutta la riga
    const cx = ori ? x + ap.w * zz + 12 + largo / 2 : W / 2;
    let yt = ori ? Math.round(b.a + (alta - altezzaTasti) / 2) : yAltre + hAltre + 6;
    // tutte le scritte dei pulsanti con lo stesso ingrandimento: quello della più lunga
    const kTasti = Math.min(...tasti.map((t) => {
      const rt = INTERNI[t.dataset.arte!]?.testo;
      const s = t.lastElementChild as HTMLElement;
      return (rt && scalaScritta(s.dataset.testo ?? '', rt, zt, MAX_SCRITTA_PULSANTI)) || MAX_SCRITTA_PULSANTI;
    }));
    for (const t of tasti) {
      const a = arte(t.dataset.arte!)!, xt = Math.round(cx - (a.w * zt) / 2);
      posa(t, xt, yt, m);
      misura(t, a.w, riga / zt, zt, m);
      const im = t.firstElementChild as HTMLElement;
      misura(im, a.w, a.h, zt, m);
      im.style.top = `${Math.round((riga - a.h * zt) / 2) * px}px`;
      const s = t.lastElementChild as HTMLElement, rt = INTERNI[t.dataset.arte!]?.testo ?? { x: 0, y: 0, l: a.w, a: a.h };
      scriviNel(s, { ...rt, y: rt.y + Math.round((riga / zt - a.h) / 2) }, zt, kTasti, m, TESTI.pulsante, chiaro(t.dataset.arte!) ? null : OMBRA);
      yt += riga + 3 * zt;
    }
  }
}

/** Casella di un'arma o di un dono: riquadro scuro, icona da 24 px, livello in basso a destra. */
function casella(v: VoceBuild): HTMLElement {
  const lv = blocco('hud-lv');
  lv.textContent = String(v.livello);
  const d = blocco('hud-casella', immagine(v.icona), lv);
  d.title = `${v.nome} · livello ${v.livello}`;
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

/** Icona con il livello, senza cornice (pannelli di pausa e fine). */
function icona(v: VoceBuild): HTMLElement {
  const lv = blocco('hud-lv');
  lv.textContent = String(v.livello);
  const d = blocco('hud-icona', immagine(v.icona), lv);
  d.title = `${v.nome} · livello ${v.livello}`;
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
