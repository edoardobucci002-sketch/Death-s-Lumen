/*
 * Armi, il regista: quali armi possiede il personaggio, a che livello, le Unioni, quando ognuna spara, l'abilità speciale
 * e gli effetti degli amuleti (onda del Martire, Lucciola). Ogni arma posseduta si ricarica e colpisce da sola.
 * Il codice delle armi è a strati, uno sopra l'altro:
 * - armi-colpo.ts: lo stato di tutte le armi e ciò che hanno in comune (danno, stati, coda delle reazioni, mira);
 * - armi-zone.ts: zone a terra (nubi del Turibolo, pozze dell'Acqua santa, abilità speciali), Lapide, Velo funebre;
 * - armi-proiettili.ts: Bastone, Candela, Fuoco fatuo, fiammelle dell'Esorcismo, Sampietrini, Rosario spezzato, Corvo;
 * - armi-vicine.ts: Lanterna (arco), Pala e Campana (cerchio), Lama di luce (fendente), Falce, colpi ritardati.
 * Ogni arma ha un'affinità (data/stati.ts): colpendo lascia uno stato; quando due stati fanno una reazione,
 * la reazione va in coda e si esegue alla fine del passo (esplosioni, fiammelle), fuori dalle ricerche nella griglia.
 */
import { LUCE, OMBRA, SACRO } from './orda';
import { AFFINITA_ABILITA, REAZIONI, RUOLI } from '../data/stati';
import { INTERRUTTORI } from './interruttori';
import { ABILITA, type Abilita } from '../data/abilita';
import { ACQUA_SANTA, COLPI, LAPIDE, MIRA, type Arma } from '../data/armi';
import { NUMERI_UNIONI as U } from '../data/unioni';
import { ROMPIBILI } from '../data/rompibili';
import { RAGGIO_VELO } from './segnaposto-oggetti';
import { NUBE, POZZA, CODICE_AFFINITA, ID_MIETITORE, MAX_EFFETTI, MAX_CORVI, PASSI_STORIA, SCIA, RACCOGLIE, F, type Posseduta } from './armi-colpo';
import { ArsenaleVicine } from './armi-vicine';

export { FONTI } from './armi-colpo';
export type { Bonus, Posseduta } from './armi-colpo';

export class Arsenale extends ArsenaleVicine {
  aggiungi(arma: Arma): void {
    this.possedute.push({ arma, livello: 1 });
    this.attesa.push(0.5);
  }

  livello(arma: Arma): number {
    for (const p of this.possedute) if (p.arma === arma) return p.livello;
    return 0;
  }

  /** L'arma diventa la sua versione unita. */
  unisci(arma: Arma): void {
    for (const p of this.possedute) if (p.arma === arma) p.unita = true;
    this.unite[arma.id] = true;
  }

  unita(arma: Arma): boolean {
    return !!this.unite[arma.id];
  }

  potenzia(arma: Arma): void {
    for (const p of this.possedute) if (p.arma === arma) p.livello++;
  }

  /**
   * Un passo di logica. (x, y) sono i piedi del personaggio, (dx, dy) la direzione in cui cammina,
   * mezzaL e mezzaA sono metà dello schermo.
   */
  aggiorna(dt: number, x: number, y: number, dx: number, dy: number, mezzaL: number, mezzaA: number): void {
    this.px = x;
    this.py = y - COLPI.corpo;
    this.dx = dx;
    this.dy = dy;
    this.mezzaL = mezzaL;
    this.mezzaA = mezzaA;
    this.storiaI = (this.storiaI + 1) % PASSI_STORIA;
    this.storiaX[this.storiaI] = this.px;
    this.storiaY[this.storiaI] = this.py;
    for (let n = 0; n < this.possedute.length; n++) {
      const p = this.possedute[n];
      if (p.arma.id === 'falce') continue; // sempre attiva
      this.attesa[n] -= dt;
      if (this.attesa[n] > 0) continue;
      this.attesa[n] += this.spara(p) * this.bonus.ricarica;
      if (this.attesa[n] < 0) this.attesa[n] = 0;
    }
    this.aggiornaRitardati(dt);
    this.aggiornaRaffica(dt);
    this.aggiornaFalci(dt);
    this.aggiornaZone(dt);
    this.aggiornaProiettili(dt);
    this.aggiornaLapidi(dt);
    this.aggiornaSassi(dt);
    this.aggiornaGrani(dt);
    this.aggiornaCorvi(dt);
    this.eseguiCoda();
    if (this.attesaSorso > 0) this.attesaSorso -= dt;
    if (this.falceDura > 0 && (this.falceDura -= dt) <= 0) this.falceCresce = 0;
    for (let i = 0; i < MAX_EFFETTI; i++) {
      if (this.vitaEffetto[i] > 0 && (this.vitaEffetto[i] -= dt) <= 0) this.sprEffetti[i].stop().setVisible(false);
    }
  }

  /** Lancia un'abilità speciale nel punto del personaggio. */
  abilita(a: Abilita): void {
    const area = 1 + this.bonus.area;
    this.fonte = F.abilita;
    this.zona(a.effetto, this.px, this.py, a.raggio * area, a.danno, a.durata, a.intervallo, a.rallenta, a.attira, a.cura, a.segue, a.animazione === 'ciclo',
      0, CODICE_AFFINITA[AFFINITA_ABILITA[a.id]]);
  }

  /** Martire: un'onda sacra intorno al personaggio quando subisce un colpo. Non ferisce: consacra e ferma chi è entro raggio. */
  onda(raggio: number, fermo: number): void {
    const o = this.orda, r2 = raggio * raggio;
    for (let j = 0; j < o.numero; j++) {
      const dx = o.x[j] - this.px, dy = o.y[j] - o.raggio[j] - this.py;
      if (o.salute[j] <= 0 || dx * dx + dy * dy > r2) continue;
      const r = o.marca(j, SACRO);
      if (r) this.accoda(r, j, 0);
      o.ferma(j, fermo);
    }
    this.effetti.reazione(this.px, this.py, raggio, REAZIONI.rivelazione.colore, REAZIONI.rivelazione.bordo, REAZIONI.durataEffetto);
  }

  /** Lucciola (e Laboratorio): lascia lo stato dell'affinità aff ai nemici entro raggio (senza danno); le reazioni si eseguono a fine passo. */
  abbaglia(x: number, y: number, raggio: number, aff: number = LUCE): void {
    const o = this.orda, r2 = raggio * raggio;
    for (let j = 0; j < o.numero; j++) {
      const dx = o.x[j] - x, dy = o.y[j] - y;
      if (dx * dx + dy * dy > r2) continue;
      const r = o.marca(j, aff);
      if (r) this.accoda(r, j, 0);
    }
  }

  /** Lucciola: abbaglia chi entra nell'alone (raggio intorno a x, y), non più di una volta ogni «pausa» secondi per nemico. */
  lucciola(x: number, y: number, raggio: number, pausa: number): void {
    const o = this.orda, r2 = raggio * raggio;
    for (let j = 0; j < o.numero; j++) {
      const dx = o.x[j] - x, dy = o.y[j] - y;
      if (!o.entraNellAlone(j, dx * dx + dy * dy <= r2, pausa)) continue;
      const r = o.marca(j, LUCE);
      if (r) this.accoda(r, j, 0);
    }
  }

  /**
   * Laboratorio, prova pixelfx: mostra un effetto nel punto (x, y) senza ferire nessuno, per confrontare vecchio e nuovo.
   * «raggio» vale per la Pozza; la Sepoltura usa il suo raggio con il dono dell'area.
   */
  labVediEffetto(cosa: 'sepoltura' | 'pozza' | 'eclissi', x: number, y: number, raggio = 0): void {
    if (cosa === 'eclissi') {
      if (INTERRUTTORI.pixelfx) this.effetti.eclissiPixelfx(x, y);
      else this.effetti.reazione(x, y, REAZIONI.eclissi.raggio, REAZIONI.eclissi.colore, REAZIONI.eclissi.bordo, REAZIONI.durataEffetto);
      return;
    }
    const a = ABILITA.sepoltura;
    if (cosa === 'sepoltura') this.zona(a.effetto, x, y, a.raggio * (1 + this.bonus.area), 0, a.durata, a.intervallo, 0, 0, 0, false, false);
    else this.zona(ACQUA_SANTA.effetto, x, y, raggio, 0, ACQUA_SANTA.livelli[0].durata, ACQUA_SANTA.intervallo, 0, 0, 0, false, true, POZZA, SACRO);
  }

  /**
   * Gioco a stanze: un colpo dato da fuori dall'arsenale (la Lanterna a mano, il Cerchio di luce) sul nemico j, verso
   * (dx, dy): danno con i bonus (doni, Grazia), lo stato dell'affinità aff, le reazioni, il numero del danno. fonte: FONTI.
   */
  colpoDaFuori(j: number, danno: number, dx: number, dy: number, aff: number, fonte: number): void {
    const prima = this.fonte;
    this.fonte = fonte;
    this.ferisci(j, danno, 0, dx, dy, aff);
    this.fonte = prima;
  }

  /** Disegna ciò che si muove; gli effetti istantanei restano dove sono nati. Posizioni arrotondate al pixel. */
  disegna(): void {
    for (let i = 0; i < this.zone; i++) this.zSprite[i].setPosition(Math.round(this.zX[i]), Math.round(this.zY[i]));
    for (let i = 0; i < this.proiettili; i++) {
      this.prSprite[i].setPosition(Math.round(this.prX[i]), Math.round(this.prY[i])).setRotation(Math.atan2(this.prVY[i], this.prVX[i]));
    }
    for (let i = 0; i < this.lapidi; i++) {
      const sale = this.lpCaduta[i] ? (LAPIDE.altezza * (this.lpVita[i] - this.lpResta[i])) / LAPIDE.caduta : 0;
      this.lpSprite[i].setPosition(Math.round(this.lpX[i]), Math.round(this.lpY[i] - sale));
    }
    for (let i = 0; i < this.sassi; i++) {
      const u = Math.min(1, this.ssT[i] / this.ssDurata[i]), x = this.ssX0[i] + (this.ssX1[i] - this.ssX0[i]) * u;
      const y = this.ssY0[i] + (this.ssY1[i] - this.ssY0[i]) * u - this.ssAlto[i] * 4 * u * (1 - u);
      this.ssSprite[i].setPosition(Math.round(x), Math.round(y));
    }
    for (let i = 0; i < this.grani; i++) this.grSprite[i].setPosition(Math.round(this.grX[i]), Math.round(this.grY[i]));
    for (let i = 0; i < this.corvi; i++) this.cvSprite[i].setPosition(Math.round(this.cvX[i]), Math.round(this.cvY[i]));
    if (this.raggioVelo) this.velo.setPosition(Math.round(this.px), Math.round(this.py)).setScale(this.raggioVelo / RAGGIO_VELO).setVisible(true);
    // il numero sommato segue la testa di élite e Seth, così non finisce mai sul loro corpo
    const o = this.orda;
    for (let j = 0; j < o.numero; j++) {
      if (o.elite[j] || o.tipo[j] === ID_MIETITORE) this.effetti.seguiSomma(o.id[j], o.x[j], o.y[j] - o.altezza(j));
    }
  }

  /** Fa partire il colpo di un'arma; restituisce la ricarica del suo livello. */
  protected spara(p: Posseduta): number {
    const a = p.arma;
    const area = 1 + this.bonus.area;
    const piu = this.bonus.quantita;
    this.fonte = F[a.id];
    switch (a.id) {
      case 'lanterna': {
        const l = a.livelli[p.livello - 1];
        if (this.unite.lanterna) {
          this.arco(this.dx, this.dy, l.raggio * area, 360, l.danno, U.faro.abbaglia);
          return l.ricarica;
        }
        this.mira(MIRA.lanterna);
        this.arco(this.mX, this.mY, l.raggio * area, l.ampiezza, l.danno);
        if (l.spalle) this.arco(-this.mX, -this.mY, l.raggio * area, l.ampiezza, l.danno);
        return l.ricarica;
      }
      case 'pala': {
        const l = a.livelli[p.livello - 1];
        const j = this.mira(MIRA.pala), o = this.orda;
        // mirando, l'impatto cade sul nemico; altrimenti davanti al personaggio, come sempre
        if (j >= 0) this.impatto(this.mX, this.mY, l.raggio * area, l.danno, o.x[j], o.y[j] - o.raggio[j]);
        else this.impatto(this.mX, this.mY, l.raggio * area, l.danno);
        if (l.doppio) this.ritarda(a, a.ritardoDoppio, l.raggio * area, l.danno, Math.atan2(-this.mY, -this.mX));
        return l.ricarica;
      }
      case 'campana': {
        const l = a.livelli[p.livello - 1];
        this.rintocco(l.raggio * area, l.danno, this.unite.campana ? U.campana.fermo : 0);
        if (l.doppio) this.ritarda(a, a.ritardoDoppio, l.raggio * area, l.danno, 1); // il secondo rintocco ferma
        return l.ricarica;
      }
      case 'lamaDiLuce': {
        const l = a.livelli[p.livello - 1];
        // il fendente segue la direzione in cui cammini (prima solo destra o sinistra)
        this.fendente(this.dx, this.dy, l.lunghezza * area, l.danno);
        if (this.unite.lamaDiLuce) {
          const k = (this.storiaI + PASSI_STORIA - Math.min(PASSI_STORIA - 1, Math.round(U.lama.ritardo * 60))) % PASSI_STORIA;
          this.fendente(this.dx, this.dy, l.lunghezza * area, l.danno, this.storiaX[k], this.storiaY[k]);
        }
        if (l.spalle) this.ritarda(a, a.ritardoSpalle, l.lunghezza * area, l.danno, Math.atan2(-this.dy, -this.dx));
        return l.ricarica;
      }
      case 'turibolo': {
        const l = a.livelli[p.livello - 1];
        for (let k = 0; k < l.quantita + piu; k++) {
          let nx = this.px + this.dx * a.distanzaPrima;
          let ny = this.py + this.dy * a.distanzaPrima;
          if (k > 0) {
            const ang = this.caso.numero() * Math.PI * 2;
            const d = this.caso.numero() * a.distanzaAltre;
            nx = this.px + Math.cos(ang) * d;
            ny = this.py + Math.sin(ang) * d;
          }
          // Incensiere dell'ultima ora: le nubi curano e rallentano di più (con il tetto: vedi toccaZona)
          const inc = !!this.unite.turibolo;
          this.zona(a.effetto, nx, ny, l.raggio * area, l.danno, l.durata, a.intervallo, inc ? Math.max(a.rallenta, U.incensiere.rallenta) : a.rallenta, 0, inc ? U.incensiere.cura : 0, false, false, NUBE, SACRO);
        }
        return l.ricarica;
      }
      case 'acquaSanta': {
        const l = a.livelli[p.livello - 1];
        const o = this.orda;
        for (let k = 0; k < l.quantita + piu; k++) {
          const j = this.nemicoVisibile();
          if (j < 0) break;
          this.zona(a.effetto, o.x[j], o.y[j] - o.raggio[j], l.raggio * area, l.danno, l.durata, a.intervallo, 0, 0, 0, false, true, POZZA, SACRO);
        }
        return l.ricarica;
      }
      case 'bastone': {
        const l = a.livelli[p.livello - 1];
        this.raffica = l.quantita + piu;
        this.attesaRaffica = 0;
        this.dannoRaffica = l.danno;
        this.trapassaRaffica = l.trapassa;
        if (this.unite.bastone && ++this.raffiche % U.verga.ogni === 0) this.colpisciMaledetti(l.danno * U.verga.danno);
        return l.ricarica;
      }
      case 'candela': {
        const l = a.livelli[p.livello - 1];
        // ogni fiammella verso un nemico diverso, dal più vicino in poi
        const n = Math.min(l.quantita + piu, this.scelti.length);
        for (let k = 0; k < n; k++) {
          const j = this.piuVicino(a.portata, k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.lancia(a.effetto, j, a.velocita, a.vita, l.danno, l.trapassa, a.raggio, 0, 0, false, 0, LUCE);
          if (this.unite.candela && this.proiettili) this.prUnione[this.proiettili - 1] = SCIA;
        }
        return l.ricarica;
      }
      case 'fuocoFatuo': {
        const l = a.livelli[p.livello - 1];
        const n = l.quantita + piu;
        // partono a raggiera e poi girano verso i nemici
        for (let k = 0; k < n; k++) {
          this.lancia(a.effetto, -1, a.velocita, a.vita, l.danno, l.trapassa, a.raggio, a.sterzo, a.portata, false, (k / n) * Math.PI * 2, OMBRA);
          if (this.unite.fuocoFatuo && this.proiettili) this.prUnione[this.proiettili - 1] = RACCOGLIE;
        }
        return l.ricarica;
      }
      case 'lapide': {
        const l = a.livelli[p.livello - 1];
        const n = Math.min(l.quantita + piu, this.scelti.length);
        for (let k = 0; k < n; k++) {
          const j = this.piuForte(k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.lapideCade(this.orda.x[j], this.orda.y[j], l.raggio * area, l.danno);
        }
        return l.ricarica;
      }
      case 'sampietrini': {
        const l = a.livelli[p.livello - 1];
        const n = Math.min(l.quantita + piu, this.scelti.length);
        for (let k = 0; k < n; k++) {
          const j = this.piuVicino(a.portata, k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.lanciaSasso(this.orda.x[j], this.orda.y[j], a.raggio * area, l.danno, l.rimbalzi);
        }
        return l.ricarica;
      }
      case 'rosarioSpezzato': {
        const l = a.livelli[p.livello - 1];
        const n = Math.min(l.quantita + piu, this.scelti.length);
        for (let k = 0; k < n; k++) {
          const j = this.piuVicino(a.portata, k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.lanciaGrano(j, l.danno, l.rimbalzi);
        }
        return l.ricarica;
      }
      case 'corvo': {
        const l = a.livelli[p.livello - 1];
        const o = this.orda;
        this.corvi = Math.min(l.quantita + piu, MAX_CORVI, this.scelti.length);
        // Stormo del lutto: per primi i nemici che con la Luce fanno una reazione (consacrati, maledetti, sepolti)
        const stormo = !!this.unite.corvo;
        for (let k = 0; k < this.corvi; k++) {
          const j = stormo ? this.piuVicinoCheReagisce(a.portata, k, LUCE) : this.piuVicino(a.portata, k);
          if (j < 0) break;
          this.scelti[k] = j;
          this.cvMX[k] = o.x[j];
          this.cvMY[k] = o.y[j] - o.raggio[j];
          this.cvMira[k] = 0.18;
          this.ferisci(j, l.danno, 0, 0, 0, LUCE);
          this.rompibili?.colpitoDa(this.cvMX[k], this.cvMY[k], ROMPIBILI.raggio);
          // a ogni beccata le anime a terra intorno al nemico beccato volano verso il personaggio
          this.anime?.attiraVicino(o.x[j], o.y[j], a.richiamo);
        }
        return l.ricarica;
      }
      case 'veloFunebre': {
        const l = a.livelli[p.livello - 1];
        this.raggioVelo = l.raggio * area;
        this.prepara(0, this.px, this.py, this.raggioVelo, l.danno, 0);
        this.cAff = SACRO;
        this.cProb = RUOLI.veloConsacra;
        this.cLampo = false;
        this.cRitmo = true; // un'aura: è una zona intorno al personaggio
        this.orda.griglia.nelRaggio(this.cx, this.cy, this.raggioVelo + 40, this.visitaColpo);
        this.cRitmo = false;
        this.rompiForma();
        return l.ricarica;
      }
      case 'falce':
        return 1;
    }
  }
}
