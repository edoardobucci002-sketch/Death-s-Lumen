# Death's Lumen — GDD

Il gioco a stanze **com'è oggi**: contenuti, regole e numeri attuali, gli stessi di `src/data/` (il codice è la fonte di verità). Qui non c'è la storia dei numeri: i ritocchi e le simulazioni sono in [bilanciamento.md](bilanciamento.md), le scelte con data in [decisioni.md](decisioni.md), cosa resta da fare in [roadmap.md](roadmap.md), gli asset da disegnare in [asset_da_creare.md](asset_da_creare.md). Le voci segnate *da rivedere* sono valori proposti da Claude e non ancora confermati da Edoardo.

> **Il pivot (12/11/2026).** Il gioco è un action roguelite a stanze alla Hades, progettato in [proposte/pivot-hades.md](proposte/pivot-hades.md). Entra qui un pezzo alla volta, quando quel pezzo esiste nel codice. Il survivor-like di prima è congelato: il suo GDD è in [survivor/GDD-survivor.md](survivor/GDD-survivor.md), e le parti che il gioco a stanze riusa (personaggi, abilità, nemici, stati, Rosario, interfaccia, luce) per ora si leggono lì. Quando una parte passa nel gioco a stanze, si sposta qui.

Unità: le distanze sono in pixel di gioco, le velocità in pixel al secondo, i tempi in secondi.

## Il gioco a stanze (`src/data/stanze.ts`)

Il gioco a stanze nasce accanto al survivor e si raggiunge **solo dal link di prova** (e in sviluppo): pulsante «Stanze (prova)» del menu, LAB → Stanze → «Entra nella stanza», oppure `?stanze` nell'indirizzo. Il progetto completo è in [proposte/pivot-hades.md](proposte/pivot-hades.md); qui c'è solo ciò che esiste già nel codice. Oggi: la fetta verticale (attacco a tasto, nemici con avviso, Grazia, abilità caricata colpendo, Echi) dentro la mappa del Mondo, con il Campanaro, la porta del Boss che si apre con la sua chiave e una fine provvisoria nella stanza del Boss.

- **La stanza è una cripta** (decisione di Edoardo del 16/11; `CRIPTA` in `src/data/stanze.ts`, `src/sistema/stanza.ts`, disegni in `AMBIENTI/Cripta`): un pavimento a grandi lastre di pietra consumata, chiuso da muri. In alto una facciata a grossi blocchi, vista di fronte, con qualche nicchia con una candela spenta e una croce e qualche pilastro; ai lati e in basso la cima dei muri, vista dall'alto (quello di destra è lo specchio di quello di sinistra). A ogni stanza le lastre e i pezzi della facciata si scelgono a caso: le due lastre lisce escono 5 volte su 12 ciascuna, quella crepata e quella con l'iscrizione 1 su 12; i due pezzi lisci della facciata 4 su 10 ciascuno, la nicchia e il pilastro 1 su 10 (*da rivedere*). Se i disegni mancano, o con LAB → Stanze → «Stanza dal codice», resta il disegno del codice di prima (lastre e mattoni).
- **Grandezza**: 13 × 7 lastre, come le stanze di The Binding of Isaac (scelta di Edoardo del 12/11, misure confermate il 16/11): la stanza intera sta più o meno in uno schermo.
- **Il Lampionaio** (l'unico personaggio della fetta) cammina con il joystick o con WASD e le frecce, alla sua velocità di sempre (245 px/s + 10%). I muri lo fermano: i suoi piedi restano dentro il pavimento, a qualche pixel dai bordi; il corpo si disegna davanti alla facciata del muro in alto.
- **Telecamera**: tiene il Lampionaio sempre al centro, come nel survivor (confermato da Edoardo il 12/11); vicino ai muri, oltre il muro si vede il fondo scuro.
- **Linea dei joystick**: una linea invisibile al centro esatto dello schermo divide i joystick (decisione di Edoardo del 12/11). Il joystick di movimento nasce solo se il dito si appoggia a sinistra della linea, e la sua base resta tutta tra il bordo sicuro dello schermo e la linea; a destra il dito non muove il personaggio (è del joystick d'attacco). LAB → Stanze → «Linea al centro» la mostra.
- **I joystick** (decisione di Edoardo del 13/11, `JOYSTICK_STANZE`, `src/sistema/joystick-stanze.ts`): disegnati dal codice, solo nel gioco a stanze (il survivor tiene quelli di Edoardo). Due personalità: il **movimento** è un anello sottile color crema con il contorno scuro e un pomello pieno color crema; l'**attacco** è un disco pieno nel colore del personaggio (più scuro dentro) con una fiammella come pomello. Base di 72 pixel disegnati (quella del survivor: 84), pomello di 28, ingranditi come il joystick del survivor. Sono trasparenti al 70%: una trasparenza vera, eccezione alla regola del retino solo per i comandi. La grandezza non si regola più.
- **Luce e buio**: gli stessi del survivor ([GDD del survivor](survivor/GDD-survivor.md), sezione 11, «Mondo, luce e comandi»), con il tremolio della fiamma.
- **Orientamento**: in orizzontale su ogni dispositivo. Su un telefono o un tablet in verticale il gioco si ferma e compare «Ruota il telefono».
- **Pausa provvisoria**: pulsante provvisorio piccolo in alto a destra (14 pixel disegnati dal codice, ingranditi 2 volte; l'area di tocco arriva comunque a 44 punti), P o Esc, Indietro, e quando l'app va in secondo piano; il gioco dietro si oscura a retino; «Riprendi» e «Menu» (*da rivedere*: la pausa vera del gioco a stanze si progetta più avanti). M accende e spegne i suoni.

| Valore della stanza | Numero | Note |
| --- | --- | --- |
| Pavimento | 832 × 448 px | 13 × 7 lastre, alla Isaac (*da rivedere* le misure) |
| Muri | in alto 96 px, ai lati 32 px, in basso 32 px | in alto la facciata, vista di fronte |
| Bordi per i piedi | ai lati 18 px, in alto 10 px, in basso 6 px | quanto i piedi si avvicinano ai muri (*da rivedere*) |
| Lastre del pavimento | 64 px | |
| Mattoni della facciata | 32 × 16 px | solo nel disegno del codice, sfalsati di mezzo mattone a ogni riga |
| Ombra del muro | 10 px | fascia scura sul pavimento ai piedi della facciata |

**L'attacco a tasto** (passo 3, `ATTACCO` in `src/data/stanze.ts`, `src/sistema/attacco.ts`; ricarica, arco e danno livello per livello in «Le armi nelle stanze», qui sotto). Il Lampionaio usa la Lanterna a mano: il colpo è un arco davanti a lui nella direzione scelta, disegnato dal **Fendente** pixelfx (una mezzaluna dorata che spazza l'arco dall'alto in basso e si sfalda a retino; un foglio per misura della Lanterna, `PIXELFX.fendente` in `src/data/effetti.ts`, 16 direzioni), e ferisce ogni nemico dentro l'arco (distanze misurate tra i piedi), con un lampo bianco, il numero del danno e una piccola spinta.

- **Telefono** (stile Brawl Stars, decisione di Edoardo del 12/11): un joystick d'attacco fisso in basso a destra, nella metà destra dello schermo, grande come il joystick di movimento. Un tocco breve colpisce il nemico più vicino entro 320 px; se non ce n'è, colpisce dove guarda il Lampionaio (l'ultima direzione in cui ha camminato). Trascinando, il pomello segue il pollice fino al bordo della base, a terra compare la mira (il contorno dell'arco, color crema: l'arancione è degli avvisi a distanza) e, lasciando il dito, il colpo parte in quella direzione; tornando al centro prima di lasciare, il colpo torna automatico. Durante la ricarica il joystick si scurisce.
- **Computer**: clic sinistro verso il puntatore, J verso il nemico più vicino; il mouse non fa comparire il joystick (si cammina con WASD e le frecce) e il tasto tondo non si vede.
- Un colpo chiesto durante la ricarica parte appena la ricarica finisce. Durante il colpo il Lampionaio si gira verso il colpo, si sporge di qualche pixel e fa **la mossa intera** dell'animazione `attack` (decisione di Edoardo del 13/11): 8 fotogrammi, 0,385 s, l'asta che sale e cala. **Il danno arriva quando l'asta cala**, 0,155 s dopo il tocco (`ATTACCO.anticipo`, *da rivedere*), insieme al Fendente e al suono; la ricarica (0,45 s) parte dal tocco. Uno sprite senza `attack` resta girato 0,15 s (`ATTACCO.posa`) e colpisce subito.
- Colpito, il Lampionaio fa l'animazione `hurt` (0,24 s; interrompe anche il colpo, ma il danno del colpo già partito arriva lo stesso). Caduto, fa `death` una volta sola e resta a terra; «Sei caduto» arriva 0,9 s dopo. Uno sprite senza `death` cade di lato e si scurisce, come prima.

| Valore dell'attacco | Numero | Note |
| --- | --- | --- |
| Mira automatica | entro 320 px | tocco breve e J (*da rivedere*) |
| Posa del colpo | 0,15 s, slancio 3 px | segnaposto dell'animazione `attack` |
| Joystick d'attacco | grande come il joystick di movimento; 14 px dal bordo sicuro | area di tocco di almeno 44 punti |
| Disegno dei joystick | base 72 pixel disegnati, pomello 28, anello 3; trasparenti al 70% | movimento e attacco (*da rivedere*) |
| Trascinamento | 52 punti per la mira piena, zona morta 30% | sotto la zona morta il tocco è automatico |

**I nemici e la Grazia** (passo 4, `NEMICI_STANZA`, `ONDATA`, `COMBATTIMENTO_STANZA` e `GRAZIA_STANZA` in `src/data/stanze.ts`; `src/sistema/nemici-stanza.ts`). Tutti i numeri sono proposte di Claude, *da rivedere*.

- **Il Lampionaio si può ferire**: 100 di salute. La salute non si rigenera da sola: lo farà con oggetti o poteri che lo permettono, da inventare (decisione di Edoardo del 13/11). La barra della salute è quella del survivor, sotto i piedi. Colpito, si illumina di bianco, lo schermo trema un poco e il telefono vibra. Toccare un nemico non fa male: fa male solo un attacco con il suo avviso (confermato da Edoardo il 13/11).
- **Quiete** (decisione di Edoardo del 13/11): dopo un colpo, per un attimo non si prendono altri danni. Il Lampionaio resta in Quiete 0,5 s (lampeggia); è una sua statistica, che le carte potranno migliorare. I nemici restano in Quiete 0,3 s, ma **ogni arma ha la sua**: la Lanterna non ferisce di nuovo lo stesso nemico per 0,3 s, il Cerchio di luce sì (e viceversa). Il Cerchio di luce ferisce solo quando si accende, poi abbaglia ogni 0,3 s. È la stessa parola della Quiete delle reazioni (un nemico non reagisce di nuovo per 3 s), scelta di Edoardo.
- **Il Ricaduto** (sprite V1 del 13/11 fatto con PixelLab: un contadino morto da poco, curvo, con un forcone a tre rebbi e una crepa di Lumen sul petto) cammina dritto e lento verso il Lampionaio. A 56 px si ferma e comincia l'**avviso**: alza il forcone sopra la testa a due mani (la prima metà dell'animazione `attack`, stirata sulla durata dell'avviso, così il forcone cala nell'istante del danno), lampeggia di rosso e a terra compare uno spicchio rosso davanti a lui che si riempie. La direzione è decisa all'inizio dell'avviso. Allo scadere graffia tutto lo spicchio, poi resta fermo un attimo. Battuto, fa la sua animazione `death` e resta sempre a terra 1,5 s senza poter essere colpito (decisione di Edoardo del 13/11). Se si rialzerà, lo si decide quando cade e, appena è steso, **una crepa sulla schiena pulsa di luce ambra** (animazione `special`, decisione di Edoardo del 14/11); se non pulsa, sparirà; poi, 2 volte su 10 (decisione di Edoardo del 13/11 sera), si rialza con metà della salute, se no sparisce. Si rialza una volta sola.
- **Il Cantore** (sprite V1 del 13/11 fatto con PixelLab: un cantore dei funerali con tonaca grigio-azzurra, cappuccio e libro dei canti, la bocca accesa di Lumen) resta tra 200 e 250 px dal Lampionaio: si allontana se ti avvicini, si avvicina se ti allontani. Quando ha ricaricato e sei entro 360 px si ferma, e a terra compare una **linea arancione** verso di te fino al muro (l'avviso; gli avvisi a distanza sono arancioni, quelli corpo a corpo rossi: decisione di Edoardo del 13/11): lampeggia, resta accesa nell'ultimo terzo, e il grumo cresce nella sua bocca mentre canta. Quando lo sputa, il grumo parte dalla bocca e in 0,3 s scende in volo fino alla sua altezza (`bocca` in `NEMICI_STANZA.cantore`: [7, 87] mentre canta e [46, 72] quando sputa, px in avanti e in alto dai piedi, misurati sullo sprite V1; *da rivedere*). L'animazione dello sputo non disegna più il grumo: lo disegna solo il gioco. Poi lancia un grumo di Lumen spento che **ti cerca** (decisione di Edoardo del 13/11 sera): per 1,4 s gira verso di te, ma di al massimo 125° al secondo, poi va dritto. Così non è impossibile da schivare: chi cammina si allontana più svelto del grumo (270 contro 210 px/s), e un passo di lato quando il grumo è a circa 45 px lo fa passare oltre (la schivata perfetta). Una schivata sola per grumo. In volo il grumo è una goccia di cera grigio-azzurra che ribolle, con una scia di tre gocce (effetto pixelfx disegnato per il gioco, `Pixelfx_Cera_grumo`). Quando scoppia, contro il muro o su di te, lascia una **pozza di cera** a terra dello stesso colore: uno schizzo con una corona di gocce, poi la pozza larga 68 px (alta la metà) con riflessi e bolle; resta 2 s e alla fine si rapprende e sparisce a retino (`Pixelfx_Cera_pozza`); ferisce di 6 chi ci passa sopra (il danno segue la Quiete del Lampionaio: al massimo uno ogni 0,5 s) e negli ultimi 0,3 s la sua area si restringe. Al massimo 16 pozze insieme (*raggio, danno e ricerca da rivedere*).
- **Animazioni dei nemici** (dal 14/11): l'avviso è la prima metà di `attack` stirata sulla sua durata, la seconda metà scorre nel recupero (il Cantore canta, poi sputa il grumo). Il Ricaduto che si rialza fa `death` al contrario, fermo finché non è in piedi. Il Cantore battuto fa `death`, intoccabile, e poi sparisce. Uno sprite senza questi tag trema nell'avviso e a terra si stende di lato e si scurisce.
- I nemici non si sovrappongono tra loro. Ferito, un nemico mostra sotto i piedi una barra della salute piccola.
- **Grazia** (`GRAZIA_STANZA`; partita da quella del survivor, si sviluppa per conto suo: decisione di Edoardo del 13/11): la schivata perfetta è uscire dallo spicchio del graffio quando mancano al massimo 0,25 s, oppure farsi passare un grumo vicino, entro 30 px oltre il contatto, senza farsi toccare. Nell'istante della schivata il gioco va **al rallentatore**: parte al 60% della velocità e torna normale in 0,35 s con una curva morbida. La logica avanza comunque 60 volte al secondo, a passi più corti, così non va a scatti. Poi 3 s di Grazia: +30% danno (anche del Cerchio di luce) e +15% velocità, il Lampionaio si illumina a lampi e sopra la testa compare «Grazia». Una Grazia nuova non accorcia quella in corso. Durata, finestra, sfioro e bonus sono statistiche del Lampionaio che le carte del passo 6 potranno migliorare. Le tacche del survivor non ci sono.
- **Impatto dei colpi della Lanterna** (`IMPATTO`, `src/sistema/impatto.ts`, decisione di Edoardo del 13/11): quando un colpo prende un nemico, il nemico diventa bianco per 0,16 s (il bianco del survivor, che lì dura 0,033 s); il Lampionaio e i nemici colpiti si fermano per 0,067 s, cioè 4 fotogrammi (*da rivedere*) (il **fermo d'impatto**: gli altri nemici e i grumi continuano; dal LAB si spegne); il nemico si schiaccia (più largo del 25% e più basso del 25%, poi torna in 0,1 s); dal punto colpito schizzano 6 scintille nella direzione del colpo, 12 verso l'alto quando lo batti; lo schermo trema di 1 pixel e c'è un suono sordo diverso dal colpo a vuoto.
- **Come arrivano**: in punti a caso a più di 240 px dal Lampionaio; dove sta per comparire un nemico, per 0,7 s a terra c'è un anello che si stringe (in quel momento le armi non lo toccano). Al massimo 24 nemici in campo. Quanti e quando, stanza per stanza, lo decide il percorso (qui sotto).
- **Nella Orda del survivor** (decisione di Edoardo del 13/11): Ricaduto e Cantore vivono nello stesso contenitore dei nemici del survivor, in fondo al suo elenco di tipi (il survivor non li fa mai nascere: 8 notti del bot identiche prima e dopo). Così gli Echi, gli stati e le reazioni li toccano come nel survivor. Chi è sepolto, interrato o fermato non fa niente, nemmeno l'avviso: il suo attacco aspetta. La Lanterna a mano e il Cerchio di luce lasciano lo stato di Luce (Abbagliato).
- **Caduta**: a salute zero il Lampionaio resta steso e scuro; dopo 0,9 s compare «Sei caduto» con i nemici battuti, «Ricomincia» (la stanza da capo) e «Menu». Il tasto Indietro, da lì, torna al menu.

| Valore dei nemici | Numero | Note |
| --- | --- | --- |
| Lampionaio colpito | corpo 14 px, Quiete 0,5 s | |
| Quiete dei nemici | 0,3 s, per ogni arma | |
| Grazia | finestra 0,25 s, sfioro 30 px; 3 s, +30% danno, +15% velocità | |
| Rallentatore | dal 60% in 0,35 s | all'inizio della Grazia, torna normale con una curva morbida |
| Ricaduto | salute 60, velocità 60 px/s, corpo 16 px | da 4 a 5 colpi della Lanterna al livello 1, 3 o 4 in Grazia |
| Graffio | avviso 0,5 s da 56 px; spicchio di 72 px e 110°; danno 15; fermo 0,7 s dopo | |
| Rinascita | 20%, dopo 1,5 s a terra, con il 50% della salute | una volta sola |
| Cantore | salute 35, velocità 75 px/s, corpo 15 px, tra 200 e 250 px | 2 o 3 colpi della Lanterna al livello 1 (salute decisa da Edoardo il 14/11) |
| Avviso del canto | 0,8 s entro 360 px; primo canto dopo 1,2 s; ricarica 2,4 s | |
| Grumo | velocità 210 px/s, raggio 9 px, danno 12; ti cerca per 1,4 s, al massimo 125°/s | *da rivedere* |
| Pozza di cera | 2 s, raggio 34 px, danno 6; si restringe negli ultimi 0,3 s | *da rivedere* |
| Spinta | 10 px | non durante l'avviso |
| Impatto | bianco 0,16 s; fermo 0,067 s (4 fotogrammi); schiacciamento 0,1 s; scintille 6, battuto 12 | scossa di 1 px; bianco e fermo *da rivedere* |
| Ondata | 3 Ricaduti e 2 Cantori, a più di 240 px; segno 0,7 s; prima dopo 0,8 s | quella del pulsante «Ondata» del LAB |

**L'abilità caricata colpendo** (passo 5, `ABILITA_STANZA` in `src/data/stanze.ts`, `src/sistema/abilita-stanza.ts`). Il Cerchio di luce del Lampionaio si carica **solo** con i colpi della Lanterna a segno (decisione del 12/11): piena dopo 8 colpi, e un colpo conta 1 anche se prende più nemici (decisione di Edoardo del 13/11). Mentre il cerchio è acceso non si carica.

- **Il pulsante**: un tondo scuro con l'icona del Cerchio di luce, a sinistra del joystick d'attacco, trasparente come lui, con un'area di tocco che esce di 10 punti dal disegno. L'anello ha 8 tacche che si accendono in senso orario nel colore del personaggio, una per colpo; piena, l'anello diventa chiaro, l'icona si accende e il telefono vibra. Toccata scarica, trema e fa un tonfo (il tocco è arrivato). Su computer si vede lo stesso, e si usa con Spazio.
- **L'effetto** (decisione di Edoardo del 14/11): un cerchio di 216 px che segue il Lampionaio per 5 s (`ABILITA.cerchioDiLuce`). **Quando si accende ferisce una volta sola** chi c'è dentro, con un colpo grande da 20 a 30 (`ABILITA_STANZA.colpo`, danno a intervallo come le armi; +30% in Grazia); **poi abbaglia soltanto**, senza ferire, chi c'è dentro ogni 0,3 s (con il ritmo delle zone), e lo fa camminare il 55% più lento. Ha la sua Quiete, separata da quella della Lanterna.

| Valore dell'abilità | Numero | Note |
| --- | --- | --- |
| Carica | 8 colpi a segno; il cerchio abbaglia ogni 0,3 s | un colpo conta 1, solo con la Lanterna |
| Colpo dell'accensione | 20–30 | una volta sola (confermato da Edoardo il 16/11) |
| Pulsante | 36 pixel disegnati, 14 px dal joystick d'attacco; area di tocco 10 punti più larga | ingrandito come i joystick |

**La mappa del Mondo, porte e carte** (mappa alla The Binding of Isaac dal 17/11, passo 2; prima la fila di tre stanze della fetta, passo 6 del 13/11. `MAPPA` in `src/data/mappa.ts`, `PERCORSO` e `PORTE` in `src/data/stanze.ts`; `src/sistema/mappa.ts`, `src/sistema/percorso.ts`, `src/sistema/porte.ts`). Numeri di Claude, *da rivedere* dove non è scritto altro.

- **La mappa** (decisioni di Edoardo del 17/11): a ogni Veglia il gioco genera con il seme una mappa alla Isaac, da **12 a 15 stanze** (a caso, ingresso e capi compresi) su una griglia di 9 × 8 caselle (*da rivedere*). La mappa cresce dall'ingresso al centro; ogni stanza prova ad aprirne una nuova su ogni lato con probabilità 0,5 (va bene a Edoardo, 17/11), e una stanza nuova nasce solo se tocca una stanza sola, così la mappa è fatta di corridoi e rami, senza blocchi né anelli. L'**ingresso** ha almeno 2 porte (Edoardo, 17/11). Il **Boss** è la stanza più lontana dall'ingresso, in un vicolo cieco (una porta sola); il **Campanaro** sta a metà strada (la distanza più vicina a metà di quella del Boss), mai attaccato all'ingresso né al Boss. Su mille semi il Boss sta tra 3 e 10 porte dall'ingresso. `npm run prova` controlla le regole su mille semi. LAB → Stanze → Mappa del Mondo la disegna: la stanza in cui sei ha il bordo chiaro, le ripulite sono spente.
- **Le stanze**: si comincia al centro dell'**ingresso**, vuoto e sicuro (niente nemici né rompibili), con le porte già aperte. Le stanze **attaccate all'ingresso danno gli Echi d'inizio**; le altre hanno una ricompensa a caso tra Luce, Sacro, Ombra, Terra e dono, tutte con lo stesso peso (*da rivedere*). Ogni stanza si combatte una volta: le ondate dipendono da quante porte dista dall'ingresso (vedi la tabella); l'ondata dopo arriva 8 s dopo la precedente (*da rivedere*), anche se ci sono ancora nemici, oppure subito se la stanza si svuota prima. Ripulita e scelta la carta, la stanza resta **vuota, con le porte aperte**, anche tornandoci; i rompibili già rotti restano rotti, e lastre e rompibili sono sempre gli stessi per quella stanza. Si torna indietro quando si vuole.
- **Le carte**: ripulita la stanza, dopo 0,5 s arrivano **2 carte** (Edoardo, 17/11: la terza arriverà con la Fortuna), con il titolo «Un nuovo dono», **verticali e in fila una accanto all'altra** (lo schermo è in orizzontale e ha altezza da usare; `CARTA_STANZA` in `src/data/hud.ts`): 130 × 200 pixel disegnati, ingrandite quanto ci stanno (× 2 sul telefono). Dall'alto: l'icona ingrandita 2 volte in un pozzetto, il nome, «Nuova arma» o il livello, una riga, i numeri e la spiegazione allineati a sinistra, con scritte più grandi di quelle delle strisce (numeri 16, livello 9, spiegazione 9,5; se una spiegazione non ci sta scende da sola). La carta è un segnaposto disegnato dal codice (*Carta_Stanza*, da disegnare). Compaiono **a pop**, prima minuscole poi alla loro grandezza, una dopo l'altra (0,24 s a 6 scatti, 0,1 s l'una dall'altra), e quando ognuna è grande, sull'icona scoppia l'effetto di comparsa (pixelfx «collect-burst» ricolorato in oro, con un piccolo suono). Si sceglie toccando una carta o con 1-2. Mentre le carte sono aperte il gioco è fermo e joystick d'attacco e abilità si nascondono.
- **Da dove pescano le carte**: dalla ricompensa della stanza. Gli **Echi d'inizio** sono Echi nuovi di affinità diverse. Una **stanza d'affinità** (Luce, Sacro, Ombra, Terra) dà Echi nuovi di quell'affinità (finché se ne hanno meno di 3) e livelli degli Echi di quell'affinità che si hanno; dalla Luce anche livelli della Lanterna. Una **stanza del dono** dà doni nuovi (fino a 6) e livelli dei doni che si hanno, solo tra quelli che nelle stanze funzionano: Cuore di cera, Sale nero, Clessidra, Stoppino lungo, Ali di falena, Erbe amare, Scudo di ferro, Specchio, Cera votiva, Chiodo di bara, Campanella d'argento, Calice riverso (decisione di Edoardo del 13/11; resta fuori la Calamita; il Calice riverso entra il 17/11). Se da lì non c'è abbastanza da dare (per esempio gli Echi con la build piena), le carte che mancano sono doni.
- **La fiaschetta** (17/11, `src/sistema/fiaschetta-stanza.ts`, `FIASCHETTA_STANZA` in `src/data/stanze.ts`): **automatica** (idea di Edoardo, al posto del pulsante che affollava lo schermo). 3 sorsi a inizio Veglia (anche il massimo); quando la salute scende sotto il 15% della massima il personaggio beve da solo un sorso, che cura il 35% della salute massima in 1 s. Il **Calice riverso** dà +1 sorso per livello (3 livelli, il sorso nuovo arriva pieno; confermato da Edoardo il 17/11). Nella fetta i sorsi non tornano (torneranno con mini-boss, Boss e Sosta). LAB → Stanze → «Fiaschetta piena».
- **Rarità** (17/11, decisioni di Edoardo; `GRADI` e `GRADO_OGGETTO` in `src/data/rarita.ts`, `pesca` in `src/sistema/percorso.ts`): ogni Eco e ogni dono ha un **grado fisso**, **Fioca**, **Chiara** o **Ardente**, che si vede sulla carta: il nome del grado in alto e il colore del bordo (cenere #8a7a68, arancio #e3913a, oro #fbce4a; sulla carta indicata #cdbca2, #f6b86a, #fff1b8); il bordo dell'Ardente si ingrossa di 1 pixel e torna ogni 0,8 s, a scatti (vanno bene «per ora», Edoardo 17/11). Per ogni carta si tira prima il grado, **Fioca 75%, Chiara 20%, Ardente 5%** (valori di partenza da tarare), solo tra i gradi che la porta può dare in quel momento (le probabilità si ripartiscono su quelli che ci sono), poi un oggetto a caso di quel grado. Ogni carta vale +1 livello, di qualsiasi grado; il grado vale anche per i livelli dopo il primo. Per ora niente alza la rarità. Potenziale e Unione restano a parte, con il loro tag. Gradi di oggi (proposta di Claude, *da rivedere*): **Ardente** Lapide, Rosario spezzato (Edoardo, 17/11) e Specchio; **Chiara** Candela, Fuoco fatuo, Corvo, Sale nero, Clessidra, Scudo di ferro, Chiodo di bara, Calice riverso; **Fioca** tutti gli altri (Abbacinio, Sampietrini, Campana, Acqua santa, Velo funebre, Falce, la Lanterna, Cuore di cera, Ali di falena, Erbe amare, Stoppino lungo, Cera votiva, Campanella d'argento). LAB → Stanze → Rarità delle carte: «Carte Fioca / Chiara / Ardente» fa uscire quel grado quando c'è, «Carte a caso» torna normale.
- **Le carte** (provvisorie, 17/11, richiesta di Edoardo): rettangoli dal fondo scuro (#1c1611) con il bordo del colore del grado (2 pixel; vedi «Rarità»); titolo, tag, numeri e spiegazione in Tiny5 a pixel interi (`CARTA_STANZA.semplice` in `src/data/hud.ts`). La carta disegnata (`Carta_Stanza`, 9-slice) resta nei file per quando Edoardo la ridisegna. Se una porta d'affinità non ha più niente da dare, le carte sono doni.
- **Gli Echi** sono le armi automatiche del survivor e sparano da sole come nel survivor, ma con i numeri del gioco a stanze: 5 livelli e danno a intervallo (vedi «Le armi nelle stanze», qui sotto). Anche **la Lanterna a mano** ha i suoi 5 livelli. Doni: Clessidra accorcia anche la ricarica della Lanterna, Stoppino lungo allarga anche il suo arco, Campanella d'argento allunga la finestra della schivata perfetta (+0,1 s per livello), lo **Specchio** dà i colpi in più a metà danno (`SPECCHIO_STANZE` in `src/data/doni.ts`, Edoardo 17/11: livello 1 «+1 colpo a ogni arma, al 50% del danno», livello 2 «+1 colpo a ogni arma», livello 3 «I colpi in più feriscono al 100% del danno»; al massimo +2 colpi; vale per Candela, Falce, Fuoco fatuo, Acqua santa, Lapide, Rosario spezzato, Corvo, Sampietrini; LAB → Stanze → «Specchio liv 1/2/3»), Erbe amare fanno tornare la salute, Scudo di ferro toglie parte del danno subito.
- **Le porte**: una su ogni muro (in alto, a destra, in basso, a sinistra) dove c'è una stanza accanto; ci si entra camminandoci contro e **si entra nella stanza dopo dalla porta sul muro opposto** (chi esce a destra entra da sinistra), 40 px dentro la stanza (*da rivedere*), guardando verso il centro. Durante il combattimento le porte si vedono chiuse e senza medaglione. Aperte, ognuna ha il **medaglione della ricompensa della stanza a cui porta**: un medaglione di ferro battuto di 31 px con dentro, a grandezza vera, il simbolo dello stato dell'affinità del survivor (Abbagliato per la Luce, Consacrato per il Sacro, Maledetto per l'Ombra, Sepolto per la Terra; dal 16/11, `PORTE.medaglione`, `EFFETTI/Porta_Vuota`), il reliquiario dorato per il dono, e per gli Echi d'inizio un segnaposto (il medaglione vuoto con un rombo crema, *Porta_Echi* da disegnare). Una porta verso una stanza già ripulita non ha medaglione; quella del Boss ha il lucchetto o il medaglione rosso (qui sotto). Il medaglione sta sopra le porte in alto e ai lati, accanto (a destra) a quella in basso. Le porte sono **cancelli di ferro battuto** dentro archi di pietra (16/11): chiusa si vede il cancello con le punte, aperta il cancello è sollevato e in fondo al passaggio c'è un filo di luce ambra. **La porta in basso aperta** non è ancora disegnata: oggi è il vano del codice (scuro con la cornice arancione). Il pezzo intero della porta sta sotto il buio come i muri; **l'arco con il cancello si vede anche nel buio** quando il personaggio è a più di 170 px dal centro della porta (`PORTE.vicino`, *da rivedere*; più vicino la porta è nella luce della lanterna, e l'arco sopra il buio coprirebbe il personaggio). Anche i medaglioni si vedono nel buio. La porta in basso chiusa ha il vano più stretto di quello vero (va bene così, Edoardo, 16/11). Con il disegno del codice la porta chiusa ha le sbarre e quella aperta la cornice arancione, e si vedono anche nel buio.
- **Il passaggio**: il buio si infittisce a retino fino al nero, si cambia stanza e il retino si dirada (0,25 s in tutto; 0,12 s verso una stanza già ripulita, *da rivedere*).
- **Il Campanaro, mini-boss del Mondo 1** (17/11, decisioni di Edoardo; `CAMPANARO` in `src/data/campanaro.ts`, `src/sistema/campanaro.ts`): ha la sua stanza nella mappa, **a metà strada** tra ingresso e Boss: la stessa cripta, senza ondate. Dopo 0,8 s compare lui, dalla parte opposta della stanza rispetto al Lampionaio (segno a terra di 1,2 s), con la sua barra della salute in cima allo schermo e il nome in Tiny5. **Salute 3000**, corpo 24 px, cammina a 70 px/s; non si ferma e non si sposta per i colpi della Lanterna e la Lama di luce non lo accieca; gli stati lo toccano come i bruti. Tra un attacco e l'altro cammina verso di te per 1,3 s, poi sceglie: entro 170 px il **Rintocco** (un disco di 150 px che si riempie in 1 s, poi l'onda: 20 di danno a chi è dentro), più lontano la **Carica** (una linea larga 44 px fino al muro, 0,8 s; poi corre a 520 px/s: 25 di danno; contro il muro resta **stordito 1,5 s**). **Fase 2** sotto metà salute: un Rintocco subito, avvisi e pause all'80%; dopo il disco viene **l'anello** (da 150 a 260 px, avviso 0,7 s, 20 di danno: il posto sicuro torna vicino a lui) e ogni tre attacchi la **Chiamata** (avviso 0,8 s, 2 Ricaduti accanto a lui). Uscire dall'area all'ultimo istante dell'avviso è una schivata perfetta (Grazia). Gli avvisi si riempiono a terra sotto il Lampionaio; i loro bordi chiari e un'ellisse ai piedi del Campanaro si disegnano sopra il buio. Battuto, se ne vanno anche i suoi Ricaduti; poi **un sorso della fiaschetta** (Edoardo, 17/11; a fiaschetta piena si beve subito e cura come un sorso), **10 di Cera** e le 2 carte della ricompensa della sua stanza. Sprite: segnaposto V0 dal codice (`segnaposto/NEMICI/Campanaro`), con le pose di `attack` (campana alzata) e `special` (la Carica). Tutti i numeri sono *da rivedere*.
- **La porta del Boss** (passo 3, 18/11, decisioni di Edoardo): resta **chiusa** finché non si batte il Campanaro, che ha la chiave. Chiusa, sopra il cancello c'è un **lucchetto** (segnaposto dal codice, grigio, 11 × 11 dentro il medaglione vuoto) e spingendoci contro compare sopra la testa «Serve la chiave del Campanaro» con il suono della campana; le altre porte della stanza si aprono come sempre. Battuto il Campanaro (scelta la carta), compare «La porta del capo è aperta» e la porta del Boss si apre con un **medaglione rosso** (segnaposto dal codice: il medaglione vuoto con un rombo rosso scuro). La chiave è il Campanaro battuto, cioè la sua stanza ripulita: si salva con la mappa. Le scritte durano 1,6 s (`PERCORSO.avviso`; durata e Tiny5 sopra la testa confermati da Edoardo il 18/11).
- **La minimappa** (passo 4, 18/11, `MINIMAPPA` in `src/data/mappa.ts`, `src/sistema/minimappa.ts`): nell'**angolo in alto a sinistra** (*da rivedere* sul Galaxy S25: LAB → Stanze → «Minimappa: in alto a destra» la mette accanto alla pausa) una finestra di 5 × 5 stanze attorno a quella in cui sei, disegnata a pixel e ingrandita a pixel interi. Le **stanze visitate sono piene** (quella in cui sei è crema, le altre grigio-marroni), quelle **accanto a una visitata** si vedono solo con il **contorno**; il **Campanaro** ha una campanella arancione e il **Boss** una croce rossa appena si conoscono. Non si tocca (i comandi ci passano sotto). **Nella pausa** c'è la mappa intera di tutto ciò che conosci, sopra Riprendi e Menu, ingrandita fino a 4 volte (meno se non ci sta). Si ricava dalla mappa (stanze visitate), quindi si salva con lei. Simboli e colori sono segnaposto dal codice. LAB → Stanze → «Visita tutte le stanze» la riempie.
- **Il Boss (provvisorio)**: entrati, **le porte si chiudono alle spalle** e non si torna indietro; la stanza è vuota (Seth non c'è ancora) e dopo **1,5 s** (`PERCORSO.attesaCapo`, *da rivedere*) compare la fine provvisoria **«Il capo arriverà qui»**, con i nemici battuti, le schivate perfette e la build (Lanterna, Echi e doni con il loro livello), «Ricomincia» e «Menu». LAB → Stanze → «Chiave del Campanaro» la dà (segna battuto il Campanaro) o la toglie; «Vai al Boss» ci porta anche senza chiave; nella mappa del LAB il Boss ha il bordo tratteggiato finché è chiuso.

| Valore del percorso | Numero | Note |
| --- | --- | --- |
| Stanze | da 12 a 15 per Mondo, ingresso e capi compresi; griglia 9 × 8; crescita 0,5 | a caso a ogni Veglia, con il seme |
| Ingresso | almeno 2 porte | vuoto, porte aperte; le stanze accanto danno gli Echi d'inizio |
| Campanaro | a 0,5 della distanza del Boss | mai accanto all'ingresso né al Boss |
| Ricompense | Luce 1, Sacro 1, Ombra 1, Terra 1, dono 1 | pesi: tutte con la stessa probabilità |
| Ondate | a 1 porta dall'ingresso: 3 Ricaduti e 1 Cantore, poi 3 e 1; a 2 porte: 3 e 1, poi 3 e 2, poi 4 e 2; da 3 porte in su: 4 e 2, poi 4 e 2, poi 5 e 3 | ogni 8 s, o subito se la stanza si svuota |
| Carte | 2, dopo 0,5 s; verticali 146 × 238; pop in 0,24 s a 6 scatti, 0,1 s l'una dall'altra | effetto di comparsa a 12 fotogrammi al secondo; dal 16/11 la carta è un 9-slice: il gioco sceglie l'ingrandimento più grande a cui ci sta la carta più piccola (140 × 214) e poi la allarga per riempire lo spazio, fino a 210 × 320 e senza cambiarne troppo le proporzioni (`CARTA_STANZA.nove`, `minimo`, `massimo`; da rivedere) |
| Build | al massimo 3 Echi e 6 doni | più la Lanterna |
| Porte | larghe 64 px; entrando si compare 40 px dentro la stanza | una per ogni stanza accanto |
| Passaggio | 0,25 s; 0,12 s verso una stanza già ripulita | a retino |
| Stanza del Boss | la fine provvisoria dopo 1,5 s; scritte della porta del capo per 1,6 s | l'attesa è da rivedere |
| Minimappa | stanze di 9 × 5 px con 1 px tra l'una e l'altra; finestra di 5 × 5 stanze ingrandita 2 volte; nella pausa fino a 4 volte | da rivedere |

**Urne, giare e lanterne** (decisioni di Edoardo del 16/11; `ROMPIBILI_STANZE` in `src/data/rompibili.ts`, `src/sistema/rompibili-stanza.ts`). Sono i rompibili del survivor (sezione 8g), con lo stesso contenuto: la giara lascia 2 gocce di Cera, l'urna a volte un frammento di vetro, la lanterna fa luce e rotta lascia una chiazza d'olio. In ogni stanza ce ne sono 1 o 2 (Edoardo, 16/11), disposti a caso lungo i muri, con il centro libero per combattere e nessuno davanti alle porte; il tipo segue le probabilità del survivor (urna e giara il doppio della lanterna). **Fanno da ostacolo**: il personaggio e i nemici ci sbattono contro. **Si rompono solo colpendoli**, con la Lanterna a mano, con gli Echi e con il Cerchio di luce acceso. Le gocce e i frammenti volano verso il personaggio come nel survivor. **La Cera della Veglia va alla Cappella** quando si cade o a fine fetta («Cera +N» nel resoconto; non con l'immortale del LAB e non con il bot). **Frammenti e mosaico** seguono le regole del survivor, ma **da subito** (Edoardo, 16/11; nel survivor solo dopo la prima alba vinta): al 26% delle urne, al massimo 3 per Veglia; 3 frammenti accendono il mosaico e il **Bagliore** (20 s senza danni, il 30% più veloce, luce grande una volta e mezza, chi tocca il personaggio brucia). Tutti i valori *da rivedere*.

| Valore dei rompibili nelle stanze | Numero | Note |
| --- | --- | --- |
| Per stanza | da 1 a 2 | |
| Frammenti dopo | 0 albe vinte | cioè da subito |
| Distanza dal muro | da 24 a 56 px | misurata alla base |
| Lontano dalle porte | 110 px | dal centro di ogni porta, anche quella in basso |
| Distanza tra due rompibili | 72 px | |
| Ingombro | 12 px | raggio dell'ostacolo alla base |
| Raccolta | 60% della raccolta di base | come nel survivor |

**Le armi nelle stanze: 5 livelli e danno a intervallo** (decisioni di Edoardo del 13/11 e del 14/11; `src/data/armi-stanze.ts`). Il survivor resta con le sue tabelle a 8 livelli; il gioco a stanze ha tabelle sue, con gli stessi campi. Tutti i numeri sono proposte di Claude del 14/11, *da rivedere*.

- **Danno a intervallo**: ogni arma ha un danno minimo e un danno massimo; ogni colpo tira a caso un numero tra i due, con il generatore con seme. Poi valgono i doni in percentuale (Sale nero, la Grazia +30%) e il colpo critico (Chiodo di bara). Le carte e la pausa scrivono «Danno 12–18»; quando un livello lo fa crescere, «Danno 12–18 › 16–24» e la spiegazione «+4–6 danno».
- **Come crescono**: i livelli dell'arma aggiungono un intervallo al minimo e al massimo; i doni danno percentuali su tutte le armi (scelta di Edoardo del 14/11, come in Path of Exile).
- **Il carattere di ogni arma**: le armi pesanti hanno un intervallo largo (la Lapide 30–70: a volte schiaccia un Ricaduto, a volte no; la Campana 14–24), le aure e le pozze uno stretto e piccolo, perché feriscono tante volte al secondo (Velo funebre 2–3 ogni 0,5 s, Acqua santa 1–2 ogni 0,3 s). Nel survivor il Velo faceva 7 ogni 0,5 s, e nelle prime stanze era fin troppo forte (Edoardo, 14/11).
- **5 livelli**: il livello 5 è il **potenziale** dell'arma (proposta del pivot): un effetto nuovo, scelto da Edoardo il 14/11 tra 5 proposte per ogni Eco (`POTENZIALI` in `src/data/armi-stanze.ts`; numeri di Claude, *da rivedere*). La Lanterna al livello 5 colpisce anche alle spalle, con un secondo Fendente. I campi che non cambiano con il livello (velocità dei proiettili, spinta, rimbalzi del sasso…) sono quelli del survivor.

| Eco | Potenziale (livello 5) |
| --- | --- |
| Candela | una fiammella che uccide si divide in 2 fiammelle, aperte a ventaglio, che inseguono il nemico più vicino per 0,9 s e fanno metà danno; le figlie non si dividono più |
| Falce | due anelli: metà delle falci gira al contrario, su un cerchio 1,35 volte più largo (l'anello interno al livello 5 è di 132 px, quello esterno di 178); **ruba salute**: a salute piena ogni colpo dà il 10% del danno che ha fatto davvero come **salute in più**, fino al 20% della salute massima; sotto il massimo non ruba niente (decisione di Edoardo del 17/11). La salute in più va via per prima quando ti colpiscono, dura tutta la Veglia e si vede come un tratto chiaro in fondo alla barra (`POTENZIALI.falce`, `BARRA_SALUTE.extra`; da rivedere) |
| Campana | il rintocco interrompe la carica dei nemici dentro la sua area (la carica si spegne e il nemico si riprende); in cambio la ricarica è più lunga (2,6 s, era 1,8) e il doppio rintocco sparisce (nota di Edoardo) |
| Fuoco fatuo | il primo nemico che un fuoco colpisce lo trapassa senza fermarlo: il fuoco va dritto fino al muro senza colpire nessuno, ci rimbalza una volta e torna a colpire lo stesso nemico con il 70% del danno (se è già morto, insegue il più vicino); dopo il muro vive almeno 1,5 s e gira più svelto |
| Acqua santa | dentro una pozza recuperi 1 di salute al secondo (le pozze non si sommano) |
| Abbacinio | la cecità passa anche ai nemici entro 150 px da chi hai schivato (da rivedere) |
| Lapide | la lapide resta in piedi 3 s come un muro largo 22 px: i nemici non la attraversano e i grumi ci scoppiano contro |
| Rosario spezzato | ogni rimbalzo fa il 15% di danno in più del precedente |
| Corvo | il nemico beccato subisce +20% di danno da tutto per 3 s |
| Velo funebre | mentre stai fermo il velo si allarga fino al doppio in 1,5 s; camminando torna normale in 0,4 s |
| Sampietrini | il rimbalzo va verso il nemico più vicino entro 220 px, invece che dritto |
- Le Unioni non ci sono ancora nel gioco a stanze (nel pivot: arma al livello 4).
- LAB → Stanze → Percorso: «Lanterna +1 livello», «Echi +1 livello», «Livelli a 1»; LAB → Stanze → Potenziali: un pulsante per Eco lo mette nella build al livello 5; i numeri si cambiano al volo in Numeri → armiStanze.

#### Stanze · Lanterna

| Lv | Ricarica (s) | Danno | Portata | Ampiezza arco (°) | Colpo alle spalle | Cosa cambia |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0,45 | 12–18 | 136 | 132 | no | Un colpo corto, in un arco ampio davanti a te. |
| 2 | 0,45 | 16–24 | 136 | 132 | no | +4–6 danno |
| 3 | 0,4 | 16–24 | 160 | 132 | no | portata +18%, ricarica −0,05 s |
| 4 | 0,4 | 21–31 | 183 | 166 | no | +5–7 danno, portata +14%, ampiezza +34° |
| 5 | 0,4 | 26–38 | 183 | 166 | sì | Colpisce anche alle spalle. |

#### Stanze · Candela

| Lv | Ricarica (s) | Danno | Colpi | Trapassa | Cosa cambia |
| --- | --- | --- | --- | --- | --- |
| 1 | 0,95 | 6–9 | 1 | 1 | Lancia fiammelle verso il nemico più vicino. |
| 2 | 0,95 | 6–9 | 2 | 1 | +1 colpo |
| 3 | 0,95 | 8–12 | 2 | 2 | +2–3 danno, trapassa +1 nemico |
| 4 | 0,75 | 8–12 | 3 | 2 | +1 colpo, ricarica −0,2 s |
| 5 | 0,75 | 11–16 | 3 | 3 | Una fiammella che uccide si divide in 2, a metà danno. |

#### Stanze · Falce

| Lv | Colpi | Danno | Area | Rotazione (giri/s) | Cosa cambia |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | 5–7 | 132 | 0,45 | Una falce spettrale ti ruota intorno. |
| 2 | 2 | 5–7 | 132 | 0,45 | +1 colpo |
| 3 | 2 | 7–9 | 160 | 0,45 | +2 danno, area +21% |
| 4 | 3 | 7–9 | 160 | 0,45 | +1 colpo |
| 5 | 4 | 9–12 | 132 | 0,59 | Metà delle falci gira al contrario, su un cerchio più largo. A salute piena ogni colpo ti dà il 10% del danno come salute in più. |

#### Stanze · Campana

| Lv | Ricarica (s) | Danno | Area | Colpo doppio | Cosa cambia |
| --- | --- | --- | --- | --- | --- |
| 1 | 2,6 | 14–24 | 197 | no | Rintocchi che respingono e feriscono tutto intorno. |
| 2 | 2,6 | 19–31 | 197 | no | +5–7 danno |
| 3 | 2,2 | 19–31 | 240 | no | area +22%, ricarica −0,4 s |
| 4 | 2,2 | 25–41 | 240 | no | +6–10 danno |
| 5 | 2,6 | 30–50 | 240 | no | Il rintocco interrompe la carica dei nemici, ma la ricarica è più lunga. |

#### Stanze · Fuoco fatuo

| Lv | Ricarica (s) | Colpi | Danno | Trapassa | Cosa cambia |
| --- | --- | --- | --- | --- | --- |
| 1 | 1,3 | 1 | 7–11 | 1 | Fuochi fatui che inseguono i nemici, prima élite e capi. |
| 2 | 1,3 | 2 | 7–11 | 1 | +1 colpo |
| 3 | 1,3 | 2 | 10–15 | 1 | +3–4 danno |
| 4 | 1 | 3 | 10–15 | 1 | +1 colpo, ricarica −0,3 s |
| 5 | 1 | 4 | 13–20 | 1 | Il primo nemico che un fuoco trapassa lo ritrova: il fuoco rimbalza sul muro e torna a colpirlo. |

#### Stanze · Acqua santa

| Lv | Ricarica (s) | Colpi | Danno | Area | Durata (s) | Cosa cambia |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2,8 | 1 | 1–2 | 89 | 2,6 | Fiale che lasciano pozze benedette sui nemici. |
| 2 | 2,8 | 2 | 1–2 | 89 | 2,6 | +1 colpo |
| 3 | 2,8 | 2 | 2–3 | 108 | 2,6 | +1 danno, area +21% |
| 4 | 2,3 | 3 | 2–3 | 108 | 3,2 | +1 colpo, ricarica −0,5 s, durata +0,6 s |
| 5 | 2,3 | 4 | 3–4 | 129 | 4,2 | Dentro le pozze recuperi 1 salute al secondo. |

#### Stanze · Abbacinio

Si chiamava Lama di luce; nel gioco a stanze si chiama **Abbacinio** (scelta di Edoardo del 17/11, dopo un giorno come Gerico; nel survivor resta Lama di luce). Rifatta il 16/11: non colpisce più. Quando fai una schivata perfetta, chi hai schivato (il Ricaduto del graffio, il Cantore del grumo) resta **cieco**: i suoi attacchi sbagliano la mira dei gradi indicati, da una parte o dall'altra, e il grumo del Cantore cieco non ti cerca. Il nemico cieco è più scuro e bluastro. Si somma alla Grazia. (Numeri di Claude, da rivedere.)

| Lv | Cecità (s) | Mira sbagliata (gradi) | Cosa cambia |
| --- | --- | --- | --- |
| 1 | 3 | 80 | Se schivi un attacco al momento giusto, chi lo ha lanciato resta cieco 3 s e sbaglia la mira. |
| 2 | 3,5 | 85 | cecità +0,5 s, mira sbagliata +5° |
| 3 | 4 | 90 | cecità +0,5 s, mira sbagliata +5° |
| 4 | 4,5 | 95 | cecità +0,5 s, mira sbagliata +5° |
| 5 | 5 | 100 | La cecità si estende ai nemici vicini a chi hai schivato. |

#### Stanze · Lapide

| Lv | Ricarica (s) | Danno | Area | Colpi | Cosa cambia |
| --- | --- | --- | --- | --- | --- |
| 1 | 3,2 | 30–70 | 84 | 1 | Cade sul nemico con più salute in vista e lo seppellisce. |
| 2 | 3,2 | 40–90 | 96 | 1 | +10–20 danno, area +14% |
| 3 | 2,8 | 40–90 | 96 | 1 | ricarica −0,4 s |
| 4 | 2,8 | 50–110 | 96 | 2 | +10–20 danno, +1 colpo |
| 5 | 3,2 | 70–150 | 110 | 2 | La lapide resta in piedi 3 s e blocca nemici e grumi. |

#### Stanze · Rosario spezzato

Nel gioco a stanze il grano **vola**: parte da te e va da un nemico all'altro in 0,14 s con un piccolo arco alto 10 px, e colpisce quando arriva (nel survivor salta all'istante ogni 0,09 s). In volo è una perla di vetro viola, su ogni nemico scoppia con una croce di luce e un anello che si rompe (effetti pixelfx, `ROSARIO_VOLO` in `src/data/armi-stanze.ts`; numeri di Claude, *da rivedere*).

| Lv | Ricarica (s) | Danno | Rimbalzi | Colpi | Cosa cambia |
| --- | --- | --- | --- | --- | --- |
| 1 | 1,6 | 6–10 | 4 | 1 | Un grano rimbalza tra i nemici vicini e li maledice. |
| 2 | 1,6 | 8–13 | 4 | 1 | +2–3 danno |
| 3 | 1,4 | 8–13 | 5 | 1 | ricarica −0,2 s, +1 rimbalzo |
| 4 | 1,4 | 8–13 | 6 | 2 | +1 colpo, +1 rimbalzo |
| 5 | 1,2 | 12–19 | 8 | 2 | Ogni rimbalzo fa il 15% di danno in più del precedente. |

#### Stanze · Corvo

| Lv | Ricarica (s) | Danno | Colpi | Cosa cambia |
| --- | --- | --- | --- | --- |
| 1 | 1 | 8–14 | 1 | Becca il nemico più vicino e ti riporta le anime intorno a lui. |
| 2 | 1 | 11–18 | 1 | +3–4 danno |
| 3 | 0,9 | 11–18 | 2 | +1 colpo, ricarica −0,1 s |
| 4 | 0,9 | 14–22 | 2 | +3–4 danno |
| 5 | 0,75 | 14–22 | 3 | Il nemico beccato subisce +20% di danno per 3 s. |

#### Stanze · Velo funebre

| Lv | Ricarica (s) | Danno | Area | Cosa cambia |
| --- | --- | --- | --- | --- |
| 1 | 0,5 | 2–3 | 110 | Un'aura intorno a te consacra chi entra. |
| 2 | 0,5 | 3–4 | 110 | +1 danno |
| 3 | 0,5 | 3–4 | 125 | area +14% |
| 4 | 0,4 | 3–4 | 140 | area +12%, ricarica −0,1 s |
| 5 | 0,4 | 4–6 | 160 | Mentre stai fermo il velo si allarga fino al doppio. |

#### Stanze · Sampietrini

| Lv | Ricarica (s) | Colpi | Rimbalzi | Danno | Cosa cambia |
| --- | --- | --- | --- | --- | --- |
| 1 | 1,5 | 1 | 1 | 8–14 | Lancia un sampietrino sul nemico più vicino: colpisce, rimbalza in avanti e colpisce di nuovo. |
| 2 | 1,5 | 2 | 1 | 8–14 | +1 colpo |
| 3 | 1,35 | 2 | 1 | 11–18 | +3–4 danno, ricarica −0,15 s |
| 4 | 1,35 | 2 | 2 | 11–18 | +1 rimbalzo |
| 5 | 1,2 | 3 | 2 | 14–22 | Il sasso rimbalza verso il nemico più vicino. |

