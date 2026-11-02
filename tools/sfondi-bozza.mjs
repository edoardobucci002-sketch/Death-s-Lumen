// Sfondi per la pagina di bozza dell'HUD: screenshot del gioco vero, senza l'interfaccia HTML,
// riportati ai pixel di gioco (un pixel dell'immagine = un pixel di gioco). Scrive in bozza/sfondi/.
// Uso: node tools/sfondi-bozza.mjs (con la build fatta: usa vite preview)
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const porta = 4321;
const server = spawn('npx', ['vite', 'preview', '--port', String(porta), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const casi = [
  ['verticale', devices['iPhone 13'], 'lampionaio'],
  ['orizzontale', { ...devices['iPhone 13'], viewport: { width: 844, height: 390 } }, 'strega'],
];
const browser = await chromium.launch();
for (const [nome, disp, pg] of casi) {
  const ctx = await browser.newContext(disp);
  const pag = await ctx.newPage();
  await pag.goto(`http://localhost:${porta}/?pg=${pg}&nemici=60&immortale&automatico&livello=3`);
  await pag.waitForFunction(() => window.__dl?.scene?.isActive('Gioco'), null, { timeout: 15000 });
  await pag.waitForTimeout(2500);
  await pag.addStyleTag({ content: '#interfaccia { display: none !important; }' });
  await pag.waitForTimeout(100);
  const scala = await pag.evaluate(() => window.__dl.registry.get('scala'));
  const png = await pag.locator('#gioco canvas').screenshot();
  // da pixel fisici a pixel di gioco: un campione ogni «scala» pixel
  const ridotto = await pag.evaluate(async ({ b64, scala, dpr }) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const passo = scala / dpr * dpr; // pixel dello screenshot per pixel di gioco
    const w = Math.floor(img.width / passo), h = Math.floor(img.height / passo);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, w * passo, h * passo, 0, 0, w, h);
    return c.toDataURL().split(',')[1];
  }, { b64: png.toString('base64'), scala, dpr: disp.deviceScaleFactor });
  writeFileSync(`bozza/sfondi/${nome}.png`, Buffer.from(ridotto, 'base64'));
  console.log(`✓ bozza/sfondi/${nome}.png (×${scala})`);
  await ctx.close();
}
await browser.close();
server.kill();
