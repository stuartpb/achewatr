var mongodb = require("mongodb")
var env = require("jsdom").env
var url = require('url')
var async = require("async")

var concurrency = 5;
var upsert = false;

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
  function addComic(title,remaining,callback){ return onSuccess(function(window){
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
    if(anchor.href
      //Apparently empty hrefs get as the document's location
      && anchor.href != document.location.href) {
      itemDoc.href = anchor.href
    }

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

    var postInsertionCb = onSuccess(function(result){
        console.log(": "+document.location.href)
        callback();
      });

    if(upsert) {
      items.update({_id: document.location.href},
        itemDoc,{upsert:true},postInsertionCb)
    } else {
      items.insert(itemDoc,postInsertionCb)
    }
  })}
  return async.queue(
    function(task,callback){
      console.log('Fetching '+task.href+' ...')
      env(task.href,addComic(task.title,task.remaining,callback))
    }, concurrency)
}


mongodb.MongoClient.connect(process.argv[2],
  { native_parser:true,auto_reconnect: true },
  onSuccess(function(db){
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
      q.push({title: anchor.textContent, href: anchor.href, remaining: dds.length-1-i})
      q.drain= function() {
        console.log("Closing connection...")
        db.close()
      }
    }
  }))
}));
