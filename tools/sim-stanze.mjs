// Simulazione del gioco a stanze: il bot (src/sistema/bot-stanze.ts) gioca tante Veglie, ognuna con un seme diverso
// (mappa, ondate e carte diverse: dal 17/11 esplora la mappa del Mondo, il Campanaro per ultimo, poi il Boss: dal 18/11
// Seth), e alla fine c'è un riepilogo: quante volte arriva al Boss e batte Seth, quanto dura la battaglia, in che stanza e a che distanza dall'ingresso muore, quanto danno
// prende in ogni stanza, quanto conta ogni arma. Serve a provare e bilanciare i numeri (intervalli del danno, salute dei
// nemici, ondate). Il risultato completo va in prove/sim-stanze.json.
// Uso:
//      npm run sim-stanze              (24 partite: metà con le carte preferite, metà con carte e porte a caso)
//      npm run sim-stanze -- 48        (48 partite)
//      npm run sim-stanze -- 24 esplora   (tutte con carte e porte a caso: provano tutti gli Echi)
//      npm run sim-stanze -- 24 scelte    (tutte con le carte preferite)
//      npm run sim-stanze -- 8 potenziali (8 partite per ogni Eco, che parte già al livello 5, il suo potenziale)
//      npm run sim-stanze -- 4 unioni     (per ogni Unione 4 partite che partono con arma al 4 e dono al massimo già unita,
//                                          e 4 con la stessa build senza Unione, per confrontare: 19/11)
// Il bot non è perfetto: vede gli avvisi solo dopo un tempo di reazione (BOT_STANZE in src/data/bot.ts).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const argomenti = process.argv.slice(2);
const partite = Number(argomenti.find((a) => /^\d+$/.test(a))) || 24;
const modo = argomenti.includes('unioni') ? 'unioni' : argomenti.includes('potenziali') ? 'potenziali' : argomenti.includes('esplora') ? 'esplora' : argomenti.includes('scelte') ? 'scelte' : 'misto';
const UNIONI = ['candelabroFunebre', 'falceDelMietitore', 'campanaAMorto', 'acquasantiera', 'lapideInchiodata', 'rosarioDeiVespri', 'sudario', 'selciato', 'faroDeiMorti', 'fuochiErranti', 'stormoDelLutto', 'midolloSplendente'];
const ARMA_UNIONE = { candelabroFunebre: 'candela', falceDelMietitore: 'falce', campanaAMorto: 'campana', acquasantiera: 'acquaSanta', lapideInchiodata: 'lapide', rosarioDeiVespri: 'rosarioSpezzato', sudario: 'veloFunebre', selciato: 'sampietrini', faroDeiMorti: 'lanterna', fuochiErranti: 'fuocoFatuo', stormoDelLutto: 'corvo', midolloSplendente: 'lamaDiLuce' };
const ECHI = ['candela', 'falce', 'campana', 'fuocoFatuo', 'acquaSanta', 'lamaDiLuce', 'lapide', 'rosarioSpezzato', 'corvo', 'veloFunebre', 'sampietrini'];
const INSIEME = 4; // partite in parallelo: di più non conviene con 8 GB di RAM
const porta = Number(process.env.DL_PORTA) || 4321;

const server = spawn('npx', ['vite', 'preview', '--port', String(porta), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const inizio = Date.now();

const coda = [];
if (modo === 'unioni') for (const unione of UNIONI) for (let k = 0; k < partite; k++) for (const unita of [true, false]) coda.push({ seme: 2001 + k, esplora: false, unione, unita });
else if (modo === 'potenziali') for (const eco of ECHI) for (let k = 0; k < partite; k++) coda.push({ seme: 2001 + k, esplora: false, eco });
else for (let k = 0; k < partite; k++) coda.push({ seme: 2001 + k, esplora: modo === 'esplora' || (modo === 'misto' && k % 2 === 1) });
const totale = coda.length;
const risultati = [];
let fatte = 0;

async function gioca({ seme, esplora, eco, unione, unita }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`http://localhost:${porta}/?stanze&bot&seme=${seme}${esplora ? '&esplora=1' : ''}${eco ? `&potenziale=${eco}` : ''}${unione ? `&unione=${unione}${unita ? '' : '&unita=0'}` : ''}`);
  await pag.waitForFunction(() => window.__sim, null, { timeout: 5 * 60_000, polling: 500 }).catch(() => errori.push('la partita non finisce'));
  const r = await pag.evaluate(() => window.__sim ?? null);
  await ctx.close();
  fatte++;
  const ultima = r?.stanze?.at(-1);
  const esito = !r ? 'errore' : r.completata ? `battuto Seth dopo ${r.stanza} stanze (${ultima?.secondi ?? '?'} s contro di lui), salute ${r.salute}` : `caduto nella stanza ${r.stanza} (${ultima?.tipo === 'campanaro' ? 'Campanaro, ' : ultima?.tipo === 'boss' ? 'Seth, ' : ''}a ${ultima?.distanza ?? '?'} porte dall'ingresso)`;
  console.log(`  [${fatte}/${totale}] seme ${seme}${esplora ? ' (esplora)' : ''}${eco ? ` (${eco} al 5)` : ''}${unione ? ` (${unione}${unita ? '' : ', senza unirla'})` : ''}: ${esito}, ${r?.secondi ?? '?'} s${errori.length ? '  errori: ' + errori.join(' | ') : ''}`);
  risultati.push({ seme, esplora, eco, unione, unita, ...r, errori });
}

console.log(`Simulazione del gioco a stanze: ${totale} partite (${modo === 'unioni' ? `${partite} per ogni Unione, unita e no` : modo === 'potenziali' ? `${partite} per ogni Eco al livello 5` : modo === 'misto' ? 'metà carte preferite, metà a caso' : modo === 'esplora' ? 'carte e porte a caso' : 'carte preferite'})\n`);
await Promise.all(Array.from({ length: INSIEME }, async () => {
  while (coda.length) await gioca(coda.shift());
}));
await browser.close();
server.kill();

// ——— riepilogo ———
const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const ok = risultati.filter((r) => r.stanze);
const fini = ok.filter((r) => r.completata), alBoss = ok.filter((r) => r.stanze.some((s) => s.tipo === 'boss'));
const contro = alBoss.map((r) => r.stanze.find((s) => s.tipo === 'boss'));
console.log(`\nArrivati al Boss: ${alBoss.length}/${ok.length}` + (alBoss.length ? `, con salute media ${Math.round(media(contro.map((s) => s.saluteEntrata)))} all'ingresso` : ''));
const vinte = contro.filter((s) => s.saluteUscita !== null);
console.log(`Battuto Seth: ${fini.length}/${ok.length}` + (vinte.length ? `, in ${Math.round(media(vinte.map((s) => s.secondi)))} s in media (da ${Math.round(Math.min(...vinte.map((s) => s.secondi)))} a ${Math.round(Math.max(...vinte.map((s) => s.secondi)))})` : '') + (fini.length ? `, con salute media ${Math.round(media(fini.map((r) => r.salute)))} (la più bassa durante la partita: ${Math.round(media(fini.map((r) => r.saluteMinima)))} in media)` : ''));
const stanzeTot = Math.max(...ok.map((r) => r.stanze.length), 0);
console.log('\nPer stanza combattuta (in ordine)   distanza  arrivati  caduti  secondi  danno subito  salute all\'uscita');
for (let n = 1; n <= stanzeTot; n++) {
  const qui = ok.map((r) => r.stanze.find((s) => s.stanza === n)).filter(Boolean);
  const usciti = qui.filter((s) => s.saluteUscita !== null);
  console.log(`  stanza ${n}`.padEnd(28) + media(qui.map((s) => s.distanza)).toFixed(1).padStart(16) + String(qui.length).padStart(10) + String(qui.length - usciti.length).padStart(8) +
    String(Math.round(media(qui.map((s) => s.secondi)))).padStart(9) + String(Math.round(media(qui.map((s) => s.dannoSubito)))).padStart(14) +
    String(usciti.length ? Math.round(media(usciti.map((s) => s.saluteUscita))) : '–').padStart(19));
}
console.log(`\nTesoro aperto in ${ok.filter((r) => r.tesoro).length} partite su ${ok.length}, Sosta usata in ${ok.filter((r) => r.sosta).length} (18/11)`);
console.log(`\nA partita: ${media(ok.map((r) => r.uccisi)).toFixed(1)} nemici battuti, ${media(ok.map((r) => r.rinascite)).toFixed(1)} Ricaduti rialzati, ` +
  `${media(ok.map((r) => r.schivate)).toFixed(1)} schivate perfette, ${media(ok.map((r) => r.colpiLanterna)).toFixed(0)} colpi della Lanterna, ${media(ok.map((r) => r.usiAbilita)).toFixed(1)} Cerchi di luce`);

// rarità (17/11): quante carte di ogni grado ha visto e preso il bot
const GR = ['fioca', 'chiara', 'ardente'], NOMI_GR = { fioca: 'Fioca', chiara: 'Chiara', ardente: 'Ardente' };
const somma = (k, g) => ok.reduce((t, r) => t + (r.gradi?.[k]?.[g] ?? 0), 0);
const tot = (k) => GR.reduce((t, g) => t + somma(k, g), 0);
if (tot('offerte')) console.log(`\nCarte per grado (viste / prese): ${GR.map((g) => `${NOMI_GR[g]} ${Math.round((100 * somma('offerte', g)) / tot('offerte'))}% / ${Math.round((100 * somma('scelte', g)) / Math.max(1, tot('scelte')))}%`).join(', ')} su ${tot('offerte')} carte viste`);

// le Unioni (19/11): in quante partite la carta è comparsa, quali ha preso il bot e in che stanza, cura dello Stormo del lutto
const conUnione = ok.filter((r) => r.unioni?.prese?.length), prese = {};
for (const r of conUnione) for (const u of r.unioni.prese) (prese[u.nome] ??= []).push(u.stanza);
console.log(`\nUnioni: la carta è comparsa in ${ok.filter((r) => r.unioni?.offerte).length} partite su ${ok.length}, presa in ${conUnione.length}` +
  (conUnione.length ? ` (${Object.entries(prese).map(([n, st]) => `${n} ${st.length}×, stanza ${Math.round(media(st))} in media`).join('; ')})` : '') +
  (ok.some((r) => r.unioni?.curaLutto) ? `; Stormo del lutto: ${Math.round(media(ok.filter((r) => r.unioni?.curaLutto).map((r) => r.unioni.curaLutto)))} salute curata a partita` : ''));
const vinteCon = conUnione.filter((r) => r.completata).length, senza = ok.filter((r) => !r.unioni?.prese?.length);
if (conUnione.length) console.log(`  Seth battuto: ${vinteCon}/${conUnione.length} con un'Unione, ${senza.filter((r) => r.completata).length}/${senza.length} senza`);

// quanto conta ogni arma: la sua parte del danno, nelle partite in cui c'era
const NOMI = { lanterna: 'Lanterna', abilita: 'Cerchio di luce', candela: 'Candela', falce: 'Falce', campana: 'Campana', fuocoFatuo: 'Fuoco fatuo', acquaSanta: 'Acqua santa', lamaDiLuce: 'Abbacinio', lapide: 'Lapide', rosarioSpezzato: 'Rosario spezzato', corvo: 'Corvo', veloFunebre: 'Velo funebre', sampietrini: 'Sampietrini', eclissi: 'Eclissi', esorcismo: 'Esorcismo', interramento: 'Interramento', fuoco: 'Fuoco', martire: 'Martire' };
const fonti = new Set(ok.flatMap((r) => Object.keys(r.danno)));
const righe = [...fonti].map((f) => {
  const con = ok.filter((r) => r.danno[f]);
  const parte = con.map((r) => r.danno[f] / Object.values(r.danno).reduce((x, y) => x + y, 0));
  return { f, partite: con.length, parte: media(parte), danno: media(con.map((r) => r.danno[f] / r.secondi)) };
}).sort((a, b) => b.parte - a.parte);
console.log('\nDanno per arma (nelle partite in cui c\'era)   partite  parte del danno  danno al secondo');
for (const r of righe) console.log(`  ${(NOMI[r.f] ?? r.f).padEnd(44)}${String(r.partite).padStart(8)}${(Math.round(r.parte * 100) + '%').padStart(17)}${r.danno.toFixed(1).padStart(18)}`);

// modo «potenziali»: per ogni Eco partito al livello 5, fette completate, salute alla fine e la sua parte del danno
if (modo === 'potenziali') {
  console.log('\nEco al livello 5 (dall\'inizio)       completate  salute alla fine  parte del danno  danno al secondo');
  for (const eco of ECHI) {
    const rr = ok.filter((r) => r.eco === eco), fatte = rr.filter((r) => r.completata);
    const parte = media(rr.map((r) => (r.danno[eco] ?? 0) / Object.values(r.danno).reduce((x, y) => x + y, 0)));
    console.log(`  ${(NOMI[eco] ?? eco).padEnd(36)}${`${fatte.length}/${rr.length}`.padStart(11)}${String(fatte.length ? Math.round(media(fatte.map((r) => r.salute))) : '–').padStart(18)}` +
      `${(Math.round(parte * 100) + '%').padStart(17)}${media(rr.map((r) => (r.danno[eco] ?? 0) / r.secondi)).toFixed(1).padStart(18)}`);
  }
}

// modo «unioni»: per ogni Unione, partite con l'Unione e con la stessa build senza: Seth battuto, stanze, parte del danno dell'arma
if (modo === 'unioni') {
  console.log('\nUnione (arma al 4, dono al massimo)   Seth battuto  stanze in media  parte del danno dell\'arma   (con l\'Unione / senza)');
  for (const u of UNIONI) {
    const arma = ARMA_UNIONE[u], con = ok.filter((r) => r.unione === u && r.unita), senza = ok.filter((r) => r.unione === u && !r.unita);
    const parte = (rr) => Math.round(100 * media(rr.map((r) => (r.danno[arma] ?? 0) / Object.values(r.danno).reduce((x, y) => x + y, 0))));
    console.log(`  ${u.padEnd(36)}${`${con.filter((r) => r.completata).length}/${con.length} · ${senza.filter((r) => r.completata).length}/${senza.length}`.padStart(13)}` +
      `${`${media(con.map((r) => r.stanza)).toFixed(1)} · ${media(senza.map((r) => r.stanza)).toFixed(1)}`.padStart(17)}${`${parte(con)}% · ${parte(senza)}%`.padStart(27)}`);
  }
}

// dove cade il bot: nell'arena del Campanaro o a che distanza dall'ingresso
const caduti = ok.filter((r) => !r.completata), dove = {};
for (const r of caduti) { const u = r.stanze.at(-1); const k = !u ? 'ingresso' : u.tipo === 'campanaro' ? 'Campanaro' : u.tipo === 'boss' ? 'Seth' : `a ${u.distanza} porte`; dove[k] = (dove[k] ?? 0) + 1; }
if (caduti.length) console.log(`\nDove cade: ${Object.entries(dove).sort().map(([k, v]) => `${k} ${v}`).join(', ')}`);

const errori = risultati.filter((r) => r.errori.length || !r.stanze);
if (errori.length) console.log(`\n${errori.length} partite con errori: ${errori.map((r) => `seme ${r.seme}: ${r.errori.join(' | ')}`).join('; ')}`);
mkdirSync('prove', { recursive: true });
writeFileSync('prove/sim-stanze.json', JSON.stringify(risultati, null, 1));
console.log(`\nFatto in ${Math.round((Date.now() - inizio) / 1000)} s. Dettagli in prove/sim-stanze.json`);
process.exit(errori.length ? 1 : 0);
