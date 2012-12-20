var mongodb = require("mongodb")
var http = require("http")
var url = require("url")
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

 function itemDocumentFromEntry(entry) {
  //The document that will be added to the database.
  var item = {
    type: 'blog'}
  //title from the title element
  item.title = entry.title
  //date from the published element (not the updated tag)
  item.published = new Date(entry.published)
  //content from the content tag
  item.content = entry.content
    //with the <div class="blogger-post-footer"> content tracker removed
    .replace(/<div class="blogger-post-footer">.*?<\/div>/,'')

  //Grab the author name from the name tag of the author tag
  var arname = entry.author.name
  //if it's not "me", save the name
    //(a few Nice Pete posts used 'Peter H. Cropes')
  if(arname!='me'){
    item.author = arname
  }

  //Grab the path from the href of the link tag with rel="alternate"
  var location
  //Search backwards through the link elements: will probably be the last one,
  //but handle the case where it's not
  for(var i = entry.link.length-1; i >= 0 && !location; --i){
    var link = entry.link[i]
    if (link.$.rel == 'alternate') {
      location = link.$.href
    }
  }
  item._id = location
  var urlobj = url.parse(location)
  item.path = urlobj.path.replace(/.html$/,'')

  //This works.
  //Is it efficient, airtight, or otherwise clean as could be? No.
  //Does it use what I've written without requiring a major refactor?
  //Why yes, yes it does!
  item.blog = urlobj.hostname.split('.',1)[0]

  return item;
}

function addItemFromEntry(items){
  return function(entry) {
    items.insert(itemDocumentFromEntry(entry))
  }
}

function populateFromBlog(blogname,entryHandler,endcb) {
  // Request the RSS feed for the blog, containing every post ever made
  var request = http.get({
    host: blogname+'.blogspot.com',
    path: '/atom.xml?max-results=65536'
  }).on('response', function(response) {
    var xml = new XmlStream(response);

    //Expect multiple link tags
    xml.collect('entry link')
    //Get the data from each entry:
    xml.on('updateElement: entry',entryHandler);
    xml.on('end',endcb)
  });
}

function onSuccess(cb){
  return function(err) {
    if (err) {
      console.error(err)
    } else {
      cb.apply(this,arguments)
    }
  }
}


mongodb.MongoClient.connect(process.argv[2],
  onSuccess(function(db) {
    var items = db.collection('items')
    var entryHandler = addItemFromEntry(items)
    function populateNextBlog(index){
      if (index < blogs.length) {
        populateFromBlog(blogs[index],
          entryHandler,
          function(){populateNextBlog(index+1)}
      }
    }
    populateNextBlog(0)
  })
)
