/*
 * Comandi del Laboratorio per il gioco a stanze (scheda «Stanze» in laboratorio.ts). Si chiamano con stanze.lab.…
 * Passo 2 della fetta: fermare e riprendere, portare il Lampionaio al centro o contro un muro per provare i bordi,
 * mostrare la linea invisibile che divide i joystick. Passo 3: chiedere un colpo della Lanterna.
 * Passo 4: far comparire nemici, ondate, immortale, cura, Grazia, rinascita del Ricaduto, spostare il Lampionaio.
 * Passo 5: caricare e usare il Cerchio di luce. Passo 6: ripulire la stanza, attraversare una porta, aggiungere un Eco.
 * Restyle del 13/11: ferire o far cadere il Lampionaio per vedere le animazioni hurt e death.
 * Danno a intervallo (14/11): far salire di livello la Lanterna e gli Echi. Bot (14/11): farlo giocare al posto tuo.
 * La cripta (16/11): tornare al disegno del codice per confrontare, rifare le lastre. Rompibili (16/11): metterli accanto,
 * romperli, ridisporli, far uscire un frammento, accendere il Bagliore. Il Campanaro (17/11): andare all'arena, farlo
 * comparire, portarlo alla fase 2 o quasi a terra, scegliere il suo prossimo attacco. La mappa del Mondo (17/11, passo 1):
 * guardarla, generarne un'altra, controllare le regole su mille semi. Passo 2: andare in una stanza qualsiasi (il Campanaro,
 * il Boss), attraversare la porta di un muro, bloccare le porte per provare i muri. Passo 3 (18/11): dare o togliere la
 * chiave del Campanaro, che apre la porta del Boss.
 */
import type { IdGrado } from '../data/rarita';
import { ABILITA_STANZA, NEMICI_STANZA, STANZA } from '../data/stanze';
import { ECHI_STANZE, LANTERNA_STANZE, POTENZIALI } from '../data/armi-stanze';
import { AFFINITA_ARMI, type IdAffinita } from '../data/stati';
import { ARTE_STANZA, areaCamminabile, creaStanza } from './stanza';
import { ROMPIBILI } from '../data/rompibili';
import { STATO, type TipoStanza } from './nemici-stanza';
import { F } from './armi-colpo';
import { BotStanze } from './bot-stanze';
import type { Stanze } from '../scene/Stanze';
import { MURI, type Muro } from './porte';
import { MOSSA_CAPO } from './campanaro';
import { controllaMappa, generaMappa, type Mappa } from './mappa';
import { MAPPA } from '../data/mappa';

export type AttaccoCapo = 'rintocco' | 'carica' | 'chiamata';

export type DirezioneColpo = 'destra' | 'sinistra' | 'su' | 'giu' | 'auto';

export type PuntoStanza = 'centro' | 'alto' | 'basso' | 'sinistra' | 'destra' | 'angolo';

export class LabStanze {
  constructor(private readonly s: Stanze) {}

  stato(): {
    x: number; y: number; larghezza: number; altezza: number; fermo: boolean; colpi: number;
    salute: number; extra: number; sorsi: number; sorsiMassimi: number; saluteMassima: number; immortale: boolean; morto: boolean; grazia: number; schivate: number; ferite: number;
    nemici: number; pozze: number; uccisi: number; rinascite: number; ondate: number; ondateAutomatiche: boolean; rinascita: boolean | null;
    quiete: number; carica: number; caricaPiena: number; abilitaUsi: number; abilitaAttiva: number; fermoImpatto: boolean;
    stanza: number; indice: number; tipo: string; chiave: boolean; chiuse: number; distanza: number; ripulite: number; totale: number; fase: string; ricompensa: string; porte: string[]; echi: string[]; lanterna: number; doni: string[]; carteAperte: boolean; finita: boolean;
  } {
    const s = this.s, n = s.nemici;
    return {
      x: Math.round(s.x), y: Math.round(s.y), larghezza: STANZA.larghezza, altezza: STANZA.altezza, fermo: s.pausaLab, colpi: s.attacco.colpi,
      salute: Math.round(s.salute), extra: Math.round(s.extra), sorsi: s.fiaschetta.sorsi, sorsiMassimi: s.fiaschetta.massimo, saluteMassima: Math.round(s.saluteMassima), immortale: s.immortale, morto: s.morto,
      grazia: Math.max(0, s.grazia), schivate: s.schivatePerfette, ferite: s.ferite,
      nemici: n.vivi(), pozze: n.pozze, uccisi: n.uccisi, rinascite: n.rinascite, ondate: s.ondate, ondateAutomatiche: s.ondateAutomatiche, rinascita: n.rinascitaForzata,
      quiete: s.quiete, carica: s.abilita.carica, caricaPiena: ABILITA_STANZA.colpi, abilitaUsi: s.abilita.usi, abilitaAttiva: Math.max(0, s.abilita.attiva), fermoImpatto: n.fermoImpatto,
      stanza: s.percorso.stanza, indice: s.percorso.corrente, tipo: s.percorso.qui.tipo, chiave: s.percorso.chiave, chiuse: s.porte.chiuse.filter(Boolean).length, distanza: s.percorso.qui.distanza,
      ripulite: s.mappa.stanze.filter((x) => x.ripulita).length, totale: s.mappa.stanze.length,
      fase: s.percorso.fase, ricompensa: s.percorso.ricompensa, porte: s.porte.muri.map((m, k) => `${m}: ${s.porte.ricompense[k] ?? '–'}`),
      echi: s.arsenale.possedute.map((p) => `${p.arma.nome} ${p.livello}`), lanterna: s.percorso.livelloLanterna,
      doni: Object.entries(s.percorso.passivi).filter(([, l]) => l > 0).map(([id, l]) => `${id} ${l}`), carteAperte: s.doni.aperta, finita: s.finita,
    };
  }

  /** La stanza è ripulita subito: via i nemici, e dopo un attimo le carte (le ondate automatiche si riaccendono). */
  ripulisci(): void {
    this.s.ondateAutomatiche = true;
    this.s.nemici.svuota();
    this.s.percorso.ripulisci();
  }

  /** Porta lo Specchio al livello l (0 = toglierlo): colpi in più e il loro danno valgono dal passo dopo (SPECCHIO_STANZE). */
  specchio(l: number): void {
    this.s.percorso.passivi.specchio = Math.max(0, Math.min(3, l));
  }

  livelloSpecchio(): number {
    return this.s.percorso.passivi.specchio;
  }

  /** Le carte escono del grado g quando la porta lo può dare (null = il caso di sempre). */
  forzaGrado(g: IdGrado | null): void {
    this.s.percorso.forzaGrado = g;
  }

  gradoForzato(): IdGrado | null {
    return this.s.percorso.forzaGrado;
  }

  /** La mappa del Mondo di questa Veglia (per il disegno nel LAB). */
  mappa(): Mappa {
    return this.s.mappa;
  }

  /** Una Veglia nuova con il seme dopo: un'altra mappa (e altre ondate e carte). */
  mappaNuova(): void {
    this.s.semeDopo = this.s.seme + 1;
    this.s.scene.restart();
  }

  /** Va nella stanza i della mappa, entrando dalla porta che guarda verso l'ingresso (con la build di adesso). */
  vaiAllaStanza(i: number): void {
    const m = this.s.mappa, st = m.stanze[i];
    if (!st) return;
    this.s.ondateAutomatiche = true;
    if (this.s.doni.aperta) this.s.doni.scegliPrima();
    // la porta da cui si entra: quella della stanza accanto più vicina all'ingresso
    let da = -1;
    st.vicine.forEach((v, l) => { if (v >= 0 && (da < 0 || m.stanze[v].distanza < m.stanze[st.vicine[da]].distanza)) da = l; });
    this.s.entraInStanza(i, da >= 0 ? MURI[da] : null);
  }

  vaiAlCampanaro(): void {
    this.vaiAllaStanza(this.s.mappa.campanaro);
  }

  vaiAlBoss(): void {
    this.vaiAllaStanza(this.s.mappa.boss);
  }

  vaiAllIngresso(): void {
    this.vaiAllaStanza(this.s.mappa.ingresso);
  }

  /** Porta il Lampionaio contro la porta del muro dato, se c'è ed è aperta: passa alla stanza accanto. */
  attraversaMuro(muro: Muro): void {
    this.attraversa(this.s.porte.muri.indexOf(muro));
  }

  /**
   * La chiave del Campanaro (apre la porta del Boss): darla segna ripulita la stanza del Campanaro (lui non c'è più);
   * toglierla la rimette da combattere. Le porte della stanza in cui si è si ridisegnano subito.
   */
  chiave(si: boolean): void {
    const c = this.s.mappa.stanze[this.s.mappa.campanaro];
    if (!c || c.ripulita === si || this.s.percorso.corrente === this.s.mappa.campanaro) return;
    c.ripulita = si;
    this.s.ridisegnaPorte();
  }

  /** Le porte aperte non si attraversano (per provare i muri camminandoci contro). */
  bloccaPorte(si: boolean): void {
    this.s.porteBloccate = si;
  }

  /**
   * Genera le mappe dei semi da 1 a n e controlla le regole (npm run prova): quante ne sbagliano, il primo errore,
   * quante stanze al minimo e al massimo e quanto è lontano il Boss.
   */
  provaMappe(n: number): { sbagliate: number; primo: string; stanze: [number, number]; boss: [number, number]; ms: number } {
    const t = performance.now();
    let sbagliate = 0, primo = '', s0 = 99, s1 = 0, b0 = 99, b1 = 0;
    for (let seme = 1; seme <= n; seme++) {
      const m = generaMappa(seme), e = controllaMappa(m), k = m.stanze.length, d = m.stanze[m.boss].distanza;
      if (e.length && !sbagliate++) primo = `seme ${seme}: ${e.join(', ')}`;
      s0 = Math.min(s0, k); s1 = Math.max(s1, k); b0 = Math.min(b0, d); b1 = Math.max(b1, d);
    }
    return { sbagliate, primo, stanze: [s0, s1], boss: [b0, b1], ms: Math.round(performance.now() - t) };
  }

  /** La griglia della mappa (MAPPA.griglia), per il disegno nel LAB. */
  grigliaMappa(): { larghezza: number; altezza: number } {
    return MAPPA.griglia;
  }

  /** Il Campanaro qui vicino, subito (senza la stanza in corso: per provarlo da solo). */
  campanaroQui(): void {
    if (this.s.nemici.indiceCapo() >= 0) return;
    this.s.nemici.aggiungiCampanaro(this.s.x, this.s.y - 200, 0.3);
  }

  /** La salute del Campanaro a questa parte della massima (0,49: entra in fase 2). */
  saluteCampanaro(parte: number): void {
    const i = this.s.nemici.indiceCapo(), o = this.s.nemici.orda;
    if (i >= 0) o.salute[i] = Math.max(1, o.saluteMassima[i] * parte);
  }

  /** Il prossimo attacco del Campanaro, subito (finisce la camminata). */
  attaccoCampanaro(a: AttaccoCapo): void {
    const c = this.s.nemici.capo;
    c.prossimo = a === 'rintocco' ? MOSSA_CAPO.rintocco : a === 'carica' ? MOSSA_CAPO.mira : MOSSA_CAPO.chiamata;
    if (c.mossa === MOSSA_CAPO.cammina) c.tempo = 0;
  }

  /** Lo stato del Campanaro per il pannello (null se non è in campo). */
  campanaro(): { salute: number; massima: number; fase: number; rintocchi: number; cariche: number; chiamate: number; battuti: number } | null {
    const n = this.s.nemici, i = n.indiceCapo(), c = n.capo;
    if (i < 0) return n.capiBattuti ? { salute: 0, massima: 0, fase: 0, rintocchi: c.rintocchi, cariche: c.cariche, chiamate: c.chiamate, battuti: n.capiBattuti } : null;
    return { salute: Math.round(n.orda.salute[i]), massima: Math.round(n.orda.saluteMassima[i]), fase: c.fase, rintocchi: c.rintocchi, cariche: c.cariche, chiamate: c.chiamate, battuti: n.capiBattuti };
  }

  /** Porta il Lampionaio contro la porta k (aperta): passa alla stanza dopo. */
  attraversa(k: number): void {
    if (k < 0 || k >= this.s.porte.muri.length) return;
    const p = this.s.porte.davanti(k);
    this.s.x = p.x;
    this.s.y = p.y;
  }

  /** Un Eco nuovo dell'affinità aff (il primo che non si ha), se c'è posto. */
  eco(aff: IdAffinita): void {
    const a = ECHI_STANZE.find((x) => AFFINITA_ARMI[x.id] === aff && !this.s.arsenale.livello(x));
    if (a && this.s.arsenale.possedute.length < 3) this.s.arsenale.aggiungi(a);
  }

  /** La Lanterna sale di un livello (al massimo il 5°, il potenziale). */
  lanternaSu(): void {
    this.s.percorso.livelloLanterna = Math.min(LANTERNA_STANZE.livelli.length, this.s.percorso.livelloLanterna + 1);
    this.intervalloSubito();
  }

  /** L'intervallo del danno della Lanterna al livello nuovo vale subito, senza aspettare il passo dopo. */
  private intervalloSubito(): void {
    const L = LANTERNA_STANZE.livelli[this.s.percorso.livelloLanterna - 1];
    this.s.arsenale.intervalloDaFuori(F.lanterna, L.danno, L.dannoMassimo);
  }

  /** Ogni Eco posseduto sale di un livello (fino al 5°). */
  echiSu(): void {
    for (const p of this.s.arsenale.possedute) if (p.livello < p.arma.livelli.length) this.s.arsenale.potenzia(p.arma);
  }

  /** Un Eco al livello 5, il suo potenziale (se non c'è lo aggiunge, anche oltre i 3 della build). */
  potenziale(id: string): void {
    const a = ECHI_STANZE.find((x) => x.id === id);
    if (!a) return;
    if (!this.s.arsenale.livello(a)) this.s.arsenale.aggiungi(a);
    while (this.s.arsenale.livello(a) < a.livelli.length) this.s.arsenale.potenzia(a);
  }

  /** Acceca il nemico più vicino (come dopo una schivata perfetta con la Lama di luce); restituisce se ce n'era uno. */
  accecaVicino(): boolean {
    const n = this.s.nemici, j = n.vicino(this.s.x, this.s.y, 4000);
    if (j < 0) return false;
    n.accecaPerProva(j);
    return true;
  }

  /** Quanti nemici ha accecato la Lama di luce. */
  accecati(): number {
    return this.s.nemici.accecati;
  }

  /** Quanti attacchi dei nemici sono stati interrotti (Campana al potenziale). */
  interrotti(): number {
    return this.s.nemici.interrotti;
  }

  /** Lanterna ed Echi tornano al livello 1 (gli Echi restano). */
  livelliAUno(): void {
    this.s.percorso.livelloLanterna = 1;
    for (const p of this.s.arsenale.possedute) p.livello = 1;
    this.s.arsenale.ricalcolaForbici();
    this.intervalloSubito();
  }

  /** 200 colpi di prova della Lanterna al suo livello, senza doni: il più debole, il più forte, quanti diversi (per le prove). */
  intervalloLanterna(): { minimo: number; massimo: number; diversi: number; atteso: [number, number] } {
    const L = LANTERNA_STANZE.livelli[this.s.percorso.livelloLanterna - 1];
    return { ...this.s.arsenale.campioneDanno(F.lanterna, L.danno, 200), atteso: [L.danno, L.dannoMassimo] };
  }

  /** Quanti colpi della Lanterna (al suo livello, senza doni né Grazia) battono di sicuro un nemico di quel tipo. */
  colpiPerBattere(tipo: TipoStanza): number {
    return Math.ceil(NEMICI_STANZA[tipo].salute / LANTERNA_STANZE.livelli[this.s.percorso.livelloLanterna - 1].danno);
  }

  /** Sceglie la prima carta (prove automatiche). */
  primaCarta(): void {
    this.s.doni.scegliPrima();
  }

  /** Accende o spegne il fermo d'impatto (per confrontare). */
  fermoImpatto(si: boolean): void {
    this.s.nemici.fermoImpatto = si;
  }

  /** Carica dell'abilità piena (o vuota). */
  caricaAbilita(piena: boolean): void {
    this.s.abilita.imposta(piena);
  }

  /** Usa l'abilità (parte a stanza in corso). */
  usaAbilita(): boolean {
    return this.s.abilita.usa();
  }

  /** Fa comparire un nemico a «distanza» px dal Lampionaio, verso il centro della stanza (subito, senza il segno a terra se «subito»). */
  nemico(tipo: TipoStanza, distanza: number, subito = false): void {
    const s = this.s, cx = STANZA.larghezza / 2, cy = STANZA.altezza / 2;
    let dx = cx - s.x, dy = cy - s.y;
    const l = Math.hypot(dx, dy);
    if (l < 1) { dx = 1; dy = 0; } else { dx /= l; dy /= l; }
    s.nemici.aggiungi(tipo, s.x + dx * distanza, s.y + dy * distanza, subito ? 0 : undefined);
  }

  /** Un nemico in un punto preciso (per le prove). */
  nemicoIn(tipo: TipoStanza, x: number, y: number): void {
    this.s.nemici.aggiungi(tipo, x, y, 0);
  }

  ondata(): void {
    this.s.nuovaOndata();
  }

  /** Una pozza di cera a terra, a «distanza» px a destra del Lampionaio (0 = sotto i piedi). */
  pozza(distanza = 70): void {
    this.s.nemici.pozza(this.s.x + distanza, this.s.y);
  }

  /** Toglie tutti i nemici e i grumi (non contano come battuti). */
  svuota(): void {
    this.s.nemici.svuota();
  }

  /** Accende o spegne le ondate automatiche: spente, la stanza resta vuota finché non si chiama un nemico. */
  ondateAutomatiche(si: boolean): void {
    this.s.ondateAutomatiche = si;
  }

  /** Il bot gioca al posto tuo, alla velocità normale (per guardarlo); false = torni a giocare tu. */
  bot(si: boolean): void {
    this.s.bot = si ? new BotStanze() : null;
  }

  immortale(si: boolean): void {
    this.s.immortale = si;
  }

  cura(): void {
    this.s.salute = this.s.saluteMassima;
  }

  /** Porta la salute a n (per provare la caduta). */
  salute(n: number): void {
    this.s.salute = Math.max(1, Math.min(this.s.saluteMassima, n));
  }

  /** Riempie la fiaschetta. */
  fiaschettaPiena(): void {
    this.s.fiaschetta.ricarica(this.s.fiaschetta.massimo);
  }

  /** Svuota la fiaschetta (per provare la caduta senza che beva da sola). */
  fiaschettaVuota(): void {
    this.s.fiaschetta.sorsi = 0;
  }

  /** Beve un sorso subito; restituisce se ha bevuto. */
  bevi(): boolean {
    return this.s.fiaschetta.bevi();
  }

  /** Dà salute in più (Falce al potenziale) fino al tetto: per vedere il tratto in fondo alla barra e come assorbe i colpi. */
  salutePiu(): void {
    this.s.extra = POTENZIALI.falce.tetto * this.s.saluteMassima;
  }

  grazia(): void {
    this.s.iniziaGrazia();
  }

  /** Un colpo da 10 al Lampionaio, anche in Quiete: si vede l'animazione hurt (non uccide: lascia almeno 1 di salute). */
  ferita(): void {
    this.s.ferisci(Math.min(10, Math.max(0, this.s.salute - 1)), true);
  }

  /** Il Lampionaio cade adesso (anche se è immortale): si vede l'animazione death, poi «Sei caduto». */
  cadi(): void {
    this.s.immortale = false;
    this.s.ferisci(this.s.salute, true);
  }

  /** Rinascita del Ricaduto: true = sempre, false = mai, null = la probabilità normale. */
  rinascita(v: boolean | null): void {
    this.s.nemici.rinascitaForzata = v;
  }

  /** Sposta il Lampionaio di (dx, dy) pixel, dentro i muri (per le prove della schivata). */
  sposta(dx: number, dy: number): void {
    const a = areaCamminabile();
    this.s.x = Math.min(a.x1, Math.max(a.x0, this.s.x + dx));
    this.s.y = Math.min(a.y1, Math.max(a.y0, this.s.y + dy));
  }

  /** Secondi al prossimo attacco di un nemico in avviso (Infinity se nessuno sta preparando un attacco). */
  prossimoAttacco(): number {
    const n = this.s.nemici;
    let t = Infinity;
    for (let i = 0; i < n.numero; i++) if (n.stato[i] === STATO.avviso) t = Math.min(t, n.tempo[i]);
    return t;
  }

  /** Quanti nemici sono a terra in attesa di rialzarsi. */
  aTerra(): number {
    const n = this.s.nemici;
    let k = 0;
    for (let i = 0; i < n.numero; i++) if (n.stato[i] === STATO.aTerra) k++;
    return k;
  }

  /** Il pannello del Laboratorio tiene ferma la stanza finché è aperto. */
  ferma(si: boolean): void {
    this.s.pausaLab = si;
    if (si) this.s.anims.pauseAll();
    else if (!this.s.fermo()) this.s.anims.resumeAll();
  }

  /** Chiede un colpo della Lanterna in una direzione, o automatico (nemico più vicino, se no dove guarda). Parte a stanza in corso. */
  attacca(d: DirezioneColpo): void {
    if (d === 'auto') this.s.attacco.automatico();
    else this.s.attacco.verso(d === 'destra' ? 1 : d === 'sinistra' ? -1 : 0, d === 'giu' ? 1 : d === 'su' ? -1 : 0);
  }

  /** Mostra o nasconde la linea invisibile al centro dello schermo che divide i joystick. */
  linea(si: boolean): void {
    this.s.lineaJoystick.hidden = !si;
  }

  lineaVisibile(): boolean {
    return !this.s.lineaJoystick.hidden;
  }

  /** Porta il Lampionaio in un punto della stanza: al centro, contro un muro o nell'angolo in alto a sinistra. */
  vai(dove: PuntoStanza): void {
    const a = areaCamminabile(), cx = Math.round(STANZA.larghezza / 2), cy = Math.round(STANZA.altezza / 2);
    const punti: Record<PuntoStanza, [number, number]> = {
      centro: [cx, cy], alto: [cx, a.y0], basso: [cx, a.y1], sinistra: [a.x0, cy], destra: [a.x1, cy], angolo: [a.x0, a.y0],
    };
    [this.s.x, this.s.y] = punti[dove];
  }

  /** La cripta disegnata o il disegno del codice di prima (per confrontarli). */
  arteStanza(codice: boolean): void {
    ARTE_STANZA.codice = codice;
    creaStanza(this.s, this.s.semeStanza(this.s.percorso.corrente + 1));
    this.s.porte.ridisegna();
  }

  /** Altre lastre e altri pezzi della facciata, a caso. */
  altreLastre(): void {
    creaStanza(this.s, (Math.random() * 2147483647) >>> 0);
  }

  /** Urna, giara e lanterna qui accanto, a sinistra del Lampionaio. */
  rompibiliAccanto(): void {
    const a = areaCamminabile();
    ROMPIBILI.tipi.forEach((_, n) => this.s.rompibili.rompibili.piazza(n, Math.max(a.x0 + 20, this.s.x - 80 - n * 60), this.s.y));
  }

  rompiVicino(): void {
    this.s.rompibili.rompibili.rompiVicino(this.s.x, this.s.y);
  }

  /** Via i rompibili della stanza e altri, disposti a caso lungo i muri. */
  nuoviRompibili(): void {
    this.s.rompibili.nuovaStanza((Math.random() * 2147483647) >>> 0);
  }

  /** La prossima urna rotta lascia di sicuro un frammento (anche prima della prima alba vinta). */
  frammentoSicuro(): void {
    this.s.rompibili.forzaFrammento = true;
  }

  /** Un pezzo del mosaico, subito: al terzo parte il Bagliore. */
  frammento(): void {
    this.s.rompibili.frammento();
  }

  bagliore(): void {
    this.s.rompibili.iniziaBagliore();
  }

  rompibili(): { interi: number; cera: number; frammenti: number; caduti: number; bagliore: number; codice: boolean } {
    const r = this.s.rompibili;
    return { interi: r.rompibili.interi(), cera: r.cera, frammenti: r.frammenti, caduti: r.frammentiCaduti, bagliore: r.bagliore, codice: ARTE_STANZA.codice };
  }
}
