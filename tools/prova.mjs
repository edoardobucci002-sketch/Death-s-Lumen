// Prova automatica: apre la build su desktop, iPhone (verticale e orizzontale) e Android,
// prova menu, camminata, 400 nemici, gioco a stanze (orizzontale, muri, pausa), armi e abilità, pausa, élite, sciami, Mietitore, alba e morte, controlla che non ci siano errori e salva gli screenshot in prove/.
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
    // l'élite arriva a 0:55, lo sciame verso l'1:00, e la Strega può uccidere l'élite prima che arrivi lo sciame:
    // si guarda ogni quarto di secondo per 9 s e si chiede di aver visto l'una e l'altro (prima un solo istante a 7 s)
    let eliteVista = 0, nemiciMassimi = 0, foto = false;
    for (let t = 0; t < 36; t++) {
      await pag.waitForTimeout(250);
      const s = await pag.evaluate(() => { const o = window.__dl.scene.getScene('Gioco').orda; let e = 0; for (let i = 0; i < o.numero; i++) e += o.elite[i]; return { e, n: o.numero }; });
      eliteVista = Math.max(eliteVista, s.e);
      nemiciMassimi = Math.max(nemiciMassimi, s.n);
      if (!foto && s.e > 0 && s.n > 30) (foto = true), await pag.screenshot({ path: 'prove/elite-sciame.png' });
    }
    if (!foto) await pag.screenshot({ path: 'prove/elite-sciame.png' });
    return eliteVista > 0 && nemiciMassimi > 30 ? '' : `élite vista ${eliteVista}, nemici al massimo ${nemiciMassimi}`;
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
  await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.lab.provaPrestazioni(); s.scene.start('Menu'); });
  await pag.waitForFunction(() => window.__dl.scene.isActive('Menu'), null, { timeout: 5000 }).catch(() => errori.push('il menu non arriva'));
  await pag.evaluate(() => window.__dl.scene.getScene('Menu').scene.start('Gioco', { pg: 'lampionaio' }));
  await pag.waitForFunction(() => window.__dl.scene.isActive('Gioco') && window.__dl.scene.getScene('Gioco').secondi < 30, null, { timeout: 5000 }).catch(() => errori.push('la partita nuova non parte'));
  const dopo = await pag.evaluate(() => new Promise((ok) => {
    const s = window.__dl.scene.getScene('Gioco');
    s.lab.minuto(14.9);
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
for (const [nome, metodo, width, height, deviceScaleFactor, sicura] of [['dono', 'sceltaDono', 360, 780, 3, 35], ['reliquiario', 'reliquiario', 360, 780, 3, 35], ['reliquiario su iPhone SE', 'reliquiario', 375, 667, 2, 20], ['reliquiario su iPhone 13', 'reliquiario', 390, 844, 3, 47], ['reliquiario su Android piccolo', 'reliquiario', 360, 780, 2, 28]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=lampionaio&sicura=${sicura}`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(300);
  await pag.evaluate((m) => { const g = window.__dl.scene.getScene('Gioco'); g.lab.rosario(true); g.lab[m](); }, metodo); // senza Rosario il reliquiario non offre scelte
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
    await pag.evaluate(() => window.__dl.scene.getScene('Gioco').lab.pausaPiena());
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
  await gioco('(s) => s.lab.pausaPeccato()');
  await pag.waitForTimeout(100);
  if ((await scheda()) !== 'rosario') errori.push('in Peccato non si apre sul Rosario');
  if (!(await pag.$('.pausa-segno'))) errori.push('manca il segno del Peccato sulla scheda');
  await pag.click('[data-azione="riprendi"]');
  await gioco('(s) => { for (const a of [...s.amuletiPosseduti]) s.lab.amuleto(a, false); }');
  // sopra il reliquiario: si apre sul Rosario, spegnere un amuleto aggiorna le carte, stesse carte e stesso caso
  await gioco('(s) => { s.lab.amuleto("specchioRotto", true); s.lab.amuleto("sangueFreddo", false); s.lab.pausaSopra(true); }');
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
  await gioco('(s) => s.lab.pausa("build")');
  await pag.waitForTimeout(100);
  if (await pag.evaluate(() => document.querySelector('.pausa-pagina').innerText.includes('Lanterna 1'))) errori.push('un\'unione non scoperta si vede');
  // arma e dono insieme non bastano; ai livelli giusti parte l'animazione, la partita si ferma e poi riparte
  await gioco('(s) => { s.riprendi(); s.passivi.stoppinoLungo = 1; s.dopoPassivo(); s.aggiornaBuild(); }');
  if (await gioco('(s) => s.unioniScoperte.size')) errori.push('l\'unione si scopre prima dei livelli giusti');
  await gioco('(s) => { s.lab.arma(s.arsenale.possedute[0].arma, 6); s.passivi.stoppinoLungo = 3; s.dopoPassivo(); s.aggiornaBuild(); }');
  await pag.waitForTimeout(80);
  if (!(await pag.$('.rivelazione:not([hidden])'))) errori.push('l\'animazione della scoperta non parte');
  const t0 = await gioco('(s) => s.secondi');
  await pag.waitForTimeout(300);
  if ((await gioco('(s) => s.secondi')) !== t0) errori.push('la partita non si ferma durante l\'animazione');
  await pag.mouse.click(180, 400); // troppo presto: un tocco non la chiude
  if (!(await pag.$('.rivelazione:not([hidden])'))) errori.push('un tocco chiude l\'animazione prima che l\'Unione compaia');
  await pag.waitForTimeout(1400);
  await pag.screenshot({ path: 'prove/scoperta-unione.png' });
  if (!(await pag.evaluate(() => document.querySelector('.rivelazione').innerText.includes('Lanterna 6 + Stoppino lungo 3')))) errori.push('l\'animazione non dice la ricetta');
  if (!(await pag.evaluate(() => document.querySelector('.rivelazione-chiudi')?.innerText.includes('per chiudere')))) errori.push('manca l\'avviso per chiudere l\'Unione');
  await pag.waitForTimeout(3500); // nessuna chiusura a tempo
  if (!(await pag.$('.rivelazione:not([hidden])'))) errori.push('l\'Unione si chiude da sola');
  await pag.mouse.click(180, 400);
  await pag.waitForTimeout(150);
  if (await pag.$('.rivelazione:not([hidden])')) errori.push('il tocco non chiude l\'animazione');
  if ((await gioco('(s) => s.secondi')) === t0) errori.push('la partita non riparte dopo l\'animazione');
  // Spazio chiude l'Unione e non usa l'abilità
  await gioco('(s) => s.lab.scoperta()');
  await pag.waitForTimeout(1600);
  await pag.keyboard.press('Space');
  await pag.waitForTimeout(150);
  if (await pag.$('.rivelazione:not([hidden])')) errori.push('Spazio non chiude l\'Unione');
  // la pausa salta l'animazione
  await gioco('(s) => s.lab.scoperta()');
  await gioco('(s) => s.indietro()');
  await pag.waitForTimeout(80);
  if (!(await aperta()) || (await pag.$('.rivelazione:not([hidden])'))) errori.push('la pausa non salta l\'animazione');
  await gioco('(s) => s.lab.pausa("build")');
  await pag.waitForTimeout(100);
  const salvate = await pag.evaluate(() => JSON.parse(localStorage.getItem('dl-salvataggio')).unioniScoperte);
  if (!salvate?.includes('faroDeiMorti')) errori.push(`unione scoperta non salvata: ${salvate}`);
  if (!(await pag.$('.pausa-unione.pronta'))) errori.push('l\'unione scoperta non compare con «Pronta»');
  // l'effetto si svela solo dopo aver unito: prima nome e ricetta; unita, resta in Stati per sempre
  const riga = { testoBuild: await pag.evaluate(() => document.querySelector('.pausa-pagina').innerText) };
  if (riga.testoBuild.includes('L\'arco diventa')) errori.push('l\'effetto dell\'unione si legge prima di averla unita');
  const stati = await gioco(`(s) => { s.lab.pausa('stati'); return document.querySelector('.pausa-pagina').innerText; }`);
  if (stati.toLowerCase().includes('faro dei morti')) errori.push('l\'unione è in Stati prima di essere stata unita');
  await gioco(`(s) => { s.riprendi(); s.scoperteDiProva = false; s.segnaUnita('faroDeiMorti'); s.lab.pausa('stati'); }`);
  await pag.waitForTimeout(80);
  const unita = await pag.evaluate(() => [...document.querySelectorAll('.pausa-unita')].map((e) => e.innerText).join());
  if (!unita.includes('Lanterna 6 + Stoppino lungo 3') || !unita.includes('L\'arco')) errori.push(`in Stati manca l'unione fatta: ${unita}`);
  if (!(await pag.evaluate(() => JSON.parse(localStorage.getItem('dl-salvataggio')).unioniUnite?.includes('faroDeiMorti')))) errori.push('l\'unione fatta non resta nel salvataggio');
  // i numeri della striscia e le statistiche sono quelli veri
  const testa = await gioco('(s) => { s.uccisi = 7; s.frammenti = 2; s.lab.pausa("build"); return document.querySelector(".pausa-testa").innerText; }');
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
  await gioco('(s) => s.lab.pausa("build")'); // come il secondo dito o l'app in secondo piano: il primo dito resta giù
  await pag.waitForTimeout(60);
  await pag.mouse.move(100, 400, { steps: 2 });
  await gioco('(s) => s.riprendi()');
  await pag.waitForTimeout(150);
  const fermo = await gioco('(s) => { const a = s.x; return new Promise((ok) => setTimeout(() => ok(Math.abs(s.x - a) < 0.01 && !s.comandi.dx && !s.comandi.dy), 200)); }');
  if (!fermo) errori.push('alla ripresa resta del movimento');
  await pag.mouse.up();
  // prima partita: niente Rosario e niente Unioni
  await gioco('(s) => s.lab.pausaPrima()');
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
  await pag.evaluate(() => window.__dl.scene.getScene('Gioco').lab.pausaPiena());
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

// Mosaico dei frammenti: un pezzo per volta, non ferma il gioco, sparisce da solo; il terzo fa partire il Bagliore
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?pg=lampionaio&automatico`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non parte'));
  await pag.waitForTimeout(200);
  const gioco = (f) => pag.evaluate(`(${f})(window.__dl.scene.getScene('Gioco'))`);
  const numero = () => pag.evaluate(() => { const e = document.querySelector('.mosaico'); return e && !e.hidden ? e.querySelector('.mosaico-numero').textContent : ''; });
  await gioco('(s) => { s.lab.immortale(true); s.lab.mosaico(); }');
  if (await numero() !== '1/3') errori.push('il primo frammento non mostra 1/3');
  if (await pag.evaluate(() => getComputedStyle(document.querySelector('.mosaico')).pointerEvents) !== 'none') errori.push('il mosaico prende i tocchi');
  await pag.waitForTimeout(600);
  await pag.screenshot({ path: 'prove/mosaico-1.png' });
  await pag.waitForTimeout(2000);
  if (await numero()) errori.push('il mosaico non sparisce da solo');
  await gioco('(s) => { s.lab.mosaico(); s.lab.mosaico(); }');
  if (await numero() !== '3/3') errori.push('il terzo frammento non mostra 3/3');
  if (await gioco('(s) => s.frammenti')) errori.push('il conto dei frammenti non riparte');
  await pag.waitForTimeout(800);
  await pag.screenshot({ path: 'prove/mosaico-3.png' });
  await pag.waitForFunction(() => document.querySelector('.mosaico').hidden, null, { timeout: 4000 }).catch(() => errori.push('il mosaico completo non si chiude'));
  if (!(await gioco('(s) => s.bagliore > 0'))) errori.push('il mosaico completo non fa partire il Bagliore');
  const toccato = await gioco('(s) => { const o = s.orda; o.x[0] = s.x; o.y[0] = s.y; o.elite[0] = 0; o.tipo[0] = 0; return o.id[0]; }');
  await pag.waitForTimeout(150);
  if (await gioco(`(s) => Array.from(s.orda.id.subarray(0, s.orda.numero)).includes(${toccato})`)) errori.push('il Bagliore non brucia chi lo tocca');
  await gioco('(s) => { s.bagliore = 0.01; }');
  await pag.waitForTimeout(150);
  if (await gioco('(s) => s.bagliore > 0')) errori.push('il Bagliore non finisce');
  await gioco('(s) => s.lab.mosaico()');
  await gioco('(s) => s.lab.pausa("build")');
  if (await numero()) errori.push('il mosaico resta sopra la pausa');
  await gioco('(s) => s.riprendi()');
  const rottiFuori = await gioco(`(s) => { const r = s.rompibili, conta = () => Array.from(r.stato, (_, i) => r.intero(i)).filter(Boolean).length;
    r.piazza(0, s.x + s.campoL, s.y); const prima = conta(); r.colpitoDa(s.x + s.campoL, s.y - 20, 8); const fuori = prima - conta();
    r.piazza(0, s.x + 60, s.y - 60); const dopo = conta(); r.colpitoDa(s.x + 60, s.y - 80, 8); return [fuori, dopo - conta()]; }`);
  if (rottiFuori[0]) errori.push('un\'arma rompe un oggetto fuori campo');
  if (rottiFuori[1] !== 1) errori.push('un\'arma non rompe un oggetto in vista');
  const usciti = await gioco(`(s) => { const prima = s.oggetti.numero; s.frammentiCaduti = 0; const p = s.caso.numero; s.caso.numero = () => 0; s.mosaiciAperti = false; s.oggettoRotto(0, s.x, s.y + 200); const chiusi = s.oggetti.numero - prima; s.mosaiciAperti = true; for (let i = 0; i < 6; i++) s.oggettoRotto(0, s.x, s.y + 200); s.caso.numero = p; return chiusi ? -1 : s.oggetti.numero - prima; }`);
  if (usciti !== 3) errori.push(usciti < 0 ? 'prima della prima alba le urne lasciano frammenti' : `le urne fortunate lasciano ${usciti} frammenti invece di 3 a notte`);
  const colori = await gioco('(s) => { const visti = new Set(); for (let i = 0; i < 12; i++) { s.oggetti.aggiungi(4, 40 + i * 31, 90 + i * 17); visti.add(s.oggetti.sprite[s.oggetti.numero - 1].frame.name); s.oggetti.togli(s.oggetti.numero - 1); } return visti.size; }');
  if (colori !== 3) errori.push(`i frammenti hanno ${colori} colori invece di 3`);
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} mosaico dei frammenti: 1/3, 3/3, Bagliore, tre colori${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Unioni che si svelano: la carta non nomina una non scoperta; sconfiggere Seth le sblocca e la Cappella non le vende più
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
  // arma al livello dell'unione (6) ma dono non al massimo: non ancora
  await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.lab.arma(s.arsenale.possedute[0].arma, 6); s.passivi.stoppinoLungo = 1; s.aggiornaBuild(); });
  if (await pag.evaluate(() => window.__dl.scene.getScene('Gioco').unioniPronte().length)) errori.push('l\'unione è pronta con il dono sotto il massimo');
  await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.passivi.stoppinoLungo = s.lab.massimoDono('stoppinoLungo'); s.aggiornaBuild(); });
  if (!(await pag.evaluate(() => window.__dl.scene.getScene('Gioco').unioniPronte().length))) errori.push('l\'unione non è pronta con l\'arma al 6 e il dono al massimo');
  if (!(await cartaLanterna()).includes('Faro dei morti')) errori.push('la carta non nomina l\'unione scoperta');
  // l'impresa «Sconfiggi Seth», con qualsiasi personaggio
  await pag.evaluate(() => { const v = JSON.parse(localStorage.getItem('dl-salvataggio')); v.unioni = false; v.vittorie = 0; localStorage.setItem('dl-salvataggio', JSON.stringify(v)); });
  await pag.reload();
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 }).catch(() => errori.push('la scena Gioco non riparte'));
  await pag.waitForTimeout(200);
  const dopo = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Gioco'); s.contaCera(true); const a = JSON.parse(localStorage.getItem('dl-salvataggio')); s.sethSconfitti = 1; s.contaCera(false); const b = JSON.parse(localStorage.getItem('dl-salvataggio')); return { a: a.unioni, b: b.unioni }; });
  if (dopo.a) errori.push('una vittoria senza Seth sconfitto sblocca le Unioni');
  if (!dopo.b) errori.push('sconfiggere Seth (anche perdendo la veglia) non sblocca le Unioni');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} Unioni: si svelano giocando, arma al 6 e dono al massimo, si sbloccano sconfiggendo Seth${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Gioco a stanze (pivot del 12/11, passo 2 della fetta): in orizzontale su computer e telefoni; in verticale chiede di ruotare.
// Il Lampionaio cammina, i muri lo fermano (i piedi arrivano al bordo dell'area camminabile e non oltre), la pausa si apre e si chiude.
for (const [nome, disp] of [
  ['stanze-desktop', { viewport: { width: 1280, height: 800 } }],
  ['stanze-iphone-orizzontale', { ...devices['iPhone 13'], viewport: { width: 844, height: 390 } }],
  ['stanze-android-orizzontale', { ...devices['Pixel 7'], viewport: { width: 915, height: 412 } }],
  ['stanze-iphone-verticale', devices['iPhone 13']],
]) {
  const ctx = await browser.newContext(disp);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => (m.type() === 'error' || m.text().includes('has no frame')) && errori.push(m.text()));
  await pag.goto(`${url}?stanze&candele=1`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Stanze'), null, { timeout: 15000 }).catch(() => errori.push('la scena Stanze non parte'));
  // muri, pausa e attacco si provano nella stanza vuota; i nemici hanno la loro prova in fondo
  // nell'ingresso della mappa le porte sono aperte: per provare i muri camminandoci contro si bloccano
  await pag.evaluate(() => { const l = window.__dl.scene.getScene('Stanze').lab; l.ondateAutomatiche(false); l.svuota(); l.bloccaPorte(true); });
  // la mappa del Mondo (17/11, passo 1): mille semi, ognuno deve rispettare le regole (src/sistema/mappa.ts → controllaMappa)
  let notaMappe = '';
  if (nome === 'stanze-desktop') {
    const r = await pag.evaluate(() => window.__dl.scene.getScene('Stanze').lab.provaMappe(1000));
    if (r.sbagliate) errori.push(`mappa del Mondo: ${r.sbagliate} semi su 1000 non rispettano le regole (${r.primo})`);
    notaMappe = `, mappe ${r.stanze[0]}–${r.stanze[1]} stanze, Boss a ${r.boss[0]}–${r.boss[1]} porte (${r.ms} ms per mille)`;
  }
  // i pallini della fiaschetta (18/11): tanti quanti i sorsi massimi, sotto la barra; 4 massimi con 2 pieni, poi se ne beve uno
  let notaPallini = '';
  if (!nome.endsWith('verticale')) {
    await pag.evaluate(() => window.__dl.scene.getScene('Stanze').lab.sorsiMassimi(4)); // il Calice riverso al livello 1
    await pag.waitForTimeout(150);
    await pag.evaluate(() => { window.__dl.scene.getScene('Stanze').fiaschetta.sorsi = 2; });
    await pag.waitForTimeout(400);
    const p1 = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'), g = s.barra.pallini; return { visibile: g.visible, sotto: g.y > s.barra.rett.y, n: s.fiaschetta.massimo }; });
    if (!p1.visibile || !p1.sotto || p1.n !== 4) errori.push(`i pallini della fiaschetta non si vedono sotto la barra (${JSON.stringify(p1)})`);
    await pag.screenshot({ path: `prove/${nome}-pallini.png`, clip: await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'), c = s.cameras.main, r = s.game.canvas.getBoundingClientRect(), k = r.width / s.scale.width; return { x: r.x + (s.x - c.scrollX - 60) * k, y: r.y + (s.y - c.scrollY - 90) * k, width: 120 * k, height: 130 * k }; }) });
    const bevuto = await pag.evaluate(() => window.__dl.scene.getScene('Stanze').lab.bevi());
    if (!bevuto) errori.push('la fiaschetta non beve dal LAB');
    await pag.waitForTimeout(1200);
    await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); s.lab.sorsiMassimi(3); s.lab.fiaschettaPiena(); });
    notaPallini = ', pallini della fiaschetta sì';
    // le ombre a terra (19/11): una sotto il Lampionaio e una per nemico; il LAB le spegne tutte
    const ombre = () => pag.evaluate(() => window.__dl.scene.getScene('Stanze').children.list.filter((o) => o.visible && o.texture?.key.startsWith('ombra-')).length);
    await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'), l = s.lab; l.immortale(true); l.nemicoIn('ricaduto', s.x + 70, s.y + 10); l.nemicoIn('cantore', s.x - 70, s.y - 10); });
    await pag.waitForTimeout(150);
    await pag.evaluate(() => window.__dl.scene.getScene('Stanze').lab.ferma(true));
    const accese = await ombre();
    if (accese !== 3) errori.push(`ombre a terra: ${accese} invece di 3 (Lampionaio e 2 nemici)`);
    await pag.screenshot({ path: `prove/${nome}-ombre.png`, clip: await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'), c = s.cameras.main, r = s.game.canvas.getBoundingClientRect(), k = r.width / s.scale.width; return { x: r.x + (s.x - c.scrollX - 130) * k, y: r.y + (s.y - c.scrollY - 100) * k, width: 260 * k, height: 140 * k }; }) });
    await pag.evaluate(() => { const l = window.__dl.scene.getScene('Stanze').lab; l.ferma(false); l.ombre(false); });
    await pag.waitForTimeout(100);
    const spente = await ombre();
    if (spente !== 0) errori.push(`ombre spente dal LAB: se ne vedono ancora ${spente}`);
    notaPallini += ', ombre sì';
    await pag.evaluate(() => { const l = window.__dl.scene.getScene('Stanze').lab; l.ombre(true); l.svuota(); l.immortale(false); });
  }
  await pag.waitForTimeout(500);
  const stato = () => pag.evaluate(() => {
    const s = window.__dl.scene.getScene('Stanze');
    return { x: Math.round(s.x), y: Math.round(s.y), ruota: s.ruota, pausa: s.pausa, avviso: !document.querySelector('.stanze-ruota').hidden, pannello: !document.querySelector('.stanze-pausa').hidden };
  });
  let nota = '';
  if (nome.endsWith('verticale')) {
    const s = await stato();
    if (!s.ruota || !s.avviso) errori.push('in verticale non chiede di ruotare il telefono');
    await pag.screenshot({ path: `prove/${nome}.png` });
    nota = 'chiede di ruotare';
  } else {
    // spinge a destra (e poi in alto) più a lungo di quanto serve per arrivare al muro
    const spingi = async (tasto, dx, dy, ms) => {
      if (nome === 'stanze-desktop') {
        await pag.keyboard.down(tasto);
        await pag.waitForTimeout(ms);
        await pag.keyboard.up(tasto);
      } else {
        const cx = Math.round(disp.viewport.width / 3), cy = Math.round(disp.viewport.height / 2);
        await pag.mouse.move(cx, cy);
        await pag.mouse.down();
        await pag.mouse.move(cx + dx, cy + dy, { steps: 5 });
        await pag.waitForTimeout(ms);
        await pag.mouse.up();
      }
    };
    // i bordi veri dell'area camminabile, letti dal gioco (il LAB porta il Lampionaio contro i muri), poi di nuovo al centro
    const a = await pag.evaluate(() => {
      const l = window.__dl.scene.getScene('Stanze').lab;
      l.vai('destra'); const x1 = l.stato().x; l.vai('alto'); const y0 = l.stato().y; l.vai('centro');
      return { x1, y0 };
    });
    const prima = await stato();
    if (prima.ruota) errori.push('in orizzontale chiede di ruotare');
    await spingi('KeyD', 80, 0, 4500);
    const destra = await stato();
    await spingi('KeyW', 0, -80, 3500);
    const alto = await stato();
    await pag.screenshot({ path: `prove/${nome}.png` });
    if (destra.x !== a.x1) errori.push(`a destra si ferma a x ${destra.x}, non al muro (${a.x1})`);
    if (destra.y !== prima.y) errori.push(`spingendo a destra la y cambia (${prima.y} → ${destra.y})`);
    if (alto.y !== a.y0) errori.push(`in alto si ferma a y ${alto.y}, non al muro (${a.y0})`);
    // pausa: P (o il pulsante sul telefono) la apre, P o «Riprendi» la chiude
    if (nome === 'stanze-desktop') await pag.keyboard.press('KeyP');
    else await pag.click('.stanze-tasto-pausa').catch(() => errori.push('pulsante della pausa non toccabile'));
    await pag.waitForTimeout(150);
    const inPausa = await stato();
    if (!inPausa.pausa || !inPausa.pannello) errori.push('la pausa non si apre');
    await pag.screenshot({ path: `prove/${nome}-pausa.png` });
    await pag.click('.stanze-pausa .stanze-tasto').catch(() => errori.push('«Riprendi» non toccabile'));
    await pag.waitForTimeout(150);
    const ripresa = await stato();
    if (ripresa.pausa || ripresa.pannello) errori.push('«Riprendi» non chiude la pausa');
    nota = `muro a destra a x ${destra.x}, in alto a y ${alto.y}, pausa sì`;
    // linea invisibile al centro: a destra il dito non muove il Lampionaio; vicino alla linea la base del joystick non la supera
    if (nome !== 'stanze-desktop') {
      const W = disp.viewport.width, H = disp.viewport.height;
      await pag.evaluate(() => window.__dl.scene.getScene('Stanze').lab.vai('centro'));
      const fermo = await stato();
      await pag.mouse.move(Math.round(W * 0.75), Math.round(H / 2));
      await pag.mouse.down();
      await pag.mouse.move(Math.round(W * 0.75) + 80, Math.round(H / 2), { steps: 5 });
      await pag.waitForTimeout(500);
      await pag.mouse.up();
      const dopoDestra = await stato();
      if (dopoDestra.x !== fermo.x || dopoDestra.y !== fermo.y) errori.push('un dito nella metà destra muove il Lampionaio');
      await pag.mouse.move(Math.round(W / 2) - 4, Math.round(H / 2));
      await pag.mouse.down();
      await pag.waitForTimeout(100);
      const base = await pag.evaluate(() => {
        const j = document.querySelector('.joystick'), b = j.firstElementChild.getBoundingClientRect();
        return { visibile: !j.hidden, destra: b.right, sinistra: b.left };
      });
      await pag.mouse.up();
      if (!base.visibile) errori.push('vicino alla linea il joystick non compare');
      else if (base.destra > W / 2 + 1) errori.push(`la base del joystick supera la linea (bordo destro a ${Math.round(base.destra)}, linea a ${W / 2})`);
      nota += ', linea dei joystick sì';
    }
    // attacco a tasto (passo 3): su computer J e clic verso il puntatore; sul telefono tocco breve e trascinamento del tasto
    const colpo = () => pag.evaluate(() => { const a = window.__dl.scene.getScene('Stanze').attacco; return { colpi: a.colpi, dx: a.dx }; });
    await pag.evaluate(() => window.__dl.scene.getScene('Stanze').lab.vai('centro'));
    const c0 = await colpo();
    const W = disp.viewport.width, H = disp.viewport.height;
    if (nome === 'stanze-desktop') {
      await pag.keyboard.press('KeyJ');
      // il colpo ferisce quando l'asta cala (ATTACCO.anticipo): il fendente pixelfx, o l'arco se il foglio non è ancora arrivato
      const arco = await pag.waitForFunction(() => { const e = window.__dl.scene.getScene('Stanze').effetti; return e.fendenti.some((a) => a.visible) || e.archi.some((a) => a.visible); }, null, { timeout: 600, polling: 10 }).then(() => true).catch(() => false);
      if (!arco) errori.push('dopo il colpo il fendente di luce non compare');
      await pag.waitForTimeout(550);
      const cJ = await colpo();
      if (cJ.colpi !== c0.colpi + 1) errori.push('J non fa partire il colpo');
      await pag.mouse.click(Math.round(W * 0.15), Math.round(H / 2));
      await pag.waitForTimeout(100);
      await pag.screenshot({ path: `prove/${nome}-colpo.png` });
      await pag.waitForTimeout(450);
      const cC = await colpo();
      if (cC.colpi !== cJ.colpi + 1 || cC.dx >= 0) errori.push(`il clic a sinistra non colpisce a sinistra (colpi ${cC.colpi}, dx ${cC.dx})`);
      if (await pag.evaluate(() => getComputedStyle(document.querySelector('.stanze-attacco')).display !== 'none')) errori.push('su computer il tasto d\'attacco si vede');
      nota += ', attacco J e clic sì';
    } else {
      if (await pag.evaluate(() => getComputedStyle(document.querySelector('.stanze-attacco')).display === 'none')) errori.push('sul telefono il tasto d\'attacco non si vede');
      const t = await pag.evaluate(() => { const r = document.querySelector('.stanze-attacco').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.width }; });
      const fermo = await stato();
      await pag.mouse.move(t.x, t.y);
      await pag.mouse.down();
      await pag.mouse.up();
      await pag.waitForTimeout(550);
      const cT = await colpo();
      const dopoT = await stato();
      if (cT.colpi !== c0.colpi + 1) errori.push('il tocco sul tasto d\'attacco non fa partire il colpo');
      if (dopoT.x !== fermo.x || dopoT.y !== fermo.y) errori.push('il tocco sul tasto d\'attacco muove il Lampionaio');
      await pag.mouse.move(t.x, t.y);
      await pag.mouse.down();
      await pag.mouse.move(t.x - 60, t.y, { steps: 5 });
      await pag.waitForTimeout(150);
      const spostato = await pag.evaluate(() => document.querySelector('.stanze-attacco .arte:last-child').style.transform);
      if (!/translate\(-/.test(spostato)) errori.push(`trascinando, il pomello del joystick d'attacco non segue il pollice (${spostato || 'fermo'})`);
      await pag.screenshot({ path: `prove/${nome}-mira.png` });
      await pag.mouse.up();
      await pag.waitForTimeout(100);
      const cM = await colpo();
      if (cM.colpi !== cT.colpi + 1 || cM.dx >= 0) errori.push(`trascinando a sinistra il colpo non va a sinistra (colpi ${cM.colpi}, dx ${cM.dx})`);
      if (t.l < 44) errori.push(`il joystick d'attacco è largo ${Math.round(t.l)} punti (almeno 44)`);
      // grande come il joystick di movimento (stessi disegni, stesso ingrandimento)
      await pag.mouse.move(Math.round(W / 4), Math.round(H / 2));
      await pag.mouse.down();
      const mov = await pag.evaluate(() => document.querySelector('.joystick .arte').getBoundingClientRect().width);
      await pag.mouse.up();
      if (Math.abs(mov - t.l) > 1) errori.push(`il joystick d'attacco (${Math.round(t.l)} punti) non è grande come quello di movimento (${Math.round(mov)})`);
      nota += ', attacco tocco e mira sì';
    }
    // passo 4: i nemici. Ricaduto: avviso, poi graffio; schivata perfetta del graffio e del grumo (Grazia); nemico battuto;
    // rinascita; caduta del Lampionaio e «Ricomincia»
    const L = (f, ...a) => pag.evaluate(([f, a]) => window.__dl.scene.getScene('Stanze').lab[f](...a), [f, a]);
    const st = () => L('stato');
    // aspetta dentro la pagina, fotogramma per fotogramma, che cond() sia vera, poi fa azione() (niente ritardi di Playwright)
    const quando = (cond, azione, ms) => pag.evaluate(([cond, azione, ms]) => new Promise((ok) => {
      const l = window.__dl.scene.getScene('Stanze').lab, fine = performance.now() + ms;
      const f = () => { if (new Function('l', `return ${cond}`)(l)) { new Function('l', azione)(l); ok(true); } else if (performance.now() > fine) ok(false); else requestAnimationFrame(f); };
      f();
    }), [cond, azione, ms]);
    // la minimappa (passo 4, 18/11): nell'angolo in alto, dentro lo schermo e nell'area sicura, senza toccare la pausa, a
    // sinistra e a destra (LAB); nella pausa la mappa intera
    {
      const riquadri = () => pag.evaluate(() => {
        const q = (s) => { const b = document.querySelector(s)?.getBoundingClientRect(); return b && { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
        return { mm: q('.stanze-minimappa'), pausa: q('.stanze-tasto-pausa'), mp: q('.stanze-mappa-pausa'), W: innerWidth, H: innerHeight };
      });
      const dentro = (b, r) => b && b.w > 0 && b.h > 0 && b.l >= 0 && b.t >= 0 && b.r <= r.W + 0.5 && b.b <= r.H + 0.5;
      const tocca = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      for (const lato of ['destra', 'sinistra']) {
        await L('latoMinimappa', lato);
        const r = await riquadri();
        if (!dentro(r.mm, r)) errori.push(`minimappa a ${lato} fuori dallo schermo (${JSON.stringify(r.mm)})`);
        else {
          if (r.mm.t > r.H * 0.2) errori.push(`minimappa a ${lato} non in alto (y ${Math.round(r.mm.t)})`);
          if ((lato === 'destra') !== (r.mm.l > r.W / 2)) errori.push(`minimappa non a ${lato}`);
          if (tocca(r.mm, r.pausa)) errori.push(`minimappa a ${lato} sopra il pulsante della pausa`);
        }
        if (lato === 'destra' && nome !== 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-minimappa-destra.png` });
      }
      await pag.evaluate(() => window.__dl.scene.getScene('Stanze').apriPausa());
      await pag.waitForTimeout(100);
      const rp = await riquadri();
      if (!dentro(rp.mp, rp)) errori.push(`nella pausa la mappa non si vede (${JSON.stringify(rp.mp)})`);
      if (nome !== 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-mappa-pausa.png` });
      await pag.evaluate(() => window.__dl.scene.getScene('Stanze').riprendi());
      nota += ', minimappa sì';
    }
    await L('vai', 'centro');
    await L('cura');
    const s0 = await st();
    await L('nemico', 'ricaduto', 40, true);
    if (!(await quando('l.prossimoAttacco() < Infinity', '', 1000))) errori.push('il Ricaduto vicino non prepara il graffio');
    await pag.screenshot({ path: `prove/${nome}-nemici.png` });
    await pag.waitForTimeout(700);
    const s1 = await st();
    if (s1.ferite !== s0.ferite + 1 || s1.salute >= s1.saluteMassima) errori.push(`stando fermi il graffio non ferisce (colpi subiti ${s0.ferite} → ${s1.ferite}, salute ${s1.salute})`);
    // schivata del graffio: il Lampionaio esce dallo spicchio quando mancano meno di 0,2 s
    await L('svuota');
    await L('cura');
    await pag.waitForTimeout(700); // finisce l'invulnerabilità
    await L('nemico', 'ricaduto', 40, true);
    if (!(await quando('l.prossimoAttacco() <= 0.2', 'l.sposta(-110, 0)', 1500))) errori.push('il secondo Ricaduto non prepara il graffio');
    await pag.waitForTimeout(450);
    const s2 = await st();
    if (s2.schivate !== s1.schivate + 1 || !(s2.grazia > 0)) errori.push(`uscire dallo spicchio all'ultimo non dà la Grazia (schivate ${s2.schivate}, Grazia ${s2.grazia})`);
    if (s2.ferite !== s1.ferite) errori.push('uscito dallo spicchio, il graffio ferisce lo stesso');
    // schivata del grumo: un Cantore a destra; il grumo ti cerca, ma se all'ultimo (a 45 px) il Lampionaio fa un passo di
    // lato, il grumo non fa in tempo a girare e lo sfiora
    await L('svuota');
    await L('vai', 'centro');
    const c = await st();
    await L('nemicoIn', 'cantore', c.x + 230, c.y);
    const vicinoGrumo = '(() => { const s = window.__dl.scene.getScene("Stanze"), n = s.nemici; return n.grumi > 0 && Math.hypot(n.gX[0] - s.x, n.gY[0] - s.y) < 45; })()';
    if (!(await quando(vicinoGrumo, 'l.sposta(0, 48)', 4000))) errori.push('il Cantore non lancia il grumo');
    await pag.waitForTimeout(1900);
    const s3 = await st();
    if (s3.schivate !== s2.schivate + 1) errori.push(`il grumo che sfiora non dà la Grazia (schivate ${s2.schivate} → ${s3.schivate})`);
    if (s3.ferite !== s2.ferite) errori.push('il grumo ferisce anche se è passato di lato');
    // il grumo che non ti prende scoppia contro il muro in una pozza di cera; la pozza sotto i piedi ferisce e dopo 2 s sparisce
    if (!(await quando('l.stato().pozze > 0', '', 3000))) errori.push('il grumo contro il muro non lascia la pozza di cera');
    await L('svuota');
    await L('cura');
    await pag.waitForTimeout(600); // finisce la Quiete
    const p0 = await st();
    await L('pozza', 0);
    await pag.waitForTimeout(300);
    const p1 = await st();
    if (p1.ferite !== p0.ferite + 1) errori.push(`la pozza di cera sotto i piedi non ferisce (colpi subiti ${p0.ferite} → ${p1.ferite})`);
    if (!(await quando('l.stato().pozze === 0', '', 2500))) errori.push('la pozza di cera non sparisce dopo 2 s');
    // nemico battuto: un Ricaduto cade con i colpi automatici che bastano di sicuro (salute / danno minimo) e resta a terra; senza rinascita poi sparisce, con la rinascita si rialza
    await L('svuota');
    await quando('l.stato().grazia <= 0', '', 4000); // senza Grazia: il conto dei colpi è quello normale
    await L('immortale', true);
    await L('rinascita', false);
    await L('vai', 'centro');
    const colpiRicaduto = await L('colpiPerBattere', 'ricaduto');
    await L('nemico', 'ricaduto', 60, true);
    for (let k = 0; k < colpiRicaduto; k++) { await L('attacca', 'auto'); await pag.waitForTimeout(500); }
    const aTerra = await L('aTerra');
    await pag.waitForTimeout(1700);
    const s4 = await st();
    if (aTerra !== 1 || s4.uccisi !== s3.uccisi + 1 || s4.nemici !== 0) errori.push(`${colpiRicaduto} colpi della Lanterna non battono il Ricaduto (a terra ${aTerra}, battuti ${s4.uccisi}, in campo ${s4.nemici})`);
    await L('rinascita', true);
    await L('nemico', 'ricaduto', 60, true);
    for (let k = 0; k < colpiRicaduto; k++) { await L('attacca', 'auto'); await pag.waitForTimeout(500); }
    const giu = await L('aTerra');
    await pag.waitForTimeout(1500);
    const s5 = await st();
    if (giu !== 1 || s5.rinascite !== 1 || s5.nemici !== 1) errori.push(`il Ricaduto non torna in vita (a terra ${giu}, rinati ${s5.rinascite}, in campo ${s5.nemici})`);
    // abilità (passo 5): si carica solo colpendo; piena, il pulsante (o Spazio) la fa partire
    await L('svuota');
    await L('caricaAbilita', false);
    await L('vai', 'centro');
    await L('nemico', 'ricaduto', 60, true);
    await L('attacca', 'auto');
    await pag.waitForTimeout(400);
    await L('attacca', 'su'); // a vuoto: non carica
    await pag.waitForTimeout(500);
    const a1 = await st();
    if (a1.carica !== 1) errori.push(`l'abilità non si carica solo colpendo (carica ${a1.carica} colpi, attesi 1)`);
    await L('caricaAbilita', true);
    if (nome === 'stanze-desktop') await pag.keyboard.press('Space');
    else await pag.click('.stanze-abilita').catch(() => errori.push('il pulsante dell\'abilità non è toccabile'));
    await pag.waitForTimeout(300);
    const a2 = await st();
    if (a2.abilitaUsi !== 1 || !(a2.abilitaAttiva > 0) || a2.carica !== 0) errori.push(`l'abilità piena non parte (usi ${a2.abilitaUsi}, attiva ${a2.abilitaAttiva}, carica ${a2.carica})`);
    await pag.screenshot({ path: `prove/${nome}-abilita.png` });
    // attimo al rallentatore della Grazia
    await L('svuota');
    await L('grazia');
    await pag.waitForTimeout(50); // un fotogramma: il rallentatore si applica in update
    const lento = await pag.evaluate(() => window.__dl.scene.getScene('Stanze').anims.globalTimeScale);
    await pag.waitForTimeout(600);
    const dopo = await pag.evaluate(() => window.__dl.scene.getScene('Stanze').anims.globalTimeScale);
    if (!(lento < 1) || dopo !== 1) errori.push(`la Grazia non fa l'attimo al rallentatore (${lento} → ${dopo})`);
    // caduta: salute a 1, un graffio, «Sei caduto», poi «Ricomincia» rifà la stanza con la salute piena
    await L('svuota');
    await L('immortale', false);
    await L('rinascita', null);
    await pag.waitForTimeout(700);
    await L('fiaschettaVuota'); // la fiaschetta automatica salverebbe il Lampionaio
    await L('salute', 1);
    await L('nemico', 'ricaduto', 40, true);
    await pag.waitForTimeout(700 + 900 + 300);
    const caduto = await st();
    const fine = await pag.evaluate(() => !document.querySelector('.stanze-fine').hidden);
    if (!caduto.morto || !fine) errori.push(`con la salute a 1 il graffio non fa cadere il Lampionaio (caduto ${caduto.morto}, scritta ${fine})`);
    else {
      await pag.screenshot({ path: `prove/${nome}-caduto.png` });
      await pag.click('.stanze-fine .stanze-tasto').catch(() => errori.push('«Ricomincia» non toccabile'));
      await pag.waitForTimeout(400);
      const di = await st();
      if (di.morto || di.salute !== di.saluteMassima) errori.push('«Ricomincia» non rifà la stanza');
    }
    nota += `, nemici sì (graffio, schivate ${s3.schivate}, pozza, battuti, rinascita, caduta), abilità e rallentatore sì`;
    // passo 6: tre stanze. Ripulita la stanza arrivano le carte (nella prima 3 Echi); scelta una carta si aprono le porte;
    // attraversata una porta si entra nella stanza dopo; dopo la terza l'arena del Campanaro (17/11), poi «Fetta completata»
    // danno a intervallo (14/11): i colpi della Lanterna escono tra il minimo e il massimo del livello, e non sempre uguali
    for (const livello of [1, 5]) {
      await L('livelliAUno');
      for (let k = 1; k < livello; k++) await L('lanternaSu');
      const iv = await L('intervalloLanterna');
      const [a, b] = iv.atteso;
      if (iv.minimo < a - 1e-6 || iv.massimo > b + 1e-6) errori.push(`Lanterna liv ${livello}: danno ${iv.minimo.toFixed(1)}–${iv.massimo.toFixed(1)} fuori da ${a}–${b}`);
      if (iv.diversi < Math.min(4, b - a)) errori.push(`Lanterna liv ${livello}: solo ${iv.diversi} valori diversi in 200 colpi`);
      nota += livello === 1 ? `, danno Lanterna liv 1 ${Math.round(iv.minimo)}–${Math.round(iv.massimo)}` : ` e liv 5 ${Math.round(iv.minimo)}–${Math.round(iv.massimo)}`;
    }
    // rompibili (16/11): da 2 a 4 per stanza, ostacoli che non si rompono al tocco; rotti, la giara lascia Cera da raccogliere
    if (nome === 'stanze-desktop') {
      const vuoto = (await L('rompibili')).interi;
      if (vuoto) errori.push(`nell'ingresso ci sono ${vuoto} rompibili (deve essere vuoto)`);
      await L('nuoviRompibili');
      const r0 = await L('rompibili');
      if (r0.interi < 1 || r0.interi > 2) errori.push(`rompibili nella stanza: ${r0.interi} (attesi da 1 a 2)`);
      await L('vai', 'centro');
      await L('rompibiliAccanto');
      const accanto = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); s.x = 336; s.y = 224; return s.lab.rompibili().interi; });
      await pag.waitForTimeout(150);
      const urto = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); return { d: Math.hypot(s.x - 336, s.y - 224), interi: s.lab.rompibili().interi }; });
      if (urto.interi !== accanto) errori.push('un rompibile si è rotto al tocco');
      if (urto.d < 20) errori.push(`il Lampionaio entra nell'urna (a ${urto.d.toFixed(0)} px dalla base)`);
      for (let k = 0; k < 3; k++) await L('rompiVicino');
      if ((await L('rompibili')).interi !== accanto - 3) errori.push('«Rompi il più vicino» non rompe');
      await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); s.x = 276; s.y = 224; });
      await pag.waitForTimeout(600);
      const cera = (await L('rompibili')).cera;
      if (cera < 2) errori.push(`la giara rotta non lascia Cera da raccogliere (${cera})`);
      nota += `, rompibili ${r0.interi} (Cera ${cera})`;
    }
    await L('livelliAUno');
    await L('immortale', true);
    // la mappa del Mondo (17/11, passo 2): si comincia nell'ingresso, vuoto e con le porte aperte (almeno 2, verso gli Echi)
    const giro = [];
    const muro = (p) => p.split(':')[0];
    const opposto = { alto: 'basso', basso: 'alto', destra: 'sinistra', sinistra: 'destra' };
    // dopo il passaggio a retino si è davanti alla porta sul muro opposto, verso il centro
    const davanti = (s, m) => (m === 'alto' ? s.y < 120 : m === 'basso' ? s.y > s.altezza - 120 : m === 'sinistra' ? s.x < 120 : s.x > s.larghezza - 120);
    let m0 = await st();
    if (m0.tipo !== 'ingresso' || m0.fase !== 'porte' || m0.nemici) errori.push(`all'inizio non si è nell'ingresso vuoto e aperto (${m0.tipo}, ${m0.fase}, ${m0.nemici} nemici)`);
    if (m0.porte.length < 2 || m0.porte.some((p) => !p.endsWith('echi'))) errori.push(`le porte dell'ingresso non portano agli Echi d'inizio (${m0.porte.join(', ')})`);
    giro.push(`ingresso (${m0.porte.length} porte)`);
    const verso = muro(m0.porte[0]);
    await L('attraversaMuro', verso);
    if (!(await quando(`l.stato().tipo !== 'ingresso' && l.stato().fase === 'lotta'`, '', 2000))) errori.push('dalla porta dell\'ingresso non si entra in una stanza da combattere');
    else {
      const s1 = await st();
      if (!davanti(s1, opposto[verso])) errori.push(`uscito ${verso}, non si entra dalla porta ${opposto[verso]} (${s1.x}, ${s1.y})`);
      if (s1.porte.some((p) => !p.endsWith('–'))) errori.push('durante il combattimento le porte hanno il medaglione');
      // le carte: 2, Echi d'inizio di affinità diverse
      await L('forzaGrado', 'ardente'); // rarità (17/11): la Lapide (Ardente) esce di sicuro, se tocca alla Terra
      await L('ripulisci');
      if (!(await quando('l.stato().carteAperte', '', 3000))) errori.push('stanza degli Echi: le carte non arrivano');
      else {
        await L('forzaGrado', null);
        const gradi = await pag.evaluate(() => [...document.querySelectorAll('.doni-carta')].map((c) => ({ g: c.dataset.grado, nome: c.querySelector('.doni-grado')?.textContent ?? '', lampo: !!c.querySelector('.doni-bagliore') })));
        if (gradi.length !== 2) errori.push(`le carte sono ${gradi.length} (attese 2)`);
        if (gradi.some((c) => !c.g || !c.nome)) errori.push('una carta delle stanze non mostra il suo grado');
        if (gradi.some((c) => c.g !== 'ardente' && c.lampo)) errori.push('una carta non Ardente ha il bagliore');
        nota += `, gradi delle carte ${gradi.map((c) => c.nome).join('/')}`;
        await pag.waitForTimeout(520); // le carte salgono, poi sopra ognuna scoppia l'effetto di comparsa
        if (!(await pag.evaluate(() => document.querySelectorAll('.doni-comparsa').length))) errori.push('sopra le carte non compare l\'effetto di comparsa');
        await pag.screenshot({ path: `prove/${nome}-carte.png` });
        if (nome === 'stanze-desktop') await pag.keyboard.press('Digit1');
        else await pag.click('.doni-carta').catch(() => errori.push('la carta non è toccabile'));
        await pag.waitForTimeout(200);
        const dopo = await st();
        if (dopo.carteAperte) errori.push('la carta scelta non chiude le carte');
        if (dopo.echi.length !== 1) errori.push(`nella stanza degli Echi la carta non dà un Eco (${dopo.echi.join(', ')})`);
        if (dopo.fase !== 'porte' || !dopo.porte.length) errori.push(`scelta la carta le porte non si aprono (${dopo.fase})`);
        // lo Specchio delle stanze (17/11): colpi in più e il loro danno per livello
        if (nome === 'stanze-desktop') {
          const sp = [];
          for (const l of [1, 2, 3]) {
            await L('specchio', l);
            await pag.waitForTimeout(60);
            sp.push(await pag.evaluate(() => { const b = window.__dl.scene.getScene('Stanze').bonus; return `${b.quantita}@${b.riflesso}`; }));
          }
          await L('specchio', 0);
          if (sp.join(' ') !== '1@0.5 2@0.5 2@1') errori.push(`Specchio: colpi e danno per livello ${sp.join(' ')} (attesi 1@0.5 2@0.5 2@1)`);
        }
        giro.push(`Echi: ${dopo.echi.join('+')}`);
        await pag.waitForTimeout(1500); // l'Eco spara da solo
        await pag.screenshot({ path: `prove/${nome}-porte.png` });
        // indietro all'ingresso: già ripulito, vuoto e aperto; la porta verso la stanza appena ripulita non ha medaglione
        await L('attraversaMuro', opposto[verso]);
        if (!(await quando(`l.stato().tipo === 'ingresso'`, '', 2000))) errori.push('tornando indietro non si arriva all\'ingresso');
        else {
          const s2 = await st();
          if (s2.fase !== 'porte' || s2.nemici) errori.push(`l'ingresso, tornandoci, non è vuoto e aperto (${s2.fase}, ${s2.nemici} nemici)`);
          if (!davanti(s2, verso)) errori.push(`tornando all'ingresso non si entra dalla porta ${verso}`);
          const pv = s2.porte.find((p) => muro(p) === verso);
          if (!pv || !pv.endsWith('–')) errori.push(`la porta verso la stanza ripulita ha ancora il medaglione (${pv})`);
          // e di nuovo nella stanza ripulita: vuota, porte aperte, niente carte
          await L('attraversaMuro', verso);
          if (!(await quando(`l.stato().tipo !== 'ingresso'`, '', 2000))) errori.push('la porta verso la stanza ripulita non si attraversa');
          else {
            await pag.waitForTimeout(600);
            const s3 = await st();
            if (s3.fase !== 'porte' || s3.nemici || s3.carteAperte) errori.push(`la stanza ripulita torna a combattere (${s3.fase}, ${s3.nemici} nemici)`);
            giro.push('indietro e avanti');
          }
        }
      }
    }
    // la porta del Boss (18/11): dalla stanza accanto (ripulita) è chiusa, con il lucchetto, finché il Campanaro non è
    // battuto; spingendoci contro non si passa e compare la scritta
    const vb = await pag.evaluate(() => {
      const m = window.__dl.scene.getScene('Stanze').mappa, b = m.stanze[m.boss], l = b.vicine.findIndex((v) => v >= 0);
      m.stanze[b.vicine[l]].ripulita = true;
      return { i: b.vicine[l], muro: ['basso', 'sinistra', 'alto', 'destra'][l] };
    });
    await L('vaiAllaStanza', vb.i);
    await pag.waitForTimeout(300);
    const sb = await st();
    const pb = sb.porte.find((p) => muro(p) === vb.muro);
    if (sb.chiave || sb.chiuse !== 1 || !pb?.endsWith('chiusa')) errori.push(`prima del Campanaro la porta del Boss non è chiusa col lucchetto (chiave ${sb.chiave}, chiuse ${sb.chiuse}, ${pb})`);
    await L('attraversaMuro', vb.muro);
    await pag.waitForTimeout(500);
    const sb2 = await st();
    const avviso = await pag.evaluate(() => window.__dl.scene.getScene('Stanze').avvisoVita > 0);
    if (sb2.indice !== vb.i) errori.push('la porta del Boss chiusa si attraversa');
    if (!avviso) errori.push('spingendo contro la porta del Boss chiusa non compare la scritta');
    if (nome === 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-boss-chiuso.png` });
    // chiavi e porte chiuse a chiave (18/11): senza chiave l'avviso; con la chiave «Apri», che apre e consuma la chiave
    {
      const c0 = await L('chiavi');
      if (c0.serrate < 1 || c0.sicura === 'nessuna') errori.push(`la mappa non ha porte chiuse a chiave o la chiave sicura (${JSON.stringify(c0)})`);
      await pag.waitForTimeout(1700); // finisce la scritta della porta del Boss, provata qui sopra
      await pag.evaluate(() => { window.__dl.scene.getScene('Stanze').percorso.chiavi = 0; }); // le prove prima possono averne trovata una
      await L('vaiAllaSerratura');
      await pag.waitForTimeout(300);
      const senza = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); return { apri: !document.querySelector('.stanze-apri').hidden, avviso: s.avvisoVita > 0 && s.avviso.texture.key.endsWith('Serve una chiave') }; });
      if (senza.apri || !senza.avviso) errori.push(`senza chiave, davanti alla porta chiusa: «Apri» ${senza.apri}, avviso ${senza.avviso}`);
      await L('daiChiave');
      await pag.waitForTimeout(200);
      const conChiave = await pag.evaluate(() => !document.querySelector('.stanze-apri').hidden);
      if (!conChiave) errori.push('con la chiave, davanti alla porta chiusa, «Apri» non compare');
      else {
        if (nome === 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-serratura.png` });
        await pag.click('.stanze-apri').catch(() => errori.push('«Apri» non è toccabile'));
        await pag.waitForTimeout(200);
        const c1 = await L('chiavi');
        if (c1.chiavi !== 0 || c1.serrate !== c0.serrate - 1) errori.push(`«Apri» non apre la porta (${JSON.stringify(c1)})`);
        else giro.push('porta chiusa a chiave');
      }
      // la porta delle candele (18/11): la Lanterna accende una candela; accese tutte, la porta si apre
      await L('vaiAllaCandela');
      await pag.waitForTimeout(300);
      const k0 = await L('chiavi');
      await pag.keyboard.press('KeyJ');
      await pag.waitForTimeout(700);
      const k1 = await L('chiavi');
      if (parseInt(k1.candele) !== parseInt(k0.candele) + 1) errori.push(`la Lanterna non accende la candela (${k0.candele} › ${k1.candele})`);
      await L('accendiCandele');
      const aperta = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); return s.percorso.candeleAccese && s.mappa.stanze.some((x) => x.candele); });
      if (!aperta) errori.push('accese tutte le candele la porta delle candele non si apre');
      else giro.push('candele');
      const cont = await pag.evaluate(() => { const c = document.querySelector('.stanze-contatori'); return c && !c.hidden && c.textContent.length > 1; });
      if (!cont) errori.push('sotto la minimappa non ci sono Cera e chiavi');
    }
    // tesoro e Sosta (18/11): vuoti e aperti; il forziere dà 3 carte rare (Chiara o Ardente), la fonte riempie la fiaschetta
    await L('vaiAlTesoro');
    await pag.waitForTimeout(300);
    const t0 = await st();
    if (t0.tipo !== 'tesoro' || t0.fase !== 'porte' || t0.nemici) errori.push(`il tesoro non è vuoto e aperto (${t0.tipo}, ${t0.fase}, ${t0.nemici} nemici)`);
    if (nome === 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-tesoro.png` });
    await L('usaOggetto');
    if (!(await quando('l.stato().carteAperte', '', 2000))) errori.push('il forziere del tesoro non apre le carte');
    else {
      const gt = await pag.evaluate(() => [...document.querySelectorAll('.doni-carta')].map((c) => c.dataset.grado));
      if (gt.length !== 3 || gt.some((g) => g !== 'chiara' && g !== 'ardente')) errori.push(`le carte del tesoro non sono 3 rare (${gt.join(', ')})`);
      if (nome === 'stanze-desktop') await pag.keyboard.press('Digit1');
      else await pag.click('.doni-carta').catch(() => errori.push('la carta del tesoro non è toccabile'));
      await pag.waitForTimeout(200);
      const t1 = await st();
      const preso = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); return s.mappa.stanze[s.mappa.tesoro].ripulita; });
      if (t1.carteAperte || t1.fase !== 'porte' || !preso) errori.push('scelta la carta, il tesoro non resta aperto e preso');
      giro.push(`tesoro (${gt.join('/')})`);
    }
    await L('vaiAllaSosta');
    await pag.waitForTimeout(300);
    const so = await st();
    if (so.tipo !== 'sosta' || so.fase !== 'porte' || so.nemici) errori.push(`la Sosta non è vuota e aperta (${so.tipo}, ${so.fase})`);
    const fonte = await pag.evaluate(async () => {
      const s = window.__dl.scene.getScene('Stanze'), f = s.fiaschetta, piena = f.massimo;
      s.mappa.stanze[s.mappa.sosta].ripulita = false; // la prova della porta del Boss l'aveva segnata ripulita
      f.sorsi = f.massimo;
      s.lab.usaOggetto();
      await new Promise((ok) => setTimeout(ok, 150));
      const restaPiena = !s.mappa.stanze[s.mappa.sosta].ripulita; // a fiaschetta piena la fonte non si consuma
      s.x = s.porte.davanti(0).x; s.y = s.porte.davanti(0).y;
      await new Promise((ok) => setTimeout(ok, 50));
      s.porteBloccate = true;
      f.sorsi = 0;
      s.lab.usaOggetto();
      await new Promise((ok) => setTimeout(ok, 150));
      s.porteBloccate = false;
      return { restaPiena, sorsi: f.sorsi, piena, usata: s.mappa.stanze[s.mappa.sosta].ripulita };
    });
    if (!fonte.restaPiena) errori.push('a fiaschetta piena la fonte della Sosta si consuma lo stesso');
    if (fonte.sorsi !== fonte.piena || !fonte.usata) errori.push(`la fonte della Sosta non riempie la fiaschetta (${fonte.sorsi} di ${fonte.piena})`);
    else giro.push('Sosta');
    // l'arena del Campanaro: compare da solo, con la sua barra in cima; poi si ripulisce come le altre
    const sa0 = await st(); // la Sosta: una stanza normale
    if (sa0.doppia) errori.push('la Sosta è doppia');
    await L('vaiAlCampanaro');
    if (!(await quando('l.campanaro() && l.campanaro().massima > 0', '', 4000))) errori.push('nella stanza del Campanaro lui non compare');
    else {
      // l'arena doppia (18/11): 26 × 7 lastre, il Campanaro compare al centro
      const ac = await st(), cc = await L('campanaro');
      if (!ac.doppia || ac.larghezza !== 2 * sa0.larghezza) errori.push(`l'arena del Campanaro non è doppia (${ac.larghezza} × ${ac.altezza})`);
      if (Math.abs(cc.x - ac.larghezza / 2) > 4 || Math.abs(cc.y - ac.altezza / 2) > 4) errori.push(`il Campanaro non compare al centro (${cc.x}, ${cc.y})`);
      if (await pag.evaluate(() => document.querySelector('.stanze-capo').hidden)) errori.push('la barra del Campanaro non si vede');
      await L('attaccoCampanaro', 'carica');
      await pag.waitForTimeout(500);
      if (nome === 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-campanaro.png` });
      await L('ripulisci');
      if (!(await quando('l.stato().carteAperte', '', 3000))) errori.push('dopo il Campanaro le carte non arrivano');
      else {
        if (nome === 'stanze-desktop') await pag.keyboard.press('Digit1');
        else await pag.click('.doni-carta').catch(() => errori.push('la carta non è toccabile'));
        await pag.waitForTimeout(200);
        const dc = await st();
        if (dc.fase !== 'porte') errori.push(`dopo il Campanaro le porte non si aprono (${dc.fase})`);
        if (!(await pag.evaluate(() => document.querySelector('.stanze-capo').hidden))) errori.push('la barra del Campanaro resta dopo di lui');
        // il premio (17/11): un sorso nella fiaschetta; a fiaschetta piena si beve subito
        const f = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); return { sorsi: s.fiaschetta.sorsi, massimo: s.fiaschetta.massimo }; });
        const pf = await pag.evaluate(() => { const fz = window.__dl.scene.getScene('Stanze').fiaschetta; fz.sorsi = fz.massimo; const b = fz.bevuti; fz.premio(1); return fz.sorsi === fz.massimo && fz.bevuti === b + 1; });
        if (!pf) errori.push('a fiaschetta piena il sorso del premio non si beve');
        if (f.sorsi < Math.min(f.massimo, 1)) errori.push(`dopo il Campanaro la fiaschetta ha ${f.sorsi} sorsi`);
        giro.push('Campanaro');
      }
    }
    // battuto il Campanaro la porta del Boss è aperta (medaglione del capo); entrati, le porte si chiudono alle spalle e
    // dopo un attimo arriva la fine provvisoria
    await L('vaiAllaStanza', vb.i);
    await pag.waitForTimeout(300);
    const sa = await st();
    const pa = sa.porte.find((p) => muro(p) === vb.muro);
    if (!sa.chiave || sa.chiuse || !pa?.endsWith('capo')) errori.push(`battuto il Campanaro la porta del Boss non si apre (chiave ${sa.chiave}, chiuse ${sa.chiuse}, ${pa})`);
    if (nome === 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-boss-aperto.png` });
    await L('attraversaMuro', vb.muro);
    if (!(await quando(`l.stato().tipo === 'boss'`, '', 2000))) errori.push('la porta del Boss aperta non si attraversa');
    const db = await st();
    if (db.tipo === 'boss' && (db.fase !== 'lotta' || db.finita)) errori.push(`entrando dal Boss: fase ${db.fase}, finita subito ${db.finita}`);
    if (db.tipo === 'boss' && !db.doppia) errori.push(`la stanza del Boss non è doppia (${db.larghezza} × ${db.altezza})`);
    await pag.waitForTimeout(250);
    const chiuseBoss = await pag.evaluate(() => { const s = window.__dl.scene.getScene('Stanze'); return { aperte: s.porte.aperte, muri: s.porte.muri.length, passa: s.porte.attraversata(...Object.values(s.porte.davanti(0))) }; });
    if (chiuseBoss.aperte || chiuseBoss.passa >= 0) errori.push('entrati dal Boss la porta alle spalle non si chiude');
    // Seth (18/11): compare al centro con la sua barra; le tre mosse, i detriti in fase 2; battuto, «Mondo 1 completato»
    if (!(await quando('l.seth() && l.seth().massima > 0', '', 5000))) errori.push('nella stanza del Boss Seth non compare');
    else {
      const sc = await L('seth');
      if (Math.abs(sc.x - db.larghezza / 2) > 4 && db.tipo === 'boss') errori.push(`Seth non compare al centro (${sc.x}, ${sc.y})`);
      if (await pag.evaluate(() => document.querySelector('.stanze-capo').hidden)) errori.push('la barra di Seth non si vede');
      await L('immortale', true);
      for (const m of ['falciata', 'falci', 'passo']) {
        await L('attaccoSeth', m);
        await pag.waitForTimeout(1300);
      }
      const s1 = await L('seth');
      if (s1.falciate < 1 || s1.lanci < 1 || s1.passi < 1) errori.push(`Seth non fa le sue mosse (falciate ${s1.falciate}, falci ${s1.lanci}, passi ${s1.passi})`);
      if (nome === 'stanze-desktop') { await L('attaccoSeth', 'falci'); await pag.waitForTimeout(400); await pag.screenshot({ path: `prove/${nome}-seth.png` }); }
      await L('saluteCampanaro', 0.49);
      if (!(await quando('l.seth().detriti > 0', '', 6000))) errori.push(`in fase 2 il Passo della Morte non lancia i detriti (${JSON.stringify(await L('seth'))}, mossa ${await pag.evaluate(() => { const st = window.__dl.scene.getScene('Stanze'), n = st.nemici, i = n.indiceCapo(); return `${n.seth.mossa}, tempo ${n.seth.tempo.toFixed(2)}, fermo ${n.fermi[i]}, echi ${st.arsenale.possedute.map((p) => p.arma.id).join('/')}`; })})`);
      else if (nome === 'stanze-desktop') await pag.screenshot({ path: `prove/${nome}-seth-detriti.png` });
      await L('immortale', false);
      await pag.evaluate(() => { const n = window.__dl.scene.getScene('Stanze').nemici, i = n.indiceCapo(); if (i >= 0) n.orda.salute[i] = 0; });
      await pag.waitForTimeout(1900); // PERCORSO.attesaCapo (1,5 s) e il passo in cui Seth se ne va
      const fb = await st();
      const titolo = await pag.evaluate(() => document.querySelector('.stanze-fine')?.hidden === false);
      if (!fb.finita || !titolo) errori.push('battuto Seth la fine del Mondo 1 non arriva');
      else {
        await pag.screenshot({ path: `prove/${nome}-fetta.png` });
        giro.push('Seth');
      }
    }
    nota += `, percorso ${giro.join(' › ')}`;
  }
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} ${nome}: ${nota}${notaPallini}${notaMappe}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}

// Potenziali degli Echi (14/11): tutti al livello 5 insieme, con nemici in campo, per qualche secondo; niente errori
{
  const errori = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pag = await ctx.newPage();
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?stanze`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Stanze'), null, { timeout: 15000 }).catch(() => errori.push('la scena Stanze non parte'));
  const L = (f, ...a) => pag.evaluate(([f, a]) => window.__dl.scene.getScene('Stanze').lab[f](...a), [f, a]);
  await L('ondateAutomatiche', false);
  await L('svuota');
  for (const id of ['candela', 'falce', 'campana', 'fuocoFatuo', 'acquaSanta', 'lamaDiLuce', 'lapide', 'rosarioSpezzato', 'corvo', 'veloFunebre', 'sampietrini']) await L('potenziale', id);
  await L('immortale', true);
  await L('vai', 'centro');
  for (let k = 0; k < 3; k++) await L('ondata');
  await pag.waitForTimeout(6000);
  const s = await L('stato');
  if (s.echi.length < 11 || s.echi.some((e) => !e.endsWith(' 5'))) errori.push(`gli Echi non sono tutti al livello 5 (${s.echi.join(', ')})`);
  if (s.uccisi < 1) errori.push('con tutti gli Echi al potenziale nessun nemico cade');
  await pag.screenshot({ path: 'prove/stanze-potenziali.png' });
  const interrotti = await L('interrotti');
  const accecati = await L('accecati');
  await ctx.close();
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} potenziali degli Echi: 11 Echi al livello 5, ${s.uccisi} nemici battuti, ${interrotti} attacchi interrotti, ${accecati} accecati dalla Lama${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
}

// Lama di luce (16/11): accecare un nemico dal LAB lo fa contare; con la sola Lama al livello 5 i vicini si accecano insieme
{
  const errori = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pag = await ctx.newPage();
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?stanze`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Stanze'), null, { timeout: 15000 }).catch(() => errori.push('la scena Stanze non parte'));
  const L = (f, ...a) => pag.evaluate(([f, a]) => window.__dl.scene.getScene('Stanze').lab[f](...a), [f, a]);
  await L('ondateAutomatiche', false);
  await L('svuota');
  await L('potenziale', 'lamaDiLuce');
  await L('immortale', true);
  await L('ondata');
  await pag.waitForTimeout(2500); // i nemici compaiono dopo il segno a terra
  const trovato = await L('accecaVicino');
  const n = await L('accecati');
  if (!trovato || n < 1) errori.push('la Lama di luce non acceca il nemico');
  await ctx.close();
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} Lama di luce: acceca dal LAB (${n} accecati)${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
}

// Salute in più della Falce (17/11): sta in cima alla salute, assorbe i colpi per prima e non scende sotto zero
{
  const errori = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pag = await ctx.newPage();
  pag.on('pageerror', (e) => errori.push(e.message));
  await pag.goto(`${url}?stanze`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Stanze'), null, { timeout: 15000 }).catch(() => errori.push('la scena Stanze non parte'));
  const L = (f, ...a) => pag.evaluate(([f, a]) => window.__dl.scene.getScene('Stanze').lab[f](...a), [f, a]);
  await L('ondateAutomatiche', false);
  await L('svuota');
  await L('cura');
  await L('salutePiu');
  const prima = await L('stato');
  await L('ferita');
  const dopo = await L('stato');
  if (!(prima.extra > 0)) errori.push('la salute in più non compare');
  if (!(dopo.extra < prima.extra)) errori.push('la salute in più non assorbe il colpo');
  if (dopo.salute !== prima.salute) errori.push('il colpo ha tolto salute normale mentre c\'era salute in più');
  // la fiaschetta automatica (17/11): sopra il 15% non si beve; sotto, si beve da sola e il sorso cura in un secondo
  await L('salute', 30);
  await pag.waitForTimeout(300);
  const sopra = await L('stato');
  await L('salute', 10);
  const primaSorso = { ...sopra, salute: 10 };
  await pag.waitForTimeout(1300);
  const dopoSorso = await L('stato');
  if (sopra.sorsi !== (await L('stato')).sorsi + 1) errori.push('sopra il 15% la fiaschetta ha bevuto, o sotto non ha bevuto');
  if (dopoSorso.sorsi !== primaSorso.sorsi - 1 || !(dopoSorso.salute > primaSorso.salute)) errori.push(`la fiaschetta automatica non cura (sorsi ${primaSorso.sorsi} › ${dopoSorso.sorsi}, salute ${primaSorso.salute} › ${dopoSorso.salute})`);
  await ctx.close();
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} salute in più: ${prima?.extra} › ${dopo?.extra}, salute ${prima?.salute} › ${dopo?.salute}; fiaschetta ${primaSorso?.sorsi} › ${dopoSorso?.sorsi} sorsi, salute ${primaSorso?.salute} › ${dopoSorso?.salute}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
}

// Bot del gioco a stanze (14/11): gioca da solo, veloce e senza disegno (dal 17/11 esplora la mappa fino al Boss); a parità di seme gioca la stessa partita
{
  const errori = [];
  const partita = async (seme, esplora) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
    const pag = await ctx.newPage();
    pag.on('pageerror', (e) => errori.push(e.message));
    await pag.goto(`${url}?stanze&bot&seme=${seme}${esplora ? '&esplora=1' : ''}`);
    const ok = await pag.waitForFunction(() => window.__sim, null, { timeout: 300000, polling: 250 }).then(() => true, () => false);
    if (!ok) errori.push(`seme ${seme}: la partita del bot non finisce`);
    const r = await pag.evaluate(() => window.__sim ?? null);
    await ctx.close();
    return r;
  };
  const a = await partita(7, false), b = await partita(7, false), c = await partita(8, true);
  if (a && b && JSON.stringify(a) !== JSON.stringify(b)) errori.push('con lo stesso seme il bot non gioca la stessa partita');
  for (const r of [a, c]) if (r && (!r.stanze?.length || r.colpiLanterna < 1)) errori.push(`seme ${r.seme}: il bot non gioca (${r.colpiLanterna} colpi)`);
  const descrivi = (r) => (r ? (r.completata ? `arrivato al Boss dopo ${r.stanza} stanze, con salute ${r.salute}` : `caduto nella stanza ${r.stanza} (a ${r.stanze.at(-1)?.distanza ?? '?'} porte dall'ingresso)`) : '?');
  if (errori.length) falliti++;
  console.log(`${errori.length ? '✗' : '✓'} bot delle stanze: seme 7 ${descrivi(a)} (uguale due volte), seme 8 con carte a caso ${descrivi(c)}${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
}

await browser.close();
server.kill();
console.log(falliti ? `\n${falliti} prove fallite` : '\nTutto a posto. Screenshot in prove/.');
process.exit(falliti ? 1 : 0);
