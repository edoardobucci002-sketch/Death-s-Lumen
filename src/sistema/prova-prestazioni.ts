/*
 * Prova prestazioni (LAB, scheda Schermo), pensata per un amico che non conosce il gioco: un tocco porta alla scena più
 * pesante, misura e prepara un testo da copiare. La partita è finta: la notte si ferma prima dell'alba e si chiude senza
 * passare dalla fine, quindi Cera, record e sblocchi non si toccano. Valori in PRESTAZIONI, src/data/mondo.ts.
 */
import type Phaser from 'phaser';
import type { Gioco } from '../scene/Gioco';
import { PRESTAZIONI } from '../data/mondo';
import { FIRMA } from './firma';
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

/** Tempi tra un fotogramma e l'altro per tot secondi, senza allocare durante la misura. */
function misura(secondi: number, ogniFotogramma?: (trascorsi: number) => void): Promise<Float64Array> {
  const tempi = new Float64Array(Math.ceil(secondi * 400));
  return new Promise((fine) => {
    const inizio = performance.now();
    let ultimo = inizio, n = 0;
    const giro = (ora: number): void => {
      if (n < tempi.length) tempi[n++] = ora - ultimo;
      ultimo = ora;
      ogniFotogramma?.((ora - inizio) / 1000);
      if (ora - inizio >= secondi * 1000) fine(tempi.slice(0, n));
      else requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
  });
}

/** Frequenza dello schermo stimata dai fotogrammi: la pagina non può chiederla al telefono. */
async function frequenza(): Promise<number> {
  const t = [...(await misura(1))].sort((a, b) => a - b);
  return Math.round(1000 / (t[Math.floor(t.length / 2)] || 16.7));
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
  await misura(PRESTAZIONI.avvio);
  let interrotta = false, secondo = 0;
  const visibilita = (): void => { if (document.hidden) interrotta = true; };
  document.addEventListener('visibilitychange', visibilita);
  const tempi = await misura(PRESTAZIONI.secondi, (t) => {
    const s = Math.floor(t);
    if (s === secondo) return;
    secondo = s;
    partita.labProvaRiempi(); // i nemici restano quanti devono essere: le armi ne uccidono di continuo
    avviso.textContent = `Prova prestazioni: non toccare niente · ${PRESTAZIONI.secondi - s} s`;
  });
  document.removeEventListener('visibilitychange', visibilita);
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
    `Schermo: circa ${hz} Hz, ${Math.round(innerWidth * devicePixelRatio)}×${Math.round(innerHeight * devicePixelRatio)}`,
    `Minuto ${PRESTAZIONI.minuto}, ${PRESTAZIONI.nemici} nemici, lanterna in vista, ${PRESTAZIONI.secondi} s`,
    `Media: ${((tempi.length * 1000) / totale).toFixed(1)} fps`,
    `Peggiore: ${(1000 / peggiore).toFixed(1)} fps (${Math.round(peggiore)} ms)`,
    `Blocchi sopra ${PRESTAZIONI.blocco} ms: ${blocchi}`,
    interrotta ? "ATTENZIONE: l'app è andata in secondo piano, prova da rifare" : 'Prova completa',
  ].join('\n'), gioco);
}
