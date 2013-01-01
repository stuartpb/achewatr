# Known Issues

- Dates are presented in UTC local time, not Achewood local time. I didn't save the timezone offsets with the dates (which Mongo only stores as an absolute UTC/GMT point), so on top of requiring a module dependency change, fixing this is also going to require a database rebuild.
- the Previous/Next logic is kind of messed up: see http://achewatr.jit.su/achewood/date/06152004
