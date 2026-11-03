/*
 * Suoni sintetizzati al momento (come nella v0), in attesa di suoni veri.
 * Il browser permette l'audio solo dopo il primo tocco o tasto: il motore si accende lì.
 * Ogni suono ha un intervallo minimo, così cento colpi nello stesso istante non diventano un frastuono.
 * Acceso o spento si ricorda sul dispositivo (tasto M o menu di pausa).
 */
export type Suono = 'colpo' | 'sparo' | 'anima' | 'cera' | 'danno' | 'campana' | 'livello' | 'reliquiario' | 'mietitore' | 'cura' | 'speciale' | 'morte' | 'alba';

const PAUSA_MINIMA: Record<Suono, number> = {
  colpo: 0.05, sparo: 0.07, anima: 0.035, cera: 0.1, danno: 0.1, campana: 0.3, livello: 0.2, reliquiario: 0.3, mietitore: 1, cura: 0.4, speciale: 0.3, morte: 1, alba: 1,
};
const VOLUME = 0.35;

let ctx: AudioContext | null = null;
let uscita: GainNode | null = null;
let rumore: AudioBuffer | null = null;
let attivo = leggi() !== '0';
const ultimo = new Map<Suono, number>();
let serieAnime = 0; // anime raccolte di fila: il tono sale
let ultimaAnima = 0;

export function audioAttivo(): boolean {
  return attivo;
}

export function impostaAudio(acceso: boolean): void {
  attivo = acceso;
  try {
    localStorage.setItem('dl-audio', acceso ? '1' : '0');
  } catch {
    /* niente memoria: resta per questa partita */
  }
}

/** Accende il motore audio al primo gesto del giocatore. */
export function preparaAudio(): void {
  const sblocca = (): void => {
    if (!ctx) {
      ctx = new AudioContext();
      uscita = ctx.createGain();
      uscita.gain.value = VOLUME;
      uscita.connect(ctx.destination);
      rumore = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = rumore.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; // solo suono: non tocca il caso del gioco
    }
    if (ctx.state === 'suspended') void ctx.resume();
  };
  window.addEventListener('pointerdown', sblocca, { passive: true });
  window.addEventListener('keydown', sblocca);
}

export function suona(s: Suono): void {
  if (!attivo || !ctx || !uscita || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  if (t - (ultimo.get(s) ?? -1) < PAUSA_MINIMA[s]) return;
  ultimo.set(s, t);
  switch (s) {
    case 'colpo':
      fruscio(t, 0.06, 900, 0.5);
      break;
    case 'sparo':
      tono(t, 'square', 900, 320, 0.08, 0.12);
      break;
    case 'anima': {
      serieAnime = t - ultimaAnima < 0.6 ? Math.min(serieAnime + 1, 24) : 0;
      ultimaAnima = t;
      const f = 660 * 2 ** (serieAnime / 12);
      tono(t, 'sine', f, f, 0.07, 0.25);
      break;
    }
    case 'cera':
      tono(t, 'triangle', 880, 1175, 0.1, 0.18);
      break;
    case 'danno':
      tono(t, 'sawtooth', 180, 70, 0.18, 0.3);
      break;
    case 'campana':
      tono(t, 'sine', 523, 523, 1.2, 0.35);
      tono(t, 'sine', 1046, 1046, 0.7, 0.12);
      break;
    case 'livello':
      [523, 659, 784].forEach((f, k) => tono(t + k * 0.08, 'triangle', f, f, 0.12, 0.3));
      break;
    case 'reliquiario':
      [784, 988, 1175, 1568].forEach((f, k) => tono(t + k * 0.07, 'triangle', f, f, 0.15, 0.25));
      break;
    case 'mietitore':
      tono(t, 'sawtooth', 55, 50, 1.6, 0.35);
      tono(t, 'sawtooth', 58, 52, 1.6, 0.3);
      break;
    case 'cura':
      tono(t, 'sine', 440, 880, 0.3, 0.25);
      break;
    case 'speciale':
      fruscio(t, 0.4, 500, 0.4);
      tono(t, 'triangle', 330, 660, 0.4, 0.25);
      break;
    case 'morte':
      [392, 330, 262, 196].forEach((f, k) => tono(t + k * 0.18, 'triangle', f, f, 0.3, 0.3));
      break;
    case 'alba':
      [262, 330, 392, 523].forEach((f, k) => tono(t + k * 0.12, 'triangle', f, f, 1.2, 0.22));
      break;
  }
}

function tono(t: number, forma: OscillatorType, da: number, a: number, durata: number, volume: number): void {
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.type = forma;
  o.frequency.setValueAtTime(da, t);
  if (a !== da) o.frequency.exponentialRampToValueAtTime(a, t + durata);
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + durata);
  o.connect(g).connect(uscita!);
  o.start(t);
  o.stop(t + durata + 0.02);
}

function fruscio(t: number, durata: number, frequenza: number, volume: number): void {
  const n = ctx!.createBufferSource();
  n.buffer = rumore;
  const f = ctx!.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = frequenza;
  const g = ctx!.createGain();
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + durata);
  n.connect(f).connect(g).connect(uscita!);
  n.start(t);
  n.stop(t + durata + 0.02);
}

function leggi(): string | null {
  try {
    return localStorage.getItem('dl-audio');
  } catch {
    return null;
  }
}
