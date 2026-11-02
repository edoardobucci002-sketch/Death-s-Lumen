/*
 * HUD disegnato da Edoardo (cartella HUD/ accanto al repository): quanto ingrandire ogni elemento
 * e dove stanno le sue parti interne (la finestra che si riempie, il cerchio dell'abilità, la casella dell'icona).
 * Misure in pixel dell'immagine Aseprite, a partire dall'angolo in alto a sinistra della tela.
 * Per ora lo usa solo la pagina di bozza (bozza-hud.html); quando l'HUD entra nel gioco, lo userà anche lui.
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

/** Ingrandimento proposto (numero intero: 1 pixel disegnato = tot pixel di gioco). Nella bozza si cambia a mano. */
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
/** Gruppi che non si ingrandiscono con la regola qui sopra (la cornice del ritratto non ci starebbe). */
export const SENZA_RADDOPPIO = ['ritratto'];
/** Area di tocco invisibile attorno a pausa e abilità, in punti per lato: il dito li prende anche appena fuori dal disegno. */
export const MARGINE_TOCCO = 4;

/** Dove scorre il riempimento dentro ogni cornice di barra (il riempimento ha già queste misure). */
export const FINESTRE: Record<string, Riquadro> = {
  Barra_Esperienza_Cornice: { x: 21, y: 16, l: 184, a: 5 },
  Barra_Mietitore_Cornice: { x: 20, y: 31, l: 204, a: 8 },
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
  Stemma_Livello: { numero: { x: 5, y: 9, l: 15, a: 17 } },
  Carta_Dono: { icona: { x: 12, y: 29, l: 21, a: 17 }, titolo: { x: 35, y: 32, l: 35, a: 11 }, testo: { x: 10, y: 60, l: 63, a: 40 } },
  Carta_Dono_Scelta: { icona: { x: 12, y: 29, l: 21, a: 17 }, titolo: { x: 35, y: 32, l: 35, a: 11 }, testo: { x: 10, y: 60, l: 63, a: 40 } },
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
  Nastro_Titolo: { testo: { x: 22, y: 22, l: 78, a: 16 } },
  Targa_Lapide: { testo: { x: 25, y: 30, l: 82, a: 22 } },
  Pulsante_Chiaro: { testo: { x: 16, y: 5, l: 69, a: 13 } }, // la targhetta tra le due croci
  Pulsante_Acceso: { testo: { x: 16, y: 5, l: 65, a: 13 } },
  Pulsante_Scuro: { testo: { x: 16, y: 4, l: 66, a: 13 } },
  Pulsante_Spento: { testo: { x: 16, y: 4, l: 66, a: 13 } },
};

/** Quante volte al secondo il segnale del reliquiario si accende e si spegne (come nel gioco). */
export const LAMPEGGIO_SEGNALE = 3;
