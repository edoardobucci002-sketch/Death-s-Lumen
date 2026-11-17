/*
 * Il glossario del gioco (decisioni di Edoardo del 16/11, come l'«oracle text» di Magic): le stesse parole per le stesse
 * cose in carte, pausa, LAB e GDD. Qui sta l'elenco unico: i nomi dei numeri sulle carte, il loro ordine, i tag e le
 * parole che non si usano. Le carte generano la riga dei numeri da qui; le descrizioni a parole restano scritte a mano, ma
 * `npm run controlla-gdd` segnala le parole vietate nei testi del gioco a stanze e nella sua parte del GDD.
 */

/** I nomi dei numeri di un'arma e il loro ordine fisso sulla carta: danno, colpi, area, ricarica, durata, poi il resto. */
export const CAMPI_GLOSSARIO: Record<string, { nome: string; unita?: string; meglioBasso?: boolean }> = {
  danno: { nome: 'Danno' },
  quantita: { nome: 'Colpi' }, // quanti oggetti lancia o ha l'arma (fiammelle, falci, fiale, corvi…)
  raggio: { nome: 'Area' }, // ciò che è tondo: aure, pozze, rintocchi, impatti, cerchi
  ampiezza: { nome: 'Ampiezza', unita: '°' },
  lunghezza: { nome: 'Portata' }, // ciò che va dritto o ad arco: fendente, Lanterna
  ricarica: { nome: 'Ricarica', unita: ' s', meglioBasso: true }, // il tempo tra due colpi della stessa arma
  durata: { nome: 'Durata', unita: ' s' },
  cecita: { nome: 'Cecità', unita: ' s' },
  sviamento: { nome: 'Mira sbagliata', unita: '°' },
  trapassa: { nome: 'Trapassa' },
  giri: { nome: 'Giri' },
  rimbalzi: { nome: 'Rimbalzi' },
  anime: { nome: 'Anime' },
};

/** L'ordine dei campi sulla riga del livello (quelli che non ci sono vanno in fondo, nell'ordine dei dati). */
export const ORDINE_CAMPI: readonly string[] = Object.keys(CAMPI_GLOSSARIO);

/** Il posto di un campo nell'ordine fisso (i sconosciuti dopo tutti). */
export const postoCampo = (k: string): number => {
  const i = ORDINE_CAMPI.indexOf(k);
  return i < 0 ? ORDINE_CAMPI.length : i;
};

/** I tag in alto sulle carte del gioco a stanze. */
export const TAG = {
  nuovoEco: 'Nuovo Eco',
  potenziale: 'Potenziale', // al posto di «Liv 4 › MAX»
} as const;

/** Le parole e il loro significato (per la scheda del glossario nel LAB e per chi scrive i testi). */
export const TERMINI: { parola: string; significa: string }[] = [
  { parola: 'Ricarica', significa: 'il tempo tra due colpi della stessa arma, in secondi: «ricarica più breve», sulla carta «Ricarica 0,8 › 0,6 s»' },
  { parola: 'Quiete', significa: 'solo il tempo in cui lo stesso bersaglio non si può ricolpire' },
  { parola: 'Area', significa: 'ciò che è tondo: aure, pozze, rintocchi, impatti, cerchi' },
  { parola: 'Portata', significa: 'ciò che va dritto o ad arco: fendente, Lanterna' },
  { parola: 'Colpi', significa: 'quanti oggetti lancia o ha un\'arma' },
  { parola: 'Danno', significa: 'il sostantivo, sempre' },
  { parola: 'Ferisce', significa: 'toglie salute; «colpisce» è l\'atto, anche senza danno' },
  { parola: 'Potenziale', significa: 'il livello 5 di un Eco: la riga dice solo l\'effetto nuovo' },
  { parola: 'Eco', significa: 'un\'arma automatica («Nuovo Eco»); «arma» solo quella iniziale' },
  { parola: 'Carica', significa: 'il segno a terra dei nemici che preparano un attacco («interrompe la carica»)' },
  { parola: 'Salute', significa: 'il numero; «recuperi» per riaverla; «salute in più» è quella oltre il massimo' },
];

/** Parole e forme che non si usano (con quella giusta): il controllo del GDD le cerca nei testi del gioco a stanze. */
export const VIETATE: { cerca: RegExp; usa: string }[] = [
  { cerca: /\bfa(nno)? male\b/i, usa: 'ferisce' },
  { cerca: /\bdannos[oaie]\b/i, usa: 'ferisce, danno' },
  { cerca: /\braggio\b/i, usa: 'Area (tondo) o Portata (dritto)' },
  { cerca: /\bpiù (rapid[oaie]|frequent[ei])\b/i, usa: 'ricarica più breve' },
  { cerca: /\bpiù di rado\b/i, usa: 'ricarica più lunga' },
  { cerca: /\bpiù spesso\b/i, usa: 'ricarica più breve' },
  { cerca: /\bgittata\b/i, usa: 'Portata' },
  { cerca: /\bquantità\b/i, usa: 'Colpi' },
  { cerca: /\bvita\b/i, usa: 'Salute' },
  { cerca: /\bnuova arma\b/i, usa: 'Nuovo Eco' },
];

/** Il nome di un campo su una carta: il raggio della Lanterna (ha un'ampiezza: è un arco) si chiama Portata, non Area. */
export const nomeCampo = (k: string, livello: Record<string, unknown>): string =>
  k === 'raggio' && 'ampiezza' in livello ? CAMPI_GLOSSARIO.lunghezza.nome : CAMPI_GLOSSARIO[k].nome;

const virgolaG = (v: number): string => String(Math.round(v * 100) / 100).replace('.', ',');
const conSegno = (v: number): string => `${v > 0 ? '+' : '−'}${virgolaG(Math.abs(v))}`;
const plurale = (n: number, uno: string, tanti: string): string => (Math.abs(n) === 1 ? uno : tanti);

/**
 * La riga di un livello (glossario, risposta 6): numeri con segno e parola, sempre nello stesso ordine (danno, colpi,
 * area, ricarica, durata, il resto). La genera il gioco dai numeri del livello prima e di quello nuovo: nessuno la scrive
 * a mano. Le cose che si contano hanno il numero davanti («+4–6 danno», «+1 colpo», «+1 rimbalzo»); le misure hanno la
 * parola davanti («ricarica −0,2 s», «area +18%»). Area e portata in percentuale: i pixel non dicono niente a chi gioca.
 */
export function rigaLivello(prima: Record<string, unknown>, ora: Record<string, unknown>): string {
  const pezzi: string[] = [];
  const chiavi = Object.keys(ora).filter((k) => k in CAMPI_GLOSSARIO && typeof ora[k] === 'number').sort((a, b) => postoCampo(a) - postoCampo(b));
  for (const k of chiavi) {
    const a = prima[k] as number, b = ora[k] as number;
    if (typeof a !== 'number') continue;
    const d = Math.round((b - a) * 100) / 100;
    if (k === 'danno') {
      const dm = typeof ora.dannoMassimo === 'number' && typeof prima.dannoMassimo === 'number' ? Math.round((ora.dannoMassimo - prima.dannoMassimo) * 100) / 100 : d;
      if (d === 0 && dm === 0) continue;
      pezzi.push(d === dm ? `${conSegno(d)} danno` : `${conSegno(d)}–${virgolaG(Math.abs(dm))} danno`);
      continue;
    }
    if (d === 0) continue;
    const nome = nomeCampo(k, ora).toLowerCase(), unita = CAMPI_GLOSSARIO[k].unita?.trim() ?? '';
    if (k === 'quantita') pezzi.push(`${conSegno(d)} ${plurale(d, 'colpo', 'colpi')}`);
    else if (k === 'rimbalzi') pezzi.push(`${conSegno(d)} ${plurale(d, 'rimbalzo', 'rimbalzi')}`);
    else if (k === 'trapassa') pezzi.push(`trapassa ${conSegno(d)} ${plurale(d, 'nemico', 'nemici')}`);
    else if (k === 'raggio' || k === 'lunghezza') pezzi.push(`${nome} ${conSegno(Math.round((b / a - 1) * 100))}%`);
    else pezzi.push(`${nome} ${conSegno(d)}${unita === '°' ? '°' : unita ? ' ' + unita : ''}`);
  }
  return pezzi.join(', ');
}

/** Il testo che la riga del livello lascia al gioco: nei dati si scrive AUTO e il gioco ci mette rigaLivello. */
export const AUTO = '';
