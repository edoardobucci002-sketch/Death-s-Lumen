# Death's Lumen — GDD di base

Questo documento raccoglie tutti i contenuti e i numeri della **v0** (prototipo "Lumen dei Morti", ottobre 2026). La nuova versione riparte da qui: contenuti e valori sono un punto di partenza da migliorare, non un vincolo. Ogni cambiamento va scritto in questo file e in `decisioni.md`.

Unità: le distanze sono in pixel di gioco, le velocità in pixel al secondo, i tempi in secondi.

**Scala del mondo (2 novembre 2026).** Nella v0 il personaggio era alto circa 34 px; gli sprite in gioco di Edoardo (V5) sono alti circa 80 px. Per tenere le stesse proporzioni, **ogni distanza e velocità della v0 si moltiplica per 2,35**. Le sezioni già portate nel gioco nuovo hanno i valori convertiti (segnati «× 2,35»); dalla M5 tutto il GDD è convertito.

## 1. Il gioco in breve

- **Genere**: survivor-like. Ti muovi, l'arma colpisce da sola, raccogli anime, a ogni livello scegli un dono tra tre.
- **Obiettivo**: sopravvivere 15 minuti, fino all'alba. Si perde quando la salute arriva a zero.
- **Ambientazione**: un cimitero nella notte di Ognissanti, illuminato dalla lanterna del personaggio. Fuori dall'alone di luce è buio.
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
| 5:00 | Primo Mietitore |
| 6:00 | Iniziano i bruti |
| 10:00 | Secondo Mietitore, molto più resistente |
| 15:00 | L'alba: vittoria |

## 2. Personaggi

Valori di base comuni: 100 salute, velocità 245, raccolta delle anime a 150 px, armatura 0 (× 2,35: nella v0 erano 105 e 64).

| Personaggio | Motto | Colore | Arma iniziale | Abilità speciale | Modificatori |
| --- | --- | --- | --- | --- | --- |
| Il Lampionaio | Guida nel buio | `#e3913a` | Lanterna | Cerchio di luce | +10% velocità, +0,2 salute/s (M8) |
| Il Becchino | Nulla resta davvero sotto terra | `#b89a74` | Pala | Sepoltura | +30 salute, −15% danno subito, +5% danno, −3% velocità (M8; prima +1 armatura, +15% danno e −8% velocità) |
| La Badessa | Preghiere per ciò che è stato | `#dcc07a` | Turibolo | Benedizione | +10 salute, +0,3 salute/s, +15% area |
| La Strega | Conosce nomi che non dovrebbero essere detti | `#a57ae0` | Bastone | Rito proibito | −5 salute, +20% danno, −10% ricarica (M8; prima −15 salute e +10% danno) |

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

Si attivano con Spazio o con il pulsante a schermo. Danno, area e ricarica seguono i doni passivi. Raggi e attrazione già × 2,35 (M4, `src/data/abilita.ts`).

| Abilità | Ricarica | Durata | Raggio | Danno | Effetto |
| --- | --- | --- | --- | --- | --- |
| Cerchio di luce | 14 s | 5 s | 216 | 6 ogni 0,25 s | ti segue; rallenta del 55% |
| Sepoltura | 16 s | 4,5 s | 247 | 11 ogni 0,3 s | fissa; mani dalla terra; rallenta dell'80% |
| Benedizione | 18 s | 6 s | 207 | 8 ogni 0,3 s | fissa; croce dorata; cura 5 salute/s se ci stai dentro (9 fino alla M8) |
| Rito proibito | 16 s | 5 s | 259 | 10 ogni 0,3 s | fissa; sigillo con candele; attira i nemici a 153 px/s |

Il Mietitore subisce il rallentamento a metà e l'attrazione a un quarto; bruti ed élite l'attrazione a metà.

## 4. Armi

Al massimo 6 armi, ognuna fino al livello 8. Le quattro armi iniziali sono **esclusive** del loro personaggio e non compaiono mai tra i doni degli altri. Le sei armi comuni si trovano tra i doni di livello. I valori sono quelli di base, prima dei doni passivi.

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

M8: danni circa +25% (erano 14, 19, 25, 35). Con la curva dell'esperienza più lenta il Lampionaio non vinceva mai nelle simulazioni.

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

La prima nube nasce 47 px davanti a te, le altre a caso fino a 94 px (× 2,35); ogni nube ferisce ogni 0,3 s e rallenta del 30%. Le nubi non si sommano: un nemico dentro più nubi è ferito da una sola (M8). Specchio aggiunge una nube. Arma iniziale della Badessa, esclusiva.

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

M8: danni +40% (erano 6, 8, 8, 8, 11, 11, 11, 15), per compensare le nubi che non si sommano.


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

M8: danni +20% (erano 16, 22, 22, 22, 30, 30, 30, 42): era l'arma più debole.


#### Fuoco fatuo

Partono a raggiera e girano (fino a 6 radianti al secondo) verso il nemico più vicino a loro, entro 752 px, a 470 px/s (× 2,35); durano 3,2 s. Specchio aggiunge un fuoco.

| Lv | Ricarica (s) | Quantità | Danno | Trapassa | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1,3 | 1 | 12 | 1 | Fuochi fatui che inseguono i nemici. |
| 2 | 1,3 | 2 | 12 | 1 | +1 fuoco. |
| 3 | 1,3 | 2 | 18 | 1 | +6 danno. |
| 4 | 1,3 | 3 | 18 | 1 | +1 fuoco. |
| 5 | 1 | 3 | 18 | 1 | Ricarica più rapida. |
| 6 | 1 | 3 | 26 | 1 | +8 danno. |
| 7 | 1 | 4 | 26 | 1 | +1 fuoco. |
| 8 | 1 | 4 | 36 | 3 | +10 danno, trapassano tre nemici. |

#### Acqua santa

Ogni fiala cade su un nemico visibile scelto a caso; la pozza ferisce ogni 0,3 s. Le pozze non si sommano: un nemico dentro più pozze è ferito da una sola (M8). Raggi già × 2,35. Specchio aggiunge una fiala.

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

M8: danni +10% (erano 7, 7, 10, 10, 10, 14, 14, 19), per compensare le pozze che non si sommano. Con +30% era presente in tutte le notti vinte dal bot.

## 5. Doni passivi

Al massimo 6 doni passivi diversi.

| Dono | Effetto per livello | Livello max |
| --- | --- | --- |
| Cuore di cera | +20 salute massima | 5 |
| Sale nero | +10% danno | 5 |
| Clessidra | −7% ricarica, si moltiplica (minimo 40% della ricarica base) | 5 |
| Stoppino lungo | +10% area (raggi, archi, nubi, pozze, abilità, alone di luce; nel gioco nuovo anche il bonus area del personaggio allarga l'alone) | 5 |
| Ali di falena | +8% velocità | 5 |
| Calamita | +30% raggio di raccolta e +5% anime (M8) | 5 |
| Erbe amare | +0,25 salute al secondo | 5 |
| Scudo di ferro | −6% danno subito (M8; prima +1 armatura) | 4 |
| Specchio | +1 proiettile, nube, fiala, fuoco o falce | 1 (2 fino alla M8) |

## 6. Nemici

Valori al minuto 0; la velocità varia a caso del ±10%. Velocità e raggi convertiti × 2,35 (M2, in `src/data/nemici.ts`); anche il Mietitore (M5).

| Nemico | Salute | Velocità | Danno | Raggio | Anime | Compare da | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pipistrello | 6 | 179 | 5 | 16 | 1 | 0:00 | comune all'inizio, sciami; vola a zig-zag |
| Zombi | 16 | 87 | 8 | 21 | 2 | 0:00 | lento |
| Fantasma | 13 | 129 | 7 | 21 | 2 | 0:50 | attraversa gli altri nemici |
| Scheletro | 34 | 106 | 10 | 21 | 3 | 2:20 | resistente; ti accerchia |
| Segugio | 28 | 200 | 9 | 21 | 3 | 3:50 | il più veloce; ti taglia la strada |
| Bruto | 150 | 78 | 18 | 38 | 8 | 6:00 | pesante: respinta e attrazione ridotte |
| Il Mietitore | 3600 | 118 | 22 | 61 | 60 | 5:00 e 10:00 | boss; attraversa gli altri nemici (3200 prima della M8, poi 5500, ora 3600 con le mosse nuove) |

- **Élite**: ogni 55 s compare un nemico normale potenziato: salute ×7, danno ×1,4, anime ×6, dimensione ×1,5, velocità ×0,9, alone ambra. Lascia un reliquiario.
- **Il Mietitore**: cammina verso di te per 3–5 s (al minuto 10 per ×0,75 di quel tempo), poi si ferma pulsando di rosso e fa una mossa, scelta a caso con questi pesi. Ogni mossa ha un preavviso, il momento per scansarsi. Il danno delle mosse cresce con il tempo come il suo (× danno attuale ÷ 22). Dopo falciata, falci e chiamata resta fermo 0,45 s. Lascia 2 reliquiari. Al minuto 10 ha salute ×2 rispetto a quella del minuto 5, già scalata con il tempo (×1,7 fino alla M8).

| Mossa | Peso | Preavviso | Cosa fa |
| --- | --- | --- | --- |
| Scatto | 3 | 0,7 s | scatta per 0,55 s a 3,6 volte la sua velocità, verso dove ti trovavi |
| Falciata (M8) | 3 | 0,95 s | un cerchio rosso di raggio 200 si accende intorno a lui; allo scadere ferisce di 22 chi è dentro |
| Falci spettrali (M8) | 2 | 0,6 s | lancia 5 falci rosse a ventaglio (0,9 radianti) verso di te: 330 px/s, raggio 18, danno 16, durano 3,2 s |
| Chiamata dei morti (M8) | 1,5 | 1,1 s | 8 segni rossi a terra in cerchio a 190 px da te; allo scadere ne escono 8 scheletri |

- **Come si muovono (M8, `IA` in `src/data/nemici.ts`)**:
  - *dritto*: zombi, fantasmi, bruti;
  - *accerchia* (scheletri): punta a un punto girato di lato intorno a te di 0,6–1,2 radianti e al 60% della distanza, così arriva dai fianchi; sotto i 120 px viene dritto;
  - *taglia la strada* (segugi): punta dove sarai, guardando dove cammini, fino a 1,1 s in anticipo;
  - *zig-zag* (pipistrelli): ondeggia di lato (ampiezza 0,7, 5 oscillazioni al secondo, ognuno con il suo ritmo).
- **Orde (M8)**: dalle 2:30, ogni 80 s fino alle 14:20, un'orda di 12 + 2 nemici per minuto (al massimo 28) nasce in formazione appena fuori dallo schermo: file di 7, distanziate di 2,4 raggi. Marcia compatta verso di te a 80 px/s; a 260 px carica tutta insieme a velocità ×1,35. Zombi fino alle 5:00, poi scheletri, dalle 10:00 segugi. Dalle 7:00 arrivano due orde da lati opposti (tenaglia). Avvisi: «Un'orda marcia verso di te», «Due orde ti stringono».
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
| Bruto | dopo 360 s: il minore tra 1 + s/600 e (s − 360)/75, cioè entrano in 2 minuti (M8) |

## 7. Difficoltà

Un nemico prende i valori del momento in cui nasce (m = minuti di gioco, anche frazionari):

- salute = base × (1 + 0,28 m + 0,03 × (m − 3)²), l'ultimo termine solo dopo il minuto 3 (fino alla M8: 1 + 0,34 m). Al minuto 10 ≈ ×5,3, al 15 ≈ ×9,5
- danno = base × (1 + 0,09 m)
- nemici massimi in campo = min(380, 20 + 30 m)
- comparse al secondo = 1,2 + 2,5 m (al massimo 8 per fotogramma)

Le comparse arrivano appena fuori dallo schermo. Se in campo c'è meno del 40% del massimo, arrivano 2 nemici in più a ogni fotogramma. Un nemico rimasto troppo lontano viene ricollocato davanti al giocatore.

## 8. Drop

| Oggetto | Fonte | Probabilità | Effetto |
| --- | --- | --- | --- |
| Anima | ogni nemico | 100% | esperienza = anime del nemico |
| Pane | ogni nemico | 0,9%, al massimo uno ogni 45 s | +40 salute |
| Calamita | ogni nemico | 0,25%, al massimo una ogni 3 minuti | attira tutte le anime della mappa |
| Reliquiario | élite (1), Mietitore (2) | sempre | 1 potenziamento (75%) o 3 (25%) di ciò che possiedi; se è tutto al massimo, +40 salute |

M8 (prova di Edoardo del 3/11): senza limite di tempo, dal minuto 5 si uccidono circa 2000 nemici al minuto e cadevano circa 18 pani (+30) e 5 calamite al minuto. Ora nella simulazione se ne raccolgono 0,2–0,4 pani al minuto e una calamita ogni 4–6 minuti.

Pane, calamita e reliquiari si raccolgono a 40 px dal personaggio, sono disegnati sopra il buio e ingranditi × 3; i reliquiari fuori schermo hanno un segnale lampeggiante sul bordo (M5, `src/data/oggetti.ts`).

Colore delle anime: azzurro sotto 6, verde da 6 a 19, ambra da 20 in su. Nel raggio di raccolta volano verso il personaggio a 420 px/s, accelerando di 900 px/s al secondo; sono raccolte a 24 px (valori nuovi della M3, `src/data/progressione.ts`). Al massimo 320 anime a terra: oltre, la nuova nasce comunque dove muore il nemico e prende il posto e il valore dell'anima più lontana dal personaggio (nel gioco nuovo, dal 2/11: prima finivano su un'anima a caso, spesso lontana fuori schermo, e sembrava che i nemici non lasciassero più anime). Una freccia ai bordi dello schermo indica i reliquiari fuori vista.

## 8b. Fiaschetta e Grazia (M8, `src/data/sopravvivenza.ts`)

- **Fiaschetta di lumen**: 3 sorsi all'inizio della notte (anche il massimo). Un sorso cura il 35% della salute massima in 1 s; si beve con il pulsante accanto all'anello dell'abilità o con il tasto F, solo se non si ha la salute piena e non si sta già bevendo. Un'élite uccisa ridà 1 sorso, il Mietitore riempie la fiaschetta. La fiala è disegnata dal codice (15×27 pixel, ingrandita il triplo dell'anello) finché Edoardo non disegna la sua.
- **Grazia**: scatta uscendo da un cerchio rosso del Mietitore quando mancavano al massimo 0,25 s al colpo, o lasciandosi sfiorare da una falce spettrale (entro 30 px oltre il bordo) senza esserne toccati. Dura 3 s: +30% danno, +15% velocità, il personaggio lampeggia di chiaro (10 volte al secondo). Un'altra schivata perfetta la rinnova.
- Nella simulazione (3/11, 24 notti per personaggio) il bot beve 4–5,4 sorsi a notte e fa 1,5–3,3 schivate perfette.

## 9. Esperienza e doni

- Anime per passare dal livello L al successivo: 2 + 3 L + L² (M8; prima ⌊4 + 3,2 L + 2 × max(0, L − 12)^1,8⌋)
  - Valori: livello 1: 6 · livello 5: 42 · livello 10: 132 · livello 20: 462 · livello 40: 1722 · livello 60: 3782.
- Livello medio nella simulazione con il bot (`npm run sim`, 2/11): circa 7 al primo minuto, 28 al quinto, 60–70 al decimo, 70–90 all'alba (prima della M8: 13, 45, 77, 100).
- Ogni livello mostra 3 carte casuali. Pesi:
  - arma posseduta 1,5 (l'arma iniziale 2)
  - arma nuova 1
  - dono posseduto 1,2
  - dono nuovo 0,9
- 2 rimescolate per partita. Se non resta nulla da potenziare, esce «Pane e vino» (+40 salute).

## 10. Regole di combattimento

| Regola | Valore |
| --- | --- |
| Danno inflitto | danno arma × (1 + bonus danno) × caso tra 0,92 e 1,08 |
| Danno subito | danno nemico × (1 − armatura), minimo 1; armatura = parte di danno in meno, al massimo 60% (M8; prima un numero fisso sottratto) |
| Invulnerabilità dopo un colpo | 0,45 s |
| Raggio del giocatore | 21 px (9 nella v0) |
| Respinta | per arma: è la velocità con cui il nemico viene spinto via, che poi si spegne (attrito 8 al secondo, cioè percorre circa respinta ÷ 8 px); bruti ed élite la subiscono a un quarto, il Mietitore per niente |
| Lampo del nemico colpito | 0,1 s |
| Punto da cui partono le armi | 36 px sopra i piedi |
| Rallentamento | resta attivo il più forte tra quelli in corso |
| Salute bassa | sotto il 35% il bordo dello schermo pulsa di rosso |

## 11. Interfaccia e sensazioni

- **HUD**:
  - in alto: barra dell'esperienza, armi e doni con il loro livello, orologio, livello e anime;
  - barra del boss quando c'è il Mietitore;
  - in basso a sinistra: l'abilità speciale con la ricarica circolare; in basso a destra: la pausa.
- **Feedback**:
  - numeri del danno (in ambra se 40 o più);
  - il personaggio lampeggia quando viene colpito;
  - leggero tremolio dello schermo;
  - bordo rosso quando la salute è bassa;
  - avvisi testuali a centro schermo (sciami, Mietitore, reliquiari).
- **Audio** (v0, sintetizzato): colpo, sparo, anima con tono che sale nelle serie, danno subito, campana, livello, reliquiario, Mietitore, cura, speciale. Nella nuova versione va sostituito con suoni veri.
- **Nel gioco nuovo (M6)**: HUD in alto con livello, orologio, anime, icone di armi e doni con il livello, barra del Mietitore; avvisi «Uno sciame ti circonda», «Il Mietitore è venuto per te», «Reliquiario: …»; pausa con il pulsante in basso a destra, P o Esc, Indietro su Android e quando l'app va in secondo piano; M accende e spegne i suoni.
- **Schermate**: selezione del personaggio con le schede, scelta del dono, pausa (riepilogo della build, audio, vibrazione, abbandona), fine partita (tempo, livello, anime, danno, build). Il record di tempo si salva sul dispositivo.

### Mondo, luce e comandi (nuovi nella M1, in `src/data/mondo.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Pixel di gioco da vedere | 700 in verticale, 610 in orizzontale | `src/sistema/pixel.ts`; si sceglie la scala intera più vicina, quindi sui telefoni se ne vedono un po' meno (circa 585 sul lato corto) |
| Raggio della luce | 260 | oltre comincia il buio a retino |
| Sfumatura del buio | 0,9 | più alto = buio più rapido |
| Buio massimo | 78% dei pixel | nel buio più fitto il terreno si intravede ancora |
| Centro della luce | 42 px sopra i piedi | |
| Tremolio della fiamma | ±7 px ogni 0,12 s | |
| Terreno | riquadro di 1120 px che si ripete, celle di 56 px | tombe 4%, croci 2%, erba 24% per cella |
| Joystick | raggio 44 px dello schermo, zona morta 18% | compare dove si appoggia il dito |

### Nemici in campo (nuovi nella M2, in `src/data/nemici.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Dove nascono | 48 px fuori dal bordo dello schermo | |
| Ricollocamento | oltre 2,2 × 48 px fuori dallo schermo | torna davanti al giocatore, entro ±0,7 radianti dalla direzione in cui cammina |
| Separazione tra nemici | forza 0,5; si toccano sotto il 75% della somma dei raggi | i fantasmi attraversano gli altri |
| Sprite segnaposto V0 | ingranditi × 2 | disegnati per personaggi di 34 px |
| Barra della salute | 40 × 4 px, 5 px sotto i piedi | decisa da Edoardo: sotto il personaggio, non in alto (`src/data/mondo.ts`) |
| Lampo quando sei colpito | 0,1 s | bianco pieno |
| Dalla morte alla schermata di fine | 0,9 s | il personaggio lampeggia e sparisce |

### Impatto dei colpi (nuovi nella M3, in `src/data/effetti.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Numeri del danno | durano 0,55 s, salgono di 22 px, cifre 3×5 ingrandite × 2 | ambra da 40 in su |
| Scoppio del nemico che muore | 0,2 s | anello chiaro che si sfalda a retino |
| Arco della Lanterna | 0,12 s, spessore 6 px | disegnato dal codice, metà pieno e metà a retino |
| Impatto della pala | 0,22 s; scossa dello schermo di 2 px per 0,1 s se colpisce qualcuno | |
| Esplosione dei dardi | 0,18 s | |
| Ordine di disegno | arco, impatto e nubi sotto i nemici; anime sopra il buio | decisione di Edoardo: i colpi non devono coprire i nemici, le anime devono vedersi |
| Anime a terra | cristalli della v0 ingranditi × 3 | |

## 12. Da fare e da decidere

**Già deciso da Edoardo**
- Due livelli di sprite: ritratti dettagliati per la selezione, sprite in gioco molto semplificati alla Vampire Survivors.
- Il nome del gioco è Death's Lumen.
- App mobile per iOS e Android.

**Proposte da discutere (non decise)**
- Evoluzioni delle armi (arma al livello 8 + un dono specifico), come in Vampire Survivors.
- Progressione tra una partita e l'altra: monete, sblocchi, personaggi segreti.
- Altri scenari oltre al cimitero.
- Suoni e musica originali al posto di quelli sintetizzati.
- Lingua del gioco: solo italiano, oppure anche inglese (il titolo è in inglese).
- Nemici con uno stile grafico diverso da quello dei personaggi (idea di Edoardo, da riprendere alla M2).
- Torce o lumini sparsi nel cimitero, con un loro alone di luce: oggi l'unica luce è la lanterna e la mappa risulta molto buia (osservazione di Edoardo, 2 novembre 2026).
