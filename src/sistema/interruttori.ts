/*
 * Interruttori di prova: modi del gioco che si accendono dal Laboratorio (o dall'indirizzo, per il bot) e restano
 * accesi finché la pagina non si ricarica. Spenti, il gioco è quello di sempre.
 */
export const INTERRUTTORI = {
  // Stati certi (la regola del gioco dal 10/11): ogni colpo lascia lo stato, con quiete e reazioni di STATI_CERTI.
  // Spento solo per i confronti: LAB «Stati a caso (vecchi)», per il bot ?stati=caso
  statiCerti: true,
  // Lanterna e Pala mirano al nemico più vicino (la regola dal 10/11, MIRA in src/data/armi.ts). Spento solo per i confronti:
  // LAB «Lanterna e Pala verso dove cammini», per il bot ?mira=0
  mira: true,
  // Grazia a tacche: scintilla e suono a ogni tacca
  taccheScintilla: true,
  taccheSuono: true,
  // prova pixelfx: Sepoltura, Pozza dell'Acqua santa ed Eclissi con gli sprite presi da pixelfx (PIXELFX in src/data/effetti.ts)
  pixelfx: false,
};
