# Death's Lumen

Action roguelite a stanze in pixel art per iOS e Android (sul modello di Hades): una Veglia attraversa 3 Mondi a stanze, si attacca con l'arma del personaggio e le altre armi colpiscono da sole; quattro personaggi giocabili (la Veggente e la Sguattera sono previsti). Le regole per lavorare al progetto sono in [CLAUDE.md](CLAUDE.md); il gioco com'è oggi in [docs/GDD.md](docs/GDD.md); il piano in [docs/roadmap.md](docs/roadmap.md).

**Il gioco sta cambiando genere (12/11/2026).** Fino ad allora era un survivor-like: una veglia in un cimitero, 15 minuti fino all'alba. Quella versione è congelata nel tag `survivor-v1`, è ancora il link pubblico e resta giocabile su `prova` accanto al gioco a stanze, finché la fetta verticale non viene approvata. Il progetto del gioco a stanze è in [docs/proposte/pivot-hades.md](docs/proposte/pivot-hades.md). I comandi qui sotto (in particolare `npm run sim` e il bot) oggi lavorano ancora sul survivor.

**Gioca (versione approvata):** https://edoardobucci002-sketch.github.io/Death-s-Lumen/
**Prova (modifiche nuove, con il Laboratorio «LAB»):** https://edoardobucci002-sketch.github.io/Death-s-Lumen/prova/

## Primi passi sul Mac

Serve Node.js 22 (da nodejs.org, versione LTS). Poi, nella cartella del progetto:

```bash
npm install        # una volta sola
npm run dev        # apre il gioco in locale
```

## Stack

| Parte | Scelta | Perché |
| --- | --- | --- |
| Linguaggio | TypeScript 5.9 | gli errori emergono prima di arrivare sul telefono |
| Motore | **Phaser 4.2** | legge direttamente gli export di Aseprite (sprite sheet + JSON con i tag), regge centinaia di nemici |
| Build | Vite 8 | avvio istantaneo, ricarica al salvataggio |
| App mobile | Capacitor 8 (iOS + Android) | già collaudato nella v0 |
| Distribuzione rapida | PWA su GitHub Pages | repository `edoardobucci002-sketch/Death-s-Lumen` |

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm install` | scarica le dipendenze (la prima volta e dopo ogni cambio di `package.json`) |
| `npm run dev` | avvia il gioco in locale; l'indirizzo «Network» si apre anche dal telefono sulla stessa Wi-Fi |
| `npm run anteprima` | serve la build già costruita (porta 4173): è il modo più veloce di provare sul telefono |
| `npm run asset` | esporta da Aseprite tutti gli sprite (vedi «Aggiungere i tuoi sprite») |
| `npm run icone` | rifà icone e schermate di avvio (web, Android, iOS) dallo sprite in gioco del Lampionaio |
| `npm run build` | controlla i tipi, crea la build in `dist/` e il service worker per l'offline |
| `npm run sim` | simulazione di bilanciamento: il bot gioca 3 notti per personaggio (`npm run sim -- 5 strega` per sceglierne numero e personaggi; `npm run sim -- 12 tutti meta=max` con la Cappella completa, `meta=meta` a metà, `meta=0` vuota; `esplora`: una notte su tre di ogni personaggio il bot sceglie le carte a caso; `stati=caso`: gli stati a caso di prima, per confrontare (la regola del gioco sono gli Stati certi); `mira=0`: Lanterna e Pala verso dove cammini, per confrontare; `senza=sampietrini`: un oggetto che non esce mai tra le carte; `amuleto=martire`: la notte parte con quell'amuleto acceso; `pochi=1` e `schermo=1`: la prova «pochi e forti»); riepilogo a schermo (con il «Confronto per il pivot»: nemici morti senza reazioni né stati e quanto vivono, per fase della notte), dettagli in `prove/sim.json`. Obiettivi in [docs/bilanciamento.md](docs/bilanciamento.md) Per contare le urne rotte: `DL_EXTRA='&rompibili&immortale' node tools/sim.mjs 12`, con `&cercaurne` il bot va apposta verso le urne. |
| `npm run controlla-gdd` | confronta le tabelle di `docs/GDD.md` con i numeri di `src/data/` e segnala ogni differenza (da lanciare a fine tappa; se segnala qualcosa, il GDD o i dati vanno aggiornati) |
| `npm run prova` | prova automatica su desktop, iPhone e Android emulati, su una porta libera; screenshot in `prove/` (la prima volta: `npx playwright install chromium`) |
| `npm run app` | build + copia nei progetti nativi (Capacitor) |
| `npm run ios` / `npm run android` | come `app`, poi apre Xcode o Android Studio |

## Cartelle

```
DEATH'S LUMEN/
  PERSONAGGI/<Nome personaggio>/   sorgenti Aseprite di Edoardo (ritratti e sprite in gioco)
  NEMICI/ EFFETTI/ OGGETTI/ ICONE/ stessa logica per gli altri asset (le icone si chiamano Icona_<Nome>)
  HUD/<Gruppo>/<Elemento>_V#.aseprite  interfaccia (Barre, Pulsanti, Cornici, Pannelli, Emblemi, Segnali);
                                   HUD/Tavole/ tiene le tavole originali (senza _V#, quindi non esportate)
  ANIMATION/  ARCHIVIO/            anteprime e archivio della v0
  gioco/                           questo repository (su GitHub: Death-s-Lumen)
    CLAUDE.md  LEGGIMI.md
    docs/                          GDD.md, lore.md, decisioni.md, bilanciamento.md, roadmap.md,
                                   asset_da_creare.md, proposte/ (archivio)
    src/
      main.ts                      avvio di Phaser in pixel perfect e collegamento al telefono
      scene/                       le scene di Phaser: Avvio, Menu (schede), Gioco (il survivor), Stanze (il gioco a stanze, solo sul link di prova)
      sistema/                     pixel perfect, mobile, HUD, scheda dei doni, Cappella, Laboratorio, bot…
      data/                        TUTTI i numeri di bilanciamento (personaggi, armi, nemici, meta…)
      caratteri/tiny5/             il carattere a pixel delle scritte
      stile.css                    interfaccia HTML sopra il gioco e caratteri inclusi
    public/                        manifest, icone
      assets/                      export di Aseprite + elenco.json, generati da `npm run asset`, mai a mano
    segnaposto/                    sprite provvisori della v0 (versione V0), finché Edoardo non esporta i suoi
    tools/                         export-asset, icone, dividi-v0, genera-sw, prova, sim, controlla-gdd; pixelfx/ (effetti da pixelfx, vedi il suo LEGGIMI)
    android/  ios/                 progetti nativi Capacitor
    .github/workflows/             pubblicazione su GitHub Pages e APK Android automatici
```

Il nome della cartella `DEATH'S LUMEN` contiene un apostrofo: nei comandi metti sempre i percorsi tra virgolette.

## Aggiungere i tuoi sprite

1. In Aseprite dai alle animazioni i tag `idle`, `walk`, `attack`, `special`, `hurt`, `death`.
2. Salva come `Nome_V#.aseprite` (ritratto) o `Nome_ingame_V#.aseprite` (sprite in gioco) in `DEATH'S LUMEN/PERSONAGGI/<Nome personaggio>/`.
3. Esegui `npm run asset`: esporta tutto e ti avvisa se manca qualcosa. Il gioco usa sempre la versione più alta presente.

La CLI di Aseprite su Mac è in `/Applications/Aseprite.app/Contents/MacOS/aseprite` (con Aseprite da Steam lo script la trova da solo). Se la struttura delle cartelle è diversa: `DL_ARTE="/percorso/DEATH'S LUMEN" npm run asset`.

## Telefono

- **Web:** ogni push su `main` o su `prova` ripubblica i due link (un paio di minuti); i push su `main` che toccano solo `docs/` non ripubblicano nulla e non ricompilano l'APK. Aprili in Safari o Chrome e aggiungili alla schermata Home.
- **APK Android:** GitHub → Actions → «APK Android» → scarica l'artefatto. L'APK di prova «DL prova» (con il Laboratorio, si installa accanto all'app normale) si compila a ogni push su `prova` e si scarica da https://github.com/edoardobucci002-sketch/Death-s-Lumen/releases/download/apk-prova/dl-prova.apk. Le versioni di prova mostrano la firma (commit e ora della build) nell'angolo del menu e in cima al LAB; il link `prova/` in Home si chiama «DL link» e si aggiorna da solo fuori dalla partita. Per misurare un telefono: LAB → Schermo → Prova prestazioni, un minuto senza toccare niente e un testo da copiare.
- **iPhone:** `npm run ios`, poi in Xcode scegli il tuo Team in *Signing & Capabilities* e premi ▶︎ con l'iPhone collegato (iOS per ora rimandato: manca Xcode sul Mac).
