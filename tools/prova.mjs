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
  // dentro la pausa chiude solo i sottopannelli
  await pag.click('[data-azione="legenda"]');
  await pag.waitForSelector('.legenda:not([hidden])', { timeout: 2000 }).catch(() => errori.push('Stati non si apre'));
  await indietro();
  if (await pag.evaluate(() => !!document.querySelector('.legenda:not([hidden])'))) errori.push('Indietro non chiude Stati');
  if (!(await pausaAperta())) errori.push('Indietro ha chiuso anche la pausa');
  // la partita riparte solo dal pulsante
  await pag.click('[data-azione="riprendi"]');
  await pag.waitForTimeout(150);
  if (await pausaAperta()) errori.push('Riprendi non chiude la pausa');
  await indietro();
  // dalla pausa si abbandona: nel menu Indietro fa di nuovo quello del browser, e la voce non resta sul percorso
  await pag.click('[data-azione="abbandona"]');
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Menu'), null, { timeout: 5000 }).catch(() => errori.push('il menu non arriva'));
  await pag.waitForTimeout(300);
  if (await pag.evaluate(() => history.state?.dlPartita === true)) errori.push('nel menu si è rimasti sulla voce della partita');
  await pag.goBack().catch(() => {});
  await pag.waitForTimeout(250);
  if (pag.url() !== 'about:blank') errori.push('dal menu Indietro non lascia la pagina');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} Indietro nel browser: apre la pausa e basta, chiude Stati, cronologia ferma a ${iniziali} voci${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
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
for (const [nome, metodo, width, height, deviceScaleFactor, sicura] of [['dono', 'labSceltaDono', 360, 780, 3, 35], ['reliquiario', 'labReliquiario', 360, 780, 3, 35], ['reliquiario su iPhone SE', 'labReliquiario', 375, 667, 2, 20]]) {
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

await browser.close();
server.kill();
console.log(falliti ? `\n${falliti} prove fallite` : '\nTutto a posto. Screenshot in prove/.');
process.exit(falliti ? 1 : 0);
