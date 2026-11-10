# Asset da creare (Edoardo)

Elenco di ciò che Edoardo deve ancora disegnare. Nel gioco c'è un segnaposto per ognuno (disegnato dal codice o preso dalla v0). Aggiornalo quando si aggiunge o si consegna qualcosa.

| Asset | Dove serve | Stato / segnaposto |
| --- | --- | --- |
| **Fascia_Alta_V1** (`HUD/Pannelli/`, tela 376×124 px) | fascia alta del telefono: una sola, neutra, per tutti i personaggi | disegnata dal codice in `src/sistema/segnaposto-fasce.ts`. Sul S25 si vedono i 270×81 centrali in fondo alla tela; **filo chiaro di 1 px sull'ultima riga**, verso il campo, visibile anche contro il buio più fitto; le prime 27 righe visibili sono nell'area sicura (foro della fotocamera): niente dettagli lì |
| **Fascia_Bassa_V1** (`HUD/Pannelli/`, tela 376×124 px) | fascia bassa del telefono | come sopra. Sul S25 si vedono i 270×94 centrali in cima alla tela; **filo chiaro di 1 px sulla prima riga**, verso il campo; niente incavi per i pulsanti finché la disposizione non è confermata |
| **Barra_Seth_Cornice_V1** (`HUD/Barre/`, 225×14 px, finestra in x 10, y 4, 205×6) e **Barra_Seth_Piena_V1** (205×6 px) | barra sottile di Seth, nella riga dell'orologio | non più usate (10/11): la barra di Seth ora è un rettangolo rosso con i numeri; della cornice conta solo la lunghezza della finestra (`FINESTRE.Barra_Seth_Cornice` in `src/data/hud.ts`) |
| **Fiaschetta_Lumen_Tonda_V1** (`HUD/Pulsanti/`, tela 77×86 px come l'anello dell'abilità: stessa cornice dell'abilità, icona della fiala dentro; centro in x 39, y 36, disco interno di raggio 19) | pulsante della fiaschetta | composto dal codice in `src/sistema/fiaschetta.ts` con la cornice dell'abilità e una fiala di 15×23 px. **Tacche, da rispettare:** quadretti di 4×4 px con 1 px di bordo, a 31 px dal centro, su un arco di 150° sopra il pulsante (fino a 5 tacche, 37,5° l'una dall'altra): nessun dettaglio importante lì. Le disegna il codice (`TACCHE`, `src/data/hud.ts`) |
| **Pulsante_Pausa_Piccolo_V1** (`HUD/Pulsanti/`, 34×34 px) | pausa nella fascia bassa | disegnato dal codice |
| Joystick_Base_Piccola (56×56 px) e Joystick_Pomello_Piccolo (24×24 px), in `HUD/Pulsanti/` | joystick sul telefono in verticale | cerchi dal codice |
| Targhetta dell'orologio (circa 38×16 px), facoltativa | riga dell'orologio | nessuna: solo le cifre |
| **Scheda del Play Store**: grafica in evidenza 1024×500 px e icona 512×512 px | prova chiusa e pubblicazione su Google Play | c'è `public/icons/icon-512.png`; la grafica in evidenza non esiste |
| **Goccia di cera** (oggetto a terra, 8×11 px circa; se vuole anche una versione grande per i mucchi di Seth) | gocce di Cera lasciate dai nemici | disegnata dal codice in `src/sistema/oggetti.ts`; il file `OGGETTI/Goccia_cera_V1.aseprite` la sostituisce |
| **10 icone degli amuleti** (24×24, `Icona_Amuleto_<id>`: specchioRotto, lanternaCieca, cuoreAvido, sangueFreddo, martire, danzaMacabra, ceriGemelli, lucciola, ossaDelite, pattoDiSangue) e il **grano del Rosario** | Rosario: carte del reliquiario, pausa, HUD | grani colorati disegnati dal codice (`src/sistema/amuleti.ts`) |
| **Simboli degli stati** (11×11 px: `EFFETTI/Simbolo_<Nome>/Simbolo_<Nome>_V2.aseprite`) | sopra la testa dei nemici | **V2 del 6/11**: ridisegnati pixel per pixel da Claude a partire dalle prove di ChatGPT (sole giallo, croce bianca e oro, teschio viola, lapide grigio terra); da confermare o ritoccare, un `_V3` li sostituisce da solo |
| **Striscia del dono** (170×62 px: `HUD/Cornici/Striscia_Dono_V1.aseprite` e `Striscia_Dono_Scelta_V1.aseprite`, pozzetto icona in x 5, y 5, 34×52) | scelta dei doni e reliquiari | provvisoria dal codice in `src/sistema/scheda.ts`; le misure interne sono in `STRISCIA`, `src/data/hud.ts` |
| **4 icone delle abilità** (`ICONE/<Nome>/Icona_<Nome>_V1.aseprite`: Cerchio di luce, Sepoltura, Benedizione, Rito proibito; 38×38 px, tonde, riempiono il disco interno dell'anello) | pulsante dell'abilità | **V1 del 10/11**: ridotte da Claude dalla tavola di Edoardo (ritaglio grande accanto, `_originale.png`), 32 colori; da ritoccare a mano se serve, un `_V2` le sostituisce da solo |
| **8 icone** (24×24: `Icona_Lapide`, `Icona_Rosario_spezzato`, `Icona_Corvo`, `Icona_Velo_funebre`, `Icona_Cera_votiva`, `Icona_Chiodo_di_bara`, `Icona_Lacrima_di_lumen`, `Icona_Campanella_d_argento`, in `ICONE/<Nome>/`) | armi e doni nuovi; le stesse icone fanno da sprite provvisori di lapide, grano e corvo | disegnate dal codice in `src/sistema/segnaposto-oggetti.ts`; ogni file le sostituisce da solo |
| **Effetti delle armi nuove** (lapide che cade, grano, corvo in volo con le ali, aura del Velo) | in partita | icone ingrandite e cerchio a retino dal codice |
| **Sampietrini** (10/11): **icona** `ICONE/Sampietrini/Icona_Sampietrini_V1.aseprite` (24×24), **sasso in volo** e **polvere dell'impatto**, grandi quanto l'area che colpiscono: l'area è un cerchio di 40 px di raggio (80 px di diametro a scala di gioco; con lo Stoppino lungo al massimo 60 px di raggio, 120 di diametro). Il sasso provvisorio è 20×16 px ingrandito × 4 (80 px di larghezza): un disegno di 20×16 (tag `idle`) va bene, il gioco lo ingrandisce di un intero fino alla larghezza dell'area; disegnato già a 80×64 si ingrandirebbe × 1. Polvere: tela di 82×82 (il cerchio di 80 più un pixel di bordo), tag `idle` di circa 0,3 s, centrata sul punto d'impatto, il bordo della polvere sul bordo dell'area | arma nuova, libera da subito | icona e sasso disegnati dal codice in `src/sistema/segnaposto-oggetti.ts` (ciottolo grigio 20×16); polvere dal codice in `src/sistema/effetti.ts` (anello seppia a scacchi largo quanto l'area, pieno e poi a retino, 0,3 s) |
| **Icona dell'unione Selciato** (24×24, `Icona_Unione_selciato`) | caselle, strisce, pausa | icona dei Sampietrini con quattro angoli d'oro, dal codice |
| **Pozza che cura dell'Acquasantiera** (stessa tela della pozza dell'Acqua santa, oppure un velo sopra di lei) | Acquasantiera con la fiaschetta piena | la pozza dell'Acqua santa tinta d'oro dal codice |
| **Scintilla dello sfioramento** (circa 6×6 px, 2–3 fotogrammi). L'indicatore delle tacche (scelta del 10/11) è un rettangolo sotto la barra della salute, largo e alto come lei (40×9 pixel disegnati, si allarga con le cifre come la barra), diviso in 8 caselle: è disegnato dal codice come la barra, non serve un file; solo se vuoi un altro aspetto, una casella piena e una vuota di circa 4×7 | Grazia a tacche | crocetta dal codice in `src/sistema/grazia.ts`, caselle azzurre e blu notte (colori da rivedere); suono secco sintetizzato |
| **Animazione della scoperta di un'Unione** (`EFFETTI/Unione_Scoperta_V1.aseprite`, da definire insieme: tela, fotogrammi e se usa le icone dell'arma e del dono) | a tutto schermo quando arma e dono arrivano ai livelli dell'unione; dura circa 1,5 s prima che compaia l'Unione, poi resta finché il giocatore non tocca; vuole l'effetto «scarica di dopamina» dell'evoluzione di un Pokémon | fatta dal codice in `src/sistema/rivelazione.ts`: icone che si avvicinano, lampo a retino, Unione. LAB → Schermate → Scoperta di un'Unione |
| **10 icone delle unioni** (24×24, `Icona_Unione_<id>`: faroDeiMorti, vangaDelCustode, incensiereUltimaOra, vergaDeiNomi, candelabroFunebre, falceDelMietitore, campanaAMorto, fuochiErranti, acquasantiera, lamaDellAlba) | caselle, strisce, pausa | icona dell'arma con angoli d'oro, dal codice in `src/sistema/segnaposto-oggetti.ts` |
| **Effetti delle unioni** (cerchio del Faro, fiamma della scia, lapide della Vanga, colpo della Verga…) | in partita | effetti esistenti riusati |
| **Urna, Giara, Lanterna** (`OGGETTI/<Nome>/<Nome>_V1.aseprite`, 88×64 con base in basso al centro, tag `idle` e `death`) | oggetti rompibili | prove nate da ChatGPT e ripulite da Claude: da confermare o ridisegnare; un `_V2` le sostituisce da solo |
| **Chiazza d'olio e fuoco** (circa 192×192 px: `Chiazza_olio` che si asciuga, `Chiazza_fuoco` animata) | lanterna rotta | disegnate dal codice a retino in `src/sistema/chiazze.ts` |
| **Frammento di vetro** (15×16 px, `OGGETTI/Frammento/Frammento_V3.aseprite`) | urne | **V3 del 6/11**: pezzo di vetrata con la punta in basso e il piombo in alto; 3 fotogrammi = 3 colori, in quest'ordine: rosso, verde, blu scuro. Il gioco ne sceglie uno per ogni drop |
| **Mosaico della Veglia** (`HUD/Mosaico/Mosaico_V1.aseprite`, 128×128 px; 4 fotogrammi: spento, 1/3, 2/3, completo; originale di ChatGPT in `HUD/Mosaico/Mosaico_originale.png`) | compare a ogni frammento di vetro | **V1 del 6/11**: cimitero, mani e fiamma con le tre stelle; riportato alla griglia da Claude, stelle e fiamma ripassate a mano; da confermare. LAB → Eventi → Mosaico: pezzo dopo |
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
| **Lumen (anime)** `OGGETTI/Anima_piccola`, `Anima_media`, `Anima_grande` (`_V2.aseprite`, 9×11, 11×14, 15×19 px su tela 24×24, tag `idle`) | gemme che cadono dai nemici | **V2 del 6/11**: ridisegnati pixel per pixel da Claude; stessa sagoma nei 4 fotogrammi, il battito è dato dalla luce e da una scintilla (rosso, ambra, azzurro: colori delle stelle); da confermare |
| **4 mosaici** (L'Ultima Cappella, Il Risveglio, Le Due Mani, La Morte Rinnovata) | Vetrate e frammenti | si riprendono più avanti: soggetti in `docs/roadmap.md` |
| **Effetto del Bagliore** (alone sul personaggio) | mosaico completo | lampi d'oro sullo sprite, dal codice |
| **Preavviso delle orde** (bordo del campo) | orde | striscia rossa a retino dal codice |
| Nemici V1 alla scala nuova | tutti i nemici | segnaposto V0 ×2 |
| Effetti e icone delle armi alla scala nuova | armi | segnaposto V0 |

## La pausa: misure per ridisegnarla

Oggi cornici e schede le disegna il CSS (`.pausa-*` in `src/stile.css`); pulsanti, icone e simboli sono già i tuoi. Le misure sono in **pixel disegnati**: la stessa unità di `Fascia_Alta`, e sul S25 uno vale 2 pixel di gioco, cioè 4 pixel fisici e 1,33 punti. Le misure vengono da `PAUSA` in `src/data/hud.ts`, lette dal gioco vero con il caso pieno; se cambiano, questa tabella va rimisurata.

Larghezze e altezze cambiano da telefono a telefono: chi ha una misura a intervallo va disegnato con un **centro ripetibile**, in tre pezzi (inizio, centro, fine) o nove pezzi se si allunga nei due sensi. Ogni pezzo è un file a sé.

| Elemento | Sul Galaxy S25 | Sugli altri telefoni | Come si adatta |
| --- | --- | --- | --- |
| **Quadro intero** (schermata) | 270×585 | da 270×600 a 375×780 | tutto lo schermo; le prime 27 righe del S25 sono area sicura |
| **Striscia in alto** (`Pausa_Testata`) | 270×60 | larga come lo schermo, alta da 38 a 74 | si ripete in larghezza. Le voci vanno a capo: una, due o tre righe di dati |
| **Riga «in attesa»** | 270×16 | larga come lo schermo | si ripete in larghezza |
| **Pagina** (fondo) | 270×383 | da 270×420 a 375×533 | nove pezzi o fondo pieno: il contenuto ci scorre sopra |
| **Riquadro di dettaglio** (`Pausa_Dettaglio`) | 258×106 | larga da 258 a 363, alta almeno 84 | nove pezzi: cresce con il testo. Margine interno 5 ai lati e 4 sopra e sotto |
| **Casella** (`Pausa_Casella`, piena, scelta, vuota, unita) | cornice 28×28, icona 24×24, spazio di tocco 43×34 | cornice 28 × il suo ingrandimento (28×28 o 42×42 disegnati dove un pixel disegnato vale 1 punto) | misura fissa: tre o quattro disegni. Numero del livello in basso a destra |
| **Riga delle caselle** | 6 caselle in 258 | 6 caselle in 258–363 | la cornice resta al centro del suo spazio |
| **Scheda** (`Pausa_Scheda`, spenta e accesa) | 67,5×68 con 4 schede, 90×68 con 3 | con 4 schede da 67,5 a 94, alta da 68 a 85 | tre pezzi. La scritta è al centro. Lascia un angolo libero di 4×4 per il segno rosso del Peccato |
| **Fascia di Riprendi** | 270×48 | larga come lo schermo, alta 48–60 | si ripete in larghezza. Dentro c'è `Pulsante_Acceso`, 101×24 disegnati |
| **Riga di un amuleto** (`Pausa_Amuleto`) | 258 × 70–85 | larga 258–363 | nove pezzi: l'altezza dipende dal testo. Icona 24×24 a sinistra, interruttore a destra |
| **Riga di un'Unione** (`Pausa_Unione`) | 258×67 | come sopra | nove pezzi; bordo sinistro di 2 per lo stato |
| **Grano del Rosario** | 6×6 | uguale | pieno, vuoto, di troppo |
| **Finestra di conferma** (`Pausa_Conferma`) | 159×157 | larghezza = `Pulsante_Pericolo` + 12 di margine | nove pezzi. Dentro: `Pulsante_Scuro` e `Pulsante_Pericolo` |

Su computer e tablet (un pixel disegnato = 1 punto): quadro 680×660, colonna delle schede larga 214, ogni scheda 214×44, pagina 464×604, fascia di Riprendi 214×60.

Per controllare un disegno: LAB → Schermate → Pausa → **Caso pieno** mostra ogni elemento al massimo. Dimmi quando i file sono pronti: li collego io, indicandomi quali pezzi hai disegnato.
