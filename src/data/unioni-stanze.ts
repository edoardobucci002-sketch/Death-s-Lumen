/*
 * Le Unioni del gioco a stanze (decisioni di Edoardo del 19/11, sulla proposta di Claude): un Eco o la Lanterna al livello
 * LIVELLO_ARMA_UNIONE_STANZE più il suo dono al massimo (livelloDonoUnione, in unioni.ts). La prima stanza ripulita dopo
 * offre la carta Unione in più (e il forziere del tesoro la offre al posto di una delle sue carte); se non la prendi,
 * ricompare alla stanza dopo; una per stanza. L'Unione dà solo l'effetto, non è un livello: l'arma può ancora salire al 5 e
 * Unione e potenziale si sommano. Disponibili da subito, senza sblocco nella Cappella (se ne riparla con il Mondo 2).
 * Le Unioni del survivor (src/data/unioni.ts) non cambiano: otto di queste usano il loro stesso effetto e i loro numeri
 * (NUMERI_UNIONI), tranne i ritocchi di «stanze» qui sotto; le quattro adattate hanno i numeri qui sotto. Tutti da rivedere.
 * Ritocchi del 19/11 (Edoardo, dai calcoli a Veglia di Claude; obiettivo: un'Unione vale circa +10% di danni o 100 salute a
 * Veglia): Candelabro, Faro e Stormo più deboli; Fuochi, Falce e Sudario più forti (docs/bilanciamento.md).
 */
import type { Unione } from './unioni';
import { NUMERI_UNIONI as U } from './unioni';

/** Il livello che serve all'arma (proposta del pivot: il 4 su 5). Il dono deve essere al suo massimo. */
export const LIVELLO_ARMA_UNIONE_STANZE = 4;

/** I numeri delle quattro Unioni adattate alle stanze (proposte di Claude del 19/11, da rivedere). */
export const NUMERI_UNIONI_STANZE = {
  // Faro dei morti: l'arco del Fendente si allarga di «arco»; un nemico abbagliato che fa scattare una reazione (Eclissi,
  // Rivelazione, Interramento: ogni reazione che consuma la Luce) esplode in un lampo che ferisce lui e i nemici entro «raggio»
  // px, con «danno» prima dei doni; il lampo non lascia stati (idea di Edoardo del 19/11; colori segnaposto). Misurato il 19/11:
  // a 64 px e 8 di danno, solo sui vicini, valeva circa +1% (colpiva quasi a vuoto): ora lui compreso, 96 px e 20 (Edoardo)
  faro: { arco: 0.25, lampo: { raggio: 96, danno: 20, colore: '#fff1b8', bordo: '#ffffff' } },
  // Fuochi erranti: ogni nemico ucciso da un fuoco fatuo toglie tanti secondi alla ricarica di tutti gli Echi (Edoardo, 19/11)
  fuochi: { ricarica: 0.8 }, // 0,3 → 0,8 (19/11)
  // Stormo del lutto: un nemico beccato che muore entro «durata» secondi ti cura «cura» salute (Edoardo, 19/11)
  lutto: { durata: 3, cura: 1 }, // cura 2 → 1 (19/11)
  // Midollo Splendente: i ciechi si colpiscono tra loro; danno del graffio del Ricaduto e del grumo del Cantore a un altro
  // nemico (prima dei doni: Sale nero, Grazia e critico valgono come per le armi). «polvere» (effetto nuovo, Edoardo 19/11):
  // camminando lasci una scia di polvere luminosa (un granello ogni «passo» px) che dura «durata» s; chi tocca un granello
  // (entro «raggio» px più il suo corpo) resta cieco «cecita» s, poi per «pausa» s la polvere non lo acceca più
  midollo: { graffio: 20, grumo: 15, polvere: { durata: 1, cecita: 2, pausa: 4, raggio: 10, passo: 8, colore: 0xfff1b8, scuro: 0xf6b86a } },
  // Lapide inchiodata (effetto nuovo, Edoardo 19/11): ogni colpo critico, di qualsiasi arma, toglie «critico» secondi
  // all'attesa della prossima Lapide (nel survivor resta la lapide che seppellisce chi la tocca)
  lapide: { critico: 1 }, // 2 → 1 (Edoardo, 19/11: con 2 valeva +17%)
  // le Unioni del survivor con numeri diversi nelle stanze (19/11; il survivor resta con NUMERI_UNIONI): la scia del
  // Candelabro fa il 15% del danno della fiammella (survivor 40%); la Falce di Seth uccide sotto il 30%, i maledetti sotto
  // il 50% (survivor 15% e 30%); il Sudario tiene la Grazia fino a 9 s in tutto (survivor 6)
  stanze: { candelabro: { danno: 0.15 }, falce: { sotto: 0.3, maledetti: 0.5 }, sudario: { fino: 9 } },
} as const;

/** L'aspetto della carta Unione (19/11): al posto del grado il nastro «Unione», con un bordo freddo suo (segnaposto). */
export const CARTA_UNIONE = { nome: 'Unione', bordo: '#9fd6e0', scelta: '#d8f0f4' } as const;

const num = (v: number): string => String(v).replace('.', ',');
const pc = (v: number): string => `${Math.round(v * 100)}%`;
const N = NUMERI_UNIONI_STANZE;

/** Le 12 Unioni delle stanze, una per Eco più la Lanterna (in quest'ordine compaiono quando ce n'è più d'una pronta). */
export const UNIONI_STANZE: Unione[] = [
  // le otto come nel survivor (stesso effetto, stessi numeri: NUMERI_UNIONI; Lapide inchiodata ha un effetto nuovo dal 19/11)
  { id: 'candelabroFunebre', arma: 'candela', dono: 'cuoreDiCera', nome: 'Candelabro funebre', testo: 'Le fiammelle lasciano una scia che brucia.' },
  { id: 'falceDelMietitore', arma: 'falce', dono: 'saleNero', nome: 'Falce di Seth', testo: `Uccide all'istante i nemici sotto il ${pc(N.stanze.falce.sotto)} di salute, i maledetti sotto il ${pc(N.stanze.falce.maledetti)} (mai i capi).` },
  { id: 'campanaAMorto', arma: 'campana', dono: 'ceraVotiva', nome: 'Campana a morto', testo: `Ogni rintocco ferma i nemici per ${num(U.campana.fermo)} s.` },
  { id: 'acquasantiera', arma: 'acquaSanta', dono: 'lacrimaDiLumen', nome: 'Acquasantiera', testo: `Ogni ${U.acquasantiera.uccisioni} uccisioni nelle pozze torna un sorso di fiaschetta, al massimo uno ogni ${U.acquasantiera.pausa} s.` },
  { id: 'lapideInchiodata', arma: 'lapide', dono: 'chiodoDiBara', nome: 'Lapide inchiodata', testo: `Ogni colpo critico toglie ${num(N.lapide.critico)} s all'attesa della prossima lapide.` },
  { id: 'rosarioDeiVespri', arma: 'rosarioSpezzato', dono: 'specchio', nome: 'Rosario dei vespri', testo: 'Quando un grano uccide un maledetto, da lui riparte un grano nuovo (una volta per lancio).' },
  { id: 'sudario', arma: 'veloFunebre', dono: 'campanellaDArgento', nome: 'Sudario', testo: `In Grazia, finché un nemico è dentro il velo la Grazia non scade, fino a ${num(N.stanze.sudario.fino)} s in tutto.` },
  { id: 'selciato', arma: 'sampietrini', dono: 'scudoDiFerro', nome: 'Selciato', testo: 'Un sampietrino che colpisce un nemico fermo rimbalza una volta in più.' },
  // le quattro adattate (19/11)
  { id: 'faroDeiMorti', arma: 'lanterna', dono: 'stoppinoLungo', nome: 'Faro dei morti', testo: `L'arco del Fendente si allarga del ${pc(N.faro.arco)}; un nemico abbagliato che fa scattare una reazione esplode in un lampo di luce che ferisce lui e chi gli sta vicino.` },
  { id: 'fuochiErranti', arma: 'fuocoFatuo', dono: 'clessidra', nome: 'Fuochi erranti', testo: `Ogni nemico ucciso da un fuoco toglie ${num(N.fuochi.ricarica)} s alla ricarica di tutti gli Echi.` },
  { id: 'stormoDelLutto', arma: 'corvo', dono: 'erbeAmare', nome: 'Stormo del lutto', testo: `Un nemico beccato che muore entro ${num(N.lutto.durata)} s ti cura ${num(N.lutto.cura)} salute.` },
  { id: 'midolloSplendente', arma: 'lamaDiLuce', dono: 'aliDiFalena', nome: 'Midollo Splendente', testo: `Camminando lasci una scia di polvere luminosa: chi la tocca resta cieco ${num(N.midollo.polvere.cecita)} s. I ciechi si colpiscono tra loro.` },
];
