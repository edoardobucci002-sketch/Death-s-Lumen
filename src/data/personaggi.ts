/*
 * Personaggi. Valori di partenza dal GDD (docs/GDD_base.md, sezione 2).
 * Ogni modifica qui va riportata anche nel GDD.
 */
export interface Personaggio {
  id: 'lampionaio' | 'becchino' | 'badessa' | 'strega';
  nome: string;
  motto: string;
  colore: string;
  ritratto: string; // chiave dell'asset del ritratto (schermata di selezione)
  sprite: string; // chiave dell'asset in gioco: Nome_ingame_V#.aseprite
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

// velocità e raccolta: valori della v0 × 2,35, perché i personaggi ora sono alti circa 80 px invece di 34
export const BASE = { salute: 100, velocita: 245, raccolta: 150, armatura: 0 } as const;

export const PERSONAGGI: Personaggio[] = [
  { id: 'lampionaio', nome: 'Il Lampionaio', motto: 'Guida nel buio', colore: '#e3913a', ritratto: 'Il_Lampionaio', sprite: 'Il_Lampionaio_ingame',
    armaIniziale: 'lanterna', abilita: 'cerchioDiLuce',
    salute: 0, velocita: 0.1, danno: 0, ricarica: 0, area: 0, armatura: 0, rigenerazione: 0, barre: [3, 3, 4, 3, 4] },
  { id: 'becchino', nome: 'Il Becchino', motto: 'Nulla resta davvero sotto terra', colore: '#b89a74', ritratto: 'Il_Becchino', sprite: 'Il_Becchino_ingame',
    armaIniziale: 'pala', abilita: 'sepoltura',
    salute: 30, velocita: -0.08, danno: 0.15, ricarica: 0, area: 0, armatura: 1, rigenerazione: 0, barre: [5, 5, 2, 2, 3] },
  { id: 'badessa', nome: 'La Badessa', motto: 'Preghiere per ciò che è stato', colore: '#dcc07a', ritratto: 'La_Badessa', sprite: 'La_Badessa_ingame',
    armaIniziale: 'turibolo', abilita: 'benedizione',
    salute: 10, velocita: 0, danno: 0, ricarica: 0, area: 0.15, armatura: 0, rigenerazione: 0.3, barre: [4, 2, 3, 5, 3] },
  { id: 'strega', nome: 'La Strega', motto: 'Conosce nomi che non dovrebbero essere detti', colore: '#a57ae0', ritratto: 'La_Strega', sprite: 'La_Strega_ingame',
    armaIniziale: 'bastone', abilita: 'ritoProibito',
    salute: -15, velocita: 0, danno: 0.1, ricarica: 0.1, area: 0, armatura: 0, rigenerazione: 0, barre: [2, 4, 3, 4, 5] },
];
