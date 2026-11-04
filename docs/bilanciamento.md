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

### 4/11 — Unioni (tappa 6)
- Le unioni non aumentano i numeri dell'arma: danno solo l'effetto. Sblocco: 10 minuti o 500 Cera (*da rivedere*).
- Simulazione: vuota 10/48 (21%), a metà 25/48 (52%), completa 25/48 (52%). Il bot arriva a un'unione possibile in 7 notti su 48 a Cappella completa (contando l'unione a fine notte).

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
