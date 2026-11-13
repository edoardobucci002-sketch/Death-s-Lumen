/*
 * Laboratorio: un pannello solo per il link di prova e lo sviluppo (mai nella versione pubblica) per andare subito
 * a qualsiasi punto del gioco e vedere una cosa sola, senza rigiocare tutto:
 *  · Partita: minuto, livello, salute, personaggio, nemici
 *  · Eventi: élite, Seth, orde, reliquiari, drop, stati e reazioni, vittoria e sconfitta
 *  · Oggetti: armi, doni e amuleti a qualsiasi livello
 *  · Numeri: tutti i numeri di src/data/ si cambiano al volo (restano finché non li azzeri) e si copiano per Claude
 *  · Schermate: menu, Cappella, pausa, scelta dei doni, reliquiario, fine
 *  · Schermo: aree sicure, punti, scala e campo con le fasce, letti dal telefono vero
 *  · Salvataggio: Cera, sblocchi, ceri
 * Si apre con il pulsante LAB sul bordo sinistro dello schermo.
 */
import type Phaser from 'phaser';
import type { Gioco } from '../scene/Gioco';
import type { LabPartita } from './lab-partita';
import type { Menu } from '../scene/Menu';
import type { Stanze } from '../scene/Stanze';
import type { DirezioneColpo, PuntoStanza } from './lab-stanze';
import { ARMI_COMUNI, ARMI_INIZIALI } from '../data/armi';
import { PASSIVI } from '../data/doni';
import { AMULETI } from '../data/rosario';
import { PERSONAGGI } from '../data/personaggi';
import { CERI, SBLOCCHI_OGGETTI } from '../data/meta';
import { LIVELLO_ARMA_UNIONE, UNIONI } from '../data/unioni';
import { PIXELFX } from '../data/effetti';
import { accendiContatore, contatoreAcceso, riprendiContatore } from './contatore';
import { FIRMA } from './firma';
import { letturaSchermo } from './lettura-schermo';
import { avviaProvaPrestazioni } from './prova-prestazioni';
import { carica, salva } from './salvataggio';
import { INTERRUTTORI } from './interruttori';
import * as abilita from '../data/abilita';
import * as armi from '../data/armi';
import * as doni from '../data/doni';
import * as effetti from '../data/effetti';
import * as hud from '../data/hud';
import * as meta from '../data/meta';
import * as mondo from '../data/mondo';
import * as nemici from '../data/nemici';
import * as oggetti from '../data/oggetti';
import * as personaggi from '../data/personaggi';
import * as progressione from '../data/progressione';
import * as rompibili from '../data/rompibili';
import * as rosario from '../data/rosario';
import * as sopravvivenza from '../data/sopravvivenza';
import * as stati from '../data/stati';
import * as stanze from '../data/stanze';
import * as unioni from '../data/unioni';

const CHIAVE_NUMERI = 'dl-lab-numeri';
const MODULI: Record<string, Record<string, unknown>> = { abilita, armi, doni, effetti, hud, meta, mondo, nemici, oggetti, personaggi, progressione, rompibili, rosario, sopravvivenza, stanze, stati, unioni };

// ——— Numeri di src/data/ ———
type Nodo = Record<string, unknown>;
interface Voce { percorso: string; modulo: string; gruppo: string; sotto: string; padre: Nodo; chiave: string; originale: number }
const voci: Voce[] = [];
const nuoveVoci = (): Voce[] => voci;

/** Raccoglie ogni numero modificabile dei file in src/data (gli oggetti e le liste, a qualsiasi profondità). */
function raccogli(): void {
  if (voci.length) return;
  for (const [modulo, esportati] of Object.entries(MODULI)) {
    for (const [nome, valore] of Object.entries(esportati)) {
      if (typeof valore === 'object' && valore !== null) visita(valore as Nodo, modulo, nome, nome, nome, 0, new Set());
    }
  }
}

/** Nelle liste, il nome dell'elemento al posto del numero di posizione («Cero della scelta» invece di «6»). */
function nomeLeggibile(lista: Nodo, chiave: string, elemento: Nodo): string {
  if (!Array.isArray(lista)) return chiave;
  const nome = elemento.nome ?? elemento.id;
  return typeof nome === 'string' ? nome : chiave;
}

/** percorso: la chiave con cui il numero si salva, da non cambiare; sotto: il nome che si legge nel pannello. */
function visita(nodo: Nodo, modulo: string, gruppo: string, percorso: string, sotto: string, profondita: number, visti: Set<unknown>): void {
  if (profondita > 6 || visti.has(nodo)) return;
  visti.add(nodo);
  for (const [k, v] of Object.entries(nodo)) {
    if (typeof v === 'number') voci.push({ percorso: `${modulo}.${percorso}.${k}`, modulo, gruppo, sotto: `${sotto}.${k}`, padre: nodo, chiave: k, originale: v });
    else if (typeof v === 'object' && v !== null && !(v instanceof Element)) visita(v as Nodo, modulo, gruppo, `${percorso}.${k}`, `${sotto}.${nomeLeggibile(nodo, k, v as Nodo)}`, profondita + 1, visti);
  }
}

const salvati = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(CHIAVE_NUMERI) ?? '{}'); } catch { return {}; }
};
const scriviSalvati = (m: Record<string, number>): void => {
  try { localStorage.setItem(CHIAVE_NUMERI, JSON.stringify(m)); } catch { /* niente memoria */ }
};

/** Cambia un numero e lo ricorda, come nella scheda Numeri. */
function imposta(v: Voce, n: number): void {
  v.padre[v.chiave] = n;
  const m = salvati();
  if (n === v.originale) delete m[v.percorso]; else m[v.percorso] = n;
  scriviSalvati(m);
}

/** Rimette i numeri cambiati in una sessione precedente (da chiamare prima che parta il gioco). */
function applicaSalvati(): void {
  raccogli();
  const m = salvati();
  for (const v of nuoveVoci()) if (v.percorso in m) v.padre[v.chiave] = m[v.percorso];
}

// ——— Piccoli strumenti per costruire il pannello ———
function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe = '', testo = '', figli: (Node | string)[] = []): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo) e.textContent = testo;
  e.append(...figli);
  return e;
}
function tasto(testo: string, fai: () => void, classe = ''): HTMLButtonElement {
  const b = el('button', `lab-tasto ${classe}`.trim(), testo);
  b.type = 'button';
  b.addEventListener('click', fai);
  return b;
}
function riga(...figli: (Node | string)[]): HTMLElement {
  return el('div', 'lab-riga', '', figli);
}
function titolo(t: string): HTMLElement {
  return el('h3', 'lab-titolo', t);
}
function numero(valore: number, min = 0, max = 999, passo = 1): HTMLInputElement {
  const i = el('input', 'lab-numero');
  i.type = 'number';
  i.inputMode = 'decimal';
  i.value = String(valore);
  i.min = String(min);
  i.max = String(max);
  i.step = String(passo);
  return i;
}

const STILE = `
.lab-apri { position: fixed; left: 0; top: 42%; z-index: 90; width: 30px; height: 64px; padding: 0; border: 0; border-radius: 0 8px 8px 0; background: #6a2d8a; color: #fff; font: 700 12px/1 system-ui, sans-serif; letter-spacing: .05em; writing-mode: vertical-rl; cursor: pointer; opacity: .75; touch-action: manipulation; }
.lab { position: fixed; left: 0; right: 0; bottom: 0; z-index: 95; height: min(62vh, 560px); display: flex; flex-direction: column; background: #1a1220; color: #efe6f7; font: 15px/1.35 system-ui, sans-serif; border-top: 3px solid #a57ae0; -webkit-user-select: none; user-select: none; touch-action: manipulation; padding-bottom: env(safe-area-inset-bottom, 0px); }
.lab[hidden] { display: none !important; }
.lab * { box-sizing: border-box; }
.lab-testa { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: #2b1a3a; }
.lab-testa b { flex: 1; font-size: 14px; }
.lab-firma { flex: none; font: 11px/1.2 ui-monospace, monospace; color: #c9b0ee; }
.lab-schede { display: flex; gap: 4px; padding: 6px 8px; overflow-x: auto; background: #231630; flex: none; }
.lab-scheda { flex: none; min-height: 40px; padding: 6px 12px; border: 1px solid #5a3a78; border-radius: 6px; background: #1a1220; color: inherit; font: inherit; cursor: pointer; }
.lab-scheda[aria-selected="true"] { background: #a57ae0; color: #1a1220; font-weight: 700; }
.lab-corpo { flex: 1; overflow-y: auto; padding: 8px; -webkit-overflow-scrolling: touch; user-select: text; }
.lab-riga { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 6px 0; }
.lab-titolo { margin: 12px 0 2px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #c9b0ee; }
.lab-tasto { min-height: 44px; min-width: 44px; padding: 8px 12px; border: 1px solid #7a54a4; border-radius: 6px; background: #3a2452; color: #fff; font: inherit; cursor: pointer; }
.lab-tasto:active { background: #a57ae0; color: #1a1220; }
.lab-tasto.acceso { background: #a57ae0; color: #1a1220; font-weight: 700; }
.lab-tasto.rosso { background: #6a2020; border-color: #b04040; }
.lab-tasto.piccolo { min-height: 44px; padding: 4px 10px; }
.lab-numero { width: 84px; min-height: 44px; padding: 4px 8px; border: 1px solid #7a54a4; border-radius: 6px; background: #100a16; color: #fff; font: inherit; user-select: text; }
.lab-nota { color: #a894c0; font-size: 13px; margin: 4px 0; }
.lab-stato { padding: 6px 8px; background: #100a16; border-radius: 6px; font-variant-numeric: tabular-nums; }
.lab-voce { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #2f2040; }
.lab-voce > span { flex: 1; min-width: 0; overflow-wrap: anywhere; font-size: 13px; }
.lab-voce.cambiato > span { color: #ffd479; }
.lab-gruppo { margin: 4px 0; border: 1px solid #3a2452; border-radius: 6px; }
.lab-gruppo > summary { min-height: 44px; display: flex; align-items: center; padding: 0 10px; cursor: pointer; font-weight: 600; }
.lab-gruppo > div { padding: 0 8px 8px; }
.lab-testo { width: 100%; min-height: 120px; border: 1px solid #7a54a4; border-radius: 6px; background: #100a16; color: #fff; font: 12px/1.4 ui-monospace, monospace; padding: 6px; user-select: text; }
.lab-contatore { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 2px); right: 2px; z-index: 96; padding: 2px 6px; background: #000; color: #9f9; font: 700 12px/1.3 ui-monospace, monospace; pointer-events: none; }
.lab-prova-avviso { position: fixed; left: 8px; right: 8px; top: calc(env(safe-area-inset-top, 0px) + 28px); z-index: 96; padding: 8px; background: #1a1220; color: #efe6f7; font: 700 15px/1.3 system-ui, sans-serif; text-align: center; pointer-events: none; }
.lab-prova { position: fixed; left: 8px; right: 8px; bottom: calc(env(safe-area-inset-bottom, 0px) + 8px); z-index: 97; display: grid; gap: 8px; padding: 8px; background: #1a1220; color: #efe6f7; font: 15px/1.35 system-ui, sans-serif; border: 3px solid #a57ae0; }
.lab-prova .lab-testo { min-height: 260px; }
.lab-cerca { width: 100%; min-height: 44px; padding: 6px 10px; border: 1px solid #7a54a4; border-radius: 6px; background: #100a16; color: #fff; font: inherit; user-select: text; }
`;

type Scheda = 'partita' | 'stanze' | 'eventi' | 'oggetti' | 'numeri' | 'schermate' | 'schermo' | 'salvataggio';
const SCHEDE: [Scheda, string][] = [['partita', 'Partita'], ['stanze', 'Stanze'], ['eventi', 'Eventi'], ['oggetti', 'Oggetti'], ['numeri', 'Numeri'], ['schermate', 'Schermate'], ['schermo', 'Schermo'], ['salvataggio', 'Salvataggio']];

export function avviaLaboratorio(gioco: Phaser.Game): void {
  applicaSalvati();
  riprendiContatore(gioco);
  const stile = el('style', '', STILE);
  const apri = el('button', 'lab-apri', Object.keys(salvati()).length ? 'LAB •' : 'LAB'); // il puntino dice che ci sono numeri cambiati
  apri.type = 'button';
  apri.setAttribute('aria-label', 'Apri il Laboratorio');
  const pannello = el('section', 'lab');
  pannello.hidden = true;
  const schede = el('div', 'lab-schede');
  schede.setAttribute('role', 'tablist');
  const corpo = el('div', 'lab-corpo');
  const stato = el('b', '', 'Laboratorio');
  const chiudi = tasto('Chiudi', () => mostra(false), 'piccolo');
  pannello.append(el('div', 'lab-testa', '', [stato, el('span', 'lab-firma', FIRMA), chiudi]), schede, corpo);
  document.head.append(stile);
  document.body.append(apri, pannello);
  // i tocchi sul pannello non devono muovere il joystick o far partire l'abilità
  for (const e of [apri, pannello]) for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'keydown']) e.addEventListener(ev, (x) => x.stopPropagation());

  let scheda: Scheda = 'partita';
  let foriSpenti = false; // prove sui fotogrammi: durano finché non si ricarica
  const partita = (): Gioco | null => (gioco.scene.isActive('Gioco') ? (gioco.scene.getScene('Gioco') as Gioco) : null);
  const menu = (): Menu | null => (gioco.scene.isActive('Menu') ? (gioco.scene.getScene('Menu') as Menu) : null);
  const stanza = (): Stanze | null => (gioco.scene.isActive('Stanze') ? (gioco.scene.getScene('Stanze') as Stanze) : null);
  const ridisegna = (): void => {
    schede.replaceChildren(...SCHEDE.map(([id, nome]) => {
      const b = el('button', 'lab-scheda', nome);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(id === scheda));
      b.addEventListener('click', () => { scheda = id; ridisegna(); });
      return b;
    }));
    const p = partita();
    const s = p?.lab.stato();
    const st = stanza()?.lab.stato();
    stato.textContent = st ? `Laboratorio · stanza · ${st.x}, ${st.y}` : s ? `Laboratorio · ${s.pg} · ${Math.floor(s.secondi / 60)}:${String(Math.floor(s.secondi % 60)).padStart(2, '0')} · liv. ${s.livello} · urne ${s.urne} · ${Math.round(s.salute)}/${Math.round(s.saluteMassima)} PS` : 'Laboratorio · non sei in partita';
    corpo.replaceChildren(...({ partita: schedaPartita, stanze: schedaStanze, eventi: schedaEventi, oggetti: schedaOggetti, numeri: schedaNumeri, schermate: schedaSchermate, schermo: schedaSchermo, salvataggio: schedaSalvataggio })[scheda]());
  };
  const mostra = (aperto: boolean): void => {
    pannello.hidden = !aperto;
    apri.hidden = aperto;
    // finché il pannello è aperto, la partita sta ferma (si può riprendere dalla scheda Partita)
    if (aperto) { partita()?.lab.ferma(true); stanza()?.lab.ferma(true); ridisegna(); } else { partita()?.lab.ferma(false); stanza()?.lab.ferma(false); }
  };
  apri.addEventListener('click', () => mostra(true));
  const fai = (f: (p: Gioco) => void): (() => void) => () => {
    const p = partita();
    if (p) { f(p); ridisegna(); }
  };
  // le scelte si fanno a pannello chiuso: aperto, il pannello tiene ferma la partita anche dopo aver scelto
  const scegli = (f: (p: Gioco) => void): (() => void) => () => {
    const p = partita();
    if (!p) return;
    mostra(false);
    f(p);
  };

  // ——— Partita ———
  function schedaPartita(): HTMLElement[] {
    const p = partita();
    if (!p) return [el('p', 'lab-nota', 'Non sei in una partita. Scegli un personaggio per iniziarne una subito:'), riga(...PERSONAGGI.map((q) => tasto(q.nome, () => { gioco.scene.start('Gioco', { pg: q.id }); setTimeout(ridisegna, 600); })))];
    const s = p.lab.stato();
    const min = numero(Math.floor(s.secondi / 60), 0, 15), liv = numero(s.livello, 1, 200);
    return [
      titolo('Tempo'),
      riga(...[1, 3, 5, 8, 10, 12, 14].map((m) => tasto(`${m}'`, fai((x) => x.lab.minuto(m))))),
      riga('Minuto', min, tasto('Vai', fai((x) => x.lab.minuto(Number(min.value) || 0)))),
      titolo('Livello'),
      riga('Livello', liv, tasto('Vai', fai((x) => x.lab.livello(Number(liv.value) || 1))), tasto('+1 con scelta', scegli((x) => x.lab.sceltaDono()))),
      titolo('Stato'),
      riga(
        tasto(s.fermo ? 'Gioco fermo: riprendi' : 'Gioco in corso: ferma', () => { p.lab.ferma(!s.fermo); ridisegna(); }, s.fermo ? 'acceso' : ''),
        tasto(s.immortale ? 'Immortale: sì' : 'Immortale: no', fai((x) => x.lab.immortale(!s.immortale)), s.immortale ? 'acceso' : ''),
        tasto('Cura piena', fai((x) => x.lab.evento('cura'))),
      ),
      titolo('Nemici'),
      riga(el('span', 'lab-stato', `In campo: ${s.nemici}`), tasto('Elimina tutti', fai((x) => x.lab.evento('eliminaNemici')), 'rosso'), tasto('Riempi 400', fai((x) => x.lab.evento('riempi')))),
      titolo('Personaggio (riparte la partita)'),
      riga(...PERSONAGGI.map((q) => tasto(q.nome, () => { gioco.scene.start('Gioco', { pg: q.id }); setTimeout(ridisegna, 600); }, q.id === s.pg ? 'acceso' : ''))),
    ];
  }

  // ——— Stanze (gioco a stanze, pivot del 12/11) ———
  function schedaStanze(): HTMLElement[] {
    const entra = (): void => { for (const k of ['Gioco', 'Menu']) if (gioco.scene.isActive(k)) gioco.scene.stop(k); gioco.scene.start('Stanze'); setTimeout(ridisegna, 600); };
    const st = stanza();
    if (!st) {
      return [
        el('p', 'lab-nota', 'Il gioco a stanze, fetta verticale fino al passo 5 (abilità caricata colpendo): una stanza chiusa da muri, il Lampionaio con la Lanterna a tasto, Ricaduti e Cantori a ondate, la Grazia dalla schivata perfetta. In orizzontale: sul telefono in verticale chiede di ruotarlo.'),
        riga(tasto('Entra nella stanza', entra, 'acceso')),
      ];
    }
    const s = st.lab.stato();
    const vai = (dove: PuntoStanza, testo: string): HTMLElement => tasto(testo, () => { st.lab.vai(dove); ridisegna(); });
    const f = (azione: () => void): (() => void) => () => { azione(); ridisegna(); };
    const rin = s.rinascita === true ? 'sempre' : s.rinascita === false ? 'mai' : 'normale (10%)';
    return [
      titolo('Stanza'),
      riga(el('span', 'lab-stato', `Pavimento ${s.larghezza} × ${s.altezza} px · Lampionaio in ${s.x}, ${s.y}`)),
      titolo('Percorso (tre stanze)'),
      riga(el('span', 'lab-stato', `Stanza ${s.stanza} di 3 · carte da: ${s.ricompensa} · fase: ${s.fase}${s.porte.length ? ` · porte: ${s.porte.join(', ')}` : ''}`)),
      riga(el('span', 'lab-stato', `Build: Lanterna ${s.lanterna}${s.echi.length ? ', ' + s.echi.join(', ') : ''}${s.doni.length ? ' · doni: ' + s.doni.join(', ') : ''}`)),
      riga(
        tasto('Ripulisci la stanza', () => { st.lab.ripulisci(); mostra(false); }),
        ...[0, 1, 2].map((k) => tasto(`Attraversa la porta ${k + 1}`, () => { st.lab.attraversa(k); mostra(false); })),
      ),
      riga(...(['luce', 'sacro', 'ombra', 'terra'] as const).map((a) => tasto(`Eco di ${a}`, f(() => st.lab.eco(a))))),
      el('p', 'lab-nota', '«Ripulisci la stanza» toglie i nemici: dopo un attimo arrivano le 3 carte. Scelta la carta si aprono le porte, con sopra il simbolo della ricompensa: «Attraversa la porta» ti porta contro una di loro. Nella prima stanza le carte sono 3 Echi; poi pescano dalla porta scelta. Dopo la terza stanza: «Fetta completata». Numeri in Numeri → stanze → PERCORSO e PORTE.'),
      titolo('Nemici'),
      riga(el('span', 'lab-stato', `In campo: ${s.nemici} · battuti: ${s.uccisi} · rinati: ${s.rinascite}`)),
      riga(
        tasto('Ricaduto vicino', f(() => st.lab.nemico('ricaduto', 140))),
        tasto('Cantore vicino', f(() => st.lab.nemico('cantore', 230))),
        tasto('Ondata', f(() => st.lab.ondata())),
        tasto('Pozza di cera', f(() => st.lab.pozza())),
        tasto('Togli tutti', f(() => st.lab.svuota()), 'rosso'),
      ),
      riga(
        tasto(s.ondateAutomatiche ? 'Stanza in corso (ondate e carte): sì' : 'Stanza in corso (ondate e carte): no', f(() => st.lab.ondateAutomatiche(!s.ondateAutomatiche)), s.ondateAutomatiche ? 'acceso' : ''),
        tasto(`Rinascita del Ricaduto: ${rin}`, f(() => st.lab.rinascita(s.rinascita === null ? true : s.rinascita ? false : null)), s.rinascita !== null ? 'acceso' : ''),
      ),
      el('p', 'lab-nota', 'Spegni «Stanza in corso» e togli tutti per provare un nemico alla volta (niente ondate e niente carte). Il Ricaduto si ferma vicino a te, a terra si riempie lo spicchio rosso (l\'avviso) e poi graffia; il Cantore resta lontano, a terra compare una linea fino al muro e poi lancia il grumo, che ti cerca per un attimo (una curva stretta lo semina) e contro il muro scoppia in una pozza di cera: per 2 s ferisce chi ci passa sopra («Pozza di cera» ne fa una qui accanto). Esci dallo spicchio all\'ultimo istante o fatti sfiorare dal grumo: parte la Grazia. Ogni Ricaduto battuto resta a terra 1,5 s e non si può colpire; «Rinascita: sempre» lo fa rialzare sempre (una volta sola), «mai» lo fa sparire sempre. Numeri in Numeri → stanze → NEMICI_STANZA e ONDATA.'),
      titolo('Lampionaio'),
      riga(el('span', 'lab-stato', `Salute ${s.salute}/${s.saluteMassima} · Quiete ${s.quiete} s · colpi subiti ${s.ferite} · schivate perfette ${s.schivate}${s.grazia > 0 ? ` · Grazia ancora ${s.grazia.toFixed(1)} s` : ''}`)),
      riga(
        tasto(s.immortale ? 'Immortale: sì' : 'Immortale: no', f(() => st.lab.immortale(!s.immortale)), s.immortale ? 'acceso' : ''),
        tasto('Cura piena', f(() => st.lab.cura())),
        tasto('Salute a 1', f(() => st.lab.salute(1))),
        tasto('Grazia adesso', () => { st.lab.grazia(); mostra(false); }),
        tasto(s.fermoImpatto ? 'Fermo d\'impatto: sì' : 'Fermo d\'impatto: no', f(() => st.lab.fermoImpatto(!s.fermoImpatto)), s.fermoImpatto ? 'acceso' : ''),
      ),
      el('p', 'lab-nota', '«Grazia adesso» fa partire anche l\'attimo al rallentatore. Il fermo d\'impatto ferma per un attimo il Lampionaio e il nemico colpito: spegnilo per sentire la differenza (vale finché non esci dalla stanza; numeri in Numeri → stanze → IMPATTO). Quiete e Grazia sono in Numeri → stanze → COMBATTIMENTO_STANZA e GRAZIA_STANZA.'),
      titolo('Abilità (Cerchio di luce)'),
      riga(el('span', 'lab-stato', `Carica ${s.carica}/${s.caricaPiena} colpi · usata ${s.abilitaUsi} volte${s.abilitaAttiva > 0 ? ` · attiva ancora ${s.abilitaAttiva.toFixed(1)} s` : ''}`)),
      riga(
        tasto('Carica piena', f(() => st.lab.caricaAbilita(true))),
        tasto('Carica vuota', f(() => st.lab.caricaAbilita(false))),
        tasto('Usa adesso', () => { st.lab.caricaAbilita(true); mostra(false); st.lab.usaAbilita(); }),
      ),
      el('p', 'lab-nota', 'Si carica solo con i colpi della Lanterna a segno: piena dopo 8 colpi (un colpo conta 1 anche se prende più nemici). Scarica, toccata trema e fa un tonfo. Piena, l\'icona si accende: tocca il pulsante accanto al joystick d\'attacco o premi Spazio. Numeri in Numeri → stanze → ABILITA_STANZA; raggio, danno e durata in Numeri → abilita.'),
      riga(tasto(s.fermo ? 'Stanza ferma: riprendi' : 'Stanza in corso: ferma', () => { st.lab.ferma(!s.fermo); ridisegna(); }, s.fermo ? 'acceso' : ''), tasto('Ricomincia (ridisegna con i numeri nuovi)', entra)),
      titolo('Prova i muri: porta il Lampionaio'),
      riga(vai('centro', 'Al centro'), vai('alto', 'Al muro in alto'), vai('basso', 'Al muro in basso'), vai('sinistra', 'Al muro a sinistra'), vai('destra', 'Al muro a destra'), vai('angolo', "Nell'angolo")),
      el('p', 'lab-nota', 'Poi chiudi il LAB e spingi contro il muro: il Lampionaio deve fermarsi. Le misure della stanza sono in Numeri → stanze (dopo averle cambiate premi Ricomincia).'),
      titolo('Attacco (Lanterna a tasto)'),
      riga(el('span', 'lab-stato', `Colpi partiti: ${s.colpi}`), ...(['sinistra', 'destra', 'su', 'giu', 'auto'] as DirezioneColpo[]).map((d) => tasto(d === 'auto' ? 'Automatico' : `Verso ${d === 'giu' ? 'giù' : d}`, () => { st.lab.attacca(d); mostra(false); }))),
      el('p', 'lab-nota', 'Il colpo parte appena chiudi il LAB. Sul telefono: tocco breve sul tasto in basso a destra = colpo verso il nemico più vicino (se non ce n\'è a portata, dove guarda il Lampionaio); trascina il tasto per mirare e lascia per colpire. Su computer: clic sinistro verso il puntatore, J automatico. Ricarica, raggio e ampiezza in Numeri → stanze → ATTACCO.'),
      titolo('Joystick'),
      riga(tasto(st.lab.lineaVisibile() ? 'Linea al centro: visibile' : 'Linea al centro: invisibile', () => { st.lab.linea(!st.lab.lineaVisibile()); ridisegna(); }, st.lab.lineaVisibile() ? 'acceso' : '')),
      el('p', 'lab-nota', 'Il joystick di movimento nasce solo a sinistra della linea e la sua base non la supera; a destra della linea il dito non muove il Lampionaio (sarà il joystick d\'attacco).'),
      titolo('Esci'),
      riga(tasto('Torna al menu', () => { gioco.scene.stop('Stanze'); gioco.scene.start('Menu'); setTimeout(ridisegna, 300); })),
    ];
  }

  // ——— Eventi ———
  function schedaEventi(): HTMLElement[] {
    if (!partita()) return [el('p', 'lab-nota', 'Serve una partita: vai su Partita.')];
    const e = (nome: Parameters<LabPartita['evento']>[0], testo: string, classe = ''): HTMLElement => tasto(testo, fai((x) => x.lab.evento(nome)), classe);
    return [
      titolo('Nemici'),
      riga(e('elite', 'Élite'), e('seth1', 'Seth (1ª volta)'), e('seth2', 'Seth (2ª volta)'), e('orda', 'Orda a muro'), e('sciame', 'Sciame ad anello')),
      riga(tasto('Orda a cuneo', fai((x) => x.lab.orda('cuneo'))), tasto('Tenaglia', fai((x) => x.lab.orda('tenaglia')))),
      titolo('Drop a terra'),
      riga(e('pane', 'Pane'), e('calamita', 'Calamita'), e('reliquiarioATerra', 'Reliquiario'), e('reliquiarioLontano', 'Reliquiario fuori vista'), e('cera', '10 gocce di Cera'), e('anime', 'Anima grande')),
      titolo('Rompibili (prova)'),
      riga(tasto('Urna, giara e lanterna qui accanto', fai((x) => x.lab.rompibili())), tasto('Rompi il più vicino', fai((x) => x.lab.rompiVicino()))),
      riga(tasto("Chiazza d'olio", fai((x) => x.lab.chiazza())), tasto('Accendi le chiazze', fai((x) => x.lab.accendiChiazze())), tasto('Frammento a terra', fai((x) => x.lab.frammento())), tasto('Mosaico: pezzo dopo', fai((x) => x.lab.mosaico())), tasto('Bagliore', fai((x) => x.lab.bagliore()))),
      el('p', 'lab-nota', 'Lascia il gioco in corso (scheda Partita) per vederli rompersi. I numeri sono in Numeri → rompibili.'),
      titolo('Avvisi nel cartiglio'),
      riga(tasto('Seth', fai((x) => x.lab.avviso('Seth', 'il Rinnovato è venuto per te'))), tasto('Sciame', fai((x) => x.lab.avviso('Lo sciame', 'ti circonda'))), tasto('Due orde', fai((x) => x.lab.avviso('Due orde', 'ti stringono'))), tasto('Reliquiario', fai((x) => x.lab.avviso('Reliquiario', 'Lanterna, Candela, Falce')))),
      titolo('Scelte'),
      riga(tasto('Scelta del dono', scegli((x) => x.lab.sceltaDono())), tasto('Apri un reliquiario', scegli((x) => x.lab.reliquiario())), tasto(partita()!.lab.stato().rosario ? 'Rosario sbloccato' : 'Sblocca il Rosario', fai((x) => x.lab.rosario(!x.lab.stato().rosario)), partita()!.lab.stato().rosario ? 'acceso' : '')),
      riga(tasto('Armi e doni nuovi in questa partita', fai((x) => x.lab.oggetti(true))), tasto('Scelta dei Riti', scegli((x) => x.lab.riti()))),
      el('p', 'lab-nota', 'I Riti: una carta per ogni affinità delle tue armi (al massimo 3). Nel gioco si aprono ogni 3 livelli quando non resta nulla da potenziare. Quanti Riti hai: Pausa → Stati. Numeri in Numeri → stati → RITI.'),
      titolo('Grazia a tacche'),
      riga(
        tasto(INTERRUTTORI.taccheScintilla ? 'Scintilla: sì' : 'Scintilla: no', fai(() => { INTERRUTTORI.taccheScintilla = !INTERRUTTORI.taccheScintilla; }), INTERRUTTORI.taccheScintilla ? 'acceso' : ''),
        tasto(INTERRUTTORI.taccheSuono ? 'Suono: sì' : 'Suono: no', fai(() => { INTERRUTTORI.taccheSuono = !INTERRUTTORI.taccheSuono; }), INTERRUTTORI.taccheSuono ? 'acceso' : ''),
      ),
      riga(tasto('Riempi tacche', fai((x) => x.lab.tacche(true))), tasto('Svuota tacche', fai((x) => x.lab.tacche(false)))),
      el('p', 'lab-nota', 'Sfiora i nemici senza toccarli: ogni nemico dà una tacca (non più di una ogni 2 s). «Riempi» le lascia a una dallo scatto: al prossimo sfioro parte la Grazia. Tacche, distanza e calo: Numeri → sopravvivenza → GRAZIA.tacche.'),
      titolo('Lacrime di Lumen: raggio di unione'),
      riga(...([28, 40, 56, 72] as const).map((r) => tasto(`${r} px`, fai((x) => x.lab.unioneLacrime(r)), progressione.ANIME.accorpa === r ? 'acceso piccolo' : 'piccolo'))),
      el('p', 'lab-nota', 'Una lacrima che cade entro questa distanza da una ferma si unisce a lei: il valore si somma e la lacrima cambia dimensione e colore. Più grande = meno lacrime sul campo. Vale subito, per le lacrime che cadono da adesso, finché non ricarichi la pagina. Di serie 56 px (era 28; confermato da Edoardo, 11/11).'),
      titolo('Effetti pixelfx (vecchio contro nuovo)'),
      riga(tasto(INTERRUTTORI.pixelfx ? 'Effetti pixelfx: sì' : 'Effetti pixelfx: no', fai((x) => x.lab.pixelfx(!INTERRUTTORI.pixelfx)), INTERRUTTORI.pixelfx ? 'acceso' : ''),
        tasto(INTERRUTTORI.sepolturaPixelfx ? 'Sepoltura pixelfx: sì' : 'Sepoltura pixelfx: no', fai((x) => x.lab.sepolturaPixelfx(!INTERRUTTORI.sepolturaPixelfx)), INTERRUTTORI.sepolturaPixelfx ? 'acceso' : '')),
      riga(tasto('Sepoltura qui', fai((x) => x.lab.vediEffetto('sepoltura'))), tasto('Eclissi qui', fai((x) => x.lab.vediEffetto('eclissi')))),
      riga(...PIXELFX.pozza.raggi.map((r) => tasto(`Pozza ${r}`, fai((x) => x.lab.vediEffetto('pozza', r)), 'piccolo'))),
      el('p', 'lab-nota', 'Di serie Pozza dell\'Acqua santa ed Eclissi (12 fotogrammi al secondo) usano gli sprite presi da pixelfx (a retino, a grandezza naturale); spento, quelli di sempre. La Sepoltura pixelfx è spenta di serie: si rifà dopo il rework del combattimento. Cambia solo il disegno: aree, danni e tempi restano uguali. I tasti mostrano l\'effetto accanto a te senza ferire nessuno: premili con l\'interruttore acceso e spento per confrontarli. La Pozza sceglie la misura più vicina all\'area vera. Vale finché non ricarichi la pagina. Numeri in Numeri → effetti → PIXELFX.'),
      titolo('Acquasantiera'),
      riga(tasto('Pozza che cura qui', fai((x) => x.lab.pozzaCurativa()))),
      el('p', 'lab-nota', 'La pozza che nasce quando il sorso trova la fiaschetta piena: 4 s, cura il 3% della salute massima al secondo. Ferisciti (Immortale) e mettiti dentro.'),
      titolo('Prova «pochi e forti» (12/11)'),
      riga(tasto(INTERRUTTORI.pochi ? 'Pochi e forti: sì' : 'Pochi e forti: no', fai((x) => x.lab.pochiEForti(!INTERRUTTORI.pochi)), INTERRUTTORI.pochi ? 'acceso' : ''),
        tasto(INTERRUTTORI.schermo ? 'Armi solo nello schermo: sì' : 'Armi solo nello schermo: no', fai((x) => x.lab.soloSchermo(!INTERRUTTORI.schermo)), INTERRUTTORI.schermo ? 'acceso' : '')),
      riga(tasto('Riavvia la partita', () => { const p = partita(); if (p) { mostra(false); gioco.scene.start('Gioco', { pg: p.lab.stato().pg }); } })),
      el('p', 'lab-nota', 'Spenti di partenza: la notte è quella di sempre. «Pochi e forti»: un terzo dei nemici in campo e delle comparse, i nemici comuni hanno il triplo di salute e lasciano il triplo di Lumen; orde, élite e Seth come sempre. Vale per i nemici che nascono da adesso: per provarlo dall\'inizio premi «Riavvia la partita». «Armi solo nello schermo»: le armi non colpiscono, non lasciano stati e non mirano ai nemici fuori dal campo visibile; vale subito. Restano accesi anche per le partite dopo, finché non ricarichi la pagina. Numeri in Numeri → nemici → POCHI_E_FORTI.'),
      titolo('Stati a caso (vecchi, per confrontare)'),
      riga(tasto(!INTERRUTTORI.statiCerti ? 'Stati a caso (vecchi): sì' : 'Stati a caso (vecchi): no', fai((x) => x.lab.statiCerti(!INTERRUTTORI.statiCerti)), !INTERRUTTORI.statiCerti ? 'acceso' : '')),
      el('p', 'lab-nota', 'Spento (di partenza) vale la regola del gioco: ogni colpo lascia lo stato, le zone e le abilità al massimo una volta al secondo sullo stesso nemico, dopo una reazione 3 s di quiete. Acceso torna la regola di prima: lo stato solo nel 10% dei colpi (5% per zone e abilità), reazioni con i numeri vecchi. Vale subito e anche per le partite dopo, finché non ricarichi la pagina. Numeri in Numeri → stati → STATI_CERTI.'),
      titolo('Stati sui nemici vicini (due diversi = reazione)'),
      riga(...(['luce', 'sacro', 'ombra', 'terra'] as const).map((a) => tasto({ luce: 'Abbagliato', sacro: 'Consacrato', ombra: 'Maledetto', terra: 'Sepolto' }[a], fai((x) => x.lab.statoVicini(a))))),
      el('p', 'lab-nota', 'Per vederli lascia il gioco in corso (scheda Partita) e premi uno stato, poi un altro.'),
      titolo('Segnali sul bordo del campo'),
      riga(tasto('Peccato: accendi', fai((x) => x.lab.peccato(true))), tasto('Peccato: spegni', fai((x) => x.lab.peccato(false)))),
      titolo('Altro'),
      riga(e('grazia', 'Grazia'), e('vittoria', "Alba: vittoria", ''), e('morte', 'Morte', 'rosso')),
    ];
  }

  // ——— Oggetti ———
  function schedaOggetti(): HTMLElement[] {
    const p = partita();
    if (!p) return [el('p', 'lab-nota', 'Serve una partita: vai su Partita.')];
    const liv = p.lab.livelli();
    const livelloArma = (a: (typeof ARMI_COMUNI)[number]): number => liv.armi.find((x) => x.arma === a)?.livello ?? 0;
    const tutteLeArme = [...Object.values(ARMI_INIZIALI), ...ARMI_COMUNI];
    const am = p.lab.amuletiSnapshot();
    const unite = p.lab.statoUnioni().unite;
    return [
      titolo('Lanterna e Pala verso dove cammini (vecchio, per confrontare)'),
      riga(tasto(!INTERRUTTORI.mira ? 'Lanterna e Pala verso dove cammini: sì' : 'Lanterna e Pala verso dove cammini: no', fai(() => { INTERRUTTORI.mira = !INTERRUTTORI.mira; }), !INTERRUTTORI.mira ? 'acceso' : '')),
      el('p', 'lab-nota', 'Spento (di partenza) vale la regola del gioco: l\'arco della Lanterna si gira verso il nemico più vicino entro la luce (260 px) e l\'impatto della Pala cade sul nemico più vicino entro 150 px; senza nemici vicini colpiscono verso dove cammini. Acceso colpiscono sempre verso dove cammini, come prima. Vale subito e anche per le partite dopo, finché non ricarichi la pagina. Numeri in Numeri → armi → MIRA.'),
      titolo('Armi (si sale di livello; per toglierle riavvia la partita)'),
      ...tutteLeArme.map((a) => riga(el('b', '', `${a.nome} · ${livelloArma(a) || '—'}`), tasto('+1', fai((x) => x.lab.arma(a, livelloArma(a) + 1)), 'piccolo'), tasto('Liv. 8', fai((x) => x.lab.arma(a, 8)), 'piccolo'))),
      titolo('Doni passivi'),
      ...PASSIVI.map((q) => riga(el('b', '', `${q.nome} · ${liv.doni[q.id] || '—'}`), tasto('−1', fai((x) => x.lab.dono(q.id, (liv.doni[q.id] || 0) - 1)), 'piccolo'), tasto('+1', fai((x) => x.lab.dono(q.id, (liv.doni[q.id] || 0) + 1)), 'piccolo'), tasto('Max', fai((x) => x.lab.dono(q.id, q.massimo)), 'piccolo'))),
      titolo('Amuleti del Rosario'),
      ...AMULETI.map((a) => riga(el('b', '', `${a.nome} (${a.grani})`), tasto(am.posseduti.includes(a.id) ? 'Presente' : 'Aggiungi', fai((x) => x.lab.amuleto(a.id, !am.posseduti.includes(a.id))), am.posseduti.includes(a.id) ? 'acceso piccolo' : 'piccolo'))),
      titolo(`Unioni (Prepara: arma al ${LIVELLO_ARMA_UNIONE} e dono al massimo, poi apri un reliquiario)`),
      ...UNIONI.map((u) => riga(el('b', '', u.nome), tasto('Prepara', fai((x) => x.lab.unione(u.id, false)), 'piccolo'), tasto(unite.includes(u.id) ? 'Unita' : 'Unisci', fai((x) => x.lab.unione(u.id, true)), unite.includes(u.id) ? 'acceso piccolo' : 'piccolo'))),
    ];
  }

  // ——— Numeri ———
  function schedaNumeri(): HTMLElement[] {
    raccogli();
    const cerca = el('input', 'lab-cerca');
    cerca.type = 'search';
    cerca.placeholder = 'Cerca un numero (per esempio «cera», «elite», «pane»)';
    const elenco = el('div');
    const copia = el('textarea', 'lab-testo');
    copia.readOnly = true;
    copia.hidden = true;
    const modifiche = (): [Voce, number][] => voci.filter((v) => v.padre[v.chiave] !== v.originale).map((v) => [v, v.padre[v.chiave] as number]);
    const disegna = (): void => {
      const q = cerca.value.trim().toLowerCase();
      const trovate = q ? voci.filter((v) => v.percorso.toLowerCase().includes(q) || v.sotto.toLowerCase().includes(q)) : voci;
      const gruppi = new Map<string, Voce[]>();
      for (const v of trovate.slice(0, q ? 400 : 5000)) {
        const k = `${v.modulo} · ${v.gruppo}`;
        (gruppi.get(k) ?? gruppi.set(k, []).get(k)!).push(v);
      }
      elenco.replaceChildren(...[...gruppi].map(([nome, vs]) => {
        const d = el('details', 'lab-gruppo');
        d.open = !!q && gruppi.size <= 6;
        d.append(el('summary', '', `${nome} (${vs.length})`));
        const dentro = el('div');
        for (const v of vs) {
          const val = v.padre[v.chiave] as number;
          const i = numero(val, -1e9, 1e9, Math.abs(v.originale) < 1 && v.originale !== 0 ? 0.01 : 1);
          i.addEventListener('change', () => { if (i.value !== '' && !Number.isNaN(Number(i.value))) { imposta(v, Number(i.value)); r.classList.toggle('cambiato', Number(i.value) !== v.originale); } });
          const r = el('div', `lab-voce${val !== v.originale ? ' cambiato' : ''}`, '', [el('span', '', v.sotto.slice(v.gruppo.length + 1) || v.chiave), i]);
          r.append(tasto('↺', () => { imposta(v, v.originale); i.value = String(v.originale); r.classList.remove('cambiato'); }, 'piccolo'));
          dentro.append(r);
        }
        d.append(dentro);
        return d;
      }));
    };
    cerca.addEventListener('input', disegna);
    disegna();
    return [
      el('p', 'lab-nota', 'I numeri cambiano subito e restano anche se ricarichi la pagina. Alcuni (nemici già in campo, misure) valgono dalla prossima partita: premi «Riavvia la partita».'),
      cerca,
      riga(
        tasto('Copia le modifiche per Claude', () => {
          const m = modifiche();
          copia.value = m.length ? m.map(([v, n]) => `src/data/${v.modulo}.ts · ${v.sotto}: ${v.originale} → ${n}`).join('\n') : 'Nessuna modifica.';
          copia.hidden = false;
          copia.select();
          void navigator.clipboard?.writeText(copia.value).catch(() => {});
        }),
        tasto('Azzera tutto', () => { for (const [v] of modifiche()) v.padre[v.chiave] = v.originale; scriviSalvati({}); disegna(); }, 'rosso'),
        tasto('Riavvia la partita', () => { const p = partita(); if (p) { mostra(false); gioco.scene.start('Gioco', { pg: p.lab.stato().pg }); } }),
      ),
      copia,
      elenco,
    ];
  }

  // ——— Schermate ———
  function schedaSchermate(): HTMLElement[] {
    const p = partita();
    const vai = (nome: string, fnz: () => void): HTMLElement => tasto(nome, () => { mostra(false); fnz(); });
    return [
      titolo('Fuori dalla partita'),
      riga(
        vai('Menu dei personaggi', () => { gioco.scene.start('Menu'); }),
        vai('La Cappella', () => {
          gioco.scene.start('Menu');
          const prova = (n = 0): void => { const m = menu(); if (m) m.labApriCappella(); else if (n < 30) setTimeout(() => prova(n + 1), 100); };
          prova();
        }),
      ),
      titolo(p ? 'In partita' : 'In partita (serve una partita)'),
      riga(
        vai('Pausa', () => p?.lab.pausa()),
        vai('Scelta del dono', () => p?.lab.sceltaDono()),
        vai('Reliquiario', () => p?.lab.reliquiario()),
        vai("Scoperta di un'Unione", () => p?.lab.scoperta()),
        vai("Fine: l'alba", () => p?.lab.evento('vittoria')),
        vai('Fine: sconfitta', () => p?.lab.evento('morte')),
      ),
      titolo(p ? 'Pausa' : 'Pausa (serve una partita)'),
      riga(
        vai('Build', () => p?.lab.pausa('build')),
        vai('Rosario', () => p?.lab.pausa('rosario')),
        vai('Stati', () => p?.lab.pausa('stati')),
        vai('Opzioni', () => p?.lab.pausa('opzioni')),
      ),
      riga(
        vai('Caso pieno', () => p?.lab.pausaPiena()),
        vai('Peccato', () => p?.lab.pausaPeccato()),
        vai('Prima partita', () => p?.lab.pausaPrima()),
        vai('Sopra i doni', () => p?.lab.pausaSopra(false)),
        vai('Sopra il reliquiario', () => p?.lab.pausaSopra(true)),
      ),
      el('p', 'lab-nota', 'Il pannello si chiude da solo per mostrarti la schermata. Riaprilo con LAB. Le ultime prove cambiano la partita in corso.'),
    ];
  }

  // ——— Schermo ———
  function schedaSchermo(): HTMLElement[] {
    const righe = letturaSchermo();
    const copia = el('textarea', 'lab-testo');
    copia.readOnly = true;
    copia.hidden = true;
    raccogli();
    const scambio = voci.find((v) => v.percorso === 'hud.FASCE.scambiaAngoli')!, scambiati = hud.FASCE.scambiaAngoli === 1;
    return [
      titolo('Fascia bassa'),
      riga(tasto(scambiati ? 'Abilità a sinistra: tocca per scambiare' : 'Abilità a destra: tocca per scambiare', () => {
        imposta(scambio, scambiati ? 0 : 1);
        window.dispatchEvent(new Event('resize')); // abilità, fiaschetta e HUD si rimettono al loro posto
        ridisegna();
      }, scambiati ? 'acceso' : '')),
      titolo('Prova prestazioni'),
      el('p', 'lab-nota', 'Un tocco e aspetta un minuto senza toccare niente: alla fine c\'è un testo da copiare. Da una partita chiede conferma, la chiude, torna al menu e parte da lì; Cera, record e sblocchi non cambiano.'),
      riga(tasto(INTERRUTTORI.provaConEffetti ? 'Con effetti: sì' : 'Con effetti: no', () => { INTERRUTTORI.provaConEffetti = !INTERRUTTORI.provaConEffetti; ridisegna(); }, INTERRUTTORI.provaConEffetti ? 'acceso' : '')),
      el('p', 'lab-nota', 'Con effetti: durante la misura partono a ripetizione la Sepoltura (ogni 5 s), la Pozza più grande (ogni 2 s) e 3 Eclissi al secondo, senza ferire nessuno. Seguono gli interruttori della scheda Eventi (Effetti pixelfx e Sepoltura pixelfx): nuovi o di sempre: fai la prova nei due modi e confronta i risultati. Il testo finale dice quali erano accesi.'),
      riga(tasto('Prova prestazioni', () => {
        if (partita() && !confirm('La partita in corso si perde: la prova la chiude e riparte dal menu. Continuare?')) return;
        mostra(false);
        void avviaProvaPrestazioni(gioco);
      }, 'acceso')),
      titolo('Fotogrammi al secondo'),
      riga(tasto(contatoreAcceso() ? 'Contatore: acceso' : 'Contatore: spento', () => { accendiContatore(gioco, !contatoreAcceso()); ridisegna(); }, contatoreAcceso() ? 'acceso' : '')),
      el('p', 'lab-nota', 'Resta acceso in tutte le schermate, anche nella selezione: media e peggiore dell\'ultimo secondo. Le prove qui sotto servono a capire cosa pesa sul telefono.'),
      riga(
        tasto(foriSpenti ? 'Fori nel buio: spenti' : 'Fori nel buio: accesi', () => { foriSpenti = !foriSpenti; partita()?.lab.foriBuio(!foriSpenti); ridisegna(); }, foriSpenti ? 'acceso' : ''),
      ),
      titolo('Misure'),
      el('p', 'lab-nota', 'Quello che il telefono dichiara adesso. Tienilo in verticale e, nell\'app o nel link in Home, senza barre visibili.'),
      riga(
        tasto('Copia le misure per Claude', () => {
          copia.value = righe.map(([nome, valore]) => (valore ? `${nome}: ${valore}` : `\n${nome}`)).join('\n').trim();
          copia.hidden = false;
          copia.select();
          void navigator.clipboard?.writeText(copia.value).catch(() => {});
        }),
        tasto('Aggiorna', ridisegna),
      ),
      copia,
      ...righe.map(([nome, valore]) => (valore ? el('div', 'lab-voce', '', [el('span', '', `${nome}: ${valore}`)]) : titolo(nome))),
    ];
  }

  // ——— Salvataggio ———
  function schedaSalvataggio(): HTMLElement[] {
    const s = carica();
    const cera = numero(s.cera, 0, 1e7, 100);
    const fatto = (testo: string): void => { corpo.prepend(el('p', 'lab-nota', testo)); };
    let sicuro = false;
    const azzera = tasto('Azzera il salvataggio', () => {
      if (!sicuro) { sicuro = true; azzera.textContent = 'Sicuro? Tocca di nuovo'; return; }
      try { localStorage.removeItem('dl-salvataggio'); } catch { /* niente memoria */ }
      ridisegna();
      fatto('Salvataggio azzerato.');
    }, 'rosso');
    return [
      el('p', 'lab-stato', `Cera ${s.cera} · personaggi: ${s.sbloccati.join(', ')} · Rosario ${s.rosario ? 'sì' : 'no'} · Seconda candela ${s.secondaCandela ? 'sì' : 'no'}`),
      titolo('Cera'),
      riga(cera, tasto('Imposta', () => { const x = carica(); x.cera = Math.max(0, Math.floor(Number(cera.value) || 0)); salva(x); ridisegna(); })),
      titolo('Sblocchi'),
      riga(
        tasto('Sblocca tutti i personaggi', () => { const x = carica(); x.sbloccati = PERSONAGGI.map((q) => q.id); salva(x); ridisegna(); }),
        tasto('Sblocca il Rosario', () => { const x = carica(); x.rosario = true; salva(x); ridisegna(); }),
        tasto('Sblocca armi e doni nuovi', () => { const x = carica(); x.oggetti = SBLOCCHI_OGGETTI.map((o) => o.id); salva(x); ridisegna(); }),
        tasto('Sblocca le Unioni', () => { const x = carica(); x.unioni = true; salva(x); ridisegna(); }),
        tasto('Vinci una veglia', () => { const x = carica(); x.vittorie++; salva(x); ridisegna(); }),
        tasto('Dimentica le Unioni scoperte e unite', () => { const x = carica(); x.unioniScoperte = []; x.unioniUnite = []; salva(x); partita()?.lab.dimenticaUnioni(); ridisegna(); }),
        tasto('Seconda candela', () => { const x = carica(); x.secondaCandela = true; x.secondaCandelaSpenta = false; salva(x); ridisegna(); }),
      ),
      titolo('Ceri votivi'),
      riga(
        tasto('Tutti al massimo', () => { const x = carica(); for (const c of CERI) x.ceri[c.id] = 5; x.spenti = []; salva(x); ridisegna(); }),
        tasto('Tutti a zero', () => { const x = carica(); for (const c of CERI) x.ceri[c.id] = 0; salva(x); ridisegna(); }),
      ),
      el('p', 'lab-nota', 'Le modifiche valgono dalla prossima partita o dalla prossima volta che apri la Cappella.'),
      titolo('Azzeramento'),
      riga(azzera),
    ];
  }

  // il pannello segue la partita: lo stato in alto si aggiorna ogni tanto mentre è aperto
  setInterval(() => {
    if (pannello.hidden) return;
    const p = partita();
    const s = p?.lab.stato();
    if (s) stato.textContent = `Laboratorio · ${s.pg} · ${Math.floor(s.secondi / 60)}:${String(Math.floor(s.secondi % 60)).padStart(2, '0')} · liv. ${s.livello} · urne ${s.urne} · ${Math.round(s.salute)}/${Math.round(s.saluteMassima)} PS`;
  }, 500);
}
