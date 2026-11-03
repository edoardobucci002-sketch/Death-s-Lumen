/*
 * Effetti che danno impatto ai colpi: numeri del danno che saltano fuori, scoppio quando un nemico muore,
 * arco di luce della Lanterna disegnato nitido, scossa dello schermo per i colpi pesanti,
 * cerchi colorati delle reazioni tra stati (Eclissi, Rivelazione, Esorcismo, Interramento).
 * Tutto in pool preparati all'inizio; il caso degli effetti è separato da quello del gioco,
 * così ciò che si vede non cambia ciò che succede.
 */
import Phaser from 'phaser';
import { Caso } from './caso';
import { EFFETTI } from '../data/effetti';
import { REAZIONI } from '../data/stati';

/** Ordine di disegno, dal basso verso l'alto. Personaggio e nemici stanno in mezzo, ordinati per i piedi. */
export const PROFONDITA = {
  terreno: -1e7,
  aTerra: -1e6, // archi, impatti, nubi: sotto i nemici, così non li coprono
  sopra: 5e6, // proiettili, esplosioni, scoppi, numeri
  buio: 1e7,
  anime: 1e7 + 1, // brillano anche nel buio
  barra: 1e7 + 2, // barra della salute (3 livelli)
} as const;

const MAX_NUMERI = 64;
const MAX_SCOPPI = 48;
const MAX_ARCHI = 4;
const MAX_REAZIONI = 24;
// cifre 3×5: ogni riga è una cifra, 1 = pixel acceso
const CIFRE = [
  '111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
  '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111',
];
const TESTI = Array.from({ length: 1000 }, (_, n) => String(n)); // preparati: niente stringhe nuove durante la partita

export class Effetti {
  private scena: Phaser.Scene;
  private caso = new Caso(7);
  private numeri: Phaser.GameObjects.BitmapText[] = [];
  private numeroVita = new Float32Array(MAX_NUMERI);
  private numeroX = new Float32Array(MAX_NUMERI);
  private numeroY = new Float32Array(MAX_NUMERI);
  private prossimoNumero = 0;
  private scoppi: Phaser.GameObjects.Sprite[] = [];
  private scoppioVita = new Float32Array(MAX_SCOPPI);
  private prossimoScoppio = 0;
  private archi: Phaser.GameObjects.Image[] = [];
  private arcoVita = new Float32Array(MAX_ARCHI);
  private arcoChiave: string[] = [];
  private prossimoArco = 0;
  private reazioni: Phaser.GameObjects.Image[] = [];
  private reazioneVita = new Float32Array(MAX_REAZIONI);
  private reazioneChiave: string[] = [];
  private prossimaReazione = 0;
  private durataReazione = 0.25;
  private scossa = 0; // secondi rimasti
  private forzaScossa = 0;
  scossaX = 0; // spostamento della telecamera in questo fotogramma, in pixel interi
  scossaY = 0;

  constructor(scena: Phaser.Scene) {
    this.scena = scena;
    creaCifre(scena);
    creaScoppio(scena);
    for (let i = 0; i < MAX_NUMERI; i++) {
      this.numeri.push(scena.add.bitmapText(0, 0, 'cifre', '', 5).setLetterSpacing(-1).setScale(EFFETTI.numeri.ingrandimento).setOrigin(0.5, 1).setDepth(PROFONDITA.sopra + 1).setVisible(false));
    }
    for (let i = 0; i < MAX_SCOPPI; i++) this.scoppi.push(scena.add.sprite(0, 0, 'scoppio').setDepth(PROFONDITA.sopra).setScale(EFFETTI.scoppio.ingrandimento).setVisible(false));
    for (let i = 0; i < MAX_REAZIONI; i++) {
      this.reazioni.push(scena.add.image(0, 0, '__WHITE').setDepth(PROFONDITA.sopra).setVisible(false));
      this.reazioneChiave.push('');
    }
    for (let i = 0; i < MAX_ARCHI; i++) {
      this.archi.push(scena.add.image(0, 0, '__WHITE').setDepth(PROFONDITA.aTerra + 1).setVisible(false));
      this.arcoChiave.push('');
    }
  }

  /** Numero del danno che salta fuori da (x, y). */
  numero(x: number, y: number, danno: number): void {
    const i = this.prossimoNumero;
    this.prossimoNumero = (i + 1) % MAX_NUMERI;
    const n = Math.max(1, Math.min(999, Math.round(danno)));
    this.numeroX[i] = x + (this.caso.numero() * 2 - 1) * EFFETTI.numeri.sparpaglio;
    this.numeroY[i] = y;
    this.numeroVita[i] = EFFETTI.numeri.durata;
    const t = this.numeri[i].setText(TESTI[n]).setVisible(true);
    if (n >= EFFETTI.numeri.forte) t.setTint(EFFETTI.numeri.coloreForte);
    else t.clearTint();
  }

  /** Scoppio di un nemico che muore. */
  scoppio(x: number, y: number): void {
    const i = this.prossimoScoppio;
    this.prossimoScoppio = (i + 1) % MAX_SCOPPI;
    this.scoppioVita[i] = EFFETTI.scoppio.durata;
    this.scoppi[i].setPosition(Math.round(x), Math.round(y)).setVisible(true).play({ key: 'scoppio', duration: EFFETTI.scoppio.durata * 1000, repeat: 0 });
  }

  /** Arco di luce nitido centrato in (x, y), rivolto verso angolo (radianti). */
  arco(x: number, y: number, angolo: number, raggio: number, ampiezza: number): void {
    const r = Math.round(raggio);
    const chiave = `arco-${r}-${ampiezza}`;
    if (!this.scena.textures.exists(`${chiave}-0`)) creaArco(this.scena, chiave, r, ampiezza);
    const i = this.prossimoArco;
    this.prossimoArco = (i + 1) % MAX_ARCHI;
    this.arcoVita[i] = EFFETTI.arco.durata;
    this.arcoChiave[i] = chiave;
    this.archi[i].setTexture(`${chiave}-0`).setPosition(Math.round(x), Math.round(y)).setRotation(angolo).setVisible(true);
  }

  /** Cerchio di una reazione in (x, y): pieno, poi a retino, poi sparisce. Colori come '#rrggbb'. */
  reazione(x: number, y: number, raggio: number, colore: string, bordo: string, durata: number): void {
    const r = Math.round(raggio * REAZIONI.ingrandimentoEffetto);
    const chiave = `reazione-${r}-${colore}-${bordo}`;
    if (!this.scena.textures.exists(`${chiave}-0`)) creaReazione(this.scena, chiave, r, colore, bordo);
    const i = this.prossimaReazione;
    this.prossimaReazione = (i + 1) % MAX_REAZIONI;
    this.durataReazione = durata;
    this.reazioneVita[i] = durata;
    this.reazioneChiave[i] = chiave;
    this.reazioni[i].setTexture(`${chiave}-0`).setPosition(Math.round(x), Math.round(y)).setVisible(true);
  }

  /** Scuote lo schermo; resta la scossa più forte tra quelle in corso. */
  scuoti(forza: number, durata: number): void {
    if (this.scossa <= 0 || forza >= this.forzaScossa) this.forzaScossa = forza;
    this.scossa = Math.max(this.scossa, durata);
  }

  /** Avanza gli effetti (si chiama al disegno: sono solo da vedere). */
  aggiorna(dt: number): void {
    for (let i = 0; i < MAX_NUMERI; i++) {
      if (this.numeroVita[i] <= 0) continue;
      this.numeroVita[i] -= dt;
      const t = this.numeri[i];
      if (this.numeroVita[i] <= 0) {
        t.setVisible(false);
        continue;
      }
      // sale in fretta e rallenta
      const fatto = 1 - this.numeroVita[i] / EFFETTI.numeri.durata;
      const su = EFFETTI.numeri.salita * (1 - (1 - fatto) * (1 - fatto));
      t.setPosition(Math.round(this.numeroX[i]), Math.round(this.numeroY[i] - su));
    }
    for (let i = 0; i < MAX_SCOPPI; i++) {
      if (this.scoppioVita[i] > 0 && (this.scoppioVita[i] -= dt) <= 0) this.scoppi[i].stop().setVisible(false);
    }
    for (let i = 0; i < MAX_ARCHI; i++) {
      if (this.arcoVita[i] <= 0) continue;
      this.arcoVita[i] -= dt;
      // seconda metà della vita: lo stesso arco a retino, poi sparisce
      if (this.arcoVita[i] <= 0) this.archi[i].setVisible(false);
      else if (this.arcoVita[i] < EFFETTI.arco.durata / 2) this.archi[i].setTexture(`${this.arcoChiave[i]}-1`);
    }
    for (let i = 0; i < MAX_REAZIONI; i++) {
      if (this.reazioneVita[i] <= 0) continue;
      this.reazioneVita[i] -= dt;
      if (this.reazioneVita[i] <= 0) this.reazioni[i].setVisible(false);
      else if (this.reazioneVita[i] < this.durataReazione / 2) this.reazioni[i].setTexture(`${this.reazioneChiave[i]}-1`);
    }
    if (this.scossa > 0) {
      this.scossa -= dt;
      const f = Math.round(this.forzaScossa);
      this.scossaX = this.caso.intero(-f, f);
      this.scossaY = this.caso.intero(-f, f);
    } else {
      this.scossaX = this.scossaY = 0;
    }
  }
}

function creaCifre(scena: Phaser.Scene): void {
  if (scena.cache.bitmapFont.exists('cifre')) return;
  // ogni cifra 3×5 con un contorno nero di 1 pixel: celle di 5×7
  const W = 5;
  const H = 7;
  const tela = scena.textures.createCanvas('cifre', W * 10, H)!;
  const g = tela.getContext();
  CIFRE.forEach((c, n) => {
    for (const [colore, larg] of [['#000', 1], ['#fff', 0]] as const) {
      g.fillStyle = colore;
      for (let k = 0; k < 15; k++) {
        if (c[k] !== '1') continue;
        const x = n * W + 1 + (k % 3);
        const y = 1 + Math.floor(k / 3);
        g.fillRect(x - larg, y - larg, 1 + 2 * larg, 1 + 2 * larg);
      }
    }
  });
  tela.refresh();
  const dati = Phaser.GameObjects.RetroFont.Parse(scena, {
    image: 'cifre', width: W, height: H, chars: '0123456789', charsPerRow: 10,
    'offset.x': 0, 'offset.y': 0, 'spacing.x': 0, 'spacing.y': 0, lineSpacing: 0,
  });
  // in Phaser 4 Parse restituisce già la voce pronta per la cache ({ data, texture, frame }), anche se i tipi dicono altro
  scena.cache.bitmapFont.add('cifre', dati);
}

/** Scoppio di 4 fotogrammi: un lampo pieno che si apre in un anello e si sfalda a retino. */
function creaScoppio(scena: Phaser.Scene): void {
  if (scena.textures.exists('scoppio')) return;
  const L = 24;
  const tela = scena.textures.createCanvas('scoppio', L * 4, L)!;
  const g = tela.getContext();
  const c = EFFETTI.scoppio;
  const forme = [
    { dentro: 0, fuori: 4, retino: false },
    { dentro: 4, fuori: 8, retino: false },
    { dentro: 7, fuori: 10, retino: true },
    { dentro: 10, fuori: 11.5, retino: true },
  ];
  forme.forEach((f, n) => {
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const d = Math.hypot(x + 0.5 - L / 2, y + 0.5 - L / 2);
        if (d < f.dentro || d > f.fuori || (f.retino && (x + y) % 2)) continue;
        g.fillStyle = d > f.fuori - 1.5 ? c.bordo : c.colore;
        g.fillRect(n * L + x, y, 1, 1);
      }
    }
    tela.add(String(n), 0, n * L, 0, L, L);
  });
  tela.refresh();
  scena.anims.create({ key: 'scoppio', frames: [0, 1, 2, 3].map((n) => ({ key: 'scoppio', frame: String(n) })), frameRate: 20 });
}

/** Arco della Lanterna rivolto a destra: una fascia sottile con il bordo chiaro; la versione «-1» è a retino. */
function creaArco(scena: Phaser.Scene, chiave: string, r: number, ampiezza: number): void {
  const a = EFFETTI.arco;
  const L = 2 * r + 4;
  const meta = ((ampiezza / 2) * Math.PI) / 180;
  for (const retino of [0, 1]) {
    const tela = scena.textures.createCanvas(`${chiave}-${retino}`, L, L)!;
    const g = tela.getContext();
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const dx = x + 0.5 - L / 2;
        const dy = y + 0.5 - L / 2;
        const d = Math.hypot(dx, dy);
        if (d > r || d < r - a.spessore || Math.abs(Math.atan2(dy, dx)) > meta) continue;
        if (retino && (x + y) % 2) continue;
        g.fillStyle = d > r - 1 ? a.bordo : d > r - a.spessore + 1 ? a.colore : a.interno;
        g.fillRect(x, y, 1, 1);
      }
    }
    tela.refresh();
  }
}

/** Cerchio di una reazione: anello pieno con il bordo e l'interno a retino rado; la versione «-1» è tutta a retino. */
function creaReazione(scena: Phaser.Scene, chiave: string, r: number, colore: string, bordo: string): void {
  const L = 2 * r + 2;
  for (const retino of [0, 1]) {
    const tela = scena.textures.createCanvas(`${chiave}-${retino}`, L, L)!;
    const g = tela.getContext();
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const d = Math.hypot(x + 0.5 - L / 2, y + 0.5 - L / 2);
        if (d > r) continue;
        const anello = d > r - 4;
        if (retino ? (x + y) % 2 : !anello && (x % 2 || y % 2)) continue;
        g.fillStyle = d > r - 1.5 ? bordo : colore;
        g.fillRect(x, y, 1, 1);
      }
    }
    tela.refresh();
  }
}
