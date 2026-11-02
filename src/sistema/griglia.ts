/*
 * Griglia spaziale: divide il mondo in celle e ricorda chi sta in ogni cella,
 * così per sapere chi è vicino a un punto si guardano solo le celle intorno
 * invece di tutti i nemici. Niente allocazioni: tutto in array preparati all'inizio.
 */
const SECCHI = 4096; // potenza di 2: le celle del mondo si ripartiscono su questi secchi

export class Griglia {
  private testa = new Int32Array(SECCHI);
  private seguente: Int32Array;

  constructor(
    readonly cella: number,
    capienza: number,
  ) {
    this.seguente = new Int32Array(capienza);
  }

  svuota(): void {
    this.testa.fill(-1);
  }

  inserisci(i: number, x: number, y: number): void {
    const s = this.secchio(Math.floor(x / this.cella), Math.floor(y / this.cella));
    this.seguente[i] = this.testa[s];
    this.testa[s] = i;
  }

  /**
   * Chiama visita(j) per ogni elemento nelle 3×3 celle intorno a (x, y).
   * Può includere anche elementi un po' più lontani (celle che condividono il secchio): chi la usa misura la distanza.
   */
  vicini(x: number, y: number, visita: (j: number) => void): void {
    const cx = Math.floor(x / this.cella);
    const cy = Math.floor(y / this.cella);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        for (let j = this.testa[this.secchio(cx + ox, cy + oy)]; j !== -1; j = this.seguente[j]) visita(j);
      }
    }
  }

  /**
   * Chiama visita(j) per ogni elemento nelle celle che toccano il cerchio di centro (x, y) e raggio r.
   * Lo stesso elemento può comparire due volte (celle che condividono il secchio): chi la usa deve segnarsi chi ha già visto.
   */
  nelRaggio(x: number, y: number, r: number, visita: (j: number) => void): void {
    const x0 = Math.floor((x - r) / this.cella);
    const x1 = Math.floor((x + r) / this.cella);
    const y0 = Math.floor((y - r) / this.cella);
    const y1 = Math.floor((y + r) / this.cella);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        for (let j = this.testa[this.secchio(cx, cy)]; j !== -1; j = this.seguente[j]) visita(j);
      }
    }
  }

  private secchio(cx: number, cy: number): number {
    return (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & (SECCHI - 1);
  }
}
