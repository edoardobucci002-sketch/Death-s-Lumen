/*
 * Laboratorio: un pannello solo per il link di prova e lo sviluppo (mai nella versione pubblica) per andare subito
 * a qualsiasi punto del gioco e vedere una cosa sola, senza rigiocare tutto:
 *  · Partita: minuto, livello, salute, personaggio, nemici
 *  · Eventi: élite, Seth, orde, reliquiari, drop, stati e reazioni, vittoria e sconfitta
 *  · Oggetti: armi, doni e amuleti a qualsiasi livello
 *  · Numeri: tutti i numeri di src/data/ si cambiano al volo (restano finché non li azzeri) e si copiano per Claude
 *  · Schermate: menu, Cappella, pausa, scelta dei doni, reliquiario, fine
 *  · Salvataggio: Cera, sblocchi, ceri
 * Si apre con il pulsante LAB sul bordo sinistro dello schermo.
 */
import type Phaser from 'phaser';
import type { Gioco } from '../scene/Gioco';
import type { Menu } from '../scene/Menu';
import { ARMI_COMUNI, ARMI_INIZIALI } from '../data/armi';
import { PASSIVI } from '../data/doni';
import { AMULETI } from '../data/rosario';
import { PERSONAGGI } from '../data/personaggi';
import { CERI } from '../data/meta';
import { carica, salva } from './salvataggio';
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
import * as rosario from '../data/rosario';
import * as sopravvivenza from '../data/sopravvivenza';
import * as stati from '../data/stati';

const CHIAVE_NUMERI = 'dl-lab-numeri';
const MODULI: Record<string, Record<string, unknown>> = { abilita, armi, doni, effetti, hud, meta, mondo, nemici, oggetti, personaggi, progressione, rosario, sopravvivenza, stati };

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
      if (typeof valore === 'object' && valore !== null) visita(valore as Nodo, modulo, nome, nome, 0, new Set());
    }
  }
}

function visita(nodo: Nodo, modulo: string, gruppo: string, sotto: string, profondita: number, visti: Set<unknown>): void {
  if (profondita > 6 || visti.has(nodo)) return;
  visti.add(nodo);
  for (const [k, v] of Object.entries(nodo)) {
    if (typeof v === 'number') voci.push({ percorso: `${modulo}.${sotto}.${k}`, modulo, gruppo, sotto: `${sotto}.${k}`, padre: nodo, chiave: k, originale: v });
    else if (typeof v === 'object' && v !== null && !(v instanceof Element)) visita(v as Nodo, modulo, gruppo, `${sotto}.${k}`, profondita + 1, visti);
  }
}

const salvati = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(CHIAVE_NUMERI) ?? '{}'); } catch { return {}; }
};
const scriviSalvati = (m: Record<string, number>): void => {
  try { localStorage.setItem(CHIAVE_NUMERI, JSON.stringify(m)); } catch { /* niente memoria */ }
};

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
.lab-cerca { width: 100%; min-height: 44px; padding: 6px 10px; border: 1px solid #7a54a4; border-radius: 6px; background: #100a16; color: #fff; font: inherit; user-select: text; }
`;

type Scheda = 'partita' | 'eventi' | 'oggetti' | 'numeri' | 'schermate' | 'salvataggio';
const SCHEDE: [Scheda, string][] = [['partita', 'Partita'], ['eventi', 'Eventi'], ['oggetti', 'Oggetti'], ['numeri', 'Numeri'], ['schermate', 'Schermate'], ['salvataggio', 'Salvataggio']];

export function avviaLaboratorio(gioco: Phaser.Game): void {
  applicaSalvati();
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
  pannello.append(el('div', 'lab-testa', '', [stato, chiudi]), schede, corpo);
  document.head.append(stile);
  document.body.append(apri, pannello);
  // i tocchi sul pannello non devono muovere il joystick o far partire l'abilità
  for (const e of [apri, pannello]) for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'keydown']) e.addEventListener(ev, (x) => x.stopPropagation());

  let scheda: Scheda = 'partita';
  const partita = (): Gioco | null => (gioco.scene.isActive('Gioco') ? (gioco.scene.getScene('Gioco') as Gioco) : null);
  const menu = (): Menu | null => (gioco.scene.isActive('Menu') ? (gioco.scene.getScene('Menu') as Menu) : null);
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
    const s = p?.labStato();
    stato.textContent = s ? `Laboratorio · ${s.pg} · ${Math.floor(s.secondi / 60)}:${String(Math.floor(s.secondi % 60)).padStart(2, '0')} · liv. ${s.livello} · ${Math.round(s.salute)}/${Math.round(s.saluteMassima)} PS` : 'Laboratorio · non sei in partita';
    corpo.replaceChildren(...({ partita: schedaPartita, eventi: schedaEventi, oggetti: schedaOggetti, numeri: schedaNumeri, schermate: schedaSchermate, salvataggio: schedaSalvataggio })[scheda]());
  };
  const mostra = (aperto: boolean): void => {
    pannello.hidden = !aperto;
    apri.hidden = aperto;
    // finché il pannello è aperto, la partita sta ferma (si può riprendere dalla scheda Partita)
    if (aperto) { partita()?.labFerma(true); ridisegna(); } else partita()?.labFerma(false);
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
    const s = p.labStato();
    const min = numero(Math.floor(s.secondi / 60), 0, 15), liv = numero(s.livello, 1, 200);
    return [
      titolo('Tempo'),
      riga(...[1, 3, 5, 8, 10, 12, 14].map((m) => tasto(`${m}'`, fai((x) => x.labMinuto(m))))),
      riga('Minuto', min, tasto('Vai', fai((x) => x.labMinuto(Number(min.value) || 0)))),
      titolo('Livello'),
      riga('Livello', liv, tasto('Vai', fai((x) => x.labLivello(Number(liv.value) || 1))), tasto('+1 con scelta', scegli((x) => x.labSceltaDono()))),
      titolo('Stato'),
      riga(
        tasto(s.fermo ? 'Gioco fermo: riprendi' : 'Gioco in corso: ferma', () => { p.labFerma(!s.fermo); ridisegna(); }, s.fermo ? 'acceso' : ''),
        tasto(s.immortale ? 'Immortale: sì' : 'Immortale: no', fai((x) => x.labImmortale(!s.immortale)), s.immortale ? 'acceso' : ''),
        tasto('Cura piena', fai((x) => x.labEvento('cura'))),
      ),
      titolo('Nemici'),
      riga(el('span', 'lab-stato', `In campo: ${s.nemici}`), tasto('Elimina tutti', fai((x) => x.labEvento('eliminaNemici')), 'rosso'), tasto('Riempi 400', fai((x) => x.labEvento('riempi')))),
      titolo('Personaggio (riparte la partita)'),
      riga(...PERSONAGGI.map((q) => tasto(q.nome, () => { gioco.scene.start('Gioco', { pg: q.id }); setTimeout(ridisegna, 600); }, q.id === s.pg ? 'acceso' : ''))),
    ];
  }

  // ——— Eventi ———
  function schedaEventi(): HTMLElement[] {
    if (!partita()) return [el('p', 'lab-nota', 'Serve una partita: vai su Partita.')];
    const e = (nome: Parameters<Gioco['labEvento']>[0], testo: string, classe = ''): HTMLElement => tasto(testo, fai((x) => x.labEvento(nome)), classe);
    return [
      titolo('Nemici'),
      riga(e('elite', 'Élite'), e('seth1', 'Seth (1ª volta)'), e('seth2', 'Seth (2ª volta)'), e('orda', 'Orda'), e('sciame', 'Sciame')),
      titolo('Drop a terra'),
      riga(e('pane', 'Pane'), e('calamita', 'Calamita'), e('reliquiarioATerra', 'Reliquiario'), e('cera', '10 gocce di Cera'), e('anime', 'Anima grande')),
      titolo('Scelte'),
      riga(tasto('Scelta del dono', scegli((x) => x.labSceltaDono())), tasto('Apri un reliquiario', scegli((x) => x.labReliquiario())), tasto(partita()!.labStato().rosario ? 'Rosario sbloccato' : 'Sblocca il Rosario', fai((x) => x.labRosario(!x.labStato().rosario)), partita()!.labStato().rosario ? 'acceso' : '')),
      titolo('Stati sui nemici vicini (due diversi = reazione)'),
      riga(...(['luce', 'sacro', 'ombra', 'terra'] as const).map((a) => tasto({ luce: 'Abbagliato', sacro: 'Consacrato', ombra: 'Maledetto', terra: 'Sepolto' }[a], fai((x) => x.labStatoVicini(a))))),
      el('p', 'lab-nota', 'Per vederli lascia il gioco in corso (scheda Partita) e premi uno stato, poi un altro.'),
      titolo('Altro'),
      riga(e('grazia', 'Grazia'), e('vittoria', "Alba: vittoria", ''), e('morte', 'Morte', 'rosso')),
    ];
  }

  // ——— Oggetti ———
  function schedaOggetti(): HTMLElement[] {
    const p = partita();
    if (!p) return [el('p', 'lab-nota', 'Serve una partita: vai su Partita.')];
    const liv = p.labLivelli();
    const livelloArma = (a: (typeof ARMI_COMUNI)[number]): number => liv.armi.find((x) => x.arma === a)?.livello ?? 0;
    const tutteLeArme = [...Object.values(ARMI_INIZIALI), ...ARMI_COMUNI];
    const am = p.labAmuletiSnapshot();
    return [
      titolo('Armi (si sale di livello; per toglierle riavvia la partita)'),
      ...tutteLeArme.map((a) => riga(el('b', '', `${a.nome} · ${livelloArma(a) || '—'}`), tasto('+1', fai((x) => x.labArma(a, livelloArma(a) + 1)), 'piccolo'), tasto('Liv. 8', fai((x) => x.labArma(a, 8)), 'piccolo'))),
      titolo('Doni passivi'),
      ...PASSIVI.map((q) => riga(el('b', '', `${q.nome} · ${liv.doni[q.id] || '—'}`), tasto('−1', fai((x) => x.labDono(q.id, (liv.doni[q.id] || 0) - 1)), 'piccolo'), tasto('+1', fai((x) => x.labDono(q.id, (liv.doni[q.id] || 0) + 1)), 'piccolo'), tasto('Max', fai((x) => x.labDono(q.id, q.massimo)), 'piccolo'))),
      titolo('Amuleti del Rosario'),
      ...AMULETI.map((a) => riga(el('b', '', `${a.nome} (${a.grani})`), tasto(am.posseduti.includes(a.id) ? 'Presente' : 'Aggiungi', fai((x) => x.labAmuleto(a.id, !am.posseduti.includes(a.id))), am.posseduti.includes(a.id) ? 'acceso piccolo' : 'piccolo'))),
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
    const imposta = (v: Voce, n: number): void => {
      v.padre[v.chiave] = n;
      const m = salvati();
      if (n === v.originale) delete m[v.percorso]; else m[v.percorso] = n;
      scriviSalvati(m);
    };
    const disegna = (): void => {
      const q = cerca.value.trim().toLowerCase();
      const trovate = q ? voci.filter((v) => v.percorso.toLowerCase().includes(q)) : voci;
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
        tasto('Riavvia la partita', () => { const p = partita(); if (p) { mostra(false); gioco.scene.start('Gioco', { pg: p.labStato().pg }); } }),
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
        vai('Pausa', () => p?.labPausa()),
        vai('Scelta del dono', () => p?.labSceltaDono()),
        vai('Reliquiario', () => p?.labReliquiario()),
        vai('Stati e reazioni', () => p?.labLegenda()),
        vai("Fine: l'alba", () => p?.labEvento('vittoria')),
        vai('Fine: sconfitta', () => p?.labEvento('morte')),
      ),
      el('p', 'lab-nota', 'Il pannello si chiude da solo per mostrarti la schermata. Riaprilo con LAB.'),
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
    const s = p?.labStato();
    if (s) stato.textContent = `Laboratorio · ${s.pg} · ${Math.floor(s.secondi / 60)}:${String(Math.floor(s.secondi % 60)).padStart(2, '0')} · liv. ${s.livello} · ${Math.round(s.salute)}/${Math.round(s.saluteMassima)} PS`;
  }, 500);
}
