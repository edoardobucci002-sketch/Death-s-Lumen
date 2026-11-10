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
    massimo: 15, // numeri sullo schermo nello stesso momento: oltre, un bianco non si crea e un ambra prende il posto del bianco più vecchio (da rivedere; al massimo 64)
    // élite e Seth: i colpi che arrivano entro «finestra» secondi si sommano in un solo numero, che segue la testa del nemico (da rivedere)
    somma: {
      finestra: 0.5,
      sopra: 30, // pixel di gioco sopra la cima dello sprite: lascia il posto al simbolo dello stato
    },
    coloreAmbra: 0xe3913a, // solo critici, danno delle reazioni e numero sommato su élite e Seth; gli altri numeri sono bianchi
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
  // «Pane e vino» preso da solo (quando non resta nulla da potenziare la scelta non si apre): una scritta verde
  // sale sopra la testa del personaggio. Valori da rivedere (proposta di Claude del 10/11)
  paneDaSolo: { colore: '#6fbf4a', bordo: '#120c0a', ingrandimento: 2, durata: 1.2, sopra: 64, sale: 18 },
  // Sampietrini, finché Edoardo non disegna i suoi: la polvere dell'impatto è un anello largo quanto l'area colpita
  // (pieno, poi a retino). Valori da rivedere
  polvereSampietrini: { colore: '#b89a74', scuro: '#6e5a44', durata: 0.3 },
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

// Prova pilota pixelfx (10/11): tre effetti presi dalla libreria pixelfx, esportati come sprite a retino
// (segnaposto/EFFETTI/Pixelfx …_V0.aseprite). Si accendono dal Laboratorio (Eventi → Effetti pixelfx);
// spenti, il gioco usa i vecchi. Cambiano solo il disegno: aree, danni e tempi dei colpi restano gli stessi.
// Tutti i valori sono da rivedere.
export const PIXELFX = {
  // Pozza dell'Acqua santa: una versione per raggio; il gioco prende quella più vicina all'area vera
  // (i nomi dei file sono Pixelfx_Pozza_089 … Pixelfx_Pozza_186)
  pozza: { raggi: [89, 107, 129, 155, 186] },
  // Sepoltura: gruppi di 4 mani sparsi nell'area, un gruppo ogni «areaPerGruppo» pixel quadrati dell'ellisse,
  // con partenze sfalsate lungo tutta la durata dell'abilità
  sepoltura: { areaPerGruppo: 9000, massimo: 24, perno: [53, 71] as const, bordo: 40 },
  // Eclissi: 1,1 s, il centro della sfera nera cade sul nemico che reagisce
  eclissi: { centro: [83, 97] as const },
} as const;
