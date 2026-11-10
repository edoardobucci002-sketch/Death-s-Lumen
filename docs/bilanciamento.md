# Bilanciamento

Registro dei ritocchi ai numeri e delle simulazioni con il bot. I numeri **attuali** sono nel codice (`src/data/`) e nel [GDD](GDD.md); qui c'è la loro storia: cosa è stato cambiato, perché e con che risultato. La riga più recente è in alto.

Il bot gioca dentro il gioco vero (`npm run sim`, vedi [LEGGIMI.md](../LEGGIMI.md)); un giocatore umano va più forte di lui (Edoardo al minuto 8 era al livello 60, il bot al 40). Il bilanciamento a occhio non funziona, le simulazioni sì.

## Obiettivi (provvisori, non vincolanti)

Decisione di Edoardo (4/11): gli obiettivi della tabella sono **provvisori**. Non si ritocca nessun contenuto per inseguirli finché i contenuti del gioco non sono completi; il bilanciamento vero si fa alla fine, con tutti i contenuti. Le simulazioni servono intanto a vedere dove siamo.

| Cappella (`meta=`) | Cosa simula il bot | Vittorie del bot |
| --- | --- | --- |
| vuota (`0`) | nessun cero | 5–15% |
| a metà (`meta`) | livello 3 di ogni cero | 30–45% |
| completa (`max`) | tutti i ceri al massimo e la Seconda candela | 60–75% |
| completa + 3 patti | come «completa», con 3 Patti attivi (quando i Patti esisteranno) | 10–25% |

Quante notti servono per completare la Cappella è una domanda aperta: si decide con il bilanciamento finale, a contenuti completi.

**Il campione.** Con 48 notti per condizione l'incertezza è di circa ±12 punti: differenze più piccole sono rumore. Per il bilanciamento finale servono almeno 200 notti per condizione (circa 50 per personaggio).

**Restano vincolanti, in tutte le condizioni, solo due cose:** Seth del minuto 5 è il primo vero ostacolo; nessuno muore sempre prima del minuto 5, nemmeno con la Cappella vuota.

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
