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

  private secchio(cx: number, cy: number): number {
    return (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & (SECCHI - 1);
  }
}
