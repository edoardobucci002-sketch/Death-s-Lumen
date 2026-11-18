# Bilanciamento

Registro dei ritocchi ai numeri e delle simulazioni con il bot **del gioco a stanze**. I numeri **attuali** sono nel codice (`src/data/`) e nel [GDD](GDD.md); qui c'è la loro storia: cosa è stato cambiato, perché e con che risultato. La riga più recente è in alto. La storia del survivor è in [survivor/bilanciamento-survivor.md](survivor/bilanciamento-survivor.md).

Il bot gioca le stanze con `npm run sim-stanze` (vedi [LEGGIMI.md](../LEGGIMI.md)). Il bilanciamento a occhio non funziona, le simulazioni sì.

## Obiettivi

Le regole vincolanti del gioco a stanze sono **sospese** finché non ci sono il mini-boss e il Boss (decisione di Edoardo del 12/11). Idea di partenza, *da rivedere*: il primo Boss è il primo vero ostacolo; nessun personaggio muore sempre prima del mini-boss del Mondo 1. Gli obiettivi provvisori del survivor sono nel [documento congelato](survivor/bilanciamento-survivor.md).

**La difficoltà che vuole Edoardo** (18/11), sul modello di Hades: **giustamente difficile, non stressante**. Nella prima Veglia si muore anche prima del primo mini-boss; crescendo si diventa più forti ma il gioco resta impegnativo; solo dopo molte ore (in Hades 15–20) sembra facile, e allora il giocatore può renderlo più duro da sé (nemici più forti, se stesso più debole). La difficoltà verrà soprattutto dalla **quantità e varietà dei nemici e dagli ostacoli** lungo la Veglia, più che dai numeri dei capi. Oggi Edoardo finisce ogni Veglia che gioca: il gioco è ancora troppo facile per chi lo sa giocare. Il bot invece cade spesso contro il Campanaro: **non misura un giocatore esperto**, e i suoi risultati vanno letti così.

## Registro

### 18/11 — Candele del Lampionaio, a caso

- `MAPPA.candele.probabilita` **0,5** (Claude, *da rivedere*): metà delle Veglie del Lampionaio ha la porta delle candele. Posto della candela a caso vicino ai muri (`dalMuro` 24–56 px, `porte` 110, `vasi` 48), al posto del punto fisso.
- `npm run sim-stanze -- 48`: **arrivati al Boss 8/48** (prima 9/48), **Seth battuto 6/48** in 127 s (prima 9/48): dentro il rumore, con mappe di nuovo diverse. Tesoro aperto 22/48. Cadute: Campanaro 36, Seth 2, stanze normali 4.

### 18/11 — Porta delle candele

- Nuovi: `MAPPA.candele` (3 candele, posto nella stanza, tocco di 14 px; Claude, *da rivedere*). La porta delle candele prende un vicolo cieco in più: per lo stesso seme le porte chiuse e la chiave sicura possono cadere in stanze diverse da prima.
- `npm run sim-stanze -- 48`: **arrivati al Boss 9/48** (prima 12/48), **Seth battuto 9/48** in 109 s (prima 7/48 in 127 s): dentro il rumore, con mappe diverse. Tesoro aperto 21/48. Cadute: Campanaro 33, stanze normali 6. Il bot non cerca le candele.

### 18/11 — Chiavi e porte chiuse a chiave

- Nuovi: da 1 a 3 porte chiuse a chiave per Mondo (`MAPPA.serrate`, il tesoro sempre), chiave sicura come ricompensa di una stanza aperta ad almeno 2 porte (`MAPPA.chiaveSicura`), **8%** di chiavi da urne e giare (`ROMPIBILI_STANZE.chiave`, Edoardo), 2 giri di carte dietro le altre porte chiuse (`PERCORSO.giriDoppia`). Le mappe hanno la stessa forma di prima per lo stesso seme; cambiano la ricompensa di una stanza (la chiave) e le porte chiuse.
- Il bot ora va dritto sugli oggetti da usare: con la chiave a terra si fermava a 36 px e 4 partite su 48 non finivano.
- `npm run sim-stanze -- 48`: **arrivati al Boss 12/48** (prima 13/48), **Seth battuto 7/48** in 127 s (prima 8/48 in 122 s): dentro il rumore. Il **tesoro aperto 26/48** (prima 41/48): ora serve una chiave. Cadute: Campanaro 34, Seth 5, stanze normali 2.

### 18/11 — Seth, Boss del Mondo 1

- Nuovo: `SETH` in `src/data/seth.ts` (tutti i numeri di Claude, *da rivedere*). Salute misurata con `npm run sim-stanze -- 48`, obiettivo 90–120 s di battaglia:
  - **6000** (il doppio del Campanaro): battuto 13 volte su 13, in **25 s**.
  - **24000**: 34 s soltanto. Causa: maledizione ed Eclissi toglievano una parte della salute massima (come ai bruti), quindi più salute non allungava la battaglia. Rimedio: Seth **resiste agli stati come il Seth del survivor** (`comeSeth` in `src/sistema/orda.ts`).
  - **24000 con le resistenze**: 234 s, battuto 7 volte su 13.
  - **11000 con le resistenze** (tenuto): arrivati al Boss **13/48**, Seth battuto **8/48** in **122 s** di media (da 90 a 199), cadute contro Seth **5**, contro il Campanaro 33.

### 18/11 — Stanze doppie per Campanaro e Boss

- L'arena del Campanaro è larga il doppio (26 × 7 lastre): lui compare al centro (prima dalla parte opposta al Lampionaio) e la Carica può correre il doppio prima del muro. Rompibili nell'arena: **2–3** (prima 1–2). Nessun numero del Campanaro è cambiato.
- `npm run sim-stanze -- 48`: **arrivati al Boss 13/48** (prima 12/48: dentro il rumore). Cadute: **33 contro il Campanaro**, 2 nelle stanze normali (prima 34 e 2). Tesoro aperto 41/48, Sosta usata 16.

### 18/11 — Lapide più lenta e più debole; Echi fermi senza nemici

- **Lapide** (Edoardo: «troppo forte», tempo tra due lapidi oltre i 20 s e danno un po' più basso): ricarica **24 / 24 / 21 / 21 / 24 s** (era 3,2 / 3,2 / 2,8 / 2,8 / 3,2), danno **27–63, 36–81, 36–81, 45–99, 63–135** (era 30–70, 40–90, 40–90, 50–110, 70–150, cioè −10%). Valori esatti di Claude, *da rivedere*.
- **Echi**: non sparano senza nemici in campo (prima sparavano a vuoto nelle stanze ripulite).
- `npm run sim-stanze -- 48`: **arrivati al Boss 12/48** (prima 14/48: dentro il rumore). La Lapide, nelle 9 partite in cui c'era, fa il **4% del danno** (1,8 al secondo; prima il 24%, 12 al secondo). Tesoro aperto 40/48, Sosta usata 15. Cadute: **34 contro il Campanaro**, 2 nelle stanze normali.

### 18/11 — Tesoro e Sosta

- Nuovi: il Reliquiario del tesoro dà **3 carte Chiara o Ardente** (`STANZE_SPECIALI.tesoro`, Edoardo); l'oggetto si usa a **34 px** dal centro (Claude, *da rivedere*). La Sosta riempie la fiaschetta.
- Le mappe ora devono avere tesoro e Sosta: per lo stesso seme la mappa può essere diversa da prima.
- `npm run sim-stanze -- 48`: **arrivati al Boss 14/48** (prima 17/48: dentro il rumore di ±12 punti, con mappe diverse). Tesoro aperto in 39 partite su 48, Sosta usata in 16 (il bot ci passa andando al Boss). Cadute: **29 contro il Campanaro**, 5 nelle stanze normali.

### 18/11 — Passo 3: porta del Boss chiusa, bot che evita l'arena del Campanaro

- Nessun numero di combattimento cambia. Nuovi: `PERCORSO.attesaCapo` 1,5 s (fine provvisoria dopo l'ingresso dal Boss) e `PERCORSO.avviso` 1,6 s (scritte della porta del capo), tutti e due di Claude, *da rivedere*.
- **Il bot non attraversa più l'arena del Campanaro per andare in altre stanze** finché c'è altro da esplorare: prima ci passava in mezzo e affrontava il Campanaro anche alla seconda stanza. Ora lo affronta dopo 7–13 stanze combattute (di solito 9–10).
- `npm run sim-stanze -- 48` (metà carte preferite, metà a caso): **arrivati al Boss 17/48** (prima 12/48). Cadute: **21 contro il Campanaro**, 10 nelle stanze normali (2 a 1 porta, 4 a 2 porte, 2 a 3, 1 a 4, 1 a 5). Il Campanaro resta il primo vero ostacolo del bot; Edoardo lo batte sempre e lo vuole più forte (vedi decisioni del 18/11).

### 17/11 — La mappa del Mondo: 2 carte e ondate per distanza

- **Carte**: da 3 a **2** per stanza (Edoardo, 17/11: la terza arriverà con la Fortuna).
- **Ondate**: non più per la prima, seconda e terza stanza della fetta, ma per **quante porte la stanza dista dall'ingresso** (le tre righe di prima valgono a 1 porta, a 2 porte e da 3 porte in su; Claude, *da rivedere*).
- **Stanze**: da 4 (tre e il Campanaro) a **12–15 per Mondo**, ingresso e capi compresi; il bot le esplora tutte, lascia il Campanaro per ultimo e poi entra dal Boss (fine provvisoria).
- `npm run sim-stanze -- 48` (metà carte preferite, metà a caso): **arrivati al Boss 12/48** (prima la fetta completata era 6/48: con la mappa il bot arriva al Campanaro dopo 9–12 stanze, con più carte), salute media al Boss 33. Cadute: **29 contro il Campanaro**, 7 nelle stanze normali (3 a 1 porta, 2 a 2 porte, 1 a 4, 1 a 5). Il bot combatte in media 10–11 stanze; esce dalle prime con 88 di salute, poi resta fra 33 e 47 fino in fondo (i sorsi della fiaschetta lo tengono su). Carte viste: Fioca 78%, Chiara 17%, Ardente 5% su 694. Il Campanaro resta il primo vero ostacolo: da decidere con Edoardo quando ci sarà Seth e le regole vincolanti ripartiranno.

### 17/11 — Specchio a colpi riflessi, Rosario Ardente, premio del Campanaro come sorso

- **Specchio** (gioco a stanze, `SPECCHIO_STANZE`): da +1 colpo per livello (+3 al massimo) a +1, +2, +2 colpi, che feriscono al 50%, 50%, 100% del danno. Edoardo: «+3 colpi a ogni arma sono tanti».
- **Rosario spezzato** da Chiara ad Ardente (Edoardo).
- **Premio del Campanaro**: da cura diretta del 30% della salute massima a 1 sorso della fiaschetta (Edoardo).
- `npm run sim-stanze -- 48`: **fetta completata 6/48** (era 8/48: rumore, ±12 punti); 42 cadute nella stanza 4. La salute media alla fine scende da 64 a 32 perché il sorso del premio ora va nella fiaschetta e la fetta finisce subito dopo. Carte viste: Fioca 75%, Chiara 17%, **Ardente 8%** (era 3%: gli Ardenti ora sono tre). Lo Specchio è stato preso in una partita sola: per misurarlo servirà una prova apposta.

### 17/11 — Rarità delle carte (Fioca 75%, Chiara 20%, Ardente 5%)

`npm run sim-stanze -- 48` (metà carte preferite, metà a caso), prima simulazione con la fiaschetta automatica e con le rarità: **fetta completata 8/48**; nessuno cade nelle stanze 1–3, **40 cadono nella stanza 4** (il Campanaro), dopo 16 s in media e 82 di danno subito; salute all'uscita della stanza 3: 41. Carte viste: **Fioca 75%, Chiara 22%, Ardente 3%** su 441 (prese: 72%, 20%, 8%); l'Ardente esce meno del 5% perché oggi gli Ardenti sono solo Lapide e Specchio, e spesso la porta non li può dare. Danno: Lanterna 67%, Corvo 13%, Lapide 12% (in 11 partite), Campana 11%, Falce 3%. Prima (31 cadute su 48 nella stanza 4) c'erano altre estrazioni delle carte e niente fiaschetta automatica: il confronto non dice quale delle due cose pesa. Campione da 48: ±12 punti.

### 17/11 — Falce al potenziale (ruba salute)

`POTENZIALI.falce`: furto 10% del danno, tetto 20% della salute massima. `npm run sim-stanze -- 8 potenziali` (8 fette per Eco, seme di default): la Falce al livello 5 completa 8/8 con il 98% di salute alla fine (le altre fra 43% e 84%), 24% del danno e 10,4 di danno al secondo. Il furto è molto forte contro lo scarso danno ricevuto: se dopo la prova a mano è troppo, scendere a 5% o abbassare il tetto. Campione piccolo: ±12 punti.

**Seconda versione (17/11, decisione di Edoardo): il furto vale solo a salute piena.** `npm run sim-stanze -- 16 potenziali`: la Falce al livello 5 completa 16/16 con il **71%** di salute alla fine (era 98%), dentro il gruppo degli altri Echi (42–83%); 24% del danno, 10,5 al secondo. Gerico 15/16 (44%), Velo funebre 15/16, Lapide 15/16. Serie normale (`npm run sim-stanze -- 48`): 44/48 fette completate, cadute tutte nella stanza 3, salute media alla fine 36; la Lanterna fa il 69% del danno, la Falce il 4% nelle 4 partite in cui c'era.

### 17/11 — Fiaschetta e Calice riverso nel gioco a stanze

La fiaschetta entra nelle stanze (3 sorsi, 35% della salute massima in 1 s; il bot beve sotto il 40%) e il Calice riverso entra tra i doni delle porte (+1 sorso per livello, 2 livelli). `npm run sim-stanze -- 48`, che ora comprende la quarta stanza con il Campanaro (mini-boss, lavoro di un'altra sessione dello stesso giorno): nelle stanze 1–3 **nessuna caduta** su 48 (prima della fiaschetta 4 su 48 nella stanza 3); salute all'uscita della stanza 3: 61 (era 34). Nella stanza 4 cadono 31 su 48: fette completate 17/48. Il risultato della stanza 4 dipende dal Campanaro, non dalla fiaschetta.

**Ritocchi del 17/11 (senza simulazione, su richiesta di Edoardo)**: fiaschetta automatica sotto il 15% di salute; Specchio a 3 livelli (+1 colpo per livello, era +1 in tutto), Campanella d'argento a 3 livelli (+0,3 s al massimo, era +0,2), Calice riverso a 3 livelli (+3 sorsi al massimo, era +2). Il bot non è stato fatto giocare: lo Specchio al massimo triplica il suo effetto e va ricontrollato quando si rilancia `npm run sim-stanze`.

### 17/11 — Il Campanaro, mini-boss del Mondo 1 (decisioni di Edoardo; numeri di Claude, *da rivedere*; il survivor non cambia)
- Nuovo `CAMPANARO` (`src/data/campanaro.ts`): salute 3000, danni 20/20/25, raggi 150 e 260, avvisi 1 / 0,7 / 0,8 s. La fetta ha una quarta stanza: l'arena.
- Bot, 8 partite (`npm run sim-stanze -- 8`), con salute 1200: 1 fetta su 8; il Campanaro battuto in circa 10 s (obiettivo 60–90 s), quindi salute a 3000. Con 3000: **0 fette su 8**, tutti caduti nella stanza 4 dopo 4–10 s. Il bot ci arriva con **32 di salute in media** (da 3 a 58, dopo 32 di danno nella stanza 3) e i colpi del Campanaro fanno 20–25: la durata obiettivo non si può misurare finché non arriva con più salute. Armi: la Lanterna fa il 64% del danno. 8 partite sono poche (±17 punti): è una prima lettura.

### 16/11 — Dopo la prima prova della cripta: 1 o 2 rompibili, frammenti da subito, porte decise all'ingresso (scelte di Edoardo)
- `ROMPIBILI_STANZE.quanti` da 1 a 2 (era da 2 a 4); `ROMPIBILI_STANZE.vittorie` 0 (nuovo: i frammenti escono da subito; nel survivor resta 1). Le porte si decidono all'ingresso con un caso loro: la sequenza delle carte non è più quella di prima a parità di seme.
- `npm run sim-stanze` (24 partite, semi 2001–2024): **fetta completata 24 volte su 24**, salute alla fine 33. Attenzione: la misura comprende anche i ritocchi ai potenziali degli Echi di un'altra sessione, non ancora salvati quando è stata lanciata; danno subito per stanza 17, 21 e 31; Lanterna 69% del danno.

### 16/11 — Urna, giara e lanterna nelle stanze (decisioni di Edoardo; numeri di Claude, *da rivedere*; il survivor non cambia)
- `ROMPIBILI_STANZE` (nuovo): da 2 a 4 per stanza, a 24–56 px dal muro, ad almeno 110 px dal centro delle porte e 72 px tra loro; ingombro 12 px; gocce e frammenti volano verso il personaggio entro il 60% della raccolta di base (come nel survivor). Contenuto, frammenti, olio e luce con i numeri del survivor.
- `npm run sim-stanze` (24 partite, semi 2001–2024): **fetta completata 19 volte su 24** (era 20), salute alla fine 45 (era 37), 5 cadute tutte nella stanza 3; differenze dentro il rumore (±12 punti). Danno subito per stanza 17, 22 e 27; A partita 42 nemici battuti, 84 colpi della Lanterna, 4,1 Cerchi di luce. Parte del danno: Lanterna 68%, Lapide 23%, Cerchio di luce 13%. Il bot non cerca i rompibili: ci sbatte contro e li rompe solo se capitano nei colpi.

### 16/11 — Lama di luce rifatta: accieca chi schivi (numeri di Claude, *da rivedere*; il survivor non cambia)
- La Lama non ferisce più (danno 0, nessun fendente). Alla schivata perfetta il nemico schivato è cieco 3, 3,5, 4, 4,5 e 5 s (livelli 1–5) e sbaglia la mira di 80, 85, 90, 95 e 100 gradi, da una parte o dall'altra. Il graffio del Ricaduto è largo 110°: con più di 55° per lato lo manca. Il grumo del Cantore cieco non cerca più il Lampionaio. Potenziale (livello 5): la cecità passa ai nemici entro 150 px (`POTENZIALI.lamaDiLuce.raggio`).
- Simulazione `npm run sim-stanze -- 8 potenziali`: con la Lama sola e al livello 5 la fetta è completata 8 volte su 8, salute alla fine 43 (la più bassa degli Echi, ma il bot non cerca la schivata perfetta: non si legge niente sul valore reale della Lama). Il danno della Lama è 0 per costruzione.
- `npm run prova`: aggiunto il controllo «Lama di luce: acceca dal LAB» (2 nemici accecati, cioè il nemico e un vicino).

### 16/11 — Fuoco fatuo un po' più debole, il grano del Rosario vola (numeri di Claude, *da rivedere*)
- **Fuoco fatuo** al potenziale: il colpo del ritorno fa il 70% del danno (`POTENZIALI.fuocoFatuo.danno` 0,7). Edoardo: «riduci leggermente il fuoco fatuo».
- **Rosario spezzato** nel gioco a stanze: il grano vola 0,14 s da un nemico all'altro, con un arco di 10 px (`ROSARIO_VOLO`), invece di saltare ogni 0,09 s; il primo colpo arriva 0,14 s dopo il lancio. Nel survivor non cambia.
- Edoardo conferma i numeri del 16/11 di Candela, Falce e Lapide («si reitera con i nemici nuovi e più forti»), il colpo del Cerchio di luce (20–30) e il tempo di reazione del bot (0,25 s).
- Simulazione (`npm run sim-stanze -- 8 potenziali`, 88 partite): fetta completata 87/88 (una caduta con la Lapide, rumore). Danno al secondo al livello 5, prima › dopo: **Fuoco fatuo 39 › 36**, **Rosario spezzato 28 › 24**; gli altri come prima.

### 16/11 — I potenziali dopo la prova di Edoardo (numeri di Claude, *da rivedere*)
- **Candela**: le figlie fanno metà danno (`POTENZIALI.candela.danno` 0,5) e al livello 5 le fiammelle restano 3 (erano 4). Edoardo: «troppo forte, forse la più forte; uccidevo qualsiasi cosa rimanendo fermo».
- **Falce**: anello interno al livello 5 da 160 a 132 px, anello esterno da ×1,5 a ×1,35 (da 240 a 178 px). Edoardo: «restringerei l'ampiezza di entrambi i cerchi».
- **Lapide**: ricarica al livello 5 da 2,4 a 3,2 s. Edoardo: «diminuirei la cadenza».
- **Fuoco fatuo**: potenziale nuovo (vedi [decisioni.md](decisioni.md)); dopo il muro il fuoco vive almeno 1,5 s e gira con sterzata 10 (gli altri fuochi 6). Il vecchio numero `preda` 0,25 è tolto.
- **Lama di luce**: al livello 5 il fendente alle spalle parte insieme agli altri tre (prima arrivava un attimo dopo). Nessun numero cambia.
- Simulazione (`npm run sim-stanze -- 8 potenziali`, 88 partite, 0 errori): fetta completata 88/88, salute alla fine 66 (era 70). Danno al secondo dell'Eco al livello 5, prima › dopo: Candela 30 › 26 (salute alla fine 79 › 67), Falce 10 › 10,5, **Fuoco fatuo 30 › 39** (è il secondo dopo la Lapide), Lapide 63 › 57, Lama di luce 26 › 25. Gli altri come prima (differenze di rumore).

### 16/11 — I potenziali misurati uno per uno (nessun numero cambia)
- `npm run sim-stanze -- 8 potenziali`: 8 partite per ognuno degli 11 Echi, che parte già al livello 5 (semi 2001–2008, carte preferite). Fetta completata **88 su 88**, salute alla fine 70 (contro 37 delle partite normali): con un Eco al livello 5 dall'inizio la fetta è facile, quindi la misura serve a confrontare gli Echi tra loro, non a dire quanto è difficile il gioco.
- Danno al secondo dell'Eco al livello 5 (e la sua parte del danno): **Lapide 63 (71%)**, Candela 30 (58%), Fuoco fatuo 30 (56%), Rosario spezzato 28 (53%), Lama di luce 26 (51%), Corvo 25 (53%), Sampietrini 23 (44%), Campana 21 (42%), Acqua santa 13 (30%, in più cura), Velo funebre 10 (23%), **Falce 10 (22%)**. La Lanterna fa circa 15 al secondo.
- Lettura: la Lapide al potenziale fa il doppio del secondo Eco; Falce e Velo funebre sono i più deboli (la Falce forse perché l'anello esterno, 1,5 volte più largo, prende pochi nemici). Salute alla fine più bassa con Lama di luce (55) e Falce (60), più alta con Fuoco fatuo (87). Con 8 partite per Eco differenze di pochi punti sono rumore. Decide Edoardo se ritoccare.
- **Guasto corretto**: la simulazione dei potenziali si bloccava con la Falce (non era la memoria). La griglia dei nemici nasceva con gli scomparti a zero e la Falce, interrogandola prima che comparissero i nemici, girava all'infinito; ora nasce vuota (`src/sistema/griglia.ts`). Nella partita normale non capitava (la Falce arriva dopo la prima stanza); capitava con LAB → Stanze → Potenziali.

### 14/11 — I potenziali degli Echi e il Cerchio di luce (scelte di Edoardo; numeri di Claude, *da rivedere*; il survivor non cambia)
- Livello 5 di ogni Eco nel gioco a stanze: il potenziale scelto da Edoardo (`POTENZIALI` in `src/data/armi-stanze.ts`; tabella nel GDD). Numeri nuovi: Candela 2 figlie aperte di 0,7 rad che inseguono per 0,9 s; Falce anello esterno ×1,5; Fuoco fatuo preda ×0,25 sulla distanza; Acqua santa cura 1/s; Lapide in piedi 3 s, larga 22 px; Rosario +15% a rimbalzo; Corvo +20% per 3 s; Velo ×2 in 1,5 s da fermo, torna in 0,4 s; Sampietrini cerca entro 220 px.
- **Campana al livello 5**: ricarica 2,6 s (era 1,8) e niente doppio rintocco, in cambio dell'interruzione (nota di Edoardo: «a scapito di una Quiete maggiore tra un rintocco e l'altro»). **Fuoco fatuo al livello 5**: trapassa 1 nemico (erano 3), sostituito dal potenziale.
- **Cerchio di luce**: un colpo 20–30 all'accensione (era 6 ogni 0,3 s per 5 s, cioè fino a circa 100 a nemico), poi abbaglia ogni 0,3 s senza ferire.
- Controllo del survivor: 8 notti del bot, 8.187 campi, 0 differenze. Il bot delle stanze (24 partite, semi 2001–2024): fetta completata 20 volte su 24 (era 21), salute alla fine 37; il Cerchio di luce scende dal 20% al 13% del danno. Nella fetta il bot non arriva al livello 5 (3 carte in tutto): per misurare i potenziali c'è `npm run sim-stanze -- N potenziali`.

### 14/11 — Il bot gioca a stanze: prima misura (nessun numero cambia)
- `npm run sim-stanze`: 24 partite della fetta (semi 2001–2024, metà con le carte preferite e metà con carte e porte a caso), Lanterna 12–18, Ricaduto 60, Cantore 35. Il bot vede gli avvisi dopo 0,25 s (`BOT_STANZE.reazione`, *da rivedere*).
- **Fetta completata 21 volte su 24**, salute alla fine 37 in media; 3 cadute, tutte nella stanza 3. Per stanza: 16, 24 e 24 s; danno subito 15, 21 e 33; salute all'uscita 85, 64 e 35. A partita: 42 nemici battuti, 5,4 Ricaduti rialzati, 3,9 schivate perfette, 75 colpi della Lanterna, 4,3 Cerchi di luce.
- **Danno per arma** (parte del danno nelle partite in cui c'era): Lanterna 63%, Lapide 22%, Cerchio di luce 20%, Corvo 14%, Lama di luce e Campana 13% (una partita sola), Rosario spezzato 10%, Candela 8%, Fuoco fatuo e Sampietrini 7%, Acqua santa e Velo funebre 4%, Falce 3%. Lettura: la Lapide pesa più degli altri Echi; Velo funebre, Acqua santa e Falce ora contano poco. Il campione è piccolo (gli Echi compaiono in 1–9 partite): per decidere servono almeno 100 partite con `esplora`.
- Il bot prende più danni di Edoardo, che trova il gioco facile: forse reagisce più lento di lui. Da tarare (`BOT_STANZE.reazione`) confrontando le partite vere.

### 14/11 — Le armi del gioco a stanze: 5 livelli e danno a intervallo (decisioni di Edoardo; numeri di Claude, *da rivedere*; il survivor non cambia)
- Tutte le armi delle stanze (la Lanterna a mano e gli 11 Echi) hanno tabelle nuove in `src/data/armi-stanze.ts`: 5 livelli, danno minimo e massimo. Tabelle complete nel GDD («Le armi nelle stanze»). Il colpo prima variava tra il 92% e il 108% del danno; ora esce a caso tra il minimo e il massimo.
- **Lanterna a mano**: 12–18 al livello 1 (era 18 fisso), fino a 26–38 al livello 5, che colpisce anche alle spalle; ricarica 0,45 › 0,4 s dal livello 3.
- **Velo funebre**: 2–3 ogni 0,5 s al livello 1 (era 7: Edoardo lo trovava «fin troppo forte» già nelle prime stanze), fino a 4–6. **Acqua santa** 1–2 ogni 0,3 s (era 8). Gli altri Echi scendono più o meno a metà o a due terzi del survivor, con intervalli larghi per le armi pesanti (Lapide 30–70, era 120; Campana 14–24, era 19).
- **Salute dei nemici**: Ricaduto 60 (era 40), Cantore 30 (era 20). Perché: Edoardo, «i nemici vanno giù facilmente». Con la Lanterna al livello 1 il Ricaduto chiede 4 o 5 colpi (prima sempre 3), il Cantore 2 o 3.
- Poi (Edoardo, 14/11): «la salute dei nemici mi sembra bilanciata, alzerei quella del Cantore a 35». Cantore 35 (era 30), Ricaduto 60 confermato.
- Il bot non gioca a stanze: niente simulazione. Controllo del survivor: 8 notti del bot (2 per personaggio, Cappella completa) prima e dopo, 8.187 campi, 0 differenze.

### 13/11 (sera) — Il colpo della Lanterna diventa la mossa intera (decisione di Edoardo; il survivor non cambia)
- Con lo sprite V6 la posa del colpo dura quanto l'animazione `attack` (0,385 s, prima 0,15 s) e **il danno arriva 0,155 s dopo il tocco**, quando l'asta cala (`ATTACCO.anticipo`, nuovo, *da rivedere*). La ricarica resta 0,45 s dal tocco: i colpi al secondo non cambiano, cambia il momento in cui feriscono.
- Perché: Edoardo vuole vedere la mossa intera, e un danno al tocco sarebbe arrivato prima che l'asta si muovesse. Effetto atteso: la fetta un po' più difficile (bisogna anticipare il colpo). Il bot non gioca a stanze: niente simulazione.

### 13/11 (notte, tardi) — Terza prova di Edoardo: pozza più grande e grumo più aggressivo

- **Grumo**: virata 100 › **125° al secondo** (Edoardo: «leggermente più aggressivo»). Calcolo: un passo di lato di 48 px quando il grumo è a 45 px lo fa passare a circa 28 px (contatto a 23); di 44 px a 50 px non basta più (passa a 22,7 px). La schivata all'ultimo resta possibile ma va fatta più tardi e più decisa.
- **Pozza di cera**: raggio 26 › **34 px** (Edoardo: «più grande»); nasce anche quando il grumo colpisce il Lampionaio (Edoardo), quindi chi resta fermo dopo il colpo prende anche la pozza.

Il bot non sa giocare a stanze: nessuna simulazione.

### 13/11 (notte) — Seconda prova di Edoardo: grumo che cerca, pozza di cera, rinascita

- **Grumo del Cantore**: ora ti cerca per **1,4 s**, girando al massimo di **100° al secondo**, poi va dritto (decisione di Edoardo: «a ricerca, ma non impossibile da schivare»; numeri di Claude, *da rivedere*). Con 210 px/s il raggio di virata è di circa 120 px: un passo di lato di 44 px quando il grumo è a 50 px lo fa passare a circa 28 px (il contatto è a 23, la schivata perfetta fino a 53); a 70 px dal grumo lo stesso passo non basta più (passa a 16 px e colpisce). Chi cammina perpendicolare lo semina sempre (270 contro 210 px/s).
- **Pozza di cera** (nuova): dove il grumo scoppia contro il muro, **2 s** (Edoardo), raggio 26 px, **6 di danno** a chi ci passa sopra, al massimo uno ogni 0,5 s per la Quiete (Claude, *da rivedere*).
- **Rinascita del Ricaduto**: 10% › **20%**, sempre con metà della salute (Edoardo).
- **Carte**: arrivano **0,5 s** dopo la stanza ripulita (era 1 s; Edoardo).

Il bot non sa giocare a stanze: nessuna simulazione. `orda.ts` e le armi non sono cambiati.

### 13/11 (notte) — Correzioni dopo la prova di Edoardo sul S25 («il gioco risulta ancora molto semplice»)

- **Tempo tra le ondate**: 10 › **8 s** (Edoardo: quasi ogni ondata finiva entro i 10 s).
- **Grumo del Cantore**: 140 › **210 px/s** (Edoardo: «lentissimo», facile da schivare; il Lampionaio cammina a 270). Valore di Claude, *da rivedere*.
- **Bianco al colpo**: 0,12 › **0,16 s**; **fermo d'impatto**: 0,05 s (3 fotogrammi) › **0,067 s (4 fotogrammi)**, per tutti i colpi. Edoardo: «li alzerei leggermente»; valori di Claude, *da rivedere*.
- La carta della Lanterna mostra la ricarica della Lanterna a mano (0,45 s; 0,38 s dal livello 4), non quella automatica del survivor (0,8 e 0,68): solo testo, il gioco non cambia.

Il bot non sa giocare a stanze: nessuna simulazione. `orda.ts` e le armi non sono cambiati.

### 13/11 (sera) — La fetta era troppo facile: ondate a tempo (decisione di Edoardo dopo due partite)

- **Ondate**: da una o due per stanza (la seconda quando della prima ne restavano 2) a **2, 3 e 3 ondate** che arrivano ogni **10 s** anche con la stanza ancora piena, o subito se si svuota. Prima stanza 3+1 e 3+1 (Edoardo); le altre (Claude, *da rivedere*): 3+1, 3+2, 4+2; poi 4+2, 4+2, 5+3. Nemici nella fetta: da 26 a 46. Al massimo in campo: da 16 a 24.
- **Carte** dopo 1 s (era 0,8).
- **Fermo d'impatto**: resta 0,05 s (3 fotogrammi). La durata di Hades non è pubblicata da nessuna parte che si possa citare; le guide sul «game feel» indicano 2–4 fotogrammi per i colpi leggeri e 12–20 per i colpi forti dei capi.
- **Bianco al colpo**: 0,12 s sui nemici colpiti dalla Lanterna (nel survivor il lampo dura 0,033 s, una volta ogni 0,3 s).

Il bot non sa giocare a stanze: nessuna simulazione.

### 13/11 (sera) — Passo 6: tre stanze, porte e carte (numeri di Claude, *da rivedere*; il survivor non cambia)

- **Cerchio di luce**: ferisce ogni **0,3 s** invece di 0,25 (decisione di Edoardo), così la Quiete dei nemici (0,3 s) non gli toglie colpi: circa 20 di danno al secondo per nemico invece di 12.
- **Ondate per stanza**: 3 Ricaduti e 1 Cantore; poi 3+1 e 3+2; poi 4+2 e 5+3. La seconda ondata arriva quando della prima restano al massimo 2 nemici. Totale della fetta: 26 nemici.
- **Build**: al massimo 3 Echi e 6 doni. Gli Echi tengono i numeri e gli 8 livelli del survivor; la Lanterna a mano sale con i numeri della Lanterna del survivor (ricarica in proporzione da 0,45 s).
- **Survivor identico**: Ricaduto e Cantore sono entrati nella Orda in fondo all'elenco dei tipi. Il bot ha giocato le stesse 8 notti (2 per personaggio, Cappella completa) prima e dopo: 8.199 campi, 0 differenze.

Il bot non sa giocare a stanze: nessuna simulazione della fetta. `npm run prova` attraversa le tre stanze su computer, iPhone e Android in orizzontale.

### 13/11 (pomeriggio) — Ritocchi di Edoardo dopo la prova del passo 5

- **Quiete**: Lampionaio da 0,6 a **0,5 s**, nemici da 0,2 a **0,3 s** (decisione di Edoardo). Effetto collaterale: il Cerchio di luce prova a ferire ogni 0,25 s, quindi ora prende ogni nemico ogni 0,5 s (il suo danno si dimezza, da 24 a 12 al secondo).
- **Carica dell'abilità**: da «10 per nemico, piena a 100» a **8 colpi a segno**, un colpo conta 1 (decisione di Edoardo).
- **Rallentatore**: da «30% per 0,3 s» (a scatti) a **dal 60% in 0,35 s** con curva morbida e logica a passi più corti (scelta di Edoardo: rifarlo fluido).
- **Pulsante dell'abilità**: distanza dal joystick d'attacco da 6 a 14 pixel disegnati, area di tocco 10 punti più larga (richiesta di Edoardo: a volte il tocco non partiva).
- **Impatto** (nuovo, numeri di Claude *da rivedere*): fermo 0,05 s, schiacciamento 0,1 s, scintille 6 e 12, scossa 1 px.

### 13/11 — Gioco a stanze: Quiete, rallentatore e abilità (proposte di Claude, *da rivedere*; il survivor non cambia)

- **Quiete del Lampionaio 0,6 s** (prima «invulnerabilità», stesso valore). **Quiete dei nemici 0,2 s per arma**: più corta del ritmo del Cerchio di luce (0,25 s) e della ricarica della Lanterna (0,45 s), quindi oggi non toglie danni; conterà con gli Echi.
- **Rallentatore della Grazia**: al 30% per 0,3 s veri, abbastanza da sentirlo senza rompere il ritmo.
- **Abilità**: piena a 100, 10 per ogni nemico preso dalla Lanterna, al massimo 20 per colpo. Un Ricaduto (3 colpi) dà 30: il Cerchio di luce torna circa ogni 3–4 nemici battuti. Effetto del survivor senza cambi (216 px, 6 ogni 0,25 s per 5 s, −55% velocità).
- **Ricaduto**: la rinascita resta 10%, ma il tiro si fa dopo 1,5 s a terra, per tutti.

Nessuna simulazione: il bot non sa giocare a stanze. `npm run prova` passa.

### 13/11 — Gioco a stanze, passo 4: i primi numeri dei nemici (proposte di Claude, *da rivedere*; il survivor non cambia)

Numeri nuovi, nessun ritocco: sono in `NEMICI_STANZA`, `ONDATA` e `COMBATTIMENTO_STANZA` (`src/data/stanze.ts`) e nel GDD, tabella «Valore dei nemici». Il criterio usato:

- **Colpi per battere un nemico**: il Ricaduto con 40 di salute cade con 3 colpi della Lanterna (18), 2 in Grazia (+30%); il Cantore con 20 cade con 2, 1 in Grazia. Così la Grazia si sente subito.
- **Avvisi**: graffio 0,5 s e canto 0,8 s (i numeri proposti il 12/11). Dal graffio si esce camminando circa 30 px: al passo del Lampionaio (270 px/s) bastano 0,1 s, quindi l'avviso lascia tempo per la schivata perfetta (finestra 0,25 s).
- **Danni**: graffio 15, grumo 12 su 100 di salute: circa 7 colpi presi per cadere. Nessuna rigenerazione nel gioco a stanze.
- **Velocità**: Ricaduto 60 px/s e Cantore 75 px/s, molto più lenti del Lampionaio (270): si raggiungono e si seminano.

Il bot non sa ancora giocare a stanze: nessuna simulazione. `npm run prova` controlla che il graffio ferisca, che le due schivate perfette diano la Grazia, che 3 colpi battano il Ricaduto, la rinascita e la caduta.
