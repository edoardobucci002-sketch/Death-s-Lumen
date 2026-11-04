# Death's Lumen

Survivor-like in pixel art (sul modello di Vampire Survivors). Una veglia in un cimitero: il giocatore cammina, le armi colpiscono da sole, si sopravvive 15 minuti fino all'alba. Quattro personaggi giocabili oggi, ognuno con un'arma iniziale esclusiva e un'abilità speciale (la Veggente e la Sguattera sono previsti: vedi `docs/roadmap.md`).

Questo file contiene **solo le regole** per lavorare al progetto. Cos'è il gioco com'è oggi: `docs/GDD.md`. Comandi, cartelle e stack: `LEGGIMI.md`. Il codice (`src/data/` e `src/`) è la fonte di verità.

## Chi lavora al progetto

- **Edoardo**: art director e game designer. Disegna in Aseprite. **Non ha basi di programmazione.**
  - Spiega ogni scelta tecnica in parole semplici, in italiano, senza dare per scontati termini da sviluppatore.
  - Prima di una decisione difficile da cambiare (motore, struttura dei dati, formato degli asset) proponi le opzioni con pro e contro e aspetta la sua risposta.
  - Quando chiedi a Edoardo di fare qualcosa (aprire un'app, esportare da Aseprite, provare sul telefono), dai passi numerati con i nomi esatti di menu e pulsanti.
  - Dopo ogni tappa digli come provare il risultato: il comando da lanciare e cosa deve vedere.
- Computer: MacBook Air M1 con 8 GB di RAM. Tieni leggeri build, dipendenze e server di sviluppo.

## Stack e dipendenze

- **Phaser 4, non 3.** Molti esempi online e parte di quello che sai riguardano Phaser 3. Prima di usare un'API controlla che esista nei tipi in `node_modules/phaser/types/phaser.d.ts`.
- Le versioni delle dipendenze sono fissate in `package.json`. Aggiornale solo quando serve e dopo averlo detto a Edoardo.
- Il nome della cartella `DEATH'S LUMEN` contiene un apostrofo: negli script e nei comandi metti sempre i percorsi tra virgolette.

## Asset e pixel art

- **Due livelli di sprite** (decisione di Edoardo):
  - **Ritratti dettagliati**: solo nella schermata di selezione del personaggio.
  - **Sprite in gioco** molto più semplici, leggibili a colpo d'occhio, alla Vampire Survivors.
- **Nomi dei file** (convenzione di Edoardo), con le parole separate da `_` e la versione in fondo:
  - `Nome_V#.aseprite`, per esempio `La_Badessa_V2.aseprite`: il **ritratto** della selezione. `Nome_ingame_V#.aseprite`: lo **sprite in gioco** (stessa cartella).
  - `Nome_idle_sheet_V#.png`, per esempio `La_Badessa_idle_sheet_V2.png`.
  - Il gioco usa sempre la versione più alta presente; non cancellare le versioni vecchie. Gli sprite in `segnaposto/` hanno la versione V0: il primo file vero (V1 o più) li sostituisce da solo.
  - I sorgenti Aseprite di Edoardo (`PERSONAGGI/`, `NEMICI/`, `HUD/`…) non si modificano mai.
- **Animazioni come tag di Aseprite**, con nomi fissi: `idle`, `walk`, `attack`, `special`, `hurt`, `death`. Lo script di export (`npm run asset`) legge i tag; Edoardo non deve tagliare fotogrammi a mano. Le animazioni in Phaser si chiamano `<chiave>:<tag>`, per esempio `Il_Lampionaio:walk`.
- Gli export in `public/assets/` si generano con `npm run asset`, mai a mano.
- **Pixel perfect già implementato** in `src/sistema/pixel.ts`. Regole, sempre:
  - il mondo si disegna a bassa risoluzione e si ingrandisce di un fattore **intero**, con filtro nearest e senza antialiasing; mai uno zoom non intero;
  - posizioni arrotondate al pixel prima di disegnare;
  - le dissolvenze si fanno a retino (dither Bayer), non con la trasparenza.
- Il contorno scuro, il punto di contatto con il terreno (piedi in basso al centro) e la direzione di base (il personaggio guarda a destra) devono essere uguali in tutti gli sprite. Il gioco li ribalta per guardare a sinistra.

## Identità visiva

- **Mondo inventato**: niente riferimenti alla realtà (feste, luoghi, nomi storici). La lore è in `docs/lore.md`. Le croci nei disegni restano: fanno parte di questo mondo. Nell'interfaccia di gioco «veglia» e «Seth»; «Rinnovato» compare dal primo Seth come primo indizio; «Rinnovo» e «Ricaduta» arrivano più avanti nella trama. Nei testi che il giocatore legge, parlando dei boss in generale si usano termini generici («capi»), non «Seth»: gli altri boss non vanno anticipati.
- Palette notturna calda. Ogni personaggio ha il suo colore guida (nel GDD) e l'interfaccia prende il colore del personaggio scelto.
- **Caratteri**: titoli, nastri e scritte dentro i pulsanti in **Tiny5 tutto maiuscolo**, a pixel interi (`src/sistema/scritte.ts`); numeri e HUD in Jersey 10; testi lunghi (schede, pannelli, legenda) in EB Garamond. Vanno inclusi nel pacchetto, non scaricati da internet.
- Le schede dei personaggi riprendono lo stile della scheda di Edoardo: nome, motto, ritratto, biografia, fila di sprite, arma iniziale, abilità speciale, barre delle statistiche, citazione sopra un paesaggio.

## Regole per il codice

- **Nessun numero di bilanciamento dentro la logica.** Statistiche, curve, probabilità e tempi stanno in `src/data/`, in file leggibili da Edoardo. Quando un numero cambia, aggiorna `docs/GDD.md` (valore attuale) e `docs/bilanciamento.md` (cosa è cambiato e perché).
- Pochi file piccoli, con nomi chiari. Un commento breve in italiano sopra ogni sistema per dire che cosa fa.
- Prestazioni (obiettivo: 60 fps su un telefono di fascia media con 400 nemici in campo):
  - griglia spaziale per le collisioni;
  - pool di oggetti per nemici, proiettili e numeri del danno;
  - niente allocazioni dentro il ciclo di gioco;
  - nemici fuori schermo disegnati solo se servono.
- Logica a passo fisso (60 aggiornamenti al secondo), separata dal disegno, così il gioco va alla stessa velocità su ogni schermo.
- Il caso (spawn, drop, carte) passa da un generatore con seme: serve per riprodurre i bug e per le simulazioni.

## Mobile (obbligatorio)

- Controlli touch: joystick virtuale dove si appoggia il dito, pulsante dell'abilità in basso a sinistra con la fiaschetta accanto, pausa in basso a destra. Tastiera su desktop: WASD/frecce, Spazio (abilità), F (fiaschetta), P (pausa), M (suoni), 1-2-3-4 (scelta del dono).
- Rispetta le safe area (notch, Dynamic Island, barre di sistema). **Su telefono il gioco è solo in verticale**; su computer e tablet è in orizzontale, come Vampire Survivors. Non si adatta l'HUD al telefono in orizzontale.
- Comportamento dell'app:
  - pausa automatica quando l'app va in background;
  - schermo sempre acceso durante la partita;
  - vibrazione sugli eventi importanti, disattivabile;
  - su Android, il tasto Indietro mette in pausa, riprende o torna al menu.
- Niente zoom con doppio tocco o pizzico; niente selezione di testo nell'interfaccia di gioco.
- Ogni pulsante da toccare è largo e alto almeno 44 punti. Prima di chiudere una modifica all'HUD lancia «Verifica tutti i telefoni» nella bozza (`npm run bozza`, porta 5190) e poi spegnila.
- Funziona offline: tutti gli asset sono nel pacchetto.

## Verifica, prima di dire che una tappa è finita

1. `npm run build` senza errori né avvisi di tipo.
2. Prova nel browser con Playwright (`npm run prova`) in viewport desktop e iPhone verticale, più un Android verticale: niente errori in console.
   - **Guarda gli screenshot solo se la modifica cambia quello che si vede** (HUD, schermate, scritte, sprite, effetti). Per logica e bilanciamento basta che la prova passi senza errori.
   - Le immagini consumano molti token e restano nella conversazione: aprine il minimo indispensabile (di solito una per viewport toccato).
3. Per ogni modifica al bilanciamento, lancia la **simulazione con il bot** (`npm run sim`, codice in `tools/sim.mjs` e `src/sistema/bot.ts`). Leggi il riepilogo a schermo; apri `prove/sim.json` solo per indagare un risultato strano. Gli obiettivi (vittorie del bot per Cappella vuota, a metà e completa) sono in `docs/bilanciamento.md` e sono **provvisori, non vincolanti**: non ritoccare i contenuti per inseguirli finché i contenuti non sono completi. Restano **vincolanti** solo due cose: Seth del minuto 5 è il primo vero ostacolo; nessun personaggio muore sempre prima del minuto 5. Riporta a Edoardo a che minuto muore il bot e il livello raggiunto.
   - **Il campione**: con 48 notti per condizione l'incertezza è di circa ±12 punti: differenze più piccole sono rumore. Per il bilanciamento finale servono almeno 200 notti per condizione (circa 50 per personaggio).
4. **Una tappa non è finita finché `docs/GDD.md`, `docs/roadmap.md` e `docs/asset_da_creare.md` non riflettono il codice.** Prima di dire «fatto» controlla che i contenuti, i numeri e gli asset segnaposto descritti lì coincidano con `src/data/`, e riporta le simulazioni in `docs/bilanciamento.md`.
   - Lancia `npm run controlla-gdd`: confronta le tabelle del GDD con `src/data/`. **Se segnala differenze, la tappa non è finita.**
   - Il testo discorsivo del GDD lo script non lo vede: resta controllato a lettura.
5. **Decisioni che spettano a Edoardo**: alla fine di ogni tappa elencale, una per riga, in un blocco con questo titolo. Non scegliere tu i valori: se devi metterne uno per andare avanti, segnalo **«da rivedere»** nel GDD e nella roadmap («Da confermare»).
6. Riassumi a Edoardo cosa è cambiato e come provarlo.
7. **Ultimo punto di ogni tappa: porta `docs/` su `main`** (vedi «I due link»), dopo `npm run controlla-gdd`. Su `main`: `git restore --source=origin/prova --staged --worktree -- docs/` (a differenza di `git checkout prova -- docs/` toglie anche i file eliminati su `prova`), commit «Aggiorna i documenti da prova», push. Va fatto anche subito prima di unire `prova` in `main`: se i documenti delle due parti sono diversi, l'unione va in conflitto.

## Documentazione

| File | Cosa contiene |
| --- | --- |
| `LEGGIMI.md` | cos'è il gioco, primi passi, comandi, cartelle, stack |
| `docs/GDD.md` | il gioco **di oggi**: contenuti e numeri attuali, senza storia dei numeri |
| `docs/lore.md` | mondo, personaggi, trama |
| `docs/decisioni.md` | registro delle scelte di design e di metodo, con data e motivo |
| `docs/bilanciamento.md` | obiettivi del bot, ritocchi ai numeri, risultati delle simulazioni |
| `docs/roadmap.md` | un solo piano: cosa è fatto, in corso e futuro |
| `docs/asset_da_creare.md` | cosa Edoardo deve ancora disegnare e il segnaposto che c'è oggi |
| `docs/proposte/` | archivio congelato delle proposte approvate: non si modifica |

- **Decisioni superate**: non si cancellano, si ~~barrano~~ con l'indicazione di cosa le ha superate. Quello che Edoardo dice o propone dopo una decisione e che entra nel gioco diventa la novità (riga nuova, la vecchia barrata).
- Un valore proposto da Claude e non ancora confermato da Edoardo si segna **«da rivedere»** dove compare, e va raccolto nell'elenco «Da confermare» di `docs/roadmap.md`.
- Ogni scelta presa con Edoardo va in `docs/decisioni.md` (data, decisione, motivo); i ritocchi numerici vanno in `docs/bilanciamento.md`, non lì.

## I due link

Il gioco esiste in **due versioni sole**, una per ramo, ognuna con il suo link:

| Ramo | Link | Cosa contiene |
| --- | --- | --- |
| `prova` | https://edoardobucci002-sketch.github.io/Death-s-Lumen/prova/ | il link personale di Edoardo: **ogni modifica nuova finisce qui**; in basso la scritta «PROVA» |
| `main` | https://edoardobucci002-sketch.github.io/Death-s-Lumen/ | il link pubblico (e l'APK Android): solo ciò che Edoardo ha approvato |

- Ogni push su `prova` o su `main` ripubblica entrambi i link in un paio di minuti (`.github/workflows/pagine.yml`; per `prova` lo fa partire `prova.yml`, perché GitHub pubblica solo da `main`).
- Lavora sempre su `prova`, o su un ramo di passaggio che unisci a `prova` appena funziona, nella stessa sessione. Mai rami lasciati a metà o worktree dimenticati: Edoardo deve trovare tutto in `/prova/`.
- Unisci `prova` in `main` **solo quando Edoardo dice che approva**.
- **Eccezione**: `docs/` è l'unica cosa che arriva su `main` senza approvazione: alla fine di ogni tappa, dopo `npm run controlla-gdd`, si porta `docs/` di `prova` su `main` (solo quella cartella). Su `main` i documenti possono descrivere contenuti non ancora pubblicati: lì `controlla-gdd` non va lanciato.
- Sul Mac al massimo un server acceso (`npm run anteprima`, porta 4173). Spegnilo quando hai finito; non spegnere un server che Edoardo sta usando senza chiederglielo.
- Il service worker tiene separate le copie offline dei due link (`tools/genera-sw.mjs`). Salvataggi e record invece sono in comune, perché il sito è lo stesso.

## Il Laboratorio

Edoardo è l'unico sviluppatore: non può rigiocare tutta la notte per vedere una cosa sola. Sul link `/prova/` (e in `npm run dev`, mai su `main`) c'è il **Laboratorio**: il pulsante «LAB» sul bordo sinistro apre un pannello (`src/sistema/laboratorio.ts`) con schede per partita (minuto, livello, immortale, nemici), eventi (élite, Seth, orde, drop, stati), oggetti (armi, doni, amuleti), numeri (ogni numero di `src/data/` si cambia al volo; «Copia le modifiche per Claude»), schermate e salvataggio.

**Regola per ogni nuova funzione**: aggiungi i comandi nel Laboratorio (metodi `lab…` in `Gioco.ts`, scheda in `laboratorio.ts`) così Edoardo la raggiunge subito. Ogni consegna dice «apri LAB → scheda X → tocca Y per vedere Z». Le funzioni nuove nascono con il loro punto di accesso nel Laboratorio, non solo nelle schermate.

## Revisioni con gli artifact

Per vedere e provare le cose c'è il Laboratorio. Gli artifact su claude.ai restano solo per decisioni da confrontare a parole o a schizzi (proposte, questionari) e per i casi che non si possono toccare.

- **Questionario, sempre**: ogni artifact ha un questionario. Ogni domanda ha «Va bene» / «Cambia» e un campo per la nota o la proposta. In fondo c'è un **riassunto che si aggiorna in tempo reale**, con il pulsante «Copia il riassunto», da incollare in chat.
- **Vita breve**: un artifact si apre quando serve e si **elimina quando non serve più**, cioè quando le risposte sono arrivate e applicate. Proponilo a Edoardo ed elimina solo dopo il suo sì; poi segna in `docs/proposte/README.md` cos'era.
- Le proposte approvate si copiano in `docs/proposte/` come testo.
- La bozza dell'HUD non si tiene accesa per Edoardo: è uno strumento di verifica tuo.

## Lezioni dalla v0 (da non ripetere)

- Le schermate sovrapposte in griglia CSS si allargavano quanto il loro contenuto più largo: usa `grid-template-columns: minmax(0, 1fr)` e `min-width: 0`.
- Un `display` scritto in CSS annullava l'attributo `hidden`: il gioco va mostrato e nascosto da un solo sistema.
- Le regole per il telefono in orizzontale venivano sovrascritte da quelle scritte dopo: tienile in fondo o con selettori più specifici.
- I font presi da internet sparivano offline: vanno inclusi nel pacchetto.
- Il bilanciamento a occhio non funzionava; le simulazioni sì.

## Git

- Lavora su `prova` (vedi «I due link») e fai il merge su `main` solo dopo la verifica e l'approvazione di Edoardo.
- Messaggi di commit in italiano, al presente: «Aggiunge la camminata della Strega».
- Non caricare mai su GitHub chiavi, certificati di firma o il file `.keystore` di Android.
