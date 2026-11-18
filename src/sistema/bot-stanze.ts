/*
 * Bot del gioco a stanze: gioca al posto del giocatore con ?stanze&bot (npm run sim-stanze) o dal LAB (Stanze → «Fai
 * giocare il bot», alla velocità normale, per guardarlo). Serve a provare tutti i numeri (intervalli del danno, salute dei
 * nemici, ondate) con tante partite, e a bilanciarli.
 * A ogni passo guarda dove sarebbe tra BOT_STANZE.avanti secondi camminando in 16 direzioni (o restando fermo) e sceglie
 * il punto più sicuro: fuori dallo spicchio del Ricaduto e dalla linea del Cantore (che vede solo dopo il suo tempo di
 * reazione, come una persona), lontano da grumi, pozze di cera e muri, alla distanza giusta per colpire con la Lanterna.
 * Il Campanaro (17/11): esce dal disco del Rintocco, dall'anello e dalla linea della Carica, sempre dopo il tempo di reazione.
 * Colpisce quando un nemico è a portata, usa il Cerchio di luce quando è circondato o ferito, sceglie carte e porte con
 * le preferenze di BOT_STANZE (o a caso nel modo «esplora»). Non usa il caso della partita: a parità di seme gioca uguale.
 * Mappa del Mondo (17/11): esplora tutte le stanze prima del Boss; tra le porte verso stanze nuove sceglie con le
 * preferenze, e quando intorno è tutto ripulito torna per la strada più corta verso la stanza nuova più vicina.
 * Niente allocazioni nel ciclo di gioco.
 */
import Phaser from 'phaser';
import { BOT_STANZE as B } from '../data/bot';
import { NEMICI_STANZA } from '../data/stanze';
import { AFFINITA_ARMI } from '../data/stati';
import { ID_CAMPANARO, ID_RICADUTO } from './orda';
import { CAMPANARO } from '../data/campanaro';
import { MOSSA_CAPO } from './campanaro';
import { STATO, type NemiciStanza } from './nemici-stanza';
import { areaCamminabile } from './stanza';
import { Caso } from './caso';
import type { Dono } from './doni';
import type { Arma } from '../data/armi';
import type { Medaglione } from './porte';
import { piuVicina, primoPasso, type Mappa } from './mappa';

const R = NEMICI_STANZA.ricaduto, C = NEMICI_STANZA.cantore;
const N = B.direzioni;
const COS = Float32Array.from({ length: N + 1 }, (_, k) => (k === N ? 0 : Math.cos((k / N) * Math.PI * 2)));
const SIN = Float32Array.from({ length: N + 1 }, (_, k) => (k === N ? 0 : Math.sin((k / N) * Math.PI * 2)));
const MEZZO_SPICCHIO = Phaser.Math.DegToRad(R.graffio.ampiezza / 2);

export class BotStanze {
  dx = 0;
  dy = 0;
  /** Vuole colpire adesso (la scena chiede il colpo automatico verso il nemico più vicino). */
  colpisce = false;
  /** Vuole usare il Cerchio di luce adesso. */
  abilita = false;
  private esplora: Caso | null = null;

  esplorando(seme: number): void {
    this.esplora = new Caso(seme * B.semeEsplora);
  }

  /**
   * Un passo. (x, y): i piedi; velocita: px/s; raggio: della Lanterna; corpo: del personaggio; salute: parte rimasta (0–1);
   * cerchioPronto: il Cerchio di luce è carico. Scrive dx, dy, colpisce e abilita.
   */
  guida(x: number, y: number, n: NemiciStanza, velocita: number, raggio: number, corpo: number, salute: number, cerchioPronto: boolean, raggioCerchio: number): void {
    const o = n.orda, a = areaCamminabile(), passo = velocita * B.avanti;
    // il nemico in piedi più vicino: il bersaglio della Lanterna
    let vicino = -1, dVicino = Infinity, attorno = 0;
    for (let i = 0; i < o.numero; i++) {
      if (n.stato[i] === STATO.aTerra) continue;
      const d = Math.hypot(o.x[i] - x, o.y[i] - y);
      if (d < dVicino) {
        dVicino = d;
        vicino = i;
      }
      if (d <= raggioCerchio) attorno++;
    }
    let migliore: number = N, punteggio = Infinity; // N = restare fermi
    for (let k = 0; k <= N; k++) {
      const qx = Phaser.Math.Clamp(x + COS[k] * passo, a.x0, a.x1), qy = Phaser.Math.Clamp(y + SIN[k] * passo, a.y0, a.y1);
      let s = this.pericolo(qx, qy, n, corpo);
      // i muri: in un angolo non si scappa
      const muro = Math.min(qx - a.x0, a.x1 - qx, qy - a.y0, a.y1 - qy);
      if (muro < B.muro) s += (B.muro - muro) * B.pesi.muro;
      // alla distanza giusta dal bersaglio, per colpirlo senza farsi graffiare
      if (vicino >= 0) s += Math.abs(Math.hypot(o.x[vicino] - qx, o.y[vicino] - qy) - raggio * B.distanza) * B.pesi.distanza;
      else s += Math.hypot((a.x0 + a.x1) / 2 - qx, (a.y0 + a.y1) / 2 - qy) * B.pesi.distanza * 0.2; // niente nemici: verso il centro
      // preferisce non cambiare direzione di colpo
      if (k < N) s -= (COS[k] * this.dx + SIN[k] * this.dy) * B.pesi.inerzia * passo;
      if (s < punteggio) {
        punteggio = s;
        migliore = k;
      }
    }
    this.dx = COS[migliore];
    this.dy = SIN[migliore];
    this.colpisce = vicino >= 0 && dVicino <= raggio;
    this.abilita = cerchioPronto && (attorno >= B.nemiciPerAbilita || (salute < B.abilitaSotto && attorno > 0));
  }

  /** Quanto è pericoloso il punto (x, y) adesso (più alto = peggio). */
  private pericolo(x: number, y: number, n: NemiciStanza, corpo: number): number {
    const o = n.orda, m = B.margine;
    let s = 0;
    for (let i = 0; i < o.numero; i++) {
      const st = n.stato[i];
      if (st === STATO.aTerra) continue;
      const ex = x - o.x[i], ey = y - o.y[i], d = Math.hypot(ex, ey) || 0.001;
      const ricaduto = o.tipo[i] === ID_RICADUTO;
      if (o.tipo[i] === ID_CAMPANARO) {
        s += this.pericoloCapo(x, y, d, n, i, corpo);
        continue;
      }
      if (st === STATO.avviso) {
        const visto = (ricaduto ? R.avviso : C.avviso) - n.tempo[i] >= B.reazione;
        if (!visto) continue;
        if (ricaduto) {
          // dentro lo spicchio del graffio (con un margine)?
          const r = R.graffio.raggio + corpo + m;
          if (d < r) {
            const coseno = (ex * n.dirX[i] + ey * n.dirY[i]) / d;
            if (d <= corpo + m || Math.acos(Phaser.Math.Clamp(coseno, -1, 1)) <= MEZZO_SPICCHIO + Math.asin(Math.min(1, (corpo + m) / d))) s += B.pesi.graffio;
          }
        } else {
          // sulla linea del canto: davanti al Cantore e vicino alla retta
          const lungo = ex * n.dirX[i] + ey * n.dirY[i], lato = Math.abs(ex * n.dirY[i] - ey * n.dirX[i]);
          if (lungo > 0 && lato < C.grumo.raggio + corpo + m * 2) s += B.pesi.linea;
        }
      } else if (ricaduto && d < R.portata + corpo + m) {
        s += (R.portata + corpo + m - d) * B.pesi.vicino; // troppo vicino a un Ricaduto: sta per graffiare
      }
    }
    // i grumi: dove saranno tra poco (in linea retta)
    for (let k = 0; k < n.grumi; k++) {
      const gx = n.gX[k] + n.gVX[k] * B.avanti, gy = n.gY[k] + n.gVY[k] * B.avanti;
      const r = C.grumo.raggio + corpo + m * 2;
      if ((gx - x) ** 2 + (gy - y) ** 2 < r * r || (n.gX[k] - x) ** 2 + (n.gY[k] - y) ** 2 < r * r) s += B.pesi.grumo;
    }
    // le pozze di cera: ellissi a terra larghe il doppio di quanto sono alte
    for (let k = 0; k < n.pozze; k++) {
      const rp = n.raggioPozza(k) + corpo + m, ex = (x - n.pX[k]) / rp, ey = (y - n.pY[k]) / (rp / 2);
      if (ex * ex + ey * ey < 1) s += B.pesi.pozza;
    }
    return s;
  }

  /** Il pericolo del Campanaro i nel punto (x, y), a distanza d da lui. */
  private pericoloCapo(x: number, y: number, d: number, n: NemiciStanza, i: number, corpo: number): number {
    const c = n.capo, m = B.margine, K = CAMPANARO;
    let s = d < K.raggio + corpo + m ? (K.raggio + corpo + m - d) * B.pesi.vicino : 0; // non addosso a lui
    if (c.mossa === MOSSA_CAPO.carica) return s + (c.sullaLinea(n.orda.x[i], n.orda.y[i], x, y, corpo + m) ? B.pesi.graffio : 0);
    if (c.durata - c.tempo < B.reazione) return s; // l'avviso non l'ha ancora visto
    if (c.mossa === MOSSA_CAPO.rintocco && d < K.rintocco.raggio + corpo + m) s += B.pesi.graffio;
    else if (c.mossa === MOSSA_CAPO.anello && d > K.rintocco.raggio - corpo - m && d < K.anello.raggio + corpo + m) s += B.pesi.graffio;
    else if (c.mossa === MOSSA_CAPO.mira && c.sullaLinea(n.orda.x[i], n.orda.y[i], x, y, corpo + m)) s += B.pesi.graffio;
    return s;
  }

  /** Sceglie una delle carte: con le preferenze, o a caso nel modo «esplora». */
  scegliCarta(carte: Dono[], lanterna: Arma['id']): Dono {
    if (this.esplora) return carte[this.esplora.intero(0, carte.length - 1)];
    let migliore = carte[0], valore = -Infinity;
    for (const d of carte) {
      const v = d.tipo === 'arma'
        ? d.arma.id === lanterna ? B.carte.lanterna : d.livello === 1 ? B.carte.ecoNuovo : B.carte.livelloEco
        : d.tipo === 'passivo' ? (d.livello === 1 ? B.carte.donoNuovo : B.carte.livelloDono) : 0;
      if (v > valore) {
        valore = v;
        migliore = d;
      }
    }
    return migliore;
  }

  /**
   * Sceglie una porta tra quelle aperte della stanza «qui» (verso[k]: dove porta la porta k; ricompense[k]: il suo
   * medaglione). Prima le stanze nuove accanto (con le preferenze: gli Echi d'inizio, le affinità degli Echi che ha, il
   * dono; a caso nel modo «esplora»); se non ce ne sono, il primo passo verso la stanza nuova più vicina. Il Campanaro lo
   * lascia per ultimo, come farebbe un giocatore (prima la build più forte); finito tutto, il Boss (la sua porta si apre solo
   * con la chiave del Campanaro, 18/11).
   */
  scegliPorta(m: Mappa, qui: number, verso: readonly number[], ricompense: readonly Medaglione[], echi: readonly Arma[]): number {
    const resta = m.stanze.some((s) => !s.ripulita && s.tipo === 'combattimento');
    // stanze nuove: da combattere, il tesoro (18/11), e il Campanaro quando non resta altro; la Sosta la usa passando
    const nuova = (i: number): boolean => !m.stanze[i].ripulita && (m.stanze[i].tipo === 'combattimento' || m.stanze[i].tipo === 'tesoro' || (!resta && m.stanze[i].tipo === 'campanaro'));
    let migliore = -1, valore = -Infinity;
    const vicine = verso.filter(nuova).length;
    let scelta = this.esplora && vicine ? this.esplora.intero(0, vicine - 1) : -1;
    verso.forEach((v, k) => {
      if (!nuova(v)) return;
      if (scelta >= 0) {
        if (scelta-- === 0) migliore = k;
        return;
      }
      const r = ricompense[k];
      const val = r === 'tesoro' ? B.porte.tesoro : r === 'echi' ? B.porte.echi : r === 'dono' ? B.porte.dono : echi.some((a) => AFFINITA_ARMI[a.id] === r) ? B.porte.affinitaPosseduta : B.porte.altra;
      if (val > valore) {
        valore = val;
        migliore = k;
      }
    });
    if (migliore >= 0) return migliore;
    // niente di nuovo qui accanto: verso la stanza nuova più vicina, senza passare dall'arena del Campanaro finché c'è
    // altro da esplorare (se una stanza si raggiunge solo da lì, si affronta lui); finito tutto, il Boss, con la chiave
    const libera = (i: number): boolean => i !== m.campanaro || m.stanze[i].ripulita;
    let meta = piuVicina(m, qui, (_s, i) => nuova(i), libera), passa = libera;
    if (meta < 0 && resta) {
      meta = m.campanaro;
      passa = () => true;
    }
    if (meta < 0 && m.stanze[m.campanaro]?.ripulita !== false) meta = m.boss; // il Boss solo con la chiave del Campanaro
    if (meta < 0) return -1;
    const lato = primoPasso(m, qui, meta, passa);
    return lato < 0 ? -1 : verso.indexOf(m.stanze[qui].vicine[lato]);
  }
}
