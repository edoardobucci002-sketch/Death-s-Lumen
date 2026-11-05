# Roadmap

Un solo piano di lavoro, aggiornato a ogni tappa (5 novembre 2026). Ogni tappa finisce con qualcosa che Edoardo può provare, di norma dal Laboratorio sul link di prova (vedi «Verifica» in `CLAUDE.md`). Il dettaglio dei contenuti è nel [GDD](GDD.md), le scelte in [decisioni.md](decisioni.md), i numeri e le simulazioni in [bilanciamento.md](bilanciamento.md).

## Fatto

| Tappa | Cosa | Stato |
| --- | --- | --- |
| M0 · Fondamenta | Stack, progetto, export da Aseprite, PWA su GitHub Pages | fatta (30/10) |
| M1 · Camminare | Joystick e tastiera, telecamera, cimitero, buio e alone di luce, pixel perfect; sprite in gioco V5 con `idle` e `walk` | fatta (2/11) |
| M2 · La notte arriva | Nemici, comparse, griglia spaziale, danno da contatto, morte; 400 nemici a 60 fps | fatta (2/11) |
| M3 · Combattere | 4 armi iniziali, anime, esperienza, scelta dei doni | fatta (2/11) |
| M4 · L'arsenale | Armi comuni, doni passivi, 4 abilità speciali | fatta (2/11) |
| M5 · La notte intera | Élite, sciami, Seth ai minuti 5 e 10, drop, reliquiari, alba e vittoria | fatta (2/11) |
| M6 · Facciata | Menu con le schede, HUD, pause, fine partita, audio sintetizzato, record | fatta (2/11) |
| HUD di Edoardo | Barre, stemma, caselle, anello dell'abilità, joystick, pausa, carte, pannelli, salute col cuore: nel gioco su `prova` | fatta (3/11) |

## In corso

| Tappa | Cosa | Stato |
| --- | --- | --- |
| M7 · App | Capacitor iOS e Android, icone, avvio, vibrazione, schermo acceso, tasto Indietro | **in prova**: APK costruita da GitHub Actions, provata sul Galaxy S25 di Edoardo; iOS rimandato (manca Xcode) |
| M8 · Bilanciamento e oggetti | Bot di simulazione, ritocco dei numeri, meta progressione e oggetti della [proposta](proposte/oggetti-build-sinergie.md) | **in corso**, vedi sotto. Obiettivi del bot **provvisori e non vincolanti** (oggi Cappella vuota 21%, completa 52%): si tara alla fine, a contenuti completi ([bilanciamento.md](bilanciamento.md)). Da riprovare a mano |

Parti della M8 già fatte:
- Tappa 1 · ritocchi agli oggetti esistenti (3/11)
- Tappa 2 · Fiaschetta di lumen e Grazia (3/11)
- Tappa 3 · affinità, stati, reazioni e ruoli nuovi delle armi (3/11); stati come simboli sopra la testa, scelta dei doni a strisce, legenda (4/11)
- Meta di base · Cera, Cappella a elenco con 7 ceri e Seconda candela, personaggi da sbloccare, salvataggio e codice (3/11); Cera a terra (3/11)
- Tappa 4 · Rosario, 10 amuleti, Peccato (3/11)
- Tappa 5 · 4 armi e 4 doni nuovi con i loro sblocchi (4/11)
- Tappa 6 · 10 unioni (4/11)
- Leggibilità del campo, solo visiva (4–5/11): lampo dei nemici, numeri del danno (limite di 15, ambra in tre casi, somma su élite, Seth e reazioni), nomi delle reazioni, simboli degli stati, cartiglio degli avvisi, orologio, personaggio sopra i nemici. Sul link di prova, non ancora sul link pubblico
- Fasce del telefono in verticale con il campo vero, segnaposto dal codice (5/11). Sul link di prova e sull'APK di prova, non ancora sul link pubblico; poi pausa, scelta dei doni e menu
- Laboratorio (LAB) sul link di prova (3/11)

### Oggetti rompibili (prova, 5/11)

Su `/prova/`: urne con frammenti, giare con Cera, lanterne con luce e chiazze d'olio che bruciano; le armi li rompono; luce e alone si vedono sul telefono. LAB → Eventi → Rompibili. Da decidere durate, armi di fuoco, frammenti e Cera dei nemici (vedi «Da confermare»).

## Prossime tappe

L'ordine **dopo i Patti** è una proposta di Claude, da confermare con Edoardo (vedi «Da confermare»).

1. **Tappa 7 · Patti**: regole scelte nel menu prima della notte, che la rendono più dura e più ricca. Proposti tutti e cinque (Falce, Silenzio, Folla, Buio, Ombra) in [proposte/oggetti-build-sinergie.md](proposte/oggetti-build-sinergie.md); da creare. **Si costruiscono senza tararli**: lo sblocco per ora si raggiunge dal Laboratorio (la scheda LAB nasce insieme ai Patti); la regola di sblocco si decide con il bilanciamento finale. Disegni: 5 icone.
2. **Cappella come hub**: i personaggi nella navata, la scheda con le statistiche vere, la Cera disegnata, 9 icone dei ceri. Viene **dopo** i Patti. Disegni: la Cappella, l'icona della Cera, le icone dei ceri.
3. **Devozione e notti diverse**: 8 livelli di Devozione per personaggio; notti che si sbloccano (nebbia, luna piena, notte dei morti), ognuna con un Seth dalle mosse diverse. Dettagli in [proposte/meta-progressione.md](proposte/meta-progressione.md).
4. **Cero della fiaschetta e questline** con il Ceraiolo (ampolla incrinata → riparata → si riempie battendo Seth). Oggi la fiaschetta c'è dalla prima notte con 3 sorsi. Quando la fiaschetta diventerà uno sblocco, rilanciare la simulazione.
5. **Veggente e Sguattera**: i due personaggi giocabili previsti. Da decidere con Edoardo: la loro affinità (vedi [lore.md](lore.md), *Aperto*), arma iniziale, abilità, ritratto e sprite, come si sbloccano.
6. **Redesign dell'intero gioco** (da collocare nell'ordine con Edoardo): HUD, personaggi, animazioni (`attack`, `special`, `hurt`, `death`), effetti, mosse di Seth, hub, nemici V1 alla scala nuova, scheda del personaggio (con statistiche vere), cornici dei ritratti e Pannello scheda.
7. **Più avanti**: mondi e boss nuovi come dungeon in fila nella stessa partita, alla Hades; altri boss oltre Seth; la trama dell'endgame (vedi [lore.md](lore.md)).

## Idee non ancora decise

- Suoni e musica originali al posto di quelli sintetizzati.
- Lingua del gioco: solo italiano, oppure anche inglese (il titolo è in inglese).
- Nemici con uno stile grafico diverso da quello dei personaggi.
- ~~Torce o lumini sparsi nel cimitero~~: superata dalle lanterne rompibili (5/11), in prova.

## Piccole cose da sistemare nel codice (non fatte nel riordino dei documenti)

- Nove commenti in `src/data/` rimandano a `docs/GDD_base.md`: il file ora è `docs/GDD.md`. Si aggiornano alla prossima modifica al codice.
- Il commento in `src/data/nemici.ts` (riga 92) dice «0,04 × (m − 3)²»; il valore vero è 0,06.
- Il CSS usa ancora IM Fell English SC per alcuni titoli (`--f-titolo`: avviso, titolo della scelta dei doni, pannelli, nastri); i titoli decisi sono in Tiny5.
- `@fontsource/pixelify-sans` è ancora tra le dipendenze (lo usa solo la bozza dell'HUD).
- Disegnare gli asset elencati in [asset_da_creare.md](asset_da_creare.md).

## Da confermare

Tutte le voci «da rivedere» sparse nei documenti: valori e scelte proposti da Claude e non ancora confermati da Edoardo. Quando Edoardo ne conferma una, si toglie da qui e dall'etichetta nel testo.

| Voce | Dove è scritta |
| --- | --- |
| Rompibili: percentuali, gocce, raggi, luce della lanterna, oggetti che non tornano nella notte | GDD 8g, `src/data/rompibili.ts` |
| Chiazze: olio 12 s, fuoco 5 s, rallentamento 40%, 14 danni ogni 0,4 s; armi di fuoco: Candela e Fuoco fatuo | GDD 8g |
| Frammenti: 3 per un reliquiario, contatore fisso nell'HUD sì o no | GDD 8g |
| Cera dei nemici: resta uguale per ora | GDD 8g |
| Luce: sfumatura 1,5, buio 88%, raggio 36% del lato corto, alone caldo | GDD 11, `src/data/mondo.ts` |
| Fasce del telefono: tutte le misure di `FASCE`, `PAUSA_PICCOLA`, `JOYSTICK_PICCOLO`, `SEGNALE_PECCATO` in `src/data/hud.ts`, provate da Edoardo sul S25 | GDD §11; decisioni 5/11 |
| Pausa piccola subito a sinistra di abilità e fiaschetta: al centro esatto si sovrapporrebbe al gruppo | GDD §11; decisioni 5/11 |
| Cartiglio largo 240 pixel di gioco: copre il centro di esperienza, non lo stemma né le estremità della barra | GDD §11 |
| Zone dei gesti di sistema nella scheda Schermo: servono codice nativo Android; esclusione dei gesti rimandata alla prova a mano di Edoardo | decisioni 5/11 |
| Bozza dell'HUD (`npm run bozza`): non conosce le fasce, le controlla `npm run prova` sul gioco vero. Aggiornarla o ritirarla? | `CLAUDE.md`, «Mobile» |
| Leggibilità, secondo passo: nomi delle reazioni (× 2, ogni 2 s, 3 insieme, 90 px), 40 simboli solo sui pesanti, somma dei numeri su élite e Seth (0,5 s, 30 px sopra), cartiglio (scala 0,5, minimo × 2; 1,45 s; dissolvenza 0,3 s), orologio nella colonna di destra. Confermati da Edoardo il 5/11, restano da provare sul suo telefono | GDD §8c, §11 e «Impatto dei colpi»; decisioni 4/11 e 5/11 |
| Scritte delle reazioni: il nome parte 34 px sopra il punto e sta 16 px sopra il numero quando viene spostato | GDD «Impatto dei colpi»; bilanciamento 5/11 |
| Numeri ambra: se una build rende critici la maggior parte dei colpi, rivedere l'ambra. Al massimo livello il Chiodo di bara dà circa il 30% di numeri ambra | GDD «Impatto dei colpi»; decisioni 5/11 |
| Chiodo di bara al massimo: gli ambra sostituiscono i bianchi così spesso che i bianchi durano ~0,03 s. Possibile correzione: un ambra può sostituire solo un bianco visibile da almeno 0,3 s (non applicata) | bilanciamento 5/11 |
| Leggibilità del campo provata solo su telefoni emulati e sul Mac: manca la prova di Edoardo sul Galaxy S25 | decisioni 4/11 e 5/11 |
| Link pubblico: il codice di `prova`, con tutta la leggibilità e gli altri lavori dal 3/11, non è su `main`; il merge aspetta l'approvazione di Edoardo | «I due link» in `CLAUDE.md` |
| Seth molto scuro sullo sfondo notturno e cerchi delle reazioni ancora vistosi: contorno o alone per Seth, cerchi più piccoli o ridisegnati, oppure sprite di Edoardo. Non ancora deciso | `asset_da_creare.md` per i cerchi |
| Nome e numero di una reazione si toccano ancora nell'8% circa dei fotogrammi | GDD «Impatto dei colpi» |
| Con 15 numeri ambra già sullo schermo, il primo colpo di una reazione può restare fuori dalla somma mostrata; visto solo in una prova forzata, il danno vero non cambia | GDD «Impatto dei colpi» |
| Verifica nella bozza dell'HUD: 44 avvisi già presenti prima di questo lavoro. In partita, su iPhone SE e Android piccolo la barra di Seth tocca le caselle 2 e 3; gli altri riguardano altre schermate, soprattutto i doni | bozza («Verifica tutti i telefoni») |
| Leggibilità nella folla: lampo del nemico (0,033 s, uno ogni 0,3 s, 50% su bruti/élite/Seth) e al massimo 15 numeri del danno; si provano dal LAB | GDD §10 e «Impatto dei colpi»; decisioni 4/11 |
| Sblocco delle Unioni: «Sopravvivi 10 minuti» o 500 Cera | GDD §8f; bilanciamento 4/11 |
| Sblocchi di armi e doni nuovi (tappa 5): imprese (10 Eclissi, 30000 anime per il Corvo, 3 minuti nelle nubi per il Velo, 20 schivate perfette) e costi (120 Cera; Campanella con impresa o 120) | GDD §8d |
| «Reliquie dimenticate» semplificate in acquisti dalla Cappella (nella proposta si trovavano in partita) | GDD §8d; decisioni 4/11 |
| Rosario: 3 grani di partenza, Peccato ×2, sblocco «Sopravvivi 8 minuti» o 300 Cera, 3 amuleti per reliquiario | GDD §8e; decisioni 3/11 |
| Patti: valori dei cinque patti e regola di sblocco (decisa con il bilanciamento finale) | tappa 7 qui sopra; proposte |
| Obiettivi di vittoria del bot per Cappella (provvisori) | bilanciamento |
| «Capi» come parola generica per i boss nel testo del Fuoco fatuo | decisioni 4/11 |
| Posto del redesign nell'ordine delle tappe | qui sopra |
| Ordine delle tappe dopo i Patti (Cappella hub, Devozione e notti, questline, Veggente e Sguattera, redesign): proposto da Claude | «Prossime tappe» qui sopra |
| Danza macabra: recupero di 3 s, da provare a mano da Edoardo | GDD §8e (amuleti) |
| Affinità della Veggente e della Sguattera | lore (*Aperto*) |
