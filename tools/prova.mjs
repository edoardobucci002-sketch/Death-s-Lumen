// Prova automatica: apre la build su desktop, iPhone (verticale e orizzontale) e Android,
// controlla che non ci siano errori e salva gli screenshot in prove/.
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
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Prova'), null, { timeout: 15000 }).catch(() => errori.push('la scena Prova non parte'));
  await pag.waitForTimeout(600);
  const stato = await pag.evaluate(() => {
    const g = window.__dl;
    const c = g.canvas.getBoundingClientRect();
    return { w: g.scale.width, h: g.scale.height, scala: g.registry.get('scala'), cssW: Math.round(c.width), vw: innerWidth };
  });
  const bottoni = await pag.locator('[data-tag]').count();
  if (bottoni) {
    // con un solo tag (per esempio solo idle) si clicca quello
    await pag.locator('[data-tag]').nth(Math.min(1, bottoni - 1)).click();
    await pag.waitForTimeout(300);
  }
  await pag.screenshot({ path: `prove/${nome}.png` });
  const ok = !errori.length && bottoni > 0 && stato.cssW <= stato.vw + 1;
  if (!ok) falliti++;
  console.log(`${ok ? '✓' : '✗'} ${nome}: ${stato.w}×${stato.h} px di gioco, ×${stato.scala}, ${bottoni} animazioni${errori.length ? '\n   errori: ' + errori.join(' | ') : ''}`);
  await ctx.close();
}
await browser.close();
server.kill();
console.log(falliti ? `\n${falliti} prove fallite` : '\nTutto a posto. Screenshot in prove/.');
process.exit(falliti ? 1 : 0);
