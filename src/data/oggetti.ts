/*
 * Oggetti a terra (pane, calamita, reliquiari) e fine della notte.
 * Valori dal GDD (docs/GDD_base.md, sezioni 1 e 8). Ogni modifica qui va riportata anche nel GDD.
 */
export const DROP = {
  // da ogni nemico, ma al massimo uno ogni tot secondi: dal minuto 5 si uccidono circa 2000 nemici al minuto,
  // e senza limite cadevano 18 pani e 5 calamite al minuto (M8, dopo la prova di Edoardo)
  pane: { probabilita: 0.009, ogni: 45, cura: 40, sprite: 'Pane' },
  calamita: { probabilita: 0.0025, ogni: 180, sprite: 'Calamita_drop' }, // attira tutte le anime della mappa
  // la Cera cade rara (molto meno delle anime): da un nemico comune, più gocce da élite e Seth.
  // La Cera di una veglia = gocce raccolte + il premio dell'alba (data/meta.ts)
  cera: { probabilita: 0.004, perElite: 3, perSeth: 10, ingrandimento: 2, volo: 260, sprite: 'Goccia_cera' },
  frammento: { ingrandimento: 2, sprite: 'Frammento', colori: 3 }, // lo lasciano le urne (data/rompibili.ts); un colore per fotogramma: rosso, verde, blu scuro
  reliquiario: {
    sprite: 'Reliquiario',
    potenziamenti: 1, // quanti potenziamenti dà di solito…
    potenziamentiRari: 3, // …e quanti nel caso raro
    raro: 0.25, // probabilità del caso raro
    cura: 40, // se è già tutto al massimo
  },
  presa: 40, // a questa distanza dal personaggio l'oggetto è raccolto
  ingrandimento: 3, // le icone della v0 sono piccole
  frecciaMargine: 28, // le frecce dei reliquiari fuori schermo stanno a tanti pixel dal bordo
} as const;

/** La notte dura 15 minuti: all'alba si vince. */
export const ALBA = 15 * 60; // secondi
