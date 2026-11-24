/**
 * Il Campanaro, mini-boss del Mondo 1 (decisioni di Edoardo del 17/11): custode della cripta, con la sua campana.
 * Arriva nella quarta stanza, dopo le tre della fetta, da solo in un'arena vuota. Due fasi: sotto metà salute aggiunge la
 * Chiamata e gli attacchi si susseguono più in fretta. Ogni attacco ha il suo avviso a terra e lascia spazio alla
 * schivata perfetta (uscire dall'area all'ultimo istante dà la Grazia).
 * - Rintocco: un disco a terra che si riempie, poi l'onda; in fase 2 segue un anello più largo (il posto sicuro è vicino a lui).
 * - Carica: una linea a terra fino al muro, poi corre dritto; contro il muro resta stordito.
 * - Chiamata (solo fase 2): suona e fa comparire dei Ricaduti.
 * Durata obiettivo: il bot lo batte in 60–90 s (decisione del 17/11); la salute si misura con npm run sim-stanze.
 * Tutti i numeri sono proposte di Claude, da rivedere.
 */
export const CAMPANARO = {
  nome: 'Il Campanaro',
  sprite: 'Campanaro', // V1 del 19/11: pose di ChatGPT riportate alla griglia, animazioni di PixelLab (NEMICI/Campanaro)
  salute: 3000, // da rivedere (17/11: con 1200 il bot lo batteva in circa 10 s; obiettivo 60–90 s)
  raggio: 24, // il corpo
  contatto: [11, 15], // danno a chi lo tocca, da… a… (Edoardo, 20/11)
  velocita: 70, // camminando verso di te tra un attacco e l'altro
  pausa: 1.3, // secondi di camminata tra un attacco e il successivo
  vicino: 170, // più vicino di così sceglie il Rintocco, più lontano la Carica
  comparsa: 1.2, // secondi del segno a terra prima che arrivi
  rintocco: { avviso: 1.0, raggio: 150, onda: 0.25, danno: 20, recupero: 0.7 },
  // fase 2: dopo il disco, l'anello tra il raggio del Rintocco e questo, con il suo avviso
  anello: { raggio: 260, avviso: 0.7, danno: 20 },
  carica: { avviso: 0.8, larghezza: 44, velocita: 520, danno: 25, stordito: 1.5, recupero: 0.4,
    // la posa della mira e della corsa: di lato se la Carica va entro tanti gradi dall'orizzontale, altrimenti la
    // diagonale in su o in giù (anche dritto in verticale); a sinistra il gioco ribalta (Edoardo, 24/11)
    diagonale: 30 },
  chiamata: { avviso: 0.8, ricaduti: 2, ogni: 3, recupero: 0.6 }, // ogni: un attacco su tre in fase 2
  fase2: { soglia: 0.5, ritmo: 0.8 }, // sotto metà salute: pause e avvisi all'80% (gli attacchi arrivano il 20% prima)
  // la ricompensa: «sorsi» sorsi della fiaschetta (decisione di Edoardo del 17/11: un sorso vero, non più una cura diretta;
  // a fiaschetta piena si beve subito, Edoardo 17/11), Cera e le 3 carte della porta scelta;
  // il Reliquiario arriva con la sua tappa
  premio: { sorsi: 1, cera: 10 },
  colori: { avviso: '#5a1014', onda: '#efe3c8', linea: '#5a1014', barra: '#c2412d', fondoBarra: '#1a1210', bordoBarra: '#efe3c8' },
} as const;
