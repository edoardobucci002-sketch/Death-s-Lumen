// Simulazione di bilanciamento: il bot gioca la notte intera con ogni personaggio, su più semi,
// nel gioco vero (build in dist/) dentro un browser invisibile con lo schermo di un telefono Android.
// Stampa a che minuto muore, il livello minuto per minuto e quanto fa male il Mietitore, e controlla gli obiettivi
// di CLAUDE.md. Risultati completi in prove/sim.json.
// Uso: npm run sim            (3 partite per personaggio)
//      npm run sim -- 5       (5 partite per personaggio)
//      npm run sim -- 3 strega,becchino
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const PERSONAGGI = ['lampionaio', 'becchino', 'badessa', 'strega'];
const partite = Number(process.argv[2]) || 3;
const scelti = process.argv[3] ? process.argv[3].split(',') : PERSONAGGI;
const INSIEME = 4; // partite in parallelo: di più non conviene con 8 GB di RAM
const porta = 4320;

const server = spawn('npx', ['vite', 'preview', '--port', String(porta), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const inizio = Date.now();

const coda = [];
for (const pg of scelti) for (let k = 0; k < partite; k++) coda.push({ pg, seme: 1001 + k });
const totale = coda.length;
const risultati = [];
let fatte = 0;

async function gioca({ pg, seme }) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block' });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`http://localhost:${porta}/?pg=${pg}&seme=${seme}&bot`);
  await pag.waitForFunction(() => window.__sim, null, { timeout: 10 * 60_000, polling: 1000 }).catch(() => errori.push('la partita non finisce'));
  const r = await pag.evaluate(() => window.__sim ?? null);
  await ctx.close();
  fatte++;
  const esito = !r ? 'errore' : r.vittoria ? 'alba' : `morto a ${tempo(r.secondi)}`;
  console.log(`  [${fatte}/${totale}] ${pg.padEnd(10)} seme ${seme}: ${esito}, livello ${r?.livello ?? '?'}${errori.length ? '  errori: ' + errori.join(' | ') : ''}`);
  risultati.push({ pg, seme, ...r, errori });
}

console.log(`Simulazione: ${partite} partite per ${scelti.join(', ')}\n`);
const lavori = [];
for (let n = 0; n < INSIEME; n++) {
  lavori.push((async () => {
    while (coda.length) await gioca(coda.shift());
  })());
}
await Promise.all(lavori);
await browser.close();
server.kill();

// ——— riepilogo ———
function tempo(s) {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}
const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

console.log('\nLivello alla fine di ogni minuto (media; – = tutti morti prima)');
console.log('             ' + Array.from({ length: 15 }, (_, m) => String(m + 1).padStart(4)).join(''));
for (const pg of scelti) {
  const rr = risultati.filter((r) => r.pg === pg && r.minuti);
  const riga = Array.from({ length: 15 }, (_, m) => {
    const v = rr.map((r) => r.minuti[m]?.livello).filter((x) => x !== undefined);
    return (v.length ? String(Math.round(media(v))) : '–').padStart(4);
  });
  console.log(pg.padEnd(13) + riga.join(''));
}

console.log('\nPer personaggio');
const problemi = [];
for (const pg of scelti) {
  const rr = risultati.filter((r) => r.pg === pg && r.minuti);
  const vinte = rr.filter((r) => r.vittoria);
  const morti = rr.filter((r) => !r.vittoria).map((r) => r.secondi);
  const conM5 = rr.filter((r) => r.mietitori[0]);
  const m5 = conM5.map((r) => r.mietitori[0]);
  const uccisoM5 = m5.filter((m) => m.morte !== null).map((m) => m.morte - m.arrivo);
  // danno al minuto prima del Mietitore (minuti 2-5) e durante il Mietitore del minuto 5 (finché è in campo)
  const primaAlMinuto = media(rr.flatMap((r) => r.minuti.slice(1, 5).map((m) => m.dannoSubito)));
  const durante = media(conM5.map((r) => {
    const m = r.mietitori[0];
    const fine = m.morte ?? Math.min(r.secondi, (r.mietitori[1]?.arrivo ?? r.secondi));
    return m.dannoSubito / Math.max(1 / 6, (fine - m.arrivo) / 60);
  }));
  const saluteMinima = media(vinte.map((r) => Math.min(...r.minuti.map((m) => m.saluteMinima))));
  console.log(`  ${pg}: vince ${vinte.length}/${rr.length}` +
    (morti.length ? `, muore in media a ${tempo(media(morti))} (${morti.map(tempo).join(', ')})` : '') +
    `\n     Mietitore del 5: ucciso in ${uccisoM5.length}/${m5.length}` + (uccisoM5.length ? ` dopo ${Math.round(media(uccisoM5))} s in media` : '') +
    `; danno subito al minuto ${Math.round(primaAlMinuto)} prima, ${Math.round(durante)} durante` +
    (vinte.length ? `\n     nelle vittorie la salute più bassa è stata in media ${Math.round(saluteMinima)}` : ''));
  if (rr.length && vinte.length === rr.length && saluteMinima > 50) problemi.push(`${pg} vince sempre senza sforzo (salute mai sotto ${Math.round(saluteMinima)})`);
  if (rr.length && morti.length === rr.length && Math.max(...morti) < 300) problemi.push(`${pg} muore sempre prima del minuto 5`);
  if (m5.length && !(durante > primaAlMinuto)) problemi.push(`per ${pg} il Mietitore del 5 non fa più male dei minuti prima`);
}

console.log('\nObiettivi (CLAUDE.md, «Verifica»)');
if (!problemi.length) console.log('  ✓ tutti rispettati');
for (const p of problemi) console.log('  ✗ ' + p);
const errate = risultati.filter((r) => r.errori.length || !r.minuti).length;
if (errate) console.log(`  ✗ ${errate} partite con errori`);

mkdirSync('prove', { recursive: true });
writeFileSync('prove/sim.json', JSON.stringify(risultati, null, 1));
console.log(`\n${totale} partite in ${Math.round((Date.now() - inizio) / 1000)} s. Dettagli in prove/sim.json`);
