local http = require "socket.http"
local src = http.request"http://achewood.com/raysplace.php?allnav=1"

local function epoch_from_mdy(m,d,y)
  return os.time{
    year = y,
    month = m,
    day = d,
    hour = 0,
    min = 0,
    sec = 0,
  }
end

local stdout = io.stdout

io.output"raysplaces.lua"

local function printf(...)
  --stdout:write(string.format(...))
  return io.write(string.format(...))
end

local function print_entry(m,d,y,title)
  printf(
    '  {url="http://achewood.com/raysplace.php?date=%02i%02i%i", title=%q, epoch=%i},\n',
    m,d,y,title,epoch_from_mdy(m,d,y))
end

printf("--encoding: utf-8\nreturn {\n")

--get the latest column, at the top of the list and not linked
print_entry(src:match('<div class="rayLeftNav">\n'..
'<p><b>(%d%d)%.(%d%d)%.(%d%d%d%d)</b><br/>\n(.-)</p>'))

--A couple times, the title had a trailing space, so we cull that
local later_entry_pattern = '<p><b>(%d%d)%.(%d%d)%.(%d%d%d%d)</b><br/>\n'..
'<a href="/raysplace%.php%?date=%d%d%d%d%d%d%d%d&amp;allnav=1">(.-) ?</a></p>'

for m,d,y,title in src:gmatch(later_entry_pattern) do
  print_entry(m,d,y,title)
end
printf("}\n")

