/*
 * Abilità speciali: una per personaggio, si attivano con Spazio o con il pulsante in basso a sinistra.
 * Valori dal GDD (docs/GDD_base.md, sezione 3), raggi e attrazione della v0 × 2,35.
 * Danno, area e ricarica seguono i doni passivi. Ogni modifica qui va riportata anche nel GDD.
 */
export type IdAbilita = 'cerchioDiLuce' | 'sepoltura' | 'benedizione' | 'ritoProibito';

export interface Abilita {
  id: IdAbilita;
  nome: string;
  effetto: string; // EFFETTI/<Nome>/<Nome>_V#.aseprite
  icona: string;
  ricarica: number;
  durata: number;
  raggio: number;
  danno: number;
  intervallo: number; // ferisce ogni tot secondi
  segue: boolean; // si muove con il personaggio, invece di restare dove è nata
  rallenta: number; // 0,55 = i nemici dentro vanno più lenti del 55%
  cura: number; // salute al secondo se il personaggio ci sta dentro
  attira: number; // velocità con cui tira i nemici verso il centro
  animazione: 'distesa' | 'ciclo'; // i fotogrammi coprono tutta la durata, oppure si ripetono
}

export const ABILITA: Record<IdAbilita, Abilita> = {
  cerchioDiLuce: { id: 'cerchioDiLuce', nome: 'Cerchio di luce', effetto: 'Cerchio_di_luce', icona: 'Icona_Cerchio_di_luce',
    ricarica: 14, durata: 5, raggio: 216, danno: 6, intervallo: 0.25, segue: true, rallenta: 0.55, cura: 0, attira: 0, animazione: 'distesa' },
  sepoltura: { id: 'sepoltura', nome: 'Sepoltura', effetto: 'Sepoltura', icona: 'Icona_Sepoltura',
    ricarica: 16, durata: 4.5, raggio: 247, danno: 11, intervallo: 0.3, segue: false, rallenta: 0.8, cura: 0, attira: 0, animazione: 'distesa' },
  benedizione: { id: 'benedizione', nome: 'Benedizione', effetto: 'Benedizione', icona: 'Icona_Benedizione',
    ricarica: 18, durata: 6, raggio: 207, danno: 8, intervallo: 0.3, segue: false, rallenta: 0, cura: 9, attira: 0, animazione: 'ciclo' },
  ritoProibito: { id: 'ritoProibito', nome: 'Rito proibito', effetto: 'Rito_proibito', icona: 'Icona_Rito_proibito',
    ricarica: 16, durata: 5, raggio: 259, danno: 10, intervallo: 0.3, segue: false, rallenta: 0, cura: 0, attira: 153, animazione: 'ciclo' },
};

export const PRONTA_DOPO = 4; // secondi dall'inizio della partita
export const ATTRAZIONE_PESANTI = 0.5; // bruti ed élite sono attirati a metà
