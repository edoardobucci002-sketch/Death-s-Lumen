/**
 * Seth, il Rinnovato: il Boss del Mondo 1 (decisioni di Edoardo del 17/11 e del 18/11), rifatto per le stanze.
 * Combatte nella stanza doppia del Boss, da solo. Tre mosse, ognuna con il suo avviso a terra e la schivata perfetta:
 * - Falciata: uno spicchio a mezzaluna davanti a lui si riempie, poi il colpo (si esce dallo spicchio o gli si gira dietro).
 * - Falci spettrali: linee a ventaglio verso il personaggio, poi le falci volano lungo le linee (ci si mette tra due linee,
 *   o ci si fa sfiorare: Grazia).
 * - Passo della Morte: Seth affonda nel terreno e sotto il personaggio si riempie un cerchio; poi riappare lì e colpisce.
 *   In fase 2 (Edoardo, 18/11) riapparendo fa partire detriti di terreno in tutte le direzioni, fino ai muri: le loro
 *   linee a terra si vedono durante l'avviso; e subito dopo viene una Falciata.
 * Sotto metà salute la fase 2: avvisi e pause all'80%. Battuto: il Mondo 1 è completato.
 * Tutti i numeri sono proposte di Claude (ok di Edoardo alle mosse del 18/11), da rivedere; la salute si misura con
 * npm run sim-stanze (obiettivo: 90–120 s di battaglia).
 */
export const SETH = {
  nome: 'Seth, il Rinnovato',
  sprite: 'Il_Mietitore', // lo sprite del survivor (walk, hurt, special); attack e death sono da disegnare
  salute: 11000, // misurata con il bot (18/11), con le resistenze di Seth agli stati: obiettivo 90–120 s (da rivedere)
  raggio: 30, // il corpo
  contatto: [11, 19], // danno a chi lo tocca, da… a… (Edoardo, 20/11)
  velocita: 80, // camminando verso di te tra un attacco e l'altro
  pausa: 1.2, // secondi di camminata tra un attacco e il successivo
  vicino: 200, // più vicino di così sceglie la Falciata, più lontano le Falci spettrali
  passoOgni: 3, // un attacco su tre è il Passo della Morte
  comparsa: 1.5, // secondi del segno a terra prima che arrivi
  attesa: 1.0, // secondi dall'ingresso nella stanza al suo segno a terra
  // Falciata: lo spicchio (ampiezza in gradi, raggio in px) davanti a lui, verso dove eri quando è cominciata
  falciata: { avviso: 0.9, raggio: 160, ampiezza: 180, danno: 25, recupero: 0.6 },
  // Falci spettrali: «quante» linee a ventaglio larghe «ventaglio» gradi; le falci volano dritte fino al muro
  falci: { avviso: 0.6, quante: 5, ventaglio: 50, velocita: 330, raggio: 12, danno: 16, recupero: 0.5 },
  // Passo della Morte: il cerchio sotto il personaggio (fermo dove eri all'inizio), poi Seth riappare lì
  passo: { avviso: 1.0, raggio: 70, danno: 30, recupero: 0.7 },
  // fase 2: i detriti partono dal punto in cui riappare, a raggiera, fino ai muri (Edoardo, 18/11)
  detriti: { quanti: 12, velocita: 300, raggio: 8, danno: 12 },
  fase2: { soglia: 0.5, ritmo: 0.8 }, // sotto metà salute: pause e avvisi all'80%
  premio: { cera: 25 }, // battuto Seth: Cera alla Cappella, con la fine del Mondo 1
  colori: {
    avviso: '#4a0c12', // il pieno degli avvisi a terra (rosso scuro, come il survivor)
    bordo: '#efe3c8', // i bordi degli avvisi, sopra il buio
    falce: '#e0303a',
    falceChiara: '#ffb0a8',
    detrito: '#6b5640',
    detritoChiaro: '#a08866',
    barra: '#8e1a24',
    fondoBarra: '#1a1210',
    bordoBarra: '#efe3c8',
  },
} as const;
