/*
 * Le armi del gioco a stanze: 5 livelli e un danno a intervallo (decisioni di Edoardo del 13/11 e del 14/11).
 * Il survivor resta con le sue tabelle a 8 livelli (src/data/armi.ts): qui ci sono solo i numeri del gioco a stanze.
 *
 * - «danno» è il colpo più debole e «dannoMassimo» il più forte: ogni colpo tira a caso tra i due (con il generatore
 *   con seme), poi si applicano i doni in percentuale (Sale nero, Grazia) e il colpo critico.
 * - Ogni arma ha il suo carattere: le armi pesanti hanno un intervallo largo (Lapide, Campana), le aure e le pozze
 *   uno stretto e piccolo (Velo funebre, Acqua santa), perché feriscono tante volte al secondo.
 * - Il livello 5 è il «potenziale» dell'arma (proposta del pivot; «potenziale: true»): un effetto nuovo, scelto da Edoardo
 *   il 14/11 per ogni Eco (i suoi numeri sono in POTENZIALI, qui sotto). La Lanterna al livello 5 colpisce anche alle spalle.
 * - I campi che non sono livelli (velocità dei proiettili, rimbalzi, spinta…) sono quelli del survivor.
 * - «testo»: al livello 1 la descrizione e al 5 l'effetto del potenziale, scritti a mano; ai livelli 2–4 c'è AUTO e la riga
 *   la genera il gioco dai numeri (rigaLivello in src/data/glossario.ts, glossario del 16/11).
 *
 * Tutti i numeri sono proposte di Claude del 14/11, da rivedere con le prove di Edoardo.
 */
import {
  ACQUA_SANTA, CAMPANA, CANDELA, CORVO, FALCE, FUOCO_FATUO, LAMA_DI_LUCE, LANTERNA, LAPIDE, ROSARIO_SPEZZATO, SAMPIETRINI, VELO_FUNEBRE,
  type AcquaSanta, type Arma, type Campana, type Candela, type Corvo, type Falce, type FuocoFatuo, type LamaDiLuce, type Lanterna,
  type Lapide, type RosarioSpezzato, type Sampietrini, type VeloFunebre,
} from './armi';
import { AUTO, rigaLivello } from './glossario';

/** Un'arma del survivor con i livelli del gioco a stanze: ogni livello ha anche il danno massimo. */
type ConIntervallo<A extends Arma> = Omit<A, 'livelli'> & { livelli: (A['livelli'][number] & { dannoMassimo: number; potenziale?: boolean })[] };

/**
 * La Lanterna a mano del Lampionaio (attacco a tasto, src/sistema/attacco.ts). La ricarica è quella del colpo a mano
 * (la mossa dell'animazione attack dura 0,385 s); raggio 136, 160 e 183 sono le tre misure del Fendente pixelfx.
 * Al livello 5 colpisce anche alle spalle.
 */
export const LANTERNA_STANZE: ConIntervallo<Lanterna> = {
  ...LANTERNA,
  livelli: [
    { ricarica: 0.45, danno: 12, dannoMassimo: 18, raggio: 136, ampiezza: 132, spalle: false, testo: 'Un colpo corto, in un arco ampio davanti a te.' },
    { ricarica: 0.45, danno: 16, dannoMassimo: 24, raggio: 136, ampiezza: 132, spalle: false, testo: AUTO },
    { ricarica: 0.4, danno: 16, dannoMassimo: 24, raggio: 160, ampiezza: 132, spalle: false, testo: AUTO },
    { ricarica: 0.4, danno: 21, dannoMassimo: 31, raggio: 183, ampiezza: 166, spalle: false, testo: AUTO },
    { ricarica: 0.4, danno: 26, dannoMassimo: 38, raggio: 183, ampiezza: 166, spalle: true, testo: 'Colpisce anche alle spalle.' },
  ],
};

const CANDELA_STANZE: ConIntervallo<Candela> = {
  ...CANDELA,
  livelli: [
    { ricarica: 0.95, danno: 6, dannoMassimo: 9, quantita: 1, trapassa: 1, testo: 'Lancia fiammelle verso il nemico più vicino.' },
    { ricarica: 0.95, danno: 6, dannoMassimo: 9, quantita: 2, trapassa: 1, testo: AUTO },
    { ricarica: 0.95, danno: 8, dannoMassimo: 12, quantita: 2, trapassa: 2, testo: AUTO },
    { ricarica: 0.75, danno: 8, dannoMassimo: 12, quantita: 3, trapassa: 2, testo: AUTO },
    { ricarica: 0.75, danno: 11, dannoMassimo: 16, quantita: 3, trapassa: 3, potenziale: true, testo: 'Una fiammella che uccide si divide in 2, a metà danno.' },
  ],
};

const FALCE_STANZE: ConIntervallo<Falce> = {
  ...FALCE,
  livelli: [
    { quantita: 1, danno: 5, dannoMassimo: 7, raggio: 132, giri: 0.45, testo: 'Una falce spettrale ti ruota intorno.' },
    { quantita: 2, danno: 5, dannoMassimo: 7, raggio: 132, giri: 0.45, testo: AUTO },
    { quantita: 2, danno: 7, dannoMassimo: 9, raggio: 160, giri: 0.45, testo: AUTO },
    { quantita: 3, danno: 7, dannoMassimo: 9, raggio: 160, giri: 0.45, testo: AUTO },
    { quantita: 4, danno: 9, dannoMassimo: 12, raggio: 132, giri: 0.59, potenziale: true, testo: 'Metà delle falci gira al contrario, su un cerchio più largo. A salute piena ogni colpo ti dà il 10% del danno come salute in più.' },
  ],
};

const CAMPANA_STANZE: ConIntervallo<Campana> = {
  ...CAMPANA,
  livelli: [
    { ricarica: 2.6, danno: 14, dannoMassimo: 24, raggio: 197, doppio: false, testo: 'Rintocchi che respingono e feriscono tutto intorno.' },
    { ricarica: 2.6, danno: 19, dannoMassimo: 31, raggio: 197, doppio: false, testo: AUTO },
    { ricarica: 2.2, danno: 19, dannoMassimo: 31, raggio: 240, doppio: false, testo: AUTO },
    { ricarica: 2.2, danno: 25, dannoMassimo: 41, raggio: 240, doppio: false, testo: AUTO },
    { ricarica: 2.6, danno: 30, dannoMassimo: 50, raggio: 240, doppio: false, potenziale: true, testo: 'Il rintocco interrompe la carica dei nemici, ma la ricarica è più lunga.' },
  ],
};

const FUOCO_FATUO_STANZE: ConIntervallo<FuocoFatuo> = {
  ...FUOCO_FATUO,
  livelli: [
    { ricarica: 1.3, quantita: 1, danno: 7, dannoMassimo: 11, trapassa: 1, testo: 'Fuochi fatui che inseguono i nemici, prima élite e capi.' },
    { ricarica: 1.3, quantita: 2, danno: 7, dannoMassimo: 11, trapassa: 1, testo: AUTO },
    { ricarica: 1.3, quantita: 2, danno: 10, dannoMassimo: 15, trapassa: 1, testo: AUTO },
    { ricarica: 1, quantita: 3, danno: 10, dannoMassimo: 15, trapassa: 1, testo: AUTO },
    { ricarica: 1, quantita: 4, danno: 13, dannoMassimo: 20, trapassa: 1, potenziale: true, testo: 'Il primo nemico che un fuoco trapassa lo ritrova: il fuoco rimbalza sul muro e torna a colpirlo.' },
  ],
};

/** Le pozze feriscono ogni 0,3 s (ACQUA_SANTA.intervallo): danno piccolo e stretto. */
const ACQUA_SANTA_STANZE: ConIntervallo<AcquaSanta> = {
  ...ACQUA_SANTA,
  livelli: [
    { ricarica: 2.8, quantita: 1, danno: 1, dannoMassimo: 2, raggio: 89, durata: 2.6, testo: 'Fiale che lasciano pozze benedette sui nemici.' },
    { ricarica: 2.8, quantita: 2, danno: 1, dannoMassimo: 2, raggio: 89, durata: 2.6, testo: AUTO },
    { ricarica: 2.8, quantita: 2, danno: 2, dannoMassimo: 3, raggio: 108, durata: 2.6, testo: AUTO },
    { ricarica: 2.3, quantita: 3, danno: 2, dannoMassimo: 3, raggio: 108, durata: 3.2, testo: AUTO },
    { ricarica: 2.3, quantita: 4, danno: 3, dannoMassimo: 4, raggio: 129, durata: 4.2, potenziale: true, testo: 'Dentro le pozze recuperi 1 salute al secondo.' },
  ],
};

/**
 * Lama di luce rifatta (16/11, decisione di Edoardo): non colpisce più. Quando fai una schivata perfetta accieca chi hai
 * schivato, in più della Grazia. «cecita» = secondi in cui il nemico è cieco; «sviamento» = di quanti gradi sbaglia la mira
 * dei suoi attacchi (il graffio del Ricaduto è largo 110°: sopra i 55° da ogni lato lo manca). Danno e ricarica restano
 * a zero e lunghi: servono solo ai tipi. Numeri di Claude, da rivedere.
 */
const LAMA_DI_LUCE_STANZE: ConIntervallo<LamaDiLuce> = {
  ...LAMA_DI_LUCE,
  nome: 'Abbacinio', // nuovo nome nel gioco a stanze (scelta di Edoardo, 17/11; per poco si è chiamata Gerico); l'id interno e l'icona restano «lamaDiLuce»
  livelli: [
    { ricarica: 99, danno: 0, dannoMassimo: 0, lunghezza: 0, spalle: false, cecita: 3, sviamento: 80, testo: 'Se schivi un attacco al momento giusto, chi lo ha lanciato resta cieco 3 s e sbaglia la mira.' },
    { ricarica: 99, danno: 0, dannoMassimo: 0, lunghezza: 0, spalle: false, cecita: 3.5, sviamento: 85, testo: AUTO },
    { ricarica: 99, danno: 0, dannoMassimo: 0, lunghezza: 0, spalle: false, cecita: 4, sviamento: 90, testo: AUTO },
    { ricarica: 99, danno: 0, dannoMassimo: 0, lunghezza: 0, spalle: false, cecita: 4.5, sviamento: 95, testo: AUTO },
    { ricarica: 99, danno: 0, dannoMassimo: 0, lunghezza: 0, spalle: false, cecita: 5, sviamento: 100, potenziale: true, testo: 'La cecità si estende ai nemici vicini a chi hai schivato.' },
  ],
};

/** Arma pesante: l'intervallo più largo (a volte schiaccia un Ricaduto, a volte no). */
const LAPIDE_STANZE: ConIntervallo<Lapide> = {
  ...LAPIDE,
  livelli: [
    { ricarica: 3.2, danno: 30, dannoMassimo: 70, raggio: 84, quantita: 1, testo: 'Cade sul nemico con più salute in vista e lo seppellisce.' },
    { ricarica: 3.2, danno: 40, dannoMassimo: 90, raggio: 96, quantita: 1, testo: AUTO },
    { ricarica: 2.8, danno: 40, dannoMassimo: 90, raggio: 96, quantita: 1, testo: AUTO },
    { ricarica: 2.8, danno: 50, dannoMassimo: 110, raggio: 96, quantita: 2, testo: AUTO },
    { ricarica: 3.2, danno: 70, dannoMassimo: 150, raggio: 110, quantita: 2, potenziale: true, testo: 'La lapide resta in piedi 3 s e blocca nemici e grumi.' },
  ],
};

const ROSARIO_SPEZZATO_STANZE: ConIntervallo<RosarioSpezzato> = {
  ...ROSARIO_SPEZZATO,
  livelli: [
    { ricarica: 1.6, danno: 6, dannoMassimo: 10, rimbalzi: 4, quantita: 1, testo: 'Un grano rimbalza tra i nemici vicini e li maledice.' },
    { ricarica: 1.6, danno: 8, dannoMassimo: 13, rimbalzi: 4, quantita: 1, testo: AUTO },
    { ricarica: 1.4, danno: 8, dannoMassimo: 13, rimbalzi: 5, quantita: 1, testo: AUTO },
    { ricarica: 1.4, danno: 8, dannoMassimo: 13, rimbalzi: 6, quantita: 2, testo: AUTO },
    { ricarica: 1.2, danno: 12, dannoMassimo: 19, rimbalzi: 8, quantita: 2, potenziale: true, testo: 'Ogni rimbalzo fa il 15% di danno in più del precedente.' },
  ],
};

const CORVO_STANZE: ConIntervallo<Corvo> = {
  ...CORVO,
  livelli: [
    { ricarica: 1, danno: 8, dannoMassimo: 14, quantita: 1, testo: 'Becca il nemico più vicino e ti riporta le anime intorno a lui.' },
    { ricarica: 1, danno: 11, dannoMassimo: 18, quantita: 1, testo: AUTO },
    { ricarica: 0.9, danno: 11, dannoMassimo: 18, quantita: 2, testo: AUTO },
    { ricarica: 0.9, danno: 14, dannoMassimo: 22, quantita: 2, testo: AUTO },
    { ricarica: 0.75, danno: 14, dannoMassimo: 22, quantita: 3, potenziale: true, testo: 'Il nemico beccato subisce +20% di danno per 3 s.' },
  ],
};

/** Aura che ferisce a ogni ricarica: nel survivor (7 ogni 0,5 s) era fin troppo forte nelle prime stanze (Edoardo, 14/11). */
const VELO_FUNEBRE_STANZE: ConIntervallo<VeloFunebre> = {
  ...VELO_FUNEBRE,
  livelli: [
    { ricarica: 0.5, danno: 2, dannoMassimo: 3, raggio: 110, testo: 'Un\'aura intorno a te consacra chi entra.' },
    { ricarica: 0.5, danno: 3, dannoMassimo: 4, raggio: 110, testo: AUTO },
    { ricarica: 0.5, danno: 3, dannoMassimo: 4, raggio: 125, testo: AUTO },
    { ricarica: 0.4, danno: 3, dannoMassimo: 4, raggio: 140, testo: AUTO },
    { ricarica: 0.4, danno: 4, dannoMassimo: 6, raggio: 160, potenziale: true, testo: 'Mentre stai fermo il velo si allarga fino al doppio.' },
  ],
};

const SAMPIETRINI_STANZE: ConIntervallo<Sampietrini> = {
  ...SAMPIETRINI,
  livelli: [
    { ricarica: 1.5, quantita: 1, rimbalzi: 1, danno: 8, dannoMassimo: 14, testo: 'Lancia un sampietrino sul nemico più vicino: colpisce, rimbalza in avanti e colpisce di nuovo.' },
    { ricarica: 1.5, quantita: 2, rimbalzi: 1, danno: 8, dannoMassimo: 14, testo: AUTO },
    { ricarica: 1.35, quantita: 2, rimbalzi: 1, danno: 11, dannoMassimo: 18, testo: AUTO },
    { ricarica: 1.35, quantita: 2, rimbalzi: 2, danno: 11, dannoMassimo: 18, testo: AUTO },
    { ricarica: 1.2, quantita: 3, rimbalzi: 2, danno: 14, dannoMassimo: 22, potenziale: true, testo: 'Il sasso rimbalza verso il nemico più vicino.' },
  ],
};

/**
 * I potenziali del livello 5 (scelti da Edoardo il 14/11 tra 5 proposte per Eco; i numeri sono di Claude, da rivedere).
 */
export const POTENZIALI = {
  candela: { figlie: 2, apertura: 0.7, sterzo: 6, vita: 0.9, danno: 0.5 }, // una fiammella che uccide si divide in 2 (aperte di 0,7 rad, inseguono, vivono 0,9 s, metà danno; non si dividono più)
  falce: { anello: 1.35, furto: 0.1, tetto: 0.2 }, // metà delle falci gira al contrario su un cerchio 1,35 volte più largo; a salute piena ogni colpo ruba il 10% del danno inflitto come salute in più, fino al 20% della massima (sotto il massimo non ruba niente; dura tutta la Veglia)
  campana: {}, // il rintocco interrompe gli avvisi dei nemici nel suo raggio; in cambio la ricarica sale (vedi il livello 5)
  fuocoFatuo: { ritorno: 1.5, sterzo: 10, danno: 0.7 }, // trapassato il primo nemico va dritto al muro, rimbalza e torna da lui: dopo il muro vive almeno 1,5 s e gira più svelto (10); il colpo del ritorno fa il 70% del danno
  acquaSanta: { cura: 1 }, // salute al secondo dentro una pozza (le pozze non si sommano)
  lamaDiLuce: { raggio: 150 }, // al potenziale la cecità passa anche ai nemici entro 150 px da chi hai schivato (da rivedere)
  lapide: { resta: 3, raggio: 22 }, // resta in piedi 3 s come un muro largo 22 px: nemici e grumi non passano
  rosarioSpezzato: { crescita: 0.15 }, // ogni rimbalzo +15% sul precedente
  corvo: { danno: 0.2, durata: 3 }, // il nemico beccato subisce +20% di danno da tutto per 3 s
  veloFunebre: { crescita: 1, allarga: 1.5, stringe: 0.4 }, // fermo, il raggio cresce fino a ×2 in 1,5 s; camminando torna normale in 0,4 s
  sampietrini: { cerca: 220 }, // il rimbalzo va verso il nemico più vicino entro 220 px dal punto in cui il sasso tocca terra
} as const;

/**
 * Il grano del Rosario spezzato nel gioco a stanze (16/11, richiesta di Edoardo: «manca l'animazione di lancio»; numeri di
 * Claude, da rivedere): invece di saltare all'istante da un nemico all'altro, vola per «durata» secondi con un piccolo arco
 * alto «arco» px e colpisce quando arriva. Gli effetti sono disegnati con pixelfx (tools/pixelfx/fx/rosario): il grano in
 * volo e il colpo, con i loro perni (il punto del foglio che cade sul grano e sul nemico) e «fps» fotogrammi al secondo.
 */
export const ROSARIO_VOLO = {
  durata: 0.14, arco: 10,
  grano: 'Pixelfx_Rosario_grano', pernoGrano: [8, 8], colpo: 'Pixelfx_Rosario_colpo', pernoColpo: [25, 20], fps: 12,
} as const;

/** Gli Echi che le carte del gioco a stanze possono offrire (le armi comuni del survivor, con i numeri di qui). */
export const ECHI_STANZE: Arma[] = [
  CANDELA_STANZE, FALCE_STANZE, CAMPANA_STANZE, FUOCO_FATUO_STANZE, ACQUA_SANTA_STANZE, LAMA_DI_LUCE_STANZE, LAPIDE_STANZE,
  ROSARIO_SPEZZATO_STANZE, CORVO_STANZE, VELO_FUNEBRE_STANZE, SAMPIETRINI_STANZE,
] as Arma[];

// le righe dei livelli 2–4 (AUTO) le scrive il gioco dai numeri: così carte, pausa, LAB e GDD dicono la stessa cosa
for (const arma of [LANTERNA_STANZE, ...ECHI_STANZE]) {
  const L = arma.livelli as unknown as Record<string, unknown>[];
  for (let i = 1; i < L.length; i++) if (L[i].testo === AUTO) L[i].testo = rigaLivello(L[i - 1], L[i]);
}

/** Il danno più forte di un livello: per le armi con l'intervallo è dannoMassimo, altrimenti il danno stesso. */
export function dannoMassimo(livello: { danno: number }): number {
  const m = (livello as { dannoMassimo?: number }).dannoMassimo;
  return typeof m === 'number' ? m : livello.danno;
}
