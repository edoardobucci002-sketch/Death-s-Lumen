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
} as const;
