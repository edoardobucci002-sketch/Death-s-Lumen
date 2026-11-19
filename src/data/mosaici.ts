/*
 * Mosaici e Vetrate del gioco a stanze (decisioni di Edoardo del 19/11). Ogni Mondo ha 5 mosaici, in ordine: dal primo,
 * con poca lore, all'ultimo, con le rivelazioni. In ogni Veglia si cerca il mosaico successivo: tre frammenti dalle urne
 * lo completano. La prima volta che un mosaico si completa la sua Vetrata si accende nella Cappella (con l'epitaffio) e
 * il suo dono entra nelle carte, dalla Veglia dopo; un mosaico già completato dà il Bagliore e un po' di Cera.
 * Le urne contengono frammenti solo dopo la prima caduta: la prima Veglia resta pulita.
 * Soggetti ritoccati per la cripta ed epitaffi: proposte di Claude, da rivedere.
 */
import type { IdDono } from './doni';

export interface Mosaico {
  nome: string;
  soggetto: string; // cosa si vede nel disegno (per chi lo disegna)
  epitaffio: string; // il testo della Vetrata
  dono: IdDono; // il dono che si sblocca la prima volta
  arte: string; // il disegno nell'HUD (HUD/<arte>_V#.aseprite); se manca si usa quello del primo
}

export const MOSAICI_STANZE: readonly Mosaico[] = [
  {
    nome: 'La Veglia', arte: 'Mosaico', dono: 'fiammaCustodita',
    soggetto: 'mani che reggono una fiamma tra le nicchie dei loculi',
    epitaffio: 'Qui si veglia. Finché una mano regge la fiamma, il buio non scende.',
  },
  {
    nome: "L'Ultimo Altare", arte: 'Mosaico_2', dono: 'ultimoCero',
    soggetto: 'candele accese in una cappella sotterranea, il Ceraiolo di spalle',
    epitaffio: 'Tutte le candele si sono spente, tranne queste. Il Ceraiolo non si volta: le conta.',
  },
  {
    nome: 'Il Risveglio', arte: 'Mosaico_3', dono: 'braceNelPetto',
    soggetto: 'un loculo sfondato e un morto con una fiamma nel petto',
    epitaffio: 'Il loculo era chiuso. Il Lumen no.',
  },
  {
    nome: 'Le Due Mani', arte: 'Mosaico_4', dono: 'manoTesa',
    soggetto: 'in un ossario, chi abbraccia un morto e chi gli porta una lanterna',
    epitaffio: 'Una mano trattiene chi è caduto, l\'altra gli porta la luce. Solo una delle due lo lascerà riposare.',
  },
  {
    nome: 'La Morte Rinnovata', arte: 'Mosaico_5', dono: 'coronaIncrinata',
    soggetto: 'la falce e una corona di Lumen corrotto su un trono di ossa, in fondo alla cripta',
    epitaffio: 'Portava la falce per chiudere gli occhi ai morti. Ora porta una corona, e gli occhi non si chiudono più.',
  },
];

export const MOSAICI = {
  cadute: 1, // cadute nel gioco a stanze prima che le urne contengano frammenti (Edoardo, 19/11: dopo la prima caduta)
  cera: 10, // Cera in più quando si ricompleta un mosaico già trovato (Claude, come il premio del Campanaro; da rivedere)
} as const;

/**
 * I numeri dei 5 doni dei mosaici (proposte di Claude del 19/11, da rivedere con il calcolo a Veglia). Il valore al
 * massimo livello e le parti fisse sono qui; il totale in 3 livelli sta in PASSIVI (src/data/doni.ts).
 */
export const DONI_MOSAICI = {
  fiamma: { raggio: 80 }, // Fiamma custodita: più danno ai nemici entro tanti px dal personaggio
  cero: { danno: 0.04 }, // Ultimo cero: danno in più per ogni cero acceso (i ceri al massimo sono il totale del dono)
  brace: { raggio: 40, ogni: 0.5 }, // Brace nel petto: chi sta entro tanti px da un Ricaduto a terra si brucia, ogni tanti secondi
  corona: { subito: 0.15 }, // Corona incrinata: danno in più che si subisce dai capi
} as const;
