-- Monta i fotogrammi f000.png… di una cartella in un file .aseprite, con le durate di info (passate come parametri).
local dir, out, n, w, h, ms = app.params.dir, app.params.out, tonumber(app.params.n), tonumber(app.params.w), tonumber(app.params.h), tonumber(app.params.ms)
local spr = Sprite(w, h, ColorMode.RGB)
for i = 0, n - 1 do
  local fr = (i == 0) and spr.frames[1] or spr:newEmptyFrame()
  fr.duration = ms / 1000
  local img = Image { fromFile = string.format("%s/f%03d.png", dir, i) }
  spr:newCel(spr.layers[1], fr, img, Point(0, 0))
end
spr:saveAs(out)
