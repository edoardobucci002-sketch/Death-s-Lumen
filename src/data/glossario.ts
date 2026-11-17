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
  ampiezza: { nome: 'Ampiezza' },
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
