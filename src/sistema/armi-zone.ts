/*
 * Armi, secondo strato: le zone a terra che feriscono a intervalli (nubi del Turibolo, pozze dell'Acqua santa,
 * abilità speciali), le cure delle zone, la Lapide che cade dall'alto e l'aura del Velo funebre.
 */
import { SACRO, TERRA } from './orda';
import { RUOLI, STATI } from '../data/stati';
import { INTERRUTTORI } from './interruttori';
import { chiediPozza, pozzaCaricata } from './al-volo';
import { PROFONDITA } from './effetti';
import { EFFETTI } from '../data/effetti';
import { ABILITA } from '../data/abilita';
import { ACQUA_SANTA, COLPI, LAPIDE, TURIBOLO } from '../data/armi';
import { NUMERI_UNIONI as U } from '../data/unioni';
import { SPRITE_SCIA } from './segnaposto-oggetti';
import { NUBE, POZZA, chiavePozzaPixelfx, MAX_ZONE, MAX_LAPIDI, F } from './armi-colpo';
import { ArsenaleColpo } from './armi-colpo';

export abstract class ArsenaleZone extends ArsenaleColpo {
  /**
   * Salute al secondo che il personaggio riceve dalle zone che curano (Benedizione, nubi dell'Incensiere,
   * pozze dell'Acquasantiera) in cui si trova. saluteMassima serve alle pozze, che curano una parte di quella.
   */
  cura(saluteMassima: number): number {
    let c = 0, nube = 0, pozza = 0;
    for (let i = 0; i < this.zone; i++) {
      if (!this.zCura[i] && !(this.zCuraPozza[i] > 0)) continue;
      const dx = this.px - this.zX[i];
      const dy = this.py - this.zY[i];
      if (dx * dx + dy * dy > this.zR[i] * this.zR[i]) continue;
      if (this.zCuraPozza[i] > 0) pozza = U.acquasantiera.curaParte * saluteMassima; // le pozze che curano non si sommano
      if (!this.zCura[i]) continue;
      if (this.zTipo[i] === NUBE) nube = this.zCura[i]; // le nubi non si sommano
      else c += this.zCura[i];
    }
    this.curaPozzaOra = pozza;
    return c + nube + pozza;
  }

  /** Acquasantiera con la fiaschetta piena: la pozza i cura per qualche secondo (dura almeno fino ad allora). */
  protected pozzaCura(i: number): void {
    const A = U.acquasantiera;
    this.zCuraPozza[i] = A.curaDurata;
    this.zVita[i] = Math.max(this.zVita[i], A.curaDurata);
    this.zSprite[i].setTint(A.colore);
    this.pozzeCuranti++;
  }

  /** Prova pixelfx: è arrivata un'altra misura della Pozza; le pozze in campo passano a lei prima che la vecchia si scarichi. */
  protected cambiaPozza = (vecchia: string, nuova: string): void => {
    for (let i = 0; i < MAX_ZONE; i++) {
      const s = this.zSprite[i];
      if (s.texture.key !== vecchia) continue;
      if (i < this.zone) s.setTexture(nuova).play({ key: `${nuova}:idle`, repeat: -1 });
      else s.stop().setTexture(TURIBOLO.effetto);
    }
  };

  /** Laboratorio: una pozza dell'Acqua santa che cura, nel punto (x, y). */
  labPozzaCurativa(x: number, y: number): void {
    const l = ACQUA_SANTA.livelli[0];
    const prima = this.zone;
    this.zona(ACQUA_SANTA.effetto, x, y, l.raggio * (1 + this.bonus.area), 0, l.durata, ACQUA_SANTA.intervallo, 0, 0, 0, false, true, POZZA, SACRO);
    if (this.zone > prima) this.pozzaCura(prima);
  }

  /** Secondi che il personaggio passa dentro le nubi del Turibolo: 1 se è dentro una nube adesso (impresa del Velo funebre). */
  dentroNube(): boolean {
    for (let i = 0; i < this.zone; i++) {
      if (this.zTipo[i] !== NUBE) continue;
      const dx = this.px - this.zX[i], dy = this.py - this.zY[i];
      if (dx * dx + dy * dy <= this.zR[i] * this.zR[i]) return true;
    }
    return false;
  }

  // ——— Lapide ———
  protected lapideCade(x: number, y: number, raggio: number, danno: number): void {
    if (this.lapidi >= MAX_LAPIDI) return;
    const i = this.lapidi++;
    this.lpX[i] = x;
    this.lpY[i] = y;
    this.lpR[i] = raggio;
    this.lpDanno[i] = danno;
    // Lapide inchiodata: solo le lapidi vere (non quelle da vedere della Vanga) restano e seppelliscono
    this.lpChiodo[i] = danno && this.unite.lapide ? 1 : 0;
    this.lpResta[i] = this.lpChiodo[i] ? U.lapide.resta : LAPIDE.resta;
    this.lpVita[i] = LAPIDE.caduta + this.lpResta[i];
    this.lpCaduta[i] = 1;
    this.lpSprite[i].setVisible(true);
  }

  protected aggiornaLapidi(dt: number): void {
    for (let i = this.lapidi - 1; i >= 0; i--) {
      this.lpVita[i] -= dt;
      // Lapide inchiodata: a terra seppellisce chi la tocca (la pausa del Sepolto la fa marca())
      if (this.lpChiodo[i] && !this.lpCaduta[i] && this.lpVita[i] > 0) {
        this.fonte = F.lapide;
        this.cx = this.lpX[i];
        this.cy = this.lpY[i];
        this.orda.griglia.nelRaggio(this.cx, this.cy, U.lapide.tocca + 40, this.visitaChiodo);
      }
      if (this.lpCaduta[i] && this.lpVita[i] <= this.lpResta[i]) {
        this.lpCaduta[i] = 0;
        if (this.lpDanno[i]) this.prepara(0, this.lpX[i], this.lpY[i], this.lpR[i], this.lpDanno[i], 0);
        if (this.lpDanno[i]) {
          this.fonte = F.lapide;
          this.cAff = TERRA;
          this.cProb = RUOLI.lapideSeppellisce;
          this.orda.griglia.nelRaggio(this.cx, this.cy, this.lpR[i] + 40, this.visitaColpo);
          this.rompiForma();
          this.effetto(LAPIDE.effetto, this.cx, this.cy, this.lpR[i], PROFONDITA.aTerra, EFFETTI.impattoPala);
          if (this.toccati) this.effetti.scuoti(EFFETTI.scossaPala.forza, EFFETTI.scossaPala.durata);
        }
      }
      if (this.lpVita[i] > 0) continue;
      const u = --this.lapidi, s = this.lpSprite[i];
      s.setVisible(false);
      for (const a of this.lpCampi) a[i] = a[u];
      this.lpCaduta[i] = this.lpCaduta[u];
      this.lpChiodo[i] = this.lpChiodo[u];
      this.lpSprite[i] = this.lpSprite[u];
      this.lpSprite[u] = s;
    }
  }

  /** Lapide inchiodata: il nemico j tocca la lapide a terra in (cx, cy)? Allora è Sepolto (o reagisce), salvo la pausa del Sepolto. */
  protected toccaLapide(j: number): void {
    const o = this.orda;
    if (o.salute[j] <= 0 || o.fuoriSchermo(j)) return;
    const dx = o.x[j] - this.cx, dy = o.y[j] - this.cy, r = U.lapide.tocca + o.raggio[j];
    if (dx * dx + dy * dy > r * r) return;
    const k = o.marca(j, TERRA);
    if (k) {
      this.accoda(k, j, 0);
      this.reazioniFonti[F.lapide]++;
    } else if (o.marcato) this.statiFonti[F.lapide]++;
  }

  // ——— Zone ———
  protected zona(chiave: string, x: number, y: number, raggio: number, danno: number, durata: number, intervallo: number,
    rallenta: number, attira: number, cura: number, segue: boolean, ciclo: boolean, tipo = 0, aff = 0): void {
    if (this.zone >= MAX_ZONE) return;
    const i = this.zone++;
    this.zX[i] = x;
    this.zY[i] = y;
    this.zR[i] = raggio;
    this.zDanno[i] = danno;
    this.zVita[i] = durata * (1 + this.bonus.durata);
    this.zIntervallo[i] = intervallo;
    this.zTick[i] = 0;
    this.zRallenta[i] = rallenta;
    this.zAttira[i] = attira;
    this.zCura[i] = cura;
    this.zSegue[i] = segue ? 1 : 0;
    this.zTipo[i] = tipo;
    this.zAff[i] = aff;
    this.zFonte[i] = this.fonte;
    this.zCuraPozza[i] = 0;
    this.zPrimo[i] = this.fonte === F.abilita ? 1 : 0;
    const s = this.zSprite[i];
    if (chiave === SPRITE_SCIA) {
      s.stop();
      s.setTexture(chiave).setScale(2).setVisible(true);
      return;
    }
    // pixelfx: la Pozza nella misura più vicina, a grandezza naturale; la Sepoltura a gruppi di mani (effetti.ts, spenta)
    if (INTERRUTTORI.pixelfx && chiave === ACQUA_SANTA.effetto) {
      // si carica solo la misura in uso; finché arriva si usa quella in memoria, o la pozza di sempre
      chiediPozza(this.scena, chiavePozzaPixelfx(raggio), this.cambiaPozza);
      const k = pozzaCaricata();
      if (k) {
        s.setTexture(k).setScale(1).setVisible(true);
        s.play({ key: `${k}:idle`, repeat: -1 }); // l'animazione la crea al-volo.ts
        return;
      }
    }
    if (INTERRUTTORI.sepolturaPixelfx && chiave === ABILITA.sepoltura.effetto && this.scena.textures.exists('Pixelfx_Sepoltura_mani')) {
      s.stop();
      s.setVisible(false);
      this.effetti.maniSepoltura(x, y, raggio, this.zVita[i]);
      return;
    }
    s.setTexture(chiave).setScale(raggio / this.raggioDi(chiave)).setVisible(true);
    s.play(ciclo ? { key: `${chiave}:idle`, repeat: -1 } : { key: `${chiave}:idle`, duration: durata * 1000, repeat: 0 });
  }

  protected aggiornaZone(dt: number): void {
    this.cDt = dt;
    for (let i = this.zone - 1; i >= 0; i--) {
      this.zVita[i] -= dt;
      if (this.zCuraPozza[i] > 0 && (this.zCuraPozza[i] -= dt) <= 0) this.zSprite[i].clearTint();
      if (this.zVita[i] <= 0) {
        this.togliZona(i);
        continue;
      }
      if (this.zSegue[i]) {
        this.zX[i] = this.px;
        this.zY[i] = this.py;
      }
      this.cZona = i;
      if (this.zAttira[i]) this.orda.griglia.nelRaggio(this.zX[i], this.zY[i], this.zR[i] + 40, this.visitaAttira);
      this.zTick[i] -= dt;
      if (this.zTick[i] > 0) continue;
      this.zTick[i] += this.zIntervallo[i];
      this.fonte = this.zFonte[i];
      this.colpo++;
      this.cForza = this.zPrimo[i] === 1 && INTERRUTTORI.statiCerti; // primo scatto di un'abilità: reagiscono tutti, anche in quiete
      this.zPrimo[i] = 0;
      this.orda.griglia.nelRaggio(this.zX[i], this.zY[i], this.zR[i] + 40, this.visitaZona);
      this.cForza = false;
      this.rompibili?.colpitoDa(this.zX[i], this.zY[i], this.zR[i]);
    }
  }

  protected dentroZona(j: number): boolean {
    const o = this.orda;
    const i = this.cZona;
    const ex = o.x[j] - this.zX[i];
    const ey = o.y[j] - o.raggio[j] - this.zY[i];
    const r = this.zR[i] + o.raggio[j];
    return ex * ex + ey * ey <= r * r;
  }

  protected toccaZona(j: number): void {
    const o = this.orda;
    if (o.segno[j] === this.colpo || o.salute[j] <= 0 || o.fuoriSchermo(j) || !this.dentroZona(j)) return;
    const i = this.cZona;
    if (COLPI.zoneNonCumulative && this.zTipo[i]) {
      // già ferito da un'altra nube (o pozza) in questo intervallo: questa non si somma
      const pausa = this.zTipo[i] === NUBE ? o.pausaNube : o.pausaPozza;
      if (pausa[j] > 0) return;
      pausa[j] = this.zIntervallo[i] - 0.01;
    }
    o.segno[j] = this.colpo;
    this.cRitmo = true;
    this.ferisci(j, this.zDanno[i], 0, 0, 0, this.zAff[i], STATI.probabilitaZone, false);
    this.cRitmo = false;
    if (this.zTipo[i] === POZZA && this.unite.acquaSanta && o.salute[j] <= 0 && ++this.uccisiPozze >= U.acquasantiera.uccisioni && this.attesaSorso <= 0) {
      this.uccisiPozze = 0;
      this.attesaSorso = U.acquasantiera.pausa;
      if (this.fiaschettaPiena) this.pozzaCura(i); // il sorso non entrerebbe: si versa nella pozza
      else this.sorsiGuadagnati++;
    }
    if (this.zRallenta[i]) o.rallenta(j, this.zRallenta[i], this.zIntervallo[i] + 0.05, this.zTipo[i] === NUBE && !!this.unite.turibolo);
  }

  protected attiraZona(j: number): void {
    if (!this.dentroZona(j)) return;
    const i = this.cZona;
    this.orda.attira(j, this.zX[i], this.zY[i] + this.orda.raggio[j], this.zAttira[i] * this.cDt);
  }

  protected togliZona(i: number): void {
    const u = --this.zone;
    const s = this.zSprite[i];
    s.stop();
    s.setVisible(false).clearTint();
    if (i === u) return;
    for (const a of this.zCampi) a[i] = a[u];
    this.zSegue[i] = this.zSegue[u];
    this.zTipo[i] = this.zTipo[u];
    this.zAff[i] = this.zAff[u];
    this.zFonte[i] = this.zFonte[u];
    this.zPrimo[i] = this.zPrimo[u];
    this.zSprite[i] = this.zSprite[u];
    this.zSprite[u] = s;
  }

  /** Sudario: c'è almeno un nemico dentro il velo (Velo funebre unito)? Se sì, il velo prende il colore del Sudario. */
  sudario(): boolean {
    if (!this.unite.veloFunebre || !this.raggioVelo) return false;
    const o = this.orda, r = this.raggioVelo;
    let dentro = false;
    for (let j = 0; j < o.numero && !dentro; j++) {
      const dx = o.x[j] - this.px, dy = o.y[j] - o.raggio[j] - this.py, rr = r + o.raggio[j];
      if (o.salute[j] > 0 && dx * dx + dy * dy <= rr * rr) dentro = true;
    }
    return dentro;
  }

  /** Sudario: il velo si tinge mentre tiene la Grazia (disegno provvisorio). */
  tingiVelo(tiene: boolean): void {
    if (tiene) this.velo.setTint(U.sudario.colore);
    else this.velo.clearTint();
  }
}
