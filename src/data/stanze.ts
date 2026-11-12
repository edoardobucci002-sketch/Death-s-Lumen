/*
 * Gioco a stanze (pivot del 12/11): numeri della stanza. Distanze in pixel di gioco.
 * Passo 2 della fetta verticale: una stanza chiusa da muri, il Lampionaio che cammina, luce e buio come nel survivor.
 * Tutti i valori sono proposte di Claude (da rivedere): misure, colori e margini si provano sul Galaxy S25.
 */

/** La stanza: il pavimento dove si cammina e i muri intorno. */
export const STANZA = {
  larghezza: 1600, // pavimento (da rivedere): più largo dello schermo del telefono in orizzontale, la telecamera segue
  altezza: 1000,
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
