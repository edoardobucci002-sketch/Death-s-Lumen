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
  // «Pane e vino» preso da solo (quando non resta nulla da potenziare la scelta non si apre): la scritta verde «Pane e vino +40 salute»
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

// Effetti pixelfx: presi dalla libreria pixelfx, esportati come sprite a retino (segnaposto/EFFETTI/Pixelfx …_V0.aseprite).
// Pozza ed Eclissi sono di serie dall'11/11 (spegnibili dal Laboratorio, Eventi → Effetti pixelfx); la Sepoltura è spenta
// finché non si rifà dopo il rework del combattimento. Cambiano solo il disegno: aree, danni e tempi dei colpi restano gli stessi.
export const PIXELFX = {
  // Pozza dell'Acqua santa: una versione per raggio; il gioco prende quella più vicina all'area vera
  // (i nomi dei file sono Pixelfx_Pozza_089 … Pixelfx_Pozza_186). Si carica solo quella in uso (src/sistema/al-volo.ts)
  pozza: { raggi: [89, 107, 129, 155, 186], prefisso: 'Pixelfx_Pozza_' },
  // Sepoltura (Edoardo, 10/11): gruppi di 4 mani solo lungo il bordo dell'area, i piedi delle mani dentro una fascia
  // larga «fascia» px dal bordo, centro vuoto; «gruppi» gruppi a passi regolari intorno all'ellisse (con un po' di caso),
  // partenze sfalsate lungo tutta la durata dell'abilità. perno: i piedi del gruppo nel foglio
  sepoltura: { gruppi: 8, fascia: 40, perno: [52, 71] as const },
  // Eclissi: 1,1 s a 12 fotogrammi al secondo, il centro della sfera nera cade sul nemico che reagisce (punto del foglio)
  eclissi: { centro: [83, 89] as const },
  // Fendente della Lanterna nel gioco a stanze (decisione di Edoardo del 13/11, al posto dell'arco sottile): un foglio per
  // misura della Lanterna [raggio, ampiezza in gradi] (Pixelfx_Fendente_136 …); il gioco prende quello col raggio più
  // vicino all'area vera (da rivedere: con i bonus d'area il disegno può restare un po' più piccolo dell'area).
  // In ogni foglio «direzioni» × «fotogrammi» in fila (0°, 22,5°, 45°), «passo» secondi l'uno; si carica solo quello in uso
  fendente: { misure: [[136, 132], [160, 132], [183, 166]] as const, prefisso: 'Pixelfx_Fendente_', direzioni: 3, fotogrammi: 6, passo: 0.04 },
} as const;
