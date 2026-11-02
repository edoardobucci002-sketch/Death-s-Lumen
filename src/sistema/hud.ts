/*
 * Interfaccia in partita (HTML sopra il gioco). In alto: barra dell'esperienza, livello, orologio, anime,
 * icone di armi e doni con il loro livello, barra del Mietitore. Al centro: avvisi (sciami, Mietitore, reliquiari).
 * In basso a destra: pausa. Poi le schermate di pausa (build, audio, vibrazione, abbandona) e di fine partita.
 * La barra della salute è nel gioco, sotto il personaggio; l'abilità speciale in basso a sinistra (speciale.ts).
 */
import { audioAttivo, impostaAudio } from './audio';
import { impostaVibrazione, vibrazione } from './mobile';

/** Un'arma o un dono posseduto, per le icone e i riepiloghi. */
export interface VoceBuild {
  nome: string;
  immagine: string | null;
  livello: number;
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

export class Hud {
  private radice: HTMLElement;
  private orologio: HTMLElement;
  private livello: HTMLElement;
  private anime: HTMLElement;
  private esperienza: HTMLElement;
  private icone: HTMLElement;
  private boss: HTMLElement;
  private bossPiena: HTMLElement;
  private bordo: HTMLElement;
  private avvisoTesto: HTMLElement;
  private pausa: HTMLElement;
  private fine: HTMLElement;
  private ultimoSecondo = -1;
  private ultimoLivello = 1;
  private ultimeAnime = -1;
  private ultimaParte = -1;
  private ultimoBoss = -2;

  constructor(contenitore: HTMLElement, private azioni: AzioniHud) {
    this.radice = document.createElement('div');
    this.radice.className = 'hud';
    this.radice.innerHTML = `
      <div class="hud-bordo" hidden></div>
      <div class="hud-esperienza"><div class="hud-esperienza-piena"></div></div>
      <div class="hud-alto">
        <div class="hud-riga">
          <div class="hud-livello">Lv 1</div>
          <div class="hud-orologio">0:00</div>
          <div class="hud-anime">0</div>
        </div>
        <div class="hud-icone"></div>
        <div class="hud-boss" hidden><span>Il Mietitore</span><div class="hud-boss-barra"><div class="hud-boss-piena"></div></div></div>
      </div>
      <div class="hud-avviso" aria-live="polite"></div>
      <button type="button" class="hud-pausa-tasto" aria-label="Pausa"><span></span><span></span></button>
      <div class="hud-schermo hud-pausa" hidden>
        <h1>Pausa</h1>
        <div class="hud-build"></div>
        <div class="hud-opzioni">
          <button type="button" data-opzione="audio"></button>
          <button type="button" data-opzione="vibrazione"></button>
        </div>
        <div class="hud-pulsanti">
          <button type="button" class="principale" data-azione="riprendi">Riprendi</button>
          <button type="button" data-azione="abbandona">Abbandona</button>
        </div>
      </div>
      <div class="hud-schermo hud-fine" hidden>
        <h1></h1>
        <p class="hud-fine-motto"></p>
        <dl class="hud-numeri"></dl>
        <div class="hud-build"></div>
        <div class="hud-pulsanti">
          <button type="button" class="principale" data-azione="riprova">Riprova</button>
          <button type="button" data-azione="menu">Altro personaggio</button>
        </div>
      </div>`;
    const q = <T extends HTMLElement>(s: string): T => this.radice.querySelector(s) as T;
    this.orologio = q('.hud-orologio');
    this.livello = q('.hud-livello');
    this.anime = q('.hud-anime');
    this.esperienza = q('.hud-esperienza-piena');
    this.icone = q('.hud-icone');
    this.boss = q('.hud-boss');
    this.bossPiena = q('.hud-boss-piena');
    this.bordo = q('.hud-bordo');
    this.avvisoTesto = q('.hud-avviso');
    this.pausa = q('.hud-pausa');
    this.fine = q('.hud-fine');
    q('.hud-pausa-tasto').addEventListener('click', () => this.azioni.pausa());
    this.radice.addEventListener('click', (e) => {
      const b = (e.target as Element).closest('button');
      if (!b) return;
      const azione = b.dataset.azione;
      if (azione === 'riprendi') this.azioni.riprendi();
      else if (azione === 'abbandona' || azione === 'menu') this.azioni.menu();
      else if (azione === 'riprova') this.azioni.riprova();
      if (b.dataset.opzione === 'audio') impostaAudio(!audioAttivo());
      if (b.dataset.opzione === 'vibrazione') impostaVibrazione(!vibrazione());
      if (b.dataset.opzione) this.opzioni();
    });
    // le icone della v0 sono piccole: si ingrandiscono di 2 volte esatte
    this.radice.addEventListener('load', (e) => {
      const im = e.target as HTMLImageElement;
      if (im.tagName === 'IMG') im.style.width = `${im.naturalWidth * 2}px`;
    }, true);
    contenitore.append(this.radice);
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
      this.livello.textContent = `Lv ${livello}`;
    }
    const a = Math.floor(anime);
    if (a !== this.ultimeAnime) {
      this.ultimeAnime = a;
      this.anime.textContent = String(a);
    }
    const p = Math.round(Math.min(1, parteEsperienza) * 200);
    if (p !== this.ultimaParte) {
      this.ultimaParte = p;
      this.esperienza.style.width = `${p / 2}%`;
    }
    // boss: parte di salute rimasta, oppure −1 se non c'è
    const b = boss < 0 ? -1 : Math.ceil(boss * 100);
    if (b !== this.ultimoBoss) {
      this.ultimoBoss = b;
      this.boss.hidden = b < 0;
      if (b >= 0) this.bossPiena.style.width = `${b}%`;
    }
    this.bordo.hidden = !saluteBassa;
  }

  /** Icone di armi e doni posseduti, con il livello. */
  build(voci: VoceBuild[]): void {
    this.icone.replaceChildren(...voci.map((v) => icona(v, false)));
  }

  /** Scritta a centro schermo che svanisce da sola. */
  avviso(testo: string): void {
    this.avvisoTesto.textContent = testo;
    this.avvisoTesto.classList.remove('visibile');
    void this.avvisoTesto.offsetWidth; // fa ripartire l'animazione
    this.avvisoTesto.classList.add('visibile');
  }

  mostraPausa(build: VoceBuild[]): void {
    this.pausa.querySelector('.hud-build')!.replaceChildren(...build.map((v) => icona(v, true)));
    this.opzioni();
    this.pausa.hidden = false;
    (this.pausa.querySelector('[data-azione="riprendi"]') as HTMLElement).focus();
  }

  nascondiPausa(): void {
    this.pausa.hidden = true;
  }

  mostraFine(r: Riepilogo): void {
    this.fine.classList.toggle('vittoria', r.vittoria);
    this.fine.querySelector('h1')!.textContent = r.vittoria ? "L'alba" : 'La lanterna si è spenta';
    this.fine.querySelector('.hud-fine-motto')!.textContent = r.vittoria ? 'Hai attraversato la notte.' : `Hai resistito ${tempo(Math.floor(r.secondi))}`;
    const numeri: [string, string][] = [
      ['Tempo', tempo(Math.floor(r.secondi))],
      ['Livello', String(r.livello)],
      ['Anime', String(Math.floor(r.anime))],
      ['Danno', String(Math.round(r.danno))],
      ['Record', r.nuovoRecord ? `${tempo(Math.floor(r.record))} · nuovo!` : tempo(Math.floor(r.record))],
    ];
    this.fine.querySelector('.hud-numeri')!.innerHTML = numeri.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    this.fine.querySelector('.hud-build')!.replaceChildren(...r.build.map((v) => icona(v, true)));
    this.bordo.hidden = true;
    this.pausa.hidden = true;
    this.fine.hidden = false;
    (this.fine.querySelector('[data-azione="riprova"]') as HTMLElement).focus();
  }

  distruggi(): void {
    this.radice.remove();
  }

  private opzioni(): void {
    this.pausa.querySelector('[data-opzione="audio"]')!.textContent = `Suoni: ${audioAttivo() ? 'sì' : 'no'}`;
    this.pausa.querySelector('[data-opzione="vibrazione"]')!.textContent = `Vibrazione: ${vibrazione() ? 'sì' : 'no'}`;
  }
}

/** Icona con il livello; con «nome» anche il nome scritto accanto (riepiloghi). */
function icona(v: VoceBuild, nome: boolean): HTMLElement {
  const d = document.createElement('div');
  d.className = nome ? 'hud-voce' : 'hud-icona';
  d.innerHTML = `${v.immagine ? `<img alt="" src="${v.immagine}">` : ''}<span class="hud-lv">${v.livello}</span>${nome ? `<span class="hud-nome">${v.nome}</span>` : ''}`;
  d.title = `${v.nome} · livello ${v.livello}`;
  return d;
}

export function tempo(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
