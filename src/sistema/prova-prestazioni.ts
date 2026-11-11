/*
 * Prova prestazioni (LAB, scheda Schermo), pensata per un amico che non conosce il gioco: un tocco porta alla scena più
 * pesante, misura e prepara un testo da copiare. La partita è finta: la notte si ferma prima dell'alba e si chiude senza
 * passare dalla fine, quindi Cera, record e sblocchi non si toccano. Valori in PRESTAZIONI, src/data/mondo.ts.
 */
import type Phaser from 'phaser';
import type { Gioco } from '../scene/Gioco';
import { PRESTAZIONI } from '../data/mondo';
import { FIRMA } from './firma';
import { misuraDisegni } from './fotogrammi';
import { nativo } from './mobile';
import { INTERRUTTORI } from './interruttori';

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

/** Aspetta che pronto() diventi vero, guardando ogni 50 ms. */
function aspetta(pronto: () => boolean): Promise<void> {
  return new Promise((fine) => {
    const guarda = (): void => { if (pronto()) fine(); else setTimeout(guarda, 50); };
    guarda();
  });
}

export async function avviaProvaPrestazioni(gioco: Phaser.Game): Promise<void> {
  const avviso = document.createElement('div');
  avviso.className = 'lab-prova-avviso';
  avviso.textContent = 'Prova prestazioni: non toccare niente';
  document.body.append(avviso);
  // da una partita in corso: prima la si chiude e si torna al menu. Prima la scena Gioco (che si riusa) veniva fermata e
  // ripartita insieme, e la prova partiva sulla scena vecchia: la create() della nuova la azzerava e si misurava un campo vuoto
  if (gioco.scene.isActive('Gioco')) {
    gioco.scene.getScenes(true).forEach((s) => s.scene.key !== 'Menu' && s.scene.stop());
    gioco.scene.start('Menu');
    await aspetta(() => gioco.scene.isActive('Menu') && !gioco.scene.isActive('Gioco'));
  }
  const hz = await frequenza();
  const partita = gioco.scene.getScene('Gioco') as Gioco;
  let creata = false; // la prova parte solo dopo la create() della partita nuova
  partita.events.once('create', () => { creata = true; });
  gioco.scene.getScenes(true).forEach((s) => s.scene.stop());
  gioco.scene.start('Gioco', { pg: PRESTAZIONI.personaggio });
  await aspetta(() => creata && gioco.scene.isActive('Gioco'));
  partita.labProvaPrestazioni();
  await misuraDisegni(gioco, PRESTAZIONI.avvio);
  let interrotta = false, secondo = 0, contati = 0, conte = 0; // nemici in campo, contati una volta al secondo
  const visibilita = (): void => { if (document.hidden) interrotta = true; };
  document.addEventListener('visibilitychange', visibilita);
  const tempi = await misuraDisegni(gioco, PRESTAZIONI.secondi, (t) => {
    const s = Math.floor(t);
    if (s === secondo) return;
    secondo = s;
    contati += partita.labStato().nemici;
    conte++;
    partita.labProvaRiempi(); // i nemici restano quanti devono essere: le armi ne uccidono di continuo
    if (INTERRUTTORI.provaConEffetti) partita.labProvaEffetti(s); // Sepoltura, Pozza grande ed Eclissi a ripetizione
    avviso.textContent = `Prova prestazioni: non toccare niente · ${PRESTAZIONI.secondi - s} s`;
  });
  document.removeEventListener('visibilitychange', visibilita);
  // misura a parte: la ricostruzione del buio che avviene quando un dono allarga la luce, compreso il disegno che la mostra
  const inizioBuio = performance.now();
  partita.labRicostruisciBuio();
  await misuraDisegni(gioco, 0);
  const buio = performance.now() - inizioBuio;
  avviso.remove();
  const totale = tempi.reduce((a, b) => a + b, 0);
  const blocchi = tempi.reduce((n, t) => n + (t > PRESTAZIONI.blocco ? 1 : 0), 0);
  // fotogrammi saltati: ogni disegno arrivato dopo più di un battito dello schermo ne ha persi tanti quanti i battiti in più
  const battito = 1000 / hz;
  const saltati = tempi.reduce((n, t) => n + Math.max(0, Math.round(t / battito) - 1), 0);
  // secondi lenti: si divide la misura in secondi e si contano quelli sotto la soglia
  let trascorsi = 0, inQuesto = 0, secondi = 0, lenti = 0;
  for (const t of tempi) {
    trascorsi += t;
    inQuesto++;
    if (trascorsi < 1000) continue;
    secondi++;
    if ((inQuesto * 1000) / trascorsi < PRESTAZIONI.secondoLento) lenti++;
    trascorsi = inQuesto = 0;
  }
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
    `Effetti a ripetizione: ${INTERRUTTORI.provaConEffetti ? `sì; Pozza ed Eclissi ${INTERRUTTORI.pixelfx ? 'pixelfx' : 'di sempre'}, Sepoltura ${INTERRUTTORI.sepolturaPixelfx ? 'pixelfx' : 'di sempre'}` : 'no'}`,
    `In campo durante la misura: ${Math.round(contati / Math.max(1, conte))} nemici in media, minuto ${Math.floor(partita.labStato().secondi / 60)}`,
    `Media: ${((tempi.length * 1000) / totale).toFixed(1)} fps`,
    `Fotogrammi saltati: ${saltati}`,
    `Secondi sotto ${PRESTAZIONI.secondoLento} fps: ${((lenti * 100) / Math.max(1, secondi)).toFixed(1)}%`,
    `Blocchi sopra ${PRESTAZIONI.blocco} ms: ${blocchi}`,
    `Ricostruzione del buio: ${Math.round(buio)} ms`,
    interrotta ? "ATTENZIONE: l'app è andata in secondo piano, prova da rifare" : 'Prova completa',
  ].join('\n'), gioco);
}
