# Roadmap

Un solo piano di lavoro, aggiornato a ogni tappa (4 novembre 2026). Ogni tappa finisce con qualcosa che Edoardo può provare, di norma dal Laboratorio sul link di prova (vedi «Verifica» in `CLAUDE.md`). Il dettaglio dei contenuti è nel [GDD](GDD.md), le scelte in [decisioni.md](decisioni.md), i numeri e le simulazioni in [bilanciamento.md](bilanciamento.md).

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
| M8 · Bilanciamento e oggetti | Bot di simulazione, ritocco dei numeri, meta progressione e oggetti della [proposta](proposte/oggetti-build-sinergie.md) | **in corso**, vedi sotto. Obiettivi del bot **aperti** (Cappella vuota 21%, completa 52%): [bilanciamento.md](bilanciamento.md). Da riprovare a mano |

Parti della M8 già fatte:
- Tappa 1 · ritocchi agli oggetti esistenti (3/11)
- Tappa 2 · Fiaschetta di lumen e Grazia (3/11)
- Tappa 3 · affinità, stati, reazioni e ruoli nuovi delle armi (3/11); stati come simboli sopra la testa, scelta dei doni a strisce, legenda (4/11)
- Meta di base · Cera, Cappella a elenco con 7 ceri e Seconda candela, personaggi da sbloccare, salvataggio e codice (3/11); Cera a terra (3/11)
- Tappa 4 · Rosario, 10 amuleti, Peccato (3/11)
- Tappa 5 · 4 armi e 4 doni nuovi con i loro sblocchi (4/11)
- Tappa 6 · 10 unioni (4/11)
- Laboratorio (LAB) sul link di prova (3/11)

## Prossime tappe (in quest'ordine)

1. **Tappa 7 · Patti**: regole scelte nel menu prima della notte, che la rendono più dura e più ricca. Proposti tutti e cinque (Falce, Silenzio, Folla, Buio, Ombra) in [proposte/oggetti-build-sinergie.md](proposte/oggetti-build-sinergie.md); da creare. Disegni: 5 icone. *Da decidere*: la proposta li sbloccava con la prima vittoria, a 80 Cera l'uno.
2. **Cappella come hub**: i personaggi nella navata, la scheda con le statistiche vere, la Cera disegnata, 9 icone dei ceri. Viene **dopo** i Patti. Disegni: la Cappella, l'icona della Cera, le icone dei ceri.
3. **Devozione e notti diverse**: 8 livelli di Devozione per personaggio; notti che si sbloccano (nebbia, luna piena, notte dei morti), ognuna con un Seth dalle mosse diverse. Dettagli in [proposte/meta-progressione.md](proposte/meta-progressione.md).
4. **Cero della fiaschetta e questline** con il Ceraiolo (ampolla incrinata → riparata → si riempie battendo Seth). Quando la fiaschetta diventerà uno sblocco, rilanciare la simulazione.
5. **Redesign dell'intero gioco** (da collocare nell'ordine con Edoardo): HUD, personaggi, animazioni (`attack`, `special`, `hurt`, `death`), effetti, mosse di Seth, hub, nemici V1 alla scala nuova, scheda del personaggio (con statistiche vere), cornici dei ritratti e Pannello scheda.
6. **Più avanti**: mondi e boss nuovi come dungeon in fila nella stessa partita, alla Hades; altri boss oltre Seth; la trama dell'endgame (vedi [lore.md](lore.md)).

## Idee non ancora decise

- Suoni e musica originali al posto di quelli sintetizzati.
- Lingua del gioco: solo italiano, oppure anche inglese (il titolo è in inglese).
- Nemici con uno stile grafico diverso da quello dei personaggi.
- Torce o lumini sparsi nel cimitero, con un loro alone di luce: oggi l'unica luce è la lanterna e la mappa risulta molto buia (osservazione di Edoardo, 2 novembre).

## Piccole cose da sistemare nel codice (non fatte nel riordino dei documenti)

- Nove commenti in `src/data/` rimandano a `docs/GDD_base.md`: il file ora è `docs/GDD.md`. Si aggiornano alla prossima modifica al codice.
- Il commento in `src/data/nemici.ts` (riga 92) dice «0,04 × (m − 3)²»; il valore vero è 0,06.
- Testi di gioco che dicono ancora «Mietitore»: la riga del livello 1 del Fuoco fatuo (`armi.ts`). L'unione è già «Falce di Seth» (4/11); l'identificatore interno `falceDelMietitore` e il nome dell'icona restano.
- Il CSS usa ancora IM Fell English SC per alcuni titoli (`--f-titolo`: avviso, titolo della scelta dei doni, pannelli, nastri); i titoli decisi sono in Tiny5.
- `@fontsource/pixelify-sans` è ancora tra le dipendenze (lo usa solo la bozza dell'HUD).
- Disegnare gli asset elencati in [asset_da_creare.md](asset_da_creare.md).
