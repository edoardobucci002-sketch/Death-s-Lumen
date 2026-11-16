/*
 * Armi, terzo strato: i proiettili (Bastone e Candela verso il nemico più vicino, Fuoco fatuo che insegue, fiammelle
 * dell'Esorcismo), i Sampietrini che volano e rimbalzano, i grani del Rosario spezzato e i Corvi.
 */
import { ingrandimento } from './asset';
import { LUCE, OMBRA, TERRA } from './orda';
import { REAZIONI, RUOLI, STATI } from '../data/stati';
import { suona } from './audio';
import { PROFONDITA } from './effetti';
import { EFFETTI } from '../data/effetti';
import { BASTONE, CANDELA, SAMPIETRINI, CORVO, ROSARIO_SPEZZATO } from '../data/armi';
import { POTENZIALI, ROSARIO_VOLO } from '../data/armi-stanze';
import { NUMERI_UNIONI as U } from '../data/unioni';
import { CHIAZZE, ROMPIBILI } from '../data/rompibili';
import { SASSO_LARGO, SPRITE_SCIA } from './segnaposto-oggetti';
import { ESPLOSIONE, ID_MIETITORE, MAX_PROIETTILI, MAX_GRANI, MAX_SASSI, MAX_RIMBALZI, SCIA, RACCOGLIE, PROIETTILI_V0, F } from './armi-colpo';
import { ArsenaleZone } from './armi-zone';

const FIGLIA = 3; // proiettile nato da una fiammella che si è divisa (Candela al potenziale): non si divide più
const MAX_DIVISIONI = 16; // fiammelle che si dividono in un passo, al massimo

export abstract class ArsenaleProiettili extends ArsenaleZone {
  // Candela al potenziale: le fiammelle che si dividono in questo passo (le figlie partono a fine passo, fuori dalle ricerche)
  private divisioni = 0;
  private dvX = new Float32Array(MAX_DIVISIONI);
  private dvY = new Float32Array(MAX_DIVISIONI);
  private dvA = new Float32Array(MAX_DIVISIONI);
  private dvDanno = new Float32Array(MAX_DIVISIONI);

  /** Verga dei nomi: colpisce tutti i nemici maledetti sullo schermo. */
  protected colpisciMaledetti(danno: number): void {
    const o = this.orda;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= 0 || !o.maledetto(j) || Math.abs(o.x[j] - this.px) > this.mezzaL || Math.abs(o.y[j] - this.py) > this.mezzaA) continue;
      this.ferisci(j, danno, 0, 0, 0);
      this.effetti.scoppio(o.x[j], o.y[j] - o.raggio[j]);
    }
  }

  /** Il nemico sullo schermo con più salute, saltando i primi «salta» già scelti. */
  protected piuForte(salta: number): number {
    const o = this.orda;
    let migliore = -1;
    let massima = 0;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= massima || Math.abs(o.x[j] - this.px) > this.mezzaL || Math.abs(o.y[j] - this.py) > this.mezzaA) continue;
      let preso = false;
      for (let k = 0; k < salta; k++) if (this.scelti[k] === j) preso = true;
      if (preso) continue;
      massima = o.salute[j];
      migliore = j;
    }
    return migliore;
  }

  // ——— Sampietrini ———
  protected lanciaSasso(x: number, y: number, raggio: number, danno: number, rimbalzi: number): void {
    if (this.sassi >= MAX_SASSI) return;
    const i = this.sassi++, d = Math.hypot(x - this.px, y - this.py) || 1;
    this.ssX0[i] = this.px;
    this.ssY0[i] = this.py;
    this.ssX1[i] = x;
    this.ssY1[i] = y;
    this.ssDX[i] = (x - this.px) / d;
    this.ssDY[i] = (y - this.py) / d;
    this.ssT[i] = 0;
    this.ssDurata[i] = SAMPIETRINI.volo;
    this.ssAlto[i] = SAMPIETRINI.altezza;
    this.ssDanno[i] = danno;
    this.ssR[i] = raggio;
    this.ssResto[i] = rimbalzi;
    this.ssUnito[i] = 0;
    // provvisorio: il sasso largo quanto l'area che colpisce, con un ingrandimento intero
    this.ssSprite[i].setScale(Math.max(1, Math.round((2 * raggio) / SASSO_LARGO))).setVisible(true);
  }

  /** I sampietrini volano; arrivati colpiscono (Terra, come la Pala) e, se hanno rimbalzi, ripartono in avanti. */
  protected aggiornaSassi(dt: number): void {
    const S = SAMPIETRINI;
    for (let i = this.sassi - 1; i >= 0; i--) {
      this.ssT[i] += dt;
      if (this.ssT[i] < this.ssDurata[i]) continue;
      const x = this.ssX1[i], y = this.ssY1[i];
      this.prepara(0, x, y, this.ssR[i], this.ssDanno[i], 0);
      // Selciato: se sotto c'è un nemico fermo, un rimbalzo in più (una volta per sasso)
      if (this.unite.sampietrini && !this.ssUnito[i]) {
        this.trovatoFermo = false;
        this.orda.griglia.nelRaggio(x, y, this.ssR[i] + 40, this.visitaFermo);
        if (this.trovatoFermo) {
          this.ssResto[i] += U.selciato.rimbalzi;
          this.ssUnito[i] = 1;
        }
      }
      this.fonte = F.sampietrini;
      this.cAff = TERRA;
      this.orda.griglia.nelRaggio(x, y, this.ssR[i] + 40, this.visitaColpo);
      this.rompiForma();
      this.effetti.polvere(x, y, this.ssR[i]); // provvisoria, larga quanto l'area (S.effetto, la polvere della Pala, quando ci sarà la sua)
      if (this.ssResto[i] > 0) {
        this.ssResto[i]--;
        this.ssX0[i] = x;
        this.ssY0[i] = y;
        // Sampietrini al potenziale (gioco a stanze): il rimbalzo va verso il nemico più vicino (non quello appena colpito)
        const j = this.potenziale[F.sampietrini] ? this.vicinoA(x, y, this.ssR[i], POTENZIALI.sampietrini.cerca) : -1;
        if (j >= 0) {
          const ex = this.orda.x[j] - x, ey = this.orda.y[j] - y, d = Math.hypot(ex, ey) || 1;
          this.ssDX[i] = ex / d;
          this.ssDY[i] = ey / d;
          this.ssX1[i] = this.orda.x[j];
          this.ssY1[i] = this.orda.y[j];
        } else {
          this.ssX1[i] = x + this.ssDX[i] * S.salto;
          this.ssY1[i] = y + this.ssDY[i] * S.salto;
        }
        this.ssT[i] = 0;
        this.ssDurata[i] = S.voloRimbalzo;
        this.ssAlto[i] = S.altezzaRimbalzo;
        continue;
      }
      const u = --this.sassi, s = this.ssSprite[i];
      s.setVisible(false);
      for (const a of this.ssCampi) a[i] = a[u];
      this.ssResto[i] = this.ssResto[u];
      this.ssUnito[i] = this.ssUnito[u];
      this.ssSprite[i] = this.ssSprite[u];
      this.ssSprite[u] = s;
    }
  }

  /** Il nemico vivo più vicino a (x, y) tra «minimo» e «massimo» px (-1 se non c'è); senza creare niente. */
  protected vicinoA(x: number, y: number, minimo: number, massimo: number): number {
    const o = this.orda;
    let migliore = -1, dm = massimo * massimo;
    for (let j = 0; j < o.numero; j++) {
      if (o.salute[j] <= 0) continue;
      const d2 = (o.x[j] - x) ** 2 + (o.y[j] - y) ** 2;
      if (d2 >= minimo * minimo && d2 < dm) {
        dm = d2;
        migliore = j;
      }
    }
    return migliore;
  }

  // ——— Rosario spezzato ———
  protected lanciaGrano(j: number, danno: number, rimbalzi: number): void {
    if (this.grani >= MAX_GRANI) return;
    const i = this.grani++;
    this.grColpiti.fill(0, i * MAX_RIMBALZI, (i + 1) * MAX_RIMBALZI);
    this.grResto[i] = Math.min(rimbalzi, MAX_RIMBALZI);
    this.grPieni[i] = this.grResto[i];
    this.grRipartito[i] = 0;
    this.grDanno[i] = danno;
    this.grVerso[i] = -1;
    // gioco a stanze: il grano parte da te e vola verso il primo nemico (lo colpisce quando arriva)
    if (this.campo && this.scena.anims.exists(`${ROSARIO_VOLO.grano}:idle`)) {
      this.grX[i] = this.px;
      this.grY[i] = this.py;
      this.grSprite[i].setTexture(ROSARIO_VOLO.grano, '0').setScale(1).play(`${ROSARIO_VOLO.grano}:idle`);
      const s = this.grSprite[i];
      s.setOrigin(ROSARIO_VOLO.pernoGrano[0] / s.width, ROSARIO_VOLO.pernoGrano[1] / s.height).setVisible(true);
      this.voloGrano(i, j);
      return;
    }
    this.grSprite[i].setVisible(true);
    this.rimbalza(i, j);
  }

  /** Gioco a stanze: il grano i parte dal punto in cui è verso il nemico j. */
  protected voloGrano(i: number, j: number): void {
    const o = this.orda;
    this.grDaX[i] = this.grX[i];
    this.grDaY[i] = this.grY[i];
    this.grVerso[i] = j;
    this.grVersoId[i] = o.id[j];
    this.grAX[i] = o.x[j];
    this.grAY[i] = o.y[j] - o.raggio[j];
    this.grTempo[i] = ROSARIO_VOLO.durata;
  }

  /** Rosario dei vespri: dal nemico j (appena ucciso) riparte un grano con i rimbalzi e il danno del grano i. */
  protected ripartiGrano(i: number, j: number): void {
    if (this.grani >= MAX_GRANI) return;
    const k = this.grani++, o = this.orda;
    this.grColpiti.fill(0, k * MAX_RIMBALZI, (k + 1) * MAX_RIMBALZI);
    this.grResto[k] = this.grPieni[k] = this.grPieni[i];
    this.grDanno[k] = this.grDanno[i];
    this.grRipartito[k] = ++this.grRipartito[i];
    this.grVerso[k] = -1; // ripartenze già usate dal lancio (U.rosario.ripartenze): niente catene senza fine
    this.grX[k] = o.x[j];
    this.grY[k] = o.y[j] - o.raggio[j];
    this.grTempo[k] = ROSARIO_SPEZZATO.intervallo; // al prossimo rimbalzo cerca il nemico più vicino
    this.grSprite[k].setPosition(Math.round(this.grX[k]), Math.round(this.grY[k])).setVisible(true);
    this.effetti.scoppio(this.grX[k], this.grY[k]);
  }

  /** Il grano i colpisce il nemico j e ci si posa sopra. */
  protected rimbalza(i: number, j: number): void {
    const o = this.orda;
    this.grX[i] = o.x[j];
    this.grY[i] = o.y[j] - o.raggio[j];
    this.grColpiti[i * MAX_RIMBALZI + this.grResto[i] - 1] = o.id[j];
    this.grResto[i]--;
    this.grTempo[i] = ROSARIO_SPEZZATO.intervallo;
    const maledetto = o.maledetto(j); // lo stato di prima del colpo: il grano stesso può maledire
    // Rosario al potenziale (gioco a stanze): ogni rimbalzo fa più danno del precedente
    const salti = this.grPieni[i] - this.grResto[i] - 1;
    const crescita = this.potenziale[F.rosarioSpezzato] ? (1 + POTENZIALI.rosarioSpezzato.crescita) ** salti : 1;
    this.ferisci(j, this.grDanno[i] * crescita, 0, 0, 0, OMBRA, RUOLI.rosarioMaledice);
    if (this.unite.rosarioSpezzato && maledetto && o.salute[j] <= 0 && this.grRipartito[i] < U.rosario.ripartenze) this.ripartiGrano(i, j);
  }

  protected aggiornaGrani(dt: number): void {
    const o = this.orda;
    for (let i = this.grani - 1; i >= 0; i--) {
      this.grTempo[i] -= dt;
      const verso = this.grVerso[i];
      if (verso >= 0) {
        // gioco a stanze: in volo verso il nemico (se è morto o sparito, verso l'ultimo punto in cui era), con un piccolo arco
        const vivo = verso < o.numero && o.id[verso] === this.grVersoId[i] && o.salute[verso] > 0;
        if (vivo) {
          this.grAX[i] = o.x[verso];
          this.grAY[i] = o.y[verso] - o.raggio[verso];
        }
        const u = Math.min(1, 1 - this.grTempo[i] / ROSARIO_VOLO.durata);
        this.grX[i] = this.grDaX[i] + (this.grAX[i] - this.grDaX[i]) * u;
        this.grY[i] = this.grDaY[i] + (this.grAY[i] - this.grDaY[i]) * u - ROSARIO_VOLO.arco * 4 * u * (1 - u);
        if (this.grTempo[i] > 0) continue;
        this.grVerso[i] = -1;
        this.fonte = F.rosarioSpezzato;
        if (vivo) {
          this.rimbalza(i, verso);
          this.colpoGrano(this.grX[i], this.grY[i]);
        }
        this.grTempo[i] = 0;
      }
      if (this.grTempo[i] > 0) continue;
      this.fonte = F.rosarioSpezzato;
      this.rompibili?.colpitoDa(this.grX[i], this.grY[i], ROMPIBILI.raggio);
      let j = -1;
      if (this.grResto[i] > 0) {
        this.cProiettile = i;
        this.cMigliore = -1;
        this.cDistanza = ROSARIO_SPEZZATO.salto * ROSARIO_SPEZZATO.salto;
        this.cx = this.grX[i];
        this.cy = this.grY[i];
        this.orda.griglia.nelRaggio(this.cx, this.cy, ROSARIO_SPEZZATO.salto, this.visitaGrano);
        j = this.cMigliore;
      }
      if (j >= 0) {
        if (this.campo && this.scena.anims.exists(`${ROSARIO_VOLO.grano}:idle`)) this.voloGrano(i, j); // gioco a stanze: vola
        else this.rimbalza(i, j);
        continue;
      }
      const u = --this.grani, s = this.grSprite[i];
      s.setVisible(false);
      this.grX[i] = this.grX[u];
      this.grY[i] = this.grY[u];
      this.grResto[i] = this.grResto[u];
      this.grTempo[i] = this.grTempo[u];
      this.grDanno[i] = this.grDanno[u];
      this.grPieni[i] = this.grPieni[u];
      this.grRipartito[i] = this.grRipartito[u];
      this.grVerso[i] = this.grVerso[u];
      this.grVersoId[i] = this.grVersoId[u];
      this.grDaX[i] = this.grDaX[u];
      this.grDaY[i] = this.grDaY[u];
      this.grAX[i] = this.grAX[u];
      this.grAY[i] = this.grAY[u];
      this.grColpiti.copyWithin(i * MAX_RIMBALZI, u * MAX_RIMBALZI, (u + 1) * MAX_RIMBALZI);
      this.grSprite[i] = this.grSprite[u];
      this.grSprite[u] = s;
    }
  }

  protected vicinoGrano(j: number): void {
    const o = this.orda, i = this.cProiettile;
    if (o.salute[j] <= 0 || o.fuoriSchermo(j)) return;
    for (let k = 0; k < MAX_RIMBALZI; k++) if (this.grColpiti[i * MAX_RIMBALZI + k] === o.id[j]) return;
    const ex = o.x[j] - this.cx, ey = o.y[j] - o.raggio[j] - this.cy, d2 = ex * ex + ey * ey;
    if (d2 < this.cDistanza) {
      this.cDistanza = d2;
      this.cMigliore = j;
    }
  }

  // ——— Corvo ———
  protected aggiornaCorvi(dt: number): void {
    if (!this.corvi) return;
    this.angoloCorvi = (this.angoloCorvi + CORVO.giri * Math.PI * 2 * dt) % (Math.PI * 2);
    for (let k = 0; k < this.corvi; k++) {
      let mx = this.cvMX[k], my = this.cvMY[k];
      if (this.cvMira[k] > 0) this.cvMira[k] -= dt;
      else {
        const ang = this.angoloCorvi + (k / this.corvi) * Math.PI * 2;
        mx = this.px + Math.cos(ang) * CORVO.orbita;
        my = this.py + Math.sin(ang) * CORVO.orbita;
      }
      const dx = mx - this.cvX[k], dy = my - this.cvY[k], d = Math.hypot(dx, dy) || 1, passo = Math.min(d, CORVO.velocita * dt);
      this.cvX[k] += (dx / d) * passo;
      this.cvY[k] += (dy / d) * passo;
      if (Math.abs(dx) > 1) this.cvSprite[k].setFlipX(dx < 0);
      this.cvSprite[k].setVisible(true);
    }
  }

  // ——— Proiettili ———
  /** Un proiettile verso il nemico j; con j = −1 parte nella direzione angolo (solo per quelli che inseguono). */
  protected lancia(chiave: string, j: number, velocita: number, vita: number, danno: number, trapassa: number, raggio: number,
    sterzo: number, portata: number, esplode: boolean, angolo: number, aff = 0, ox = this.px, oy = this.py): void {
    if (this.proiettili >= MAX_PROIETTILI) return;
    let ang = angolo;
    if (j >= 0) {
      const o = this.orda;
      ang = Math.atan2(o.y[j] - o.raggio[j] - oy, o.x[j] - ox);
    } else if (!sterzo) {
      return;
    }
    const i = this.proiettili++;
    suona('sparo');
    this.prX[i] = ox;
    this.prY[i] = oy;
    this.prAff[i] = aff;
    this.prFonte[i] = this.fonte;
    this.prFuoco[i] = (CHIAZZE.accendono as readonly string[]).includes(chiave) ? 1 : 0;
    this.prVX[i] = Math.cos(ang) * velocita;
    this.prVY[i] = Math.sin(ang) * velocita;
    this.prVel[i] = velocita;
    this.prVita[i] = vita;
    this.prDanno[i] = danno;
    this.prRaggio[i] = raggio;
    this.prSterzo[i] = sterzo;
    this.prPortata[i] = portata;
    this.prEsplode[i] = esplode ? 1 : 0;
    this.prUnione[i] = 0;
    this.prReazione[i] = 0;
    this.prResto[i] = trapassa;
    this.prRitorno[i] = 0;
    this.prColpiti.fill(0, i * 4, i * 4 + 4);
    const v0 = PROIETTILI_V0[chiave];
    const s = this.prSprite[i];
    s.setTexture(chiave, v0 ? v0.fotogramma : '0').setScale(ingrandimento(this.scena, chiave)).setVisible(true);
    if (v0) s.setOrigin(v0.x / 128, v0.y / 128);
    else s.setOrigin(0.5);
  }

  protected aggiornaRaffica(dt: number): void {
    if (this.raffica <= 0) return;
    this.attesaRaffica -= dt;
    if (this.attesaRaffica > 0) return;
    this.attesaRaffica += BASTONE.intervallo;
    this.raffica--;
    this.fonte = F.bastone;
    const j = this.piuVicino(BASTONE.portata, 0);
    if (j >= 0) this.lancia(BASTONE.effetto, j, BASTONE.velocita, BASTONE.vita, this.dannoRaffica, this.trapassaRaffica, BASTONE.raggio, 0, 0, true, 0, OMBRA);
  }

  protected aggiornaProiettili(dt: number): void {
    const scia = (this.attesaScia -= dt) <= 0;
    if (scia) this.attesaScia += U.candelabro.ogni;
    for (let i = this.proiettili - 1; i >= 0; i--) {
      this.prVita[i] -= dt;
      this.fonte = this.prFonte[i];
      if (this.prRitorno[i] === 2) this.tornaDa(i, dt);
      else if (this.prSterzo[i] && this.prRitorno[i] === 0) this.sterza(i, dt);
      this.prX[i] += this.prVX[i] * dt;
      this.prY[i] += this.prVY[i] * dt;
      if (this.prRitorno[i] === 1) this.rimbalzaSulMuro(i);
      if (this.prUnione[i] === RACCOGLIE) this.anime?.attiraVicino(this.prX[i], this.prY[i], U.fuochi.raggio);
      else if (scia && this.prUnione[i] === SCIA) {
        const c = U.candelabro;
        this.zona(SPRITE_SCIA, this.prX[i], this.prY[i], c.raggio, this.prDanno[i] * c.danno, c.durata, c.intervallo, 0, 0, 0, false, false, 0, LUCE);
      }
      if (this.prVita[i] > 0) {
        this.cProiettile = i;
        this.cx = this.prX[i];
        this.cy = this.prY[i];
        this.orda.griglia.vicini(this.cx, this.cy, this.visitaProiettile);
        this.rompibili?.colpitoDa(this.cx, this.cy, this.prRaggio[i]);
        if (this.prFuoco[i]) this.chiazze?.accendi(this.cx, this.cy);
      }
      if (this.prVita[i] <= 0 || this.prResto[i] === 0) this.togliProiettile(i);
    }
    // Candela al potenziale: le fiammelle figlie, aperte a ventaglio, inseguono il nemico più vicino; non si dividono più
    const C = POTENZIALI.candela;
    for (let k = 0; k < this.divisioni; k++) {
      this.fonte = F.candela;
      for (let f = 0; f < C.figlie; f++) {
        const ang = this.dvA[k] + (f - (C.figlie - 1) / 2) * C.apertura;
        this.lancia(CANDELA.effetto, -1, CANDELA.velocita, C.vita, this.dvDanno[k], 1, CANDELA.raggio, C.sterzo, CANDELA.portata, false, ang, LUCE, this.dvX[k], this.dvY[k]);
        if (this.proiettili) this.prUnione[this.proiettili - 1] = FIGLIA;
      }
    }
    this.divisioni = 0;
  }

  /** Il fuoco fatuo gira a poco a poco verso il nemico più vicino a lui. */
  protected sterza(i: number, dt: number): void {
    const cerca = Math.min(this.prPortata[i], 300);
    this.cMigliore = -1;
    this.cDistanza = cerca * cerca;
    this.cx = this.prX[i];
    this.cy = this.prY[i];
    this.orda.griglia.nelRaggio(this.cx, this.cy, cerca, this.visitaVicino);
    const j = this.cMigliore;
    if (j < 0) return;
    const o = this.orda;
    const voluto = Math.atan2(o.y[j] - o.raggio[j] - this.prY[i], o.x[j] - this.prX[i]);
    const attuale = Math.atan2(this.prVY[i], this.prVX[i]);
    let diff = voluto - attuale;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const max = this.prSterzo[i] * dt;
    const nuovo = attuale + Math.max(-max, Math.min(max, diff));
    this.prVX[i] = Math.cos(nuovo) * this.prVel[i];
    this.prVY[i] = Math.sin(nuovo) * this.prVel[i];
  }

  /** Fuoco fatuo al potenziale: tocca un muro della stanza, rimbalza una volta e comincia a tornare. */
  protected rimbalzaSulMuro(i: number): void {
    const c = this.campo;
    if (!c) return;
    let tocca = false;
    if (this.prX[i] < c.x0 || this.prX[i] > c.x1) {
      this.prVX[i] = -this.prVX[i];
      this.prX[i] = Math.max(c.x0, Math.min(c.x1, this.prX[i]));
      tocca = true;
    }
    if (this.prY[i] < c.y0 || this.prY[i] > c.y1) {
      this.prVY[i] = -this.prVY[i];
      this.prY[i] = Math.max(c.y0, Math.min(c.y1, this.prY[i]));
      tocca = true;
    }
    if (!tocca) return;
    this.prRitorno[i] = 2;
    this.prVita[i] = Math.max(this.prVita[i], POTENZIALI.fuocoFatuo.ritorno); // ha il tempo di tornare
  }

  /** Fuoco fatuo al potenziale, dopo il muro: gira verso il nemico trapassato; se non c'è più, verso il più vicino. */
  protected tornaDa(i: number, dt: number): void {
    const o = this.orda, j = this.prBersaglio[i];
    if (j >= o.numero || o.id[j] !== this.prBersaglioId[i] || o.salute[j] <= 0) {
      this.sterza(i, dt);
      return;
    }
    const voluto = Math.atan2(o.y[j] - o.raggio[j] - this.prY[i], o.x[j] - this.prX[i]);
    const attuale = Math.atan2(this.prVY[i], this.prVX[i]);
    let diff = voluto - attuale;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const max = POTENZIALI.fuocoFatuo.sterzo * dt;
    const nuovo = attuale + Math.max(-max, Math.min(max, diff));
    this.prVX[i] = Math.cos(nuovo) * this.prVel[i];
    this.prVY[i] = Math.sin(nuovo) * this.prVel[i];
  }

  protected vicino(j: number): void {
    const o = this.orda;
    if (o.salute[j] <= 0 || o.fuoriSchermo(j)) return;
    const ex = o.x[j] - this.cx;
    const ey = o.y[j] - o.raggio[j] - this.cy;
    // élite e Mietitore sembrano più vicini: il fuoco fatuo li insegue per primi
    const d2 = (ex * ex + ey * ey) * (o.elite[j] || o.tipo[j] === ID_MIETITORE ? RUOLI.fuocoFatuoPreda : 1);
    if (d2 < this.cDistanza) {
      this.cDistanza = d2;
      this.cMigliore = j;
    }
  }

  protected toccaProiettile(j: number): void {
    const i = this.cProiettile;
    const o = this.orda;
    if (this.prResto[i] === 0 || o.salute[j] <= 0 || o.fuoriSchermo(j)) return;
    const ritorno = this.prRitorno[i];
    if (ritorno === 1) return; // Fuoco fatuo al potenziale: dopo il primo nemico va dritto al muro senza colpire
    const torna = ritorno === 2 && o.id[j] === this.prBersaglioId[i]; // di ritorno ricolpisce il nemico trapassato
    if (!torna) for (let k = 0; k < 4; k++) if (this.prColpiti[i * 4 + k] === o.id[j]) return;
    const ex = o.x[j] - this.cx;
    const ey = o.y[j] - o.raggio[j] - this.cy;
    const r = this.prRaggio[i] + o.raggio[j];
    if (ex * ex + ey * ey > r * r) return;
    for (let k = 0; k < 4; k++) {
      if (this.prColpiti[i * 4 + k] === 0) {
        this.prColpiti[i * 4 + k] = o.id[j];
        break;
      }
    }
    // Fuoco fatuo al potenziale: il primo nemico lo trapassa senza fermarsi, poi va dritto al muro e torna da lui
    const primo = this.prFonte[i] === F.fuocoFatuo && this.potenziale[F.fuocoFatuo] && ritorno === 0 && !!this.campo;
    if (primo) {
      this.prRitorno[i] = 1;
      this.prBersaglio[i] = j;
      this.prBersaglioId[i] = o.id[j];
    } else this.prResto[i]--;
    const v = this.prVel[i] || 1;
    this.cRX = this.prOX[i];
    this.cRY = this.prOY[i];
    this.cRAperta = REAZIONI.esorcismo.vita;
    // Fuoco fatuo al potenziale: il colpo del ritorno fa meno danno (POTENZIALI.fuocoFatuo.danno)
    const danno = torna ? this.prDanno[i] * POTENZIALI.fuocoFatuo.danno : this.prDanno[i];
    this.ferisci(j, danno, 0, this.prVX[i] / v, this.prVY[i] / v, this.prAff[i], STATI.probabilita, true, this.prReazione[i]);
    // Candela al potenziale: una fiammella (non già nata da un'altra) che uccide si divide (le figlie partono a fine passo)
    if (this.prFonte[i] === F.candela && this.potenziale[F.candela] && this.prUnione[i] !== FIGLIA && o.salute[j] <= 0 && this.divisioni < MAX_DIVISIONI) {
      const k = this.divisioni++;
      this.dvX[k] = this.cx;
      this.dvY[k] = this.cy;
      this.dvA[k] = Math.atan2(this.prVY[i], this.prVX[i]);
      this.dvDanno[k] = this.prDanno[i] * POTENZIALI.candela.danno; // le figlie fanno meno danno
    }
    if (this.prEsplode[i]) {
      this.effetto(BASTONE.esplosione, this.cx, this.cy, 0, PROFONDITA.sopra, EFFETTI.esplosione);
      this.accoda(ESPLOSIONE, j, this.prDanno[i] * RUOLI.esplosioneBastone.danno); // ferisce anche intorno
    }
  }

  protected togliProiettile(i: number): void {
    const r = this.prReazione[i];
    if (r) {
      // l'ultima fiammella di un Esorcismo chiude il suo numero
      let ultima = true;
      for (let k = 0; k < this.proiettili; k++) if (k !== i && this.prReazione[k] === r) ultima = false;
      if (ultima) this.effetti.chiudiReazione(r);
    }
    const u = --this.proiettili;
    const s = this.prSprite[i];
    s.setVisible(false);
    if (i === u) return;
    for (const a of this.prCampi) a[i] = a[u];
    this.prEsplode[i] = this.prEsplode[u];
    this.prAff[i] = this.prAff[u];
    this.prFonte[i] = this.prFonte[u];
    this.prFuoco[i] = this.prFuoco[u];
    this.prResto[i] = this.prResto[u];
    this.prRitorno[i] = this.prRitorno[u];
    this.prBersaglio[i] = this.prBersaglio[u];
    this.prBersaglioId[i] = this.prBersaglioId[u];
    this.prUnione[i] = this.prUnione[u];
    this.prReazione[i] = this.prReazione[u];
    this.prColpiti.copyWithin(i * 4, u * 4, u * 4 + 4);
    this.prSprite[i] = this.prSprite[u];
    this.prSprite[u] = s;
  }
}
