var mongodb = require("mongodb")
var http = require("http")
var XmlStream = require("xml-stream")

var blogs = [
  "raysmuckles", //Ray
  "rbeef", //Roast Beef
  "journeyintoreason", //Pat
  "orezscu", //Téodor
  "philippesblog", //Philippe
  "corneliusbear", //Mr. Bear
  "lyle151", //Lyle
  "mollysanders", //Molly
  "chrisonstad", //Chris
  "peterhcropes", //Nice Pete
  "charleysmuckles", //Little Nephew
  "emerillg" //Emeril
]

function parse_blog(blogname) {
//Get each blog's /atom.xml?max-results=65536
//Get the data from each entry:
  //title from the title element
  //date from the published element (not the updated tag)
  //content from the content tag
    //Remove the <div class="blogger-post-footer"> content tracker
    content = content.replace(/<div class="blogger-post-footer">.*?<\/div>/,"")
  //Grab the author name from the name tag of the author tag
    //if it's not "me", save the name
    //(a few Nice Pete posts used 'Peter H. Cropes')
  //Grab the path from the href of the link tag with rel="alternate"
}
