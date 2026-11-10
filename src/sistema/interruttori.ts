/*
 * Interruttori di prova: modi del gioco che si accendono dal Laboratorio (o dall'indirizzo, per il bot) e restano
 * accesi finché la pagina non si ricarica. Spenti, il gioco è quello di sempre.
 */
export const INTERRUTTORI = {
  statiCerti: false, // ogni colpo lascia lo stato, con quiete e reazioni nuove (STATI_CERTI in src/data/stati.ts)
  // con gli Stati certi accesi, quali reazioni usano i numeri nuovi (spente: i numeri di sempre). Per misurarle una alla volta:
  // ?stati=a (nessuna), b (Eclissi), c (Esorcismo), d (Rivelazione), e (Interramento), f o certi (tutte)
  regole: { eclissi: true, esorcismo: true, rivelazione: true, interramento: true },
  mira: false, // la Lanterna e la Pala mirano al nemico più vicino (MIRA in src/data/armi.ts); per il bot ?mira=1
  // Grazia a tacche: scintilla e suono a ogni tacca
  taccheScintilla: true,
  taccheSuono: true,
};
