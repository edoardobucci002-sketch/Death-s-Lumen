/*
 * Stanza (gioco a stanze): pavimento a lastre e muri intorno. Il pavimento va da (0, 0) a (larghezza, altezza);
 * i muri stanno fuori da quel rettangolo. Tutto a pixel interi, senza sfumature.
 * Dal 16/11 la stanza del Mondo 1 è la cripta disegnata (AMBIENTI/Cripta, numeri in CRIPTA): a ogni stanza le lastre e i
 * pezzi della facciata si scelgono a caso con il seme, e si compone un'unica immagine. Se i file mancano, o se il LAB lo
 * chiede, resta il disegno del codice di prima (lastre e mattoni), come riserva.
 */
import Phaser from 'phaser';
import { CRIPTA, STANZA } from '../data/stanze';
import { PROFONDITA } from './effetti';
import { Caso } from './caso';

const PAVIMENTO = 'stanza-pavimento';
const FACCIATA = 'stanza-facciata';
const LATO = 'stanza-lato';

type Disegna = (x: number, y: number, w: number, h: number, colore: string) => void;

function tela(scena: Phaser.Scene, chiave: string, w: number, h: number, disegna: (r: Disegna) => void): void {
  if (scena.textures.exists(chiave)) scena.textures.remove(chiave);
  const t = scena.textures.createCanvas(chiave, w, h)!;
  const g = t.getContext();
  disegna((x, y, l, a, colore) => {
    g.fillStyle = colore;
    g.fillRect(x, y, l, a);
  });
  t.refresh();
}

/** Lastre di pietra: quattro per riquadro, ognuna con qualche macchia e una crepa ogni tanto. */
function creaPavimento(scena: Phaser.Scene): void {
  const { piastrella: p, colori: c } = STANZA;
  const lato = p * 2;
  const caso = new Caso(STANZA.seme);
  tela(scena, PAVIMENTO, lato, lato, (r) => {
    r(0, 0, lato, lato, c.pavimento);
    for (let y = 0; y < lato; y += p) {
      for (let x = 0; x < lato; x += p) {
        for (let i = 0; i < 14; i++) r(x + caso.intero(2, p - 5), y + caso.intero(2, p - 4), caso.intero(1, 3), caso.intero(1, 2), c.pavimentoChiaro);
        if (caso.numero() < 0.35) {
          let cx = x + caso.intero(8, p - 16), cy = y + caso.intero(8, p - 16);
          for (let k = 0; k < 6; k++) {
            r(cx, cy, 2, 1, c.crepa);
            cx += caso.intero(1, 3);
            cy += caso.intero(0, 2);
          }
        }
        r(x, y, p, 1, c.fuga); // fughe tra le lastre
        r(x, y, 1, p, c.fuga);
      }
    }
  });
}

/** Facciata a mattoni sfalsati (muro in alto) e pietra scura per i lati e il muro in basso. */
function creaMuri(scena: Phaser.Scene): void {
  const { mattone: m, colori: c } = STANZA;
  const caso = new Caso(STANZA.seme + 1);
  tela(scena, FACCIATA, m.l * 2, m.a * 2, (r) => {
    r(0, 0, m.l * 2, m.a * 2, c.malta);
    for (let riga = 0; riga < 2; riga++) {
      const sposta = riga ? m.l / 2 : 0;
      for (let k = -1; k < 2; k++) {
        const x = k * m.l + sposta;
        r(x + 1, riga * m.a + 1, m.l - 2, m.a - 2, c.muro);
        r(x + 1, riga * m.a + 1, m.l - 2, 1, c.mattoneChiaro);
        if (caso.numero() < 0.5) r(x + caso.intero(4, m.l - 8), riga * m.a + caso.intero(4, m.a - 5), 3, 1, c.mattoneChiaro);
      }
    }
  });
  tela(scena, LATO, 16, 16, (r) => {
    r(0, 0, 16, 16, c.lato);
    r(0, 0, 16, 1, c.malta);
    r(caso.intero(2, 10), caso.intero(3, 12), 3, 1, c.muro);
  });
}

/** Il rettangolo dove possono stare i piedi del personaggio. */
export function areaCamminabile(): { x0: number; y0: number; x1: number; y1: number } {
  const s = STANZA;
  return { x0: s.margineLati, y0: s.margineAlto, x1: s.larghezza - s.margineLati, y1: s.altezza - s.margineBasso };
}

/** Il LAB può tornare al disegno del codice per confrontarlo con la cripta (scheda Stanze → «Stanza dal codice»). */
export const ARTE_STANZA = { codice: false };

/** La cripta disegnata è pronta (i quattro file esportati) e il LAB non chiede il disegno del codice. */
export function criptaPronta(scena: Phaser.Scene): boolean {
  const c = CRIPTA;
  return !ARTE_STANZA.codice && [c.pavimento, c.facciata, c.muri, c.porte].every((k) => scena.textures.exists(k));
}

let pezzi: Phaser.GameObjects.GameObject[] = [];
const TELA_CRIPTA = 'stanza-cripta';

/** Disegna pavimento e muri della stanza (sotto il personaggio e sotto il buio). Il seme sceglie le varianti della cripta. */
export function creaStanza(scena: Phaser.Scene, seme: number = STANZA.seme): void {
  for (const p of pezzi) p.destroy();
  pezzi = [];
  const s = STANZA, c = s.colori;
  if (criptaPronta(scena)) {
    componiCripta(scena, seme);
    pezzi.push(scena.add.image(-s.muroLati, -s.muroAlto, TELA_CRIPTA).setOrigin(0).setDepth(PROFONDITA.terreno));
  } else {
    creaPavimento(scena);
    creaMuri(scena);
    const fuoriL = s.larghezza + 2 * s.muroLati;
    pezzi.push(
      scena.add.tileSprite(0, 0, s.larghezza, s.altezza, PAVIMENTO).setOrigin(0).setDepth(PROFONDITA.terreno),
      scena.add.tileSprite(-s.muroLati, -s.muroAlto, fuoriL, s.muroAlto, FACCIATA).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5),
      scena.add.rectangle(-s.muroLati, -s.muroAlto, fuoriL, 4, Phaser.Display.Color.HexStringToColor(c.cima).color).setOrigin(0).setDepth(PROFONDITA.terreno + 0.6),
      scena.add.tileSprite(-s.muroLati, 0, s.muroLati, s.altezza + s.muroBasso, LATO).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5),
      scena.add.tileSprite(s.larghezza, 0, s.muroLati, s.altezza + s.muroBasso, LATO).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5),
      scena.add.tileSprite(0, s.altezza, s.larghezza, s.muroBasso, LATO).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5),
    );
  }
  // ombra del muro in alto sul pavimento
  pezzi.push(scena.add.rectangle(0, 0, s.larghezza, s.ombraMuro, Phaser.Display.Color.HexStringToColor(c.ombra).color).setOrigin(0).setDepth(PROFONDITA.terreno + 0.5));
}

/** Una variante a caso secondo i pesi (quanto spesso esce ogni fotogramma). */
function pesca(caso: Caso, pesi: readonly number[]): number {
  let t = caso.numero() * pesi.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pesi.length; i++) if ((t -= pesi[i]) < 0) return i;
  return 0;
}

/**
 * La cripta in un'unica immagine grande quanto stanza e muri: lastre e facciata a caso, muri ai lati che si ripetono in
 * verticale (quello a destra è lo specchio), muro in basso che si ripete in orizzontale, angoli in basso.
 */
function componiCripta(scena: Phaser.Scene, seme: number): void {
  const S = STANZA, C = CRIPTA;
  const W = S.larghezza + 2 * S.muroLati, H = S.muroAlto + S.altezza + S.muroBasso;
  if (scena.textures.exists(TELA_CRIPTA)) scena.textures.remove(TELA_CRIPTA);
  const t = scena.textures.createCanvas(TELA_CRIPTA, W, H)!;
  const g = t.getContext();
  g.imageSmoothingEnabled = false;
  g.fillStyle = S.colori.fondo;
  g.fillRect(0, 0, W, H);
  // disegna il fotogramma n del file (al massimo w × h, per i pezzi che si ripetono e arrivano al bordo)
  const pezzo = (chiave: string, n: number, x: number, y: number, specchio = false, w = Infinity, h = Infinity): void => {
    const f = scena.textures.getFrame(chiave, String(n));
    const l = Math.min(f.cutWidth, w), a = Math.min(f.cutHeight, h);
    g.save();
    g.translate(specchio ? x + l : x, y);
    if (specchio) g.scale(-1, 1);
    g.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, l, a, 0, 0, l, a);
    g.restore();
  };
  const caso = new Caso(seme);
  const ox = S.muroLati, oy = S.muroAlto, p = S.piastrella;
  for (let r = 0; r * p < S.altezza; r++) for (let c = 0; c * p < S.larghezza; c++) pezzo(C.pavimento, pesca(caso, C.pesiPavimento), ox + c * p, oy + r * p);
  for (let c = 0; c * p < S.larghezza; c++) pezzo(C.facciata, pesca(caso, C.pesiFacciata), ox + c * p, 0);
  const lato = scena.textures.getFrame(C.muri, String(C.fotogrammi.lato)).cutHeight;
  for (let y = 0; y < oy + S.altezza; y += lato) {
    pezzo(C.muri, C.fotogrammi.lato, 0, y, false, Infinity, oy + S.altezza - y);
    pezzo(C.muri, C.fotogrammi.lato, ox + S.larghezza, y, true, Infinity, oy + S.altezza - y);
  }
  const basso = scena.textures.getFrame(C.muri, String(C.fotogrammi.basso)).cutWidth;
  for (let x = 0; x < S.larghezza; x += basso) pezzo(C.muri, C.fotogrammi.basso, ox + x, oy + S.altezza, false, S.larghezza - x);
  pezzo(C.muri, C.fotogrammi.angolo, 0, oy + S.altezza);
  pezzo(C.muri, C.fotogrammi.angolo, ox + S.larghezza, oy + S.altezza, true);
  t.refresh();
}
