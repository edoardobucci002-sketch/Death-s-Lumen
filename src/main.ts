/*
 * Punto di partenza: crea il gioco Phaser in pixel perfect e collega il telefono
 * (pausa in secondo piano, tasto Indietro, schermo acceso).
 */
import './stile.css';
import Phaser from 'phaser';
import { Avvio } from './scene/Avvio';
import { Gioco } from './scene/Gioco';
import { calcolaMisure } from './sistema/pixel';
import { avviaMobile, nativo, schermoAcceso } from './sistema/mobile';

const m = calcolaMisure();

const gioco = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'gioco',
  backgroundColor: '#0d0b09',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  width: m.larghezza,
  height: m.altezza,
  scale: { mode: Phaser.Scale.NONE, zoom: m.zoom },
  fps: { target: 60, forceSetTimeOut: false },
  // i comandi li gestisce src/sistema/comandi.ts, non Phaser
  input: { keyboard: false, mouse: false, touch: false, gamepad: false },
  scene: [Avvio, Gioco],
});
gioco.registry.set('scala', m.scala);

let attesa = 0;
function ridimensiona(): void {
  cancelAnimationFrame(attesa);
  attesa = requestAnimationFrame(() => {
    const n = calcolaMisure();
    gioco.registry.set('scala', n.scala);
    gioco.scale.setZoom(n.zoom);
    gioco.scale.resize(n.larghezza, n.altezza);
  });
}
window.addEventListener('resize', ridimensiona);
window.visualViewport?.addEventListener('resize', ridimensiona);

avviaMobile({
  sfondo: () => {
    gioco.loop.sleep();
    schermoAcceso(false);
  },
  primoPiano: () => {
    gioco.loop.wake();
    schermoAcceso(true);
  },
  indietro: () => false, // M1: nessun menu, Indietro chiude l'app
});
schermoAcceso(true);

// PWA: lavoro offline e installazione (non serve dentro l'app nativa)
if ('serviceWorker' in navigator && import.meta.env.PROD && !nativo) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// usato dalle prove automatiche
(window as unknown as { __dl: Phaser.Game }).__dl = gioco;
