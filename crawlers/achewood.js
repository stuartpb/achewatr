var cheerequest = require('../lib/cheerequest.js');
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

module.exports = function(env, insert, finish) {
  function addComic(href, title, callback) {
    cheerequest(href).then(function parseComic($){
      var itemDoc = {
        _id: href,
        title: title,
        //All RSS items list a publication time of 7:00, so this is my guess
        published: new Date($(".date").text() + ' UTC-07:00'),
        type: 'achewood',
        mdydate: url.parse(href, true).query.date
      };

      var anchor = $("#comic_body a");
      var comic = $("img", anchor);
      if (comic.attr('title')) {
        itemDoc.alt = comic.attr('title');
      }
      if(anchor.attr('href')
        // I don't think any comics explicitly link to themselves,
        // but if they did, we'd want to count it as a null link
        && anchor.attr('href') != href) {
        itemDoc.href = url.resolve(href, anchor.attr('href'));
      }

      var cHeader = $("#comic_header");
      if (cHeader.length > 0) {
        // Adjust all links
        $('a', cHeader).each(function adjustLinks(i, a) {
          a = $(a);
          // Make URLs absolute
          a.attr('href',url.resolve(href, a.attr('href')));
          // Replace the dum-dum onclick-based new window opening with
          // the standard attribute for it
          a.removeAttr('onclick');
          a.attr('target', '_blank');
        });
        itemDoc.header = cHeader.html().trim();
      }

      insert(itemDoc,callback);
    });
  }

  var q = queue(env.concurrency);
  //Get www.achewood.com/list.php
  console.log("Connecting to list page...");
  var location = "http://www.achewood.com/list.php";
  cheerequest(location).then(function($){
    console.log("Connected to list page");

    $('dd a').each(function(i, anchor){
      anchor = $(anchor);
      q.defer(addComic,
        url.resolve(location,anchor.attr('href')), anchor.text());
    });
    q.awaitAll(onSuccess(finish));
  });
};
