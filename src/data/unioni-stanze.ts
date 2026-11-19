/*
 * Le Unioni del gioco a stanze (decisioni di Edoardo del 19/11, sulla proposta di Claude): un Eco o la Lanterna al livello
 * LIVELLO_ARMA_UNIONE_STANZE più il suo dono al massimo (livelloDonoUnione, in unioni.ts). La prima stanza ripulita dopo
 * offre la carta Unione in più (e il forziere del tesoro la offre al posto di una delle sue carte); se non la prendi,
 * ricompare alla stanza dopo; una per stanza. L'Unione dà solo l'effetto, non è un livello: l'arma può ancora salire al 5 e
 * Unione e potenziale si sommano. Disponibili da subito, senza sblocco nella Cappella (se ne riparla con il Mondo 2).
 * Le Unioni del survivor (src/data/unioni.ts) non cambiano: otto di queste usano il loro stesso effetto e i loro numeri
 * (NUMERI_UNIONI); le quattro adattate alle stanze hanno i numeri qui sotto. Tutti i numeri sono da rivedere.
 */
import type { Unione } from './unioni';
import { NUMERI_UNIONI as U } from './unioni';

/** Il livello che serve all'arma (proposta del pivot: il 4 su 5). Il dono deve essere al suo massimo. */
export const LIVELLO_ARMA_UNIONE_STANZE = 4;

/** I numeri delle quattro Unioni adattate alle stanze (proposte di Claude del 19/11, da rivedere). */
export const NUMERI_UNIONI_STANZE = {
  // Faro dei morti: l'arco del Fendente si allarga di «arco»; un nemico abbagliato che fa scattare una reazione (Eclissi,
  // Rivelazione, Interramento: ogni reazione che consuma la Luce) esplode in un lampo che ferisce i nemici entro «raggio» px
  // intorno a lui (non lui), con «danno» prima dei doni; il lampo non lascia stati (idea di Edoardo del 19/11; colori segnaposto)
  faro: { arco: 0.25, lampo: { raggio: 64, danno: 15, colore: '#fff1b8', bordo: '#ffffff' } },
  // Fuochi erranti: ogni nemico ucciso da un fuoco fatuo toglie tanti secondi alla ricarica di tutti gli Echi (Edoardo, 19/11)
  fuochi: { ricarica: 0.3 },
  // Stormo del lutto: un nemico beccato che muore entro «durata» secondi ti cura «cura» salute (Edoardo, 19/11)
  lutto: { durata: 3, cura: 2 },
  // Midollo Splendente: i ciechi si colpiscono tra loro; danno del graffio del Ricaduto e del grumo del Cantore a un altro
  // nemico (prima dei doni: Sale nero, Grazia e critico valgono come per le armi)
  midollo: { graffio: 20, grumo: 15 },
} as const;

/** L'aspetto della carta Unione (19/11): al posto del grado il nastro «Unione», con un bordo freddo suo (segnaposto). */
export const CARTA_UNIONE = { nome: 'Unione', bordo: '#9fd6e0', scelta: '#d8f0f4' } as const;

const num = (v: number): string => String(v).replace('.', ',');
const pc = (v: number): string => `${Math.round(v * 100)}%`;
const N = NUMERI_UNIONI_STANZE;

/** Le 12 Unioni delle stanze, una per Eco più la Lanterna (in quest'ordine compaiono quando ce n'è più d'una pronta). */
export const UNIONI_STANZE: Unione[] = [
  // le otto come nel survivor (stesso effetto, stessi numeri: NUMERI_UNIONI)
  { id: 'candelabroFunebre', arma: 'candela', dono: 'cuoreDiCera', nome: 'Candelabro funebre', testo: 'Le fiammelle lasciano una scia che brucia.' },
  { id: 'falceDelMietitore', arma: 'falce', dono: 'saleNero', nome: 'Falce di Seth', testo: `Uccide all'istante i nemici sotto il ${pc(U.falce.sotto)} di salute, i maledetti sotto il ${pc(U.falce.maledetti)} (mai i capi).` },
  { id: 'campanaAMorto', arma: 'campana', dono: 'ceraVotiva', nome: 'Campana a morto', testo: `Ogni rintocco ferma i nemici per ${num(U.campana.fermo)} s.` },
  { id: 'acquasantiera', arma: 'acquaSanta', dono: 'lacrimaDiLumen', nome: 'Acquasantiera', testo: `Ogni ${U.acquasantiera.uccisioni} uccisioni nelle pozze torna un sorso di fiaschetta, al massimo uno ogni ${U.acquasantiera.pausa} s.` },
  { id: 'lapideInchiodata', arma: 'lapide', dono: 'chiodoDiBara', nome: 'Lapide inchiodata', testo: `La lapide resta a terra ${num(U.lapide.resta)} s e seppellisce chi la tocca.` },
  { id: 'rosarioDeiVespri', arma: 'rosarioSpezzato', dono: 'specchio', nome: 'Rosario dei vespri', testo: 'Quando un grano uccide un maledetto, da lui riparte un grano nuovo (una volta per lancio).' },
  { id: 'sudario', arma: 'veloFunebre', dono: 'campanellaDArgento', nome: 'Sudario', testo: `In Grazia, finché un nemico è dentro il velo la Grazia non scade, fino a ${num(U.sudario.fino)} s in tutto.` },
  { id: 'selciato', arma: 'sampietrini', dono: 'scudoDiFerro', nome: 'Selciato', testo: 'Un sampietrino che colpisce un nemico fermo rimbalza una volta in più.' },
  // le quattro adattate (19/11)
  { id: 'faroDeiMorti', arma: 'lanterna', dono: 'stoppinoLungo', nome: 'Faro dei morti', testo: `L'arco del Fendente si allarga del ${pc(N.faro.arco)}; un nemico abbagliato che fa scattare una reazione esplode in un lampo di luce che ferisce chi gli sta vicino.` },
  { id: 'fuochiErranti', arma: 'fuocoFatuo', dono: 'clessidra', nome: 'Fuochi erranti', testo: `Ogni nemico ucciso da un fuoco toglie ${num(N.fuochi.ricarica)} s alla ricarica di tutti gli Echi.` },
  { id: 'stormoDelLutto', arma: 'corvo', dono: 'erbeAmare', nome: 'Stormo del lutto', testo: `Un nemico beccato che muore entro ${num(N.lutto.durata)} s ti cura ${num(N.lutto.cura)} salute.` },
  { id: 'midolloSplendente', arma: 'lamaDiLuce', dono: 'aliDiFalena', nome: 'Midollo Splendente', testo: 'I nemici ciechi si colpiscono tra loro: l\'attacco che sbaglia la mira ferisce gli altri nemici che trova.' },
];
