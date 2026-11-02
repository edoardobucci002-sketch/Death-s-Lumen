# Registro delle decisioni

Una riga per decisione, la più recente in alto.

| Data | Decisione | Motivo |
| --- | --- | --- |
| 2026-11-02 | Nomi degli sprite in gioco: `Nome_gioco_V#.aseprite`, nella cartella del personaggio accanto al ritratto `Nome_V#.aseprite` | Scelta di Edoardo: i ritratti già fatti non vanno rinominati |
| 2026-11-02 | Gli sprite provvisori stanno in `segnaposto/<CATEGORIA>/` con versione V0: il primo file vero di Edoardo li sostituisce da solo | Nessun passaggio a mano quando arrivano gli sprite veri |
| 2026-11-02 | `ALTEZZA_MINIMA` resta 300 pixel di gioco | Scelta di Edoardo |
| 2026-11-02 | Workflow su GitHub: tolto `setup-android` (gli strumenti Android sono già sui server); azioni aggiornate a checkout v7, setup-node v7, setup-java v6, upload-artifact v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5 | `setup-android` faceva fallire l'APK; le versioni vecchie usavano Node 20, che GitHub sta ritirando |
| 2026-10-30 | Stack: Phaser 4.2 + TypeScript + Vite 8 + Capacitor 8 | Phaser legge gli export di Aseprite con i tag; Capacitor già collaudato nella v0 |
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
