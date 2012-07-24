local src = [[
07.07.2010
Advice for July 7, 2010

01.18.2007
Advice for January 19th, 2007

01.10.2007
January 10, 2007

04.10.2006
Advice for April 10, 2006

04.04.2006
Back in the Game! (again)

11.13.2005
Advice: November 13, 2005

07.18.2005
Advice: July 18th.

06.24.2005
Advice for June 24th!

06.08.2005
June Eighth's Advice, man!

05.31.2005
May 31st's advice (2005)

05.30.2005
Advice for May 31!

05.17.2005
Doggs here is my advice for the week.

05.04.2005
Some Advice for May 4, 2005.

04.22.2005
April 22, 2005!

09.02.2004
Advice for September 2, 2004

08.23.2004
Advice - August 23 2004

08.02.2004
Back and FIT!

06.15.2004
Dang has it been nearly a month?

05.18.2004
Advice for May 18th

05.11.2004
Advice for May 11!

04.30.2004
One Year Anniversary!

04.26.2004
April 26 - Advice!

03.15.2004
March 15 - Advice! Triple-Nut Beat Down.

02.16.2004
Advice: Feb. 16, 2004 (Double Nut Beat Down)

01.26.2004
Blog for January 25, 2004

01.23.2004
Advice for January 23, 2004

01.06.2004
Advice for January 6, 2004

12.22.2003
Advice for December 22

09.09.2003
Advice for Sept. 9, 2003

09.02.2003
Advice for September 2, 2003

08.26.2003
August 26, 2003 - Advice.

08.19.2003
August 19, 2003 - Advice.

08.12.2003
Advice - August 12, 2003

08.05.2003
Advice Aug. 5, 2003

07.29.2003
Advice Column July 29, 2003

07.23.2003
Advice - 7.23.03

07.16.2003
Advice Column, July 16

07.09.2003
Ray's Advice Column for July 9

07.02.2003
Ray's Advice Column Jul 2, 2003

06.25.2003
Ray's Advice Column June 25 2003

06.18.2003
Ray's Advice Column #2

06.11.2003
Ray's Advice Column #1

06.04.2003
My Date With Crystal

05.27.2003
Man, I Had the Greatest Day!

05.21.2003
I Have Just Had Italian Food

05.14.2003
What is with Tequila Shooters?!

04.30.2003
My First Column!
]]

for m,d,y,title in src:gmatch("(%d%d).(%d%d).(%d%d%d%d)\n(.-)\n") do

print(string.format(
  '{url="http://www.achewood.com/raysplace.php?date=%02i%02i%i", title=%q, epoch=%i},',
  m,d,y,title,os.time{
    year = y,
    month = m,
    day = d,
    hour = 0,
    min = 0,
    sec = 0,
  }
))

end
