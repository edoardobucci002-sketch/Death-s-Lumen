> **Archivio congelato.** Copia in testo della proposta approvata da Edoardo il 3 novembre 2026 (documento su claude.ai: https://claude.ai/artifact/CkYtFuod36uJf8qpcAeXzk). Non si aggiorna: lo stato vero di ogni voce è in `GDD.md` (contenuti), `roadmap.md` (cosa è fatto e cosa manca) e `decisioni.md` (cosa è stato cambiato dopo). I grafici e i numeri del «problema» sono quelli del 3/11. Qui «Mietitore» è l'attuale Seth.

# Death's Lumen — Proposta: oggetti, build e sinergie

2026-11-03 · @Edoardo

## Il problema

Una build oggi si fa con 16 pezzi, e 3 di questi decidono quasi tutto: Turibolo, Acqua santa e Specchio. Ci sono 10 armi (4 iniziali, 6 comuni) e 9 doni passivi; nessun oggetto cambia il modo di giocare, solo i numeri.

> [Grafico della proposta originale, non copiato: calcolato dai dati di src/data/armi.ts, livello 8, senza bonus · 3 novembre 2026]

- **Le zone si sommano.** Al livello 8 il Turibolo ha in media 11 nubi attive e l'Acqua santa 7 pozze; un nemico grande, come il Mietitore, ne subisce molte insieme. Per questo la Badessa lo uccide in 26 s e gli altri in 50–90 s.
- **Lo Specchio raddoppia le zone.** +1 nube o pozza per ogni lancio, fino a +2: con le armi a zone vale molto più che con la Lanterna, che non ne beneficia.
- **Lo Scudo di ferro è fisso.** +1 armatura toglie il 20% del danno a un pipistrello (5) e il 3% a un colpo del Mietitore (oltre 30): fortissimo all'inizio, inutile dopo.
- **Calamita e Ali di falena non cambiano l'esito.** Il bot e la tua partita le prendono per ultime.
- **Lanterna, Pala, Falce, Lama di luce e Campana stanno tutte tra 47 e 80**: nessuna ha un ruolo che le altre non abbiano.

## Principi e ispirazioni

La build deve nascere da scelte con un prezzo, non da numeri che salgono: ogni oggetto forte chiede qualcosa in cambio, e gli oggetti migliori cambiano il modo di muoversi. Da ogni gioco prendiamo un meccanismo, non il contenuto.

| Gioco | Meccanismo | In Death's Lumen |
| --- | --- | --- |
| Vampire Survivors | armi che si evolvono unendo un'arma al massimo e un dono | **Unioni**: 10 armi unite, una per arma |
| Hollow Knight | amuleti con un costo in tacche; si può sforare il limite a proprio rischio | **Rosario**: amuleti da equipaggiare in pochi grani; oltre il limite si è in **Peccato** e si subisce il doppio del danno |
| Dark Souls | cure contate (la fiaschetta), anelli con un rovescio, armi infuse con un elemento | **Fiaschetta di lumen** al posto del pane casuale; amuleti con un costo; **affinità** delle armi |
| Clair Obscur: Expedition 33 | premio alla schivata fatta all'ultimo istante; stati che si combinano tra loro | **Grazia** dopo una schivata perfetta; **stati** che reagiscono quando si incontrano |
| Dark Souls (patti) | regole scelte all'inizio che rendono la partita più dura e più ricca | **Patti**: difficoltà a scelta per chi va più forte del bot |

Tre regole valgono per tutto:

1. **Ogni oggetto cambia una decisione**: dove stare, quando schivare, chi colpire per primo. Se cambia solo un numero, è un livello di un dono, non un oggetto nuovo.
2. **La forza costa**: tacche del Rosario, salute, un rischio. Il giocatore bravo si prende il rischio e va più forte; quello prudente no.
3. **Si legge a colpo d'occhio**: ogni stato ha un colore e un retino, come i cerchi del Mietitore. Con 400 nemici non si leggono numeri.

## Ritocchi agli oggetti esistenti

La correzione più importante è una regola sola: **nubi e pozze non si sommano sullo stesso nemico**. Ogni nemico subisce il danno di una zona per tipo alla volta; per compensare, ogni zona fa un po' più male. Il resto dà a ogni arma un ruolo suo.

### Armi

| Arma | Ruolo oggi | Proposta | Ruolo dopo |
| --- | --- | --- | --- |
| Turibolo | il più forte, ovunque | zone non cumulative, danno +40% (15 → 21 al livello 8); affinità Sacro | controllo: rallenta e consacra |
| Acqua santa | quasi come il Turibolo | zone non cumulative, danno +30%; le pozze rimangono dove muore un nemico consacrato | trappole sul percorso |
| Lanterna | la più debole tra le iniziali | i nemici colpiti sono **abbagliati**: +15% di danno da tutte le armi per 2 s | prepara il colpo alle altre armi |
| Pala | forte su un bersaglio, area piccola | ogni 4° colpo **stordisce** per 0,6 s; affinità Terra | ferma i nemici grossi |
| Bastone | uguale a Candela e Fuoco fatuo | l'esplosione ferisce in un'area di 40 px; affinità Ombra | danno ad area a distanza |
| Candela | uguale a Bastone | resta la più rapida; ogni fiammella **brucia** (danno nel tempo, Luce) | consuma i nemici deboli |
| Fuoco fatuo | uguale a Bastone | insegue solo **élite e Mietitore** quando ci sono; danno +25% | caccia ai nemici forti |
| Falce | debole, senza identità | ogni uccisione allunga la lama del 2% per 5 s (fino a +30%) | cresce in mezzo alla folla |
| Lama di luce | uguale alla Lanterna | il fendente segue la direzione in cui cammini, non solo destra e sinistra | colpo lungo in linea |
| Campana | la più debole | il secondo rintocco **stordisce**; danno +20% | via di fuga quando sei circondato |

### Doni passivi

| Dono | Problema | Proposta |
| --- | --- | --- |
| Specchio | raddoppia le armi a zone, +2 quantità su 2 livelli | un solo livello; la quantità extra diventa l'amuleto **Specchio rotto** (vedi Oggetti nuovi) |
| Scudo di ferro | +1 armatura fissa: fortissimo all'inizio, inutile dopo | −6% di danno subito per livello (fino a −24%) |
| Calamita | non cambia l'esito | +30% raggio di raccolta e **+5% anime** per livello |
| Ali di falena | non cambia l'esito | +8% velocità e, a ogni livello, +0,1 s di Grazia dopo una schivata perfetta |
| Erbe amare | con il pane raro torna utile | invariato |
| Cuore di cera, Sale nero, Clessidra, Stoppino lungo | equilibrati | invariati |

## Sistemi nuovi

Sei sistemi, ciascuno indipendente: si possono fare e provare uno alla volta. I primi due correggono la sfida; gli altri quattro creano le build.

### 1. Fiaschetta di lumen (cure contate)

Ogni personaggio ha una fiaschetta con **3 sorsi**; un sorso cura il 35% della salute in 1 s, con il tasto della fiaschetta. Si ricarica di 1 sorso uccidendo un'élite e di tutti i sorsi uccidendo il Mietitore. Il pane resta, raro (uno ogni 45 s al massimo). Così curarsi è una decisione: bere adesso o tenerlo per il Mietitore?

### 2. Grazia (schivata perfetta)

Uscire da un cerchio rosso, o evitare una falce spettrale, **negli ultimi 0,25 s** prima del colpo dà 3 s di Grazia: +30% danno, +15% velocità, il personaggio brilla di bianco a retino. È il premio per chi legge i preavvisi del Mietitore, ed è la prima abilità che il bot non sa usare bene: misura la bravura, non la build.

### 3. Affinità e stati

Ogni arma ha un'affinità; colpendo lascia sul nemico uno **stato** di 3 s, visibile come un retino colorato sopra lo sprite.

| Affinità | Armi | Stato | Effetto | Colore |
| --- | --- | --- | --- | --- |
| Luce | Lanterna, Candela, Lama di luce | Abbagliato | subisce +15% danno | ambra |
| Sacro | Turibolo, Acqua santa, Campana | Consacrato | va più lento del 25% | oro |
| Ombra | Bastone, Fuoco fatuo, Falce | Maledetto | perde il 2% della salute al secondo | viola |
| Terra | Pala | Sepolto | si ferma per 0,6 s (una volta ogni 4 s) | seppia |

Due stati diversi sullo stesso nemico fanno una **reazione** e si consumano:

| Stati | Reazione | Cosa fa |
| --- | --- | --- |
| Luce + Ombra | Eclissi | esplosione di 80 px, danno pari al 20% della salute massima del nemico |
| Luce + Sacro | Rivelazione | il nemico lascia il doppio delle anime |
| Sacro + Ombra | Esorcismo | il nemico esplode in 3 fiammelle che inseguono i vicini |
| Terra + qualsiasi | Interramento | il nemico resta fermo 1,5 s e subisce +30% danno |

I colori sono quelli dei quattro personaggi: chi vede il colore sa da dove viene lo stato.

### 4. Rosario (amuleti a grani)

Un Rosario con **3 grani**, +1 per ogni Mietitore ucciso (al massimo 5). Ogni amuleto costa da 1 a 3 grani. Gli amuleti si trovano nei reliquiari: invece di un potenziamento a caso, il reliquiario offre la scelta tra **3 amuleti o 1 potenziamento**. Si possono equipaggiare amuleti oltre i grani: si è in **Peccato** e si subisce il doppio del danno finché non se ne toglie uno.

### 5. Unioni

Un'arma al livello 8 più un dono passivo specifico al livello 3 o più: il reliquiario successivo trasforma l'arma nella sua versione unita, con un'icona e un effetto nuovi. Le dieci unioni sono in «Oggetti nuovi».

### 6. Patti (difficoltà a scelta)

Prima della notte si possono stringere fino a 3 patti; ognuno rende la notte più dura e dà più anime.

| Patto | Cosa cambia | Anime |
| --- | --- | --- |
| Patto della Falce | il Mietitore arriva anche al minuto 12:30 | +20% |
| Patto del Silenzio | niente pane | +15% |
| Patto della Folla | +25% nemici in campo | +25% |
| Patto del Buio | l'alone di luce è più piccolo del 30% | +15% |
| Patto dell'Ombra | le élite arrivano ogni 35 s invece di 55 | +20% |

Con i patti la sfida si regola sul giocatore: il bot vince il 40% delle notti senza patti, tu le giochi con due o tre.

## Oggetti nuovi

In tutto 28 oggetti nuovi: 4 armi, 4 doni, 10 amuleti e 10 armi unite. Ognuno ha bisogno di un'icona; le armi e le unioni anche di un effetto.

### Armi (diventano 14)

| Arma | Affinità | Cosa fa | Ruolo che manca oggi |
| --- | --- | --- | --- |
| Lapide | Terra | ogni 4 s una lapide cade sul nemico con più salute in vista: 120 danni e lo seppellisce | uccidere élite e Mietitore |
| Rosario spezzato | Ombra | un grano rimbalza tra 4 nemici vicini, maledicendoli | danno a catena nella folla |
| Corvo | Luce | un corvo vola intorno, becca il nemico più vicino e ti riporta le anime lontane | raccolta e difesa insieme |
| Velo funebre | Sacro | un'aura di 110 px che consacra chi entra e lo rende più lento | difesa ravvicinata |

### Doni passivi (diventano 13)

| Dono | Per livello | Massimo |
| --- | --- | --- |
| Cera votiva | +15% durata di zone e stati | 5 |
| Chiodo di bara | +6% probabilità di colpo critico (danno doppio) | 5 |
| Lacrima di lumen | +1 sorso della fiaschetta | 2 |
| Campanella d'argento | la finestra della schivata perfetta passa da 0,25 a 0,35 s, poi 0,45 s | 2 |

### Amuleti del Rosario

Ogni amuleto ha un rovescio: si sceglie cosa sacrificare.

| Amuleto | Grani | Vantaggio | Rovescio |
| --- | --- | --- | --- |
| Specchio rotto | 3 | +1 proiettile, nube, fiala, fuoco o falce per tutte le armi | subisci +25% danno |
| Lanterna cieca | 2 | +35% danno | niente alone di luce: buio pieno |
| Cuore avido | 2 | +30% anime | il pane e la fiaschetta curano la metà |
| Sangue freddo | 1 | sotto il 30% di salute, +40% danno | nessuno |
| Martire | 3 | ogni colpo subito libera un'onda sacra di 150 px | −20% salute massima |
| Danza macabra | 2 | la Grazia scatta anche sfiorando i nemici normali | la Grazia dura 2 s invece di 3 |
| Ceri gemelli | 2 | l'abilità speciale ha 2 cariche | ricarica +30% |
| Lucciola | 1 | l'alone di luce è più grande del 20%; i nemici nell'alone sono abbagliati | nessuno |
| Ossa d'élite | 1 | le élite lasciano 2 reliquiari | le élite hanno +40% salute |
| Patto di sangue | 2 | ogni uccisione cura 0,2 di salute | non puoi più usare la fiaschetta |

### Unioni (arma al livello 8 + dono al livello 3)

| Arma | + Dono | Arma unita | Effetto nuovo |
| --- | --- | --- | --- |
| Lanterna | Stoppino lungo | Faro dei morti | l'arco diventa un cerchio pulsante che abbaglia tutto intorno |
| Pala | Scudo di ferro | Vanga del custode | ogni colpo pianta una lapide che blocca i nemici per 3 s |
| Turibolo | Erbe amare | Incensiere dell'ultima ora | le nubi ti curano 1 salute al secondo se ci stai dentro |
| Bastone | Clessidra | Verga dei nomi | ogni 5ª raffica colpisce tutti i nemici maledetti sullo schermo |
| Candela | Cuore di cera | Candelabro funebre | le fiammelle lasciano una scia che brucia |
| Falce | Sale nero | Falce del Mietitore | uccide all'istante i nemici normali sotto il 15% di salute |
| Campana | Cera votiva | Campana a morto | ogni rintocco stordisce per 0,8 s |
| Fuoco fatuo | Calamita | Fuochi erranti | i fuochi raccolgono le anime che attraversano |
| Acqua santa | Lacrima di lumen | Acquasantiera | le pozze ricaricano un sorso ogni 40 nemici uccisi dentro |
| Lama di luce | Ali di falena | Lama dell'alba | un secondo fendente parte dove eri 0,5 s prima |

## Build sinergiche

Otto build, due per personaggio: una segue il carattere del personaggio, l'altra lo porta altrove. Ognuna vive di una reazione o di un rischio, non solo di numeri; gli amuleti stanno in 5 grani, quelli che si hanno dopo il secondo Mietitore.

| Build | Personaggio | Armi | Doni chiave | Amuleti (grani) | Come si gioca |
| --- | --- | --- | --- | --- | --- |
| Guida nel buio | Lampionaio | Lanterna → Faro dei morti, Fuoco fatuo, Bastone, Rosario spezzato | Stoppino lungo, Sale nero | Lucciola (1), Sangue freddo (1), Ceri gemelli (2) | la luce abbaglia, l'Ombra maledice: ogni nemico vicino fa **Eclissi**; si sta al centro della folla |
| Lanterna cieca | Lampionaio | Lanterna, Candela, Lama di luce, Corvo | Ali di falena, Campanella d'argento | Lanterna cieca (2), Danza macabra (2), Sangue freddo (1) | buio pieno e danno alto: si vive di Grazia, schivando all'ultimo istante |
| Custode del camposanto | Becchino | Pala → Vanga del custode, Lapide, Campana, Velo funebre | Scudo di ferro, Cuore di cera | Martire (3), Ossa d'élite (1), Sangue freddo (1) | si ferma e incassa: ogni colpo subito libera un'onda, Terra + Sacro fa **Interramento** |
| Scavatore di tombe | Becchino | Pala, Lapide, Falce → Falce del Mietitore, Fuoco fatuo | Sale nero, Chiodo di bara | Cuore avido (2), Ossa d'élite (1), Ceri gemelli (2) | caccia a élite e Mietitore: Lapide e Fuoco fatuo cercano i nemici forti, più reliquiari e più anime |
| Processione | Badessa | Turibolo → Incensiere, Acqua santa, Campana, Velo funebre | Erbe amare, Cera votiva | Martire (3), Lucciola (1), Sangue freddo (1) | si cammina piano dentro le proprie nubi: consacrati e lenti, i nemici non arrivano |
| Inquisizione | Badessa | Turibolo, Candela, Lama di luce, Corvo | Chiodo di bara, Stoppino lungo | Specchio rotto (3), Danza macabra (2) | Sacro + Luce fa **Rivelazione**: anime doppie e livelli rapidi, pagati con il +25% di danno subito |
| Maleficio | Strega | Bastone → Verga dei nomi, Rosario spezzato, Falce, Fuoco fatuo | Clessidra, Cera votiva | Specchio rotto (3), Ceri gemelli (2) | tutto maledice: la Verga colpisce ogni maledetto sullo schermo; il Rito proibito li raduna |
| Messa nera | Strega | Bastone, Acqua santa, Velo funebre, Candela | Clessidra, Lacrima di lumen | Patto di sangue (2), Lucciola (1), Sangue freddo (1) | Sacro + Ombra fa **Esorcismo** a catena; ci si cura uccidendo, senza fiaschetta |

Le iniziali restano esclusive: la Badessa non trova la Lanterna, la Strega non trova il Turibolo. Le due build «fuori carattere» usano per questo le armi comuni della stessa affinità.

## Piano e decisioni

Sette tappe, dalla più urgente (la 1, la 2 e la 3 sono fatte il 3 novembre); ognuna si chiude con la simulazione del bot e una tua partita sul telefono. Le prime due non chiedono disegni nuovi e correggono la sfida; dalla terza servono icone ed effetti, che all'inizio faccio a retino dal codice come segnaposto.

1. **Ritocchi** (sezione «Ritocchi agli oggetti esistenti», solo numeri): zone non cumulative, Specchio a un livello, Scudo di ferro in percentuale, Calamita con anime, Campana più forte. Disegni: nessuno.
2. **Fiaschetta e Grazia.** Il bot impara a bere e a schivare all'ultimo istante. Disegni: icona della fiaschetta.
3. **Affinità, stati e reazioni**, con i ruoli nuovi delle armi (abbagliare, stordire, bruciare). Disegni: 4 effetti di reazione.
4. **Rosario e 10 amuleti**, con il Peccato e i reliquiari che offrono la scelta. Disegni: 10 icone e il grano del Rosario.
5. **4 armi e 4 doni nuovi.** Disegni: 8 icone e 4 effetti.
6. **10 unioni.** Disegni: 10 icone e 10 effetti.
7. **Patti**, scelti nel menu prima della notte. Disegni: 5 icone.

**Con la meta progressione** (deciso con Edoardo il 3 novembre): la tappa 1 è fatta; dopo le tappe 2 e 3 si costruisce la meta di base (salvataggio, Cera, Cappella, personaggi da sbloccare), poi le tappe 4–7 arrivano ognuna con la sua regola di sblocco nella Cappella. Dettagli nella proposta sulla meta progressione.

In tutto servono 35 icone e 18 effetti; i numeri di ogni oggetto vanno in `src/data/` e nel GDD, come gli altri.

### Da decidere

- [ ] La fiaschetta **sostituisce** il pane o lo **affianca** (proposta: lo affianca, il pane resta raro)?
- [ ] Il Rosario parte da **3 grani** o da 2?
- [ ] Il Peccato (doppio danno oltre i grani) è un rischio giusto o troppo punitivo?
- [ ] I patti sono disponibili da subito o si sbloccano con la prima vittoria?
- [ ] Nomi degli oggetti: quali tenere, quali cambiare.
- [ ] Disegni: tutte le icone tue fin dall'inizio, o segnaposto dal codice e poi i tuoi uno alla volta?
- [ ] L'ordine delle tappe va bene, o preferisci partire dalle build (tappe 3–4) prima della Fiaschetta?
