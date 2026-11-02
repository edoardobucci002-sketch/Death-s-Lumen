/*
 * Interfaccia in partita (HTML sopra il gioco): orologio, barra della salute,
 * bordo rosso quando la salute è bassa, schermata di fine. L'HUD completo arriva nella M6.
 */
export class Hud {
  private radice: HTMLElement;
  private orologio: HTMLElement;
  private barra: HTMLElement;
  private bordo: HTMLElement;
  private fine: HTMLElement;
  private ultimoSecondo = -1;
  private ultimaParte = -1;

  constructor(contenitore: HTMLElement, riprova: () => void) {
    this.radice = document.createElement('div');
    this.radice.className = 'hud';
    this.radice.innerHTML = `
      <div class="hud-bordo" hidden></div>
      <div class="hud-alto">
        <div class="hud-orologio">0:00</div>
        <div class="hud-salute"><div class="hud-salute-piena"></div></div>
      </div>
      <div class="hud-fine" hidden>
        <h1>La lanterna si è spenta</h1>
        <p class="hud-fine-tempo"></p>
        <button type="button">Riprova</button>
      </div>`;
    this.orologio = this.radice.querySelector('.hud-orologio')!;
    this.barra = this.radice.querySelector('.hud-salute-piena')!;
    this.bordo = this.radice.querySelector('.hud-bordo')!;
    this.fine = this.radice.querySelector('.hud-fine')!;
    this.fine.querySelector('button')!.addEventListener('click', riprova);
    contenitore.append(this.radice);
  }

  /** Aggiorna solo quando qualcosa cambia davvero, per non toccare la pagina a ogni fotogramma. */
  aggiorna(secondi: number, parteSalute: number, saluteBassa: boolean): void {
    const s = Math.floor(secondi);
    if (s !== this.ultimoSecondo) {
      this.ultimoSecondo = s;
      this.orologio.textContent = tempo(s);
    }
    const p = Math.max(0, Math.round(parteSalute * 100));
    if (p !== this.ultimaParte) {
      this.ultimaParte = p;
      this.barra.style.width = `${p}%`;
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
