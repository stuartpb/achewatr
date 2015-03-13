var jsdom = require('jsdom');
var url = require('url');
var queue = require('queue-async');

function onSuccess(cb){
  return function(err) {
    if (err) {
      throw err;
    } else {
      cb.apply(this,Array.prototype.slice.call(arguments,1));
    }
  };
}

module.exports = function(env,insert,finish){
  function addComic(title,callback){
    return onSuccess(function(window){
    var document = window.document;
    var itemDoc = {
      _id: document.location.href,
      title: title,
      published: new Date(
        document.getElementsByClassName("date")[0].textContent
        //All RSS items list a publication time of 7:00, so this is my guess
        + ' UTC-07:00'),
      type: 'achewood',
      mdydate: url.parse(document.location.href,true).query.date
    };

    var anchor = document.getElementById("comic_body")
      .getElementsByTagName("a")[0];
    var comic = anchor.getElementsByTagName("img")[0];
    if(comic.title) {itemDoc.alt = comic.title}
    if(anchor.href
      //Apparently empty hrefs get as the document's location
      && anchor.href != document.location.href) {
      itemDoc.href = anchor.href;
    }

    var cHeader = document.getElementById("comic_header");
    if(cHeader){
      //Adjust all links
      var anchors = cHeader.getElementsByTagName('a');
      for (var i = 0; i < anchors.length; ++i) {
        var a = anchors[i];
        //Make URLs absolute
        a.href = url.resolve(document.location.href,a.href);
        //Replace the dum-dum onclick-based new window opening with
        //the standard attribute for it
        a.removeAttribute('onclick');
        a.target='_blank';
      }
      itemDoc.header = cHeader.innerHTML.trim();
    }

    insert(itemDoc,callback);
  })}

  function spawnEnv(href,title){
    return function(cb){jsdom.env(href,
      addComic(title,cb))};
  }

  var q = queue(env.concurrency);
  //Get www.achewood.com/list.php
  console.log("Connecting to list page...");
  jsdom.env("http://www.achewood.com/list.php", onSuccess(function(window){
    console.log("Connected to list page");
    var document = window.document;

    var dds = document.getElementsByTagName('dd');
    //For each page:
    for (var i = 0; i < dds.length; ++i) {
      var anchor = dds[i].getElementsByTagName('a')[0];
      q.defer(spawnEnv(anchor.href,anchor.textContent));
      q.awaitAll(onSuccess(finish));
    }
  }));
};
