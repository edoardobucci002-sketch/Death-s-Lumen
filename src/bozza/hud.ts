/*
 * Bozza dell'HUD (bozza-hud.html): disegna su un «telefono» in pixel di gioco veri lo sfondo del gioco
 * e gli elementi della cartella HUD al loro posto, nelle varie schermate, più il catalogo di tutti i pezzi.
 * Legge public/assets/hud/elenco.json (scritto da `npm run asset`) e si aggiorna quando cambia.
 * Non fa parte del gioco: serve a Edoardo per vedere i disegni senza giocare.
 */
import './bozza.css';
import { ABILITA } from '../data/abilita';
import { ARMI_INIZIALI, CAMPANA, CANDELA, FALCE } from '../data/armi';
import { ANELLI, FINESTRE, INGRANDIMENTO, INTERNI, LAMPEGGIO_SEGNALE, MARGINE_TOCCO, PUNTI_MINIMI_PER_PIXEL, SENZA_RADDOPPIO, type Riquadro } from '../data/hud';
import { PERSONAGGI, type Personaggio } from '../data/personaggi';
import { TELEFONI, misureTelefono, type Bordi, type MisureTelefono, type Telefono } from './telefoni';

interface R4 { x: number; y: number; w: number; h: number }
interface Fotogramma { frame: R4; spriteSourceSize: R4; sourceSize: { w: number; h: number }; duration: number }
interface Sprite { img: HTMLImageElement; fot: Fotogramma[]; w: number; h: number; durata: number; versione: number }
interface VoceElenco { chiave: string; categoria: string; immagine: string; dati: string; versioneFile: number }

type Testo = { px: number; colore: string; font?: 'pixel' | 'titolo'; allinea?: 'sinistra' | 'centro' | 'destra'; ombra?: boolean };

// ————— stato della pagina (ricordato nel browser) —————
const stato = {
  schermata: 'partita', pg: 'lampionaio', telefono: 'verticale', dispositivo: 'iphone-13', tacca: true,
  salute: 72, esperienza: 45, mietitore: 80, boss: true, joystick: true, segnale: true, ricarica: true,
  salutePosto: 'personaggio', anello: 'personaggio', dentro: 'icona', esperienzaColore: 'tavola', avviso: 'nastro',
  fondoCatalogo: 'scuro', zoomCatalogo: '3', misure: { ...INGRANDIMENTO } as Record<string, number>,
};
type Stato = typeof stato;
const CHIAVE_MEMORIA = 'dl-bozza-hud';
try {
  const salvato = JSON.parse(localStorage.getItem(CHIAVE_MEMORIA) ?? '{}') as Partial<Stato>;
  Object.assign(stato, salvato, { misure: { ...INGRANDIMENTO, ...(salvato.misure ?? {}) } });
} catch { /* senza memoria si parte dai valori proposti */ }
const ricorda = (): void => { try { localStorage.setItem(CHIAVE_MEMORIA, JSON.stringify(stato)); } catch { /* niente */ } };

const NOMI_MISURE: Record<string, string> = {
  barre: 'Barre in alto', salute: 'Salute', caselle: 'Caselle e stemma', speciale: 'Anello abilità', pausa: 'Pausa',
  joystick: 'Joystick', segnale: 'Segnale reliquiario', avvisi: 'Avvisi', carte: 'Carte dei doni', pannelli: 'Pannelli e nastri', pulsanti: 'Pulsanti dei menu', ritratto: 'Cornice ritratto',
};

// ————— asset —————
const hud = new Map<string, Sprite>();
const gioco = new Map<string, Sprite>();
const sfondi: Record<string, HTMLImageElement> = {};
let esportato = '';

function immagine(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error(src)); i.src = src; });
}

async function caricaElenco(url: string, dove: Map<string, Sprite>, filtro: (v: VoceElenco) => boolean, v: string): Promise<{ esportato?: string }> {
  const elenco = (await (await fetch(`${url}?v=${v}`, { cache: 'no-store' })).json()) as { esportato?: string; asset: VoceElenco[] };
  dove.clear();
  await Promise.all(elenco.asset.filter(filtro).map(async (a) => {
    const [img, dati] = await Promise.all([immagine(`${a.immagine}?v=${v}`), fetch(`${a.dati}?v=${v}`, { cache: 'no-store' }).then((r) => r.json())]);
    const fot = (dati as { frames: Fotogramma[] }).frames;
    dove.set(a.chiave, { img, fot, w: fot[0].sourceSize.w, h: fot[0].sourceSize.h, durata: fot.reduce((s, f) => s + f.duration, 0), versione: a.versioneFile });
  }));
  return elenco;
}

async function caricaTutto(): Promise<void> {
  const v = String(Date.now());
  const e = await caricaElenco('assets/hud/elenco.json', hud, () => true, v);
  await caricaElenco('assets/elenco.json', gioco, (a) => a.categoria === 'icone' || (a.categoria === 'personaggi' && !a.chiave.endsWith('_ingame')), v);
  esportato = e.esportato ?? '';
  for (const n of ['verticale', 'orizzontale']) sfondi[n] = await immagine(`bozza/sfondi/${n}.png?v=${v}`);
  cache.clear();
}

const sprite = (k: string): Sprite | undefined => hud.get(k) ?? gioco.get(k);
const cache = new Map<string, HTMLCanvasElement>();

function tela(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h);
  const g = c.getContext('2d', { willReadFrequently: true })!; g.imageSmoothingEnabled = false;
  return [c, g];
}

/** Il fotogramma n di uno sprite su una tela grande quanto la tela di Aseprite (con i margini tolti dall'export). */
function piatto(k: string, n = 0): HTMLCanvasElement | null {
  const id = `piatto|${k}|${n}`;
  if (cache.has(id)) return cache.get(id)!;
  const s = sprite(k); if (!s) return null;
  const f = s.fot[n % s.fot.length]; const [c, g] = tela(s.w, s.h);
  g.drawImage(s.img, f.frame.x, f.frame.y, f.frame.w, f.frame.h, f.spriteSourceSize.x, f.spriteSourceSize.y, f.frame.w, f.frame.h);
  cache.set(id, c); return c;
}

/** Ricolora i pixel di una tela: grigio spento (ricarica) o tinta del personaggio. */
function ricolora(k: string, modo: 'spento' | string): HTMLCanvasElement | null {
  const id = `colore|${k}|${modo}`;
  if (cache.has(id)) return cache.get(id)!;
  const p = piatto(k); if (!p) return null;
  const [c, g] = tela(p.width, p.height); g.drawImage(p, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height); const a = d.data;
  const t = modo === 'spento' ? null : [1, 3, 5].map((i) => parseInt(modo.slice(i, i + 2), 16));
  for (let i = 0; i < a.length; i += 4) {
    const l = (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11) / 255;
    if (!t) { const v = Math.round(l * 150 + 12); a[i] = v; a[i + 1] = v - 4; a[i + 2] = v - 8; } else for (let j = 0; j < 3; j++) a[i + j] = Math.min(255, Math.round(t[j] * (0.25 + l * 1.1)));
  }
  g.putImageData(d, 0, 0); cache.set(id, c); return c;
}

// ————— disegno in pixel di gioco —————
const schermo = document.getElementById('schermo') as HTMLCanvasElement;
const g = schermo.getContext('2d')!;
let W = 585, H = 996;

// ————— registro di ciò che si disegna: serve alla verifica sui telefoni —————
interface Rett { x: number; y: number; w: number; h: number; gruppo: string; strato: number }
let registro: Rett[] | null = null, gruppo = '', strato = 0;
let avvisiTesto: string[] = [];
function segna(x: number, y: number, w: number, h: number): void { if (registro && gruppo && w > 0 && h > 0) registro.push({ x, y, w, h, gruppo, strato }); }
/** Il riquadro dei pixel non trasparenti di una tela (calcolato una volta sola). */
const pieni = new WeakMap<HTMLCanvasElement, R4>();
function pieno(c: HTMLCanvasElement): R4 {
  const v = pieni.get(c); if (v) return v;
  const d = c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const r = x1 < 0 ? { x: 0, y: 0, w: 0, h: 0 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  pieni.set(c, r); return r;
}

/** Disegna uno sprite con l'angolo della sua tela in (x, y), ingrandito k volte; larghezza = quanta parte mostrare da sinistra. */
function disegna(k: string, x: number, y: number, z = 1, larghezza?: number, fonte?: HTMLCanvasElement | null): void {
  const p = fonte ?? piatto(k);
  if (!p) { segnaposto(k, x, y, z); return; }
  const lw = Math.max(0, Math.min(p.width, larghezza ?? p.width));
  if (lw > 0) g.drawImage(p, 0, 0, lw, p.height, Math.round(x), Math.round(y), lw * z, p.height * z);
  if (registro) { const q = pieno(p); segna(Math.round(x) + q.x * z, Math.round(y) + q.y * z, (Math.min(q.x + q.w, lw) - q.x) * z, q.h * z); }
}

function segnaposto(k: string, x: number, y: number, z: number): void {
  g.fillStyle = '#5a1030'; g.fillRect(Math.round(x), Math.round(y), 40 * z, 12 * z);
  scrivi(`manca ${k}`, x + 2, y + 2, { px: 8, colore: '#fff' });
}

const misura = (k: string): { w: number; h: number } => { const s = sprite(k); return s ? { w: s.w, h: s.h } : { w: 40, h: 12 }; };

/** Testo nitido: disegnato a parte e con la trasparenza tagliata netta, senza sfumature. */
function testoTela(t: string, o: Testo): HTMLCanvasElement {
  const id = `testo|${t}|${o.px}|${o.colore}|${o.font}|${o.ombra}`;
  if (cache.has(id)) return cache.get(id)!;
  const font = o.font === 'titolo' ? `400 ${o.px}px "IM Fell English SC"` : `500 ${o.px}px "Pixelify Sans"`;
  const [, m] = tela(1, 1); m.font = font;
  const w = Math.ceil(m.measureText(t).width) + 3, h = Math.ceil(o.px * 1.35) + 2;
  const [c, x] = tela(w, h); x.font = font; x.textBaseline = 'top';
  const passate: [string, number][] = o.ombra ? [['#000', 1], [o.colore, 0]] : [[o.colore, 0]];
  for (const [col, dy] of passate) {
    const [cc, xx] = tela(w, h); xx.font = font; xx.textBaseline = 'top'; xx.fillStyle = col; xx.fillText(t, 1, dy);
    const d = xx.getImageData(0, 0, w, h);
    for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
    xx.putImageData(d, 0, 0); x.drawImage(cc, 0, 0);
  }
  cache.set(id, c); return c;
}

function scrivi(t: string, x: number, y: number, o: Testo): number {
  const c = testoTela(t, o);
  const dx = o.allinea === 'centro' ? -c.width / 2 : o.allinea === 'destra' ? -c.width : 0;
  g.drawImage(c, Math.round(x + dx), Math.round(y)); segna(Math.round(x + dx), Math.round(y), c.width, c.height); return c.width;
}

/** Testo dentro un riquadro: rimpicciolisce finché ci sta, centrato. */
function scriviDentro(t: string, r: Riquadro, ox: number, oy: number, z: number, o: Testo): void {
  let px = o.px;
  while (px > 7 && testoTela(t, { ...o, px }).width > r.l * z) px--;
  const c = testoTela(t, { ...o, px });
  const x = Math.round(ox + (r.x + r.l / 2) * z - c.width / 2), y = Math.round(oy + (r.y + r.a / 2) * z - c.height / 2);
  g.drawImage(c, x, y); segna(x, y, c.width, c.height);
  if (c.width > r.l * z) avvisiTesto.push(`${gruppo}: «${t}» non entra nel riquadro`);
}

/** Più righe dentro un riquadro, a capo sulle parole. */
function scriviRighe(t: string, r: Riquadro, ox: number, oy: number, z: number, o: Testo): void {
  const parole = t.split(' '); const righe: string[] = []; let riga = '';
  for (const p of parole) { const prova = riga ? `${riga} ${p}` : p; if (testoTela(prova, o).width > r.l * z && riga) { righe.push(riga); riga = p; } else riga = prova; }
  if (riga) righe.push(riga);
  if (righe.length * Math.round(o.px * 1.2) > r.a * z) avvisiTesto.push(`${gruppo}: testo di ${righe.length} righe, più alto del riquadro`);
  righe.forEach((rr, i) => scrivi(rr, ox + (r.x + r.l / 2) * z, oy + r.y * z + i * Math.round(o.px * 1.2), { ...o, allinea: 'centro' }));
}

/** Oscura la scena a retino (Bayer 4×4), non con la trasparenza. */
function retino(livello: number): void {
  const id = `retino|${livello}`;
  if (!cache.has(id)) {
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const [c, x] = tela(4, 4); x.fillStyle = '#050403';
    B.forEach((b, i) => { if (b < livello) x.fillRect(i % 4, i >> 2, 1, 1); });
    cache.set(id, c);
  }
  g.fillStyle = g.createPattern(cache.get(id)!, 'repeat')!; g.fillRect(0, 0, W, H);
}

// ————— anello dell'abilità con la ricarica che si riempie in senso orario —————
interface DatiAnello { w: number; h: number; cx: number; cy: number; r: number; esterno: number; gr: ImageData; col: ImageData; out: HTMLCanvasElement }

function datiAnello(colore: string, grigio: string | null): DatiAnello | null {
  const id = `anello|${colore}|${grigio}`;
  const vecchio = cacheAnelli.get(id); if (vecchio) return vecchio;
  const pc = piatto(colore), a = ANELLI[colore]; if (!pc || !a) return null;
  const base = grigio ? piatto(grigio) : ricolora(colore, 'spento'), ab = grigio ? ANELLI[grigio] ?? a : a;
  if (!base || !ab) return null;
  const [cg, xg] = tela(base.width, base.height); xg.drawImage(base, 0, 0);
  const [cc, xc] = tela(base.width, base.height); xc.drawImage(pc, ab.x - a.x, ab.y - a.y); // i due anelli allineati sul centro
  const [out] = tela(base.width, base.height);
  const d: DatiAnello = { w: base.width, h: base.height, cx: ab.x, cy: ab.y, r: ab.r, esterno: ab.esterno, gr: xg.getImageData(0, 0, cg.width, cg.height), col: xc.getImageData(0, 0, cc.width, cc.height), out };
  cacheAnelli.set(id, d); return d;
}
const cacheAnelli = new Map<string, DatiAnello>();

function disegnaAnello(d: DatiAnello, parte: number, x: number, y: number, z: number): void {
  const x2 = d.out.getContext('2d')!; const o = x2.createImageData(d.w, d.h);
  for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
    const dx = i + 0.5 - d.cx, dy = j + 0.5 - d.cy;
    const ang = (Math.atan2(dx, -dy) / (Math.PI * 2) + 1) % 1; // 0 in alto, in senso orario
    const colore = parte >= 1 || (Math.hypot(dx, dy) <= d.esterno && ang <= parte);
    const k = (j * d.w + i) * 4; const src = colore ? d.col.data : d.gr.data;
    o.data[k] = src[k]; o.data[k + 1] = src[k + 1]; o.data[k + 2] = src[k + 2]; o.data[k + 3] = src[k + 3];
  }
  x2.putImageData(o, 0, 0);
  g.drawImage(d.out, Math.round(x), Math.round(y), d.w * z, d.h * z);
  if (registro) { const q = pieno(d.out); segna(Math.round(x) + q.x * z, Math.round(y) + q.y * z, q.w * z, q.h * z); }
}

/** L'emblema tagliato a cerchio, per provarlo dentro l'anello. */
function emblemaTondo(k: string, r: number): HTMLCanvasElement | null {
  const id = `tondo|${k}|${r}`;
  if (cache.has(id)) return cache.get(id)!;
  const p = piatto(k); if (!p) return null;
  const [c, x] = tela(r * 2, r * 2); x.drawImage(p, Math.round(r - p.width / 2), Math.round(r - p.height / 2));
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (Math.hypot(i + 0.5 - r, j + 0.5 - r) > r) d.data[(j * c.width + i) * 4 + 3] = 0;
  x.putImageData(d, 0, 0); cache.set(id, c); return c;
}

// ————— le schermate —————
const pg = (): Personaggio => PERSONAGGI.find((p) => p.id === stato.pg) ?? PERSONAGGI[0];
const chiavePg = (): string => pg().nome.replace(/ /g, '_');
/** Quante volte in più ingrandire l'HUD su questo telefono (2 con la scala ×1, altrimenti 1). */
const raddoppio = (): number => Math.max(1, Math.ceil(PUNTI_MINIMI_PER_PIXEL / (M.scala / M.dpr) - 1e-9));
const z = (gruppo: string): number => (stato.misure[gruppo] ?? INGRANDIMENTO[gruppo] ?? 1) * (SENZA_RADDOPPIO.includes(gruppo) ? 1 : raddoppio());
const iconaArma = (): { nome: string; icona: string } => ARMI_INIZIALI[pg().armaIniziale];

const telefono = (): Telefono => TELEFONI.find((t) => t.id === stato.dispositivo) ?? TELEFONI[1];
const misureOra = (): MisureTelefono => misureTelefono(telefono(), stato.telefono === 'orizzontale' ? 'orizzontale' : 'verticale');
let M: MisureTelefono = misureOra();

/** Dove l'HUD può stare: la safe area del telefono più 6 pixel di respiro. */
function bordi(): Bordi {
  const m = 6, s0 = stato.tacca ? M.safe : { a: 0, b: 0, s: 0, d: 0 };
  return { a: s0.a + m, b: s0.b + m, s: s0.s + m, d: s0.d + m };
}

/** Tacca, isola o foro della fotocamera del telefono scelto, in nero. */
function disegnaTacca(): void {
  if (!stato.tacca) return;
  const t = telefono(), f = M.dpr / M.scala, ver = stato.telefono === 'verticale';
  g.fillStyle = '#000';
  const capsula = (x: number, y: number, w: number, h: number): void => {
    const r = Math.min(w, h) / 2;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const ax = Math.min(Math.max(i + 0.5, r), w - r), ay = Math.min(Math.max(j + 0.5, r), h - r);
      if (Math.hypot(i + 0.5 - ax, j + 0.5 - ay) <= r) g.fillRect(x + i, y + j, 1, 1);
    }
  };
  // misure in punti: lunghezza lungo il bordo, spessore, distanza dal bordo
  const forma = t.taglio === 'isola' ? [126, 37, 11] : t.taglio === 'tacca' ? [210, 60, -30] : t.taglio === 'foro' ? [11, 11, 12] : null;
  if (!forma) return;
  const [lu, sp, di] = forma.map((v) => Math.round(v * f));
  if (ver) capsula(Math.round(W / 2 - lu / 2), di, lu, sp); else capsula(di, Math.round(H / 2 - lu / 2), sp, lu);
}

/** Lo sfondo del gioco, centrato (il personaggio sta al centro dello schermo). */
function sfondo(): void {
  const sf = sfondi[stato.telefono];
  g.fillStyle = '#0d0b09'; g.fillRect(0, 0, W, H);
  if (sf) g.drawImage(sf, Math.round((W - sf.width) / 2), Math.round((H - sf.height) / 2));
}

function barraSalute(cx: number, y: number): void {
  const zz = z('salute'), m = misura('Barra_Salute_Cornice'), f = FINESTRE.Barra_Salute_Cornice;
  const x = Math.round(cx - (m.w * zz) / 2);
  disegna('Barra_Salute_Cornice', x, y, zz);
  disegna('Barra_Salute_Piena', x + f.x * zz, y + f.y * zz, zz, Math.round((f.l * stato.salute) / 100));
}

function scenaPartita(t: number): void {
  strato = 0; sfondo();
  const b = bordi(), p = pg();
  gruppo = 'salute-piedi';
  if (stato.salutePosto === 'personaggio') barraSalute(W / 2, Math.round(H / 2) + 2);

  // in alto: livello, esperienza, orologio, anime
  const zb = z('barre'), zc = z('caselle');
  const me = misura('Barra_Esperienza_Cornice'), fe = FINESTRE.Barra_Esperienza_Cornice;
  const xe = Math.round(W / 2 - (me.w * zb) / 2), ye = b.a;
  gruppo = 'esperienza';
  disegna('Barra_Esperienza_Cornice', xe, ye, zb);
  const piena = stato.esperienzaColore === 'tavola' ? null : ricolora('Barra_Esperienza_Piena', p.colore);
  disegna('Barra_Esperienza_Piena', xe + fe.x * zb, ye + fe.y * zb, zb, Math.round((fe.l * stato.esperienza) / 100), piena);
  gruppo = 'orologio';
  scrivi('7:42', W / 2, ye + me.h * zb + 2, { px: 16 * zb, colore: '#e8dcc4', allinea: 'centro', ombra: true });
  const ms = misura('Stemma_Livello');
  gruppo = 'livello';
  disegna('Stemma_Livello', b.s, b.a, zc);
  scriviDentro('12', INTERNI.Stemma_Livello.numero, b.s, b.a, zc, { px: 12 * zc, colore: p.colore, ombra: true });
  gruppo = 'anime';
  scrivi('◆ 248', W - b.d, b.a + 4, { px: 16 * zc, colore: '#8fd6c8', allinea: 'destra', ombra: true });

  // caselle delle armi
  const mc = misura('Casella_Arma'), ic = INTERNI.Casella_Arma.icona;
  const hOrologio = testoTela('7:42', { px: 16 * zb, colore: '#e8dcc4', ombra: true }).height;
  const yc = b.a + Math.max(ms.h * zc, me.h * zb + 2 + hOrologio) + 4;
  [[iconaArma().icona, 3], [FALCE.icona, 1], [CANDELA.icona, 2]].forEach(([icona, lv], i) => {
    const x = b.s + i * (mc.w * zc + 2 * zc);
    gruppo = `casella ${i + 1}`;
    disegna('Casella_Arma', x, yc, zc);
    disegna(String(icona), x + (ic.x + ic.l / 2 - 12) * zc, yc + (ic.y + ic.a / 2 - 12) * zc, zc);
    scrivi(String(lv), x + (ic.x + ic.l) * zc, yc + (ic.y + ic.a) * zc - 10 * zc, { px: 10 * zc, colore: '#e8dcc4', allinea: 'destra', ombra: true });
  });
  let y = yc + mc.h * zc + 4;
  gruppo = 'salute-alto';
  if (stato.salutePosto === 'alto') { const zs = z('salute'); barraSalute(b.s + (misura('Barra_Salute_Cornice').w * zs) / 2, y); y += misura('Barra_Salute_Cornice').h * zs + 4; }

  // il Mietitore: in orizzontale sta in alto, sotto l'orologio (le caselle sono a sinistra e c'è posto)
  if (stato.telefono === 'orizzontale') y = ye + me.h * zb + 2 + testoTela('7:42', { px: 16 * zb, colore: '#e8dcc4', ombra: true }).height + 4;
  if (stato.boss) {
    const mm = misura('Barra_Mietitore_Cornice'), fm = FINESTRE.Barra_Mietitore_Cornice;
    const xm = Math.round(W / 2 - (mm.w * zb) / 2);
    gruppo = 'mietitore';
    disegna('Barra_Mietitore_Cornice', xm, y, zb);
    disegna('Barra_Mietitore_Piena', xm + fm.x * zb, y + fm.y * zb, zb, Math.round((fm.l * stato.mietitore) / 100));
    y += mm.h * zb + 6;
  }

  // avviso al centro
  if (stato.avviso !== 'nessuno') {
    const k = stato.avviso === 'nastro' ? 'Nastro_Titolo' : 'Targa_Lapide', za = z('avvisi'), ma = misura(k);
    const xa = Math.round(W / 2 - (ma.w * za) / 2), ya = Math.max(y, Math.round(H * 0.3));
    gruppo = 'avviso';
    disegna(k, xa, ya, za);
    scriviDentro('Arriva uno sciame', INTERNI[k].testo, xa, ya, za, { px: 10 * za, colore: stato.avviso === 'nastro' ? '#3a2414' : '#2a2018' });
  }

  // segnale del reliquiario sul bordo
  if (stato.segnale && Math.floor((t / 1000) * LAMPEGGIO_SEGNALE) % 2 === 0) {
    const zs = z('segnale'), m = misura('Segnale_Reliquiario');
    gruppo = 'segnale';
    disegna('Segnale_Reliquiario', W - b.d - m.w * zs, Math.round(H * 0.42), zs);
  }

  // joystick dove si appoggia il dito
  if (stato.joystick) {
    const zj = z('joystick'), mb = misura('Joystick_Base'), mp = misura('Joystick_Pomello');
    const cx = stato.telefono === 'verticale' ? W / 2 : W * 0.32, cy = stato.telefono === 'verticale' ? H * 0.74 : H * 0.6;
    gruppo = 'joystick';
    disegna('Joystick_Base', cx - (mb.w * zj) / 2, cy - (mb.h * zj) / 2, zj);
    const raggio = ((mb.w - mp.w) / 2) * 0.6 * zj, ang = t / 900;
    disegna('Joystick_Pomello', cx + Math.cos(ang) * raggio - (mp.w * zj) / 2, cy + Math.sin(ang) * raggio - (mp.h * zj) / 2, zj);
  }

  // abilità in basso a sinistra, pausa in basso a destra
  const zsp = z('speciale');
  const anello = stato.anello === 'tavola' ? datiAnello('Speciale_Pronta', 'Speciale_Ricarica') : datiAnello(`Speciale_${chiavePg()}`, sprite(`Speciale_${chiavePg()}_Ricarica`) ? `Speciale_${chiavePg()}_Ricarica` : null);
  const parte = stato.ricarica ? ((t / 1000) % 8) / 6 : 1; // 6 secondi di ricarica, 2 pronta
  gruppo = 'speciale';
  if (anello) {
    const xs = b.s + 4, ys = H - b.b - anello.h * zsp;
    disegnaAnello(anello, parte, xs, ys, zsp);
    const cx = xs + anello.cx * zsp, cy = ys + anello.cy * zsp;
    if (stato.dentro === 'emblema') {
      const em = emblemaTondo(`Emblema_${chiavePg()}`, anello.r);
      if (em) { disegna('', cx - anello.r * zsp, cy - anello.r * zsp, zsp, undefined, parte >= 1 ? em : grigioDi(em)); }
    } else {
      const ic = ABILITA[p.abilita].icona;
      disegna(ic, cx - 12 * zsp, cy - 12 * zsp, zsp, undefined, parte >= 1 ? piatto(ic) : ricolora(ic, 'spento'));
    }
  } else segnaposto(`Speciale_${chiavePg()}`, b.s, H - b.b - 20, 1);
  gruppo = 'pausa';
  const zp = z('pausa'), mpz = misura('Pulsante_Pausa');
  disegna('Pulsante_Pausa', W - b.d - mpz.w * zp, H - b.b - mpz.h * zp, zp);
}

function grigioDi(c: HTMLCanvasElement): HTMLCanvasElement {
  const [o, x] = tela(c.width, c.height); x.drawImage(c, 0, 0);
  const d = x.getImageData(0, 0, o.width, o.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.round((d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) * 0.6 + 12); d.data[i] = v; d.data[i + 1] = v - 4; d.data[i + 2] = v - 8; }
  x.putImageData(d, 0, 0); return o;
}

/** Pulsanti uno sotto l'altro: ogni riga è alta come il pulsante più alto, e si tocca tutta la riga. */
function pulsanti(lista: [string, string][], cx: number, y: number, zz: number, rigaMinima = 0): number {
  const riga = Math.max(rigaMinima, ...lista.map(([k]) => misura(k).h)) * zz;
  for (const [k, testo] of lista) {
    const m = misura(k), x = Math.round(cx - (m.w * zz) / 2), yy = Math.round(y + (riga - m.h * zz) / 2);
    gruppo = `pulsante «${testo}»`;
    disegna(k, x, yy, zz);
    segna(x, y, m.w * zz, riga); // la zona che si tocca
    scriviDentro(testo, INTERNI[k]?.testo ?? { x: 0, y: 0, l: m.w, a: m.h }, x, yy, zz, { px: 11 * zz, colore: k === 'Pulsante_Acceso' || k === 'Pulsante_Chiaro' ? '#2a1a0c' : '#e8dcc4', font: 'titolo' });
    y += riga + 3 * zz;
  }
  return y;
}
const altezzaPulsanti = (lista: [string, string][], zz: number): number => lista.length * (Math.max(...lista.map(([k]) => misura(k).h)) * zz + 3 * zz) - 3 * zz;

/** Il più grande ingrandimento intero, non oltre quello scelto, per cui la schermata ci sta. */
function adattaZoom(zz: number, ciSta: (k: number) => boolean): number {
  let k = zz; while (k > 1 && !ciSta(k)) k--; return k;
}

function scenaDoni(t: number): void {
  scenaPartita(t); retino(11); strato = 1;
  // stessa disposizione del gioco (src/sistema/doni.ts): titolo, tre carte affiancate, numeri, Rimescola
  const m = misura('Carta_Dono'), r = misura('Pulsante_Scuro'), b = bordi(), zt = z('pulsanti');
  const titolo = 32 * raddoppio(), sotto = 14 * raddoppio(), alta = H - b.a - b.b, larga = W - b.s - b.d;
  const riga = Math.max(r.h, misura('Pulsante_Acceso').h);
  const zz = adattaZoom(z('carte'), (k) => 3 * m.w * k + 8 * k <= larga && titolo + m.h * k + sotto + 8 + riga * zt <= alta);
  const tot = 3 * m.w * zz + 8 * zz, x0 = Math.round(W / 2 - tot / 2);
  let y = b.a + Math.max(0, Math.round((alta - (titolo + m.h * zz + sotto + 8 + riga * zt)) / 2));
  gruppo = 'titolo';
  scrivi('Un nuovo dono', W / 2, y + Math.round((titolo - 22 * raddoppio() * 1.35) / 2), { px: 22 * raddoppio(), colore: pg().colore, font: 'titolo', allinea: 'centro', ombra: true });
  y += titolo;
  const arma = iconaArma();
  const carte: [string, string, string, string][] = [
    ['Carta_Dono', arma.icona, arma.nome, 'Livello 4: un colpo in più'],
    ['Carta_Dono_Scelta', FALCE.icona, FALCE.nome, 'Nuova arma: una lama che ti gira attorno'],
    ['Carta_Dono', CAMPANA.icona, CAMPANA.nome, 'Nuova arma: un rintocco che respinge'],
  ];
  carte.forEach(([k, icona, nome, testo], i) => {
    const x = x0 + i * (m.w + 4) * zz, ri = INTERNI[k];
    gruppo = `carta ${i + 1}`;
    disegna(k, x, y, zz);
    const zi = Math.max(1, zz - 1);
    disegna(icona, x + (ri.icona.x + ri.icona.l / 2) * zz - 12 * zi, y + (ri.icona.y + ri.icona.a / 2) * zz - 12 * zi, zi);
    scriviDentro(nome, ri.titolo, x, y, zz, { px: 8 * zz, colore: '#e8dcc4' });
    scriviRighe(testo, ri.testo, x, y, zz, { px: 6 * zz, colore: '#c8bca4' });
    scrivi(String(i + 1), x + (m.w * zz) / 2, y + m.h * zz + 2, { px: 10 * raddoppio(), colore: '#9c907c', allinea: 'centro' });
  });
  y += m.h * zz + sotto + 8;
  pulsanti([['Pulsante_Scuro', 'Rimescola (2)']], W / 2, y, zt, misura('Pulsante_Acceso').h); // come nel gioco: si tocca sull'altezza dei pulsanti più alti
}

function scenaPausa(t: number): void {
  scenaPartita(t); retino(12); strato = 1;
  const m = misura('Pannello_Grande'), r = INTERNI.Pannello_Grande, b = bordi();
  const zp = z('pulsanti'), mp = misura('Pulsante_Acceso'), ori = stato.telefono === 'orizzontale';
  const lista: [string, string][] = [['Pulsante_Acceso', 'Riprendi'], ['Pulsante_Scuro', 'Audio: sì'], ['Pulsante_Scuro', 'Vibrazione: sì'], ['Pulsante_Spento', 'Abbandona']];
  const altezza = altezzaPulsanti(lista, zp), alta = H - b.a - b.b;
  const zz = adattaZoom(z('pannelli'), (k) => (ori ? m.h * k <= alta && m.w * k + 12 + mp.w * zp <= W - b.s - b.d : 10 + m.h * k + 6 + altezza <= alta && m.w * k <= W - b.s - b.d));
  // in orizzontale i pulsanti vanno a destra del pannello, perché sotto non c'è posto
  const tot = ori ? m.w * zz + 12 + mp.w * zp : m.w * zz;
  const x = Math.round(W / 2 - tot / 2), y = ori ? Math.round(b.a + (H - b.a - b.b - m.h * zz) / 2) : b.a + 10;
  gruppo = 'pannello';
  disegna('Pannello_Grande', x, y, zz);
  scriviDentro('Pausa', r.testo, x, y, zz, { px: 22 * zz, colore: pg().colore, font: 'titolo' });
  [iconaArma().icona, FALCE.icona, CANDELA.icona, 'Icona_Clessidra'].forEach((ic, i) => {
    const c = r[`casella${i + 1}`]; disegna(ic, x + (c.x + c.l / 2) * zz - 12 * zz, y + (c.y + c.a / 2) * zz - 12 * zz, zz);
  });
  if (ori) pulsanti(lista, x + m.w * zz + 12 + (mp.w * zp) / 2, Math.round(b.a + (H - b.a - b.b - altezza) / 2), zp);
  else pulsanti(lista, W / 2, y + m.h * zz + 6, zp);
}

function scenaSelezione(t: number): void {
  strato = 1; sfondo(); retino(13);
  const p = pg(), kc = `Cornice_${chiavePg()}`, zr = z('ritratto'), zp = z('pannelli'), b = bordi();
  const mc = misura(kc), rit = sprite(p.ritratto);
  const verticale = stato.telefono === 'verticale';
  const xc = verticale ? Math.round(W / 2 - (mc.w * zr) / 2) : b.s + 30, yc = verticale ? b.a + 4 : Math.round(H / 2 - (mc.h * zr) / 2);
  const ri = INTERNI[kc]?.ritratto;
  gruppo = 'ritratto';
  disegna(kc, xc, yc, zr);
  if (rit && ri) {
    let tt = t % rit.durata, n = 0; while (tt >= rit.fot[n].duration) { tt -= rit.fot[n].duration; n++; }
    disegna(p.ritratto, xc + (ri.x + ri.l / 2) * zr - rit.w / 2, yc + (ri.y + ri.a) * zr - rit.h - 2, 1, undefined, piatto(p.ritratto, n));
  }
  const cx = verticale ? W / 2 : xc + mc.w * zr + (W - b.d - (xc + mc.w * zr)) / 2;
  const mn = misura('Nastro_Titolo');
  let y = verticale ? yc + mc.h * zr + 4 : Math.round(H / 2 - 120);
  const xn = Math.round(cx - (mn.w * zp) / 2);
  gruppo = 'nome';
  disegna('Nastro_Titolo', xn, y, zp);
  scriviDentro(p.nome, INTERNI.Nastro_Titolo.testo, xn, y, zp, { px: 14 * zp, colore: '#3a2414', font: 'titolo' });
  y += mn.h * zp + 2;
  gruppo = 'motto';
  scrivi(p.motto, cx, y, { px: 18, colore: p.colore, font: 'titolo', allinea: 'centro', ombra: true });
  y += 30;
  gruppo = 'emblemi';
  const me = misura('Emblema_Il_Lampionaio'), gap = 8, tot = 4 * me.w + 3 * gap;
  PERSONAGGI.forEach((q, i) => {
    const k = `Emblema_${q.nome.replace(/ /g, '_')}`;
    disegna(k, Math.round(cx - tot / 2 + i * (me.w + gap)), y, 1, undefined, q.id === p.id ? piatto(k) : ricolora(k, 'spento'));
  });
}

function scenaFine(t: number): void {
  scenaPartita(t); retino(13); strato = 1;
  const b = bordi(), mn = misura('Nastro_Titolo'), mp = misura('Pannello_Grande'), r = INTERNI.Pannello_Grande;
  const zb = z('pulsanti'), mb = misura('Pulsante_Acceso'), lista: [string, string][] = [['Pulsante_Acceso', 'Riprova'], ['Pulsante_Chiaro', 'Menu']];
  const oriz = stato.telefono === 'orizzontale', alta = H - b.a - b.b;
  const zz = adattaZoom(z('pannelli'), (k) => 6 + mn.h * k - 6 * k + mp.h * k + (oriz ? 0 : 6 + altezzaPulsanti(lista, zb)) <= alta);
  let y = b.a + 6;
  const xn = Math.round(W / 2 - (mn.w * zz) / 2);
  gruppo = 'titolo';
  disegna('Nastro_Titolo', xn, y, zz);
  scriviDentro("L'alba", INTERNI.Nastro_Titolo.testo, xn, y, zz, { px: 16 * zz, colore: '#3a2414', font: 'titolo' });
  y += mn.h * zz - 6 * zz;
  const ori = stato.telefono === 'orizzontale', larghi = ori ? mp.w * zz + 12 + misura('Pulsante_Acceso').w * z('pulsanti') : mp.w * zz;
  const xp = Math.round(W / 2 - larghi / 2);
  gruppo = 'pannello';
  disegna('Pannello_Grande', xp, y, zz);
  scriviRighe('Sopravvissuto 15:00 · Livello 23 · 812 anime · nuovo record', r.testo, xp, y, zz, { px: 9 * zz, colore: '#e8dcc4' });
  [iconaArma().icona, FALCE.icona, CANDELA.icona, 'Icona_Clessidra'].forEach((ic, i) => {
    const c = r[`casella${i + 1}`]; disegna(ic, xp + (c.x + c.l / 2) * zz - 12 * zz, y + (c.y + c.a / 2) * zz - 12 * zz, zz);
  });
  if (oriz) pulsanti(lista, xp + mp.w * zz + 12 + (mb.w * zb) / 2, Math.round(y + (mp.h * zz) / 2 - mb.h * zb), zb);
  else pulsanti(lista, W / 2, y + mp.h * zz + 6, zb);
}

const SCENE: Record<string, (t: number) => void> = { partita: scenaPartita, doni: scenaDoni, pausa: scenaPausa, selezione: scenaSelezione, fine: scenaFine };

// ————— il telefono: canvas in pixel di gioco, ingrandito di un numero intero di pixel fisici —————
function adatta(): void {
  M = misureOra(); W = M.W; H = M.H;
  if (schermo.width !== W || schermo.height !== H) { schermo.width = W; schermo.height = H; g.imageSmoothingEnabled = false; }
  const dpr = window.devicePixelRatio || 1;
  // se il telefono non ci sta accanto ai comandi, i comandi vanno sotto
  const banco = document.querySelector<HTMLElement>('.banco')!;
  banco.classList.toggle('largo', W / dpr > banco.clientWidth - 380);
  const box = schermo.parentElement!.getBoundingClientRect();
  const n = Math.max(1, Math.floor(Math.min((box.width * dpr) / W, ((window.innerHeight - 60) * dpr) / H)));
  schermo.style.width = `${(W * n) / dpr}px`; schermo.style.height = `${(H * n) / dpr}px`;
  document.getElementById('didascalia')!.textContent = `${telefono().nome} in ${stato.telefono}: ${W}×${H} pixel di gioco, scala ×${M.scala} (1 pixel di gioco = ${M.scala} pixel dello schermo)${raddoppio() > 1 ? ', HUD ingrandito ×' + raddoppio() : ''}`;
}

function ciclo(t: number): void {
  if (sfondi[stato.telefono]) {
    adatta(); g.clearRect(0, 0, W, H); gruppo = '';
    (SCENE[stato.schermata] ?? scenaPartita)(t);
    disegnaTacca();
  }
  requestAnimationFrame(ciclo);
}

// ————— verifica: ogni schermata su ogni telefono, in verticale e in orizzontale —————
interface Problema { telefono: string; orientamento: string; schermata: string; tipo: string; dettaglio: string }
const SCHERMATE = ['partita', 'doni', 'pausa', 'selezione', 'fine'];
const LIBERI = ['joystick', 'salute-piedi']; // stanno sopra il gioco per natura: devono solo restare nello schermo
const DITO = 44; // punti: la misura minima di un pulsante da toccare (Apple 44, Android 48 dp ≈ 44 punti)
const daToccare = (n: string): boolean => n === 'pausa' || n === 'speciale' || n.startsWith('pulsante') || n.startsWith('carta');

function verifica(): Problema[] {
  const salvato = JSON.stringify(stato); const prob: Problema[] = [];
  for (const tel of TELEFONI) for (const or of ['verticale', 'orizzontale']) for (const sc of SCHERMATE) {
    Object.assign(stato, { dispositivo: tel.id, telefono: or, schermata: sc, tacca: true, boss: true, joystick: true, segnale: true, avviso: 'nastro' });
    M = misureOra(); W = M.W; H = M.H; schermo.width = W; schermo.height = H; g.imageSmoothingEnabled = false;
    registro = []; avvisiTesto = []; gruppo = '';
    SCENE[sc](0);
    const rett = registro; registro = null;
    const alto = Math.max(...rett.map((r) => r.strato));
    const gr = new Map<string, { x0: number; y0: number; x1: number; y1: number }>();
    for (const r of rett) {
      if (r.strato !== alto) continue;
      const q = gr.get(r.gruppo) ?? { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      gr.set(r.gruppo, { x0: Math.min(q.x0, r.x), y0: Math.min(q.y0, r.y), x1: Math.max(q.x1, r.x + r.w), y1: Math.max(q.y1, r.y + r.h) });
    }
    const base = { telefono: tel.nome, orientamento: or, schermata: sc };
    const sa = M.safe, voci = [...gr.entries()];
    for (const [n, q] of voci) {
      const esce = [q.x0 < 0 && `${-q.x0} px a sinistra`, q.y0 < 0 && `${-q.y0} px in alto`, q.x1 > W && `${q.x1 - W} px a destra`, q.y1 > H && `${q.y1 - H} px in basso`].filter(Boolean);
      const sotto = [q.x0 < sa.s && `${sa.s - q.x0} px a sinistra`, q.y0 < sa.a && `${sa.a - q.y0} px in alto`, q.x1 > W - sa.d && `${q.x1 - W + sa.d} px a destra`, q.y1 > H - sa.b && `${q.y1 - H + sa.b} px in basso`].filter(Boolean);
      if (esce.length) prob.push({ ...base, tipo: 'esce dallo schermo', dettaglio: `${n}: ${esce.join(', ')}` });
      else if (sotto.length && !LIBERI.includes(n)) prob.push({ ...base, tipo: 'sotto tacca o barre di sistema', dettaglio: `${n}: ${sotto.join(', ')}` });
      if (daToccare(n)) {
        const extra = n === 'pausa' || n === 'speciale' ? 2 * MARGINE_TOCCO : 0; // area di tocco invisibile attorno al disegno
        const lato = (Math.min(q.x1 - q.x0, q.y1 - q.y0) * M.scala) / M.dpr + extra;
        if (lato < DITO) prob.push({ ...base, tipo: 'troppo piccolo per il dito', dettaglio: `${n}: ${Math.round(lato)} punti, ne servono ${DITO}` });
      }
    }
    for (let i = 0; i < voci.length; i++) for (let j = i + 1; j < voci.length; j++) {
      const [na, a] = voci[i], [nb, b] = voci[j];
      if (LIBERI.includes(na) || LIBERI.includes(nb)) continue;
      const l = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (l > 0 && h > 0) prob.push({ ...base, tipo: 'sovrapposti', dettaglio: `${na} e ${nb} (${l}×${h} px)` });
    }
    for (const t of new Set(avvisiTesto)) prob.push({ ...base, tipo: 'testo', dettaglio: t });
  }
  Object.assign(stato, JSON.parse(salvato)); adatta();
  return prob;
}

function mostraVerifica(): void {
  const prob = verifica(), box = document.getElementById('verifica-esito')!;
  const righe = TELEFONI.map((t) => {
    const celle = ['verticale', 'orizzontale'].map((o) => {
      const m = misureTelefono(t, o as 'verticale' | 'orizzontale'), n = prob.filter((p) => p.telefono === t.nome && p.orientamento === o).length;
      return `<td class="${n ? 'no' : 'si'}">${n ? `${n} problemi` : 'tutto dentro'}<small>${m.W}×${m.H} · ×${m.scala}</small></td>`;
    }).join('');
    return `<tr><th>${t.nome}</th>${celle}</tr>`;
  }).join('');
  const dettagli = prob.map((p) => `<li><strong>${p.telefono}, ${p.orientamento}, ${p.schermata}</strong> · ${p.tipo}: ${p.dettaglio}</li>`).join('');
  box.innerHTML = `<table class="esito"><tr><th></th><th>Verticale</th><th>Orizzontale</th></tr>${righe}</table>${prob.length ? `<ol class="problemi">${dettagli}</ol>` : '<p>Nessun problema: ogni elemento entra nello schermo, fuori da tacca e barre, senza sovrapposizioni, e i pulsanti sono abbastanza grandi.</p>'}`;
}
(window as unknown as { __verificaHud: () => Problema[] }).__verificaHud = verifica;

// ————— comandi —————
function aggiornaComandi(): void {
  document.querySelectorAll<HTMLElement>('.scelte[data-scelta]').forEach((el) => {
    const v = String(stato[el.dataset.scelta as keyof Stato]);
    el.querySelectorAll<HTMLButtonElement>('button').forEach((bt) => bt.setAttribute('aria-pressed', String(bt.dataset.valore === v)));
  });
  document.querySelectorAll<HTMLInputElement>('[data-opzione]').forEach((el) => (el.checked = Boolean(stato[el.dataset.opzione as keyof Stato])));
  document.querySelectorAll<HTMLInputElement>('[data-valore-num]').forEach((el) => (el.value = String(stato[el.dataset.valoreNum as keyof Stato])));
  // la partita resta sotto anche a doni, pausa e fine: i suoi comandi spariscono solo nella selezione
  document.querySelectorAll<HTMLElement>('[data-solo]').forEach((el) => (el.hidden = stato.schermata === 'selezione'));
  document.querySelectorAll<HTMLSelectElement>('[data-misura]').forEach((el) => (el.value = String(stato.misure[el.dataset.misura!])));
  (document.getElementById('scelta-dispositivo') as HTMLSelectElement).value = stato.dispositivo;
  document.documentElement.style.setProperty('--accento', pg().colore);
}

function preparaComandi(): void {
  const scelta = document.getElementById('scelta-pg')!;
  for (const p of PERSONAGGI) {
    const bt = document.createElement('button'); bt.dataset.valore = p.id; bt.textContent = p.nome; bt.style.color = p.colore; scelta.append(bt);
  }
  const dispositivo = document.getElementById('scelta-dispositivo') as HTMLSelectElement;
  for (const t of TELEFONI) dispositivo.append(new Option(t.nome, t.id));
  dispositivo.addEventListener('change', () => { stato.dispositivo = dispositivo.value; ricorda(); });
  document.getElementById('verifica-avvia')!.addEventListener('click', mostraVerifica);
  const misure = document.getElementById('misure')!;
  for (const [k, nome] of Object.entries(NOMI_MISURE)) {
    const et = document.createElement('label'); et.textContent = nome; et.htmlFor = `misura-${k}`;
    const sel = document.createElement('select'); sel.id = `misura-${k}`; sel.dataset.misura = k;
    for (const n of [1, 2, 3, 4]) sel.append(new Option(`×${n}${n === INGRANDIMENTO[k] ? ' (proposto)' : ''}`, String(n)));
    sel.addEventListener('change', () => { stato.misure[k] = Number(sel.value); ricorda(); });
    misure.append(et, sel);
  }
  document.getElementById('misure-predefinite')!.addEventListener('click', () => { stato.misure = { ...INGRANDIMENTO }; ricorda(); aggiornaComandi(); });
  document.addEventListener('click', (e) => {
    const bt = (e.target as HTMLElement).closest<HTMLButtonElement>('.scelte[data-scelta] button'); if (!bt) return;
    const chiave = (bt.parentElement as HTMLElement).dataset.scelta as keyof Stato;
    (stato as Record<string, unknown>)[chiave] = bt.dataset.valore;
    ricorda(); aggiornaComandi();
    if (chiave === 'fondoCatalogo' || chiave === 'zoomCatalogo' || chiave === 'pg') catalogo();
  });
  document.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.opzione) (stato as Record<string, unknown>)[el.dataset.opzione] = el.checked;
    else if (el.dataset.valoreNum) (stato as Record<string, unknown>)[el.dataset.valoreNum] = Number(el.value);
    else return;
    ricorda();
  });
  document.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.valoreNum) (stato as Record<string, unknown>)[el.dataset.valoreNum] = Number(el.value);
  });
}

// ————— catalogo di tutti gli elementi —————
function cartella(k: string): string {
  if (k.startsWith('Barra_')) return 'Barre';
  if (k.startsWith('Pulsante_') || k.startsWith('Speciale_') || k.startsWith('Joystick')) return 'Pulsanti';
  if (k.startsWith('Emblema_')) return 'Emblemi';
  if (k.startsWith('Pannello_')) return 'Pannelli';
  if (k.startsWith('Segnale_') || k.startsWith('Scrigno')) return 'Segnali';
  return 'Cornici';
}

function descrizione(k: string): string {
  const nomePg = PERSONAGGI.find((p) => k.includes(p.nome.replace(/ /g, '_')))?.nome ?? '';
  const D: Record<string, string> = {
    Barra_Esperienza_Cornice: "Barra dell'esperienza, in alto: sostituisce la striscia arancione.",
    Barra_Esperienza_Piena: "Riempimento dell'esperienza, già della misura della finestra (184×5).",
    Barra_Mietitore_Cornice: 'Vita del Mietitore, ai minuti 5 e 10.',
    Barra_Mietitore_Piena: 'Riempimento della barra del Mietitore (204×8).',
    Barra_Salute_Cornice: 'Salute del personaggio: sotto i piedi o in alto. Il rosso è stato tolto e messo a parte.',
    Barra_Salute_Piena: 'Riempimento della salute (47×6).',
    Casella_Arma: "Casella di un'arma o di un dono: icona da 24 px e livello.",
    Stemma_Livello: 'Stemma piccolo: qui fa da livello del personaggio.',
    Speciale_Ricarica: "Anello dell'abilità della tavola UI, versione in ricarica.",
    Speciale_Pronta: "Anello dell'abilità della tavola UI, versione pronta.",
    Pulsante_Pausa: 'Pausa, in basso a destra.',
    Joystick_Base: 'Base del joystick: compare dove si appoggia il dito. Fondo a retino.',
    Joystick_Pomello: 'Pomello del joystick: segue il dito.',
    Segnale_Reliquiario: 'Segnale sul bordo che indica un reliquiario fuori dallo schermo.',
    Targa_Lapide: 'Targa per gli avvisi (sciami, Mietitore) o per i titoli.',
    Nastro_Titolo: "Nastro per i titoli: nome del personaggio, «L'alba».",
    Carta_Dono: 'Carta della scelta del dono.',
    Carta_Dono_Scelta: 'Carta del dono quando è selezionata (tasto 1-2-3 o dito sopra).',
    Pannello_Grande: 'Pannello per la pausa e la fine partita: titolo e 4 caselle.',
    Pannello_Scheda: 'Scheda alta del personaggio: per ora non usata (vedi le note).',
    Pulsante_Acceso: 'Pulsante principale (Riprendi, Riprova).',
    Pulsante_Chiaro: 'Pulsante chiaro.',
    Pulsante_Scuro: 'Pulsante normale.',
    Pulsante_Spento: 'Pulsante spento o secondario (Abbandona).',
    Scrigno: 'Scrigno: reliquiario o forziere, da decidere.',
  };
  if (D[k]) return D[k];
  if (k.endsWith('_Ricarica')) return `Anello dell'abilità di ${nomePg}, in ricarica: si colora man mano che l'abilità torna pronta.`;
  if (k.startsWith('Speciale_')) return `Anello dell'abilità di ${nomePg} (versione pronta).`;
  if (k.startsWith('Cornice_')) return `Cornice del ritratto di ${nomePg}, nella selezione.`;
  if (k.startsWith('Emblema_')) return `Emblema di ${nomePg}.`;
  return '';
}

function catalogo(): void {
  const box = document.getElementById('catalogo')!;
  box.className = `catalogo fondo-${stato.fondoCatalogo}`;
  box.replaceChildren();
  const ordine = ['Barre', 'Pulsanti', 'Cornici', 'Pannelli', 'Emblemi', 'Segnali'];
  const voci = [...hud.entries()].sort(([a], [b]) => ordine.indexOf(cartella(a)) - ordine.indexOf(cartella(b)) || a.localeCompare(b));
  const zz = Number(stato.zoomCatalogo);
  for (const [k, s] of voci) {
    const p = piatto(k)!;
    const el = document.createElement('article'); el.className = 'voce';
    const t = document.createElement('div'); t.className = 'tela';
    const c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
    c.getContext('2d')!.drawImage(p, 0, 0);
    c.style.width = `${s.w * zz}px`;
    t.append(c);
    el.append(t);
    el.insertAdjacentHTML('beforeend', `<h3>${k.replace(/_/g, ' ')}</h3><p>${descrizione(k)}</p><p class="file">${s.w}×${s.h} px · HUD/${cartella(k)}/${k}_V${s.versione}.aseprite</p>`);
    box.append(el);
  }
}

// ————— avvio e aggiornamento automatico dopo `npm run asset` —————
const scriviStato = (t: string): void => { document.getElementById('stato')!.textContent = t; };

async function avvia(): Promise<void> {
  preparaComandi(); aggiornaComandi();
  // senza i caratteri la pagina funziona lo stesso, con quelli di riserva
  await Promise.all([document.fonts.load('500 16px "Pixelify Sans"'), document.fonts.load('400 16px "IM Fell English SC"')]).catch(() => undefined);
  try {
    await caricaTutto();
    scriviStato(`${hud.size} elementi dell'HUD caricati.`);
  } catch (e) {
    scriviStato(`Non trovo gli asset dell'HUD (${(e as Error).message}): lancia npm run asset.`);
    return;
  }
  catalogo();
  requestAnimationFrame(ciclo);
  window.addEventListener('resize', adatta);
  setInterval(async () => {
    try {
      const e = (await (await fetch(`assets/hud/elenco.json?v=${Date.now()}`, { cache: 'no-store' })).json()) as { esportato?: string };
      if (e.esportato && e.esportato !== esportato) {
        await caricaTutto(); cacheAnelli.clear(); catalogo();
        scriviStato(`${hud.size} elementi dell'HUD, aggiornati alle ${new Date().toLocaleTimeString('it-IT')}.`);
      }
    } catch { /* la prossima volta */ }
  }, 2000);
}
void avvia();
