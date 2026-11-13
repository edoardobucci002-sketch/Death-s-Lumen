/*
 * Porte del gioco a stanze (passo 6 della fetta, segnaposto dal codice): un'apertura nel muro, in alto, a sinistra o a
 * destra, con sopra il simbolo della ricompensa (il simbolo dello stato dell'affinità, o un rombo dorato per il dono).
 * Chiusa ha le sbarre; aperta (stanza ripulita e carta scelta) ha la cornice accesa e ci si entra camminandoci contro.
 * In basso c'è sempre la porta da cui si è entrati, chiusa. Numeri e colori in PORTE (src/data/stanze.ts).
 */
import Phaser from 'phaser';
import { PORTE, STANZA } from '../data/stanze';
import { INFO_AFFINITA } from '../data/spiegazioni';
import type { IdAffinita } from '../data/stati';
import { areaCamminabile } from './stanza';
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
    for (let k = 0; k < 3; k++) this.simboli.push(scena.add.image(0, 0, SIMBOLO_DONO).setDepth(PROFONDITA.anime + 0.5).setScale(PORTE.simbolo).setVisible(false));
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
      const r = ricompense[k], chiave = r === 'dono' ? SIMBOLO_DONO : INFO_AFFINITA[r].simbolo;
      const p = this.centroSimbolo(muri[k]);
      s.setTexture(this.scena.textures.exists(chiave) ? chiave : SIMBOLO_DONO).setPosition(p.x, p.y).setVisible(true);
    }
    this.disegna();
  }

  apri(): void {
    this.aperte = true;
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
}
