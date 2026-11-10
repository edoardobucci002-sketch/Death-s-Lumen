// Controllo del GDD: confronta docs/GDD.md con i valori veri del gioco.
//
// Come funziona: carica gli stessi file che usa il gioco (src/data/ e src/sistema/pixel.ts,
// trascritti in una cartella temporanea con il compilatore TypeScript già installato), legge i numeri
// scritti nel GDD e li confronta. Qui dentro NON ci sono valori attesi: c'è solo la corrispondenza
// tra le colonne e le frasi del GDD e i campi dei dati.
//
// Segnaposto nei modelli di frase:
//   {}   un numero del GDD, da confrontare con il valore dato accanto
//   {t}  un momento nel formato m:ss, confrontato in secondi
//   {p}  un numero scritto a parole («metà», «un quarto», «doppio»…, vedi PAROLE)
//   {?}  un numero del GDD che non sta nei dati e non si confronta (elenco in fondo al file)
//
// Se si riscrive una frase del GDD, lo script dice «frase non trovata»: va aggiornato il modello qui sotto.
// Il testo discorsivo fuori dai modelli non si controlla con lo script: si controlla a lettura.
//
// Esce con codice 1 se trova differenze: in quel caso la tappa non è finita.
// Uso: npm run controlla-gdd

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- Carica i file del gioco -----------------------------------------------------------------

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'controlla-gdd-'));
function trascrivi(file) {
  const testo = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(testo, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  // qui i file stanno tutti in una cartella sola: pixel.ts legge i dati da ../data/
  fs.writeFileSync(path.join(tmp, path.basename(file).replace(/\.ts$/, '.js')), js.replace(/require\("\.\.\/data\//g, 'require("./'));
}
for (const f of fs.readdirSync(path.join(radice, 'src/data'))) if (f.endsWith('.ts')) trascrivi(path.join(radice, 'src/data', f));
trascrivi(path.join(radice, 'src/sistema/pixel.ts'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"commonjs"}');
const richiedi = createRequire(path.join(tmp, 'x.js'));
const D = (nome) => richiedi('./' + nome + '.js');

const A = D('armi'), N = D('nemici'), AB = D('abilita'), P = D('personaggi'), DO = D('doni'), M = D('meta');
const R = D('rosario'), U = D('unioni'), ST = D('stati'), PR = D('progressione'), SO = D('sopravvivenza');
const OG = D('oggetti'), W = D('mondo'), E = D('effetti'), H = D('hud'), PX = D('pixel');

const gdd = fs.readFileSync(path.join(radice, 'docs/GDD.md'), 'utf8');
const righeGdd = gdd.split('\n');
const diff = [];
let controlli = 0;

// --- Strumenti --------------------------------------------------------------------------------

// Numeri scritti a parole nel GDD: è un dizionario della lingua, non valori di bilanciamento.
const PAROLE = { 'metà': 1 / 2, 'un quarto': 1 / 4, 'un': 1, 'doppio': 2, 'raddoppia': 2, 'due': 2, 'tre': 3 };

const SEGNAPOSTO = {
  '{}': '(-?\\d+(?:,\\d+)?)',
  '{t}': '(\\d+:\\d\\d)',
  '{p}': '(' + Object.keys(PAROLE).join('|') + ')',
  '{?}': '(?:-?\\d+(?:,\\d+)?)',
};
const numero = (t) => parseFloat(String(t).replace(',', '.').replace('−', '-'));
const secondi = (t) => { const [m, s] = t.split(':').map(Number); return m * 60 + s; };
const uguali = (a, b) => Math.abs(a - b) < 1e-6;
const pct = (x) => x * 100; // nel GDD le parti si scrivono in percentuale
const italiano = (x) => String(Math.round(x * 1e6) / 1e6).replace('.', ',');

function regexDi(modello) {
  return modello.split(/(\{\}|\{t\}|\{p\}|\{\?\})/)
    .map((pezzo) => SEGNAPOSTO[pezzo] ?? pezzo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('');
}
const leggi = (g) => (g in PAROLE ? PAROLE[g] : g.includes(':') ? secondi(g) : numero(g));

/** Cerca il modello nel testo e restituisce i numeri del GDD (null se la frase non c'è). */
function estrai(testo, etichetta, modello) {
  const m = testo.match(new RegExp(regexDi(modello)));
  if (!m) { diff.push(`${etichetta}: frase non trovata nel GDD («${modello}»)`); return null; }
  return m.slice(1);
}

/** Confronta i numeri del modello con i valori dei dati, in tutti i punti in cui la frase compare nel testo. */
function inTesto(testo, etichetta, modello, ...attesi) {
  const trovate = [...testo.matchAll(new RegExp(regexDi(modello), 'g'))];
  controlli += Math.max(attesi.length, 1);
  if (!trovate.length) { diff.push(`${etichetta}: frase non trovata nel GDD («${modello}»)`); return; }
  for (const m of trovate) {
    if (m.length - 1 !== attesi.length) throw new Error(`Modello sbagliato: ${modello}`);
    attesi.forEach((v, i) => {
      if (!uguali(leggi(m[i + 1]), v)) diff.push(`${etichetta}: GDD ${m[i + 1]} ≠ dati ${italiano(v)}`);
    });
  }
}
const frase = (etichetta, modello, ...attesi) => inTesto(gdd, etichetta, modello, ...attesi);

/** Il testo di una sezione: dal titolo al titolo successivo. */
function sezione(titolo) {
  const i = righeGdd.findIndex((l) => l.startsWith(titolo));
  if (i < 0) { diff.push(`Sezione mancante nel GDD: ${titolo}`); return ''; }
  let j = i + 1;
  while (j < righeGdd.length && !/^#{1,4} /.test(righeGdd[j])) j++;
  return righeGdd.slice(i, j).join('\n');
}

/** La prima tabella dopo la riga indicata: elenco di righe, ognuna {colonna: testo}. */
function tabella(ancora) {
  const vuota = { colonne: [], righe: [] };
  let i = righeGdd.findIndex((l) => l.startsWith(ancora));
  if (i < 0) { diff.push(`Tabella mancante nel GDD: ${ancora}`); return vuota; }
  while (i < righeGdd.length && !righeGdd[i].startsWith('|')) i++;
  const blocco = [];
  while (righeGdd[i]?.startsWith('|')) blocco.push(righeGdd[i++].split('|').slice(1, -1).map((c) => c.trim()));
  const [colonne, , ...corpo] = blocco;
  return { colonne, righe: corpo.map((c) => Object.fromEntries(colonne.map((nome, k) => [nome, c[k]]))) };
}

/** Passa la riga di tabella il cui primo campo comincia con «nome»; segnala se manca. */
function conRiga(t, nome, fai) {
  const r = t.righe.find((x) => x[t.colonne[0]].startsWith(nome));
  controlli++;
  if (!r) { diff.push(`Riga mancante nel GDD: ${nome}`); return; }
  fai(r);
}

/** Le righe della tabella devono essere esattamente quelle dei dati. */
function stessiNomi(etichetta, t, nomi) {
  const gddNomi = t.righe.map((r) => r[t.colonne[0]]);
  controlli++;
  for (const n of nomi) if (!gddNomi.some((g) => g.startsWith(n))) diff.push(`${etichetta}: «${n}» è nei dati ma non nel GDD`);
  for (const g of gddNomi) if (!nomi.some((n) => g.startsWith(n))) diff.push(`${etichetta}: «${g}» è nel GDD ma non nei dati`);
}

function testoUguale(etichetta, gddTesto, dato) {
  controlli++;
  if (gddTesto !== dato) diff.push(`${etichetta}: GDD «${gddTesto}» ≠ dati «${dato}»`);
}
function vero(etichetta, condizione, spiegazione) {
  controlli++;
  if (!condizione) diff.push(`${etichetta}: ${spiegazione}`);
}

/** Il momento scritto nel GDD deve essere il primo minuto del copione in cui compare il nemico. */
function compareDa(etichetta, tipo, testo) {
  const primo = N.COPIONE.findIndex((riga) => riga[tipo.id]) * 60;
  vero(etichetta, secondi(testo) === primo, `GDD ${testo}, ma nel copione compare da ${primo} s`);
}
/** «1-4, 6-9, 11-14» da [1, 2, 3, 4, 6, …]. */
const ORDINE_MINUTI = (m) => {
  const tratti = [];
  for (let i = 0; i < m.length; i++) {
    let j = i;
    while (j + 1 < m.length && m[j + 1] === m[j] + 1) j++;
    tratti.push(i === j ? `${m[i]}` : `${m[i]}-${m[j]}`);
    i = j;
  }
  return tratti.join(', ');
};
const tipo = (id) => N.NEMICI.find((t) => t.id === id);

// --- 1. Cronologia ----------------------------------------------------------------------------

{
  const t = tabella('| Momento | Evento |');
  const evento = (inizio, fai) => {
    const r = t.righe.find((x) => x.Evento.startsWith(inizio));
    controlli++;
    if (!r) diff.push(`Cronologia: manca «${inizio}»`); else fai(r);
  };
  frase('Durata della notte', 'sopravvivere {} minuti, fino all', OG.ALBA / 60);
  frase('Abilità pronta', 'abilità speciale pronta dopo {} s', AB.PRONTA_DOPO);
  for (const [id, parola] of [['fantasma', 'i fantasmi'], ['scheletro', 'gli scheletri'], ['segugio', 'i segugi'], ['bruto', 'i bruti']]) {
    evento('Iniziano ' + parola, (r) => compareDa('Cronologia ' + id, tipo(id), r.Momento));
  }
  evento('Un nemico élite', (r) => {
    inTesto(r.Momento, 'Cronologia élite', '{t}, poi ogni {} s', N.ELITE.primo, N.ELITE.ogni);
    inTesto(r.Evento, 'Cronologia élite', 'che lascia {p} reliquiario', N.ELITE.reliquiari);
  });
  evento('Un\'orda di un solo tipo', (r) => {
    const minuti = ORDINE_MINUTI(N.ORDE.copione.map((o) => o.minuto));
    vero('Cronologia orde', r.Momento.includes(minuti) && r.Momento.includes(`${N.ORDE.preavviso} s di preavviso`), `GDD «${r.Momento}» ≠ dati «${minuti}, ${N.ORDE.preavviso} s di preavviso»`);
  });
  evento('Prima apparizione', (r) => inTesto(r.Momento, 'Cronologia Seth', '{t}', N.MIETITORE.minuti[0] * 60));
  evento('Seconda apparizione', (r) => inTesto(r.Momento, 'Cronologia Seth', '{t}', N.MIETITORE.minuti[1] * 60));
  evento('L\'alba', (r) => inTesto(r.Momento, 'Cronologia alba', '{t}', OG.ALBA));
}

// --- 2. Personaggi -----------------------------------------------------------------------------

{
  frase('Valori di base', 'Valori di base comuni: {} salute, velocità {}, raccolta delle anime a {} px, armatura {}.', P.BASE.salute, P.BASE.velocita, P.BASE.raccolta, P.BASE.armatura);
  const t = tabella('| Personaggio | Motto |');
  const barre = tabella('**Barre della scheda**');
  stessiNomi('Personaggi', t, P.PERSONAGGI.map((p) => p.nome));
  stessiNomi('Barre', barre, P.PERSONAGGI.map((p) => p.nome));
  // colonna «Modificatori»: come si legge ogni campo. segno = -1 se il dato è una riduzione scritta con il meno.
  const MODIFICATORI = [
    ['salute', /([+−]\d+) salute(?!\/s)/, (x) => x],
    ['rigenerazione', /([+−]\d+(?:,\d+)?) salute\/s/, (x) => x],
    ['velocita', /([+−]\d+(?:,\d+)?)% velocità/, pct],
    ['danno', /([+−]\d+(?:,\d+)?)% danno(?! subito)/, pct],
    ['area', /([+−]\d+(?:,\d+)?)% area/, pct],
    ['armatura', /([+−]\d+(?:,\d+)?)% danno subito/, (x) => -pct(x)],
    ['ricarica', /([+−]\d+(?:,\d+)?)% ricarica/, (x) => -pct(x)],
  ];
  for (const p of P.PERSONAGGI) {
    conRiga(t, p.nome, (r) => {
      testoUguale(`${p.nome}: motto`, r.Motto, p.motto);
      testoUguale(`${p.nome}: colore`, r.Colore.replaceAll('`', ''), p.colore);
      testoUguale(`${p.nome}: arma iniziale`, r['Arma iniziale'], A.ARMI_INIZIALI[p.armaIniziale].nome);
      testoUguale(`${p.nome}: abilità`, r['Abilità speciale'], AB.ABILITA[p.abilita].nome);
      for (const [campo, rx, conv] of MODIFICATORI) {
        const m = r.Modificatori.match(rx);
        const g = m ? numero(m[1]) : 0; // non scritto nel GDD = nessun modificatore
        vero(`${p.nome}: ${campo}`, uguali(g, conv(p[campo])), `GDD ${m ? m[1] : 'non scritto'} ≠ dati ${italiano(conv(p[campo]))}`);
      }
    });
    conRiga(barre, p.nome, (r) => {
      ['Vit.', 'Dan.', 'Vel.', 'Rag.', 'Con.'].forEach((col, i) => vero(`${p.nome}: barra ${col}`, numero(r[col]) === p.barre[i], `GDD ${r[col]} ≠ dati ${p.barre[i]}`));
    });
    vero(`${p.nome}: biografia`, gdd.includes(`«${p.biografia}»`), 'nel GDD il testo è diverso');
    vero(`${p.nome}: citazione`, gdd.includes(`*«${p.citazione}»*`), 'nel GDD il testo è diverso');
  }
}

// --- 3. Abilità --------------------------------------------------------------------------------

{
  const t = tabella('| Abilità | Ricarica |');
  const lista = Object.values(AB.ABILITA);
  stessiNomi('Abilità', t, lista.map((a) => a.nome));
  for (const a of lista) {
    conRiga(t, a.nome, (r) => {
      inTesto(r.Ricarica, `${a.nome}: ricarica`, '{} s', a.ricarica);
      inTesto(r.Durata, `${a.nome}: durata`, '{} s', a.durata);
      inTesto(r.Raggio, `${a.nome}: raggio`, '{}', a.raggio);
      inTesto(r.Danno, `${a.nome}: danno`, '{} ogni {} s', a.danno, a.intervallo);
      if (a.rallenta) inTesto(r.Effetto, `${a.nome}: rallenta`, /rallenta dell'/.test(r.Effetto) ? 'rallenta dell\'{}%' : 'rallenta del {}%', pct(a.rallenta));
      if (a.cura) inTesto(r.Effetto, `${a.nome}: cura`, 'cura {} salute/s', a.cura);
      if (a.attira) inTesto(r.Effetto, `${a.nome}: attira`, 'attira i nemici a {} px/s', a.attira);
      vero(`${a.nome}: segue`, r.Effetto.startsWith('ti segue') === a.segue, 'nel GDD «ti segue/fissa» è diverso dai dati');
    });
  }
  frase('Seth e le abilità', 'Seth subisce il rallentamento a {p} e l\'attrazione a {p}; bruti ed élite l\'attrazione a {p}', N.MIETITORE.rallentamento, N.MIETITORE.attrazione, AB.ATTRAZIONE_PESANTI);
}

// --- 4. Armi -----------------------------------------------------------------------------------

{
  frase('Armi massime', 'Al massimo {} armi, ognuna fino al livello {}', A.MAX_ARMI, PR.CARTE.livelloMassimo);

  // tabelle livello per livello: colonna del GDD → campo del livello, oppure funzione per i valori fissi dell'arma
  const LIVELLI = [
    ['Lanterna', A.LANTERNA, { 'Ricarica (s)': 'ricarica', Danno: 'danno', Raggio: 'raggio', 'Ampiezza arco (°)': 'ampiezza', 'Colpo alle spalle': 'spalle' }],
    ['Pala', A.PALA, { 'Ricarica (s)': 'ricarica', Danno: 'danno', Raggio: 'raggio', 'Distanza colpo': () => A.PALA.distanza, 'Colpo doppio': 'doppio' }],
    ['Turibolo', A.TURIBOLO, { 'Ricarica (s)': 'ricarica', 'Quantità': 'quantita', Danno: 'danno', Raggio: 'raggio', 'Durata (s)': 'durata' }],
    ['Bastone', A.BASTONE, { 'Ricarica (s)': 'ricarica', 'Quantità': 'quantita', Danno: 'danno', Trapassa: 'trapassa', 'Velocità proiettile': () => A.BASTONE.velocita }],
    ['Candela', A.CANDELA, { 'Ricarica (s)': 'ricarica', Danno: 'danno', 'Quantità': 'quantita', Trapassa: 'trapassa', 'Velocità proiettile': () => A.CANDELA.velocita }],
    ['Falce', A.FALCE, { 'Quantità': 'quantita', Danno: 'danno', Raggio: 'raggio', 'Rotazione (giri/s)': 'giri' }],
    ['Campana', A.CAMPANA, { 'Ricarica (s)': 'ricarica', Danno: 'danno', Raggio: 'raggio', 'Colpo doppio': 'doppio' }],
    ['Fuoco fatuo', A.FUOCO_FATUO, { 'Ricarica (s)': 'ricarica', 'Quantità': 'quantita', Danno: 'danno', Trapassa: 'trapassa' }],
    ['Acqua santa', A.ACQUA_SANTA, { 'Ricarica (s)': 'ricarica', 'Quantità': 'quantita', Danno: 'danno', Raggio: 'raggio', 'Durata (s)': 'durata' }],
    ['Lama di luce', A.LAMA_DI_LUCE, { 'Ricarica (s)': 'ricarica', Danno: 'danno', Lunghezza: 'lunghezza', 'Colpo alle spalle': 'spalle' }],
    ['Lapide', A.LAPIDE, { 'Ricarica (s)': 'ricarica', Danno: 'danno', Raggio: 'raggio', 'Quantità': 'quantita' }],
    ['Rosario spezzato', A.ROSARIO_SPEZZATO, { 'Ricarica (s)': 'ricarica', Danno: 'danno', Rimbalzi: 'rimbalzi', 'Quantità': 'quantita' }],
    ['Corvo', A.CORVO, { 'Ricarica (s)': 'ricarica', Danno: 'danno', 'Quantità': 'quantita', 'Anime riportate': 'anime' }],
    ['Velo funebre', A.VELO_FUNEBRE, { 'Ricarica (s)': 'ricarica', Danno: 'danno', Raggio: 'raggio' }],
  ];
  for (const [nome, arma, colonne] of LIVELLI) {
    const t = tabella('#### ' + nome);
    vero(nome, t.righe.length === arma.livelli.length, `${t.righe.length} righe nel GDD, ${arma.livelli.length} livelli nei dati`);
    for (const col of t.colonne) {
      if (col !== 'Lv' && col !== 'Cosa cambia' && !(col in colonne)) diff.push(`${nome}: colonna «${col}» senza corrispondenza nello script`);
    }
    t.righe.forEach((r, i) => {
      const L = arma.livelli[i];
      if (!L) return;
      testoUguale(`${nome} liv. ${i + 1}: testo`, r['Cosa cambia'], L.testo);
      for (const [col, campo] of Object.entries(colonne)) {
        const dato = typeof campo === 'function' ? campo() : L[campo];
        const g = typeof dato === 'boolean' ? r[col] === 'sì' : numero(r[col]);
        vero(`${nome} liv. ${i + 1}: ${col}`, typeof dato === 'boolean' ? g === dato : uguali(g, dato), `GDD ${r[col]} ≠ dati ${dato}`);
      }
    });
  }

  // numeri nelle frasi sopra ogni tabella
  const s = (nome) => sezione('#### ' + nome);
  const frasi = [
    ['Lanterna', 'misurato dal personaggio; respinge di {} (', A.LANTERNA.respinta],
    ['Pala', 'Impatto circolare {} px davanti a te', A.PALA.distanza],
    ['Pala', 'respinge di {} (', A.PALA.respinta],
    ['Pala', 'un secondo colpo alle spalle {} s dopo', A.PALA.ritardoDoppio],
    ['Turibolo', 'La prima nube nasce {} px davanti a te, le altre a caso fino a {} px', A.TURIBOLO.distanzaPrima, A.TURIBOLO.distanzaAltre],
    ['Turibolo', 'ogni nube ferisce ogni {} s e rallenta del {}%', A.TURIBOLO.intervallo, pct(A.TURIBOLO.rallenta)],
    ['Bastone', 'Mira al nemico più vicino entro {} px', A.BASTONE.portata],
    ['Bastone', 'proiettili a {} px/s, raggio {} px; i proiettili partono a {} s l\'uno dall\'altro e svaniscono dopo {} s', A.BASTONE.velocita, A.BASTONE.raggio, A.BASTONE.intervallo, A.BASTONE.vita],
    ['Candela', 'entro {} px (circa lo schermo)', A.CANDELA.portata],
    ['Candela', 'le fiammelle durano {} s, raggio {} px', A.CANDELA.vita, A.CANDELA.raggio],
    ['Falce', 'colpito da una falce ogni {} s; respinge di {} (', A.FALCE.pausa, A.FALCE.respinta],
    ['Falce', 'la lama tocca entro {} px', A.FALCE.raggioLama],
    ['Campana', 'respinge di {} (', A.CAMPANA.respinta],
    ['Campana', 'il secondo rintocco arriva {} s dopo', A.CAMPANA.ritardoDoppio],
    ['Fuoco fatuo', 'girano (fino a {} radianti al secondo)', A.FUOCO_FATUO.sterzo],
    ['Fuoco fatuo', 'entro {} px, a {} px/s; durano {} s', A.FUOCO_FATUO.portata, A.FUOCO_FATUO.velocita, A.FUOCO_FATUO.vita],
    ['Acqua santa', 'la pozza ferisce ogni {} s', A.ACQUA_SANTA.intervallo],
    ['Lama di luce', 'Fendente orizzontale alto {} px', A.LAMA_DI_LUCE.altezza],
    ['Lama di luce', 'il colpo alle spalle parte {} s dopo; respinge di {}.', A.LAMA_DI_LUCE.ritardoSpalle, A.LAMA_DI_LUCE.respinta],
    ['Lapide', 'scende da {} px in {} s, colpisce e resta a terra {} s', A.LAPIDE.altezza, A.LAPIDE.caduta, A.LAPIDE.resta],
    ['Rosario spezzato', 'Cerca il primo bersaglio entro {} px, poi rimbalza sui nemici entro {} px, un rimbalzo ogni {} s', A.ROSARIO_SPEZZATO.portata, A.ROSARIO_SPEZZATO.salto, A.ROSARIO_SPEZZATO.intervallo],
    ['Corvo', 'Vola intorno a te a {} px, a {} giri al secondo; becca il nemico più vicino entro {} px, volando a {} px/s', A.CORVO.orbita, A.CORVO.giri, A.CORVO.portata, A.CORVO.velocita],
  ];
  for (const [nome, modello, ...attesi] of frasi) inTesto(s(nome), nome, modello, ...attesi);

  // armi nuove: livello 1 e livello 8 stanno in una cella ciascuno
  const t = tabella('| Arma | Affinità |');
  const NUOVE = [
    [A.LAPIDE, '{} danni, ogni {} s, raggio {}', ['danno', 'ricarica', 'raggio'], '{} danni, {} lapidi, ogni {} s, raggio {}', ['danno', 'quantita', 'ricarica', 'raggio']],
    [A.ROSARIO_SPEZZATO, '{} danni, {} rimbalzi, ogni {} s', ['danno', 'rimbalzi', 'ricarica'], '{} danni, {} rimbalzi, {} grani, ogni {} s', ['danno', 'rimbalzi', 'quantita', 'ricarica']],
    [A.CORVO, '{} danni, {} corvo, ogni {} s, {} anima', ['danno', 'quantita', 'ricarica', 'anime'], '{} danni, {} corvi, ogni {} s, {} anime', ['danno', 'quantita', 'ricarica', 'anime']],
    [A.VELO_FUNEBRE, '{} danni, raggio {}, ogni {} s', ['danno', 'raggio', 'ricarica'], '{} danni, raggio {}, ogni {} s', ['danno', 'raggio', 'ricarica']],
  ];
  stessiNomi('Armi nuove', t, NUOVE.map(([a]) => a.nome));
  for (const [arma, m1, c1, m8, c8] of NUOVE) {
    conRiga(t, arma.nome, (r) => {
      const primo = arma.livelli[0], ultimo = arma.livelli[arma.livelli.length - 1];
      inTesto(r['Livello 1'], `${arma.nome}: primo livello`, m1, ...c1.map((c) => primo[c]));
      inTesto(r['Livello 8'], `${arma.nome}: ultimo livello`, m8, ...c8.map((c) => ultimo[c]));
      testoUguale(`${arma.nome}: affinità`, r['Affinità'].toLowerCase(), ST.AFFINITA_ARMI[arma.id]);
    });
  }
  conRiga(t, 'Rosario spezzato', (r) => inTesto(r['Cosa fa'], 'Rosario spezzato', '(entro {} px); {}% di maledire', A.ROSARIO_SPEZZATO.salto, pct(ST.RUOLI.rosarioMaledice)));
  conRiga(t, 'Corvo', (r) => inTesto(r['Cosa fa'], 'Corvo', '(entro {} px)', A.CORVO.portata));
  conRiga(t, 'Velo funebre', (r) => inTesto(r['Cosa fa'], 'Velo funebre', '{}% di consacrare', pct(ST.RUOLI.veloConsacra)));
  conRiga(t, 'Lapide', (r) => vero('Lapide', (ST.RUOLI.lapideSeppellisce === 1) === r['Cosa fa'].includes('resta sempre Sepolto'), 'nei dati la probabilità di seppellire non è «sempre»'));
}

// --- 5. Doni -----------------------------------------------------------------------------------

{
  frase('Doni massimi', 'Al massimo {} doni passivi diversi', DO.MAX_PASSIVI);
  frase('Peso degli oggetti nuovi', 'come se fossero sempre {} e {}', PR.CARTE.pool.armi, PR.CARTE.pool.doni);
  const t = tabella('| Dono | Effetto al massimo |');
  stessiNomi('Doni', t, DO.PASSIVI.map((d) => d.nome));
  const dono = (id) => DO.PASSIVI.find((d) => d.id === id);
  // l'effetto al livello massimo (totale); la colonna «per livello» è solo una lettura arrotondata
  const EFFETTI_DONI = {
    cuoreDiCera: (d) => ['+{} salute massima', d.totale],
    saleNero: (d) => ['+{}% danno', pct(d.totale)],
    clessidra: (d) => ['−{}% ricarica, si moltiplica a ogni livello (minimo {}% della ricarica base)', pct(d.totale), pct(DO.RICARICA_MINIMA)],
    stoppinoLungo: (d) => ['+{}% area', pct(d.totale)],
    aliDiFalena: (d) => ['+{}% velocità', pct(d.totale)],
    calamita: (d) => ['+{}% raggio di raccolta e +{}% anime', pct(d.totale), pct(d.anime)],
    erbeAmare: (d) => ['+{} salute al secondo', d.totale],
    scudoDiFerro: (d) => ['−{}% danno subito', pct(d.totale)],
    specchio: (d) => ['+{} proiettile', d.totale],
    ceraVotiva: (d) => ['+{}% durata', pct(d.totale)],
    chiodoDiBara: (d) => ['+{}% probabilità di colpo critico (danno {p})', pct(d.totale), DO.MOLTIPLICA_CRITICO],
    lacrimaDiLumen: (d) => ['+{} sorsi', d.totale],
    campanellaDArgento: (d) => ['+{} s di finestra', d.totale],
  };
  for (const d of DO.PASSIVI) {
    conRiga(t, d.nome, (r) => {
      inTesto(r['Livello max'], `${d.nome}: livello massimo`, '{}', d.massimo);
      if (!EFFETTI_DONI[d.id]) { diff.push(`Dono ${d.id}: senza corrispondenza nello script`); return; }
      const [modello, ...attesi] = EFFETTI_DONI[d.id](dono(d.id));
      inTesto(r['Effetto al massimo'], d.nome, modello, ...attesi);
    });
  }
}

// --- 6. Nemici ---------------------------------------------------------------------------------

{
  frase('Velocità a caso', 'la velocità varia a caso del ±{}%', pct(N.DIFFICOLTA.variazioneVelocita));
  const t = tabella('| Nemico | Salute |');
  const NOMI = { pipistrello: 'Pipistrello', zombi: 'Zombi', fantasma: 'Fantasma', scheletro: 'Scheletro', segugio: 'Segugio', bruto: 'Bruto', mietitore: 'Seth' };
  stessiNomi('Nemici', t, N.NEMICI.map((x) => NOMI[x.id]));
  for (const x of N.NEMICI) {
    conRiga(t, NOMI[x.id], (r) => {
      for (const [col, campo] of [['Salute', 'salute'], ['Velocità', 'velocita'], ['Danno', 'danno'], ['Raggio', 'raggio'], ['Anime', 'anime']]) {
        vero(`${NOMI[x.id]}: ${col}`, uguali(numero(r[col]), x[campo]), `GDD ${r[col]} ≠ dati ${x[campo]}`);
      }
      if (x.id === 'mietitore') inTesto(r['Compare da'], 'Seth: minuti', '{t} e {t}', N.MIETITORE.minuti[0] * 60, N.MIETITORE.minuti[1] * 60);
      else compareDa(`${NOMI[x.id]}: compare da`, x, r['Compare da']);
    });
  }

  const EL = N.ELITE, MI = N.MIETITORE;
  frase('Élite', '**Élite**: ogni {} s compare un nemico normale potenziato: salute ×{}, danno ×{}, anime ×{}, dimensione ×{}, velocità ×{},', EL.ogni, EL.salute, EL.danno, EL.anime, EL.dimensione, EL.velocita);
  frase('Élite: reliquiari', 'alone ambra. Lascia {p} reliquiario.', EL.reliquiari);
  frase('Élite: dimensione', 'ingrandite × {} anche nel raggio dei contatti', EL.dimensione);
  frase('Seth: cammina', 'cammina verso di te per {}–{} s (al minuto {} per ×{} di quel tempo)', MI.cammina[0], MI.cammina[1], MI.minuti[1], MI.camminaSecondo);
  frase('Seth: danno delle mosse', '(× danno attuale ÷ {})', tipo('mietitore').danno);
  frase('Seth: pausa', 'resta fermo {} s. Lascia {} reliquiari. Al minuto {} ha salute ×{}', MI.riprende, MI.reliquiari, MI.minuti[1], MI.saluteSecondo);

  const mosse = tabella('| Mossa | Peso |');
  const MOSSE = [
    ['Scatto', MI.mosse.scatto, MI.carica, 'scatta per {} s a {} volte la sua velocità', MI.scatto, MI.velocitaScatto],
    ['Falciata', MI.mosse.falciata, MI.falciata.carica, 'un cerchio rosso di raggio {} si accende intorno a lui; allo scadere ferisce di {} chi', MI.falciata.raggio, MI.falciata.danno],
    ['Falci spettrali', MI.mosse.falci, MI.falci.carica, 'lancia {} falci rosse a ventaglio ({} radianti) verso di te: {} px/s, raggio {}, danno {}, durano {} s', MI.falci.quante, MI.falci.ventaglio, MI.falci.velocita, MI.falci.raggio, MI.falci.danno, MI.falci.durata],
    ['Chiamata dei morti', MI.mosse.chiamata, MI.chiamata.carica, '{} segni rossi a terra in cerchio a {} px da te; allo scadere ne escono {} scheletri', MI.chiamata.quanti, MI.chiamata.distanza, MI.chiamata.quanti],
  ];
  stessiNomi('Mosse di Seth', mosse, MOSSE.map((m) => m[0]));
  for (const [nome, peso, preavviso, modello, ...attesi] of MOSSE) {
    conRiga(mosse, nome, (r) => {
      inTesto(r.Peso, `${nome}: peso`, '{}', peso);
      inTesto(r.Preavviso, `${nome}: preavviso`, '{} s', preavviso);
      inTesto(r['Cosa fa'], nome, modello, ...attesi);
    });
  }

  const IA = N.IA;
  frase('IA accerchia', 'girato di lato intorno a te di {}–{} radianti e al {}% della distanza, così arriva dai fianchi; sotto i {} px', IA.accerchia.angolo[0], IA.accerchia.angolo[1], pct(IA.accerchia.stringe), IA.accerchia.vicino);
  frase('IA intercetta', 'fino a {} s in anticipo', IA.intercetta.anticipo);
  frase('IA zig-zag', '(ampiezza {}, {} oscillazioni al secondo', IA.zigzag.ampiezza, IA.zigzag.frequenza);

  const O = N.ORDE;
  frase('Orde', '{} s prima il bordo del campo', O.preavviso);
  frase('Orde: quanti', 'almeno {} e al massimo {}', O.minimo, O.massimo);
  vero('Orde: un terzo', Math.abs(O.parteDelCampo - 1 / 3) < 1e-9, 'nei dati l\'orda non è un terzo del campo');
  frase('Orde: muro', '*muro*, file di {} distanziate di {} raggi', O.perFila, O.spazio);
  frase('Orde: anello', '{} px fuori dal bordo), a +{}% di velocità', N.COMPARSA.margine, pct(O.velocitaAnello - 1));
  frase('Orde: marcia', 'eri quando sono nati, a {} px/s', O.marcia);
  frase('Orde: salute', 'dal minuto {} hanno salute ×{}', O.saluteDal, O.salute);
  const co = tabella('**Il copione delle orde**');
  O.copione.forEach((o) => conRiga(co, String(o.minuto), (r) => vero(`Orda del minuto ${o.minuto}`, r.Forma === o.forma && r.Nemico === o.tipo, `GDD ${r.Forma} ${r.Nemico} ≠ dati ${o.forma} ${o.tipo}`)));
  vero('Copione delle orde', co.righe.length === O.copione.length, `GDD ${co.righe.length} righe ≠ dati ${O.copione.length}`);
  frase('Bruti massimi', 'bruti in campo al massimo {}', N.DIFFICOLTA.brutiMassimi);
  frase('Lumen accorpato', 'entro {} px da una ferma si unisce a lei', PR.ANIME.accorpa);

  // il copione: una riga per minuto, gli stessi nemici e gli stessi pesi
  const copione = tabella('**Il copione della notte**');
  N.COPIONE.forEach((riga, m) => conRiga(copione, `${m}:00`, (r) => {
    const attesi = Object.entries(riga).map(([id, peso]) => `${id} ${peso}`).join(', ');
    vero(`Copione del minuto ${m}`, r.Nemici === attesi, `GDD ${r.Nemici} ≠ dati ${attesi}`);
  }));
  frase('Respiro', 'in ogni ciclo di {} s le comparse sono piene per {} s, poi nella calma scendono al {}%', N.RESPIRO.ciclo, N.RESPIRO.marea, pct(N.RESPIRO.comparse));
}

// --- 7. Difficoltà -----------------------------------------------------------------------------

{
  const F = N.DIFFICOLTA;
  const salute = (m) => 1 + F.salutePerMinuto * m + (m > F.saluteDopo ? F.saluteAccelera * (m - F.saluteDopo) ** 2 : 0);
  frase('Salute nel tempo', 'salute = base × (1 + {} m + {} × (m − {})²), l\'ultimo termine solo dopo il minuto {}', F.salutePerMinuto, F.saluteAccelera, F.saluteDopo, F.saluteDopo);
  const v = estrai(gdd, 'Salute nel tempo', 'Al minuto {} ≈ ×{}, al {} ≈ ×{}');
  if (v) {
    // due esempi di calcolo, arrotondati a una cifra come nel GDD
    const [m1, x1, m2, x2] = v.map(leggi);
    const decimo = (x) => Math.round(x * 10) / 10;
    vero('Salute: esempio', uguali(x1, decimo(salute(m1))), `GDD ×${v[1]} ≠ dati ×${italiano(decimo(salute(m1)))}`);
    vero('Salute: esempio', uguali(x2, decimo(salute(m2))), `GDD ×${v[3]} ≠ dati ×${italiano(decimo(salute(m2)))}`);
  }
  frase('Danno nel tempo', 'danno = base × (1 + {} m)', F.dannoPerMinuto);
  frase('Nemici massimi', 'nemici massimi in campo = min({}, {} + {} m)', F.tetto, F.massimiBase, F.massimiPerMinuto);
  frase('Comparse', 'comparse al secondo = {} + {} m (al massimo {} per fotogramma)', F.comparseBase, F.comparsePerMinuto, F.comparsePerFotogramma);
  frase('Rinforzo', 'Se in campo c\'è meno del {}% del massimo, arrivano {} nemici in più', pct(F.sogliaRinforzo), F.rinforzoPerFotogramma);
}

// --- 8. Drop, fiaschetta, Grazia ---------------------------------------------------------------

{
  const G = OG.DROP;
  const t = tabella('| Oggetto | Fonte | Probabilità |');
  conRiga(t, 'Pane', (r) => {
    inTesto(r['Probabilità'], 'Pane', '{}%, al massimo uno ogni {} s', pct(G.pane.probabilita), G.pane.ogni);
    inTesto(r.Effetto, 'Pane: cura', '+{} salute', G.pane.cura);
  });
  conRiga(t, 'Calamita', (r) => inTesto(r['Probabilità'], 'Calamita', '{}%, al massimo una ogni {} minuti', pct(G.calamita.probabilita), G.calamita.ogni / 60));
  conRiga(t, 'Reliquiario', (r) => {
    inTesto(r.Fonte, 'Reliquiari lasciati', 'élite ({}), Seth ({})', N.ELITE.reliquiari, N.MIETITORE.reliquiari);
    inTesto(r.Effetto, 'Reliquiario', '{} potenziamento ({}%) o {} ({}%)', G.reliquiario.potenziamenti, pct(1 - G.reliquiario.raro), G.reliquiario.potenziamentiRari, pct(G.reliquiario.raro));
    inTesto(r.Effetto, 'Reliquiario: cura', '+{} salute', G.reliquiario.cura);
  });
  frase('Raccolta degli oggetti', 'si raccolgono a {} px dal personaggio, sono disegnati sopra il buio e ingranditi × {}', G.presa, G.ingrandimento);
  const AN = PR.ANIME;
  frase('Colore delle anime', 'rosso sotto {}, ambra da {} a {}, azzurro da {} in su', AN.media, AN.media, AN.grande - 1, AN.grande);
  frase('Volo delle anime', 'volano verso il personaggio a {} px/s, accelerando di {} px/s al secondo; sono raccolte a {} px', AN.volo, AN.accelerazione, AN.presa);
  frase('Anime a terra', 'Al massimo {} anime a terra', AN.massimeATerra);

  const FI = SO.FIASCHETTA, GR = SO.GRAZIA;
  frase('Fiaschetta', '{} sorsi all\'inizio della notte', FI.sorsi);
  frase('Fiaschetta: cura', 'Un sorso cura il {}% della salute massima in {} s', pct(FI.cura), FI.durata);
  frase('Fiaschetta: élite', 'Un\'élite uccisa ridà {} sorso', FI.perElite);
  frase('Fiaschetta: distanza', 'staccata di {} pixel disegnati', FI.distanza);
  frase('Grazia: finestra', 'quando mancavano al massimo {} s al colpo', GR.finestra);
  frase('Grazia: sfioro', '(entro {} px oltre il bordo)', GR.sfioro);
  frase('Grazia: effetto', 'Dura {} s: +{}% danno, +{}% velocità, il personaggio lampeggia di chiaro ({} volte al secondo)', GR.durata, pct(GR.danno), pct(GR.velocita), GR.lampi);
}

// --- 8c. Affinità, stati e reazioni ------------------------------------------------------------

{
  const S = ST.STATI, RZ = ST.REAZIONI, RU = ST.RUOLI;
  frase('Stati', 'uno stato di {} s, nel {}% dei colpi ({}% per nubi, pozze e abilità', S.durata, pct(S.probabilita), pct(S.probabilitaZone));
  frase('Simboli', 'grande il {p} dei suoi', S.simboli.ingrandimento);
  frase('Simboli massimi', 'al massimo {} simboli', S.simboli.massimi);

  const t = tabella('| Affinità | Armi e abilità |');
  const tutte = [...Object.values(A.ARMI_INIZIALI), ...A.ARMI_COMUNI];
  for (const r of t.righe) {
    const aff = r['Affinità'].toLowerCase();
    for (const nome of r['Armi e abilità'].split(', ')) {
      const arma = tutte.find((a) => a.nome === nome), abilita = Object.values(AB.ABILITA).find((a) => a.nome === nome);
      const dato = arma ? ST.AFFINITA_ARMI[arma.id] : abilita ? ST.AFFINITA_ABILITA[abilita.id] : null;
      testoUguale(`Affinità di ${nome}`, aff, dato);
    }
  }
  conRiga(t, 'Luce', (r) => inTesto(r.Effetto, 'Abbagliato', '+{}% danno', pct(S.abbagliato.danno)));
  conRiga(t, 'Sacro', (r) => inTesto(r.Effetto, 'Consacrato', 'più lento del {}% (Seth a {p})', pct(S.consacrato.lento), N.MIETITORE.rallentamento));
  conRiga(t, 'Ombra', (r) => inTesto(r.Effetto, 'Maledetto', 'perde il {}% della salute massima al secondo (élite {}% di questo, Seth {}%)', pct(S.maledetto.perSecondo), pct(S.elite.maledetto), pct(S.mietitore.maledetto)));
  conRiga(t, 'Terra', (r) => inTesto(r.Effetto, 'Sepolto', 'resta fermo {} s; poi per {} s non può esserlo di nuovo', S.sepolto.fermo, S.sepolto.pausa));

  const rz = tabella('| Stati | Reazione |');
  const reazione = (nome, fai) => {
    const r = rz.righe.find((x) => x.Reazione === nome);
    controlli++;
    if (!r) diff.push(`Riga mancante nel GDD: ${nome}`); else fai(r);
  };
  reazione('Eclissi', (r) => inTesto(r.Effetto, 'Eclissi', 'esplosione di {} px; danno = {}% della salute massima del nemico, al massimo {} (Seth sempre {})', RZ.eclissi.raggio, pct(RZ.eclissi.parte), RZ.eclissi.tetto, RZ.eclissi.tetto));
  reazione('Rivelazione', (r) => inTesto(r.Effetto, 'Rivelazione', 'lascia il {p} delle anime', RZ.rivelazione.anime));
  reazione('Esorcismo', (r) => inTesto(r.Effetto, 'Esorcismo', 'partono {} fiammelle che inseguono i vicini ({} danni l\'una)', RZ.esorcismo.fiammelle, RZ.esorcismo.danno));
  reazione('Interramento', (r) => inTesto(r.Effetto, 'Interramento', 'fermo {} s e +{}% danno subito (Seth a {p} durata)', RZ.interramento.fermo, pct(RZ.interramento.danno), S.mietitore.fermo));

  frase('Esplosione del Bastone', 'ferisce in {} px al {}% del danno', RU.esplosioneBastone.raggio, pct(RU.esplosioneBastone.danno));
  frase('Fuoco fatuo: preda', '(li vede {} volte più vicini)', 1 / RU.fuocoFatuoPreda);
  frase('Falce: crescita', 'allunga la lama del {}% per {} s (al massimo +{}%)', pct(RU.falceCrescita.perUccisione), RU.falceCrescita.durata, pct(RU.falceCrescita.massimo));
  frase('Campana: fermo', 'ferma i nemici per {} s', RU.campanaFermo);

  // Stati certi (interruttore di prova del Laboratorio)
  const SC = ST.STATI_CERTI;
  frase('Stati certi: quiete', 'il nemico non può reagire di nuovo per {} s', SC.quiete);
  frase('Stati certi: Eclissi', 'danno = {}% della salute massima, senza tetto, su nemici normali e bruti; su élite e Seth il {p} del danno del colpo', pct(SC.eclissi.parte), SC.eclissi.colpoElite);
  frase('Stati certi: Esorcismo', '**Esorcismo**: {} fiammelle, ognuna al {}% del danno del colpo', SC.esorcismo.fiammelle, pct(SC.esorcismo.colpo));
  frase('Stati certi: Rivelazione', '**Rivelazione**: +{}% anime, almeno +{}', pct(SC.rivelazione.anime), SC.rivelazione.minimo);
  frase('Stati certi: Interramento', 'Luce, +{}% danno subito invece di +{}%; Sacro, fermo {} s; Ombra, la maledizione continua al {p}', pct(SC.interramento.dannoLuce), pct(ST.REAZIONI.interramento.danno), SC.interramento.fermoSacro, SC.interramento.maledettoOmbra);
  frase('Stati certi: cerchi', 'al massimo {} cerchi delle reazioni sullo schermo', SC.cerchiMassimi);
}

// --- 8d. Meta progressione ---------------------------------------------------------------------

{
  const G = OG.DROP.cera;
  frase('Cera a terra', '{}% dei nemici comuni, {} gocce da un\'élite, {} da Seth; ogni goccia vale {}. Più {} per l\'alba.', pct(G.probabilita), G.perElite, G.perSeth, M.CERA.goccia, M.CERA.alba);
  const costi = M.COSTI_CERO, livelli = costi.length;
  const totale = costi.reduce((a, b) => a + b);
  frase('Ceri: costi', `**Ceri votivi**: {} livelli, costo ${costi.map(() => '{}').join(', ')} Cera ({} per cero)`, livelli, ...costi, totale);

  const t = tabella('| Cero | Per livello |');
  stessiNomi('Ceri', t, M.CERI.map((c) => c.nome));
  for (const c of M.CERI) {
    conRiga(t, c.nome, (r) => {
      if (c.id === 'scelta') {
        inTesto(r['Per livello'], `${c.nome}: per livello`, '+{} rimescolata ogni {} livelli', c.per, c.ogniLivelli);
        inTesto(r['Al massimo'], `${c.nome}: massimo`, '+{}', M.rimescolateCero(livelli));
      } else {
        inTesto(r['Per livello'], `${c.nome}: per livello`, c.id === 'rito' ? '−{}%' : '+{}%', pct(c.per));
        inTesto(r['Al massimo'], `${c.nome}: massimo`, c.id === 'rito' ? '−{}%' : '+{}%', pct(c.per) * livelli);
      }
    });
  }
  const SC = M.SECONDA_CANDELA;
  frase('Seconda candela', '**Seconda candela**: {} Cera; una volta per veglia, a salute zero ci si rialza con il {}% della salute e {} s di invulnerabilità', SC.costo, pct(SC.salute), SC.invulnerabilita);
  const primoNumero = (testo) => numero(testo.match(/\d+/)[0]);
  frase('Sblocco personaggi', 'Becchino: sopravvivi {} minuti, oppure {} Cera. Badessa: sconfiggi Seth, oppure {} Cera. Strega: arriva all\'alba, oppure {} Cera.', primoNumero(M.SBLOCCHI.becchino.impresa), M.SBLOCCHI.becchino.cera, M.SBLOCCHI.badessa.cera, M.SBLOCCHI.strega.cera);

  const so = tabella('| Oggetto | Si sblocca |');
  stessiNomi('Sblocchi di armi e doni', so, M.SBLOCCHI_OGGETTI.map((s) => s.nome));
  const sblocco = (id) => M.SBLOCCHI_OGGETTI.find((s) => s.id === id);
  const CONDIZIONI = {
    lapide: () => ['sconfiggi Seth con il Becchino'],
    rosarioSpezzato: (s) => ['fai {} Eclissi', s.soglia],
    corvo: (s) => ['raccogli {} anime', s.soglia],
    veloFunebre: (s) => ['resta {} minuti', s.soglia / 60],
    campanellaDArgento: (s) => ['fai {} schivate perfette in una veglia, oppure {} Cera', s.soglia, s.cera],
    chiodoDiBara: (s) => ['{} Cera', s.cera],
    lacrimaDiLumen: (s) => ['{} Cera', s.cera],
  };
  for (const s of M.SBLOCCHI_OGGETTI) {
    conRiga(so, s.nome, (r) => {
      if (!CONDIZIONI[s.id]) { diff.push(`Sblocco ${s.id}: senza corrispondenza nello script`); return; }
      const [modello, ...attesi] = CONDIZIONI[s.id](sblocco(s.id));
      inTesto(r['Si sblocca'], `Sblocco ${s.nome}`, modello, ...attesi);
    });
  }
}

// --- 8e. Rosario -------------------------------------------------------------------------------

{
  const s = sezione('## 8e.');
  const RO = R.ROSARIO, AN = R.AMULETI_NUMERI;
  const grani = R.AMULETI.map((a) => a.grani);
  inTesto(s, 'Grani', '**Grani**: si parte con {}, +{} per ogni Seth sconfitto in quella veglia (al massimo {}). Ogni amuleto costa da {} a {} grani', RO.grani, RO.perSeth, RO.massimo, Math.min(...grani), Math.max(...grani));
  inTesto(s, 'Amuleti offerti', 'il reliquiario mostra {p} amuleti', RO.proposte);
  inTesto(s, 'Peccato', 'il danno subito {p}', 1 + RO.peccato);
  inTesto(s, 'Sblocco del Rosario', 'con l\'impresa «Sopravvivi {} minuti» oppure con {} Cera', M.SBLOCCO_ROSARIO.minuti, M.SBLOCCO_ROSARIO.cera);

  const t = tabella('| Amuleto | Grani |');
  stessiNomi('Amuleti', t, R.AMULETI.map((a) => a.nome));
  const MODELLI = {
    specchioRotto: [['Vantaggio', '+{} proiettile', AN.specchioRotto.proiettili], ['Rovescio', 'subisci +{}% danno', pct(AN.specchioRotto.dannoSubito)]],
    lanternaCieca: [['Vantaggio', '+{}% danno', pct(AN.lanternaCieca.danno)], ['Rovescio', 'alone di luce al {}%', pct(AN.lanternaCieca.alone)]],
    cuoreAvido: [['Vantaggio', '+{}% anime', pct(AN.cuoreAvido.anime)], ['Rovescio', 'curano la {p}', AN.cuoreAvido.cura]],
    sangueFreddo: [['Vantaggio', 'sotto il {}% di salute, +{}% danno', pct(AN.sangueFreddo.sotto), pct(AN.sangueFreddo.danno)]],
    martire: [['Vantaggio', 'onda sacra di {} px: non ferisce, lascia Consacrato e ferma i nemici per {} s', AN.martire.raggio, AN.martire.fermo], ['Rovescio', '−{}% salute massima', -pct(AN.martire.salute)]],
    danzaMacabra: [['Vantaggio', '(entro {} px) i nemici normali, non più di una ogni {} s', AN.danzaMacabra.sfiora, AN.danzaMacabra.recupero], ['Rovescio', 'la Grazia dura {} s invece di {}', AN.danzaMacabra.durataGrazia, SO.GRAZIA.durata]],
    ceriGemelli: [['Vantaggio', '{} cariche', AN.ceriGemelli.cariche], ['Rovescio', 'ricarica +{}%', pct(AN.ceriGemelli.ricarica)]],
    lucciola: [['Vantaggio', 'alone di luce +{}%', pct(AN.lucciola.alone)], ['Vantaggio', 'non più di una volta ogni {} s', AN.lucciola.pausa]],
    ossaDelite: [['Vantaggio', 'lasciano {} reliquiari', AN.ossaDelite.reliquiari], ['Rovescio', '+{}% salute', pct(AN.ossaDelite.salute)]],
    pattoDiSangue: [['Vantaggio', 'cura {} di salute', AN.pattoDiSangue.cura]],
  };
  for (const a of R.AMULETI) {
    conRiga(t, a.nome, (r) => {
      inTesto(r.Grani, `${a.nome}: grani`, '{}', a.grani);
      if (!MODELLI[a.id]) { diff.push(`Amuleto ${a.id}: senza corrispondenza nello script`); return; }
      for (const [col, modello, ...attesi] of MODELLI[a.id]) inTesto(r[col], a.nome, modello, ...attesi);
    });
  }
}

// --- 8f. Unioni --------------------------------------------------------------------------------

{
  const s = sezione('## 8f.');
  inTesto(s, 'Unioni: requisiti', 'Un\'arma al livello {} più il suo dono al livello massimo', U.LIVELLO_ARMA_UNIONE);
  inTesto(s, 'Unioni: l\'arma continua', 'continua a salire fino al livello {}', PR.CARTE.livelloMassimo);
  inTesto(s, 'Unioni: amuleti offerti', 'con l\'unione gli amuleti offerti scendono a {}', R.ROSARIO.proposteConUnione);
  testoUguale('Sblocco delle Unioni', /si sbloccano con l'impresa «([^»]+)»/.exec(s)?.[1] ?? 'frase non trovata', M.SBLOCCO_UNIONI.impresa);

  const t = tabella('| Arma | + Dono |');
  const armi = [...Object.values(A.ARMI_INIZIALI), ...A.ARMI_COMUNI];
  const NU = U.NUMERI_UNIONI;
  const MODELLI = {
    faroDeiMorti: ['abbaglia un nemico su {p}', 1 / NU.faro.abbaglia],
    vangaDelCustode: ['resta fermo {} s (Seth a {p}); poi la Vanga non può fermarlo di nuovo per {} s', NU.vanga.fermo, ST.STATI.mietitore.fermo, ST.STATI.sepolto.pausa],
    incensiereUltimaOra: ['+{} salute al secondo', NU.incensiere.cura],
    vergaDeiNomi: ['ogni {}ª raffica colpisce tutti i maledetti sullo schermo, con il danno di {p} dardo', NU.verga.ogni, NU.verga.danno],
    candelabroFunebre: ['una fiamma ogni {} s, {} px, {} s, {}% del danno ogni {} s', NU.candelabro.ogni, NU.candelabro.raggio, NU.candelabro.durata, pct(NU.candelabro.danno), NU.candelabro.intervallo],
    falceDelMietitore: ['sotto il {}% di salute', pct(NU.falce.sotto)],
    campanaAMorto: ['ferma per {} s', NU.campana.fermo],
    fuochiErranti: ['entro {} px', NU.fuochi.raggio],
    acquasantiera: ['ogni {} uccisioni nelle pozze torna un sorso, al massimo uno ogni {} s; con la fiaschetta piena il sorso si versa nella pozza dove è morto il nemico, che per {} s cura il {}% della salute massima al secondo', NU.acquasantiera.uccisioni, NU.acquasantiera.pausa, NU.acquasantiera.curaDurata, pct(NU.acquasantiera.curaParte)],
    lamaDellAlba: ['da dove eri {} s prima', NU.lama.ritardo],
  };
  stessiNomi('Unioni', t, U.UNIONI.map((u) => armi.find((a) => a.id === u.arma).nome));
  for (const u of U.UNIONI) {
    const arma = armi.find((a) => a.id === u.arma), dono = DO.PASSIVI.find((d) => d.id === u.dono);
    conRiga(t, arma.nome, (r) => {
      testoUguale(`Unione di ${arma.nome}: dono`, r['+ Dono'], dono.nome);
      testoUguale(`Unione di ${arma.nome}: nome`, r['Arma unita'], u.nome);
      if (!MODELLI[u.id]) { diff.push(`Unione ${u.id}: senza corrispondenza nello script`); return; }
      const [modello, ...attesi] = MODELLI[u.id];
      inTesto(r.Effetto, u.nome, modello, ...attesi);
    });
  }
}

// --- 9. Esperienza e doni ----------------------------------------------------------------------

{
  const L = PR.LIVELLI, C = PR.CARTE;
  frase('Anime per livello', 'Anime per passare dal livello L al successivo: {} + {} L + L²', L.base, L.perLivello);
  const valori = righeGdd.find((l) => l.includes('Valori: livello'));
  vero('Anime per livello', !!valori, 'manca la riga dei valori');
  for (const m of (valori ?? '').matchAll(/livello (\d+): (\d+)/g)) {
    vero(`Anime al livello ${m[1]}`, numero(m[2]) === PR.animePerLivello(numero(m[1])), `GDD ${m[2]} ≠ dati ${PR.animePerLivello(numero(m[1]))}`);
  }
  frase('Carte', 'Ogni livello mostra {} carte', C.quante);
  frase('Peso arma posseduta', 'arma posseduta {} (l\'arma iniziale {})', C.armaPosseduta, C.armaIniziale);
  frase('Peso arma nuova', 'arma nuova {}\n', C.armaNuova);
  frase('Peso dono posseduto', 'dono posseduto {}\n', C.donoPosseduto);
  frase('Peso dono nuovo', 'dono nuovo {}\n', C.donoNuovo);
  frase('Rimescolate', '{} rimescolate per partita', C.rimescolate);
  frase('Pane e vino', '«Pane e vino» (+{} salute)', C.paneEVino);
}

// --- 10. Combattimento -------------------------------------------------------------------------

{
  const t = tabella('| Regola | Valore |');
  const CB = N.COMBATTIMENTO, CO = A.COLPI;
  const REGOLE = [
    ['Danno inflitto', 'caso tra {} e {}', CO.casoMinimo, CO.casoMassimo],
    ['Danno subito', 'al massimo {}%', pct(P.BASE.armaturaMassima)],
    ['Invulnerabilità', '{} s', CB.invulnerabilita],
    ['Raggio del giocatore', '{} px', CB.raggioGiocatore],
    ['Respinta', 'attrito {} al secondo', CO.attrito],
    ['Respinta', 'la subiscono a {p}', CO.respintaPesanti],
    ['Lampo del nemico', '{} s (2 passi', CO.lampoNemico],
    ['Lampo del nemico', 'un lampo ogni {} s', CO.lampoNemicoPausa],
    ['Lampo del nemico', 'si schiariscono del {}%', pct(CO.lampoNemicoPesanti)],
    ['Punto da cui partono', '{} px', CO.corpo],
    ['Salute bassa', 'sotto il {}%', pct(CB.saluteBassa)],
  ];
  for (const [nome, modello, ...attesi] of REGOLE) conRiga(t, nome, (r) => inTesto(r.Valore, nome, modello, ...attesi));
}

// --- 11. Interfaccia, mondo e impatto dei colpi --------------------------------------------------

{
  frase('Limite dei numeri del danno', 'al massimo {} numeri del danno sullo schermo', E.EFFETTI.numeri.massimo);
  frase('Somma dei numeri', 'i colpi entro {} s si sommano in un solo numero, {} px sopra la cima dello sprite', E.EFFETTI.numeri.somma.finestra, E.EFFETTI.numeri.somma.sopra);
  frase('Nomi delle reazioni', 'ingrandito × {}, nel colore dello stato', ST.REAZIONI.etichetta.ingrandimento);
  frase('Nomi delle reazioni', 'Lo stesso nome torna al massimo ogni {} s, al massimo {} nomi sullo schermo', ST.REAZIONI.etichetta.pausa, ST.REAZIONI.etichetta.massimi);
  frase('Nomi delle reazioni', 'fuori da {} px intorno al personaggio', ST.REAZIONI.etichetta.lontano);
  frase('Simboli degli stati', 'al massimo {} simboli sullo schermo', ST.STATI.simboli.massimi);
  frase('Avvisi', 'Durano {} s, compresi {} s di dissolvenza', H.AVVISO.durata, H.AVVISO.dissolvenza);
  frase('Avvisi', 'mai sotto × {}: sui telefoni', H.AVVISO.minimo);

  const mondo = tabella('### Mondo, luce e comandi');
  const LU = W.LUCE, TE = W.TERRENO, JO = W.JOYSTICK;
  const RIGHE_MONDO = [
    ['Pixel di gioco', 'Numero', '{} in verticale, {} in orizzontale', PX.ALTEZZA_MINIMA, PX.LARGHEZZA_MINIMA],
    ['Raggio della luce', 'Numero', '{}', LU.raggio],
    ['Sfumatura del buio', 'Numero', '{}', LU.sfumatura],
    ['Buio massimo', 'Numero', '{}% dei pixel', pct(LU.buioMassimo)],
    ['Centro della luce', 'Numero', '{} px sopra i piedi', LU.altezza],
    ['Tremolio', 'Numero', '±{} px ogni {} s', LU.tremolio, LU.intervalloTremolio],
    ['Terreno', 'Numero', 'riquadro di {} px che si ripete, celle di {} px', TE.lato, TE.cella],
    ['Terreno', 'Note', 'tombe {}%, croci {}%, erba {}% per cella', pct(TE.tombe), pct(TE.croci), pct(TE.erba)],
    ['Joystick', 'Numero', 'raggio {} px dello schermo, zona morta {}%', JO.raggio, pct(JO.zonaMorta)],
  ];
  for (const [nome, col, modello, ...attesi] of RIGHE_MONDO) conRiga(mondo, nome, (r) => inTesto(r[col], nome, modello, ...attesi));

  const campo = tabella('### Nemici in campo');
  const CP = N.COMPARSA, SP = N.SEPARAZIONE, CB = N.COMBATTIMENTO;
  const RIGHE_CAMPO = [
    ['Dove nascono', 'Numero', '{} px fuori dal bordo', CP.margine],
    ['Ricollocamento', 'Numero', 'oltre {} × {} px', CP.lontananza, CP.margine],
    ['Ricollocamento', 'Note', 'entro ±{} radianti', CP.ventaglio],
    ['Separazione', 'Numero', 'forza {}; si toccano sotto il {}%', SP.forza, pct(SP.tolleranza)],
    ['Sprite segnaposto', 'Numero', 'ingranditi × {}', W.INGRANDIMENTO_SEGNAPOSTO],
    ['Barra della salute', 'Numero', 'rettangolo rosso {} × {} pixel, {} px sotto i piedi', W.BARRA_SALUTE.larghezza, W.BARRA_SALUTE.altezza, W.BARRA_SALUTE.distanza],
    ['Lampo quando sei colpito', 'Numero', '{} s', CB.lampo],
    ['Dalla morte', 'Numero', '{} s', CB.attesaFine],
  ];
  for (const [nome, col, modello, ...attesi] of RIGHE_CAMPO) conRiga(campo, nome, (r) => inTesto(r[col], nome, modello, ...attesi));

  const impatto = tabella('### Impatto dei colpi');
  const EF = E.EFFETTI, RE = ST.REAZIONI.etichetta;
  const RIGHE_IMPATTO = [
    ['Numeri del danno', 'Numero', 'durano {} s, salgono di {} px, cifre {?}×{?} ingrandite × {}', EF.numeri.durata, EF.numeri.salita, EF.numeri.ingrandimento],
    ['Numero delle reazioni', 'Note', 'mai entro {} px dal personaggio', RE.lontano],
    ['Numero delle reazioni', 'Note', 'sta {} px più in alto del numero', RE.staccoNumero],
    ['Scoppio', 'Numero', '{} s', EF.scoppio.durata],
    ['Arco della Lanterna', 'Numero', '{} s, spessore {} px', EF.arco.durata, EF.arco.spessore],
    ['Impatto della pala', 'Numero', '{} s; scossa dello schermo di {} px per {} s', EF.impattoPala, EF.scossaPala.forza, EF.scossaPala.durata],
    ['Esplosione dei dardi', 'Numero', '{} s', EF.esplosione],
    ['Anime a terra', 'Numero', 'ingranditi × {}', PR.ANIME.ingrandimento],
  ];
  for (const [nome, col, modello, ...attesi] of RIGHE_IMPATTO) conRiga(impatto, nome, (r) => inTesto(r[col], nome, modello, ...attesi));
}

// Numeri del GDD che non stanno in src/data/ e quindi non si confrontano ({?} nei modelli, oppure frasi non controllate):
// - Numeri del danno: cifre 3×5, sono la forma del disegno;
// - misure dei disegni citate nel testo (fiala 45×74, simboli 11×11) e scala 2,35 con i valori della v0, che sono storia;
// - «Barre su 6»: è scritto solo nella scheda.

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Controlli fatti: ${controlli}`);
console.log(`Differenze: ${diff.length}`);
diff.forEach((d) => console.log('- ' + d));
if (diff.length) {
  console.log('\nIl GDD e i dati del gioco non coincidono: la tappa non è finita.');
  process.exit(1);
}
