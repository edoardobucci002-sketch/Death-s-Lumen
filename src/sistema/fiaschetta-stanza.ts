/*
 * La fiaschetta nel gioco a stanze (17/11, richiesta di Edoardo): le regole del survivor (FIASCHETTA in
 * src/data/sopravvivenza.ts: sorsi contati, ogni sorso cura una parte della salute massima in un secondo), il tasto F
 * e un pulsante tondo disegnato dal codice sopra quello dell'abilità: tondo scuro, una fiala al centro e un anello con
 * una tacca per sorso massimo, accesa se il sorso c'è. Il Calice riverso alza i sorsi massimi. Nella fetta i sorsi
 * non tornano: torneranno con mini-boss, Boss e Sosta (proposta del pivot).
 */
import { FIASCHETTA } from '../data/sopravvivenza';
import { ABILITA_STANZA, FIASCHETTA_STANZA, JOYSTICK_STANZE } from '../data/stanze';
import { TOCCO_MINIMO } from '../data/hud';
import { ingr, misura, posa, type MisureHud } from './arte';
import { suona } from './audio';
import { vibra } from './mobile';

const C = FIASCHETTA.colori;

export class FiaschettaStanza {
  sorsi: number = FIASCHETTA.sorsi;
  massimo: number = FIASCHETTA.sorsi;
  bevuti = 0; // per il LAB e le prove
  private curaRimasta = 0;
  private readonly pulsante: HTMLButtonElement;
  private readonly tela: HTMLCanvasElement;
  private vista = '';

  constructor(contenitore: HTMLElement, private readonly puo: () => boolean) {
    this.pulsante = document.createElement('button');
    this.pulsante.type = 'button';
    this.pulsante.className = 'stanze-abilita stanze-fiaschetta';
    this.pulsante.setAttribute('aria-label', 'Fiaschetta di lumen');
    this.tela = document.createElement('canvas');
    this.tela.className = 'arte';
    this.tela.width = this.tela.height = FIASCHETTA_STANZA.tasto.lato;
    this.pulsante.append(this.tela);
    this.pulsante.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.bevi();
    });
    contenitore.append(this.pulsante);
    window.addEventListener('keydown', this.tasto);
    this.disegna();
  }

  /** Beve un sorso se c'è e se ora si può (gioco non fermo, salute non piena); restituisce true se ha bevuto. */
  bevi(): boolean {
    if (this.sorsi <= 0 || this.curaRimasta > 0 || !this.puo()) {
      suona('vuoto');
      return false;
    }
    this.sorsi--;
    this.bevuti++;
    this.curaRimasta = FIASCHETTA.durata;
    suona('cura');
    vibra('leggera');
    this.disegna();
    return true;
  }

  /** Un passo: la parte di salute massima da curare in questo passo. */
  aggiorna(dt: number): number {
    if (this.curaRimasta <= 0) return 0;
    const t = Math.min(dt, this.curaRimasta);
    this.curaRimasta -= t;
    return (FIASCHETTA.cura * t) / FIASCHETTA.durata;
  }

  /** Sorsi massimi (il Calice riverso li alza): quelli in più arrivano pieni. */
  impostaMassimo(n: number): void {
    if (n > this.massimo) this.sorsi += n - this.massimo;
    this.massimo = n;
    this.sorsi = Math.min(this.sorsi, n);
    this.disegna();
  }

  /** Aggiunge sorsi, senza superare il massimo (LAB; più avanti mini-boss, Boss e Sosta). */
  ricarica(n: number): void {
    this.sorsi = Math.min(this.massimo, this.sorsi + n);
    this.disegna();
  }

  /** Sopra il pulsante dell'abilità (che sta a sinistra del joystick d'attacco), staccata di FIASCHETTA_STANZA.tasto.distanza. */
  disponi(m: MisureHud, joystick: { x: number; y: number; l: number }): void {
    const z = ingr('joystick', m), A = ABILITA_STANZA.tasto, F = FIASCHETTA_STANZA.tasto;
    const ax = joystick.x - A.distanza * z - A.lato * z, ay = joystick.y + Math.round(joystick.l / 2) - A.lato * z;
    posa(this.pulsante, ax + Math.round(((A.lato - F.lato) * z) / 2), ay - (F.distanza + F.lato) * z, m);
    misura(this.pulsante, F.lato, F.lato, z, m);
    misura(this.tela, F.lato, F.lato, z, m);
    this.pulsante.style.setProperty('--margine-tocco', `${Math.max(F.margine, Math.ceil((TOCCO_MINIMO - F.lato * z * m.px) / 2))}px`);
  }

  distruggi(): void {
    window.removeEventListener('keydown', this.tasto);
    this.pulsante.remove();
  }

  /** Il tondo: bordo, anello di tacche (una per sorso massimo, ambra se piena) e la fiala al centro. */
  private disegna(): void {
    const chiave = `${this.sorsi}/${this.massimo}`;
    if (chiave === this.vista) return;
    this.vista = chiave;
    const l = FIASCHETTA_STANZA.tasto.lato, r = l / 2, g = this.tela.getContext('2d')!, B = JOYSTICK_STANZE.colori;
    const n = Math.max(1, this.massimo), stacco = 0.035;
    g.clearRect(0, 0, l, l);
    for (let y = 0; y < l; y++) {
      for (let x = 0; x < l; x++) {
        const dx = x + 0.5 - r, dy = y + 0.5 - r, d = Math.hypot(dx, dy);
        if (d > r) continue;
        let k: string;
        if (d > r - 1) k = B.bordo;
        else if (d > r - 4) {
          const giro = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1, tacca = Math.floor(giro * n), dentro = giro * n - tacca;
          k = n > 1 && (dentro < (stacco * n) / 2 || dentro > 1 - (stacco * n) / 2) ? B.bordo : tacca < this.sorsi ? C.liquido : '#3a2f27';
        } else if (d > r - 5) k = B.bordo;
        else k = C.vuoto;
        g.fillStyle = k;
        g.fillRect(x, y, 1, 1);
      }
    }
    // la fiala (15 × 23, la stessa del survivor): collo, pancia tonda, vetro in alto e un riflesso
    const FL = 15, FA = 23, x0 = Math.floor(r - FL / 2), y0 = Math.floor(r - FA / 2);
    const dentro = (x: number, y: number): boolean => {
      if (y >= 1 && y <= 7 && x >= 5 && x <= 9) return true;
      const ex = (x + 0.5 - 7.5) / 6.5, ey = (y + 0.5 - 15) / 7.5;
      return y >= 7 && y <= 22 && ex * ex + ey * ey <= 1;
    };
    for (let y = 0; y < FA; y++) {
      for (let x = 0; x < FL; x++) {
        if (!dentro(x, y)) continue;
        const bordo = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
        g.fillStyle = bordo ? C.bordo : y < 3 ? C.vetro : this.sorsi <= 0 ? C.vuoto : x === 4 ? C.luce : C.liquido;
        g.fillRect(x0 + x, y0 + y, 1, 1);
      }
    }
    this.pulsante.classList.toggle('pronta', this.sorsi > 0);
  }

  private tasto = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyF') return;
    e.preventDefault();
    if (!e.repeat) this.bevi();
  };
}
