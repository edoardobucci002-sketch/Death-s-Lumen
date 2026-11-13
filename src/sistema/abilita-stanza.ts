/*
 * Abilità del gioco a stanze (passo 5 della fetta): il Cerchio di luce del Lampionaio. Si carica SOLO quando i colpi
 * della Lanterna prendono un nemico (ABILITA_STANZA); piena, si usa con il pulsante accanto al joystick d'attacco o con
 * Spazio. Il cerchio segue il Lampionaio: ferisce chi ci sta dentro a ritmo fisso (con la sua Quiete, separata da
 * quella della Lanterna) e lo fa camminare più lento. Effetto, raggio, danno, durata e rallentamento sono quelli del
 * survivor (ABILITA.cerchioDiLuce). Il pulsante è disegnato dal codice: un tondo scuro con l'icona dell'abilità e un
 * anello nel colore del personaggio che si riempie in senso orario, pixel per pixel.
 */
import Phaser from 'phaser';
import { ABILITA } from '../data/abilita';
import { ABILITA_STANZA, JOYSTICK_STANZE } from '../data/stanze';
import { TOCCO_MINIMO } from '../data/hud';
import { arte, immagine, ingr, misura, posa, type MisureHud } from './arte';
import { PROFONDITA } from './effetti';
import { raggioDisegnato } from './asset';
import { FONTE, type NemiciStanza } from './nemici-stanza';
import { suona } from './audio';
import { vibra } from './mobile';

const A = ABILITA.cerchioDiLuce;
const ICONA = 'Icona_Cerchio_di_luce';
const PASSI_ANELLO = 48; // l'anello si ridisegna a scatti di 1/48: niente lavoro a ogni fotogramma

export class AbilitaStanza {
  carica = 0; // da 0 a ABILITA_STANZA.serve
  usi = 0; // volte usata (per il LAB e le prove)
  attiva = 0; // secondi di cerchio rimasti
  private ritmo = 0; // secondi al prossimo colpo del cerchio
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly pulsante: HTMLButtonElement;
  private readonly anello: HTMLCanvasElement;
  private readonly icona: HTMLImageElement;
  private parteVista = -1;
  private prontaVista = false;

  constructor(
    scena: Phaser.Scene,
    contenitore: HTMLElement,
    private readonly colore: string,
    private readonly fermo: () => boolean,
  ) {
    this.sprite = scena.add.sprite(0, 0, A.effetto).setDepth(PROFONDITA.aTerra + 2).setVisible(false);
    this.sprite.setScale(A.raggio / raggioDisegnato(scena, A.effetto));
    this.pulsante = document.createElement('button');
    this.pulsante.type = 'button';
    this.pulsante.className = 'stanze-abilita';
    this.pulsante.setAttribute('aria-label', A.nome);
    this.anello = document.createElement('canvas');
    this.anello.className = 'arte';
    this.anello.width = this.anello.height = ABILITA_STANZA.tasto.lato;
    this.icona = immagine(ICONA, 'stanze-abilita-icona');
    this.pulsante.append(this.anello, this.icona);
    this.pulsante.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.usa();
    });
    contenitore.append(this.pulsante);
    this.disegnaAnello();
  }

  pronta(): boolean {
    return this.carica >= ABILITA_STANZA.serve;
  }

  /** La Lanterna ha preso «presi» nemici con un colpo: l'abilità si carica (con un tetto per colpo). */
  colpo(presi: number): void {
    if (presi <= 0 || this.attiva > 0) return;
    const prima = this.pronta();
    this.carica = Math.min(ABILITA_STANZA.serve, this.carica + Math.min(ABILITA_STANZA.massimoPerColpo, presi * ABILITA_STANZA.perNemico));
    if (!prima && this.pronta()) vibra('leggera');
  }

  /** Usa l'abilità, se è piena e il gioco non è fermo. */
  usa(): boolean {
    if (!this.pronta() || this.fermo() || this.attiva > 0) return false;
    this.carica = 0;
    this.usi++;
    this.attiva = A.durata;
    this.ritmo = 0; // il primo colpo parte subito
    this.sprite.setVisible(true).play({ key: `${A.effetto}:idle`, duration: A.durata * 1000, repeat: 0 });
    suona('speciale');
    vibra('media');
    return true;
  }

  /** Un passo di logica: il cerchio segue il Lampionaio in (x, y), ferisce a ritmo e rallenta chi c'è dentro. */
  aggiorna(dt: number, x: number, y: number, nemici: NemiciStanza, danno: number): void {
    if (this.attiva <= 0) {
      nemici.cerchioR = 0;
      return;
    }
    this.attiva -= dt;
    nemici.cerchioX = x;
    nemici.cerchioY = y;
    nemici.cerchioR = this.attiva > 0 ? A.raggio : 0;
    nemici.cerchioLento = A.rallenta;
    if ((this.ritmo -= dt) <= 0 && this.attiva > 0) {
      this.ritmo += A.intervallo;
      nemici.colpisciCerchio(x, y, A.raggio, danno, FONTE.abilita);
    }
  }

  /** Disegno: il cerchio sotto i nemici, centrato sul corpo; l'anello del pulsante quando cambia. */
  disegna(x: number, y: number): void {
    if (this.attiva <= 0) this.sprite.setVisible(false).stop();
    else this.sprite.setPosition(Math.round(x), Math.round(y));
    const parte = Math.floor((this.carica / ABILITA_STANZA.serve) * PASSI_ANELLO);
    if (parte !== this.parteVista) this.disegnaAnello();
  }

  /** Il tondo del pulsante: scuro, con l'anello nel colore del personaggio pieno quanto la carica (in senso orario dall'alto). */
  private disegnaAnello(): void {
    const l = ABILITA_STANZA.tasto.lato, r = l / 2, g = this.anello.getContext('2d')!, C = JOYSTICK_STANZE.colori;
    const parte = Math.floor((this.carica / ABILITA_STANZA.serve) * PASSI_ANELLO), pronta = this.pronta();
    this.parteVista = parte;
    g.clearRect(0, 0, l, l);
    for (let y = 0; y < l; y++) {
      for (let x = 0; x < l; x++) {
        const dx = x + 0.5 - r, dy = y + 0.5 - r, d = Math.hypot(dx, dy);
        if (d > r) continue;
        let k: string;
        if (d > r - 1) k = C.bordo;
        else if (d > r - 4) {
          const giro = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1; // 0 in alto, in senso orario
          k = pronta ? C.fiamma : giro < parte / PASSI_ANELLO ? this.colore : '#3a2f27';
        } else if (d > r - 5) k = C.bordo;
        else k = '#1c1611';
        g.fillStyle = k;
        g.fillRect(x, y, 1, 1);
      }
    }
    if (pronta !== this.prontaVista) {
      this.prontaVista = pronta;
      this.pulsante.classList.toggle('pronta', pronta);
    }
  }

  /** Accanto al joystick d'attacco: sopra e a sinistra, alla distanza ABILITA_STANZA.tasto.distanza. */
  disponi(m: MisureHud, joystick: { x: number; y: number; l: number }): void {
    const z = ingr('joystick', m), l = ABILITA_STANZA.tasto.lato, i = arte(ICONA);
    const lato = l * z * m.px, d = ABILITA_STANZA.tasto.distanza * z;
    // in pixel di gioco: a sinistra del joystick, con il bordo basso a metà della sua altezza
    posa(this.pulsante, joystick.x - d - l * z, joystick.y + Math.round(joystick.l / 2) - l * z, m);
    misura(this.pulsante, l, l, z, m);
    misura(this.anello, l, l, z, m);
    if (i) {
      const zi = Math.max(1, Math.floor(((l - 12) * z) / Math.max(i.w, i.h)));
      misura(this.icona, i.w, i.h, zi, m);
      this.icona.style.left = `${Math.floor((l * z - i.w * zi) / 2) * m.px}px`;
      this.icona.style.top = `${Math.floor((l * z - i.h * zi) / 2) * m.px}px`;
    }
    this.pulsante.style.setProperty('--margine-tocco', `${Math.max(4, Math.ceil((TOCCO_MINIMO - lato) / 2))}px`);
  }

  /** LAB: carica piena (o vuota). */
  imposta(piena: boolean): void {
    this.carica = piena ? ABILITA_STANZA.serve : 0;
  }

  distruggi(): void {
    this.pulsante.remove();
  }
}
