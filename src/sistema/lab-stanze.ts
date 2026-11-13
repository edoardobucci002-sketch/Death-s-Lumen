/*
 * Comandi del Laboratorio per il gioco a stanze (scheda «Stanze» in laboratorio.ts). Si chiamano con stanze.lab.…
 * Passo 2 della fetta: fermare e riprendere, portare il Lampionaio al centro o contro un muro per provare i bordi,
 * mostrare la linea invisibile che divide i joystick. Passo 3: chiedere un colpo della Lanterna.
 * Passo 4: far comparire nemici, ondate, immortale, cura, Grazia, rinascita del Ricaduto, spostare il Lampionaio.
 * Passo 5: caricare e usare il Cerchio di luce.
 */
import { ABILITA_STANZA, STANZA } from '../data/stanze';
import { areaCamminabile } from './stanza';
import { STATO, type TipoStanza } from './nemici-stanza';
import type { Stanze } from '../scene/Stanze';

export type DirezioneColpo = 'destra' | 'sinistra' | 'su' | 'giu' | 'auto';

export type PuntoStanza = 'centro' | 'alto' | 'basso' | 'sinistra' | 'destra' | 'angolo';

export class LabStanze {
  constructor(private readonly s: Stanze) {}

  stato(): {
    x: number; y: number; larghezza: number; altezza: number; fermo: boolean; colpi: number;
    salute: number; saluteMassima: number; immortale: boolean; morto: boolean; grazia: number; schivate: number; ferite: number;
    nemici: number; uccisi: number; rinascite: number; ondate: number; ondateAutomatiche: boolean; rinascita: boolean | null;
    quiete: number; carica: number; caricaPiena: number; abilitaUsi: number; abilitaAttiva: number;
  } {
    const s = this.s, n = s.nemici;
    return {
      x: Math.round(s.x), y: Math.round(s.y), larghezza: STANZA.larghezza, altezza: STANZA.altezza, fermo: s.pausaLab, colpi: s.attacco.colpi,
      salute: Math.round(s.salute), saluteMassima: Math.round(s.saluteMassima), immortale: s.immortale, morto: s.morto,
      grazia: Math.max(0, s.grazia), schivate: s.schivatePerfette, ferite: s.ferite,
      nemici: n.vivi(), uccisi: n.uccisi, rinascite: n.rinascite, ondate: s.ondate, ondateAutomatiche: s.ondateAutomatiche, rinascita: n.rinascitaForzata,
      quiete: s.quiete, carica: s.abilita.carica, caricaPiena: ABILITA_STANZA.serve, abilitaUsi: s.abilita.usi, abilitaAttiva: Math.max(0, s.abilita.attiva),
    };
  }

  /** Carica dell'abilità piena (o vuota). */
  caricaAbilita(piena: boolean): void {
    this.s.abilita.imposta(piena);
  }

  /** Usa l'abilità (parte a stanza in corso). */
  usaAbilita(): boolean {
    return this.s.abilita.usa();
  }

  /** Fa comparire un nemico a «distanza» px dal Lampionaio, verso il centro della stanza (subito, senza il segno a terra se «subito»). */
  nemico(tipo: TipoStanza, distanza: number, subito = false): void {
    const s = this.s, cx = STANZA.larghezza / 2, cy = STANZA.altezza / 2;
    let dx = cx - s.x, dy = cy - s.y;
    const l = Math.hypot(dx, dy);
    if (l < 1) { dx = 1; dy = 0; } else { dx /= l; dy /= l; }
    s.nemici.aggiungi(tipo, s.x + dx * distanza, s.y + dy * distanza, subito ? 0 : undefined);
  }

  /** Un nemico in un punto preciso (per le prove). */
  nemicoIn(tipo: TipoStanza, x: number, y: number): void {
    this.s.nemici.aggiungi(tipo, x, y, 0);
  }

  ondata(): void {
    this.s.nuovaOndata();
  }

  /** Toglie tutti i nemici e i grumi (non contano come battuti). */
  svuota(): void {
    this.s.nemici.svuota();
  }

  /** Accende o spegne le ondate automatiche: spente, la stanza resta vuota finché non si chiama un nemico. */
  ondateAutomatiche(si: boolean): void {
    this.s.ondateAutomatiche = si;
  }

  immortale(si: boolean): void {
    this.s.immortale = si;
  }

  cura(): void {
    this.s.salute = this.s.saluteMassima;
  }

  /** Porta la salute a n (per provare la caduta). */
  salute(n: number): void {
    this.s.salute = Math.max(1, Math.min(this.s.saluteMassima, n));
  }

  grazia(): void {
    this.s.iniziaGrazia();
  }

  /** Rinascita del Ricaduto: true = sempre, false = mai, null = la probabilità normale. */
  rinascita(v: boolean | null): void {
    this.s.nemici.rinascitaForzata = v;
  }

  /** Sposta il Lampionaio di (dx, dy) pixel, dentro i muri (per le prove della schivata). */
  sposta(dx: number, dy: number): void {
    const a = areaCamminabile();
    this.s.x = Math.min(a.x1, Math.max(a.x0, this.s.x + dx));
    this.s.y = Math.min(a.y1, Math.max(a.y0, this.s.y + dy));
  }

  /** Secondi al prossimo attacco di un nemico in avviso (Infinity se nessuno sta preparando un attacco). */
  prossimoAttacco(): number {
    const n = this.s.nemici;
    let t = Infinity;
    for (let i = 0; i < n.numero; i++) if (n.stato[i] === STATO.avviso) t = Math.min(t, n.tempo[i]);
    return t;
  }

  /** Quanti nemici sono a terra in attesa di rialzarsi. */
  aTerra(): number {
    const n = this.s.nemici;
    let k = 0;
    for (let i = 0; i < n.numero; i++) if (n.stato[i] === STATO.aTerra) k++;
    return k;
  }

  /** Il pannello del Laboratorio tiene ferma la stanza finché è aperto. */
  ferma(si: boolean): void {
    this.s.pausaLab = si;
    if (si) this.s.anims.pauseAll();
    else if (!this.s.fermo()) this.s.anims.resumeAll();
  }

  /** Chiede un colpo della Lanterna in una direzione, o automatico (nemico più vicino, se no dove guarda). Parte a stanza in corso. */
  attacca(d: DirezioneColpo): void {
    if (d === 'auto') this.s.attacco.automatico();
    else this.s.attacco.verso(d === 'destra' ? 1 : d === 'sinistra' ? -1 : 0, d === 'giu' ? 1 : d === 'su' ? -1 : 0);
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
