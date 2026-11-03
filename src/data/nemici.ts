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
  /** Come si muove: dritto verso di te, ti accerchia, ti taglia la strada o vola a zig-zag (vedi IA). */
  comportamento: 'diretto' | 'accerchia' | 'intercetta' | 'zigzag';
  /** Quanto spesso compare rispetto agli altri, dato il tempo di gioco in secondi (0 = non ancora). */
  peso: (s: number) => number;
}

export const NEMICI: TipoNemico[] = [
  { id: 'pipistrello', sprite: 'Pipistrello', salute: 6, velocita: 179, danno: 5, raggio: 16, anime: 1, attraversa: false, pesante: false, comportamento: 'zigzag',
    peso: (s) => Math.max(0.7, 3 - s / 200) },
  { id: 'zombi', sprite: 'Zombi', salute: 16, velocita: 87, danno: 8, raggio: 21, anime: 2, attraversa: false, pesante: false, comportamento: 'diretto',
    peso: (s) => (s < 480 ? 3 : 1.5) },
  { id: 'fantasma', sprite: 'Fantasma', salute: 13, velocita: 129, danno: 7, raggio: 21, anime: 2, attraversa: true, pesante: false, comportamento: 'diretto',
    peso: (s) => (s >= 50 ? 2 : 0) },
  { id: 'scheletro', sprite: 'Scheletro', salute: 34, velocita: 106, danno: 10, raggio: 21, anime: 3, attraversa: false, pesante: false, comportamento: 'accerchia',
    peso: (s) => (s >= 140 ? 2.6 : 0) },
  { id: 'segugio', sprite: 'Segugio', salute: 28, velocita: 200, danno: 9, raggio: 21, anime: 3, attraversa: false, pesante: false, comportamento: 'intercetta',
    peso: (s) => (s >= 230 ? 2 : 0) },
  { id: 'bruto', sprite: 'Bruto', salute: 150, velocita: 78, danno: 18, raggio: 38, anime: 8, attraversa: false, pesante: true, comportamento: 'diretto',
    // M8: entrano gradualmente in 2 minuti invece che tutti insieme alle 6:00 (lì si moriva quasi sempre)
    peso: (s) => (s >= 360 ? Math.min(1 + s / 600, (s - 360) / 75) : 0) },
  // il Mietitore non compare a caso: arriva ai minuti indicati in MIETITORE
  { id: 'mietitore', sprite: 'Il_Mietitore', salute: 3600, velocita: 118, danno: 22, raggio: 61, anime: 60, attraversa: true, pesante: true, comportamento: 'diretto',
    peso: () => 0 },
];

/**
 * Il Mietitore, il boss (GDD, sezione 6). Raggio e velocità della v0 × 2,35.
 * Cammina verso di te, poi si ferma pulsando di rosso e fa una delle sue mosse, scelta a caso con questi pesi.
 * Ogni mossa ha un preavviso (carica): è il momento per scansarsi.
 */
export const MIETITORE = {
  minuti: [5, 10],
  saluteSecondo: 3.5, // al minuto 10 ha salute ×3,5 rispetto a quella del minuto 5 (già scalata con il tempo)
  cammina: [3, 5], // cammina verso di te per 3-5 s, poi una mossa
  camminaSecondo: 0.75, // al minuto 10 cammina meno tra una mossa e l'altra (×0,75)
  mosse: { scatto: 3, falciata: 3, falci: 2, chiamata: 1.5 }, // quanto spesso sceglie ogni mossa
  riprende: 0.45, // secondi fermo dopo falciata, falci e chiamata
  // Scatto: si ferma pulsando, poi scatta verso dove ti trovavi
  carica: 0.7,
  scatto: 0.55, // durata dello scatto…
  velocitaScatto: 3.6, // …a 3,6 volte la sua velocità
  // Falciata: un cerchio rosso si accende intorno a lui; quando finisce di pulsare, colpisce chi ci è dentro
  falciata: { carica: 0.95, raggio: 200, danno: 22 },
  // Falci spettrali: lancia falci rosse a ventaglio verso di te
  falci: { carica: 0.6, quante: 5, ventaglio: 0.9, velocita: 330, danno: 16, raggio: 18, durata: 3.2 },
  // Chiamata dei morti: segni rossi a terra intorno a te, poi da lì escono scheletri
  chiamata: { carica: 1.1, quanti: 8, distanza: 190, tipo: 'scheletro' as TipoNemico['id'] },
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
  // salute = base × (1 + 0,28 m + 0,04 × (m − 3)² dopo il minuto 3): uguale all'inizio, molto più resistenti a metà notte
  salutePerMinuto: 0.28,
  saluteDopo: 3, // minuto da cui la crescita accelera
  saluteAccelera: 0.06,
  dannoPerMinuto: 0.16, // danno = base × (1 + 0,16 m)
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

/** Come si muovono i nemici più furbi (comportamento in NEMICI). */
export const IA = {
  // accerchia: punta a un punto ruotato di lato intorno a te, più vicino a ogni passo: arriva dai fianchi
  accerchia: { angolo: [0.6, 1.2], stringe: 0.6, vicino: 120 }, // radianti di lato, quota della distanza, sotto i 120 px viene dritto
  // intercetta: punta dove sarai tra un po' (al massimo 1,1 s), guardando dove stai andando
  intercetta: { anticipo: 1.1 },
  // zigzag: ondeggia di lato mentre si avvicina
  zigzag: { ampiezza: 0.7, frequenza: 5 },
} as const;

/**
 * Orde: un muro di nemici in formazione che marcia compatto verso di te e, arrivato vicino, carica tutto insieme.
 * Dal minuto 7 arrivano in due, da lati opposti (tenaglia).
 */
export const ORDE = {
  primo: 150, // secondi
  ogni: 80,
  ultimo: 860, // nessuna orda dopo questo secondo
  base: 12, // nemici per orda: 12 + 2 per minuto, al massimo 28
  perMinuto: 2,
  massimo: 28,
  perFila: 7, // nemici per fila della formazione
  spazio: 2.4, // distanza tra due nemici della formazione, in raggi
  marcia: 80, // velocità della formazione (pixel al secondo)
  distanzaCarica: 260, // a questa distanza da te carica…
  carica: 1.35, // …a velocità ×1,35
  tenagliaDal: 420, // da questo secondo le orde arrivano in due, da lati opposti
  // di che tipo sono i nemici dell'orda, secondo il tempo (secondi)
  tipi: [{ dal: 0, tipo: 'zombi' }, { dal: 300, tipo: 'scheletro' }, { dal: 600, tipo: 'segugio' }] as { dal: number; tipo: TipoNemico['id'] }[],
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
