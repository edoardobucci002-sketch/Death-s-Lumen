# Death's Lumen

Survivor-like in pixel art per iOS e Android. Regole del progetto in [CLAUDE.md](CLAUDE.md), contenuti e numeri in [docs/GDD_base.md](docs/GDD_base.md).

**Gioca:** https://edoardobucci002-sketch.github.io/Death-s-Lumen/

## Primi passi sul Mac

Serve Node.js 22 (da nodejs.org, versione LTS). Poi, nella cartella del progetto:

```bash
npm install        # una volta sola
npm run dev        # apre il gioco in locale
```

## Aggiungere i tuoi sprite

1. In Aseprite dai alle animazioni i tag `idle`, `walk`, `attack`, `special`, `hurt`, `death`.
2. Salva come `Nome_V#.aseprite` in `DEATH'S LUMEN/PERSONAGGI/<Nome personaggio>/`.
3. Esegui `npm run asset`: esporta tutto e ti avvisa se manca qualcosa.

## Telefono

- **Web:** ogni push su `main` pubblica il gioco su GitHub Pages. Aprilo in Safari o Chrome e aggiungilo alla schermata Home.
- **APK Android:** GitHub → Actions → «APK Android» → scarica l'artefatto.
- **iPhone:** `npm run ios`, poi in Xcode scegli il tuo Team in *Signing & Capabilities* e premi ▶︎ con l'iPhone collegato.
