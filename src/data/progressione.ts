/*
 * Anime, esperienza e scelta dei doni. Valori dal GDD (docs/GDD_base.md, sezioni 8 e 9),
 * con le distanze della v0 × 2,35. Ogni modifica qui va riportata anche nel GDD.
 */

/** Anime per passare dal livello L al successivo: ⌊4 + 3,2 L + 2 × max(0, L − 12)^1,8⌋ */
export function animePerLivello(l: number): number {
  return Math.floor(4 + 3.2 * l + 2 * Math.max(0, l - 12) ** 1.8);
}

export const ANIME = {
  massimeATerra: 320, // oltre, le nuove si sommano a quelle già presenti
  media: 6, // da 6 anime in su il cristallo è verde…
  grande: 20, // …da 20 in su ambra
  sprite: { piccola: 'Anima_piccola', media: 'Anima_media', grande: 'Anima_grande' },
  volo: 420, // velocità iniziale verso il personaggio quando entra nel raggio di raccolta
  accelerazione: 900, // quanto accelera mentre vola
  presa: 24, // a questa distanza dal personaggio l'anima è raccolta
} as const;

/** Pesi delle carte a ogni livello: più alto = esce più spesso. */
export const CARTE = {
  quante: 3,
  rimescolate: 2, // per partita
  armaIniziale: 2,
  armaPosseduta: 1.5,
  armaNuova: 1,
  donoPosseduto: 1.2,
  donoNuovo: 0.9,
  livelloMassimo: 8,
  paneEVino: 40, // salute, quando non resta nulla da potenziare
} as const;
