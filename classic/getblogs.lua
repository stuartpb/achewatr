--encoding: utf-8
local http = require "socket.http"
local tonumber = tonumber

local blog_names = {
  {"Ray","raysmuckles"},
  {"Roast Beef", "rbeef"},
  {"Pat","journeyintoreason"},
  {"Téodor","orezscu"},
  {"Philippe","philippesblog"},
  {"Mr. Bear","corneliusbear"},
  {"Lyle","lyle151"},
  {"Molly","mollysanders"},
  {"Chris","chrisonstad"},
  {"Nice Pete","peterhcropes"},
  {"Little Nephew","charleysmuckles"},
  {"Emeril","emerillg"},
}

local function feed_url(blogname)
  return (string.gsub(
    --no blog has more than 2^16 entries
    "http://@.blogspot.com/atom.xml?max-results=65536",
    '@', blogname))
end

local function epoch_from_rfc3339(timestamp)
  local year, month, day, hour, minute, second,
    millis, offsets, offseth, offsetm =
    string.match(timestamp,
      "^(%d%d%d%d)-(%d%d)-(%d%d)T(%d%d):(%d%d):(%d%d).(%d%d%d)([%+%-])(%d%d):(%d%d)$")
  year = tonumber(year)
  month = tonumber(month)
  day = tonumber(day)
  hour = tonumber(hour)
  min = tonumber(minute)
  sec = tonumber(second)
  --who cares about millis
  offseth = tonumber(offseth) * 3600 -- hours in seconds
  offsetm = tonumber(offsetm) * 60 -- minutes in seconds
  local offset = offseth + offsetm
  if offsets == '-' then offset = -offset end

  return os.time{
    year = year,
    month = month,
    day = day,
    hour = hour,
    min = min,
    sec = sec
  } -- + offset -- we'll just go by the local time.
end

local stdout = io.stdout

io.output"blogs.lua"

local function printf(...)
  --cheaper than pipes! (not really)
  stdout:write(string.format(...))
  return io.write(string.format(...))
end

printf("--encoding: utf-8\nreturn {\n")

for i=1,#blog_names do
  local character = blog_names[i][1]
  local blogname = blog_names[i][2]
  local feedxml, err = assert(http.request(feed_url(blogname)))
  --print(feedxml)
  printf("  [%q] = {\n", character)
  for published, title, link in string.gmatch(
    feedxml,"<entry>.-<published>(.-)</published>.-<title.->(.-)</title>.-<link rel='alternate'.-href='(.-)'.-/>.-</entry>") do
    printf("    {url=%q, title=%q, epoch=%i},\n", link, title, epoch_from_rfc3339(published))
  end
  printf("  },\n", character)
end

printf("}\n")
