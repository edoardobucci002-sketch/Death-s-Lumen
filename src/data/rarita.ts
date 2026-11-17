/*
 * Rarità degli oggetti del gioco a stanze (decisione di Edoardo del 17/11, sul modello di Megabonk e Isaac): ogni Eco e ogni
 * dono ha un grado fisso, Fioca, Chiara o Ardente, che si vede sulla carta (colore del bordo e nome in alto). Il grado
 * decide quanto spesso l'oggetto esce: per ogni carta si tira prima il grado (con le probabilità qui sotto, solo tra i gradi
 * che la porta può dare), poi un oggetto a caso di quel grado. Ogni carta vale sempre +1 livello, di qualsiasi grado.
 * Il grado vale anche per i livelli successivi: un oggetto Ardente sale di livello di rado quanto esce la prima volta.
 * Per ora niente alza la rarità (Edoardo, 17/11): solo il caso. Potenziale e Unione restano a parte, con il loro tag.
 */
export type IdGrado = 'fioca' | 'chiara' | 'ardente';

export const GRADI: Record<IdGrado, { nome: string; probabilita: number; bordo: string; scelta: string }> = {
  // probabilità 75 / 20 / 5 (Edoardo, 17/11, «media»: valori di partenza, da tarare con il bot)
  // colori: la scala calda scelta da Edoardo il 17/11 (cenere, arancio, oro che pulsa); «scelta» è il bordo sulla carta indicata
  fioca: { nome: 'Fioca', probabilita: 0.75, bordo: '#8a7a68', scelta: '#cdbca2' },
  chiara: { nome: 'Chiara', probabilita: 0.2, bordo: '#e3913a', scelta: '#f6b86a' },
  ardente: { nome: 'Ardente', probabilita: 0.05, bordo: '#fbce4a', scelta: '#fff1b8' },
};

/** L'ordine dei gradi, dal più comune al più raro. */
export const ORDINE_GRADI: readonly IdGrado[] = ['fioca', 'chiara', 'ardente'];

/**
 * Il bagliore della carta Ardente: il bordo si ingrossa di «spessore» pixel disegnati e torna, a scatti (niente sfumature),
 * ogni «periodo» secondi (da rivedere).
 */
export const BAGLIORE_ARDENTE = { spessore: 1, periodo: 0.8 };

/**
 * Il grado di ogni oggetto (proposta di Claude del 17/11, da rivedere con Edoardo): Ardente i più forti nelle simulazioni
 * (la Lapide è il primo Eco per danno, lo Specchio moltiplica tutte le armi), Chiara quelli che cambiano la build, Fioca
 * gli altri. La Lanterna (arma iniziale, livelli dalla porta della Luce) è Fioca. Un oggetto che manca qui è Fioca.
 */
export const GRADO_OGGETTO: Record<string, IdGrado> = {
  // Echi
  lapide: 'ardente',
  candela: 'chiara', fuocoFatuo: 'chiara', rosarioSpezzato: 'chiara', corvo: 'chiara',
  lamaDiLuce: 'fioca', sampietrini: 'fioca', campana: 'fioca', acquaSanta: 'fioca', veloFunebre: 'fioca', falce: 'fioca',
  lanterna: 'fioca',
  // doni
  specchio: 'ardente',
  saleNero: 'chiara', clessidra: 'chiara', scudoDiFerro: 'chiara', chiodoDiBara: 'chiara', lacrimaDiLumen: 'chiara',
  cuoreDiCera: 'fioca', aliDiFalena: 'fioca', erbeAmare: 'fioca', stoppinoLungo: 'fioca', ceraVotiva: 'fioca', campanellaDArgento: 'fioca',
};

/** Il grado di un oggetto (Eco, arma o dono) dal suo id. */
export const gradoDi = (id: string): IdGrado => GRADO_OGGETTO[id] ?? 'fioca';
