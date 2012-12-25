var express = require('express')
var mongodb = require('mongodb')
var XDate = require('xdate')
var queue = require('queue-async')

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/default';

var items;

function errHandlingCb(errCb){return function(successCb){
  return function(err) {
    if (err) {
      errCb(err)
    } else {
      successCb.apply(this,Array.prototype.slice.call(arguments,1))
    }
  }
}}

function respondNotFound(req,res){
  res.status(400)
  res.render('notfound')
}

//Instead of using this I'm just kicking off to Node's error handling
function errResponse(res){
  return function(err){
    res.send(500,err)
  }
}

mongodb.MongoClient.connect(mongoUri,function(err,db){
  items = db.collection('items');
});

var blogNames = {
  raysmuckles: "Ray",
  rbeef: "Roast Beef",
  journeyintoreason: "Pat",
  orezscu: "Téodor",
  philippesblog: "Philippe",
  corneliusbear: "Mr. Bear",
  lyle151: "Lyle",
  mollysanders: "Molly",
  chrisonstad: "Chris",
  peterhcropes: "Nice Pete",
  charleysmuckles: "Little Nephew",
  emerillg: "Emeril"
}

function fortifyItem(doc){
  if(doc){
    doc.published = XDate(doc.published)
    if (doc.type=="achewood") {
      doc.source = "Achewood"
      doc.url = '/achewood/date/' + doc.mdydate
      doc.date = doc.published.toString('MM.dd.yyyy')
    } else if (doc.type == "raysplace") {
      doc.source = "Ray's Place"
      doc.url = '/raysplace/date/' + doc.mdydate
      doc.date = doc.published.toString('MM.dd.yyyy')
    } else if (doc.type == "blog") {
      doc.source = blogNames[doc.blog]
      doc.url = '/blogs/' + doc.blog + doc.path
      doc.date = doc.published.toString('MM.dd.yyyy hh:mm tt')
    }
  }
  return doc;
}

var edgeFields = {
  title: 1,
  published: 1,
  type: 1,
  blog: 1,
  path: 1,
  mdydate: 1
}

function getTrio(activeQuery,onSuccess,cb){
  items.findOne(activeQuery,onSuccess(function(active){
    if(!active) cb(null);
    else {
      var q = queue();

      var deferredFindOne = function(query,options){
        q.defer(function(endCb){
          items.findOne(query,options,function(){endCb.apply(this,arguments)})
        })
      }

      //this is pretty bad
      var prevQuery = active.type == 'achewood'?
        { $or: [
            {published: {$lt: active.published}},
            {published: active.published, type: 'raysplace'}]} :
        {published: {$lt: active.published}}
      var nextQuery = active.type == 'raysplace'?
        { $or: [
            {published: {$gt: active.published}},
            {published: active.published, type: 'achewood'}]} :
        {published: {$gt: active.published}}

      deferredFindOne(
        prevQuery,
        { limit: 1,
          sort: {published: -1},
          fields: edgeFields })
      deferredFindOne(
        nextQuery,
        { limit: 1,
          sort: {published: 1},
          fields: edgeFields })

      q.await(onSuccess(function(prev,next){
        var trio = {
          active: fortifyItem(active),
          prev: fortifyItem(prev),
          next: fortifyItem(next)
        }
        cb(trio);
      }))
    }
  }))
}

function renderPage(reqCobbler) {
  return function(req,res,next) {
    var onSuccess = errHandlingCb(next)
    var cobbled = reqCobbler(req)
    getTrio(cobbled.query,onSuccess,function(trio){
      if(!trio){
        respondNotFound(req,res)
      } else {
        trio.originalUrl = req.originalUrl
        res.render(cobbled.viewName,trio)
      }
    })
  }
}

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.compress());

app.get("/achewood/date/:date",renderPage(function(req){
  return { query: {type: 'achewood', mdydate: req.params.date},
    viewName: 'achewood' };
}))
app.get("/raysplace/date/:date",renderPage(function(req){
  return { query: {type: 'raysplace', mdydate: req.params.date},
    viewName: 'raysplace' };
}))
app.get("/blogs/:blog*",renderPage(function(req){
  return { query: {type: 'blog', blog: req.params.blog,
    path: req.params[0] },
  //viewName: 'blogs/' + req.params.blog };
  viewName: 'blogs/rbeef' };
}))
app.get("/",function(req,res){
  res.render('index')
})
app.get("/list",function(req,res){
})

function getLocationForSource(name) {
  function achewoodSearchUrl(query){
    return url.format({
      protocol: 'http',
      host: 'www.ohnorobot.com',
      pathname: '/index.pl',
      search: {
        comic: 636,
        search: 'Find',
        s: query
      }
    })
  }

  var parsed = url.parse(name, true)

  if(parsed.hostname == 'achewood.com' ||
    parsed.hostname == 'www.achewood.com'){
    if (parsed.pathname == 'index.php') {
      if(parsed.path.query.date) {
        return '/achewood/date/' + parsed.path.query.date
      } else {
        //note redirecting to a redirect page like this is a bad idea
        return '/latest?type=achewood'
      }
    } else if (parsed.pathname == 'raysplace.php') {
      if(parsed.path.query.date) {
        return '/raysplace/date/' + parsed.path.query.date
      } else {
        //note redirecting to a redirect page like this is a bad idea
        return '/latest?type=raysplace'
      }
    } else if (parse){
    }
  } else if (/^[^\.]\.blogspot\.com$/.test(parsed.hostname)){
    var blog = parsed.hostname.split(0,parsed.hostname.indexOf('.'));
    var path = parsed.hostname.path.replace(/\.html$/,'');
    return '/blogs/' + blog + '/' + path;
  } else {
    return achewoodSearchUrl(query);
  }
}

app.get("/go",function(req,res){
  res.setHeader('Location',
      getLocationForSource(req.param('q')))
    .send(302)
})

app.use(express.static(__dirname+'/static'))

app.use(respondNotFound)

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
