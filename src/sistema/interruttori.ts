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
  // effetti pixelfx (di serie dall'11/11): Pozza dell'Acqua santa ed Eclissi con gli sprite presi da pixelfx (PIXELFX in
  // src/data/effetti.ts). Spento solo per i confronti: LAB «Effetti pixelfx: no»
  pixelfx: true,
  // Sepoltura pixelfx: spenta finché non si rifà dopo il rework del combattimento (i file restano); LAB «Sepoltura pixelfx»
  sepolturaPixelfx: false,
  // Prova «pochi e forti» (12/11, spenta di partenza; numeri in POCHI_E_FORTI, src/data/nemici.ts): LAB → Eventi, per il bot ?pochi=1 e ?schermo=1.
  // pochi: un terzo dei nemici in campo e delle comparse, nemici comuni con il triplo di salute e di anime
  pochi: false,
  // schermo: le armi non colpiscono, non lasciano stati e non scelgono bersagli fuori dal campo visibile
  schermo: false,
  provaConEffetti: false, // la Prova prestazioni fa partire Sepoltura, Pozza grande ed Eclissi a ripetizione (PRESTAZIONI.effetti)
};
