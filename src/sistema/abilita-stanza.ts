/*
 * Abilità del gioco a stanze (passo 5 della fetta): il Cerchio di luce del Lampionaio. Si carica SOLO con i colpi
 * della Lanterna a segno: piena dopo ABILITA_STANZA.colpi colpi (un colpo conta 1 anche se prende più nemici); piena, si
 * usa con il pulsante accanto al joystick d'attacco o con Spazio. Toccata scarica, trema e fa un tonfo. Il cerchio segue il Lampionaio: ferisce chi ci sta dentro a ritmo fisso (con la sua Quiete, separata da
 * quella della Lanterna) e lo fa camminare più lento. Effetto, raggio, danno, durata e rallentamento sono quelli del
 * survivor (ABILITA.cerchioDiLuce). Il pulsante è disegnato dal codice: un tondo scuro con l'icona dell'abilità e un
 * anello di tante tacche quanti sono i colpi che servono, che si accendono in senso orario nel colore del personaggio.
 */
import Phaser from 'phaser';
import { ABILITA } from '../data/abilita';
import { ABILITA_STANZA, JOYSTICK_STANZE } from '../data/stanze';
import { TOCCO_MINIMO } from '../data/hud';
import { arte, immagine, ingr, misura, posa, type MisureHud } from './arte';
import { PROFONDITA } from './effetti';
import { raggioDisegnato } from './asset';
import type { NemiciStanza } from './nemici-stanza';
import { suona } from './audio';
import { vibra } from './mobile';

const A = ABILITA.cerchioDiLuce;
const ICONA = 'Icona_Cerchio_di_luce';

export class AbilitaStanza {
  carica = 0; // colpi a segno, da 0 a ABILITA_STANZA.colpi
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
    return this.carica >= ABILITA_STANZA.colpi;
  }

  /** La Lanterna ha preso almeno un nemico con un colpo: una tacca in più (mentre il cerchio è acceso non si carica). */
  colpo(presi: number): void {
    if (presi <= 0 || this.attiva > 0 || this.pronta()) return;
    this.carica++;
    if (this.pronta()) vibra('leggera');
  }

  /** Usa l'abilità, se è piena e il gioco non è fermo; scarica, il pulsante trema e fa un tonfo (il tocco è arrivato). */
  usa(): boolean {
    if (this.fermo()) return false;
    if (!this.pronta() || this.attiva > 0) {
      suona('vuoto');
      this.pulsante.classList.remove('scarica');
      void this.pulsante.offsetWidth; // riparte l'animazione anche se si tocca di nuovo subito
      this.pulsante.classList.add('scarica');
      return false;
    }
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
      this.ritmo += ABILITA_STANZA.ritmo;
      nemici.colpisciCerchio(x, y, A.raggio, danno);
    }
  }

  /** Disegno: il cerchio sotto i nemici, centrato sul corpo; l'anello del pulsante quando cambia. */
  disegna(x: number, y: number): void {
    if (this.attiva <= 0) this.sprite.setVisible(false).stop();
    else this.sprite.setPosition(Math.round(x), Math.round(y));
    if (this.carica !== this.parteVista) this.disegnaAnello();
  }

  /** Il tondo del pulsante: scuro, con l'anello a tacche acceso quanto la carica (in senso orario dall'alto). */
  private disegnaAnello(): void {
    const l = ABILITA_STANZA.tasto.lato, r = l / 2, g = this.anello.getContext('2d')!, C = JOYSTICK_STANZE.colori;
    const n = ABILITA_STANZA.colpi, pronta = this.pronta(), stacco = 0.035; // lo spazio tra due tacche, in giri
    this.parteVista = this.carica;
    g.clearRect(0, 0, l, l);
    for (let y = 0; y < l; y++) {
      for (let x = 0; x < l; x++) {
        const dx = x + 0.5 - r, dy = y + 0.5 - r, d = Math.hypot(dx, dy);
        if (d > r) continue;
        let k: string;
        if (d > r - 1) k = C.bordo;
        else if (d > r - 4) {
          const giro = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1; // 0 in alto, in senso orario
          const tacca = Math.floor(giro * n), dentroTacca = giro * n - tacca;
          if (dentroTacca < stacco * n / 2 || dentroTacca > 1 - stacco * n / 2) k = C.bordo; // stacco tra le tacche
          else k = pronta ? C.fiamma : tacca < this.carica ? this.colore : '#3a2f27';
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
    this.pulsante.style.setProperty('--margine-tocco', `${Math.max(ABILITA_STANZA.tasto.margine, Math.ceil((TOCCO_MINIMO - lato) / 2))}px`);
  }

  /** LAB: carica piena (o vuota). */
  imposta(piena: boolean): void {
    this.carica = piena ? ABILITA_STANZA.colpi : 0;
  }

  distruggi(): void {
    this.pulsante.remove();
  }
}
