// Esporta da Aseprite tutti gli sprite del gioco.
//
// Cerca i file .aseprite nelle cartelle PERSONAGGI, NEMICI, EFFETTI e OGGETTI della
// cartella principale "DEATH'S LUMEN" (per default la cartella che contiene questo repository).
// Per ogni sprite usa la versione più alta: La_Badessa_V3.aseprite batte La_Badessa_V2.aseprite.
// Cerca anche in segnaposto/ (stesse sottocartelle): gli sprite provvisori hanno la versione V0,
// quindi il primo file vero di Edoardo (V1 o più) li sostituisce da solo.
// Convenzione: Nome_V#.aseprite è il ritratto della selezione, Nome_ingame_V# lo sprite in gioco.
// Produce in public/assets/<categoria>/ un PNG con tutti i fotogrammi e un JSON con i tag,
// più public/assets/elenco.json che il gioco legge all'avvio.
//
// Uso:  npm run asset
// Opzioni (variabili d'ambiente):
//   DL_ARTE=/percorso/a/DEATH'S LUMEN   cartella principale degli sprite
//   ASEPRITE=/percorso/ad/aseprite      programma Aseprite (riga di comando)
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arte = resolve(process.env.DL_ARTE ?? join(repo, '..'));
const CATEGORIE = { PERSONAGGI: 'personaggi', NEMICI: 'nemici', EFFETTI: 'effetti', OGGETTI: 'oggetti' };
const TAG_AMMESSI = ['idle', 'walk', 'attack', 'special', 'hurt', 'death'];
const NOME = /^(.+)_V(\d+)\.aseprite$/i;

function trovaAseprite() {
  const candidati = [
    process.env.ASEPRITE,
    '/Applications/Aseprite.app/Contents/MacOS/aseprite',
    join(process.env.HOME ?? '', 'Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite'),
    'C:/Program Files/Aseprite/Aseprite.exe',
    'C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe',
  ].filter(Boolean);
  for (const c of candidati) if (existsSync(c)) return c;
  try {
    execFileSync('aseprite', ['--version'], { stdio: 'ignore' });
    return 'aseprite';
  } catch {
    return null;
  }
}

function cerca(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) cerca(p, out);
    else if (NOME.test(n)) out.push(p);
  }
  return out;
}

const aseprite = trovaAseprite();
if (!aseprite) {
  console.error("Non trovo Aseprite. Se è installato altrove, lancia: ASEPRITE=\"/percorso/aseprite\" npm run asset");
  process.exit(1);
}
console.log(`Aseprite: ${aseprite}\nSprite da: ${arte}\n`);

// versione più alta per ogni sprite
const scelti = new Map();
for (const radice of [arte, join(repo, 'segnaposto')]) {
  for (const [cartella, categoria] of Object.entries(CATEGORIE)) {
    const dir = join(radice, cartella);
    if (!existsSync(dir)) continue;
    for (const p of cerca(dir)) {
      const [, chiave, v] = basename(p).match(NOME);
      const id = `${categoria}/${chiave}`;
      const versione = Number(v);
      if (!scelti.has(id) || scelti.get(id).versione < versione) scelti.set(id, { chiave, categoria, versione, p });
    }
  }
}
if (!scelti.size) {
  console.error(`Nessun file Nome_V#.aseprite trovato in ${Object.keys(CATEGORIE).join(', ')} dentro ${arte}`);
  process.exit(1);
}

const dest = join(repo, 'public', 'assets');
for (const c of Object.values(CATEGORIE)) rmSync(join(dest, c), { recursive: true, force: true });
const elenco = { versione: 1, asset: [] };
const avvisi = [];
for (const s of [...scelti.values()].sort((a, b) => a.chiave.localeCompare(b.chiave))) {
  const cartella = join(dest, s.categoria);
  mkdirSync(cartella, { recursive: true });
  const png = join(cartella, `${s.chiave}.png`);
  const json = join(cartella, `${s.chiave}.json`);
  execFileSync(aseprite, ['-b', s.p, '--sheet', png, '--sheet-type', 'packed', '--data', json,
    '--format', 'json-array', '--list-tags', '--trim', '--shape-padding', '1', '--filename-format', '{frame}'], { stdio: 'inherit' });
  const dati = JSON.parse(readFileSync(json, 'utf8'));
  dati.meta.image = `${s.chiave}.png`;
  writeFileSync(json, JSON.stringify(dati));
  const tag = (dati.meta.frameTags ?? []).map((t) => t.name);
  const strani = tag.filter((t) => !TAG_AMMESSI.includes(t));
  if (!tag.length) avvisi.push(`${s.chiave}: nessun tag di animazione`);
  if (strani.length) avvisi.push(`${s.chiave}: tag non previsti ${strani.join(', ')} (ammessi: ${TAG_AMMESSI.join(', ')})`);
  elenco.asset.push({ chiave: s.chiave, categoria: s.categoria, immagine: `assets/${s.categoria}/${s.chiave}.png`,
    dati: `assets/${s.categoria}/${s.chiave}.json`, versioneFile: s.versione, tag });
  console.log(`✓ ${s.categoria}/${s.chiave} (V${s.versione}${s.versione === 0 ? ', segnaposto' : ''}) · ${tag.join(', ') || 'nessun tag'}`);
}
writeFileSync(join(dest, 'elenco.json'), JSON.stringify(elenco, null, 2));
console.log(`\n${elenco.asset.length} sprite esportati in public/assets.`);
if (avvisi.length) console.log('\nDa controllare:\n- ' + avvisi.join('\n- '));
