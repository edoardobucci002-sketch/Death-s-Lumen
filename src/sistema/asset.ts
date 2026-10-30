/*
 * Elenco degli asset esportati da Aseprite (public/assets/elenco.json),
 * generato da `npm run asset`. Il gioco non nomina mai i file a mano.
 */
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
