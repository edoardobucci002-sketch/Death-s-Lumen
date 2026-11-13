/*
 * Sprite caricati al volo: le Pozze pixelfx (una per raggio) e i Fendenti della Lanterna (uno per misura) non si
 * caricano all'avvio. Si carica solo la misura che serve adesso; quando arriva, la scena sposta su di lei gli effetti
 * in campo e la misura vecchia si scarica (immagine, dati e animazione), così in memoria video c'è un foglio per famiglia.
 */
import type Phaser from 'phaser';
import { PIXELFX } from '../data/effetti';

interface Voce { chiave: string; immagine: string; dati: string }

/** Le chiavi che Avvio.ts non deve caricare all'inizio. */
export function caricataAlVolo(chiave: string): boolean {
  return chiave.startsWith(PIXELFX.pozza.prefisso) || chiave.startsWith(PIXELFX.fendente.prefisso);
}

interface Stato { caricata: string; inArrivo: string }


const stato: Stato = { caricata: '', inArrivo: '' };
const statoFendente: Stato = { caricata: '', inArrivo: '' };

/** La misura caricata adesso ('' se nessuna). */
export function pozzaCaricata(): string {
  return stato.caricata;
}

/**
 * Chiede la Pozza «chiave». Se c'è già non fa nulla; altrimenti la carica e, appena pronta, chiama
 * cambia(vecchia, nuova) per spostare le pozze in campo, poi scarica la vecchia.
 */
export function chiediPozza(scena: Phaser.Scene, chiave: string, cambia: (vecchia: string, nuova: string) => void): void {
  chiedi(stato, scena, chiave, cambia);
}

/** Come chiediPozza, per il Fendente della Lanterna: «cambia» nasconde i fendenti in volo della misura vecchia. */
export function chiediFendente(scena: Phaser.Scene, chiave: string, cambia: (vecchia: string, nuova: string) => void): void {
  chiedi(statoFendente, scena, chiave, cambia);
}

/** Il Fendente caricato adesso ('' se nessuno). */
export function fendenteCaricato(): string {
  return statoFendente.caricata;
}

function chiedi(stato: Stato, scena: Phaser.Scene, chiave: string, cambia: (vecchia: string, nuova: string) => void): void {
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
