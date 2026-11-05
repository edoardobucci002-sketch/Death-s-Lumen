/*
 * HUD disegnato da Edoardo (cartella HUD/ accanto al repository): quanto ingrandire ogni elemento
 * e dove stanno le sue parti interne (la finestra che si riempie, il cerchio dell'abilità, la casella dell'icona).
 * Misure in pixel dell'immagine Aseprite, a partire dall'angolo in alto a sinistra della tela.
 */

export interface Riquadro {
  x: number;
  y: number;
  l: number; // larghezza
  a: number; // altezza
}

export interface Cerchio {
  x: number; // centro
  y: number;
  r: number; // raggio
}

/** Ingrandimento proposto (numero intero: 1 pixel disegnato = tot pixel di gioco). */
export const INGRANDIMENTO: Record<string, number> = {
  barre: 1,
  salute: 1,
  caselle: 1,
  speciale: 1,
  pausa: 1,
  joystick: 2,
  segnale: 1,
  avvisi: 2, // a ×2 nel nastro ci sta una riga di testo leggibile
  carte: 3, // in verticale tre carte ×3 non ci stanno e scendono a ×2; in orizzontale restano ×3, più leggibili
  pannelli: 2,
  pulsanti: 3, // i pulsanti dei menu: a ×3 sono alti almeno 44 punti, la misura di un dito
  ritratto: 4, // la cornice del ritratto: deve contenere il ritratto 224×288 disegnato a grandezza piena
};

/**
 * Sui telefoni dove un pixel di gioco è più piccolo di così (in punti, cioè la misura che vede il dito)
 * l'HUD si ingrandisce di un numero intero di volte: succede con la scala ×1 (iPhone SE, Android piccoli),
 * dove altrimenti pausa e abilità sarebbero grandi la metà.
 */
export const PUNTI_MINIMI_PER_PIXEL = 0.6;
/**
 * L'HUD della partita (barre, caselle, abilità, pausa, avvisi) deve restare leggibile con il dito e l'occhio:
 * su un telefono in verticale un pixel di gioco è ~0,67 punti e le barre risultavano minuscole.
 * Questi gruppi raddoppiano finché un pixel di gioco è sotto questa soglia (computer e tablet non cambiano).
 */
export const PUNTI_MINIMI_PARTITA = 1.0;
export const GRUPPI_PARTITA = ['barre', 'salute', 'caselle', 'speciale', 'pausa', 'segnale', 'avvisi'];
/** Gruppi che non si ingrandiscono con la regola qui sopra (la cornice del ritratto non ci starebbe). */
export const SENZA_RADDOPPIO = ['ritratto'];
/** Area di tocco invisibile attorno a pausa e abilità, in punti per lato: il dito li prende anche appena fuori dal disegno. */
export const MARGINE_TOCCO = 4;

/**
 * Avvisi nel cartiglio (Nastro_Titolo), in alto sotto barre e caselle. Valori da rivedere.
 * scala: parte dell'ingrandimento normale; il risultato si arrotonda a un numero intero per non deformare i pixel del disegno.
 */
export const AVVISO = {
  scala: 0.5,
  minimo: 2, // ingrandimento più piccolo: a ×1 le lettere sono alte 5 pixel; così computer e tablet restano a grandezza normale
  durata: 1.45, // secondi in tutto, dissolvenza compresa: un filo sotto 1,5 perché il browser può fare tardi di un fotogramma o due
  dissolvenza: 0.3, // secondi finali in cui sparisce a retino
  passi: 3, // gradini del retino
  margine: 6, // pixel di gioco che restano tra l'avviso e la testa del personaggio
};

/** Orologio: nella colonna di destra, sotto anime, Cera e Rosario, dove le caselle non arrivano mai (da rivedere). */
export const OROLOGIO = { sopra: 40 }; // dal bordo alto dell'HUD, per ogni volta dell'ingrandimento delle caselle

/**
 * Fasce fisse del telefono in verticale, fuori dal campo di gioco. Tutto in pixel disegnati, tutto da rivedere.
 * L'altezza si calcola per ogni telefono: area sicura misurata + contenuto (arte.ts, fasce()).
 * Sul Galaxy S25 un pixel disegnato vale 4 pixel fisici: fascia alta 81, fascia bassa 94, campo 540×820 pixel di gioco.
 * Computer e tablet non hanno fasce.
 */
export const FASCE = {
  larghezzaMassima: 500, // punti: in verticale e non più largo di così è un telefono
  campoMinimo: 700, // pixel di gioco del campo in altezza: sotto, la scheda Schermo del LAB avvisa
  righeAlta: 54, // sotto l'area sicura: 3 di respiro + 32 stemma + 2 + 16 riga dell'orologio e di Seth + 1 filo
  righeCartiglio: 78, // cartiglio 59 + 2 + 16 riga dell'orologio e di Seth + 1 filo
  testoCartiglio: 24, // riga del cartiglio dove inizia la scritta: il cartiglio scende quanto basta a tenerla fuori dall'area sicura
  sottoCartiglio: 3, // la riga sotto il cartiglio sale di tante righe, per non toccare la riga dell'orologio e di Seth
  righeBassa: 94, // filo, abilità (86 al massimo) e respiro; l'area sicura in basso si aggiunge
  margine: 3, // dal bordo dello schermo
  scambiaAngoli: 0, // 0: fiaschetta a sinistra, abilità a destra; 1: scambiate (dal LAB, scheda Schermo)
};

/**
 * Area sicura: per tanti secondi dall'apertura si tiene la più grande vista, poi resta fissa finché l'app è aperta.
 * Le barre di sistema che compaiono con un gesto sono temporanee e non devono spostare niente.
 */
export const AREA_SICURA = { assestamento: 1.5 };

/**
 * Tacche intorno ai pulsanti tondi di fiaschetta e abilità, in pixel disegnati (sul S25 uno vale 4 pixel fisici). Da rivedere.
 * Stanno su un arco sopra il centro del pulsante: lato del quadretto, distanza dal centro, ampiezza dell'arco in gradi.
 * lampo: secondi di lampo quando una tacca si riempie.
 */
export const TACCHE = { lato: 4, raggio: 31, arco: 150, lampo: 0.25, colori: { accesa: '#e3913a', scura: '#2a1f17', lampo: '#fff2c8', bordo: '#000000' } };

/** Pulsante della pausa al centro della fascia bassa: più piccolo, per lasciare posto al joystick. Da rivedere. */
export const PAUSA_PICCOLA = { lato: 34, margineTocco: 0 }; // punti di area di tocco invisibile: nessuna, per non premerla per sbaglio
/** Misura minima di un pulsante da toccare, in punti: se il disegno è più piccolo si ingrandisce di un numero intero di volte. */
export const TOCCO_MINIMO = 44;
/** Joystick sul telefono in verticale: base più piccola, in pixel disegnati (la sensibilità resta JOYSTICK.raggio). */
export const JOYSTICK_PICCOLO = { base: 56, pomello: 24 };
/** Segnale del Peccato: cornice a retino sul bordo del campo. Spessore in pixel disegnati, livello del retino da 0 a 16. */
export const SEGNALE_PECCATO = { spessore: 3, livello: 8, colore: '#8f4fd0' };

/** Dove scorre il riempimento dentro ogni cornice di barra (il riempimento ha già queste misure). */
export const FINESTRE: Record<string, Riquadro> = {
  Barra_Esperienza_Cornice: { x: 21, y: 16, l: 184, a: 5 },
  Barra_Mietitore_Cornice: { x: 20, y: 31, l: 204, a: 8 },
  Barra_Seth_Cornice: { x: 10, y: 4, l: 205, a: 6 }, // la barra sottile della fascia alta (225×14)
  Barra_Salute_Cornice: { x: 26, y: 7, l: 47, a: 6 },
};

/** Il disco scuro al centro dell'anello dell'abilità (lì va l'icona) e il raggio esterno dell'anello colorato. */
export const ANELLI: Record<string, Cerchio & { esterno: number }> = {
  Speciale_Ricarica: { x: 34, y: 34, r: 16, esterno: 25 },
  Speciale_Pronta: { x: 33, y: 34, r: 16, esterno: 25 },
  Speciale_Il_Lampionaio: { x: 39, y: 36, r: 19, esterno: 27 },
  Speciale_Il_Becchino: { x: 37, y: 36, r: 19, esterno: 27 },
  Speciale_La_Badessa: { x: 39, y: 36, r: 19, esterno: 27 },
  Speciale_La_Strega: { x: 38, y: 36, r: 19, esterno: 27 },
};

/** Zone interne delle cornici: dove vanno icone, testi e ritratti. */
export const INTERNI: Record<string, Record<string, Riquadro>> = {
  Casella_Arma: { icona: { x: 11, y: 20, l: 40, a: 30 } },
  Stemma_Livello: { numero: { x: 6, y: 10, l: 13, a: 14 } }, // l'interno scuro dello scudo, senza la punta
  // il titolo sta nella parte piatta della targhetta marrone, un pixel dentro il bordo chiaro
  Carta_Dono: { icona: { x: 12, y: 29, l: 21, a: 17 }, titolo: { x: 36, y: 33, l: 33, a: 9 }, testo: { x: 12, y: 60, l: 59, a: 40 } },
  Carta_Dono_Scelta: { icona: { x: 12, y: 29, l: 21, a: 17 }, titolo: { x: 36, y: 33, l: 33, a: 9 }, testo: { x: 12, y: 60, l: 59, a: 40 } },
  Pannello_Grande: {
    testo: { x: 16, y: 34, l: 143, a: 36 },
    casella1: { x: 25, y: 80, l: 25, a: 24 },
    casella2: { x: 58, y: 80, l: 25, a: 24 },
    casella3: { x: 91, y: 80, l: 25, a: 24 },
    casella4: { x: 124, y: 80, l: 25, a: 24 },
  },
  Cornice_Il_Lampionaio: { ritratto: { x: 10, y: 30, l: 62, a: 96 } },
  Cornice_Il_Becchino: { ritratto: { x: 11, y: 30, l: 63, a: 96 } },
  Cornice_La_Badessa: { ritratto: { x: 10, y: 30, l: 63, a: 96 } },
  Cornice_La_Strega: { ritratto: { x: 9, y: 32, l: 70, a: 77 } },
  Nastro_Titolo: { testo: { x: 29, y: 24, l: 64, a: 11 } }, // la fascia chiara e piatta del nastro, senza le pieghe
  Targa_Lapide: { testo: { x: 25, y: 30, l: 82, a: 22 } },
  // la parte piatta della targhetta tra le due croci, senza la cornice a quadretti
  Pulsante_Chiaro: { testo: { x: 19, y: 7, l: 63, a: 9 } },
  Pulsante_Acceso: { testo: { x: 19, y: 7, l: 59, a: 9 } },
  Pulsante_Scuro: { testo: { x: 19, y: 6, l: 60, a: 9 } },
  Pulsante_Spento: { testo: { x: 19, y: 6, l: 60, a: 9 } },
};

/**
 * Grandezza dei testi, in pixel di gioco (si moltiplica per l'ingrandimento dell'elemento).
 * Su un iPhone un pixel di gioco è circa 2/3 di punto: sotto i 12 un numero non si legge più.
 * Se un testo non ci sta nel suo riquadro, il gioco lo rimpicciolisce da solo.
 */
export const TESTI = {
  livello: 13, // numero nello stemma
  casella: 12, // livello di un'arma o di un dono nella sua casella
  avviso: 10, // scritta nel nastro (×2)
  avvisoSotto: 8, // riga sotto il nastro (×2)
  pulsante: 8, // scritte dei pulsanti (×3)
  cartaTitolo: 7, // nome nella carta (×3)
  cartaTesto: 7,
  cartaTasto: 18, // il numero 1-2-3 sotto la carta
  strisciaDato: 13, // numeri grandi della striscia
  strisciaTag: 8, // «Nuova arma», «Liv 3 › 4»
  strisciaRiga: 7.5, // righe di spiegazione
};

/** Striscia della scelta dei doni (pixel disegnati): una sotto l'altra, così anche sul telefono testo e numeri restano grandi. */
export const STRISCIA = {
  l: 170, a: 62, // 170 × 3 sta in un telefono largo 360 punti (Galaxy S25)
  spazio: 3, ingrandimentoMassimo: 4,
  interni: {
    icona: { x: 5, y: 5, l: 34, a: 52 },
    titolo: { x: 44, y: 5, l: 78, a: 9 },
    tag: { x: 122, y: 4, l: 43, a: 10 },
    dati: { x: 44, y: 16, l: 121, a: 15 },
    righe: { x: 44, y: 32, l: 121, a: 27 },
  },
};

/** Caselle di armi e doni in partita: piccole, alla Vampire Survivors (la cornice grande sta nel pannello della pausa). */
export const CASELLA = { lato: 28, bordo: 1, spazio: 2 }; // icona da 24 al centro

/** Quante volte al secondo il segnale del reliquiario si accende e si spegne (come nel gioco). */
export const LAMPEGGIO_SEGNALE = 3;
