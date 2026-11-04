# Asset da creare (Edoardo)

Elenco di ciò che Edoardo deve ancora disegnare. Nel gioco c'è un segnaposto per ognuno (disegnato dal codice o preso dalla v0). Aggiornalo quando si aggiunge o si consegna qualcosa.

| Asset | Dove serve | Stato / segnaposto |
| --- | --- | --- |
| **Goccia di cera** (oggetto a terra, 8×11 px circa; se vuole anche una versione grande per i mucchi di Seth) | gocce di Cera lasciate dai nemici | disegnata dal codice in `src/sistema/oggetti.ts`; il file `OGGETTI/Goccia_cera_V1.aseprite` la sostituisce |
| **10 icone degli amuleti** (24×24, `Icona_Amuleto_<id>`: specchioRotto, lanternaCieca, cuoreAvido, sangueFreddo, martire, danzaMacabra, ceriGemelli, lucciola, ossaDelite, pattoDiSangue) e il **grano del Rosario** | Rosario: carte del reliquiario, pausa, HUD | grani colorati disegnati dal codice (`src/sistema/amuleti.ts`) |
| **Simboli degli stati** (circa 11×11 px: `EFFETTI/Simbolo_Abbagliato_V1.aseprite`, `Simbolo_Consacrato`, `Simbolo_Maledetto`, `Simbolo_Sepolto`) | sopra la testa dei nemici | disegnati dal codice in `src/sistema/simboli.ts` (sole, croce, teschio, lapide); ogni file li sostituisce da solo |
| **Striscia del dono** (170×62 px: `HUD/Cornici/Striscia_Dono_V1.aseprite` e `Striscia_Dono_Scelta_V1.aseprite`, pozzetto icona in x 5, y 5, 34×52) | scelta dei doni e reliquiari | provvisoria dal codice in `src/sistema/scheda.ts`; le misure interne sono in `STRISCIA`, `src/data/hud.ts` |
| **8 icone** (24×24: `Icona_Lapide`, `Icona_Rosario_spezzato`, `Icona_Corvo`, `Icona_Velo_funebre`, `Icona_Cera_votiva`, `Icona_Chiodo_di_bara`, `Icona_Lacrima_di_lumen`, `Icona_Campanella_d_argento`, in `ICONE/<Nome>/`) | armi e doni nuovi; le stesse icone fanno da sprite provvisori di lapide, grano e corvo | disegnate dal codice in `src/sistema/segnaposto-oggetti.ts`; ogni file le sostituisce da solo |
| **Effetti delle armi nuove** (lapide che cade, grano, corvo in volo con le ali, aura del Velo) | in partita | icone ingrandite e cerchio a retino dal codice |
| **Seth, il Rinnovato** (sprite e barra) | boss dei minuti 5 e 10 | `Il_Mietitore` e `Barra_Mietitore` |
| Cerchi delle reazioni (Eclissi, Rivelazione, Esorcismo, Interramento) | reazioni tra stati | cerchi a retino dal codice |
| Preavvisi e falci delle mosse di Seth | boss | cerchi rossi a retino dal codice |
| Cornici dei ritratti e Pannello scheda | selezione del personaggio | quelle di prima, da rinnovare |
| Targa lapide, Scrigno, emblemi, anelli grigio/arancio | interfaccia | fuori dal gioco per ora |
| Pulsante_Pericolo | «Abbandona» | provvisorio |
| Paesaggio sotto la citazione della scheda | selezione | cielo con colline in CSS |
| Nemici V1 alla scala nuova | tutti i nemici | segnaposto V0 ×2 |
| Effetti e icone delle armi alla scala nuova | armi | segnaposto V0 |
