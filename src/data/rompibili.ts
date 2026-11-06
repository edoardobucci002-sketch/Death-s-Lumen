/*
 * Oggetti rompibili del cimitero: urne, giare e lanterne sparse a caso (prova: tutti i valori sono da rivedere).
 * Il mondo è diviso in settori quadrati: ogni settore ha una sola estrazione, quindi le percentuali qui sotto
 * si leggono direttamente. Urna 24% + Giara 24% + Lanterna 12% + vuoto 40% = 100%.
 * Distanze in pixel di gioco, tempi in secondi.
 */
export const ROMPIBILI = {
  settore: 700, // lato di un settore (sul telefono il campo è circa 585×700: più o meno uno schermo)
  bordo: 110, // distanza minima dal bordo del settore: così due oggetti non finiscono attaccati
  raggioSettori: 2, // quanti settori intorno al personaggio sono attivi
  partenza: 320, // niente oggetti così vicini al punto di partenza
  tocco: 34, // il personaggio lo rompe a questa distanza
  raggio: 18, // quanto è grosso per i colpi delle armi
  centro: 20, // il centro dell'oggetto sta tanti pixel sopra la base
  dispersione: 14, // distanza tra le gocce di Cera che lascia
  tipi: [
    { id: 'urna', nome: 'Urna', sprite: 'Urna', probabilita: 0.24, gocce: 0, frammenti: 1, olio: 0, luce: 0 },
    { id: 'giara', nome: 'Giara', sprite: 'Giara', probabilita: 0.24, gocce: 2, frammenti: 0, olio: 0, luce: 0 },
    { id: 'lanterna', nome: 'Lanterna', sprite: 'Lanterna', probabilita: 0.12, gocce: 0, frammenti: 0, olio: 1, luce: 1 },
  ],
} as const;

/** Luce delle lanterne a terra: un foro nel buio più un alone caldo sul terreno. */
export const LUCE_LANTERNA = {
  raggio: 120, // fin qui il buio è tolto del tutto
  sfumatura: 0.9, // quanto in fretta si richiude il buio
  altezza: 22, // centro della luce sopra la base della lanterna
  tremolio: 4, // di quanti pixel varia il raggio con la fiamma
  raggioAlone: 170, // fin dove arriva il calore sul terreno
  densitaAlone: 0.9, // parte di pixel accesi al centro dell'alone
} as const;

/** La chiazza d'olio di una lanterna rotta: rallenta i nemici; un'arma di fuoco la accende e brucia. */
export const CHIAZZE = {
  raggio: 96,
  olio: 12, // secondi prima che l'olio si asciughi
  fuoco: 5, // secondi di fuoco, da quando si accende: poi la chiazza finisce
  dissolvenza: 1.2, // ultimi secondi: l'olio svanisce a retino
  intervallo: 0.4, // ogni quanto agisce sui nemici
  rallenta: 0.4, // parte di velocità tolta (Seth la subisce a metà, come ogni rallentamento)
  danno: 14, // danno del fuoco a ogni intervallo; cresce con i bonus di danno del personaggio
  scintilla: 0.12, // ogni quanto cambia il disegno del fuoco
  // le armi di fuoco, indicate dal loro proiettile: Candela e Fuoco fatuo
  accendono: ['Candela_Fiammella', 'Fuoco_fatuo_Volo'],
} as const;

/** I frammenti di vetro: tre pezzi del mosaico, riuniti danno un reliquiario. Un'urna ne contiene uno solo per fortuna. */
export const FRAMMENTI = {
  probabilita: 0.08, // quante urne ne contengono uno (da rivedere)
  perNotte: 3, // oltre questi le urne restano vuote: il mosaico si completa una volta sola a notte
  vittorie: 1, // prima di tante albe vinte le urne non ne contengono: i mosaici si aprono dopo la prima alba
  perReliquiario: 3,
  anello: 56, // raggio dell'anello che segnala il frammento, in pixel di gioco
  durataAnello: 0.5,
  scossa: 2, // scossa dello schermo, in pixel e secondi
  durataScossa: 0.15,
  coloreAnello: '#ffe08a',
  bordoAnello: '#a8761e',
} as const;
