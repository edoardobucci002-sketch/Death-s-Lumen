/*
 * La minimappa (passo 4 della mappa del Mondo, 18/11; numeri in MINIMAPPA, src/data/mappa.ts). Una tela piccola disegnata
 * a pixel e ingrandita a pixel interi, come la barra del capo:
 * - nell'angolo in alto (a sinistra, o a destra accanto alla pausa: si sceglie dal LAB) una finestra attorno alla stanza
 *   in cui si è;
 * - nella pausa la mappa intera di ciò che si conosce.
 * Si conoscono le stanze visitate (piene; quella in cui si è più chiara) e quelle accanto a una visitata (solo il
 * contorno). Ogni stanza mostra il suo contenuto (18/11, Edoardo): Campanaro e Boss sempre, la ricompensa finché la stanza
 * non è ripulita (gli Echi d'inizio, un'affinità, il dono). Si ridisegna solo quando si cambia stanza o si apre la pausa.
 */
import { MINIMAPPA } from '../data/mappa';
import { PORTE, STANZA } from '../data/stanze';
import { INFO_AFFINITA } from '../data/spiegazioni';
import type { Mappa, StanzaMappa } from './mappa';

// i simboli, 3 × 3, con il loro colore (segnaposto di Claude): ogni contenuto ha una forma diversa, non solo un colore
const SIMBOLI: Record<string, { forma: readonly string[]; colore: string }> = {
  campanaro: { forma: ['.#.', '###', '#.#'], colore: MINIMAPPA.colori.campanaro }, // la campana
  boss: { forma: ['#.#', '.#.', '#.#'], colore: MINIMAPPA.colori.boss }, // la croce
  luce: { forma: ['.#.', '#.#', '.#.'], colore: INFO_AFFINITA.luce.colore }, // il sole
  sacro: { forma: ['.#.', '###', '.#.'], colore: INFO_AFFINITA.sacro.colore }, // la croce greca
  ombra: { forma: ['##.', '#..', '##.'], colore: INFO_AFFINITA.ombra.colore }, // la falce di luna
  terra: { forma: ['...', '.#.', '###'], colore: INFO_AFFINITA.terra.colore }, // il tumulo
  dono: { forma: ['###', '#.#', '###'], colore: PORTE.colori.dono }, // il reliquiario
  echi: { forma: ['#.#', '###', '#.#'], colore: PORTE.colori.echi }, // gli Echi d'inizio
  tesoro: { forma: ['###', '###', '#.#'], colore: MINIMAPPA.colori.tesoro }, // il forziere (18/11)
  sosta: { forma: ['###', '.#.', '###'], colore: MINIMAPPA.colori.sosta }, // la coppa della fonte (18/11)
  serratura: { forma: ['.#.', '#.#', '###'], colore: MINIMAPPA.colori.serratura }, // chiusa a chiave (18/11): il lucchetto
  chiave: { forma: ['#..', '###', '#.#'], colore: MINIMAPPA.colori.chiave }, // la chiave sicura (18/11)
};

/** Il simbolo del contenuto della stanza: il capo, o la ricompensa (il tesoro, la Sosta) finché non è ripulita (usata). */
function contenuto(s: StanzaMappa): string | null {
  if (s.tipo === 'campanaro' || s.tipo === 'boss') return s.tipo;
  if (s.serrata) return 'serratura'; // chiusa a chiave: non si sa cosa c'è dietro
  if (s.ricompensa === 'chiave' && s.ripulita && !s.chiavePresa) return 'chiave'; // la chiave è ancora a terra
  if (s.ripulita) return null;
  if (s.tipo === 'tesoro' || s.tipo === 'sosta') return s.tipo;
  if (!s.ricompensa) return null;
  return s.ricompensa;
}

/** Le stanze che si conoscono: visitate, o accanto a una visitata. */
function conosciute(m: Mappa): boolean[] {
  const noto = m.stanze.map((s) => s.visitata);
  m.stanze.forEach((s) => { if (s.visitata) for (const v of s.vicine) if (v >= 0) noto[v] = true; });
  return noto;
}

/**
 * Disegna la mappa su c. Con finestra: quella quantità di stanze attorno a «qui», con il fondo scuro; senza: tutte le
 * stanze conosciute, senza fondo. La misura in pixel disegnati resta in dataset.l e dataset.a.
 */
export function disegnaMinimappa(c: HTMLCanvasElement, m: Mappa, qui: number, finestra: { colonne: number; righe: number } | null): void {
  const M = MINIMAPPA, L = M.cella.larghezza, A = M.cella.altezza, S = M.spazio, noto = conosciute(m);
  let x0: number, y0: number, col: number, rig: number;
  if (finestra) {
    col = finestra.colonne;
    rig = finestra.righe;
    x0 = m.stanze[qui].x - Math.floor(col / 2);
    y0 = m.stanze[qui].y - Math.floor(rig / 2);
  } else {
    let a = 99, b = -1, d = 99, e = -1;
    m.stanze.forEach((s, i) => { if (noto[i]) { a = Math.min(a, s.x); b = Math.max(b, s.x); d = Math.min(d, s.y); e = Math.max(e, s.y); } });
    if (b < 0) { a = b = m.stanze[qui].x; d = e = m.stanze[qui].y; }
    x0 = a; y0 = d; col = b - a + 1; rig = e - d + 1;
  }
  const w = col * (L + S) + S, h = rig * (A + S) + S;
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  c.dataset.l = String(w);
  c.dataset.a = String(h);
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, w, h);
  if (finestra) {
    g.fillStyle = M.colori.fondo;
    g.fillRect(0, 0, w, h);
  }
  m.stanze.forEach((s, i) => {
    const cx = s.x - x0, cy = s.y - y0;
    if (!noto[i] || cx < 0 || cy < 0 || cx >= col || cy >= rig) return;
    const py = S + cy * (A + S);
    // le stanze doppie (Campanaro e Boss, 18/11) si allargano nello spazio ai lati, dove non c'è una stanza accanto
    const doppia = STANZA.doppie.includes(s.tipo), sx0 = doppia && s.vicine[3] < 0 ? S : 0, sx1 = doppia && s.vicine[1] < 0 ? S : 0;
    const px = S + cx * (L + S) - sx0, lw = L + sx0 + sx1;
    if (s.visitata) {
      g.fillStyle = i === qui ? M.colori.qui : M.colori.visitata;
      g.fillRect(px, py, lw, A);
    } else {
      g.fillStyle = M.colori.contorno;
      g.fillRect(px, py, lw, 1);
      g.fillRect(px, py + A - 1, lw, 1);
      g.fillRect(px, py, 1, A);
      g.fillRect(px + lw - 1, py, 1, A);
    }
    const c = contenuto(s), segno = c ? SIMBOLI[c] : null;
    if (!segno) return;
    g.fillStyle = i === qui ? M.colori.sulChiaro : segno.colore; // sulla stanza in cui si è (crema) il simbolo è scuro
    const sx = px + Math.floor((lw - 3) / 2), sy = py + Math.floor((A - 3) / 2);
    segno.forma.forEach((r, y) => [...r].forEach((k, x) => { if (k === '#') g.fillRect(sx + x, sy + y, 1, 1); }));
  });
}
