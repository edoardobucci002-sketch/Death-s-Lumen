# Death's Lumen — GDD

Il gioco **com'è oggi**: contenuti, regole e numeri attuali, gli stessi di `src/data/` (il codice è la fonte di verità). Qui non c'è la storia dei numeri: i ritocchi e le simulazioni sono in [bilanciamento.md](bilanciamento.md), le scelte con data in [decisioni.md](decisioni.md), cosa resta da fare in [roadmap.md](roadmap.md), gli asset da disegnare in [asset_da_creare.md](asset_da_creare.md). Il punto di partenza era la v0 («Lumen dei Morti», ottobre 2026). Le voci segnate *da rivedere* sono valori proposti da Claude e non ancora confermati da Edoardo.

Unità: le distanze sono in pixel di gioco, le velocità in pixel al secondo, i tempi in secondi.

**Scala del mondo.** Gli sprite in gioco di Edoardo (V5) sono alti circa 80 px (nella v0 erano 34): ogni distanza e velocità della v0 è stata moltiplicata per 2,35. I valori di questo documento sono già convertiti.

## 1. Il gioco in breve

- **Genere**: survivor-like. Ti muovi, l'arma colpisce da sola, raccogli anime, a ogni livello scegli un dono tra tre.
- **Obiettivo**: sopravvivere 15 minuti, fino all'alba. Si perde quando la salute arriva a zero.
- **Ambientazione**: un cimitero durante una veglia (vedi [lore.md](lore.md)), illuminato dalla lanterna del personaggio. Fuori dall'alone di luce è buio.
- **Tono**: gotico malinconico, non splatter. I testi sono brevi, con frasi da epitaffio.
- **Lingua**: italiano.

### Cronologia di una partita

| Momento | Evento |
| --- | --- |
| 0:00 | Pipistrelli e zombi; abilità speciale pronta dopo 4 s |
| 0:50 | Iniziano i fantasmi |
| 0:55, poi ogni 55 s | Un nemico élite, che lascia un reliquiario |
| inizio di ogni minuto (tranne il 5° e il 10°, fino al 14°) | Sciame che ti circonda: pipistrelli fino al 6° minuto, fantasmi dal 7° |
| 2:20 | Iniziano gli scheletri (ti accerchiano) |
| 2:30, poi ogni 80 s fino a 14:20 | Un'orda in formazione marcia verso di te e poi carica; dalle 7:00 due orde da lati opposti |
| 3:50 | Iniziano i segugi (ti tagliano la strada) |
| 5:00 | Prima apparizione di Seth |
| 6:00 | Iniziano i bruti |
| 10:00 | Seconda apparizione di Seth, molto più resistente |
| 15:00 | L'alba: vittoria |

## 1b. Mondo e lore

Il mondo, i personaggi e la trama sono in [lore.md](lore.md). In gioco il boss dei minuti 5 e 10 è **Seth, il Rinnovato** («Rinnovato» compare dal primo Seth come primo indizio); nel codice e nei numeri si chiama ancora `mietitore`.

## 2. Personaggi

Personaggi giocabili oggi: quattro. Previsti: la Veggente e la Sguattera (vedi [roadmap.md](roadmap.md)).

Valori di base comuni: 100 salute, velocità 245, raccolta delle anime a 150 px, armatura 0.

| Personaggio | Motto | Colore | Arma iniziale | Abilità speciale | Modificatori |
| --- | --- | --- | --- | --- | --- |
| Il Lampionaio | Guida nel buio | `#e3913a` | Lanterna | Cerchio di luce | +10% velocità, +0,2 salute/s |
| Il Becchino | Nulla resta davvero sotto terra | `#b89a74` | Pala | Sepoltura | +30 salute, −10% danno subito, +5% danno, −3% velocità |
| La Badessa | Preghiere per ciò che è stato | `#dcc07a` | Turibolo | Benedizione | +10 salute, +0,3 salute/s, +15% area |
| La Strega | Conosce nomi che non dovrebbero essere detti | `#a57ae0` | Bastone | Rito proibito | −5 salute, +10% danno, −10% ricarica |

**Barre della scheda** (su 6: Vitalità, Danno, Velocità, Raggio, Controllo)

| Personaggio | Vit. | Dan. | Vel. | Rag. | Con. |
| --- | --- | --- | --- | --- | --- |
| Il Lampionaio | 3 | 3 | 4 | 3 | 4 |
| Il Becchino | 5 | 5 | 2 | 2 | 3 |
| La Badessa | 4 | 2 | 3 | 5 | 3 |
| La Strega | 2 | 4 | 3 | 4 | 5 |

**Testi della scheda**

- **Il Lampionaio**: «Un viandante che continua a camminare anche quando tutto il resto si è fermato. Accende la luce per sé e per chi non può più trovarla.» Citazione: *«Finché c'è una luce accesa, qualcuno può ancora tornare.»*
- **Il Becchino**: «Si prende cura di ciò che gli altri abbandonano. Scava per mestiere, ma anche per ricordare. Conosce bene il peso della terra.» Citazione: *«Tutti finiscono qui. Io arrivo solo prima.»*
- **La Badessa**: «Custodisce ciò che ancora merita di essere salvato. Prega per i vivi, ma soprattutto per i dimenticati. La sua fede non consola: protegge.» Citazione: *«Non tutto può essere salvato, ma nulla è davvero perduto.»*
- **La Strega**: «Ascolta ciò che gli altri temono. Parla con le ombre, raccoglie ciò che la terra rifiuta. Le sue magie non guariscono: trasformano.» Citazione: *«Ci sono cose che il mondo ha dimenticato. Io, no.»*

## 3. Abilità speciali

Si attivano con Spazio o con il pulsante a schermo. Danno, area e ricarica seguono i doni passivi. Valori in `src/data/abilita.ts`.

| Abilità | Ricarica | Durata | Raggio | Danno | Effetto |
| --- | --- | --- | --- | --- | --- |
| Cerchio di luce | 14 s | 5 s | 216 | 6 ogni 0,25 s | ti segue; rallenta del 55% |
| Sepoltura | 16 s | 4,5 s | 247 | 11 ogni 0,3 s | fissa; mani dalla terra; rallenta dell'80% |
| Benedizione | 18 s | 6 s | 207 | 8 ogni 0,3 s | fissa; croce dorata; cura 5 salute/s se ci stai dentro |
| Rito proibito | 16 s | 5 s | 259 | 10 ogni 0,3 s | fissa; sigillo con candele; attira i nemici a 153 px/s |

Seth subisce il rallentamento a metà e l'attrazione a un quarto; bruti ed élite l'attrazione a metà.

## 4. Armi

Al massimo 6 armi, ognuna fino al livello 8. Le quattro armi iniziali sono **esclusive** del loro personaggio e non compaiono mai tra i doni degli altri. Le dieci armi comuni (le sei originali e le quattro nuove) si trovano tra i doni di livello; le nuove solo dopo averle sbloccate. I valori sono quelli di base, prima dei doni passivi.

### Armi iniziali

#### Lanterna

Arco centrato sulla direzione in cui cammini, misurato dal personaggio; respinge di 259 (110 × 2,35). Raggi già × 2,35. Arma iniziale del Lampionaio, esclusiva.

| Lv | Ricarica (s) | Danno | Raggio | Ampiezza arco (°) | Colpo alle spalle | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 0,8 | 18 | 136 | 132 | no | Colpo corto, ampia gittata frontale. |
| 2 | 0,8 | 24 | 136 | 132 | no | +6 danno. |
| 3 | 0,8 | 24 | 160 | 132 | no | Raggio maggiore. |
| 4 | 0,68 | 24 | 160 | 132 | no | Colpi più frequenti. |
| 5 | 0,68 | 32 | 160 | 132 | no | +8 danno. |
| 6 | 0,68 | 32 | 183 | 166 | no | Raggio e ampiezza maggiori. |
| 7 | 0,56 | 32 | 183 | 166 | no | Colpi più frequenti. |
| 8 | 0,56 | 44 | 183 | 166 | sì | +12 danno, colpisce anche alle spalle. |

#### Pala

Impatto circolare 61 px davanti a te (26 × 2,35), nella direzione di cammino; respinge di 423 (180 × 2,35). Raggi già × 2,35. A Lv 8 un secondo colpo alle spalle 0,22 s dopo. Arma iniziale del Becchino, esclusiva.

| Lv | Ricarica (s) | Danno | Raggio | Distanza colpo | Colpo doppio | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 1,35 | 34 | 70 | 61 | no | Colpo potente a corta gittata. |
| 2 | 1,35 | 44 | 70 | 61 | no | +10 danno. |
| 3 | 1,35 | 44 | 87 | 61 | no | Area d'impatto maggiore. |
| 4 | 1,15 | 44 | 87 | 61 | no | Colpi più frequenti. |
| 5 | 1,15 | 56 | 87 | 61 | no | +12 danno. |
| 6 | 1,15 | 56 | 103 | 61 | no | Area d'impatto maggiore. |
| 7 | 0,95 | 56 | 103 | 61 | no | Colpi più frequenti. |
| 8 | 0,95 | 76 | 103 | 61 | sì | +20 danno, colpo doppio. |


#### Turibolo

La prima nube nasce 47 px davanti a te, le altre a caso fino a 94 px (× 2,35); ogni nube ferisce ogni 0,3 s e rallenta del 30%. Le nubi non si sommano: un nemico dentro più nubi è ferito da una sola. Specchio aggiunge una nube. Arma iniziale della Badessa, esclusiva.

| Lv | Ricarica (s) | Quantità | Danno | Raggio | Durata (s) | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 1,25 | 1 | 8 | 70 | 2,4 | Emette fumo sacro a corta gittata. |
| 2 | 1,25 | 1 | 11 | 70 | 2,4 | +3 danno. |
| 3 | 1,25 | 2 | 11 | 85 | 2,4 | +1 nube, nubi più ampie. |
| 4 | 1,05 | 2 | 11 | 85 | 2,4 | Più frequente. |
| 5 | 1,05 | 2 | 15 | 85 | 3,1 | +4 danno, fumo più duraturo. |
| 6 | 1,05 | 3 | 15 | 99 | 3,1 | +1 nube, nubi più ampie. |
| 7 | 0,85 | 3 | 15 | 99 | 3,1 | Più frequente. |
| 8 | 0,85 | 3 | 21 | 99 | 3,1 | +6 danno. |


#### Bastone

Mira al nemico più vicino entro 611 px (× 2,35); proiettili a 541 px/s, raggio 9 px; i proiettili partono a 0,08 s l'uno dall'altro e svaniscono dopo 1,3 s. Specchio aggiunge un proiettile. Arma iniziale della Strega, esclusiva.

| Lv | Ricarica (s) | Quantità | Danno | Trapassa | Velocità proiettile | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 0,85 | 1 | 15 | 1 | 541 | Colpo a media gittata, proiettili magici. |
| 2 | 0,85 | 2 | 15 | 1 | 541 | +1 proiettile. |
| 3 | 0,85 | 2 | 20 | 1 | 541 | +5 danno. |
| 4 | 0,72 | 2 | 20 | 1 | 541 | Più frequente. |
| 5 | 0,72 | 3 | 20 | 1 | 541 | +1 proiettile. |
| 6 | 0,72 | 3 | 27 | 2 | 541 | +7 danno, trapassano. |
| 7 | 0,59 | 3 | 27 | 2 | 541 | Più frequente. |
| 8 | 0,59 | 4 | 35 | 2 | 541 | +1 proiettile, +8 danno. |

### Armi comuni

#### Candela

Bersaglia i nemici più vicini entro 700 px (circa lo schermo), uno diverso per fiammella; le fiammelle durano 1,4 s, raggio 9 px. Velocità già × 2,35. Specchio aggiunge una fiammella.

| Lv | Ricarica (s) | Danno | Quantità | Trapassa | Velocità proiettile | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 0,95 | 12 | 1 | 1 | 705 | Lancia fiammelle verso il nemico più vicino. |
| 2 | 0,95 | 12 | 2 | 1 | 705 | +1 fiammella. |
| 3 | 0,95 | 17 | 2 | 1 | 705 | +5 danno. |
| 4 | 0,95 | 17 | 3 | 1 | 705 | +1 fiammella. |
| 5 | 0,95 | 17 | 3 | 2 | 705 | Le fiammelle trapassano un nemico in più. |
| 6 | 0,95 | 22 | 4 | 2 | 705 | +5 danno e +1 fiammella. |
| 7 | 0,75 | 22 | 4 | 2 | 705 | Ricarica più rapida. |
| 8 | 0,75 | 32 | 5 | 3 | 705 | +1 fiammella, +10 danno, trapassano di più. |

#### Falce

Sempre attiva: lo stesso nemico può essere colpito da una falce ogni 0,45 s; respinge di 165 (70 × 2,35); la lama tocca entro 24 px. Raggi già × 2,35. Specchio aggiunge una falce.

| Lv | Quantità | Danno | Raggio | Rotazione (giri/s) | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1 | 12 | 132 | 0,45 | Una falce spettrale ti ruota intorno. |
| 2 | 2 | 12 | 132 | 0,45 | +1 falce. |
| 3 | 2 | 15 | 132 | 0,45 | +3 danno. |
| 4 | 3 | 15 | 132 | 0,45 | +1 falce. |
| 5 | 3 | 19 | 160 | 0,45 | Raggio più ampio e +4 danno. |
| 6 | 4 | 19 | 160 | 0,45 | +1 falce. |
| 7 | 4 | 25 | 160 | 0,59 | Rotazione più veloce e +6 danno. |
| 8 | 5 | 25 | 160 | 0,59 | +1 falce. |

#### Campana

Colpisce tutto entro il raggio e respinge di 470 (200 × 2,35); raggi già × 2,35; a Lv 8 il secondo rintocco arriva 0,35 s dopo.

| Lv | Ricarica (s) | Danno | Raggio | Colpo doppio | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 2,6 | 19 | 197 | no | Rintocchi che respingono e feriscono tutto intorno. |
| 2 | 2,6 | 26 | 197 | no | +7 danno. |
| 3 | 2,6 | 26 | 240 | no | Raggio più ampio. |
| 4 | 2,2 | 26 | 240 | no | Rintocchi più frequenti. |
| 5 | 2,2 | 36 | 240 | no | +10 danno. |
| 6 | 2,2 | 36 | 282 | no | Raggio più ampio. |
| 7 | 1,8 | 36 | 282 | no | Rintocchi più frequenti. |
| 8 | 1,8 | 50 | 282 | sì | +14 danno e doppio rintocco. |


#### Fuoco fatuo

Partono a raggiera e girano (fino a 6 radianti al secondo) verso il nemico più vicino a loro, entro 752 px, a 470 px/s; durano 3,2 s. Inseguono per primi élite e Seth. Specchio aggiunge un fuoco.

| Lv | Ricarica (s) | Quantità | Danno | Trapassa | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1,3 | 1 | 12 | 1 | Fuochi fatui che inseguono i nemici, prima élite e capi. |
| 2 | 1,3 | 2 | 12 | 1 | +1 fuoco. |
| 3 | 1,3 | 2 | 18 | 1 | +6 danno. |
| 4 | 1,3 | 3 | 18 | 1 | +1 fuoco. |
| 5 | 1 | 3 | 18 | 1 | Ricarica più rapida. |
| 6 | 1 | 3 | 26 | 1 | +8 danno. |
| 7 | 1 | 4 | 26 | 1 | +1 fuoco. |
| 8 | 1 | 4 | 36 | 3 | +10 danno, trapassano tre nemici. |


#### Acqua santa

Ogni fiala cade su un nemico visibile scelto a caso; la pozza ferisce ogni 0,3 s. Le pozze non si sommano: un nemico dentro più pozze è ferito da una sola. Specchio aggiunge una fiala.

| Lv | Ricarica (s) | Quantità | Danno | Raggio | Durata (s) | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 2,8 | 1 | 8 | 89 | 2,6 | Fiale che lasciano pozze benedette sui nemici. |
| 2 | 2,8 | 2 | 8 | 89 | 2,6 | +1 fiala. |
| 3 | 2,8 | 2 | 11 | 108 | 2,6 | Pozze più grandi e dannose. |
| 4 | 2,8 | 3 | 11 | 108 | 2,6 | +1 fiala. |
| 5 | 2,3 | 3 | 11 | 108 | 3,2 | Ricarica più rapida, pozze più durature. |
| 6 | 2,3 | 3 | 15 | 129 | 3,2 | Pozze più grandi e dannose. |
| 7 | 2,3 | 4 | 15 | 129 | 3,2 | +1 fiala. |
| 8 | 2,3 | 4 | 21 | 129 | 4,2 | Durata e danno maggiori. |

#### Lama di luce

Fendente orizzontale alto 103 px verso il lato in cui guardi; il colpo alle spalle parte 0,12 s dopo; respinge di 259. Misure già × 2,35.

| Lv | Ricarica (s) | Danno | Lunghezza | Colpo alle spalle | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1,15 | 18 | 259 | no | Un fendente di luce davanti a te. |
| 2 | 1,15 | 18 | 259 | sì | Colpisce anche alle spalle. |
| 3 | 1,15 | 24 | 259 | sì | +6 danno. |
| 4 | 1 | 24 | 259 | sì | Ricarica più rapida. |
| 5 | 1 | 32 | 259 | sì | +8 danno. |
| 6 | 1 | 32 | 329 | sì | Fendente più lungo. |
| 7 | 0,85 | 32 | 329 | sì | Ricarica più rapida. |
| 8 | 0,85 | 44 | 329 | sì | +12 danno. |

### Armi nuove

Si trovano tra le armi comuni, ma solo dopo averle sbloccate (sezione 8d). I numeri sono in `src/data/armi.ts`.

| Arma | Affinità | Cosa fa | Livello 1 | Livello 8 |
| --- | --- | --- | --- | --- |
| Lapide | Terra | cade sul nemico con più salute in vista; chi è sotto resta sempre Sepolto | 120 danni, ogni 3,2 s, raggio 84 | 260 danni, 2 lapidi, ogni 2,4 s, raggio 110 |
| Rosario spezzato | Ombra | un grano rimbalza tra i nemici vicini (entro 190 px); 35% di maledire a ogni rimbalzo | 18 danni, 4 rimbalzi, ogni 1,6 s | 40 danni, 8 rimbalzi, 2 grani, ogni 1,2 s |
| Corvo | Luce | vola intorno, becca il nemico più vicino (entro 330 px) e fa tornare le anime ferme più lontane | 26 danni, 1 corvo, ogni 1 s, 1 anima | 44 danni, 3 corvi, ogni 0,75 s, 4 anime |
| Velo funebre | Sacro | aura intorno al personaggio; 20% di consacrare a ogni colpo | 7 danni, raggio 110, ogni 0,5 s | 21 danni, raggio 160, ogni 0,4 s |

#### Lapide

Cade sul nemico con più salute in vista: scende da 180 px in 0,2 s, colpisce e resta a terra 0,5 s. Chi è sotto resta sempre Sepolto.

| Lv | Ricarica (s) | Danno | Raggio | Quantità | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 3,2 | 120 | 84 | 1 | Cade sul nemico con più salute in vista e lo seppellisce. |
| 2 | 3,2 | 150 | 84 | 1 | +30 danno. |
| 3 | 3,2 | 150 | 96 | 1 | Impatto più largo. |
| 4 | 2,8 | 150 | 96 | 1 | Cade più spesso. |
| 5 | 2,8 | 190 | 96 | 1 | +40 danno. |
| 6 | 2,8 | 190 | 96 | 2 | +1 lapide. |
| 7 | 2,4 | 190 | 110 | 2 | Cade più spesso, impatto più largo. |
| 8 | 2,4 | 260 | 110 | 2 | +70 danno. |

#### Rosario spezzato

Cerca il primo bersaglio entro 420 px, poi rimbalza sui nemici entro 190 px, un rimbalzo ogni 0,09 s.

| Lv | Ricarica (s) | Danno | Rimbalzi | Quantità | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1,6 | 18 | 4 | 1 | Un grano rimbalza tra i nemici vicini e li maledice. |
| 2 | 1,6 | 23 | 4 | 1 | +5 danno. |
| 3 | 1,6 | 23 | 5 | 1 | +1 rimbalzo. |
| 4 | 1,4 | 23 | 5 | 1 | Ricarica più rapida. |
| 5 | 1,4 | 30 | 5 | 1 | +7 danno. |
| 6 | 1,4 | 30 | 6 | 2 | +1 grano, +1 rimbalzo. |
| 7 | 1,2 | 30 | 6 | 2 | Ricarica più rapida. |
| 8 | 1,2 | 40 | 8 | 2 | +10 danno, +2 rimbalzi. |

#### Corvo

Vola intorno a te a 90 px, a 0,35 giri al secondo; becca il nemico più vicino entro 330 px, volando a 1100 px/s.

| Lv | Ricarica (s) | Danno | Quantità | Anime riportate | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1 | 26 | 1 | 1 | Becca il nemico più vicino e ti riporta le anime lontane. |
| 2 | 1 | 33 | 1 | 1 | +7 danno. |
| 3 | 1 | 33 | 1 | 2 | Riporta più anime. |
| 4 | 0,9 | 33 | 1 | 2 | Becca più spesso. |
| 5 | 0,9 | 33 | 2 | 2 | +1 corvo. |
| 6 | 0,9 | 44 | 2 | 3 | +11 danno, riporta più anime. |
| 7 | 0,75 | 44 | 2 | 3 | Becca più spesso. |
| 8 | 0,75 | 44 | 3 | 4 | +1 corvo, riporta più anime. |

#### Velo funebre

Aura intorno al personaggio: la ricarica dice ogni quanto ferisce chi è dentro.

| Lv | Ricarica (s) | Danno | Raggio | Cosa cambia |
|---|---|---|---|---|
| 1 | 0,5 | 7 | 110 | Un'aura intorno a te consacra chi entra. |
| 2 | 0,5 | 9 | 110 | +2 danno. |
| 3 | 0,5 | 9 | 125 | Aura più grande. |
| 4 | 0,5 | 12 | 125 | +2 danno. |
| 5 | 0,5 | 12 | 140 | Aura più grande. |
| 6 | 0,4 | 12 | 140 | Colpisce più spesso. |
| 7 | 0,4 | 16 | 140 | +4 danno. |
| 8 | 0,4 | 21 | 160 | +5 danno, aura più grande. |

## 5. Doni passivi

Al massimo 6 doni passivi diversi.

| Dono | Effetto per livello | Livello max |
| --- | --- | --- |
| Cuore di cera | +20 salute massima | 5 |
| Sale nero | +10% danno | 5 |
| Clessidra | −7% ricarica, si moltiplica (minimo 40% della ricarica base) | 5 |
| Stoppino lungo | +10% area (raggi, archi, nubi, pozze, abilità, alone di luce; nel gioco nuovo anche il bonus area del personaggio allarga l'alone) | 5 |
| Ali di falena | +8% velocità | 5 |
| Calamita | +30% raggio di raccolta e +5% anime | 5 |
| Erbe amare | +0,25 salute al secondo | 5 |
| Scudo di ferro | −6% danno subito | 4 |
| Specchio | +1 proiettile, nube, fiala, fuoco o falce | 1 |
| Cera votiva | +15% durata di zone e stati | 5 |
| Chiodo di bara | +6% probabilità di colpo critico (danno doppio) | 5 |
| Lacrima di lumen | +1 sorso della fiaschetta (si riempie anche quel sorso) | 2 |
| Campanella d'argento | +0,1 s di finestra per la schivata perfetta | 2 |

Gli oggetti nuovi non diluiscono i potenziamenti: il peso delle armi e dei doni non ancora presi si divide come se fossero sempre 6 e 9 (`CARTE.pool`, `src/data/progressione.ts`).

## 6. Nemici

Valori al minuto 0, in `src/data/nemici.ts`; la velocità varia a caso del ±10%.

| Nemico | Salute | Velocità | Danno | Raggio | Anime | Compare da | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pipistrello | 6 | 179 | 5 | 16 | 1 | 0:00 | comune all'inizio, sciami; vola a zig-zag |
| Zombi | 16 | 87 | 8 | 21 | 2 | 0:00 | lento |
| Fantasma | 13 | 129 | 7 | 21 | 2 | 0:50 | attraversa gli altri nemici |
| Scheletro | 34 | 106 | 10 | 21 | 3 | 2:20 | resistente; ti accerchia |
| Segugio | 28 | 200 | 9 | 21 | 3 | 3:50 | il più veloce; ti taglia la strada |
| Bruto | 150 | 78 | 18 | 38 | 8 | 6:00 | pesante: respinta e attrazione ridotte |
| Seth, il Rinnovato (`mietitore`) | 3600 | 118 | 22 | 61 | 60 | 5:00 e 10:00 | boss; attraversa gli altri nemici |

- **Élite**: ogni 55 s compare un nemico normale potenziato: salute ×7, danno ×1,4, anime ×6, dimensione ×1,5, velocità ×0,9, alone ambra. Lascia un reliquiario.
- **Seth**: cammina verso di te per 3–5 s (al minuto 10 per ×0,75 di quel tempo), poi si ferma pulsando di rosso e fa una mossa, scelta a caso con questi pesi. Ogni mossa ha un preavviso, il momento per scansarsi. Il danno delle mosse cresce con il tempo come il suo (× danno attuale ÷ 22). Dopo falciata, falci e chiamata resta fermo 0,45 s. Lascia 2 reliquiari. Al minuto 10 ha salute ×3,5 rispetto a quella del minuto 5, già scalata con il tempo.

| Mossa | Peso | Preavviso | Cosa fa |
| --- | --- | --- | --- |
| Scatto | 3 | 0,7 s | scatta per 0,55 s a 3,6 volte la sua velocità, verso dove ti trovavi |
| Falciata | 3 | 0,95 s | un cerchio rosso di raggio 200 si accende intorno a lui; allo scadere ferisce di 22 chi è dentro |
| Falci spettrali | 2 | 0,6 s | lancia 5 falci rosse a ventaglio (0,9 radianti) verso di te: 330 px/s, raggio 18, danno 16, durano 3,2 s |
| Chiamata dei morti | 1,5 | 1,1 s | 8 segni rossi a terra in cerchio a 190 px da te; allo scadere ne escono 8 scheletri |

- **Come si muovono** (`IA` in `src/data/nemici.ts`):
  - *dritto*: zombi, fantasmi, bruti;
  - *accerchia* (scheletri): punta a un punto girato di lato intorno a te di 0,6–1,2 radianti e al 60% della distanza, così arriva dai fianchi; sotto i 120 px viene dritto;
  - *taglia la strada* (segugi): punta dove sarai, guardando dove cammini, fino a 1,1 s in anticipo;
  - *zig-zag* (pipistrelli): ondeggia di lato (ampiezza 0,7, 5 oscillazioni al secondo, ognuno con il suo ritmo).
- **Orde**: dalle 2:30, ogni 80 s fino alle 14:20, un'orda di 12 + 2 nemici per minuto (al massimo 28) nasce in formazione appena fuori dallo schermo: file di 7, distanziate di 2,4 raggi. Marcia compatta verso di te a 80 px/s; a 260 px carica tutta insieme a velocità ×1,35. Zombi fino alle 5:00, poi scheletri, dalle 10:00 segugi. Dalle 7:00 arrivano due orde da lati opposti (tenaglia). Avvisi: «Un'orda» (marcia verso di te), «Due orde» (ti stringono).
- **Sciami**: 14 + 3 nemici per minuto, fino a 56, a +12% di velocità. Nascono in cerchio (un'ellisse grande quanto lo schermo, 48 px fuori dal bordo).
- **Élite**: l'alone ambra è un colore aggiunto allo sprite; ingrandite × 1,5 anche nel raggio dei contatti.

**Pesi di comparsa** (s = secondi di gioco)

| Nemico | Peso |
| --- | --- |
| Pipistrello | 3 − s/200, minimo 0,7 |
| Zombi | 3, poi 1,5 dall'8° minuto |
| Fantasma | 2 dopo 50 s |
| Scheletro | 2,6 dopo 140 s |
| Segugio | 2 dopo 230 s |
| Bruto | dopo 360 s: il minore tra 1 + s/600 e (s − 360)/75, cioè entrano in 2 minuti |

## 7. Difficoltà

Un nemico prende i valori del momento in cui nasce (m = minuti di gioco, anche frazionari):

- salute = base × (1 + 0,28 m + 0,06 × (m − 3)²), l'ultimo termine solo dopo il minuto 3. Al minuto 10 ≈ ×6,7, al 15 ≈ ×13,8
- danno = base × (1 + 0,16 m)
- nemici massimi in campo = min(380, 20 + 30 m)
- comparse al secondo = 1,2 + 2,5 m (al massimo 8 per fotogramma)

Le comparse arrivano appena fuori dallo schermo. Se in campo c'è meno del 40% del massimo, arrivano 2 nemici in più a ogni fotogramma. Un nemico rimasto troppo lontano viene ricollocato davanti al giocatore.

## 8. Drop

| Oggetto | Fonte | Probabilità | Effetto |
| --- | --- | --- | --- |
| Anima | ogni nemico | 100% | esperienza = anime del nemico |
| Pane | ogni nemico | 0,9%, al massimo uno ogni 45 s | +40 salute |
| Calamita | ogni nemico | 0,25%, al massimo una ogni 3 minuti | attira tutte le anime della mappa |
| Reliquiario | élite (1), Seth (2) | sempre | 1 potenziamento (75%) o 3 (25%) di ciò che possiedi; se è tutto al massimo, +40 salute |

Pane, calamita e reliquiari si raccolgono a 40 px dal personaggio, sono disegnati sopra il buio e ingranditi × 3; i reliquiari fuori schermo hanno un segnale lampeggiante sul bordo (`src/data/oggetti.ts`).

Colore delle anime: azzurro sotto 6, verde da 6 a 19, ambra da 20 in su. Nel raggio di raccolta volano verso il personaggio a 420 px/s, accelerando di 900 px/s al secondo; sono raccolte a 24 px (`src/data/progressione.ts`). Al massimo 320 anime a terra: oltre, la nuova nasce comunque dove muore il nemico e prende il posto e il valore dell'anima più lontana dal personaggio. Una freccia ai bordi dello schermo indica i reliquiari fuori vista.

## 8b. Fiaschetta e Grazia (`src/data/sopravvivenza.ts`)

- **Fiaschetta di lumen**: 3 sorsi all'inizio della notte (anche il massimo). Un sorso cura il 35% della salute massima in 1 s; si beve con il pulsante accanto all'anello dell'abilità o con il tasto F, solo se non si ha la salute piena e non si sta già bevendo. Un'élite uccisa ridà 1 sorso, Seth riempie la fiaschetta. La fiala è il disegno di Edoardo (`HUD/Pulsanti/Fiaschetta_Lumen_V1`, 45×74 pixel, 4 fotogrammi: piena, 2/3, 1/3, vuota), con lo stesso ingrandimento dell'anello dell'abilità e staccata da lui di 12 pixel disegnati. La fiaschetta diventerà uno sblocco con la sua questline (vedi [lore.md](lore.md) e [roadmap.md](roadmap.md)).
- **Grazia**: scatta uscendo da un cerchio rosso di Seth quando mancavano al massimo 0,25 s al colpo, o lasciandosi sfiorare da una falce spettrale (entro 30 px oltre il bordo) senza esserne toccati. Dura 3 s: +30% danno, +15% velocità, il personaggio lampeggia di chiaro (10 volte al secondo). Un'altra schivata perfetta la rinnova.

## 8c. Affinità, stati e reazioni (`src/data/stati.ts`)

Ogni arma e ogni abilità ha un'affinità; colpendo lascia sul nemico uno stato di 3 s, nel 10% dei colpi (5% per nubi, pozze e abilità, che feriscono ogni 0,3 s). Gli stati hanno un loro generatore del caso, così non cambiano carte, comparse e drop. Sopra la testa di bruti, élite e Seth compare il simbolo dello stato, grande il doppio dei suoi 11×11 pixel: sole ambra, croce oro, teschio viola, lapide seppia (la lapide resta anche durante l'Interramento). Sui nemici comuni lo stato funziona lo stesso, ma senza simbolo. Niente cambi di colore né intermittenza; al massimo 40 simboli sullo schermo (*da rivedere*), con questa precedenza: prima Seth, poi le élite, poi i bruti più vicini al personaggio.

| Affinità | Armi e abilità | Stato | Effetto |
| --- | --- | --- | --- |
| Luce | Lanterna, Candela, Lama di luce, Cerchio di luce | Abbagliato | subisce +15% danno |
| Sacro | Turibolo, Acqua santa, Campana, Benedizione | Consacrato | va più lento del 25% (Seth a metà) |
| Ombra | Bastone, Fuoco fatuo, Falce, Rito proibito | Maledetto | perde il 2% della salute massima al secondo (élite 40% di questo, Seth 10%) |
| Terra | Pala, Sepoltura | Sepolto | resta fermo 0,6 s; poi per 4 s non può esserlo di nuovo |

Due stati diversi sullo stesso nemico si consumano e fanno una reazione:

| Stati | Reazione | Effetto |
| --- | --- | --- |
| Luce + Ombra | Eclissi | esplosione di 64 px; danno = 10% della salute massima del nemico, al massimo 80 (Seth sempre 80) |
| Luce + Sacro | Rivelazione | il nemico lascia il doppio delle anime (una volta sola per nemico) |
| Sacro + Ombra | Esorcismo | dal nemico partono 3 fiammelle che inseguono i vicini (18 danni l'una) |
| Terra + qualsiasi | Interramento | fermo 1,5 s e +30% danno subito (Seth a metà durata) |

Ruoli delle armi: l'esplosione del dardo del Bastone ferisce in 40 px al 35% del danno; il Fuoco fatuo insegue per primi élite e Seth (li vede 4 volte più vicini); ogni uccisione della Falce allunga la lama del 2% per 5 s (al massimo +30%); il fendente della Lama di luce segue la direzione in cui cammini; il secondo rintocco della Campana (livello 8) ferma i nemici per 0,6 s. I cerchi delle reazioni sono disegnati dal codice a retino finché Edoardo non disegna i suoi.

La **scelta dei doni** è fatta di strisce orizzontali una sotto l'altra (`src/sistema/scheda.ts`, parole in `src/data/spiegazioni.ts`): nome, numeri grandi che cambiano («Danno 24 › 32»), il simbolo dello stato che lascia l'arma con il suo effetto, la reazione che si otterrebbe con un'arma già posseduta. Gli amuleti mostrano i grani dopo averli presi, vantaggio in verde, rovescio in rosso e l'avviso di Peccato se si sfora. Quando scatta una reazione il suo nome sale sopra il nemico, ingrandito × 2, nel colore dello stato con il contorno scuro: Eclissi viola, Rivelazione oro, Esorcismo ambra, Interramento seppia. Lo stesso nome torna al massimo ogni 2 s, al massimo 3 nomi sullo schermo insieme (oltre non si creano: la reazione avviene lo stesso). Il nome resta fuori da 90 px intorno al personaggio, spostandosi sopra quel cerchio, e dentro lo schermo (*da rivedere*). La **legenda** di stati e reazioni si apre dalla pausa («Stati») e dal «?» della scelta dei doni.

## 8d. Meta progressione (`src/data/meta.ts`)

Proposta originale: [proposte/meta-progressione.md](proposte/meta-progressione.md). Per ora c'è la parte di base: Cera, Cappella a elenco, ceri votivi, Seconda candela, personaggi da sbloccare, salvataggio.

- **Cera a terra**: i nemici lasciano gocce di cera che si raccolgono come le anime (volano verso il personaggio da più vicino e più piano), molto più rare delle anime: 0,4% dei nemici comuni, 3 gocce da un'élite, 10 da Seth; ogni goccia vale 1. Più 100 per l'alba. Il contatore «Cera N» sta sotto quello delle anime. La si porta a casa anche morendo; compare nella schermata di fine («+N Cera per la Cappella»). Numeri in `DROP.cera` (`data/oggetti.ts`) e `CERA` (`data/meta.ts`). Goccia provvisoria disegnata dal codice.
- **Ceri votivi**: 5 livelli, costo 30, 60, 100, 150, 220 Cera (560 per cero). Valgono per tutti i personaggi e si possono spegnere uno a uno.

| Cero | Per livello | Al massimo |
| --- | --- | --- |
| Cero della vita | +5% salute massima | +25% |
| Cero della forza | +4% danno | +20% |
| Cero del passo | +3% velocità | +15% |
| Cero del raccolto | +10% raggio di raccolta | +50% |
| Cero del rito | −4% ricarica dell'abilità speciale | −20% |
| Cero delle anime | +4% anime | +20% |
| Cero della scelta | +1 rimescolata ogni 2 livelli | +3 |

- **Seconda candela**: 400 Cera; una volta per veglia, a salute zero ci si rialza con il 30% della salute e 2 s di invulnerabilità. Si può spegnere.
- Il cero della fiaschetta della proposta non c'è ancora: aspetta la questline della fiaschetta.
- **Personaggi**: si parte con il solo Lampionaio. Becchino: sopravvivi 5 minuti, oppure 200 Cera. Badessa: sconfiggi Seth, oppure 400 Cera. Strega: arriva all'alba, oppure 700 Cera. Le imprese valgono con qualsiasi personaggio.
- **Salvataggio** sul dispositivo (chiave `dl-salvataggio`, con numero di versione) e **codice di salvataggio** nella Cappella (testo che comincia con `DL1-`, da copiare e incollare: copia di sicurezza e passaggio tra link e app). Caricare un codice chiede conferma.
- **Armi e doni nuovi** (`SBLOCCHI_OGGETTI` in `src/data/meta.ts`; le imprese si contano veglia per veglia). Cera votiva: libera da subito. *Da rivedere* (valori proposti da Claude).

| Oggetto | Si sblocca |
| --- | --- |
| Lapide | sconfiggi Seth con il Becchino |
| Rosario spezzato | fai 10 Eclissi in una veglia |
| Corvo | raccogli 30000 anime in una veglia |
| Velo funebre | resta 3 minuti in tutto dentro le tue nubi in una veglia |
| Campanella d'argento | fai 20 schivate perfette in una veglia, oppure 120 Cera |
| Chiodo di bara | 120 Cera |
| Lacrima di lumen | 120 Cera |

Le «reliquie dimenticate» della proposta (oggetti trovati in partita e pagati dopo) sono state semplificate: si sblocca tutto dalla Cappella.


## 8e. Il Rosario (`src/data/rosario.ts`)

- **Grani**: si parte con 3, +1 per ogni Seth sconfitto in quella veglia (al massimo 5). Ogni amuleto costa da 1 a 3 grani.
- **Dove si trovano**: nei reliquiari. Se il Rosario è sbloccato e c'è un amuleto ancora da trovare, il reliquiario offre gli amuleti a caso e «Potenziamento» (il potenziamento di prima: 1, a volte 3). Con le strisce ci stanno quattro scelte: il reliquiario mostra tre amuleti e «Potenziamento».
- **Peccato**: se i grani usati superano quelli che hai, il danno subito raddoppia, finché non spegni un amuleto. Dalla pausa si toccano le icone degli amuleti per accenderli e spegnerli. In partita, sotto la Cera: «Rosario 2/3» (in rosso «Peccato 5/3»).
- **Sblocco**: nella Cappella, con l'impresa «Sopravvivi 8 minuti» oppure con 300 Cera. Salvato nel salvataggio. *Da rivedere:* i 3 grani di partenza e il Peccato ×2 (valori predefiniti di Claude).
- **Gli amuleti** (vantaggio / rovescio):

| Amuleto | Grani | Vantaggio | Rovescio |
| --- | --- | --- | --- |
| Specchio rotto | 3 | +1 proiettile, nube, fiala, fuoco o falce per tutte le armi | subisci +25% danno |
| Lanterna cieca | 2 | +35% danno | alone di luce al 15%: quasi spento |
| Cuore avido | 2 | +30% anime | pane e fiaschetta curano la metà |
| Sangue freddo | 1 | sotto il 30% di salute, +40% danno | nessuno |
| Martire | 3 | ogni colpo subito libera un'onda sacra di 150 px (30 di danno base) | −20% salute massima |
| Danza macabra | 2 | la Grazia scatta anche sfiorando (entro 16 px) i nemici normali, non più di una ogni 3 s | la Grazia dura 2 s invece di 3 |
| Ceri gemelli | 2 | l'abilità speciale ha 2 cariche | ricarica +30% |
| Lucciola | 1 | alone di luce +20%; i nemici nell'alone sono abbagliati (controllo ogni 0,5 s) | nessuno |
| Ossa d'élite | 1 | le élite lasciano 2 reliquiari | le élite hanno +40% salute |
| Patto di sangue | 2 | ogni uccisione cura 0,2 di salute | non puoi più usare la fiaschetta |

- **Icone**: grani colorati disegnati dal codice (`src/sistema/amuleti.ts`), finché Edoardo non disegna `Icona_Amuleto_<id>`.

## 8f. Le Unioni (`src/data/unioni.ts`)

Un'arma al livello 8 più il suo dono al livello 3 (o al massimo del dono, se è più basso: Lacrima di lumen arriva a 2): il reliquiario successivo offre l'unione come prima striscia. L'arma tiene i suoi numeri e guadagna un effetto. Una sola unione per reliquiario; con l'unione gli amuleti offerti scendono a 2, per restare a quattro strisce.

| Arma | + Dono | Arma unita | Effetto |
| --- | --- | --- | --- |
| Lanterna | Stoppino lungo | Faro dei morti | l'arco diventa un cerchio; abbaglia un nemico su due |
| Pala | Scudo di ferro | Vanga del custode | ogni colpo pianta una lapide: chi è sotto resta fermo 3 s (Seth a metà) |
| Turibolo | Erbe amare | Incensiere dell'ultima ora | dentro le nubi +1 salute al secondo (non si somma tra nubi) |
| Bastone | Clessidra | Verga dei nomi | ogni 5ª raffica colpisce tutti i maledetti sullo schermo, con il danno di un dardo |
| Candela | Cuore di cera | Candelabro funebre | le fiammelle lasciano una scia: una fiamma ogni 0,12 s, 36 px, 1 s, 40% del danno ogni 0,3 s |
| Falce | Sale nero | Falce di Seth | uccide i nemici normali sotto il 15% di salute (non élite e Seth) |
| Campana | Cera votiva | Campana a morto | ogni rintocco ferma per 0,8 s |
| Fuoco fatuo | Calamita | Fuochi erranti | i fuochi raccolgono le anime entro 120 px |
| Acqua santa | Lacrima di lumen | Acquasantiera | ogni 40 uccisioni nelle pozze torna un sorso |
| Lama di luce | Ali di falena | Lama dell'alba | un secondo fendente parte da dove eri 0,5 s prima |

Le 4 armi nuove (Lapide, Rosario spezzato, Corvo, Velo funebre) non hanno unioni. **Sblocco**: nella Cappella, con l'impresa «Sopravvivi 10 minuti» oppure con 500 Cera. *Da rivedere* (scelta di Claude per fare delle unioni un premio della meta). Le strisce di arma e dono dicono a che livelli si unisce; la legenda elenca tutte le unioni. Icone provvisorie: l'icona dell'arma con quattro angoli d'oro.

## 8g. Oggetti rompibili (`src/data/rompibili.ts`)

**Prova: tutti i valori sono *da rivedere*.** Urne, giare e lanterne stanno sparse a caso, in posti diversi a ogni notte. Il mondo è diviso in settori di 700×700 px, circa uno schermo di telefono: ogni settore ha una sola estrazione, ad almeno 110 px dal bordo e ad almeno 320 px dal punto di partenza. Sono attivi i settori entro 2 da quello del personaggio.

| Oggetto | Per settore | Cosa lascia | Luce |
| --- | --- | --- | --- |
| Urna | 24% | 1 frammento di reliquia | no |
| Giara | 24% | 2 gocce di Cera | no |
| Lanterna | 12% | chiazza d'olio | sì |
| Niente | 40% | | |

Si rompono se il personaggio arriva a 34 px o se li colpisce un'arma: archi, impatti, rintocchi, fendenti, nubi, pozze, proiettili, falci, lapidi, grani e corvo, anche senza nemici vicini. Un oggetto rotto non torna in quella notte. La lanterna intera apre un foro nel buio pieno fino a 120 px e scalda il terreno fino a 170 px; rotta, si spegne.

**Chiazza d'olio**: raggio 96 px, dura 12 s, rallenta del 40% i nemici dentro (Seth la metà). Non tocca il personaggio. Candela e Fuoco fatuo la accendono passandoci sopra: brucia per 5 s al posto dell'olio che resta, 14 danni ogni 0,4 s (più i bonus di danno), e fa luce come una lanterna. Disegni provvisori dal codice.

**Frammenti**: volano verso il personaggio come la Cera. Il cartiglio dice «1 di 3: riuniti, aprono un reliquiario»; il terzo apre un reliquiario e il conto riparte. Il bot delle simulazioni gioca senza rompibili, quindi olio e frammenti non sono misurati.

## 9. Esperienza e doni

- Anime per passare dal livello L al successivo: 2 + 3 L + L²
  - Valori: livello 1: 6 · livello 5: 42 · livello 10: 132 · livello 20: 462 · livello 40: 1722 · livello 60: 3782.
- Ogni livello mostra 3 carte casuali. Pesi:
  - arma posseduta 1,5 (l'arma iniziale 2)
  - arma nuova 1
  - dono posseduto 1,2
  - dono nuovo 0,9
- 2 rimescolate per partita (più quelle del Cero della scelta). Se non resta nulla da potenziare, esce «Pane e vino» (+40 salute).

## 10. Regole di combattimento

| Regola | Valore |
| --- | --- |
| Danno inflitto | danno arma × (1 + bonus danno) × caso tra 0,92 e 1,08 |
| Danno subito | danno nemico × (1 − armatura), minimo 1; armatura = parte di danno in meno, al massimo 60% |
| Invulnerabilità dopo un colpo | 0,45 s |
| Raggio del giocatore | 21 px (9 nella v0) |
| Respinta | per arma: è la velocità con cui il nemico viene spinto via, che poi si spegne (attrito 8 al secondo, cioè percorre circa respinta ÷ 8 px); bruti ed élite la subiscono a un quarto, Seth per niente |
| Lampo del nemico colpito | 0,033 s (2 passi di gioco), al massimo un lampo ogni 0,3 s per nemico: un colpo che arriva prima non lo fa ripartire. Bruti, élite e Seth non diventano bianchi: si schiariscono del 50%, così resta la sagoma. Solo i colpi diretti lo fanno (archi, impatti, proiettili, esplosioni, falci, rintocchi, lapidi, grani, becchi); niente lampo per nubi, pozze, Velo funebre, abilità speciali e scie (*da rivedere*) |
| Punto da cui partono le armi | 36 px sopra i piedi |
| Rallentamento | resta attivo il più forte tra quelli in corso |
| Salute bassa | sotto il 35% il bordo pulsa di rosso: quello del campo sul telefono in verticale, quello dello schermo altrove |

## 11. Interfaccia e sensazioni

- **HUD sul telefono in verticale: due fasce fisse fuori dal campo** (misure in `FASCE`, `src/data/hud.ts`, tutte *da rivedere*). Il campo è vero: finisce al bordo delle fasce per la telecamera, la comparsa e il ricollocamento dei nemici e tutte le armi che scelgono bersagli «sullo schermo».
  - altezza calcolata per ogni telefono: area sicura (la più grande tra `env()` e Capacitor) + contenuto. Sul Galaxy S25 (area sicura in alto 105 pixel fisici, in basso 0): fascia alta 81 pixel disegnati (324 fisici), fascia bassa 94 (376 fisici), campo 540×820 pixel di gioco. Un pixel disegnato vale 4 pixel fisici;
  - fascia alta: stemma del livello ed esperienza; sotto, la riga dell'orologio e della barra sottile di Seth. Il cartiglio sale fino al bordo e copre il centro della prima riga per la sua durata; la sua scritta resta sempre fuori dall'area sicura (sul S25 parte a 108 fisici) e la riga dell'orologio resta libera;
  - fascia bassa: fiaschetta nell'angolo a sinistra e abilità nell'angolo a destra, scambiabili dal LAB; pausa piccola al centro, senza area di tocco invisibile (*da rivedere*). Il joystick può nascere anche nella fascia bassa;
  - fuori dall'HUD di partita: anime, Cera, Rosario e griglia degli oggetti, che stanno nella pausa e nella schermata di fine;
  - segnali sul bordo del campo: salute bassa (rosso che pulsa), Peccato (cornice viola a retino), reliquiario fuori vista (freccia al confine con le fasce);
  - joystick con base più piccola: non nasce mai sopra un pulsante, la base si sposta di quanto basta (sopra la riga dei pulsanti, se di lato non c'è posto) e il centro della direzione resta sotto il dito.
- **HUD su computer, tablet e telefono in orizzontale** (invariato):
  - in alto: barra dell'esperienza, armi e doni con il loro livello, livello e anime; l'orologio sta nella colonna di destra, sotto anime e Cera, dove le caselle non arrivano mai (*da rivedere*);
  - barra del boss quando c'è Seth;
  - in basso a sinistra: l'abilità speciale con la ricarica circolare; in basso a destra: la pausa.
- **Feedback**:
  - numeri del danno, bianchi; in ambra solo i critici, la somma del danno delle reazioni e il numero sommato su élite e Seth;
  - il personaggio lampeggia quando viene colpito;
  - leggero tremolio dello schermo;
  - bordo rosso quando la salute è bassa;
  - avvisi nel cartiglio (sciami, orde, Seth, reliquiari), subito sotto barre e caselle, con la riga secondaria subito sotto. Il cartiglio è ridotto a 0,5 volte, arrotondato a un ingrandimento intero e mai sotto × 2: sui telefoni normali è la metà; su computer, tablet e iPhone SE resta com'era, perché a × 1 le lettere non si leggono (*da rivedere*). Non scende mai sul personaggio: se le caselle sono tante, sale sopra di loro. Durano 1,45 s, compresi 0,3 s di dissolvenza a retino (*da rivedere*).
- **Gesti e tasto Indietro** (provati da Edoardo sul Galaxy S25, nessuna esclusione dei gesti):
  - nell'APK, dai bordi laterali: il primo gesto mostra le barre di sistema, il secondo mette in pausa;
  - nell'APK, dal basso verso l'alto: l'app va in secondo piano; riaprendola la partita è in pausa, finché Android non chiude l'app;
  - nel link in Home e in Chrome: in partita Indietro apre la pausa e, se è già aperta, la chiude, come nell'APK; nella schermata di fine torna al menu; nei menu si comporta come sempre. La partita aggiunge una sola voce alla cronologia (`src/sistema/indietro.ts`), dopo il primo tocco: prima di quel tocco Indietro lascia la pagina;
  - nel link, chiudere la scheda fa perdere la partita (vedi la tappa «Salvataggio della partita in corso» in [roadmap.md](roadmap.md)).
- **Audio** (sintetizzato dal codice): colpo, sparo, anima con tono che sale nelle serie, danno subito, campana, livello, reliquiario, Seth, cura, speciale. Da sostituire con suoni veri (vedi [roadmap.md](roadmap.md)).
- **In partita** (computer e tablet; sul telefono vedi sopra): HUD in alto con livello, orologio, anime, Cera, Rosario, icone di armi e doni con il livello, barra di Seth; avvisi «Lo sciame» (ti circonda), «Seth» (il Rinnovato è venuto per te), «Reliquiario» (…); pausa con il pulsante in basso a destra, P o Esc, Indietro su Android e quando l'app va in secondo piano; M accende e spegne i suoni; 1-2-3-4 scelgono la striscia del dono; F beve dalla fiaschetta; Spazio usa l'abilità.
- **Schermate**: selezione del personaggio con le schede, scelta del dono, pausa (riepilogo della build, sul telefono anche anime, Cera e Rosario, audio, vibrazione, abbandona), fine partita (tempo, livello, anime, danno, build). Il record di tempo si salva sul dispositivo.

### Mondo, luce e comandi (`src/data/mondo.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Pixel di gioco da vedere | 700 in verticale, 610 in orizzontale | `src/sistema/pixel.ts`; si sceglie la scala intera più vicina, quindi sui telefoni se ne vedono un po' meno (circa 585 sul lato corto) |
| Raggio della luce | 260 | oltre comincia il buio a retino |
| Sfumatura del buio | 1,5 | più alto = buio più rapido |
| Buio massimo | 88% dei pixel | nel buio più fitto il terreno si intravede ancora |
| Centro della luce | 42 px sopra i piedi | |
| Tremolio della fiamma | ±7 px ogni 0,12 s | |
| Terreno | riquadro di 1120 px che si ripete, celle di 56 px | tombe 4%, croci 2%, erba 24% per cella |
| Joystick | raggio 44 px dello schermo, zona morta 18% | compare dove si appoggia il dito; sul telefono in verticale base da 56 pixel disegnati, mai sopra un pulsante (*da rivedere*) |

### Nemici in campo (`src/data/nemici.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Dove nascono | 48 px fuori dal bordo dello schermo | |
| Ricollocamento | oltre 2,2 × 48 px fuori dallo schermo | torna davanti al giocatore, entro ±0,7 radianti dalla direzione in cui cammina |
| Separazione tra nemici | forza 0,5; si toccano sotto il 75% della somma dei raggi | i fantasmi attraversano gli altri |
| Sprite segnaposto V0 | ingranditi × 2 | disegnati per personaggi di 34 px |
| Barra della salute | riempimento 47 × 6 pixel disegnati, 5 px sotto i piedi | decisa da Edoardo: sotto il personaggio, non in alto (`src/data/mondo.ts`) |
| Lampo quando sei colpito | 0,1 s | bianco pieno |
| Dalla morte alla schermata di fine | 0,9 s | il personaggio lampeggia e sparisce |

### Impatto dei colpi (`src/data/effetti.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Numeri del danno | durano 0,55 s, salgono di 22 px, cifre 3×5 ingrandite × 2 | bianchi; ambra in tre casi soltanto: colpi critici (Chiodo di bara), danno delle reazioni (vedi riga sotto) e numero sommato su élite e Seth; al massimo 15 numeri del danno sullo schermo (*da rivedere*): al limite un bianco nuovo non si crea, un ambra nuovo prende il posto del bianco più vecchio; se sono tutti ambra, neanche l'ambra nuovo si crea |
| Numero delle reazioni | un solo numero ambra con la somma del danno di quella reazione, al centro della zona colpita | Eclissi ed Esorcismo (Rivelazione e Interramento non fanno danno). Comprende anche il danno su élite e Seth. Per l'Esorcismo resta aperto finché esiste una fiammella. Regole delle scritte: mai entro 90 px dal personaggio, mai fuori dallo schermo. Se il nome della reazione viene spostato sopra quel cerchio, sta 16 px più in alto del numero (*da rivedere*) |
| Numeri su élite e Seth | i colpi entro 0,5 s si sommano in un solo numero, 30 px sopra la cima dello sprite | segue la testa del nemico e sale quando la somma si chiude: non sta mai sul corpo, nemmeno mentre Seth pulsa di rosso; è sempre ambra (*da rivedere*) |
| Scoppio del nemico che muore | 0,2 s | anello chiaro che si sfalda a retino |
| Arco della Lanterna | 0,12 s, spessore 6 px | disegnato dal codice, metà pieno e metà a retino |
| Impatto della pala | 0,22 s; scossa dello schermo di 2 px per 0,1 s se colpisce qualcuno | |
| Esplosione dei dardi | 0,18 s | |
| Ordine di disegno | arco, impatto e nubi sotto i nemici; il personaggio sopra tutti i nemici, Seth compreso; cerchi e falci di Seth sopra il personaggio; anime sopra il buio | decisione di Edoardo: i colpi non devono coprire i nemici, il personaggio non deve sparire, le anime devono vedersi |
| Anime a terra | cristalli della v0 ingranditi × 3 | |

## 12. Da fare e da decidere

Il piano di lavoro, le idee non ancora decise (altri scenari, suoni e musica, lingua, stile dei nemici, torce nel cimitero) e il redesign sono in [roadmap.md](roadmap.md).
