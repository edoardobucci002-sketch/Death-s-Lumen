/*
 * Anime, esperienza e scelta dei doni. Valori dal GDD (docs/GDD_base.md, sezioni 8 e 9),
 * con le distanze della v0 × 2,35. Ogni modifica qui va riportata anche nel GDD.
 */

/**
 * Anime per passare dal livello L al successivo: base + perLivello × L + alQuadrato × L² (ora 2 + 3 L + L²).
 * M8: prima era ⌊4 + 3,2 L + 2 × max(0, L − 12)^1,8⌋ e il bot arrivava al livello 45 al minuto 5 e 100 all'alba;
 * così i primi livelli arrivano svelti e quelli alti costano molto di più.
 */
export const LIVELLI = { base: 2, perLivello: 3, alQuadrato: 1 } as const;
export function animePerLivello(l: number): number {
  return LIVELLI.base + LIVELLI.perLivello * l + LIVELLI.alQuadrato * l * l;
}

export const ANIME = {
  massimeATerra: 320, // oltre, la nuova prende il posto (e il valore) della più lontana dal personaggio
  media: 6, // da 6 anime in su il cristallo è verde…
  grande: 20, // …da 20 in su ambra
  sprite: { piccola: 'Anima_piccola', media: 'Anima_media', grande: 'Anima_grande' },
  ingrandimento: 3, // i cristalli della v0 sono piccoli: si disegnano grandi il triplo, sopra il buio
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
