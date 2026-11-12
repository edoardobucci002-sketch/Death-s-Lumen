/*
 * Gioco a stanze (pivot del 12/11): numeri della stanza. Distanze in pixel di gioco.
 * Passo 2 della fetta verticale: una stanza chiusa da muri, il Lampionaio che cammina, luce e buio come nel survivor.
 * Tutti i valori sono proposte di Claude (da rivedere): misure, colori e margini si provano sul Galaxy S25.
 */

/** La stanza: il pavimento dove si cammina e i muri intorno. */
export const STANZA = {
  // pavimento: 13 × 7 lastre da 64 px, come le stanze di The Binding of Isaac (scelta di Edoardo del 12/11, misure da rivedere):
  // la stanza intera sta più o meno in uno schermo
  larghezza: 832,
  altezza: 448,
  muroAlto: 96, // la facciata del muro in alto, vista di fronte
  muroLati: 32, // lo spessore dei muri a sinistra e a destra
  muroBasso: 32,
  // il personaggio non entra nei muri: mezza larghezza dei piedi ai lati, e quanto i piedi si avvicinano in alto e in basso
  margineLati: 18,
  margineAlto: 10,
  margineBasso: 6,
  ombraMuro: 10, // fascia scura sul pavimento ai piedi del muro in alto
  piastrella: 64, // lato di una lastra del pavimento
  mattone: { l: 32, a: 16 }, // mattoni della facciata
  seme: 1031, // disegno del pavimento e tremolio della fiamma (caso separato dalla logica)
  pausa: { lato: 14, ingrandimento: 2 }, // pulsante della pausa provvisorio: 14 pixel disegnati, ingranditi 2 volte (da rivedere)
  colori: {
    fondo: '#0d0b09', // fuori dalla stanza
    pavimento: '#2a2119',
    pavimentoChiaro: '#33281e',
    fuga: '#17120d',
    crepa: '#1f1913',
    muro: '#3a2f27',
    mattoneChiaro: '#4a3c31',
    malta: '#1c1611',
    cima: '#5a4a3c',
    lato: '#2c241e',
    ombra: '#130f0b',
  },
} as const;

/**
 * Passo 3 della fetta: l'attacco a tasto con l'arma iniziale (la Lanterna del Lampionaio).
 * Raggio, ampiezza e danno partono da quelli della Lanterna al livello 1 del survivor; la ricarica è più svelta,
 * perché ora si attacca a mano. Tutti i valori sono da rivedere: con i 5 livelli del pivot i numeri si ridistribuiscono.
 */
export const ATTACCO = {
  ricarica: 0.45, // secondi tra due colpi (la Lanterna automatica del survivor: 0,8)
  raggio: 136, // quanto arriva l'arco di luce, dal corpo del personaggio
  ampiezza: 132, // gradi dell'arco
  danno: 18, // conta dal passo 4, quando arrivano i nemici
  posa: 0.15, // secondi in cui il personaggio resta girato verso il colpo (segnaposto dell'animazione attack)
  slancio: 3, // pixel di cui il personaggio si sporge verso il colpo durante la posa (segnaposto)
  // tasto d'attacco sul telefono, in basso a destra (stile Brawl Stars): disegnato dal codice finché non c'è quello di Edoardo
  tasto: { raggio: 22, ingrandimento: 2, margine: 14 }, // raggio in pixel disegnati; margine dal bordo sicuro, in pixel di gioco
  trascina: { raggio: 52, zonaMorta: 0.3 }, // punti dello schermo: sotto la zona morta il tocco è un tocco (mira automatica)
  mira: { colore: '#e3913a', spessore: 2 }, // la mira a terra mentre si trascina
} as const;
