--encoding: utf-8
local http = require "socket.http"
local tonumber = tonumber

local function epoch_from_mmddyyyy(timestamp)
  local month, day, year = string.match(timestamp,"^(%d%d)(%d%d)(%d%d%d%d)$")
  month = tonumber(month)
  day = tonumber(day)
  year = tonumber(year)

  return os.time{
    year = year,
    month = month,
    day = day,
    hour = 0,
    min = 0,
    sec = 0,
  }
end

local stdout = io.stdout

io.output"achewoods.lua"

local function printf(...)
  --cheaper than pipes! (not really)
  stdout:write(string.format(...))
  return io.write(string.format(...))
end

printf("--encoding: utf-8\nreturn {\n")
--get achewoods
local nextcomic="10012001"
while nextcomic ~= "01052011" do
  local date = nextcomic
  local url = "http://www.achewood.com/index.php?date="..date
  local c_src, err = http.request(url)
  if not c_src then error(err) end

   --yes, just the first thing with a title attribute. I don't care.
  local alt = string.match(c_src,'<p id="comic_body">.-title="(.-)".-</p>')

  local head = string.match(c_src,'<div id="comic_header">(.-)</div>')

  nextcomic = string.match(c_src,'<a href="index%.php%?date=(%d%d%d%d%d%d%d%d)" class="dateNav" title="Next comic">&raquo;</a>')

  if not nextcomic then error("FUCK IT'S BROKEN: \n"..c_src) end

  printf("  {url=%q,",url)
  if alt and alt ~= "" then printf(" alt=%q,",alt) end
  if head then printf(" head=%q,",head) end
  printf(" epoch=%i}\n",epoch_from_mmddyyyy(date))
end
--add last Achewood manually.
printf([[  {url="http://www.achewood.com/index.php?date=01052011", alt="I'm back. So what if I had a brain problem? QUIT STARING AT ME.", epoch=1294185600}]])
printf("\n}\n")
