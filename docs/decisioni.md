# Registro delle decisioni

Una riga per decisione, la più recente in alto.

| Data | Decisione | Motivo |
| --- | --- | --- |
| 2026-11-02 | Sprite in gioco dei personaggi alti circa **64 px**. Quando arrivano, lo schermo di gioco sale da 300 a circa 560 px (stessa proporzione della v0: personaggio ≈ 1/9 dell'altezza) e tutte le distanze del GDD si moltiplicano per lo stesso fattore | A 32-48 px lo stile dettagliato di Edoardo non rende; a 100 px anche nemici ed effetti andrebbero disegnati enormi |
| 2026-11-02 | ~~Sprite in gioco a 32-48 px~~ (superata dalla riga sopra) | I primi ingame_V1 erano alti circa 100 px |
| 2026-11-02 | Nomi degli sprite in gioco: `Nome_ingame_V#.aseprite`, nella cartella del personaggio accanto al ritratto `Nome_V#.aseprite` | Scelta di Edoardo (prima si era detto `_gioco`): i ritratti già fatti non vanno rinominati |
| 2026-11-02 | Gli sprite provvisori stanno in `segnaposto/<CATEGORIA>/` con versione V0: il primo file vero di Edoardo li sostituisce da solo | Nessun passaggio a mano quando arrivano gli sprite veri |
| 2026-11-02 | `ALTEZZA_MINIMA` resta 300 pixel di gioco | Scelta di Edoardo |
| 2026-11-02 | Workflow su GitHub: tolto `setup-android` (gli strumenti Android sono già sui server); azioni aggiornate a checkout v7, setup-node v7, setup-java v6, upload-artifact v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5 | `setup-android` faceva fallire l'APK; le versioni vecchie usavano Node 20, che GitHub sta ritirando |
| 2026-10-30 | Stack: Phaser 4.2 + TypeScript + Vite 8 + Capacitor 8 | Phaser legge gli export di Aseprite con i tag; Capacitor già collaudato nella v0 |
| 2026-11-02 | I nemici segnaposto della v0 (V0, in `NEMICI/<Nome>/`) si ingrandiscono × 2 finché Edoardo non disegna i V1 alla nuova scala | Disegnati per personaggi di 34 px; × 2 li riporta circa alle proporzioni della v0 |
| 2026-11-02 | I personaggi in gioco hanno solo `idle` e `walk` disegnati; attack, special, hurt e death per ora sono effetti fatti dal codice (lampo, dissolvenza a retino, bagliore). Se Edoardo disegna un tag, quello prende il posto dell'effetto | Alla Vampire Survivors le armi sono disegni a parte; meno lavoro di animazione |
| 2026-11-02 | Sprite in gioco V5 (tela 96×96, personaggi alti 75–86 px). Il mondo torna alle proporzioni della v0 (personaggio ≈ 1/9 del lato corto): si vedono almeno 700×610 pixel di gioco e tutte le distanze e velocità della v0 si moltiplicano per 2,35 | Scelta di Edoardo (opzione A); con 400 nemici serve vedere molto cimitero |
| 2026-11-02 | La scala intera è la più vicina a quella ideale, non quella per difetto: sui telefoni ×2 (personaggio ≈ 1/7 della larghezza), sul computer ≈ 1/10 | Per difetto un iPhone andrebbe a ×1 e il personaggio sarebbe minuscolo |
| 2026-10-30 | Nuovo repository `Death-s-Lumen`; il vecchio diventa `Death-s-Lumen-v0` (archivio) | Ripartire da zero senza perdere la v0 |
| 2026-10-30 | Identificativo dell'app: `com.deathslumen.game` | Va scelto prima della pubblicazione sugli store; cambiarlo dopo crea un'app diversa |
| 2026-10-30 | Il gioco si rifà da zero; la v0 «Lumen dei Morti» resta come riferimento | La v0 è un prototipo in un'unica pagina HTML, difficile da far crescere |
| 2026-10-30 | Nome del gioco: **Death's Lumen** | Scelta di Edoardo |
| 2026-10-30 | Due livelli di sprite: ritratti dettagliati per la selezione, sprite in gioco semplificati alla Vampire Survivors | Leggibilità in gioco con centinaia di nemici |
| 2026-10-30 | Nomi dei file: `Nome_V#.aseprite`, `Nome_idle_sheet_V#.png`; archivio in `DEATH'S LUMEN/PERSONAGGI/<Nome personaggio>/` | Convenzione di Edoardo |
| 2026-10-30 | Obiettivo: app per iOS e Android, più versione web installabile | Richiesta di Edoardo |
| 2026-10-30 | Versione web pubblicata su GitHub Pages, repository pubblico `edoardobucci002-sketch/Death-s-Lumen` | GitHub Pages gratuito richiede un repository pubblico |

## Riferimenti della v0

- Gioco v0 (artifact su claude.ai): https://claude.ai/artifact/9BHhRBAgxo9sAnrc2kAGTj
- Compendio v0 (documento su claude.ai): https://claude.ai/artifact/4uZiNBDLcxrwRCx1UF4aLU
- Versione web della v0, dopo la rinomina: https://edoardobucci002-sketch.github.io/Death-s-Lumen-v0/www/
- Versione web del nuovo gioco: https://edoardobucci002-sketch.github.io/Death-s-Lumen/
