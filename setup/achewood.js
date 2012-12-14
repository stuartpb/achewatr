var mongodb = require("mongodb")
var env = require("jsdom").env

//Get www.achewood.com/list.php
//For each page:
  //You have the title (the title of the link) and the date (07:00:00 GMT on the date listed)
  //Get the page to find any of:
    //comic_header content
    //comic_footer content (pretty sure this will always be empty as it serves as the container for the permalink attribute on the landing page)
    //image title attribute content
    //comic anchor wrapper href target
  //I would use the data from when I grabbed all this in Lua, but I didn't do the href check, and I don't feel comfortable just going back and manually doing it for the ones with "Click here" in the alt text
