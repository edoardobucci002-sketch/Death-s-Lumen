# Death's Lumen

Survivor-like in pixel art (sul modello di Vampire Survivors). Notte di Ognissanti, un cimitero: il giocatore cammina, le armi colpiscono da sole, si sopravvive 15 minuti fino all'alba. Quattro personaggi, ognuno con un'arma iniziale esclusiva e un'abilità speciale.

Il gioco si **rifà da zero**. La v0 (prototipo "Lumen dei Morti", un'unica pagina HTML) è il riferimento per contenuti, numeri e sensazioni di gioco, non per il codice. I valori di partenza sono in `docs/GDD_base.md`.

## Chi lavora al progetto

- **Edoardo**: art director e game designer. Disegna in Aseprite. **Non ha basi di programmazione.**
  - Spiega ogni scelta tecnica in parole semplici, in italiano, senza dare per scontati termini da sviluppatore.
  - Prima di una decisione difficile da cambiare (motore, struttura dei dati, formato degli asset) proponi le opzioni con pro e contro e aspetta la sua risposta.
  - Quando chiedi a Edoardo di fare qualcosa (aprire un'app, esportare da Aseprite, provare sul telefono), dai passi numerati con i nomi esatti di menu e pulsanti.
  - Dopo ogni tappa digli come provare il risultato: il comando da lanciare e cosa deve vedere.
- Computer: MacBook Air M1 con 8 GB di RAM. Tieni leggeri build, dipendenze e server di sviluppo.

## Stack (confermato il 30 ottobre 2026)

| Parte | Scelta | Perché |
| --- | --- | --- |
| Linguaggio | TypeScript 5.9 | gli errori emergono prima di arrivare sul telefono |
| Motore | **Phaser 4.2** | legge direttamente gli export di Aseprite (sprite sheet + JSON con i tag), regge centinaia di nemici |
| Build | Vite 8 | avvio istantaneo, ricarica al salvataggio |
| App mobile | Capacitor 8 (iOS + Android) | già collaudato nella v0 |
| Distribuzione rapida | PWA su GitHub Pages | repository `edoardobucci002-sketch/Death-s-Lumen` |

- **Phaser 4, non 3.** Molti esempi online e parte di quello che sai riguardano Phaser 3. Prima di usare un'API controlla che esista nei tipi in `node_modules/phaser/types/phaser.d.ts`.
- Le versioni delle dipendenze sono fissate in `package.json`. Aggiornale solo quando serve e dopo averlo detto a Edoardo.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm install` | scarica le dipendenze (la prima volta e dopo ogni cambio di `package.json`) |
| `npm run dev` | avvia il gioco in locale; l'indirizzo «Network» si apre anche dal telefono sulla stessa Wi-Fi |
| `npm run asset` | esporta da Aseprite tutti gli sprite (vedi «Asset») |
| `npm run bozza` | apre la pagina di bozza dell'HUD (`bozza-hud.html`): gli elementi di `HUD/` al loro posto, senza giocare |
| `npm run icone` | rifà icone e schermate di avvio (web, Android, iOS) dallo sprite in gioco del Lampionaio |
| `npm run build` | controlla i tipi, crea la build in `dist/` e il service worker per l'offline |
| `npm run sim` | simulazione di bilanciamento: il bot gioca 3 notti per personaggio (`npm run sim -- 5 strega` per sceglierne numero e personaggi); riepilogo a schermo, dettagli in `prove/sim.json` |
| `npm run prova` | prova automatica su desktop, iPhone e Android emulati, su una porta libera; screenshot in `prove/` (la prima volta: `npx playwright install chromium`) |
| `npm run ios` / `npm run android` | build + copia nei progetti nativi + apre Xcode o Android Studio |

## Struttura delle cartelle (proposta)

```
DEATH'S LUMEN/
  PERSONAGGI/<Nome personaggio>/   sorgenti Aseprite di Edoardo (non modificarli mai)
  NEMICI/ EFFETTI/ OGGETTI/ ICONE/ stessa logica per gli altri asset (le icone si chiamano Icona_<Nome>)
  HUD/<Gruppo>/<Elemento>_V#.aseprite  interfaccia (Barre, Pulsanti, Cornici, Pannelli, Emblemi, Segnali);
                                   HUD/Tavole/ tiene le tavole originali (senza _V#, quindi non esportate)
  gioco/                           questo repository (su GitHub: Death-s-Lumen)
    CLAUDE.md
    docs/                          GDD_base.md, decisioni.md, tappe.md
    src/
      main.ts                      avvio di Phaser in pixel perfect e collegamento al telefono
      scene/                       le scene di Phaser: Avvio, Menu (schede), Gioco
      sistema/                     pixel perfect, mobile, elenco asset, arte dell'HUD (arte.ts: immagini e misure a pixel interi)
      data/                        TUTTI i numeri di bilanciamento (personaggi, armi, nemici…)
      stile.css                    interfaccia HTML sopra il gioco e caratteri inclusi
    public/                        manifest, icone
      assets/                      export di Aseprite + elenco.json, generati da `npm run asset`, mai a mano
    segnaposto/PERSONAGGI/ …       sprite provvisori della v0 (versione V0), finché Edoardo non esporta i suoi
                                   (effetti, icone e anime divisi dai file della v0 con tools/dividi-v0.lua)
    tools/                         export-asset, icone, dividi-v0, genera-sw, prova, sfondi-bozza, sim (simulazione di bilanciamento)
    bozza-hud.html, src/bozza/     pagina di bozza dell'HUD (solo in sviluppo, non entra nella build); sfondi in bozza/sfondi/
    android/  ios/                 progetti nativi Capacitor
    .github/workflows/             pubblicazione su GitHub Pages e APK Android automatici
```

Il nome della cartella `DEATH'S LUMEN` contiene un apostrofo: negli script e nei comandi metti sempre i percorsi tra virgolette.

`npm run asset` cerca gli sprite nella cartella che contiene il repository. Se la struttura è diversa: `DL_ARTE="/percorso/DEATH'S LUMEN" npm run asset`.

## Asset e pixel art

- **Due livelli di sprite** (decisione di Edoardo):
  - **Ritratti dettagliati**: solo nella schermata di selezione del personaggio.
  - **Sprite in gioco** molto più semplici, leggibili a colpo d'occhio, alla Vampire Survivors.
- **Nomi dei file** (convenzione di Edoardo), con le parole separate da `_` e la versione in fondo:
  - `Nome_V#.aseprite`, per esempio `La_Badessa_V2.aseprite`
  - `Nome_idle_sheet_V#.png`, per esempio `La_Badessa_idle_sheet_V2.png`
  - `Nome_V#.aseprite` è il **ritratto** della selezione; `Nome_ingame_V#.aseprite` è lo **sprite in gioco** (stessa cartella, deciso il 2 novembre 2026)
  - Il gioco usa sempre la versione più alta presente; non cancellare le versioni vecchie.
  - Gli sprite in `segnaposto/` hanno la versione V0: il primo file vero (V1 o più) li sostituisce da solo.
- **Animazioni come tag di Aseprite**, con nomi fissi: `idle`, `walk`, `attack`, `special`, `hurt`, `death`. Lo script di export legge i tag; Edoardo non deve tagliare fotogrammi a mano.
- **Export**: `npm run asset` (`tools/export-asset.mjs`) lancia la CLI di Aseprite su ogni `.aseprite` (versione più alta), produce sprite sheet + JSON e scrive `public/assets/elenco.json`. Avvisa se un file non ha tag o ha tag con nomi non previsti.
  - La CLI su Mac è in `/Applications/Aseprite.app/Contents/MacOS/aseprite`; con Aseprite da Steam lo script la trova da solo.
  - Le animazioni in Phaser si chiamano `<chiave>:<tag>`, per esempio `Il_Lampionaio:walk`.
- **Pixel perfect già implementato** in `src/sistema/pixel.ts`: il canvas ha la risoluzione di gioco e il browser lo ingrandisce di un numero intero di pixel fisici. Non mettere mai uno zoom non intero.
- **Regole pixel perfect, sempre**:
  - Il mondo si disegna a bassa risoluzione e si ingrandisce di un fattore intero, con filtro nearest e senza antialiasing.
  - Posizioni arrotondate al pixel prima di disegnare.
  - Le dissolvenze si fanno a retino (dither Bayer), non con la trasparenza.
- Il contorno scuro, il punto di contatto con il terreno (piedi in basso al centro) e la direzione di base (il personaggio guarda a destra) devono essere uguali in tutti gli sprite. Il gioco li ribalta per guardare a sinistra.

## Identità visiva

- Palette notturna calda; ogni personaggio ha il suo colore guida:
  - Lampionaio: ambra `#e3913a`
  - Becchino: seppia `#b89a74`
  - Badessa: oro `#dcc07a`
  - Strega: viola `#a57ae0`
- L'interfaccia prende il colore del personaggio scelto.
- Caratteri della v0:
  - Titoli: IM Fell English SC
  - Testi: EB Garamond
  - Corsivi: IM Fell English
  - Numeri e HUD: Jersey 10 (dal 3 novembre 2026, al posto di Pixelify Sans: il suo 5 sembrava una S)

  Nell'app vanno inclusi nel pacchetto, non scaricati da internet.
- Le schede dei personaggi riprendono lo stile della scheda di Edoardo: nome, motto, ritratto, biografia, fila di sprite, arma iniziale, abilità speciale, barre delle statistiche, citazione sopra un paesaggio.

## Regole per il codice

- **Nessun numero di bilanciamento dentro la logica.** Statistiche, curve, probabilità e tempi stanno in `src/data/`, in file leggibili da Edoardo. Quando un numero cambia, aggiorna anche `docs/GDD_base.md`.
- Pochi file piccoli, con nomi chiari. Un commento breve in italiano sopra ogni sistema per dire che cosa fa.
- Prestazioni (obiettivo: 60 fps su un telefono di fascia media con 400 nemici in campo):
  - griglia spaziale per le collisioni;
  - pool di oggetti per nemici, proiettili e numeri del danno;
  - niente allocazioni dentro il ciclo di gioco;
  - nemici fuori schermo disegnati solo se servono.
- Logica a passo fisso (60 aggiornamenti al secondo), separata dal disegno, così il gioco va alla stessa velocità su ogni schermo.
- Il caso (spawn, drop, carte) passa da un generatore con seme: serve per riprodurre i bug e per le simulazioni.

## Mobile (obbligatorio fin dalla prima tappa)

- Controlli touch: joystick virtuale dove si appoggia il dito, pulsante dell'abilità in basso a sinistra, pausa in basso a destra. Tastiera su desktop: WASD/frecce, Spazio, P, M, 1-2-3.
- Rispetta le safe area (notch, Dynamic Island, barre di sistema). Funziona sia in verticale sia in orizzontale.
- Comportamento dell'app:
  - pausa automatica quando l'app va in background;
  - schermo sempre acceso durante la partita;
  - vibrazione sugli eventi importanti, disattivabile;
  - su Android, il tasto Indietro mette in pausa, riprende o torna al menu.
- Niente zoom con doppio tocco o pizzico; niente selezione di testo nell'interfaccia di gioco.
- Ogni pulsante da toccare è largo e alto almeno 44 punti. Prima di chiudere una modifica all'HUD lancia «Verifica tutti i telefoni» nella bozza (`npm run bozza`).
- Funziona offline: tutti gli asset sono nel pacchetto.

## Verifica, prima di dire che una tappa è finita

1. `npm run build` senza errori né avvisi di tipo.
2. Prova nel browser con Playwright in viewport desktop, iPhone verticale e iPhone orizzontale, più un Android: niente errori in console, screenshot controllati a occhio.
3. Per ogni modifica al bilanciamento, lancia la **simulazione con il bot** (`npm run sim`, codice in `tools/sim.mjs` e `src/sistema/bot.ts`). Il bot gioca 15 minuti con ciascun personaggio; riporta a che minuto muore e il livello raggiunto ogni minuto. Obiettivo:
   - il Mietitore del minuto 5 è il primo vero ostacolo;
   - nessun personaggio vince sempre senza sforzo: il bot vince al massimo il 40% delle notti, perché un giocatore umano va più forte di lui (Edoardo al minuto 8 era al livello 60, il bot al 40);
   - nessuno muore sempre prima del minuto 5.
4. Riassumi a Edoardo cosa è cambiato e come provarlo.

## Lezioni dalla v0 (da non ripetere)

- Le schermate sovrapposte in griglia CSS si allargavano quanto il loro contenuto più largo: usa `grid-template-columns: minmax(0, 1fr)` e `min-width: 0`.
- Un `display` scritto in CSS annullava l'attributo `hidden`: il gioco va mostrato e nascosto da un solo sistema.
- Le regole per il telefono in orizzontale venivano sovrascritte da quelle scritte dopo: tienile in fondo o con selettori più specifici.
- I font presi da internet sparivano offline: vanno inclusi nel pacchetto.
- Il bilanciamento a occhio non funzionava; le simulazioni sì.

## Riferimenti

- `docs/GDD_base.md`: tutti i contenuti e i numeri della v0, punto di partenza del bilanciamento.
- `docs/decisioni.md`: registro delle decisioni prese con Edoardo (data, decisione, motivo). Aggiornalo a ogni scelta.
- `docs/tappe.md`: piano di lavoro e stato. La tappa M0 è fatta: si riparte dalla M1.
- La v0 giocabile e il compendio della v0 sono artifact su claude.ai (link in `docs/decisioni.md`).

## I due link (deciso il 3 novembre 2026)

Il gioco esiste in **due versioni sole**, una per ramo, ognuna con il suo link:

| Ramo | Link | Cosa contiene |
| --- | --- | --- |
| `prova` | https://edoardobucci002-sketch.github.io/Death-s-Lumen/prova/ | il link personale di Edoardo: **ogni modifica nuova finisce qui**; in basso la scritta «PROVA» |
| `main` | https://edoardobucci002-sketch.github.io/Death-s-Lumen/ | il link pubblico (e l'APK Android): solo ciò che Edoardo ha approvato |

- Ogni push su `prova` o su `main` ripubblica entrambi i link in un paio di minuti (`.github/workflows/pagine.yml`; per `prova` lo fa partire `prova.yml`, perché GitHub pubblica solo da `main`).
- Lavora sempre su `prova`, o su un ramo di passaggio che unisci a `prova` appena funziona, nella stessa sessione. Mai rami lasciati a metà o worktree dimenticati: Edoardo deve trovare tutto in `/prova/`.
- Unisci `prova` in `main` **solo quando Edoardo dice che approva**.
- Sul Mac al massimo un server acceso (`npm run anteprima`, porta 4173). Spegnilo quando hai finito.
- Il service worker tiene separate le copie offline dei due link (`tools/genera-sw.mjs`). Salvataggi e record invece sono in comune, perché il sito è lo stesso.

## Revisioni con gli artifact (deciso il 3 novembre 2026)

Quando una modifica tocca molti elementi (HUD, schermate, scritte, più personaggi), Edoardo la rivede in un **artifact su claude.ai**, separato dall'app, invece di giocare o di aprire pagine sul Mac.

- **Contenuto**: le schermate interessate, fotografate con Playwright dalla build di `prova` su iPhone verticale, iPhone orizzontale e computer (più Android se serve), e tutto quello che c'è da decidere.
- **Questionario, sempre**: ogni artifact ha un questionario da compilare. Ogni domanda ha «Va bene» / «Cambia» e un campo per la nota o la proposta. In fondo c'è un **riassunto che si aggiorna in tempo reale** a ogni risposta, con il pulsante «Copia il riassunto», da incollare in chat: così sai subito cosa va e cosa no. Quando c'è da dire di più, Edoardo scrive direttamente in chat.
- **Vita breve**: un artifact si apre quando serve e si **elimina quando non serve più**, cioè quando le risposte sono arrivate e applicate. Proponilo a Edoardo ed elimina solo dopo il suo sì.
- La bozza dell'HUD (`npm run bozza`, porta 5190) non si tiene accesa per Edoardo: per lui ci sono gli artifact. Resta uno strumento di verifica tuo (per esempio «Verifica tutti i telefoni»): spegnila quando hai finito.
- Non spegnere un server che Edoardo sta usando senza chiederglielo.

## Git

- Lavora su `prova` (vedi «I due link») e fai il merge su `main` solo dopo la verifica e l'approvazione di Edoardo.
- Messaggi di commit in italiano, al presente: «Aggiunge la camminata della Strega».
- Non caricare mai su GitHub chiavi, certificati di firma o il file `.keystore` di Android.
