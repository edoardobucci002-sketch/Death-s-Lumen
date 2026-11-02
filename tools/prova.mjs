// Prova automatica: apre la build su desktop, iPhone (verticale e orizzontale) e Android,
// fa camminare il personaggio, controlla che non ci siano errori e salva gli screenshot in prove/.
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
const browser = await chromium.launch(process.env.DL_CHROMIUM ? { executablePath: process.env.DL_CHROMIUM } : {});
for (const [nome, disp] of casi) {
  const ctx = await browser.newContext(disp);
  const pag = await ctx.newPage();
  const errori = [];
  pag.on('pageerror', (e) => errori.push(e.message));
  pag.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  await pag.goto(url);
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
await browser.close();
server.kill();
console.log(falliti ? `\n${falliti} prove fallite` : '\nTutto a posto. Screenshot in prove/.');
process.exit(falliti ? 1 : 0);
