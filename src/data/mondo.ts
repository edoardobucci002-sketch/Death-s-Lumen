/*
 * Mondo, luce e comandi. Distanze in pixel di gioco, tempi in secondi.
 * Valori nuovi della M1 (la v0 non li fissava): riportati in docs/GDD_base.md, sezione 11.
 * Pensati per personaggi alti circa 80 px (sprite ingame V5): 2,35 volte quelli della v0.
 */

/** Sprite segnaposto della v0 (V0: nemici, anime): disegnati per personaggi di 34 px, si ingrandiscono di 2. */
export const INGRANDIMENTO_SEGNAPOSTO = 2;

/** Seme del caso: a parità di seme il cimitero è sempre uguale. */
export const SEME_PREDEFINITO = 1031;

/** Disegni al secondo, su tutti i dispositivi (0 = nessun limite); la logica resta a 60 passi. margine: vedi src/sistema/fotogrammi.ts. */
export const FOTOGRAMMI = { limite: 60, margine: 1 };

/**
 * Prova prestazioni del LAB (da rivedere). Obiettivo sul telefono minimo: media 60 fps, peggiore mai sotto 45.
 * La notte si ferma a secondiFine, prima dell'alba: così la prova non arriva mai alla fine e non salva niente.
 */
export const PRESTAZIONI = { personaggio: 'lampionaio', minuto: 14, secondiFine: 870, nemici: 400, secondi: 60, avvio: 3, blocco: 100, livello: 100, livelloArmi: 8, lanterna: { dx: 110, dy: -120 } };

/** Link di prova: ogni quanti secondi controlla se c'è una versione nuova (da rivedere). */
export const AGGIORNAMENTI = { ogni: 120 };

/** Alone della lanterna: fuori dal raggio il buio cresce a retino. */
export const LUCE = {
  raggio: 260, // dove comincia il buio
  quotaSchermo: 0.36, // il raggio non supera questa parte del lato corto del campo: sul telefono il buio si deve vedere
  sfumatura: 1.5, // quanto in fretta si fa buio fuori dal raggio
  buioMassimo: 0.88, // parte di pixel neri nel buio più fitto (1 = nero pieno)
  coloreAlone: '#2e1b0a', // il calore sommato al terreno dentro la luce
  densitaAlone: 0.75, // parte di pixel accesi al centro dell'alone
  raggioAlone: 1.15, // l'alone arriva a tante volte il raggio
  altezza: 42, // centro della luce sopra i piedi del personaggio
  tremolio: 7, // di quanti pixel varia il raggio quando la fiamma tremola
  intervalloTremolio: 0.12,
  colore: '#080605',
} as const;

/** Terreno del cimitero: un riquadro che si ripete senza bordi. */
export const TERRENO = {
  lato: 1120, // dimensione del riquadro che si ripete
  cella: 56, // griglia su cui si posano tombe, croci ed erba
  tombe: 0.04, // probabilità per cella
  croci: 0.02,
  erba: 0.24,
  colori: {
    terra: '#17130f',
    macchia: '#1c1813',
    pietra: '#3d3832',
    pietraLuce: '#4a443c',
    croce: '#37322b',
    ombra: '#0e0b09',
    erba: '#26251a',
  },
} as const;

/** Joystick virtuale (pixel dello schermo, non di gioco). */
export const JOYSTICK = {
  raggio: 44, // quanto si sposta il pomello prima di andare al massimo
  zonaMorta: 0.18, // sotto questa frazione del raggio il personaggio sta fermo
} as const;

/**
 * Sprite provvisori della v0 (versione V0): i piedi non sono in basso al centro.
 * Coordinate dei piedi dentro il fotogramma. Gli sprite di Edoardo usano la regola normale.
 */
export const PIEDI_SEGNAPOSTO = { x: 28, y: 61 } as const;

/** Barra della salute sotto i piedi del personaggio (pixel di gioco). Il disegno è HUD/Barre/Barra_Salute_*. */
export const BARRA_SALUTE = {
  distanza: 5, // quanto sotto i piedi
} as const;
