/*
 * Nemici, comparse e difficoltà. Valori di partenza dal GDD (docs/GDD_base.md, sezioni 6, 7 e 10),
 * con distanze e velocità della v0 × 2,35. Ogni modifica qui va riportata anche nel GDD.
 */
export interface TipoNemico {
  id: 'pipistrello' | 'zombi' | 'fantasma' | 'scheletro' | 'segugio' | 'bruto' | 'mietitore';
  sprite: string; // chiave dell'asset: NEMICI/<Nome>/<Nome>_V#.aseprite
  salute: number;
  velocita: number; // pixel al secondo
  danno: number;
  raggio: number; // per i contatti, in pixel di gioco
  anime: number; // esperienza lasciata (dalla M3)
  attraversa: boolean; // passa attraverso gli altri nemici
  pesante: boolean; // subisce solo un quarto della respinta
  /** Quanto spesso compare rispetto agli altri, dato il tempo di gioco in secondi (0 = non ancora). */
  peso: (s: number) => number;
}

export const NEMICI: TipoNemico[] = [
  { id: 'pipistrello', sprite: 'Pipistrello', salute: 6, velocita: 179, danno: 5, raggio: 16, anime: 1, attraversa: false, pesante: false,
    peso: (s) => Math.max(0.7, 3 - s / 200) },
  { id: 'zombi', sprite: 'Zombi', salute: 16, velocita: 87, danno: 8, raggio: 21, anime: 2, attraversa: false, pesante: false,
    peso: (s) => (s < 480 ? 3 : 1.5) },
  { id: 'fantasma', sprite: 'Fantasma', salute: 13, velocita: 129, danno: 7, raggio: 21, anime: 2, attraversa: true, pesante: false,
    peso: (s) => (s >= 50 ? 2 : 0) },
  { id: 'scheletro', sprite: 'Scheletro', salute: 34, velocita: 106, danno: 10, raggio: 21, anime: 3, attraversa: false, pesante: false,
    peso: (s) => (s >= 140 ? 2.6 : 0) },
  { id: 'segugio', sprite: 'Segugio', salute: 28, velocita: 200, danno: 9, raggio: 21, anime: 3, attraversa: false, pesante: false,
    peso: (s) => (s >= 230 ? 2 : 0) },
  { id: 'bruto', sprite: 'Bruto', salute: 150, velocita: 78, danno: 18, raggio: 38, anime: 8, attraversa: false, pesante: true,
    peso: (s) => (s >= 360 ? 1 + s / 600 : 0) },
  // il Mietitore non compare a caso: arriva ai minuti indicati in MIETITORE
  { id: 'mietitore', sprite: 'Il_Mietitore', salute: 3200, velocita: 118, danno: 22, raggio: 61, anime: 60, attraversa: true, pesante: true,
    peso: () => 0 },
];

/** Il Mietitore, il boss (GDD, sezione 6). Raggio e velocità della v0 × 2,35. */
export const MIETITORE = {
  minuti: [5, 10],
  saluteSecondo: 1.7, // al minuto 10 ha salute ×1,7 rispetto a quella del minuto 5 (già scalata con il tempo)
  cammina: [3, 5], // cammina verso di te per 3-5 s…
  carica: 0.7, // …poi si ferma pulsando di rosso…
  scatto: 0.55, // …e scatta per 0,55 s…
  velocitaScatto: 3.6, // …a 3,6 volte la sua velocità, verso dove ti trovavi
  reliquiari: 2,
  rallentamento: 0.5, // subisce i rallentamenti a metà…
  attrazione: 0.25, // …e l'attrazione del Rito a un quarto; la respinta per niente
} as const;

/** Élite: ogni 55 s un nemico normale potenziato, con un alone ambra. Lascia un reliquiario. */
export const ELITE = {
  primo: 55, // secondi
  ogni: 55,
  salute: 7,
  danno: 1.4,
  anime: 6,
  dimensione: 1.5,
  velocita: 0.9,
  alone: 0x6a3a00, // colore aggiunto allo sprite (ambra)
} as const;

/** Sciami: all'inizio di ogni minuto (tranne il 5° e il 10°, fino al 14°) ti circondano. */
export const SCIAMI = {
  base: 14, // 14 + 3 nemici per minuto, fino a 56
  perMinuto: 3,
  massimo: 56,
  velocita: 1.12, // +12%
  saltaMinuti: [5, 10],
  ultimoMinuto: 14,
  pipistrelliFinoAl: 6, // pipistrelli fino al 6° minuto, poi fantasmi
} as const;

/** Un nemico prende i valori del momento in cui nasce (m = minuti di gioco). */
export const DIFFICOLTA = {
  salutePerMinuto: 0.34, // salute = base × (1 + 0,34 m)
  dannoPerMinuto: 0.09, // danno = base × (1 + 0,09 m)
  massimiBase: 20, // nemici massimi in campo = min(tetto, 20 + 30 m)
  massimiPerMinuto: 30,
  tetto: 380,
  comparseBase: 1.2, // comparse al secondo = 1,2 + 2,5 m
  comparsePerMinuto: 2.5,
  comparsePerFotogramma: 8, // al massimo
  sogliaRinforzo: 0.4, // sotto il 40% del massimo in campo…
  rinforzoPerFotogramma: 2, // …arrivano 2 nemici in più a ogni fotogramma
  variazioneVelocita: 0.1, // ±10% a caso
} as const;

/** Dove nascono i nemici e quando vengono ricollocati. */
export const COMPARSA = {
  margine: 48, // quanto fuori dal bordo dello schermo nascono
  lontananza: 2.2, // ricollocato se esce dallo schermo di più di 2,2 volte il margine…
  ventaglio: 0.7, // …davanti al giocatore, entro ±0,7 radianti dalla sua direzione
} as const;

/** Spinta tra nemici che si sovrappongono (0 = si accalcano, 1 = si separano subito). */
export const SEPARAZIONE = {
  forza: 0.5,
  tolleranza: 0.75, // si toccano quando la distanza è sotto il 75% della somma dei raggi
} as const;

/** Regole di combattimento (GDD, sezione 10). */
export const COMBATTIMENTO = {
  raggioGiocatore: 21, // 9 nella v0
  invulnerabilita: 0.45, // secondi dopo un colpo
  lampo: 0.1, // secondi in cui il personaggio si illumina di bianco quando è colpito
  saluteBassa: 0.35, // sotto questa parte il bordo dello schermo pulsa di rosso
  attesaFine: 0.9, // secondi tra la morte e la schermata di fine
} as const;
