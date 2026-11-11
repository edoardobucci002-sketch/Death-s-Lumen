/*
 * Unioni (tappa 6 della proposta su oggetti e build): un'arma al livello LIVELLO_ARMA_UNIONE più il suo dono
 * al livello massimo. Il reliquiario successivo offre l'unione: l'arma guadagna un effetto nuovo e continua a salire fino all'8.
 * Ogni modifica qui va riportata anche nel GDD (sezione 8f). Tempi in secondi, distanze in pixel di gioco.
 */
import type { IdArma } from './armi';
import { PASSIVI, type IdDono } from './doni';
import { STATI } from './stati';

/** Il livello che serve all'arma (decisione di Edoardo del 10/11: 6 invece di 8; da rivedere). Dopo l'unione l'arma sale fino all'8. */
export const LIVELLO_ARMA_UNIONE = 6;
/** Il livello che serve al dono: il suo massimo (decisione di Edoardo del 10/11). */
export const livelloDonoUnione = (id: IdDono): number => PASSIVI.find((q) => q.id === id)!.massimo;

export const NUMERI_UNIONI = {
  faro: { abbaglia: 0.5 }, // il cerchio abbaglia un nemico su due
  vanga: { fermo: 1.5 }, // chi è sotto il colpo resta fermo (da rivedere); poi per STATI.sepolto.pausa secondi la Vanga non lo ferma più
  // salute al secondo dentro le nubi (una nube sola conta); dentro le nubi i nemici rallentano almeno di «rallenta»,
  // ma in tutto (Consacrato compreso) non più del tetto del Consacrato, DEVOZIONE.lentoMassimo (decisione di Edoardo dell'11/11; da rivedere)
  incensiere: { cura: 1, rallenta: 0.5 },
  verga: { ogni: 5, danno: 1 }, // ogni tot raffiche, colpo a tutti i maledetti (1 = il danno di un dardo)
  candelabro: { ogni: 0.12, danno: 0.4, raggio: 36, durata: 1, intervallo: 0.3 }, // scia: una fiamma ogni 0,12 s, 40% del danno
  // uccide i nemici normali sotto questa parte di salute; quelli già maledetti prima del colpo sotto «maledetti» (decisione di Edoardo dell'11/11; da rivedere)
  falce: { sotto: 0.15, maledetti: 0.3 },
  campana: { fermo: 0.8 }, // ogni rintocco ferma
  fuochi: { raggio: 120 }, // anime che i fuochi portano con sé
  acquasantiera: {
    uccisioni: 40, pausa: 45, // uccisioni dentro le pozze per ogni sorso; al massimo un sorso ogni 45 s (da rivedere)
    // con la fiaschetta piena il sorso si versa nella pozza dove è morto il nemico: per 4 s cura il 3% della salute
    // massima al secondo a chi ci sta dentro, senza sommarsi con altre pozze (decisione di Edoardo del 10/11; valori da rivedere)
    curaDurata: 4, curaParte: 0.03, colore: 0xffe08a, // colore: tinta provvisoria della pozza che cura
  },
  lama: { ritardo: 0.5 }, // il secondo fendente parte dove eri tanti secondi prima
  selciato: { rimbalzi: 1 }, // un sampietrino che colpisce un nemico fermo rimbalza tante volte in più (una sola volta per sasso; da rivedere)
  // Unioni nuove dell'11/11 (nomi ed effetti di Edoardo; misure da rivedere)
  // la lapide resta a terra «resta» secondi (invece di LAPIDE.resta) e seppellisce chi la tocca, con la pausa del Sepolto;
  // «tocca»: pixel dal punto in cui è caduta, metà della lapide disegnata (24 px × 3, provvisoria: misura di Claude)
  lapide: { resta: 3, tocca: 36 },
  rosario: { ripartenze: 1 }, // da un maledetto ucciso da un grano riparte un grano nuovo; tante ripartenze per lancio
  // stormo: i corvi beccano per primi i nemici che con la Luce farebbero una reazione (Sacro, Ombra o Terra, fuori dalla quiete)
  sudario: { fino: 6, colore: 0xfff1b8 }, // in Grazia con un nemico nel velo la Grazia non scade, fino a 6 s in tutto; colore: velo provvisorio mentre la tiene
} as const;

const num = (v: number): string => String(v).replace('.', ',');
const N = NUMERI_UNIONI;

export type IdUnione = 'faroDeiMorti' | 'vangaDelCustode' | 'incensiereUltimaOra' | 'vergaDeiNomi' | 'candelabroFunebre' | 'falceDelMietitore' | 'campanaAMorto' | 'fuochiErranti' | 'acquasantiera' | 'lamaDellAlba' | 'selciato'
  | 'lapideInchiodata' | 'rosarioDeiVespri' | 'stormoDelLutto' | 'sudario';

export interface Unione { id: IdUnione; arma: IdArma; dono: IdDono; nome: string; testo: string }

export const UNIONI: Unione[] = [
  { id: 'faroDeiMorti', arma: 'lanterna', dono: 'stoppinoLungo', nome: 'Faro dei morti', testo: 'L\'arco diventa un cerchio tutto intorno e abbaglia molto più spesso.' },
  { id: 'vangaDelCustode', arma: 'pala', dono: 'scudoDiFerro', nome: 'Vanga del custode', testo: `Ogni colpo pianta una lapide: chi è sotto resta fermo ${num(N.vanga.fermo)} s (poi non prima di ${num(STATI.sepolto.pausa)} s).` },
  { id: 'incensiereUltimaOra', arma: 'turibolo', dono: 'erbeAmare', nome: "Incensiere dell'ultima ora", testo: `Dentro le nubi recuperi ${num(N.incensiere.cura)} salute al secondo e i nemici rallentano almeno del ${Math.round(N.incensiere.rallenta * 100)}%.` },
  { id: 'vergaDeiNomi', arma: 'bastone', dono: 'clessidra', nome: 'Verga dei nomi', testo: 'Ogni 5ª raffica colpisce tutti i nemici maledetti sullo schermo.' },
  { id: 'candelabroFunebre', arma: 'candela', dono: 'cuoreDiCera', nome: 'Candelabro funebre', testo: 'Le fiammelle lasciano una scia che brucia.' },
  { id: 'falceDelMietitore', arma: 'falce', dono: 'saleNero', nome: 'Falce di Seth', testo: `Uccide all'istante i nemici normali sotto il ${Math.round(N.falce.sotto * 100)}% di salute, i maledetti sotto il ${Math.round(N.falce.maledetti * 100)}%.` },
  { id: 'campanaAMorto', arma: 'campana', dono: 'ceraVotiva', nome: 'Campana a morto', testo: 'Ogni rintocco ferma i nemici per 0,8 s.' },
  { id: 'fuochiErranti', arma: 'fuocoFatuo', dono: 'calamita', nome: 'Fuochi erranti', testo: 'I fuochi raccolgono le anime che attraversano.' },
  { id: 'acquasantiera', arma: 'acquaSanta', dono: 'lacrimaDiLumen', nome: 'Acquasantiera', testo: `Ogni ${N.acquasantiera.uccisioni} uccisioni nelle pozze torna un sorso di fiaschetta, al massimo uno ogni ${N.acquasantiera.pausa} s.` },
  { id: 'lamaDellAlba', arma: 'lamaDiLuce', dono: 'aliDiFalena', nome: "Lama dell'alba", testo: 'Un secondo fendente parte da dove eri mezzo secondo prima.' },
  { id: 'selciato', arma: 'sampietrini', dono: 'scudoDiFerro', nome: 'Selciato', testo: 'Un sampietrino che colpisce un nemico fermo rimbalza una volta in più.' },
  { id: 'lapideInchiodata', arma: 'lapide', dono: 'chiodoDiBara', nome: 'Lapide inchiodata', testo: `La lapide resta a terra ${num(N.lapide.resta)} s e seppellisce chi la tocca.` },
  { id: 'rosarioDeiVespri', arma: 'rosarioSpezzato', dono: 'specchio', nome: 'Rosario dei vespri', testo: 'Quando un grano uccide un nemico maledetto, da lui riparte un grano nuovo (una volta per lancio).' },
  { id: 'stormoDelLutto', arma: 'corvo', dono: 'calamita', nome: 'Stormo del lutto', testo: 'I corvi beccano per primi i nemici consacrati, maledetti o sepolti: ogni beccata fa una reazione.' },
  { id: 'sudario', arma: 'veloFunebre', dono: 'campanellaDArgento', nome: 'Sudario', testo: `In Grazia, finché un nemico è dentro il velo la Grazia non scade, fino a ${num(N.sudario.fino)} s in tutto.` },
];

export const unioneDi = (arma: IdArma): Unione | undefined => UNIONI.find((u) => u.arma === arma);
export const iconaUnione = (id: IdUnione): string => `Icona_Unione_${id}`;
