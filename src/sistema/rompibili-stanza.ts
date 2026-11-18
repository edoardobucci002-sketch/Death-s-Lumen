/*
 * Rompibili del gioco a stanze (decisioni di Edoardo del 16/11): urne, giare e lanterne del survivor, da 1 a 2 per stanza
 * lungo i muri (ROMPIBILI_STANZE). Fanno da ostacolo e si rompono solo colpendoli (Lanterna a mano, Echi, Cerchio di luce).
 * Dentro c'è quello di sempre: la giara lascia gocce di Cera, che a fine fetta (o alla caduta) vanno alla Cappella; l'urna
 * a volte un frammento di vetro, e tre frammenti accendono il mosaico e il Bagliore (con le regole del survivor, ma da subito:
 * al massimo 3 per Veglia); la lanterna intera fa luce, rotta lascia una chiazza d'olio che rallenta e
 * che le armi di fuoco accendono. Il caso dei rompibili è separato da quello di nemici e carte.
 */
import type Phaser from 'phaser';
import { FRAMMENTI, ROMPIBILI, ROMPIBILI_STANZE } from '../data/rompibili';
import { BAGLIORE } from '../data/sopravvivenza';
import { CERA } from '../data/meta';
import { BASE } from '../data/personaggi';
import { COLPI } from '../data/armi';
import type { Arsenale } from './armi';
import { Caso } from './caso';
import { Chiazze } from './chiazze';
import type { Effetti } from './effetti';
import { Mosaico } from './mosaico';
import { CERA_GOCCIA, CHIAVE_OGGETTO, FRAMMENTO, Oggetti } from './oggetti';
import type { Orda } from './orda';
import { Rompibili } from './rompibili';
import { carica, salva } from './salvataggio';
import { MISURA, areaCamminabile } from './stanza';
import { suona } from './audio';
import { vibra } from './mobile';

const PESI = ROMPIBILI.tipi.map((t) => t.probabilita);
const TOTALE_PESI = PESI.reduce((a, b) => a + b, 0);
const MAX_PER_STANZA = 8;

export class RompibiliStanza {
  readonly rompibili: Rompibili;
  readonly oggetti: Oggetti;
  readonly chiazze: Chiazze;
  private readonly mosaico: Mosaico;
  private readonly caso: Caso;
  private readonly mosaiciAperti: boolean;
  cera = 0; // gocce raccolte in questa Veglia
  chiavi = 0; // chiavi raccolte e non ancora passate al percorso (la scena le prende a ogni passo)
  forzaChiave = false; // LAB: il prossimo vaso (urna o giara) lascia sempre una chiave
  frammenti = 0; // pezzi del mosaico accesi
  frammentiCaduti = 0; // quanti ne sono usciti dalle urne in questa Veglia
  bagliore = 0; // secondi di Bagliore rimasti
  forzaFrammento = false; // LAB: la prossima urna lascia sempre un frammento
  private ceraPortata = false;
  spintoX = 0;
  spintoY = 0;
  private readonly px = new Float32Array(MAX_PER_STANZA);
  private readonly py = new Float32Array(MAX_PER_STANZA);
  private readonly punto = [0];
  private readonly puntoY = [0];
  private messi = 0; // quanti ne ha messi la stanza in corso (gli indici da 0 a messi - 1)

  constructor(scena: Phaser.Scene, private readonly orda: Orda, arsenale: Arsenale, interfaccia: HTMLElement, seme: number,
    private readonly effetti: Effetti, private readonly cambiaBagliore: () => void) {
    this.rompibili = new Rompibili(scena, seme, this.rotto);
    this.rompibili.settori = false;
    this.oggetti = new Oggetti(scena);
    this.chiazze = new Chiazze(scena, orda, arsenale);
    arsenale.rompibili = this.rompibili;
    arsenale.chiazze = this.chiazze;
    this.mosaico = new Mosaico(interfaccia);
    this.caso = new Caso((seme ^ 0x5bd1e995) >>> 0);
    this.mosaiciAperti = carica().vittorie >= ROMPIBILI_STANZE.vittorie;
  }

  /**
   * Stanza nuova: via oggetti, gocce e chiazze, e alcuni rompibili lungo i muri, lontano dalle porte. Con lo stesso seme
   * escono sempre gli stessi; «rotti» (un bit per ognuno, come lo dà rotti()) toglie quelli già rotti in una visita
   * precedente. quanti: tra quanti e quanti (ROMPIBILI_STANZE.quanti, .arena nell'arena doppia), null per nessuno (ingresso,
   * tesoro, Sosta, Boss).
   */
  nuovaStanza(seme: number, rotti = 0, quanti: { min: number; max: number } | null = ROMPIBILI_STANZE.quanti): void {
    this.rompibili.svuota();
    this.oggetti.svuota();
    this.chiazze.svuota();
    const R = ROMPIBILI_STANZE, S = MISURA, a = areaCamminabile(), caso = new Caso(seme);
    const porte = [S.larghezza / 2, a.y0, a.x0, S.altezza / 2, a.x1, S.altezza / 2, S.larghezza / 2, a.y1];
    const n = quanti ? Math.min(MAX_PER_STANZA, caso.intero(quanti.min, quanti.max)) : 0;
    let messi = 0;
    for (let t = 0; t < R.tentativi && messi < n; t++) {
      const muro = caso.intero(0, 3), d = caso.intero(R.dalMuro.min, R.dalMuro.max);
      const lungo = (da: number, a1: number): number => caso.intero(Math.round(da + R.dalMuro.min), Math.round(a1 - R.dalMuro.min));
      const x = muro === 1 ? a.x0 + d : muro === 2 ? a.x1 - d : lungo(a.x0, a.x1);
      const y = muro === 0 ? a.y0 + d : muro === 3 ? a.y1 - d : lungo(a.y0, a.y1);
      let libero = true;
      for (let k = 0; k < porte.length && libero; k += 2) libero = Math.hypot(x - porte[k], y - porte[k + 1]) >= R.porte;
      for (let k = 0; k < messi && libero; k++) libero = Math.hypot(x - this.px[k], y - this.py[k]) >= R.tra;
      if (!libero) continue;
      let estratto = caso.numero() * TOTALE_PESI, tipo = 0;
      while (tipo < PESI.length - 1 && (estratto -= PESI[tipo]) >= 0) tipo++;
      this.px[messi] = x;
      this.py[messi] = y;
      messi++;
      this.rompibili.piazza(tipo, x, y);
    }
    // dopo lo svuota ogni oggetto prende il primo posto libero: il k-esimo messo sta all'indice k
    this.messi = messi;
    for (let k = 0; k < messi; k++) if (rotti & (1 << k)) this.rompibili.togli(k);
  }

  /** C'è un vaso della stanza (intero o rotto) a meno di d px da (x, y)? (la candela non ci si mette sopra) */
  vicinoAVaso(x: number, y: number, d: number): boolean {
    for (let k = 0; k < this.messi; k++) if (Math.hypot(x - this.px[k], y - this.py[k]) < d) return true;
    return false;
  }

  /** Quali rompibili della stanza in corso non sono più interi: un bit per ognuno (da ridare a nuovaStanza tornando qui). */
  rotti(): number {
    let r = 0;
    for (let k = 0; k < this.messi; k++) if (!this.rompibili.intero(k)) r |= 1 << k;
    return r;
  }

  /** Passo di logica, dopo le armi (la griglia dei nemici è aggiornata): olio, raccolta, Bagliore. (x, y): i piedi del personaggio. */
  aggiorna(dt: number, x: number, y: number, mezzaL: number, mezzaA: number, raggioCorpo: number): void {
    this.rompibili.aggiorna(x, y, mezzaL, mezzaA);
    this.chiazze.aggiorna(dt);
    this.oggetti.aggiorna(dt, x, y - COLPI.corpo, BASE.raccolta * ROMPIBILI_STANZE.raccolta, this.raccogli);
    if (this.bagliore > 0) {
      this.bruciaAlTocco(x, y, raggioCorpo);
      if ((this.bagliore -= dt) <= 0) {
        this.bagliore = 0;
        this.cambiaBagliore();
      }
    }
  }

  /** Il personaggio (o un nemico) non entra negli oggetti interi: xs[k], ys[k] escono dalla parte più vicina. */
  spingi(xs: Float32Array | number[], ys: Float32Array | number[], k: number, raggio: number): void {
    this.rompibili.spingi(xs, ys, k, raggio, ROMPIBILI_STANZE.ingombro);
  }

  /** Il personaggio, che non ha un vettore: la posizione corretta finisce in spintoX, spintoY (niente oggetti nuovi nel ciclo). */
  spingiPersonaggio(x: number, y: number, raggio: number): void {
    this.punto[0] = x;
    this.puntoY[0] = y;
    this.rompibili.spingi(this.punto, this.puntoY, 0, raggio, ROMPIBILI_STANZE.ingombro);
    this.spintoX = this.punto[0];
    this.spintoY = this.puntoY[0];
  }

  disegna(cam: Phaser.Cameras.Scene2D.Camera, fiamma: number, dt: number): void {
    this.rompibili.disegna(cam, fiamma);
    this.oggetti.disegna(cam, dt);
    this.chiazze.disegna();
  }

  /** La texture del buio con i fori delle lanterne intere e delle chiazze accese. */
  buio(base: string, fiamma: number, bx: number, by: number, w: number, h: number, cam: Phaser.Cameras.Scene2D.Camera): string {
    return this.rompibili.buio(base, fiamma, bx, by, w, h, cam, this.chiazze);
  }

  /** Frammento di vetro: accende un pezzo del mosaico; al terzo il mosaico intero si illumina e parte il Bagliore. */
  frammento(): void {
    const servono = FRAMMENTI.perReliquiario, n = ++this.frammenti;
    this.mosaico.mostra(n, servono);
    if (n < servono) {
      suona('cera');
      vibra('leggera');
      return;
    }
    this.frammenti = 0;
    this.iniziaBagliore();
  }

  iniziaBagliore(): void {
    this.bagliore = BAGLIORE.durata;
    this.cambiaBagliore();
    suona('alba');
    vibra('forte');
  }

  nascondiMosaico(): void {
    this.mosaico.nascondi();
  }

  distruggi(): void {
    this.mosaico.distruggi();
  }

  /**
   * La Cera della Veglia va alla Cappella, una volta sola (alla caduta o a fine fetta). Non nelle simulazioni e non con
   * l'immortale del LAB, come nel survivor. Restituisce quante gocce erano.
   */
  portaCera(daSalvare: boolean): number {
    if (this.ceraPortata) return this.cera;
    this.ceraPortata = true;
    if (daSalvare && this.cera > 0) {
      const s = carica();
      s.cera += this.cera;
      salva(s);
    }
    return this.cera;
  }

  /** Nel Bagliore chi tocca il personaggio brucia (nel gioco a stanze non ci sono élite né capi, per ora). */
  private bruciaAlTocco(x: number, y: number, raggioCorpo: number): void {
    const o = this.orda;
    for (let i = 0; i < o.numero; i++) {
      const r = o.raggio[i] + raggioCorpo, dx = o.x[i] - x, dy = o.y[i] - y;
      if (dx * dx + dy * dy < r * r && o.salute[i] > 0) o.salute[i] = 0;
    }
  }

  private raccogli = (tipo: number): void => {
    if (tipo === CERA_GOCCIA) {
      this.cera += CERA.goccia;
      suona('cera');
    } else if (tipo === FRAMMENTO) {
      this.frammento();
    } else if (tipo === CHIAVE_OGGETTO) {
      this.chiavi++;
      suona('vetro');
      vibra('leggera');
    }
  };

  /** Un oggetto rompibile lascia ciò che contiene (come nel survivor). */
  private rotto = (tipo: number, x: number, y: number): void => {
    const { gocce, frammenti, olio } = ROMPIBILI.tipi[tipo];
    for (let k = 0; k < gocce; k++) this.oggetti.aggiungi(CERA_GOCCIA, x + (k - (gocce - 1) / 2) * ROMPIBILI.dispersione, y);
    if (frammenti) {
      const fortuna = this.forzaFrammento || (this.mosaiciAperti && this.frammentiCaduti < FRAMMENTI.perNotte && this.caso.numero() < FRAMMENTI.probabilita);
      this.forzaFrammento = false;
      if (fortuna) this.lasciaFrammento(x, y);
    }
    if (olio) this.chiazze.aggiungi(x, y);
    // urne e giare (non le lanterne): a volte una chiave (18/11)
    else if (this.forzaChiave || this.caso.numero() < ROMPIBILI_STANZE.chiave) {
      this.forzaChiave = false;
      this.oggetti.aggiungi(CHIAVE_OGGETTO, x + ROMPIBILI.dispersione, y);
    }
    suona('colpo');
    vibra('leggera');
  };

  /** L'urna fortunata: esce un frammento, con un anello di luce, una scossa e il suono del vetro. */
  private lasciaFrammento(x: number, y: number): void {
    this.frammentiCaduti++;
    this.oggetti.aggiungi(FRAMMENTO, x, y);
    this.effetti.reazione(x, y - ROMPIBILI.centro, FRAMMENTI.anello, FRAMMENTI.coloreAnello, FRAMMENTI.bordoAnello, FRAMMENTI.durataAnello);
    this.effetti.scuoti(FRAMMENTI.scossa, FRAMMENTI.durataScossa);
    suona('vetro');
    vibra('media');
  }
}

