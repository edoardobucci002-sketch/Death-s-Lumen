/*
 * Gioco a stanze (pivot del 12/11): numeri della stanza. Distanze in pixel di gioco.
 * Passo 2 della fetta verticale: una stanza chiusa da muri, il Lampionaio che cammina, luce e buio come nel survivor.
 * Tutti i valori sono proposte di Claude (da rivedere): misure, colori e margini si provano sul Galaxy S25.
 */

/** La stanza: il pavimento dove si cammina e i muri intorno. */
export const STANZA = {
  // pavimento: 13 × 7 lastre da 64 px, come le stanze di The Binding of Isaac (scelta di Edoardo del 12/11, misure da rivedere):
  // la stanza intera sta più o meno in uno schermo
  larghezza: 832,
  altezza: 448,
  muroAlto: 96, // la facciata del muro in alto, vista di fronte
  muroLati: 32, // lo spessore dei muri a sinistra e a destra
  muroBasso: 32,
  // il personaggio non entra nei muri: mezza larghezza dei piedi ai lati, e quanto i piedi si avvicinano in alto e in basso
  margineLati: 18,
  margineAlto: 10,
  margineBasso: 6,
  ombraMuro: 10, // fascia scura sul pavimento ai piedi del muro in alto
  piastrella: 64, // lato di una lastra del pavimento
  mattone: { l: 32, a: 16 }, // mattoni della facciata
  seme: 1031, // disegno del pavimento e tremolio della fiamma (caso separato dalla logica)
  pausa: { lato: 14, ingrandimento: 2 }, // pulsante della pausa provvisorio: 14 pixel disegnati, ingranditi 2 volte (da rivedere)
  colori: {
    fondo: '#0d0b09', // fuori dalla stanza
    pavimento: '#2a2119',
    pavimentoChiaro: '#33281e',
    fuga: '#17120d',
    crepa: '#1f1913',
    muro: '#3a2f27',
    mattoneChiaro: '#4a3c31',
    malta: '#1c1611',
    cima: '#5a4a3c',
    lato: '#2c241e',
    ombra: '#130f0b',
  },
} as const;

/**
 * Passo 3 della fetta: l'attacco a tasto con l'arma iniziale (la Lanterna del Lampionaio).
 * Raggio, ampiezza e danno partono da quelli della Lanterna al livello 1 del survivor; la ricarica è più svelta,
 * perché ora si attacca a mano. Tutti i valori sono da rivedere: con i 5 livelli del pivot i numeri si ridistribuiscono.
 */
export const ATTACCO = {
  ricarica: 0.45, // secondi tra due colpi (la Lanterna automatica del survivor: 0,8)
  raggio: 136, // quanto arriva l'arco di luce, dai piedi del personaggio (si disegna all'altezza del corpo)
  ampiezza: 132, // gradi dell'arco
  danno: 18,
  miraMassima: 320, // il tocco breve (e J) mira al nemico più vicino entro questa distanza; se no, dove guarda il personaggio
  posa: 0.15, // secondi in cui il personaggio resta girato verso il colpo (segnaposto dell'animazione attack)
  slancio: 3, // pixel di cui il personaggio si sporge verso il colpo durante la posa (segnaposto)
  // joystick d'attacco sul telefono, fisso in basso a destra (stile Brawl Stars, decisione di Edoardo del 12/11): grande come
  // il joystick di movimento (JOYSTICK_STANZE). Niente più grandezza regolabile (decisione di Edoardo del 13/11)
  tasto: { margine: 14 }, // margine dal bordo sicuro, in pixel di gioco
  trascina: { raggio: 52, zonaMorta: 0.3 }, // punti dello schermo: sotto la zona morta il tocco è un tocco (mira automatica)
  // la mira a terra mentre si trascina: color crema, perché l'arancione è degli avvisi a distanza (decisione di Edoardo del 13/11)
  mira: { colore: '#efe3c8', spessore: 2 },
} as const;

/**
 * I due joystick del gioco a stanze (decisione di Edoardo del 13/11): disegnati dal codice, più piccoli e un po' trasparenti,
 * con due personalità. Movimento: un anello sottile color crema con un pomello pieno. Attacco: un disco nel colore del
 * personaggio con una fiammella come pomello. Misure in pixel disegnati, ingranditi come il joystick del survivor.
 */
export const JOYSTICK_STANZE = {
  base: 72, // diametro della base (quella del survivor: 84)
  pomello: 28, // diametro del pomello
  anello: 3, // spessore dell'anello del movimento
  opacita: 0.7, // trasparenza vera: un'eccezione alla regola del retino, solo per i comandi (decisione di Edoardo del 13/11)
  colori: { crema: '#efe3c8', bordo: '#120c08', fiamma: '#fff1b8', cuore: '#ffd36a' },
} as const;

/**
 * Passo 4 della fetta: il Lampionaio si può ferire. Senza scatto, la difesa attiva è la Grazia (schivata perfetta):
 * ogni attacco dei nemici ha un avviso. La Grazia usa le regole del survivor (GRAZIA in src/data/sopravvivenza.ts:
 * finestra, sfioro, durata, +danno, +velocità). Tutti i valori sono proposte di Claude, da rivedere.
 */
export const COMBATTIMENTO_STANZA = {
  raggio: 14, // il corpo del personaggio per i colpi dei nemici, attorno ai piedi
  // Quiete (decisione di Edoardo del 13/11): secondi senza danni dopo un colpo; una statistica del personaggio che le carte
  // potranno migliorare (il personaggio lampeggia)
  quiete: 0.6,
  lampo: 0.1, // secondi in cui il personaggio si illumina di bianco quando è colpito
  lampeggio: 12, // lampeggi al secondo durante l'invulnerabilità
  attesaFine: 0.9, // secondi tra la morte e la scritta «Sei caduto»
  scritta: { durata: 0.9, sopra: 72 }, // «Grazia» sopra la testa: secondi e pixel sopra i piedi
  scossa: { forza: 2, durata: 0.12 }, // lo schermo trema quando il personaggio è colpito (pixel, secondi)
} as const;

/**
 * Grazia del gioco a stanze (decisione di Edoardo del 13/11: si sviluppa per conto suo, partendo da quella del survivor).
 * La schivata perfetta: uscire da un attacco ravvicinato quando mancano al massimo «finestra» secondi, o farsi passare
 * un proiettile entro «sfioro» px oltre il contatto senza farsi toccare. Dà «durata» secondi di Grazia (+danno, +velocità)
 * e un attimo al rallentatore. Sono i valori di partenza: le carte del passo 6 potranno migliorarli.
 */
export const GRAZIA_STANZA = {
  finestra: 0.25,
  sfioro: 30,
  durata: 3,
  danno: 0.3, // +30%
  velocita: 0.15, // +15%
  rallentatore: { scala: 0.3, durata: 0.3 }, // il gioco va al 30% della velocità per 0,3 s veri
  alone: 0x707070, // colore aggiunto al personaggio, a lampi
  lampi: 10, // lampi al secondo
} as const;

/**
 * I due nemici della fetta (decisi da Edoardo il 12/11). Distanze in pixel di gioco, misurate tra i piedi.
 * Sprite segnaposto: lo Zombi e il Fantasma del survivor, finché Edoardo non disegna Ricaduto e Cantore.
 */
export const NEMICI_STANZA = {
  // nemico base: cammina dritto e lento verso di te; vicino si ferma, prepara il graffio (avviso) e graffia davanti a sé
  ricaduto: {
    sprite: 'Zombi',
    salute: 40, // 3 colpi della Lanterna, 2 in Grazia
    velocita: 60, // il Lampionaio: 270
    raggio: 16, // il corpo, per i colpi della Lanterna e per non sovrapporsi
    portata: 56, // a questa distanza si ferma e comincia l'avviso
    avviso: 0.5, // secondi tra l'avviso e il graffio: la direzione è decisa all'inizio dell'avviso
    graffio: { raggio: 72, ampiezza: 110, danno: 15 }, // spicchio davanti a lui
    recupero: 0.7, // secondi fermo dopo il graffio
    // battuto, resta sempre a terra «attesa» secondi, senza segni e senza poter essere colpito; poi con questa probabilità
    // si rialza con questa parte della salute (una volta sola), se no sparisce (decisione di Edoardo del 13/11)
    rinascita: { probabilita: 0.1, attesa: 1.5, salute: 0.5 },
  },
  // colpisce da lontano: resta a distanza e si allontana se ti avvicini; si ferma, a terra compare una linea verso di te
  // (l'avviso), poi lancia un grumo di Lumen spento lento e dritto, che non insegue e si ferma contro i muri
  cantore: {
    sprite: 'Fantasma',
    salute: 20, // 2 colpi della Lanterna, 1 in Grazia
    velocita: 75,
    raggio: 15,
    distanza: { minima: 200, massima: 250 }, // sotto si allontana, sopra si avvicina
    portata: 360, // canta solo se sei entro questa distanza
    primoCanto: 1.2, // secondi dopo la comparsa prima del primo canto
    avviso: 0.8,
    ricarica: 2.4, // secondi tra la fine di un canto e l'inizio del successivo
    recupero: 0.3,
    grumo: { velocita: 140, raggio: 9, danno: 12, altezza: 20 }, // altezza: quanto sopra il terreno si disegna
  },
  spinta: 10, // pixel di cui un colpo della Lanterna sposta un nemico (non durante l'avviso)
  // Quiete dei nemici (decisione di Edoardo del 13/11): dopo un colpo, per questi secondi la stessa arma non lo ferisce più;
  // le altre armi sì. Più corta del ritmo delle armi più svelte (il Cerchio di luce ferisce ogni 0,25 s)
  quiete: 0.2,
  lampo: 0.1, // secondi in cui un nemico colpito si illumina di bianco
  // barra della salute dei nemici, solo quando sono feriti (pixel disegnati, sotto i piedi)
  barra: { larghezza: 20, altezza: 3, distanza: 4 },
  colori: {
    avviso: '#5a1014', // lo spicchio del graffio che si riempie
    // corpo a corpo rossi, a distanza arancioni (decisione di Edoardo del 13/11)
    bordo: '#e0503c', // il contorno dello spicchio
    graffio: '#ff9c7a', // lo spicchio nell'istante del graffio
    linea: '#f0a030', // la linea a terra del Cantore
    grumo: '#6d7f8c', // il grumo di Lumen spento
    grumoBordo: '#2a3238',
    comparsa: '#3a2f27', // il segno a terra dove sta per comparire un nemico
  },
} as const;

/**
 * Ondate del passo 4 (provvisorie: al passo 6 arrivano le tre stanze con le porte). All'inizio e ogni volta che la
 * stanza è ripulita compare un'ondata, così si gioca anche senza LAB.
 */
export const ONDATA = {
  ricaduti: 3,
  cantori: 2,
  distanzaMinima: 240, // dal personaggio: nessuno compare addosso a te
  comparsa: 0.7, // secondi in cui il segno a terra avvisa dove compare un nemico
  attesaPrima: 0.8, // secondi dall'ingresso nella stanza alla prima ondata
  attesaNuova: 2.5, // secondi tra la stanza ripulita e l'ondata seguente
  massimo: 16, // nemici in campo al massimo (anche dal LAB)
  seme: 4242,
} as const;

/**
 * Passo 5 della fetta: l'abilità del Lampionaio, il Cerchio di luce (gli stessi numeri del survivor, ABILITA in
 * src/data/abilita.ts: raggio, danno, durata, rallentamento). Si carica SOLO colpendo i nemici con la Lanterna
 * (decisione del 12/11). Valori proposti da Claude, da rivedere.
 */
export const ABILITA_STANZA = {
  serve: 100, // carica piena
  perNemico: 10, // carica per ogni nemico preso da un colpo della Lanterna
  massimoPerColpo: 20, // un colpo che prende tanti nemici dà al massimo questo
  // il pulsante, accanto al joystick d'attacco (sopra e a sinistra): diametro in pixel disegnati, distanza dal joystick
  tasto: { lato: 36, distanza: 6 },
} as const;
