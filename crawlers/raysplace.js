"use strict";

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

function RaysPlaceCollector(insert){
  return function addRaysPlace(href,date,title,endCb) {
    return function($) {
      var rayContent = $('.ray').html()
        //Get rid of the header that we reproduce in the template
        .replace(/^[\s\S]*<span class="rayDate">[^<]*<\/span>\s*(?:<br ?\/?>)?\s*/,'')
        //Spacer paragraphs are bad enough as it is, but they're
        //even worse when they're put at the bottom of an article to
        //have the exact same effect as {margin-bottom:3em}. Nuke 'em.
        .replace(/(?:\s*<p>\s*(?:(?:<br\s*\/?>\s*)|(?:&nbsp;\s*))*(?:<\/p>)?\s*)*$/,'');
      href = href.replace('&allnav=1','');
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
    cheerequest(href).then(addRaysPlace(href, date, title, callback))
      .catch(callback);
  };

  var location = "http://www.achewood.com/raysplace.php?allnav=1";

  cheerequest(location)
    .then(function($){
      var nav = $(".rayLeftNav");
      $('p', nav).each(function(i, p) {
        p = $(p);
        // Date = parsed (regex-replaced) textContent of the <b> element
        var date = $('b', p).text();
        // Title = textContent of the <a> element
        var anchor = $('a', p);
        if (anchor.length > 0) {
          q.defer(getRaysPlace,
            url.resolve(location, anchor.attr('href')), date, anchor.text());
        } else {
          //If no <a> element, title is content of last childNode (a textNode)
          anchor = p.contents().last();

          //Change the location href to be the permalink to this page
          location =
            'http://achewood.com/raysplace.php?date='+date.replace(/\./g,'');

          //and use this DOM rather than requesting a new page
          q.defer(function(cb){
            addRaysPlace(location, date,anchor.text().trim(),cb)($);
          });
        }
      });

      q.awaitAll(onSuccess(finish));
    });
};
