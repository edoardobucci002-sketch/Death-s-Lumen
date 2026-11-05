/*
 * Oggetti rompibili del cimitero: urne, giare e lanterne sparse a caso (prova: tutti i valori sono da rivedere).
 * Il mondo è diviso in settori quadrati: in ogni settore può esserci un oggetto, sempre lo stesso in quella notte.
 * Distanze in pixel di gioco.
 */
export const ROMPIBILI = {
  settore: 700, // lato di un settore
  probabilita: 0.6, // quanti settori hanno un oggetto
  bordo: 110, // distanza minima dal bordo del settore: così due oggetti non finiscono attaccati
  raggioSettori: 2, // quanti settori intorno al personaggio sono attivi
  partenza: 320, // niente oggetti così vicini al punto di partenza
  tocco: 34, // il personaggio lo rompe a questa distanza
  colpo: 70, // lo rompe anche un colpo d'arma su un nemico entro questa distanza
  dispersione: 14, // distanza tra le gocce di Cera che lascia
  tipi: [
    { id: 'urna', nome: 'Urna', sprite: 'Urna', peso: 4, gocce: 1, luce: 0 },
    { id: 'giara', nome: 'Giara', sprite: 'Giara', peso: 4, gocce: 2, luce: 0 },
    { id: 'lanterna', nome: 'Lanterna', sprite: 'Lanterna', peso: 2, gocce: 1, luce: 1 },
  ],
} as const;

/** Luce delle lanterne a terra: un foro nel buio, con lo stesso retino dell'alone del personaggio. */
export const LUCE_LANTERNA = {
  raggio: 120, // fin qui si vede pieno
  sfumatura: 0.9, // quanto in fretta si richiude il buio
  altezza: 22, // centro della luce sopra la base della lanterna
  tremolio: 4, // di quanti pixel varia il raggio con la fiamma
} as const;
