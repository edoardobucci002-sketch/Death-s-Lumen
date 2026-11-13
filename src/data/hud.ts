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
/** Preavviso di un'orda: il bordo del campo da cui arriva lampeggia a retino (src/sistema/hud.ts). Da rivedere. */
export const PREAVVISO_ORDA = { colore: '#c0392b', spessore: 8, livello: 10 }; // spessore in pixel disegnati, livello del retino su 16

export const AVVISO = {
  scala: 0.5,
  minimo: 2, // ingrandimento più piccolo: a ×1 le lettere sono alte 5 pixel; così computer e tablet restano a grandezza normale
  durata: 3, // secondi in tutto, dissolvenza compresa
  inPiuTelefono: 1, // sul telefono le scritte sono più grandi di un ingrandimento e stanno nel campo, sotto la fascia alta
  colore: '#ffe08a', // il titolo
  fondo: '#140c14', // il fondo scuro sotto le scritte
  altezza: 24, // pixel disegnati occupati da titolo e riga sotto, per non scendere sul personaggio
  sottoFascia: 6, // pixel di gioco tra la fascia alta e il cartiglio
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

/**
 * La pausa: striscia in alto, pagina che scorre, Riprendi, schede. Misure in pixel disegnati (sul Galaxy S25 uno vale
 * 2 pixel di gioco, cioè 1,33 punti), salvo dove è scritto «punti». Confermate da Edoardo; la tabella per ridisegnarla è in docs/asset_da_creare.md.
 */
export const PAUSA = {
  margine: 6, // tra le parti e dai bordi dello schermo
  casellaAlta: 34, // altezza della riga di caselle: sale da sola se sarebbe sotto TOCCO_MINIMO
  casella: 28, // lato della cornice di un'arma o di un dono
  casellaPunti: 42, // punti: la cornice si ingrandisce finché resta sotto questa misura
  dettaglio: 84, // altezza minima del riquadro di dettaglio
  schedaAlta: 42, // altezza minima delle schede
  stacco: 4, // tra il pulsante della pausa e il bordo alto delle schede: Riprendi sta sopra, così il secondo tocco di una doppia pressione cade su una scheda
  lettera: 2, // punti per pixel di lettera: voci, schede, nomi
  letteraTitolo: 3, // punti per pixel di lettera: il titolo «Pausa»
  grano: 6, // lato di un grano del Rosario
  larghezzaMassima: 680, // punti: computer e tablet
  altezzaMassima: 660, // punti: computer e tablet
  retino: 12, // quanto è scuro il fondo (0-16), come nella schermata di fine
  retinoConferma: 14, // il fondo della finestra di conferma di Abbandona
};

/**
 * La scoperta di un'Unione (rivelazione.ts): tempi in secondi, misure in punti salvo dove è scritto. Da rivedere: è il segnaposto
 * dal codice dell'animazione che Edoardo vuole fatta apposta.
 */
/** Il mosaico dei frammenti di vetro (src/sistema/mosaico.ts): compare al centro in alto a ogni frammento. Tempi in secondi. */
export const MOSAICO = {
  punti: 170, // grandezza del mosaico sullo schermo, arrotondata a un ingrandimento intero
  margine: 8, // pixel di gioco sotto la fascia alta del telefono
  sopraComputer: 84, // pixel di gioco dal bordo alto dove non c'è la fascia: sotto l'HUD
  rivela: 0.5, // il pezzo nuovo si accende a retino
  resta: 2, // dalla comparsa all'inizio dell'uscita
  uscita: 0.3, // sparisce a retino
  passi: 8, // gli scatti di entrata e uscita
  finale: 1.8, // al terzo frammento il mosaico intero resta acceso tanto, mentre parte il Bagliore
};

export const RIVELAZIONE = {
  entrata: 0.45, // il fondo si scurisce, arma e dono ai lati
  avvicina: 0.65, // arma e dono si avvicinano
  lampo: 0.35, // il lampo si allarga e si spegne
  passi: 8, // gli scatti del movimento e del lampo
  gradini: 3, // gli scatti del fondo
  fondoDa: 8, fondoA: 15, // quanto è scuro il fondo (0-16), dall'inizio alla fine
  iconaPunti: 64, // grandezza massima delle icone di arma e dono
  unioneInPiu: 2, // l'Unione è più grande di tanti ingrandimenti
  allargaLampo: 2, // il lampo diventa grande tante volte l'icona, oltre alla sua misura
  sopraCentro: 90, // il centro dell'animazione sta così sopra il centro dello schermo
  sottoIcona: 20, // dove iniziano le scritte, sotto il centro dello schermo
  lettera: 2, // punti per pixel di lettera
};

/** Pulsante della pausa al centro della fascia bassa: più piccolo, per lasciare posto al joystick. Da rivedere. */
export const PAUSA_PICCOLA = { lato: 34, margineTocco: 0 }; // punti di area di tocco invisibile: nessuna, per non premerla per sbaglio
/** Misura minima di un pulsante da toccare, in punti: se il disegno è più piccolo si ingrandisce di un numero intero di volte. */
export const TOCCO_MINIMO = 44;
/** Joystick sul telefono in verticale: base più piccola, in pixel disegnati (la sensibilità resta JOYSTICK.raggio). */
export const JOYSTICK_PICCOLO = { base: 56, pomello: 24, opacitaSuiPulsanti: 0.5 }; // opacità della base quando copre un pulsante, solo mentre il dito trascina; da rivedere
/** Segnale del Peccato: cornice a retino sul bordo del campo. Spessore in pixel disegnati, livello del retino da 0 a 16. */
export const SEGNALE_PECCATO = { spessore: 3, livello: 8, colore: '#8f4fd0' };

/** Dove scorre il riempimento dentro ogni cornice di barra (il riempimento ha già queste misure). */
export const FINESTRE: Record<string, Riquadro> = {
  Barra_Esperienza_Cornice: { x: 21, y: 16, l: 184, a: 5 },
  Barra_Mietitore_Cornice: { x: 20, y: 31, l: 204, a: 8 },
  Barra_Seth_Cornice: { x: 10, y: 4, l: 205, a: 6 }, // la barra sottile della fascia alta (225×14)
  Barra_Salute_Cornice: { x: 26, y: 7, l: 47, a: 6 }, // non più usata: la barra del personaggio è un rettangolo (BARRA_SALUTE)
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
/** Barra di Seth nell'HUD: rettangolo rosso con i numeri (colori in BARRA_SALUTE, src/data/mondo.ts). Lunga quanto la finestra della barra disegnata. Da rivedere. */
export const BARRA_SETH = { altezza: 12 };

export const TESTI = {
  livello: 13, // numero nello stemma
  ricarica: 16, // secondi che mancano all'abilità speciale, sopra la sua icona (da rivedere)
  seth: 8, // salute di Seth dentro la sua barra (da rivedere)
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

/**
 * Gioco a stanze: la carta verticale (richiesta di Edoardo del 13/11 sera: in orizzontale c'è più altezza, le strisce del
 * survivor sprecavano lo schermo). Misure in pixel disegnati, proposta di Claude da rivedere: 130 × 200 ingrandita 2 volte
 * sta tre volte in fila sul Galaxy S25 in orizzontale. Finché Edoardo non disegna Carta_Stanza, la disegna il codice.
 */
export const CARTA_STANZA = {
  l: 130, a: 200,
  spazio: 8, ingrandimentoMassimo: 4,
  interni: {
    icona: { x: 37, y: 8, l: 56, a: 56 }, // il pozzetto: l'icona da 24 dentro, ingrandita 2 volte
    titolo: { x: 6, y: 70, l: 118, a: 12 },
    tag: { x: 6, y: 84, l: 118, a: 10 },
    dati: { x: 10, y: 96, l: 112, a: 36 },
    righe: { x: 10, y: 136, l: 112, a: 58 },
  },
  // grandezza delle scritte, più grandi di quelle delle strisce (13, 8 e 7,5): richiesta di Edoardo del 13/11 sera, da rivedere.
  // Se una spiegazione non ci sta, scende da sola di mezzo punto alla volta
  testi: { dato: 16, tag: 9, riga: 9.5 },
};

/** Caselle di armi e doni in partita: piccole, alla Vampire Survivors (la cornice grande sta nel pannello della pausa). */
export const CASELLA = { lato: 28, bordo: 1, spazio: 2 }; // icona da 24 al centro

/** Quante volte al secondo il segnale del reliquiario si accende e si spegne (come nel gioco). */
export const LAMPEGGIO_SEGNALE = 3;
