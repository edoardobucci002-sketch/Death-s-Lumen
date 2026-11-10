/*
 * Affinità, stati e reazioni (tappa 3 della proposta su oggetti e build, M8).
 * Ogni arma ha un'affinità: colpendo lascia sul nemico uno stato di qualche secondo.
 * Due stati diversi sullo stesso nemico si consumano e fanno una reazione.
 * Tempi in secondi, distanze in pixel di gioco. Ogni modifica qui va riportata anche nel GDD.
 */
import type { IdArma } from './armi';
import type { IdAbilita } from './abilita';

export type IdAffinita = 'luce' | 'sacro' | 'ombra' | 'terra';

/** Affinità di ogni arma e di ogni abilità speciale. */
export const AFFINITA_ARMI: Record<IdArma, IdAffinita> = {
  lanterna: 'luce', candela: 'luce', lamaDiLuce: 'luce',
  turibolo: 'sacro', acquaSanta: 'sacro', campana: 'sacro',
  bastone: 'ombra', fuocoFatuo: 'ombra', falce: 'ombra',
  pala: 'terra',
  lapide: 'terra', rosarioSpezzato: 'ombra', corvo: 'luce', veloFunebre: 'sacro',
};
export const AFFINITA_ABILITA: Record<IdAbilita, IdAffinita> = {
  cerchioDiLuce: 'luce', benedizione: 'sacro', ritoProibito: 'ombra', sepoltura: 'terra',
};

/** Gli stati: durano STATI.durata secondi (tranne Sepolto); si leggono da un simbolo sopra la testa del nemico, del colore del personaggio dell'affinità. */
export const STATI = {
  durata: 3,
  // un colpo lascia lo stato solo con questa probabilità: con ogni colpo le reazioni erano circa 2000 al minuto
  probabilita: 0.1,
  probabilitaZone: 0.05, // nubi, pozze e abilità feriscono ogni 0,3 s: tirano il dado più spesso, quindi la metà
  abbagliato: { danno: 0.15, colore: 0xe3913a }, // Luce: subisce +15% danno (ambra del Lampionaio)
  consacrato: { lento: 0.25, colore: 0xdcc07a }, // Sacro: va più lento del 25% (oro della Badessa)
  maledetto: { perSecondo: 0.02, colore: 0xa57ae0 }, // Ombra: perde il 2% della salute massima al secondo (viola della Strega)
  sepolto: { fermo: 0.6, pausa: 4, colore: 0xb89a74 }, // Terra: fermo 0,6 s, poi non può esserlo di nuovo per 4 s (seppia del Becchino)
  // grandezza (numero intero), pixel sopra la testa, quanti al massimo sullo schermo (da rivedere; vale dalla prossima partita).
  // Il simbolo si vede solo su bruti, élite e Seth: sui nemici comuni lo stato funziona lo stesso, senza simbolo
  simboli: { ingrandimento: 2, distanza: 2, massimi: 40 },
  // il Mietitore resiste: stati di Terra (e Interramento) a metà durata, maledizione a un decimo
  mietitore: { fermo: 0.5, maledetto: 0.1 },
  elite: { maledetto: 0.4 }, // le élite perdono il 40% di quello che perde un nemico normale
} as const;

/** Le reazioni: due stati diversi sullo stesso nemico si consumano e fanno questo. */
export const REAZIONI = {
  // Luce + Ombra: esplosione intorno al nemico, danno = parte della sua salute massima (con un tetto)
  eclissi: { raggio: 64, parte: 0.1, tetto: 80, colore: '#c9a0ff', bordo: '#ffffff' },
  // Luce + Sacro: il nemico lascia il doppio delle anime
  rivelazione: { anime: 2, raggio: 36, colore: '#ffe08a', bordo: '#ffffff' },
  // Sacro + Ombra: dal nemico partono fiammelle che inseguono i vicini
  esorcismo: { fiammelle: 3, danno: 18, velocita: 420, vita: 1.6, raggio: 36, colore: '#e8dcc4', bordo: '#ffffff' },
  // Terra + qualsiasi altro: fermo a lungo e più vulnerabile
  interramento: { fermo: 1.5, danno: 0.3, raggio: 44, colore: '#b89a74', bordo: '#2a1f17' },
  // il nome della reazione sale sopra il nemico; lo stesso nome non torna prima di «pausa» secondi.
  // Valori da rivedere: massimi = nomi insieme sullo schermo (oltre non si creano, la reazione avviene lo stesso);
  // lontano = pixel di gioco dal personaggio dentro cui il nome non entra; colori = quelli degli stati (valgono dal prossimo avvio)
  etichetta: {
    ingrandimento: 2, durata: 0.9, sale: 44, pausa: 2, massimi: 3, lontano: 90,
    sopra: 34, // il nome parte così in alto sul punto della reazione, per non toccare il numero che sale (da rivedere)
    staccoNumero: 16, // quando il nome viene spostato sopra il cerchio, sta così più in alto del numero della reazione (da rivedere)
    colori: { eclissi: STATI.maledetto.colore, rivelazione: STATI.consacrato.colore, esorcismo: STATI.abbagliato.colore, interramento: STATI.sepolto.colore },
  },
  durataEffetto: 0.5, // il cerchio della reazione: metà pieno, metà a retino (era 0,25: non si faceva in tempo a vederlo)
  ingrandimentoEffetto: 1.35, // il cerchio si disegna più largo dell'area vera, per leggerlo meglio
} as const;

/** Ruoli nuovi delle armi (tappa 3). */
export const RUOLI = {
  esplosioneBastone: { raggio: 40, danno: 0.35 }, // l'esplosione del dardo ferisce intorno al 35% del danno
  fuocoFatuoPreda: 0.25, // il fuoco fatuo vede élite e Mietitore 4 volte più vicini di quanto sono: li insegue per primi
  falceCrescita: { perUccisione: 0.02, massimo: 0.3, durata: 5 }, // ogni uccisione allunga la lama del 2% per 5 s
  campanaFermo: 0.6, // il secondo rintocco ferma i nemici per 0,6 s
  lapideSeppellisce: 1, // probabilità di lasciare Sepolto a chi è sotto la lapide
  rosarioMaledice: 0.35, // probabilità di maledire a ogni rimbalzo
  veloConsacra: 0.2, // probabilità di consacrare a ogni colpo dell'aura
} as const;

/**
 * Stati certi: una prova, accesa dall'interruttore «Stati certi» del Laboratorio (spento di partenza) o, per il bot,
 * da ?stati=certi. Spento, il gioco è identico a prima. Acceso, ogni colpo lascia lo stato della sua affinità
 * (STATI.probabilita, STATI.probabilitaZone, RUOLI.rosarioMaledice e RUOLI.veloConsacra non contano) e valgono questi numeri.
 * Tutti da rivedere (proposta di Edoardo del 10/11, valori ancora da provare).
 */
export const STATI_CERTI = {
  quiete: 3, // dopo una reazione il nemico non può reagire di nuovo per 3 s; gli stati li riceve lo stesso (le abilità la ignorano al primo scatto)
  // Eclissi: su nemici normali e bruti il 10% della salute massima, senza tetto; su élite e Seth il doppio del danno del colpo
  // che la innesca (senza colpo, cioè da Lucciola, Martire o Laboratorio, vale il tetto di REAZIONI.eclissi)
  eclissi: { parte: 0.1, colpoElite: 2 },
  // Esorcismo: 3 fiammelle, ognuna al 60% del danno del colpo che la innesca (senza colpo: REAZIONI.esorcismo.danno)
  esorcismo: { fiammelle: 3, colpo: 0.6 },
  rivelazione: { anime: 0.5, minimo: 1 }, // +50% anime, almeno +1, una volta per nemico
  // Interramento: come sempre, più un effetto dallo stato consumato
  interramento: {
    dannoLuce: 0.5, // Luce: subisce +50% danno invece di +30%
    fermoSacro: 2.5, // Sacro: fermo 2,5 s invece di 1,5 (Seth a metà)
    maledettoOmbra: 2, // Ombra: durante l'Interramento la maledizione continua, al doppio
  },
  // Disegno: sui nemici comuni il nome della reazione non compare; al massimo tanti cerchi delle reazioni sullo schermo
  // (oltre, la reazione avviene senza disegno)
  cerchiMassimi: 12,
} as const;
