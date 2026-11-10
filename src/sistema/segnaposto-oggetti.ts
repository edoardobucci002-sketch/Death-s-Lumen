/*
 * Icone e disegni provvisori delle armi nuove (tappa 5 e Sampietrini) e dei 4 doni nuovi: piccoli disegni 12×12 ingranditi × 2 (24×24).
 * Finché Edoardo non esporta le sue (ICONE/<Nome>/Icona_<Nome>_V#.aseprite), il gioco usa queste.
 * Le stesse immagini servono da sprite provvisori in partita: la lapide che cade, il grano, il corvo.
 */
import type Phaser from 'phaser';
import { ARMI_COMUNI, ARMI_INIZIALI } from '../data/armi';
import { iconaUnione, UNIONI } from '../data/unioni';
import { arte, registraArte } from './arte';

const COLORI: Record<string, string> = {
  O: '#120c0a', G: '#8d8a84', L: '#b9b5ac', D: '#5e5a55', V: '#a57ae0', N: '#6a4a9a', B: '#4a5a78', C: '#7f94b8', Y: '#f2cf6a',
  W: '#f4efe4', S: '#c9c2d8', T: '#6fd6d0', A: '#2f8f92', F: '#e3913a', I: '#a8a8b0', R: '#dcdce4',
};

const DISEGNI: Record<string, string[]> = {
  Icona_Lapide: ['....OOOO....', '...OLLLLO...', '..OLLGGLLO..', '..OLGGGGLO..', '..OLLGGLLO..', '..OLLGGLLO..', '..OLLLLLGO..', '..OLLLLLGO..', '..OLLLLGGO..', '.OOOOOOOOOO.', '.ODDDDDDDDO.', '.OOOOOOOOOO.'],
  Icona_Rosario_spezzato: ['...OOOOO....', '..OVOVOVO...', '.OVO...OVO..', '.OO.....O...', '.OVO........', '.OO......O..', '.OVO....OVO.', '..OVO..OVNO.', '...OOOOOOO..', '.....ONO....', '.....OVO....', '......O.....'],
  Icona_Corvo: ['............', '........OOO.', '.......OBYOO', '......OBBBOF', '..OOOOBBCBO.', '.OBBBBBCCBO.', 'OBCCBBBCBO..', '.OBCCCBBBO..', '..OOBBBBO...', '....OOOBO...', '......O.O...', '......O.O...'],
  Icona_Sampietrini: ['............', '..OOOO......', '.OLLLGO.....', '.OLGGGO.OOO.', '.OGGGDO.OLLO', '..OOOO.OLGGO', '...OOOO.OGDO', '..OLLLGO.OO.', '..OLGGGDO...', '..OGGGDDO...', '...OOOOOO...', '............'],
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

/** Icone provvisorie delle unioni: l'icona dell'arma con quattro angoli d'oro (24×24). */
export function creaIconeUnioni(): void {
  const armi = [...Object.values(ARMI_INIZIALI), ...ARMI_COMUNI];
  for (const u of UNIONI) {
    const k = iconaUnione(u.id), base = arte(armi.find((a) => a.id === u.arma)!.icona);
    if (arte(k) || !base) continue;
    const t = document.createElement('canvas');
    t.width = t.height = 24;
    const g = t.getContext('2d')!;
    g.drawImage(base.tela, Math.round((24 - base.w) / 2), Math.round((24 - base.h) / 2));
    g.fillStyle = '#f2cf6a';
    for (const [x, y, w, h] of [[0, 0, 7, 2], [0, 0, 2, 7], [17, 0, 7, 2], [22, 0, 2, 7], [0, 22, 7, 2], [0, 17, 2, 7], [17, 22, 7, 2], [22, 17, 2, 7]]) g.fillRect(x, y, w, h);
    registraArte(k, t);
  }
}

export const SPRITE_SCIA = 'Volo_Scia';
export const SPRITE_LAPIDE = 'Volo_Lapide';
export const SPRITE_SASSO = 'Volo_Sasso';
export const SPRITE_GRANO = 'Volo_Grano';
export const SPRITE_CORVO = 'Volo_Corvo';
export const SPRITE_VELO = 'Volo_Velo';
export const RAGGIO_VELO = 64;

/** Gli sprite provvisori delle armi nuove in partita. */
export function creaSpriteOggetti(scena: Phaser.Scene): void {
  for (const [k, icona] of [[SPRITE_LAPIDE, 'Icona_Lapide'], [SPRITE_GRANO, 'Icona_Rosario_spezzato'], [SPRITE_CORVO, 'Icona_Corvo']] as const) {
    if (!scena.textures.exists(k)) scena.textures.addCanvas(k, arte(icona)!.tela);
  }
  if (!scena.textures.exists(SPRITE_SASSO)) {
    // il sampietrino in volo, 6×5 (segnaposto)
    const c = document.createElement('canvas');
    c.width = 6;
    c.height = 5;
    const g = c.getContext('2d')!;
    ['.OOOO.', 'OLLLGO', 'OLGGDO', 'OGGDDO', '.OOOO.'].forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = COLORI[ch];
      g.fillRect(x, y, 1, 1);
    }));
    scena.textures.addCanvas(SPRITE_SASSO, c);
  }
  if (!scena.textures.exists(SPRITE_SCIA)) {
    // una fiammella della scia del Candelabro funebre, 7×9
    const c = document.createElement('canvas');
    c.width = 7;
    c.height = 9;
    const g = c.getContext('2d')!;
    ['...O...', '..OFO..', '..OFO..', '.OFYFO.', '.OFYFO.', 'OFYWYFO', 'OFYWYFO', '.OFYFO.', '..OOO..'].forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = COLORI[ch];
      g.fillRect(x, y, 1, 1);
    }));
    scena.textures.addCanvas(SPRITE_SCIA, c);
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
