/*
 * Elenco degli asset esportati da Aseprite (public/assets/elenco.json),
 * generato da `npm run asset`. Il gioco non nomina mai i file a mano.
 */
import type Phaser from 'phaser';
import { INGRANDIMENTO_SEGNAPOSTO } from '../data/mondo';

export interface VoceAsset {
  chiave: string; // es. "Il_Lampionaio"
  categoria: string; // personaggi, nemici, effetti, oggetti
  immagine: string;
  dati: string;
  versioneFile: number; // il numero _V# del file Aseprite
  tag: string[];
}
export interface ElencoAsset {
  versione: number;
  asset: VoceAsset[];
}

export function voce(scena: Phaser.Scene, chiave: string): VoceAsset | undefined {
  return (scena.cache.json.get('elenco') as ElencoAsset).asset.find((a) => a.chiave === chiave);
}

/** Gli sprite segnaposto della v0 (V0) si ingrandiscono; quelli di Edoardo restano come sono. */
export function ingrandimento(scena: Phaser.Scene, chiave: string): number {
  return voce(scena, chiave)?.versioneFile === 0 ? INGRANDIMENTO_SEGNAPOSTO : 1;
}

/**
 * Quanto è largo un effetto disegnato, dal centro della tela al punto più lontano (in orizzontale),
 * in tutti i fotogrammi. Serve per ingrandirlo fino a coprire l'area che colpisce davvero.
 */
export function raggioDisegnato(scena: Phaser.Scene, chiave: string): number {
  const dati = scena.cache.json.get(chiave) as { frames: { spriteSourceSize: { x: number; w: number }; sourceSize: { w: number } }[] };
  const centro = dati.frames[0].sourceSize.w / 2;
  let r = 1;
  for (const f of dati.frames) r = Math.max(r, Math.abs(f.spriteSourceSize.x - centro), Math.abs(f.spriteSourceSize.x + f.spriteSourceSize.w - centro));
  return r;
}
