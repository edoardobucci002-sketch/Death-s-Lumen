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

### 5/11 — Rompibili, seconda prova e luce

Dopo la partita di Edoardo su telefono. Stesso numero di oggetti, percentuali chiare: 24% urna, 24% giara, 12% lanterna, 40% niente. Urna e lanterna non danno più Cera. Olio 12 s, fuoco 5 s, rallentamento 40%, 14 danni ogni 0,4 s, 3 frammenti per un reliquiario: proposte da rivedere. Buio: sfumatura da 0,9 a 1,5, massimo da 78% a 88%, raggio entro il 36% del lato corto del campo (sul telefono circa 195-210 px invece di 260), alone caldo nuovo. Il raggio di gioco della Lucciola non cambia. Il bot non ha rompibili: reliquiari in più e danni del fuoco non sono misurati.

### 5/11 — Oggetti rompibili (prova, valori da rivedere)

Nuovi: 60% dei settori da 700 px con un oggetto; urna 1 goccia, giara 2, lanterna 1; pesi 4/4/2. La Cera dei nemici non cambia, quindi una notte ne dà un po' di più. Il bot gioca senza rompibili: la simulazione non cambia e non misura questa Cera in più.

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
- Le unioni non aumentano i numeri dell'arma: danno solo l'effetto. Sblocco: 10 minuti o 500 Cera (*da rivedere*).
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
