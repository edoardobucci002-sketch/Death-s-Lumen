/*
 * Mondo, luce e comandi. Distanze in pixel di gioco, tempi in secondi.
 * Valori nuovi della M1 (la v0 non li fissava): riportati in docs/GDD_base.md, sezione 11.
 * Pensati per personaggi alti circa 80 px (sprite ingame V5): 2,35 volte quelli della v0.
 */

/** Sprite segnaposto della v0 (V0: nemici, anime): disegnati per personaggi di 34 px, si ingrandiscono di 2. */
export const INGRANDIMENTO_SEGNAPOSTO = 2;

/** Seme del caso: a parità di seme il cimitero è sempre uguale. */
export const SEME_PREDEFINITO = 1031;

/** Alone della lanterna: fuori dal raggio il buio cresce a retino. */
export const LUCE = {
  raggio: 260, // dove comincia il buio
  sfumatura: 0.9, // quanto in fretta si fa buio fuori dal raggio
  buioMassimo: 0.78, // parte di pixel neri nel buio più fitto (1 = nero pieno)
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
