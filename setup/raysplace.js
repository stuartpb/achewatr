var mongodb = require("mongodb")
var jsdom = require("jsdom")
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

function RaysPlaceCollector(items){
  return function addRaysPlace(date,title,endCb) {
    return function(dom) {
      var rayContent = dom.getElementsByClassName('ray')[0].innerHTML
        .replace(/^.*<span class="rayDate">[^<]*<\/span><br>\s*/,'')
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
        mdydate: date.replace('.','')
        content: rayContent
      })
      endCb();
    }
  }
}

mongodb.MongoClient.connect(process.argv[2],onSuccess(function(db){
  var addRaysPlace = RaysPlaceCollector(db.collection('items'));

  var q = async.queue(function(task, callback) {
    console.log('Fetching '+task.href+' ...')
    jsdom.env(task.href,addRaysPlace(task.date, task.title, callback))
  }, concurrency);

  jsdom.env("http://www.achewood.com/raysplace.php?allnav=1", onSuccess(function(dom){
    //For each <p> in the div with class="rayLeftNav":
    var nav = dom.getElementsByClassName("rayLeftNav")[0];
    var pElems = nav.getElementsByTagName('p');
    for (var i = 0; i < pElems.length; i++) {
      //Date = parsed (regex-replaced) textContent of the <b> element
      var date = pElems[i].getElementsByTagName('b').textContent
      //Title = textContent of the <a> element
      var anchors = pElems[i].getElementsByTagName('a')
      var anchor;
      if(anchors.length > 0) {
        anchor = anchors[0]
        q.push({href: anchor.href, date: date, title: anchor.textContent})
      } else {
        //If no <a> element, title is content of last childNode (a textNode)
        anchor = pElems[i].childNodes[pElems[i].childNodes.length-1]
        //and use this DOM rather than requesting a new page
        addRaysPlace(date,anchor.textContent.trim(),function(){})(dom)
      }
    }
  })
})
