/*
 * Armi iniziali, livello per livello. Valori dal GDD (docs/GDD_base.md, sezione 4),
 * con distanze e velocità della v0 × 2,35. Ogni modifica qui va riportata anche nel GDD.
 * «testo» è la riga mostrata sulla carta quando l'arma sale a quel livello.
 */
export type IdArma = 'lanterna' | 'pala' | 'turibolo' | 'bastone';

interface Comune {
  nome: string;
  icona: string; // chiave dell'icona: ICONE/<Nome>/Icona_<Nome>_V#.aseprite
  effetto: string; // chiave dell'effetto: EFFETTI/<Nome>/<Nome>_V#.aseprite
  respinta: number; // velocità di spinta all'indietro dei nemici colpiti, pixel al secondo
}

export interface Lanterna extends Comune {
  id: 'lanterna';
  livelli: { ricarica: number; danno: number; raggio: number; ampiezza: number; spalle: boolean; testo: string }[];
}
export interface Pala extends Comune {
  id: 'pala';
  distanza: number; // centro dell'impatto davanti al personaggio
  ritardoDoppio: number; // secondi tra il colpo e quello alle spalle
  livelli: { ricarica: number; danno: number; raggio: number; doppio: boolean; testo: string }[];
}
export interface Turibolo extends Comune {
  id: 'turibolo';
  distanzaPrima: number; // la prima nube nasce qui davanti
  distanzaAltre: number; // le altre a caso fino a questa distanza
  intervallo: number; // ogni nube ferisce ogni tot secondi
  rallenta: number; // 0,3 = i nemici dentro vanno più lenti del 30%
  livelli: { ricarica: number; quantita: number; danno: number; raggio: number; durata: number; testo: string }[];
}
export interface Bastone extends Comune {
  id: 'bastone';
  esplosione: string; // effetto quando il proiettile colpisce
  portata: number; // mira al nemico più vicino entro questa distanza
  velocita: number; // del proiettile
  intervallo: number; // secondi tra un proiettile e l'altro della stessa raffica
  vita: number; // secondi prima che il proiettile svanisca
  raggio: number; // del proiettile, per i contatti
  livelli: { ricarica: number; quantita: number; danno: number; trapassa: number; testo: string }[];
}
export type Arma = Lanterna | Pala | Turibolo | Bastone;

export const LANTERNA: Lanterna = {
  id: 'lanterna', nome: 'Lanterna', icona: 'Icona_Lanterna', effetto: 'Lanterna_Arco', respinta: 259,
  livelli: [
    { ricarica: 0.8, danno: 14, raggio: 136, ampiezza: 132, spalle: false, testo: 'Colpo corto, ampia gittata frontale.' },
    { ricarica: 0.8, danno: 19, raggio: 136, ampiezza: 132, spalle: false, testo: '+5 danno.' },
    { ricarica: 0.8, danno: 19, raggio: 160, ampiezza: 132, spalle: false, testo: 'Raggio maggiore.' },
    { ricarica: 0.68, danno: 19, raggio: 160, ampiezza: 132, spalle: false, testo: 'Colpi più frequenti.' },
    { ricarica: 0.68, danno: 25, raggio: 160, ampiezza: 132, spalle: false, testo: '+6 danno.' },
    { ricarica: 0.68, danno: 25, raggio: 183, ampiezza: 166, spalle: false, testo: 'Raggio e ampiezza maggiori.' },
    { ricarica: 0.56, danno: 25, raggio: 183, ampiezza: 166, spalle: false, testo: 'Colpi più frequenti.' },
    { ricarica: 0.56, danno: 35, raggio: 183, ampiezza: 166, spalle: true, testo: '+10 danno, colpisce anche alle spalle.' },
  ],
};

export const PALA: Pala = {
  id: 'pala', nome: 'Pala', icona: 'Icona_Pala', effetto: 'Pala_Impatto', respinta: 423, distanza: 61, ritardoDoppio: 0.22,
  livelli: [
    { ricarica: 1.35, danno: 34, raggio: 70, doppio: false, testo: 'Colpo potente a corta gittata.' },
    { ricarica: 1.35, danno: 44, raggio: 70, doppio: false, testo: '+10 danno.' },
    { ricarica: 1.35, danno: 44, raggio: 87, doppio: false, testo: "Area d'impatto maggiore." },
    { ricarica: 1.15, danno: 44, raggio: 87, doppio: false, testo: 'Colpi più frequenti.' },
    { ricarica: 1.15, danno: 56, raggio: 87, doppio: false, testo: '+12 danno.' },
    { ricarica: 1.15, danno: 56, raggio: 103, doppio: false, testo: "Area d'impatto maggiore." },
    { ricarica: 0.95, danno: 56, raggio: 103, doppio: false, testo: 'Colpi più frequenti.' },
    { ricarica: 0.95, danno: 76, raggio: 103, doppio: true, testo: '+20 danno, colpo doppio.' },
  ],
};

export const TURIBOLO: Turibolo = {
  id: 'turibolo', nome: 'Turibolo', icona: 'Icona_Turibolo', effetto: 'Turibolo_Nube', respinta: 0,
  distanzaPrima: 47, distanzaAltre: 94, intervallo: 0.3, rallenta: 0.3,
  livelli: [
    { ricarica: 1.25, quantita: 1, danno: 6, raggio: 70, durata: 2.4, testo: 'Emette fumo sacro a corta gittata.' },
    { ricarica: 1.25, quantita: 1, danno: 8, raggio: 70, durata: 2.4, testo: '+2 danno.' },
    { ricarica: 1.25, quantita: 2, danno: 8, raggio: 85, durata: 2.4, testo: '+1 nube, nubi più ampie.' },
    { ricarica: 1.05, quantita: 2, danno: 8, raggio: 85, durata: 2.4, testo: 'Più frequente.' },
    { ricarica: 1.05, quantita: 2, danno: 11, raggio: 85, durata: 3.1, testo: '+3 danno, fumo più duraturo.' },
    { ricarica: 1.05, quantita: 3, danno: 11, raggio: 99, durata: 3.1, testo: '+1 nube, nubi più ampie.' },
    { ricarica: 0.85, quantita: 3, danno: 11, raggio: 99, durata: 3.1, testo: 'Più frequente.' },
    { ricarica: 0.85, quantita: 3, danno: 15, raggio: 99, durata: 3.1, testo: '+4 danno.' },
  ],
};

export const BASTONE: Bastone = {
  id: 'bastone', nome: 'Bastone', icona: 'Icona_Bastone', effetto: 'Bastone_Proiettile', esplosione: 'Bastone_Esplosione', respinta: 0,
  portata: 611, velocita: 541, intervallo: 0.08, vita: 1.3, raggio: 9,
  livelli: [
    { ricarica: 0.85, quantita: 1, danno: 15, trapassa: 1, testo: 'Colpo a media gittata, proiettili magici.' },
    { ricarica: 0.85, quantita: 2, danno: 15, trapassa: 1, testo: '+1 proiettile.' },
    { ricarica: 0.85, quantita: 2, danno: 20, trapassa: 1, testo: '+5 danno.' },
    { ricarica: 0.72, quantita: 2, danno: 20, trapassa: 1, testo: 'Più frequente.' },
    { ricarica: 0.72, quantita: 3, danno: 20, trapassa: 1, testo: '+1 proiettile.' },
    { ricarica: 0.72, quantita: 3, danno: 27, trapassa: 2, testo: '+7 danno, trapassano.' },
    { ricarica: 0.59, quantita: 3, danno: 27, trapassa: 2, testo: 'Più frequente.' },
    { ricarica: 0.59, quantita: 4, danno: 35, trapassa: 2, testo: '+1 proiettile, +8 danno.' },
  ],
};

export const ARMI_INIZIALI: Record<IdArma, Arma> = { lanterna: LANTERNA, pala: PALA, turibolo: TURIBOLO, bastone: BASTONE };

/** Regole comuni a tutte le armi (GDD, sezione 10). */
export const COLPI = {
  casoMinimo: 0.92, // danno inflitto = danno arma × (1 + bonus danno) × caso tra 0,92 e 1,08
  casoMassimo: 1.08,
  attrito: 8, // quanto in fretta si ferma la respinta (più alto = si ferma prima)
  respintaPesanti: 0.25, // bruti ed élite subiscono un quarto della respinta
  lampoNemico: 0.1, // secondi in cui il nemico colpito si illumina di bianco
  corpo: 36, // le armi partono da qui, sopra i piedi del personaggio
} as const;
