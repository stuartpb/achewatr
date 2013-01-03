/*
Little Nephew's blog setup script.

For some reason, the feed for Little Nephew's blog- and ONLY
Little Nephew's blog- has "summary" elements instead of content,
so I can't just pull the blog entries straight from the feed -
I have to follow the links and fetch each post.

Pain in the *ass*.
*/

var http = require("http");
var url = require("url");
var XmlStream = require("xml-stream");
var jsdom = require("jsdom");
var queue = require("queue-async");

function onSuccess(cb){
  return function(err) {
    if (err) {
      console.error(err);
    } else {
      cb.apply(this,Array.prototype.slice.call(arguments,1));
    }
  };
}

module.exports = function(env,insert,finish) {
  var q = queue(env.concurrency);
  function entryHandler(entry){
    //The document that will be added to the database.
    var item = {
      type: 'blog',
      blog: 'charleysmuckles'};
    //title from the title element
    item.title = entry.title.$text;
    //date from the published element (not the updated tag)
    item.published = new Date(entry.published);
    //time offset
    var offset = entry.published.match(/([\+\-])(\d\d)\:?(\d\d)?$/);
    item.offsetmins = (offset[1] == '-' ? -1 : 1) *
      (60 * offset[2] + parseInt(offset[3],10));

    //Grab the path from the href of the link tag with rel="alternate"
    var location;
    //Search backwards through the link elements: will probably be the last one,
    //but handle the case where it's not
    for(var i = entry.link.length-1; i >= 0 && !location; --i){
      var link = entry.link[i];
      if (link.$.rel == 'alternate') {
        location = link.$.href;
      }
    }
    item._id = location;
    var urlobj = url.parse(location);
    item.path = urlobj.path.replace(/.html$/,'');

    q.defer(function(finishCb){
      jsdom.env(location,onSuccess(function(window){
        var document = window.document;
        var content = document.getElementsByClassName('post-body')[0];

        //remove the clearfix div at the end of the content
        var divs = content.getElementsByTagName('div');
        content.removeChild(divs[divs.length-1]);
        item.content = content.innerHTML.trim();

        insert(item);
        finishCb();
      }));
    });
  }

  http.get({
    host: 'charleysmuckles.blogspot.com',
    path: '/atom.xml?max-results=65536'
  }, function(response) {
    var xml = new XmlStream(response);

    //Expect multiple link tags
    xml.collect('entry link');
    //Get the data from each entry:
    xml.on('updateElement: entry',entryHandler);
    xml.on('end',function(){
      q.awaitAll(onSuccess(finish));
    });
  });
};
