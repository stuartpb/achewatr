var mongodb = require("mongodb")
var env = require("jsdom").env
var url = require('url')
var async = require("async")

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

function makeQueue(db) {
  var items = db.collection('items')
  function addComic(title,remaining){ return onSuccess(function(window){
    var document = window.document
    var itemDoc = {
      _id: document.location.href,
      title: title,
      published: new Date(document.getElementsByClassName("date")[0].textContent),
      type: 'achewood',
      mdydate: url.parse(document.location.href,true).query.date
    }

    var anchor = document.getElementById("comic_body")
      .getElementsByTagName("a")[0]
    var comic = anchor.getElementsByTagName("img")[0]
    if(comic.title) {itemDoc.alt = comic.title}
    if(anchor.href) {itemDoc.href = comic.href}

    var cHeader = document.getElementById("comic_header")
    if(cHeader){
      //Adjust all links
      var anchors = cHeader.getElementsByTagName('a')
      for (var i = 0; i < anchors.length; ++i) {
        var a = anchors[i]
        //Make URLs absolute
        a.href = url.resolve(document.location.href,a.href)
        //Replace the dum-dum onclick-based new window opening with
        //the standard attribute for it
        a.removeAttribute('onclick')
        a.target='_blank'
      }
      itemDoc.header = cHeader.innerHTML.trim()
    }
    //If this is ever full, I've never noticed, and I have no idea
    //what it'd even do
    if(document.getElementById("comic_footer").innerHTML.trim()){
      console.log('!! FOOTER: '+document.location.href, document.getElementById("comic_header").textContent.trim())
    }

    function postUpdateCallback(href){
      return onSuccess(function(result){
        console.log(": "+href)
        if(remaining < 1) {
          console.log("Closing connection...")
          db.close()
        }
      })
    }

    items.update(itemDoc,{upsert: true},postUpdateCallback(document.location.href))
    callback();
  })}
  return async.queue(
    function(task,callback){
      console.log('Fetching '+task.href+' ...')
      env(task.href,addComic(task.title,task.remaining))
    }, concurrency)
}


mongodb.MongoClient.connect(process.argv[2],onSuccess(function(db){
  var q = makeQueue(db)

  //Get www.achewood.com/list.php
  console.log("Connecting to list page...")
  env("http://www.achewood.com/list.php", onSuccess(function(window){
    console.log("Connected to list page")
    var document = window.document

    var dds = document.getElementsByTagName('dd')
    //For each page:
    for (var i = 0; i < dds.length; ++i) {
      var anchor = dds[i].getElementsByTagName('a')[0];
      q.push({title: anchor.title, href: anchor.href, remaining: dds.length-1-i})
    }
  }))
}));
