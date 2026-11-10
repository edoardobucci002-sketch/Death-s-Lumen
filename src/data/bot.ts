/*
 * Il bot delle simulazioni di bilanciamento (npm run sim): come cammina, quali carte preferisce, quando usa l'abilità.
 * Non sono numeri del gioco: servono a far giocare il bot come un giocatore discreto, non perfetto.
 */
import type { IdArma } from './armi';
import type { IdDono } from './doni';
import type { IdAmuleto } from './rosario';

export const BOT = {
  direzioni: 16, // a ogni passo prova 16 direzioni e sceglie la più sicura
  sguardo: 120, // quanto lontano guarda in ogni direzione (pixel di gioco)
  pericolo: 340, // i nemici più lontani di così non lo preoccupano
  pesoElite: 2.5, // un'élite fa paura come 2,5 nemici normali
  pesoMietitore: 8,
  pesoBruto: 2,
  schivata: 3, // quando il Mietitore pulsa o scatta, quanto preferisce spostarsi di lato rispetto allo scatto
  distanzaSchivata: 700, // entro questa distanza dal Mietitore
  pesoArea: 40, // quanto evita di trovarsi dentro un cerchio rosso che sta per colpire
  margineArea: 30, // pixel di sicurezza oltre il bordo del cerchio
  areaMinima: 60, // i cerchi più piccoli sono solo i segni della chiamata: non fanno male
  pesoFalce: 4, // una falce spettrale fa paura come 4 nemici
  anticipoFalci: 0.25, // guarda dove sarà la falce tra 0,25 s
  // le armi che colpiscono dove cammini (Lanterna, Pala): il bot gira intorno ai nemici tenendoli davanti
  attaccoDavanti: { lanterna: 0.8, pala: 0.8 } as Partial<Record<IdArma, number>>,
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
  curaSotto: 0.6,
  beviSotto: 0.4, // beve un sorso della fiaschetta sotto il 40% di salute // la Benedizione (che cura) anche quando la salute scende sotto il 60%
  // carte: più alto = la preferisce
  carte: { armaIniziale: 5, armaPosseduta: 4, armaNuova: 3.6, passivoPosseduto: 2.6, passivoNuovo: 3, pane: 0 },
  // amuleti del Rosario: più alto = lo preferisce; 0 = non lo prende mai (come un giocatore cauto: solo quelli con rovescio lieve; il bot non va mai in Peccato né spegne amuleti)
  amuletiPreferiti: { specchioRotto: 0, lanternaCieca: 0, cuoreAvido: 0, sangueFreddo: 0.8, martire: 0, danzaMacabra: 0.7, ceriGemelli: 0.9, lucciola: 1, ossaDelite: 0.8, pattoDiSangue: 0 } satisfies Record<IdAmuleto, number>,
  massimoArmi: 4, // oltre, non prende armi nuove
  // armi nuove: più alto = la preferisce (dalle simulazioni: come un giocatore che ha capito quali rendono)
  armiPreferite: { acquaSanta: 1.15, campana: 1.1, falce: 1.1, lapide: 1.05, rosarioSpezzato: 1, candela: 0.95, lamaDiLuce: 0.95, fuocoFatuo: 0.9, veloFunebre: 0.9, corvo: 0.85 } as Partial<Record<IdArma, number>>,
  passiviPreferiti: { saleNero: 1, cuoreDiCera: 0.8, clessidra: 0.9, stoppinoLungo: 0.7, aliDiFalena: 0.5, calamita: 0.3, erbeAmare: 0.5, scudoDiFerro: 0.6, specchio: 1, ceraVotiva: 0.6, chiodoDiBara: 0.8, lacrimaDiLumen: 0.7, campanellaDArgento: 0.2 } satisfies Record<IdDono, number>,
  // velocità della simulazione: millisecondi di calcolo per ogni fotogramma del browser
  msPerFotogramma: 40,
  // modo «esplora» (?esplora=1, npm run sim -- … esplora): il seme del suo caso è mescolato con questo numero
  semeEsplora: 104729,
  // Grazia a tacche (proposta di Claude, da rivedere): sopra metà salute e fuori dalla Grazia il bot sceglie il nemico normale
  // più vicino entro «cerca» px che si può sfiorare e preferisce le direzioni che tra un passo lo lasciano a metà della fascia
  // dello sfioramento (oltre il contatto). passo = pixel guardati avanti; peso = quanto conta; sopra = parte di salute minima
  sfioro: { passo: 18, peso: 1, sopra: 0.5, cerca: 120 },
} as const;
