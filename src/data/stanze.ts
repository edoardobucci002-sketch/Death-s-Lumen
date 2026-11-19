/*
 * Gioco a stanze (pivot del 12/11): numeri della stanza. Distanze in pixel di gioco.
 * Passo 2 della fetta verticale: una stanza chiusa da muri, il Lampionaio che cammina, luce e buio come nel survivor.
 * Tutti i valori sono proposte di Claude (da rivedere): misure, colori e margini si provano sul Galaxy S25.
 */

import { CAMPANARO } from './campanaro';
import { SETH } from './seth';

/** La stanza: il pavimento dove si cammina e i muri intorno. */
export const STANZA = {
  // pavimento: 13 × 7 lastre da 64 px, come le stanze di The Binding of Isaac (scelta di Edoardo del 12/11, misure da rivedere):
  // la stanza intera sta più o meno in uno schermo
  larghezza: 832,
  altezza: 448,
  // le stanze doppie (decisione di Edoardo del 17/11): 26 × 7 lastre, larghe il doppio, per il Campanaro e il Boss.
  // Sulla mappa occupano una casella sola, come le altre (Edoardo, 18/11); le porte stanno al centro di ogni muro
  larghezzaDoppia: 1664,
  doppie: ['campanaro', 'boss'] as readonly string[],
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
 * La cripta, la stanza del Mondo 1 (decisione di Edoardo del 16/11): i file in AMBIENTI/Cripta, un fotogramma per pezzo.
 * Pavimento: 4 lastre da 64 (due lisce, una crepata, una con l'iscrizione). Facciata: 4 pezzi da 64 × 96 (due lisci, la
 * nicchia con la candela spenta, il pilastro). I pesi dicono quanto spesso esce ognuno (da rivedere).
 */
export const CRIPTA = {
  pavimento: 'Cripta_Pavimento',
  facciata: 'Cripta_Facciata',
  muri: 'Cripta_Muri',
  porte: 'Cripta_Porte',
  pesiPavimento: [5, 5, 1, 1],
  pesiFacciata: [4, 4, 1, 1],
  // Cripta_Muri: il muro di sinistra visto dall'alto (si ripete in verticale; a destra è lo specchio), l'angolo in basso, il muro in basso
  fotogrammi: { lato: 0, angolo: 1, basso: 2 },
  // Cripta_Porte: in alto chiusa e aperta (64 × 96, al posto di un pezzo della facciata), a sinistra chiusa e aperta
  // (32 × 122, centrate sulla porta; a destra lo specchio), in basso chiusa (88 × 32)
  fotogrammiPorte: { altoChiusa: 0, altoAperta: 1, latoChiusa: 2, latoAperta: 3, bassoChiusa: 4 },
  // arco e cancello di ogni porta (x, y, larghezza, altezza sul pezzo di sinistra), disegnati anche sopra il buio (16/11)
  vani: { alto: [5, 30, 54, 66], lato: [0, 26, 32, 70], basso: [0, 0, 88, 32] },
} as const;

/**
 * Passo 3 della fetta: l'attacco a tasto con l'arma iniziale (la Lanterna del Lampionaio).
 * Ricarica, raggio, ampiezza e danno della Lanterna livello per livello sono in src/data/armi-stanze.ts
 * (LANTERNA_STANZE: 5 livelli, danno a intervallo, dal 14/11). Qui il resto. Tutti i valori sono da rivedere.
 */
export const ATTACCO = {
  miraMassima: 320, // il tocco breve (e J) mira al nemico più vicino entro questa distanza; se no, dove guarda il personaggio
  posa: 0.15, // secondi in cui il personaggio resta girato verso il colpo, solo se lo sprite non ha l'animazione attack
  // con l'animazione attack la mossa dura quanto lei e il colpo ferisce dopo «anticipo» secondi, quando l'asta cala
  // (decisione di Edoardo del 13/11; per il Lampionaio V6 l'inizio del 5° fotogramma; da rivedere)
  anticipo: 0.155,
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
  // dal 16/11 ridisegnati da Claude sulle bozze di ChatGPT (BOZZE/HUD): anelli in luce in alto a sinistra e in ombra in basso
  // a destra, pomello d'attacco ambra con il bordo chiaro e una fiammella a tre colori (brace, fiamma, cuore)
  colori: { crema: '#efe3c8', bordo: '#120c08', fiamma: '#fbce4a', cuore: '#fcf3e3', brace: '#f78404' },
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
  quiete: 0.5, // deciso da Edoardo il 13/11
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
  // rallentatore fluido (13/11): parte al 60% della velocità e torna normale in 0,35 s veri, con una curva morbida;
  // la logica avanza comunque 60 volte al secondo, a passi più corti, così non va a scatti
  rallentatore: { scala: 0.6, durata: 0.35 },
  alone: 0x707070, // colore aggiunto al personaggio, a lampi
  lampi: 10, // lampi al secondo
} as const;

/**
 * I due nemici della fetta (decisi da Edoardo il 12/11). Distanze in pixel di gioco, misurate tra i piedi.
 * Sprite: Ricaduto e Cantore V1 del 13/11, bozze fatte con PixelLab dai disegni del restyle (prima: Zombi e Fantasma del survivor).
 */
export const NEMICI_STANZA = {
  // nemico base: cammina dritto e lento verso di te; vicino si ferma, prepara il graffio (avviso) e graffia davanti a sé
  ricaduto: {
    sprite: 'Ricaduto', // V1 del 13/11 da PixelLab (walk, attack, death); il gioco usa walk
    salute: 60, // dal 14/11 (era 40; Edoardo: «vanno giù facilmente»): con la Lanterna 12–18 servono da 4 a 5 colpi, 3 o 4 in Grazia
    velocita: 60, // il Lampionaio: 270
    raggio: 16, // il corpo, per i colpi della Lanterna e per non sovrapporsi
    portata: 56, // a questa distanza si ferma e comincia l'avviso
    avviso: 0.5, // secondi tra l'avviso e il graffio: la direzione è decisa all'inizio dell'avviso
    graffio: { raggio: 72, ampiezza: 110, danno: 15 }, // spicchio davanti a lui
    recupero: 0.7, // secondi fermo dopo il graffio
    // battuto, resta sempre a terra «attesa» secondi, senza segni e senza poter essere colpito; poi con questa probabilità
    // si rialza con questa parte della salute (una volta sola), se no sparisce (decisione di Edoardo del 13/11)
    rinascita: { probabilita: 0.2, attesa: 1.5, salute: 0.5 }, // 2 su 10 dal 13/11 sera (Edoardo; era 1 su 10)
  },
  // colpisce da lontano: resta a distanza e si allontana se ti avvicini; si ferma, a terra compare una linea verso di te
  // (l'avviso), poi lancia un grumo di Lumen spento che ti cerca (dal 13/11 sera, decisione di Edoardo): per «ricerca» secondi
  // gira verso di te di al massimo «virata» gradi al secondo, poi va dritto; contro il muro, o su di te, scoppia in una pozza di cera
  cantore: {
    sprite: 'Cantore', // V1 del 13/11 da PixelLab (walk, attack); il gioco usa walk
    salute: 35, // 35 dal 14/11 (Edoardo; era 20, poi 30): con la Lanterna 12–18 servono 2 o 3 colpi
    velocita: 75,
    raggio: 15,
    distanza: { minima: 200, massima: 250 }, // sotto si allontana, sopra si avvicina
    portata: 360, // canta solo se sei entro questa distanza
    primoCanto: 1.2, // secondi dopo la comparsa prima del primo canto
    avviso: 0.8,
    ricarica: 2.4, // secondi tra la fine di un canto e l'inizio del successivo
    recupero: 0.3,
    // la bocca del Cantore rispetto ai piedi (px in avanti, px in alto; lo sprite V1 guarda a destra): mentre canta il grumo
    // cresce lì, quando sputa parte da «lancio» e scende in volo fino a grumo.altezza in «discesa» secondi (14/11, da rivedere;
    // se cambia lo sprite vanno rimisurate)
    bocca: { canto: [7, 87], lancio: [46, 72], discesa: 0.3 },
    grumo: { velocita: 210, raggio: 9, danno: 12, altezza: 20, ricerca: 1.4, virata: 125 }, // virata 125 dal 13/11 notte (era 100; Edoardo: «leggermente più aggressivo») // altezza: quanto sopra il terreno si disegna; velocità 210 dal 13/11 sera (era 140, Edoardo: «lentissimo»; da rivedere)
  },
  // la pozza di cera dove il grumo scoppia, contro il muro o su di te (decisione di Edoardo del 13/11: resta 2 s e fa danno a chi
  // ci passa sopra; dello stesso colore del grumo, perché è cera; raggio 34 dal 13/11 notte, era 26; raggio e danno da rivedere). Il danno segue la Quiete del Lampionaio: al massimo uno ogni 0,5 s
  // effetti pixelfx disegnati per il gioco (tools/pixelfx/fx/cera, segnaposto Pixelfx_Cera_grumo e Pixelfx_Cera_pozza; i nomi non cominciano con «Pixelfx_Pozza_», che il gioco carica solo al bisogno): perno =
  // il centro del grumo e della pozza nel foglio; il foglio della pozza dura quanto lei e il gioco ne sceglie il fotogramma
  effetti: { grumo: 'Pixelfx_Cera_grumo', pernoGrumo: [14, 11], pozza: 'Pixelfx_Cera_pozza', pernoPozza: [47, 30], fps: 12, scia: 3 },
  pozza: { durata: 2, raggio: 34, danno: 6, svanisce: 0.3 }, // svanisce: negli ultimi secondi si restringe fino a sparire
  spinta: 10, // pixel di cui un colpo della Lanterna sposta un nemico (non durante l'avviso)
  // Quiete dei nemici (decisione di Edoardo del 13/11, 0,3 s): dopo un colpo, per questi secondi la stessa arma non lo ferisce
  // più; le altre armi sì. Il Cerchio di luce, che prova a ferire ogni 0,25 s, prende così ogni nemico ogni 0,5 s
  quiete: 0.3,
  // secondi in cui un nemico colpito dalla Lanterna resta bianco (il lampo del survivor dura 0,033 s: qui si vede di più);
  // 0,16 dal 13/11 sera (Edoardo: «li alzerei leggermente»; valore di Claude, da rivedere)
  lampo: 0.16,
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
    pozza: '#6d7f8c', // la pozza di cera a terra: lo stesso colore del grumo (decisione di Edoardo del 13/11 notte)
    pozzaBordo: '#2a3238',
    pozzaLuce: '#9fb8c8',
    comparsa: '#3a2f27', // il segno a terra dove sta per comparire un nemico
  },
} as const;

/**
 * Come arrivano i nemici: dove e con quale segno. Le ondate di ogni stanza sono in PERCORSO; «ricaduti» e «cantori» qui
 * sono l'ondata del pulsante «Ondata» del LAB.
 */
export const ONDATA = {
  ricaduti: 3,
  cantori: 2,
  distanzaMinima: 240, // dal personaggio: nessuno compare addosso a te
  comparsa: 0.7, // secondi in cui il segno a terra avvisa dove compare un nemico
  attesaPrima: 0.8, // secondi dall'ingresso nella stanza alla prima ondata
  massimo: 24, // nemici in campo al massimo (anche dal LAB): con le ondate a tempo si possono sommare
  seme: 4242,
} as const;

/**
 * Passo 5 della fetta: l'abilità del Lampionaio, il Cerchio di luce (gli stessi numeri del survivor, ABILITA in
 * src/data/abilita.ts: raggio, danno, durata, rallentamento). Si carica SOLO colpendo i nemici con la Lanterna
 * (decisione del 12/11). Valori proposti da Claude, da rivedere.
 */
/**
 * La fiaschetta nel gioco a stanze è automatica (idea di Edoardo del 17/11, al posto del pulsante): sotto «soglia» della
 * salute massima il personaggio beve da solo un sorso, che cura il 35% della salute massima (FIASCHETTA.cura) in 1 s.
 */
export const FIASCHETTA_STANZA = {
  soglia: 0.15,
  // i sorsi come pallini sotto la barra della salute (decisione di Edoardo del 17/11, stile Hollow Knight; forma e stacco
  // scelti da Edoardo il 18/11): se ne vedono tanti quanti sono i sorsi massimi (3, fino a 6 con il Calice riverso). In
  // pixel disegnati, ingranditi come la barra. Il resto è di Claude, accettato da Edoardo il 18/11:
  pallini: {
    lato: 5, // tondi, 5 × 5 (Edoardo)
    stacco: 2, // tra un pallino e l'altro (Edoardo)
    distanza: 2, // sotto la barra
    lampo: 0.25, // secondi di lampo quando un sorso arriva, quando se ne beve uno (bianco) o quando un premio si beve subito (verde)
    colori: { pieno: '#f2cf6a', luce: '#fff4c8', vuoto: '#1a120c', bordo: '#120606', lampo: '#ffffff', cura: '#6fbf4a' },
  },
} as const;

export const ABILITA_STANZA = {
  // piena dopo 8 colpi della Lanterna a segno; un colpo conta 1 anche se prende più nemici (decisione di Edoardo del 13/11)
  colpi: 8,
  ritmo: 0.3, // secondi tra due abbagli del Cerchio di luce: non più corto della Quiete dei nemici (nel survivor 0,25)
  // un solo grande colpo quando si accende (decisione di Edoardo del 14/11), poi il cerchio rallenta e abbaglia soltanto
  colpo: { danno: 20, dannoMassimo: 30 },
  // il pulsante, a sinistra del joystick d'attacco: diametro e distanza dal joystick in pixel disegnati; margine: quanto
  // l'area di tocco esce dal disegno, in punti dello schermo
  tasto: { lato: 36, distanza: 14, margine: 10 },
} as const;

/**
 * Impatto dei colpi della Lanterna (decisione di Edoardo del 13/11): fermo d'impatto, schiacciamento, scintille, scossa e
 * suono. Valori proposti da Claude, da rivedere. Il fermo si spegne dal LAB per confrontare.
 */
export const IMPATTO = {
  // secondi in cui il Lampionaio e i nemici colpiti si fermano (gli altri continuano): 4 fotogrammi dal 13/11 sera (erano 3;
  // Edoardo: «li alzerei leggermente»; valore di Claude, da rivedere)
  fermo: 0.067,
  schiaccia: { durata: 0.1, largo: 1.25, basso: 0.75 }, // il nemico colpito si allarga e si abbassa, poi torna
  scintille: { colpo: 6, battuto: 12, velocita: 140, durata: 0.22, lato: 2, colori: ['#fff1b8', '#ffd36a', '#e3913a'] },
  scossa: { forza: 1, durata: 0.06 }, // pixel e secondi, solo quando si prende qualcuno
} as const;

/**
 * Ombre a terra sotto i personaggi (idea di Edoardo del 19/11: come le ombre dipinte sui fogli d'acetato dell'animazione
 * classica). L'ombra è la sagoma del personaggio schiacciata a terra (risposta di Edoardo del 19/11), ribaltata sotto i
 * piedi: larga quanto lui e animata con lui. Scurisce il pavimento («moltiplica»: il colore si moltiplica per quello del
 * pavimento). Colore confermato da Edoardo il 19/11; schiacciamento 0,35 confermato il 19/11.
 */
export const OMBRE = {
  accese: true, // si spengono dal LAB per confrontare
  colore: 0x7a6470, // il colore del foglio d'ombra: viola-grigio caldo, moltiplicato sul pavimento (Edoardo, 19/11)
  schiaccia: 0.35, // l'altezza della sagoma a terra rispetto allo sprite: 0,35 dal 19/11 (era 0,3; Edoardo: «leggermente meno schiacciata»; confermato da Edoardo il 19/11)
} as const;

/** La barra della salute del gioco a stanze: quanti pixel più in basso di quella del survivor (Edoardo, 19/11: «abbassa leggermente»; 6 confermato da Edoardo il 19/11). */
export const BARRA_STANZA = { abbassa: 6 } as const;

/**
 * Ricaduto, Cantore, Campanaro (mini-boss, dal 17/11) e Seth (Boss, dal 18/11) come li vede la Orda del survivor (src/sistema/orda.ts), che li tiene in fondo al suo elenco di tipi:
 * così le armi automatiche (gli Echi), gli stati e le reazioni funzionano anche su di loro. Il loro modo di muoversi e
 * di attaccare resta in NEMICI_STANZA e in src/sistema/nemici-stanza.ts.
 */
export const TIPI_ORDA_STANZE = [
  { id: 'ricaduto', sprite: NEMICI_STANZA.ricaduto.sprite, raggio: NEMICI_STANZA.ricaduto.raggio, danno: NEMICI_STANZA.ricaduto.graffio.danno, attraversa: false, pesante: false, comportamento: 'stanze' },
  { id: 'cantore', sprite: NEMICI_STANZA.cantore.sprite, raggio: NEMICI_STANZA.cantore.raggio, danno: NEMICI_STANZA.cantore.grumo.danno, attraversa: false, pesante: false, comportamento: 'stanze' },
  { id: 'campanaro', sprite: CAMPANARO.sprite, raggio: CAMPANARO.raggio, danno: CAMPANARO.carica.danno, attraversa: false, pesante: true, comportamento: 'stanze' },
  { id: 'seth', sprite: SETH.sprite, raggio: SETH.raggio, danno: SETH.passo.danno, attraversa: false, pesante: true, comportamento: 'stanze' },
] as const;

/**
 * Le stanze della mappa del Mondo (dal 17/11, passo 2; prima la fila di tre stanze della fetta, decisioni del 13/11).
 * Ogni stanza ha la sua ricompensa, scritta sul medaglione della porta che ci porta: una stanza d'affinità dà Echi nuovi e
 * livelli degli Echi di quell'affinità (dalla Luce anche livelli della Lanterna), una stanza del dono dà doni, le stanze
 * attaccate all'ingresso danno gli Echi d'inizio. Numeri di Claude, da rivedere.
 */
export const PERCORSO = {
  // le ondate di una stanza secondo quante porte dista dall'ingresso: la prima riga a 1 porta, la seconda a 2, l'ultima da
  // 3 in su (mappa, 17/11: prima erano le ondate della prima, seconda e terza stanza della fetta. Edoardo, 13/11: più
  // ondate; la prima riga 3+1 e 3+1, le altre di Claude, da rivedere). L'ondata dopo arriva quando sono passati
  // «intervallo» secondi dalla precedente, anche se ci sono ancora nemici; se prima restano al massimo «restanti» nemici,
  // arriva subito
  ondate: [
    [{ ricaduti: 3, cantori: 1 }, { ricaduti: 3, cantori: 1 }],
    [{ ricaduti: 3, cantori: 1 }, { ricaduti: 3, cantori: 2 }, { ricaduti: 4, cantori: 2 }],
    [{ ricaduti: 4, cantori: 2 }, { ricaduti: 4, cantori: 2 }, { ricaduti: 5, cantori: 3 }],
  ],
  intervallo: 8, // 8 dal 13/11 sera (Edoardo: quasi ogni ondata finiva entro i 10 s)
  restanti: 0,
  capoLontano: 120, // il Campanaro compare al centro dell'arena, se il personaggio non è più vicino di così (Claude, 18/11)
  attesaCarte: 0.5, // secondi tra la stanza ripulita e le carte (decisione di Edoardo del 13/11 sera; era 1)
  // le carte (verticali, in fila: CARTA_STANZA in src/data/hud.ts) compaiono a pop, prima minuscole poi alla loro grandezza,
  // una dopo l'altra (richiesta di Edoardo del 13/11 sera; tempi di Claude, da rivedere): «pop» secondi a carta, a «scatti»
  // passi; quando ogni carta è grande, sopra di lei scoppia un effetto pixelfx (collect-burst in oro), a «fps» fotogrammi al secondo
  carte: { pop: 0.24, scatti: 6, sfasamento: 0.1, effetto: 'Pixelfx_Comparsa_carta', fps: 12 },
  quanteCarte: 2, // carte offerte a stanza ripulita (Edoardo, 17/11: si parte da 2; la terza arriverà con la Fortuna)
  echi: 3, // Echi al massimo nella build (più la Lanterna)
  doni: 6, // doni diversi al massimo
  // i doni che nelle stanze fanno davvero qualcosa (decisione di Edoardo del 13/11): manca la Calamita; il Calice riverso c'è dal 17/11
  doniAttivi: ['cuoreDiCera', 'saleNero', 'clessidra', 'stoppinoLungo', 'aliDiFalena', 'erbeAmare', 'scudoDiFerro', 'specchio', 'ceraVotiva', 'chiodoDiBara', 'campanellaDArgento', 'lacrimaDiLumen'],
  passaggio: 0.25, // secondi del passaggio a retino tra una stanza e l'altra (metà per scurire, metà per schiarire)
  passaggioRipulita: 0.12, // verso una stanza già ripulita il passaggio è più veloce (Edoardo, 17/11; durata di Claude, da rivedere)
  // la stanza del Boss (passo 3, 18/11): entrati, le porte si chiudono alle spalle e dopo questi secondi compare la fine
  // provvisoria, finché non c'è Seth (Claude; va bene a Edoardo, da rivedere)
  attesaCapo: 1.5,
  giriDoppia: 2, // dietro una porta chiusa a chiave (non il tesoro): giri di carte a stanza ripulita (Edoardo, 18/11: «ricompensa doppia»)
  // la scritta sopra la testa quando la porta del capo si apre o quando ci si spinge contro chiusa: secondi
  avviso: 1.6,
} as const;

/** Le porte: un'apertura nel muro, chiusa da sbarre finché la stanza non è ripulita e la carta scelta. */
export const PORTE = {
  larghezza: 64, // in alto: quanto è larga l'apertura; ai lati e in basso: quanto è alta
  simbolo: 2, // ingrandimento del simbolo della ricompensa sopra la porta
  colori: { vano: '#050403', sbarre: '#5a4a3c', cornice: '#2a2119', aperta: '#e3913a', dono: '#dcc07a', echi: '#e8dcc0', capo: '#a3262a', lucchetto: '#8a8f99', tesoro: '#c9a23a', sosta: '#5a8fb0', serratura: '#e0b440', chiave: '#e0b440', candele: '#f7a14a' }, // tesoro e sosta: segnaposto (18/11) // capo e lucchetto: segnaposto della porta del capo (18/11)
  // il medaglione vuoto (EFFETTI/Porta_Vuota, 31 × 31) con dentro il simbolo dello stato (11 × 11) in questo punto (16/11)
  medaglione: { vuoto: 'Porta_Vuota', simbolo: { x: 10, y: 9 } },
  vicino: 170, // più vicino di così al centro di una porta, il suo arco non si disegna sopra il buio (da rivedere)
  // entrando in una stanza si compare davanti alla porta da cui si arriva, tanti px verso il centro (mappa, 17/11): così
  // in una stanza già ripulita, con le porte aperte, non si riesce subito indietro (Claude, da rivedere)
  entrata: 40,
} as const;
