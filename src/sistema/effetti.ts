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
import { INFO_REAZIONI } from '../data/spiegazioni';
import { telaContorno } from './scritte';

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
const MAX_ETICHETTE = 8;
// cifre 3×5: ogni riga è una cifra, 1 = pixel acceso
const CIFRE = [
  '111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
  '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111',
];
const TESTI = Array.from({ length: 10000 }, (_, n) => String(n)); // preparati: niente stringhe nuove durante la partita

export class Effetti {
  private scena: Phaser.Scene;
  private caso = new Caso(7);
  private numeri: Phaser.GameObjects.BitmapText[] = [];
  private numeroVita = new Float32Array(MAX_NUMERI);
  private numeroX = new Float32Array(MAX_NUMERI);
  private numeroY = new Float32Array(MAX_NUMERI);
  private numeroImportante = new Uint8Array(MAX_NUMERI); // 1 = danno forte, o su élite e Seth
  private numeriAttivi = 0;
  private numeroId = new Uint32Array(MAX_NUMERI); // il nemico di un numero sommato (0 = numero normale)
  private numeroSomma = new Float32Array(MAX_NUMERI);
  private numeroFinestra = new Float32Array(MAX_NUMERI); // secondi in cui il numero sommato accetta altri colpi
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
  private etichette: Phaser.GameObjects.Image[] = [];
  private etichettaVita = new Float32Array(MAX_ETICHETTE);
  private etichettaX = new Float32Array(MAX_ETICHETTE);
  private etichettaY = new Float32Array(MAX_ETICHETTE);
  private etichetteAttive = 0;
  private pausaEtichetta = new Float32Array(INFO_REAZIONI.length + 1);
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
    for (const r of INFO_REAZIONI) {
      const k = `Nome_${r.nome}`;
      if (!scena.textures.exists(k)) scena.textures.addCanvas(k, telaContorno(r.nome, `#${r.coloreNome.toString(16).padStart(6, '0')}`, '#120c0a'));
    }
    for (let i = 0; i < MAX_ETICHETTE; i++) this.etichette.push(scena.add.image(0, 0, '__WHITE').setDepth(PROFONDITA.barra).setScale(REAZIONI.etichetta.ingrandimento).setVisible(false));
    for (let i = 0; i < MAX_ARCHI; i++) {
      this.archi.push(scena.add.image(0, 0, '__WHITE').setDepth(PROFONDITA.aTerra + 1).setVisible(false));
      this.arcoChiave.push('');
    }
  }

  private sulloSchermo(x: number, y: number): boolean {
    const cam = this.scena.cameras.main;
    return x >= cam.scrollX && x <= cam.scrollX + cam.width && y >= cam.scrollY && y <= cam.scrollY + cam.height;
  }

  /** Numero del danno che salta fuori da (x, y), se è sullo schermo e c'è posto. */
  numero(x: number, y: number, danno: number): void {
    if (!this.sulloSchermo(x, y)) return;
    const n = Math.max(1, Math.min(999, Math.round(danno)));
    const i = this.postoNumero(n >= EFFETTI.numeri.forte);
    if (i < 0) return;
    this.numeroImportante[i] = n >= EFFETTI.numeri.forte ? 1 : 0;
    this.numeroId[i] = 0;
    this.numeroFinestra[i] = 0;
    this.numeroX[i] = x + (this.caso.numero() * 2 - 1) * EFFETTI.numeri.sparpaglio;
    this.numeroY[i] = y;
    this.numeroVita[i] = EFFETTI.numeri.durata;
    const t = this.numeri[i].setText(TESTI[n]).setVisible(true);
    if (n >= EFFETTI.numeri.forte) t.setTint(EFFETTI.numeri.coloreForte);
    else t.clearTint();
  }

  /** Colpo su un'élite o su Seth (id = il suo numero unico; y = la cima dello sprite): si somma nel suo numero aperto, o ne apre uno. */
  sommaDanno(id: number, x: number, y: number, danno: number): void {
    if (!this.sulloSchermo(x, y)) return;
    let i = -1;
    for (let k = 0; k < MAX_NUMERI; k++) {
      if (this.numeroId[k] === id && this.numeroFinestra[k] > 0 && this.numeroVita[k] > 0) i = k;
    }
    if (i < 0) {
      i = this.postoNumero(true);
      if (i < 0) return;
      this.numeroImportante[i] = 1;
      this.numeroId[i] = id;
      this.numeroSomma[i] = 0;
      this.numeroFinestra[i] = EFFETTI.numeri.somma.finestra;
      this.numeroX[i] = x;
      this.numeroY[i] = y - EFFETTI.numeri.somma.sopra;
    }
    this.numeroSomma[i] += danno;
    this.numeroVita[i] = EFFETTI.numeri.durata; // finché si somma resta fermo sopra la testa; sale quando la finestra si chiude
    const n = Math.max(1, Math.min(TESTI.length - 1, Math.round(this.numeroSomma[i])));
    const t = this.numeri[i].setText(TESTI[n]).setVisible(true);
    if (n >= EFFETTI.numeri.forte) t.setTint(EFFETTI.numeri.coloreForte);
    else t.clearTint();
  }

  /** Porta il numero sommato del nemico id sopra la cima del suo sprite, che è in (x, y). */
  seguiSomma(id: number, x: number, y: number): void {
    for (let i = 0; i < MAX_NUMERI; i++) {
      if (this.numeroId[i] !== id || this.numeroVita[i] <= 0) continue;
      this.numeroX[i] = x;
      this.numeroY[i] = y - EFFETTI.numeri.somma.sopra;
    }
  }

  /** Un posto libero entro il limite; al limite un numero importante prende il posto del comune più vecchio; −1 se non c'è posto. */
  private postoNumero(importante: boolean): number {
    if (this.numeriAttivi < Math.min(EFFETTI.numeri.massimo, MAX_NUMERI)) {
      for (let i = 0; i < MAX_NUMERI; i++) {
        if (this.numeroVita[i] > 0) continue;
        this.numeriAttivi++;
        return i;
      }
    }
    if (!importante) return -1;
    let scelto = -1;
    for (let i = 0; i < MAX_NUMERI; i++) {
      if (this.numeroVita[i] > 0 && !this.numeroImportante[i] && (scelto < 0 || this.numeroVita[i] < this.numeroVita[scelto])) scelto = i;
    }
    return scelto;
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

  /** Il nome della reazione (1 = Eclissi, come in orda.ts) sale sopra il punto (x, y); oltre il limite non si crea. */
  etichetta(reazione: number, x: number, y: number): void {
    if (this.pausaEtichetta[reazione] > 0 || this.etichetteAttive >= Math.min(REAZIONI.etichetta.massimi, MAX_ETICHETTE)) return;
    let i = 0;
    while (i < MAX_ETICHETTE - 1 && this.etichettaVita[i] > 0) i++;
    this.pausaEtichetta[reazione] = REAZIONI.etichetta.pausa;
    this.etichetteAttive++;
    this.etichettaVita[i] = REAZIONI.etichetta.durata;
    this.etichettaX[i] = x;
    this.etichettaY[i] = y;
    this.etichette[i].setTexture(`Nome_${INFO_REAZIONI[reazione - 1].nome}`).setScale(REAZIONI.etichetta.ingrandimento).setVisible(false);
  }

  /** Mette il nome al suo posto: sale, resta fuori dal cerchio intorno al personaggio (sopra di esso) e dentro lo schermo. */
  private posaEtichetta(i: number, gx: number, gy: number): void {
    const e = REAZIONI.etichetta, im = this.etichette[i], cam = this.scena.cameras.main;
    const x = this.etichettaX[i];
    let y = this.etichettaY[i] - e.sale * (1 - this.etichettaVita[i] / e.durata);
    const dx = x - gx, dy = y - gy;
    if (dx * dx + dy * dy < e.lontano * e.lontano) y = gy - Math.sqrt(e.lontano * e.lontano - dx * dx) - im.displayHeight / 2;
    const mezzaL = im.displayWidth / 2, mezzaA = im.displayHeight / 2;
    im.setPosition(
      Math.round(Math.max(cam.scrollX + mezzaL, Math.min(cam.scrollX + cam.width - mezzaL, x))),
      Math.round(Math.max(cam.scrollY + mezzaA, Math.min(cam.scrollY + cam.height - mezzaA, y))),
    ).setVisible(true);
  }

  /** Scuote lo schermo; resta la scossa più forte tra quelle in corso. */
  scuoti(forza: number, durata: number): void {
    if (this.scossa <= 0 || forza >= this.forzaScossa) this.forzaScossa = forza;
    this.scossa = Math.max(this.scossa, durata);
  }

  /** Avanza gli effetti (si chiama al disegno: sono solo da vedere); (gx, gy) è il centro del personaggio. */
  aggiorna(dt: number, gx: number, gy: number): void {
    for (let i = 0; i < MAX_NUMERI; i++) {
      if (this.numeroVita[i] <= 0) continue;
      this.numeroVita[i] -= dt;
      const t = this.numeri[i];
      if (this.numeroVita[i] <= 0) {
        t.setVisible(false);
        this.numeriAttivi--;
        this.numeroId[i] = 0;
        continue;
      }
      if (this.numeroFinestra[i] > 0) this.numeroFinestra[i] -= dt;
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
    for (let i = 1; i < this.pausaEtichetta.length; i++) if (this.pausaEtichetta[i] > 0) this.pausaEtichetta[i] -= dt;
    for (let i = 0; i < MAX_ETICHETTE; i++) {
      if (this.etichettaVita[i] <= 0) continue;
      this.etichettaVita[i] -= dt;
      if (this.etichettaVita[i] <= 0) {
        this.etichette[i].setVisible(false);
        this.etichetteAttive--;
      } else this.posaEtichetta(i, gx, gy);
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
