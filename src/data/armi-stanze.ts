/*
 * Le armi del gioco a stanze: 5 livelli e un danno a intervallo (decisioni di Edoardo del 13/11 e del 14/11).
 * Il survivor resta con le sue tabelle a 8 livelli (src/data/armi.ts): qui ci sono solo i numeri del gioco a stanze.
 *
 * - «danno» è il colpo più debole e «dannoMassimo» il più forte: ogni colpo tira a caso tra i due (con il generatore
 *   con seme), poi si applicano i doni in percentuale (Sale nero, Grazia) e il colpo critico.
 * - Ogni arma ha il suo carattere: le armi pesanti hanno un intervallo largo (Lapide, Campana), le aure e le pozze
 *   uno stretto e piccolo (Velo funebre, Acqua santa), perché feriscono tante volte al secondo.
 * - Il livello 5 è il «potenziale» dell'arma (proposta del pivot): sblocca quello che nel survivor dava il livello 8.
 * - I campi che non sono livelli (velocità dei proiettili, rimbalzi, spinta…) sono quelli del survivor.
 * - «testo» è la riga della carta a quel livello: «+4–6 danno» quando crescono il minimo e il massimo.
 *
 * Tutti i numeri sono proposte di Claude del 14/11, da rivedere con le prove di Edoardo.
 */
import {
  ACQUA_SANTA, CAMPANA, CANDELA, CORVO, FALCE, FUOCO_FATUO, LAMA_DI_LUCE, LANTERNA, LAPIDE, ROSARIO_SPEZZATO, SAMPIETRINI, VELO_FUNEBRE,
  type AcquaSanta, type Arma, type Campana, type Candela, type Corvo, type Falce, type FuocoFatuo, type LamaDiLuce, type Lanterna,
  type Lapide, type RosarioSpezzato, type Sampietrini, type VeloFunebre,
} from './armi';

/** Un'arma del survivor con i livelli del gioco a stanze: ogni livello ha anche il danno massimo. */
type ConIntervallo<A extends Arma> = Omit<A, 'livelli'> & { livelli: (A['livelli'][number] & { dannoMassimo: number })[] };

/**
 * La Lanterna a mano del Lampionaio (attacco a tasto, src/sistema/attacco.ts). La ricarica è quella del colpo a mano
 * (la mossa dell'animazione attack dura 0,385 s); raggio 136, 160 e 183 sono le tre misure del Fendente pixelfx.
 * Al livello 5 colpisce anche alle spalle.
 */
export const LANTERNA_STANZE: ConIntervallo<Lanterna> = {
  ...LANTERNA,
  livelli: [
    { ricarica: 0.45, danno: 12, dannoMassimo: 18, raggio: 136, ampiezza: 132, spalle: false, testo: 'Colpo corto, ampia gittata frontale.' },
    { ricarica: 0.45, danno: 16, dannoMassimo: 24, raggio: 136, ampiezza: 132, spalle: false, testo: '+4–6 danno.' },
    { ricarica: 0.4, danno: 16, dannoMassimo: 24, raggio: 160, ampiezza: 132, spalle: false, testo: 'Raggio maggiore, colpi più frequenti.' },
    { ricarica: 0.4, danno: 21, dannoMassimo: 31, raggio: 183, ampiezza: 166, spalle: false, testo: '+5–7 danno, raggio e ampiezza maggiori.' },
    { ricarica: 0.4, danno: 26, dannoMassimo: 38, raggio: 183, ampiezza: 166, spalle: true, testo: '+5–7 danno, colpisce anche alle spalle.' },
  ],
};

const CANDELA_STANZE: ConIntervallo<Candela> = {
  ...CANDELA,
  livelli: [
    { ricarica: 0.95, danno: 6, dannoMassimo: 9, quantita: 1, trapassa: 1, testo: 'Lancia fiammelle verso il nemico più vicino.' },
    { ricarica: 0.95, danno: 6, dannoMassimo: 9, quantita: 2, trapassa: 1, testo: '+1 fiammella.' },
    { ricarica: 0.95, danno: 8, dannoMassimo: 12, quantita: 2, trapassa: 2, testo: '+2–3 danno, le fiammelle trapassano un nemico in più.' },
    { ricarica: 0.75, danno: 8, dannoMassimo: 12, quantita: 3, trapassa: 2, testo: '+1 fiammella, ricarica più rapida.' },
    { ricarica: 0.75, danno: 11, dannoMassimo: 16, quantita: 4, trapassa: 3, testo: '+1 fiammella, +3–4 danno, trapassano di più.' },
  ],
};

const FALCE_STANZE: ConIntervallo<Falce> = {
  ...FALCE,
  livelli: [
    { quantita: 1, danno: 5, dannoMassimo: 7, raggio: 132, giri: 0.45, testo: 'Una falce spettrale ti ruota intorno.' },
    { quantita: 2, danno: 5, dannoMassimo: 7, raggio: 132, giri: 0.45, testo: '+1 falce.' },
    { quantita: 2, danno: 7, dannoMassimo: 9, raggio: 160, giri: 0.45, testo: '+2 danno, raggio più ampio.' },
    { quantita: 3, danno: 7, dannoMassimo: 9, raggio: 160, giri: 0.45, testo: '+1 falce.' },
    { quantita: 4, danno: 9, dannoMassimo: 12, raggio: 160, giri: 0.59, testo: '+1 falce, +2–3 danno, rotazione più veloce.' },
  ],
};

const CAMPANA_STANZE: ConIntervallo<Campana> = {
  ...CAMPANA,
  livelli: [
    { ricarica: 2.6, danno: 14, dannoMassimo: 24, raggio: 197, doppio: false, testo: 'Rintocchi che respingono e feriscono tutto intorno.' },
    { ricarica: 2.6, danno: 19, dannoMassimo: 31, raggio: 197, doppio: false, testo: '+5–7 danno.' },
    { ricarica: 2.2, danno: 19, dannoMassimo: 31, raggio: 240, doppio: false, testo: 'Raggio più ampio, rintocchi più frequenti.' },
    { ricarica: 2.2, danno: 25, dannoMassimo: 41, raggio: 240, doppio: false, testo: '+6–10 danno.' },
    { ricarica: 1.8, danno: 30, dannoMassimo: 50, raggio: 240, doppio: true, testo: '+5–9 danno, doppio rintocco.' },
  ],
};

const FUOCO_FATUO_STANZE: ConIntervallo<FuocoFatuo> = {
  ...FUOCO_FATUO,
  livelli: [
    { ricarica: 1.3, quantita: 1, danno: 7, dannoMassimo: 11, trapassa: 1, testo: 'Fuochi fatui che inseguono i nemici, prima élite e capi.' },
    { ricarica: 1.3, quantita: 2, danno: 7, dannoMassimo: 11, trapassa: 1, testo: '+1 fuoco.' },
    { ricarica: 1.3, quantita: 2, danno: 10, dannoMassimo: 15, trapassa: 1, testo: '+3–4 danno.' },
    { ricarica: 1, quantita: 3, danno: 10, dannoMassimo: 15, trapassa: 1, testo: '+1 fuoco, ricarica più rapida.' },
    { ricarica: 1, quantita: 4, danno: 13, dannoMassimo: 20, trapassa: 3, testo: '+1 fuoco, +3–5 danno, trapassano tre nemici.' },
  ],
};

/** Le pozze feriscono ogni 0,3 s (ACQUA_SANTA.intervallo): danno piccolo e stretto. */
const ACQUA_SANTA_STANZE: ConIntervallo<AcquaSanta> = {
  ...ACQUA_SANTA,
  livelli: [
    { ricarica: 2.8, quantita: 1, danno: 1, dannoMassimo: 2, raggio: 89, durata: 2.6, testo: 'Fiale che lasciano pozze benedette sui nemici.' },
    { ricarica: 2.8, quantita: 2, danno: 1, dannoMassimo: 2, raggio: 89, durata: 2.6, testo: '+1 fiala.' },
    { ricarica: 2.8, quantita: 2, danno: 2, dannoMassimo: 3, raggio: 108, durata: 2.6, testo: '+1 danno, pozze più grandi.' },
    { ricarica: 2.3, quantita: 3, danno: 2, dannoMassimo: 3, raggio: 108, durata: 3.2, testo: '+1 fiala, ricarica più rapida, pozze più durature.' },
    { ricarica: 2.3, quantita: 4, danno: 3, dannoMassimo: 4, raggio: 129, durata: 4.2, testo: '+1 fiala, +1 danno, pozze più grandi e durature.' },
  ],
};

const LAMA_DI_LUCE_STANZE: ConIntervallo<LamaDiLuce> = {
  ...LAMA_DI_LUCE,
  livelli: [
    { ricarica: 1.15, danno: 12, dannoMassimo: 20, lunghezza: 259, spalle: false, testo: 'Un fendente di luce davanti a te.' },
    { ricarica: 1.15, danno: 12, dannoMassimo: 20, lunghezza: 259, spalle: true, testo: 'Colpisce anche alle spalle.' },
    { ricarica: 1, danno: 16, dannoMassimo: 26, lunghezza: 259, spalle: true, testo: '+4–6 danno, ricarica più rapida.' },
    { ricarica: 1, danno: 16, dannoMassimo: 26, lunghezza: 329, spalle: true, testo: 'Fendente più lungo.' },
    { ricarica: 0.85, danno: 22, dannoMassimo: 34, lunghezza: 329, spalle: true, testo: '+6–8 danno, ricarica più rapida.' },
  ],
};

/** Arma pesante: l'intervallo più largo (a volte schiaccia un Ricaduto, a volte no). */
const LAPIDE_STANZE: ConIntervallo<Lapide> = {
  ...LAPIDE,
  livelli: [
    { ricarica: 3.2, danno: 30, dannoMassimo: 70, raggio: 84, quantita: 1, testo: 'Cade sul nemico con più salute in vista e lo seppellisce.' },
    { ricarica: 3.2, danno: 40, dannoMassimo: 90, raggio: 96, quantita: 1, testo: '+10–20 danno, impatto più largo.' },
    { ricarica: 2.8, danno: 40, dannoMassimo: 90, raggio: 96, quantita: 1, testo: 'Cade più spesso.' },
    { ricarica: 2.8, danno: 50, dannoMassimo: 110, raggio: 96, quantita: 2, testo: '+1 lapide, +10–20 danno.' },
    { ricarica: 2.4, danno: 70, dannoMassimo: 150, raggio: 110, quantita: 2, testo: '+20–40 danno, cade più spesso, impatto più largo.' },
  ],
};

const ROSARIO_SPEZZATO_STANZE: ConIntervallo<RosarioSpezzato> = {
  ...ROSARIO_SPEZZATO,
  livelli: [
    { ricarica: 1.6, danno: 6, dannoMassimo: 10, rimbalzi: 4, quantita: 1, testo: 'Un grano rimbalza tra i nemici vicini e li maledice.' },
    { ricarica: 1.6, danno: 8, dannoMassimo: 13, rimbalzi: 4, quantita: 1, testo: '+2–3 danno.' },
    { ricarica: 1.4, danno: 8, dannoMassimo: 13, rimbalzi: 5, quantita: 1, testo: '+1 rimbalzo, ricarica più rapida.' },
    { ricarica: 1.4, danno: 8, dannoMassimo: 13, rimbalzi: 6, quantita: 2, testo: '+1 grano, +1 rimbalzo.' },
    { ricarica: 1.2, danno: 12, dannoMassimo: 19, rimbalzi: 8, quantita: 2, testo: '+4–6 danno, +2 rimbalzi.' },
  ],
};

const CORVO_STANZE: ConIntervallo<Corvo> = {
  ...CORVO,
  livelli: [
    { ricarica: 1, danno: 8, dannoMassimo: 14, quantita: 1, testo: 'Becca il nemico più vicino e ti riporta le anime intorno a lui.' },
    { ricarica: 1, danno: 11, dannoMassimo: 18, quantita: 1, testo: '+3–4 danno.' },
    { ricarica: 0.9, danno: 11, dannoMassimo: 18, quantita: 2, testo: '+1 corvo, becca più spesso.' },
    { ricarica: 0.9, danno: 14, dannoMassimo: 22, quantita: 2, testo: '+3–4 danno.' },
    { ricarica: 0.75, danno: 14, dannoMassimo: 22, quantita: 3, testo: '+1 corvo, becca più spesso.' },
  ],
};

/** Aura che ferisce a ogni ricarica: nel survivor (7 ogni 0,5 s) era fin troppo forte nelle prime stanze (Edoardo, 14/11). */
const VELO_FUNEBRE_STANZE: ConIntervallo<VeloFunebre> = {
  ...VELO_FUNEBRE,
  livelli: [
    { ricarica: 0.5, danno: 2, dannoMassimo: 3, raggio: 110, testo: 'Un\'aura intorno a te consacra chi entra.' },
    { ricarica: 0.5, danno: 3, dannoMassimo: 4, raggio: 110, testo: '+1 danno.' },
    { ricarica: 0.5, danno: 3, dannoMassimo: 4, raggio: 125, testo: 'Aura più grande.' },
    { ricarica: 0.4, danno: 3, dannoMassimo: 4, raggio: 140, testo: 'Aura più grande, colpisce più spesso.' },
    { ricarica: 0.4, danno: 4, dannoMassimo: 6, raggio: 160, testo: '+1–2 danno, aura più grande.' },
  ],
};

const SAMPIETRINI_STANZE: ConIntervallo<Sampietrini> = {
  ...SAMPIETRINI,
  livelli: [
    { ricarica: 1.5, quantita: 1, rimbalzi: 1, danno: 8, dannoMassimo: 14, testo: 'Lancia un sampietrino sul nemico più vicino: colpisce, rimbalza in avanti e colpisce di nuovo.' },
    { ricarica: 1.5, quantita: 2, rimbalzi: 1, danno: 8, dannoMassimo: 14, testo: '+1 sampietrino.' },
    { ricarica: 1.35, quantita: 2, rimbalzi: 1, danno: 11, dannoMassimo: 18, testo: '+3–4 danno, lancia più spesso.' },
    { ricarica: 1.35, quantita: 2, rimbalzi: 2, danno: 11, dannoMassimo: 18, testo: '+1 rimbalzo.' },
    { ricarica: 1.2, quantita: 3, rimbalzi: 2, danno: 14, dannoMassimo: 22, testo: '+1 sampietrino, +3–4 danno.' },
  ],
};

/** Gli Echi che le carte del gioco a stanze possono offrire (le armi comuni del survivor, con i numeri di qui). */
export const ECHI_STANZE: Arma[] = [
  CANDELA_STANZE, FALCE_STANZE, CAMPANA_STANZE, FUOCO_FATUO_STANZE, ACQUA_SANTA_STANZE, LAMA_DI_LUCE_STANZE, LAPIDE_STANZE,
  ROSARIO_SPEZZATO_STANZE, CORVO_STANZE, VELO_FUNEBRE_STANZE, SAMPIETRINI_STANZE,
] as Arma[];

/** Il danno più forte di un livello: per le armi con l'intervallo è dannoMassimo, altrimenti il danno stesso. */
export function dannoMassimo(livello: { danno: number }): number {
  const m = (livello as { dannoMassimo?: number }).dannoMassimo;
  return typeof m === 'number' ? m : livello.danno;
}
