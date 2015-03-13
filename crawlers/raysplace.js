"use strict";

var jsdom = require('jsdom');
//Ray's Place has some pretty bad HTML, jsdom's inbuilt parser
//can't really cut it
var browser = require('jsdom/lib/jsdom/browser/index');
browser.setDefaultParser(require('html5'));

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

function RaysPlaceCollector(insert){
  return function addRaysPlace(date,title,endCb) {
    return function(window) {
      var document = window.document;
      var rayContent = document.getElementsByClassName('ray')[0].innerHTML
        //Get rid of the header that we reproduce in the template
        .replace(/^[\s\S]*<span class="rayDate">[^<]*<\/span>\s*(?:<br ?\/?>)?\s*/,'')
        //Spacer paragraphs are bad enough as it is, but they're
        //even worse when they're put at the bottom of an article to
        //have the exact same effect as {margin-bottom:3em}. Nuke 'em.
        .replace(/(?:\s*<p>\s*(?:(?:<br\s*\/?>\s*)|(?:&nbsp;\s*))*(?:<\/p>)?\s*)*$/,'');
      var href = document.location.href.replace('&allnav=1','');
      insert({
        _id: href,
        title: title,
        published: new Date(date),
        type: 'raysplace',
        mdydate: date.replace(/\./g,''),
        content: rayContent
      },endCb);
    };
  };
}

module.exports = function(env,insert,finish){
  var addRaysPlace = RaysPlaceCollector(insert);

  var q = queue(env.concurrency);

  var getRaysPlace= function(href, date, title, callback) {
    console.log('Fetching '+href+' ...');
    jsdom.env({
      html: href,
      done: onSuccess(addRaysPlace(date, title, callback))
    });
  };

  jsdom.env({
    html: "http://www.achewood.com/raysplace.php?allnav=1",
    done: onSuccess(function(window){
      var document = window.document;
      var nav = document.getElementsByClassName("rayLeftNav")[0];
      var pElems = nav.getElementsByTagName('p');

      for (var i = 0; i < pElems.length; i++) {
        //Date = parsed (regex-replaced) textContent of the <b> element
        var date = pElems[i].getElementsByTagName('b')[0].textContent;
        //Title = textContent of the <a> element
        var anchors = pElems[i].getElementsByTagName('a');
        var anchor;
        if(anchors.length > 0) {
          anchor = anchors[0];
          q.defer(getRaysPlace, anchor.href, date, anchor.textContent);
        } else {
          //If no <a> element, title is content of last childNode (a textNode)
          anchor = pElems[i].childNodes[pElems[i].childNodes.length-1];

          //Change the location href to be the permalink to this page
          document.location.href = 'http://achewood.com/raysplace.php?date='+date.replace(/\./g,'');

          //and use this DOM rather than requesting a new page
          q.defer(function(cb){
            addRaysPlace(date,anchor.textContent.trim(),cb)(window);
          });
        }
      }

      q.awaitAll(onSuccess(finish));
    })
  });
};
