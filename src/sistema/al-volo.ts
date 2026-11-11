/*
 * Sprite caricati al volo: le Pozze pixelfx (una per raggio) non si caricano all'avvio. Si carica solo la misura
 * che serve adesso; quando arriva, la scena sposta su di lei le pozze in campo e la misura vecchia si scarica
 * (immagine, dati e animazione), così in memoria video c'è sempre un foglio solo.
 * Anche l'Eclissi a 24 fotogrammi al secondo (scelta nel LAB) si carica solo quando serve e si scarica quando si torna a 12.
 */
import type Phaser from 'phaser';
import { PIXELFX } from '../data/effetti';

interface Voce { chiave: string; immagine: string; dati: string }

/** Le chiavi che Avvio.ts non deve caricare all'inizio. */
export function caricataAlVolo(chiave: string): boolean {
  return chiave.startsWith(PIXELFX.pozza.prefisso) || chiave === PIXELFX.eclissi.chiave24;
}

const inArrivo = new Set<string>();

/**
 * Un foglio caricato al volo (oggi l'Eclissi a 24 fps): vero se è pronto, con la sua animazione «<chiave>:idle».
 * Se non c'è lo chiede e restituisce falso; chi chiama intanto usa altro e richiede alla volta dopo.
 */
export function foglioPronto(scena: Phaser.Scene, chiave: string): boolean {
  if (scena.textures.exists(chiave) && scena.cache.json.exists(chiave)) {
    inArrivo.delete(chiave);
    if (!scena.anims.exists(`${chiave}:idle`)) {
      const dati = scena.cache.json.get(chiave) as { frames: { duration: number }[] };
      scena.anims.create({ key: `${chiave}:idle`, frames: dati.frames.map((f, i) => ({ key: chiave, frame: String(i), duration: f.duration })), repeat: -1 });
    }
    return true;
  }
  if (inArrivo.has(chiave)) return false;
  const voce = (scena.cache.json.get('elenco') as { asset: Voce[] } | undefined)?.asset.find((a) => a.chiave === chiave);
  if (!voce) return false;
  inArrivo.add(chiave);
  scena.load.aseprite(chiave, voce.immagine, voce.dati);
  if (!scena.load.isLoading()) scena.load.start();
  return false;
}

/** Toglie dalla memoria un foglio caricato al volo (immagine, dati e animazione). */
export function scaricaFoglio(scena: Phaser.Scene, chiave: string): void {
  if (!scena.textures.exists(chiave)) return;
  scarica(scena, chiave);
}

const stato = { caricata: '', inArrivo: '' };

/** La misura caricata adesso ('' se nessuna). */
export function pozzaCaricata(): string {
  return stato.caricata;
}

/**
 * Chiede la Pozza «chiave». Se c'è già non fa nulla; altrimenti la carica e, appena pronta, chiama
 * cambia(vecchia, nuova) per spostare le pozze in campo, poi scarica la vecchia.
 */
export function chiediPozza(scena: Phaser.Scene, chiave: string, cambia: (vecchia: string, nuova: string) => void): void {
  if (stato.caricata === chiave || stato.inArrivo === chiave) return;
  if (scena.textures.exists(chiave)) {
    // già in memoria (per esempio dopo una partita nuova): basta segnarla
    const vecchia = stato.caricata;
    stato.caricata = chiave;
    if (vecchia) (cambia(vecchia, chiave), scarica(scena, vecchia));
    return;
  }
  const elenco = scena.cache.json.get('elenco') as { asset: Voce[] } | undefined;
  const voce = elenco?.asset.find((a) => a.chiave === chiave);
  if (!voce || stato.inArrivo) return; // una per volta: la prossima richiesta arriva con la pozza dopo
  stato.inArrivo = chiave;
  scena.load.aseprite(chiave, voce.immagine, voce.dati);
  scena.load.once('complete', () => {
    stato.inArrivo = '';
    if (!scena.textures.exists(chiave)) return;
    const dati = scena.cache.json.get(chiave) as { frames: { duration: number }[] };
    if (!scena.anims.exists(`${chiave}:idle`)) {
      scena.anims.create({ key: `${chiave}:idle`, frames: dati.frames.map((f, i) => ({ key: chiave, frame: String(i), duration: f.duration })), repeat: -1 });
    }
    const vecchia = stato.caricata;
    stato.caricata = chiave;
    if (vecchia) (cambia(vecchia, chiave), scarica(scena, vecchia));
  });
  scena.load.start();
}

function scarica(scena: Phaser.Scene, chiave: string): void {
  scena.anims.remove(`${chiave}:idle`);
  scena.textures.remove(chiave);
  scena.cache.json.remove(chiave);
}
