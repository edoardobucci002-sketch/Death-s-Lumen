// Icone e schermate di avvio dell'app, disegnate dallo sprite in gioco del Lampionaio (primo fotogramma di idle):
// sfondo notturno, alone ambra a retino, personaggio ingrandito di un numero intero di volte.
// Uso: npm run icone (dopo npm run asset, quando cambia lo sprite). Scrive in public/icons, android/ e ios/.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const SPRITE = 'public/assets/personaggi/Il_Lampionaio_ingame';
const SFONDO = '#0d0b09';
const ALONE = '#7a4416'; // ambra scura: l'alone non deve coprire il personaggio

const dati = JSON.parse(readFileSync(`${SPRITE}.json`, 'utf8'));
const f0 = dati.frames[0];
const immagine = `data:image/png;base64,${readFileSync(`${SPRITE}.png`).toString('base64')}`;
// misure di un'immagine già presente (sips è lo strumento per le immagini del Mac)
const misure = (p) => execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', p]).toString().match(/pixel(?:Width|Height): (\d+)/g).map((r) => Number(r.split(': ')[1]));

// [file, larghezza, altezza, opzioni]: parte = quanto del lato corto occupa il personaggio
const lavori = [
  ['public/icons/icon-180.png', 180, 180, { parte: 0.8 }],
  ['public/icons/icon-192.png', 192, 192, { parte: 0.8 }],
  ['public/icons/icon-512.png', 512, 512, { parte: 0.8 }],
  ['public/icons/icon-1024.png', 1024, 1024, { parte: 0.8 }],
  ['public/icons/maskable-512.png', 512, 512, { parte: 0.6 }], // Android ritaglia i bordi: tutto dentro l'80% centrale
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, 1024, { parte: 0.8 }],
];
for (const [d, n] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  lavori.push([`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, n, n, { parte: 0.8 }]);
  lavori.push([`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, n, n, { parte: 0.7, tondo: true }]);
  // icona adattiva: sfondo a parte (colore), qui solo il primo piano trasparente, dentro la zona sicura centrale
  lavori.push([`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, n * 2.25, n * 2.25, { parte: 0.5, trasparente: true }]);
}
// schermate di avvio: stesse misure di quelle che ci sono già
for (const cartella of readdirSync('android/app/src/main/res').filter((c) => c.startsWith('drawable'))) {
  const p = `android/app/src/main/res/${cartella}/splash.png`;
  if (existsSync(p)) lavori.push([p, ...misure(p), { parte: 0.3 }]);
}
for (const f of readdirSync('ios/App/App/Assets.xcassets/Splash.imageset').filter((f) => f.endsWith('.png'))) {
  lavori.push([`ios/App/App/Assets.xcassets/Splash.imageset/${f}`, 2732, 2732, { parte: 0.3 }]);
}

const browser = await chromium.launch();
const pag = await browser.newPage();
await pag.setContent('<canvas></canvas>');
for (const [file, w, h, o] of lavori) {
  const base64 = await pag.evaluate(async ({ immagine, f0, w, h, o, SFONDO, ALONE }) => {
    const img = new Image();
    img.src = immagine;
    await img.decode();
    const c = document.querySelector('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (o.tondo) {
      g.beginPath();
      g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
      g.clip();
    }
    if (!o.trasparente) {
      g.fillStyle = SFONDO;
      g.fillRect(0, 0, w, h);
    }
    const lato = f0.sourceSize.w;
    const k = Math.max(1, Math.floor((Math.min(w, h) * o.parte) / lato)); // ingrandimento intero
    const ox = Math.round((w - lato * k) / 2);
    const oy = Math.round((h - lato * k) / 2);
    // alone ambra a retino (Bayer 4×4), con pixel grandi quanto quelli dello sprite
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const cx = w / 2;
    const cy = h / 2 - k * 6;
    const r = lato * k * 0.62;
    g.fillStyle = ALONE;
    for (let y = 0; y < h; y += k) {
      for (let x = 0; x < w; x += k) {
        const d = Math.hypot(x + k / 2 - cx, y + k / 2 - cy) / r;
        const soglia = (bayer[((y / k) & 3) * 4 + ((x / k) & 3)] + 0.5) / 16;
        if (d < 1 && soglia > 0.5 + d * 0.5) g.fillRect(x, y, k, k);
      }
    }
    g.drawImage(img, f0.frame.x, f0.frame.y, f0.frame.w, f0.frame.h, ox + f0.spriteSourceSize.x * k, oy + f0.spriteSourceSize.y * k, f0.frame.w * k, f0.frame.h * k);
    return c.toDataURL('image/png').split(',')[1];
  }, { immagine, f0, w, h, o, SFONDO, ALONE });
  writeFileSync(file, Buffer.from(base64, 'base64'));
  console.log(`✓ ${file} (${w}×${h})`);
}
await browser.close();
