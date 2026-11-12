/*
 * Laboratorio, comandi della partita: quello che il pannello LAB (laboratorio.ts), la prova prestazioni
 * e npm run prova chiedono alla notte in corso (minuto, livello, armi, eventi, pause di prova…).
 * Solo link di prova e sviluppo. Si usano così: partita.lab.minuto(5).
 */
import { PRESTAZIONI } from '../data/mondo';
import { COMBATTIMENTO, ELITE, MIETITORE, NEMICI, ORDE, type FormaOrda } from '../data/nemici';
import { PIXELFX } from '../data/effetti';
import { pozzaCaricata } from './al-volo';
import { ARMI_COMUNI, ARMI_INIZIALI, COLPI, MAX_ARMI, type Arma } from '../data/armi';
import { PASSIVI, type IdDono } from '../data/doni';
import { ANIME, CARTE } from '../data/progressione';
import { INTERRUTTORI } from './interruttori';
import type { SchedaPausa } from './pausa';
import { CALAMITA, CERA_GOCCIA, PANE, RELIQUIARIO } from './oggetti';
import { LUCE as LUCE_AFF, OMBRA as OMBRA_AFF, SACRO as SACRO_AFF, TERRA as TERRA_AFF } from './orda';
import { SBLOCCHI_OGGETTI } from '../data/meta';
import { LIVELLO_ARMA_UNIONE, livelloDonoUnione, UNIONI, type IdUnione } from '../data/unioni';
import { AMULETI, type IdAmuleto } from '../data/rosario';
import { carica, salva } from './salvataggio';
import { ROMPIBILI } from '../data/rompibili';
import type { Gioco } from '../scene/Gioco';

export class LabPartita {
  constructor(private readonly g: Gioco) {}

  /** Laboratorio: un'orda della forma scelta, subito, con la scritta e il bordo. */
  orda(forma: FormaOrda): void {
    const g = this.g;
    const minuto = Math.max(1, Math.floor(g.secondi / 60)), angolo = g.caso.numero() * Math.PI * 2;
    const tipo = forma === 'anello' ? 'fantasma' : 'scheletro';
    g.annunciaOrda(forma, angolo);
    g.lanciaOrda(forma, NEMICI.findIndex((t) => t.id === tipo), minuto, angolo, g.campoL / 2, g.campoA / 2);
  }

  /** Per il pannello: a che punto è la partita. */
  stato(): { secondi: number; livello: number; salute: number; saluteMassima: number; immortale: boolean; fermo: boolean; nemici: number; rosario: boolean; pg: string; urne: number } {
    const g = this.g;
    return {
      urne: g.urneRotte, secondi: g.secondi, livello: g.livello, salute: g.salute, saluteMassima: g.saluteMassima, immortale: g.immortale,
      fermo: g.pausaLab, nemici: g.orda.numero, rosario: g.rosarioSbloccato, pg: g.pg.id,
    };
  }

  ferma(on: boolean): void {
    const g = this.g;
    g.pausaLab = on;
    if (on) g.anims.pauseAll();
    else if (!g.fermo()) g.anims.resumeAll();
  }

  immortale(on: boolean): void {
    const g = this.g;
    g.immortale = on;
  }

  /** Interruttore «Stati certi» (src/data/stati.ts, STATI_CERTI): vale subito e resta per le notti dopo, finché la pagina non si ricarica. */
  statiCerti(on: boolean): void {
    const g = this.g;
    INTERRUTTORI.statiCerti = on;
    g.aggiornaDevozione();
  }

  /** Porta la notte al minuto m: gli eventi già passati non si ripetono, gli altri partono al loro turno. */
  minuto(m: number): void {
    const g = this.g;
    g.secondi = Math.max(0, m) * 60;
    g.prossimaElite = Math.max(ELITE.primo, Math.ceil(g.secondi / ELITE.ogni) * ELITE.ogni);
    g.prossimaOrda = Math.max(0, ORDE.copione.findIndex((o) => o.minuto * 60 >= g.secondi));
    if (ORDE.copione.every((o) => o.minuto * 60 < g.secondi)) g.prossimaOrda = ORDE.copione.length;
    g.ordaAnnunciata = false;
    g.mietitoriArrivati = MIETITORE.minuti.filter((q) => q * 60 < g.secondi).length;
  }

  /** Livello n, con le armi e i doni che hai. */
  livello(n: number): void {
    const g = this.g;
    g.livello = Math.max(1, Math.floor(n));
    g.esperienza = 0;
  }

  /** Un livello in più con la sua scelta di doni. */
  sceltaDono(): void {
    const g = this.g;
    g.livelliDaScegliere++;
    g.livello++;
    g.apriDoni();
  }

  reliquiario(): void {
    const g = this.g;
    g.apriReliquiario();
  }

  /** Porta l'arma al livello l (la aggiunge se non c'è); non si scende, per togliere si riavvia. */
  arma(arma: Arma, l: number): void {
    const g = this.g;
    if (!g.arsenale.livello(arma)) g.arsenale.aggiungi(arma);
    while (g.arsenale.livello(arma) < Math.min(l, CARTE.livelloMassimo)) g.arsenale.potenzia(arma);
    g.aggiornaBuild();
  }

  dono(id: IdDono, l: number): void {
    const g = this.g;
    g.passivi[id] = Math.max(0, l);
    g.dopoPassivo();
    g.aggiornaBuild();
  }

  amuleto(id: IdAmuleto, on: boolean): void {
    const g = this.g;
    if (on && !g.amuletiPosseduti.includes(id)) g.amuletiPosseduti.push(id);
    if (!on) g.amuletiPosseduti = g.amuletiPosseduti.filter((x) => x !== id);
    if (on) g.amuletiAccesi.add(id);
    else g.amuletiAccesi.delete(id);
    g.dopoPassivo();
    g.aggiornaBuild();
  }

  amuletiSnapshot(): { posseduti: IdAmuleto[]; accesi: IdAmuleto[] } {
    const g = this.g;
    return { posseduti: [...g.amuletiPosseduti], accesi: [...g.amuletiAccesi] };
  }

  livelli(): { armi: { arma: Arma; livello: number }[]; doni: Record<IdDono, number> } {
    const g = this.g;
    return { armi: g.arsenale.possedute.map((p) => ({ arma: p.arma, livello: p.livello })), doni: { ...g.passivi } };
  }

  /** Prova prestazioni: la scena più pesante, senza poter morire né arrivare all'alba; i doni si scelgono da soli. */
  provaPrestazioni(): void {
    const g = this.g;
    const P = PRESTAZIONI;
    this.immortale(true);
    g.automatico = true;
    this.minuto(P.minuto);
    g.fineFinta = P.secondiFine;
    this.livello(P.livello);
    for (const a of ARMI_COMUNI.slice(0, MAX_ARMI - 1)) this.arma(a, P.livelloArmi);
    g.rompibili?.piazzaFissa(ROMPIBILI.tipi.findIndex((t) => t.luce > 0), g.x + P.lanterna.dx, g.y + P.lanterna.dy);
    this.provaRiempi();
  }

  /** Prova prestazioni: la stessa ricostruzione che avviene quando un dono allarga la luce. */
  ricostruisciBuio(): void {
    const g = this.g;
    g.ridimensiona();
  }

  provaRiempi(): void {
    const g = this.g;
    g.orda.riempi(PRESTAZIONI.nemici, g.secondi, g.x, g.y, g.campoL / 2, g.campoA / 2);
  }

  /** Diagnosi dei fotogrammi: spegne i fori di lanterne e fuochi nel buio, per misurarne il costo sul telefono. */
  foriBuio(accesi: boolean): void {
    const g = this.g;
    g.foriBuio = accesi;
  }

  /** Accende o spegne a mano il segnale del Peccato sul bordo del campo, per vederlo senza comporre un Rosario. */
  peccato(acceso: boolean): void {
    const g = this.g;
    g.hud.provaPeccato(acceso);
  }

  /** Mostra un avviso nel cartiglio, per provarne posto e durata. */
  avviso(testo: string, sotto: string): void {
    const g = this.g;
    g.hud.avviso(testo, sotto);
  }

  rosario(on: boolean): void {
    const g = this.g;
    g.rosarioSbloccato = on;
  }

  evento(nome: 'elite' | 'seth1' | 'seth2' | 'orda' | 'sciame' | 'pane' | 'calamita' | 'reliquiarioATerra' | 'reliquiarioLontano' | 'cera' | 'anime' | 'cura' | 'grazia' | 'eliminaNemici' | 'riempi' | 'vittoria' | 'morte'): void {
    const g = this.g;
    const mezzaL = g.campoL / 2, mezzaA = g.campoA / 2, s = g.secondi;
    switch (nome) {
      case 'elite': g.orda.nasciElite(s, g.x, g.y, mezzaL, mezzaA); break;
      case 'seth1': g.orda.nasciMietitore(s, 0, g.x, g.y, mezzaL, mezzaA); break;
      case 'seth2': g.orda.nasciMietitore(s, 1, g.x, g.y, mezzaL, mezzaA); break;
      case 'orda': this.orda('muro'); break;
      case 'sciame': this.orda('anello'); break;
      case 'pane': g.oggetti.aggiungi(PANE, g.x + 40, g.y - 40); break;
      case 'calamita': g.oggetti.aggiungi(CALAMITA, g.x - 40, g.y - 40); break;
      case 'reliquiarioATerra': g.oggetti.aggiungi(RELIQUIARIO, g.x, g.y - 70); break;
      case 'reliquiarioLontano': g.oggetti.aggiungi(RELIQUIARIO, g.x + 200, g.y - g.campoA); break;
      case 'cera': for (let k = 0; k < 10; k++) g.oggetti.aggiungi(CERA_GOCCIA, g.x - 60 + k * 14, g.y + 40); break;
      case 'anime': g.anime.aggiungi(g.x + 60, g.y, 50, g.x, g.y); break;
      case 'cura': g.salute = g.saluteMassima; break;
      case 'grazia': g.iniziaGrazia(); break;
      case 'eliminaNemici': for (let i = 0; i < g.orda.numero; i++) g.orda.salute[i] = 0; break;
      case 'riempi': g.orda.riempi(400, s, g.x, g.y, mezzaL, mezzaA); break;
      case 'vittoria':
        g.finito = true;
        g.inMoto = false;
        g.mostraFine(true);
        break;
      case 'morte':
        g.salute = 0;
        g.morto = g.finito = true;
        g.attesaFine = COMBATTIMENTO.attesaFine;
        g.inMoto = false;
        break;
    }
  }

  /** Grazia a tacche: «riempi» lascia le tacche a una dallo scatto (al prossimo sfioro parte la Grazia), «svuota» le azzera. */
  tacche(riempi: boolean): void {
    const g = this.g;
    g.tacche.imposta(riempi ? g.tacchePerGrazia() - 1 : 0);
  }

  /** LAB: accende o spegne Pozza ed Eclissi pixelfx (accese di serie). Solo disegno. */
  pixelfx(on: boolean): void {
    INTERRUTTORI.pixelfx = on;
  }

  /** Prova pixelfx: mostra Sepoltura, Pozza (con il raggio dato) o Eclissi accanto al personaggio, senza ferire. */
  vediEffetto(cosa: 'sepoltura' | 'pozza' | 'eclissi', raggio = 0): void {
    const g = this.g;
    const y = g.y - COLPI.corpo;
    if (cosa === 'sepoltura') g.arsenale.labVediEffetto(cosa, g.x, g.y);
    else g.arsenale.labVediEffetto(cosa, g.x + (cosa === 'eclissi' ? 140 : 0), cosa === 'eclissi' ? y : y + 120, raggio);
  }

  /** Raggio di unione delle lacrime di Lumen (ANIME.accorpa), da provare in partita. Vale finché non ricarichi la pagina. */
  unioneLacrime(px: number): void {
    (ANIME as { accorpa: number }).accorpa = px;
  }

  /** LAB: accende o spegne la Sepoltura pixelfx (spenta di serie). Solo disegno. */
  sepolturaPixelfx(on: boolean): void {
    INTERRUTTORI.sepolturaPixelfx = on;
  }

  /** Prova prestazioni «con effetti»: al secondo s della misura fa partire Sepoltura, Pozza grande ed Eclissi (PRESTAZIONI.effetti). */
  provaEffetti(s: number): void {
    const g = this.g;
    const E = PRESTAZIONI.effetti, y = g.y - COLPI.corpo;
    if (s % E.sepolturaOgni === 0) g.arsenale.labVediEffetto('sepoltura', g.x, g.y);
    // la Pozza usa la misura già in memoria (quella dell'Acqua santa in mano): con due misure diverse a turno
    // si caricava e scaricava un foglio ogni 2 s, cosa che nel gioco non succede
    const caricata = pozzaCaricata(), raggio = caricata ? Number(caricata.slice(PIXELFX.pozza.prefisso.length)) : E.raggioPozza;
    if (s % E.pozzaOgni === 0) g.arsenale.labVediEffetto('pozza', g.x, y + E.distanza, raggio);
    for (let k = 0; k < E.eclissiAlSecondo; k++) {
      const a = s + (k * Math.PI * 2) / E.eclissiAlSecondo;
      g.arsenale.labVediEffetto('eclissi', g.x + Math.cos(a) * E.distanza, y + Math.sin(a) * E.distanza * 0.5);
    }
  }

  /** Acquasantiera: una pozza che cura sotto i piedi del personaggio (come quando il sorso trova la fiaschetta piena). */
  pozzaCurativa(): void {
    const g = this.g;
    g.arsenale.labPozzaCurativa(g.x, g.y - COLPI.corpo);
  }

  /** Lascia lo stato dell'affinità (luce, sacro, ombra, terra) ai nemici vicini: due stati diversi fanno la reazione. */
  statoVicini(aff: 'luce' | 'sacro' | 'ombra' | 'terra'): void {
    const g = this.g;
    g.arsenale.abbaglia(g.x, g.y - COLPI.corpo, 260, { luce: LUCE_AFF, sacro: SACRO_AFF, ombra: OMBRA_AFF, terra: TERRA_AFF }[aff]);
  }

  /** Sblocca (o ripristina) armi e doni nuovi in questa partita, così escono subito nella scelta. */
  oggetti(on: boolean): void {
    const g = this.g;
    g.oggettiSbloccati = new Set(on ? SBLOCCHI_OGGETTI.map((o) => o.id) : g.meta.oggetti);
  }

  /** Laboratorio: urna, giara e lanterna accanto al personaggio (a sinistra, così non si rompono subito). */
  rompibili(): void {
    const g = this.g;
    ROMPIBILI.tipi.forEach((_, n) => g.rompibili?.piazza(n, g.x - 90 - n * 70, g.y + 10));
  }

  rompiVicino(): void {
    const g = this.g;
    g.rompibili?.rompiVicino(g.x, g.y);
  }

  chiazza(): void {
    const g = this.g;
    g.chiazze?.aggiungi(g.x + 130, g.y);
  }

  accendiChiazze(): void {
    const g = this.g;
    g.chiazze?.accendiTutte();
  }

  /** Come raccogliere un frammento: accende il pezzo dopo del mosaico. */
  mosaico(): void {
    const g = this.g;
    g.frammento();
  }

  bagliore(): void {
    const g = this.g;
    g.iniziaBagliore();
  }

  frammento(): void {
    const g = this.g;
    g.lasciaFrammento(g.x + 60, g.y - 60);
  }

  /** Apre la pausa sulla scheda indicata; se è già aperta la richiude prima. */
  pausa(scheda?: SchedaPausa): void {
    const g = this.g;
    g.riprendi();
    g.apriPausa(scheda);
  }

  /** Il caso pieno: 6 armi, 6 doni, tutti gli amuleti e le unioni in tutti gli stati. Non tocca il salvataggio. */
  pausaPiena(scheda: SchedaPausa = 'build'): void {
    const g = this.g;
    g.scoperteDiProva = true;
    const mia = UNIONI.find((u) => u.arma === g.pg.armaIniziale)!;
    [mia, ...UNIONI.filter((u) => u !== mia).slice(0, MAX_ARMI - 1)].forEach((u, i) => this.unione(u.id, i % 3 === 0));
    g.rosarioSbloccato = true;
    for (const a of AMULETI) this.amuleto(a.id, true);
    for (const u of UNIONI) g.unioniScoperte.add(u.id);
    this.pausa(scheda);
  }

  /** Peccato: amuleti accesi oltre i grani; la pausa si apre da sola sul Rosario. */
  pausaPeccato(): void {
    const g = this.g;
    g.rosarioSbloccato = true;
    for (const a of AMULETI.slice(0, 3)) this.amuleto(a.id, true);
    this.pausa();
  }

  /** La prima partita: niente Rosario né Unioni. */
  pausaPrima(): void {
    const g = this.g;
    for (const id of [...g.amuletiPosseduti]) this.amuleto(id, false);
    g.rosarioSbloccato = g.unioniSbloccate = false;
    g.unioniScoperte.clear();
    g.unioniUnite.clear();
    this.pausa();
  }

  /** La pausa sopra una scelta di doni o di reliquiario. */
  pausaSopra(reliquiario: boolean): void {
    const g = this.g;
    g.riprendi();
    if (reliquiario) {
      g.rosarioSbloccato = true;
      this.reliquiario();
    } else this.sceltaDono();
    g.apriPausa();
  }

  /** Dimentica le unioni scoperte, per riprovare la scoperta da capo. */
  dimenticaUnioni(): void {
    const g = this.g;
    g.unioniScoperte.clear();
    g.unioniUnite.clear();
    const s = carica();
    s.unioniScoperte = [];
    s.unioniUnite = [];
    salva(s);
  }

  /** Il livello massimo del dono id (per le prove). */
  massimoDono(id: IdDono): number {
    return PASSIVI.find((q) => q.id === id)!.massimo;
  }

  /** Porta arma e dono ai livelli giusti: con unisci li unisce subito, altrimenti aspetta il reliquiario. */
  unione(id: IdUnione, unisci: boolean): void {
    const g = this.g;
    const u = UNIONI.find((x) => x.id === id)!;
    g.unioniSbloccate = g.scoperteDiProva = true;
    g.unioniScoperte.add(u.id); // qui non si vuole l'animazione: la mostra LAB → Schermate
    const arma = g.armaDi(u.arma) ?? ARMI_COMUNI.find((a) => a.id === u.arma) ?? Object.values(ARMI_INIZIALI).find((a) => a.id === u.arma)!;
    this.arma(arma, Math.max(g.arsenale.livello(arma), LIVELLO_ARMA_UNIONE));
    this.dono(u.dono, Math.max(g.passivi[u.dono], livelloDonoUnione(u.dono)));
    if (unisci) {
      g.arsenale.unisci(arma);
      g.segnaUnita(id);
      g.aggiornaBuild();
    }
  }

  statoUnioni(): { sbloccate: boolean; unite: IdUnione[] } {
    const g = this.g;
    return { sbloccate: g.unioniSbloccate, unite: UNIONI.filter((u) => { const a = g.armaDi(u.arma); return a && g.arsenale.unita(a); }).map((u) => u.id) };
  }

  /** Laboratorio: apre subito la scelta dei Riti (come se non restasse nulla da potenziare, al terzo livello). */
  riti(): void {
    const g = this.g;
    g.livelliDaScegliere++;
    g.livello++;
    g.apriRiti();
  }

  /** Dal Laboratorio: rivede l'animazione, senza toccare scoperte né salvataggio. */
  scoperta(): void {
    const g = this.g;
    g.mostraScoperta(UNIONI.find((u) => u.arma === g.pg.armaIniziale) ?? UNIONI[0]);
  }
}
