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
}

export const NEMICI: TipoNemico[] = [
  { id: 'pipistrello', sprite: 'Pipistrello', salute: 6, velocita: 179, danno: 5, raggio: 16, anime: 1, attraversa: false, pesante: false, comportamento: 'zigzag' },
  { id: 'zombi', sprite: 'Zombi', salute: 16, velocita: 87, danno: 8, raggio: 21, anime: 2, attraversa: false, pesante: false, comportamento: 'diretto' },
  { id: 'fantasma', sprite: 'Fantasma', salute: 13, velocita: 129, danno: 7, raggio: 21, anime: 2, attraversa: true, pesante: false, comportamento: 'diretto' },
  { id: 'scheletro', sprite: 'Scheletro', salute: 34, velocita: 106, danno: 10, raggio: 21, anime: 3, attraversa: false, pesante: false, comportamento: 'accerchia' },
  { id: 'segugio', sprite: 'Segugio', salute: 28, velocita: 200, danno: 9, raggio: 21, anime: 3, attraversa: false, pesante: false, comportamento: 'intercetta' },
  { id: 'bruto', sprite: 'Bruto', salute: 150, velocita: 78, danno: 18, raggio: 38, anime: 8, attraversa: false, pesante: true, comportamento: 'diretto' },
  // il Mietitore non compare a caso: arriva ai minuti indicati in MIETITORE
  { id: 'mietitore', sprite: 'Il_Mietitore', salute: 3600, velocita: 118, danno: 22, raggio: 61, anime: 60, attraversa: true, pesante: true, comportamento: 'diretto' },
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
  reliquiari: 1, // quanti ne lascia (il Mietitore: MIETITORE.reliquiari)
  alone: 0x6a3a00, // colore aggiunto allo sprite (ambra)
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
  tetto: 250,
  brutiMassimi: 100, // bruti in campo al massimo: oltre, al loro posto nasce il nemico principale del minuto (da rivedere)
  comparseBase: 1.4, // comparse al secondo = 1,4 + 2,9 m
  comparsePerMinuto: 2.9,
  comparsePerFotogramma: 8, // al massimo
  sogliaRinforzo: 0.4, // sotto il 40% del massimo in campo…
  rinforzoPerFotogramma: 2, // …arrivano 2 nemici in più a ogni fotogramma
  variazioneVelocita: 0.1, // ±10% a caso
} as const;

/**
 * Il copione della notte: chi compare a ogni minuto (riga 0 = da 0:00, riga 14 = da 14:00) e con che peso.
 * Più alto il peso, più spesso esce quel nemico. Due tipi principali e al massimo uno di contorno, così ogni fase ha
 * la sua faccia; nei minuti di Seth (5 e 10) il copione è più leggero. Tutti i valori sono da rivedere.
 */
export const COPIONE: Partial<Record<TipoNemico['id'], number>>[] = [
  { pipistrello: 3, zombi: 2 },
  { zombi: 3, fantasma: 2 },
  { fantasma: 3, pipistrello: 2, scheletro: 1 },
  { zombi: 3, scheletro: 1 }, // dalle 3:00 (decisione di Edoardo del 10/11, da rivedere: era scheletro 3, zombi 2); l'orda del minuto 3 resta di scheletri
  { pipistrello: 3, segugio: 2 },
  { zombi: 3, scheletro: 1 },
  { segugio: 3, fantasma: 2 },
  { zombi: 3, bruto: 1 },
  { scheletro: 3, zombi: 2, bruto: 1 },
  { segugio: 3, pipistrello: 1 },
  { fantasma: 3, pipistrello: 1 },
  { fantasma: 3, bruto: 2 },
  { scheletro: 3, segugio: 2 },
  { scheletro: 3, bruto: 2, segugio: 1 },
  { segugio: 3, bruto: 2, fantasma: 2 },
];

/** Il respiro della notte: in ogni ciclo la marea sale, poi cala e nessun rinforzo la riempie. Da rivedere. */
export const RESPIRO = {
  dal: 60, // secondi: il primo minuto è già tranquillo
  ciclo: 60, // secondi di un ciclo intero
  marea: 50, // primi secondi del ciclo: comparse piene (poi 10 s di calma)
  comparse: 0.25, // nella calma le comparse si riducono a questa parte
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
 * Le orde: una all'inizio di ogni minuto del copione, quando finisce la calma del respiro (nei minuti di Seth no).
 * Prima del loro arrivo il bordo del campo da cui vengono lampeggia. Un solo tipo per orda. Tutto da rivedere.
 * Forme: muro (file che attraversano il campo in linea retta), cuneo (una punta verso di te), tenaglia (due muri da lati
 * opposti, metà nemici ciascuno), anello (in cerchio appena fuori dallo schermo, un po' più veloci).
 */
export type FormaOrda = 'muro' | 'cuneo' | 'tenaglia' | 'anello';
export const ORDE = {
  preavviso: 3, // secondi prima dell'arrivo: lampeggia il bordo e compare la scritta
  parteDelCampo: 1 / 3, // nemici per orda: un terzo dei nemici massimi in campo in quel minuto…
  minimo: 12, // …ma almeno 12…
  massimo: 80, // …e al massimo 80
  perFila: 12, // nemici per fila del muro
  spazio: 2.4, // distanza tra due nemici della formazione, in raggi
  marcia: 80, // velocità della formazione (pixel al secondo): attraversa il campo in linea retta, non ti insegue
  salute: 3, // dal minuto saluteDal i nemici delle orde hanno salute ×3: a build avanzata non muoiono prima di farsi vedere
  saluteDal: 6,
  velocitaAnello: 1.12, // l'anello è più veloce del 12%
  copione: [
    { minuto: 1, forma: 'anello', tipo: 'pipistrello' },
    { minuto: 2, forma: 'muro', tipo: 'zombi' },
    { minuto: 3, forma: 'cuneo', tipo: 'scheletro' },
    { minuto: 4, forma: 'anello', tipo: 'pipistrello' },
    { minuto: 6, forma: 'muro', tipo: 'scheletro' },
    { minuto: 7, forma: 'tenaglia', tipo: 'zombi' },
    { minuto: 8, forma: 'anello', tipo: 'fantasma' },
    { minuto: 9, forma: 'cuneo', tipo: 'segugio' },
    { minuto: 11, forma: 'muro', tipo: 'scheletro' },
    { minuto: 12, forma: 'anello', tipo: 'fantasma' },
    { minuto: 13, forma: 'tenaglia', tipo: 'segugio' },
    { minuto: 14, forma: 'cuneo', tipo: 'scheletro' },
  ] as { minuto: number; forma: FormaOrda; tipo: TipoNemico['id'] }[],
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
