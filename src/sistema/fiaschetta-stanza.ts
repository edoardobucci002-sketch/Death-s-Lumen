/*
 * La fiaschetta nel gioco a stanze, automatica (idea di Edoardo del 17/11: niente pulsante, lo schermo era affollato).
 * Quando la salute scende sotto FIASCHETTA_STANZA.soglia della massima, il personaggio beve da solo un sorso: cura
 * FIASCHETTA.cura della salute massima nell'arco di FIASCHETTA.durata secondi (le regole del survivor, in
 * src/data/sopravvivenza.ts). I sorsi sono contati; il Calice riverso alza i sorsi massimi. Nella fetta i sorsi non
 * tornano: torneranno con mini-boss, Boss e Sosta (proposta del pivot).
 */
import { FIASCHETTA } from '../data/sopravvivenza';
import { FIASCHETTA_STANZA } from '../data/stanze';
import { suona } from './audio';
import { vibra } from './mobile';

export class FiaschettaStanza {
  sorsi: number = FIASCHETTA.sorsi;
  massimo: number = FIASCHETTA.sorsi;
  bevuti = 0; // per il LAB e le prove
  /** Premi bevuti subito a fiaschetta piena (per il lampo verde dei pallini). */
  premiBevuti = 0;
  private curaRimasta = 0;

  /** Quanto manca alla fine del sorso in corso, da 1 (appena bevuto) a 0 (finito, o nessun sorso in corso). */
  get bevendo(): number {
    return Math.max(0, this.curaRimasta) / FIASCHETTA.durata;
  }

  /** Un passo: beve da solo se la salute è sotto la soglia; restituisce la parte di salute massima da curare in questo passo. */
  aggiorna(dt: number, salute: number, massima: number, puo: boolean): number {
    if (puo && this.curaRimasta <= 0 && this.sorsi > 0 && salute > 0 && salute < FIASCHETTA_STANZA.soglia * massima) this.bevi();
    if (this.curaRimasta <= 0) return 0;
    const t = Math.min(dt, this.curaRimasta);
    this.curaRimasta -= t;
    return (FIASCHETTA.cura * t) / FIASCHETTA.durata;
  }

  /** Beve un sorso (da solo, o dal LAB); restituisce true se ha bevuto. */
  bevi(): boolean {
    if (this.sorsi <= 0 || this.curaRimasta > 0) return false;
    this.sorsi--;
    this.bevuti++;
    this.curaRimasta = FIASCHETTA.durata;
    suona('cura');
    vibra('media');
    return true;
  }

  /**
   * Un premio di n sorsi (il Campanaro): vanno nella fiaschetta; quelli che non ci stanno, a fiaschetta piena, si bevono
   * subito (decisione di Edoardo del 17/11): curano come un sorso, senza togliere sorsi.
   */
  premio(n: number): void {
    for (let k = 0; k < n; k++) {
      if (this.sorsi < this.massimo) this.sorsi++;
      else {
        this.curaRimasta = FIASCHETTA.durata;
        this.bevuti++; // il suono «cura» lo fa già la scena con il premio
        this.premiBevuti++;
        vibra('media');
      }
    }
  }

  /** Sorsi massimi (il Calice riverso li alza): quelli in più arrivano pieni. */
  impostaMassimo(n: number): void {
    if (n > this.massimo) this.sorsi += n - this.massimo;
    this.massimo = n;
    this.sorsi = Math.min(this.sorsi, n);
  }

  /** Aggiunge sorsi, senza superare il massimo (LAB; più avanti mini-boss, Boss e Sosta). */
  ricarica(n: number): void {
    this.sorsi = Math.min(this.massimo, this.sorsi + n);
  }
}
