/*
 * Salvataggio della meta progressione, sul dispositivo: Cera, livello e interruttore di ogni cero, Seconda candela,
 * personaggi sbloccati, ultima veglia. Ha un numero di versione: quando si aggiungono cose, un salvataggio vecchio
 * si aggiorna invece di perdersi. Il codice di salvataggio (testo da copiare e incollare) è la copia di sicurezza,
 * e serve anche a passare dal link web all'app. I record per personaggio restano in record.ts.
 */
import { CERI, META_SIMULAZIONE, OGGETTI_A_META, SBLOCCHI, SBLOCCHI_OGGETTI, rimescolateCero, type IdCero, type IdOggetto } from '../data/meta';
import type { Personaggio } from '../data/personaggi';
import { UNIONI, type IdUnione } from '../data/unioni';

const CHIAVE = 'dl-salvataggio';
const VERSIONE = 1;
const PREFISSO = 'DL1-'; // inizio di ogni codice di salvataggio

export interface VoceVeglia {
  nome: string;
  cera: number;
}

export interface Salvataggio {
  versione: number;
  cera: number;
  ceri: Record<IdCero, number>; // livello, 0–5
  spenti: IdCero[]; // ceri comprati ma spenti nel menu
  secondaCandela: boolean; // comprata
  secondaCandelaSpenta: boolean;
  sbloccati: Personaggio['id'][];
  rosario: boolean; // il Rosario è sbloccato
  oggetti: IdOggetto[]; // armi e doni nuovi sbloccati
  unioni: boolean; // le unioni delle armi sono sbloccate
  unioniScoperte: IdUnione[]; // quelle già viste in partita: solo queste compaiono nella pausa
  ultimaVeglia: { voci: VoceVeglia[]; totale: number; sbloccato: string | null } | null;
}

/** Cosa danno i ceri accesi, già sommati: lo legge la scena di gioco. */
export interface BonusMeta {
  salute: number;
  danno: number;
  velocita: number;
  raccolta: number;
  rito: number; // parte di ricarica dell'abilità tolta
  anime: number;
  rimescolate: number;
  secondaCandela: boolean;
  rosario: boolean;
  oggetti: IdOggetto[];
  unioni: boolean;
}

function nuovo(): Salvataggio {
  const ceri = {} as Record<IdCero, number>;
  for (const c of CERI) ceri[c.id] = 0;
  return { versione: VERSIONE, cera: 0, ceri, spenti: [], secondaCandela: false, secondaCandelaSpenta: false, sbloccati: ['lampionaio'], rosario: false, oggetti: [], unioni: false, unioniScoperte: [], ultimaVeglia: null };
}

/** Porta un salvataggio letto (anche vecchio o incompleto) alla forma di oggi. */
function aggiorna(dati: Partial<Salvataggio>): Salvataggio {
  const s = nuovo();
  if (typeof dati.cera === 'number' && dati.cera >= 0) s.cera = Math.floor(dati.cera);
  for (const c of CERI) {
    const l = dati.ceri?.[c.id];
    if (typeof l === 'number') s.ceri[c.id] = Math.max(0, Math.min(5, Math.floor(l)));
  }
  s.spenti = (dati.spenti ?? []).filter((id) => CERI.some((c) => c.id === id));
  s.secondaCandela = !!dati.secondaCandela;
  s.secondaCandelaSpenta = !!dati.secondaCandelaSpenta;
  s.sbloccati = Array.from(new Set(['lampionaio', ...(dati.sbloccati ?? []).filter((id) => id in SBLOCCHI)])) as Personaggio['id'][];
  s.rosario = !!dati.rosario;
  s.unioni = !!dati.unioni;
  s.unioniScoperte = (dati.unioniScoperte ?? []).filter((id) => UNIONI.some((u) => u.id === id));
  s.oggetti = (dati.oggetti ?? []).filter((id) => SBLOCCHI_OGGETTI.some((o) => o.id === id));
  s.ultimaVeglia = dati.ultimaVeglia ?? null;
  return s;
}

export function carica(): Salvataggio {
  try {
    const testo = localStorage.getItem(CHIAVE);
    return testo ? aggiorna(JSON.parse(testo)) : nuovo();
  } catch {
    return nuovo();
  }
}

export function salva(s: Salvataggio): void {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(s));
  } catch {
    /* niente memoria: i progressi valgono solo per ora */
  }
}

/** Il codice di salvataggio: il salvataggio in un testo da copiare. */
export function codice(s: Salvataggio): string {
  return PREFISSO + btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}

/** Legge un codice incollato; null se non è un codice valido. */
export function daCodice(testo: string): Salvataggio | null {
  const t = testo.trim();
  if (!t.startsWith(PREFISSO)) return null;
  try {
    return aggiorna(JSON.parse(decodeURIComponent(escape(atob(t.slice(PREFISSO.length))))));
  } catch {
    return null;
  }
}

/** Gli effetti dei ceri accesi. Con meta = 'meta' o 'max' (simulazione) finge la Cappella a metà o completa. */
export function bonusMeta(s: Salvataggio, meta: string | null = null): BonusMeta {
  const finto = meta === 'meta' ? META_SIMULAZIONE.meta : meta === 'max' ? META_SIMULAZIONE.max : meta === '0' ? 0 : -1;
  const livello = (id: IdCero): number => (finto >= 0 ? finto : s.spenti.includes(id) ? 0 : s.ceri[id]);
  const per = (id: IdCero): number => livello(id) * CERI.find((c) => c.id === id)!.per;
  return {
    salute: per('vita'),
    danno: per('forza'),
    velocita: per('passo'),
    raccolta: per('raccolto'),
    rito: per('rito'),
    anime: per('anime'),
    rimescolate: rimescolateCero(livello('scelta')),
    rosario: finto >= 0 ? finto > 0 : s.rosario,
    unioni: finto >= 0 ? finto > 0 : s.unioni,
    oggetti: finto === META_SIMULAZIONE.max ? SBLOCCHI_OGGETTI.map((o) => o.id) : finto > 0 ? OGGETTI_A_META : finto === 0 ? [] : s.oggetti,
    secondaCandela: finto >= 0 ? finto === META_SIMULAZIONE.max : s.secondaCandela && !s.secondaCandelaSpenta,
  };
}
