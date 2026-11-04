/*
 * Icone e disegni provvisori delle 4 armi e dei 4 doni nuovi (tappa 5): piccoli disegni 12×12 ingranditi × 2 (24×24).
 * Finché Edoardo non esporta le sue (ICONE/<Nome>/Icona_<Nome>_V#.aseprite), il gioco usa queste.
 * Le stesse immagini servono da sprite provvisori in partita: la lapide che cade, il grano, il corvo.
 */
import type Phaser from 'phaser';
import { arte, registraArte } from './arte';

const COLORI: Record<string, string> = {
  O: '#120c0a', G: '#8d8a84', L: '#b9b5ac', D: '#5e5a55', V: '#a57ae0', N: '#6a4a9a', B: '#4a5a78', C: '#7f94b8', Y: '#f2cf6a',
  W: '#f4efe4', S: '#c9c2d8', T: '#6fd6d0', A: '#2f8f92', F: '#e3913a', I: '#a8a8b0', R: '#dcdce4',
};

const DISEGNI: Record<string, string[]> = {
  Icona_Lapide: ['....OOOO....', '...OLLLLO...', '..OLLGGLLO..', '..OLGGGGLO..', '..OLLGGLLO..', '..OLLGGLLO..', '..OLLLLLGO..', '..OLLLLLGO..', '..OLLLLGGO..', '.OOOOOOOOOO.', '.ODDDDDDDDO.', '.OOOOOOOOOO.'],
  Icona_Rosario_spezzato: ['...OOOOO....', '..OVOVOVO...', '.OVO...OVO..', '.OO.....O...', '.OVO........', '.OO......O..', '.OVO....OVO.', '..OVO..OVNO.', '...OOOOOOO..', '.....ONO....', '.....OVO....', '......O.....'],
  Icona_Corvo: ['............', '........OOO.', '.......OBYOO', '......OBBBOF', '..OOOOBBCBO.', '.OBBBBBCCBO.', 'OBCCBBBCBO..', '.OBCCCBBBO..', '..OOBBBBO...', '....OOOBO...', '......O.O...', '......O.O...'],
  Icona_Velo_funebre: ['....OOOO....', '...OSSSSO...', '..OSSWWSSO..', '..OSWOOWSO..', '.OSSWOOWSSO.', '.OSSSOOSSSO.', '.OSSSSSSSSO.', 'OSSOSSSSOSSO', 'OSSOSSSSOSSO', 'OSO.OSSO.OSO', '.O..OSSO..O.', '.....OO.....'],
  Icona_Cera_votiva: ['.....OO.....', '....OFO.....', '....OYFO....', '.....OO.....', '....OWWO....', '....OWWO....', '...OWWWYO...', '...OWWWYO...', '...OWWWYO...', '...OWWYYO...', '..OYYYYYYO..', '..OOOOOOOO..'],
  Icona_Chiodo_di_bara: ['..OOOOOOOO..', '.OLRRRRRLGO.', '..OOGGGOO...', '....OLGO....', '....OLGO....', '....OLGO....', '....OLGO....', '....OLGO....', '....OLGO....', '.....OGO....', '.....OGO....', '......O.....'],
  Icona_Lacrima_di_lumen: ['.....OO.....', '.....OTO....', '....OTTO....', '....OTTTO...', '...OTWTTO...', '...OTWTTTO..', '..OTWTTTTO..', '..OTWTTTAO..', '..OTTTTTAO..', '...OTTAAO...', '....OOOO....', '............'],
  Icona_Campanella_d_argento: ['.....OO.....', '....OIRO....', '....OOOO....', '...ORRIIO...', '...ORIIIO...', '..ORRIIIIO..', '..ORIIIIIO..', '.ORRIIIIIIO.', '.OOOOOOOOOO.', '....OIIO....', '.....OO.....', '............'],
};

export function creaIconeOggetti(): void {
  for (const [k, righe] of Object.entries(DISEGNI)) {
    if (arte(k)) continue; // quella di Edoardo
    const t = document.createElement('canvas');
    t.width = t.height = 24;
    const g = t.getContext('2d')!;
    righe.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = COLORI[ch];
      g.fillRect(x * 2, y * 2, 2, 2);
    }));
    registraArte(k, t);
  }
}

export const SPRITE_LAPIDE = 'Volo_Lapide';
export const SPRITE_GRANO = 'Volo_Grano';
export const SPRITE_CORVO = 'Volo_Corvo';
export const SPRITE_VELO = 'Volo_Velo';
export const RAGGIO_VELO = 64;

/** Gli sprite provvisori delle armi nuove in partita. */
export function creaSpriteOggetti(scena: Phaser.Scene): void {
  for (const [k, icona] of [[SPRITE_LAPIDE, 'Icona_Lapide'], [SPRITE_GRANO, 'Icona_Rosario_spezzato'], [SPRITE_CORVO, 'Icona_Corvo']] as const) {
    if (!scena.textures.exists(k)) scena.textures.addCanvas(k, arte(icona)!.tela);
  }
  if (scena.textures.exists(SPRITE_VELO)) return;
  // l'aura del Velo: bordo pieno e interno a retino rado, come i cerchi delle reazioni
  const r = RAGGIO_VELO, c = document.createElement('canvas');
  c.width = c.height = r * 2 + 1;
  const g = c.getContext('2d')!;
  g.fillStyle = '#dcc07a';
  for (let y = 0; y <= 2 * r; y++) {
    for (let x = 0; x <= 2 * r; x++) {
      const d = Math.hypot(x - r, y - r);
      if (d <= r && (d > r - 2 || (x % 6 === 0 && y % 6 === 0))) g.fillRect(x, y, 1, 1);
    }
  }
  scena.textures.addCanvas(SPRITE_VELO, c);
}
