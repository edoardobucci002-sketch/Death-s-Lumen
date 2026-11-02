/*
 * Punto di partenza: crea il gioco Phaser in pixel perfect e collega il telefono
 * (pausa in secondo piano, tasto Indietro, schermo acceso) e prepara i suoni.
 */
import './stile.css';
import Phaser from 'phaser';
import { Avvio } from './scene/Avvio';
import { Gioco } from './scene/Gioco';
import { Menu } from './scene/Menu';
import { preparaAudio } from './sistema/audio';
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
  scene: [Avvio, Menu, Gioco],
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
    gioco.events.emit('sfondo'); // la partita va in pausa, così al ritorno non si muore di colpo
    gioco.loop.sleep();
    schermoAcceso(false);
  },
  primoPiano: () => {
    gioco.loop.wake();
    schermoAcceso(true);
preparaAudio();
  },
  // in partita: pausa, riprendi o torna al menu; dal menu chiude l'app
  indietro: () => (gioco.scene.isActive('Gioco') ? (gioco.scene.getScene('Gioco') as Gioco).indietro() : false),
});
schermoAcceso(true);
preparaAudio();

// PWA: lavoro offline e installazione (non serve dentro l'app nativa)
if ('serviceWorker' in navigator && import.meta.env.PROD && !nativo) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  // quando arriva una versione nuova del gioco, ricarica la pagina una volta per mostrarla
  if (navigator.serviceWorker.controller) {
    let ricaricato = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!ricaricato) { ricaricato = true; location.reload(); }
    });
  }
}

// usato dalle prove automatiche
(window as unknown as { __dl: Phaser.Game }).__dl = gioco;
