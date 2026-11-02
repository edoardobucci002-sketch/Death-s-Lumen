/*
 * Oggetti a terra (pane, calamita, reliquiari) e fine della notte.
 * Valori dal GDD (docs/GDD_base.md, sezioni 1 e 8). Ogni modifica qui va riportata anche nel GDD.
 */
export const DROP = {
  pane: { probabilita: 0.009, cura: 30, sprite: 'Pane' }, // da ogni nemico
  calamita: { probabilita: 0.0025, sprite: 'Calamita_drop' }, // attira tutte le anime della mappa
  reliquiario: {
    sprite: 'Reliquiario',
    tre: 0.25, // 25% tre potenziamenti, altrimenti uno
    cura: 40, // se è già tutto al massimo
  },
  presa: 40, // a questa distanza dal personaggio l'oggetto è raccolto
  ingrandimento: 3, // le icone della v0 sono piccole
  frecciaMargine: 28, // le frecce dei reliquiari fuori schermo stanno a tanti pixel dal bordo
} as const;

/** La notte dura 15 minuti: all'alba si vince. */
export const ALBA = 15 * 60; // secondi
