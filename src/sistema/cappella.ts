/*
 * La Cappella (meta progressione, versione semplice a elenco): la Cera che hai, i ceri votivi da accendere
 * livello per livello e da spegnere a piacere, la Seconda candela, il conto dell'ultima veglia
 * e il codice di salvataggio da copiare o da incollare. Si apre dal menu; ogni acquisto si salva subito.
 */
import { CERI, COSTI_CERO, SBLOCCHI_OGGETTI, SBLOCCO_ROSARIO, SECONDA_CANDELA, type IdCero } from '../data/meta';
import { carica, codice, daCodice, salva, type Salvataggio } from './salvataggio';

export class Cappella {
  readonly radice: HTMLElement;
  private s: Salvataggio = carica();
  private confermaCodice = false; // il primo «Carica» chiede conferma, il secondo carica

  constructor(
    contenitore: HTMLElement,
    private chiudi: () => void,
    private cambiato: (s: Salvataggio) => void, // la Cera o gli sblocchi sono cambiati: il menu si aggiorna
  ) {
    this.radice = document.createElement('section');
    this.radice.className = 'cappella';
    this.radice.hidden = true;
    this.radice.setAttribute('aria-label', 'La Cappella');
    this.radice.addEventListener('click', this.clic);
    contenitore.append(this.radice);
  }

  get aperta(): boolean {
    return !this.radice.hidden;
  }

  apri(): void {
    this.s = carica();
    this.confermaCodice = false;
    this.disegna();
    this.radice.hidden = false;
    this.radice.querySelector<HTMLElement>('.cappella-chiudi')?.focus();
  }

  nascondi(): void {
    this.radice.hidden = true;
  }

  private disegna(): void {
    const s = this.s;
    const u = s.ultimaVeglia;
    const ceri = CERI.map((c) => {
      const l = s.ceri[c.id], spento = s.spenti.includes(c.id), costo = COSTI_CERO[l];
      const effetto = c.id === 'scelta' ? `+${Math.ceil(l * c.per)} rimescolate` : `${c.testo.startsWith('−') ? '−' : '+'}${Math.round(l * c.per * 100)}%`;
      return `<li class="cero${spento ? ' spento' : ''}">
        <div class="cero-testo"><h3>${c.nome}</h3><p>${c.testo} per livello${l ? ` · ora ${effetto}` : ''}</p></div>
        <span class="cero-livelli" aria-label="Livello ${l} su 5">${'<b></b>'.repeat(l)}${'<b class="vuota"></b>'.repeat(5 - l)}</span>
        <div class="cero-azioni">
          ${costo !== undefined ? `<button type="button" data-accendi="${c.id}" ${s.cera < costo ? 'disabled' : ''}>Accendi · ${costo} Cera</button>` : '<span class="cero-pieno">Al massimo</span>'}
          ${l ? `<button type="button" class="cero-interruttore" data-interruttore="${c.id}" aria-pressed="${!spento}">${spento ? 'Spento' : 'Acceso'}</button>` : ''}
        </div>
      </li>`;
    }).join('');
    const sc = SECONDA_CANDELA;
    const sr = SBLOCCO_ROSARIO;
    const rosario = `<li class="cero">
          <div class="cero-testo"><h3>Il Rosario</h3><p>Nei reliquiari trovi amuleti con un vantaggio e un rovescio. Si sblocca così: ${sr.impresa.toLowerCase()}, oppure con la Cera.</p></div>
          <span class="cero-livelli" aria-label="${s.rosario ? 'Sbloccato' : 'Bloccato'}">${s.rosario ? '<b></b>' : '<b class="vuota"></b>'}</span>
          <div class="cero-azioni">
            ${s.rosario ? '<span class="cero-pieno">Sbloccato</span>' : `<button type="button" data-compra-rosario ${s.cera < sr.cera ? 'disabled' : ''}>Sblocca · ${sr.cera} Cera</button>`}
          </div>
        </li>`;
    const oggetti = SBLOCCHI_OGGETTI.map((o) => {
      const preso = s.oggetti.includes(o.id);
      const come = o.impresa && o.cera ? `Impresa: ${o.impresa.toLowerCase()}, oppure con la Cera.` : o.impresa ? `Impresa: ${o.impresa.toLowerCase()}.` : 'Si sblocca con la Cera.';
      return `<li class="cero">
          <div class="cero-testo"><h3>${o.nome} · ${o.tipo === 'arma' ? 'arma' : 'dono'}</h3><p>${o.testo}${preso ? '' : ` ${come}`}</p></div>
          <span class="cero-livelli" aria-label="${preso ? 'Sbloccato' : 'Bloccato'}">${preso ? '<b></b>' : '<b class="vuota"></b>'}</span>
          <div class="cero-azioni">
            ${preso ? '<span class="cero-pieno">Sbloccato</span>' : o.cera ? `<button type="button" data-compra-oggetto="${o.id}" ${s.cera < o.cera ? 'disabled' : ''}>Sblocca · ${o.cera} Cera</button>` : '<span class="cero-pieno">Da conquistare</span>'}
          </div>
        </li>`;
    }).join('');
    this.radice.innerHTML = `
      <header class="cappella-testa">
        <h2>La Cappella</h2>
        <p class="cappella-cera">${s.cera} Cera</p>
        <button type="button" class="cappella-chiudi">Torna ai personaggi</button>
      </header>
      <p class="cappella-intro">L'ultimo luogo ancora acceso. La Cera che riporti dalle veglie tiene vive le sue candele: ogni cero acceso ti accompagna in tutte le veglie, con ogni personaggio.</p>
      ${u ? `<section class="cappella-veglia"><h3>Ultima veglia: +${u.totale} Cera</h3><ul>${u.voci.map((v) => `<li><span>${v.nome}</span><span>+${v.cera}</span></li>`).join('')}</ul>${u.sbloccato ? `<p>Sbloccato: ${u.sbloccato}</p>` : ''}</section>` : ''}
      <ul class="cappella-ceri">${ceri}
        ${rosario}
        ${oggetti}
        <li class="cero${s.secondaCandelaSpenta ? ' spento' : ''}">
          <div class="cero-testo"><h3>Seconda candela</h3><p>Una volta per veglia, a salute zero ti rialzi con il ${Math.round(sc.salute * 100)}% della salute.</p></div>
          <span class="cero-livelli" aria-label="${s.secondaCandela ? 'Accesa' : 'Spenta'}">${s.secondaCandela ? '<b></b>' : '<b class="vuota"></b>'}</span>
          <div class="cero-azioni">
            ${s.secondaCandela ? `<button type="button" class="cero-interruttore" data-candela aria-pressed="${!s.secondaCandelaSpenta}">${s.secondaCandelaSpenta ? 'Spenta' : 'Accesa'}</button>` : `<button type="button" data-compra-candela ${s.cera < sc.costo ? 'disabled' : ''}>Accendi · ${sc.costo} Cera</button>`}
          </div>
        </li>
      </ul>
      <section class="cappella-codice">
        <h3>Codice di salvataggio</h3>
        <p>Copialo e tienilo da parte: se cambi telefono o passi dal link all'app, incollalo qui per ritrovare Cera, ceri e personaggi.</p>
        <button type="button" data-copia>Copia il codice</button>
        <label for="cappella-incolla">Incolla un codice</label>
        <textarea id="cappella-incolla" rows="2" spellcheck="false"></textarea>
        <button type="button" data-carica>${this.confermaCodice ? 'Conferma: sostituisci i progressi di questo dispositivo' : 'Carica il codice'}</button>
        <p class="cappella-messaggio" aria-live="polite"></p>
      </section>`;
  }

  private messaggio(testo: string): void {
    const m = this.radice.querySelector('.cappella-messaggio');
    if (m) m.textContent = testo;
  }

  private salvaECambia(): void {
    salva(this.s);
    this.cambiato(this.s);
    this.disegna();
  }

  private clic = async (e: Event): Promise<void> => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    const s = this.s;
    if (b.classList.contains('cappella-chiudi')) {
      this.chiudi();
    } else if (b.dataset.accendi) {
      const id = b.dataset.accendi as IdCero, costo = COSTI_CERO[s.ceri[id]];
      if (costo === undefined || s.cera < costo) return;
      s.cera -= costo;
      s.ceri[id]++;
      this.salvaECambia();
    } else if (b.dataset.interruttore) {
      const id = b.dataset.interruttore as IdCero;
      s.spenti = s.spenti.includes(id) ? s.spenti.filter((x) => x !== id) : [...s.spenti, id];
      this.salvaECambia();
    } else if ('compraRosario' in b.dataset) {
      if (s.cera < SBLOCCO_ROSARIO.cera) return;
      s.cera -= SBLOCCO_ROSARIO.cera;
      s.rosario = true;
      this.salvaECambia();
    } else if (b.dataset.compraOggetto) {
      const o = SBLOCCHI_OGGETTI.find((x) => x.id === b.dataset.compraOggetto);
      if (!o?.cera || s.cera < o.cera || s.oggetti.includes(o.id)) return;
      s.cera -= o.cera;
      s.oggetti.push(o.id);
      this.salvaECambia();
    } else if ('compraCandela' in b.dataset) {
      if (s.cera < SECONDA_CANDELA.costo) return;
      s.cera -= SECONDA_CANDELA.costo;
      s.secondaCandela = true;
      this.salvaECambia();
    } else if ('candela' in b.dataset) {
      s.secondaCandelaSpenta = !s.secondaCandelaSpenta;
      this.salvaECambia();
    } else if ('copia' in b.dataset) {
      const testo = codice(s);
      try {
        await navigator.clipboard.writeText(testo);
        this.messaggio('Codice copiato.');
      } catch {
        const t = this.radice.querySelector<HTMLTextAreaElement>('#cappella-incolla')!;
        t.value = testo;
        t.select();
        this.messaggio('Il codice è nel riquadro, selezionato: copialo a mano.');
      }
    } else if ('carica' in b.dataset) {
      const testo = this.radice.querySelector<HTMLTextAreaElement>('#cappella-incolla')!.value;
      const letto = daCodice(testo);
      if (!letto) {
        this.messaggio('Questo non è un codice di salvataggio: deve cominciare con DL1-.');
        return;
      }
      if (!this.confermaCodice) {
        this.confermaCodice = true;
        this.disegna();
        this.radice.querySelector<HTMLTextAreaElement>('#cappella-incolla')!.value = testo;
        this.messaggio(`Il codice ha ${letto.cera} Cera. Premi di nuovo per sostituire i progressi di questo dispositivo.`);
        return;
      }
      this.s = letto;
      this.confermaCodice = false;
      this.salvaECambia();
      this.messaggio('Progressi caricati.');
    }
  };
}
