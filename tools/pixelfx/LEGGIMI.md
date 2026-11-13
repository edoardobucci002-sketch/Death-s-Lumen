# Effetti da pixelfx (prova pilota del 10/11)

Gli effetti Sepoltura (mani), Pozza dell'Acqua santa (5 misure), Eclissi, Comparsa delle carte (gioco a stanze, 13/11) e grumo e pozza di cera del Cantore (13/11, disegnati per il gioco in `fx/cera`) vengono dalla libreria
[pixelfx](https://github.com/patch-gg/pixelfx) (licenza MIT), clonata in `DEATH'S LUMEN/pixelfx`, accanto a `gioco`.

1. `node tools/pixelfx/costruisci.mjs`: rende i fotogrammi già a retino Bayer 4×4 (niente trasparenze) in
   `DEATH'S LUMEN/prova-pixelfx/fogli/`, con le anteprime in `prova-pixelfx/anteprime/`.
2. Per ogni cartella di `fogli/`, `in-aseprite.lua` (Aseprite da riga di comando, parametri `dir out n w h ms`)
   monta i fotogrammi in `segnaposto/EFFETTI/Pixelfx <Nome>/Pixelfx_<Nome>_V0.aseprite`.
3. `npm run asset` li esporta come tutti gli altri sprite. Un file V1 disegnato da Edoardo li sostituisce.

Nel gioco si accendono da LAB → Eventi → «Effetti pixelfx». Misure e perni sono in `PIXELFX`, `src/data/effetti.ts`.
