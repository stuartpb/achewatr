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
  --stdout:write(string.format(...))
  return io.write(string.format(...))
end

printf("--encoding: utf-8\nreturn {\n")

local c_src, err = http.request"http://achewood.com/list.php"
if not c_src then error(err) end

--get achewoods
for date, title in string.gmatch(c_src,'<dd.-><a href="index%.php%?date=(%d%d%d%d%d%d%d%d)">(.-)</a></dd>') do
  printf('  {url="http://achewood.com/index.php?date=%s", title=%q, epoch=%i},\n', date, title, epoch_from_mmddyyyy(date))
end
printf("}\n")
