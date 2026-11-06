/*
 * Il momento della scoperta di un'Unione: la partita si ferma, l'arma e il dono si avvicinano a scatti, un lampo a retino
 * e compare l'Unione con il suo nome e la sua ricetta. Disegnata dal codice finché Edoardo non disegna la sua
 * (docs/asset_da_creare.md). Tutto a pixel interi, a gradini, senza trasparenze; tempi e misure in RIVELAZIONE (data/hud.ts).
 * Dopo la comparsa resta lì finché un tocco, un click o lo Spazio non la chiude; se si apre la pausa o l'app va in secondo piano l'animazione si salta.
 */
import { RIVELAZIONE } from '../data/hud';
import { immagine, ingr, mascheraRetino, misura, misureHud, posa, retino, type MisureHud } from './arte';
import { tela } from './scritte';

export interface VoceRivelazione { nome: string; ricetta: string; arma: string; dono: string; unione: string }

export class Rivelazione {
  private el = document.createElement('div');
  private coda: VoceRivelazione[] = [];
  private voce: VoceRivelazione | null = null;
  private inizio = 0;
  private attesa = 0;
  private fondoAttuale = -1;
  private pronta = false; // l'Unione è comparsa: un tocco chiude
  private m: MisureHud = misureHud();
  private arma = immagine('Icona_Lanterna');
  private dono = immagine('Icona_Lanterna');
  private unione = immagine('Icona_Lanterna');
  private lampo = document.createElement('div');
  private testi = document.createElement('div');

  constructor(contenitore: HTMLElement, private finita: () => void) {
    this.el.className = 'rivelazione';
    this.el.hidden = true;
    this.lampo.className = 'rivelazione-lampo';
    this.testi.className = 'rivelazione-testi';
    this.el.append(this.lampo, this.arma, this.dono, this.unione, this.testi);
    this.el.addEventListener('click', () => { if (this.pronta) this.prossima(); });
    window.addEventListener('keydown', this.tasto, true); // in cattura: lo Spazio qui chiude e basta, non usa l'abilità
    contenitore.append(this.el);
  }

  get attiva(): boolean {
    return !this.el.hidden;
  }

  mostra(v: VoceRivelazione): void {
    this.coda.push(v);
    if (!this.attiva) this.prossima();
  }

  /** Chiude tutto subito: serve quando si apre la pausa. */
  salta(): void {
    if (!this.attiva) return;
    this.coda.length = 0;
    this.prossima();
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto, true);
    cancelAnimationFrame(this.attesa);
    this.el.remove();
  }

  private prossima(): void {
    cancelAnimationFrame(this.attesa);
    this.voce = this.coda.shift() ?? null;
    this.pronta = false;
    if (!this.voce) {
      this.el.hidden = true;
      this.finita();
      return;
    }
    const v = this.voce, im = (e: HTMLImageElement, c: string): void => { e.src = immagine(c).src; };
    im(this.arma, v.arma);
    im(this.dono, v.dono);
    im(this.unione, v.unione);
    this.m = misureHud();
    this.fondoAttuale = -1;
    this.lampo.hidden = this.unione.hidden = this.testi.hidden = true;
    this.arma.hidden = this.dono.hidden = false;
    this.el.hidden = false;
    this.el.style.backgroundSize = `${4 * this.m.px}px ${4 * this.m.px}px`;
    this.scrivi(v);
    this.inizio = performance.now();
    this.attesa = requestAnimationFrame(this.fotogramma);
  }

  /** Nome e ricetta sotto l'Unione. */
  private scrivi(v: VoceRivelazione): void {
    const m = this.m, kPiccola = Math.max(1, Math.round(RIVELAZIONE.lettera / m.px)), y = Math.round(m.H / 2 + RIVELAZIONE.sottoIcona / m.px);
    const riga = (t: string, colore: string, k: number): HTMLElement => {
      const c = tela(t, colore, null), kk = Math.max(1, Math.min(k, Math.floor((m.W - 24) / c.width)));
      c.className = 'rivelazione-scritta';
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', t);
      misura(c, c.width, c.height, kk, m);
      posa(c, Math.round((m.W - c.width * kk) / 2), 0, m);
      c.dataset.alto = String(c.height * kk);
      return c;
    };
    const titolo = riga('Unione scoperta', '#dcc07a', kPiccola), nome = riga(v.nome, '#ffe08a', kPiccola + 1);
    const sotto = document.createElement('div');
    sotto.className = 'rivelazione-ricetta';
    sotto.textContent = v.ricetta;
    const invito = document.createElement('div');
    invito.className = 'rivelazione-ricetta tenue';
    invito.textContent = 'Il prossimo reliquiario le unisce';
    posa(titolo, parseFloat(titolo.style.left) / m.px, y, m);
    const yNome = y + Number(titolo.dataset.alto) + 8 * kPiccola;
    posa(nome, parseFloat(nome.style.left) / m.px, yNome, m);
    const ySotto = yNome + Number(nome.dataset.alto) + 6 * kPiccola;
    for (const [e, yy] of [[sotto, ySotto], [invito, ySotto + 12 * kPiccola]] as const) {
      posa(e, 0, yy, m);
      e.style.width = `${m.W * m.px}px`;
    }
    const chiudi = document.createElement('div');
    chiudi.className = 'rivelazione-chiudi';
    chiudi.textContent = window.matchMedia('(hover: none)').matches ? 'Tocca per chiudere' : 'Clicca o premi Spazio per chiudere';
    this.testi.replaceChildren(titolo, nome, sotto, invito, chiudi);
  }

  /** Spazio chiude l'Unione (solo dopo la comparsa); mentre c'è l'animazione nessun altro tasto di gioco passa. */
  private tasto = (e: KeyboardEvent): void => {
    if (!this.attiva || e.code !== 'Space') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.pronta && !e.repeat) this.prossima();
  };

  private fotogramma = (ora: number): void => {
    const t = (ora - this.inizio) / 1000, m = this.m, R = RIVELAZIONE;
    const z = ingr('barre', m), k = Math.max(1, Math.floor(R.iconaPunti / (24 * m.px))), lato = 24 * k;
    const cx = Math.round(m.W / 2), cy = Math.round(m.H / 2 - R.sopraCentro / m.px), arrivo = R.entrata + R.avvicina, luce = arrivo + R.lampo;
    // il fondo si scurisce a gradini
    const gradino = Math.min(R.gradini, Math.floor((t / R.entrata) * R.gradini));
    if (gradino !== this.fondoAttuale) {
      this.fondoAttuale = gradino;
      this.el.style.backgroundImage = `url(${retino(R.fondoDa + Math.round(((R.fondoA - R.fondoDa) * gradino) / R.gradini))})`;
    }
    if (t < arrivo) {
      // arma e dono si avvicinano a scatti, da una parte e dall'altra
      const parte = Math.floor(Math.max(0, Math.min(1, (t - R.entrata) / R.avvicina)) * R.passi) / R.passi;
      const lontano = Math.round((m.W / 2 - lato / 2 - 24) * (1 - parte));
      for (const [im, verso] of [[this.arma, -1], [this.dono, 1]] as const) {
        misura(im, 24, 24, k, m);
        posa(im, cx + verso * lontano - lato / 2, cy - lato / 2, m);
      }
    } else if (t < luce) {
      this.arma.hidden = this.dono.hidden = true;
      // il lampo si allarga e si spegne a retino
      const parte = (t - arrivo) / R.lampo, passo = Math.floor(parte * R.passi) / R.passi;
      const l = Math.round((lato * (1 + passo * R.allargaLampo)) / (2 * z)) * 2 * z, cella = Math.max(1, Math.round(z * m.px * m.dpr));
      const url = mascheraRetino(Math.round(16 * (1 - passo)), cella), s = (4 * cella) / m.dpr;
      this.lampo.hidden = false;
      posa(this.lampo, cx - l / 2, cy - l / 2, m);
      misura(this.lampo, l, l, 1, m);
      Object.assign(this.lampo.style, { maskImage: `url(${url})`, webkitMaskImage: `url(${url})`, maskSize: `${s}px`, webkitMaskSize: `${s}px` });
    } else {
      this.lampo.hidden = true;
      if (this.unione.hidden) {
        const kk = k + R.unioneInPiu;
        misura(this.unione, 24, 24, kk, m);
        posa(this.unione, cx - 12 * kk, cy - 12 * kk, m);
        this.unione.hidden = this.testi.hidden = false;
        this.pronta = true;
      }
      return; // resta sullo schermo finché il giocatore non tocca
    }
    this.attesa = requestAnimationFrame(this.fotogramma);
  };
}
