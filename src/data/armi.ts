/*
 * Armi iniziali, livello per livello. Valori dal GDD (docs/GDD_base.md, sezione 4),
 * con distanze e velocità della v0 × 2,35. Ogni modifica qui va riportata anche nel GDD.
 * «testo» è la riga mostrata sulla carta quando l'arma sale a quel livello.
 */
export type IdArma = 'lanterna' | 'pala' | 'turibolo' | 'bastone' | 'candela' | 'falce' | 'campana' | 'fuocoFatuo' | 'acquaSanta' | 'lamaDiLuce';

interface Comune {
  nome: string;
  icona: string; // chiave dell'icona: ICONE/<Nome>/Icona_<Nome>_V#.aseprite
  effetto: string; // chiave dell'effetto: EFFETTI/<Nome>/<Nome>_V#.aseprite (la Lanterna per ora usa un arco disegnato dal codice)
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
/** Proiettili che partono verso un nemico (Candela) o lo inseguono (Fuoco fatuo). */
export interface Candela extends Comune {
  id: 'candela';
  portata: number; // bersaglia i nemici più vicini entro questa distanza (circa lo schermo)
  velocita: number;
  vita: number;
  raggio: number;
  livelli: { ricarica: number; danno: number; quantita: number; trapassa: number; testo: string }[];
}
export interface Falce extends Comune {
  id: 'falce';
  lama: string; // sprite della lama che gira (per ora l'icona della v0)
  raggioLama: number; // per i contatti
  pausa: number; // lo stesso nemico può essere colpito da una falce ogni tot secondi
  livelli: { quantita: number; danno: number; raggio: number; giri: number; testo: string }[];
}
export interface Campana extends Comune {
  id: 'campana';
  ritardoDoppio: number;
  durataEffetto: number;
  livelli: { ricarica: number; danno: number; raggio: number; doppio: boolean; testo: string }[];
}
export interface FuocoFatuo extends Comune {
  id: 'fuocoFatuo';
  portata: number;
  velocita: number;
  vita: number;
  raggio: number;
  sterzo: number; // quanto in fretta gira verso il bersaglio (radianti al secondo)
  livelli: { ricarica: number; quantita: number; danno: number; trapassa: number; testo: string }[];
}
export interface AcquaSanta extends Comune {
  id: 'acquaSanta';
  intervallo: number; // la pozza ferisce ogni tot secondi
  livelli: { ricarica: number; quantita: number; danno: number; raggio: number; durata: number; testo: string }[];
}
export interface LamaDiLuce extends Comune {
  id: 'lamaDiLuce';
  altezza: number; // del fendente
  ritardoSpalle: number;
  durataEffetto: number;
  livelli: { ricarica: number; danno: number; lunghezza: number; spalle: boolean; testo: string }[];
}
export type Arma = Lanterna | Pala | Turibolo | Bastone | Candela | Falce | Campana | FuocoFatuo | AcquaSanta | LamaDiLuce;

export const LANTERNA: Lanterna = {
  id: 'lanterna', nome: 'Lanterna', icona: 'Icona_Lanterna', effetto: 'Lanterna_Arco', respinta: 259,
  livelli: [
    { ricarica: 0.8, danno: 18, raggio: 136, ampiezza: 132, spalle: false, testo: 'Colpo corto, ampia gittata frontale.' },
    { ricarica: 0.8, danno: 24, raggio: 136, ampiezza: 132, spalle: false, testo: '+6 danno.' },
    { ricarica: 0.8, danno: 24, raggio: 160, ampiezza: 132, spalle: false, testo: 'Raggio maggiore.' },
    { ricarica: 0.68, danno: 24, raggio: 160, ampiezza: 132, spalle: false, testo: 'Colpi più frequenti.' },
    { ricarica: 0.68, danno: 32, raggio: 160, ampiezza: 132, spalle: false, testo: '+8 danno.' },
    { ricarica: 0.68, danno: 32, raggio: 183, ampiezza: 166, spalle: false, testo: 'Raggio e ampiezza maggiori.' },
    { ricarica: 0.56, danno: 32, raggio: 183, ampiezza: 166, spalle: false, testo: 'Colpi più frequenti.' },
    { ricarica: 0.56, danno: 44, raggio: 183, ampiezza: 166, spalle: true, testo: '+12 danno, colpisce anche alle spalle.' },
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

export const CANDELA: Candela = {
  id: 'candela', nome: 'Candela', icona: 'Icona_Candela', effetto: 'Candela_Fiammella', respinta: 0,
  portata: 700, velocita: 705, vita: 1.4, raggio: 9,
  livelli: [
    { ricarica: 0.95, danno: 12, quantita: 1, trapassa: 1, testo: 'Lancia fiammelle verso il nemico più vicino.' },
    { ricarica: 0.95, danno: 12, quantita: 2, trapassa: 1, testo: '+1 fiammella.' },
    { ricarica: 0.95, danno: 17, quantita: 2, trapassa: 1, testo: '+5 danno.' },
    { ricarica: 0.95, danno: 17, quantita: 3, trapassa: 1, testo: '+1 fiammella.' },
    { ricarica: 0.95, danno: 17, quantita: 3, trapassa: 2, testo: 'Le fiammelle trapassano un nemico in più.' },
    { ricarica: 0.95, danno: 22, quantita: 4, trapassa: 2, testo: '+5 danno e +1 fiammella.' },
    { ricarica: 0.75, danno: 22, quantita: 4, trapassa: 2, testo: 'Ricarica più rapida.' },
    { ricarica: 0.75, danno: 32, quantita: 5, trapassa: 3, testo: '+1 fiammella, +10 danno, trapassano di più.' },
  ],
};

export const FALCE: Falce = {
  id: 'falce', nome: 'Falce', icona: 'Icona_Falce', effetto: 'Falce_Rotazione', lama: 'Icona_Falce', respinta: 165,
  raggioLama: 24, pausa: 0.45,
  livelli: [
    { quantita: 1, danno: 12, raggio: 132, giri: 0.45, testo: 'Una falce spettrale ti ruota intorno.' },
    { quantita: 2, danno: 12, raggio: 132, giri: 0.45, testo: '+1 falce.' },
    { quantita: 2, danno: 15, raggio: 132, giri: 0.45, testo: '+3 danno.' },
    { quantita: 3, danno: 15, raggio: 132, giri: 0.45, testo: '+1 falce.' },
    { quantita: 3, danno: 19, raggio: 160, giri: 0.45, testo: 'Raggio più ampio e +4 danno.' },
    { quantita: 4, danno: 19, raggio: 160, giri: 0.45, testo: '+1 falce.' },
    { quantita: 4, danno: 25, raggio: 160, giri: 0.59, testo: 'Rotazione più veloce e +6 danno.' },
    { quantita: 5, danno: 25, raggio: 160, giri: 0.59, testo: '+1 falce.' },
  ],
};

export const CAMPANA: Campana = {
  id: 'campana', nome: 'Campana', icona: 'Icona_Campana', effetto: 'Campana_Rintocco', respinta: 470, ritardoDoppio: 0.35, durataEffetto: 0.3,
  livelli: [
    { ricarica: 2.6, danno: 16, raggio: 197, doppio: false, testo: 'Rintocchi che respingono e feriscono tutto intorno.' },
    { ricarica: 2.6, danno: 22, raggio: 197, doppio: false, testo: '+6 danno.' },
    { ricarica: 2.6, danno: 22, raggio: 240, doppio: false, testo: 'Raggio più ampio.' },
    { ricarica: 2.2, danno: 22, raggio: 240, doppio: false, testo: 'Rintocchi più frequenti.' },
    { ricarica: 2.2, danno: 30, raggio: 240, doppio: false, testo: '+8 danno.' },
    { ricarica: 2.2, danno: 30, raggio: 282, doppio: false, testo: 'Raggio più ampio.' },
    { ricarica: 1.8, danno: 30, raggio: 282, doppio: false, testo: 'Rintocchi più frequenti.' },
    { ricarica: 1.8, danno: 42, raggio: 282, doppio: true, testo: '+12 danno e doppio rintocco.' },
  ],
};

export const FUOCO_FATUO: FuocoFatuo = {
  id: 'fuocoFatuo', nome: 'Fuoco fatuo', icona: 'Icona_Fuoco_fatuo', effetto: 'Fuoco_fatuo_Volo', respinta: 0,
  portata: 752, velocita: 470, vita: 3.2, raggio: 9, sterzo: 6,
  livelli: [
    { ricarica: 1.3, quantita: 1, danno: 12, trapassa: 1, testo: 'Fuochi fatui che inseguono i nemici.' },
    { ricarica: 1.3, quantita: 2, danno: 12, trapassa: 1, testo: '+1 fuoco.' },
    { ricarica: 1.3, quantita: 2, danno: 18, trapassa: 1, testo: '+6 danno.' },
    { ricarica: 1.3, quantita: 3, danno: 18, trapassa: 1, testo: '+1 fuoco.' },
    { ricarica: 1, quantita: 3, danno: 18, trapassa: 1, testo: 'Ricarica più rapida.' },
    { ricarica: 1, quantita: 3, danno: 26, trapassa: 1, testo: '+8 danno.' },
    { ricarica: 1, quantita: 4, danno: 26, trapassa: 1, testo: '+1 fuoco.' },
    { ricarica: 1, quantita: 4, danno: 36, trapassa: 3, testo: '+10 danno, trapassano tre nemici.' },
  ],
};

export const ACQUA_SANTA: AcquaSanta = {
  id: 'acquaSanta', nome: 'Acqua santa', icona: 'Icona_Acqua_santa', effetto: 'Acqua_santa_Pozza', respinta: 0, intervallo: 0.3,
  livelli: [
    { ricarica: 2.8, quantita: 1, danno: 7, raggio: 89, durata: 2.6, testo: 'Fiale che lasciano pozze benedette sui nemici.' },
    { ricarica: 2.8, quantita: 2, danno: 7, raggio: 89, durata: 2.6, testo: '+1 fiala.' },
    { ricarica: 2.8, quantita: 2, danno: 10, raggio: 108, durata: 2.6, testo: 'Pozze più grandi e dannose.' },
    { ricarica: 2.8, quantita: 3, danno: 10, raggio: 108, durata: 2.6, testo: '+1 fiala.' },
    { ricarica: 2.3, quantita: 3, danno: 10, raggio: 108, durata: 3.2, testo: 'Ricarica più rapida, pozze più durature.' },
    { ricarica: 2.3, quantita: 3, danno: 14, raggio: 129, durata: 3.2, testo: 'Pozze più grandi e dannose.' },
    { ricarica: 2.3, quantita: 4, danno: 14, raggio: 129, durata: 3.2, testo: '+1 fiala.' },
    { ricarica: 2.3, quantita: 4, danno: 19, raggio: 129, durata: 4.2, testo: 'Durata e danno maggiori.' },
  ],
};

export const LAMA_DI_LUCE: LamaDiLuce = {
  id: 'lamaDiLuce', nome: 'Lama di luce', icona: 'Icona_Lama_di_luce', effetto: 'Lama_di_luce_Fendente', respinta: 259,
  altezza: 103, ritardoSpalle: 0.12, durataEffetto: 0.15,
  livelli: [
    { ricarica: 1.15, danno: 18, lunghezza: 259, spalle: false, testo: 'Un fendente di luce davanti a te.' },
    { ricarica: 1.15, danno: 18, lunghezza: 259, spalle: true, testo: 'Colpisce anche alle spalle.' },
    { ricarica: 1.15, danno: 24, lunghezza: 259, spalle: true, testo: '+6 danno.' },
    { ricarica: 1, danno: 24, lunghezza: 259, spalle: true, testo: 'Ricarica più rapida.' },
    { ricarica: 1, danno: 32, lunghezza: 259, spalle: true, testo: '+8 danno.' },
    { ricarica: 1, danno: 32, lunghezza: 329, spalle: true, testo: 'Fendente più lungo.' },
    { ricarica: 0.85, danno: 32, lunghezza: 329, spalle: true, testo: 'Ricarica più rapida.' },
    { ricarica: 0.85, danno: 44, lunghezza: 329, spalle: true, testo: '+12 danno.' },
  ],
};

export const ARMI_INIZIALI: Record<'lanterna' | 'pala' | 'turibolo' | 'bastone', Arma> = { lanterna: LANTERNA, pala: PALA, turibolo: TURIBOLO, bastone: BASTONE };
/** Armi che si trovano tra i doni di livello (le iniziali sono esclusive del loro personaggio). */
export const ARMI_COMUNI: Arma[] = [CANDELA, FALCE, CAMPANA, FUOCO_FATUO, ACQUA_SANTA, LAMA_DI_LUCE];
export const MAX_ARMI = 6;

/** Regole comuni a tutte le armi (GDD, sezione 10). */
export const COLPI = {
  casoMinimo: 0.92, // danno inflitto = danno arma × (1 + bonus danno) × caso tra 0,92 e 1,08
  casoMassimo: 1.08,
  attrito: 8, // quanto in fretta si ferma la respinta (più alto = si ferma prima)
  respintaPesanti: 0.25, // bruti ed élite subiscono un quarto della respinta
  lampoNemico: 0.1, // secondi in cui il nemico colpito si illumina di bianco
  corpo: 36, // le armi partono da qui, sopra i piedi del personaggio
} as const;
