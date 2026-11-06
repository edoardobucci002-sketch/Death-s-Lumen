/*
 * Il mosaico dei frammenti di vetro: a ogni frammento compare al centro in alto, il pezzo nuovo si accende a retino
 * e sotto si legge 1/3, 2/3, 3/3. Non ferma il gioco e non prende i tocchi. I fotogrammi di HUD/Mosaico sono
 * spento, 1/3, 2/3 e completo; se manca il disegno non compare nulla. Tempi e misure in MOSAICO (data/hud.ts).
 */
import { MOSAICO } from '../data/hud';
import { arte, bordiHud, fasce, mascheraRetino, misura, misureHud, posa } from './arte';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export class Mosaico {
  private el = document.createElement('div');
  private tela = document.createElement('canvas');
  private numero = document.createElement('div');
  private ctx = this.tela.getContext('2d')!;
  private stati: ImageData[] = [];
  private uscita: ImageData | null = null;
  private da = 0;
  private a = 0;
  private completo = false;
  private inizio = 0;
  private attesa = 0;
  private gradino = -1;
  private cella = 1;
  private dpr = 1;
  private lato = 0;

  constructor(contenitore: HTMLElement) {
    this.el.className = 'mosaico';
    this.el.hidden = true;
    this.el.setAttribute('aria-live', 'polite');
    this.tela.className = 'mosaico-tela';
    this.numero.className = 'mosaico-numero';
    this.el.append(this.tela, this.numero);
    contenitore.append(this.el);
    const fotogrammi = arte('Mosaico')?.fotogrammi ?? [];
    if (!fotogrammi.length) return;
    this.lato = fotogrammi[0].width;
    this.tela.width = this.tela.height = this.lato;
    this.stati = fotogrammi.map((f) => f.getContext('2d')!.getImageData(0, 0, this.lato, this.lato));
    this.uscita = this.ctx.createImageData(this.lato, this.lato);
  }

  /** Il frammento n di «servono»: parte da ciò che si vede già e accende il pezzo nuovo. */
  mostra(n: number, servono: number): void {
    if (!this.lato) return;
    this.da = Math.min(n - 1, this.stati.length - 1);
    this.a = Math.min(n, this.stati.length - 1);
    this.completo = n >= servono;
    this.numero.textContent = `${n}/${servono}`;
    this.disponi();
    this.maschera('');
    this.el.hidden = false;
    this.gradino = -1;
    this.inizio = performance.now();
    cancelAnimationFrame(this.attesa);
    this.attesa = requestAnimationFrame(this.fotogramma);
  }

  nascondi(): void {
    cancelAnimationFrame(this.attesa);
    this.el.hidden = true;
  }

  distruggi(): void {
    cancelAnimationFrame(this.attesa);
    this.el.remove();
  }

  private disponi(): void {
    const m = misureHud(), f = fasce(m), margine = 12;
    const k = Math.max(1, Math.min(Math.round(MOSAICO.punti / (this.lato * m.px)), Math.floor((m.W - margine) / this.lato)));
    misura(this.tela, this.lato, this.lato, k, m);
    this.numero.style.width = `${this.lato * k * m.px}px`;
    posa(this.el, Math.round((m.W - this.lato * k) / 2), f.attive ? f.alta + MOSAICO.margine : bordiHud(m).a + MOSAICO.sopraComputer, m);
    this.cella = Math.max(1, Math.round(k * m.px * m.dpr));
    this.dpr = m.dpr;
  }

  private maschera(url: string): void {
    const s = `${(4 * this.cella) / this.dpr}px`;
    Object.assign(this.el.style, { maskImage: url ? `url(${url})` : '', webkitMaskImage: url ? `url(${url})` : '', maskSize: s, webkitMaskSize: s });
  }

  /** Disegna il passaggio dal fotogramma da al fotogramma a, con un retino Bayer di «livello» su 16. */
  private disegna(livello: number): void {
    const prima = this.stati[this.da].data, dopo = this.stati[this.a].data, u = this.uscita!.data, l = this.lato;
    for (let y = 0, i = 0; y < l; y++) {
      for (let x = 0; x < l; x++, i += 4) {
        const sorgente = BAYER[(y & 3) * 4 + (x & 3)] < livello ? dopo : prima;
        u[i] = sorgente[i];
        u[i + 1] = sorgente[i + 1];
        u[i + 2] = sorgente[i + 2];
        u[i + 3] = 255;
      }
    }
    this.ctx.putImageData(this.uscita!, 0, 0);
  }

  private fotogramma = (ora: number): void => {
    const t = (ora - this.inizio) / 1000, M = MOSAICO;
    if (t < M.rivela + 0.05) {
      const passo = Math.min(M.passi, Math.floor((t / M.rivela) * M.passi));
      if (passo !== this.gradino) {
        this.gradino = passo;
        this.disegna(Math.round((16 * passo) / M.passi));
      }
    } else if (this.gradino !== M.passi) {
      this.gradino = M.passi;
      this.disegna(16);
    }
    if (!this.completo && t >= M.resta) {
      if (t >= M.resta + M.uscita) {
        this.nascondi();
        return;
      }
      const passo = Math.floor(((t - M.resta) / M.uscita) * M.passi);
      this.maschera(mascheraRetino(Math.round(16 * (1 - passo / (M.passi + 1))), this.cella));
    }
    this.attesa = requestAnimationFrame(this.fotogramma);
  };
}
