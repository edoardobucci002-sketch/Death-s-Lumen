/*
 * Personaggi. Valori di partenza dal GDD (docs/GDD_base.md, sezione 2).
 * Ogni modifica qui va riportata anche nel GDD.
 */
export interface Personaggio {
  id: 'lampionaio' | 'becchino' | 'badessa' | 'strega';
  nome: string;
  motto: string;
  colore: string;
  sprite: string; // chiave dell'asset esportato da Aseprite
  armaIniziale: string;
  abilita: string;
  // modificatori rispetto ai valori comuni (BASE)
  salute: number;
  velocita: number; // percentuale, 0.1 = +10%
  danno: number;
  ricarica: number; // percentuale di riduzione, 0.1 = −10%
  area: number;
  armatura: number;
  rigenerazione: number; // salute al secondo
  barre: [number, number, number, number, number]; // vitalità, danno, velocità, raggio, controllo (su 6)
}

export const BASE = { salute: 100, velocita: 105, raccolta: 64, armatura: 0 } as const;

export const PERSONAGGI: Personaggio[] = [
  { id: 'lampionaio', nome: 'Il Lampionaio', motto: 'Guida nel buio', colore: '#e3913a', sprite: 'Il_Lampionaio',
    armaIniziale: 'lanterna', abilita: 'cerchioDiLuce',
    salute: 0, velocita: 0.1, danno: 0, ricarica: 0, area: 0, armatura: 0, rigenerazione: 0, barre: [3, 3, 4, 3, 4] },
  { id: 'becchino', nome: 'Il Becchino', motto: 'Nulla resta davvero sotto terra', colore: '#b89a74', sprite: 'Il_Becchino',
    armaIniziale: 'pala', abilita: 'sepoltura',
    salute: 30, velocita: -0.08, danno: 0.15, ricarica: 0, area: 0, armatura: 1, rigenerazione: 0, barre: [5, 5, 2, 2, 3] },
  { id: 'badessa', nome: 'La Badessa', motto: 'Preghiere per ciò che è stato', colore: '#dcc07a', sprite: 'La_Badessa',
    armaIniziale: 'turibolo', abilita: 'benedizione',
    salute: 10, velocita: 0, danno: 0, ricarica: 0, area: 0.15, armatura: 0, rigenerazione: 0.3, barre: [4, 2, 3, 5, 3] },
  { id: 'strega', nome: 'La Strega', motto: 'Conosce nomi che non dovrebbero essere detti', colore: '#a57ae0', sprite: 'La_Strega',
    armaIniziale: 'bastone', abilita: 'ritoProibito',
    salute: -15, velocita: 0, danno: 0.1, ricarica: 0.1, area: 0, armatura: 0, rigenerazione: 0, barre: [2, 4, 3, 4, 5] },
];
