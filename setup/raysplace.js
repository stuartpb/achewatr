var mongodb = require("mongodb")
var env = require("jsdom").env

//Get www.achewood.com/raysplace.php?allnav=1
//For each <p> in the div with class="rayLeftNav":
  //Date = parsed (regex-replaced) textContent of the <b> element
  //Title = textContent of the <a> element
    //If no <a> element, content of last textNode, and use this DOM rather than requesting a new page
