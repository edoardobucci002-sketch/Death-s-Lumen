import type { IdGrado } from './rarita';

/*
 * La mappa del Mondo, alla The Binding of Isaac (decisioni di Edoardo del 17/11): le stanze stanno su una griglia e si
 * toccano dai lati; il gioco la genera a ogni Veglia con il seme. Il generatore è in src/sistema/mappa.ts.
 */

/** Come si genera la mappa di un Mondo. */
export const MAPPA = {
  // quante stanze, comprese ingresso, Campanaro e Boss: a caso tra i due numeri a ogni Veglia (Edoardo, 17/11)
  stanze: { minimo: 12, massimo: 15 },
  // la griglia su cui cresce la mappa: l'ingresso sta al centro (Claude, da rivedere)
  griglia: { larghezza: 9, altezza: 8 },
  // mentre la mappa cresce, ogni stanza prova ad aprire una stanza nuova su ciascun lato con questa probabilità: più è
  // bassa, più la mappa viene lunga e ramificata invece che a blocco (Claude; va bene a Edoardo, 17/11)
  crescita: 0.5,
  // il Campanaro sta «a metà strada» (Edoardo, 17/11): alla distanza dall'ingresso più vicina a questa parte di quella del
  // Boss, mai attaccato all'ingresso né alla stanza del Boss
  campanaro: 0.5,
  // l'ingresso ha almeno queste porte, così le stanze con gli Echi d'inizio sono almeno due (Edoardo, 17/11)
  porteIngresso: 2,
  // le ricompense delle stanze di combattimento (tranne quelle attaccate all'ingresso, che danno gli Echi d'inizio):
  // a caso con questi pesi, oggi tutte uguali come le porte della fetta (Claude, da rivedere)
  ricompense: { luce: 1, sacro: 1, ombra: 1, terra: 1, dono: 1 },
  // se una mappa non rispetta le regole (troppo piccola, Boss non in un vicolo cieco) se ne genera un'altra con lo stesso
  // caso: al massimo questi tentativi, poi se ne tiene una qualsiasi (non deve succedere mai: lo controlla npm run prova)
  tentativi: 500,
  // porte chiuse a chiave (Edoardo, 17/11 e 18/11): da 1 a 3 per Mondo, sempre verso un vicolo cieco (mai la strada per il
  // Boss); il tesoro è sempre dietro una di loro, le altre danno una stanza con la ricompensa doppia (due giri di carte)
  serrate: { minimo: 1, massimo: 3 },
  // la chiave sicura (Edoardo, 18/11): è la ricompensa di una stanza a caso tra quelle sempre aperte, a questa distanza
  // dall'ingresso o più (le stanze accanto all'ingresso danno gli Echi d'inizio); ripulita, la chiave è a terra al centro
  chiaveSicura: { distanzaMinima: 2 },
} as const;

/**
 * La minimappa (passo 4, 18/11): in un angolo in alto, una finestra della mappa attorno alla stanza in cui si è; nella
 * pausa la mappa intera di ciò che si conosce. Le stanze visitate sono piene, quelle accanto (non ancora visitate) solo
 * con il contorno; ogni stanza ha il simbolo del suo contenuto (Campanaro, Boss, la ricompensa finché non è ripulita). Misure in pixel disegnati, ingrandite a
 * pixel interi. Tutto di Claude, da rivedere sul Galaxy S25.
 */
export const MINIMAPPA = {
  cella: { larghezza: 9, altezza: 5 }, // una stanza (le stanze sono 13 × 7 lastre: più larghe che alte)
  spazio: 1, // tra una stanza e l'altra
  finestra: { colonne: 5, righe: 5 }, // quante stanze si vedono nell'angolo, con quella in cui si è al centro
  ingrandimento: 2, // nell'angolo
  ingrandimentoPausa: 4, // nella pausa (se ci sta; se no meno)
  lato: 'sinistra' as 'sinistra' | 'destra', // in quale angolo in alto: a sinistra (Edoardo, 18/11; dal LAB si può spostare)
  colori: {
    fondo: 'rgba(13, 11, 9, 0.6)', // dietro la finestra nell'angolo
    visitata: '#8a7a66',
    qui: '#efe3c8',
    contorno: '#8a7a66',
    campanaro: '#e3913a',
    boss: '#c8343a',
    tesoro: '#f2d16b',
    sosta: '#86c5e8',
    serratura: '#e0b440', // la stanza dietro una porta chiusa a chiave (18/11)
    chiave: '#e0b440', // la stanza che dà la chiave sicura (18/11)
    sulChiaro: '#120c08', // il simbolo sulla stanza in cui si è
  },
};

/**
 * Le stanze speciali del Mondo 1 (decisioni di Edoardo del 17/11 e del 18/11): sono vuote, senza nemici e con le porte
 * aperte; al centro c'è un oggetto che si usa camminandoci sopra, una volta sola. Niente rompibili (Edoardo, 18/11).
 * - Il tesoro: in un vicolo cieco qualsiasi (non accanto all'ingresso); il forziere apre un Reliquiario di carte rare.
 * - La Sosta: la stanza da cui si entra nel Boss; la fonte riempie la fiaschetta (se non è già piena).
 */
export const STANZE_SPECIALI = {
  // il Reliquiario del tesoro: tante carte, pescate da tutte le fonti (Echi, livelli, doni) di questi gradi (Edoardo, 18/11:
  // «3 carte rare»; Amuleti e Unioni ci entreranno quando ci saranno)
  tesoro: { carte: 3, gradi: ['chiara', 'ardente'] as readonly IdGrado[] },
  // l'oggetto si usa camminandoci sopra (Edoardo, 18/11): i piedi a meno di tanti px dal suo centro (metà dell'oggetto, 33 px)
  tocco: 16,
} as const;
