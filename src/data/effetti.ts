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
    forte: 40, // da questo danno in su il numero ha la precedenza quando si è al limite
    ambra: 1.5, // ambra solo i critici e i colpi che valgono almeno tante volte il danno attuale dell'arma (da rivedere)
    massimo: 15, // numeri sullo schermo nello stesso momento: oltre non se ne creano (da rivedere; al massimo 64)
    // élite e Seth: i colpi che arrivano entro «finestra» secondi si sommano in un solo numero, che segue la testa del nemico (da rivedere)
    somma: {
      finestra: 0.5,
      sopra: 30, // pixel di gioco sopra la cima dello sprite: lascia il posto al simbolo dello stato
    },
    coloreForte: 0xe3913a, // il colore ambra
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
  // mosse del Mietitore: cerchi rossi a retino che pulsano prima di colpire, falci rosse che girano
  minacce: {
    colore: '#c2412d',
    bordo: '#ff7a5c',
    pulsazioni: 7, // lampeggi al secondo del preavviso; nell'ultimo tratto resta acceso
    acceso: 0.3, // secondi finali senza lampeggio
    lampo: 0.15, // quanto resta il cerchio pieno quando colpisce
    falce: 0xd8402a, // colore delle falci spettrali
    giro: 14, // rotazione delle falci (radianti al secondo)
    scossa: { forza: 3, durata: 0.15 }, // la falciata scuote lo schermo
  },
} as const;
