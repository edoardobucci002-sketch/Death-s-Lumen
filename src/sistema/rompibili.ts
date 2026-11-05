/*
 * Rompibili: urne, giare e lanterne sparse nel cimitero. Si rompono se il personaggio le tocca o se le colpisce
 * un'arma. La giara lascia Cera, l'urna un frammento di reliquia, la lanterna una chiazza d'olio.
 * Una lanterna intera apre un foro nel buio e scalda il terreno intorno; anche una chiazza accesa fa luce.
 * Il mondo è diviso in settori: da seme e settore si ricava sempre lo stesso oggetto, quindi non serve ricordare
 * la mappa ma solo i settori già rotti. Il generatore è a parte: non cambia nemici, carte e drop.
 */
import Phaser from 'phaser';
import { LUCE_LANTERNA, ROMPIBILI } from '../data/rompibili';
import { Caso } from './caso';
import type { Chiazze } from './chiazze';
import { PROFONDITA } from './effetti';
import { CHIAVI_ALONE_LUME, creaFori } from './luce';

const MAX = 40;
const LIBERO = 0, INTERO = 1, ROTTO = 2;
const LAB = -1; // messo dal Laboratorio: non appartiene a un settore
const CHIAVE_BUIO = 'buio-lumi';
const chiaveSettore = (cx: number, cy: number): number => (cx + 32768) * 65536 + (cy + 32768);

export class Rompibili {
  readonly capienza = MAX;
  readonly x = new Float32Array(MAX);
  readonly y = new Float32Array(MAX);
  private sprite: Phaser.GameObjects.Sprite[] = [];
  private alone: Phaser.GameObjects.Image[] = [];
  private tipo = new Uint8Array(MAX);
  private stato = new Uint8Array(MAX);
  private settore = new Float64Array(MAX);
  private rotti = new Set<number>();
  private cx = Infinity;
  private cy = Infinity;
  private fori: { chiavi: string[]; lato: number };
  private telaBuio: Phaser.Textures.DynamicTexture | null = null;
  private fuochi = 0; // fori aperti in questo disegno

  constructor(private scena: Phaser.Scene, private seme: number, private quandoRotto: (tipo: number, x: number, y: number) => void) {
    this.fori = creaFori(scena);
    for (let i = 0; i < MAX; i++) {
      this.sprite.push(scena.add.sprite(0, 0, ROMPIBILI.tipi[0].sprite).setOrigin(0.5, 1).setVisible(false));
      this.alone.push(scena.add.image(0, 0, CHIAVI_ALONE_LUME[1]).setDepth(PROFONDITA.terreno + 1).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
    }
    if (scena.textures.exists(CHIAVE_BUIO)) scena.textures.remove(CHIAVE_BUIO);
  }

  /** Passo di logica: accende i settori intorno al personaggio e rompe ciò che tocca. */
  aggiorna(x: number, y: number): void {
    const { settore, tocco } = ROMPIBILI;
    const cx = Math.floor(x / settore), cy = Math.floor(y / settore);
    if (cx !== this.cx || cy !== this.cy) this.cambiaSettore(cx, cy);
    this.rompiEntro(x, y, tocco);
  }

  intero(i: number): boolean {
    return this.stato[i] === INTERO;
  }

  /** Un'arma ha colpito in (x, y) con questo raggio: rompe ciò che tocca. */
  colpitoDa(x: number, y: number, raggio: number): void {
    const r = raggio + ROMPIBILI.raggio;
    for (let i = 0; i < MAX; i++) {
      if (this.stato[i] !== INTERO) continue;
      const dx = this.x[i] - x, dy = this.y[i] - ROMPIBILI.centro - y;
      if (dx * dx + dy * dy < r * r) this.rompi(i);
    }
  }

  /** Laboratorio: mette un oggetto lì dov'è chiesto. */
  piazza(tipo: number, x: number, y: number): void {
    this.occupa(tipo, x, y, LAB);
  }

  /** Laboratorio: rompe l'oggetto intero più vicino. */
  rompiVicino(x: number, y: number): void {
    let scelto = -1, migliore = Infinity;
    for (let i = 0; i < MAX; i++) {
      if (this.stato[i] !== INTERO) continue;
      const d = (this.x[i] - x) ** 2 + (this.y[i] - y) ** 2;
      if (d < migliore) { migliore = d; scelto = i; }
    }
    if (scelto >= 0) this.rompi(scelto);
  }

  disegna(cam: Phaser.Cameras.Scene2D.Camera, fiamma: number): void {
    for (let i = 0; i < MAX; i++) {
      if (this.stato[i] === ROTTO && !this.sprite[i].anims.isPlaying) this.libera(i);
      if (this.stato[i] === LIBERO) continue;
      this.sprite[i].setVisible(this.inVista(i, cam, 90));
      const lume = this.stato[i] === INTERO && ROMPIBILI.tipi[this.tipo[i]].luce > 0 && this.inVista(i, cam, this.fori.lato / 2);
      this.alone[i].setVisible(lume);
      if (lume) this.alone[i].setTexture(CHIAVI_ALONE_LUME[fiamma]).setPosition(this.x[i], this.y[i] - LUCE_LANTERNA.altezza);
    }
  }

  /** La texture del buio da usare: quella del personaggio, con i fori delle lanterne se ce n'è una in vista. */
  buio(base: string, fiamma: number, bx: number, by: number, w: number, h: number, cam: Phaser.Cameras.Scene2D.Camera, chiazze: Chiazze): string {
    const metà = this.fori.lato / 2;
    this.fuochi = 0;
    for (let i = 0; i < MAX; i++) {
      if (this.stato[i] === INTERO && ROMPIBILI.tipi[this.tipo[i]].luce && this.inVista(i, cam, metà)) this.foro(base, fiamma, this.x[i], this.y[i] - LUCE_LANTERNA.altezza, bx, by, w, h, cam);
    }
    for (let i = 0; i < chiazze.numero; i++) {
      const x = chiazze.x[i], y = chiazze.y[i];
      if (chiazze.fuoco[i] > 0 && x > cam.scrollX - metà && x < cam.scrollX + cam.width + metà && y > cam.scrollY - metà && y < cam.scrollY + cam.height + metà) this.foro(base, fiamma, x, y, bx, by, w, h, cam);
    }
    if (!this.fuochi) return base;
    this.telaBuio!.render();
    return CHIAVE_BUIO;
  }

  /** Apre un foro nel punto (x, y) del mondo; al primo foro della scena copia il buio del personaggio. */
  private foro(base: string, fiamma: number, x: number, y: number, bx: number, by: number, w: number, h: number, cam: Phaser.Cameras.Scene2D.Camera): void {
    const tela = this.tela(w, h);
    if (!this.fuochi++) {
      tela.clear();
      tela.stamp(base, undefined, 0, 0, { originX: 0, originY: 0 });
    }
    tela.erase(this.fori.chiavi[fiamma], Math.round(x - cam.scrollX - bx), Math.round(y - cam.scrollY - by)); // erase si posa dal centro
  }

  private tela(w: number, h: number): Phaser.Textures.DynamicTexture {
    if (!this.telaBuio) this.telaBuio = this.scena.textures.addDynamicTexture(CHIAVE_BUIO, w, h, false)!;
    else if (this.telaBuio.width !== w || this.telaBuio.height !== h) this.telaBuio.setSize(w, h);
    return this.telaBuio;
  }

  private inVista(i: number, cam: Phaser.Cameras.Scene2D.Camera, m: number): boolean {
    const x = this.x[i], y = this.y[i];
    return x > cam.scrollX - m && x < cam.scrollX + cam.width + m && y > cam.scrollY - m && y < cam.scrollY + cam.height + m;
  }

  private cambiaSettore(cx: number, cy: number): void {
    this.cx = cx;
    this.cy = cy;
    const { raggioSettori: r } = ROMPIBILI;
    for (let i = 0; i < MAX; i++) {
      if (this.stato[i] !== INTERO || this.settore[i] === LAB) continue;
      const k = this.settore[i], sy = (k % 65536) - 32768, sx = Math.floor(k / 65536) - 32768;
      if (Math.abs(sx - cx) > r || Math.abs(sy - cy) > r) this.libera(i);
    }
    for (let sy = cy - r; sy <= cy + r; sy++) {
      for (let sx = cx - r; sx <= cx + r; sx++) {
        const k = chiaveSettore(sx, sy);
        if (!this.rotti.has(k) && !this.settore.includes(k)) this.crea(sx, sy, k);
      }
    }
  }

  private crea(sx: number, sy: number, k: number): void {
    const { settore, bordo, partenza, tipi } = ROMPIBILI;
    const caso = new Caso((this.seme ^ Math.imul(sx, 73856093) ^ Math.imul(sy, 19349663)) >>> 0);
    // una sola estrazione per settore: oltre la somma delle probabilità il settore resta vuoto
    let estratto = caso.numero(), tipo = 0;
    while (tipo < tipi.length && estratto >= tipi[tipo].probabilita) estratto -= tipi[tipo++].probabilita;
    if (tipo >= tipi.length) return;
    const x = sx * settore + caso.intero(bordo, settore - bordo);
    const y = sy * settore + caso.intero(bordo, settore - bordo);
    if (Math.hypot(x, y) < partenza) return;
    this.occupa(tipo, x, y, k);
  }

  private occupa(tipo: number, x: number, y: number, k: number): void {
    const i = this.stato.indexOf(LIBERO);
    if (i < 0) return;
    const chiave = ROMPIBILI.tipi[tipo].sprite;
    this.stato[i] = INTERO;
    this.tipo[i] = tipo;
    this.x[i] = Math.round(x);
    this.y[i] = Math.round(y);
    this.settore[i] = k;
    this.sprite[i].setTexture(chiave).setPosition(this.x[i], this.y[i]).setDepth(this.y[i]).setVisible(true).play(`${chiave}:idle`);
  }

  private rompiEntro(x: number, y: number, raggio: number): void {
    for (let i = 0; i < MAX; i++) {
      if (this.stato[i] !== INTERO) continue;
      const dx = this.x[i] - x, dy = this.y[i] - y;
      if (dx * dx + dy * dy < raggio * raggio) this.rompi(i);
    }
  }

  rompi(i: number): void {
    this.stato[i] = ROTTO;
    if (this.settore[i] !== LAB) this.rotti.add(this.settore[i]);
    this.settore[i] = 0;
    this.alone[i].setVisible(false);
    this.sprite[i].play({ key: `${ROMPIBILI.tipi[this.tipo[i]].sprite}:death`, repeat: 0 });
    this.quandoRotto(this.tipo[i], this.x[i], this.y[i]);
  }

  private libera(i: number): void {
    this.stato[i] = LIBERO;
    this.settore[i] = 0;
    this.sprite[i].stop();
    this.sprite[i].setVisible(false);
    this.alone[i].setVisible(false);
  }
}
