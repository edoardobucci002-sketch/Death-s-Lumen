# Bilanciamento

Registro dei ritocchi ai numeri e delle simulazioni con il bot. I numeri **attuali** sono nel codice (`src/data/`) e nel [GDD](GDD.md); qui c'è la loro storia: cosa è stato cambiato, perché e con che risultato. La riga più recente è in alto.

Il bot gioca dentro il gioco vero (`npm run sim`, vedi [LEGGIMI.md](../LEGGIMI.md)); un giocatore umano va più forte di lui (Edoardo al minuto 8 era al livello 60, il bot al 40). Il bilanciamento a occhio non funziona, le simulazioni sì.

## Obiettivi (provvisori, non vincolanti)

> **Dal pivot del 12/11** obiettivi e regole vincolanti di questa sezione valgono **solo per il survivor** (la notte di 15 minuti, tag `survivor-v1`). Il bot di oggi non sa giocare a stanze: per il gioco a stanze le regole vincolanti sono **sospese** finché il bot non saprà giocarci (decisione di Edoardo del 12/11). Idea di partenza, *da rivedere*: il primo Boss è il primo vero ostacolo; nessun personaggio muore sempre prima del mini-boss del Mondo 1. I numeri nuovi del pivot (per esempio l'Eclissi al 5% sui capi) entrano in questo registro quando entrano nel codice.

Decisione di Edoardo (4/11): gli obiettivi della tabella sono **provvisori**. Non si ritocca nessun contenuto per inseguirli finché i contenuti del gioco non sono completi; il bilanciamento vero si fa alla fine, con tutti i contenuti. Le simulazioni servono intanto a vedere dove siamo.

| Cappella (`meta=`) | Cosa simula il bot | Vittorie del bot |
| --- | --- | --- |
| vuota (`0`) | nessun cero | 5–15% |
| a metà (`meta`) | livello 3 di ogni cero | 30–45% |
| completa (`max`) | tutti i ceri al massimo e la Seconda candela | 60–75% |
| completa + 3 patti | come «completa», con 3 Patti attivi (quando i Patti esisteranno) | 10–25% |

Quante notti servono per completare la Cappella è una domanda aperta: si decide con il bilanciamento finale, a contenuti completi.

**Il campione.** Con 48 notti per condizione l'incertezza è di circa ±12 punti: differenze più piccole sono rumore. Per il bilanciamento finale servono almeno 200 notti per condizione (circa 50 per personaggio).

**Restano vincolanti, in tutte le condizioni:** ~~Seth del minuto 5 è il primo vero ostacolo~~ (riscritto da Edoardo il 10/11 sera:) **il primo boss della notte (oggi Seth del minuto 5) è il primo vero ostacolo: nessun personaggio muore più spesso prima del primo boss che contro di lui** (contro di lui = dalla sua comparsa alla sua morte; il danno subito al minuto prima e durante resta nel resoconto ma non è più un vincolo); nessuno muore sempre prima del minuto 5, nemmeno con la Cappella vuota; **a Cappella vuota il Lampionaio muore prima del minuto 5 al massimo in 3 notti su 12** (decisione di Edoardo del 10/11). `npm run sim` controlla tutti e tre.

Le righe qui sotto sono del 4/11, con il bot su un Pixel 7 e prima delle fasce: l'ultima simulazione è nel registro, alla voce «Campo vero».

## Stato: fuori dagli obiettivi provvisori (non si corregge ora)

Ultima simulazione (4/11, dopo le Unioni, 12 notti per personaggio = 48 notti per condizione):

| Cappella | Vittorie | Obiettivo | Esito |
| --- | --- | --- | --- |
| vuota | 10 su 48 (21%) | 5–15% | **sopra** |
| a metà | 25 su 48 (52%) | 30–45% | **sopra** |
| completa | 25 su 48 (52%) | 60–75% | **sotto** |

- La distanza tra Cappella vuota e completa è troppo piccola (21% → 52%, voluto 5–15% → 60–75%): a metà e completa la differenza non si vede ancora. Non si ritocca nulla ora: se ne riparla a contenuti completi, con i Patti e le notti diverse.
- Il Lampionaio, personaggio di partenza, con la Cappella vuota vince 1 notte su 12 e muore ancora presto in circa 3 notti su 24.
- Su 48 notti l'oscillazione è di qualche vittoria: i singoli personaggi variano molto.
- Il cero della fiaschetta e i Patti non ci sono ancora: ricontrollare quando arrivano.

## Registro

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

### 12/11 — Riordino di `armi.ts` (nessun numero cambia)

Le armi sono divise in cinque file a strati (vedi [roadmap.md](roadmap.md), «Gioco a stanze», passo 1). **Controllo:** `npm run sim -- 3 tutti`, Cappella vuota e completa, semi 1001–1003, prima e dopo il riordino: 24 notti abbinate per personaggio e seme, 24.871 campi confrontati, **0 differenze**. Le notti finiscono in un ordine diverso nel file `prove/sim.json` perché girano in parallelo: il confronto va fatto per personaggio e seme, non per posizione.

### 12/11 — Prova «pochi e forti» (interruttori del LAB, spenti di partenza; la notte normale non cambia)

Proposta di Edoardo per il pivot, solo da misurare: **a** `pochi=1` (nemici massimi in campo e comparse al secondo ÷ 3, salute e Lumen dei nemici comuni × 3; orde, élite e Seth come sempre; `POCHI_E_FORTI`), **b** `schermo=1` (le armi non colpiscono, non lasciano stati e non mirano fuori dal campo visibile), **c** entrambi. Nel LAB: scheda Eventi, «Pochi e forti» e «Armi solo nello schermo».

**Misure nuove.** Alle misure del «Confronto per il pivot» si aggiungono: **vita visibile** (dalla prima entrata nel campo visibile alla morte; chi muore senza esserci mai entrato conta 0 s), **uccisi fuori schermo** (il nemico muore fuori dal campo visibile, cioè lo schermo senza le fasce dell'HUD) e **chi li uccide** (l'arma, la reazione o la maledizione che toglie l'ultima salute).

**Controllo.** `npm run sim -- 3 tutti`, Cappella vuota e completa, semi 1001–1003, build di 3c77f2b contro quella con le misure e gli interruttori spenti: 24 notti, 6246 campi confrontati, **0 differenze**. Le notti normali da 12 ridanno anche le vittorie dell'11/11 (32/48 e 40/48).

**Notte normale: chi uccide fuori schermo** (96 notti). Muore fuori dal campo visibile il **46% dei nemici a Cappella vuota e il 42% a completa**. Parte dei morti fuori schermo, e tra parentesi quanti dei nemici uccisi da quell'arma muoiono fuori schermo:

- vuota: Acqua santa 39,5% (49%), Campana 23,7% (48%), Esorcismo 9,6% (56%), abilità speciali 4,9% (36%), Sampietrini 4,5% (57%), Fuoco fatuo 3,8% (51%), Bastone 2,7%, Candela 2,7%, Lama di luce 2,6%, Eclissi 2,2%, Turibolo 2,0%, Falce 0,9%, Lanterna 0,6% (15%), maledizione 0,3%, Pala 0% (0%);
- completa: Acqua santa 34,6% (49%), Campana 16,7% (43%), Lapide 7,8% (44%), Eclissi 7,4% (42%), abilità 5,7% (34%), Esorcismo 4,0%, Sampietrini 4,0%, Bastone 3,4%, Rosario spezzato 3,0%, Fuoco fatuo 2,9%, Candela 2,9%, Turibolo 2,5%, Lama di luce 2,1%, Falce 1,6% (21%), Corvo 0,7% (18%), maledizione 0,3%, Lanterna 0,2% (6%), Velo funebre 0,1%, Pala 0% (1%).

**Simulazione** (`npm run sim -- 12 tutti`, più `pochi=1`, `schermo=1` o tutti e due; Cappella vuota e completa, semi 1001–1012; 48 notti per riga, incertezza di circa ±12 punti sulle vittorie). Vita in secondi su tutta la notte; reazioni a notte nell'ordine Eclissi, Rivelazione, Esorcismo, Interramento.

| Cappella | Prova | Vittorie (L, B, Ba, S) | Morti senza reazione | Morti senza stato | Vita dalla comparsa: mediana / 90° | Vita visibile: mediana / 90° | Uccisi fuori schermo | Reazioni a notte (Ecl, Riv, Eso, Int) | Uccisi a notte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vuota | normale | 32/48 (5, 6, 11, 10) | 69% | 11% | 0,8 / 3,0 | 0,2 / 1,9 | 46% | 773, 4378, 4521, 3542 | 37 148 |
| vuota | a · pochi | 24/48 (6, 6, 5, 7) | 33% | 2% | 2,1 / 7,2 | 1,3 / 5,2 | 31% | 671, 1986, 2009, 1686 | 6896 |
| vuota | b · schermo | 16/48 (2, 5, 5, 4) | 64% | 12% | 1,6 / 5,5 | 0,9 / 3,9 | 0% | 652, 1990, 3515, 1820 | 18 892 |
| vuota | **c · entrambi** | 18/48 (5, 3, 2, 8) | **30%** | 3% | 3,0 / 10,8 | **2,2** / 8,1 | **0%** | 578, 1286, 1810, 818 | 4583 |
| completa | normale | 40/48 (9, 10, 10, 11) | 57% | 13% | 0,8 / 3,3 | 0,3 / 2,2 | 42% | 3126, 10 354, 1719, 3499 | 39 702 |
| completa | a · pochi | 41/48 (10, 9, 11, 11) | 32% | 5% | 1,7 / 6,2 | 1,0 / 4,6 | 29% | 2167, 3021, 1710, 1442 | 9674 |
| completa | b · schermo | 35/48 (10, 9, 9, 7) | 65% | 16% | 1,7 / 5,9 | 1,0 / 4,2 | 0% | 1548, 3384, 2240, 2177 | 23 832 |
| completa | **c · entrambi** | 36/48 (10, 6, 9, 11) | **33%** | 5% | 2,5 / 9,7 | **1,7** / 7,4 | **0%** | 1686, 1514, 1608, 1239 | 6948 |

Per personaggio (12 notti per riga):

| Cappella | Prova | Personaggio | Vittorie | Morti senza reazione | Morti senza stato | Vita dalla comparsa: mediana / 90° | Vita visibile: mediana / 90° | Uccisi fuori schermo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vuota | normale | Lampionaio | 5/12 | 62% | 8% | 0,9 / 3,4 | 0,3 / 2,3 | 41% |
| vuota | normale | Becchino | 6/12 | 69% | 9% | 0,9 / 3,1 | 0,3 / 2,0 | 44% |
| vuota | normale | Badessa | 11/12 | 75% | 10% | 0,8 / 3,1 | 0,1 / 1,9 | 54% |
| vuota | normale | Strega | 10/12 | 66% | 13% | 0,7 / 2,6 | 0,2 / 1,6 | 43% |
| vuota | a · pochi | Lampionaio | 6/12 | 31% | 2% | 2,7 / 8,3 | 1,8 / 6,1 | 26% |
| vuota | a · pochi | Becchino | 6/12 | 32% | 3% | 2,1 / 7,9 | 1,2 / 5,8 | 36% |
| vuota | a · pochi | Badessa | 5/12 | 45% | 1% | 2,2 / 7,6 | 1,3 / 5,3 | 37% |
| vuota | a · pochi | Strega | 7/12 | 28% | 3% | 1,7 / 5,7 | 1,0 / 4,2 | 27% |
| vuota | b · schermo | Lampionaio | 2/12 | 62% | 11% | 2,0 / 6,8 | 1,2 / 5,0 | 0% |
| vuota | b · schermo | Becchino | 5/12 | 59% | 14% | 2,0 / 6,8 | 1,3 / 5,1 | 0% |
| vuota | b · schermo | Badessa | 5/12 | 75% | 11% | 1,5 / 5,1 | 0,9 / 3,4 | 0% |
| vuota | b · schermo | Strega | 4/12 | 56% | 13% | 1,2 / 4,2 | 0,7 / 2,9 | 0% |
| vuota | c · entrambi | Lampionaio | 5/12 | 26% | 3% | 3,2 / 10,9 | 2,3 / 8,2 | 0% |
| vuota | c · entrambi | Becchino | 3/12 | 30% | 4% | 3,3 / 12,1 | 2,4 / 9,3 | 0% |
| vuota | c · entrambi | Badessa | 2/12 | 37% | 1% | 3,1 / 12,0 | 2,4 / 8,9 | 0% |
| vuota | c · entrambi | Strega | 8/12 | 29% | 3% | 2,6 / 9,3 | 1,8 / 7,0 | 1% |
| completa | normale | Lampionaio | 9/12 | 62% | 12% | 1,1 / 4,2 | 0,5 / 3,0 | 35% |
| completa | normale | Becchino | 10/12 | 60% | 14% | 1,1 / 4,0 | 0,4 / 2,8 | 38% |
| completa | normale | Badessa | 10/12 | 55% | 10% | 0,8 / 3,0 | 0,2 / 2,0 | 48% |
| completa | normale | Strega | 11/12 | 54% | 14% | 0,6 / 2,4 | 0,1 / 1,6 | 43% |
| completa | a · pochi | Lampionaio | 10/12 | 30% | 6% | 2,2 / 7,8 | 1,4 / 6,0 | 20% |
| completa | a · pochi | Becchino | 9/12 | 36% | 5% | 2,3 / 8,3 | 1,4 / 6,1 | 27% |
| completa | a · pochi | Badessa | 11/12 | 34% | 3% | 1,8 / 6,6 | 1,0 / 4,6 | 37% |
| completa | a · pochi | Strega | 11/12 | 31% | 5% | 1,2 / 3,9 | 0,6 / 2,8 | 30% |
| completa | b · schermo | Lampionaio | 10/12 | 62% | 15% | 1,8 / 6,1 | 1,0 / 4,3 | 0% |
| completa | b · schermo | Becchino | 9/12 | 64% | 17% | 2,2 / 7,7 | 1,4 / 6,0 | 0% |
| completa | b · schermo | Badessa | 9/12 | 69% | 13% | 1,6 / 5,4 | 0,9 / 3,8 | 0% |
| completa | b · schermo | Strega | 7/12 | 63% | 20% | 1,4 / 4,8 | 0,8 / 3,4 | 0% |
| completa | c · entrambi | Lampionaio | 10/12 | 26% | 5% | 2,8 / 10,7 | 1,9 / 7,9 | 0% |
| completa | c · entrambi | Becchino | 6/12 | 33% | 6% | 3,5 / 12,9 | 2,6 / 10,0 | 0% |
| completa | c · entrambi | Badessa | 9/12 | 38% | 5% | 2,6 / 9,8 | 1,8 / 7,3 | 0% |
| completa | c · entrambi | Strega | 11/12 | 35% | 6% | 1,9 / 6,9 | 1,2 / 5,1 | 1% |

- **Soglie richieste** (vita visibile mediana almeno 3 s, meno del 30% di morti senza reazione, meno del 5% di uccisi fuori schermo): **nessuna versione le raggiunge tutte e tre.** La più vicina è **c**: fuori schermo 0%, morti senza reazione 30% a Cappella vuota (proprio sulla soglia) e 33% a completa, ma vita visibile mediana 2,2 s e 1,7 s. Nessun personaggio arriva a 3 s in nessuna prova: il più alto è il Becchino in c a Cappella completa, con 2,6 s. A Cappella vuota, in c, il Lampionaio e la Strega stanno sotto il 30% di morti senza reazione (26% e 29%); il Becchino è al 30%.
- **a da sola** dimezza i morti senza reazione (69% → 33%, 57% → 32%) e moltiplica per 5–6 la vita visibile, ma un terzo dei nemici muore ancora fuori schermo (31% e 29%). Le vittorie cambiano poco (vuota 32 → 24, completa 40 → 41).
- **b da sola** porta a zero gli uccisi fuori schermo e raddoppia la vita, ma i morti senza reazione restano come oggi (64%, 65%) ed è la più dura: a Cappella vuota 16 vittorie su 48 (il Lampionaio 2 su 12).
- **c** è la più lenta: 4–7 mila nemici uccisi a notte invece di 37–40 mila. A Cappella vuota le vittorie scendono da 32 a 18 su 48 (Badessa da 11 a 2, Becchino da 6 a 3); a Cappella completa da 40 a 36.
- **Vincoli** (il primo boss è il primo vero ostacolo; nessuno muore sempre prima del 5; Lampionaio a Cappella vuota prima del 5 al massimo in 3 notti su 12). Normale e c: reggono. **a, Cappella vuota**: la Strega muore 1 volta prima del primo boss e 0 contro di lui (vincolo non rispettato). **b, Cappella completa**: la Strega 1 prima e 0 contro (non rispettato). **b, Cappella vuota**: il Lampionaio muore prima del 5 in 3 notti su 12 (al limite). Con una notte sola su 12 la differenza può essere caso. Nessuno muore sempre prima del 5.
- Il bot non è stato cambiato: con pochi nemici più resistenti sceglie e si muove come con la folla.

**Prova prestazioni** (dal menu, LAB → Schermo, 60 s al minuto 14; Chromium sul Mac M1 con la grafica del Mac e lo schermo del S25, non un telefono). La prova riempie sempre il campo fino a 400 nemici, anche con «pochi e forti»: misura il caso peggiore, non la notte della prova c (dove i nemici in campo sono un terzo).

| Prova | In campo in media | Media | Fotogrammi saltati | Secondi sotto 55 | Blocchi sopra 100 ms |
| --- | --- | --- | --- | --- | --- |
| interruttori spenti | 299 | 60,0 fps | 0 | 0% | 0 |
| c (pochi e schermo) | 296 | 60,0 fps | 1 | 0% | 0 |

Il controllo «fuori schermo» su ogni colpo e su ogni scelta del bersaglio non pesa sul Mac. Va misurato sul S25 con la Prova prestazioni dell'APK di prova.

### 12/11 — Confronto per il pivot (solo misure, nessun numero di gioco cambia)

Dato di partenza per la fetta verticale del ramo `hades`. Tre misure nuove della simulazione, contate su ogni nemico ucciso (non su quelli ancora vivi alla fine della notte o alla morte del personaggio):

- **morti senza reazione**: il nemico non ha mai subito una reazione (Eclissi, Rivelazione, Esorcismo, Interramento) in tutta la sua vita; per tutti i nemici, e a parte per bruti (i bruti élite contano tra le élite), élite e Seth;
- **morti senza stato**: il nemico è morto senza aver mai avuto uno stato (Abbagliato, Consacrato, Maledetto, Sepolto);
- **tempo di vita**: dalla comparsa (appena fuori dallo schermo) alla morte, in secondi; minimo, mediana e 90° percentile, per fase della notte. Il nemico conta nella fase in cui **muore** (minuti 0–5, 5–10, 10–15).

**Controllo.** `npm run sim -- 3 tutti`, Cappella vuota e completa, semi 1001–1003, build di f352417 contro quella con le misure: 24 notti, 6246 campi confrontati, **0 differenze**. Anche le simulazioni da 12 notti ridanno le notti della voce dell'11/11 (vittorie 32/48 e 40/48, uguali personaggio per personaggio).

**Simulazione** (`npm run sim -- 12 tutti`, Cappella vuota e completa, semi 1001–1012, Stati certi accesi come da regola; 48 notti per condizione, l'incertezza è di circa ±12 punti). Tra parentesi i nemici uccisi in 12 notti.

| Cappella | Personaggio | Vittorie | Morti senza reazione: tutti | bruti | élite | Seth | Morti senza stato | Vita 0–5: min / mediana / 90° (s) | Vita 5–10 | Vita 10–15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vuota | Lampionaio | 5/12 | 62% (295 764) | 3% (23 390) | 11% (127) | 0% (12) | 8% | 0,0 / 1,5 / 6,0 | 0,0 / 0,8 / 2,6 | 0,0 / 0,9 / 3,3 |
| vuota | Becchino | 6/12 | 69% (396 160) | 8% (30 350) | 21% (154) | 0% (16) | 9% | 0,0 / 1,3 / 4,4 | 0,0 / 0,8 / 2,4 | 0,0 / 0,8 / 3,4 |
| vuota | Badessa | 11/12 | 75% (530 113) | 18% (42 351) | 19% (186) | 0% (23) | 10% | 0,0 / 1,2 / 3,3 | 0,0 / 0,7 / 2,2 | 0,0 / 0,8 / 4,1 |
| vuota | Strega | 10/12 | 66% (561 085) | 5% (46 919) | 14% (179) | 0% (22) | 13% | 0,0 / 0,9 / 3,2 | 0,0 / 0,6 / 1,8 | 0,0 / 0,8 / 3,3 |
| **vuota** | **tutti** | **32/48** | **69%** (1 783 122) | **9%** (143 010) | **16%** (646) | **0%** (73) | **11%** | 0,0 / 1,2 / 3,9 | 0,0 / 0,7 / 2,2 | 0,0 / 0,8 / 3,6 |
| completa | Lampionaio | 9/12 | 62% (374 871) | 10% (36 451) | 18% (174) | 0% (20) | 12% | 0,0 / 1,6 / 5,8 | 0,0 / 0,9 / 3,7 | 0,0 / 1,1 / 4,1 |
| completa | Becchino | 10/12 | 60% (394 971) | 7% (37 197) | 22% (172) | 0% (21) | 14% | 0,0 / 1,4 / 4,8 | 0,0 / 0,9 / 3,1 | 0,0 / 1,2 / 4,7 |
| completa | Badessa | 10/12 | 55% (532 691) | 7% (45 063) | 17% (183) | 0% (22) | 10% | 0,0 / 1,0 / 2,8 | 0,0 / 0,6 / 2,3 | 0,0 / 0,9 / 4,2 |
| completa | Strega | 11/12 | 54% (603 145) | 6% (61 715) | 20% (184) | 0% (23) | 14% | 0,0 / 0,9 / 3,3 | 0,0 / 0,5 / 1,9 | 0,0 / 0,7 / 2,7 |
| **completa** | **tutti** | **40/48** | **57%** (1 905 678) | **7%** (180 426) | **19%** (713) | **0%** (86) | **13%** | 0,0 / 1,1 / 3,9 | 0,0 / 0,7 / 2,6 | 0,0 / 0,9 / 3,8 |

- **La maggior parte dei nemici muore senza reazioni**: 69% a Cappella vuota, 57% a completa. Le reazioni toccano quasi tutti i nemici grossi (bruti 91–93%, élite 81–84%, ogni Seth) e circa un nemico piccolo su tre.
- **Quasi nessuno muore senza stati** (11–13%): gli stati arrivano a quasi tutti, le reazioni no. Tra bruti, élite e Seth i morti senza stato sono quasi zero (vuota: 1 bruto e 1 élite in 48 notti; completa: 357 bruti e 15 élite).
- **I nemici vivono pochissimo**: mediana tra 0,5 e 1,6 s, 90° percentile sotto i 6 s in ogni fase; nei minuti 5–10 la vita è la più corta (mediana 0,7 s). In una notte intera muoiono circa 45–50 mila nemici, con un centinaio in campo alla volta.
- **Il minimo è sempre 0,0 s**: muore nel passo stesso in cui compare il 2–4% dei nemici; **entro mezzo secondo dalla comparsa ne muore il 20–35%** (vuota: 21% nei minuti 0–5, 32% nei 5–10, 30% nei 10–15; completa: 22%, 35%, 26%), cioè quando sono ancora appena fuori dallo schermo.
- Il tempo di vita parte dalla comparsa, non da quando il nemico entra nello schermo; i nemici ancora vivi a fine notte non sono contati. Dettagli per notte in `prove/sim.json` (`mortiPerCategoria`, `vitaPerFase` in decimi di secondo).
- Vincoli: reggono (stesse notti dell'11/11). Il tag `survivor-v1` non è stato creato: lo decide Edoardo.

### 11/11 — Ritocchi alle build e quattro Unioni nuove (decisioni di Edoardo)

Voce 1: Incensiere dell'ultima ora, nubi che rallentano almeno del 50%, in tutto non più del 60%; Falce di Seth, maledetti sotto il 30% (normali sempre 15%); Corvo, a ogni beccata le anime a terra entro 150 px dal nemico beccato (prima 1–4 anime lontane; il livello 3 rimasto vuoto dà +4 danno, 33 → 37, e il livello 6 sale di +7 invece di +11: segnaposto di Claude); Lama di luce, i suoi colpi ignorano la quiete. Il Candelabro funebre non cambia (la scia lasciava già Abbagliato). Voce 2: Lapide inchiodata (3 s a terra, seppellisce chi la tocca entro 36 px), Rosario dei vespri (1 ripartenza per lancio), Stormo del lutto, Sudario (fino a 6 s). Tutti i valori *da rivedere*. Simulazione dopo le due voci, stesse colonne della voce 3 e dei tetti (`npm run sim -- 12 tutti`, Cappella vuota e completa, semi 1001–1012).

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Primo boss: prima / contro | Morti per Seth: contatto / mosse | Danno delle reazioni | Reazioni a notte (Ecl, Riv, Eso, Int) | Livello medio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tetti, vuota | 32/48 (7, 7, 9, 9) | 2, 1, 0, 0 | 2/2, 1/1, 0/0, 0/0 | 0/0, 3/1, 1/0, 1/0 | 15,6%, 13,9%, 13,3%, 19,2% | 593, 4114, 4974, 3789 | 61 |
| **ritocchi e Unioni, vuota** | **32/48** (5, 6, 11, 10) | **2**, 1, 0, 0 | 2/3, 1/1, 0/0, 0/0 | 3/0, 5/0, 1/0, 0/1 | 19,1%, 14,1%, 14,9%, 20,6% | 773, 4378, 4521, 3542 | 60 |
| tetti, completa | 39/48 (7, 10, 11, 11) | 0, 0, 0, 0 | 0/1, 0/1, 0/0, 0/0 | 1/0, 0/0, 1/0, 0/0 | 22,5%, 23,2%, 14,6%, 23,9% | 2752, 8505, 2092, 2771 | 70 |
| **ritocchi e Unioni, completa** | **40/48** (9, 10, 10, 11) | 0, 0, 0, 0 | 0/1, 0/1, 0/0, 0/0 | 2/0, 0/0, 2/0, 0/0 | 24,1%, 17,1%, 11,8%, 30,4% | 3126, 10354, 1719, 3499 | 72 |

- **Vincoli: reggono.** A Cappella vuota il Lampionaio muore prima del minuto 5 in 2 notti su 12 (3:51 e 3:26, scheletri delle comparse; al massimo 3); nessuno muore più spesso prima del primo boss che contro di lui (Lampionaio 2 prima e 3 contro, Becchino 1 e 1); nessuno muore sempre prima del minuto 5.
- **Danno delle reazioni sul totale: 17,2% a Cappella vuota, 21,5% a completa** (senza la maledizione; 17,1% e 21,4% contandola). Prima 15,8% e 20,8%.
- **A Cappella vuota le Unioni non ci sono** (si sbloccano con «Sconfiggi Seth»; il bot parte senza): lì cambiano solo la Lama di luce e il Corvo, che a Cappella vuota non è sbloccato. La Lama di luce, presa in 29 notti su 48, fa partire in media 3161 reazioni a notte. Le vittorie restano 32/48; per personaggio si spostano di 1–2 notti, dentro il rumore di 12 notti.
- **Unioni fatte a Cappella completa** (notti in cui c'era a fine notte, su 48; la prima Unione arriva in 43 notti, in media a 6:31): Falce di Seth 14, Acquasantiera 11, **Lapide inchiodata 11**, Campana a morto 9, **Rosario dei vespri 9**, Verga dei nomi 9, Candelabro funebre 8, Fuochi erranti 7, Selciato 6, **Stormo del lutto 5**, Faro dei morti 4, Vanga del custode 3, Lama dell'alba 3, Incensiere dell'ultima ora 2, **Sudario 1**. Il bot prende ogni Unione che gli viene offerta. Il Sudario esce poco perché il bot prende di rado la Campanella d'argento (preferenza 0,2).
- Il Corvo, a Cappella completa in 19 notti, fa partire 460 reazioni a notte; da questa misura non si separa lo Stormo del lutto (5 notti).
- Vittorie a Cappella completa 39 → 40, dentro l'incertezza (circa ±12 punti con 48 notti). La notte resta troppo facile per gli obiettivi provvisori: è il lavoro della sessione dei nemici, non di queste voci.

### 11/11 — Tetti degli stati (decisione di Edoardo)

`DEVOZIONE.lentoMassimo` da 0,8 a 0,6 (il Consacrato rallenta al massimo del 60%) e nuovo `DEVOZIONE.maledettoMassimo` 0,05 (il Maledetto toglie al massimo il 5% della salute massima al secondo; élite, Seth e Mietitore con le loro riduzioni dopo il tetto). Valori da rivedere. Stesse simulazioni (12 notti per personaggio, semi 1001–1012) e stesse colonne della voce 3.

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Primo boss: prima / contro | Morti per Seth: contatto / mosse | Danno delle reazioni | Reazioni a notte (Ecl, Riv, Eso, Int) | Livello medio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| voce 3, vuota | 31/48 (7, 7, 9, 8) | 2, 1, 0, 0 | 2/2, 1/1, 0/0, 0/0 | 0/0, 3/1, 1/0, 1/0 | 12,1%, 12,0%, 13,2%, 19,1% | 588, 4107, 4979, 3790 | 61 |
| **tetti, vuota** | **32/48** (7, 7, 9, 9) | **2**, 1, 0, 0 | 2/2, 1/1, 0/0, 0/0 | 0/0, 3/1, 1/0, 1/0 | 15,6%, 13,9%, 13,3%, 19,2% | 593, 4114, 4974, 3789 | 61 |
| voce 3, completa | 39/48 (7, 10, 11, 11) | 0, 0, 0, 0 | 0/1, 0/1, 0/0, 0/0 | 1/0, 0/0, 1/0, 0/0 | 24,1%, 19,1%, 15,3%, 23,6% | 2727, 8571, 2087, 2752 | 70 |
| **tetti, completa** | **39/48** (7, 10, 11, 11) | 0, 0, 0, 0 | 0/1, 0/1, 0/0, 0/0 | 1/0, 0/0, 1/0, 0/0 | 22,5%, 23,2%, 14,6%, 23,9% | 2752, 8505, 2092, 2771 | 70 |

- **Vincoli: reggono.** Lampionaio a Cappella vuota 2 notti su 12 prima del minuto 5 (3:51 e 3:26, scheletri delle comparse); il primo boss resta il primo ostacolo come nella voce 3.
- **Danno delle reazioni sul totale: 15,8% a Cappella vuota, 20,8% a completa** (senza la maledizione; 15,7% e 20,7% contandola). Maledizione a notte: 135094 + 10648 nell'Interramento a Cappella vuota, 120933 + 18773 a completa.
- Le colonne per personaggio del danno delle reazioni cambiano di qualche punto rispetto alla voce 3: in questa voce le ho ricalcolate da `prove/sim.json` con la stessa formula del riepilogo (Interramento aggiunto al totale); le differenze stanno dentro il rumore di 12 notti.
- **I tetti non cambiano quasi niente oggi**: vittorie 31 → 32 e 39 → 39, dentro l'incertezza (circa ±12 punti con 48 notti). Il Maledetto arriva al tetto solo con 3 armi d’Ombra e almeno 4 Riti (4% × 1,32); il Consacrato solo con 3 armi di Sacro e 7 Riti. Servono a fermare le notti lunghe con molti Riti, non a rendere più dura la notte di oggi: quello resta per la sessione dei nemici.
- Primo Rito: in 38/48 notti al livello 53 (vuota), in 36/48 al 56 (completa); Riti a notte 5,1 e 6,3.

### 11/11 (notte) — Raggio di unione confermato, prova prestazioni con gli effetti (nessun numero della notte cambia)
- `ANIME.accorpa` = 56 px confermato da Edoardo come valore di serie (era già 56 dal giorno prima).
- Prova prestazioni «Con effetti» sul Mac con il processore rallentato 6 volte (Pixel 7 emulato, circa 300 nemici in media; la misura vera è sul S25): effetti pixelfx con l'Eclissi a 12 fps 58,4 fps di media, 42 fotogrammi saltati; a 24 fps 58,7 fps e 62 saltati; effetti di sempre 58,7 fps e 27 saltati; nessun blocco sopra 100 ms in tutti e tre.
- Un cambio di misura della Pozza (quando il raggio dell'Acqua santa cresce) costa un blocco di circa 140 ms con il processore rallentato: il foglio nuovo si decodifica e va alla scheda grafica. Succede solo quando il raggio cambia.

### 11/11 — Lacrime di Lumen: raggio di unione 56 px (richiesta di Edoardo)
- `ANIME.accorpa` da 28 a 56 px: una lacrima che cade entro 56 px da una ferma si unisce a lei (il valore si somma). Nel LAB si prova tra 28, 40, 56 e 72 px. Disegno di nuovo × 2.
- Effetto non voluto, corretto: con 56 o 72 px una lacrima caduta accanto al personaggio si univa a una ferma più lontana, fuori dal raggio di raccolta, e chi stava fermo non saliva più di livello (la Badessa ferma, in 30 s, mai; con 28 px in 4,4 s). Regola nuova: si unisce solo a una ferma non più lontana di lei dal personaggio. Prima avevo provato a spostare la lacrima unita nel punto più vicino al personaggio: regalava esperienza (la Strega arrivava al livello 4 al secondo 60 invece del 3 al 62), scartata.
- Con la regola nuova, primo livello da fermi: Badessa 1,8–2,4 s, Lampionaio 2,3 s, con ogni raggio.
- Bot, 3 notti per personaggio (campione piccolo, solo per vedere che niente si rompe): Lampionaio muore a 7:10 (liv. 24), 11:46 (liv. 51) e 11:23 (liv. 59); Becchino vince due volte (liv. 63 e 72) e muore a 11:38 (liv. 52); Badessa muore a 11:10 (liv. 48) e 13:52 (liv. 67), vince una volta (liv. 56); Strega muore a 7:52 (liv. 31) e 11:19 (liv. 63), vince una volta (liv. 72). Nessuno muore sempre prima del minuto 5.

### 11/11 — Voce 3: Riti

Quando non resta nulla da potenziare, ogni 3 livelli si apre la scelta dei Riti (una carta per affinità delle armi che hai, al massimo 3); ogni Rito +8% alla forza dello stato e +8% alle reazioni che lo consumano, senza fine. Il bot sceglie l'affinità con più armi. Stesse simulazioni e stesse colonne della voce 0.

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Primo boss: prima / contro | Morti per Seth: contatto / mosse | Danno delle reazioni | Reazioni a notte | Livello medio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| voce 2, vuota | 28/48 (6, 7, 8, 7) | 2, 1, 0, 0 | 2/2, 1/1, 0/0, 0/0 | 1/0, 4/0, 3/0, 2/0 | 10,6%, 11,6%, 11,6%, 17,2% | 565, 3909, 4849, 3710 | 61 |
| **voce 3, vuota** | **31/48** (7, 7, 9, 8) | **2**, 1, 0, 0 | 2/2, 1/1, 0/0, 0/0 | 0/0, 3/1, 1/0, 1/0 | 12,1%, 12,0%, 13,2%, 19,1% | 588, 4107, 4979, 3790 | 61 |
| voce 2, completa | 38/48 (7, 10, 11, 10) | 0, 0, 0, 0 | 0/1, 0/1, 0/0, 0/0 | 1/0, 0/0, 1/0, 0/0 | 23,7%, 17,5%, 13,6%, 21,8% | 2643, 8151, 2274, 2859 | 70 |
| **voce 3, completa** | **39/48** (7, 10, 11, 11) | 0, 0, 0, 0 | 0/1, 0/1, 0/0, 0/0 | 1/0, 0/0, 1/0, 0/0 | 24,1%, 19,1%, 15,3%, 23,6% | 2727, 8571, 2087, 2752 | 70 |

- **Vincoli: reggono** (Lampionaio 2 notti su 12 prima del minuto 5; primo boss come nella voce 2).
- **Primo Rito: in media al livello 53 a Cappella vuota (in 38 notti su 48) e 56 a Cappella completa (36 su 48).** Nelle altre notti il bot ha ancora qualcosa da potenziare fino alla fine o muore prima.
- **Riti a notte: 5,0 a Cappella vuota e 6,3 a completa** (contando le notti senza; 6,4 e 8,4 nelle notti in cui si aprono). Per personaggio, a Cappella vuota: Lampionaio 4,3, Becchino 4,1, Badessa 5,1, Strega 6,7; a completa: 3,4, 5,5, 8,7, 7,8.
- «Pane e vino» da solo resta frequente: 523 volte in 48 notti a Cappella vuota, 645 a completa (circa 11–13 a notte).
- Le vittorie salgono di poco (28 → 31 e 38 → 39, dentro l'incertezza): i Riti arrivano tardi, verso il minuto 11–12.

### 11/11 — Voce 2: Voti

Un Voto per personaggio, sempre attivo (`src/data/voti.ts`, *da rivedere*): Lampionaio, dentro l'alone la quiete dura 1,5 s invece di 3; Becchino, +40% danno ai nemici fermi; Badessa, i consacrati fanno il 20% di danno in meno; Strega, nelle reazioni il Maledetto non si consuma. Tra le carte le armi nuove dell'affinità del personaggio pesano 1,3. Stesse simulazioni e stesse colonne della voce 0.

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Primo boss: prima / contro | Morti per Seth: contatto / mosse | Danno delle reazioni | Reazioni a notte | Livello medio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| voce 1, vuota | 23/48 (4, 2, 8, 9) | 2, 1, 0, 0 | 2/2, 1/2, 0/0, 0/0 | 4/0, 5/2, 2/1, 2/0 | 8,1%, 9,4%, 10,9%, 19,7% | 598, 4049, 3431, 2694 | 57 |
| **voce 2, vuota** | **28/48** (6, 7, 8, 7) | **2**, 1, 0, 0 | 2/2, 1/1, 0/0, 0/0 | 1/0, 4/0, 3/0, 2/0 | 10,6%, 11,6%, 11,6%, 17,2% | 565, 3909, 4849, 3710 | 61 |
| voce 1, completa | 37/48 (6, 11, 9, 11) | 0, 0, 0, 0 | 0/2, 0/0, 0/0, 0/0 | 3/0, 0/0, 2/0, 0/0 | 22,3%, 15,5%, 18,3%, 26,5% | 3616, 6829, 2133, 3231 | 68 |
| **voce 2, completa** | **38/48** (7, 10, 11, 10) | 0, 0, 0, 0 | 0/1, 0/1, 0/0, 0/0 | 1/0, 0/0, 1/0, 0/0 | 23,7%, 17,5%, 13,6%, 21,8% | 2643, 8151, 2274, 2859 | 70 |

- **Vincoli: reggono.** Lampionaio prima del minuto 5 in 2 notti su 12; primo boss: Lampionaio 2 prima e 2 contro, Becchino 1 e 1 (non più spesso prima).
- A Cappella vuota le vittorie salgono da 23 a 28, soprattutto Lampionaio (4 → 6) e Becchino (2 → 7): il Becchino, con il +40% sui nemici fermi, fa reazioni e Interramenti che valgono di più (danno delle reazioni da 9,4% a 11,6%). Le morti per Seth scendono (Becchino da 7 a 4 a contatto).
- La Strega con il Voto dell'Ombra non sale (a Cappella vuota 9 → 7, a completa 11 → 10, dentro l'incertezza): il Maledetto che resta dopo la reazione la fa reagire di nuovo solo dopo la quiete di 3 s.

### 11/11 — Voce 1: Devozione

Più armi della stessa affinità, più forte il suo stato (gradi 1 / 2 / 3: Abbagliato 15 / 20 / 25%, Consacrato 25 / 32 / 40%, Maledetto 2 / 3 / 4% al secondo, Sepolto 0,6 / 0,8 / 1,0 s; la reazione che consuma lo stato × 1 / 1,25 / 1,5). Tutti i valori *da rivedere*. Stesse simulazioni e stesse colonne della voce 0.

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Primo boss: prima / contro | Morti per Seth: contatto / mosse | Danno delle reazioni | Reazioni a notte | Livello medio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| voce 0, vuota | 22/48 (3, 3, 6, 10) | 2, 0, 0, 0 | 2/2, 0/2, 0/0, 0/0 | 3/2, 7/1, 6/0, 1/0 | 5,0%, 8,8%, 6,3%, 16,7% | 503, 3749, 3805, 2967 | 57 |
| **voce 1, vuota** | **23/48** (4, 2, 8, 9) | **2**, 1, 0, 0 | 2/2, 1/2, 0/0, 0/0 | 4/0, 5/2, 2/1, 2/0 | 8,1%, 9,4%, 10,9%, 19,7% | 598, 4049, 3431, 2694 | 57 |
| voce 0, completa | 31/48 (7, 8, 9, 7) | 0, 0, 0, 0 | 0/3, 0/0, 0/0, 0/0 | 0/0, 2/0, 3/0, 1/0 | 15,6%, 8,3%, 12,3%, 25,1% | 2495, 6002, 2023, 2569 | 66 |
| **voce 1, completa** | **37/48** (6, 11, 9, 11) | 0, 0, 0, 0 | 0/2, 0/0, 0/0, 0/0 | 3/0, 0/0, 2/0, 0/0 | 22,3%, 15,5%, 18,3%, 26,5% | 3616, 6829, 2133, 3231 | 68 |

- **Vincoli: reggono.** Lampionaio prima del minuto 5 in 2 notti su 12 (al massimo 3); nessuno muore più spesso prima del primo boss che contro di lui (Lampionaio 2 e 2, Becchino 1 e 2).
- La parte del danno fatta dalle reazioni sale per tutti (a Cappella completa il Lampionaio da 15,6% a 22,3%, la Badessa da 12,3% a 18,3%): con due o tre armi della stessa affinità le reazioni che consumano quello stato valgono fino a 1,5 volte. A Cappella completa le vittorie salgono da 31 a 37 (Becchino da 8 a 11, Strega da 7 a 11); a Cappella vuota restano uguali (22 → 23).

### 11/11 — Voce 0: copione dalle 3:00, vincolo del primo boss, barre a 41

Decisioni di Edoardo del 10/11 sera: dalle 3:00 il copione è «zombi 3, scheletro 1» (l'orda a cuneo di scheletri del minuto 3 resta); tolti i parametri `minuto3` e `lanterna`; il vincolo «Seth del 5 è il primo vero ostacolo» diventa «il primo boss della notte è il primo vero ostacolo: nessun personaggio muore più spesso prima del primo boss che contro di lui» (`npm run sim` lo controlla e stampa il conto); barre della salute e delle tacche larghe 41 con 1 pixel di bordo per lato, 39 dentro (misurate sulla foto del S25 a ×2: `prove/barre-41-tacche-8.png`, `prove/barre-41-tacche-4-danza.png`).

**Come si leggono le tabelle di questa voce e delle prossime.** `npm run sim -- 12 tutti`, Cappella vuota e completa, semi 1001–1012, 48 notti per riga. Valori per personaggio nell'ordine Lampionaio, Becchino, Badessa, Strega. «Primo boss» = morti prima di Seth del 5 / morti contro di lui (dalla sua comparsa alla sua morte). «Morti per Seth» = sconfitte in cui il colpo che uccide è Seth a contatto / una sua mossa (tutti e due i Seth). Danno delle reazioni = Eclissi, Esorcismo e parte in più dell'Interramento sul danno totale, senza la maledizione. Reazioni a notte: Eclissi, Rivelazione, Esorcismo, Interramento.

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Primo boss: prima / contro | Morti per Seth: contatto / mosse | Danno delle reazioni | Reazioni a notte | Livello medio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| prima, vuota | 21/48 (1, 6, 8, 6) | 5, 3, 0, 0 | 5/2, 3/1, 0/0, 0/0 | 4/0, 2/0, 4/0, 2/0 | 9,9%, 7,6%, 6,7%, 14,5% | 443, 3192, 4430, 3184 | 55 |
| **voce 0, vuota** | **22/48** (3, 3, 6, 10) | **2**, 0, 0, 0 | 2/2, 0/2, 0/0, 0/0 | 3/2, 7/1, 6/0, 1/0 | 5,0%, 8,8%, 6,3%, 16,7% | 503, 3749, 3805, 2967 | 57 |
| prima, completa | 36/48 (6, 11, 9, 10) | 0, 0, 0, 0 | 0/2, 0/0, 0/0, 0/0 | 2/1, 0/0, 2/0, 0/0 | 13,9%, 15,3%, 9,0%, 27,9% | 2728, 9173, 1660, 3014 | 68 |
| **voce 0, completa** | **31/48** (7, 8, 9, 7) | 0, 0, 0, 0 | 0/3, 0/0, 0/0, 0/0 | 0/0, 2/0, 3/0, 1/0 | 15,6%, 8,3%, 12,3%, 25,1% | 2495, 6002, 2023, 2569 | 66 |

- **Vincolo del Lampionaio: regge.** A Cappella vuota muore prima del minuto 5 in 2 notti su 12 (al massimo 3): a 3:28 per uno scheletro e a 2:53 per un fantasma, tutti e due delle comparse.
- **Vincolo del primo boss: regge per tutti.** Il Lampionaio a Cappella vuota muore 2 volte prima di Seth e 2 contro di lui (non più spesso prima); il Becchino 0 prima e 2 contro.
- **Morti per Seth**: a Cappella vuota il Becchino muore 7 volte per il contatto con Seth e 1 per una sua mossa, la Badessa 6 e 0, il Lampionaio 3 e 2, la Strega 1 e 0; a Cappella completa contano poco (Becchino 2, Badessa 3, Strega 1, tutte per contatto). Quasi tutte sono del secondo Seth (tra 11:00 e 11:50). Le mosse uccidono di rado: chi muore per Seth muore toccandolo.
- A Cappella completa le vittorie scendono da 36 a 31: dentro l'incertezza di 48 notti (±12 punti), con il Becchino da 11 a 8 e la Strega da 10 a 7.

### 10/11 (notte, seconda) — Misura del Lampionaio: orda del minuto 3 e Lanterna (nessun numero del gioco cambia)

Due parametri solo per il bot (`PROVE_BOT` in `src/data/bot.ts`): `minuto3=leggero` (l'orda del minuto 3 è un cuneo di zombi invece che di scheletri e il copione dalle 3:00 diventa «zombi 3, scheletro 1» invece di «scheletro 3, zombi 2») e `lanterna=forte` (la Lanterna fa il 25% di danno in più). `npm run sim -- 12 lampionaio,becchino`, Cappella vuota, semi 1001–1012. La versione normale è identica alle notti della voce precedente (24 notti, 0 differenze). «Prima di Seth» = danno subito al minuto nei minuti 2–5; «durante» = al minuto mentre Seth del 5 è in campo. Livello alla fine del minuto 3 (3:00); abilità = volte in cui il bot la usa prima del minuto 5.

| Versione | Personaggio | Vittorie | Morti prima del 5 (minuto, chi uccide) | Danno subito prima di Seth / durante | Seth del 5 primo ostacolo | Livello a 3:00 | Abilità prima del 5 | Chi uccide in tutte le sconfitte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normale | Lampionaio | 1/12 | **5** (3:22, 3:25, 3:27, 3:42, 3:58: tutti scheletri delle comparse) | 36 / 72 | sì | 13,0 | 14,0 | scheletro delle comparse 5, Seth a contatto 4, élite 1, bruto 1 |
| normale | Becchino | 6/12 | 3 (3:26 e 3:28 scheletro, 4:23 pipistrello, tutti delle comparse) | 55 / 52 | **no** | 14,6 | 16,8 | scheletro 2, Seth a contatto 2, pipistrello 1, bruto 1 |
| minuto3=leggero | Lampionaio | 4/12 | **2** (3:39 scheletro, 4:39 segugio, delle comparse) | 46 / 110 | sì | 13,0 | 15,7 | bruto 3, scheletro 2, segugio 1, mossa di Seth 1, Seth a contatto 1 |
| minuto3=leggero | Becchino | 7/12 | 1 (3:33 scheletro delle comparse) | 56 / 41 | **no** | 14,6 | 17,2 | Seth a contatto 3, scheletro 1, bruto 1 |
| lanterna=forte | Lampionaio | 2/12 | **3** (3:12 e 3:43 scheletro delle comparse, 4:49 segugio delle comparse) | 46 / 97 | sì | 13,4 | 13,8 | Seth a contatto 4, scheletro delle comparse 2, mossa di Seth 1, segugio 1, scheletro di un'orda sciolta 1, bruto 1 |
| lanterna=forte | Becchino | 6/12 | 3 (come la normale: la Lanterna non è sua) | 55 / 52 | **no** | 14,6 | 16,8 | come la normale |
| tutti e due | Lampionaio | 2/12 | **2** (3:13 scheletro delle comparse, 4:45 élite) | 43 / 58 | sì | 13,4 | 14,3 | Seth a contatto 4, bruto 3, scheletro 2, élite 1 |
| tutti e due | Becchino | 7/12 | 1 (3:33 scheletro delle comparse) | 56 / 41 | **no** | 14,6 | 17,2 | come «minuto3=leggero» |

- **Vincolo del Lampionaio (al massimo 3 notti su 12 prima del minuto 5)**: la normale non lo rispetta (5); lo rispettano **minuto3=leggero (2)**, **lanterna=forte (3, al limite)** e **tutti e due (2)**.
- **Chi lo uccide davvero**: nella voce precedente avevo scritto che gli scheletri arrivavano «subito dopo l'orda a cuneo del minuto 3». Con il nuovo segno (`natoInOrda`) si vede che **non sono scheletri dell'orda ma delle comparse normali**, quelle del copione dalle 3:00 (scheletro 3, zombi 2): per questo `minuto3=leggero`, che cambia anche il copione, funziona meglio della sola Lanterna.
- **Seth del 5 come primo ostacolo per il Becchino: nessuna versione lo rimette.** Il Becchino subisce 55–56 al minuto prima di Seth e 41–52 durante; con `minuto3=leggero` il danno durante Seth scende ancora (41), perché arriva al minuto 5 più forte. `lanterna=forte` non lo tocca (le sue notti sono identiche alla normale). Per lui serve altro (per esempio un Seth più duro o un minuto 4 più leggero): da decidere.
- Il livello a 3:00 non cambia con il copione (13,0 per il Lampionaio, 14,6 per il Becchino); con la Lanterna più forte il Lampionaio arriva a 13,4. L'abilità prima del 5 si usa 14–17 volte, simile in tutte le versioni.
- Nessuna modifica al gioco: decide Edoardo.

### 10/11 (notte) — Stati certi e mira diventano la regola; ritmo delle zone; vincolo del Lampionaio

Decisioni di Edoardo: la prova f degli Stati certi e Lanterna e Pala che mirano diventano la regola del gioco; ritmo delle zone di 1 s (*da rivedere*); il bot torna a girare intorno ai nemici. Nuovo vincolo: a Cappella vuota il Lampionaio muore prima del minuto 5 al massimo in 3 notti su 12. Nessun numero della notte è stato ritoccato per le vittorie.

`npm run sim -- 12 tutti`, Cappella vuota e completa, semi 1001–1012, 12 notti per personaggio. **Partenza**: il codice prima di queste voci, con `stati=certi mira=1` (in quel codice, con la mira, il bot non girava intorno ai nemici). **Dopo**: le regole nuove di partenza, con il ritmo delle zone e il bot che gira. Mediana della morte tra le notti perse; parte del danno fatta dalle reazioni (Eclissi, Esorcismo, parte in più dell'Interramento), senza la maledizione.

| Cappella | Personaggio | Vittorie (partenza → dopo) | Morti prima del 5 | Mediana della morte | Livello medio | Danno delle reazioni | Rivelazioni a notte |
| --- | --- | --- | --- | --- | --- | --- | --- |
| vuota | Lampionaio | 2 → 1 | 6 → **5** | 3:58 → 7:07 | 31 → 35 | 6,0% → 9,9% | 2562 → 3237 |
| vuota | Becchino | 4 → 6 | 5 → 3 | 3:07 → 5:59 | 40 → 49 | 6,2% → 7,6% | 1304 → 2478 |
| vuota | Badessa | 4 → 8 | 0 → 0 | 11:16 → 11:25 | 60 → 66 | 10,5% → 6,7% | 3152 → 4119 |
| vuota | Strega | 4 → 6 | 0 → 0 | 11:27 → 11:30 | 67 → 70 | 12,7% → 14,5% | 2520 → 2933 |
| completa | Lampionaio | 5 → 6 | 0 → 0 | 7:46 → 9:25 | 52 → 55 | 17,9% → 13,9% | 3461 → 9532 |
| completa | Becchino | 11 → 11 | 0 → 0 | 11:40 → 7:45 (1 notte persa) | 68 → 66 | 15,2% → 15,3% | 5153 → 5076 |
| completa | Badessa | 8 → 9 | 0 → 0 | 11:25 → 11:44 | 74 → 76 | 6,6% → 9,0% | 16 824 → 14 520 |
| completa | Strega | 9 → 10 | 0 → 0 | 14:29 → 14:25 | 79 → 77 | 24,1% → 27,9% | 7808 → 7565 |

In tutto: Cappella vuota 14 → **21 su 48**, completa 33 → **36 su 48**. Il Becchino torna a stare in piedi nei primi minuti perché il bot gira di nuovo intorno ai nemici (morti prima del 5 da 5 a 3).

- **La Strega con il ritmo delle zone non scende**: vittorie 4 → 6 a Cappella vuota e 9 → 10 a completa (dentro il rumore di 12 notti). A Cappella completa le sue reazioni a notte scendono poco, da 21 258 a 19 779 (−7%): quelle fatte partire dall'abilità da 5522 a 4279, dall'Acqua santa da 5703 a 5033. Perché poco: lo stato dura 3 s e una zona lo rinnova ogni 1 s, quindi i nemici dentro le pozze e il Rito proibito restano comunque sempre in stato; il ritmo toglie i rinnovi inutili, non la copertura. Per ridurre davvero servirebbe un ritmo vicino alla durata dello stato (3 s) o stati delle zone più corti: non applicato, da decidere.
- **Il Lampionaio supera il vincolo**: a Cappella vuota muore prima del minuto 5 in **5 notti su 12** (il vincolo ne permette 3: **2 di troppo**). Muore tra 3:22 e 3:58 (3:22, 3:25, 3:27, 3:42, 3:58), tutte e 5 le volte per il **contatto con uno scheletro**: subito dopo l'orda a cuneo di scheletri del minuto 3 (al momento del colpo lo scheletro non era più in formazione: o l'orda si era già sciolta, o era uno scheletro delle comparse normali). Nessuna morte da Seth prima del 5. `npm run sim` ora lo segnala. Non corretto.
- **Seth del 5 come primo ostacolo: non regge per il Becchino a Cappella vuota** (danno subito al minuto 55 prima di Seth, 52 durante); alla partenza non reggeva già né per il Becchino (67 prima, 38 durante) né per il Lampionaio, e a Cappella completa non reggeva per il Becchino (35 e 30), che ora regge (46 e 55). Il Becchino uccide Seth in 58 s in media: per lui il pericolo sono gli scheletri del minuto 3 più di Seth. Non corretto. Nessuno muore sempre prima del minuto 5.
- **Controllo delle regole vecchie**: con `stati=caso mira=0` le notti sono identiche a quelle di oggi pomeriggio a stati spenti (48 notti, stesse vittorie e stessi numeri): gli interruttori riportano davvero al gioco di prima.
- **Correzione di una misura**: la simulazione contava uno «stato lasciato» anche quando il dado (stati a caso) o il ritmo saltavano il colpo, perché leggeva un segnale rimasto dal colpo prima. Le notti non cambiano (rifatte, identiche); cambiano solo i conteggi degli stati per arma. Nella voce del pomeriggio i Sampietrini a stati spenti lasciano **332** Sepolto a notte, non 4816; i numeri con gli Stati certi (f) erano giusti.

### 10/11 (sera) — Correzioni senza effetto sulle notti, e misure: Stati certi a pezzi, Sampietrini, amuleti rari, mira

Qui si misura: nessun numero della notte normale è cambiato.

**Controllo della Parte 1** (pane da solo, Calamita in pixel, indicatore delle tacche, Grazia in pausa e a fine notte, sasso e polvere dei Sampietrini). `npm run sim -- 3 tutti`, Cappella vuota e completa, stessi semi, prima e dopo: 24 notti, 3641 campi confrontati, **0 differenze**; cambia solo il conto delle schermate di «Pane e vino» (prima scelto 86 volte a Cappella vuota, ora preso da solo 86 volte). Rifatto dopo la Parte 2 con gli interruttori spenti: ancora 0 differenze. In quelle 24 notti «Pane e vino» si è preso da solo 86 volte a Cappella vuota (8 notti su 12) e 165 a Cappella completa (7 su 12).

**1 · Stati certi a pezzi** (`npm run sim -- 12 tutti stati=…`, Cappella vuota, semi 1001–1012, 48 notti per riga; incertezza circa ±12 punti). a = stati certi, quiete e abilità che ignora la quiete, reazioni con i numeri di sempre; b–e = a più una reazione nuova; f = tutto (Rivelazione corretta: +50% per difetto, solo da 2 anime). Mediana della morte con le vittorie contate a 15:00. «Con la maledizione» aggiunge al totale la salute tolta da Maledetto e dall'Interramento sull'Ombra (prima non contata).

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Mediana | Livello medio | Reazioni a notte: Eclissi, Rivelazione, Esorcismo, Interramento | Danno delle reazioni sul totale | … con la maledizione | Maledizione a notte (Maledetto + Interramento) | Danno a notte: Eclissi, Esorcismo, parte in più dell'Interramento |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| spento | 7/48 (1, 4, 1, 1) | 12 | 11:12 | 44 | 43, 135, 225, 168 | 1,2% | 1,2% | 9 mila + 0 | 19, 17, 13 mila |
| a | **26/48** (5, 9, 5, 7) | 6 | 15:00 | 59 | 528, 3399, 4696, 3945 | 9,3% | 9,2% | 75 mila + 0 | 146, 388, 193 mila |
| b (Eclissi) | 17/48 (0, 7, 3, 7) | 8 | 11:32 | 56 | 468, 2611, 4413, 3589 | 10,6% | 10,5% | 63 mila + 0 | 179, 366, 166 mila |
| c (Esorcismo) | 22/48 (2, 8, 5, 7) | 7 | 11:46 | 56 | 391, 2969, 3701, 3723 | 9,0% | 8,9% | 62 mila + 0 | 111, 320, 175 mila |
| d (Rivelazione) | 19/48 (2, 6, 4, 7) | 6 | 11:49 | 56 | 523, 3213, 3772, 3470 | 9,1% | 9,0% | 63 mila + 0 | 146, 303, 160 mila |
| e (Interramento) | 17/48 (4, 7, 3, 3) | 7 | 11:22 | 57 | 539, 3041, 4499, 3524 | 10,5% | 10,5% | 60 mila + 3 mila | 140, 360, 189 mila |
| f (tutto) | 14/48 (3, 3, 4, 4) | 7 | 11:23 | 51 | 401, 2562, 3671, 2634 | 10,7% | 10,7% | 55 mila + 3 mila | 146, 306, 133 mila |

- **Quale regola spiega le vittorie in più: nessuna delle quattro reazioni nuove, ma la a.** Ogni colpo che lascia lo stato porta da 7 a 26 vittorie; aggiungere una reazione nuova non ne aggiunge (b–e tra 17 e 22, f 14: dentro l'incertezza, ma sempre sotto a). Le reazioni passano da circa 570 a 12 500 a notte: le Rivelazioni da 135 a 3400, con i numeri di sempre (anime ×2) le anime a notte salgono da 52 a 94 mila e il livello medio da 44 a 59. Il danno delle reazioni resta il 9–11% del totale: le vittorie vengono soprattutto da più livelli (Rivelazione) e dai nemici fermi e rallentati (3900 Interramenti, Consacrato su tutti), non dal danno. Con la Rivelazione corretta (d, f) le anime scendono (82 e 68 mila) e anche le vittorie.
- **La maledizione**, ora contata: 9 mila a notte a stati spenti, 55–75 mila con gli Stati certi; resta fuori dal «danno totale» e cambia di poco la parte delle reazioni (la sua parte nell'Interramento sull'Ombra è 3 mila).
- **Reazioni a catena: no.** Le fiammelle dell'Esorcismo e l'esplosione dell'Eclissi colpiscono senza affinità: non lasciano stati e non fanno partire altre reazioni.
- **Perché la Strega vince tanto** (11 su 12 il 10/11 a Cappella completa, 9 su 12 oggi con f): la sua abilità (Rito proibito, Ombra) e le pozze dell'Acqua santa (Sacro) feriscono ogni 0,3 s. Prima lasciavano lo stato solo nel 5% dei colpi; con gli Stati certi ogni colpo, quindi tutto il campo è Maledetto e Consacrato di continuo. A Cappella completa con f le reazioni sono il 24% del suo danno (5% a stati spenti): 6200 Eclissi e 5400 Esorcismi a notte, partiti soprattutto dall'Acqua santa (5700) e dall'abilità (5500); la maledizione che toglie passa da 23 a 154 mila a notte. Il Bastone resta il 9% del suo danno.
- **Da notare, già prima di oggi**: a Cappella vuota e stati spenti il Lampionaio muore prima del minuto 5 in **8 notti su 12** (mediana 3:02 nella prova della mira) e il Becchino in 4. Non muoiono *sempre* prima del 5, quindi il vincolo regge, ma di poco; il 10/11 mattina erano 6 su 48 in tutto. Non corretto: è da guardare (vedi «Da confermare»).

**2 · Sampietrini** (`npm run sim -- 12 tutti meta=max`, con e senza `senza=sampietrini`, Stati certi spenti e f; 48 notti per riga).

| Prova | Vittorie (L, B, Ba, S) | Morti prima del 5 | Mediana | Livello | Notti con i Sampietrini (vinte) | Scelti/offerti | Danno a notte (parte del totale) | Sepolto lasciato a notte | Interramenti fatti partire |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| spenti, con | 18/48 (3, 5, 7, 3) | 0 | 11:43 | 60 | 28 (8) | 181/385 | 392 mila (7,8%) | ~~4816~~ 332 (corretto la sera: vedi sotto) | 227 |
| spenti, senza | **32/48** (7, 10, 8, 7) | 0 | 15:00 | 69 | – | – | – | – | – |
| f, con | 36/48 (8, 11, 8, 9) | 0 | 15:00 | 71 | 20 (16) | 132/373 | 653 mila (7,1%) | 3729 | 2667 |
| f, senza | 37/48 (7, 11, 10, 9) | 1 | 15:00 | 71 | – | – | – | – | – |

- A stati spenti i Sampietrini **costano 14 vittorie su 48**: nelle notti in cui il bot li prende ne vince 8 su 28. Fanno poco danno (7,8%) e prendono il posto di un'arma forte; il Sepolto che lasciano (~~4800~~ 332 a notte, corretto la sera) fa partire pochi Interramenti (227).
- Con gli Stati certi la differenza sparisce (36 contro 37): i Sampietrini fanno partire 2667 Interramenti a notte, 12 volte di più, e le notti con loro vinte sono 16 su 20.

**3 · Amuleti rari** (`npm run sim -- 3 tutti meta=max amuleto=…`, 12 notti per riga, semi 1001–1003, Stati certi spenti; con 12 notti l'incertezza è di circa ±3 vittorie: si guardano solo le cose grandi). Danno subito e salute curata sono medie a notte.

| Amuleto imposto | Vittorie (L, B, Ba, S) | Morti prima del 5 | Mediana | Livello | Salute curata dal Patto | Danno subito (al minuto) | Anime | Salute da pane e fiaschetta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| nessuno | 5/12 (1, 1, 2, 1) | 0 | 12:43 | 62 | – | 519 (50) | 86 mila | 448 |
| Martire | 3/12 (1, 0, 1, 1) | 0 | 11:44 | 64 | – | 395 (30) | 82 mila | 362 |
| Patto di sangue | 5/12 (2, 2, 0, 1) | 0 | 12:31 | 63 | 486 | 465 (36) | 78 mila | 3 |
| Specchio rotto | 6/12 (2, 0, 2, 2) | 0 | 14:27 | 63 | – | 310 (26) | 87 mila | 339 |
| Cuore avido | 5/12 (0, 3, 1, 1) | 0 | 11:43 | 70 | – | 401 (31) | 91 mila | 303 |
| Lanterna cieca | **9/12** (2, 3, 2, 2) | 0 | 15:00 | 69 | – | 548 (39) | 104 mila | 422 |

- Nessuno è un disastro: con 12 notti Martire, Patto, Specchio rotto e Cuore avido stanno dentro il rumore rispetto a «nessuno». La **Lanterna cieca** (+35% danno, alone quasi spento) vince 9 su 12: per il bot, che non guarda il buio, il rovescio non pesa. Per un giocatore umano il buio conta: da provare a mano.
- **Martire**: il danno subito al minuto scende da 50 a 30 (i nemici vicini restano fermi), ma non vince di più. **Specchio rotto**: +25% danno subito sulla carta, eppure il danno subito al minuto scende (26 contro 50): il proiettile in più uccide prima chi si avvicina. **Patto di sangue**: cura 486 a notte, quasi quanto pane e fiaschetta senza amuleto (448), che col Patto non si usa più. **Cuore avido**: +5% anime e 8 livelli in più, pane e fiaschetta curano un terzo in meno.

**4 · Lanterna e Pala che mirano** (`npm run sim -- 12 lampionaio,becchino`, con e senza `mira=1`; «mira, girando» = `mira=1 davanti=1`, il bot gira ancora intorno ai nemici per tenerli davanti; 12 notti per personaggio per riga). Danno dell'arma iniziale a notte, al minuto e parte del danno totale.

| Cappella | Prova | Lampionaio: vittorie, morti prima del 5, mediana, livello | Lanterna: danno (al minuto), parte | Becchino: vittorie, morti prima del 5, mediana, livello | Pala: danno (al minuto), parte |
| --- | --- | --- | --- | --- | --- |
| vuota | senza mira | 1/12, 8, 3:02, 21 | 77 mila (7264), 14,0% | 4/12, 4, 9:25, 39 | 34 mila (3611), 7,8% |
| vuota | mira, senza girare | 2/12, 7, 3:21, 27 | 160 mila (13 969), 25,2% | 1/12, **9**, 3:29, 22 | 22 mila (4006), 19,3% |
| vuota | mira, girando | 2/12, **4**, 9:11, 36 | 243 mila (21 374), 19,8% | 4/12, **1**, 11:41, 52 | 74 mila (7095), 7,1% |
| completa | senza mira | 3/12, 0, 8:04, 45 | 373 mila (32 273), 20,2% | 5/12, 0, 11:41, 58 | 112 mila (9977), 5,0% |
| completa | mira, senza girare | 3/12, 2, 7:11, 38 | 217 mila (20 459), 21,4% | 4/12, 0, 11:36, 59 | 110 mila (10 593), 7,1% |
| completa | mira, girando | 4/12, 0, 7:36, 43 | 204 mila (19 363), 17,7% | 5/12, 0, 13:05, 55 | 190 mila (17 183), 10,1% |

- **La mira raddoppia il danno al minuto delle due armi** a Cappella vuota (Lanterna da 7300 a 14–21 mila, Pala da 3600 a 4000–7100), e a Cappella completa raddoppia quello della Pala se il bot continua a girare.
- **Togliere al bot `attaccoDavanti` peggiora molto**: senza girare intorno ai nemici il Becchino a Cappella vuota muore prima del 5 in 9 notti su 12 (prima 4) e la mediana scende a 3:29. Il giro non serve solo a mirare: tiene il bot in movimento e lontano dalla folla. Con la mira e il giro le morti prima del 5 scendono (Lampionaio da 8 a 4, Becchino da 4 a 1) e le mediane salgono di molti minuti (3:02 → 9:11, 9:25 → 11:41).
- Le vittorie cambiano poco (12 notti per riga): l'effetto si vede sui primi minuti.

### 10/11 (pomeriggio) — Cinque voci di Edoardo, una alla volta

Ogni voce ha la sua simulazione: `npm run sim -- 6 tutti meta=max`, stessi semi (1001–1006), Stati certi spenti; 24 notti, quindi l'incertezza è grande (circa ±20 punti): si guardano le tendenze.

| Dopo | Vittorie (L, B, Ba, S) | Morti prima del 5 | Mediana della morte | Livello medio | Seth del 5 ucciso | Prima Unione presa | «Pane e vino» offerto |
| --- | --- | --- | --- | --- | --- | --- | --- |
| partenza (c7c0ae1) | 11/24 (1, 3, 4, 3) | 2 | 7:43 | 59 | 21/22 | 16 notti, in media a 6:21 | 207 volte (8,6 a notte) |
| 1 · Unioni | 11/24 (1, 3, 3, 4) | 2 | 7:43 | 59 | 21/22 | 16 notti, in media a 7:16 | 211 (8,8) |
| 2 · Doni a 3 livelli | 16/24 (3, 4, 3, 6) | 0 | 11:14 | 65 | 23/24 | 19 notti, in media a 6:27 | 348 (14,5) |
| 3 · Acquasantiera | 15/24 (3, 3, 3, 6) | 0 | 11:14 | 65 | 23/24 | 19 notti, in media a 6:27 | 341 (14,2) |
| 4 · Grazia a tacche | 18/24 (5, 5, 5, 3) | 0 | 11:22 | 68 | 23/24 | 19 notti, in media a 6:07 | 386 (16,1) |
| 5 · Sampietrini | 8/24 (2, 1, 4, 1) | 0 | 11:20 | 58 | 22/24 | 16 notti, in media a 6:47 | 246 (10,3) |

- **1 · Unioni** (arma al 6, dono al massimo, sblocco con «Sconfiggi Seth»): le vittorie non cambiano; la prima Unione arriva **più tardi** (7:16 invece di 6:21), perché portare un dono al 5 costa più carte che portarlo al 3. Con i doni a 3 livelli (voce 2) il conto cambia.
- **2 · Doni a 3 livelli** (stesso effetto al massimo; Specchio, Lacrima e Campanella come prima): vittorie da 11 a 16 su 24, nessuna morte prima del 5, livello medio da 59 a 65; la Strega vince 6 notti su 6. «Pane e vino» esce **348 volte invece di 211** (14,5 a notte invece di 8,8; in 18 notti su 24 invece di 14): con meno livelli dei doni le carte da potenziare finiscono prima. La prima Unione torna prima (6:27) e le Unioni a fine notte salgono da 33 a 40.
- **3 · Acquasantiera** (con la fiaschetta piena il sorso diventa una pozza che cura 3% al secondo per 4 s): nelle 4 notti con l'Acquasantiera, 8,8 pozze che curano a notte, ma solo **4 salute ridata a notte**: le pozze nascono dove muoiono i nemici e il bot non ci entra apposta. Un giocatore che le cerca ne avrà molto di più; il bot non è stato cambiato. I sorsi veri sono scesi a 2 a notte in 2 notti (prima ~9 guadagnati, quasi tutti persi). Vittorie 15 contro 16: rumore.
- **4 · Grazia a tacche**: il bot passa in Grazia l'**1,6% della notte** (Lampionaio 1,1%, Becchino 2,4%, Badessa 1,6%, Strega 1,3%), con 72 tacche a notte; l'obiettivo provvisorio è 20–30%. Per starci servono circa 0,8 tacche al secondo per tutta la notte (90 Grazie da 2 s = 720 tacche): sfiorare quasi un nemico al secondo. Come impara a sfiorare il bot (proposta, *da rivedere*): sopra metà salute e fuori dalla Grazia sceglie il nemico normale più vicino (entro 120 px) che si può sfiorare e preferisce le direzioni che tra un passo lo lasciano a metà della fascia dello sfioramento. Prove fatte, stessi semi: la prima idea (premio a chi ha un nemico nella fascia tra un passo) con peso 0,6 / 2 / 4 dava 1,2% / 1,2% / 1,5% e con peso 4 morivano di più (11 vittorie); il «giro intorno al nemico» con peso 1 dà 1,6% e 18 vittorie, con peso 3 2,8% ma 11 vittorie. Il bot ha paura della folla e le armi uccidono i nemici prima che li sfiori: per misurare l'obiettivo serve la prova a mano di Edoardo. Le vittorie (18) sono dentro il rumore rispetto a 15–16.
- **5 · Sampietrini** (livelli di Edoardo; misure del volo di Claude): vittorie da 18 a **8** su 24, una discesa più grande dell'incertezza. Il bot li prende in 12 notti su 24 (79 volte su 191 offerte) e ne vince 2 (17%; senza, 50%); fanno 326 mila danni a notte, come Falce (386) e Corvo (239), molto meno di Lapide (2,9 milioni) e Acqua santa (3,2). Il bot (preferenza 1, come il Rosario spezzato) li sceglie al posto delle armi forti: Acqua santa passa da 15 a 12 notti, Campana da 15 a 12. Selciato fatto in 2 notti. Il bot per la Grazia arriva al 2,1% della notte (88 tacche). Non si corregge nulla: i numeri sono quelli della bozza.
- **Controllo finale** (stessi semi, codice finale, dopo il solo ingrandimento del sasso): 24 notti, 840 campi confrontati, 0 differenze rispetto alla voce 5.

### 10/11 — Notti esplorative del bot e interruttore «Stati certi» (nessun numero della notte normale cambia)

**Controllo.** `npm run sim -- 3 tutti`, Cappella vuota e completa, stessi semi, prima e dopo, con `esplora` e Stati certi spenti: 24 notti, 744 campi confrontati, **0 differenze**. Rifatto sul codice con le barre della salute nuove (5da9386, e3cf404): ancora 0 differenze, e quelle barre non cambiano le notti del bot (stesse notti di prima).

**Notti esplorative** (`npm run sim -- 24 tutti meta=max esplora`: 96 notti, 32 esplorative). Vittorie 21/96: **1/32 nelle notti esplorative, 20/64 nelle altre**. Scegliere a caso indebolisce molto il bot, quindi la colonna «con» penalizza gli oggetti che il bot prende solo esplorando, e la colonna «senza» quelli che prende sempre. Per personaggio: Lampionaio 4/24, Becchino 5/24, Badessa 8/24, Strega 4/24.

| Oggetto | Notti | Vinte | % vinte con | % vinte senza | Scelto/offerto |
| --- | --- | --- | --- | --- | --- |
| Sangue freddo | 66 | 21 | 32% | 0% | 66/117 |
| Lucciola | 39 | 14 | 36% | 12% | 39/239 |
| Ceri gemelli | 33 | 11 | 33% | 16% | 33/257 |
| Ossa d'élite | 24 | 6 | 25% | 21% | 24/238 |
| Danza macabra | 19 | 7 | 37% | 18% | 19/275 |
| Cuore avido | 5 | 1 | poche | 22% | 5/294 |
| Martire | 3 | 0 | poche | 23% | 3/352 |
| Specchio rotto | 2 | 0 | poche | 22% | 2/319 |
| Lanterna cieca | 2 | 1 | poche | 21% | 2/361 |
| Patto di sangue | 0 | 0 | poche | 22% | 0/359 |
| Unione: Candelabro funebre | 14 | 10 | 71% | 13% | 14/16 |
| Unione: Falce di Seth | 19 | 10 | 53% | 14% | 19/21 |
| Unione: Acquasantiera | 14 | 7 | 50% | 17% | 14/14 |
| Acqua santa | 51 | 18 | 35% | 7% | 305/639 |
| Campana | 51 | 15 | 29% | 13% | 282/716 |
| Corvo | 38 | 4 | 11% | 29% | 194/646 |
| Ali di falena | 25 | 0 | 0% | 30% | 62/391 |

- **Sangue freddo**: il 0% «senza» non dice che sia indispensabile: le 30 notti senza sono quasi tutte esplorative (il bot normale lo prende sempre). Nelle sole notti esplorative: 1/17 con, 0/15 senza.
- **Martire, Patto di sangue, Specchio rotto, Cuore avido, Lanterna cieca: non si può dire niente** (0–5 notti ciascuno). Con 3–5 grani, dopo uno o due amuleti non entra più nulla e anche esplorando il bot prende «Potenziamento» (141 volte su 198 reliquiari esplorativi). Patto di sangue 0 su 67 offerte esplorative è sfortuna del campione. Le notti in cui comparivano: Martire 3 sconfitte (5:35, 7:40, 7:27); Specchio rotto 2 sconfitte (7:27, 7:48); Cuore avido 1 alba e 4 sconfitte; Lanterna cieca 1 alba e 1 sconfitta. Per misurarli servono notti in cui l'amuleto c'è di sicuro (vedi «Da confermare»).
- Il resto della tabella (armi e doni) è in `prove/sim.json` della simulazione; reazioni a notte: Eclissi 394, Rivelazione 811, Esorcismo 155, Interramento 197; danno delle reazioni 4,2% del totale.

**Stati certi** (`npm run sim -- 12 tutti`, con e senza `stati=certi`, stessi semi, 48 notti per condizione). Valori di `STATI_CERTI` *da rivedere*; la notte non è stata corretta.

| Cappella | Stati | Vittorie (L, B, Ba, S) | Morti prima del 5 | Mediana della morte | Livello medio | Seth del 5 ucciso | Reazioni a notte: Eclissi, Rivelazione, Esorcismo, Interramento | Danno delle reazioni sul totale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vuota | normali | 7/48 (2, 2, 2, 1) | 6 | 8:06 | 44 | 37/42 | 43, 166, 170, 32 | 0,9% |
| vuota | **certi** | **15/48** (5, 2, 4, 4) | 4 | 11:07 | 50 | 40/44 | 403, 3007, 3441, 782 | 9,0% |
| completa | normali | 20/48 (3, 6, 6, 5) | 2 | 11:12 | 60 | 42/46 | 715, 1279, 212, 399 | 5,4% |
| completa | **certi** | **32/48** (6, 6, 9, 11) | 2 | 8:09 | 64 | 42/46 | 1996, 7691, 2457, 1341 | 14,9% |

- **Di quanto vince troppo**: +8 notti a Cappella vuota (da 15% a 31%), +12 a Cappella completa (da 42% a 67%); la Strega a Cappella completa vince 11 su 12. Danno delle reazioni a notte, completa: Eclissi 754 mila (prima 342), Esorcismo 465 mila (prima 23), parte in più dell'Interramento 106 mila (prima 40). La maledizione, anche quella doppia dell'Interramento, non è contata.
- Vincoli rispettati: Seth del 5 resta il primo ostacolo; nessun personaggio muore sempre prima del minuto 5.
- **Armi iniziali** (danno medio a notte e parte del danno totale del personaggio), normali → certi. Vuota: Lanterna 208 → 199 mila (18% → 11%), Pala 60 → 58 (10% → 7%), Turibolo 331 → 310 (10% → 6%), Bastone 467 → 520 (20% → 14%). Completa: Lanterna 308 → 272 (18% → 14%), Pala 158 → 123 (7% → 5%), Turibolo 800 → 584 (12% → 8%), Bastone 872 → 1191 (12% → 11%). Il danno delle armi resta simile: la parte scende perché crescono le reazioni.

**Prova prestazioni** (minuto 14, 400 nemici, 60 s; Chromium sul Mac M1 con lo schermo del S25, non un telefono):

| Prova | Reazioni nei 60 s | Media | Fotogrammi saltati | Secondi sotto 55 | Blocchi sopra 100 ms |
| --- | --- | --- | --- | --- | --- |
| Stati certi spenti | 599 | 60,0 fps | 2 | 0% | 0 |
| accesi, al massimo 24 cerchi | 3701 | 60,0 fps | 1 | 0% | 0 |
| accesi, 12 cerchi | 3681 | 60,0 fps | 3 | 0% | 0 |
| accesi, 6 cerchi | 3648 | 60,0 fps | 2 | 0% | 0 |

Sul Mac il tetto dei cerchi non fa differenza: le reazioni sono 6 volte di più ma il disegno regge. **Proposta: 12 cerchi** (*da rivedere*), da misurare sul S25 con la Prova prestazioni dell'APK. Durante la misura è venuto fuori un difetto che c'era già: lanciata da una partita in corso, la Prova prestazioni ferma la scena e misura uno schermo vuoto; dal menu funziona (vedi «Da confermare»).

### 9/11 — Il bot misura gli oggetti; sei correzioni (Vanga, Acquasantiera, Lucciola, Ossa d'élite, Martire, Ceri gemelli)

**Misure nuove (nessun numero di gioco cambia).** `prove/sim.json` ha per ogni notte gli oggetti posseduti a fine notte con il livello, le carte offerte e scelte, il danno di ogni arma e di ogni reazione, le reazioni per tipo, il minuto della prima Unione offerta e presa, la cura del Patto di sangue e i sorsi dell'Acquasantiera; `npm run sim` stampa la tabella per oggetto. Controllo: `npm run sim -- 3 tutti` prima e dopo, stessi semi, Cappella vuota e completa: 24 notti, 504 campi confrontati, 0 differenze. Il danno di un'arma è misurato come il «danno totale» della fine partita (prima di Abbagliato e Interramento); la parte in più dell'Interramento è contata a parte; la maledizione che consuma la salute non è contata.

**Correzioni** (richiesta di Edoardo, valori *da rivedere*):

| Oggetto | Prima | Ora |
| --- | --- | --- |
| Vanga del custode | fermo 3 s a ogni colpo | fermo 1,5 s; poi 4 s in cui la Vanga non lo ferma più (la stessa pausa del Sepolto) |
| Acquasantiera | un sorso ogni 40 uccisioni nelle pozze | in più, al massimo un sorso ogni 45 s |
| Lucciola | 1 grano; abbaglia tutti nell'alone ogni 0,5 s | 2 grani; abbaglia chi entra nell'alone, non più di una volta ogni 4 s per nemico |
| Ossa d'élite | 1 grano | 2 grani |
| Martire | 3 grani; onda di 150 px con 30 di danno base | 2 grani; l'onda non ferisce, lascia Consacrato e ferma 0,6 s chi è entro 150 px |
| Ceri gemelli | ricarica +30% | ricarica +10% |

**Vanga e Seth (prova con il Becchino immortale, fermo, Pala rivolta verso Seth, Seth che non muore, 60 s).** Prima: Seth fermo il 96% del tempo, fino a 57,6 s di fila, **nessuna mossa**: il fermo (1,5 s su Seth) si rinnovava a ogni colpo della Pala (0,95 s al livello 8, più il secondo colpo), e Seth fermo non attacca. Ora: fermo il 17% del tempo, al massimo 0,8 s di fila, 9 mosse in un minuto. Il bot invece scappa da Seth (gli sta vicino il 2% del tempo), per questo nelle simulazioni il difetto non si vedeva.

**Simulazione delle sole correzioni** (bot sul S25, 12 notti per personaggio = 48 per condizione, stessi semi; «prima» = la build di stamattina; senza le orde della sera, vedi più sotto):

| Cappella | Vittorie prima | Vittorie ora | Per personaggio ora (L, B, Ba, S) | Morti prima del 5 | Mediana della morte | Livello medio | Seth del 5 ucciso |
| --- | --- | --- | --- | --- | --- | --- | --- |
| vuota | 32/48 | 32/48 | 6, 8, 10, 8 | 4 | 7:11 | 51 | 40/44 |
| a metà | 32/48 | 29/48 | 3, 8, 10, 8 | 4 | 7:14 | 52 | 36/44 |
| completa | 38/48 | 32/48 | 2, 11, 10, 9 | 0 | 7:40 | 55 (prima 61) | 41/48 |

- A Cappella vuota le notti sono identiche: Rosario e Unioni lì sono spenti.
- A metà e completa le vittorie scendono di 3 e 6: dentro l'incertezza di ±12 punti, quindi è una tendenza, non una misura.
- Vincoli: Seth del 5 resta il primo ostacolo; nessun personaggio muore sempre prima del minuto 5 (a Cappella vuota muoiono prima del 5 tre notti del Lampionaio e una del Becchino).
- Il Lampionaio a Cappella completa vince 2 notti su 12 (prima 5) e ne perde 10 tra 7:08 e 8:22; uccide Seth del 5 in 5 notti su 12. Era già il più debole; non si corregge ora.

**Tabella per oggetto, Cappella completa** (48 notti, 32 vinte). «Notti» = a fine notte lo possedeva; «scelto/offerto» = carte. Danno medio a notte in migliaia.

| Oggetto | Notti | Vinte | Scelto/offerto | Livello | Danno |
| --- | --- | --- | --- | --- | --- |
| Campana | 28 | 21 | 146/293 | 7,0 | 2324 |
| Falce | 27 | 19 | 149/330 | 7,1 | 395 |
| Lapide | 26 | 20 | 151/347 | 7,5 | 2224 |
| Lama di luce | 25 | 18 | 147/361 | 7,2 | 348 |
| Fuoco fatuo | 21 | 17 | 131/334 | 7,5 | 413 |
| Corvo | 20 | 14 | 124/329 | 7,3 | 161 |
| Acqua santa | 19 | 17 | 125/305 | 7,7 | 3133 |
| Rosario spezzato | 18 | 13 | 111/320 | 7,5 | 514 |
| Velo funebre | 18 | 12 | 104/347 | 7,2 | 161 |
| Candela | 14 | 8 | 82/311 | 7,2 | 608 |
| Lanterna (arma iniziale) | 12 | 2 | 74/74 | 7,9 | 164 |
| Pala (arma iniziale) | 12 | 11 | 76/76 | 8,0 | 134 |
| Turibolo (arma iniziale) | 12 | 10 | 76/76 | 8,0 | 629 |
| Bastone (arma iniziale) | 12 | 9 | 78/78 | 8,0 | 800 |
| Unione: Falce di Seth | 14 | 12 | 14/14 | | |
| Unione: Campana a morto | 9 | 9 | 9/9 | | |
| Unione: Acquasantiera | 8 | 7 | 8/8 | | |
| Unione: Vanga del custode | 7 | 7 | 7/7 | | |
| Unione: Verga dei nomi | 6 | 5 | 6/6 | | |
| Unione: Candelabro funebre | 5 | 5 | 5/5 | | |
| Unione: Lama dell'alba | 4 | 3 | 4/4 | | |
| Unioni: Faro, Incensiere, Fuochi erranti | 2 ciascuna | 2 ciascuna | 2/2 ciascuna | | |
| Sale nero | 36 | 23 | 126/266 | 4,4 | |
| Chiodo di bara | 35 | 26 | 98/331 | 4,3 | |
| Cuore di cera | 31 | 24 | 88/295 | 4,2 | |
| Clessidra | 30 | 20 | 85/249 | 4,0 | |
| Specchio | 30 | 22 | 30/100 | 1,0 | |
| Stoppino lungo | 28 | 21 | 77/276 | 4,3 | |
| Lacrima di lumen | 21 | 11 | 36/151 | 2,0 | |
| Scudo di ferro | 21 | 16 | 46/304 | 3,5 | |
| Cera votiva | 14 | 10 | 36/265 | 3,6 | |
| Ali di falena | 13 | 7 | 20/219 | 3,4 | |
| Erbe amare | 8 | 7 | 17/206 | 4,6 | |
| Calamita | 6 | 2 | 10/166 | 3,2 | |
| Campanella d'argento | 5 | 3 | 7/145 | 1,8 | |
| Amuleto: Sangue freddo | 44 | 32 | 44/59 | | |
| Amuleto: Lucciola | 28 | 22 | 28/192 | | |
| Amuleto: Ceri gemelli | 22 | 18 | 22/213 | | |
| Amuleto: Ossa d'élite | 18 | 15 | 18/149 | | |
| Amuleto: Danza macabra | 9 | 7 | 9/256 | | |
| Amuleti: Lanterna cieca, Cuore avido, Martire, Specchio rotto, Patto di sangue | 0 | 0 | 0 su 277–309 | | |

Altro, Cappella completa, media a notte: abilità speciale 374 mila di danno; reazioni Eclissi 610, Rivelazione 893, Esorcismo 162, Interramento 292; danno delle reazioni Eclissi 209 mila, Esorcismo 17 mila, parte in più dell'Interramento 23 mila. Prima Unione offerta in 33 notti su 48, in media a 7:38, e il bot la prende sempre subito. Acquasantiera: 10 sorsi a notte guadagnati nelle 8 notti in cui c'era, ma solo 0,9 entrati davvero nella fiaschetta (il bot beve solo sotto il 40% di salute, quindi è quasi sempre piena). Con la Cappella a metà: Sangue freddo 41 notti, Lucciola 23, Ceri gemelli 22, Ossa d'élite 21; Falce di Seth l'Unione più fatta (16), Acquasantiera 9,8 sorsi a notte (0,2 entrati).

Prima delle correzioni (prova con 12 notti, Cappella completa) Lucciola, Ossa d'élite e Sangue freddo erano in tutte le 12 notti, e l'Acquasantiera ridava in media 246 sorsi a notte.

**Con le orde della sera (il codice di oggi su `prova`, versione 69c82c3).** Le correzioni sono state fatte in parallelo alla voce «9/11 (sera)» di un'altra sessione; le simulazioni qui sopra misurano le correzioni da sole. Sul codice che contiene tutte e due, 48 notti per condizione:

| Cappella | Vittorie (L, B, Ba, S) | Morti prima del 5 | Mediana della morte | Livello medio | Seth del 5 ucciso |
| --- | --- | --- | --- | --- | --- |
| vuota | 7/48 (2, 2, 2, 1) | 6 | 8:06 | 44 | 37/42 |
| a metà | 22/48 (1, 5, 8, 8) | 4 | 7:36 | 55 | 38/44 |
| completa | 20/48 (3, 6, 6, 5) | 2 | 11:12 | 60 | 42/46 |

Amuleti a fine notte, a metà / completa: Sangue freddo 43 / 38 notti, Lucciola 23 / 28, Ceri gemelli 28 / 20, Ossa d'élite 11 / 16, Danza macabra 6 / 7, gli altri 0. Unioni più fatte: Acquasantiera 16 / 14, Falce di Seth 14 / 18, Candelabro funebre 10 / 13. Prima Unione offerta (e presa) in 32 e 33 notti, in media a 7:19 e 6:58. Acquasantiera: circa 9 sorsi a notte, meno di 1 entrato davvero. A Cappella completa i morti prima del minuto 5 sono 2 su 48; a metà e completa le vittorie sono vicine tra loro, come già prima.

**Cosa la tabella non può dire:** Martire, Patto di sangue, Specchio rotto, Cuore avido e Lanterna cieca hanno 0 perché il bot non li prende mai (`amuletiPreferiti` a 0 in `src/data/bot.ts`, non toccato). Le correzioni a Martire non sono misurate. Le armi iniziali sono sempre presenti, quindi «notti» e «vinte» dicono il personaggio, non l'arma.

### 6/11 — Unioni: da 10 minuti o 500 Cera a 3 veglie vinte

Scelta di Edoardo. I numeri dentro la notte non cambiano: cambia quando un giocatore arriva alle Unioni, che ora sono un premio di fine percorso. Simulazione a Cappella vuota, dove le Unioni sono spente: 12 notti, 3 per personaggio, campione minimo e buono solo come controllo. Vince 1 notte su 12 (Lampionaio); le altre finiscono tra 6:42 e 10:48. Livello medio 57, da 28 a 75. Seth del minuto 5 ucciso in 11 notti su 12; nessun personaggio muore sempre prima del minuto 5. Lo scarto dall'obiettivo sul Lampionaio (1/3) è rumore di un campione così piccolo.

La simulazione a metà Cappella considera le Unioni sbloccate: ora può non essere vero per chi non ha ancora 3 veglie vinte. Resta così fino al bilanciamento finale (confermato da Edoardo il 6/11).

### 5/11 — Fotogrammi: `prova` contro `main` (nessun numero di gioco cambia)

Misure sul Mac, schermo del S25, stesse schermate. Il Mac non è il telefono: valgono le differenze, non i valori.

| Schermata | Processore rallentato ×4, con scheda grafica | Disegno a carico del processore |
| --- | --- | --- |
| Selezione | `main` 60 fps, 0,6 ms di lavoro; `prova` 60 fps, 0,7 ms | 60 fps entrambi |
| Partita 0:00 | `main` 2,4 ms; `prova` 3,1 ms | 55 e 54 fps |
| Minuto 14, 380 nemici | `main` 3,7 ms; `prova` 4,9 ms, scatti da 50 ms | `main` 41 fps; `prova` 26 fps, picchi da 200 ms |

- Scheda Schermo, ascolto di Indietro, fasce e controllo del joystick non pesano in modo misurabile.
- Con lanterne o fuochi in vista il buio si ridisegna per intero a ogni fotogramma per aprirne i fori: 36 ms a fotogramma contro 27 ms senza fori. Senza nulla in vista 25 ms, come prima. Gli aloni pesano circa 3 ms.
- Picchi singoli da circa 200 ms al minuto 14. Causa trovata con la Prova prestazioni: quando un dono allarga la luce (Stoppino lungo, Lucciola) il buio si ricostruisce pixel per pixel, 150–217 ms sul Mac; vale per le scelte che abbiamo visto in quella prova, non è escluso che ce ne siano altri. Capita con le carte aperte, a partita ferma.
- Nella selezione il difetto non si riproduce sul Mac: `main` e `prova` sono uguali e il processore è quasi fermo.
- **Sul Galaxy S25 (versione 5c1d869):** 60 fps fissi in tutte e quattro le prove, minuto 14 con 400 nemici e lanterne, con e senza fori; 59 fps nella selezione. I fori restano come sono (decisioni 5/11).

### 5/11 — Rompibili, seconda prova e luce

Dopo la partita di Edoardo su telefono. Stesso numero di oggetti, percentuali chiare: 24% urna, 24% giara, 12% lanterna, 40% niente. Urna e lanterna non danno più Cera. Olio 12 s, fuoco 5 s, rallentamento 40%, 14 danni ogni 0,4 s, 3 frammenti per un reliquiario: proposte da rivedere. Buio: sfumatura da 0,9 a 1,5, massimo da 78% a 88%, raggio entro il 36% del lato corto del campo (sul telefono circa 195-210 px invece di 260), alone caldo nuovo. Il raggio di gioco della Lucciola non cambia. Il bot non ha rompibili: reliquiari in più e danni del fuoco non sono misurati.

### 5/11 — Oggetti rompibili (prova, valori da rivedere)

Nuovi: 60% dei settori da 700 px con un oggetto; urna 1 goccia, giara 2, lanterna 1; pesi 4/4/2. La Cera dei nemici non cambia, quindi una notte ne dà un po' di più. Il bot gioca senza rompibili: la simulazione non cambia e non misura questa Cera in più.

### 9/11 (sera) — Calma più corta, più nemici, più bruti, orde che sbarrano la strada

Decisioni di Edoardo dopo una partita: calma da 20 a 10 s (marea 50 s); comparse un po' più fitte (1,4 + 2,9 m al secondo invece di 1,2 + 2,5 m, +15% circa, *da rivedere*); più bruti (peso 2 nei minuti 11, 13 e 14, al massimo 100 in campo); Lumen accorpato entro 28 px invece di 36. Le orde devono vincolare il movimento: a build avanzata morivano prima di farsi vedere. Ora attraversano il campo in linea retta senza inseguire, si sciolgono solo dall'altra parte e non si fanno spingere indietro.

Bot sul S25, Cappella vuota, 48 notti:
- con salute ×3 per tutte le orde: 4 vittorie, **15 morti prima del minuto 5** e per il Becchino Seth del 5 non era più il primo ostacolo (vincolo rotto): scartata;
- con salute ×3 solo dal minuto 6 (scelta): **7 vittorie su 48** (15%), 6 morti prima del minuto 5, mediana della morte 8:06, livello finale medio 44, Seth del 5 ucciso in 37 notti su 42. Vincoli rispettati; tre personaggi vincono 2 notti su 12, appena sopra l'obiettivo provvisorio.

### 9/11 — Orde a forma, meno bruti, Lumen accorpato

Decisioni di Edoardo: meno bruti a fine notte, Lumen accorpato come in Vampire Survivors, orde riconoscibili. Cambiano insieme:
- **bruti**: nel copione pesano al massimo 1 (prima 2 e 3 negli ultimi minuti) e in campo ce ne sono al massimo 30;
- **orde**: gli sciami di ogni minuto e le orde ogni 80 s diventano **un solo evento all'inizio di ogni minuto** (non nei minuti di Seth), con 3 s di preavviso sul bordo; un solo tipo, grande un terzo del campo (17 al minuto 1, 80 dal minuto 8), in quattro forme; la carica parte a 150 px invece di 260;
- **Lumen**: un'anima che cade entro 36 px da una ferma si unisce a lei.

Bot sul S25, Cappella vuota, 12 notti per personaggio (48), confronto con il 7/11: **32 vittorie su 48** (prima 3), 4 morti prima del minuto 5 (uguale: tre Lampionaio e un Becchino), mediana della morte 7:08 sulle 16 notti perse, livello finale medio 51 (prima 44), Seth del 5 ucciso in 40 notti su 44. I due vincoli sono rispettati; le vittorie sono molto sopra l'obiettivo provvisorio (5–15%). Non è stato separato quale delle tre modifiche pesa di più: la candidata principale è il tetto dei bruti, che a fine notte erano la maggior parte del campo.

Una prima versione con orde di 24 + 4 nemici per minuto (28 già al minuto 1, su un campo di 50) dava 24 vittorie ma 10 morti prima del minuto 5: scartata.

### 7/11 — Copione della notte, respiro e tetto a 250

Decisione di Edoardo: le comparse sembravano continue e senza criterio. Ora ogni minuto ha il suo copione (due tipi principali e al massimo uno di contorno, `COPIONE`), in ogni minuto dopo il primo arrivano 40 s di marea e 20 s di calma con le comparse al 25% (`RESPIRO`), e i nemici in campo sono al massimo 250 invece di 380. Tutti i valori sono *da rivedere*.

Bot sul S25, Cappella vuota, 12 notti per personaggio (48), confronto con la riga del 6/11 (Calamita +100%): **3 vittorie su 48** (prima 0), 4 morti prima del minuto 5 (prima 8), mediana della morte 11:09 (prima 9:54), livello finale medio 44 (uguale), Seth del 5 ucciso in 39 notti su 44 (prima 31 su 40). I due vincoli sono rispettati.

Al minuto 13, con l'arma iniziale al livello 8 e il personaggio fermo, il campo resta pieno a 250 anche nella calma, e i bruti arrivano a 185 su 250: sono i più resistenti, quindi si accumulano più di quanto dica il loro peso.

**Probabilità dei frammenti.** Obiettivo di Edoardo: all'alba, 89% di notti con il mosaico completo. Misurato con il bot immortale e le urne attive (`DL_EXTRA='&rompibili&immortale' node tools/sim.mjs 12`), 48 notti intere:

| Bot | Urne rotte a notte | Probabilità per l'89% |
| --- | --- | --- |
| che non le cerca | media 7,5, da 2 a 20 | irraggiungibile: anche al 100% resta al 92% solo se ne trova almeno 3, e al 94% servirebbe quasi ogni urna |
| che le cerca (`&cercaurne`) | media 20,6, da 10 a 31 | **26%** |

Scelto il 26%: chi va a cercare le urne completa il mosaico nell'89% delle notti; chi non le cerca, nel 29% circa.

### 6/11 — Raggio di raccolta da 150 a 40 px

Richiesta di Edoardo: senza potenziamenti il Lumen a terra si raccoglie passandoci sopra. `BASE.raccolta` passa da 150 a 40 (*da rivedere*). La Calamita resta in percentuale: al massimo arriva a 100 px invece di 375, quindi va ricalibrata con Edoardo.

Bot sul S25, Cappella vuota, 12 notti per personaggio (48): **0 vittorie su 48** (prima 2/48), 7 morti prima del minuto 5 (prima 5), mediana della morte 9:54 (prima 10:16), livello finale medio 43 (prima 55). Seth del 5 ucciso in 32 notti su 41 che ci sono arrivate. I due vincoli restano rispettati. 
Stessa condizione con la Calamita da +30% a +100% per livello (240 px al massimo, scelta di Edoardo): 0 vittorie su 48, 8 morti prima del minuto 5, mediana della morte 9:54, livello finale medio 44, Seth del 5 ucciso in 31 notti su 40.

### 5/11 — Campo vero con le fasce del telefono

Nessun numero di gioco cambia; cambia il campo: sul telefono in verticale `mezzaA` passa da 585 a 410, quindi comparsa, ricollocamento e armi «sullo schermo» finiscono al bordo delle fasce. Il bot ora gioca sempre con lo schermo del Galaxy S25 (`tools/sim.mjs`). Computer e tablet: tre notti con lo stesso seme identiche a prima.

Stessi semi, 12 notti per personaggio (48 per condizione), bot sul S25, 540×1170 prima e 540×820 dopo:

| Cappella | Prima | Dopo | Morti prima del minuto 5 (prima → dopo) | Seth del 5 ucciso (prima → dopo) | Mediana della morte (prima → dopo) | Livello finale medio (prima → dopo) |
| --- | --- | --- | --- | --- | --- | --- |
| vuota | 15/48 (31%) | 2/48 (4%) | 3 → 5 | 37/45 → 37/43 | 10:16 → 10:16 | 55 → 55 |
| a metà | 29/48 (60%) | 26/48 (54%) | 1 → 1 | 42/47 → 44/47 | 8:32 → 8:18 | 66 → 69 |
| completa | 26/48 (54%) | 20/48 (42%) | 0 → 0 | 44/48 → 44/48 | 9:09 → 8:55 | 68 → 67 |

**Da ora le simulazioni usano il campo del telefono (540×820): non sono confrontabili con le precedenti.** A Cappella vuota le vittorie passano da 15/48 a 2/48, fuori dal rumore. Il Becchino muore prima di Seth del minuto 5 in 3 notti su 12 (prima 0). Badessa e Strega a Cappella vuota muoiono intorno al minuto 10.

Regole vincolanti: **nessuno muore sempre prima del minuto 5**: rispettata. **Seth del minuto 5 primo vero ostacolo**: rispettata per il controllo della simulazione (il danno subito al minuto cresce quando arriva, per tutti in tutte le condizioni), ma da tenere d'occhio: a Cappella vuota muoiono prima di lui 2 notti su 12 del Lampionaio (erano 3) e 3 su 12 del Becchino (erano 0). A Cappella vuota Badessa e Strega non vincono più (da 5 e 3 a 0): muoiono intorno al minuto 10, con il secondo Seth. Un personaggio ha 12 notti, quindi queste sono indicazioni e non misure.

### 5/11 — Oltre i 15 i numeri bianchi non si creano (solo visivo)

Nessun valore cambia. Durata di un numero bianco al minuto 13: media 0,53 s, mediana 0,55 (346 numeri, altri 9271 non creati). Con il Chiodo di bara al massimo: media 0,03 s, perché gli ambra li sostituiscono quasi subito. Prova: `npm run sim -- 3 tutti` prima e dopo, stessi semi: 12 notti, 1251 valori confrontati, 0 differenze.

### 5/11 — Precedenza dei numeri e numero unico delle reazioni (solo visivo)

Tolto `EFFETTI.numeri.forte`; `coloreForte` diventa `coloreAmbra`. Nuovi `REAZIONI.etichetta.staccoNumero` 16 px e `sopra` 34 px, che era 24 scritto nel codice (*da rivedere*). Nessun numero di gioco cambia. Prova: `npm run sim -- 3 tutti` prima e dopo, stessi semi: 12 notti, 1251 valori confrontati, 0 differenze.

### 5/11 — Ambra in tre casi soltanto (solo visivo)

Tolto `EFFETTI.numeri.ambra`, proposto poche ore prima (vedi sotto): l'ambra ora dipende solo dal tipo di colpo. Nessun numero di gioco cambia. Prova: `npm run sim -- 3 tutti` prima e dopo, stessi semi: 12 notti, 1251 valori confrontati, 0 differenze.

### 5/11 — Ordine di disegno, precedenza dei simboli, numeri ambra (solo visivo)

`AVVISO.scala` da 0,6 a 0,5 (sui telefoni resta ×2: si vede uguale). Nuovo `EFFETTI.numeri.ambra` 1,5 (*da rivedere*); `numeri.forte` 40 ora decide solo la precedenza. Nessun numero di gioco cambia. Prova: `npm run sim -- 3 tutti` prima e dopo, stessi semi: 12 notti, 1251 valori confrontati, 0 differenze.

### 4/11 — Reazioni, simboli, numeri su élite e Seth, avvisi, orologio (solo visivo)

Nuovi o cambiati, tutti *da rivedere*: `REAZIONI.etichetta` (`ingrandimento` da 4 a 2, `pausa` da 0,3 a 2 s, `massimi` 3, `lontano` 90, `colori`), `STATI.simboli.massimi` da 200 a 40, `EFFETTI.numeri.somma` (`finestra` 0,5 s, `sopra` 30 px), `AVVISO` (`scala` 0,6, `minimo` 2, `durata` da 2,4 a 1,45 s, `dissolvenza` 0,3 s, `passi` 3, `margine` 6 px), `OROLOGIO.sopra` 40. Nessun numero di gioco cambia. Prova: `npm run sim -- 3 tutti` prima e dopo, stessi semi: 12 notti, 1251 valori confrontati, 0 differenze.

### 4/11 — Lampo dei nemici e numeri del danno (solo visivo)

`lampoNemico` da 0,1 a 0,033 s; nuovi `lampoNemicoPausa` 0,3 s, `lampoNemicoPesanti` 0,5 (in `COLPI`, `data/armi.ts`) e `numeri.massimo` 15 (`data/effetti.ts`), tutti *da rivedere*. Nessun numero di gioco cambia. Prova: `npm run sim -- 3 tutti` prima e dopo, stessi semi: 12 notti, 1251 valori confrontati, 0 differenze.

### 4/11 — Numeri spostati dalla logica ai dati (nessun valore cambiato)
- In `src/data/` ora ci sono: potenziamenti del reliquiario (`DROP.reliquiario`: 1 o 3, caso raro 25%), reliquiari dell'élite (`ELITE.reliquiari`), amuleti offerti con un'unione (`ROSARIO.proposteConUnione`), rimescolate del Cero della scelta (`per` e `ogniLivelli`). Si cambiano dal Laboratorio.
- Simulazione prima e dopo, stessi semi (`npm run sim -- 3 tutti`, più `meta=max` per provare anche Rosario e unioni): 24 partite su 24 identiche in ogni campo di `prove/sim.json`. Cappella vuota 3 vittorie su 12, completa 6 su 12; 12 partite per condizione sono solo un confronto, non una misura. Le rimescolate il bot non le usa: i valori ai livelli 1–5 restano 1, 1, 2, 2, 3.

### 4/11 — Unioni (tappa 6)
- Le unioni non aumentano i numeri dell'arma: danno solo l'effetto. ~~Sblocco: 10 minuti o 500 Cera~~ (**superato** il 6/11: 3 veglie vinte).
- Simulazione: vuota 10/48 (21%), a metà 25/48 (52%), completa 25/48 (52%). ~~Il bot arriva a un'unione possibile in 7 notti su 48 a Cappella completa (contando l'unione a fine notte).~~ Corretto il 4/11: a Cappella completa, su 48 notti, 31 finiscono con almeno un'arma unita (58 unioni fatte in tutto) e 7 con un'unione pronta ma non fatta (5 di queste senza nessuna arma unita); con una o con l'altra 36 notti su 48. Il vecchio «7» contava solo le unioni rimaste pronte. Le notti con un'arma unita sono 25 su 25 tra le vittorie e 6 su 23 tra le sconfitte: chi sopravvive più a lungo fa in tempo a unire, quindi questo non dice da solo quanto aiutano le unioni.

### 4/11 — Armi e doni nuovi (tappa 5)
- Le armi nuove, troppo deboli nella prima versione, sono state rinforzate dalle simulazioni (danno, ricarica o area). Corvo: sblocco a 30000 anime invece di 5000 (il bot ne fa circa 25000 a notte). Velo funebre: 3 minuti in tutto dentro le nubi, non «senza uscire» (più facile da contare, meno punitivo).
- I pesi delle carte contano armi e doni come se fossero sempre 6 e 9 (`CARTE.pool`): sbloccare oggetti aggiunge varietà senza togliere potenziamenti. Con tutti gli sblocchi insieme il bot era crollato da 21 a 5 vittorie su 48, perché l'arma principale saliva troppo piano.
- Simulazione (a metà Cappella 4 sblocchi su 7, completa tutti; il bot ha preferenze anche sulle armi): vuota 10/48 (21%), a metà 18/48 (37,5%), completa 23/48 (48%).

### 4/11 — Rosario con 3 amuleti offerti
- Il reliquiario offre 3 amuleti più il potenziamento (prima 2).
- Simulazione, Cappella a metà: 21/48 (44%) contro 16/48 con 2 amuleti. Per personaggio: Lampionaio 3, Becchino 4, Badessa 7, Strega 7 (con 2 amuleti erano 2, 6, 6, 2).

### 3/11 — Rosario (tappa 4)
- Il bot prende solo gli amuleti con rovescio lieve (Sangue freddo, Lucciola, Ceri gemelli, Ossa d'élite, Danza macabra) e non va mai in Peccato: Cappella a metà 16/48 (33%), come senza Rosario; prendendo anche gli altri scendeva a 12/48. Cappella completa 21/48 (44%).

### 3/11 — Meta di base e Cera a terra
- Cera: dopo la prova di Edoardo, gocce rare lasciate dai nemici (0,4%; 3 da un'élite, 10 da Seth) invece del conto a fine veglia, più 100 all'alba. Il bot porta a casa circa 150 Cera a notte con la Cappella vuota e 230–300 con la Cappella piena.
- Simulazione (12 notti per personaggio): vuota 9/96; a metà (livello 3 di ogni cero) 20/48 (42%); completa 24/48 (50%).
- HUD ×2 sui telefoni dove un pixel di gioco è sotto 1 punto (prima 0,6): non tocca i numeri di gioco.

### 3/11 — Tappa 3: affinità, stati, reazioni
- Stati di 3 s nel 10% dei colpi (5% per nubi, pozze e abilità). Con lo stato a ogni colpo le reazioni erano 19.000–32.000 a notte e il bot vinceva 85 notti su 96; ora 300–1000 reazioni a notte.
- Per compensare la forza di stati e reazioni: danno dei nemici +16% al minuto (prima +9%), salute 0,06 × (m − 3)², Seth del minuto 10 ×3,5 (prima ×1,7), Becchino −10% danno subito, Strega +10% danno (prima +20%).
- Ruoli nuovi: esplosione del Bastone, Fuoco fatuo che insegue per primi élite e Seth (danni invariati), Falce che cresce, Lama di luce che segue la direzione, Campana che ferma.
- La Rivelazione vale una volta per nemico: su Seth raddoppiava le anime all'infinito e bloccava la partita.
- Simulazione (24 notti per personaggio): 9 vittorie su 96.

### 3/11 — Tappa 2: Fiaschetta e Grazia
- Fiaschetta: 3 sorsi da 35% in 1 s; un sorso per élite, piena con Seth. Grazia: 3 s di +30% danno e +15% velocità.
- Il bot beve 4–5,4 sorsi a notte e fa 1,5–3,3 schivate perfette. Simulazione: 12 vittorie su 96 con l'obiettivo del 15%.

### 3/11 — Obiettivo ≤15% con la Cappella vuota
- Acqua santa +10% invece di +30% (da 7, 7, 10, 10, 10, 14, 14, 19 a 8, 8, 11, 11, 11, 15, 15, 21: con +30% era presente in tutte le notti vinte dal bot), Pala con i raggi originali, Becchino −15% danno subito e +5% danno, Strega −5 salute e +20% danno, Seth del minuto 10 con salute ×2.
- Risultato su 24 notti per personaggio: 12 vittorie su 96 (Lampionaio e Becchino 4, Badessa 3, Strega 1). L'Acqua santa era in tutte le notti vinte.

### 3/11 — Tappa 1: ritocchi agli oggetti
- Nubi e pozze non si sommano sullo stesso nemico: Turibolo +40% di danno, Acqua santa +30% (poi +10%). Specchio a un livello. Armatura in percentuale: Scudo di ferro −6% per livello, al massimo 60% in tutto. Calamita +5% anime per livello. Campana +20%.
- Danni delle armi a zona, per compensare le zone non cumulative: Turibolo +40% (da 6, 8, 8, 8, 11, 11, 11, 15 a 8, 11, 11, 11, 15, 15, 15, 21); Campana +20% (da 16, 22, 22, 22, 30, 30, 30, 42 a 19, 26, 26, 26, 36, 36, 36, 50).
- Motivo: il Turibolo arrivava a 550 danni al secondo su Seth e la Badessa lo uccideva in 26 s (ora circa 54 s); l'armatura fissa era fortissima all'inizio e inutile dopo.
- Correzioni per Becchino (−25% danno subito invece di +1 armatura, −3% velocità invece di −8%, Pala con raggio più ampio ai livelli 1–5, poi −15% e −10%), Lampionaio (+0,2 salute al secondo), Seth (3600 di salute, falciata 22), salute dei nemici 0,03 × (m − 3)² (poi 0,06), bruti che entrano in 2 minuti invece che tutti alle 6:00. Il Becchino moriva quasi sempre verso il minuto 3 e al minuto 6 morivano tutti.
- Risultato: 5 vittorie su 32, poche di proposito (arriverà la meta progressione).

### 3/11 — Secondo ritocco M8 (partita di Edoardo: Badessa, livello 60 al minuto 8, «non è una sfida»)
- Pane al massimo ogni 45 s (cura 40 invece di 30), calamita al massimo ogni 3 minuti; Benedizione cura 5/s invece di 9; salute dei nemici 1 + 0,28 m + 0,04 (m − 3)² dopo il minuto 3.
- Motivo: dal minuto 5 si uccidono circa 2000 nemici al minuto e cadevano 18 pani e 5 calamite al minuto; ora il bot ne raccoglie 0,2–0,4 pani al minuto e una calamita ogni 4–6 minuti.
- Obiettivo di allora: il bot vince al massimo il 40% (superato dagli obiettivi per Cappella). Il bot vinceva 3 notti su 24.

### 2/11 — Primo ritocco M8 (richiesta di Edoardo)
- Esperienza 2 + 3 L + L² (prima ⌊4 + 3,2 L + 2 × max(0, L − 12)^1,8⌋); salute dei nemici +28% al minuto invece di +34%; Seth 5500 di salute invece di 3200 (poi 3600 con le mosse nuove); Lanterna +25% (da 14, 19, 25, 35 a 18, 24, 32, 44), perché con la curva dell'esperienza più lenta il Lampionaio non vinceva mai.
- Motivo: il bot arrivava al livello 100 e tre personaggi su quattro vincevano senza sforzo. Livello medio con il bot dopo il ritocco: circa 7 al primo minuto, 28 al quinto, 60–70 al decimo, 70–90 all'alba (prima 13, 45, 77, 100).
- Il bot schiva lo scatto di Seth e gira intorno ai nemici con Lanterna e Pala: senza, il Lampionaio sembrava debolissimo per colpa del bot.
