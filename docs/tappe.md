# Tappe

Ogni tappa finisce con qualcosa che Edoardo può provare sul telefono. Non si passa alla successiva finché la tappa non è verificata (vedi «Verifica» in CLAUDE.md).

| Tappa | Obiettivo | Si prova così | Stato |
| --- | --- | --- | --- |
| M0 · Fondamenta | Stack confermato, progetto creato, export da Aseprite funzionante, PWA vuota pubblicata su GitHub Pages | Il link si apre sul telefono e mostra uno sprite di Edoardo animato | **fatta** (30/10; export vero dei 4 ritratti V3 provato il 2/11) |
| M1 · Camminare | Un personaggio, joystick touch e tastiera, telecamera, terreno del cimitero, buio e alone di luce, pixel perfect | Il personaggio cammina nel cimitero, in verticale e in orizzontale | da fare |
| M2 · La notte arriva | Nemici, comparse, griglia spaziale, danno da contatto, salute, morte | 400 nemici a 60 fps; si muore | da fare |
| M3 · Combattere | 4 armi iniziali, anime, esperienza, scelta dei doni | Partita di 5 minuti con un personaggio | da fare |
| M4 · Il resto dell'arsenale | 6 armi comuni, 9 doni passivi, 4 abilità speciali | Ogni personaggio ha la sua build | da fare |
| M5 · La notte intera | Élite, sciami, Mietitore, drop, reliquiari, alba e vittoria | Partita completa di 15 minuti | da fare |
| M6 · Facciata | Selezione con le schede, HUD, pause, fine partita, audio, record | Il gioco si presenta come la v0 o meglio | da fare |
| M7 · App | Capacitor iOS e Android, icone, avvio, vibrazione, schermo acceso, tasto Indietro | App installata sul telefono di Edoardo | da fare |
| M8 · Bilanciamento | Bot di simulazione, ritocco dei numeri, playtest | I risultati del bot rispettano gli obiettivi | da fare |

## Note per la M1

- `ALTEZZA_MINIMA` resta 300 pixel di gioco (deciso con Edoardo il 2/11).
- I file `PERSONAGGI/<Nome>/<Nome>_V#.aseprite` (224×288, solo `idle`) sono i **ritratti della selezione**, non gli sprite in gioco. Edoardo disegnerà a parte gli sprite di gameplay (idle, walk, hurt, death, special): serve una convenzione di nome per distinguerli.
- Finché mancano gli sprite di gameplay si usa il segnaposto della v0 (80×64 con gli effetti dentro).
