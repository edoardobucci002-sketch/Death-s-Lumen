/*
 * Porte del gioco a stanze (passo 6 della fetta, segnaposto dal codice): un'apertura nel muro, in alto, a sinistra o a
 * destra, con sopra il simbolo della ricompensa: il medaglione disegnato per le porte (Porta_Luce … Porta_Dono, dal 14/11),
 * o se manca il simbolo dello stato dell'affinità o un rombo dorato per il dono.
 * Chiusa ha le sbarre; aperta (stanza ripulita e carta scelta) ha la cornice accesa e ci si entra camminandoci contro.
 * In basso c'è sempre la porta da cui si è entrati, chiusa. Numeri e colori in PORTE (src/data/stanze.ts).
 * Dal 16/11 le porte della cripta sono cancelli di ferro disegnati (Cripta_Porte): chiusa il cancello, aperta il cancello
 * sollevato con la luce in fondo. Si vedono chiuse già durante il combattimento (il percorso le decide all'ingresso), senza
 * medaglione; il medaglione compare quando si aprono. Il pezzo intero sta sotto il buio come i muri; l'arco con il cancello
 * (CRIPTA.vani) si disegna una seconda volta sopra il buio, così le porte si vedono anche lontane. La porta a destra è una
 * copia specchiata composta qui. Se i file mancano (o il LAB chiede la stanza dal codice), resta il vano del codice.
 * Medaglioni (16/11, richiesta di Edoardo): il medaglione vuoto (Porta_Vuota) con dentro il simbolo dello stato
 * dell'affinità (Simbolo_Abbagliato …), a grandezza vera; il dono tiene il suo medaglione (Porta_Dono).
 */
import Phaser from 'phaser';
import { CRIPTA, PORTE, STANZA } from '../data/stanze';
import { INFO_AFFINITA } from '../data/spiegazioni';
import type { IdAffinita } from '../data/stati';
import { areaCamminabile, criptaPronta, disegnaFotogramma } from './stanza';
import { PROFONDITA } from './effetti';

export type Muro = 'alto' | 'sinistra' | 'destra';
export type Ricompensa = IdAffinita | 'dono';
export const MURI: readonly Muro[] = ['alto', 'sinistra', 'destra'];

const colore = (h: string): number => parseInt(h.slice(1), 16);
const SIMBOLO_DONO = 'stanze-simbolo-dono';

export class Porte {
  muri: Muro[] = [];
  ricompense: Ricompensa[] = [];
  aperte = false;
  private readonly grafica: Phaser.GameObjects.Graphics;
  private readonly simboli: Phaser.GameObjects.Image[] = [];
  private readonly cancelli: Phaser.GameObjects.Image[] = []; // alto, sinistra, destra, basso: il pezzo intero, sotto il buio
  private readonly vani: Phaser.GameObjects.Image[] = []; // gli stessi, solo arco e cancello, sopra il buio
  private readonly accesi = [false, false, false, false]; // quali vani ci sono in questa stanza

  constructor(private readonly scena: Phaser.Scene) {
    this.grafica = scena.add.graphics().setDepth(PROFONDITA.anime); // sopra il buio: le porte si vedono anche lontane
    if (!scena.textures.exists(SIMBOLO_DONO)) {
      // il dono: un rombo dorato con il bordo scuro, 11 × 11
      const g = scena.add.graphics();
      for (let y = 0; y < 11; y++) {
        const l = 5 - Math.abs(5 - y);
        g.fillStyle(0x120c08).fillRect(5 - l - 1, y, 2 * l + 3, 1);
      }
      for (let y = 1; y < 10; y++) {
        const l = 4 - Math.abs(5 - y);
        if (l >= 0) g.fillStyle(colore(PORTE.colori.dono)).fillRect(5 - l, y, 2 * l + 1, 1);
      }
      g.generateTexture(SIMBOLO_DONO, 11, 11);
      g.destroy();
    }
    // i cancelli disegnati: il pezzo intero sopra muri e pavimento (sotto personaggio e buio), l'arco anche sopra il buio
    for (let k = 0; k < 4; k++) {
      this.cancelli.push(scena.add.image(0, 0, '__MISSING').setOrigin(0).setDepth(PROFONDITA.terreno + 0.7).setVisible(false));
      this.vani.push(scena.add.image(0, 0, '__MISSING').setOrigin(0).setDepth(PROFONDITA.buio + 0.5).setVisible(false));
    }
    this.preparaMedaglioni();
    for (let k = 0; k < 3; k++) this.simboli.push(scena.add.image(0, 0, SIMBOLO_DONO).setDepth(PROFONDITA.anime + 0.5).setScale(PORTE.simbolo).setVisible(false));
  }

  /**
   * Ogni fotogramma: l'arco sopra il buio si vede solo quando il personaggio (piedi in px, py) è lontano dalla porta; da
   * vicino la porta è già nella luce della lanterna, e l'arco sopra il buio coprirebbe il personaggio.
   */
  luce(px: number, py: number): void {
    const d2 = PORTE.vicino * PORTE.vicino;
    for (let k = 0; k < this.vani.length; k++) {
      if (!this.accesi[k]) continue;
      const v = this.vani[k], cx = v.x + v.width / 2, cy = v.y + v.height / 2;
      v.setVisible((cx - px) ** 2 + (cy - py) ** 2 > d2);
    }
  }

  /** Le porte della stanza durante il combattimento: chiuse, senza medaglione. */
  chiudi(muri: Muro[]): void {
    this.muri = muri;
    this.ricompense = [];
    this.aperte = false;
    for (const s of this.simboli) s.setVisible(false);
    this.disegna();
  }

  /** Le porte della stanza: muri e ricompense (stesso ordine); chiuse finché non si chiama apri(). */
  imposta(muri: Muro[], ricompense: Ricompensa[]): void {
    this.muri = muri;
    this.ricompense = ricompense;
    this.aperte = false;
    for (let k = 0; k < this.simboli.length; k++) {
      const s = this.simboli[k];
      if (k >= muri.length) {
        s.setVisible(false);
        continue;
      }
      const r = ricompense[k], p = this.centroSimbolo(muri[k]);
      // il medaglione vuoto con il simbolo dello stato (16/11), o il medaglione disegnato per le porte (EFFETTI/Porta_<Nome>,
      // 14/11) a grandezza vera; se mancano tutti e due, il simbolo dello stato ingrandito
      const composto = r === 'dono' ? '' : chiaveMedaglione(r);
      const medaglione = `Porta_${r === 'dono' ? 'Dono' : INFO_AFFINITA[r].nome}`;
      if (composto && this.scena.textures.exists(composto)) s.setTexture(composto).setScale(1);
      else if (this.scena.textures.exists(medaglione)) s.setTexture(medaglione).setScale(1);
      else {
        const chiave = r === 'dono' ? SIMBOLO_DONO : INFO_AFFINITA[r].simbolo;
        s.setTexture(this.scena.textures.exists(chiave) ? chiave : SIMBOLO_DONO).setScale(PORTE.simbolo);
      }
      s.setPosition(p.x, p.y).setVisible(true);
    }
    this.disegna();
  }

  apri(): void {
    this.aperte = true;
    this.disegna();
  }

  /** Ridisegna le porte (il LAB ha cambiato l'arte della stanza). */
  ridisegna(): void {
    this.disegna();
  }

  /** Nessuna porta (la fine della fetta). */
  togli(): void {
    this.imposta([], []);
  }

  /** La porta contro cui spinge il personaggio con i piedi in (x, y), se è aperta: il suo indice, se no -1. */
  attraversata(x: number, y: number): number {
    if (!this.aperte) return -1;
    const a = areaCamminabile(), m = PORTE.larghezza / 2 - 8;
    for (let k = 0; k < this.muri.length; k++) {
      const muro = this.muri[k];
      if (muro === 'alto' && y <= a.y0 + 0.5 && Math.abs(x - STANZA.larghezza / 2) < m) return k;
      if (muro === 'sinistra' && x <= a.x0 + 0.5 && Math.abs(y - STANZA.altezza / 2) < m) return k;
      if (muro === 'destra' && x >= a.x1 - 0.5 && Math.abs(y - STANZA.altezza / 2) < m) return k;
    }
    return -1;
  }

  /** Dove il personaggio deve andare per attraversare la porta k (per il LAB e le prove). */
  davanti(k: number): { x: number; y: number } {
    const a = areaCamminabile(), muro = this.muri[k];
    if (muro === 'alto') return { x: STANZA.larghezza / 2, y: a.y0 };
    if (muro === 'sinistra') return { x: a.x0, y: STANZA.altezza / 2 };
    return { x: a.x1, y: STANZA.altezza / 2 };
  }

  private centroSimbolo(muro: Muro): { x: number; y: number } {
    const L = PORTE.larghezza, S = STANZA;
    if (muro === 'alto') return { x: S.larghezza / 2, y: -S.muroAlto + 18 };
    if (muro === 'sinistra') return { x: -S.muroLati / 2, y: S.altezza / 2 - L / 2 - 14 };
    return { x: S.larghezza + S.muroLati / 2, y: S.altezza / 2 - L / 2 - 14 };
  }

  /** Il vano di ogni porta (e quella in basso, sempre chiusa): scuro, con le sbarre o con la cornice accesa. */
  private disegna(): void {
    const g = this.grafica.clear(), S = STANZA, L = PORTE.larghezza, c = PORTE.colori;
    for (const i of this.cancelli) i.setVisible(false);
    for (const i of this.vani) i.setVisible(false);
    this.accesi.fill(false);
    if (criptaPronta(this.scena)) {
      const F = CRIPTA.fotogrammiPorte;
      // x, y: l'angolo in alto a sinistra; -1 = centrata sulla porta (in orizzontale per alto e basso, in verticale per i lati)
      const metti = (k: number, fotogramma: number, x: number, y: number, vano: readonly number[], specchio = false): void => {
        const [pieno, sopra] = this.pezzoPorta(fotogramma, vano, specchio);
        const i = this.cancelli[k].setTexture(pieno).setVisible(true);
        const px = x === -1 ? S.larghezza / 2 - Math.floor(i.width / 2) : x, py = y === -1 ? S.altezza / 2 - Math.floor(i.height / 2) : y;
        i.setPosition(px, py);
        this.vani[k].setTexture(sopra).setPosition(px, py).setVisible(true);
        this.accesi[k] = true;
      };
      const V = CRIPTA.vani;
      metti(3, F.bassoChiusa, -1, S.altezza, V.basso);
      for (const muro of this.muri) {
        if (muro === 'alto') metti(0, this.aperte ? F.altoAperta : F.altoChiusa, -1, -S.muroAlto, V.alto);
        else if (muro === 'sinistra') metti(1, this.aperte ? F.latoAperta : F.latoChiusa, -S.muroLati, -1, V.lato);
        else metti(2, this.aperte ? F.latoAperta : F.latoChiusa, S.larghezza, -1, V.lato, true);
      }
      return;
    }
    const vano = (x: number, y: number, w: number, h: number, aperta: boolean, verticale: boolean): void => {
      g.fillStyle(colore(c.cornice)).fillRect(x - 2, y - 2, w + 4, h + 4);
      g.fillStyle(colore(c.vano)).fillRect(x, y, w, h);
      if (aperta) {
        g.lineStyle(2, colore(c.aperta), 1).strokeRect(x - 1, y - 1, w + 2, h + 2);
        return;
      }
      g.fillStyle(colore(c.sbarre));
      if (verticale) for (let bx = x + 6; bx < x + w - 2; bx += 10) g.fillRect(bx, y, 3, h);
      else for (let by = y + 6; by < y + h - 2; by += 10) g.fillRect(x, by, w, 3);
    };
    // la porta da cui si entra, in basso: sempre chiusa
    vano(S.larghezza / 2 - L / 2, S.altezza, L, S.muroBasso, false, true);
    for (const muro of this.muri) {
      if (muro === 'alto') vano(S.larghezza / 2 - L / 2, -56, L, 56, this.aperte, true);
      else if (muro === 'sinistra') vano(-S.muroLati, S.altezza / 2 - L / 2, S.muroLati, L, this.aperte, false);
      else vano(S.larghezza, S.altezza / 2 - L / 2, S.muroLati, L, this.aperte, false);
    }
  }

  /**
   * Le due texture di un pezzo di porta: intero, e solo il vano (arco e cancello: il rettangolo «vano», misurato sul pezzo
   * di sinistra) per sopra il buio. Specchiate se serve (la porta a destra). Si compongono una volta sola.
   */
  private pezzoPorta(fotogramma: number, vano: readonly number[], specchio: boolean): [string, string] {
    const chiave = `stanze-porta-${fotogramma}${specchio ? '-specchio' : ''}`, tex = this.scena.textures;
    if (!tex.exists(chiave)) {
      const f = tex.getFrame(CRIPTA.porte, String(fotogramma)), w = f.cutWidth, h = f.cutHeight;
      const [vx, vy, vl, va] = vano, x0 = specchio ? w - vx - vl : vx;
      for (const [k, solo] of [[chiave, false], [chiave + '-vano', true]] as const) {
        const t = tex.createCanvas(k, w, h)!, g = t.getContext();
        disegnaFotogramma(g, this.scena, CRIPTA.porte, fotogramma, 0, 0, specchio);
        if (solo) {
          g.clearRect(0, 0, w, vy);
          g.clearRect(0, vy + va, w, h);
          g.clearRect(0, 0, x0, h);
          g.clearRect(x0 + vl, 0, w, h);
        }
        t.refresh();
      }
    }
    return [chiave, chiave + '-vano'];
  }

  /** I medaglioni delle affinità: il medaglione vuoto con il simbolo dello stato al centro (se ci sono i disegni). */
  private preparaMedaglioni(): void {
    const tex = this.scena.textures, M = PORTE.medaglione;
    if (!tex.exists(M.vuoto)) return;
    for (const aff of Object.keys(INFO_AFFINITA) as IdAffinita[]) {
      const chiave = chiaveMedaglione(aff), simbolo = INFO_AFFINITA[aff].simbolo;
      if (tex.exists(chiave) || !tex.exists(simbolo)) continue;
      const f = tex.getFrame(M.vuoto);
      const t = tex.createCanvas(chiave, f.realWidth, f.realHeight)!, g = t.getContext();
      disegnaFotogramma(g, this.scena, M.vuoto, 0, 0, 0);
      disegnaFotogramma(g, this.scena, simbolo, 0, M.simbolo.x, M.simbolo.y);
      t.refresh();
    }
  }
}

const chiaveMedaglione = (aff: IdAffinita): string => `stanze-medaglione-${aff}`;
