/*
 * Effetto CRT (vecchio televisore), sopra il mondo di gioco (non sopra l'HUD). Si accende e si spegne dalla pausa del
 * gioco a stanze e dal LAB (scheda Schermo); la scelta resta sul dispositivo. Ogni ingrediente si spegne mettendolo a 0.
 * È l'unica eccezione al pixel perfect (Edoardo, 23/11), e solo quando è acceso. Tutti i valori sono da rivedere (Claude, 23/11).
 * Distanze in pixel di gioco.
 */
export const CRT = {
  accesoDiSerie: 0, // 1 = acceso alla prima apertura del gioco, 0 = spento (da rivedere)
  curvatura: 0.08, // quanto si piega lo schermo verso gli angoli, come un vetro bombato (da rivedere)
  convergenza: 0.4, // di quanto il rosso va a destra e il blu a sinistra, come i tre cannoni non allineati (da rivedere)
  sfocatura: 0.3, // 0 pixel netti, 1 pixel morbidi come sul vetro di un televisore (da rivedere)
  bloom: {
    forza: 0.45, // quanto le luci forti (lanterna, fuochi, scritte chiare) sbavano attorno (da rivedere)
    soglia: 0.5, // da che luminosità una luce comincia a sbavare: 0 tutto, 1 niente (da rivedere)
    raggio: 3, // quanto lontano arriva la sbavatura (da rivedere)
  },
  grana: 0.05, // rumore che si muove a ogni fotogramma (da rivedere)
  righe: {
    scuro: 0.32, // quanto è scura la riga: 0 invisibile, 1 nera (da rivedere)
    spessore: 0.34, // parte di ogni riga di pixel di gioco occupata dalla riga scura (da rivedere)
  },
  bordi: {
    scuro: 0.5, // quanto sono scuri gli angoli: 0 niente ombra, 1 neri (da rivedere)
    inizio: 0.55, // da dove parte l'ombra: 0 dal centro, 1 solo sugli angoli (da rivedere)
  },
};
