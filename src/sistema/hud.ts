/*
 * Interfaccia in partita (HTML sopra il gioco): orologio,
 * bordo rosso quando la salute è bassa, schermata di fine. La barra della salute è nel gioco, sotto il personaggio.
 */
export class Hud {
  private radice: HTMLElement;
  private orologio: HTMLElement;
  private bordo: HTMLElement;
  private fine: HTMLElement;
  private ultimoSecondo = -1;

  constructor(contenitore: HTMLElement, riprova: () => void) {
    this.radice = document.createElement('div');
    this.radice.className = 'hud';
    this.radice.innerHTML = `
      <div class="hud-bordo" hidden></div>
      <div class="hud-alto">
        <div class="hud-orologio">0:00</div>
      </div>
      <div class="hud-fine" hidden>
        <h1>La lanterna si è spenta</h1>
        <p class="hud-fine-tempo"></p>
        <button type="button">Riprova</button>
      </div>`;
    this.orologio = this.radice.querySelector('.hud-orologio')!;
    this.bordo = this.radice.querySelector('.hud-bordo')!;
    this.fine = this.radice.querySelector('.hud-fine')!;
    this.fine.querySelector('button')!.addEventListener('click', riprova);
    contenitore.append(this.radice);
  }

  /** Aggiorna solo quando qualcosa cambia davvero, per non toccare la pagina a ogni fotogramma. */
  aggiorna(secondi: number, saluteBassa: boolean): void {
    const s = Math.floor(secondi);
    if (s !== this.ultimoSecondo) {
      this.ultimoSecondo = s;
      this.orologio.textContent = tempo(s);
    }
    this.bordo.hidden = !saluteBassa;
  }

  mostraFine(secondi: number): void {
    this.fine.querySelector('.hud-fine-tempo')!.textContent = `Hai resistito ${tempo(Math.floor(secondi))}`;
    this.bordo.hidden = true;
    this.fine.hidden = false;
    this.fine.querySelector('button')!.focus();
  }

  distruggi(): void {
    this.radice.remove();
  }
}

function tempo(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
