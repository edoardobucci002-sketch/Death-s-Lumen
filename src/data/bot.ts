/*
 * Il bot delle simulazioni di bilanciamento (npm run sim): come cammina, quali carte preferisce, quando usa l'abilità.
 * Non sono numeri del gioco: servono a far giocare il bot come un giocatore discreto, non perfetto.
 */
import type { IdArma } from './armi';
import type { IdDono } from './doni';

export const BOT = {
  direzioni: 16, // a ogni passo prova 16 direzioni e sceglie la più sicura
  sguardo: 120, // quanto lontano guarda in ogni direzione (pixel di gioco)
  pericolo: 340, // i nemici più lontani di così non lo preoccupano
  pesoElite: 2.5, // un'élite fa paura come 2,5 nemici normali
  pesoMietitore: 8,
  pesoBruto: 2,
  schivata: 3, // quando il Mietitore pulsa o scatta, quanto preferisce spostarsi di lato rispetto allo scatto
  distanzaSchivata: 700, // entro questa distanza dal Mietitore
  // le armi che colpiscono dove cammini (Lanterna, Pala): il bot gira intorno ai nemici tenendoli davanti
  attaccoDavanti: { lanterna: 1.6, pala: 1.6 } as Partial<Record<IdArma, number>>,
  portataAttacco: 260, // guarda i nemici entro questa distanza per decidere da che parte girare
  // dove andare quando non scappa
  cercaAnime: 650, // va verso l'anima più vicina entro questa distanza
  cercaOggetti: 900, // pane (se ferito), calamite e reliquiari
  pesoObiettivo: 0.6, // quanto conta avvicinarsi all'obiettivo rispetto a stare lontano dai nemici
  pesoInerzia: 0.25, // preferisce non cambiare direzione di colpo
  feritoSotto: 0.7, // sotto il 70% di salute va a prendere il pane
  giro: 0.35, // senza obiettivi cammina in cerchio: radianti al secondo
  // abilità: la usa quando ha almeno tanti nemici dentro il raggio, o con il Mietitore vicino
  nemiciPerAbilita: 10,
  curaSotto: 0.6, // la Benedizione (che cura) anche quando la salute scende sotto il 60%
  // carte: più alto = la preferisce
  carte: { armaIniziale: 5, armaPosseduta: 4, armaNuova: 3.6, passivoPosseduto: 2.6, passivoNuovo: 3, pane: 0 },
  massimoArmi: 4, // oltre, non prende armi nuove
  passiviPreferiti: { saleNero: 1, cuoreDiCera: 0.8, clessidra: 0.9, stoppinoLungo: 0.7, aliDiFalena: 0.5, calamita: 0.3, erbeAmare: 0.5, scudoDiFerro: 0.6, specchio: 1 } satisfies Record<IdDono, number>,
  // velocità della simulazione: millisecondi di calcolo per ogni fotogramma del browser
  msPerFotogramma: 40,
} as const;
