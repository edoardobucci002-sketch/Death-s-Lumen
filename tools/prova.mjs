// Prova automatica: apre la build su desktop, iPhone (verticale e orizzontale) e Android,
// fa camminare il personaggio, prova 400 nemici, le armi dei quattro personaggi e la morte, controlla che non ci siano errori e salva gli screenshot in prove/.
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
  await pag.goto(`${url}?automatico`);
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
  await pag.goto(`${url}?nemici=400&immortale&automatico`);
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
  await pag.goto(`${url}?armi=candela,falce,campana,fuocoFatuo,acquaSanta,lamaDiLuce&livello=8&immortale&automatico&minuto=3`);
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

// Morte: al minuto 8, fermo, il personaggio deve morire e «Riprova» deve far ripartire la partita
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?minuto=8&automatico`);
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
