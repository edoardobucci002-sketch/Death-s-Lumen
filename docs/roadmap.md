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
| M8 · Bilanciamento e oggetti | Bot di simulazione, ritocco dei numeri, meta progressione e oggetti della [proposta](proposte/oggetti-build-sinergie.md) | **in corso**, vedi sotto. Obiettivi del bot **provvisori e non vincolanti** (9/11 sera, con orde e correzioni agli oggetti: Cappella vuota 7/48, a metà 22/48, completa 20/48): si tara alla fine, a contenuti completi ([bilanciamento.md](bilanciamento.md)). Da riprovare a mano |

Parti della M8 già fatte:
- Tappa 1 · ritocchi agli oggetti esistenti (3/11)
- Tappa 2 · Fiaschetta di lumen e Grazia (3/11)
- Tappa 3 · affinità, stati, reazioni e ruoli nuovi delle armi (3/11); stati come simboli sopra la testa, scelta dei doni a strisce, legenda (4/11)
- Meta di base · Cera, Cappella a elenco con 7 ceri e Seconda candela, personaggi da sbloccare, salvataggio e codice (3/11); Cera a terra (3/11)
- Tappa 4 · Rosario, 10 amuleti, Peccato (3/11)
- Tappa 5 · 4 armi e 4 doni nuovi con i loro sblocchi (4/11)
- Tappa 6 · 10 unioni (4/11)
- Leggibilità del campo, solo visiva (4–5/11): lampo dei nemici, numeri del danno (limite di 15, ambra in tre casi, somma su élite, Seth e reazioni), nomi delle reazioni, simboli degli stati, cartiglio degli avvisi, orologio, personaggio sopra i nemici. Sul link di prova, non ancora sul link pubblico
- **Fasce del telefono in verticale con il campo vero: fatte, verificate sul S25 il 6/11**, con i segnaposto dal codice. Sul link di prova e sull'APK di prova, non ancora sul link pubblico. Prossimi: pausa, scelta dei doni e menu
- Laboratorio (LAB) sul link di prova (3/11)
- **Pausa a schede (6/11)**: Build, Rosario, Stati, Opzioni, statistiche del personaggio, Unioni che si scoprono, conferma di Abbandona; sul link di prova e sull'APK di prova, da provare sul S25. LAB → Schermate → Pausa

### Oggetti rompibili (prova, 5/11)

Su `/prova/`: urne con frammenti, giare con Cera, lanterne con luce e chiazze d'olio che bruciano; le armi li rompono; luce e alone si vedono sul telefono. LAB → Eventi → Rompibili. Da decidere durate, armi di fuoco, frammenti e Cera dei nemici (vedi «Da confermare»).

## Prossime tappe

L'ordine **dopo i Patti** è una proposta di Claude, da confermare con Edoardo (vedi «Da confermare»).

1. **Salvataggio della partita in corso** (senza data): dopo pausa, scelta dei doni e menu, prima dei Patti. Riaprendo l'APK o il link si ritrova la partita in pausa, esattamente dov'era. Una sola partita salvata, cancellata alla morte, all'alba o con «Abbandona». Due tappe:
   - **Prima di iniziare**: il tremolio della luce usa il generatore del caso anche a partita ferma, quindi la durata di una pausa cambia i numeri estratti dopo (`attesaTremolio` in `Gioco.ts`). Va separato, altrimenti la notte ricaricata non finisce identica (confermato da Edoardo il 6/11).
   - **Fotografia e ripristino**: tutto ciò che decide la partita (personaggio, armi, doni, Rosario, nemici, Seth e le sue mosse, proiettili, zone, eventi della notte, generatore del caso); numeri del danno, scoppi, tremolio, suoni e animazioni si ricostruiscono. Comandi in LAB → Salvataggio: salva adesso con peso e tempo, ricarica, cancella. Misurato il 5/11: circa 130–140 KB al minuto 14, 5 ms su un Mac rallentato di sei volte; da rimisurare sul S25. Il controllo con il bot (salva, ricarica, la notte finisce identica) entra in `npm run prova`.
   - **Salvataggi automatici e riapertura**: si salva quando l'app va in secondo piano, entrando in pausa, dopo ogni dono e ogni 15 s come riserva (*da rivedere*). All'apertura si entra direttamente nella partita, in pausa; se si era in una scelta di dono o reliquiario, si riapre su quella scelta con le stesse carte.
   - **Aggiornamenti**: il salvataggio porta un numero di versione del formato, che cambia solo quando cambia la struttura di ciò che si salva. Un aggiornamento normale non cancella la partita. Se la versione non combacia o la ricarica fallisce per qualsiasi motivo (dati mancanti, errore durante il ripristino), la partita salvata si cancella, compare un avviso e si torna al menu: il gioco non riparte mai in un errore all'apertura.
2. **Tappa 7 · Patti**: regole scelte nel menu prima della notte, che la rendono più dura e più ricca. Proposti tutti e cinque (Falce, Silenzio, Folla, Buio, Ombra) in [proposte/oggetti-build-sinergie.md](proposte/oggetti-build-sinergie.md); da creare. **Si costruiscono senza tararli**: lo sblocco per ora si raggiunge dal Laboratorio (la scheda LAB nasce insieme ai Patti); la regola di sblocco si decide con il bilanciamento finale. Disegni: 5 icone.
3. **Cappella come hub**: i personaggi nella navata, la scheda con le statistiche vere, la Cera disegnata, 9 icone dei ceri. Viene **dopo** i Patti. Disegni: la Cappella, l'icona della Cera, le icone dei ceri.
4. **Devozione e notti diverse**: 8 livelli di Devozione per personaggio; notti che si sbloccano (nebbia, luna piena, notte dei morti), ognuna con un Seth dalle mosse diverse. Dettagli in [proposte/meta-progressione.md](proposte/meta-progressione.md).
5. **Cero della fiaschetta e questline** con il Ceraiolo (ampolla incrinata → riparata → si riempie battendo Seth). Oggi la fiaschetta c'è dalla prima notte con 3 sorsi. Quando la fiaschetta diventerà uno sblocco, rilanciare la simulazione.
6. **Veggente e Sguattera**: i due personaggi giocabili previsti. Da decidere con Edoardo: la loro affinità (vedi [lore.md](lore.md), *Aperto*), arma iniziale, abilità, ritratto e sprite, come si sbloccano.
7. **Redesign dell'intero gioco** (da collocare nell'ordine con Edoardo): HUD, personaggi, animazioni (`attack`, `special`, `hurt`, `death`), effetti, mosse di Seth, hub, nemici V1 alla scala nuova, scheda del personaggio (con statistiche vere), cornici dei ritratti e Pannello scheda.
8. **Pubblicazione** (senza data):
   - **Google Play: lo apre Edoardo.** 25 dollari una tantum e verifica dell'identità. Per i nuovi account personali servono almeno 12 tester per 14 giorni di fila in prova chiusa prima della pubblicazione. Test interno: aggiornamenti senza Blocco automatico e rapporto automatico pre-lancio. Firebase Test Lab è escluso: chiude il 30/09/2027.
   - **Versione per i tester senza LAB**, con il solo pulsante «Prova prestazioni».
   - **Prove degli amici con Prova prestazioni**, dentro la prova chiusa, così contano anche per quel requisito. Telefono minimo: MediaTek Helio G99 con Mali-G57 MC2 e 4 GB (Galaxy A16 4G, Redmi Note 14 4G); almeno tre famiglie di processore grafico: Mali, Adreno, un telefono di 3–4 anni fa; più avanti un iPhone. Se un telefono non regge si riducono solo gli effetti visivi.
   - **Prestazioni.** Ricostruzione del buio quando un dono allarga la luce: 223–240 ms sul S25; da sistemare prima della pubblicazione.
   - **Dal lato del gioco servono:** identificativo definitivo `com.deathslumen.game` (non si cambia più dopo la prima pubblicazione); compilazione firmata in formato AAB, con una chiave di caricamento propria e numero di versione che cresce a ogni caricamento; icona 512×512, grafica in evidenza 1024×500, almeno due schermate del telefono; titolo, descrizione breve e completa, categoria, contatto; pagina con l'informativa sulla privacy, modulo sui dati raccolti, questionario sui contenuti; controllo delle licenze di caratteri e di ogni asset di terzi.
9. **Più avanti**: mondi e boss nuovi come dungeon in fila nella stessa partita, alla Hades; altri boss oltre Seth; la trama dell'endgame (vedi [lore.md](lore.md)).

## Idee non ancora decise

- Suoni e musica originali al posto di quelli sintetizzati.
- Lingua del gioco: solo italiano, oppure anche inglese (il titolo è in inglese).
- Nemici con uno stile grafico diverso da quello dei personaggi.
- ~~Torce o lumini sparsi nel cimitero~~: superata dalle lanterne rompibili (5/11), in prova.

## Piccole cose da sistemare nel codice (non fatte nel riordino dei documenti)

- Nove commenti in `src/data/` rimandano a `docs/GDD_base.md`: il file ora è `docs/GDD.md`. Si aggiornano alla prossima modifica al codice.
- Il commento in `src/data/nemici.ts` (riga 92) dice «0,04 × (m − 3)²»; il valore vero è 0,06.
- Il CSS usa ancora IM Fell English SC per alcuni titoli (`--f-titolo`: avviso, titolo della scelta dei doni, pannelli, nastri); i titoli decisi sono in Tiny5.
- Disegnare gli asset elencati in [asset_da_creare.md](asset_da_creare.md).

## Mosaici e Vetrate (si riprende più avanti)

Soggetti approvati da Edoardo il 7/11, per il mondo del cimitero, dal meno importante alle rivelazioni. Si sbloccano solo dopo la prima alba vinta.

| # | Soggetto | Cosa racconta | Stato |
| --- | --- | --- | --- |
| 1 | La Veglia | cimitero, mani, fiamma: il Lumen è la luce da custodire | disegnato, nel gioco |
| 2 | L'Ultima Cappella | candele accese nel buio e un Ceraiolo di spalle: resta un solo luogo acceso | da creare |
| 3 | Il Risveglio | una tomba aperta e un morto con una fiamma nel petto: il Lumen non si spegne più | da creare |
| 4 | Le Due Mani | chi abbraccia un morto e chi gli porta una lanterna: il Rinnovo contro la Ricaduta | da creare |
| 5 | La Morte Rinnovata | la falce e una corona di Lumen corrotto: chi è davvero Seth | da creare |

Da costruire: le **Vetrate** nella Cappella (collezione sempre visibile, con un testo breve da epitaffio per ogni mosaico), il passaggio al mosaico successivo, ciò che ogni mosaico sblocca la prima volta e la ricompensa quando se ne ricompleta uno già trovato.

## Da confermare

Tutte le voci «da rivedere» sparse nei documenti: valori e scelte proposti da Claude e non ancora confermati da Edoardo. Quando Edoardo ne conferma una, si toglie da qui e dall'etichetta nel testo.

| Voce | Dove è scritta |
| --- | --- |
| Barre della salute (personaggio 40 × 9 px, Seth alta 12 px; rosso `#c0262d`, vuoto `#3a0c10`) e grandezza del conto alla rovescia dell'abilità (16) | GDD §HUD; `src/data/mondo.ts` (`BARRA_SALUTE`), `src/data/hud.ts` (`BARRA_SETH`, `TESTI`) |
| Copione della notte, respiro (50 s + 10 s al 25%), comparse 1,4 + 2,9 m, tetto 250, bruti al massimo 100, copione e forme delle orde, preavviso 3 s, salute ×3 dal minuto 6, Lumen accorpato a 28 px: tutti i valori. Il bot vince 7 notti su 48 |
| Mosaici: disegno V1, probabilità dell'urna (26%, misurata con il bot che cerca le urne), numeri del Bagliore (20 s, +30% velocità, luce × 1,5), raggio di raccolta 40 px | `docs/asset_da_creare.md`, `docs/GDD.md` |
| Scoperta di un'Unione: Edoardo ha detto «arma e dono al livello massimo», ma l'unione oggi chiede il dono al 3 (5 è il massimo di molti doni). Rimandato al bilanciamento finale (6/11): per ora vale il livello dell'unione | GDD §8f; `LIVELLO_DONO_UNIONE` |
| Animazione della scoperta: segnaposto dal codice; Edoardo la vuole semplice ma con la «scarica di dopamina» dell'evoluzione di un Pokémon; durata da decidere quando ci sarà quella vera; tela e fotogrammi da definire | GDD §8f; `asset_da_creare.md` |
| Abbreviazioni della pausa: Attesa colpi, Colpi, Colpi extra, Durata zone | GDD «La pausa»; `NOMI_CHIARI` in `src/data/spiegazioni.ts` |
| Rompibili: percentuali, gocce, raggi, luce della lanterna, oggetti che non tornano nella notte | GDD 8g, `src/data/rompibili.ts` |
| Chiazze: olio 12 s, fuoco 5 s, rallentamento 40%, 14 danni ogni 0,4 s; armi di fuoco: Candela e Fuoco fatuo | GDD 8g |
| Frammenti: 3 per un reliquiario, contatore fisso nell'HUD sì o no | GDD 8g |
| Cera dei nemici: resta uguale per ora | GDD 8g |
| Luce: sfumatura 1,5, buio 88%, raggio 36% del lato corto, alone caldo | GDD 11, `src/data/mondo.ts` |
| Fasce del telefono, solo i valori: tutte le misure di `FASCE`, `PAUSA_PICCOLA`, `JOYSTICK_PICCOLO`, `SEGNALE_PECCATO` in `src/data/hud.ts` | GDD §11; decisioni 5/11 |
| Pausa piccola al centro della fascia bassa, senza area di tocco invisibile (`PAUSA_PICCOLA.margineTocco` 0) | GDD §11; decisioni 5/11 |
| Tacche (`TACCHE`: lato 4, raggio 31, arco 150°, lampo 0,25 s) e pulsante tondo della fiaschetta composto dalla cornice dell'abilità | GDD §8b e §11 |
| Area sicura fissata dopo 1,5 s dall'apertura (`AREA_SICURA.assestamento`) | GDD §11 |
| Obiettivo sul telefono minimo: media 60, meno dell'1% dei secondi sotto 55, nessun blocco sopra 100 ms, al minuto 14 con 400 nemici e lanterna in vista | decisioni 5/11 |
| Prova prestazioni: 60 s di misura, 3 s di avvio, blocchi sopra 100 ms, secondi sotto 55 fps, build con 6 armi al livello 8 (`PRESTAZIONI`) | GDD «Mondo, luce e comandi» |
| Link pubblico: stessa protezione dalla ricarica in partita del link di prova, quando Edoardo approverà l'unione con `main` | decisioni 5/11 |
| Link di prova: controllo della versione nuova ogni 120 s (`AGGIORNAMENTI.ogni`) | decisioni 5/11 |
| Opacità della base del joystick quando copre un pulsante: 50% (`JOYSTICK_PICCOLO.opacitaSuiPulsanti`) | GDD §11 |
| Campo del telefono più corto: a Cappella vuota il bot vince il 4%; da riguardare con il bilanciamento finale, partendo dal Becchino prima del minuto 5 e da Seth del minuto 10 | bilanciamento 5/11 |
| Leggibilità, secondo passo: nomi delle reazioni (× 2, ogni 2 s, 3 insieme, 90 px), 40 simboli solo sui pesanti, somma dei numeri su élite e Seth (0,5 s, 30 px sopra), cartiglio (scala 0,5, minimo × 2; 1,45 s; dissolvenza 0,3 s), orologio nella colonna di destra. Confermati da Edoardo il 5/11, restano da provare sul suo telefono | GDD §8c, §11 e «Impatto dei colpi»; decisioni 4/11 e 5/11 |
| Scritte delle reazioni: il nome parte 34 px sopra il punto e sta 16 px sopra il numero quando viene spostato | GDD «Impatto dei colpi»; bilanciamento 5/11 |
| Numeri ambra: se una build rende critici la maggior parte dei colpi, rivedere l'ambra. Al massimo livello il Chiodo di bara dà circa il 30% di numeri ambra | GDD «Impatto dei colpi»; decisioni 5/11 |
| Chiodo di bara al massimo: gli ambra sostituiscono i bianchi così spesso che i bianchi durano ~0,03 s. Possibile correzione: un ambra può sostituire solo un bianco visibile da almeno 0,3 s (non applicata) | bilanciamento 5/11 |
| Leggibilità del campo provata solo su telefoni emulati e sul Mac: manca la prova di Edoardo sul Galaxy S25 | decisioni 4/11 e 5/11 |
| Link pubblico: il codice di `prova`, con tutta la leggibilità e gli altri lavori dal 3/11, non è su `main`; il merge aspetta l'approvazione di Edoardo | «I due link» in `CLAUDE.md` |
| Seth molto scuro sullo sfondo notturno e cerchi delle reazioni ancora vistosi: contorno o alone per Seth, cerchi più piccoli o ridisegnati, oppure sprite di Edoardo. Non ancora deciso | `asset_da_creare.md` per i cerchi |
| Nome e numero di una reazione si toccano ancora nell'8% circa dei fotogrammi | GDD «Impatto dei colpi» |
| Con 15 numeri ambra già sullo schermo, il primo colpo di una reazione può restare fuori dalla somma mostrata; visto solo in una prova forzata, il danno vero non cambia | GDD «Impatto dei colpi» |
| Leggibilità nella folla: lampo del nemico (0,033 s, uno ogni 0,3 s, 50% su bruti/élite/Seth) e al massimo 15 numeri del danno; si provano dal LAB | GDD §10 e «Impatto dei colpi»; decisioni 4/11 |
| Sblocchi di armi e doni nuovi (tappa 5): imprese (10 Eclissi, 30000 anime per il Corvo, 3 minuti nelle nubi per il Velo, 20 schivate perfette) e costi (120 Cera; Campanella con impresa o 120) | GDD §8d |
| «Reliquie dimenticate» semplificate in acquisti dalla Cappella (nella proposta si trovavano in partita) | GDD §8d; decisioni 4/11 |
| Rosario: 3 grani di partenza, Peccato ×2, sblocco «Sopravvivi 8 minuti» o 300 Cera, 3 amuleti per reliquiario | GDD §8e; decisioni 3/11 |
| Patti: valori dei cinque patti e regola di sblocco (decisa con il bilanciamento finale) | tappa 7 qui sopra; proposte |
| Obiettivi di vittoria del bot per Cappella (provvisori) | bilanciamento |
| «Capi» come parola generica per i boss nel testo del Fuoco fatuo | decisioni 4/11 |
| Posto del redesign nell'ordine delle tappe | qui sopra |
| Ordine delle tappe dopo i Patti (Cappella hub, Devozione e notti, questline, Veggente e Sguattera, redesign): proposto da Claude | «Prossime tappe» qui sopra |
| Danza macabra: recupero di 3 s, da provare a mano da Edoardo | GDD §8e (amuleti) |
| Correzioni agli oggetti del 9/11 (valori di Claude su richiesta di Edoardo): Vanga 1,5 s con la pausa del Sepolto (4 s); Acquasantiera un sorso ogni 45 s al massimo; Lucciola 2 grani e pausa 4 s; Ossa d'élite 2 grani; Martire 2 grani, onda senza danno che consacra e ferma 0,6 s; Ceri gemelli ricarica +10% | GDD §8e e §8f; bilanciamento 9/11 |
| Il bot non prende mai Martire, Patto di sangue, Specchio rotto, Cuore avido e Lanterna cieca: le loro misure restano a zero finché non si decide se deve provarli | `amuletiPreferiti` in `src/data/bot.ts`; bilanciamento 9/11 |
| Affinità della Veggente e della Sguattera | lore (*Aperto*) |
