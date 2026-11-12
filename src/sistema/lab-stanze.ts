/*
 * Comandi del Laboratorio per il gioco a stanze (scheda «Stanze» in laboratorio.ts). Si chiamano con stanze.lab.…
 * Passo 2 della fetta: fermare e riprendere, portare il Lampionaio al centro o contro un muro per provare i bordi,
 * mostrare la linea invisibile che divide i joystick.
 */
import { STANZA } from '../data/stanze';
import { areaCamminabile } from './stanza';
import type { Stanze } from '../scene/Stanze';

export type PuntoStanza = 'centro' | 'alto' | 'basso' | 'sinistra' | 'destra' | 'angolo';

export class LabStanze {
  constructor(private readonly s: Stanze) {}

  stato(): { x: number; y: number; larghezza: number; altezza: number; fermo: boolean } {
    return { x: Math.round(this.s.x), y: Math.round(this.s.y), larghezza: STANZA.larghezza, altezza: STANZA.altezza, fermo: this.s.pausaLab };
  }

  /** Il pannello del Laboratorio tiene ferma la stanza finché è aperto. */
  ferma(si: boolean): void {
    this.s.pausaLab = si;
    if (si) this.s.anims.pauseAll();
    else if (!this.s.fermo()) this.s.anims.resumeAll();
  }

  /** Mostra o nasconde la linea invisibile al centro dello schermo che divide i joystick. */
  linea(si: boolean): void {
    this.s.lineaJoystick.hidden = !si;
  }

  lineaVisibile(): boolean {
    return !this.s.lineaJoystick.hidden;
  }

  /** Porta il Lampionaio in un punto della stanza: al centro, contro un muro o nell'angolo in alto a sinistra. */
  vai(dove: PuntoStanza): void {
    const a = areaCamminabile(), cx = Math.round(STANZA.larghezza / 2), cy = Math.round(STANZA.altezza / 2);
    const punti: Record<PuntoStanza, [number, number]> = {
      centro: [cx, cy], alto: [cx, a.y0], basso: [cx, a.y1], sinistra: [a.x0, cy], destra: [a.x1, cy], angolo: [a.x0, a.y0],
    };
    [this.s.x, this.s.y] = punti[dove];
  }
}
