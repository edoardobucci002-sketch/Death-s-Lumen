# Death's Lumen — Sistema di build dopo il pivot

12 novembre 2026 · proposta di Edoardo, con le correzioni decise insieme a Claude lo stesso giorno (vedi [decisioni.md](../decisioni.md), 12/11). Il survivor-like di prima è congelato nel tag `survivor-v1`.

Una Veglia attraversa 3 Mondi a stanze: ogni stanza si chiude con le 3 carte di sempre, e la porta scelta decide da dove pescano.

## Struttura della Veglia

Una Veglia sono 3 Mondi; ogni Mondo ha circa 12 stanze, un mini-boss e un Boss che apre il Mondo successivo. Il Boss non è sempre Seth: ogni Mondo ha i suoi.

1. Stanze normali (circa 12 per Mondo, di cui 1 Sosta prima del Boss)
2. Mini-boss a metà Mondo
3. Boss a fine Mondo

- **Uscite:** ogni stanza ne ha 2 o 3, a caso. Ogni porta mostra in anticipo che ricompensa dà.
- **Porta d'élite:** compare dentro la stanza e si apre solo dopo averla ripulita. Si aggiunge alla ricompensa della stanza e dà un Reliquiario.
  - circa 25% di probabilità per stanza
  - al massimo 3 per Mondo, mai in due stanze consecutive
  - mai nella prima stanza della Veglia né nella Sosta

## Ricompense

Alla fine di ogni stanza compaiono le 3 carte di sempre; la porta scelta decide da dove pescano. Le **Lacrime di Lumen** non danno più livelli: sono la valuta da spendere nella Sosta.

| Fonte | Cosa dà |
| --- | --- |
| Porta d'affinità (Luce, Sacro, Ombra, Terra) | armi e livelli d'arma di quell'affinità |
| Porta del dono | doni passivi, nuovi o da potenziare |
| Porta d'élite | 1 Reliquiario, oltre alla ricompensa della stanza |
| Mini-boss | 1 Reliquiario e un sorso di fiaschetta |
| Boss | 2 Reliquiari, fiaschetta piena, un grano del Rosario |
| Sosta | pane, fiaschetta, rimescolate, potenziamenti con le Lacrime |

**Il Reliquiario offre 3 carte:**

- **Unione:** compare sempre se un'arma è al livello 4 e il suo dono al suo massimo, dal primo Boss sconfitto.
- **Amuleto del Rosario:** uno dei 10 amuleti, con il suo costo in grani. Il Rosario parte da 3 grani e ne guadagna 1 per Boss, fino a 5 (il 5° arriva con il secondo Boss).
- **Potenziamento doppio:** +1 livello a due armi o doni a scelta.

**Bilancio.** Circa 14 scelte per Mondo (11 stanze con carte, 3 Reliquiari). Nella Veglia sono circa 40 utili senza porte d'élite: i 2 Reliquiari del terzo Boss arrivano a Veglia finita. La build completa ne chiede **da 33 a 37** (vedi «Armi»): senza porte d'élite si chiude verso la fine del Mondo 3, poi restano Riti e pane. Le porte d'affinità e quelle del dono stanno circa a metà (circa 16 scelte d'arma, 18 di dono).

## Armi

Ogni build ha 4 armi: l'arma iniziale del personaggio, usata con un tasto, e 3 Echi automatici. I doni restano 6.

|  | Arma iniziale | Echi |
| --- | --- | --- |
| Quante | 1, fissa | 3, scelte nelle stanze |
| Come si usa | tasto: tocco = nemico più vicino, trascinamento = mira (stile Brawl Stars) | automatiche, come oggi |
| Quando arrivano | dall'inizio | garantite nelle prime stanze del Mondo 1 |

- **Livelli:** da 1 a 5 per ogni arma (prima erano 8). Ogni livello vale circa il doppio di prima; i numeri vanno ridistribuiti su 5 gradini.
- **Unione:** arma al livello 4 e il suo dono al suo massimo; arriva dal Reliquiario. Il massimo dei doni oggi è 3 livelli, tranne Specchio (1), Calice riverso (2) e Campanella d'argento (2).
- **Livello 5, il potenziale:** l'ultimo livello sblocca il vero potenziale dell'arma, come oggi il livello 8 (per esempio la Lanterna che colpisce anche alle spalle). Vale anche per la versione unita: Unione e potenziale si sommano.
- **Build completa:** 4 livelli dell'arma iniziale (parte già dal livello 1) + 15 degli Echi (il primo livello di un Eco è la scelta che lo porta nella build, non è gratis) + da 14 a 18 dei doni (secondo quali doni si prendono) = **da 33 a 37 scelte**.
- **Niente scatto:** la difesa attiva è la Grazia (schivata perfetta muovendosi). Per questo **ogni attacco dei nemici deve avere un avviso chiaro e lasciare spazio alla schivata perfetta**.

## Affinità

Con 4 armi ci sono tre strade, tutte valide: 2 + 2 (Intreccio bilanciato), 3 + 1 (specializzazione con un Intreccio), 4 su 4 (Affinità pura, senza Intrecci). Restano le regole di oggi: ogni colpo lascia lo stato, Quiete di 3 s dopo una reazione, il primo scatto dell'abilità la ignora.

**Armi per affinità.** Oggi Luce, Sacro e Ombra hanno 4 armi ciascuna, la Terra 3 (Pala, Lapide, Sampietrini). **Si crea una quarta arma della Terra** (da progettare), così ogni affinità può arrivare a 4 su 4. Con 4 armi per affinità l'Affinità pura chiede di prenderle tutte; con armi nuove in futuro le strade aumentano.

**Devozione: un quarto gradino.** Con 1, 2 e 3 armi della stessa affinità lo stato si rafforza come oggi; con 4 armi su 4 si attiva l'Affinità pura. Moltiplicatore della reazione che consuma lo stato: ×1, ×1,25, ×1,5. Che cosa fa il quarto gradino sullo stato, oltre all'Affinità pura, è *da rivedere*.

**I sei Intrecci** (le reazioni; si attivano quando due stati diversi sono sullo stesso nemico):

| Coppia | Intreccio | Effetto |
| --- | --- | --- |
| Luce + Ombra | Eclissi | esplosione del 10% della salute massima, senza tetto sui nemici normali; su mini-boss e Boss **5%** e Quiete di **6 s** invece di 3 (*da rivedere*, si misura) |
| Luce + Sacro | Rivelazione | +50% di Lacrime; ogni Lacrima raccolta dal nemico rivelato cura 0,5 salute |
| Sacro + Ombra | Esorcismo | 3 fiammelle verso i vicini, ognuna al 60% del colpo |
| Terra + Luce | Esumazione | fermo 1,5 s e +50% di danno |
| Terra + Sacro | Esequie | fermo 2,5 s |
| Terra + Ombra | Profanazione | fermo 1,5 s e maledizione doppia |

Esumazione, Esequie e Profanazione nascono dalle tre varianti del vecchio Interramento.

**Le quattro Affinità pure** (4 armi su 4; il loro effetto non è soggetto alla Quiete):

| Affinità | Nome | Effetto |
| --- | --- | --- |
| Luce | Alba | un Abbagliato che muore esplode e abbaglia i vicini, una volta: chi è abbagliato dall'esplosione non esplode a sua volta |
| Sacro | Santuario | i Consacrati non ti feriscono a contatto, solo con i loro attacchi veri |
| Ombra | Contagio | un Maledetto che muore passa la maledizione ai vicini con la stessa intensità |
| Terra | Fossa | l'attesa tra un fermo e l'altro scende da 4 s a 2 s |

Con Veggente e Sguattera le affinità saranno 6: servono 9 Intrecci nuovi e 2 Affinità pure, senza cambiare lo schema.

## Personaggio

Ogni personaggio porta 4 pezzi fissi; è la differenza principale rispetto ad Hades, dove a cambiare è l'arma.

| Pezzo | Ruolo nella build |
| --- | --- |
| Arma iniziale | slot Attacco, livelli 1–5; conta per la Devozione, quindi ogni personaggio parte con 1 nella sua affinità |
| Abilità | secondo tasto; si carica **solo colpendo con l'arma iniziale** (stile Brawl Stars), non più a tempo e non con gli Echi: così non premia lo stare fermi |
| Voto | la regola di personaggio su stati e reazioni |
| Passiva | i numeri di base: salute, velocità, danno |

- **Tolta:** la probabilità extra per le armi della propria affinità. A orientare bastano l'arma iniziale, il Voto e la porta scelta.
- **Voti:** quelli di Lampionaio, Becchino e Strega restano come oggi. **Il Voto della Badessa cambia**: da «i Consacrati fanno il 20% di danno in meno a contatto» a **«i Consacrati preparano i loro attacchi il 25% più lentamente»** (25% *da rivedere*). Con il Santuario non si annulla: il Santuario toglie il contatto, il Voto rende più facili da schivare gli attacchi veri, e dà più occasioni di Grazia.

## Meta

La meta ha due livelli: sblocchi permanenti con la Cera, e una preparazione scelta prima di ogni Veglia.

| Elemento | Come funziona |
| --- | --- |
| Cera | resta anche se muori; arriva da nemici, giare, mini-boss, Boss (10) e un premio per ogni Mondo completato |
| Sblocchi | personaggi, Echi, doni e amuleti, con un traguardo o con la Cera, come oggi |
| Ceri | 7 oggi, più in futuro; 5 livelli comprati con la Cera. Prima della Veglia se ne accendono solo alcuni, entro un budget che cresce con il gioco; il costo sale con il livello |
| Pegno | uno slot: garantisce che la prima porta d'affinità della Veglia sia di quella scelta. Lo consegna il Ceraiolo |
| Seconda candela | ti rialzi una volta per Veglia con il 30% della salute; sblocco della Cappella, fuori dal budget dei Ceri |

Due Ceri da aggiornare: *del rito* passa a «l'abilità si carica il 20% più in fretta»; *del raccolto* resta, perché ora attira le Lacrime.

**Nomi.** La valuta si chiama Lacrime di Lumen. Il dono che oggi si chiama «Lacrima di lumen» (+1 sorso della fiaschetta) diventa **Calice riverso**: l'abbondanza di Lumen dentro la Fiaschetta.

## Restano, da rivedere nel nuovo genere

Decisione di Edoardo: tutte queste cose rimangono, forse ripensate.

- **Grazia**: la difesa attiva al posto dello scatto.
- **Oggetti rompibili**: urne, giare, lanterne nelle stanze.
- **Patti**: le regole che rendono la Veglia più dura e più ricca.
- **Mosaici e Vetrate**.
- **Devozione** dei personaggi (gli 8 livelli per personaggio della meta).
- **Seth tra i Boss**: quale Mondo, quale ruolo.

## Da verificare e aperto

I numeri qui sopra sono punti di partenza: vanno misurati con il bot prima di fissarli.

- [ ] Stanze per Mondo (circa 12) e durata di una stanza
- [ ] Probabilità della porta d'élite (circa 25%, tetto 3) e se serve un minimo di 1 per Mondo; se la build (33–37 scelte) deve chiudersi prima della fine del Mondo 3
- [ ] Ridistribuire i numeri delle armi su 5 livelli e scrivere il potenziale del livello 5 di ogni arma
- [ ] La quarta arma della Terra
- [ ] Peso delle Affinità pure contro gli Intrecci; che cosa fa il quarto gradino della Devozione
- [ ] Eclissi su mini-boss e Boss (5%, Quiete 6 s)
- [ ] Badessa con Santuario e Voto nuovo: troppo resistente?
- [ ] Quanto carica l'abilità ogni colpo dell'arma iniziale
- [ ] Da dove arrivano i Riti, ora che non ci sono più i livelli
- [ ] Nemici: tipi, attacchi con l'avviso, quanti per stanza
- [ ] Budget dei Ceri: valore iniziale, crescita e costo per livello
- [ ] Quali Pegni esistono e come si sbloccano
- [ ] Affinità di Veggente e Sguattera, con i loro 9 Intrecci e le 2 Affinità pure
