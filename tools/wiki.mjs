// La wiki dei contenuti del gioco a stanze, da aprire con Obsidian (cartella wiki/).
//
// Come funziona: carica gli stessi file del gioco (src/data/, trascritti in una cartella temporanea come fa
// controlla-gdd) e scrive una scheda .md per ogni elemento: in cima lo sprite (animato, ricomposto dai fogli di
// public/assets/), sotto i numeri e i collegamenti alle altre schede. Le schede non si scrivono a mano: si rigenerano
// con «npm run wiki» (lo fa anche «npm run build»), quindi seguono sempre il codice.
//
// La cartella wiki/Appunti/ e le impostazioni di Obsidian (wiki/.obsidian/) non si toccano mai: lì Edoardo scrive le sue
// note. Tutto il resto della wiki lo cancella e lo riscrive questo script.
//
// Qui non ci sono numeri di bilanciamento: solo come si leggono i dati e come si impaginano.
// Uso: npm run wiki

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// su GitHub (build delle pagine e dell'APK) la wiki non serve: la si genera solo sul Mac
if (process.env.CI && !process.argv.includes('--anche-ci')) process.exit(0);

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIKI = path.join(radice, 'wiki');

// --- Carica i dati del gioco (come tools/controlla-gdd.mjs) ------------------------------------

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-'));
for (const f of fs.readdirSync(path.join(radice, 'src/data'))) {
  if (!f.endsWith('.ts')) continue;
  const js = ts.transpileModule(fs.readFileSync(path.join(radice, 'src/data', f), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  fs.writeFileSync(path.join(tmp, f.replace(/\.ts$/, '.js')), js);
}
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"commonjs"}');
const richiedi = createRequire(path.join(tmp, 'x.js'));
const D = (nome) => richiedi('./' + nome + '.js');

const P = D('personaggi'), AB = D('abilita'), DO = D('doni'), AS = D('armi-stanze'), US = D('unioni-stanze');
const MO = D('mosaici'), ST = D('stati'), SZ = D('stanze'), CA = D('campanaro'), SE = D('seth'), RA = D('rarita');
const RO = D('rompibili'), MA = D('mappa'), GL = D('glossario'), V = D('voti'), SO = D('sopravvivenza'), DOM = D('doni');
fs.rmSync(tmp, { recursive: true, force: true });

// --- Gli asset: elenco, PNG e animazioni -------------------------------------------------------

const ASSET = new Map();
for (const f of ['public/assets/elenco.json', 'public/assets/hud/elenco.json']) {
  const p = path.join(radice, f);
  if (!fs.existsSync(p)) continue;
  for (const a of JSON.parse(fs.readFileSync(p, 'utf8')).asset) ASSET.set(a.chiave, a);
}
// gli sprite si riscrivono da capo a ogni giro (le schede li scrivono mentre si preparano)
fs.rmSync(path.join(WIKI, '_sprite'), { recursive: true, force: true });
fs.mkdirSync(path.join(WIKI, '_sprite'), { recursive: true });

/** Legge un PNG a 8 bit (RGBA, RGB, scala di grigi o a palette) e lo restituisce in RGBA. */
function leggiPng(file) {
  const b = fs.readFileSync(file);
  let o = 8, w = 0, h = 0, tipo = 0, prof = 0, inter = 0, palette = null, trasp = null;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), nome = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (nome === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); prof = d[8]; tipo = d[9]; inter = d[12]; }
    else if (nome === 'PLTE') palette = d;
    else if (nome === 'tRNS') trasp = d;
    else if (nome === 'IDAT') idat.push(d);
    else if (nome === 'IEND') break;
    o += 12 + len;
  }
  if (prof !== 8 || inter !== 0) return null;
  const canali = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipo];
  const raw = zlib.inflateSync(Buffer.concat(idat)), riga = w * canali, px = Buffer.alloc(riga * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (riga + 1)], src = raw.subarray(y * (riga + 1) + 1, (y + 1) * (riga + 1));
    for (let x = 0; x < riga; x++) {
      const a = x >= canali ? px[y * riga + x - canali] : 0, su = y > 0 ? px[(y - 1) * riga + x] : 0;
      const c = x >= canali && y > 0 ? px[(y - 1) * riga + x - canali] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += su; else if (f === 3) v += (a + su) >> 1;
      else if (f === 4) { const p = a + su - c, pa = Math.abs(p - a), pb = Math.abs(p - su), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? su : c; }
      px[y * riga + x] = v & 255;
    }
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (tipo === 6) px.copy(rgba, i * 4, i * 4, i * 4 + 4);
    else if (tipo === 2) { rgba[i * 4] = px[i * 3]; rgba[i * 4 + 1] = px[i * 3 + 1]; rgba[i * 4 + 2] = px[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
    else if (tipo === 0) { rgba.fill(px[i], i * 4, i * 4 + 3); rgba[i * 4 + 3] = 255; }
    else if (tipo === 4) { rgba.fill(px[i * 2], i * 4, i * 4 + 3); rgba[i * 4 + 3] = px[i * 2 + 1]; }
    else if (tipo === 3) { const k = px[i]; palette.copy(rgba, i * 4, k * 3, k * 3 + 3); rgba[i * 4 + 3] = trasp && k < trasp.length ? trasp[k] : 255; }
  }
  return { w, h, px: rgba };
}

const crc = (buf) => zlib.crc32(buf);
function pezzo(nome, dati) {
  const l = Buffer.alloc(4); l.writeUInt32BE(dati.length);
  const nd = Buffer.concat([Buffer.from(nome, 'ascii'), dati]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(nd) >>> 0);
  return Buffer.concat([l, nd, c]);
}
const comprimi = (img) => {
  const riga = img.w * 4, raw = Buffer.alloc((riga + 1) * img.h);
  for (let y = 0; y < img.h; y++) img.px.copy(raw, y * (riga + 1) + 1, y * riga, (y + 1) * riga);
  return zlib.deflateSync(raw, { level: 9 });
};
/** Scrive un PNG, animato (APNG: Obsidian lo mostra in movimento) se i fotogrammi sono più di uno. */
function scriviPng(file, fotogrammi) {
  const { w, h } = fotogrammi[0].img;
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const parti = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pezzo('IHDR', ihdr)];
  if (fotogrammi.length > 1) {
    const ac = Buffer.alloc(8); ac.writeUInt32BE(fotogrammi.length, 0); ac.writeUInt32BE(0, 4);
    parti.push(pezzo('acTL', ac));
  }
  let seq = 0;
  fotogrammi.forEach((f, i) => {
    if (fotogrammi.length > 1) {
      const fc = Buffer.alloc(26);
      fc.writeUInt32BE(seq++, 0); fc.writeUInt32BE(w, 4); fc.writeUInt32BE(h, 8); fc.writeUInt32BE(0, 12); fc.writeUInt32BE(0, 16);
      fc.writeUInt16BE(Math.max(20, Math.round(f.durata)), 20); fc.writeUInt16BE(1000, 22); fc[24] = 1; fc[25] = 0;
      parti.push(pezzo('fcTL', fc));
    }
    const z = comprimi(f.img);
    if (i === 0) parti.push(pezzo('IDAT', z));
    else { const s = Buffer.alloc(4); s.writeUInt32BE(seq++); parti.push(pezzo('fdAT', Buffer.concat([s, z]))); }
  });
  parti.push(pezzo('IEND', Buffer.alloc(0)));
  fs.writeFileSync(file, Buffer.concat(parti));
}

const LATO_SPRITE = 160; // gli sprite piccoli si ingrandiscono di un fattore intero fino a circa questa misura
const MAX_FOTOGRAMMI = 48;
const spriteFatti = new Map(); // chiave → nome del file nella wiki (o null se manca)

/**
 * Ricompone lo sprite «chiave» dal foglio di Aseprite: l'animazione con il primo tag trovato in «tag» (se non ce n'è
 * nessuno, tutti i fotogrammi), ritagliata sul disegno e ingrandita a pixel interi. Restituisce il nome del file o null.
 */
function sprite(chiave, tag = ['idle', 'walk'], fermo = false) {
  const id = chiave + (fermo ? '_fermo' : '');
  if (spriteFatti.has(id)) return spriteFatti.get(id);
  const a = ASSET.get(chiave);
  let nome = null;
  try {
    if (a) {
      const img = leggiPng(path.join(radice, 'public', a.immagine));
      const dati = JSON.parse(fs.readFileSync(path.join(radice, 'public', a.dati), 'utf8'));
      const tutti = Array.isArray(dati.frames) ? dati.frames : Object.values(dati.frames);
      const tags = dati.meta?.frameTags ?? [];
      const t = tag.map((n) => tags.find((x) => x.name === n)).find(Boolean);
      let scelti = t ? tutti.slice(t.from, t.to + 1) : tutti;
      if (fermo) scelti = scelti.slice(0, 1);
      scelti = scelti.slice(0, MAX_FOTOGRAMMI);
      if (img && scelti.length) {
        const { w: W, h: H } = scelti[0].sourceSize;
        // il riquadro comune a tutti i fotogrammi (per togliere il vuoto intorno al disegno)
        let x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (const f of scelti) {
          x0 = Math.min(x0, f.spriteSourceSize.x); y0 = Math.min(y0, f.spriteSourceSize.y);
          x1 = Math.max(x1, f.spriteSourceSize.x + f.frame.w); y1 = Math.max(y1, f.spriteSourceSize.y + f.frame.h);
        }
        const w = x1 - x0, h = y1 - y0, k = Math.max(1, Math.min(8, Math.floor(LATO_SPRITE / Math.max(w, h))));
        const fotogrammi = scelti.map((f) => {
          const out = Buffer.alloc(w * k * h * k * 4);
          for (let y = 0; y < f.frame.h; y++) for (let x = 0; x < f.frame.w; x++) {
            const s = ((f.frame.y + y) * img.w + f.frame.x + x) * 4;
            if (!img.px[s + 3]) continue;
            const dx = (f.spriteSourceSize.x - x0 + x) * k, dy = (f.spriteSourceSize.y - y0 + y) * k;
            for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) img.px.copy(out, ((dy + yy) * w * k + dx + xx) * 4, s, s + 4);
          }
          return { img: { w: w * k, h: h * k, px: out }, durata: f.duration ?? 100 };
        });
        nome = id + '.png';
        scriviPng(path.join(WIKI, '_sprite', nome), fotogrammi);
      }
    }
  } catch (e) {
    console.warn(`  sprite ${chiave}: non ricomposto (${e.message})`);
    nome = null;
  }
  spriteFatti.set(id, nome);
  return nome;
}

/** Stato del disegno: vero (V1 o più), segnaposto (V0) o mancante. Le righe vanno anche nell'elenco «Sprite da fare». */
const DA_FARE = [];
function statoSprite(chiave, scheda, cosa) {
  const a = ASSET.get(chiave);
  if (!a) { DA_FARE.push({ scheda, cosa, chiave, stato: 'manca' }); return `\`${chiave}\`: **manca** (oggi lo disegna il codice o non c'è)`; }
  if (!a.versioneFile) { DA_FARE.push({ scheda, cosa, chiave, stato: 'segnaposto V0' }); return `\`${chiave}\`: segnaposto (V0)`; }
  return `\`${chiave}\`: V${a.versioneFile}${a.tag?.length ? ` · animazioni: ${a.tag.join(', ')}` : ''}`;
}

// --- Strumenti di scrittura --------------------------------------------------------------------

const num = (v) => (typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : String(v));
const pc = (v) => `${num(Math.round(v * 1000) / 10)}%`;
const segno = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v));
const mod = (v, dopo = '') => (v ? `${segno(v)}%${dopo}` : '—'); // un modificatore del personaggio: «—» se non c'è
const L = (dest, testo) => (testo && testo !== dest ? `[[${dest}|${testo}]]` : `[[${dest}]]`);
const LT = (dest, testo) => (testo && testo !== dest ? `[[${dest}\\|${testo}]]` : `[[${dest}]]`); // dentro le tabelle
const NOMI_AFF = { luce: 'Luce', sacro: 'Sacro', ombra: 'Ombra', terra: 'Terra' };
const NOMI_GRADO = Object.fromEntries(Object.entries(RA.GRADI).map(([k, g]) => [k, g.nome]));

const schede = []; // { cartella, nome, testo }
function scheda(cartella, nome, { tipo, tag = [], alias = [], immagini = [], citazione, righe = [], corpo = '' }) {
  const fm = ['---', `tipo: ${tipo}`, `tags: [${[tipo, ...tag].map((t) => String(t).toLowerCase().replace(/[^a-zà-ù0-9]+/gi, '-')).join(', ')}]`];
  if (alias.length) fm.push(`aliases: [${alias.map((a) => JSON.stringify(a)).join(', ')}]`);
  fm.push('---', '');
  const imm = immagini.filter(Boolean).map((i) => `![[${i}]]`).join(' ');
  const tab = righe.length ? ['| | |', '|---|---|', ...righe.map(([k, v]) => `| **${k}** | ${v} |`)].join('\n') : '';
  const testo = [fm.join('\n'), `# ${nome}`, imm, citazione ? `> ${citazione}` : '', tab, corpo].filter(Boolean).join('\n\n') + '\n';
  schede.push({ cartella, nome, testo, tipo });
}

// Le parole chiave che si collegano da sole dentro i testi (la prima volta che compaiono in una scheda).
const PAROLE = [
  [/schivat[ae] perfett[ae]/i, 'Grazia'], [/\bGrazia\b/, 'Grazia'], [/\bQuiete\b/i, 'Quiete'], [/colp[oi] critic[oi]/i, 'Colpo critico'],
  [/\bcritico\b/i, 'Colpo critico'], [/\bfiaschetta\b/i, 'Fiaschetta'], [/\bsors[oi]\b/i, 'Fiaschetta'],
  [/\bmaledett[oaie]\b|\bmaledic\w*/i, 'Maledetto'], [/\babbagliat[oaie]\b|\babbagli\w*/i, 'Abbagliato'], [/\bconsacr\w+/i, 'Consacrato'],
  [/\bsepolt[oaie]\b|\bseppellisce\b/i, 'Sepolto'], [/\binterrat[oaie]\b/i, 'Interramento'], [/\bRicadut[oi]\b/i, 'Ricaduto'],
  [/\bCantor[ei]\b/, 'Cantore'], [/\bcapi\b/i, 'Capi'], [/\bEcho\b|\bEch[oi]\b/, 'Echi'], [/\bFendente\b/, 'Lanterna'],
  [/\breazion[ei]\b/i, 'Reazioni'], [/\bricarica\b/i, 'Glossario#Ricarica'], [/\barea\b/i, 'Glossario#Area'],
  [/\bsalute\b/i, 'Glossario#Salute'], [/\bpozz[ae]\b/i, 'Acqua santa'], [/\bcero\b|\bceri\b/i, 'Ultimo cero'],
  [/\bCera\b/, 'Cera'], [/\bcarica\b/, 'Glossario#Carica'], [/\bciech?[oi]\b|\bcecità\b/i, 'Abbacinio'],
];
function collega(testo, se) {
  const fatte = new Set([se]);
  let out = testo;
  for (const [re, dest] of PAROLE) {
    if (fatte.has(dest)) continue;
    const m = out.match(re);
    if (!m) continue;
    // niente link dentro un link già messo
    const i = m.index, prima = out.slice(0, i);
    if ((prima.match(/\[\[/g) || []).length > (prima.match(/\]\]/g) || []).length) continue;
    out = prima + `[[${dest}|${m[0]}]]` + out.slice(i + m[0].length);
    fatte.add(dest);
  }
  return out;
}

// --- Indici per i collegamenti -----------------------------------------------------------------

const ECHI = AS.ECHI_STANZE;
const LANTERNA = AS.LANTERNA_STANZE;
const ARMI = [LANTERNA, ...ECHI];
const nomeArma = (id) => ARMI.find((a) => a.id === id)?.nome ?? id;
const DONI_STANZE = DO.PASSIVI.filter((d) => SZ.PERCORSO.doniAttivi.includes(d.id) || d.soloStanze);
const nomeDono = (id) => DO.PASSIVI.find((d) => d.id === id)?.nome ?? id;
const unionePerArma = (id) => US.UNIONI_STANZE.find((u) => u.arma === id);
const unionePerDono = (id) => US.UNIONI_STANZE.find((u) => u.dono === id);
const mosaicoPerDono = (id) => MO.MOSAICI_STANZE.find((m) => m.dono === id);
const affinitaArma = (id) => ST.AFFINITA_ARMI[id];
const STATO_AFF = { luce: 'Abbagliato', sacro: 'Consacrato', ombra: 'Maledetto', terra: 'Sepolto' };
const PERS_AFF = { luce: 'Il Lampionaio', terra: 'Il Becchino', sacro: 'La Badessa', ombra: 'La Strega' };

// --- Personaggi --------------------------------------------------------------------------------

for (const p of P.PERSONAGGI) {
  const nelleStanze = p.id === 'lampionaio';
  const voto = V.VOTI[p.id];
  const aff = ST.AFFINITA_ABILITA[p.abilita];
  const abil = AB.ABILITA[p.abilita];
  const righe = [
    ['Motto', `*${p.motto}*`],
    ['Colore guida', `\`${p.colore}\``],
    ['Nel gioco a stanze', nelleStanze ? 'sì, giocabile' : '**non ancora** (oggi solo nel survivor)'],
    ['Arma iniziale', nelleStanze ? L('Lanterna') : `${p.armaIniziale} (non ancora nelle stanze)`],
    ['Abilità', nelleStanze ? L(abil.nome) : `${abil.nome} (non ancora nelle stanze)`],
    ['Affinità', L(NOMI_AFF[aff])],
    ['Voto', `${voto.nome}: ${voto.testo} *(non ancora nel gioco a stanze)*`],
    ['Salute', num(P.BASE.salute + p.salute)],
    ['Velocità', `${num(Math.round(P.BASE.velocita * (1 + p.velocita)))} px/s${p.velocita ? ` (${mod(Math.round(p.velocita * 100))})` : ''}`],
    ['Danno', mod(Math.round(p.danno * 100))],
    ['Ricarica', mod(-Math.round(p.ricarica * 100))],
    ['Area', mod(Math.round(p.area * 100))],
    ['Armatura', mod(-Math.round(p.armatura * 100), ' danno subito')],
    ['Rigenerazione', `${num(p.rigenerazione)} salute al secondo`],
    ['Barre (su 6)', `Vitalità ${p.barre[0]} · Danno ${p.barre[1]} · Velocità ${p.barre[2]} · Raggio ${p.barre[3]} · Controllo ${p.barre[4]}`],
  ];
  if (nelleStanze) righe.push(['Quiete', `${num(SZ.COMBATTIMENTO_STANZA.quiete)} s senza danni dopo un colpo (${L('Quiete')})`]);
  scheda('Personaggi', p.nome, {
    tipo: 'Personaggio', tag: [NOMI_AFF[aff], nelleStanze ? 'giocabile' : 'in-arrivo'],
    immagini: [sprite(p.sprite, ['idle', 'walk']), sprite(p.ritratto, ['idle'], true)],
    citazione: p.citazione,
    righe,
    corpo: `## Biografia\n\n${p.biografia}\n\n## Sprite\n\n- In gioco: ${statoSprite(p.sprite, p.nome, 'sprite in gioco')}\n- Ritratto: ${statoSprite(p.ritratto, p.nome, 'ritratto')}`,
  });
}

// --- Armi: tabelle dei livelli -----------------------------------------------------------------

function tabellaLivelli(arma) {
  const livelli = arma.livelli;
  const campi = Object.keys(GL.CAMPI_GLOSSARIO).filter((k) => k !== 'danno' && livelli.some((l) => typeof l[k] === 'number'))
    // un campo che non cambia mai e vale 0 (per esempio la ricarica 99 dell'Abbacinio) non dice niente
    .filter((k) => !(livelli.every((l) => l[k] === livelli[0][k]) && (livelli[0][k] === 0 || livelli[0][k] >= 99)));
  const haDanno = livelli.some((l) => l.danno > 0);
  const testa = ['Liv', ...(haDanno ? [LT('Glossario#Danno', 'Danno')] : []), ...campi.map((k) => {
    const n = GL.nomeCampo(k, livelli[0]); return LT('Glossario#' + n, n) + (GL.CAMPI_GLOSSARIO[k].unita ? ` (${GL.CAMPI_GLOSSARIO[k].unita.trim()})` : '');
  }), 'Cosa cambia'];
  const righe = livelli.map((l, i) => [
    `**${i + 1}**${l.potenziale ? ' ★' : ''}`,
    ...(haDanno ? [l.dannoMassimo != null && l.dannoMassimo !== l.danno ? `${num(l.danno)}–${num(l.dannoMassimo)}` : num(l.danno)] : []),
    ...campi.map((k) => (typeof l[k] === 'number' ? num(l[k]) : '')),
    collega(l.testo ?? '', arma.nome).replace(/\|/g, '\\|'),
  ]);
  return [`| ${testa.join(' | ')} |`, `|${testa.map(() => '---').join('|')}|`, ...righe.map((r) => `| ${r.join(' | ')} |`)].join('\n');
}

function numeriAltri(oggetto, salta) {
  const r = Object.entries(oggetto).filter(([k, v]) => !salta.includes(k) && (typeof v === 'number' || typeof v === 'boolean'));
  return r.length ? r.map(([k, v]) => `\`${k}\` ${typeof v === 'boolean' ? (v ? 'sì' : 'no') : num(v)}`).join(' · ') : '';
}

function schedaArma(arma, cartella, tipo) {
  const aff = affinitaArma(arma.id);
  const u = unionePerArma(arma.id);
  const grado = RA.gradoDi(arma.id);
  const potenziale = AS.POTENZIALI[arma.id];
  const righe = [
    ['Tipo', tipo === 'Arma' ? `arma iniziale del ${L('Il Lampionaio')} (attacco a tasto)` : `${L('Echi', 'Eco')}: colpisce da solo`],
    ['Affinità', `${L(NOMI_AFF[aff])}: lascia ${L(STATO_AFF[aff])}`],
    ['Grado', `${L(NOMI_GRADO[grado])}`],
    ['Livelli', `${arma.livelli.length} (il 5 è il potenziale ★)`],
  ];
  if (u) righe.push(['Unione', `${L(u.nome)}, con ${L(nomeDono(u.dono))} al massimo e l'arma al livello ${US.LIVELLO_ARMA_UNIONE_STANZE}`]);
  if (arma.id === 'lamaDiLuce') righe.push(['Nome nel survivor', 'Lama di luce']);
  let corpo = `## Livelli\n\n${tabellaLivelli(arma)}`;
  if (potenziale && Object.keys(potenziale).length) corpo += `\n\n## Numeri del potenziale\n\n${numeriAltri(potenziale, [])}`;
  const altri = numeriAltri(arma, ['id', 'nome', 'icona', 'effetto', 'livelli']);
  if (altri) corpo += `\n\n## Altri numeri dell'arma\n\nNomi come nel codice (\`src/data/armi.ts\`): ${altri}`;
  if (arma.id === 'rosarioSpezzato') corpo += `\n\n## Volo del grano\n\n${numeriAltri(AS.ROSARIO_VOLO, [])}`;
  corpo += `\n\n## Sprite\n\n- Icona: ${statoSprite(arma.icona, arma.nome, 'icona')}\n- Effetto: ${statoSprite(arma.effetto, arma.nome, 'effetto')}`;
  scheda(cartella, arma.nome, {
    tipo, tag: [NOMI_AFF[aff], NOMI_GRADO[grado]], alias: arma.id === 'lamaDiLuce' ? ['Lama di luce'] : [],
    immagini: [sprite(arma.icona, ['idle']), sprite(arma.effetto, ['idle'])],
    citazione: collega(arma.livelli[0].testo, arma.nome), righe, corpo,
  });
}
schedaArma(LANTERNA, 'Armi', 'Arma');
for (const e of ECHI) schedaArma(e, 'Echi', 'Eco');

// --- Doni --------------------------------------------------------------------------------------

// come si legge il numero di ogni dono (solo le parole: i numeri vengono dai dati)
const UNITA_DONI = {
  cuoreDiCera: (v) => `+${num(v)} salute massima`, saleNero: (v) => `+${pc(v)} danno`, stoppinoLungo: (v) => `+${pc(v)} area`,
  aliDiFalena: (v) => `+${pc(v)} velocità`, erbeAmare: (v) => `+${num(v)} salute al secondo`, scudoDiFerro: (v) => `−${pc(v)} danno subito`,
  ceraVotiva: (v) => `+${pc(v)} durata di zone e stati`, chiodoDiBara: (v) => `+${pc(v)} probabilità di colpo critico`,
  lacrimaDiLumen: (v) => `+${num(v)} sorsi`, campanellaDArgento: (v) => `+${num(v)} s per la schivata perfetta`,
  fiammaCustodita: (v) => `+${pc(v)} danno ai nemici entro ${MO.DONI_MOSAICI.fiamma.raggio} px`, ultimoCero: (v) => `fino a ${num(v)} ceri (+${pc(MO.DONI_MOSAICI.cero.danno)} danno ciascuno)`,
  braceNelPetto: (v) => `${num(v)} danni ogni ${num(MO.DONI_MOSAICI.brace.ogni)} s`, manoTesa: (v) => `cura ${num(v)} salute a ogni schivata perfetta`,
  coronaIncrinata: (v) => `+${pc(v)} danno ai capi (+${pc(MO.DONI_MOSAICI.corona.subito)} danno subito da loro)`,
};
function effettoLeggibile(d, l) {
  if (d.id === 'clessidra') return `ricarica × ${num(Math.round(DO.ricaricaDono(d, l) * 1000) / 1000)} (−${pc(1 - DO.ricaricaDono(d, l))})`;
  const v = Math.round(DO.effettoDono(d, l) * 10000) / 10000;
  return UNITA_DONI[d.id] ? UNITA_DONI[d.id](v) : num(v);
}

for (const d of DONI_STANZE) {
  const u = unionePerDono(d.id), m = mosaicoPerDono(d.id), grado = RA.gradoDi(d.id);
  const righe = [['Grado', L(NOMI_GRADO[grado])], ['Livelli', String(d.massimo)], ['Al massimo', effettoLeggibile(d, d.massimo)]];
  if (m) righe.push(['Si sblocca', `completando il mosaico ${L(m.nome)} la prima volta`]);
  else righe.push(['Si sblocca', 'disponibile da subito']);
  if (u) righe.push(['Unione', `${L(u.nome)}, con ${L(nomeArma(u.arma))}`]);
  let corpo = '';
  if (d.id === 'specchio') {
    corpo += `## Livelli nel gioco a stanze\n\n| Liv | Colpi in più | Danno dei colpi in più | Carta |\n|---|---|---|---|\n` +
      DO.SPECCHIO_STANZE.righe.map((r, i) => `| ${i + 1} | +${DO.SPECCHIO_STANZE.colpi[i]} | ${pc(DO.SPECCHIO_STANZE.danno[i])} | ${r} |`).join('\n');
  } else {
    corpo += `## Livelli\n\n| Liv | Effetto |\n|---|---|\n` + Array.from({ length: d.massimo }, (_, i) => {
      return `| ${i + 1} | ${effettoLeggibile(d, i + 1)} |`;
    }).join('\n');
  }
  const extra = { fiammaCustodita: MO.DONI_MOSAICI.fiamma, ultimoCero: MO.DONI_MOSAICI.cero, braceNelPetto: MO.DONI_MOSAICI.brace, coronaIncrinata: MO.DONI_MOSAICI.corona }[d.id];
  if (extra) corpo += `\n\n## Altri numeri\n\n${numeriAltri(extra, [])}`;
  corpo += `\n\n## Sprite\n\n- Icona: ${statoSprite(d.icona, d.nome, 'icona')}`;
  scheda('Doni', d.nome, {
    tipo: 'Dono', tag: [NOMI_GRADO[grado], m ? 'mosaico' : 'base'],
    immagini: [sprite(d.icona, ['idle'])], citazione: collega(d.id === 'specchio' ? DO.SPECCHIO_STANZE.righe[0] : d.testo, d.nome), righe, corpo,
  });
}

// --- Unioni ------------------------------------------------------------------------------------

for (const u of US.UNIONI_STANZE) {
  const arma = ARMI.find((a) => a.id === u.arma);
  scheda('Unioni', u.nome, {
    tipo: 'Unione', tag: [NOMI_AFF[affinitaArma(u.arma)]],
    immagini: [arma && sprite(arma.icona, ['idle']), sprite(DO.PASSIVI.find((d) => d.id === u.dono)?.icona, ['idle'])],
    citazione: collega(u.testo, u.nome),
    righe: [
      ['Arma', `${L(nomeArma(u.arma))} al livello ${US.LIVELLO_ARMA_UNIONE_STANZE} o più`],
      ['Dono', `${L(nomeDono(u.dono))} al massimo`],
      ['Come arriva', 'la prima stanza ripulita dopo offre la carta Unione in più (anche il forziere del tesoro); se non la prendi ricompare alla stanza dopo'],
    ],
    corpo: `## Sprite\n\n- Icona: ${statoSprite('Icona_Unione_' + u.id, u.nome, 'icona dell\'Unione')}`,
  });
}

// --- Abilità -----------------------------------------------------------------------------------

{
  const a = AB.ABILITA.cerchioDiLuce, s = SZ.ABILITA_STANZA;
  scheda('Abilità', a.nome, {
    tipo: 'Abilità', tag: ['Luce'],
    immagini: [sprite(a.icona, ['idle']), sprite(a.effetto, ['idle'])],
    citazione: 'Un grande colpo quando si accende, poi il cerchio rallenta e abbaglia.',
    righe: [
      ['Di chi', L('Il Lampionaio')],
      ['Affinità', `${L('Luce')}: lascia ${L('Abbagliato')}`],
      ['Si carica', `con ${s.colpi} colpi della ${L('Lanterna')} a segno (un colpo conta 1 anche se prende più nemici)`],
      ['Colpo all\'accensione', `${num(s.colpo.danno)}–${num(s.colpo.dannoMassimo)} danno`],
      ['Abbaglio', `ogni ${num(s.ritmo)} s`],
      ['Durata', `${num(a.durata)} s`],
      [L('Glossario#Area', 'Area'), `${num(a.raggio)} px, segue il personaggio`],
      ['Rallenta', pc(a.rallenta)],
    ],
    corpo: `## Sprite\n\n- Icona: ${statoSprite(a.icona, a.nome, 'icona')}\n- Effetto: ${statoSprite(a.effetto, a.nome, 'effetto')}`,
  });
}

// --- Affinità, stati, reazioni -----------------------------------------------------------------

const MEDAGLIONE = { luce: 'Porta_Luce', sacro: 'Porta_Sacro', ombra: 'Porta_Ombra', terra: 'Porta_Terra' };
for (const [id, nome] of Object.entries(NOMI_AFF)) {
  const echi = ECHI.filter((e) => affinitaArma(e.id) === id);
  const armi = (id === 'luce' ? [LANTERNA, ...echi] : echi).map((a) => L(a.nome)).join(', ');
  scheda('Affinità', nome, {
    tipo: 'Affinità', immagini: [sprite(MEDAGLIONE[id], ['idle'])],
    righe: [
      ['Stato', L(STATO_AFF[id])],
      ['Personaggio', L(PERS_AFF[id])],
      ['Armi', armi || '—'],
      ['Stanza', `una stanza della ${L('Stanza d\'affinità', 'porta ' + nome)} dà Echi nuovi e livelli di questa affinità${id === 'luce' ? ', più i livelli della Lanterna' : ''}`],
    ],
    corpo: `## Reazioni\n\nDue stati diversi sullo stesso nemico si consumano e fanno una ${L('Reazioni', 'reazione')}.\n\n## Sprite\n\n- Medaglione della porta: ${statoSprite(MEDAGLIONE[id], nome, 'medaglione della porta')}`,
  });
}

const S = ST.STATI;
const STATI_SCHEDE = [
  { nome: 'Abbagliato', aff: 'luce', simbolo: 'Simbolo_Abbagliato', testo: `subisce ${pc(S.abbagliato.danno)} di danno in più`, dev: ST.DEVOZIONE.abbagliato.map(pc) },
  { nome: 'Consacrato', aff: 'sacro', simbolo: 'Simbolo_Consacrato', testo: `va più lento del ${pc(S.consacrato.lento)}`, dev: ST.DEVOZIONE.consacrato.map(pc) },
  { nome: 'Maledetto', aff: 'ombra', simbolo: 'Simbolo_Maledetto', testo: `perde il ${pc(S.maledetto.perSecondo)} della salute massima al secondo`, dev: ST.DEVOZIONE.maledetto.map(pc) },
  { nome: 'Sepolto', aff: 'terra', simbolo: 'Simbolo_Sepolto', testo: `resta fermo ${num(S.sepolto.fermo)} s, poi per ${num(S.sepolto.pausa)} s non può esserlo di nuovo`, dev: ST.DEVOZIONE.sepolto.map((v) => num(v) + ' s') },
];
const REAZ = [
  { nome: 'Eclissi', stati: ['luce', 'ombra'], testo: `esplosione intorno al nemico: ${pc(ST.REAZIONI.eclissi.parte)} della sua salute massima (tetto ${ST.REAZIONI.eclissi.tetto}), area ${ST.REAZIONI.eclissi.raggio} px`, sprite: 'Pixelfx_Eclissi' },
  { nome: 'Rivelazione', stati: ['luce', 'sacro'], testo: `il nemico lascia ${ST.REAZIONI.rivelazione.anime} volte le anime` },
  { nome: 'Esorcismo', stati: ['sacro', 'ombra'], testo: `dal nemico partono ${ST.REAZIONI.esorcismo.fiammelle} fiammelle che inseguono i vicini, ${ST.REAZIONI.esorcismo.danno} danno ciascuna` },
  { nome: 'Interramento', stati: ['terra', '*'], testo: `fermo ${num(ST.REAZIONI.interramento.fermo)} s e subisce ${pc(ST.REAZIONI.interramento.danno)} di danno in più` },
];
for (const s of STATI_SCHEDE) {
  const reaz = REAZ.filter((r) => r.stati.includes(s.aff) || (r.stati.includes('*') && s.aff !== 'terra'));
  scheda('Stati', s.nome, {
    tipo: 'Stato', tag: [NOMI_AFF[s.aff]], immagini: [sprite(s.simbolo, ['idle'])],
    citazione: `Il nemico ${s.testo}.`,
    righe: [
      ['Affinità', L(NOMI_AFF[s.aff])],
      ['Dura', s.nome === 'Sepolto' ? '(vedi sopra)' : `${num(S.durata)} s`],
      ['Devozione', `con 1 / 2 / 3+ armi di ${NOMI_AFF[s.aff]}: ${s.dev.join(' / ')}`],
      ['Reazioni', reaz.map((r) => L(r.nome)).join(', ')],
    ],
    corpo: `## Sprite\n\n- Simbolo sopra la testa: ${statoSprite(s.simbolo, s.nome, 'simbolo dello stato')}`,
  });
}
for (const r of REAZ) {
  const quali = r.stati.map((a) => (a === '*' ? 'qualsiasi altro stato' : L(STATO_AFF[a]))).join(' + ');
  scheda('Reazioni', r.nome, {
    tipo: 'Reazione', immagini: [r.sprite && sprite(r.sprite)],
    citazione: collega(r.testo.charAt(0).toUpperCase() + r.testo.slice(1) + '.', r.nome),
    righe: [['Stati', quali], ['Quiete', `dopo una reazione il nemico non reagisce di nuovo per ${num(ST.STATI_CERTI.quiete)} s (${L('Quiete')})`]],
  });
}
scheda('Reazioni', 'Reazioni', {
  tipo: 'Indice', citazione: 'Due stati diversi sullo stesso nemico si consumano e fanno una reazione.',
  corpo: REAZ.map((r) => `- ${L(r.nome)}: ${r.stati.map((a) => (a === '*' ? 'qualsiasi' : STATO_AFF[a])).join(' + ')}`).join('\n'),
});

// --- Nemici ------------------------------------------------------------------------------------

{
  const R = SZ.NEMICI_STANZA.ricaduto, C = SZ.NEMICI_STANZA.cantore, N = SZ.NEMICI_STANZA;
  scheda('Nemici', 'Ricaduto', {
    tipo: 'Nemico', tag: ['base', 'corpo-a-corpo'], immagini: [sprite(R.sprite, ['walk'])],
    citazione: 'Cammina dritto e lento verso di te; vicino si ferma, prepara il graffio e graffia davanti a sé.',
    righe: [
      ['Salute', num(R.salute)], ['Velocità', `${num(R.velocita)} px/s`], ['Corpo', `${num(R.raggio)} px`], ['Contatto', `${num(R.contatto)} danno a chi lo tocca`],
      ['Graffio', `${num(R.graffio.danno)} danno, spicchio di ${num(R.graffio.ampiezza)}° e ${num(R.graffio.raggio)} px`],
      ['Avviso', `si ferma a ${num(R.portata)} px, ${L('Glossario#Carica', 'carica')} di ${num(R.avviso)} s (spicchio rosso a terra)`],
      ['Recupero', `${num(R.recupero)} s`],
      ['Si rialza', `${pc(R.rinascita.probabilita)} delle volte, dopo ${num(R.rinascita.attesa)} s a terra, con il ${pc(R.rinascita.salute)} della salute (una volta sola)`],
      ['Difesa', `${L('Grazia')}: uscire dallo spicchio all'ultimo`],
    ],
    corpo: `Vedi anche: ${L('Brace nel petto')} (i Ricaduti a terra bruciano), ${L('Il Campanaro')} (la Chiamata li fa comparire).\n\n## Sprite\n\n- ${statoSprite(R.sprite, 'Ricaduto', 'sprite')}`,
  });
  scheda('Nemici', 'Cantore', {
    tipo: 'Nemico', tag: ['base', 'a-distanza'], immagini: [sprite(C.sprite, ['walk']), sprite(N.effetti.grumo), sprite(N.effetti.pozza)],
    citazione: 'Resta a distanza; si ferma, a terra compare una linea verso di te, poi lancia un grumo di Lumen spento che ti cerca.',
    righe: [
      ['Salute', num(C.salute)], ['Velocità', `${num(C.velocita)} px/s`], ['Corpo', `${num(C.raggio)} px`], ['Contatto', `${num(C.contatto)} danno a chi lo tocca`],
      ['Distanza', `tra ${num(C.distanza.minima)} e ${num(C.distanza.massima)} px; canta entro ${num(C.portata)} px`],
      ['Avviso', `${num(C.avviso)} s (linea arancione a terra)`], ['Ricarica', `${num(C.ricarica)} s tra un canto e l'altro`],
      ['Grumo', `${num(C.grumo.danno)} danno, ${num(C.grumo.velocita)} px/s, ti cerca per ${num(C.grumo.ricerca)} s (virata ${num(C.grumo.virata)}°/s)`],
      ['Pozza di cera', `${num(N.pozza.danno)} danno, dura ${num(N.pozza.durata)} s, raggio ${num(N.pozza.raggio)} px`],
      ['Difesa', `${L('Grazia')}: farsi sfiorare dal grumo entro ${num(SZ.GRAZIA_STANZA.sfioro)} px`],
    ],
    corpo: `## Sprite\n\n- ${statoSprite(C.sprite, 'Cantore', 'sprite')}\n- Grumo: ${statoSprite(N.effetti.grumo, 'Cantore', 'grumo')}\n- Pozza: ${statoSprite(N.effetti.pozza, 'Cantore', 'pozza')}`,
  });
  const K = CA.CAMPANARO;
  scheda('Nemici', K.nome, {
    tipo: 'Mini-boss', tag: ['capo', 'mondo-1'], immagini: [sprite(K.sprite, ['walk'])],
    citazione: 'Custode della cripta, con la sua campana. Sotto metà salute aggiunge la Chiamata e attacca più in fretta.',
    righe: [
      ['Dove', `la ${L('Mappa del Mondo', 'stanza doppia')} a metà strada tra ingresso e Boss`],
      ['Salute', num(K.salute)], ['Velocità', `${num(K.velocita)} px/s`], ['Corpo', `${num(K.raggio)} px`], ['Contatto', `${num(K.contatto)} danno a chi lo tocca`],
      ['Rintocco', `disco di ${num(K.rintocco.raggio)} px, avviso ${num(K.rintocco.avviso)} s, ${num(K.rintocco.danno)} danno`],
      ['Anello (fase 2)', `fino a ${num(K.anello.raggio)} px, avviso ${num(K.anello.avviso)} s, ${num(K.anello.danno)} danno`],
      ['Carica', `linea larga ${num(K.carica.larghezza)} px, avviso ${num(K.carica.avviso)} s, ${num(K.carica.danno)} danno; contro il muro resta stordito ${num(K.carica.stordito)} s`],
      ['Chiamata (fase 2)', `fa comparire ${K.chiamata.ricaduti} ${L('Ricaduto', 'Ricaduti')}, un attacco su ${K.chiamata.ogni}`],
      ['Fase 2', `sotto il ${pc(K.fase2.soglia)} della salute: pause e avvisi al ${pc(K.fase2.ritmo)}`],
      ['Premio', `${K.premio.sorsi} sorso di ${L('Fiaschetta')}, ${K.premio.cera} ${L('Cera')} e le carte della porta scelta`],
    ],
    corpo: `## Sprite\n\n- ${statoSprite(K.sprite, K.nome, 'sprite')}`,
  });
  const Z = SE.SETH;
  scheda('Nemici', Z.nome, {
    tipo: 'Boss', tag: ['capo', 'mondo-1'], alias: ['Seth'], immagini: [sprite(Z.sprite, ['walk'])],
    citazione: 'Il Boss del Mondo 1. Battuto, il Mondo è completato.',
    righe: [
      ['Dove', `la ${L('Stanza del Boss')}`],
      ['Salute', num(Z.salute)], ['Velocità', `${num(Z.velocita)} px/s`], ['Corpo', `${num(Z.raggio)} px`], ['Contatto', `${num(Z.contatto)} danno a chi lo tocca`],
      ['Falciata', `spicchio di ${num(Z.falciata.ampiezza)}° e ${num(Z.falciata.raggio)} px, avviso ${num(Z.falciata.avviso)} s, ${num(Z.falciata.danno)} danno`],
      ['Falci spettrali', `${Z.falci.quante} falci a ventaglio di ${num(Z.falci.ventaglio)}°, avviso ${num(Z.falci.avviso)} s, ${num(Z.falci.danno)} danno ciascuna`],
      ['Passo della Morte', `un attacco su ${Z.passoOgni}: cerchio di ${num(Z.passo.raggio)} px sotto di te, avviso ${num(Z.passo.avviso)} s, ${num(Z.passo.danno)} danno`],
      ['Detriti (fase 2)', `${Z.detriti.quanti} detriti a raggiera, ${num(Z.detriti.danno)} danno ciascuno`],
      ['Fase 2', `sotto il ${pc(Z.fase2.soglia)} della salute: pause e avvisi al ${pc(Z.fase2.ritmo)}`],
      ['Resiste', `stati di Terra a metà durata, maledizione a un decimo (${L('Sepolto')}, ${L('Maledetto')})`],
      ['Premio', `${Z.premio.cera} ${L('Cera')}`],
    ],
    corpo: `## Sprite\n\n- ${statoSprite(Z.sprite, Z.nome, 'sprite')} (mancano ancora attack e death)`,
  });
  scheda('Nemici', 'Capi', {
    tipo: 'Indice', citazione: 'Nei testi del gioco i boss si chiamano «capi».',
    corpo: `- ${L(K.nome)} (mini-boss)\n- ${L(Z.nome)} (Boss)\n\nDoni che li riguardano: ${L('Corona incrinata')}.`,
  });
}

// --- Mosaici -----------------------------------------------------------------------------------

MO.MOSAICI_STANZE.forEach((m, i) => {
  const arte = ASSET.has(m.arte) ? m.arte : MO.MOSAICI_STANZE[0].arte;
  scheda('Mosaici', m.nome, {
    tipo: 'Mosaico', tag: ['mondo-1'], immagini: [sprite(arte, ['idle'], true)],
    citazione: m.epitaffio,
    righe: [
      ['Ordine', `${i + 1} di ${MO.MOSAICI_STANZE.length} nel Mondo 1`],
      ['Soggetto', m.soggetto],
      ['Dono sbloccato', L(nomeDono(m.dono))],
      ['Si completa', `con ${RO.FRAMMENTI.perReliquiario} ${L('Frammento', 'frammenti')} dalle ${L('Urna', 'urne')}`],
      ['Prima', i ? L(MO.MOSAICI_STANZE[i - 1].nome) : '—'],
      ['Dopo', MO.MOSAICI_STANZE[i + 1] ? L(MO.MOSAICI_STANZE[i + 1].nome) : '—'],
    ],
    corpo: `## Sprite\n\n- ${statoSprite(m.arte, m.nome, 'disegno del mosaico')}${arte !== m.arte ? ' (oggi usa il disegno della Veglia)' : ''}`,
  });
});
scheda('Mosaici', 'Mosaici e Vetrate', {
  tipo: 'Indice',
  citazione: 'In ogni Veglia si cerca il mosaico successivo: tre frammenti dalle urne lo completano.',
  righe: [
    ['Quando', `le urne contengono frammenti solo dopo ${MO.MOSAICI.cadute} caduta`],
    ['La prima volta', 'la Vetrata si accende nella Cappella e il dono entra nelle carte, dalla Veglia dopo'],
    ['Le volte dopo', `il Bagliore e ${MO.MOSAICI.cera} ${L('Cera')}`],
  ],
  corpo: MO.MOSAICI_STANZE.map((m, i) => `${i + 1}. ${L(m.nome)} → ${L(nomeDono(m.dono))}`).join('\n'),
});

// --- Rompibili e oggetti a terra ---------------------------------------------------------------

{
  const RS = RO.ROMPIBILI_STANZE;
  const tot = RO.ROMPIBILI.tipi.reduce((s, t) => s + t.probabilita, 0);
  for (const t of RO.ROMPIBILI.tipi) {
    const nome = t.id === 'lanterna' ? 'Lanterna a terra' : t.nome;
    const contiene = [
      t.gocce && `${t.gocce} gocce di ${L('Cera')}`, t.frammenti && `un ${L('Frammento')} (dopo la prima caduta)`,
      t.olio && `una chiazza d'olio`, t.luce && 'una luce nel buio',
      t.id !== 'lanterna' && `una ${L('Chiave')} nel ${pc(RS.chiave)} dei casi`,
    ].filter(Boolean).join(', ');
    scheda('Oggetti', nome, {
      tipo: 'Rompibile', immagini: [sprite(t.sprite, ['idle'])],
      righe: [
        ['Quanto spesso', `${pc(t.probabilita / tot)} dei rompibili`],
        ['Quanti per stanza', `da ${RS.quanti.min} a ${RS.quanti.max} (arena del Campanaro: da ${RS.arena.min} a ${RS.arena.max}; Boss: nessuno)`],
        ['Contiene', contiene || '—'],
        ['Si rompe', 'solo colpendolo; fa da ostacolo'],
      ],
      corpo: `## Sprite\n\n- ${statoSprite(t.sprite, nome, 'sprite')}`,
    });
  }
  scheda('Oggetti', 'Frammento', {
    tipo: 'Oggetto', immagini: [sprite('Frammento', ['idle'])],
    citazione: `Tre frammenti completano un mosaico.`,
    righe: [['Da dove', L('Urna')], ['A cosa serve', L('Mosaici e Vetrate')]],
    corpo: `## Sprite\n\n- ${statoSprite('Frammento', 'Frammento', 'sprite')}`,
  });
  scheda('Oggetti', 'Chiave', {
    tipo: 'Oggetto', immagini: [sprite('Chiave', ['idle'])],
    citazione: 'Apre una porta chiusa a chiave.',
    righe: [
      ['Da dove', `${L('Urna')} e ${L('Giara')} (${pc(RS.chiave)}), e la chiave sicura: la ricompensa di una stanza a ${MA.MAPPA.chiaveSicura.distanzaMinima} porte o più dall'ingresso`],
      ['Apre', L('Porta chiusa a chiave')],
    ],
    corpo: `## Sprite\n\n- ${statoSprite('Chiave', 'Chiave', 'sprite a terra e nell\'HUD')}`,
  });
}

// --- Rarità ------------------------------------------------------------------------------------

for (const [id, g] of Object.entries(RA.GRADI)) {
  const echi = ARMI.filter((a) => RA.gradoDi(a.id) === id).map((a) => L(a.nome));
  const doni = DONI_STANZE.filter((d) => RA.gradoDi(d.id) === id).map((d) => L(d.nome));
  scheda('Rarità', g.nome, {
    tipo: 'Grado',
    righe: [
      ['Probabilità', `${pc(g.probabilita)} per carta`], ['Bordo della carta', `\`${g.bordo}\` (indicata: \`${g.scelta}\`)`],
      ['Armi ed Echi', echi.join(', ') || '—'], ['Doni', doni.join(', ') || '—'],
    ],
    corpo: id === 'ardente' ? `Il bordo pulsa: +${RA.BAGLIORE_ARDENTE.spessore} px ogni ${num(RA.BAGLIORE_ARDENTE.periodo)} s.` : '',
  });
}

// --- La mappa e le stanze ----------------------------------------------------------------------

{
  const M = MA.MAPPA, PE = SZ.PERCORSO;
  scheda('Stanze', 'Mappa del Mondo', {
    tipo: 'Stanza',
    citazione: 'Le stanze stanno su una griglia e si toccano dai lati: il gioco la genera a ogni Veglia con il seme.',
    righe: [
      ['Stanze', `da ${M.stanze.minimo} a ${M.stanze.massimo}, comprese ingresso, ${L('Il Campanaro', 'Campanaro')} e ${L('Stanza del Boss', 'Boss')}`],
      ['Stanza', `${SZ.STANZA.larghezza} × ${SZ.STANZA.altezza} px (doppia: ${SZ.STANZA.larghezzaDoppia} px di larghezza)`],
      ['Ingresso', `almeno ${M.porteIngresso} porte; le stanze accanto danno gli Echi d'inizio`],
      ['Ricompense', `${Object.keys(M.ricompense).map((k) => (k === 'dono' ? L('Stanza del dono', 'dono') : L(NOMI_AFF[k]))).join(', ')}, a pesi uguali`],
      ['Porte chiuse a chiave', `da ${M.serrate.minimo} a ${M.serrate.massimo} (${L('Porta chiusa a chiave')})`],
      ['Speciali', `${L('Tesoro')}, ${L('Sosta')}, ${L('Porta delle candele')}`],
      ['Carte', `${PE.quanteCarte} a stanza ripulita; al massimo ${PE.echi} ${L('Echi')} e ${PE.doni} doni`],
      ['Ondate', `una ogni ${PE.intervallo} s; più lontano dall'ingresso, più nemici`],
    ],
    corpo: '## Ondate\n\n| Porte dall\'ingresso | Ondate (Ricaduti + Cantori) |\n|---|---|\n' +
      PE.ondate.map((o, i) => `| ${i + 1}${i === PE.ondate.length - 1 ? '+' : ''} | ${o.map((x) => `${x.ricaduti}+${x.cantori}`).join(' · ')} |`).join('\n'),
  });
  scheda('Stanze', "Stanza d'affinità", {
    tipo: 'Stanza', immagini: Object.values(MEDAGLIONE).map((k) => sprite(k)),
    citazione: 'Dà Echi nuovi e livelli degli Echi di quella affinità (dalla Luce anche livelli della Lanterna).',
    righe: [['Porte', Object.values(NOMI_AFF).map((n) => L(n)).join(', ')]],
  });
  scheda('Stanze', 'Stanza del dono', {
    tipo: 'Stanza', immagini: [sprite('Porta_Dono')], citazione: 'Dà doni.',
    righe: [['Doni', DONI_STANZE.map((d) => L(d.nome)).join(', ')]],
  });
  scheda('Stanze', 'Tesoro', {
    tipo: 'Stanza', citazione: 'In un vicolo cieco, dietro una porta chiusa a chiave: il forziere apre un Reliquiario di carte rare.',
    righe: [['Carte', `${MA.STANZE_SPECIALI.tesoro.carte}, di grado ${MA.STANZE_SPECIALI.tesoro.gradi.map((g) => L(NOMI_GRADO[g])).join(' o ')}`], ['Porta', L('Porta chiusa a chiave')]],
  });
  scheda('Stanze', 'Sosta', {
    tipo: 'Stanza', citazione: 'La stanza da cui si entra nel Boss: la fonte riempie la fiaschetta.',
    righe: [['Fonte', `riempie la ${L('Fiaschetta')}`], ['Porta dopo', L('Stanza del Boss')]],
  });
  scheda('Stanze', 'Stanza del Boss', {
    tipo: 'Stanza', citazione: 'Stanza doppia, in un vicolo cieco: entrati, le porte si chiudono alle spalle.',
    righe: [['Capo', L(SE.SETH.nome)], ['Si apre', `dopo aver battuto ${L('Il Campanaro')}`], ['Prima', L('Sosta')]],
  });
  scheda('Stanze', 'Porta chiusa a chiave', {
    tipo: 'Stanza', citazione: 'Porta sempre a un vicolo cieco, mai sulla strada per il Boss.',
    righe: [['Si apre con', L('Chiave')], ['Dietro', `il ${L('Tesoro')} oppure una stanza con la ricompensa doppia (${PE.giriDoppia} giri di carte)`]],
  });
  const K = M.candele;
  scheda('Stanze', 'Porta delle candele', {
    tipo: 'Stanza', tag: ['esclusiva'], citazione: `Esclusiva del Lampionaio: solo la sua Lanterna accende le candele.`,
    righe: [
      ['Personaggio', L('Il Lampionaio')], ['Quando c\'è', `nel ${pc(K.probabilita)} delle Veglie`],
      ['Candele', `${K.quante}, in stanze diverse, vicino ai muri; si accendono con l'arco della ${L('Lanterna')}`],
      ['Dietro', `un vicolo cieco con la ricompensa doppia (${PE.giriDoppia} giri di carte)`],
    ],
  });
}

// --- Meccaniche --------------------------------------------------------------------------------

{
  const G = SZ.GRAZIA_STANZA, F = SZ.FIASCHETTA_STANZA;
  scheda('Meccaniche', 'Grazia', {
    tipo: 'Meccanica', alias: ['Schivata perfetta'],
    citazione: 'La schivata perfetta: senza scatto, la difesa attiva è la Grazia.',
    righe: [
      ['Come', `uscire da un attacco ravvicinato quando mancano al massimo ${num(G.finestra)} s, o farsi passare un proiettile entro ${num(G.sfioro)} px senza farsi toccare`],
      ['Dura', `${num(G.durata)} s`], ['Danno', `+${pc(G.danno)}`], ['Velocità', `+${pc(G.velocita)}`],
      ['Rallentatore', `${pc(G.rallentatore.scala)} della velocità per ${num(G.rallentatore.durata)} s`],
    ],
    corpo: `Migliorano la Grazia: ${L("Campanella d'argento")}, ${L('Mano tesa')}, ${L('Abbacinio')}, ${L('Sudario')}.`,
  });
  scheda('Meccaniche', 'Fiaschetta', {
    tipo: 'Meccanica', immagini: [sprite('Fiaschetta_Lumen', ['idle'], true)],
    citazione: 'Automatica: sotto la soglia di salute il personaggio beve da solo un sorso.',
    righe: [
      ['Sorsi', `${SO.FIASCHETTA.sorsi} all'inizio (fino a ${SO.FIASCHETTA.sorsi + 3} con il ${L('Calice riverso')})`],
      ['Beve', `sotto il ${pc(F.soglia)} della salute massima`],
      ['Cura', `${pc(SO.FIASCHETTA.cura)} della salute massima in ${num(SO.FIASCHETTA.durata)} s`],
      ['Si riempie', `${L('Il Campanaro')} (1 sorso), la fonte della ${L('Sosta')} (piena), ${L('Acquasantiera')}`],
    ],
  });
  scheda('Meccaniche', 'Quiete', {
    tipo: 'Meccanica',
    citazione: 'Il tempo in cui lo stesso bersaglio non si può ricolpire.',
    righe: [
      ['Personaggio', `${num(SZ.COMBATTIMENTO_STANZA.quiete)} s senza danni dopo un colpo (lampeggia)`],
      ['Nemici', `${num(SZ.NEMICI_STANZA.quiete)} s per ogni arma: le altre armi lo feriscono lo stesso`],
      ['Reazioni', `${num(ST.STATI_CERTI.quiete)} s prima che lo stesso nemico reagisca di nuovo (${L('Reazioni')})`],
    ],
  });
  scheda('Meccaniche', 'Colpo critico', {
    tipo: 'Meccanica', citazione: `Un colpo critico fa ${DO.MOLTIPLICA_CRITICO} volte il danno.`,
    righe: [['Da dove', L('Chiodo di bara')], ['Unione', L('Lapide inchiodata')]],
  });
  scheda('Meccaniche', 'Cera', {
    tipo: 'Meccanica', citazione: 'Si riporta da ogni Veglia, anche cadendo, e si spende nella Cappella.',
    righe: [
      ['Gocce', `dalle ${L('Giara', 'giare')}`],
      ['Premi', `${L('Il Campanaro')} ${CA.CAMPANARO.premio.cera}, ${L(SE.SETH.nome, 'Seth')} ${SE.SETH.premio.cera}, mosaico già completato ${MO.MOSAICI.cera}`],
    ],
  });
  scheda('Meccaniche', 'Echi', {
    tipo: 'Indice', citazione: 'Le armi automatiche: colpiscono da sole. «Arma» è solo quella iniziale.',
    righe: [['Al massimo', `${SZ.PERCORSO.echi} nella build, più la ${L('Lanterna')}`], ['Livelli', '5: il quinto è il potenziale ★']],
    corpo: '| Eco | Affinità | Grado | Unione |\n|---|---|---|---|\n' +
      ECHI.map((e) => `| ${LT(e.nome)} | ${LT(NOMI_AFF[affinitaArma(e.id)])} | ${LT(NOMI_GRADO[RA.gradoDi(e.id)])} | ${unionePerArma(e.id) ? LT(unionePerArma(e.id).nome) : ''} |`).join('\n'),
  });
}

// --- Glossario ---------------------------------------------------------------------------------

{
  const termini = GL.TERMINI.map((t) => `## ${t.parola}\n\n${t.significa}`);
  for (const k of ['Danno', 'Colpi', 'Area', 'Portata', 'Ricarica', 'Salute', 'Carica'])
    if (!GL.TERMINI.some((t) => t.parola === k)) termini.push(`## ${k}\n\n(vedi i dati)`);
  const altri = Object.values(GL.CAMPI_GLOSSARIO).filter((c) => !GL.TERMINI.some((t) => t.parola === c.nome))
    .map((c) => `## ${c.nome}\n\nUno dei numeri sulle carte delle armi${c.unita ? `, in ${c.unita.trim()}` : ''}.`);
  const leggibile = (re) => re.source.replace(/\\b/g, '').replace(/\[([a-zà-ù]+)\]/g, (_, c) => `(${c.split('').join('/')})`)
    .replace(/\)\?/g, ')').replace(/\|/g, ' / ');
  const vietate = GL.VIETATE.map((v) => `- ~~${leggibile(v.cerca)}~~ → ${v.usa}`).join('\n');
  scheda('', 'Glossario', {
    tipo: 'Glossario', citazione: 'Le stesse parole per le stesse cose in carte, pausa, LAB e GDD.',
    corpo: [...termini, ...altri, `## Parole da non usare\n\n${vietate}`].join('\n\n'),
  });
}

// --- Scrive la wiki ----------------------------------------------------------------------------

// cartelle e file che appartengono allo script: si cancellano e si riscrivono a ogni giro
const CARTELLE = [...new Set(schede.map((s) => s.cartella).filter(Boolean)), '_sprite'];
const PROPRIE = [...CARTELLE, 'Home.md', 'Glossario.md', 'Sprite da fare.md'];
// _sprite si è già svuotata all'inizio e riempita mentre si preparavano le schede: qui si puliscono solo le schede
for (const c of PROPRIE) if (c !== '_sprite') fs.rmSync(path.join(WIKI, c), { recursive: true, force: true });
fs.mkdirSync(path.join(WIKI, 'Appunti'), { recursive: true });
for (const s of schede) {
  const dir = path.join(WIKI, s.cartella);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, s.nome + '.md'), s.testo);
}

// gli sprite da fare
const unici = [...new Map(DA_FARE.map((d) => [d.chiave + d.scheda, d])).values()];
fs.writeFileSync(path.join(WIKI, 'Sprite da fare.md'), [
  '---', 'tipo: Indice', 'tags: [indice]', '---', '', '# Sprite da fare', '',
  '> Gli sprite che nelle schede risultano segnaposto (V0) o mancanti. Dettagli e misure: `docs/asset_da_creare.md`.', '',
  '| Scheda | Cosa | File | Stato |', '|---|---|---|---|',
  ...unici.sort((a, b) => a.stato.localeCompare(b.stato) || a.scheda.localeCompare(b.scheda))
    .map((d) => `| ${LT(d.scheda)} | ${d.cosa} | \`${d.chiave}\` | ${d.stato} |`),
  '',
].join('\n'));

// la pagina iniziale
const ORDINE = ['Personaggi', 'Armi', 'Echi', 'Doni', 'Unioni', 'Abilità', 'Affinità', 'Stati', 'Reazioni', 'Nemici', 'Mosaici', 'Oggetti', 'Rarità', 'Stanze', 'Meccaniche'];
const home = ['---', 'tipo: Indice', 'tags: [indice]', '---', '', "# Death's Lumen: la wiki del gioco a stanze", '',
  '> Generata dai dati del gioco (`src/data/`) con `npm run wiki`: **non modificare le schede**, vengono riscritte. Le tue note vanno in **Appunti/**: i link verso le schede compaiono in fondo a ogni scheda, nei «collegamenti in entrata».', '',
  `Aggiornata il ${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'long', timeStyle: 'short' })} · ${schede.length} schede · ${L('Sprite da fare')} (${unici.length}) · ${L('Glossario')}`, ''];
for (const c of ORDINE) {
  const qui = schede.filter((s) => s.cartella === c).sort((a, b) => (a.tipo === 'Indice') - (b.tipo === 'Indice') || 0);
  if (!qui.length) continue;
  home.push(`## ${c}`, '', qui.map((s) => L(s.nome)).join(' · '), '');
}
fs.writeFileSync(path.join(WIKI, 'Home.md'), home.join('\n'));

// impostazioni di Obsidian: solo se mancano (poi sono di Edoardo)
const OBS = path.join(WIKI, '.obsidian');
const seManca = (f, contenuto) => { const p = path.join(OBS, f); if (!fs.existsSync(p)) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, contenuto); } };
const colore = (hex) => ({ a: 1, rgb: parseInt(hex.slice(1), 16) });
seManca('app.json', JSON.stringify({ newFileFolderPath: 'Appunti', newFileLocation: 'folder', attachmentFolderPath: 'Appunti', alwaysUpdateLinks: true }, null, 2));
seManca('appearance.json', JSON.stringify({ enabledCssSnippets: ['pixel'], theme: 'obsidian' }, null, 2));
seManca('snippets/pixel.css', '/* Sprite nitidi: niente sfumature quando Obsidian li ingrandisce (pixel art). */\nimg[src*="_sprite"], .internal-embed img { image-rendering: pixelated; }\n.markdown-rendered .internal-embed img { margin-right: 12px; vertical-align: bottom; }\n');
seManca('graph.json', JSON.stringify({
  showTags: false, showAttachments: false, hideUnresolved: true, showOrphans: true, showArrow: false,
  colorGroups: [
    ['Personaggi', '#e3913a'], ['Echi', '#efe3c8'], ['Armi', '#fbce4a'], ['Doni', '#dcc07a'], ['Unioni', '#9fd6e0'],
    ['Nemici', '#c2412d'], ['Stati', '#a57ae0'], ['Reazioni', '#c9a0ff'], ['Affinità', '#b89a74'], ['Mosaici', '#86c5e8'],
    ['Stanze', '#8a7a68'], ['Oggetti', '#6d7f8c'], ['Meccaniche', '#6fbf4a'], ['Rarità', '#f6b86a'], ['Appunti', '#ffffff'],
  ].map(([c, hex]) => ({ query: `path:"${c}"`, color: colore(hex) })),
  nodeSizeMultiplier: 1.2, lineSizeMultiplier: 1, linkDistance: 180, repelStrength: 12,
}, null, 2));
if (!fs.existsSync(path.join(WIKI, 'Appunti', 'Leggimi.md')))
  fs.writeFileSync(path.join(WIKI, 'Appunti', 'Leggimi.md'), '# Appunti\n\nQuesta cartella è tua: lo script della wiki non la tocca mai. Scrivi qui idee e note e collega le schede con [[ ]] (per esempio [[Ricaduto]]): la nota comparirà in fondo alla scheda, tra i collegamenti in entrata.\n');

console.log(`Wiki scritta in wiki/: ${schede.length} schede, ${[...spriteFatti.values()].filter(Boolean).length} sprite, ${unici.length} sprite da fare.`);
