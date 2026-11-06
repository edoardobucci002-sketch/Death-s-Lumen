/*
 * Che cosa dice una striscia della scelta dei doni: dai dati veri ricava nome, numeri che cambiano
 * e righe di spiegazione (stato che lascia l'arma, reazione con le armi che hai, vantaggio e rovescio).
 * Qui c'è anche la striscia provvisoria, disegnata dal codice finché Edoardo non esporta Striscia_Dono.
 */
import type { Arma } from '../data/armi';
import { AFFINITA_ARMI } from '../data/stati';
import { CARTE } from '../data/progressione';
import { ROSARIO } from '../data/rosario';
import { iconaUnione, livelloDonoUnione, unioneDi, UNIONI, type IdUnione, type Unione } from '../data/unioni';
import { PASSIVI, type IdDono, type Passivo } from '../data/doni';
import { CAMPI_ARMA, chiaro, DATI_DONI, INFO_AFFINITA, NOME_COLPI_IN_PIU, reazioneTra, SPIEGA_DONI, virgola } from '../data/spiegazioni';
import { STRISCIA } from '../data/hud';
import { arte, registraArte } from './arte';
import { iconaAmuleto } from './amuleti';
import type { Dono } from './doni';

export interface Dato { nome: string; prima?: string; dopo: string; tono?: 'bene' | 'male' }
export interface Riga { testo: string; tono?: 'bene' | 'male' | 'reazione'; simbolo?: string; colore?: string }
export interface Scheda {
  nome: string;
  icona: string | null;
  categoria: 'arma' | 'dono' | 'amuleto' | 'altro';
  tag: string;
  dati: Dato[];
  righe: Riga[];
}
export interface Contesto {
  armi: readonly Arma[]; // quelle che hai già
  graniUsati: number;
  graniTotali: number;
  doni: Record<IdDono, number>; // livello di ogni dono
  unioni: boolean; // le unioni sono sbloccate
  scoperte: ReadonlySet<IdUnione>; // solo queste si nominano: le altre si svelano giocando
}

/** Un'arma o un dono visti nella pausa: la casella e il riquadro di dettaglio. */
export interface VoceDettaglio {
  chiave: string;
  nome: string;
  icona: string;
  livello: number;
  massimo: number;
  unita: boolean;
  numeri: { nome: string; valore: string }[];
  righe: Riga[];
}

/** Dettaglio di un'arma al suo livello; unione: quella già fatta, oppure da mostrare come traguardo con il suo stato. */
export function voceArma(arma: Arma, livello: number, unita: boolean, unione?: { u: Unione; stato: string }): VoceDettaglio {
  const ora = arma.livelli[livello - 1] as unknown as Record<string, number | boolean | string>;
  const numeri: VoceDettaglio['numeri'] = [];
  for (const k of Object.keys(ora)) {
    const campo = CAMPI_ARMA[k], v = ora[k];
    if (campo && typeof v === 'number') numeri.push({ nome: chiaro(campo.nome), valore: virgola(v) + (campo.unita ?? '') });
  }
  const info = INFO_AFFINITA[AFFINITA_ARMI[arma.id]], fatta = unita ? unioneDi(arma.id) : undefined;
  const righe: Riga[] = [
    { testo: fatta?.testo ?? String(arma.livelli[0].testo) },
    { testo: `${info.verbo} il nemico: ${info.effetto()}`, simbolo: info.simbolo, colore: info.colore },
  ];
  if (unione && !fatta) righe.push({ testo: `Unione: ${unione.u.nome}, ${unione.stato.toLowerCase()}`, tono: 'reazione' });
  return { chiave: arma.id, nome: fatta?.nome ?? arma.nome, icona: fatta ? iconaUnione(fatta.id) : arma.icona, livello, massimo: CARTE.livelloMassimo, unita: !!fatta, numeri, righe };
}

/** Dettaglio di un dono al suo livello. */
export function voceDono(q: Passivo, livello: number): VoceDettaglio {
  return { chiave: q.id, nome: q.nome, icona: q.icona, livello, massimo: q.massimo, unita: false, numeri: DATI_DONI[q.id](q, livello).map((n) => ({ ...n, nome: n.nome === 'Quantità' ? NOME_COLPI_IN_PIU : chiaro(n.nome) })), righe: [{ testo: SPIEGA_DONI[q.id] }] };
}

const tagLivello = (l: number, massimo: number, nuovo: string): string => (l === 1 ? nuovo : `Liv ${l - 1} › ${l === massimo ? 'MAX' : l}`);

function schedaArma(arma: Arma, l: number, c: Contesto): Scheda {
  const ora = arma.livelli[l - 1] as unknown as Record<string, number | boolean | string>;
  const prima = l > 1 ? arma.livelli[l - 2] as unknown as Record<string, number | boolean | string> : null;
  const dati: Dato[] = [];
  let novita = l === 1; // un'abilità nuova (non un numero) si racconta a parole
  for (const k of Object.keys(ora)) {
    const campo = CAMPI_ARMA[k], v = ora[k];
    if (typeof v === 'boolean') novita ||= !!prima && v !== prima[k];
    if (!campo || typeof v !== 'number') continue;
    const unita = campo.unita ?? '';
    if (!prima) {
      if (k === 'danno' || k === 'ricarica' || (k === 'quantita' && v > 1)) dati.push({ nome: campo.nome, dopo: virgola(v) + unita, tono: 'bene' });
    } else if (prima[k] !== v) {
      dati.push({ nome: campo.nome, prima: virgola(prima[k] as number), dopo: virgola(v) + unita, tono: 'bene' });
    }
  }
  const righe: Riga[] = [];
  if (novita || !dati.length) righe.push({ testo: String(ora.testo) });
  const aff = AFFINITA_ARMI[arma.id], info = INFO_AFFINITA[aff];
  righe.push({ testo: `${info.verbo} il nemico: ${info.effetto()}`, simbolo: info.simbolo, colore: info.colore });
  for (const a of c.armi) {
    const r = a !== arma ? reazioneTra(aff, AFFINITA_ARMI[a.id]) : undefined;
    if (r) {
      righe.push({ testo: `Con ${a.nome}: ${r.nome.toUpperCase()}, ${r.effetto()}`, tono: 'reazione' });
      break;
    }
  }
  const trovata = unioneDi(arma.id), u = c.unioni && trovata && c.scoperte.has(trovata.id) ? trovata : undefined;
  if (u && (l === CARTE.livelloMassimo || c.doni[u.dono])) {
    righe.push({ testo: `Al liv ${CARTE.livelloMassimo}, con ${PASSIVI.find((q) => q.id === u.dono)!.nome} al liv ${livelloDonoUnione(u.dono)}: ${u.nome}`, tono: 'reazione' });
  }
  return { nome: arma.nome, icona: arma.icona, categoria: 'arma', tag: tagLivello(l, CARTE.livelloMassimo, 'Nuova arma'), dati, righe };
}

/** Che cosa raccontano le strisce del dono d. */
export function schedaDono(d: Dono, c: Contesto): Scheda {
  switch (d.tipo) {
    case 'arma': return schedaArma(d.arma, d.livello, c);
    case 'passivo': {
      const q = d.passivo, ora = DATI_DONI[q.id](q, d.livello), prima = d.livello > 1 ? DATI_DONI[q.id](q, d.livello - 1) : null;
      const u = c.unioni ? UNIONI.find((x) => x.dono === q.id && c.scoperte.has(x.id) && c.armi.some((a) => a.id === x.arma)) : undefined;
      const arma = u && c.armi.find((a) => a.id === u.arma);
      return {
        nome: q.nome, icona: q.icona, categoria: 'dono', tag: tagLivello(d.livello, q.massimo, 'Nuovo dono'),
        dati: ora.map((v, i) => ({ nome: v.nome, prima: prima?.[i].valore, dopo: v.valore, tono: 'bene' })),
        righe: [{ testo: SPIEGA_DONI[q.id] }, ...(u && arma ? [{ testo: `Al liv ${livelloDonoUnione(q.id)}, con ${arma.nome} al liv ${CARTE.livelloMassimo}: ${u.nome}`, tono: 'reazione' as const }] : [])],
      };
    }
    case 'amuleto': {
      const a = d.amuleto, dopo = c.graniUsati + a.grani, peccato = dopo > c.graniTotali;
      const dati: Dato[] = [{ nome: 'Rosario', prima: `${c.graniUsati}/${c.graniTotali}`, dopo: `${dopo}/${c.graniTotali}`, tono: peccato ? 'male' : 'bene' }];
      if (peccato) dati.push({ nome: 'Peccato', dopo: `danno subito ×${1 + ROSARIO.peccato}`, tono: 'male' });
      return {
        nome: a.nome, icona: iconaAmuleto(a.id), categoria: 'amuleto', tag: `${a.grani} ${a.grani === 1 ? 'grano' : 'grani'}`, dati,
        righe: [{ testo: a.vantaggio, tono: 'bene' }, a.rovescio === 'Nessuno.' ? { testo: 'Nessun rovescio.' } : { testo: `Rovescio: ${a.rovescio}`, tono: 'male' }],
      };
    }
    case 'unione': {
      const u = d.unione;
      return {
        nome: u.nome, icona: iconaUnione(u.id), categoria: 'arma', tag: 'Unione',
        dati: [{ nome: d.arma.nome, dopo: 'si unisce', tono: 'bene' }],
        righe: [{ testo: u.testo, tono: 'bene' }, { testo: `${d.arma.nome} + ${PASSIVI.find((q) => q.id === u.dono)!.nome}` }],
      };
    }
    case 'potenziamento':
      return { nome: 'Potenziamento', icona: null, categoria: 'altro', tag: 'Reliquiario', dati: [], righe: [{ testo: 'Un\'arma o un dono sale di livello (a volte tre).' }] };
    case 'pane':
      return { nome: 'Pane e vino', icona: null, categoria: 'altro', tag: 'Ristoro', dati: [{ nome: 'Salute', dopo: `+${CARTE.paneEVino}`, tono: 'bene' }], righe: [{ testo: 'Un ristoro nella notte.' }] };
  }
}

/** La striscia provvisoria (normale e sotto il dito), a pixel interi, con il pozzetto per l'icona. */
export function creaStrisce(): void {
  const { l, a } = STRISCIA;
  for (const [chiave, bordo, fondo] of [['Striscia_Dono', '#8a6a3a', '#1a1410'], ['Striscia_Dono_Scelta', '#f2cf6a', '#2c2116']] as const) {
    if (arte(chiave)) continue;
    const t = document.createElement('canvas');
    t.width = l;
    t.height = a;
    const g = t.getContext('2d')!;
    const piena = (c: string, x: number, y: number, w: number, h: number): void => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    piena('#0b0807', 1, 0, l - 2, a);
    piena('#0b0807', 0, 1, l, a - 2);
    piena(bordo, 2, 1, l - 4, a - 2);
    piena(bordo, 1, 2, l - 2, a - 4);
    piena(fondo, 2, 2, l - 4, a - 4);
    const w = STRISCIA.interni.icona;
    piena('#0b0807', w.x, w.y, w.l, w.a);
    piena(bordo, w.x, w.y, w.l, 1);
    piena(bordo, w.x, w.y + w.a - 1, w.l, 1);
    registraArte(chiave, t);
  }
}
