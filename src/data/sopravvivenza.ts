/*
 * Fiaschetta di lumen e Grazia (tappa 2 della proposta su oggetti e build, M8).
 * Tempi in secondi, distanze in pixel di gioco. Ogni modifica qui va riportata anche nel GDD.
 */

/** Fiaschetta: cure contate. Si beve con il pulsante accanto all'abilità o con il tasto F. */
export const FIASCHETTA = {
  sorsi: 3, // all'inizio della notte e, senza Lacrima di lumen, al massimo
  cura: 0.35, // ogni sorso cura il 35% della salute massima…
  durata: 1, // …in 1 secondo
  perElite: 1, // sorsi che tornano uccidendo un'élite (il Mietitore la riempie tutta)
  // disegno di Edoardo, quando c'è (HUD/Pulsanti/Fiaschetta_Lumen_Tonda_V#.aseprite); finché manca il pulsante si compone dal codice:
  // la cornice dell'abilità con dentro la fiala. Sta a «distanza» pixel disegnati dall'abilità, su computer e tablet
  arte: 'Fiaschetta_Lumen_Tonda',
  distanza: 12,
  colori: { bordo: '#000000', vetro: '#d8cfc0', liquido: '#e3913a', luce: '#ffd27a', vuoto: '#2a1f17' },
} as const;

/**
 * Grazia: il premio per chi schiva all'ultimo istante. Scatta uscendo da un cerchio rosso del Mietitore
 * negli ultimi istanti prima del colpo, o lasciandosi sfiorare da una falce spettrale senza esserne toccati.
 */
export const GRAZIA = {
  finestra: 0.25, // eri dentro il cerchio quando mancavano al massimo 0,25 s al colpo
  sfioro: 30, // una falce ti passa entro 30 px oltre il bordo senza toccarti
  durata: 3,
  danno: 0.3, // +30% danno
  velocita: 0.15, // +15% velocità
  alone: 0x707070, // colore aggiunto allo sprite, a lampi, mentre dura
  lampi: 10, // lampi al secondo
} as const;
