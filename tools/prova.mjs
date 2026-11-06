// Prova automatica: apre la build su desktop, iPhone (verticale e orizzontale) e Android,
// prova menu, camminata, 400 nemici, armi e abilità, pausa, élite, sciami, Mietitore, alba e morte, controlla che non ci siano errori e salva gli screenshot in prove/.
// La prima volta serve: npx playwright install chromium
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';

// una porta libera: con una porta occupata da un vecchio server si proverebbe una build vecchia senza accorgersene
const porta = await new Promise((ok) => {
  const libera = createServer().listen(0, () => {
    const p = libera.address().port;
    libera.close(() => ok(p));
  });
});
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

// Menu: la scheda cambia con la freccia, un personaggio bloccato si sblocca con la Cera, «Inizia la veglia» apre la partita
for (const [nome, disp] of casi) {
  const ctx = await browser.newContext(disp);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  // meta progressione: il Becchino è bloccato; con 250 Cera nel salvataggio si sblocca dalla scheda
  await pag.addInitScript(() => localStorage.setItem('dl-salvataggio', JSON.stringify({ versione: 1, cera: 250, sbloccati: ['lampionaio'] })));
  await pag.goto(url);
  await pag.waitForSelector('.menu .scheda h2', { timeout: 15000 }).catch(() => errori.push('il menu non compare'));
  await pag.waitForTimeout(400);
  await pag.screenshot({ path: `prove/menu-${nome}.png` });
  await pag.click('.menu-freccia[data-passo="1"]').catch(() => errori.push('freccia non cliccabile'));
  const nomePg = await pag.textContent('.scheda h2').catch(() => '');
  if (nomePg !== 'Il Becchino') errori.push(`dopo la freccia: ${nomePg}`);
  if (!(await pag.evaluate(() => document.querySelector('.menu-inizia').disabled))) errori.push('il Becchino non risulta bloccato');
  const largo = await pag.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (largo) errori.push('la pagina scorre in orizzontale');
  await pag.click('[data-sblocca]').catch(() => errori.push('«Sblocca con la Cera» non cliccabile'));
  const cera = await pag.evaluate(() => JSON.parse(localStorage.getItem('dl-salvataggio')).cera);
  if (cera !== 50) errori.push(`dopo lo sblocco restano ${cera} Cera invece di 50`);
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

// fasce del telefono in verticale: campo oltre il minimo, pulsanti grandi per un dito, abilità e fiaschetta negli angoli, pausa al centro,
// joystick mai sopra un pulsante; sul Galaxy S25, con l'area sicura misurata, le misure esatte decise con Edoardo
{
  const telefoni = [['iPhone SE', 375, 667, 2, 20], ['iPhone 13', 390, 844, 3, 47], ['iPhone 15 Pro Max', 430, 932, 3, 59], ['Galaxy S25', 360, 780, 3, 35], ['Pixel 7', 412, 915, 2.625, 40], ['Android piccolo', 360, 780, 2, 28]];
  for (const [nome, width, height, deviceScaleFactor, sicura] of telefoni) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
    const pag = await ctx.newPage();
    const errori = [];
    pag.on('pageerror', (e) => errori.push(e.message));
    await pag.goto(`${url}?pg=lampionaio&automatico&sicura=${sicura}`);
    await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
    await pag.waitForTimeout(400);
    const d = await pag.evaluate(() => {
      const r = (q) => document.querySelector(q).getBoundingClientRect(), c = window.__dl.scene.getScene('Gioco').cameras.main;
      return { y: c.y, a: c.height, l: c.width, H: window.__dl.scale.height, pausa: r('.hud-pausa-tasto').toJSON(), abilita: r('.speciale').toJSON(), fiaschetta: r('.fiaschetta').toJSON(), vw: innerWidth };
    });
    if (d.a < 700) errori.push(`campo di ${d.a} pixel, sotto il minimo`);
    if (nome === 'Galaxy S25' && (d.y !== 162 || d.H - d.y - d.a !== 188 || d.a !== 820 || d.l !== 540)) errori.push(`misure del S25 sbagliate: alta ${d.y}, bassa ${d.H - d.y - d.a}, campo ${d.l}×${d.a}`);
    for (const [q, p] of Object.entries({ pausa: d.pausa, abilita: d.abilita, fiaschetta: d.fiaschetta })) if (p.width < 44 || p.height < 44) errori.push(`${q} sotto i 44 punti`);
    if (d.abilita.right < d.vw - 16 || d.fiaschetta.left > 16) errori.push('abilità e fiaschetta non sono negli angoli');
    if (Math.abs(d.pausa.left + d.pausa.width / 2 - d.vw / 2) > 1) errori.push('la pausa non è al centro');
    // la base resta sotto il dito e può coprire un pulsante, mezza trasparente e solo mentre il dito trascina
    const joystick = () => pag.evaluate(() => {
      const c = document.querySelector('.joystick'), b = document.querySelector('.joystick-base').getBoundingClientRect();
      return { nascosto: c.hidden, x: b.left + b.width / 2, y: b.top + b.height / 2, opacita: c.style.opacity, z: c.style.zIndex };
    });
    let coperti = 0;
    for (const p of [d.pausa, d.fiaschetta, d.abilita]) {
      const x = p.left + p.width / 2, y = p.top - 6; // appena sopra il pulsante, fuori dalla sua area di tocco
      await pag.mouse.move(x, y);
      await pag.mouse.down();
      await pag.waitForTimeout(40);
      const j = await joystick();
      if (j.nascosto) errori.push('il joystick non nasce accanto a un pulsante');
      if (Math.abs(j.x - x) > 1.5 || Math.abs(j.y - y) > 1.5) errori.push('la base non è centrata sotto il dito');
      if (j.opacita) coperti++;
      if (j.opacita && j.z !== '5') errori.push('la base che copre un pulsante non sta sopra');
      await pag.mouse.move(x, y - 30, { steps: 2 }); // trascinando sopra e via: il pulsante non scatta
      await pag.mouse.up();
      await pag.waitForTimeout(40);
      if ((await joystick()).opacita && !(await joystick()).nascosto) errori.push('la base resta visibile dopo il tocco');
    }
    if (coperti !== 3) errori.push(`la base copre ${coperti} pulsanti su 3`);
    if (await pag.evaluate(() => !!document.querySelector('.hud-pausa:not([hidden])'))) errori.push('il joystick ha premuto la pausa');
    // il tocco non inizia mai su un pulsante; la pausa per ultima, perché si apre davvero
    for (const p of [d.fiaschetta, d.abilita, d.pausa]) {
      await pag.mouse.move(p.left + p.width / 2, p.top + p.height / 2);
      await pag.mouse.down();
      await pag.waitForTimeout(40);
      if (!(await joystick()).nascosto) errori.push('il joystick è nato su un pulsante');
      await pag.mouse.up();
    }
    if (errori.length) falliti++;
    console.log(`${errori.length ? '✗' : '✓'} fasce ${nome}: alta ${d.y}, bassa ${d.H - d.y - d.a}, campo ${d.l}×${d.a}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
    await ctx.close();
  }
  // computer e tablet: nessuna fascia
  for (const [nome, viewport] of [['computer', { width: 1280, height: 800 }], ['tablet in verticale', { width: 744, height: 1133 }]]) {
    const ctx = await browser.newContext({ viewport });
    const pag = await ctx.newPage();
    await pag.goto(`${url}?pg=lampionaio&automatico`);
    await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => {});
    await pag.waitForTimeout(300);
    const senza = await pag.evaluate(() => [window.__dl.scene.getScene('Gioco').cameras.main.height === window.__dl.scale.height, [...document.querySelectorAll('.hud-fascia')].every((f) => f.hidden)]);
    const ok = senza.every(Boolean);
    if (!ok) falliti++;
    console.log(`${ok ? '✓' : '✗'} nessuna fascia su ${nome}`);
    await ctx.close();
  }
}

// Indietro nel browser (link in Home e Chrome): in partita apre e chiude la pausa, senza lasciare voci in più nella cronologia
{
  const ctx = await browser.newContext(devices['Pixel 7']);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto('about:blank');
  await pag.goto(`${url}?pg=lampionaio&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(300);
  await pag.mouse.click(120, 450); // Chrome conta la voce solo dopo un tocco
  await pag.waitForTimeout(150);
  const voci = () => pag.evaluate(() => history.length);
  const pausaAperta = () => pag.evaluate(() => !!document.querySelector('.hud-pausa:not([hidden])'));
  const indietro = async () => { await pag.evaluate(() => history.back()); await pag.waitForTimeout(250); };
  const iniziali = await voci();
  // apre la pausa e basta: premuto di nuovo non fa ripartire la partita
  for (const giro of [1, 2, 3, 4]) {
    await indietro();
    if (!(await pausaAperta())) errori.push(`Indietro n. ${giro}: la pausa non è aperta`);
    if ((await voci()) !== iniziali) errori.push(`Indietro n. ${giro}: la cronologia è cambiata`);
    if (pag.url() === 'about:blank') { errori.push(`Indietro n. ${giro}: ha lasciato la pagina`); break; }
  }
  // Abbandona chiede conferma: Indietro chiude solo la finestra, non cambia scheda e non riprende
  await pag.click('[data-scheda="opzioni"]');
  await pag.click('.pausa-pagina [data-azione="abbandona"]');
  await pag.waitForSelector('.pausa-conferma:not([hidden])', { timeout: 2000 }).catch(() => errori.push('la conferma di Abbandona non si apre'));
  await indietro();
  if (await pag.evaluate(() => !!document.querySelector('.pausa-conferma:not([hidden])'))) errori.push('Indietro non chiude la conferma');
  if (!(await pausaAperta())) errori.push('Indietro ha chiuso anche la pausa');
  if (!(await pag.$('[data-scheda="opzioni"][aria-selected="true"]'))) errori.push('Indietro ha cambiato scheda');
  // la partita riparte solo dal pulsante
  await pag.click('[data-azione="riprendi"]');
  await pag.waitForTimeout(150);
  if (await pausaAperta()) errori.push('Riprendi non chiude la pausa');
  await indietro();
  // dalla pausa si abbandona: nel menu Indietro fa di nuovo quello del browser, e la voce non resta sul percorso
  await pag.click('.pausa-pagina [data-azione="abbandona"]');
  await pag.click('[data-azione="conferma-abbandona"]');
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Menu'), null, { timeout: 5000 }).catch(() => errori.push('il menu non arriva'));
  await pag.waitForTimeout(300);
  if (await pag.evaluate(() => history.state?.dlPartita === true)) errori.push('nel menu si è rimasti sulla voce della partita');
  await pag.goBack().catch(() => {});
  await pag.waitForTimeout(250);
  if (pag.url() !== 'about:blank') errori.push('dal menu Indietro non lascia la pagina');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} Indietro nel browser: apre la pausa e basta, chiude la conferma, cronologia ferma a ${iniziali} voci${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// secondo dito: mentre uno tiene il joystick, l'altro preme la pausa, come abilità e fiaschetta
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pag);
  const errori = [];
  await pag.goto(`${url}?pg=lampionaio&sicura=35`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(300);
  const b = await pag.evaluate(() => { const r = document.querySelector('.hud-pausa-tasto').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const primo = { x: 60, y: 450, id: 0 }, secondo = { ...b, id: 1 };
  const tocco = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  await tocco('touchStart', [primo]);
  await tocco('touchMove', [{ ...primo, x: 90 }]);
  await pag.waitForTimeout(60);
  if (await pag.evaluate(() => document.querySelector('.joystick').hidden)) errori.push('il joystick non è nato');
  await tocco('touchStart', [{ ...primo, x: 90 }, secondo]);
  await pag.waitForTimeout(60);
  await tocco('touchEnd', [{ ...primo, x: 90 }]);
  await tocco('touchEnd', []);
  await pag.waitForTimeout(120);
  if (!(await pag.evaluate(() => !!document.querySelector('.hud-pausa:not([hidden])')))) errori.push('il secondo dito non apre la pausa');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} secondo dito sulla pausa con il joystick tenuto${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// la notte dura uguale a ogni frequenza dello schermo: a 60, 90 e 120 Hz stessa logica allo stesso secondo, in tempo reale
{
  const risultati = [];
  for (const hz of [60, 90, 120]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const pag = await ctx.newPage();
    await pag.addInitScript((hz) => {
      let prossimo = performance.now();
      window.requestAnimationFrame = (f) => {
        prossimo = Math.max(prossimo + 1000 / hz, performance.now());
        return setTimeout(() => f(performance.now()), Math.max(0, prossimo - performance.now()));
      };
    }, hz);
    await pag.goto(`${url}?pg=lampionaio&automatico&seme=7&sicura=35`);
    await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 });
    // 6 secondi di notte: fermo, il personaggio muore poco dopo. Se la notte non avanza il test fallisce invece di restare appeso
    const r = await pag.evaluate(() => new Promise((ok, no) => {
      setTimeout(() => no(new Error('la notte non avanza')), 20000);
      const s = window.__dl.scene.getScene('Gioco'), avanti = s.passo.bind(s), inizio = performance.now(), secondi0 = s.secondi;
      let disegni = 0;
      window.__dl.events.on('postrender', () => disegni++);
      s.passo = (dt) => {
        avanti(dt);
        if (s.secondi < 6) return; // lo stesso secondo della notte per tutti: l'aggancio avviene in momenti diversi
        s.passo = avanti;
        const stato = [s.x, s.y, s.livello, s.orda.numero, ...Array.from(s.orda.x.slice(0, s.orda.numero))].join();
        let h = 0;
        for (let i = 0; i < stato.length; i++) h = (Math.imul(h, 31) + stato.charCodeAt(i)) | 0;
        const reali = (performance.now() - inizio) / 1000;
        ok({ reali, notte: s.secondi - secondi0, disegni: disegni / reali, nemici: s.orda.numero, impronta: h, passi: Math.round(s.secondi * 60) });
      };
    }));
    risultati.push({ hz, ...r });
    await ctx.close();
  }
  const errori = [];
  for (const r of risultati) {
    if (Math.abs(r.reali - r.notte) > 0.6) errori.push(`a ${r.hz} Hz ${r.notte.toFixed(1)} s di notte durano ${r.reali.toFixed(1)} s veri`);
    if (Math.abs(r.disegni - r.hz) > r.hz * 0.2) errori.push(`a ${r.hz} Hz disegna ${r.disegni.toFixed(0)} volte al secondo`);
    if (r.impronta !== risultati[0].impronta) errori.push(`a ${r.hz} Hz la notte va diversamente`);
  }
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} frequenza dello schermo: ${risultati.map((r) => `${r.hz} Hz ${r.notte.toFixed(1)} s di notte in ${r.reali.toFixed(1)} s, ${r.disegni.toFixed(0)} disegni/s, impronta ${r.impronta}`).join(' · ')}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
}

// la Prova prestazioni non lascia niente nella partita dopo: l'esperienza conta, la notte va avanti, si può morire
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  const errori = [];
  await pag.goto(`${url}?pg=lampionaio&sicura=35`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(300);
  await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.labProvaPrestazioni(); s.scene.start('Menu'); });
  await pag.waitForFunction(() => window.__dl.scene.isActive('Menu'), null, { timeout: 5000 }).catch(() => errori.push('il menu non arriva'));
  await pag.evaluate(() => window.__dl.scene.getScene('Menu').scene.start('Gioco', { pg: 'lampionaio' }));
  await pag.waitForFunction(() => window.__dl.scene.isActive('Gioco') && window.__dl.scene.getScene('Gioco').secondi < 30, null, { timeout: 5000 }).catch(() => errori.push('la partita nuova non parte'));
  const dopo = await pag.evaluate(() => new Promise((ok) => {
    const s = window.__dl.scene.getScene('Gioco');
    s.labMinuto(14.9);
    s.esperienza = 1;
    setTimeout(() => ok({ esperienza: s.esperienza, secondi: s.secondi, immortale: s.immortale, automatico: s.automatico, livello: s.livello, fori: s.foriBuio }), 300);
  }));
  if (dopo.esperienza < 1) errori.push('le anime non contano più come esperienza');
  if (dopo.secondi <= 870) errori.push('la notte resta ferma');
  if (dopo.immortale || dopo.automatico) errori.push('la partita dopo la prova non è normale');
  if (dopo.livello > 3) errori.push(`la partita dopo la prova parte al livello ${dopo.livello}`);
  if (!dopo.fori) errori.push('i fori nel buio restano spenti');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} dopo la Prova prestazioni la partita è normale${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// la firma della versione esiste solo nelle versioni di prova: questa build è quella normale
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const pag = await ctx.newPage();
  await pag.goto(url);
  await pag.waitForSelector('.menu', { timeout: 15000 }).catch(() => {});
  const ok = !(await pag.$('.firma'));
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} nessuna firma nella versione normale`);
  await ctx.close();
}

// le barre di sistema temporanee non spostano niente: area sicura e altezza della finestra cambiano, le fasce no
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  const errori = [];
  await pag.goto(`${url}?pg=lampionaio&automatico&sicura=35`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(2000); // l'area sicura si è fissata
  const misura = () => pag.evaluate(() => {
    const c = window.__dl.scene.getScene('Gioco').cameras.main, r = (e) => { const q = e.getBoundingClientRect(); return [q.top, q.height]; };
    return JSON.stringify([c.y, c.height, ...[...document.querySelectorAll('.hud-fascia')].flatMap(r), r(document.querySelector('#gioco canvas')), r(document.querySelector('.hud-orologio'))]);
  });
  const prima = await misura();
  await pag.evaluate(() => { document.documentElement.style.setProperty('--safe-area-inset-top', '60px'); document.documentElement.style.setProperty('--safe-area-inset-bottom', '40px'); window.dispatchEvent(new Event('resize')); });
  await pag.setViewportSize({ width: 360, height: 740 }); // le barre rubano altezza alla finestra
  await pag.waitForTimeout(300);
  const durante = await misura();
  await pag.evaluate(() => { document.documentElement.style.removeProperty('--safe-area-inset-top'); document.documentElement.style.removeProperty('--safe-area-inset-bottom'); });
  await pag.setViewportSize({ width: 360, height: 780 });
  await pag.waitForTimeout(300);
  const dopo = await misura();
  if (durante !== prima) errori.push(`con le barre le fasce si muovono: ${prima} → ${durante}`);
  if (dopo !== prima) errori.push(`dopo le barre le fasce non tornano: ${prima} → ${dopo}`);
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} barre di sistema temporanee: fasce ferme${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// pausa durante la scelta dei doni e dei reliquiari: si apre sopra e chiudendola si ritrova la stessa scelta
for (const [nome, metodo, width, height, deviceScaleFactor, sicura] of [['dono', 'labSceltaDono', 360, 780, 3, 35], ['reliquiario', 'labReliquiario', 360, 780, 3, 35], ['reliquiario su iPhone SE', 'labReliquiario', 375, 667, 2, 20], ['reliquiario su iPhone 13', 'labReliquiario', 390, 844, 3, 47], ['reliquiario su Android piccolo', 'labReliquiario', 360, 780, 2, 28]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=lampionaio&sicura=${sicura}`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(300);
  await pag.evaluate((m) => { const g = window.__dl.scene.getScene('Gioco'); g.labRosario(true); g[m](); }, metodo); // senza Rosario il reliquiario non offre scelte
  await pag.waitForSelector('.doni:not([hidden])', { timeout: 2000 }).catch(() => errori.push('la scelta non si apre'));
  const carte = () => pag.evaluate(() => document.querySelector('.doni').innerText);
  const prime = await carte();
  // le scelte stanno dentro il campo, senza sbordare sulle fasce
  const fuori = await pag.evaluate(() => {
    const [su, giu] = [...document.querySelectorAll('.hud-fascia')].map((f) => f.getBoundingClientRect());
    return [...document.querySelectorAll('.doni h2, .doni-carta, .doni-rimescola, .doni-rimaste')].filter((e) => { const q = e.getBoundingClientRect(); return q.height && (q.top < su.bottom - 1 || q.bottom > giu.top + 1); }).map((e) => e.className || e.tagName);
  });
  if (fuori.length) errori.push(`sborda sulle fasce: ${fuori.join(', ')}`);
  // il pulsante si vede sopra lo strato delle carte, non copre scelte, e si tocca davvero
  const pulsante = await pag.evaluate(() => {
    const b = document.querySelector('.hud-pausa-tasto').getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    const copre = [...document.querySelectorAll('.doni-carta, .doni-rimescola, .doni-aiuto')].filter((e) => !e.hidden).some((e) => { const q = e.getBoundingClientRect(); return q.left < b.right && q.right > b.left && q.top < b.bottom && q.bottom > b.top; });
    return { x, y, sopra: !!document.elementFromPoint(x, y)?.closest('.hud-pausa-tasto'), copre };
  });
  if (!pulsante.sopra) errori.push('il pulsante della pausa resta sotto le carte');
  if (pulsante.copre) errori.push('il pulsante della pausa copre una scelta');
  await pag.touchscreen.tap(pulsante.x, pulsante.y);
  await pag.waitForTimeout(150);
  await pag.waitForTimeout(150); // il clic generato alzando il dito non deve premere ciò che è apparso sotto (su iPhone SE «Abbandona»)
  if (!(await pag.evaluate(() => window.__dl.scene.isActive('Gioco')))) { errori.push('il tocco sulla pausa ha chiuso la partita'); throw new Error(errori[0]); }
  if (!(await pag.evaluate(() => !!document.querySelector('.hud-pausa:not([hidden])')))) errori.push('toccando il pulsante la pausa non si apre');
  const inCima = await pag.evaluate(() => { const r = document.querySelector('[data-azione="riprendi"]').getBoundingClientRect(); return !!document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.hud-pausa'); });
  if (!inCima) errori.push('la pausa si apre sotto le carte');
  await pag.click('[data-azione="riprendi"]');
  await pag.waitForTimeout(150);
  if (await pag.evaluate(() => document.querySelector('.doni').hidden)) errori.push('chiudendo la pausa la scelta è sparita');
  if ((await carte()) !== prime) errori.push('le carte sono cambiate');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} pausa sopra la scelta (${nome}): stesse carte alla chiusura${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// La pausa, caso pieno (6 armi, 6 doni, 10 amuleti, unioni) su ogni scheda dei sei telefoni: niente fuori dallo schermo, ogni pulsante almeno 44 punti,
// Riprendi lontano dal pulsante della pausa. Il LAB la prepara con labPausaPiena()
{
  const telefoni = [['iPhone SE', 375, 667, 2, 20], ['iPhone 13', 390, 844, 3, 47], ['iPhone 15 Pro Max', 430, 932, 3, 59], ['Galaxy S25', 360, 780, 3, 35], ['Pixel 7', 412, 915, 2.625, 40], ['Android piccolo', 360, 780, 2, 28]];
  for (const [nome, width, height, deviceScaleFactor, sicura] of telefoni) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
    const pag = await ctx.newPage();
    const errori = [];
    pag.on('pageerror', (e) => errori.push(e.message));
    pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
    await pag.goto(`${url}?pg=becchino&sicura=${sicura}&automatico`);
    await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
    await pag.waitForTimeout(300);
    const pulsante = await pag.evaluate(() => document.querySelector('.hud-pausa-tasto').getBoundingClientRect().toJSON());
    await pag.evaluate(() => window.__dl.scene.getScene('Gioco').labPausaPiena());
    await pag.waitForTimeout(150);
    for (const scheda of ['build', 'rosario', 'stati', 'opzioni']) {
      await pag.evaluate((s) => document.querySelector(`[data-scheda="${s}"]`).click(), scheda);
      await pag.waitForTimeout(60);
      const d = await pag.evaluate((sicura) => {
        const fuori = [], piccoli = [], W = innerWidth, H = innerHeight, p = document.querySelector('.pausa-pagina'), q = p.getBoundingClientRect();
        const r = (e) => e.getBoundingClientRect();
        for (const e of document.querySelectorAll('.hud-pausa button, .pausa-pagina *')) {
          e.scrollIntoView({ block: 'nearest' });
          const b = r(e);
          if (!b.width) continue;
          if (b.left < -0.5 || b.right > W + 0.5 || b.bottom > H + 0.5) fuori.push(e.className || e.tagName);
          if (e.tagName === 'BUTTON' && (b.width < 43.9 || b.height < 43.9)) piccoli.push(`${e.className} ${Math.round(b.width)}×${Math.round(b.height)}`);
        }
        const testa = r(document.querySelector('.pausa-testa-riga')), rip = r(document.querySelector('[data-azione="riprendi"]')), sch = r(document.querySelector('.pausa-schede'));
        const dati = r(document.querySelector('.pausa-dati'));
        // anche con numeri molto più grandi, nome e valore delle statistiche non si toccano
        const strette = [];
        for (const s of document.querySelectorAll('.pausa-statistica')) {
          const v = s.lastElementChild, prima = v.textContent;
          v.textContent = '1234/1234';
          const n = document.createRange();
          n.selectNodeContents(s.firstElementChild);
          if (n.getBoundingClientRect().right > r(v).left - 2 || s.firstElementChild.scrollWidth > s.firstElementChild.clientWidth) strette.push(s.firstElementChild.textContent);
          v.textContent = prima;
        }
        return { strette, fuori, piccoli, larga: p.scrollWidth > p.clientWidth + 1, testa: testa.top, datiFuori: dati.right > W + 0.5, rip: rip.toJSON(), sch: sch.toJSON(), pagina: q.height, sicura };
      }, sicura);
      if (d.fuori.length) errori.push(`${scheda}: fuori dallo schermo ${[...new Set(d.fuori)].slice(0, 3).join(', ')}`);
      if (d.piccoli.length) errori.push(`${scheda}: sotto i 44 punti ${[...new Set(d.piccoli)].slice(0, 3).join(', ')}`);
      if (d.strette.length) errori.push(`${scheda}: statistiche troppo vicine ai numeri: ${d.strette.join(', ')}`);
      if (d.larga) errori.push(`${scheda}: la pagina sborda in larghezza`);
      if (d.testa < sicura - 1) errori.push(`${scheda}: la striscia entra nell'area sicura`);
      if (d.datiFuori) errori.push(`${scheda}: la striscia esce dallo schermo`);
      if (d.rip.bottom > pulsante.top && d.rip.top < pulsante.bottom) errori.push(`${scheda}: Riprendi sta sul pulsante della pausa`);
      if (d.sch.top > pulsante.top) errori.push(`${scheda}: le schede non coprono il pulsante della pausa`);
      if (d.pagina < 150) errori.push(`${scheda}: pagina alta solo ${Math.round(d.pagina)} punti`);
      if (nome === 'Galaxy S25') await pag.screenshot({ path: `prove/pausa-${scheda}.png` });
    }
    // la finestra di conferma: sta dentro lo schermo e i suoi pulsanti si toccano
    await pag.evaluate(() => document.querySelector('.pausa-pagina [data-azione="abbandona"]').click());
    await pag.waitForTimeout(60);
    const c = await pag.evaluate(() => [...document.querySelectorAll('.pausa-conferma button')].map((e) => e.getBoundingClientRect().toJSON()));
    for (const b of c) {
      if (b.width < 43.9 || b.height < 43.9) errori.push(`conferma: pulsante ${Math.round(b.width)}×${Math.round(b.height)}`);
      if (b.left < 0 || b.right > width || b.bottom > height) errori.push('conferma: pulsante fuori dallo schermo');
    }
    if (errori.length) falliti++;
    console.log(`${errori.length ? '✗' : '✓'} pausa piena ${nome}: 4 schede${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
    await ctx.close();
  }
}

// La pausa, comportamento: su quale scheda si apre, doppia pressione, tasti, carte aggiornate, conferma, scoperta delle unioni
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  await pag.addInitScript(() => { if (!localStorage.getItem('dl-salvataggio')) localStorage.setItem('dl-salvataggio', JSON.stringify({ versione: 1, unioni: true, rosario: true })); });
  await pag.goto(`${url}?pg=lampionaio&sicura=35`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(300);
  const aperta = () => pag.evaluate(() => !!document.querySelector('.hud-pausa:not([hidden])'));
  const scheda = () => pag.evaluate(() => document.querySelector('[aria-selected="true"]')?.dataset.scheda);
  const gioco = (f, a) => pag.evaluate(`(${f})(window.__dl.scene.getScene('Gioco'), ${JSON.stringify(a ?? null)})`);
  // doppia pressione sul pulsante della pausa: il secondo tocco cade su una scheda
  const b = await pag.evaluate(() => { const r = document.querySelector('.hud-pausa-tasto').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await pag.touchscreen.tap(b.x, b.y);
  await pag.waitForTimeout(120);
  await pag.touchscreen.tap(b.x, b.y);
  await pag.waitForTimeout(120);
  if (!(await aperta())) errori.push('la doppia pressione fa ripartire la partita');
  // tasti 1-2-3-4 e ultima scheda usata
  await pag.keyboard.press('Digit3');
  if ((await scheda()) !== 'stati') errori.push('il tasto 3 non apre Stati');
  await pag.click('[data-azione="riprendi"]');
  await pag.waitForTimeout(100);
  await pag.keyboard.press('KeyP');
  await pag.waitForTimeout(100);
  if ((await scheda()) !== 'stati') errori.push('non riapre sull\'ultima scheda usata');
  await pag.click('[data-azione="riprendi"]');
  // Peccato: si apre sul Rosario
  await gioco('(s) => s.labPausaPeccato()');
  await pag.waitForTimeout(100);
  if ((await scheda()) !== 'rosario') errori.push('in Peccato non si apre sul Rosario');
  if (!(await pag.$('.pausa-segno'))) errori.push('manca il segno del Peccato sulla scheda');
  await pag.click('[data-azione="riprendi"]');
  await gioco('(s) => { for (const a of [...s.amuletiPosseduti]) s.labAmuleto(a, false); }');
  // sopra il reliquiario: si apre sul Rosario, spegnere un amuleto aggiorna le carte, stesse carte e stesso caso
  await gioco('(s) => { s.labAmuleto("specchioRotto", true); s.labAmuleto("sangueFreddo", false); s.labPausaSopra(true); }');
  await pag.waitForTimeout(150);
  if ((await scheda()) !== 'rosario') errori.push('sopra il reliquiario non si apre sul Rosario');
  if (!(await pag.$eval('[data-azione="riprendi"]', (e) => e.getAttribute('aria-label')?.includes('Torna')))) errori.push('sopra una scelta il pulsante non dice «Torna alla scelta»');
  const carte = () => pag.evaluate(() => [...document.querySelectorAll('.doni-carta')].map((c) => c.innerText));
  const prima = await carte();
  await pag.click('[data-amuleto="specchioRotto"]');
  await pag.waitForTimeout(100);
  if ((await gioco('(s) => s.graniUsati()')) !== 0) errori.push('l\'amuleto non si spegne dalla pausa');
  await pag.click('[data-azione="riprendi"]');
  await pag.waitForTimeout(100);
  const dopo = await carte();
  if (dopo.length !== prima.length || !dopo.some((c, i) => c !== prima[i])) errori.push('le carte non mostrano i grani nuovi');
  if (dopo.some((c, i) => c.split('\n')[0] !== prima[i].split('\n')[0])) errori.push('le carte sono cambiate');
  if (!(await gioco('(s) => { const c = s.caso.stato, r = s.doni.rimescolate; s.doni.aggiornaCarte(); return c === s.caso.stato && r === s.doni.rimescolate; }'))) errori.push('aggiornare le carte tira il caso o consuma rimescolate');
  // il «?» della scelta apre Stati
  await pag.click('.doni-aiuto');
  await pag.waitForTimeout(100);
  if (!(await aperta()) || (await scheda()) !== 'stati') errori.push('il «?» non apre Stati');
  await pag.click('[data-azione="riprendi"]');
  await gioco('(s) => s.doni.scegliPrima()');
  await pag.waitForTimeout(100);
  // la scoperta di un'unione resta nel salvataggio; prima di averla vista non si legge
  await gioco('(s) => s.labPausa("build")');
  await pag.waitForTimeout(100);
  if (await pag.evaluate(() => document.querySelector('.pausa-pagina').innerText.includes('Lanterna 1'))) errori.push('un\'unione non scoperta si vede');
  // arma e dono insieme non bastano; ai livelli giusti parte l'animazione, la partita si ferma e poi riparte
  await gioco('(s) => { s.riprendi(); s.passivi.stoppinoLungo = 1; s.dopoPassivo(); s.aggiornaBuild(); }');
  if (await gioco('(s) => s.unioniScoperte.size')) errori.push('l\'unione si scopre prima dei livelli giusti');
  await gioco('(s) => { s.labArma(s.arsenale.possedute[0].arma, 8); s.passivi.stoppinoLungo = 3; s.dopoPassivo(); s.aggiornaBuild(); }');
  await pag.waitForTimeout(80);
  if (!(await pag.$('.rivelazione:not([hidden])'))) errori.push('l\'animazione della scoperta non parte');
  const t0 = await gioco('(s) => s.secondi');
  await pag.waitForTimeout(300);
  if ((await gioco('(s) => s.secondi')) !== t0) errori.push('la partita non si ferma durante l\'animazione');
  await pag.mouse.click(180, 400); // troppo presto: un tocco non la chiude
  if (!(await pag.$('.rivelazione:not([hidden])'))) errori.push('un tocco chiude l\'animazione prima che l\'Unione compaia');
  await pag.waitForTimeout(1400);
  await pag.screenshot({ path: 'prove/scoperta-unione.png' });
  if (!(await pag.evaluate(() => document.querySelector('.rivelazione').innerText.includes('Lanterna 8 + Stoppino lungo 3')))) errori.push('l\'animazione non dice la ricetta');
  if (!(await pag.evaluate(() => document.querySelector('.rivelazione-chiudi')?.innerText.includes('per chiudere')))) errori.push('manca l\'avviso per chiudere l\'Unione');
  await pag.waitForTimeout(3500); // nessuna chiusura a tempo
  if (!(await pag.$('.rivelazione:not([hidden])'))) errori.push('l\'Unione si chiude da sola');
  await pag.mouse.click(180, 400);
  await pag.waitForTimeout(150);
  if (await pag.$('.rivelazione:not([hidden])')) errori.push('il tocco non chiude l\'animazione');
  if ((await gioco('(s) => s.secondi')) === t0) errori.push('la partita non riparte dopo l\'animazione');
  // Spazio chiude l'Unione e non usa l'abilità
  await gioco('(s) => s.labScoperta()');
  await pag.waitForTimeout(1600);
  await pag.keyboard.press('Space');
  await pag.waitForTimeout(150);
  if (await pag.$('.rivelazione:not([hidden])')) errori.push('Spazio non chiude l\'Unione');
  // la pausa salta l'animazione
  await gioco('(s) => s.labScoperta()');
  await gioco('(s) => s.indietro()');
  await pag.waitForTimeout(80);
  if (!(await aperta()) || (await pag.$('.rivelazione:not([hidden])'))) errori.push('la pausa non salta l\'animazione');
  await gioco('(s) => s.labPausa("build")');
  await pag.waitForTimeout(100);
  const salvate = await pag.evaluate(() => JSON.parse(localStorage.getItem('dl-salvataggio')).unioniScoperte);
  if (!salvate?.includes('faroDeiMorti')) errori.push(`unione scoperta non salvata: ${salvate}`);
  if (!(await pag.$('.pausa-unione.pronta'))) errori.push('l\'unione scoperta non compare con «Pronta»');
  // l'effetto si svela solo dopo aver unito: prima nome e ricetta; unita, resta in Stati per sempre
  const riga = { testoBuild: await pag.evaluate(() => document.querySelector('.pausa-pagina').innerText) };
  if (riga.testoBuild.includes('L\'arco diventa')) errori.push('l\'effetto dell\'unione si legge prima di averla unita');
  const stati = await gioco(`(s) => { s.labPausa('stati'); return document.querySelector('.pausa-pagina').innerText; }`);
  if (stati.toLowerCase().includes('faro dei morti')) errori.push('l\'unione è in Stati prima di essere stata unita');
  await gioco(`(s) => { s.riprendi(); s.scoperteDiProva = false; s.segnaUnita('faroDeiMorti'); s.labPausa('stati'); }`);
  await pag.waitForTimeout(80);
  const unita = await pag.evaluate(() => [...document.querySelectorAll('.pausa-unita')].map((e) => e.innerText).join());
  if (!unita.includes('Lanterna 8 + Stoppino lungo 3') || !unita.includes('L\'arco')) errori.push(`in Stati manca l'unione fatta: ${unita}`);
  if (!(await pag.evaluate(() => JSON.parse(localStorage.getItem('dl-salvataggio')).unioniUnite?.includes('faroDeiMorti')))) errori.push('l\'unione fatta non resta nel salvataggio');
  // i numeri della striscia e le statistiche sono quelli veri
  const testa = await gioco('(s) => { s.uccisi = 7; s.frammenti = 2; s.labPausa("build"); return document.querySelector(".pausa-testa").innerText; }');
  if (!testa.includes('Uccisi 7') || !testa.includes('Frammenti 2 di 3')) errori.push(`striscia: ${testa}`);
  const statistiche = await pag.evaluate(() => [...document.querySelectorAll('.pausa-statistica')].map((e) => e.innerText.replace('\n', ' ')));
  if (statistiche.length < 13 || statistiche.some((t) => /undefined|NaN/.test(t))) errori.push(`statistiche: ${statistiche}`);
  // il dito sulla pagina non fa nascere il joystick; alla ripresa non resta movimento
  await pag.mouse.move(180, 400);
  await pag.mouse.down();
  await pag.waitForTimeout(40);
  if (!(await pag.evaluate(() => document.querySelector('.joystick').hidden))) errori.push('il joystick nasce sulla pausa');
  await pag.mouse.up();
  await pag.click('[data-azione="riprendi"]');
  await pag.waitForTimeout(100);
  await pag.mouse.move(100, 400);
  await pag.mouse.down();
  await pag.mouse.move(160, 400, { steps: 3 });
  await pag.waitForTimeout(60);
  await gioco('(s) => s.labPausa("build")'); // come il secondo dito o l'app in secondo piano: il primo dito resta giù
  await pag.waitForTimeout(60);
  await pag.mouse.move(100, 400, { steps: 2 });
  await gioco('(s) => s.riprendi()');
  await pag.waitForTimeout(150);
  const fermo = await gioco('(s) => { const a = s.x; return new Promise((ok) => setTimeout(() => ok(Math.abs(s.x - a) < 0.01 && !s.comandi.dx && !s.comandi.dy), 200)); }');
  if (!fermo) errori.push('alla ripresa resta del movimento');
  await pag.mouse.up();
  // prima partita: niente Rosario e niente Unioni
  await gioco('(s) => s.labPausaPrima()');
  await pag.waitForTimeout(100);
  if (await pag.$('[data-scheda="rosario"]')) errori.push('la scheda Rosario si vede prima dello sblocco');
  if (await pag.evaluate(() => document.querySelector('.pausa-pagina').innerText.toLowerCase().includes('scoperte'))) errori.push('le Unioni si vedono prima dello sblocco');
  // conferma: Esc non serve sul telefono, Annulla la chiude; la finestra sta sopra e Abbandona non è dove stava
  await pag.click('[data-scheda="opzioni"]');
  const abbandona = await pag.evaluate(() => document.querySelector('.pausa-pagina [data-azione="abbandona"]').getBoundingClientRect().toJSON());
  await pag.click('.pausa-pagina [data-azione="abbandona"]');
  await pag.waitForTimeout(80);
  const conferma = await pag.evaluate(() => document.querySelector('[data-azione="conferma-abbandona"]').getBoundingClientRect().toJSON());
  if (conferma.top < abbandona.bottom && conferma.bottom > abbandona.top) errori.push('il secondo tocco cade sul pulsante di conferma');
  await pag.screenshot({ path: 'prove/pausa-conferma.png' });
  await pag.click('[data-azione="annulla"]');
  if (await pag.evaluate(() => !!document.querySelector('.pausa-conferma:not([hidden])'))) errori.push('Annulla non chiude la conferma');
  if (!(await aperta())) errori.push('Annulla ha chiuso la pausa');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} pausa, comportamento: schede, doppia pressione, carte, unioni, joystick, conferma${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// La pausa su computer e tablet: schede in colonna a sinistra, pagina a destra; Esc chiude solo la conferma
for (const [nome, viewport] of [['computer', { width: 1280, height: 800 }], ['tablet orizzontale', { width: 1180, height: 820 }], ['tablet verticale', { width: 744, height: 1133 }]]) {
  const ctx = await browser.newContext({ viewport });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=lampionaio&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(300);
  await pag.evaluate(() => window.__dl.scene.getScene('Gioco').labPausaPiena());
  await pag.waitForTimeout(150);
  const d = await pag.evaluate(() => {
    const r = (q) => document.querySelector(q).getBoundingClientRect().toJSON();
    return { schede: r('.pausa-schede'), pagina: r('.pausa-pagina'), rip: r('[data-azione="riprendi"]'), quadro: r('.pausa-quadro'), W: innerWidth, H: innerHeight };
  });
  if (d.schede.right > d.pagina.left + 1 || d.schede.height < 100) errori.push('le schede non sono una colonna a sinistra');
  if (d.quadro.left < 0 || d.quadro.right > d.W || d.quadro.top < 0 || d.quadro.bottom > d.H) errori.push('il quadro esce dallo schermo');
  if (d.rip.right > d.pagina.left + 1 || d.rip.left < d.quadro.left - 1) errori.push('Riprendi esce dalla sua colonna');
  const piccoli = await pag.evaluate(() => [...document.querySelectorAll('.hud-pausa button')].map((e) => e.getBoundingClientRect()).filter((b) => b.width && (b.width < 43.9 || b.height < 43.9)).length);
  if (piccoli) errori.push(`${piccoli} pulsanti sotto i 44 punti`);
  await pag.screenshot({ path: `prove/pausa-${nome.replace(' ', '-')}.png` });
  await pag.keyboard.press('Digit4');
  await pag.click('.pausa-pagina [data-azione="abbandona"]');
  await pag.keyboard.press('Escape');
  await pag.waitForTimeout(80);
  if (await pag.evaluate(() => !!document.querySelector('.pausa-conferma:not([hidden])'))) errori.push('Esc non chiude la conferma');
  if (!(await pag.evaluate(() => !!document.querySelector('.hud-pausa:not([hidden])')))) errori.push('Esc ha chiuso anche la pausa');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} pausa su ${nome}: colonna a sinistra${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Unioni che si svelano: la carta non nomina una non scoperta; 3 veglie vinte le sbloccano e la Cappella non le vende più
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.addInitScript(() => { if (!localStorage.getItem('dl-salvataggio')) localStorage.setItem('dl-salvataggio', JSON.stringify({ versione: 1, unioni: true, vittorie: 0 })); });
  await pag.goto(`${url}?pg=lampionaio&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(200);
  const cartaLanterna = () => pag.evaluate(() => {
    const s = window.__dl.scene.getScene('Gioco'), a = s.arsenale.possedute[0].arma;
    s.automatico = false;
    s.doni.mostraReliquiario([{ tipo: 'arma', arma: a, livello: 8 }], () => {});
    const t = document.querySelector('.doni-carta').innerText;
    s.doni.scegliPrima();
    return t;
  });
  if ((await cartaLanterna()).includes('Faro dei morti')) errori.push('la carta nomina un\'unione non scoperta');
  await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.passivi.stoppinoLungo = 1; s.aggiornaBuild(); });
  if ((await cartaLanterna()).includes('Faro dei morti')) errori.push('la carta nomina l\'unione con il dono al primo livello');
  await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.labArma(s.arsenale.possedute[0].arma, 8); s.passivi.stoppinoLungo = 3; s.aggiornaBuild(); });
  if (!(await cartaLanterna()).includes('Faro dei morti')) errori.push('la carta non nomina l\'unione scoperta');
  // tre veglie vinte
  await pag.evaluate(() => { const v = JSON.parse(localStorage.getItem('dl-salvataggio')); v.unioni = false; v.vittorie = 2; localStorage.setItem('dl-salvataggio', JSON.stringify(v)); });
  await pag.reload();
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non riparte'));
  await pag.waitForTimeout(200);
  const dopo = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.contaCera(false); const a = JSON.parse(localStorage.getItem('dl-salvataggio')); s.contaCera(true); const b = JSON.parse(localStorage.getItem('dl-salvataggio')); return { a: [a.unioni, a.vittorie], b: [b.unioni, b.vittorie] }; });
  if (dopo.a[0] || dopo.a[1] !== 2) errori.push(`una sconfitta conta come vittoria: ${dopo.a}`);
  if (!dopo.b[0] || dopo.b[1] !== 3) errori.push(`la terza vittoria non sblocca: ${dopo.b}`);
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} Unioni: si svelano giocando e si sbloccano con 3 veglie vinte${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

await browser.close();
server.kill();
console.log(falliti ? `\n${falliti} prove fallite` : '\nTutto a posto. Screenshot in prove/.');
process.exit(falliti ? 1 : 0);
