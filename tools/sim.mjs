// Simulazione di bilanciamento: il bot gioca la notte intera con ogni personaggio, su più semi,
// nel gioco vero (build in dist/) dentro un browser invisibile con lo schermo del Galaxy S25 di Edoardo (misurato il 5/11).
// Stampa a che minuto muore, il livello minuto per minuto, quanto fa male il Mietitore, quanti pani e calamite
// raccoglie e quanta salute recupera, e controlla gli obiettivi di CLAUDE.md. Risultati completi in prove/sim.json.
// Un giocatore umano va più forte del bot (prova di Edoardo del 3/11: livello 60 al minuto 8, il bot 40)
// e arriverà la meta progressione: con la Cappella vuota il bot deve vincere al massimo VITTORIE_MASSIME delle notti.
// Uso: npm run sim            (3 partite per personaggio)
//      npm run sim -- 5       (5 partite per personaggio)
//      npm run sim -- 3 strega,becchino
//      npm run sim -- 6 tutti meta=max   (Cappella completa; meta=meta a metà; senza, vuota)
//      npm run sim -- 24 tutti esplora   (una notte su tre di ogni personaggio il bot sceglie le carte a caso: ?esplora=1)
//      npm run sim -- 12 tutti stati=certi   (con l'interruttore «Stati certi» acceso)
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const PERSONAGGI = ['lampionaio', 'becchino', 'badessa', 'strega'];
const argomenti = process.argv.slice(2);
const meta = (argomenti.find((a) => a.startsWith('meta=')) ?? 'meta=0').slice(5);
const esplora = argomenti.includes('esplora');
const stati = (argomenti.find((a) => a.startsWith('stati=')) ?? '').slice(6);
const altri = argomenti.filter((a) => !a.startsWith('meta=') && !a.startsWith('stati=') && a !== 'esplora');
const partite = Number(altri[0]) || 3;
const scelti = altri[1] && altri[1] !== 'tutti' ? altri[1].split(',') : PERSONAGGI;
// obiettivi di vittoria del bot secondo la Cappella (proposta sulla meta progressione)
const OBIETTIVI = { 0: [0.05, 0.15], meta: [0.3, 0.45], max: [0.6, 0.75] };
const VITTORIE_MASSIME = (OBIETTIVI[meta] ?? OBIETTIVI[0])[1];
const INSIEME = 4; // partite in parallelo: di più non conviene con 8 GB di RAM
const porta = Number(process.env.DL_PORTA) || 4320;
// il Galaxy S25: 360×780 punti, 3 pixel fisici per punto, area sicura in alto di 35 punti (105 fisici)
const TELEFONO = { ...devices['Pixel 7'], viewport: { width: 360, height: 780 }, screen: { width: 360, height: 780 }, deviceScaleFactor: 3 };
const AREA_SICURA = 35;

// DL_DIST: un'altra build da provare (per confrontare prima e dopo con gli stessi semi)
const server = spawn('npx', ['vite', 'preview', '--port', String(porta), '--strictPort', ...(process.env.DL_DIST ? ['--outDir', process.env.DL_DIST] : [])], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const inizio = Date.now();

const coda = [];
// con «esplora», una notte su tre di ogni personaggio (la terza, la sesta…) il bot sceglie a caso
for (const pg of scelti) for (let k = 0; k < partite; k++) coda.push({ pg, seme: 1001 + k, esplora: esplora && k % 3 === 2 });
const totale = coda.length;
const risultati = [];
let fatte = 0;

async function gioca({ pg, seme, esplora }) {
  const ctx = await browser.newContext({ ...TELEFONO, serviceWorkers: 'block' });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`http://localhost:${porta}/?pg=${pg}&seme=${seme}&bot&meta=${meta}&sicura=${AREA_SICURA}${esplora ? '&esplora=1' : ''}${stati ? `&stati=${stati}` : ''}${process.env.DL_EXTRA ?? ''}`);
  await pag.waitForFunction(() => window.__sim, null, { timeout: 10 * 60_000, polling: 1000 }).catch(() => errori.push('la partita non finisce'));
  const r = await pag.evaluate(() => window.__sim ?? null);
  await ctx.close();
  fatte++;
  const esito = !r ? 'errore' : r.vittoria ? 'alba' : `morto a ${tempo(r.secondi)}`;
  console.log(`  [${fatte}/${totale}] ${pg.padEnd(10)} seme ${seme}${esplora ? ' (esplora)' : ''}: ${esito}, livello ${r?.livello ?? '?'}${errori.length ? '  errori: ' + errori.join(' | ') : ''}`);
  risultati.push({ pg, seme, esplora, ...r, errori });
}

console.log(`Simulazione: ${partite} partite per ${scelti.join(', ')}, Cappella ${meta === '0' ? 'vuota' : meta === 'meta' ? 'a metà' : 'completa'}` +
  `${esplora ? ', una notte su tre esplorativa' : ''}${stati ? `, stati=${stati}` : ''}\n`);
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

const urne = risultati.map((r) => r.urne ?? 0).filter(Boolean).sort((a, b) => a - b);
if (urne.length) console.log(`\nUrne rotte a notte: media ${media(urne).toFixed(1)}, da ${urne[0]} a ${urne[urne.length - 1]} (${urne.join(' ')})`);

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
  const alMinuto = (f) => media(rr.map((r) => f(r) / (r.secondi / 60)));
  console.log(`  ${pg}: vince ${vinte.length}/${rr.length}` +
    (morti.length ? `, muore in media a ${tempo(media(morti))} (${morti.map(tempo).join(', ')})` : '') +
    `\n     Mietitore del 5: ucciso in ${uccisoM5.length}/${m5.length}` + (uccisoM5.length ? ` dopo ${Math.round(media(uccisoM5))} s in media` : '') +
    `; danno subito al minuto ${Math.round(primaAlMinuto)} prima, ${Math.round(durante)} durante` +
    (vinte.length ? `\n     nelle vittorie la salute più bassa è stata in media ${Math.round(saluteMinima)}` : '') +
    `\n     al minuto: ${alMinuto((r) => r.pani).toFixed(1)} pani, ${alMinuto((r) => r.calamite).toFixed(2)} calamite; ` +
    `salute recuperata ${Math.round(alMinuto((r) => r.curaPane))} col pane, ${Math.round(alMinuto((r) => r.curaFiaschetta ?? 0))} con la fiaschetta, ${Math.round(alMinuto((r) => r.curaAltro))} con rigenerazione e abilità` +
    `\n     a notte: ${media(rr.map((r) => r.sorsi ?? 0)).toFixed(1)} sorsi, ${media(rr.map((r) => r.grazie ?? 0)).toFixed(1)} schivate perfette, ${Math.round(media(rr.map((r) => r.reazioni ?? 0)))} reazioni, ${Math.round(media(rr.map((r) => r.cera ?? 0)))} Cera`);
  if (rr.length && vinte.length / rr.length > VITTORIE_MASSIME) problemi.push(`${pg} vince troppo spesso (${vinte.length}/${rr.length}; al massimo ${Math.round(VITTORIE_MASSIME * 100)}%)`);
  if (rr.length && vinte.length === rr.length && saluteMinima > 50) problemi.push(`${pg} vince sempre senza sforzo (salute mai sotto ${Math.round(saluteMinima)})`);
  if (rr.length && morti.length === rr.length && Math.max(...morti) < 300) problemi.push(`${pg} muore sempre prima del minuto 5`);
  if (m5.length && !(durante > primaAlMinuto)) problemi.push(`per ${pg} il Mietitore del 5 non fa più male dei minuti prima`);
}

// ——— oggetti: in quante notti c'erano, in quante vinte, quante volte scelti su quante offerti ———
const notti = risultati.filter((r) => r.oggetti);
if (notti.length) {
  const righe = new Map();
  const altreFonti = new Map(); // abilità speciale, Martire, fuoco dell'olio
  const riga = (k) => righe.get(k) ?? righe.set(k, { notti: 0, vinte: 0, offerta: 0, scelta: 0, danno: 0, livelli: [] }).get(k);
  for (const r of notti) {
    const presenti = new Map();
    for (const a of r.oggetti.armi) {
      presenti.set(`arma:${a.nome}`, a.livello);
      if (a.unione) presenti.set(`unione:${a.unione}`, a.livello);
    }
    for (const d of r.oggetti.doni) presenti.set(`dono:${d.nome}`, d.livello);
    for (const m of r.oggetti.amuleti) presenti.set(`amuleto:${m.nome}`, null);
    for (const [k, l] of presenti) {
      const x = riga(k);
      x.notti++;
      if (r.vittoria) x.vinte++;
      if (l !== null) x.livelli.push(l);
    }
    for (const [k, c] of Object.entries(r.carte ?? {})) {
      const x = riga(k);
      x.offerta += c.offerta;
      x.scelta += c.scelta;
    }
    for (const [nome, d] of Object.entries(r.dannoArmi ?? {})) {
      if (presenti.has(`arma:${nome}`)) riga(`arma:${nome}`).danno += d;
      else altreFonti.set(nome, (altreFonti.get(nome) ?? 0) + d);
    }
  }
  const vinteTutte = notti.filter((r) => r.vittoria).length;
  // percentuale di vittorie nelle notti in cui l'oggetto c'era e in quelle in cui non c'era («poche» sotto 8 notti)
  const POCHE = 8;
  const quota = (v, n) => (n < POCHE ? 'poche' : `${Math.round((v * 100) / n)}%`);
  const ordine = ['arma', 'unione', 'dono', 'amuleto', 'altro'];
  const chiavi = [...righe.keys()].sort((x, y) => ordine.indexOf(x.split(':')[0]) - ordine.indexOf(y.split(':')[0]) || righe.get(y).notti - righe.get(x).notti);
  const esplorative = notti.filter((r) => r.esplora).length;
  console.log(`\nOggetti (${notti.length} notti${esplorative ? `, ${esplorative} esplorative` : ''}, ${vinteTutte} vinte): notti in cui c'era a fine notte, notti vinte in cui c'era, % vinte con e senza, scelto/offerto, livello medio, danno medio a notte`);
  console.log('  ' + 'oggetto'.padEnd(34) + 'notti'.padStart(7) + 'vinte'.padStart(7) + 'con'.padStart(7) + 'senza'.padStart(7) + 'scelto/offerto'.padStart(16) + 'livello'.padStart(9) + 'danno'.padStart(10));
  for (const k of chiavi) {
    const x = righe.get(k);
    const danno = x.notti && x.danno ? String(Math.round(x.danno / x.notti)) : '';
    const con = quota(x.vinte, x.notti), senza = quota(vinteTutte - x.vinte, notti.length - x.notti);
    console.log('  ' + k.padEnd(34) + String(x.notti).padStart(7) + String(x.vinte).padStart(7) + con.padStart(7) + senza.padStart(7) + `${x.scelta}/${x.offerta}`.padStart(16) +
      (x.livelli.length ? media(x.livelli).toFixed(1) : '').padStart(9) + danno.padStart(10));
  }
  if (altreFonti.size) console.log('\nAltro danno a notte (media su tutte le notti): ' + [...altreFonti].map(([n, d]) => `${n} ${Math.round(d / notti.length)}`).join(', '));
  // reazioni, Unioni, Patto e Acquasantiera
  const tipi = [...new Set(notti.flatMap((r) => Object.keys(r.reazioniPerTipo ?? {})))];
  console.log('\nReazioni a notte (media): ' + tipi.map((t) => `${t} ${Math.round(media(notti.map((r) => r.reazioniPerTipo[t] ?? 0)))}`).join(', '));
  const dr = [...new Set(notti.flatMap((r) => Object.keys(r.dannoReazioni ?? {})))];
  if (dr.length) console.log('Danno delle reazioni a notte (media): ' + dr.map((t) => `${t} ${Math.round(media(notti.map((r) => r.dannoReazioni[t] ?? 0)))}`).join(', '));
  // il danno totale conta Eclissi ed Esorcismo ma non la parte in più dell'Interramento: la si aggiunge
  const dannoReaz = notti.reduce((a, r) => a + Object.values(r.dannoReazioni ?? {}).reduce((x, y) => x + y, 0), 0);
  const dannoTot = notti.reduce((a, r) => a + (r.danno ?? 0) + (r.dannoReazioni?.Interramento ?? 0), 0);
  if (dannoTot) console.log(`Danno delle reazioni sul danno totale: ${((dannoReaz * 100) / dannoTot).toFixed(1)}% (la maledizione non è contata)`);
  const offerte = notti.filter((r) => r.unioneOfferta !== null), prese = notti.filter((r) => r.unionePresa !== null);
  const minuto = (m) => tempo(m * 60);
  console.log(`Prima Unione offerta in ${offerte.length}/${notti.length} notti` + (offerte.length ? `, in media a ${minuto(media(offerte.map((r) => r.unioneOfferta)))}` : '') +
    `; presa in ${prese.length}` + (prese.length ? `, in media a ${minuto(media(prese.map((r) => r.unionePresa)))}` : ''));
  const patto = notti.filter((r) => r.curaPatto), acqua = notti.filter((r) => r.sorsiAcquasantiera);
  console.log(`Patto di sangue: ha curato in ${patto.length} notti` + (patto.length ? `, in media ${Math.round(media(patto.map((r) => r.curaPatto)))} salute a notte` : ''));
  console.log(`Acquasantiera: sorsi in ${acqua.length} notti` + (acqua.length ? `, in media ${media(acqua.map((r) => r.sorsiAcquasantiera)).toFixed(1)} a notte (${media(acqua.map((r) => r.sorsiAcquasantieraVeri)).toFixed(1)} entrati davvero)` : ''));
  const pozze = notti.filter((r) => r.pozzeCuranti);
  if (pozze.length) console.log(`Acquasantiera, pozze che curano: in ${pozze.length} notti, in media ${media(pozze.map((r) => r.pozzeCuranti)).toFixed(1)} a notte, ${Math.round(media(pozze.map((r) => r.curaPozze ?? 0)))} salute ridata a notte`);
}

console.log('\nObiettivi (CLAUDE.md, «Verifica»)');
if (!problemi.length) console.log('  ✓ tutti rispettati');
for (const p of problemi) console.log('  ✗ ' + p);
const errate = risultati.filter((r) => r.errori.length || !r.minuti).length;
if (errate) console.log(`  ✗ ${errate} partite con errori`);

mkdirSync('prove', { recursive: true });
writeFileSync('prove/sim.json', JSON.stringify(risultati, null, 1));
console.log(`\n${totale} partite in ${Math.round((Date.now() - inizio) / 1000)} s. Dettagli in prove/sim.json`);
