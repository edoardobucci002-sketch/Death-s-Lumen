/*
 * Bozza dell'HUD (bozza-hud.html): disegna su un «telefono» in pixel di gioco veri lo sfondo del gioco
 * e gli elementi della cartella HUD al loro posto, nelle varie schermate, più il catalogo di tutti i pezzi.
 * Legge public/assets/hud/elenco.json (scritto da `npm run asset`) e si aggiorna quando cambia.
 * Non fa parte del gioco: serve a Edoardo per vedere i disegni senza giocare.
 */
import './bozza.css';
import { ABILITA } from '../data/abilita';
import { ARMI_INIZIALI, CAMPANA, CANDELA, FALCE } from '../data/armi';
import { ANELLI, FINESTRE, INGRANDIMENTO, INTERNI, LAMPEGGIO_SEGNALE, type Riquadro } from '../data/hud';
import { PERSONAGGI, type Personaggio } from '../data/personaggi';

interface R4 { x: number; y: number; w: number; h: number }
interface Fotogramma { frame: R4; spriteSourceSize: R4; sourceSize: { w: number; h: number }; duration: number }
interface Sprite { img: HTMLImageElement; fot: Fotogramma[]; w: number; h: number; durata: number; versione: number }
interface VoceElenco { chiave: string; categoria: string; immagine: string; dati: string; versioneFile: number }

type Testo = { px: number; colore: string; font?: 'pixel' | 'titolo'; allinea?: 'sinistra' | 'centro' | 'destra'; ombra?: boolean };

// ————— stato della pagina (ricordato nel browser) —————
const stato = {
  schermata: 'partita', pg: 'lampionaio', telefono: 'verticale', tacca: true,
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
  joystick: 'Joystick', segnale: 'Segnale reliquiario', avvisi: 'Avvisi', carte: 'Carte dei doni', pannelli: 'Pannelli e pulsanti', ritratto: 'Cornice ritratto',
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

/** Disegna uno sprite con l'angolo della sua tela in (x, y), ingrandito k volte; larghezza = quanta parte mostrare da sinistra. */
function disegna(k: string, x: number, y: number, z = 1, larghezza?: number, fonte?: HTMLCanvasElement | null): void {
  const p = fonte ?? piatto(k);
  if (!p) { segnaposto(k, x, y, z); return; }
  const lw = Math.max(0, Math.min(p.width, larghezza ?? p.width));
  if (lw > 0) g.drawImage(p, 0, 0, lw, p.height, Math.round(x), Math.round(y), lw * z, p.height * z);
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
  g.drawImage(c, Math.round(x + dx), Math.round(y)); return c.width;
}

/** Testo dentro un riquadro: rimpicciolisce finché ci sta, centrato. */
function scriviDentro(t: string, r: Riquadro, ox: number, oy: number, z: number, o: Testo): void {
  let px = o.px;
  while (px > 7 && testoTela(t, { ...o, px }).width > r.l * z) px--;
  const c = testoTela(t, { ...o, px });
  g.drawImage(c, Math.round(ox + (r.x + r.l / 2) * z - c.width / 2), Math.round(oy + (r.y + r.a / 2) * z - c.height / 2));
}

/** Più righe dentro un riquadro, a capo sulle parole. */
function scriviRighe(t: string, r: Riquadro, ox: number, oy: number, z: number, o: Testo): void {
  const parole = t.split(' '); const righe: string[] = []; let riga = '';
  for (const p of parole) { const prova = riga ? `${riga} ${p}` : p; if (testoTela(prova, o).width > r.l * z && riga) { righe.push(riga); riga = p; } else riga = prova; }
  if (riga) righe.push(riga);
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
const z = (gruppo: string): number => stato.misure[gruppo] ?? 1;
const iconaArma = (): { nome: string; icona: string } => ARMI_INIZIALI[pg().armaIniziale];

function bordi(): { a: number; b: number; s: number; d: number } {
  const m = 6;
  if (!stato.tacca) return { a: m, b: m, s: m, d: m };
  // safe area di un iPhone con Dynamic Island, in pixel di gioco (×3 del telefono, ÷2 della scala)
  return stato.telefono === 'verticale' ? { a: 70 + m, b: 51 + m, s: m, d: m } : { a: m, b: 32 + m, s: 70 + m, d: 70 + m };
}

function disegnaTacca(): void {
  if (!stato.tacca) return;
  g.fillStyle = '#000';
  // capsula nera (Dynamic Island), pixel per pixel
  const pillola = (x: number, y: number, w: number, h: number): void => {
    const r = Math.min(w, h) / 2;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const ax = Math.min(Math.max(i + 0.5, r), w - r), ay = Math.min(Math.max(j + 0.5, r), h - r);
      if (Math.hypot(i + 0.5 - ax, j + 0.5 - ay) <= r) g.fillRect(x + i, y + j, 1, 1);
    }
  };
  if (stato.telefono === 'verticale') pillola(Math.round(W / 2 - 94), 16, 189, 55); else pillola(16, Math.round(H / 2 - 94), 55, 189);
}

function barraSalute(cx: number, y: number): void {
  const zz = z('salute'), m = misura('Barra_Salute_Cornice'), f = FINESTRE.Barra_Salute_Cornice;
  const x = Math.round(cx - (m.w * zz) / 2);
  disegna('Barra_Salute_Cornice', x, y, zz);
  disegna('Barra_Salute_Piena', x + f.x * zz, y + f.y * zz, zz, Math.round((f.l * stato.salute) / 100));
}

function scenaPartita(t: number): void {
  g.drawImage(sfondi[stato.telefono], 0, 0);
  const b = bordi(), p = pg();
  if (stato.salutePosto === 'personaggio') barraSalute(W / 2, Math.round(H / 2) + 2);

  // in alto: livello, esperienza, orologio, anime
  const zb = z('barre'), zc = z('caselle');
  const me = misura('Barra_Esperienza_Cornice'), fe = FINESTRE.Barra_Esperienza_Cornice;
  const xe = Math.round(W / 2 - (me.w * zb) / 2), ye = b.a;
  disegna('Barra_Esperienza_Cornice', xe, ye, zb);
  const piena = stato.esperienzaColore === 'tavola' ? null : ricolora('Barra_Esperienza_Piena', p.colore);
  disegna('Barra_Esperienza_Piena', xe + fe.x * zb, ye + fe.y * zb, zb, Math.round((fe.l * stato.esperienza) / 100), piena);
  scrivi('7:42', W / 2, ye + me.h * zb + 2, { px: 16 * zb, colore: '#e8dcc4', allinea: 'centro', ombra: true });
  const ms = misura('Stemma_Livello');
  disegna('Stemma_Livello', b.s, b.a, zc);
  scriviDentro('12', INTERNI.Stemma_Livello.numero, b.s, b.a, zc, { px: 12 * zc, colore: p.colore, ombra: true });
  scrivi('◆ 248', W - b.d, b.a + 4, { px: 16 * zc, colore: '#8fd6c8', allinea: 'destra', ombra: true });

  // caselle delle armi
  const mc = misura('Casella_Arma'), ic = INTERNI.Casella_Arma.icona;
  const yc = b.a + Math.max(ms.h * zc, me.h * zb + 22) + 4;
  [[iconaArma().icona, 3], [FALCE.icona, 1], [CANDELA.icona, 2]].forEach(([icona, lv], i) => {
    const x = b.s + i * (mc.w * zc + 2 * zc);
    disegna('Casella_Arma', x, yc, zc);
    disegna(String(icona), x + (ic.x + ic.l / 2 - 12) * zc, yc + (ic.y + ic.a / 2 - 12) * zc, zc);
    scrivi(String(lv), x + (ic.x + ic.l) * zc, yc + (ic.y + ic.a) * zc - 10 * zc, { px: 10 * zc, colore: '#e8dcc4', allinea: 'destra', ombra: true });
  });
  let y = yc + mc.h * zc + 4;
  if (stato.salutePosto === 'alto') { const zs = z('salute'); barraSalute(b.s + (misura('Barra_Salute_Cornice').w * zs) / 2, y); y += misura('Barra_Salute_Cornice').h * zs + 4; }

  // il Mietitore: in orizzontale sta in alto, sotto l'orologio (le caselle sono a sinistra e c'è posto)
  if (stato.telefono === 'orizzontale') y = ye + me.h * zb + 22;
  if (stato.boss) {
    const mm = misura('Barra_Mietitore_Cornice'), fm = FINESTRE.Barra_Mietitore_Cornice;
    const xm = Math.round(W / 2 - (mm.w * zb) / 2);
    disegna('Barra_Mietitore_Cornice', xm, y, zb);
    disegna('Barra_Mietitore_Piena', xm + fm.x * zb, y + fm.y * zb, zb, Math.round((fm.l * stato.mietitore) / 100));
    y += mm.h * zb + 6;
  }

  // avviso al centro
  if (stato.avviso !== 'nessuno') {
    const k = stato.avviso === 'nastro' ? 'Nastro_Titolo' : 'Targa_Lapide', za = z('avvisi'), ma = misura(k);
    const xa = Math.round(W / 2 - (ma.w * za) / 2), ya = Math.max(y, Math.round(H * 0.3));
    disegna(k, xa, ya, za);
    scriviDentro('Arriva uno sciame', INTERNI[k].testo, xa, ya, za, { px: 10 * za, colore: stato.avviso === 'nastro' ? '#3a2414' : '#2a2018' });
  }

  // segnale del reliquiario sul bordo
  if (stato.segnale && Math.floor((t / 1000) * LAMPEGGIO_SEGNALE) % 2 === 0) {
    const zs = z('segnale'), m = misura('Segnale_Reliquiario');
    disegna('Segnale_Reliquiario', W - b.d - m.w * zs, Math.round(H * 0.42), zs);
  }

  // joystick dove si appoggia il dito
  if (stato.joystick) {
    const zj = z('joystick'), mb = misura('Joystick_Base'), mp = misura('Joystick_Pomello');
    const cx = stato.telefono === 'verticale' ? W / 2 : W * 0.32, cy = stato.telefono === 'verticale' ? H * 0.74 : H * 0.6;
    disegna('Joystick_Base', cx - (mb.w * zj) / 2, cy - (mb.h * zj) / 2, zj);
    const raggio = ((mb.w - mp.w) / 2) * 0.6 * zj, ang = t / 900;
    disegna('Joystick_Pomello', cx + Math.cos(ang) * raggio - (mp.w * zj) / 2, cy + Math.sin(ang) * raggio - (mp.h * zj) / 2, zj);
  }

  // abilità in basso a sinistra, pausa in basso a destra
  const zsp = z('speciale');
  const anello = stato.anello === 'tavola' ? datiAnello('Speciale_Pronta', 'Speciale_Ricarica') : datiAnello(`Speciale_${chiavePg()}`, sprite(`Speciale_${chiavePg()}_Ricarica`) ? `Speciale_${chiavePg()}_Ricarica` : null);
  const parte = stato.ricarica ? ((t / 1000) % 8) / 6 : 1; // 6 secondi di ricarica, 2 pronta
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
  const zp = z('pausa'), mpz = misura('Pulsante_Pausa');
  disegna('Pulsante_Pausa', W - b.d - mpz.w * zp, H - b.b - mpz.h * zp, zp);
}

function grigioDi(c: HTMLCanvasElement): HTMLCanvasElement {
  const [o, x] = tela(c.width, c.height); x.drawImage(c, 0, 0);
  const d = x.getImageData(0, 0, o.width, o.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.round((d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) * 0.6 + 12); d.data[i] = v; d.data[i + 1] = v - 4; d.data[i + 2] = v - 8; }
  x.putImageData(d, 0, 0); return o;
}

function pulsanti(lista: [string, string][], cx: number, y: number, zz: number): number {
  for (const [k, testo] of lista) {
    const m = misura(k), x = Math.round(cx - (m.w * zz) / 2);
    disegna(k, x, y, zz);
    scriviDentro(testo, INTERNI[k]?.testo ?? { x: 0, y: 0, l: m.w, a: m.h }, x, y, zz, { px: 11 * zz, colore: k === 'Pulsante_Acceso' || k === 'Pulsante_Chiaro' ? '#2a1a0c' : '#e8dcc4', font: 'titolo' });
    y += m.h * zz + 3 * zz;
  }
  return y;
}

function scenaDoni(t: number): void {
  scenaPartita(t); retino(11);
  const zz = z('carte'), m = misura('Carta_Dono'), b = bordi();
  scrivi('Scegli un dono', W / 2, b.a + 30, { px: 28, colore: pg().colore, font: 'titolo', allinea: 'centro', ombra: true });
  const arma = iconaArma();
  const carte: [string, string, string, string][] = [
    ['Carta_Dono', arma.icona, arma.nome, 'Livello 4: un colpo in più'],
    ['Carta_Dono_Scelta', FALCE.icona, FALCE.nome, 'Nuova arma: una lama che ti gira attorno'],
    ['Carta_Dono', CAMPANA.icona, CAMPANA.nome, 'Nuova arma: un rintocco che respinge'],
  ];
  const gap = 4 * zz, tot = carte.length * m.w * zz + (carte.length - 1) * gap;
  const verticali = tot > W - b.s - b.d;
  carte.forEach(([k, icona, nome, testo], i) => {
    const x = verticali ? Math.round(W / 2 - (m.w * zz) / 2) : Math.round(W / 2 - tot / 2 + i * (m.w * zz + gap));
    const y = verticali ? b.a + 70 + i * (m.h * zz + gap) : Math.round(H / 2 - (m.h * zz) / 2);
    const r = INTERNI[k];
    disegna(k, x, y, zz);
    const zi = Math.max(1, zz - 1);
    disegna(icona, x + (r.icona.x + r.icona.l / 2) * zz - 12 * zi, y + (r.icona.y + r.icona.a / 2) * zz - 12 * zi, zi);
    scriviDentro(nome, r.titolo, x, y, zz, { px: 8 * zz, colore: '#e8dcc4' });
    scriviRighe(testo, r.testo, x, y, zz, { px: 6 * zz, colore: '#c8bca4' });
  });
}

function scenaPausa(t: number): void {
  scenaPartita(t); retino(12);
  const zz = z('pannelli'), m = misura('Pannello_Grande'), r = INTERNI.Pannello_Grande, b = bordi();
  const x = Math.round(W / 2 - (m.w * zz) / 2), y = b.a + 10;
  disegna('Pannello_Grande', x, y, zz);
  scriviDentro('Pausa', r.testo, x, y, zz, { px: 22 * zz, colore: pg().colore, font: 'titolo' });
  [iconaArma().icona, FALCE.icona, CANDELA.icona, 'Icona_Clessidra'].forEach((ic, i) => {
    const c = r[`casella${i + 1}`]; disegna(ic, x + (c.x + c.l / 2) * zz - 12 * zz, y + (c.y + c.a / 2) * zz - 12 * zz, zz);
  });
  pulsanti([['Pulsante_Acceso', 'Riprendi'], ['Pulsante_Scuro', 'Audio: sì'], ['Pulsante_Scuro', 'Vibrazione: sì'], ['Pulsante_Spento', 'Abbandona']], W / 2, y + m.h * zz + 6, zz);
}

function scenaSelezione(t: number): void {
  g.fillStyle = '#0d0b09'; g.fillRect(0, 0, W, H);
  g.drawImage(sfondi[stato.telefono], 0, 0); retino(13);
  const p = pg(), kc = `Cornice_${chiavePg()}`, zr = z('ritratto'), zp = z('pannelli'), b = bordi();
  const mc = misura(kc), rit = sprite(p.ritratto);
  const verticale = stato.telefono === 'verticale';
  const xc = verticale ? Math.round(W / 2 - (mc.w * zr) / 2) : b.s + 30, yc = verticale ? b.a + 4 : Math.round(H / 2 - (mc.h * zr) / 2);
  const ri = INTERNI[kc]?.ritratto;
  disegna(kc, xc, yc, zr);
  if (rit && ri) {
    let tt = t % rit.durata, n = 0; while (tt >= rit.fot[n].duration) { tt -= rit.fot[n].duration; n++; }
    disegna(p.ritratto, xc + (ri.x + ri.l / 2) * zr - rit.w / 2, yc + (ri.y + ri.a) * zr - rit.h - 2, 1, undefined, piatto(p.ritratto, n));
  }
  const cx = verticale ? W / 2 : xc + mc.w * zr + (W - b.d - (xc + mc.w * zr)) / 2;
  const mn = misura('Nastro_Titolo');
  let y = verticale ? yc + mc.h * zr - 24 : Math.round(H / 2 - 120);
  const xn = Math.round(cx - (mn.w * zp) / 2);
  disegna('Nastro_Titolo', xn, y, zp);
  scriviDentro(p.nome, INTERNI.Nastro_Titolo.testo, xn, y, zp, { px: 14 * zp, colore: '#3a2414', font: 'titolo' });
  y += mn.h * zp + 2;
  scrivi(p.motto, cx, y, { px: 18, colore: p.colore, font: 'titolo', allinea: 'centro', ombra: true });
  y += 30;
  const me = misura('Emblema_Il_Lampionaio'), gap = 8, tot = 4 * me.w + 3 * gap;
  PERSONAGGI.forEach((q, i) => {
    const k = `Emblema_${q.nome.replace(/ /g, '_')}`;
    disegna(k, Math.round(cx - tot / 2 + i * (me.w + gap)), y, 1, undefined, q.id === p.id ? piatto(k) : ricolora(k, 'spento'));
  });
}

function scenaFine(t: number): void {
  scenaPartita(t); retino(13);
  const zz = z('pannelli'), b = bordi(), mn = misura('Nastro_Titolo'), mp = misura('Pannello_Grande'), r = INTERNI.Pannello_Grande;
  let y = b.a + 6;
  const xn = Math.round(W / 2 - (mn.w * zz) / 2);
  disegna('Nastro_Titolo', xn, y, zz);
  scriviDentro("L'alba", INTERNI.Nastro_Titolo.testo, xn, y, zz, { px: 16 * zz, colore: '#3a2414', font: 'titolo' });
  y += mn.h * zz - 6 * zz;
  const xp = Math.round(W / 2 - (mp.w * zz) / 2);
  disegna('Pannello_Grande', xp, y, zz);
  scriviRighe('Sopravvissuto 15:00 · Livello 23 · 812 anime · nuovo record', r.testo, xp, y, zz, { px: 9 * zz, colore: '#e8dcc4' });
  [iconaArma().icona, FALCE.icona, CANDELA.icona, 'Icona_Clessidra'].forEach((ic, i) => {
    const c = r[`casella${i + 1}`]; disegna(ic, xp + (c.x + c.l / 2) * zz - 12 * zz, y + (c.y + c.a / 2) * zz - 12 * zz, zz);
  });
  pulsanti([['Pulsante_Acceso', 'Riprova'], ['Pulsante_Chiaro', 'Menu']], W / 2, y + mp.h * zz + 6, zz);
}

const SCENE: Record<string, (t: number) => void> = { partita: scenaPartita, doni: scenaDoni, pausa: scenaPausa, selezione: scenaSelezione, fine: scenaFine };

// ————— il telefono: canvas in pixel di gioco, ingrandito di un numero intero di pixel fisici —————
function adatta(): void {
  const sf = sfondi[stato.telefono]; if (!sf) return;
  W = sf.width; H = sf.height;
  if (schermo.width !== W || schermo.height !== H) { schermo.width = W; schermo.height = H; g.imageSmoothingEnabled = false; }
  const dpr = window.devicePixelRatio || 1;
  // se il telefono non ci sta accanto ai comandi, i comandi vanno sotto
  const banco = document.querySelector<HTMLElement>('.banco')!;
  banco.classList.toggle('largo', W / dpr > banco.clientWidth - 380);
  const box = schermo.parentElement!.getBoundingClientRect();
  const n = Math.max(1, Math.floor(Math.min((box.width * dpr) / W, ((window.innerHeight - 60) * dpr) / H)));
  schermo.style.width = `${(W * n) / dpr}px`; schermo.style.height = `${(H * n) / dpr}px`;
  document.getElementById('didascalia')!.textContent = `${W}×${H} pixel di gioco, come un iPhone ${stato.telefono} (scala ×2) · qui ingrandito ×${n / dpr === Math.round(n / dpr) ? n / dpr : (n / dpr).toFixed(2)}`;
}

function ciclo(t: number): void {
  if (sfondi[stato.telefono]) {
    adatta(); g.clearRect(0, 0, W, H);
    (SCENE[stato.schermata] ?? scenaPartita)(t);
    disegnaTacca();
  }
  requestAnimationFrame(ciclo);
}

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
  document.documentElement.style.setProperty('--accento', pg().colore);
}

function preparaComandi(): void {
  const scelta = document.getElementById('scelta-pg')!;
  for (const p of PERSONAGGI) {
    const bt = document.createElement('button'); bt.dataset.valore = p.id; bt.textContent = p.nome; bt.style.color = p.colore; scelta.append(bt);
  }
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
