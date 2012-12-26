var mongodb = require('mongodb')
var jsdom = require('jsdom')
//Ray's Place has some pretty bad HTML, jsdom's inbuilt parser
//can't really cut it
var html5 = require('html5')
var async = require('async')

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

function noop(){}

function RaysPlaceCollector(items){
  return function addRaysPlace(date,title,endCb) {
    return function(window) {
      var document = window.document
      var rayContent = document.getElementsByClassName('ray')[0].innerHTML
        .replace(/^[\s\S]*<span class="rayDate">[^<]*<\/span>\s*(?:<br ?\/?>)?\s*/,'')
        //Spacer paragraphs are bad enough as it is, but they're
        //even worse when they're put at the bottom of an article to
        //have the exact same effect as {margin-bottom:3em}. Nuke 'em.
        .replace(/(?:\s*<p>\s*<br>\s*(?:<\/p>)?\s*)*$/,'')
      var href = document.location.href.replace('&allnav=1','')
      items.insert({
        _id: href,
        title: title,
        published: new Date(date),
        type: 'raysplace',
        mdydate: date.replace(/\./g,''),
        content: rayContent
      },onSuccess(function(result){
        console.log(": "+result[0]._id)
      }
    ))
      endCb();
    }
  }
}

mongodb.MongoClient.connect(process.argv[2] || 'mongodb://localhost/default',onSuccess(function(db){
  var addRaysPlace = RaysPlaceCollector(db.collection('items'));

  var q = async.queue(function(task, callback) {
    console.log('Fetching '+task.href+' ...')
    jsdom.env(task.href,onSuccess(addRaysPlace(task.date, task.title, function(){
      if(task.remaining < 1) {
        console.log("Closing connection...")
        db.close()
      }
      callback()
    })),{parser:html5})
  }, concurrency);

  jsdom.env("http://www.achewood.com/raysplace.php?allnav=1",
    {parser: html5},
    onSuccess(function(window){
    var document = window.document
    var nav = document.getElementsByClassName("rayLeftNav")[0];
    var pElems = nav.getElementsByTagName('p');
    for (var i = 0; i < pElems.length; i++) {
      //Date = parsed (regex-replaced) textContent of the <b> element
      var date = pElems[i].getElementsByTagName('b')[0].textContent
      //Title = textContent of the <a> element
      var anchors = pElems[i].getElementsByTagName('a')
      var anchor;
      if(anchors.length > 0) {
        anchor = anchors[0]
        q.push({href: anchor.href, date: date, title: anchor.textContent, remaining: pElems.length-1-i})
      } else {
        //If no <a> element, title is content of last childNode (a textNode)
        anchor = pElems[i].childNodes[pElems[i].childNodes.length-1]

        //Change the location href to be the permalink to this page
        document.location.href = 'http://achewood.com/raysplace.php?date='+date.replace(/\./g,'')

        //and use this DOM rather than requesting a new page
        addRaysPlace(date,anchor.textContent.trim(),noop)(window)
      }
    }
  }))

  db.close()
}))
