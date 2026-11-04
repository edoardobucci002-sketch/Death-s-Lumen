/*
 * Unioni (tappa 6 della proposta su oggetti e build): un'arma al livello massimo più un dono al livello
 * LIVELLO_DONO_UNIONE. Il reliquiario successivo offre l'unione: l'arma resta al suo livello e guadagna un effetto nuovo.
 * Ogni modifica qui va riportata anche nel GDD (sezione 8f). Tempi in secondi, distanze in pixel di gioco.
 */
import type { IdArma } from './armi';
import { PASSIVI, type IdDono } from './doni';

export const LIVELLO_DONO_UNIONE = 3;
/** Il livello che serve al dono: LIVELLO_DONO_UNIONE, o il suo massimo se è più basso (Lacrima di lumen arriva a 2). */
export const livelloDonoUnione = (id: IdDono): number => Math.min(LIVELLO_DONO_UNIONE, PASSIVI.find((q) => q.id === id)!.massimo);

export const NUMERI_UNIONI = {
  faro: { abbaglia: 0.5 }, // il cerchio abbaglia un nemico su due
  vanga: { fermo: 3 }, // chi è sotto il colpo resta fermo
  incensiere: { cura: 1 }, // salute al secondo dentro le nubi (una nube sola conta)
  verga: { ogni: 5, danno: 1 }, // ogni tot raffiche, colpo a tutti i maledetti (1 = il danno di un dardo)
  candelabro: { ogni: 0.12, danno: 0.4, raggio: 36, durata: 1, intervallo: 0.3 }, // scia: una fiamma ogni 0,12 s, 40% del danno
  falce: { sotto: 0.15 }, // uccide i nemici normali sotto questa parte di salute
  campana: { fermo: 0.8 }, // ogni rintocco ferma
  fuochi: { raggio: 120 }, // anime che i fuochi portano con sé
  acquasantiera: { uccisioni: 40 }, // uccisioni dentro le pozze per ogni sorso
  lama: { ritardo: 0.5 }, // il secondo fendente parte dove eri tanti secondi prima
} as const;

export type IdUnione = 'faroDeiMorti' | 'vangaDelCustode' | 'incensiereUltimaOra' | 'vergaDeiNomi' | 'candelabroFunebre' | 'falceDelMietitore' | 'campanaAMorto' | 'fuochiErranti' | 'acquasantiera' | 'lamaDellAlba';

export interface Unione { id: IdUnione; arma: IdArma; dono: IdDono; nome: string; testo: string }

export const UNIONI: Unione[] = [
  { id: 'faroDeiMorti', arma: 'lanterna', dono: 'stoppinoLungo', nome: 'Faro dei morti', testo: 'L\'arco diventa un cerchio tutto intorno e abbaglia molto più spesso.' },
  { id: 'vangaDelCustode', arma: 'pala', dono: 'scudoDiFerro', nome: 'Vanga del custode', testo: 'Ogni colpo pianta una lapide: chi è sotto resta fermo 3 s.' },
  { id: 'incensiereUltimaOra', arma: 'turibolo', dono: 'erbeAmare', nome: "Incensiere dell'ultima ora", testo: 'Dentro le nubi recuperi 1 salute al secondo.' },
  { id: 'vergaDeiNomi', arma: 'bastone', dono: 'clessidra', nome: 'Verga dei nomi', testo: 'Ogni 5ª raffica colpisce tutti i nemici maledetti sullo schermo.' },
  { id: 'candelabroFunebre', arma: 'candela', dono: 'cuoreDiCera', nome: 'Candelabro funebre', testo: 'Le fiammelle lasciano una scia che brucia.' },
  { id: 'falceDelMietitore', arma: 'falce', dono: 'saleNero', nome: 'Falce del Mietitore', testo: 'Uccide all\'istante i nemici normali sotto il 15% di salute.' },
  { id: 'campanaAMorto', arma: 'campana', dono: 'ceraVotiva', nome: 'Campana a morto', testo: 'Ogni rintocco ferma i nemici per 0,8 s.' },
  { id: 'fuochiErranti', arma: 'fuocoFatuo', dono: 'calamita', nome: 'Fuochi erranti', testo: 'I fuochi raccolgono le anime che attraversano.' },
  { id: 'acquasantiera', arma: 'acquaSanta', dono: 'lacrimaDiLumen', nome: 'Acquasantiera', testo: 'Ogni 40 uccisioni nelle pozze torna un sorso di fiaschetta.' },
  { id: 'lamaDellAlba', arma: 'lamaDiLuce', dono: 'aliDiFalena', nome: "Lama dell'alba", testo: 'Un secondo fendente parte da dove eri mezzo secondo prima.' },
];

export const unioneDi = (arma: IdArma): Unione | undefined => UNIONI.find((u) => u.arma === arma);
export const iconaUnione = (id: IdUnione): string => `Icona_Unione_${id}`;
