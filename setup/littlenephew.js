/*
Little Nephew's blog setup script.

For some reason, the feed for Little Nephew's blog- and ONLY
Little Nephew's blog- has "summary" elements instead of content,
so I can't just pull the blog entries straight from the feed -
I have to follow the links and fetch each post.

Pain in the *ass*.
*/

var mongodb = require("mongodb");
var http = require("http")
var url = require("url")
var XmlStream = require("xml-stream")
var env = require("jsdom").env
var queue = require("queue-async")

var concurrency = 5;

function onSuccess(cb){
  return function(err) {
    if (err) {
      console.error(err)
    } else {
      cb.apply(this,Array.prototype.slice.call(arguments,1))
    }
  }
}

console.log("Connecting to "+process.argv[2]+' ...');
mongodb.MongoClient.connect(process.argv[2],onSuccess(function(db){
  console.log("Connected.");

  var items = db.collection('items')
  var q = queue(concurrency);

  function entryHandler(entry){
    //The document that will be added to the database.
    var item = {
      type: 'blog',
      blog: 'charleysmuckles'}
    //title from the title element
    item.title = entry.title.$text
    //date from the published element (not the updated tag)
    item.published = new Date(entry.published)

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

    q.defer(function(finishCb){
      env(location,onSuccess(function(window){
        var document = window.document
        var content = document.getElementsByClassName('post-body')[0]
        //remove the clearfix div at the end of the content
        var divs = content.getElementsByTagName('div')
        content.removeChild(divs[divs.length-1])
        item.content = content.innerHTML.trim()
        items.insert(item,function(result){
          console.log(': ' + location)
          finishCb()
        })
      }))
    })
  }

  var request = http.get({
    host: 'charleysmuckles.blogspot.com',
    path: '/atom.xml?max-results=65536'
  }, function(response) {
    var xml = new XmlStream(response);

    //Expect multiple link tags
    xml.collect('entry link')
    //Get the data from each entry:
    xml.on('updateElement: entry',entryHandler);
    xml.on('end',function(){
      q.awaitAll(function(){
        console.log('Disconnecting from database...');
        db.close()
      })
    })
  });


}));
