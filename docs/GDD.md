# Death's Lumen — GDD

Il gioco **com'è oggi**: contenuti, regole e numeri attuali, gli stessi di `src/data/` (il codice è la fonte di verità). Qui non c'è la storia dei numeri: i ritocchi e le simulazioni sono in [bilanciamento.md](bilanciamento.md), le scelte con data in [decisioni.md](decisioni.md), cosa resta da fare in [roadmap.md](roadmap.md), gli asset da disegnare in [asset_da_creare.md](asset_da_creare.md). Il punto di partenza era la v0 («Lumen dei Morti», ottobre 2026). Le voci segnate *da rivedere* sono valori proposti da Claude e non ancora confermati da Edoardo.

> **Il gioco sta cambiando genere (12/11/2026).** Questo documento descrive il **survivor-like che c'è oggi nel codice** (congelato anche nel tag `survivor-v1`). Il gioco a stanze, alla Hades, è progettato in [proposte/pivot-hades.md](proposte/pivot-hades.md) e nasce accanto al survivor sul ramo `prova`: entra in questo documento un pezzo alla volta, quando quel pezzo esiste nel codice. Le sezioni del survivor si tolgono quando il suo codice viene tolto (dopo l'approvazione della fetta verticale).

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
| 1:00 | Iniziano i fantasmi |
| 0:55, poi ogni 55 s | Un nemico élite, che lascia un reliquiario |
| inizio dei minuti 1-4, 6-9, 11-14, con 3 s di preavviso | Un'orda di un solo tipo: anello, muro, cuneo o tenaglia, secondo il copione delle orde |
| 2:00 | Iniziano gli scheletri (ti accerchiano) |
| 4:00 | Iniziano i segugi (ti tagliano la strada) |
| 5:00 | Prima apparizione di Seth |
| 7:00 | Iniziano i bruti |
| 10:00 | Seconda apparizione di Seth, molto più resistente |
| 15:00 | L'alba: vittoria |

## 1b. Mondo e lore

Il mondo, i personaggi e la trama sono in [lore.md](lore.md). In gioco il boss dei minuti 5 e 10 è **Seth, il Rinnovato** («Rinnovato» compare dal primo Seth come primo indizio); nel codice e nei numeri si chiama ancora `mietitore`.

## 2. Personaggi

Personaggi giocabili oggi: quattro. Previsti: la Veggente e la Sguattera (vedi [roadmap.md](roadmap.md)).

Valori di base comuni: 100 salute, velocità 245, raccolta delle anime a 40 px, armatura 0. Il raggio è *da rivedere*: senza potenziamenti il Lumen si raccoglie passandoci sopra.

| Personaggio | Motto | Colore | Arma iniziale | Abilità speciale | Modificatori |
| --- | --- | --- | --- | --- | --- |
| Il Lampionaio | Guida nel buio | `#e3913a` | Lanterna | Cerchio di luce | +10% velocità, +0,2 salute/s |
| Il Becchino | Nulla resta davvero sotto terra | `#b89a74` | Pala | Sepoltura | +30 salute, −10% danno subito, +5% danno, −3% velocità |
| La Badessa | Preghiere per ciò che è stato | `#dcc07a` | Turibolo | Benedizione | +10 salute, +0,3 salute/s, +15% area |
| La Strega | Conosce nomi che non dovrebbero essere detti | `#a57ae0` | Bastone | Rito proibito | −5 salute, +10% danno, −10% ricarica |

**Voti** (decisione di Edoardo del 10/11, `VOTI` e `NUMERI_VOTI` in `src/data/voti.ts`; nomi e numeri *da rivedere*): uno per personaggio, sempre attivo, legato alla sua affinità. Si legge nella scheda del personaggio (menu) e nella pausa (scheda Stati, «Il tuo Voto»).

| Personaggio | Voto | Effetto |
| --- | --- | --- |
| Il Lampionaio | Voto della Luce | dentro l'alone di luce la quiete dopo una reazione dura 1,5 s invece di 3 |
| Il Becchino | Voto della Terra | +40% danno ai nemici fermi (sepolti, interrati, fermati da Campana, Vanga o Sepoltura) |
| La Badessa | Voto del Sacro | i nemici consacrati fanno il 20% di danno in meno (a contatto) |
| La Strega | Voto dell'Ombra | nelle reazioni il Maledetto non si consuma; gli altri stati sì |

Tra le carte, le armi nuove dell'affinità del personaggio pesano 1,3 invece di 1.

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

Arco centrato sul nemico più vicino entro 260 px (se non ce n'è, sulla direzione in cui cammini), misurato dal personaggio; respinge di 259 (110 × 2,35). Raggi già × 2,35. Arma iniziale del Lampionaio, esclusiva. Vedi «Lanterna e Pala mirano» sotto la Pala.

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

Impatto circolare 61 px davanti a te (26 × 2,35), nella direzione di cammino, oppure centrato sul nemico più vicino entro 150 px (vedi sotto); respinge di 423 (180 × 2,35). Raggi già × 2,35. A Lv 8 un secondo colpo alle spalle 0,22 s dopo. Arma iniziale del Becchino, esclusiva.

**Lanterna e Pala mirano** (regola del gioco dal 10/11, decisione di Edoardo; `MIRA` in `src/data/armi.ts`, valori *da rivedere*): l'arco della Lanterna si centra sul nemico più vicino entro 260 px (il raggio della luce) e l'impatto della Pala cade sul nemico più vicino entro 150 px; senza nemici così vicini colpiscono verso dove cammini. Il colpo alle spalle del livello 8 resta alle spalle della direzione del colpo. Il bot continua a girare intorno ai nemici per tenerli davanti. Per confrontare con la regola di prima: Laboratorio, scheda Oggetti, «Lanterna e Pala verso dove cammini» (spento di partenza; per il bot `?mira=0`).

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

Si trovano tra le armi comuni: Lapide, Rosario spezzato, Corvo e Velo funebre solo dopo averle sbloccate (sezione 8d), i Sampietrini da subito. I numeri sono in `src/data/armi.ts`.

| Arma | Affinità | Cosa fa | Livello 1 | Livello 8 |
| --- | --- | --- | --- | --- |
| Lapide | Terra | cade sul nemico con più salute in vista; chi è sotto resta sempre Sepolto | 120 danni, ogni 3,2 s, raggio 84 | 260 danni, 2 lapidi, ogni 2,4 s, raggio 110 |
| Rosario spezzato | Ombra | un grano rimbalza tra i nemici vicini (entro 190 px); 35% di maledire a ogni rimbalzo | 18 danni, 4 rimbalzi, ogni 1,6 s | 40 danni, 8 rimbalzi, 2 grani, ogni 1,2 s |
| Corvo | Luce | vola intorno e becca il nemico più vicino (entro 330 px); a ogni beccata le anime a terra entro 150 px dal nemico beccato volano verso di te (*da rivedere*) | 26 danni, 1 corvo, ogni 1 s | 44 danni, 3 corvi, ogni 0,75 s |
| Velo funebre | Sacro | aura intorno al personaggio; 20% di consacrare a ogni colpo | 7 danni, raggio 110, ogni 0,5 s | 21 danni, raggio 160, ogni 0,4 s |
| Sampietrini | Terra | lancia sampietrini sui nemici più vicini (entro 350 px); ognuno colpisce entro 40 px, lascia Sepolto come la Pala, rimbalza 90 px in avanti e colpisce di nuovo (*da rivedere*) | 14 danni, 1 sampietrino, 1 rimbalzo, ogni 1,5 s | 26 danni, 3 sampietrini, 2 rimbalzi, ogni 1,2 s |

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

#### Sampietrini

Terza arma di Terra (bozza confermata da Edoardo il 10/11), libera da subito, nei pesi delle armi comuni. Lancia sampietrini sui nemici più vicini entro 350 px: ognuno vola 0,45 s con un arco alto 60 px, colpisce entro 40 px e lascia Sepolto come la Pala (nel 10% dei colpi); poi rimbalza 90 px in avanti, nella direzione del lancio (0,3 s, arco di 24 px), e colpisce di nuovo. Le misure del volo sono di Claude, *da rivedere*. Sasso, icona e polvere provvisori, disegnati dal codice e grandi quanto l'area che colpiscono: il sasso è un ciottolo di 20×16 pixel ingrandito di un intero fino alla larghezza dell'area (× 4 con il raggio di 40 px, 80 px; di più con lo Stoppino lungo); la polvere è un anello largo quanto l'area (pieno, poi a retino, 0,3 s).

| Lv | Ricarica (s) | Quantità | Rimbalzi | Danno | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1,5 | 1 | 1 | 14 | Lancia un sampietrino sul nemico più vicino: colpisce, rimbalza in avanti e colpisce di nuovo. |
| 2 | 1,5 | 1 | 1 | 18 | +4 danno. |
| 3 | 1,5 | 2 | 1 | 18 | +1 sampietrino. |
| 4 | 1,35 | 2 | 1 | 18 | Lancia più spesso. |
| 5 | 1,35 | 2 | 2 | 22 | +4 danno, +1 rimbalzo. |
| 6 | 1,35 | 3 | 2 | 22 | +1 sampietrino. |
| 7 | 1,2 | 3 | 2 | 22 | Lancia più spesso. |
| 8 | 1,2 | 3 | 2 | 26 | +4 danno. |

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

Vola intorno a te a 90 px, a 0,35 giri al secondo; becca il nemico più vicino entro 330 px, volando a 1100 px/s; a ogni beccata le anime a terra entro 150 px dal nemico beccato volano verso di te (decisione di Edoardo dell'11/11, *da rivedere*; prima riportava da 1 a 4 anime, le più lontane). Il livello 3, che prima riportava più anime, oggi dà +4 danno: segnaposto di Claude, *da rivedere*.

| Lv | Ricarica (s) | Danno | Quantità | Cosa cambia |
|---|---|---|---|---|
| 1 | 1 | 26 | 1 | Becca il nemico più vicino e ti riporta le anime intorno a lui. |
| 2 | 1 | 33 | 1 | +7 danno. |
| 3 | 1 | 37 | 1 | +4 danno. |
| 4 | 0,9 | 37 | 1 | Becca più spesso. |
| 5 | 0,9 | 37 | 2 | +1 corvo. |
| 6 | 0,9 | 44 | 2 | +7 danno. |
| 7 | 0,75 | 44 | 2 | Becca più spesso. |
| 8 | 0,75 | 44 | 3 | +1 corvo. |

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

Doni a 3 livelli (decisione di Edoardo del 10/11, *da rivedere*): i doni che arrivavano a 4 o 5 arrivano a 3, con lo stesso effetto al massimo; ogni livello ne dà una parte uguale. Specchio, Lacrima di lumen e Campanella d'argento restano come prima.

| Dono | Effetto al massimo | Livello max | Per livello (arrotondato) |
| --- | --- | --- | --- |
| Cuore di cera | +100 salute massima | 3 | +33,3 |
| Sale nero | +50% danno | 3 | +16,7% |
| Clessidra | −30,43% ricarica, si moltiplica a ogni livello (minimo 40% della ricarica base) | 3 | −11,4% |
| Stoppino lungo | +50% area (raggi, archi, nubi, pozze, abilità, alone di luce; nel gioco nuovo anche il bonus area del personaggio allarga l'alone) | 3 | +16,7% |
| Ali di falena | +40% velocità | 3 | +13,3% |
| Calamita | +500% raggio di raccolta e +25% anime | 3 | +166,7% e +8,3% |
| Erbe amare | +1,25 salute al secondo | 3 | +0,42 |
| Scudo di ferro | −24% danno subito | 3 | −8% |
| Specchio | +1 proiettile, nube, fiala, fuoco o falce | 1 | +1 |
| Cera votiva | +75% durata di zone e stati | 3 | +25% |
| Chiodo di bara | +30% probabilità di colpo critico (danno doppio) | 3 | +10% |
| Lacrima di lumen | +2 sorsi della fiaschetta (si riempie anche quel sorso) | 2 | +1 |
| Campanella d'argento | +0,2 s di finestra per la schivata perfetta e +16 px di sfioramento per le tacche della Grazia | 2 | +0,1 s e +8 px |

Sulle strisce della scelta e nella pausa i doni mostrano i numeri del loro effetto. Dove il valore di partenza è piccolo una percentuale dice poco e si scrive il valore vero: l'unico caso oggi è la **raccolta della Calamita**, in pixel, già dal livello 1 («Raccolta 40 › 107 px», poi 173 e 240; con il cero della raccolta della Cappella i numeri salgono). Anche la statistica «Raccolta» della pausa è in pixel. Gli altri doni restano come sono: salute, salute al secondo, sorsi, critico e Campanella sono già valori veri; danno, ricarica, area, velocità, durata, danno subito e anime sono percentuali di valori grandi.

Gli oggetti nuovi non diluiscono i potenziamenti: il peso delle armi e dei doni non ancora presi si divide come se fossero sempre 6 e 9 (`CARTE.pool`, `src/data/progressione.ts`).

## 6. Nemici

Valori al minuto 0, in `src/data/nemici.ts`; la velocità varia a caso del ±10%.

| Nemico | Salute | Velocità | Danno | Raggio | Anime | Compare da | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pipistrello | 6 | 179 | 5 | 16 | 1 | 0:00 | comune all'inizio, sciami; vola a zig-zag |
| Zombi | 16 | 87 | 8 | 21 | 2 | 0:00 | lento |
| Fantasma | 13 | 129 | 7 | 21 | 2 | 1:00 | attraversa gli altri nemici |
| Scheletro | 34 | 106 | 10 | 21 | 3 | 2:00 | resistente; ti accerchia |
| Segugio | 28 | 200 | 9 | 21 | 3 | 4:00 | il più veloce; ti taglia la strada |
| Bruto | 150 | 78 | 18 | 38 | 8 | 7:00 | pesante: respinta e attrazione ridotte |
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
- **Orde** (`ORDE`, *da rivedere*): una all'inizio di ogni minuto del copione, quando finisce la calma del respiro; nei minuti di Seth no. 3 s prima il bordo del campo da cui arriva lampeggia di rosso a retino (tutti i bordi per l'anello, due opposti per la tenaglia) e compare la scritta. Ogni orda è di un solo tipo e ha un terzo dei nemici massimi in campo in quel minuto, almeno 12 e al massimo 80: 17 al minuto 1, 80 dal minuto 8. Forme: *muro*, file di 12 distanziate di 2,4 raggi; *cuneo*, un triangolo pieno con la punta verso di te; *tenaglia*, due muri da lati opposti con metà nemici ciascuno; *anello*, in cerchio appena fuori dallo schermo (un'ellisse grande quanto lo schermo, 48 px fuori dal bordo), a +12% di velocità. Muro, cuneo e tenaglia attraversano il campo compatti, in linea retta verso il punto dove eri quando sono nati, a 80 px/s, e non ti inseguono: si sciolgono solo dopo averlo attraversato tutto. I nemici delle orde, anello compreso, non si fanno spingere indietro e dal minuto 6 hanno salute ×3: sono un muro da aggirare.

**Il copione delle orde**

| Minuto | Forma | Nemico |
| --- | --- | --- |
| 1 | anello | pipistrello |
| 2 | muro | zombi |
| 3 | cuneo | scheletro |
| 4 | anello | pipistrello |
| 6 | muro | scheletro |
| 7 | tenaglia | zombi |
| 8 | anello | fantasma |
| 9 | cuneo | segugio |
| 11 | muro | scheletro |
| 12 | anello | fantasma |
| 13 | tenaglia | segugio |
| 14 | cuneo | scheletro |

- **Élite**: l'alone ambra è un colore aggiunto allo sprite; ingrandite × 1,5 anche nel raggio dei contatti.

**Il copione della notte** (`COPIONE`, `src/data/nemici.ts`, *da rivedere*): chi compare da quel minuto e con che peso (più alto, più spesso). Dalle 3:00 «zombi 3, scheletro 1» invece di «scheletro 3, zombi 2» (decisione di Edoardo del 10/11 sera: gli scheletri delle comparse uccidevano il Lampionaio prima del minuto 5); l'orda a cuneo di scheletri del minuto 3 resta.

| Da | Nemici |
| --- | --- |
| 0:00 | pipistrello 3, zombi 2 |
| 1:00 | zombi 3, fantasma 2 |
| 2:00 | fantasma 3, pipistrello 2, scheletro 1 |
| 3:00 | zombi 3, scheletro 1 |
| 4:00 | pipistrello 3, segugio 2 |
| 5:00 | zombi 3, scheletro 1 |
| 6:00 | segugio 3, fantasma 2 |
| 7:00 | zombi 3, bruto 1 |
| 8:00 | scheletro 3, zombi 2, bruto 1 |
| 9:00 | segugio 3, pipistrello 1 |
| 10:00 | fantasma 3, pipistrello 1 |
| 11:00 | fantasma 3, bruto 2 |
| 12:00 | scheletro 3, segugio 2 |
| 13:00 | scheletro 3, bruto 2, segugio 1 |
| 14:00 | segugio 3, bruto 2, fantasma 2 |

## 7. Difficoltà

Un nemico prende i valori del momento in cui nasce (m = minuti di gioco, anche frazionari):

- salute = base × (1 + 0,28 m + 0,06 × (m − 3)²), l'ultimo termine solo dopo il minuto 3. Al minuto 10 ≈ ×6,7, al 15 ≈ ×13,8
- danno = base × (1 + 0,16 m)
- nemici massimi in campo = min(250, 20 + 30 m)
- bruti in campo al massimo 100 (*da rivedere*): oltre, al loro posto nasce il nemico principale del minuto
- comparse al secondo = 1,4 + 2,9 m (al massimo 8 per fotogramma)

Le comparse arrivano appena fuori dallo schermo. **Il respiro** (`RESPIRO`, *da rivedere*): dal minuto 1, in ogni ciclo di 60 s le comparse sono piene per 50 s, poi nella calma scendono al 25%. Se in campo c'è meno del 40% del massimo, arrivano 2 nemici in più a ogni fotogramma, tranne nella calma. Un nemico rimasto troppo lontano viene ricollocato davanti al giocatore.

## 8. Drop

| Oggetto | Fonte | Probabilità | Effetto |
| --- | --- | --- | --- |
| Anima | ogni nemico | 100% | esperienza = anime del nemico |
| Pane | ogni nemico | 0,9%, al massimo uno ogni 45 s | +40 salute |
| Calamita | ogni nemico | 0,25%, al massimo una ogni 3 minuti | attira tutte le anime della mappa |
| Reliquiario | élite (1), Seth (2) | sempre | 1 potenziamento (75%) o 3 (25%) di ciò che possiedi; se è tutto al massimo, +40 salute |

Pane, calamita e reliquiari si raccolgono a 40 px dal personaggio, sono disegnati sopra il buio e ingranditi × 3; i reliquiari fuori schermo hanno un segnale lampeggiante sul bordo (`src/data/oggetti.ts`).

Lumen (le anime): tre dimensioni che pulsano con 4 fotogrammi, nei colori delle stelle scelti da Edoardo: rosso sotto 6, ambra da 6 a 19, azzurro da 20 in su. Si disegnano grandi il doppio (*da rivedere*: a grandezza naturale erano troppo piccole sul S25). Un'anima che cade entro 56 px da una ferma si unisce a lei, come in Vampire Survivors: il valore si somma e la gemma cambia dimensione e colore (era 28; 56 confermato da Edoardo l'11/11; nel LAB, scheda Eventi, si prova anche 28, 40 e 72 px). Si unisce solo se quella ferma non è più lontana di lei dal personaggio: altrimenti resta dove è caduta, così il valore non si allontana mai da chi lo raccoglie (regola confermata da Edoardo l'11/11). Nel raggio di raccolta volano verso il personaggio a 420 px/s, accelerando di 900 px/s al secondo; sono raccolte a 24 px (`src/data/progressione.ts`). Al massimo 320 anime a terra: oltre, la nuova nasce comunque dove muore il nemico e prende il posto e il valore dell'anima più lontana dal personaggio. Una freccia ai bordi dello schermo indica i reliquiari fuori vista.

## 8b. Fiaschetta e Grazia (`src/data/sopravvivenza.ts`)

- **Fiaschetta di lumen**: 3 sorsi all'inizio della notte (anche il massimo). Un sorso cura il 35% della salute massima in 1 s; si beve con il pulsante accanto all'anello dell'abilità o con il tasto F, solo se non si ha la salute piena e non si sta già bevendo. Un'élite uccisa ridà 1 sorso, Seth riempie la fiaschetta. Il pulsante è tondo, con la stessa cornice dell'abilità e la fiala dentro (composto dal codice, *da rivedere*, finché non c'è `Fiaschetta_Lumen_Tonda_V1`); su computer e tablet sta a destra dell'abilità, staccata di 12 pixel disegnati. I sorsi si leggono sulle tacche intorno al pulsante, una per sorso massimo (fino a 5 con la Lacrima di lumen): accese se piene, scure se vuote, con un lampo di 0,25 s quando un sorso si riempie (*da rivedere*). La fiaschetta diventerà uno sblocco con la sua questline (vedi [lore.md](lore.md) e [roadmap.md](roadmap.md)).
- **Grazia**: scatta uscendo da un cerchio rosso di Seth quando mancavano al massimo 0,25 s al colpo, o lasciandosi sfiorare da una falce spettrale (entro 30 px oltre il bordo) senza esserne toccati. Dura 3 s: +30% danno, +15% velocità, il personaggio lampeggia di chiaro (10 volte al secondo). Un'altra schivata perfetta la rinnova; una Grazia nuova non accorcia mai quella in corso.
- **Grazia a tacche** (decisione di Edoardo del 10/11, tutti i valori *da rivedere*; vale per tutti i personaggi, senza amuleti). Ogni nemico normale (né élite né Seth) sfiorato entro 16 px oltre il contatto, senza toccarlo, dà una tacca; lo stesso nemico non più di una volta ogni 2 s. Con 8 tacche parte una Grazia di 2 s; durante la Grazia le tacche non salgono; senza sfiorare ne cala una ogni 2 s. La schivata perfetta su Seth dà subito la Grazia di 3 s, come sopra. A ogni tacca un suono secco e una piccola scintilla (segnaposto dal codice). **Indicatore** (scelta di Edoardo del 10/11): un rettangolo sotto la barra della salute, largo e alto come lei (ne condivide il bordo di sotto), diviso in tante caselle quante sono le tacche (8, con la Danza macabra 4), senza cifre; si vede sempre. Tutto a pixel disegnati interi: la barra è larga 41, con un bordo scuro da 1 pixel a ogni lato, sopra e sotto; dentro 39: 8 caselle da 4 e 7 stacchi da 1 (8 × 4 + 7 = 39); con la Danza macabra 4 caselle da 9 e 3 stacchi da 1 (4 × 9 + 3 = 39). Caselle piene azzurre, vuote blu notte (colori *da rivedere*: diversi dal rosso, dall'ambra e dal verde della barra e dai colori dei personaggi); in Grazia tutte piene. La parte della notte passata in Grazia si legge nella pausa (Build → Statistiche, «In Grazia») e nella schermata di fine («In Grazia il N% della notte»). La Campanella d'argento allunga lo sfioramento di 8 px per livello.

## 8c. Affinità, stati e reazioni (`src/data/stati.ts`)

Ogni arma e ogni abilità ha un'affinità. **Regola del gioco dal 10/11 (Stati certi, decisione di Edoardo; numeri in `STATI_CERTI`, tutti *da rivedere*): ogni colpo lascia sul nemico lo stato della sua affinità**, per 3 s. Le armi a zona (Turibolo, Acqua santa, Velo funebre) e le abilità speciali feriscono ogni 0,3 s come prima, ma lasciano il loro stato sullo stesso nemico al massimo una volta ogni 1 s (ritmo delle zone, `STATI_CERTI.ritmo`); i colpi diretti non hanno limite; le chiazze che bruciano non lasciano stati. Gli stati hanno un loro generatore del caso, così non cambiano carte, comparse e drop. Sopra la testa di bruti, élite e Seth compare il simbolo dello stato, grande il doppio dei suoi 11×11 pixel: sole giallo, croce bianca e oro, teschio viola, lapide grigio terra (la lapide resta anche durante l'Interramento). Sui nemici comuni lo stato funziona lo stesso, ma senza simbolo. Niente cambi di colore né intermittenza; al massimo 40 simboli sullo schermo (*da rivedere*), con questa precedenza: prima Seth, poi le élite, poi i bruti più vicini al personaggio.

| Affinità | Armi e abilità | Stato | Effetto |
| --- | --- | --- | --- |
| Luce | Lanterna, Candela, Lama di luce, Cerchio di luce | Abbagliato | subisce +15% danno |
| Sacro | Turibolo, Acqua santa, Campana, Benedizione | Consacrato | va più lento del 25% (Seth a metà) |
| Ombra | Bastone, Fuoco fatuo, Falce, Rito proibito | Maledetto | perde il 2% della salute massima al secondo (élite 40% di questo, Seth 10%) |
| Terra | Pala, Sepoltura | Sepolto | resta fermo 0,6 s; poi per 4 s non può esserlo di nuovo |

**Devozione** (proposta di Edoardo dell'11/11, `DEVOZIONE` in `src/data/stati.ts`, valori *da rivedere*): più armi della stessa affinità possiedi, più forte è il suo stato. Grado 1 = 1 arma (o nessuna: lo stato viene da un'abilità, un amuleto o altro), grado 2 = 2 armi, grado 3 = 3 o più. Lo stato lasciato dall'abilità speciale prende il grado della sua affinità ma non conta come un'arma in più (lettura di Claude, *da rivedere*).

| Stato | Grado 1 | Grado 2 | Grado 3 |
| --- | --- | --- | --- |
| Abbagliato, danno subito in più | 15% | 20% | 25% |
| Consacrato, rallentamento | 25% | 32% | 40% |
| Maledetto, salute al secondo | 2% | 3% | 4% |
| Sepolto, fermo | 0,6 s | 0,8 s | 1,0 s |
| Reazione che consuma lo stato | ×1 | ×1,25 | ×1,5 |

Il Maledetto mantiene le riduzioni di sempre per élite e Seth. Il moltiplicatore della reazione usa il grado dello stato che il nemico aveva già (quello consumato) e vale per il danno di Eclissi ed Esorcismo, le anime in più della Rivelazione, il fermo e il danno in più dell'Interramento. Un'arma nuova che alza il grado lo dice sulla sua striscia («Devozione Luce 2 › 3»); la pausa (scheda Stati) mostra per ogni stato il grado, quante armi, l'effetto con la forza di adesso e il moltiplicatore delle reazioni. Con «Stati a caso (vecchi)» tutto resta al grado 1.

**Riti** (proposta di Edoardo dell'11/11, `RITI` in `src/data/stati.ts`, valori *da rivedere*): quando non resta nulla da potenziare il pane continua a prendersi da solo, ma ogni 3 di questi livelli si apre invece la scelta dei Riti («I Riti»): una carta per ogni affinità delle armi che hai, al massimo 3 (a caso se sono di più). Ogni Rito dà +8% alla forza dello stato di quella affinità e +8% alle reazioni che lo consumano; senza fine, si sommano, fino ai tetti qui sotto. Nella pausa (Stati) si legge quanti Riti hai per affinità. Il bot sceglie il Rito dell'affinità con più armi. Con «Stati a caso (vecchi)» i Riti non si aprono.

**Tetti** (decisione di Edoardo dell'11/11, `DEVOZIONE` in `src/data/stati.ts`, valori *da rivedere*): con Devozione e Riti il rallentamento del Consacrato non supera il 60% e il Maledetto non toglie più del 5% della salute massima al secondo; le riduzioni per élite, Seth e Mietitore si applicano dopo il tetto (un'élite al tetto perde il 40% del 5%). Durante l'Interramento che ha consumato l'Ombra la maledizione raddoppia il valore già al tetto (lettura di Claude, *da rivedere*). Nella pausa (scheda Stati) uno stato arrivato al tetto dice «(al massimo)».

Due stati diversi sullo stesso nemico si consumano e fanno una reazione. Con la regola del gioco:
- **quiete**: dopo una reazione il nemico non può reagire di nuovo per 3 s; gli stati li riceve lo stesso;
- le **abilità speciali** ignorano la quiete (e il ritmo delle zone): il loro primo scatto fa reagire tutti i nemici nel cerchio che hanno uno stato diverso;
- anche i colpi della **Lama di luce** ignorano la quiete, ogni volta (decisione di Edoardo dell'11/11; `RUOLI.lamaIgnoraQuiete`);
- **Eclissi** (Luce + Ombra): esplosione di 64 px; danno = 10% della salute massima, senza tetto, su nemici normali e bruti; su élite e Seth il doppio del danno del colpo che la innesca (se non c'è un colpo, come con Lucciola e Martire, 80);
- **Rivelazione** (Luce + Sacro): +50% anime arrotondato per difetto, una volta per nemico, solo ai nemici che valgono almeno 2 anime;
- **Esorcismo** (Sacro + Ombra): 3 fiammelle, ognuna al 60% del danno del colpo che la innesca (senza colpo, 18 danni); le fiammelle non lasciano stati, quindi niente reazioni a catena;
- **Interramento** (Terra + qualsiasi): fermo 1,5 s e +30% danno subito (Seth a metà durata), più un effetto dallo stato consumato: Luce, +50% danno subito invece di +30%; Sacro, fermo 2,5 s; Ombra, la maledizione continua al doppio durante l'Interramento;
- **disegno**: sui nemici comuni il nome della reazione non compare; al massimo 12 cerchi delle reazioni sullo schermo (oltre, la reazione avviene senza disegno).

**Stati a caso (vecchi, solo per confrontare).** Un interruttore del Laboratorio (scheda Eventi, «Stati a caso (vecchi)», spento di partenza; per il bot `?stati=caso`) torna alla regola di prima: lo stato resta 3 s, nel 10% dei colpi (5% per nubi, pozze e abilità, che feriscono ogni 0,3 s), senza quiete né ritmo, e le reazioni valgono così:

| Stati | Reazione | Effetto |
| --- | --- | --- |
| Luce + Ombra | Eclissi | esplosione di 64 px; danno = 10% della salute massima del nemico, al massimo 80 (Seth sempre 80) |
| Luce + Sacro | Rivelazione | il nemico lascia il doppio delle anime (una volta sola per nemico) |
| Sacro + Ombra | Esorcismo | dal nemico partono 3 fiammelle che inseguono i vicini (18 danni l'una) |
| Terra + qualsiasi | Interramento | fermo 1,5 s e +30% danno subito (Seth a metà durata) |

Ruoli delle armi: l'esplosione del dardo del Bastone ferisce in 40 px al 35% del danno; il Fuoco fatuo insegue per primi élite e Seth (li vede 4 volte più vicini); ogni uccisione della Falce allunga la lama del 2% per 5 s (al massimo +30%); il fendente della Lama di luce segue la direzione in cui cammini; il secondo rintocco della Campana (livello 8) ferma i nemici per 0,6 s. I cerchi delle reazioni sono disegnati dal codice a retino finché Edoardo non disegna i suoi.

La **scelta dei doni** è fatta di strisce orizzontali una sotto l'altra (`src/sistema/scheda.ts`, parole in `src/data/spiegazioni.ts`): nome, numeri grandi che cambiano («Danno 24 › 32»), il simbolo dello stato che lascia l'arma con il suo effetto, la reazione che si otterrebbe con un'arma già posseduta. Gli amuleti mostrano i grani dopo averli presi, vantaggio in verde, rovescio in rosso e l'avviso di Peccato se si sfora. Quando scatta una reazione il suo nome sale sopra il nemico, ingrandito × 2, nel colore dello stato con il contorno scuro: Eclissi viola, Rivelazione oro, Esorcismo ambra, Interramento seppia. Lo stesso nome torna al massimo ogni 2 s, al massimo 3 nomi sullo schermo insieme (oltre non si creano: la reazione avviene lo stesso). Il nome resta fuori da 90 px intorno al personaggio, spostandosi sopra quel cerchio, e dentro lo schermo (*da rivedere*). Stati e reazioni si leggono nella scheda **Stati** della pausa, che si apre anche dal «?» della scelta dei doni.

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
- **Peccato**: se i grani usati superano quelli che hai, il danno subito raddoppia, finché non spegni un amuleto. Dalla scheda Rosario della pausa si tocca un amuleto per accenderlo o spegnerlo. In partita, sotto la Cera: «Rosario 2/3» (in rosso «Peccato 5/3»).
- **Sblocco**: nella Cappella, con l'impresa «Sopravvivi 8 minuti» oppure con 300 Cera. Salvato nel salvataggio. *Da rivedere:* i 3 grani di partenza e il Peccato ×2 (valori predefiniti di Claude).
- **Gli amuleti** (vantaggio / rovescio):

| Amuleto | Grani | Vantaggio | Rovescio |
| --- | --- | --- | --- |
| Specchio rotto | 3 | +1 proiettile, nube, fiala, fuoco o falce per tutte le armi | subisci +25% danno |
| Lanterna cieca | 2 | +35% danno | alone di luce al 15%: quasi spento |
| Cuore avido | 2 | +30% anime | pane e fiaschetta curano la metà |
| Sangue freddo | 1 | sotto il 30% di salute, +40% danno | nessuno |
| Martire | 2 | ogni colpo subito libera un'onda sacra di 150 px: non ferisce, lascia Consacrato e ferma i nemici per 0,6 s (Seth a metà) (*da rivedere*) | −20% salute massima |
| Danza macabra | 2 | bastano 4 tacche per la Grazia (*da rivedere*) | la Grazia delle tacche dura 1,5 s invece di 2 (la schivata perfetta su Seth resta di 3 s) |
| Ceri gemelli | 2 | l'abilità speciale ha 2 cariche | ricarica +10% (*da rivedere*) |
| Lucciola | 2 | alone di luce +20%; un nemico è abbagliato quando entra nell'alone, non più di una volta ogni 4 s (*da rivedere*) | nessuno |
| Ossa d'élite | 2 (*da rivedere*) | le élite lasciano 2 reliquiari | le élite hanno +40% salute |
| Patto di sangue | 2 | ogni uccisione cura 0,2 di salute | non puoi più usare la fiaschetta |

- **Icone**: grani colorati disegnati dal codice (`src/sistema/amuleti.ts`), finché Edoardo non disegna `Icona_Amuleto_<id>`.

## 8f. Le Unioni (`src/data/unioni.ts`)

Un'arma al livello 6 più il suo dono al livello massimo (decisione di Edoardo del 10/11; il 6 è *da rivedere*): il reliquiario successivo offre l'unione come prima striscia. L'arma tiene i suoi numeri, guadagna un effetto e continua a salire fino al livello 8. Una sola unione per reliquiario; con l'unione gli amuleti offerti scendono a 2, per restare a quattro strisce.

| Arma | + Dono | Arma unita | Effetto |
| --- | --- | --- | --- |
| Lanterna | Stoppino lungo | Faro dei morti | l'arco diventa un cerchio; abbaglia un nemico su due |
| Pala | Scudo di ferro | Vanga del custode | ogni colpo pianta una lapide: chi è sotto resta fermo 1,5 s (Seth a metà); poi la Vanga non può fermarlo di nuovo per 4 s, la stessa pausa del Sepolto, che vale per tutti e due (*da rivedere*) |
| Turibolo | Erbe amare | Incensiere dell'ultima ora | dentro le nubi +1 salute al secondo (non si somma tra nubi); i nemici dentro le nubi rallentano almeno del 50%, in tutto non più del 60%, il tetto del Consacrato (decisione di Edoardo dell'11/11, *da rivedere*) |
| Bastone | Clessidra | Verga dei nomi | ogni 5ª raffica colpisce tutti i maledetti sullo schermo, con il danno di un dardo |
| Candela | Cuore di cera | Candelabro funebre | le fiammelle lasciano una scia: una fiamma ogni 0,12 s, 36 px, 1 s, 40% del danno ogni 0,3 s; la scia è di Luce e lascia Abbagliato a chi la attraversa (con il ritmo delle zone, una volta ogni 1 s) |
| Falce | Sale nero | Falce di Seth | uccide i nemici normali sotto il 15% di salute, i maledetti sotto il 30% (non élite e Seth; conta lo stato che il nemico aveva prima del colpo, perché la Falce stessa maledice: lettura di Claude, *da rivedere*) |
| Campana | Cera votiva | Campana a morto | ogni rintocco ferma per 0,8 s |
| Fuoco fatuo | Calamita | Fuochi erranti | i fuochi raccolgono le anime entro 120 px |
| Acqua santa | Lacrima di lumen | Acquasantiera | ogni 40 uccisioni nelle pozze torna un sorso, al massimo uno ogni 45 s; con la fiaschetta piena il sorso si versa nella pozza dove è morto il nemico, che per 4 s cura il 3% della salute massima al secondo a chi ci sta dentro (non si somma con altre pozze; pozza tinta d'oro, disegno provvisorio dal codice) (*da rivedere*) |
| Lama di luce | Ali di falena | Lama dell'alba | un secondo fendente parte da dove eri 0,5 s prima |
| Sampietrini | Scudo di ferro | Selciato | un sampietrino che colpisce un nemico fermo (Sepolto, Interrato o fermato) rimbalza 1 volta in più, una sola volta per sasso (*da rivedere*) |
| Lapide | Chiodo di bara | Lapide inchiodata | la lapide resta a terra 3 s invece di 0,5 e seppellisce chi la tocca (entro 36 px dal punto di caduta, misura di Claude), con la pausa di 4 s del Sepolto; se il nemico ha già un altro stato fa l'Interramento (*da rivedere*) |
| Rosario spezzato | Specchio | Rosario dei vespri | quando un nemico già maledetto prima del colpo muore colpito da un grano, da lui riparte un grano nuovo con i rimbalzi del livello; 1 ripartenza per lancio, niente catene (*da rivedere*) |
| Corvo | Calamita | Stormo del lutto | i corvi beccano per primi i nemici che con la Luce fanno una reazione: consacrati, maledetti o sepolti, fuori dalla quiete (la quiete è una lettura di Claude, *da rivedere*); se non ce ne sono, il più vicino |
| Velo funebre | Campanella d'argento | Sudario | in Grazia, finché c'è almeno un nemico dentro il velo la Grazia non scade, fino a 6 s in tutto dall'inizio della Grazia; il velo si tinge d'oro chiaro mentre la tiene (disegno provvisorio) (*da rivedere*) |

Le quattro Unioni di Lapide, Rosario spezzato, Corvo e Velo funebre sono dell'11/11 (nomi ed effetti di Edoardo). Due doni aprono due Unioni: lo Scudo di ferro (Vanga del custode e Selciato) e la Calamita (Fuochi erranti e Stormo del lutto). **Sblocco**: si sbloccano con l'impresa «Sconfiggi Seth», con qualsiasi personaggio, anche in una veglia persa (`SBLOCCO_UNIONI`, decisione di Edoardo del 10/11); la Cappella dice come e non le vende. Chi le aveva già sbloccate le tiene. Le Unioni **si svelano giocando**, in tre passi:
- **Non scoperta**: nessun testo la nomina, nemmeno le strisce dei doni.
- **Scoperta**, quando arma e dono arrivano ai livelli dell'unione: arma al 6, dono al suo massimo. La partita si ferma per un'**animazione** a tutto schermo (`src/sistema/rivelazione.ts`, tempi in `RIVELAZIONE`, `src/data/hud.ts`, segnaposto dal codice, *da rivedere*): arma e dono si avvicinano, un lampo a retino, compaiono l'Unione, il nome e la ricetta. Dopo la comparsa l'Unione resta sullo schermo finché il giocatore non tocca, clicca o preme Spazio (nessuna chiusura a tempo; Spazio in quel momento non usa l'abilità); in basso al centro un avviso lampeggiante, 1 s a ciclo, dice come chiuderla («Tocca per chiudere» sul telefono, «Clicca o premi Spazio per chiudere» su computer); aprire la pausa la salta. Da allora le strisce la nominano e, nelle notti dopo, la Build della pausa la mostra con nome, ricetta e stato («Pronta», «Manca» o «Unita») se hai l'arma in mano. L'effetto non si legge ancora, se non sulla carta del reliquiario.
- **Unita** almeno una volta: resta per sempre nella scheda Stati, in ogni notte, con come si combina e che cosa fa.

Scoperte e unite si ricordano sul dispositivo. Icone provvisorie: l'icona dell'arma con quattro angoli d'oro.

## 8g. Oggetti rompibili (`src/data/rompibili.ts`)

**Prova: tutti i valori sono *da rivedere*.** Urne, giare e lanterne stanno sparse a caso, in posti diversi a ogni notte. Il mondo è diviso in settori di 700×700 px, circa uno schermo di telefono: ogni settore ha una sola estrazione, ad almeno 110 px dal bordo e ad almeno 320 px dal punto di partenza. Sono attivi i settori entro 2 da quello del personaggio.

| Oggetto | Per settore | Cosa lascia | Luce |
| --- | --- | --- | --- |
| Urna | 24% | nulla; dopo la prima alba, al 26%, un frammento di vetro (*da rivedere*), al massimo 3 a notte | no |
| Giara | 24% | 2 gocce di Cera | no |
| Lanterna | 12% | chiazza d'olio | sì |
| Niente | 40% | | |

Si rompono se il personaggio arriva a 34 px o se li colpisce un'arma: archi, impatti, rintocchi, fendenti, nubi, pozze, proiettili, falci, lapidi, grani e corvo, anche senza nemici vicini, ma **solo quando si vedono**: fuori dal campo visibile i colpi non li toccano. Un oggetto rotto non torna in quella notte. La lanterna intera apre un foro nel buio pieno fino a 120 px e scalda il terreno fino a 170 px; rotta, si spegne.

**Chiazza d'olio**: raggio 96 px, dura 12 s, rallenta del 40% i nemici dentro (Seth la metà). Non tocca il personaggio. Candela e Fuoco fatuo la accendono passandoci sopra: brucia per 5 s al posto dell'olio che resta, 14 danni ogni 0,4 s (più i bonus di danno), e fa luce come una lanterna. Disegni provvisori dal codice.

**Frammenti di vetro**: escono solo **dopo la prima alba vinta**, dal 26% delle urne (*da rivedere*), al massimo 3 a notte, quindi il mosaico si completa una volta sola; quando un'urna ne contiene uno compaiono un anello di luce, una piccola scossa e il suono del vetro. Volano verso il personaggio come la Cera. Ognuno ha un colore a caso (rosso, verde o blu scuro) ed è un pezzo del **mosaico** della Veglia (`src/sistema/mosaico.ts`, tempi in `MOSAICO`, `src/data/hud.ts`, *da rivedere*): a ogni frammento il mosaico compare al centro in alto, sotto la fascia, con sotto solo «1/3», «2/3» o «3/3»; il pezzo nuovo si accende a retino in 0,5 s (prima il cimitero, poi le mani, per ultima la fiamma con le stelle), resta fino a 2 s ed esce a retino in 0,3 s. Non ferma il gioco e non prende i tocchi. Le parti non trovate restano un'ombra scura. Al terzo frammento il mosaico intero si illumina per 1,8 s e parte il **Bagliore** (*da rivedere*, `BAGLIORE`, `src/data/sopravvivenza.ts`): per 20 s non si subisce danno, chi tocca il personaggio brucia (élite e Seth no), si corre il 30% più veloce e la luce è grande una volta e mezza; lo sprite lampeggia d'oro, più in fretta negli ultimi 3 s. Il bot delle simulazioni gioca senza rompibili, quindi olio e frammenti non sono misurati.

## 9. Esperienza e doni

- Anime per passare dal livello L al successivo: 2 + 3 L + L²
  - Valori: livello 1: 6 · livello 5: 42 · livello 10: 132 · livello 20: 462 · livello 40: 1722 · livello 60: 3782.
- Ogni livello mostra 3 carte casuali. Pesi:
  - arma posseduta 1,5 (l'arma iniziale 2)
  - arma nuova 1
  - dono posseduto 1,2
  - dono nuovo 0,9
- 2 rimescolate per partita (più quelle del Cero della scelta). Se non resta nulla da potenziare la scelta non si apre: «Pane e vino» (+40 salute) si prende da solo, una volta per livello (ma ogni 3 di questi livelli si apre la scelta dei Riti, sezione 8c), con una scritta verde «Pane e vino +40 salute» che sale sopra la testa e il suono della cura (scritta *da rivedere*).

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
  - altezza calcolata per ogni telefono: area sicura (la più grande tra `env()` e Capacitor, fissata 1,5 s dopo l'apertura, *da rivedere*: le barre di sistema temporanee non spostano niente) + contenuto. Sul Galaxy S25 (area sicura in alto 105 pixel fisici, in basso 0): fascia alta 81 pixel disegnati (324 fisici), fascia bassa 94 (376 fisici), campo 540×820 pixel di gioco. Un pixel disegnato vale 4 pixel fisici;
  - fascia alta: stemma del livello ed esperienza; sotto, la riga dell'orologio e della barra rossa di Seth, con dentro «salute rimasta/massima». Gli avvisi non stanno nella fascia ma nel campo, subito sotto;
  - fascia bassa: fiaschetta nell'angolo a sinistra e abilità nell'angolo a destra, scambiabili dal LAB, con cornice rotonda uguale; l'abilità tiene l'anello continuo della ricarica, con sopra l'icona i secondi che mancano finché non c'è nessuna carica (*da rivedere*: grandezza 16) e, con più cariche (Ceri gemelli), anche una tacca per carica; pausa piccola al centro, senza area di tocco invisibile (*da rivedere*). Il joystick può nascere anche nella fascia bassa;
  - fuori dall'HUD di partita: anime, Cera, Rosario e griglia degli oggetti, che stanno nella pausa e nella schermata di fine;
  - segnali sul bordo del campo: salute bassa (rosso che pulsa), Peccato (cornice viola a retino), reliquiario fuori vista (freccia al confine con le fasce);
  - joystick con base più piccola, sempre centrata sotto il dito. Il tocco non inizia mai su un pulsante; se la base copre fiaschetta, pausa o abilità si disegna sopra di loro, mezza trasparente (*da rivedere*), solo finché il dito trascina, e i pulsanti coperti non ricevono il tocco.
- **HUD su computer, tablet e telefono in orizzontale** (invariato):
  - in alto: barra dell'esperienza, armi e doni con il loro livello, livello e anime; l'orologio sta nella colonna di destra, sotto anime e Cera, dove le caselle non arrivano mai (*da rivedere*);
  - barra di Seth quando c'è: rettangolo rosso con «salute rimasta/massima» al centro;
  - in basso a sinistra: l'abilità speciale con la ricarica circolare; in basso a destra: la pausa.
- **Feedback**:
  - numeri del danno, bianchi; in ambra solo i critici, la somma del danno delle reazioni e il numero sommato su élite e Seth;
  - il personaggio lampeggia quando viene colpito;
  - leggero tremolio dello schermo;
  - bordo rosso quando la salute è bassa;
  - avvisi (orde, Seth, reliquiari): niente cartiglio, solo scritte semplici su fondo scuro, una sotto l'altra al centro: il titolo in Tiny5 e la riga sotto in Jersey 10. Sul telefono in verticale stanno nel campo, 6 pixel sotto la fascia alta, grandi un ingrandimento in più dell'HUD (*da rivedere*). Su computer e tablet stanno sotto barre e caselle, ridotte a 0,5 volte, arrotondate a un ingrandimento intero e mai sotto × 2: sui telefoni piccoli restano leggibili; non scendono mai sul personaggio: se le caselle sono tante, salgono sopra di loro. Durano 3 s, compresi 0,3 s di dissolvenza a retino (*da rivedere*).
- **Gesti e tasto Indietro** (provati da Edoardo sul Galaxy S25, nessuna esclusione dei gesti):
  - Indietro apre la pausa e basta; dentro la pausa chiude solo la finestra di conferma di Abbandona, non cambia scheda e la partita riparte solo toccando il pulsante; dalla fine torna al menu; nei menu resta com'era. Vale per APK e link;
  - nell'APK, dai bordi laterali: il primo gesto mostra le barre di sistema, il secondo mette in pausa;
  - nell'APK, dal basso verso l'alto: l'app va in secondo piano; riaprendola la partita è in pausa, finché Android non chiude l'app;
  - nel link in Home e in Chrome la partita aggiunge una sola voce alla cronologia (`src/sistema/indietro.ts`), dopo il primo tocco: prima di quel tocco Indietro lascia la pagina;
  - nel link, chiudere la scheda fa perdere la partita (vedi la tappa «Salvataggio della partita in corso» in [roadmap.md](roadmap.md)).
- **Audio** (sintetizzato dal codice): colpo, sparo, anima con tono che sale nelle serie, danno subito, campana, livello, reliquiario, Seth, cura, speciale. Da sostituire con suoni veri (vedi [roadmap.md](roadmap.md)).
- **In partita** (computer e tablet; sul telefono vedi sopra): HUD in alto con livello, orologio, anime, Cera, Rosario, icone di armi e doni con il livello, barra di Seth; avvisi «Lo sciame» (ti circonda), «Seth» (il Rinnovato è venuto per te), «Reliquiario» (…); pausa con il pulsante in basso a destra, P o Esc, Indietro su Android e quando l'app va in secondo piano; M accende e spegne i suoni; 1-2-3-4 scelgono la striscia del dono; F beve dalla fiaschetta; Spazio usa l'abilità.
- **Pausa e scelte**: sul telefono in verticale le scelte di doni e reliquiari stanno dentro il campo e non sbordano sulle fasce. Il pulsante della pausa resta visibile e premibile sopra lo strato delle carte; la pausa si apre sopra la scelta di doni e reliquiari e chiudendola si ritrova la stessa scelta, con le stesse carte. Fiaschetta, abilità e pausa rispondono anche a un secondo dito, mentre l'altro tiene il joystick.
- **La pausa** (`src/sistema/pausa.ts`, misure in `PAUSA`, `src/data/hud.ts`): è il posto dove si legge tutta la partita.
  - **Striscia fissa in alto**: tempo, livello, Anime, Cera, Uccisi, Rosario (da quando è sbloccato; in rosso «Peccato» se si sfora), Frammenti «2 di 3». Sopra una scelta compare la riga «Un dono in attesa» o «Reliquiario in attesa».
  - **Schede**: Build, Rosario, Stati, Opzioni. Sul telefono in verticale stanno in basso e arrivano fino al pulsante della pausa, con Riprendi sopra di loro: il secondo tocco di una doppia pressione cade su una scheda. Su computer e tablet sono una colonna a sinistra, con Riprendi sotto e la pagina a destra; i tasti 1-2-3-4 cambiano scheda. La pagina scorre al suo interno.
  - **Build**: 6 caselle armi e 6 doni con i posti vuoti visibili; toccandone una il dettaglio (livello, numeri, che cosa fa, stato che lascia, unione) sta in un riquadro fisso. Poi le **statistiche vere del personaggio** con doni, ceri e amuleti già contati: salute, salute al secondo, danno, danno subito, attesa colpi, area, colpi extra, durata zone, critico, velocità, raccolta, anime, sorsi. Attesa colpi, Colpi, Colpi extra e Durata zone (*da rivedere*) valgono in tutta la pausa; le strisce dei doni tengono Ricarica, Quantità e Durata (scelta di Edoardo). Poi le Unioni (§8f), con quante ne sono state scoperte.
  - **Rosario**: grani, avviso di Peccato, ogni amuleto con vantaggio, rovescio e interruttore. La scheda non c'è prima dello sblocco.
  - **Stati**: prima gli stati che lasciano le armi e l'abilità, poi gli altri; le reazioni possibili con la build stanno in alto, accese. In fondo le Unioni fatte almeno una volta, per sempre (§8f).
  - **Opzioni**: Suoni, Vibrazione, Abbandona. Abbandona apre una piccola finestra di conferma sopra tutto: la Cera raccolta nella notte va persa.
  - **Si apre** sull'ultima scheda usata nella notte, sul Rosario se si è in Peccato o sopra un reliquiario. Il «?» della scelta apre Stati. Spegnendo un amuleto sopra una scelta, le carte mostrano i grani nuovi, con le stesse carte, senza consumare rimescolate.
- **Schermate**: selezione del personaggio con le schede, scelta del dono, pausa (vedi sopra), fine partita (tempo, livello, anime, danno, build). Il record di tempo si salva sul dispositivo.

### Mondo, luce e comandi (`src/data/mondo.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Pixel di gioco da vedere | 700 in verticale, 610 in orizzontale | `src/sistema/pixel.ts`; si sceglie la scala intera più vicina, quindi sui telefoni se ne vedono un po' meno (circa 585 sul lato corto) |
| Raggio della luce | 260 | oltre comincia il buio a retino |
| Sfumatura del buio | 1,5 | più alto = buio più rapido |
| Buio massimo | 88% dei pixel | nel buio più fitto il terreno si intravede ancora |
| Centro della luce | 42 px sopra i piedi | |
| Tremolio della fiamma | ±7 px ogni 0,12 s | |
| Frequenza dello schermo | logica sempre a 60 passi al secondo, il disegno segue lo schermo | nessun limite del gioco: a 60, 90 e 120 Hz la notte è identica (`npm run prova`) |
| Prova prestazioni | minuto 14, 400 nemici, lanterna in vista, 6 armi al livello 8, 60 s; la notte si ferma a 14:30; a fine prova misura a parte la ricostruzione del buio; lanciata da una partita chiede conferma, la chiude, torna al menu e parte da lì; il risultato dice quanti nemici c'erano in media durante la misura. Con «Con effetti» (LAB → Schermo) durante la misura partono a ripetizione la Sepoltura (ogni 5 s), la Pozza (ogni 2 s, nella misura già in memoria, se no la più grande) e 3 Eclissi al secondo, senza ferire: pixelfx o di sempre secondo gli interruttori «Effetti pixelfx» e «Sepoltura pixelfx», e il risultato dice quali (`PRESTAZIONI.effetti`, *da rivedere*) | `PRESTAZIONI`; riporta media, fotogrammi saltati, secondi sotto 55 fps e blocchi sopra 100 ms; obiettivo sul telefono minimo: media 60, meno dell'1% dei secondi sotto 55, nessun blocco sopra 100 ms (*da rivedere*) |
| Terreno | riquadro di 1120 px che si ripete, celle di 56 px | tombe 4%, croci 2%, erba 24% per cella |
| Joystick | raggio 44 px dello schermo, zona morta 18% | compare dove si appoggia il dito; sul telefono in verticale base da 56 pixel disegnati, opacità 50% quando copre un pulsante (*da rivedere*) |

### Nemici in campo (`src/data/nemici.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Dove nascono | 48 px fuori dal bordo dello schermo | |
| Ricollocamento | oltre 2,2 × 48 px fuori dallo schermo | torna davanti al giocatore, entro ±0,7 radianti dalla direzione in cui cammina |
| Separazione tra nemici | forza 0,5; si toccano sotto il 75% della somma dei raggi | i fantasmi attraversano gli altri |
| Sprite segnaposto V0 | ingranditi × 2 | disegnati per personaggi di 34 px |
| Barra della salute | rettangolo rosso 41 × 9 pixel, 5 px sotto i piedi (larghezza decisa da Edoardo il 10/11 sera: 1 di bordo per lato, dentro 39) (si allarga se i numeri non ci stanno), con «salute rimasta/massima» in cifre bianche; danno e cura scorrono in 0,5 s (mai più lenti del 30% della salute massima al secondo): il pezzo perso resta ambra e si consuma, quello guadagnato è verde e il rosso lo riempie; i numeri seguono. La barra di Seth fa lo stesso | decisa da Edoardo: sotto il personaggio, non in alto; rettangolo semplice con i numeri (10/11). Misure e colori *da rivedere* (`src/data/mondo.ts`) |
| Lampo quando sei colpito | 0,1 s | bianco pieno |
| Dalla morte alla schermata di fine | 0,9 s | il personaggio lampeggia e sparisce |

**Prova «pochi e forti» (12/11, solo per confrontare).** Due interruttori del Laboratorio (scheda Eventi, spenti di partenza; per il bot `?pochi=1` e `?schermo=1`). «Pochi e forti»: nemici massimi in campo e comparse al secondo divisi per 3, salute e Lumen dei nemici comuni × 3; orde, élite e Seth come sempre (`POCHI_E_FORTI`). «Armi solo nello schermo»: le armi non colpiscono, non lasciano stati e non mirano ai nemici fuori dal campo visibile (lo schermo senza le fasce dell'HUD). Spenti, la notte è quella di sempre. Risultati in [bilanciamento.md](bilanciamento.md), 12/11.

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
| Anime a terra | Lumen V2 ingranditi × 2 | |
| Effetti pixelfx (Pozza ed Eclissi di serie; Sepoltura spenta) | Sepoltura (spenta di serie, si rifà dopo il rework del combattimento): 8 gruppi di 4 mani (104×81 px, 3,2 s) solo lungo il bordo dell'area, i piedi entro 40 px dal bordo, centro vuoto, nessun alone, partenze sfalsate lungo i 4,5 s; Pozza dell'Acqua santa: 5 misure (raggio 89, 107, 129, 155, 186 px), si usa la più vicina all'area vera e si carica solo quella (da 1,3 a 5,8 MB di memoria video; prima 18,9 MB per tutte); Eclissi: 1,1 s a 12 fotogrammi al secondo, colori originali, larga quanto il cerchio di oggi (0,9 MB di memoria video) | dalla libreria pixelfx (MIT), a retino, a grandezza naturale, 12 fotogrammi al secondo; nessun foglio di sprite oltre 2048 px per lato (`npm run asset` manda a capo i fotogrammi); Pozza ed Eclissi si spengono per i confronti da LAB → Eventi → «Effetti pixelfx», la Sepoltura si accende da «Sepoltura pixelfx». Cambiano solo il disegno, non aree, danni e tempi (`PIXELFX`, *da rivedere*) |

## Gioco a stanze (pivot, in costruzione: `src/data/stanze.ts`)

Il gioco a stanze nasce accanto al survivor e si raggiunge **solo dal link di prova** (e in sviluppo): pulsante «Stanze (prova)» del menu, LAB → Stanze → «Entra nella stanza», oppure `?stanze` nell'indirizzo. Il progetto completo è in [proposte/pivot-hades.md](proposte/pivot-hades.md); qui c'è solo ciò che esiste già nel codice. Oggi: la fetta verticale fino al passo 6 (tre stanze con porte e carte, attacco a tasto, nemici con avviso, Grazia, abilità caricata colpendo, Echi).

- **La stanza**: un pavimento rettangolare a lastre di pietra, chiuso da muri: in alto una facciata a mattoni (vista di fronte), ai lati e in basso un bordo di pietra scura. Pavimento e muri sono segnaposto disegnati dal codice (`src/sistema/stanza.ts`).
- **Grandezza**: 13 × 7 lastre, come le stanze di The Binding of Isaac (scelta di Edoardo del 12/11): la stanza intera sta più o meno in uno schermo.
- **Il Lampionaio** (l'unico personaggio della fetta) cammina con il joystick o con WASD e le frecce, alla sua velocità di sempre (245 px/s + 10%). I muri lo fermano: i suoi piedi restano dentro il pavimento, a qualche pixel dai bordi; il corpo si disegna davanti alla facciata del muro in alto.
- **Telecamera**: tiene il Lampionaio sempre al centro, come nel survivor (confermato da Edoardo il 12/11); vicino ai muri, oltre il muro si vede il fondo scuro.
- **Linea dei joystick**: una linea invisibile al centro esatto dello schermo divide i joystick (decisione di Edoardo del 12/11). Il joystick di movimento nasce solo se il dito si appoggia a sinistra della linea, e la sua base resta tutta tra il bordo sicuro dello schermo e la linea; a destra il dito non muove il personaggio (è del joystick d'attacco). LAB → Stanze → «Linea al centro» la mostra.
- **I joystick** (decisione di Edoardo del 13/11, `JOYSTICK_STANZE`, `src/sistema/joystick-stanze.ts`): disegnati dal codice, solo nel gioco a stanze (il survivor tiene quelli di Edoardo). Due personalità: il **movimento** è un anello sottile color crema con il contorno scuro e un pomello pieno color crema; l'**attacco** è un disco pieno nel colore del personaggio (più scuro dentro) con una fiammella come pomello. Base di 72 pixel disegnati (quella del survivor: 84), pomello di 28, ingranditi come il joystick del survivor. Sono trasparenti al 70%: una trasparenza vera, eccezione alla regola del retino solo per i comandi. La grandezza non si regola più.
- **Luce e buio**: gli stessi del survivor (sezione 11, «Mondo, luce e comandi»), con il tremolio della fiamma.
- **Orientamento**: in orizzontale su ogni dispositivo. Su un telefono o un tablet in verticale il gioco si ferma e compare «Ruota il telefono».
- **Pausa provvisoria**: pulsante provvisorio piccolo in alto a destra (14 pixel disegnati dal codice, ingranditi 2 volte; l'area di tocco arriva comunque a 44 punti), P o Esc, Indietro, e quando l'app va in secondo piano; il gioco dietro si oscura a retino; «Riprendi» e «Menu» (*da rivedere*: la pausa vera del gioco a stanze si progetta più avanti). M accende e spegne i suoni.

| Valore della stanza | Numero | Note |
| --- | --- | --- |
| Pavimento | 832 × 448 px | 13 × 7 lastre, alla Isaac (*da rivedere* le misure) |
| Muri | in alto 96 px, ai lati 32 px, in basso 32 px | in alto la facciata, vista di fronte |
| Bordi per i piedi | ai lati 18 px, in alto 10 px, in basso 6 px | quanto i piedi si avvicinano ai muri (*da rivedere*) |
| Lastre del pavimento | 64 px | |
| Mattoni della facciata | 32 × 16 px | sfalsati di mezzo mattone a ogni riga |
| Ombra del muro | 10 px | fascia scura sul pavimento ai piedi della facciata |

**L'attacco a tasto** (passo 3, `ATTACCO` in `src/data/stanze.ts`, `src/sistema/attacco.ts`). Il Lampionaio usa la Lanterna a mano: il colpo è l'arco di luce del survivor, davanti a lui nella direzione scelta, e ferisce ogni nemico dentro l'arco (distanze misurate tra i piedi), con un lampo bianco, il numero del danno e una piccola spinta.

- **Telefono** (stile Brawl Stars, decisione di Edoardo del 12/11): un joystick d'attacco fisso in basso a destra, nella metà destra dello schermo, grande come il joystick di movimento. Un tocco breve colpisce il nemico più vicino entro 320 px; se non ce n'è, colpisce dove guarda il Lampionaio (l'ultima direzione in cui ha camminato). Trascinando, il pomello segue il pollice fino al bordo della base, a terra compare la mira (il contorno dell'arco, color crema: l'arancione è degli avvisi a distanza) e, lasciando il dito, il colpo parte in quella direzione; tornando al centro prima di lasciare, il colpo torna automatico. Durante la ricarica il joystick si scurisce.
- **Computer**: clic sinistro verso il puntatore, J verso il nemico più vicino; il mouse non fa comparire il joystick (si cammina con WASD e le frecce) e il tasto tondo non si vede.
- Un colpo chiesto durante la ricarica parte appena la ricarica finisce. Durante il colpo il Lampionaio si gira verso il colpo e si sporge di qualche pixel (segnaposto dell'animazione `attack`, che il gioco usa da sola quando Edoardo la disegna).

| Valore dell'attacco | Numero | Note |
| --- | --- | --- |
| Ricarica | 0,45 s | la Lanterna automatica del survivor: 0,8 s (*da rivedere*) |
| Arco | raggio 136 px, ampiezza 132° | come la Lanterna al livello 1 del survivor (*da rivedere*) |
| Danno | 18 | +30% in Grazia (*da rivedere*) |
| Mira automatica | entro 320 px | tocco breve e J (*da rivedere*) |
| Posa del colpo | 0,15 s, slancio 3 px | segnaposto dell'animazione `attack` |
| Joystick d'attacco | grande come il joystick di movimento; 14 px dal bordo sicuro | area di tocco di almeno 44 punti |
| Disegno dei joystick | base 72 pixel disegnati, pomello 28, anello 3; trasparenti al 70% | movimento e attacco (*da rivedere*) |
| Trascinamento | 52 punti per la mira piena, zona morta 30% | sotto la zona morta il tocco è automatico |

**I nemici e la Grazia** (passo 4, `NEMICI_STANZA`, `ONDATA`, `COMBATTIMENTO_STANZA` e `GRAZIA_STANZA` in `src/data/stanze.ts`; `src/sistema/nemici-stanza.ts`). Tutti i numeri sono proposte di Claude, *da rivedere*.

- **Il Lampionaio si può ferire**: 100 di salute. La salute non si rigenera da sola: lo farà con oggetti o poteri che lo permettono, da inventare (decisione di Edoardo del 13/11). La barra della salute è quella del survivor, sotto i piedi. Colpito, si illumina di bianco, lo schermo trema un poco e il telefono vibra. Toccare un nemico non fa male: fa male solo un attacco con il suo avviso (confermato da Edoardo il 13/11).
- **Quiete** (decisione di Edoardo del 13/11): dopo un colpo, per un attimo non si prendono altri danni. Il Lampionaio resta in Quiete 0,5 s (lampeggia); è una sua statistica, che le carte potranno migliorare. I nemici restano in Quiete 0,3 s, ma **ogni arma ha la sua**: la Lanterna non ferisce di nuovo lo stesso nemico per 0,3 s, il Cerchio di luce sì (e viceversa). Il Cerchio di luce prova a ferire ogni 0,25 s, quindi con la Quiete prende ogni nemico ogni 0,5 s. È la stessa parola della Quiete delle reazioni (un nemico non reagisce di nuovo per 3 s), scelta di Edoardo.
- **Il Ricaduto** (segnaposto: lo Zombi del survivor) cammina dritto e lento verso il Lampionaio. A 56 px si ferma e comincia l'**avviso**: trema, lampeggia di rosso e a terra compare uno spicchio rosso davanti a lui che si riempie. La direzione è decisa all'inizio dell'avviso. Allo scadere graffia tutto lo spicchio, poi resta fermo un attimo. Battuto, resta sempre a terra 1,5 s, steso e scuro, senza segni e senza poter essere colpito (decisione di Edoardo del 13/11); poi, 2 volte su 10 (decisione di Edoardo del 13/11 sera), si rialza con metà della salute, se no sparisce. Si rialza una volta sola.
- **Il Cantore** (segnaposto: il Fantasma del survivor) resta tra 200 e 250 px dal Lampionaio: si allontana se ti avvicini, si avvicina se ti allontani. Quando ha ricaricato e sei entro 360 px si ferma, e a terra compare una **linea arancione** verso di te fino al muro (l'avviso; gli avvisi a distanza sono arancioni, quelli corpo a corpo rossi: decisione di Edoardo del 13/11): lampeggia, resta accesa nell'ultimo terzo, e davanti a lui il grumo cresce. Poi lancia un grumo di Lumen spento che **ti cerca** (decisione di Edoardo del 13/11 sera): per 1,4 s gira verso di te, ma di al massimo 100° al secondo, poi va dritto. Così non è impossibile da schivare: chi cammina si allontana più svelto del grumo (270 contro 210 px/s), e un passo di lato quando il grumo è a circa 50 px lo fa passare oltre (la schivata perfetta). Una schivata sola per grumo. Contro il muro il grumo scoppia in una **pozza di cera** a terra: un'ellisse dorata larga 52 px (alta la metà) che resta 2 s, negli ultimi 0,3 s si restringe fino a sparire, e ferisce di 6 chi ci passa sopra (il danno segue la Quiete del Lampionaio: al massimo uno ogni 0,5 s). Al massimo 16 pozze insieme (*raggio, danno e ricerca da rivedere*). Disegnata dal codice (segnaposto).
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
| Ricaduto | salute 40, velocità 60 px/s, corpo 16 px | 3 colpi della Lanterna, 2 in Grazia |
| Graffio | avviso 0,5 s da 56 px; spicchio di 72 px e 110°; danno 15; fermo 0,7 s dopo | |
| Rinascita | 20%, dopo 1,5 s a terra, con il 50% della salute | una volta sola |
| Cantore | salute 20, velocità 75 px/s, corpo 15 px, tra 200 e 250 px | 2 colpi, 1 in Grazia |
| Avviso del canto | 0,8 s entro 360 px; primo canto dopo 1,2 s; ricarica 2,4 s | |
| Grumo | velocità 210 px/s, raggio 9 px, danno 12; ti cerca per 1,4 s, al massimo 100°/s | *da rivedere* |
| Pozza di cera | 2 s, raggio 26 px, danno 6; si restringe negli ultimi 0,3 s | *da rivedere* |
| Spinta | 10 px | non durante l'avviso |
| Impatto | bianco 0,16 s; fermo 0,067 s (4 fotogrammi); schiacciamento 0,1 s; scintille 6, battuto 12 | scossa di 1 px; bianco e fermo *da rivedere* |
| Ondata | 3 Ricaduti e 2 Cantori, a più di 240 px; segno 0,7 s; prima dopo 0,8 s | quella del pulsante «Ondata» del LAB |

**L'abilità caricata colpendo** (passo 5, `ABILITA_STANZA` in `src/data/stanze.ts`, `src/sistema/abilita-stanza.ts`). Il Cerchio di luce del Lampionaio si carica **solo** con i colpi della Lanterna a segno (decisione del 12/11): piena dopo 8 colpi, e un colpo conta 1 anche se prende più nemici (decisione di Edoardo del 13/11). Mentre il cerchio è acceso non si carica.

- **Il pulsante**: un tondo scuro con l'icona del Cerchio di luce, a sinistra del joystick d'attacco, trasparente come lui, con un'area di tocco che esce di 10 punti dal disegno. L'anello ha 8 tacche che si accendono in senso orario nel colore del personaggio, una per colpo; piena, l'anello diventa chiaro, l'icona si accende e il telefono vibra. Toccata scarica, trema e fa un tonfo (il tocco è arrivato). Su computer si vede lo stesso, e si usa con Spazio.
- **L'effetto** è quello del survivor (`ABILITA.cerchioDiLuce`): un cerchio di 216 px che segue il Lampionaio per 5 s, ferisce chi c'è dentro di 6 ogni 0,3 s (non più spesso della Quiete dei nemici; nel survivor 0,25 s; +30% in Grazia) e lo fa camminare il 55% più lento. Ferisce con la sua Quiete, separata da quella della Lanterna.

| Valore dell'abilità | Numero | Note |
| --- | --- | --- |
| Carica | 8 colpi a segno; il cerchio ferisce ogni 0,3 s | un colpo conta 1, solo con la Lanterna |
| Pulsante | 36 pixel disegnati, 14 px dal joystick d'attacco; area di tocco 10 punti più larga | ingrandito come i joystick |

**Tre stanze, porte e carte** (passo 6, decisioni di Edoardo del 13/11; `PERCORSO` e `PORTE` in `src/data/stanze.ts`, `src/sistema/percorso.ts`, `src/sistema/porte.ts`). Numeri di Claude, *da rivedere*.

- **Il percorso**: si entra sempre dalla porta in basso, che resta chiusa. Ogni stanza ha le sue ondate (decisione di Edoardo del 13/11): l'ondata dopo arriva 8 s dopo la precedente (*da rivedere*), anche se ci sono ancora nemici, oppure subito se la stanza si svuota prima. Ripulita la stanza, dopo 0,5 s arrivano **le 3 carte**, con il titolo «Un nuovo dono», **verticali e in fila una accanto all'altra** (lo schermo è in orizzontale e ha altezza da usare; `CARTA_STANZA` in `src/data/hud.ts`): 130 × 200 pixel disegnati, ingrandite quanto ci stanno (× 2 sul telefono). Dall'alto: l'icona ingrandita 2 volte in un pozzetto, il nome, «Nuova arma» o il livello, una riga, i numeri e la spiegazione allineati a sinistra, con scritte più grandi di quelle delle strisce (numeri 16, livello 9, spiegazione 9,5; se una spiegazione non ci sta scende da sola). La carta è un segnaposto disegnato dal codice (*Carta_Stanza*, da disegnare). Compaiono **a pop**, prima minuscole poi alla loro grandezza, una dopo l'altra (0,24 s a 6 scatti, 0,1 s l'una dall'altra), e quando ognuna è grande, sull'icona scoppia l'effetto di comparsa (pixelfx «collect-burst» ricolorato in oro, con un piccolo suono). Si sceglie toccando una carta o con 1-2-3. Mentre le carte sono aperte il gioco è fermo e joystick d'attacco e abilità si nascondono.
- **Da dove pescano le carte**: nella prima stanza sono 3 Echi nuovi di 3 affinità diverse. Poi decide la porta scelta. Una **porta d'affinità** (Luce, Sacro, Ombra, Terra) dà Echi nuovi di quell'affinità (finché se ne hanno meno di 3) e livelli degli Echi di quell'affinità che si hanno; dalla Luce anche livelli della Lanterna. La **porta del dono** dà doni nuovi (fino a 6) e livelli dei doni che si hanno, solo tra quelli che nelle stanze funzionano: Cuore di cera, Sale nero, Clessidra, Stoppino lungo, Ali di falena, Erbe amare, Scudo di ferro, Specchio, Cera votiva, Chiodo di bara, Campanella d'argento (decisione di Edoardo del 13/11; restano fuori Calamita e Lacrima di lumen). Se una porta d'affinità non ha più niente da dare, le carte sono doni.
- **Gli Echi** sono le armi automatiche del survivor, con i loro numeri e i loro 8 livelli; sparano da sole come nel survivor. **La Lanterna a mano** sale di livello con i numeri del survivor (danno, raggio, ampiezza), e la sua ricarica scende nella stessa proporzione partendo da 0,45 s. Sulla carta della Lanterna la ricarica è quella della Lanterna a mano (0,45 s, poi 0,38 s dal livello 4); danno e area sono quelli del survivor, che valgono anche qui. Doni: Clessidra accorcia anche la ricarica della Lanterna, Stoppino lungo allarga anche il suo arco, Campanella d'argento allunga la finestra della schivata perfetta (+0,1 s per livello), Erbe amare fanno tornare la salute, Scudo di ferro toglie parte del danno subito.
- **Le porte**: scelta la carta se ne aprono 2 o 3, su muri diversi (in alto, a sinistra, a destra), ognuna con una ricompensa diversa. Sopra ogni porta c'è il simbolo della ricompensa: il simbolo dello stato dell'affinità (Abbagliato, Consacrato, Maledetto, Sepolto) o un rombo dorato per il dono. Chiusa la porta ha le sbarre, aperta ha la cornice arancione; porte e simboli si vedono anche nel buio. Ci si entra camminandoci contro.
- **Il passaggio**: il buio si infittisce a retino fino al nero, si cambia stanza e il retino si dirada (0,25 s in tutto).
- **Fine della fetta**: dopo la carta della terza stanza compare «Fetta completata», con i nemici battuti, le schivate perfette e la build (Lanterna, Echi e doni con il loro livello), «Ricomincia» e «Menu».

| Valore del percorso | Numero | Note |
| --- | --- | --- |
| Stanze | 3 | |
| Ondate | stanza 1: 3 Ricaduti e 1 Cantore, poi 3 e 1; stanza 2: 3 e 1, poi 3 e 2, poi 4 e 2; stanza 3: 4 e 2, poi 4 e 2, poi 5 e 3 | ogni 8 s, o subito se la stanza si svuota |
| Carte | 3, dopo 0,5 s; verticali 130 × 200; pop in 0,24 s a 6 scatti, 0,1 s l'una dall'altra | effetto di comparsa a 12 fotogrammi al secondo |
| Build | al massimo 3 Echi e 6 doni | più la Lanterna |
| Porte | da 2 a 3, larghe 64 px | su muri diversi |
| Passaggio | 0,25 s | a retino |

## 12. Da fare e da decidere

Il piano di lavoro, le idee non ancora decise (altri scenari, suoni e musica, lingua, stile dei nemici, torce nel cimitero) e il redesign sono in [roadmap.md](roadmap.md).
