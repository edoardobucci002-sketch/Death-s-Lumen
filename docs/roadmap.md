# Roadmap

Un solo piano di lavoro, aggiornato a ogni tappa (12 novembre 2026: pivot verso il gioco a stanze, vedi sotto). Ogni tappa finisce con qualcosa che Edoardo può provare, di norma dal Laboratorio sul link di prova (vedi «Verifica» in `CLAUDE.md`). Il dettaglio dei contenuti è nel [GDD](GDD.md), le scelte in [decisioni.md](decisioni.md), i numeri e le simulazioni in [bilanciamento.md](bilanciamento.md).

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
| M8 · Bilanciamento e oggetti | Bot di simulazione, ritocco dei numeri, meta progressione e oggetti della [proposta](proposte/oggetti-build-sinergie.md) | **chiusa dal pivot del 12/11**: le parti fatte sono qui sotto; le voci aperte del survivor sono in «Da confermare». Obiettivi del bot **provvisori e non vincolanti** (9/11 sera, con orde e correzioni agli oggetti: Cappella vuota 7/48, a metà 22/48, completa 20/48): si tara alla fine, a contenuti completi ([bilanciamento.md](bilanciamento.md)). Da riprovare a mano |

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
- **Prove sugli stati (10/11)**: notti esplorative del bot (`esplora`) e interruttore «Stati certi» nel LAB (Eventi), spento di partenza; risultati in [bilanciamento.md](bilanciamento.md). Da decidere se tenerlo
- **Effetti pixelfx (chiusa la prova 11/11)**: Pozza dell'Acqua santa ed Eclissi (12 fps) di serie; Sepoltura pixelfx spenta, si rifà dopo il rework del combattimento; lacrime di Lumen: unione solo verso il personaggio, 56 px, confermate
- **Devozione, Voti e Riti (11/11)**: una voce alla volta, con la simulazione dopo ognuna (bilanciamento 11/11)
- **Redesign delle build chiuso (11/11)**: tetti degli stati; ritocchi a Incensiere dell'ultima ora, Falce di Seth, Corvo e Lama di luce (il Candelabro funebre lasciava già Abbagliato); quattro Unioni nuove, Lapide inchiodata, Rosario dei vespri, Stormo del lutto e Sudario (15 Unioni in tutto). Restano le prove a mano di Edoardo e una guida dentro il gioco (vedi «Da portare nelle sessioni future»)
- **Prova «pochi e forti» (12/11)**: interruttori nel LAB (Eventi → «Pochi e forti», «Armi solo nello schermo»), spenti di partenza; la simulazione misura anche la vita visibile, gli uccisi fuori schermo e chi li uccide. Nessuna versione raggiunge le tre soglie; risultati in [bilanciamento.md](bilanciamento.md). Decide Edoardo
- **Confronto per il pivot (12/11)**: la simulazione misura i nemici morti senza reazioni né stati e quanto vivono, per fase della notte; risultati in [bilanciamento.md](bilanciamento.md), dato di partenza per il ramo `hades`. Tag `survivor-v1` creato il 12/11 (commit ab992d3)
- **Pivot verso l'action roguelite a stanze (12/11)**: proposta di Edoardo salvata in [proposte/pivot-hades.md](proposte/pivot-hades.md) con le correzioni decise insieme ([decisioni.md](decisioni.md), 12/11). Le «Prossime tappe» qui sotto sono quelle del survivor e vanno riscritte per il genere nuovo, con CLAUDE.md, GDD e LEGGIMI: è il prossimo passo da decidere con Edoardo
- **Regole del 10/11 (sera)**: Stati certi e Lanterna e Pala che mirano diventano la regola (nel LAB restano gli interruttori per tornare indietro), ritmo delle zone, vincolo del Lampionaio, tacche a pixel interi
- **Misure del 10/11 (pomeriggio)**: «Pane e vino» da solo, raccolta della Calamita in pixel, indicatore delle tacche sotto la barra, Grazia in pausa e a fine notte, sasso e polvere dei Sampietrini grandi quanto l'area; regole degli Stati certi una alla volta, Sampietrini e amuleti rari misurati con il bot, interruttore «Lanterna e Pala mirano» (LAB → Oggetti), Prova prestazioni da una partita. Risultati in [bilanciamento.md](bilanciamento.md)
- **Pausa a schede (6/11)**: Build, Rosario, Stati, Opzioni, statistiche del personaggio, Unioni che si scoprono, conferma di Abbandona; sul link di prova e sull'APK di prova, da provare sul S25. LAB → Schermate → Pausa

### Oggetti rompibili (prova, 5/11)

Su `/prova/`: urne con frammenti, giare con Cera, lanterne con luce e chiazze d'olio che bruciano; le armi li rompono; luce e alone si vedono sul telefono. LAB → Eventi → Rompibili. Da decidere durate, armi di fuoco, frammenti e Cera dei nemici (vedi «Da confermare»).

## Gioco a stanze (dal 12/11)

Il gioco cambia genere: da survivor-like ad action roguelite a stanze, alla Hades. Il progetto è in [proposte/pivot-hades.md](proposte/pivot-hades.md); il survivor è congelato nel tag `survivor-v1` e resta il link pubblico. Il gioco a stanze nasce **accanto** al survivor sul link di prova (decisione di Edoardo del 12/11): le regole del passaggio sono in `CLAUDE.md`, sezione «Il passaggio al gioco a stanze». L'ordine dei passi è una proposta di Claude, da confermare con Edoardo (vedi «Da confermare»).

**Fatto (12/11):** proposta di Edoardo salvata con le correzioni; tag `survivor-v1`; CLAUDE.md, LEGGIMI, GDD, roadmap, lore, bilanciamento e asset riallineati al passaggio.

### La fetta verticale minima

Un pezzo piccolo ma completo del gioco, da giocare dall'inizio alla fine («verticale» non c'entra con l'orientamento dello schermo). Contenuto deciso da Edoardo il 12/11: il Lampionaio, 3 stanze collegate da porte con le 3 carte, 2 tipi di nemico che attaccano con un avviso, attacco a tasto, Grazia, abilità caricata colpendo; niente Boss, Sosta né meta. Serve a capire se combattere è divertente sul telefono. Ogni passo finisce con qualcosa da provare sull'APK di prova, dal LAB.

1. **Riordino di `src/sistema/armi.ts`, da fare insieme a Edoardo.** Era previsto prima di Veggente e Sguattera; con il pivot viene prima di tutto, perché l'arma iniziale diventa un'arma a tasto mentre gli Echi restano automatici. Oggi è un solo «arsenale» di 1.730 righe con tutte le 15 armi: si divide per famiglie (colpi vicini, proiettili, zone a terra) a gioco identico, verificato con il bot (stesso seme, stessa notte).
2. **La stanza.** Scena nuova accanto al survivor, raggiungibile solo dal link di prova: dal menu e dal LAB (scheda nuova per il gioco a stanze). In orizzontale; sul telefono in verticale chiede di ruotarlo. Una stanza chiusa da muri, il Lampionaio che cammina con il joystick, luce e buio come oggi.
3. **L'attacco a tasto.** La Lanterna come arma iniziale: sul telefono tocco = nemico più vicino, trascinamento = mira; su computer clic e J (*da rivedere*). Tasti disposti stile Brawl Stars, misure provate sul Galaxy S25 (*da rivedere*). L'animazione `attack` del Lampionaio ha un segnaposto finché Edoardo non la disegna.
4. **Due nemici che attaccano con un avviso.** Quali nemici, e come attaccano, si sceglie con Edoardo. Ogni attacco ha un avviso chiaro; la schivata perfetta dà la Grazia.
5. **L'abilità caricata colpendo.** Il Cerchio di luce si carica solo con i colpi della Lanterna (quanto per colpo: *da rivedere*).
6. **Tre stanze, porte e carte.** A stanza ripulita le 3 carte (le strisce di oggi); poi 2 o 3 porte che mostrano la loro ricompensa (un'affinità o il dono). Gli Echi sono le armi automatiche di oggi. La fetta finisce dopo la terza stanza.
7. **La prova di Edoardo sull'APK del S25** e la decisione: approvare la fetta (allora il codice del survivor si toglie e le regole di passaggio di `CLAUDE.md` decadono) o correggerla.

### Dopo la fetta (ordine da decidere con Edoardo)

- Armi su 5 livelli con il potenziale del livello 5; la quarta arma della Terra; Reliquiari, Unioni al livello 4, porte d'élite.
- Mini-boss, Boss (Seth e gli altri capi), Sosta e Lacrime di Lumen; un Mondo intero, poi tre.
- Il bot che gioca a stanze, le simulazioni e le regole vincolanti nuove.
- Meta: Ceri a budget, Pegno, Cera per Mondo completato.
- Ciò che resta, ripensato per le stanze (decisione di Edoardo del 12/11): Grazia, oggetti rompibili, Patti, Mosaici e Vetrate, Devozione, salvataggio della partita in corso.
- Calice riverso: il nome nuovo del dono «Lacrima di lumen» entra nel codice, con la sua icona.
- Veggente e Sguattera; la pubblicazione.

## Tappe del survivor (sospese dal pivot del 12/11)

Scritte per il survivor, prima del pivot. Ogni voce dice in corsivo che cosa diventa nel gioco a stanze.

L'ordine **dopo i Patti** era una proposta di Claude (superata dal pivot).

1. **Salvataggio della partita in corso** (senza data): dopo pausa, scelta dei doni e menu, prima dei Patti. Riaprendo l'APK o il link si ritrova la partita in pausa, esattamente dov'era. Una sola partita salvata, cancellata alla morte, all'alba o con «Abbandona». Due tappe: *Nel gioco a stanze: resta, si progetta per la Veglia.*
   - **Prima di iniziare**: il tremolio della luce usa il generatore del caso anche a partita ferma, quindi la durata di una pausa cambia i numeri estratti dopo (`attesaTremolio` in `Gioco.ts`). Va separato, altrimenti la notte ricaricata non finisce identica (confermato da Edoardo il 6/11).
   - **Fotografia e ripristino**: tutto ciò che decide la partita (personaggio, armi, doni, Rosario, nemici, Seth e le sue mosse, proiettili, zone, eventi della notte, generatore del caso); numeri del danno, scoppi, tremolio, suoni e animazioni si ricostruiscono. Comandi in LAB → Salvataggio: salva adesso con peso e tempo, ricarica, cancella. Misurato il 5/11: circa 130–140 KB al minuto 14, 5 ms su un Mac rallentato di sei volte; da rimisurare sul S25. Il controllo con il bot (salva, ricarica, la notte finisce identica) entra in `npm run prova`.
   - **Salvataggi automatici e riapertura**: si salva quando l'app va in secondo piano, entrando in pausa, dopo ogni dono e ogni 15 s come riserva (*da rivedere*). All'apertura si entra direttamente nella partita, in pausa; se si era in una scelta di dono o reliquiario, si riapre su quella scelta con le stesse carte.
   - **Aggiornamenti**: il salvataggio porta un numero di versione del formato, che cambia solo quando cambia la struttura di ciò che si salva. Un aggiornamento normale non cancella la partita. Se la versione non combacia o la ricarica fallisce per qualsiasi motivo (dati mancanti, errore durante il ripristino), la partita salvata si cancella, compare un avviso e si torna al menu: il gioco non riparte mai in un errore all'apertura.
2. **Tappa 7 · Patti**: regole scelte nel menu prima della notte, che la rendono più dura e più ricca. Proposti tutti e cinque (Falce, Silenzio, Folla, Buio, Ombra) in [proposte/oggetti-build-sinergie.md](proposte/oggetti-build-sinergie.md); da creare. **Si costruiscono senza tararli**: lo sblocco per ora si raggiunge dal Laboratorio (la scheda LAB nasce insieme ai Patti); la regola di sblocco si decide con il bilanciamento finale. Disegni: 5 icone. *Nel gioco a stanze: i Patti restano (decisione del 12/11), da ripensare per la Veglia.*
3. **Cappella come hub**: i personaggi nella navata, la scheda con le statistiche vere, la Cera disegnata, 9 icone dei ceri. Viene **dopo** i Patti. Disegni: la Cappella, l'icona della Cera, le icone dei ceri. *Nel gioco a stanze: resta.*
4. **Devozione e notti diverse**: 8 livelli di Devozione per personaggio; notti che si sbloccano (nebbia, luna piena, notte dei morti), ognuna con un Seth dalle mosse diverse. Dettagli in [proposte/meta-progressione.md](proposte/meta-progressione.md). *Nel gioco a stanze: la Devozione resta; le notti diverse si ripensano insieme ai Mondi.*
5. **Cero della fiaschetta e questline** con il Ceraiolo (ampolla incrinata → riparata → si riempie battendo Seth). Oggi la fiaschetta c'è dalla prima notte con 3 sorsi. Quando la fiaschetta diventerà uno sblocco, rilanciare la simulazione. *Nel gioco a stanze: resta.*
6. **Veggente e Sguattera**: i due personaggi giocabili previsti. Da decidere con Edoardo: la loro affinità (vedi [lore.md](lore.md), *Aperto*), arma iniziale, abilità, ritratto e sprite, come si sbloccano. *Nel gioco a stanze: resta; il riordino di `armi.ts` è anticipato al passo 1 della fetta.*
   - **Primo passo, prima di tutto il resto: il riordino di `src/sistema/armi.ts`, da fare insieme a Edoardo** (Claude glielo ricorda quando si arriva a questa tappa). Oggi è un solo «arsenale» di 1.730 righe con tutte le 15 armi: si divide per famiglie (colpi vicini, proiettili, zone a terra) a gioco identico, verificato con il bot (stesso seme, stessa notte).
7. **Redesign dell'intero gioco** (da collocare nell'ordine con Edoardo): HUD, personaggi, animazioni (`attack`, `special`, `hurt`, `death`), effetti, mosse di Seth, hub, nemici V1 alla scala nuova, scheda del personaggio (con statistiche vere), cornici dei ritratti e Pannello scheda. *Nel gioco a stanze: assorbito dal gioco a stanze, che ridisegna HUD, animazioni, nemici e mosse dei capi.*
8. **Pubblicazione** (senza data): *Nel gioco a stanze: resta, con il gioco a stanze.*
   - **Google Play: lo apre Edoardo.** 25 dollari una tantum e verifica dell'identità. Per i nuovi account personali servono almeno 12 tester per 14 giorni di fila in prova chiusa prima della pubblicazione. Test interno: aggiornamenti senza Blocco automatico e rapporto automatico pre-lancio. Firebase Test Lab è escluso: chiude il 30/09/2027.
   - **Versione per i tester senza LAB**, con il solo pulsante «Prova prestazioni».
   - **Prove degli amici con Prova prestazioni**, dentro la prova chiusa, così contano anche per quel requisito. Telefono minimo: MediaTek Helio G99 con Mali-G57 MC2 e 4 GB (Galaxy A16 4G, Redmi Note 14 4G); almeno tre famiglie di processore grafico: Mali, Adreno, un telefono di 3–4 anni fa; più avanti un iPhone. Se un telefono non regge si riducono solo gli effetti visivi.
   - **Prestazioni.** Ricostruzione del buio quando un dono allarga la luce: 223–240 ms sul S25; da sistemare prima della pubblicazione.
   - **Dal lato del gioco servono:** identificativo definitivo `com.deathslumen.game` (non si cambia più dopo la prima pubblicazione); compilazione firmata in formato AAB, con una chiave di caricamento propria e numero di versione che cresce a ogni caricamento; icona 512×512, grafica in evidenza 1024×500, almeno due schermate del telefono; titolo, descrizione breve e completa, categoria, contatto; pagina con l'informativa sulla privacy, modulo sui dati raccolti, questionario sui contenuti; controllo delle licenze di caratteri e di ogni asset di terzi.
9. **Più avanti**: mondi e boss nuovi come dungeon in fila nella stessa partita, alla Hades; altri boss oltre Seth; la trama dell'endgame (vedi [lore.md](lore.md)). *Nel gioco a stanze: è diventato il gioco a stanze.*

**Da portare nelle sessioni future** (11/11, fuori dall'ordine qui sopra). *Nel gioco a stanze: la «Sessione dei nemici» è sospesa (riguarda la notte del survivor); la guida dentro il gioco a stati, reazioni e abilità resta.*

- **Sessione dei nemici**:
  - la notte va resa più dura: dopo Devozione, Voti, Riti, tetti, ritocchi e Unioni nuove il bot vince 32 notti su 48 a Cappella vuota e 40 a completa (obiettivo provvisorio 2–7 a Cappella vuota);
  - Seth uccide quasi sempre a contatto, non con le sue mosse: le mosse devono pesare di più;
  - il mini boss del minuto 3 deve rispettare il vincolo del Lampionaio (non muore sempre prima del minuto 5) e quello del primo boss (Seth del minuto 5 è il primo vero ostacolo);
  - Edoardo ha scelto (11/11) di non aggiungere ora un comando di difficoltà.
- ~~**Redesign delle build, cosa resta**: quattro Unioni nuove, ritocchi a Incensiere, Candelabro e Falce, Corvo, Lama di luce~~ (**fatto l'11/11**: il redesign delle build è chiuso). Restano:
  - **le prove a mano di Edoardo** su Devozione, Voti, Riti, tetti, le quattro Unioni nuove e i cinque ritocchi (dal LAB);
  - **una guida dentro il gioco a stati, reazioni e abilità**: da progettare con Edoardo (che cosa spiega, dove compare, quando), non ancora fatta.

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
| Barre della salute (personaggio 41 × 9 px con 1 di bordo per lato, decisa da Edoardo il 10/11 sera; Seth alta 12 px; rosso `#c0262d`, vuoto `#3a0c10`; scorrimento 0,5 s, ambra `#d98a2b` per il danno, verde `#6fbf4a` per la cura) e grandezza del conto alla rovescia dell'abilità (16) | GDD §HUD; `src/data/mondo.ts` (`BARRA_SALUTE`), `src/data/hud.ts` (`BARRA_SETH`, `TESTI`) |
| Stati certi, regola del gioco dal 10/11: tutti i numeri di `STATI_CERTI` (ritmo delle zone 1 s, quiete 3 s, Eclissi 10% senza tetto e ×2 del colpo su élite e Seth, Esorcismo 3 × 60%, Rivelazione +50% per difetto solo da 2 anime in su, Interramento Luce +50%, Sacro 2,5 s, Ombra ×2), i casi senza colpo, l'ordine dell'Interramento con più stati, il tetto dei cerchi (12) *(Gioco a stanze: l'Eclissi su mini-boss e Boss scende al 5% con Quiete di 6 s, decisione del 12/11.)* | GDD §8c; `src/data/stati.ts`; decisioni 10/11 |
| Devozione: tutti i numeri (gradi 1–3 degli stati, reazioni × 1 / 1,25 / 1,5); lo stato dell'abilità prende il grado ma non conta come arma (lettura di Claude) | GDD 8c; `DEVOZIONE` in `src/data/stati.ts` |
| Voti: nomi («Voto della Luce»…), quiete 1,5 s, +40% sui fermi, −20% dai consacrati (solo a contatto, non le mosse di Seth), peso 1,3 solo per le armi nuove *(Gioco a stanze: il Voto della Badessa cambia, i Consacrati preparano gli attacchi il 25% più lentamente; il peso 1,3 sparisce, decisione del 12/11.)* | GDD §2; `src/data/voti.ts` |
| Riti: ogni 3 livelli senza carte, +8% stato e reazioni, al massimo 3 carte. Il primo Rito arriva al livello 53–56 (minuto 11–12) *(Gioco a stanze: senza livelli, da dove arrivano i Riti è un punto aperto del pivot.)* | GDD 8c; `RITI` |
| Tetti degli stati (decisione di Edoardo dell'11/11, valori da rivedere): Consacrato al massimo 60% di rallentamento (era 80%), Maledetto al massimo 5% della salute massima al secondo, con le riduzioni di élite, Seth e Mietitore dopo il tetto. Lettura di Claude: nell'Interramento che consuma l'Ombra la maledizione raddoppia anche oltre il tetto (fino al 10%) | GDD 8c; `DEVOZIONE.lentoMassimo`, `DEVOZIONE.maledettoMassimo` |
| Scelte di Devozione, Voti e Riti su cui Edoardo non si è espresso (11/11): restano come sono. L'abilità speciale non conta come arma nella Devozione; nomi dei Voti («Voto della Luce»…); Voto del Sacro solo sul contatto (non sulle mosse di Seth); peso 1,3 solo per le armi nuove; Riti e Devozione spenti con «Stati a caso (vecchi)» | GDD §2 e 8c; `src/data/voti.ts`, `src/data/stati.ts` |
| Ritmo delle zone (1 s): la Strega non scende (reazioni −7% a Cappella completa) perché lo stato dura 3 s; da decidere se allungarlo verso 3 s o accorciare gli stati delle zone | bilanciamento 10/11 notte; `STATI_CERTI.ritmo` |
| Pivot (12/11): tutti i valori «da rivedere» e i punti aperti di [proposte/pivot-hades.md](proposte/pivot-hades.md) (stanze per Mondo, porte d'élite, armi su 5 livelli, quarta arma della Terra, Eclissi sui capi 5% e Quiete 6 s, Voto della Badessa 25%, carica dell'abilità, Riti, nemici, Ceri a budget, Pegni) | `docs/proposte/pivot-hades.md` |
| Gioco a stanze, ordine dei passi della fetta e di ciò che viene dopo: proposto da Claude | «Gioco a stanze» qui sopra |
| Gioco a stanze, comandi: tastiera e mouse (clic sinistro verso il puntatore, J sul nemico più vicino, Spazio, F, P, M, 1-2-3) proposti da Claude; posizione di fiaschetta e pausa sul telefono in orizzontale, da provare sul S25 | `CLAUDE.md` «Mobile» |
| Gioco a stanze, prestazioni: quanti nemici al massimo in una stanza per l'obiettivo dei 60 fps (si fissa con la fetta) | `CLAUDE.md` «Regole per il codice» |
| Gioco a stanze, regole vincolanti del bot (sospese): idea di partenza «il primo Boss è il primo vero ostacolo; nessun personaggio muore sempre prima del mini-boss del Mondo 1» | `CLAUDE.md` «Verifica»; [bilanciamento.md](bilanciamento.md) |
| Due cose si chiamano «Devozione»: i gradi degli stati in partita (GDD 8c, proposta del pivot) e gli 8 livelli per personaggio della meta (tappa 4 del survivor, [proposte/meta-progressione.md](proposte/meta-progressione.md)). Una delle due va rinominata | GDD 8c; tappa 4 qui sopra |
| Mosaici: disegno V1, probabilità dell'urna (26%, misurata con il bot che cerca le urne), numeri del Bagliore (20 s, +30% velocità, luce × 1,5), raggio di raccolta 40 px | `docs/asset_da_creare.md`, `docs/GDD.md` |
| Doni a 3 livelli, stesso effetto al massimo; «Pane e vino» ora si prende da solo, senza aprire la scelta: scritta verde «Pane e vino +40» sopra la testa (1,2 s, 64 px sopra il corpo) da rivedere | GDD §5; `PASSIVI`, `src/data/doni.ts`; bilanciamento 10/11 |
| Grazia a tacche: tutti i numeri (8 tacche, 16 px, 2 s per nemico, calo 1 ogni 2 s, Grazia 2 s), Danza 4 tacche e 1,5 s, Campanella +8 px; i colori dell'indicatore sotto la barra (azzurro `#86c5e8`, blu notte `#10222e`); la parte di notte in Grazia ora si legge in pausa e a fine notte; scintilla e suono provvisori; come gioca il bot (1,6% di notte in Grazia, obiettivo 20–30%) | GDD §8b e §8e; `GRAZIA.tacche`; decisioni e bilanciamento 10/11 |
| Sampietrini e Selciato: misure del volo (0,45 s e 60 px, rimbalzo 0,3 s e 24 px), probabilità di Sepolto (10%), Selciato una volta per sasso, sasso e polvere provvisori larghi quanto l'area (ciottolo 20×16 ingrandito, anello di polvere 0,3 s); con il bot le vittorie scendono da 18 a 8 su 24 | GDD §4 e §8f; `SAMPIETRINI`; bilanciamento 10/11 |
| Unioni: arma al livello 6 (decisione di Edoardo del 10/11, il valore 6 è da rivedere), dono al massimo, sblocco con «Sconfiggi Seth» *(Gioco a stanze: arma al livello 4 su 5, decisione del 12/11.)* | GDD §8f; `LIVELLO_ARMA_UNIONE`, `SBLOCCO_UNIONI` |
| Ritocchi dell'11/11: nubi dell'Incensiere al 50% con il tetto del 60%; Falce di Seth al 30% sui maledetti (conta lo stato di prima del colpo: lettura di Claude); Corvo che richiama le anime entro 150 px dal nemico beccato; **livello 3 del Corvo, rimasto vuoto: +4 danno (segnaposto di Claude)**; Lama di luce che ignora la quiete | GDD §4 (Corvo), 8c, 8f; `NUMERI_UNIONI`, `CORVO`, `RUOLI.lamaIgnoraQuiete` |
| Unioni nuove dell'11/11, misure e letture di Claude: Lapide inchiodata 3 s e tocco entro 36 px dal punto di caduta; Rosario dei vespri, «maledetto» prima del colpo e 1 ripartenza per lancio; Stormo del lutto che salta anche i nemici in quiete; Sudario fino a 6 s dall'inizio della Grazia, velo tinto `#fff1b8`; icone ed effetti provvisori dal codice | GDD §8f; `NUMERI_UNIONI`; `asset_da_creare.md` |
| Animazione della scoperta: segnaposto dal codice; Edoardo la vuole semplice ma con la «scarica di dopamina» dell'evoluzione di un Pokémon; durata da decidere quando ci sarà quella vera; tela e fotogrammi da definire | GDD §8f; `asset_da_creare.md` |
| Abbreviazioni della pausa: Attesa colpi, Colpi, Colpi extra, Durata zone | GDD «La pausa»; `NOMI_CHIARI` in `src/data/spiegazioni.ts` |
| Rompibili: percentuali, gocce, raggi, luce della lanterna, oggetti che non tornano nella notte | GDD 8g, `src/data/rompibili.ts` |
| Chiazze: olio 12 s, fuoco 5 s, rallentamento 40%, 14 danni ogni 0,4 s; armi di fuoco: Candela e Fuoco fatuo | GDD 8g |
| Frammenti: 3 per un reliquiario, contatore fisso nell'HUD sì o no | GDD 8g |
| Cera dei nemici: resta uguale per ora | GDD 8g |
| Luce: sfumatura 1,5, buio 88%, raggio 36% del lato corto, alone caldo | GDD 11, `src/data/mondo.ts` |
| Tacche (`TACCHE`: lato 4, raggio 31, arco 150°, lampo 0,25 s) e pulsante tondo della fiaschetta composto dalla cornice dell'abilità | GDD §8b e §11 |
| Area sicura fissata dopo 1,5 s dall'apertura (`AREA_SICURA.assestamento`) | GDD §11 |
| Link pubblico: stessa protezione dalla ricarica in partita del link di prova, quando Edoardo approverà l'unione con `main` | decisioni 5/11 |
| Link di prova: controllo della versione nuova ogni 120 s (`AGGIORNAMENTI.ogni`) | decisioni 5/11 |
| Leggibilità, secondo passo: nomi delle reazioni (× 2, ogni 2 s, 3 insieme, 90 px), 40 simboli solo sui pesanti, somma dei numeri su élite e Seth (0,5 s, 30 px sopra), cartiglio (scala 0,5, minimo × 2; 1,45 s; dissolvenza 0,3 s), orologio nella colonna di destra. Confermati da Edoardo il 5/11, restano da provare sul suo telefono | GDD §8c, §11 e «Impatto dei colpi»; decisioni 4/11 e 5/11 |
| Scritte delle reazioni: il nome parte 34 px sopra il punto e sta 16 px sopra il numero quando viene spostato | GDD «Impatto dei colpi»; bilanciamento 5/11 |
| Numeri ambra: se una build rende critici la maggior parte dei colpi, rivedere l'ambra. Al massimo livello il Chiodo di bara dà circa il 30% di numeri ambra | GDD «Impatto dei colpi»; decisioni 5/11 |
| Chiodo di bara al massimo: gli ambra sostituiscono i bianchi così spesso che i bianchi durano ~0,03 s. Possibile correzione: un ambra può sostituire solo un bianco visibile da almeno 0,3 s (non applicata) | bilanciamento 5/11 |
| ~~Link pubblico: il codice di `prova`, con tutta la leggibilità e gli altri lavori dal 3/11, non è su `main`; il merge aspetta l'approvazione di Edoardo~~ (superata: Edoardo ha deciso il 12/11 che il link pubblico resta il survivor di oggi) | «I due link» in `CLAUDE.md` |
| Seth molto scuro sullo sfondo notturno e cerchi delle reazioni ancora vistosi: contorno o alone per Seth, cerchi più piccoli o ridisegnati, oppure sprite di Edoardo. Non ancora deciso | `asset_da_creare.md` per i cerchi |
| Nome e numero di una reazione si toccano ancora nell'8% circa dei fotogrammi | GDD «Impatto dei colpi» |
| Con 15 numeri ambra già sullo schermo, il primo colpo di una reazione può restare fuori dalla somma mostrata; visto solo in una prova forzata, il danno vero non cambia | GDD «Impatto dei colpi» |
| Leggibilità nella folla: lampo del nemico (0,033 s, uno ogni 0,3 s, 50% su bruti/élite/Seth) e al massimo 15 numeri del danno; si provano dal LAB | GDD §10 e «Impatto dei colpi»; decisioni 4/11 |
| Sblocchi di armi e doni nuovi (tappa 5): imprese (10 Eclissi, 30000 anime per il Corvo, 3 minuti nelle nubi per il Velo, 20 schivate perfette) e costi (120 Cera; Campanella con impresa o 120) | GDD §8d |
| «Reliquie dimenticate» semplificate in acquisti dalla Cappella (nella proposta si trovavano in partita) | GDD §8d; decisioni 4/11 |
| Rosario: 3 grani di partenza, Peccato ×2, sblocco «Sopravvivi 8 minuti» o 300 Cera, 3 amuleti per reliquiario | GDD §8e; decisioni 3/11 |
| Patti: valori dei cinque patti e regola di sblocco (decisa con il bilanciamento finale) | tappa 7 qui sopra; proposte |
| «Capi» come parola generica per i boss nel testo del Fuoco fatuo | decisioni 4/11 |
| ~~Posto del redesign nell'ordine delle tappe~~ (superata dal pivot: il redesign è assorbito dal gioco a stanze) | qui sopra |
| ~~Ordine delle tappe dopo i Patti (Cappella hub, Devozione e notti, questline, Veggente e Sguattera, redesign): proposto da Claude~~ (superata dal pivot: vedi «Gioco a stanze» qui sopra) | «Prossime tappe» qui sopra |
| Danza macabra: recupero di 3 s, da provare a mano da Edoardo | GDD §8e (amuleti) |
| Correzioni agli oggetti del 9/11 (valori di Claude su richiesta di Edoardo): Vanga 1,5 s con la pausa del Sepolto (4 s); Acquasantiera un sorso ogni 45 s al massimo; Lucciola 2 grani e pausa 4 s; Ossa d'élite 2 grani; Martire 2 grani, onda senza danno che consacra e ferma 0,6 s; Ceri gemelli ricarica +10% | GDD §8e e §8f; bilanciamento 9/11 |
| Affinità della Veggente e della Sguattera | lore (*Aperto*) |

### Da confermare del survivor (sospese dal pivot)

Voci che riguardano solo il survivor: la notte di 15 minuti, il bot di oggi, il telefono in verticale, i 400 nemici. Restano qui finché il codice del survivor esiste; si tolgono insieme a lui.

| Voce | Dove è scritta |
| --- | --- |
| Amuleti rari misurati con `amuleto=` (12 notti l'uno, bilanciamento 10/11 sera): nessuno è un disastro; la Lanterna cieca vince 9 su 12 perché il bot non guarda il buio, da provare a mano | bilanciamento 10/11 |
| Copione dalle 3:00 «zombi 3, scheletro 1» (decisione del 10/11 sera): con questo il Lampionaio rispetta il vincolo (2 notti su 12 prima del minuto 5) | GDD «Il copione della notte»; bilanciamento 11/11 |
| Notti esplorative del bot: una su tre; il bot non prende amuleti che lo manderebbero in Peccato | decisioni 10/11; `tools/sim.mjs` |
| Copione della notte, respiro (50 s + 10 s al 25%), comparse 1,4 + 2,9 m, tetto 250, bruti al massimo 100, copione e forme delle orde, preavviso 3 s, salute ×3 dal minuto 6, Lumen accorpato a 28 px: tutti i valori. Il bot vince 7 notti su 48 |
| Prova «pochi e forti» (12/11): se e come tenerla; nessuna versione arriva alle tre soglie (vita visibile mediana ≥ 3 s, < 30% morti senza reazione, < 5% fuori schermo), la più vicina è «entrambi» | bilanciamento 12/11; `POCHI_E_FORTI`, LAB → Eventi |
| Lanterna e Pala mirano, regola del gioco dal 10/11: 260 px per la Lanterna, 150 px per la Pala | GDD §4 (Pala); `MIRA` in `src/data/armi.ts` |
| Fasce del telefono, solo i valori: tutte le misure di `FASCE`, `PAUSA_PICCOLA`, `JOYSTICK_PICCOLO`, `SEGNALE_PECCATO` in `src/data/hud.ts` | GDD §11; decisioni 5/11 |
| Pausa piccola al centro della fascia bassa, senza area di tocco invisibile (`PAUSA_PICCOLA.margineTocco` 0) | GDD §11; decisioni 5/11 |
| Obiettivo sul telefono minimo: media 60, meno dell'1% dei secondi sotto 55, nessun blocco sopra 100 ms, al minuto 14 con 400 nemici e lanterna in vista | decisioni 5/11 |
| Prova prestazioni: 60 s di misura, 3 s di avvio, blocchi sopra 100 ms, secondi sotto 55 fps, build con 6 armi al livello 8 (`PRESTAZIONI`) | GDD «Mondo, luce e comandi» |
| Opacità della base del joystick quando copre un pulsante: 50% (`JOYSTICK_PICCOLO.opacitaSuiPulsanti`) | GDD §11 |
| Campo del telefono più corto: a Cappella vuota il bot vince il 4%; da riguardare con il bilanciamento finale, partendo dal Becchino prima del minuto 5 e da Seth del minuto 10 | bilanciamento 5/11 |
| Leggibilità del campo provata solo su telefoni emulati e sul Mac: manca la prova di Edoardo sul Galaxy S25 | decisioni 4/11 e 5/11 |
| Obiettivi di vittoria del bot per Cappella (provvisori) | bilanciamento |
| Il bot non prende mai Martire, Patto di sangue, Specchio rotto, Cuore avido e Lanterna cieca con le sue preferenze; con `esplora` li prende di rado (vedi la riga sugli amuleti rari) | `amuletiPreferiti` in `src/data/bot.ts`; bilanciamento 9/11 |
