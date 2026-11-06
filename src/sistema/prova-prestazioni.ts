/*
 * Prova prestazioni (LAB, scheda Schermo), pensata per un amico che non conosce il gioco: un tocco porta alla scena più
 * pesante, misura e prepara un testo da copiare. La partita è finta: la notte si ferma prima dell'alba e si chiude senza
 * passare dalla fine, quindi Cera, record e sblocchi non si toccano. Valori in PRESTAZIONI, src/data/mondo.ts.
 */
import type Phaser from 'phaser';
import type { Gioco } from '../scene/Gioco';
import { FOTOGRAMMI, PRESTAZIONI } from '../data/mondo';
import { FIRMA } from './firma';
import { misuraDisegni } from './fotogrammi';
import { nativo } from './mobile';

interface DatiTelefono { model?: string; platformVersion?: string; fullVersionList?: { brand: string; version: string }[] }

/** Modello, Android e browser: dai dati completi di Chrome se ci sono, altrimenti da quello che dichiara il browser. */
async function telefono(): Promise<{ modello: string; android: string; webview: string }> {
  const ua = navigator.userAgent;
  const fonte = (navigator as unknown as { userAgentData?: { getHighEntropyValues(v: string[]): Promise<DatiTelefono> } }).userAgentData;
  const d = await fonte?.getHighEntropyValues(['model', 'platformVersion', 'fullVersionList']).catch(() => undefined);
  const browser = d?.fullVersionList?.find((b) => /WebView|Chromium/.test(b.brand))?.version ?? /Chrome\/([\d.]+)/.exec(ua)?.[1] ?? ua;
  return {
    modello: d?.model || /Android [^;)]*;\s*([^;)]+?)(?:\s+Build[^;)]*)?[;)]/.exec(ua)?.[1] || 'sconosciuto',
    android: d?.platformVersion || /Android ([\d.]+)/.exec(ua)?.[1] || 'non Android',
    webview: browser,
  };
}

/** Il nome del processore grafico, chiesto a WebGL. */
function grafica(): string {
  const gl = document.createElement('canvas').getContext('webgl');
  if (!gl) return 'WebGL non disponibile';
  const est = gl.getExtension('WEBGL_debug_renderer_info');
  const nome = String(gl.getParameter(est ? est.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return nome;
}

/** Frequenza dello schermo stimata dai battiti dello schermo, non dai disegni: la pagina non può chiederla al telefono. */
function frequenza(): Promise<number> {
  return new Promise((fine) => {
    const t: number[] = [];
    let ultimo = performance.now();
    const giro = (ora: number): void => {
      t.push(ora - ultimo);
      ultimo = ora;
      if (t.length < 90) requestAnimationFrame(giro);
      else fine(Math.round(1000 / (t.sort((a, b) => a - b)[45] || 16.7)));
    };
    requestAnimationFrame(giro);
  });
}

function pannello(testo: string, gioco: Phaser.Game): void {
  const d = document.createElement('div');
  d.className = 'lab-prova';
  const scritto = document.createElement('textarea');
  scritto.className = 'lab-testo';
  scritto.readOnly = true;
  scritto.value = testo;
  const copia = document.createElement('button'), chiudi = document.createElement('button');
  copia.className = chiudi.className = 'lab-tasto';
  copia.type = chiudi.type = 'button';
  copia.textContent = 'Copia il risultato';
  chiudi.textContent = 'Chiudi';
  copia.addEventListener('click', () => {
    scritto.select();
    void navigator.clipboard?.writeText(testo).catch(() => {});
    copia.textContent = 'Copiato';
  });
  chiudi.addEventListener('click', () => {
    d.remove();
    gioco.scene.getScenes(true).forEach((s) => s.scene.key === 'Gioco' && s.scene.start('Menu'));
  });
  d.append(scritto, copia, chiudi);
  for (const ev of ['pointerdown', 'pointerup', 'touchstart']) d.addEventListener(ev, (x) => x.stopPropagation());
  document.body.append(d);
}

export async function avviaProvaPrestazioni(gioco: Phaser.Game): Promise<void> {
  const avviso = document.createElement('div');
  avviso.className = 'lab-prova-avviso';
  avviso.textContent = 'Prova prestazioni: non toccare niente';
  document.body.append(avviso);
  const hz = await frequenza();
  gioco.scene.getScenes(true).forEach((s) => s.scene.stop());
  gioco.scene.start('Gioco', { pg: PRESTAZIONI.personaggio });
  await new Promise<void>((pronto) => {
    const guarda = (): void => { if (gioco.scene.isActive('Gioco')) pronto(); else setTimeout(guarda, 50); };
    guarda();
  });
  const partita = gioco.scene.getScene('Gioco') as Gioco;
  partita.labProvaPrestazioni();
  await misuraDisegni(gioco, PRESTAZIONI.avvio);
  let interrotta = false, secondo = 0;
  const visibilita = (): void => { if (document.hidden) interrotta = true; };
  document.addEventListener('visibilitychange', visibilita);
  const tempi = await misuraDisegni(gioco, PRESTAZIONI.secondi, (t) => {
    const s = Math.floor(t);
    if (s === secondo) return;
    secondo = s;
    partita.labProvaRiempi(); // i nemici restano quanti devono essere: le armi ne uccidono di continuo
    avviso.textContent = `Prova prestazioni: non toccare niente · ${PRESTAZIONI.secondi - s} s`;
  });
  document.removeEventListener('visibilitychange', visibilita);
  // misura a parte: la ricostruzione del buio che avviene quando un dono allarga la luce, compreso il disegno che la mostra
  const inizioBuio = performance.now();
  partita.labRicostruisciBuio();
  await misuraDisegni(gioco, 0);
  const buio = performance.now() - inizioBuio;
  avviso.remove();
  const totale = tempi.reduce((a, b) => a + b, 0), peggiore = tempi.reduce((a, b) => Math.max(a, b), 0);
  const blocchi = tempi.reduce((n, t) => n + (t > PRESTAZIONI.blocco ? 1 : 0), 0);
  const c = await telefono();
  pannello([
    "Death's Lumen · Prova prestazioni",
    `Versione: ${FIRMA || 'senza firma'} (${nativo ? 'APK' : 'link'})`,
    `Telefono: ${c.modello}`,
    `Grafica: ${grafica()}`,
    `Android: ${c.android}`,
    `WebView o Chrome: ${c.webview}`,
    `Schermo: circa ${hz} Hz, ${Math.round(innerWidth * devicePixelRatio)}×${Math.round(innerHeight * devicePixelRatio)}; disegni limitati a ${FOTOGRAMMI.limite} al secondo`,
    `Minuto ${PRESTAZIONI.minuto}, ${PRESTAZIONI.nemici} nemici, lanterna in vista, ${PRESTAZIONI.secondi} s`,
    `Media: ${((tempi.length * 1000) / totale).toFixed(1)} fps`,
    `Peggiore: ${(1000 / peggiore).toFixed(1)} fps (${Math.round(peggiore)} ms)`,
    `Blocchi sopra ${PRESTAZIONI.blocco} ms: ${blocchi}`,
    `Ricostruzione del buio: ${Math.round(buio)} ms`,
    interrotta ? "ATTENZIONE: l'app è andata in secondo piano, prova da rifare" : 'Prova completa',
  ].join('\n'), gioco);
}
