# Tappe

Ogni tappa finisce con qualcosa che Edoardo può provare sul telefono. Non si passa alla successiva finché la tappa non è verificata (vedi «Verifica» in CLAUDE.md).

| Tappa | Obiettivo | Si prova così | Stato |
| --- | --- | --- | --- |
| M0 · Fondamenta | Stack confermato, progetto creato, export da Aseprite funzionante, PWA vuota pubblicata su GitHub Pages | Il link si apre sul telefono e mostra uno sprite di Edoardo animato | **fatta** (30/10; export vero dei 4 ritratti V3 provato il 2/11) |
| M1 · Camminare | Un personaggio, joystick touch e tastiera, telecamera, terreno del cimitero, buio e alone di luce, pixel perfect | Il personaggio cammina nel cimitero, in verticale e in orizzontale | **fatta** (2/11): joystick e velocità approvati da Edoardo; sprite ingame V5 di Edoardo e mondo riscalato alle proporzioni della v0 (2/11); dal 2/11 animati con idle e walk |
| M2 · La notte arriva | Nemici, comparse, griglia spaziale, danno da contatto, salute, morte | 400 nemici a 60 fps; si muore | **fatta** (2/11): 6 nemici segnaposto, 400 in campo a 58 fps (emulato), danno da contatto, morte e Riprova; barra della salute sotto il personaggio |
| M3 · Combattere | 4 armi iniziali, anime, esperienza, scelta dei doni | Partita di 5 minuti con un personaggio | **fatta** (2/11): 4 armi iniziali, anime, esperienza, carte dei doni (solo arma iniziale); colpi resi più leggibili dopo la prova di Edoardo |
| M4 · Il resto dell'arsenale | 6 armi comuni, 9 doni passivi, 4 abilità speciali | Ogni personaggio ha la sua build | **fatta** (2/11): 6 armi comuni, 9 doni passivi, 4 abilità con pulsante e Spazio; 60 fps con 400 nemici e 7 armi (Mac) |
| M5 · La notte intera | Élite, sciami, Mietitore, drop, reliquiari, alba e vittoria | Partita completa di 15 minuti | **fatta** (2/11): élite, sciami, Mietitore ai minuti 5 e 10, pane, calamita, reliquiari con segnali, alba e vittoria; anime oltre il limite corrette dopo la prova di Edoardo |
| M6 · Facciata | Selezione con le schede, HUD, pause, fine partita, audio, record | Il gioco si presenta come la v0 o meglio | **fatta** (2/11): menu con le schede, HUD completo, pausa (anche automatica e con Indietro), fine partita con record, suoni sintetizzati |
| M7 · App | Capacitor iOS e Android, icone, avvio, vibrazione, schermo acceso, tasto Indietro | App installata sul telefono di Edoardo | **in prova** (2/11): icone e avvio dal Lampionaio V5; APK costruita da GitHub Actions; Edoardo ha un Galaxy S25 (Android), iOS rimandato (manca Xcode) |
| M8 · Bilanciamento | Bot di simulazione, ritocco dei numeri, playtest | I risultati del bot rispettano gli obiettivi | **in corso** (2/11): bot e `npm run sim` pronti; primo ritocco (esperienza, salute dei nemici, Mietitore, Lanterna), 3 mosse nuove del Mietitore, IA dei nemici e orde. 3/11, dopo la prova di Edoardo: pane e calamite a ritmo fisso, Benedizione più debole, nemici più resistenti da metà notte; il bot vince 3 notti su 24. 3/11, tappa 1 della proposta su oggetti e build (zone non cumulative, Specchio, armatura in percentuale, Calamita, Campana) e correzioni per Becchino, Lampionaio, Mietitore e bruti: 5 vittorie su 32, poche di proposito (arriverà la meta progressione). Tappa 2 (Fiaschetta e Grazia) fatta: 12 vittorie su 96 con l'obiettivo del 15%. Tappa 3 (affinità, stati, reazioni, ruoli nuovi) fatta: 9 vittorie su 96. Meta progressione di base fatta (Cera, Cappella, ceri, Seconda candela, sblocchi, salvataggio). 3/11, dopo la prova di Edoardo: Cera a terra, HUD ×2 su telefono verticale, stati più visibili. Tappa 4 (Rosario, 10 amuleti, Peccato) fatta: il bot vince 16 notti su 48 con la Cappella a metà. 4/11: scelta dei doni a strisce, legenda di stati e reazioni, tappa 5 (4 armi e 4 doni con i loro sblocchi), tappa 6 (10 unioni). Da riprovare a mano |

Fuori tappa, 3/11: l'HUD disegnato da Edoardo è nel gioco sul branch `hud-gioco`, **in prova**. La selezione del personaggio resta quella di prima: la sua cornice sarà rinnovata.

## Note per la M1

- `ALTEZZA_MINIMA` portata a 700 pixel di gioco e distanze × 2,35 con gli sprite V5 (deciso con Edoardo il 2/11; prima era 300).
- I file `PERSONAGGI/<Nome>/<Nome>_V#.aseprite` (224×288, solo `idle`) sono i **ritratti della selezione**, non gli sprite in gioco. Edoardo disegnerà a parte gli sprite di gameplay (idle, walk, hurt, death, special): si chiamano `Nome_ingame_V#.aseprite`.
- Finché mancano gli sprite di gameplay si usa il segnaposto della v0 (80×64 con gli effetti dentro).
