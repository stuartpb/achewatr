--encoding: utf-8
local achewoods = require "achewoods"
local blogs = require "blogs"

local list = {}

for i=1, #achewoods do
  local aw = achewoods[i]
  aw.title = os.date("Achewood | %m/%d.%Y",aw.epoch)
  list[#list+1]=aw
end

for char, entries in pairs(blogs) do
  for i=1, #entries do
    local aw = entries[i]
    aw.title = char .. os.date(" | %m/%d.%Y (%H:%M) | ",aw.epoch) .. aw.title
    list[#list+1]=aw
  end
end

table.sort(list,function(m,n) return m.epoch < n.epoch end)

io.output "biglist.html"

io.write[[
<!DOCTYPE html>
<html>
<head>
<title>All the Achewood. All the time.</title>
<meta charset="UTF-8">
</head>
<body>
]]
for i=1, #list do
io.write((string.gsub('<a href=$url>$title</a><br>\n',"%$(%a+)",list[i])))
end
io.write[[
</body>
</html>
]]
