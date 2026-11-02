// Prova automatica: apre la build su desktop, iPhone (verticale e orizzontale) e Android,
// prova menu, camminata, 400 nemici, armi e abilità, pausa, élite, sciami, Mietitore, alba e morte, controlla che non ci siano errori e salva gli screenshot in prove/.
// La prima volta serve: npx playwright install chromium
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const porta = 4319;
const server = spawn('npx', ['vite', 'preview', '--port', String(porta), '--strictPort'], { stdio: 'ignore' });
const url = `http://localhost:${porta}/`;
await new Promise((r) => setTimeout(r, 2500));
mkdirSync('prove', { recursive: true });

const casi = [
  ['desktop', { viewport: { width: 1280, height: 800 } }],
  ['iphone-verticale', devices['iPhone 13']],
  ['iphone-orizzontale', { ...devices['iPhone 13'], viewport: { width: 844, height: 390 } }],
  ['android', devices['Pixel 7']],
];
let falliti = 0;
// con la scheda grafica del Mac: senza, il browser disegna «a mano» e i fotogrammi al secondo non dicono nulla del telefono
const grafica = { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] };
const browser = await chromium.launch(process.env.DL_CHROMIUM ? { ...grafica, executablePath: process.env.DL_CHROMIUM } : grafica);
for (const [nome, disp] of casi) {
  const ctx = await browser.newContext(disp);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => (m.type() === 'error' || m.text().includes('has no frame')) && errori.push(m.text()));
  await pag.goto(`${url}?pg=lampionaio&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(600);
  const stato = await pag.evaluate(() => {
    const g = window.__dl;
    const c = g.canvas.getBoundingClientRect();
    return { w: g.scale.width, h: g.scale.height, scala: g.registry.get('scala'), cssW: Math.round(c.width), vw: innerWidth };
  });
  const posizione = () => pag.evaluate(() => {
    const s = window.__dl.scene.getScene('Gioco');
    return { x: s.x, y: s.y };
  });
  // l'animazione deve cambiare davvero fotogramma (per i nomi dei fotogrammi in cui Phaser non trova l'immagine)
  const fotogrammi = new Set();
  for (let i = 0; i < 8; i++) {
    fotogrammi.add(await pag.evaluate(() => window.__dl.scene.getScene('Gioco').giocatore.frame.name));
    await pag.waitForTimeout(80);
  }
  if (fotogrammi.size < 2) errori.push('il personaggio non si anima');
  // cammina: tastiera sul computer, joystick (trascinamento verso destra) sui telefoni
  const prima = await posizione();
  if (nome === 'desktop') {
    await pag.keyboard.down('KeyD');
    await pag.waitForTimeout(500);
    await pag.screenshot({ path: `prove/${nome}.png` });
    await pag.keyboard.up('KeyD');
  } else {
    const cx = Math.round(disp.viewport.width / 2);
    const cy = Math.round(disp.viewport.height * 0.7);
    await pag.mouse.move(cx, cy);
    await pag.mouse.down();
    await pag.mouse.move(cx + 60, cy, { steps: 5 });
    await pag.waitForTimeout(500);
    await pag.screenshot({ path: `prove/${nome}.png` });
    await pag.mouse.up();
  }
  const dopo = await posizione();
  const passi = Math.round(dopo.x - prima.x);
  const ok = !errori.length && passi > 20 && stato.cssW <= stato.vw + 1;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} ${nome}: ${stato.w}×${stato.h} px di gioco, ×${stato.scala}, camminato ${passi} px a destra${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Orda: 400 nemici in campo su un telefono emulato, quanti fotogrammi al secondo
{
  const ctx = await browser.newContext(devices['Pixel 7']);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=lampionaio&nemici=400&immortale&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  // le armi li uccidono: si conta subito quanti ne sono entrati in campo
  const numero = await pag.evaluate(() => window.__dl.scene.getScene('Gioco').orda.numero);
  await pag.waitForTimeout(1500);
  const misura = await pag.evaluate(() => new Promise((fine) => {
    let n = 0;
    const via = performance.now();
    const conta = () => (performance.now() - via < 3000 ? (n++, requestAnimationFrame(conta)) : fine(n / 3));
    requestAnimationFrame(conta);
  }));
  await pag.screenshot({ path: 'prove/orda-400.png' });
  const ok = !errori.length && numero >= 400 && misura >= 30;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} orda: ${numero} nemici, ${Math.round(misura)} fotogrammi al secondo (emulato sul Mac)${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Combattimento: ogni personaggio, fermo e immortale, deve uccidere nemici e salire di livello con la sua arma
for (const pg of ['lampionaio', 'becchino', 'badessa', 'strega']) {
  const ctx = await browser.newContext(devices['iPhone 13']);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  await pag.goto(`${url}?pg=${pg}&immortale&minuto=1`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  // aspetta la prima scelta del dono, la fotografa, sceglie con il tasto 1
  const carte = await pag.waitForSelector('.doni:not([hidden])', { timeout: 20000 }).then(() => true, () => false);
  if (!carte) errori.push('nessun livello in 20 s');
  else {
    if (pg === 'lampionaio') await pag.screenshot({ path: 'prove/doni.png' });
    await pag.keyboard.press('Digit1');
    await pag.waitForTimeout(300);
    if (await pag.$('.doni:not([hidden])') && !(await pag.evaluate(() => window.__dl.scene.getScene('Gioco').livello > 2))) errori.push('il tasto 1 non sceglie la carta');
  }
  await pag.screenshot({ path: `prove/combattimento-${pg}.png` });
  const stato = await pag.evaluate(() => {
    const s = window.__dl.scene.getScene('Gioco');
    const armi = s.arsenale.possedute.reduce((t, p) => t + p.livello, 0);
    const doni = Object.values(s.passivi).reduce((t, l) => t + l, 0);
    return { livello: s.livello, scelte: armi + doni - 1, armi: s.arsenale.possedute.map((p) => `${p.arma.nome} ${p.livello}`).join(', ') };
  });
  if (carte && stato.scelte < 1) errori.push('la carta scelta non ha dato niente');
  const ok = !errori.length;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} combattimento ${pg}: livello ${stato.livello}, armi: ${stato.armi}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Arsenale: tutte le armi comuni al livello 8 insieme, e l'abilità speciale di ogni personaggio con Spazio
{
  const ctx = await browser.newContext(devices['iPhone 13']);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  await pag.goto(`${url}?pg=lampionaio&armi=candela,falce,campana,fuocoFatuo,acquaSanta,lamaDiLuce&livello=8&immortale&automatico&minuto=3`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(6000);
  await pag.screenshot({ path: 'prove/arsenale.png' });
  const armi = await pag.evaluate(() => window.__dl.scene.getScene('Gioco').arsenale.possedute.length);
  if (armi < 7) errori.push(`solo ${armi} armi`);
  const ok = !errori.length;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} arsenale: ${armi} armi al livello 8 insieme${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}
for (const pg of ['lampionaio', 'becchino', 'badessa', 'strega']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=${pg}&immortale&automatico&minuto=2`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(4500); // pronta dopo 4 secondi
  await pag.keyboard.press('Space');
  await pag.waitForTimeout(800);
  await pag.screenshot({ path: `prove/speciale-${pg}.png` });
  const stato = await pag.evaluate(() => {
    const s = window.__dl.scene.getScene('Gioco');
    return { zone: s.arsenale.zone, attesa: s.speciale.attesa };
  });
  if (!stato.zone || stato.attesa <= 0) errori.push("l'abilità non parte con Spazio");
  const ok = !errori.length;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} abilità ${pg}: ${ok ? 'parte, di nuovo pronta tra ' + Math.round(stato.attesa) + ' s' : 'non parte'}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Menu: la scheda cambia con la freccia, «Inizia la notte» apre la partita con il personaggio scelto
for (const [nome, disp] of casi) {
  const ctx = await browser.newContext(disp);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  await pag.goto(url);
  await pag.waitForSelector('.menu .scheda h2', { timeout: 15000 }).catch(() => errori.push('il menu non compare'));
  await pag.waitForTimeout(400);
  await pag.screenshot({ path: `prove/menu-${nome}.png` });
  await pag.click('.menu-freccia[data-passo="1"]').catch(() => errori.push('freccia non cliccabile'));
  const nomePg = await pag.textContent('.scheda h2').catch(() => '');
  if (nomePg !== 'Il Becchino') errori.push(`dopo la freccia: ${nomePg}`);
  const largo = await pag.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (largo) errori.push('la pagina scorre in orizzontale');
  await pag.click('.menu-inizia').catch(() => errori.push('«Inizia» non cliccabile'));
  await pag.waitForFunction(() => window.__dl.scene.isActive('Gioco'), null, { timeout: 5000 }).catch(() => errori.push('la partita non parte'));
  const pg = await pag.evaluate(() => window.__dl.scene.getScene('Gioco')?.pg?.id);
  if (pg !== 'becchino') errori.push(`parte con ${pg}`);
  const ok = !errori.length;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} menu ${nome}: scheda, freccia e partenza${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Pausa, eventi della notte e alba
const eventi = [
  ['pausa', '?pg=badessa&immortale&automatico&minuto=2', async (pag) => {
    await pag.waitForTimeout(1500);
    await pag.keyboard.press('KeyP');
    await pag.waitForSelector('.hud-pausa:not([hidden])', { timeout: 2000 });
    const t0 = await pag.evaluate(() => window.__dl.scene.getScene('Gioco').secondi);
    await pag.waitForTimeout(600);
    await pag.screenshot({ path: 'prove/pausa.png' });
    const t1 = await pag.evaluate(() => window.__dl.scene.getScene('Gioco').secondi);
    if (t1 !== t0) return 'il tempo scorre in pausa';
    await pag.keyboard.press('KeyP');
    await pag.waitForTimeout(400);
    const t2 = await pag.evaluate(() => window.__dl.scene.getScene('Gioco').secondi);
    return t2 > t1 ? '' : 'non riprende';
  }],
  ['mietitore', '?pg=becchino&immortale&automatico&minuto=5&livello=5', async (pag) => {
    await pag.waitForTimeout(2500);
    await pag.screenshot({ path: 'prove/mietitore.png' });
    const c = await pag.evaluate(() => window.__dl.scene.getScene('Gioco').orda.mietitore());
    const barra = await pag.$('.hud-boss:not([hidden])');
    return c >= 0 && barra ? '' : 'il Mietitore non arriva o manca la sua barra';
  }],
  ['élite e sciame', '?pg=strega&immortale&automatico&minuto=0.9', async (pag) => {
    await pag.waitForTimeout(7000);
    await pag.screenshot({ path: 'prove/elite-sciame.png' });
    const s = await pag.evaluate(() => { const o = window.__dl.scene.getScene('Gioco').orda; let e = 0; for (let i = 0; i < o.numero; i++) e += o.elite[i]; return { e, n: o.numero }; });
    return s.e > 0 && s.n > 30 ? '' : `élite ${s.e}, nemici ${s.n}`;
  }],
  ['alba', '?pg=lampionaio&immortale&automatico&minuto=14.95', async (pag) => {
    const ok = await pag.waitForSelector('.hud-fine.vittoria:not([hidden])', { timeout: 10000 }).then(() => true, () => false);
    await pag.screenshot({ path: 'prove/alba.png' });
    return ok ? '' : "l'alba non arriva";
  }],
];
for (const [nome, indirizzo, prova] of eventi) {
  const ctx = await browser.newContext(devices['iPhone 13']);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  await pag.goto(url + indirizzo);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  const esito = await prova(pag).catch((e) => e.message);
  if (esito) errori.push(esito);
  const ok = !errori.length;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} ${nome}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Anime oltre il limite: con 320 anime lontane, un nemico che muore vicino lascia comunque la sua anima lì
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=lampionaio&immortale&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  const esito = await pag.evaluate(() => {
    const s = window.__dl.scene.getScene('Gioco');
    const a = s.anime;
    for (let k = 0; k < 330; k++) a.aggiungi(s.x + 3000 + k, s.y, 1, s.x, s.y);
    a.aggiungi(s.x + 200, s.y, 1, s.x, s.y);
    let vicina = false;
    for (let k = 0; k < a.numero; k++) if (Math.abs(a.x[k] - (s.x + 200)) < 1) vicina = true;
    return { numero: a.numero, vicina };
  });
  if (!esito.vicina || esito.numero > 320) errori.push(`anime ${esito.numero}, quella nuova ${esito.vicina ? 'c\'è' : 'manca'}`);
  const ok = !errori.length;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} anime oltre il limite: la nuova nasce vicino al personaggio${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Morte: al minuto 8, fermo, il personaggio deve morire e «Riprova» deve far ripartire la partita
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=lampionaio&minuto=8&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  const morto = await pag.waitForSelector('.hud-fine:not([hidden])', { timeout: 30000 }).then(() => true, () => false);
  if (!morto) errori.push('il personaggio non muore');
  await pag.screenshot({ path: 'prove/fine.png' });
  let ripartita = false;
  if (morto) {
    await pag.click('.hud-fine button');
    await pag.waitForTimeout(500);
    ripartita = await pag.evaluate(() => {
      const s = window.__dl.scene.getScene('Gioco');
      return !s.morto && s.salute === s.saluteMassima && !document.querySelector('.hud-fine:not([hidden])');
    });
    if (!ripartita) errori.push('«Riprova» non fa ripartire la partita');
  }
  const ok = !errori.length;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} morte: ${morto ? 'si muore' : 'non si muore'}, ${ripartita ? 'Riprova riparte' : 'Riprova non riparte'}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

await browser.close();
server.kill();
console.log(falliti ? `\n${falliti} prove fallite` : '\nTutto a posto. Screenshot in prove/.');
process.exit(falliti ? 1 : 0);
