# Death's Lumen — GDD di base

Questo documento raccoglie tutti i contenuti e i numeri della **v0** (prototipo "Lumen dei Morti", ottobre 2026). La nuova versione riparte da qui: contenuti e valori sono un punto di partenza da migliorare, non un vincolo. Ogni cambiamento va scritto in questo file e in `decisioni.md`.

Unità: le distanze sono in pixel di gioco (il personaggio è alto circa 34 px), le velocità in pixel al secondo, i tempi in secondi.

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
| 2:20 | Iniziano gli scheletri |
| 3:50 | Iniziano i segugi |
| 5:00 | Primo Mietitore |
| 6:00 | Iniziano i bruti |
| 10:00 | Secondo Mietitore, molto più resistente |
| 15:00 | L'alba: vittoria |

## 2. Personaggi

Valori di base comuni: 100 salute, velocità 105, raccolta delle anime a 64 px, armatura 0.

| Personaggio | Motto | Colore | Arma iniziale | Abilità speciale | Modificatori |
| --- | --- | --- | --- | --- | --- |
| Il Lampionaio | Guida nel buio | `#e3913a` | Lanterna | Cerchio di luce | +10% velocità |
| Il Becchino | Nulla resta davvero sotto terra | `#b89a74` | Pala | Sepoltura | +30 salute, +1 armatura, +15% danno, −8% velocità |
| La Badessa | Preghiere per ciò che è stato | `#dcc07a` | Turibolo | Benedizione | +10 salute, +0,3 salute/s, +15% area |
| La Strega | Conosce nomi che non dovrebbero essere detti | `#a57ae0` | Bastone | Rito proibito | −15 salute, +10% danno, −10% ricarica |

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

Si attivano con Spazio o con il pulsante a schermo. Danno, area e ricarica seguono i doni passivi.

| Abilità | Ricarica | Durata | Raggio | Danno | Effetto |
| --- | --- | --- | --- | --- | --- |
| Cerchio di luce | 14 s | 5 s | 92 | 6 ogni 0,25 s | ti segue; rallenta del 55% |
| Sepoltura | 16 s | 4,5 s | 105 | 11 ogni 0,3 s | fissa; mani dalla terra; rallenta dell'80% |
| Benedizione | 18 s | 6 s | 88 | 8 ogni 0,3 s | fissa; croce dorata; cura 9 salute/s se ci stai dentro |
| Rito proibito | 16 s | 5 s | 110 | 10 ogni 0,3 s | fissa; sigillo con candele; attira i nemici a 65 px/s |

Il Mietitore subisce il rallentamento a metà e l'attrazione a un quarto; bruti ed élite l'attrazione a metà.

## 4. Armi

Al massimo 6 armi, ognuna fino al livello 8. Le quattro armi iniziali sono **esclusive** del loro personaggio e non compaiono mai tra i doni degli altri. Le sei armi comuni si trovano tra i doni di livello. I valori sono quelli di base, prima dei doni passivi.

### Armi iniziali

#### Lanterna

Arco centrato sulla direzione in cui cammini, misurato dal personaggio; respinge di 110. Arma iniziale del Lampionaio, esclusiva.

| Lv | Ricarica (s) | Danno | Raggio | Ampiezza arco (°) | Colpo alle spalle | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 0,8 | 14 | 58 | 132 | no | Colpo corto, ampia gittata frontale. |
| 2 | 0,8 | 19 | 58 | 132 | no | +5 danno. |
| 3 | 0,8 | 19 | 68 | 132 | no | Raggio maggiore. |
| 4 | 0,68 | 19 | 68 | 132 | no | Colpi più frequenti. |
| 5 | 0,68 | 25 | 68 | 132 | no | +6 danno. |
| 6 | 0,68 | 25 | 78 | 166 | no | Raggio e ampiezza maggiori. |
| 7 | 0,56 | 25 | 78 | 166 | no | Colpi più frequenti. |
| 8 | 0,56 | 35 | 78 | 166 | sì | +10 danno, colpisce anche alle spalle. |

#### Pala

Impatto circolare 26 px davanti a te, nella direzione di cammino; respinge di 180. A Lv 8 un secondo colpo alle spalle 0,22 s dopo. Arma iniziale del Becchino, esclusiva.

| Lv | Ricarica (s) | Danno | Raggio | Distanza colpo | Colpo doppio | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 1,35 | 34 | 30 | 26 | no | Colpo potente a corta gittata. |
| 2 | 1,35 | 44 | 30 | 26 | no | +10 danno. |
| 3 | 1,35 | 44 | 37 | 26 | no | Area d'impatto maggiore. |
| 4 | 1,15 | 44 | 37 | 26 | no | Colpi più frequenti. |
| 5 | 1,15 | 56 | 37 | 26 | no | +12 danno. |
| 6 | 1,15 | 56 | 44 | 26 | no | Area d'impatto maggiore. |
| 7 | 0,95 | 56 | 44 | 26 | no | Colpi più frequenti. |
| 8 | 0,95 | 76 | 44 | 26 | sì | +20 danno, colpo doppio. |

#### Turibolo

La prima nube nasce 20 px davanti a te, le altre a caso fino a 40 px; ogni nube ferisce ogni 0,3 s e rallenta del 30%. Specchio aggiunge una nube. Arma iniziale della Badessa, esclusiva.

| Lv | Ricarica (s) | Quantità | Danno | Raggio | Durata (s) | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 1,25 | 1 | 6 | 30 | 2,4 | Emette fumo sacro a corta gittata. |
| 2 | 1,25 | 1 | 8 | 30 | 2,4 | +2 danno. |
| 3 | 1,25 | 2 | 8 | 36 | 2,4 | +1 nube, nubi più ampie. |
| 4 | 1,05 | 2 | 8 | 36 | 2,4 | Più frequente. |
| 5 | 1,05 | 2 | 11 | 36 | 3,1 | +3 danno, fumo più duraturo. |
| 6 | 1,05 | 3 | 11 | 42 | 3,1 | +1 nube, nubi più ampie. |
| 7 | 0,85 | 3 | 11 | 42 | 3,1 | Più frequente. |
| 8 | 0,85 | 3 | 15 | 42 | 3,1 | +4 danno. |

#### Bastone

Mira al nemico più vicino entro 260 px; i proiettili partono a 0,08 s l'uno dall'altro e svaniscono dopo 1,3 s. Specchio aggiunge un proiettile. Arma iniziale della Strega, esclusiva.

| Lv | Ricarica (s) | Quantità | Danno | Trapassa | Velocità proiettile | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 0,85 | 1 | 15 | 1 | 230 | Colpo a media gittata, proiettili magici. |
| 2 | 0,85 | 2 | 15 | 1 | 230 | +1 proiettile. |
| 3 | 0,85 | 2 | 20 | 1 | 230 | +5 danno. |
| 4 | 0,72 | 2 | 20 | 1 | 230 | Più frequente. |
| 5 | 0,72 | 3 | 20 | 1 | 230 | +1 proiettile. |
| 6 | 0,72 | 3 | 27 | 2 | 230 | +7 danno, trapassano. |
| 7 | 0,59 | 3 | 27 | 2 | 230 | Più frequente. |
| 8 | 0,59 | 4 | 35 | 2 | 230 | +1 proiettile, +8 danno. |

### Armi comuni

#### Candela

Bersaglia i nemici più vicini sullo schermo; le fiammelle durano 1,4 s. Specchio aggiunge una fiammella.

| Lv | Ricarica (s) | Danno | Quantità | Trapassa | Velocità proiettile | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 0,95 | 12 | 1 | 1 | 300 | Lancia fiammelle verso il nemico più vicino. |
| 2 | 0,95 | 12 | 2 | 1 | 300 | +1 fiammella. |
| 3 | 0,95 | 17 | 2 | 1 | 300 | +5 danno. |
| 4 | 0,95 | 17 | 3 | 1 | 300 | +1 fiammella. |
| 5 | 0,95 | 17 | 3 | 2 | 300 | Le fiammelle trapassano un nemico in più. |
| 6 | 0,95 | 22 | 4 | 2 | 300 | +5 danno e +1 fiammella. |
| 7 | 0,75 | 22 | 4 | 2 | 300 | Ricarica più rapida. |
| 8 | 0,75 | 32 | 5 | 3 | 300 | +1 fiammella, +10 danno, trapassano di più. |

#### Falce

Sempre attiva: lo stesso nemico può essere colpito da una falce ogni 0,45 s; respinge di 70. Specchio aggiunge una falce.

| Lv | Quantità | Danno | Raggio | Rotazione (giri/s) | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1 | 12 | 56 | 0,45 | Una falce spettrale ti ruota intorno. |
| 2 | 2 | 12 | 56 | 0,45 | +1 falce. |
| 3 | 2 | 15 | 56 | 0,45 | +3 danno. |
| 4 | 3 | 15 | 56 | 0,45 | +1 falce. |
| 5 | 3 | 19 | 68 | 0,45 | Raggio più ampio e +4 danno. |
| 6 | 4 | 19 | 68 | 0,45 | +1 falce. |
| 7 | 4 | 25 | 68 | 0,59 | Rotazione più veloce e +6 danno. |
| 8 | 5 | 25 | 68 | 0,59 | +1 falce. |

#### Campana

Colpisce tutto entro il raggio e respinge di 200; a Lv 8 il secondo rintocco arriva 0,35 s dopo.

| Lv | Ricarica (s) | Danno | Raggio | Colpo doppio | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 2,6 | 16 | 84 | no | Rintocchi che respingono e feriscono tutto intorno. |
| 2 | 2,6 | 22 | 84 | no | +6 danno. |
| 3 | 2,6 | 22 | 102 | no | Raggio più ampio. |
| 4 | 2,2 | 22 | 102 | no | Rintocchi più frequenti. |
| 5 | 2,2 | 30 | 102 | no | +8 danno. |
| 6 | 2,2 | 30 | 120 | no | Raggio più ampio. |
| 7 | 1,8 | 30 | 120 | no | Rintocchi più frequenti. |
| 8 | 1,8 | 42 | 120 | sì | +12 danno e doppio rintocco. |

#### Fuoco fatuo

Insegue il nemico più vicino entro 320 px a 200 px/s e dura 3,2 s. Specchio aggiunge un fuoco.

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

Ogni fiala cade su un nemico visibile scelto a caso; la pozza ferisce ogni 0,3 s. Specchio aggiunge una fiala.

| Lv | Ricarica (s) | Quantità | Danno | Raggio | Durata (s) | Cosa cambia |
|---|---|---|---|---|---|---|
| 1 | 2,8 | 1 | 7 | 38 | 2,6 | Fiale che lasciano pozze benedette sui nemici. |
| 2 | 2,8 | 2 | 7 | 38 | 2,6 | +1 fiala. |
| 3 | 2,8 | 2 | 10 | 46 | 2,6 | Pozze più grandi e dannose. |
| 4 | 2,8 | 3 | 10 | 46 | 2,6 | +1 fiala. |
| 5 | 2,3 | 3 | 10 | 46 | 3,2 | Ricarica più rapida, pozze più durature. |
| 6 | 2,3 | 3 | 14 | 55 | 3,2 | Pozze più grandi e dannose. |
| 7 | 2,3 | 4 | 14 | 55 | 3,2 | +1 fiala. |
| 8 | 2,3 | 4 | 19 | 55 | 4,2 | Durata e danno maggiori. |

#### Lama di luce

Fendente orizzontale alto 44 px verso il lato in cui guardi; il colpo alle spalle parte 0,12 s dopo; respinge di 110.

| Lv | Ricarica (s) | Danno | Lunghezza | Colpo alle spalle | Cosa cambia |
|---|---|---|---|---|---|
| 1 | 1,15 | 18 | 110 | no | Un fendente di luce davanti a te. |
| 2 | 1,15 | 18 | 110 | sì | Colpisce anche alle spalle. |
| 3 | 1,15 | 24 | 110 | sì | +6 danno. |
| 4 | 1 | 24 | 110 | sì | Ricarica più rapida. |
| 5 | 1 | 32 | 110 | sì | +8 danno. |
| 6 | 1 | 32 | 140 | sì | Fendente più lungo. |
| 7 | 0,85 | 32 | 140 | sì | Ricarica più rapida. |
| 8 | 0,85 | 44 | 140 | sì | +12 danno. |

## 5. Doni passivi

Al massimo 6 doni passivi diversi.

| Dono | Effetto per livello | Livello max |
| --- | --- | --- |
| Cuore di cera | +20 salute massima | 5 |
| Sale nero | +10% danno | 5 |
| Clessidra | −7% ricarica, si moltiplica (minimo 40% della ricarica base) | 5 |
| Stoppino lungo | +10% area (raggi, archi, nubi, pozze, abilità, alone di luce) | 5 |
| Ali di falena | +8% velocità | 5 |
| Calamita | +30% raggio di raccolta delle anime | 5 |
| Erbe amare | +0,25 salute al secondo | 5 |
| Scudo di ferro | +1 armatura | 4 |
| Specchio | +1 proiettile, nube, fiala, fuoco o falce | 2 |

## 6. Nemici

Valori al minuto 0; la velocità varia a caso del ±10%.

| Nemico | Salute | Velocità | Danno | Raggio | Anime | Compare da | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pipistrello | 6 | 76 | 5 | 7 | 1 | 0:00 | comune all'inizio, sciami |
| Zombi | 16 | 37 | 8 | 9 | 2 | 0:00 | lento |
| Fantasma | 13 | 55 | 7 | 9 | 2 | 0:50 | attraversa gli altri nemici |
| Scheletro | 34 | 45 | 10 | 9 | 3 | 2:20 | resistente |
| Segugio | 28 | 85 | 9 | 9 | 3 | 3:50 | il più veloce |
| Bruto | 150 | 33 | 18 | 16 | 8 | 6:00 | pesante: respinta e attrazione ridotte |
| Il Mietitore | 3200 | 50 | 22 | 26 | 60 | 5:00 e 10:00 | boss |

- **Élite**: ogni 55 s compare un nemico normale potenziato: salute ×7, danno ×1,4, anime ×6, dimensione ×1,5, velocità ×0,9, alone ambra. Lascia un reliquiario.
- **Il Mietitore**: cammina verso di te per 3–5 s. Poi si ferma per 0,7 s pulsando di rosso e scatta per 0,55 s a 3,6 volte la sua velocità, nella direzione in cui ti trovavi. Lascia 2 reliquiari. Al minuto 10 ha salute ×1,7 rispetto a quella del minuto 5, già scalata con il tempo.
- **Sciami**: 14 + 3 nemici per minuto, fino a 56, a +12% di velocità.

**Pesi di comparsa** (s = secondi di gioco)

| Nemico | Peso |
| --- | --- |
| Pipistrello | 3 − s/200, minimo 0,7 |
| Zombi | 3, poi 1,5 dall'8° minuto |
| Fantasma | 2 dopo 50 s |
| Scheletro | 2,6 dopo 140 s |
| Segugio | 2 dopo 230 s |
| Bruto | 1 + s/600 dopo 360 s |

## 7. Difficoltà

Un nemico prende i valori del momento in cui nasce (m = minuti di gioco, anche frazionari):

- salute = base × (1 + 0,34 m)
- danno = base × (1 + 0,09 m)
- nemici massimi in campo = min(380, 20 + 30 m)
- comparse al secondo = 1,2 + 2,5 m (al massimo 8 per fotogramma)

Le comparse arrivano appena fuori dallo schermo. Se in campo c'è meno del 40% del massimo, arrivano 2 nemici in più a ogni fotogramma. Un nemico rimasto troppo lontano viene ricollocato davanti al giocatore.

## 8. Drop

| Oggetto | Fonte | Probabilità | Effetto |
| --- | --- | --- | --- |
| Anima | ogni nemico | 100% | esperienza = anime del nemico |
| Pane | ogni nemico | 0,9% | +30 salute |
| Calamita | ogni nemico | 0,25% | attira tutte le anime della mappa |
| Reliquiario | élite (1), Mietitore (2) | sempre | 1 potenziamento (75%) o 3 (25%) di ciò che possiedi; se è tutto al massimo, +40 salute |

Colore delle anime: azzurro sotto 6, verde da 6 a 19, ambra da 20 in su. Al massimo 320 anime a terra: le nuove si sommano a quelle già presenti. Una freccia ai bordi dello schermo indica i reliquiari fuori vista.

## 9. Esperienza e doni

- Anime per passare dal livello L al successivo: ⌊4 + 3,2 L + 2 × max(0, L − 12)^1,8⌋
  - Valori: livello 2: 7 · livello 13: 42 · livello 31: 503 · livello 50: 1490 · livello 65: 2662.
- Livello tipico nelle simulazioni: 10 al primo minuto, 31 al quinto, 50 al decimo, oltre 60 all'alba.
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
| Danno subito | danno nemico − armatura, minimo 1 |
| Invulnerabilità dopo un colpo | 0,45 s |
| Raggio del giocatore | 9 px |
| Respinta | per arma; bruti ed élite la subiscono a un quarto, il Mietitore per niente |
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
- **Schermate**: selezione del personaggio con le schede, scelta del dono, pausa (riepilogo della build, audio, vibrazione, abbandona), fine partita (tempo, livello, anime, danno, build). Il record di tempo si salva sul dispositivo.

### Mondo, luce e comandi (nuovi nella M1, in `src/data/mondo.ts`)

| Valore | Numero | Note |
| --- | --- | --- |
| Pixel di gioco in verticale | almeno 300 | `src/sistema/pixel.ts` |
| Raggio della luce | 110 | oltre comincia il buio a retino |
| Sfumatura del buio | 0,9 | più alto = buio più rapido |
| Buio massimo | 78% dei pixel | nel buio più fitto il terreno si intravede ancora |
| Centro della luce | 18 px sopra i piedi | |
| Tremolio della fiamma | ±3 px ogni 0,12 s | |
| Terreno | riquadro di 480 px che si ripete, celle di 24 px | tombe 4%, croci 2%, erba 24% per cella |
| Joystick | raggio 44 px dello schermo, zona morta 18% | compare dove si appoggia il dito |

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
