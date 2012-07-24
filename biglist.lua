--encoding: utf-8
local achewoods = require "achewoods"
local blogs = require "blogs"
local raysplaces = require "raysplaces"

local list = {}

--ID names for character blogs.
--Used for banner image names.
local blogids = {
  --Achewood = achewood
  --Ray's Place = raysplace
  ["Ray"] = "ray",
  ["Roast Beef"] = "rbeef",
  ["Pat"] = "pat",
  ["Téodor"] = "teodor",
  ["Philippe"] = "philippe",
  ["Mr. Bear"] = "cornelius",
  ["Lyle"] = "lyle",
  ["Molly"] = "molly",
  ["Chris"] = "chris",
  ["Nice Pete"] = "nicepete",
  ["Little Nephew"] = "littlenephew",
  ["Emeril"] = "emeril"
}

for i=1, #achewoods do
  local aw = achewoods[i]
  aw.date = os.date("%m/%d.%Y",aw.epoch)
  aw.src = "Achewood"
  list[#list+1]=aw
end

for i=1, #raysplaces do
  local aw = raysplaces[i]
  aw.date = os.date("%m/%d.%Y",aw.epoch)
  aw.src = "Ray's Place"
  list[#list+1]=aw
end

for char, entries in pairs(blogs) do
  for i=1, #entries do
    local aw = entries[i]
    aw.date = os.date("%m/%d.%Y (%H:%M)",aw.epoch)
    aw.src = char
    list[#list+1]=aw
  end
end

table.sort(list,function(m,n)
  if m.epoch == n.epoch then
    --Do the May 11, 2004 Achewood second
    if m.epoch == 1084258800 then
      return n.src == "Achewood"
    else
      return m.src == "Achewood"
    end
  else
    return m.epoch < n.epoch
  end end)

io.output "biglist.html"

io.write[[
<!DOCTYPE html>
<html>
<head>
<title>ACHELIST</title>
<style type="text/css">
a {
  font-family: monospace;
  font-size: 10pt;
}
</style>
<meta charset="UTF-8">
</head>
<body>
]]
for i=1, #list do
  if list[i].title and list[i].title~="" then
    io.write((string.gsub('<a href=$url>$date :: $src - $title</a><br>\n',"%$(%a+)",list[i])))
  else
    io.write((string.gsub('<a href=$url>$date :: $src</a><br>\n',"%$(%a+)",list[i])))
  end
end
io.write[[
</body>
</html>
]]
