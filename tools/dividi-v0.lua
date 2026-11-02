-- Divide i file unici della v0 in un file per effetto e un file per icona (versione V0, segnaposto).
-- Uso: aseprite -b --script-param effetti=... --script-param icone=... --script-param uscita=... --script tools/dividi-v0.lua
local effetti = app.params["effetti"]
local icone = app.params["icone"]
local uscita = app.params["uscita"]
local CELLA = 24

local function nomeFile(testo)
  return (testo:gsub(" · ", "_"):gsub(" ", "_"))
end
local function salva(s, categoria, nome)
  local cartella = uscita .. "/" .. categoria .. "/" .. nome:gsub("^Icona_", ""):gsub("_", " ")
  os.execute('mkdir -p "' .. cartella .. '"')
  s:saveAs(cartella .. "/" .. nome .. "_V0.aseprite")
  s:close()
end

-- Effetti: un file per tag, con i soli fotogrammi di quel tag, livelli uniti, senza tag
local fonte = app.open(effetti)
for _, tag in ipairs(fonte.tags) do
  local s = Sprite(fonte)
  for i = #s.frames, 1, -1 do
    if i < tag.fromFrame.frameNumber or i > tag.toFrame.frameNumber then s:deleteFrame(i) end
  end
  for i = #s.tags, 1, -1 do s:deleteTag(s.tags[i]) end
  for _, l in ipairs(s.layers) do l.isVisible = true end
  s:flatten()
  salva(s, "EFFETTI", nomeFile(tag.name))
end
fonte:close()

-- Icone: un file per livello, ritagliato sulla sua cella di 24×24; i drop tengono i 4 fotogrammi del bagliore
local fonte2 = app.open(icone)
local function giro(livelli, gruppo)
  for _, l in ipairs(livelli) do
    if l.isGroup then
      giro(l.layers, l.name)
    else
      local primo = l:cel(1)
      if primo then
        local b = primo.bounds
        local cx = math.floor((b.x + b.width / 2) / CELLA) * CELLA
        local cy = math.floor((b.y + b.height / 2) / CELLA) * CELLA
        local fotogrammi = (gruppo == "Drop") and #fonte2.frames or 1
        local s = Sprite(CELLA, CELLA, ColorMode.RGB)
        for f = 2, fotogrammi do s:newEmptyFrame() end
        for f = 1, fotogrammi do
          s.frames[f].duration = fonte2.frames[f].duration
          local c = l:cel(f)
          if c then s:newCel(s.layers[1], f, c.image, Point(c.position.x - cx, c.position.y - cy)) end
        end
        -- i nomi devono essere unici in tutto il gioco: le icone hanno il prefisso Icona_
        local nome = nomeFile(l.name)
        if gruppo == "Drop" then salva(s, "OGGETTI", nome) else salva(s, "ICONE", "Icona_" .. nome) end
      end
    end
  end
end
giro(fonte2.layers, nil)
fonte2:close()
