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
      cb.apply(this,arguments)
    }
  }
}

function makeQueue(items) {
  function addComic(title){ return function(dom){

    var itemDoc = {
      _id: dom.location.href,
      title: title,
      published: new Date(dom.getElementsByClassName("date")[0].textContent),
      type: 'achewood',
      mdydate: url.parse(dom.location.href,true).query.date
    }

    var comic = dom.getElementsByClassName("comic")[0]
    var anchor = comic.parentElement
    if(comic.title) {itemDoc.alt = comic.title}
    if(anchor.href) {itemDoc.href = comic.href}

    var cHeader = dom.getElementById("comic_header")
    if(cHeader){
      //Adjust all links
      var anchors = cHeader.getElementsByTagName('a')
      for (var i = 0; i < anchors.length; ++i) {
        var a = anchors[i]
        //Make URLs absolute
        a.href = url.resolve(dom.location.href,a.href)
        //Replace the dum-dum onclick-based new window opening with
        //the standard attribute for it
        a.removeAttribute('onclick')
        a.target='_blank'
      }
      itemDoc.header = cHeader.innerHTML.trim()
    }
    //If this is ever full, I've never noticed, and I have no idea
    //what it'd even do
    if(dom.getElementById("comic_footer").innerHTML.trim()){
      console.log(dom.location.href, dom.getElementById("comic_header").textContent.trim())
    }
    items.insert(itemDoc)
  }}
  return async.queue(
    function(task,callback){
      env(task.href,addComic(task.title))
    }, concurrency)
}


mongodb.MongoClient.connect(process.argv[2],onSuccess(function(db){
  var q = makeQueue(db.collection('items'))

  //Get www.achewood.com/list.php
  env("http://www.achewood.com", onSuccess(function(dom){

    var dds = dom.getElementsByTagName('dd')
    //For each page:
    for (var i = 0; i < dds.length; ++i) {
      var anchor = dds[i].getElementsByTagName('a')[0];
      q.push({title: anchor.title, href: anchor.href})
    }
  }))
}));
