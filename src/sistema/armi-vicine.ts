/*
 * Armi, quarto strato: i colpi vicini al personaggio. Lanterna (arco), Pala e Campana (cerchio), Lama di luce
 * (fendente), le Falci che girano intorno e i colpi ritardati (secondo colpo di Pala e Campana, fendente alle spalle).
 */
import { LUCE, OMBRA, SACRO, TERRA } from './orda';
import { RUOLI, STATI } from '../data/stati';
import { INTERRUTTORI } from './interruttori';
import { suona } from './audio';
import { PROFONDITA } from './effetti';
import { EFFETTI } from '../data/effetti';
import { CAMPANA, FALCE, LAMA_DI_LUCE, LANTERNA, PALA, type Arma } from '../data/armi';
import { NUMERI_UNIONI as U } from '../data/unioni';
import { ID_MIETITORE, MAX_LAME, MAX_RITARDATI, F } from './armi-colpo';
import { ArsenaleProiettili } from './armi-proiettili';

export abstract class ArsenaleVicine extends ArsenaleProiettili {
  // definiti negli strati sopra (le famiglie di armi): qui servono solo i loro nomi
  public abstract livello(arma: Arma): number;

  // ——— Colpi istantanei ———
  protected arco(dx: number, dy: number, raggio: number, ampiezza: number, danno: number, probabilita: number = STATI.probabilita): void {
    this.prepara(1, this.px, this.py, raggio, danno, LANTERNA.respinta);
    this.cDX = dx;
    this.cDY = dy;
    this.cCos = Math.cos(((ampiezza / 2) * Math.PI) / 180);
    this.cAff = LUCE;
    this.cProb = probabilita;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.rompiForma();
    this.effetti.arco(this.px, this.py, Math.atan2(dy, dx), raggio, ampiezza);
  }

  /** L'impatto della Pala: di solito davanti al personaggio nella direzione (dx, dy); (cx, cy) lo mette altrove (la Pala che mira). */
  protected impatto(dx: number, dy: number, raggio: number, danno: number, cx = this.px + dx * PALA.distanza, cy = this.py + dy * PALA.distanza): void {
    this.prepara(0, cx, cy, raggio, danno, PALA.respinta);
    this.cAff = TERRA;
    if (this.unite.pala) {
      this.cFerma = U.vanga.fermo;
      this.cFermaTerra = true;
      this.lapideCade(this.cx, this.cy, raggio, 0); // solo da vedere: il colpo è già questo
    }
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.rompiForma();
    this.effetto(PALA.effetto, this.cx, this.cy, raggio, PROFONDITA.aTerra, EFFETTI.impattoPala);
    if (this.toccati) this.effetti.scuoti(EFFETTI.scossaPala.forza, EFFETTI.scossaPala.durata);
  }

  protected rintocco(raggio: number, danno: number, ferma = 0): void {
    this.prepara(0, this.px, this.py, raggio, danno, CAMPANA.respinta);
    this.cAff = SACRO;
    this.cFerma = ferma;
    this.orda.griglia.nelRaggio(this.cx, this.cy, raggio + 40, this.visitaColpo);
    this.rompiForma();
    this.effetto(CAMPANA.effetto, this.px, this.py, raggio, PROFONDITA.aTerra, CAMPANA.durataEffetto);
    suona('campana');
  }

  /** Fendente dritto nella direzione (dx, dy), lunga 1: un rettangolo che parte dal personaggio. */
  protected fendente(dx: number, dy: number, lunghezza: number, danno: number, ox = this.px, oy = this.py): void {
    const h = LAMA_DI_LUCE.altezza / 2;
    this.prepara(2, ox + (dx * lunghezza) / 2, oy + (dy * lunghezza) / 2, Math.hypot(lunghezza / 2, h), danno, LAMA_DI_LUCE.respinta);
    this.cAff = LUCE;
    this.cX0 = ox; // inizio del fendente
    this.cY0 = oy;
    this.cX1 = lunghezza;
    this.cY1 = h;
    this.cDX = dx;
    this.cDY = dy;
    // i colpi della Lama di luce ignorano la quiete, come il primo scatto delle abilità (decisione di Edoardo dell'11/11)
    this.cForza = INTERRUTTORI.statiCerti && RUOLI.lamaIgnoraQuiete;
    this.orda.griglia.nelRaggio(this.cx, this.cy, this.cr + 40, this.visitaColpo);
    this.cForza = false;
    this.rompiForma();
    // il fendente della v0 parte dal bordo sinistro della tela e va a destra: si allunga e si gira nella direzione;
    // verso sinistra si capovolge anche in verticale, così il disegno non resta sottosopra
    const s = this.effetto(LAMA_DI_LUCE.effetto, ox, oy, 0, PROFONDITA.aTerra, LAMA_DI_LUCE.durataEffetto);
    if (!s) return;
    const m = this.misureLama();
    s.setOrigin(m.x / m.l, 0.5).setScale(lunghezza / m.lunghezza, LAMA_DI_LUCE.altezza / m.altezza).setRotation(Math.atan2(dy, dx)).setFlipY(dx < 0);
  }

  protected misureLama(): { x: number; l: number; lunghezza: number; altezza: number } {
    if (!this.lamaMisure) {
      const dati = this.scena.cache.json.get(LAMA_DI_LUCE.effetto) as { frames: { spriteSourceSize: { x: number; w: number; h: number }; sourceSize: { w: number } }[] };
      let x = Infinity;
      let fine = 0;
      let alt = 1;
      for (const f of dati.frames) {
        x = Math.min(x, f.spriteSourceSize.x);
        fine = Math.max(fine, f.spriteSourceSize.x + f.spriteSourceSize.w);
        alt = Math.max(alt, f.spriteSourceSize.h);
      }
      this.lamaMisure = { x, l: dati.frames[0].sourceSize.w, lunghezza: fine - x, altezza: alt };
    }
    return this.lamaMisure;
  }

  protected ritarda(arma: Arma, tempo: number, a: number, b: number, c: number): void {
    if (this.ritardati >= MAX_RITARDATI) return;
    const i = this.ritardati++;
    this.rtTempo[i] = tempo;
    this.rtArma[i] = arma;
    this.rtA[i] = a;
    this.rtB[i] = b;
    this.rtC[i] = c;
  }

  protected aggiornaRitardati(dt: number): void {
    for (let i = this.ritardati - 1; i >= 0; i--) {
      this.rtTempo[i] -= dt;
      if (this.rtTempo[i] > 0) continue;
      const arma = this.rtArma[i];
      this.fonte = F[arma.id];
      if (arma.id === 'pala') this.impatto(Math.cos(this.rtC[i]), Math.sin(this.rtC[i]), this.rtA[i], this.rtB[i]);
      else if (arma.id === 'campana') this.rintocco(this.rtA[i], this.rtB[i], Math.max(this.rtC[i] ? RUOLI.campanaFermo : 0, this.unite.campana ? U.campana.fermo : 0));
      else this.fendente(Math.cos(this.rtC[i]), Math.sin(this.rtC[i]), this.rtA[i], this.rtB[i]);
      const u = --this.ritardati;
      this.rtTempo[i] = this.rtTempo[u];
      this.rtArma[i] = this.rtArma[u];
      this.rtA[i] = this.rtA[u];
      this.rtB[i] = this.rtB[u];
      this.rtC[i] = this.rtC[u];
    }
  }

  // ——— Falci ———
  protected aggiornaFalci(dt: number): void {
    let n = 0;
    const falce = this.posseduta('falce');
    if (falce) {
      const l = (falce.arma as typeof FALCE).livelli[falce.livello - 1]; // la tabella dell'arma posseduta (survivor o stanze)
      n = Math.min(MAX_LAME, l.quantita + this.bonus.quantita);
      const r = l.raggio * (1 + this.bonus.area);
      this.angoloFalci = (this.angoloFalci + l.giri * Math.PI * 2 * dt) % (Math.PI * 2);
      this.cDanno = l.danno;
      this.fonte = F.falce;
      this.cr = FALCE.raggioLama * (1 + this.falceCresce);
      for (let k = 0; k < n; k++) {
        const ang = this.angoloFalci + (k / n) * Math.PI * 2;
        this.cx = this.px + Math.cos(ang) * r;
        this.cy = this.py + Math.sin(ang) * r;
        this.orda.griglia.vicini(this.cx, this.cy, this.visitaFalce);
        this.rompibili?.colpitoDa(this.cx, this.cy, this.cr);
        this.lame[k].setPosition(Math.round(this.cx), Math.round(this.cy)).setRotation(ang * 3).setScale(this.scalaLama * (1 + this.falceCresce)).setVisible(true);
      }
    }
    for (let k = n; k < MAX_LAME; k++) this.lame[k].setVisible(false);
  }

  protected toccaFalce(j: number): void {
    const o = this.orda;
    if (o.pausaFalce[j] > 0 || o.salute[j] <= 0 || o.fuoriSchermo(j)) return;
    const rx = o.x[j] - this.cx;
    const ry = o.y[j] - o.raggio[j] - this.cy;
    const r = this.cr + o.raggio[j];
    if (rx * rx + ry * ry > r * r) return;
    o.pausaFalce[j] = FALCE.pausa;
    const ex = o.x[j] - this.px;
    const ey = o.y[j] - o.raggio[j] - this.py;
    const d = Math.hypot(ex, ey) || 1;
    // Falce di Seth: la soglia dipende dallo stato che il nemico aveva prima del colpo (la Falce stessa maledice)
    const soglia = o.maledetto(j) ? U.falce.maledetti : U.falce.sotto;
    this.ferisci(j, this.cDanno, FALCE.respinta, ex / d, ey / d, OMBRA);
    if (this.unite.falce && o.salute[j] > 0 && !o.elite[j] && o.tipo[j] !== ID_MIETITORE && o.salute[j] < soglia * o.saluteMassima[j]) {
      this.dannoFonti[F.falce] += o.salute[j];
      o.colpisci(j, o.salute[j], 0, 0, 0);
      o.uccisore[j] = F.falce + 1;
    }
    if (o.salute[j] <= 0) {
      // ogni uccisione allunga la lama per qualche secondo
      const c = RUOLI.falceCrescita;
      this.falceCresce = Math.min(c.massimo, this.falceCresce + c.perUccisione);
      this.falceDura = c.durata;
    }
  }
}
