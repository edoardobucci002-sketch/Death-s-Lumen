/*
 * Effetti dei colpi: durate, grandezze e colori. Non cambiano il bilanciamento, solo quanto i colpi «si sentono».
 * Tempi in secondi, distanze in pixel di gioco. Riportati in docs/GDD_base.md, sezione 11.
 */
export const EFFETTI = {
  numeri: {
    durata: 0.55, // quanto resta il numero del danno
    salita: 22, // di quanto sale
    sparpaglio: 8, // spostamento a caso a destra o a sinistra, per non sovrapporli
    ingrandimento: 2, // le cifre sono 3×5 pixel: si disegnano grandi il doppio
    forte: 40, // da questo danno in su il numero è ambra
    coloreForte: 0xe3913a,
  },
  scoppio: {
    durata: 0.2, // nemico che muore
    ingrandimento: 2,
    colore: '#e8dcc4',
    bordo: '#ffffff',
  },
  arco: {
    durata: 0.12, // arco della Lanterna: metà pieno, metà a retino
    spessore: 6,
    colore: '#e3913a',
    bordo: '#ffe2a8',
    interno: '#9a5a1e',
  },
  impattoPala: 0.22, // durata dell'impatto della pala
  esplosione: 0.18, // durata dell'esplosione dei dardi del bastone
  scossaPala: { forza: 2, durata: 0.1 }, // la pala scuote lo schermo quando colpisce qualcuno
} as const;
