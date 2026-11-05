# Asset da creare (Edoardo)

Elenco di ciò che Edoardo deve ancora disegnare. Nel gioco c'è un segnaposto per ognuno (disegnato dal codice o preso dalla v0). Aggiornalo quando si aggiunge o si consegna qualcosa.

| Asset | Dove serve | Stato / segnaposto |
| --- | --- | --- |
| **Fascia_Alta_V1** (`HUD/Pannelli/`, tela 376×124 px) | fascia alta del telefono: una sola, neutra, per tutti i personaggi | disegnata dal codice in `src/sistema/segnaposto-fasce.ts`. Sul S25 si vedono i 270×81 centrali in fondo alla tela; **filo chiaro di 1 px sull'ultima riga**, verso il campo, visibile anche contro il buio più fitto; le prime 27 righe visibili sono nell'area sicura (foro della fotocamera): niente dettagli lì |
| **Fascia_Bassa_V1** (`HUD/Pannelli/`, tela 376×124 px) | fascia bassa del telefono | come sopra. Sul S25 si vedono i 270×94 centrali in cima alla tela; **filo chiaro di 1 px sulla prima riga**, verso il campo; niente incavi per i pulsanti finché la disposizione non è confermata |
| **Barra_Seth_Cornice_V1** (`HUD/Barre/`, 225×14 px, finestra in x 10, y 4, 205×6) e **Barra_Seth_Piena_V1** (205×6 px) | barra sottile di Seth, nella riga dell'orologio | disegnate dal codice; se la finestra cambia va aggiornato `FINESTRE.Barra_Seth_Cornice` in `src/data/hud.ts` |
| **Fiaschetta_Lumen_Tonda_V1** (`HUD/Pulsanti/`, tela 77×86 px come l'anello dell'abilità: stessa cornice dell'abilità, icona della fiala dentro; centro in x 39, y 36, disco interno di raggio 19) | pulsante della fiaschetta | composto dal codice in `src/sistema/fiaschetta.ts` con la cornice dell'abilità e una fiala di 15×23 px. **Tacche, da rispettare:** quadretti di 4×4 px con 1 px di bordo, a 31 px dal centro, su un arco di 150° sopra il pulsante (fino a 5 tacche, 37,5° l'una dall'altra): nessun dettaglio importante lì. Le disegna il codice (`TACCHE`, `src/data/hud.ts`) |
| **Pulsante_Pausa_Piccolo_V1** (`HUD/Pulsanti/`, 34×34 px) | pausa nella fascia bassa | disegnato dal codice |
| Joystick_Base_Piccola (56×56 px) e Joystick_Pomello_Piccolo (24×24 px), in `HUD/Pulsanti/` | joystick sul telefono in verticale | cerchi dal codice |
| Targhetta dell'orologio (circa 38×16 px), facoltativa | riga dell'orologio | nessuna: solo le cifre |
| **Goccia di cera** (oggetto a terra, 8×11 px circa; se vuole anche una versione grande per i mucchi di Seth) | gocce di Cera lasciate dai nemici | disegnata dal codice in `src/sistema/oggetti.ts`; il file `OGGETTI/Goccia_cera_V1.aseprite` la sostituisce |
| **10 icone degli amuleti** (24×24, `Icona_Amuleto_<id>`: specchioRotto, lanternaCieca, cuoreAvido, sangueFreddo, martire, danzaMacabra, ceriGemelli, lucciola, ossaDelite, pattoDiSangue) e il **grano del Rosario** | Rosario: carte del reliquiario, pausa, HUD | grani colorati disegnati dal codice (`src/sistema/amuleti.ts`) |
| **Simboli degli stati** (circa 11×11 px: `EFFETTI/Simbolo_Abbagliato_V1.aseprite`, `Simbolo_Consacrato`, `Simbolo_Maledetto`, `Simbolo_Sepolto`) | sopra la testa dei nemici | disegnati dal codice in `src/sistema/simboli.ts` (sole, croce, teschio, lapide); ogni file li sostituisce da solo |
| **Striscia del dono** (170×62 px: `HUD/Cornici/Striscia_Dono_V1.aseprite` e `Striscia_Dono_Scelta_V1.aseprite`, pozzetto icona in x 5, y 5, 34×52) | scelta dei doni e reliquiari | provvisoria dal codice in `src/sistema/scheda.ts`; le misure interne sono in `STRISCIA`, `src/data/hud.ts` |
| **8 icone** (24×24: `Icona_Lapide`, `Icona_Rosario_spezzato`, `Icona_Corvo`, `Icona_Velo_funebre`, `Icona_Cera_votiva`, `Icona_Chiodo_di_bara`, `Icona_Lacrima_di_lumen`, `Icona_Campanella_d_argento`, in `ICONE/<Nome>/`) | armi e doni nuovi; le stesse icone fanno da sprite provvisori di lapide, grano e corvo | disegnate dal codice in `src/sistema/segnaposto-oggetti.ts`; ogni file le sostituisce da solo |
| **Effetti delle armi nuove** (lapide che cade, grano, corvo in volo con le ali, aura del Velo) | in partita | icone ingrandite e cerchio a retino dal codice |
| **10 icone delle unioni** (24×24, `Icona_Unione_<id>`: faroDeiMorti, vangaDelCustode, incensiereUltimaOra, vergaDeiNomi, candelabroFunebre, falceDelMietitore, campanaAMorto, fuochiErranti, acquasantiera, lamaDellAlba) | caselle, strisce, legenda | icona dell'arma con angoli d'oro, dal codice in `src/sistema/segnaposto-oggetti.ts` |
| **Effetti delle unioni** (cerchio del Faro, fiamma della scia, lapide della Vanga, colpo della Verga…) | in partita | effetti esistenti riusati |
| **Urna, Giara, Lanterna** (`OGGETTI/<Nome>/<Nome>_V1.aseprite`, 88×64 con base in basso al centro, tag `idle` e `death`) | oggetti rompibili | prove nate da ChatGPT e ripulite da Claude: da confermare o ridisegnare; un `_V2` le sostituisce da solo |
| **Chiazza d'olio e fuoco** (circa 192×192 px: `Chiazza_olio` che si asciuga, `Chiazza_fuoco` animata) | lanterna rotta | disegnate dal codice a retino in `src/sistema/chiazze.ts` |
| **Frammento di reliquia** (10×9 px circa, `OGGETTI/Frammento/Frammento_V1.aseprite`) e **contatore fisso** nell'HUD se Edoardo lo vuole | urne | scheggia d'oro in `src/sistema/oggetti.ts`; per ora lo spiega il cartiglio |
| **Seth, il Rinnovato** (sprite e barra) | boss dei minuti 5 e 10 | `Il_Mietitore` e `Barra_Mietitore` |
| Cerchi delle reazioni (Eclissi, Rivelazione, Esorcismo, Interramento) | reazioni tra stati | cerchi a retino dal codice |
| Preavvisi e falci delle mosse di Seth | boss | cerchi rossi a retino dal codice |
| Cornici dei ritratti e Pannello scheda | selezione del personaggio | quelle di prima, da rinnovare |
| Targa lapide, Scrigno, emblemi, anelli grigio/arancio | interfaccia | fuori dal gioco per ora |
| Pulsante_Pericolo | «Abbandona» | provvisorio |
| Paesaggio sotto la citazione della scheda | selezione | cielo con colline in CSS |
| **La Cappella** (navata con i personaggi in piedi), **icona della Cera**, **9 icone dei ceri** | Cappella come hub (dopo i Patti) | schermata a elenco, senza disegni |
| **5 icone dei Patti** (Falce, Silenzio, Folla, Buio, Ombra) | menu prima della notte (tappa 7) | da creare insieme al codice |
| **Veggente e Sguattera** (ritratti, sprite in gioco, icone, abilità) | personaggi giocabili previsti | non esistono ancora; affinità da decidere |
| **Il Ceraiolo** (custode della Cappella) | guida, questline della fiaschetta | non esiste ancora |
| **Suoni e musica veri** | tutto il gioco | suoni sintetizzati dal codice (`src/sistema/audio.ts`) |
| Nemici V1 alla scala nuova | tutti i nemici | segnaposto V0 ×2 |
| Effetti e icone delle armi alla scala nuova | armi | segnaposto V0 |
