var express = require('express');
var mongodb = require('mongodb');
var XDate = require('xdate');
var queue = require('queue-async');
var url = require('url');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/default';

var items;

function errHandlingCb(errCb){return function(successCb){
  return function(err) {
    if (err) {
      errCb(err);
    } else {
      successCb.apply(this,Array.prototype.slice.call(arguments,1));
    }
  };
}}

function respondNotFound(req,res){
  res.status(400);
  res.render('notfound');
}

//Instead of using this I'm just kicking off to Node's error handling
function errResponse(res){
  return function(err){
    res.send(500,err);
  };
}

mongodb.MongoClient.connect(mongoUri,function(err,db){
  items = db.collection('items');
});

var blogInfo = {
  raysmuckles: { title: 'Hey, Chochachos!',
    character: 'Ray', banner: 'ray' },
  rbeef: { title: 'grep',
    character: 'Roast Beef', banner: 'rbeef' },
  journeyintoreason: { title: 'A Journey Into Reason',
    character: 'Pat', banner: 'pat' },
  orezscu: { title: 'The Goldheart Mountaintop Queen Directory',
    character: 'Téodor', banner: 'teodor' },
  philippesblog: { title: 'Huuugs!',
    character: 'Philippe', banner: 'philippe' },
  corneliusbear: { title: 'Drones Club',
    character: 'Mr. Bear', banner: 'cornelius' },
  lyle151: { title: 'Ace of Spades',
    character: 'Lyle', banner: 'lyle' },
  mollysanders: { title: 'Molly Says',
    character: 'Molly', banner: 'molly' },
  chrisonstad: { title: '"Awesome!" A Blog.',
    character: 'Chris', banner: 'chris' },
  peterhcropes: { title: 'Peter H. Cropes',
    character: 'Nice Pete', banner: 'nicepete' },
  charleysmuckles: { title: 'Tha Billet!',
    character: 'Little Nephew', banner: 'littlenephew' },
  emerillg: { title: 'Emeril LeGoinegasque',
    character: 'Emeril', banner: 'emeril' }
};

function fortifyItem(doc){
  if(doc){
    doc.published = XDate(doc.published);
    if (doc.type=="achewood") {
      doc.source = "Achewood";
      doc.banner = 'achewood';
      doc.url = '/achewood/date/' + doc.mdydate;
      doc.date = doc.published.toString('ddd MM.dd.yyyy');
    } else if (doc.type == "raysplace") {
      doc.source = "Ray's Place";
      doc.banner = 'raysplace';
      doc.url = '/raysplace/date/' + doc.mdydate;
      doc.date = doc.published.toString('ddd MM.dd.yyyy');
    } else if (doc.type == "blog") {
      doc.source = blogInfo[doc.blog].character;
      doc.banner = blogInfo[doc.blog].banner;
      doc.url = '/blogs/' + doc.blog + doc.path;

      //Blogs use a different, local-time-offset version of the date
      //for local time printing - this isn't perfect (if you were to output
      //a date that includes the timezone offset it wouldn't be included),
      //but it's good enough (we never do that)

      //If you tried to just change the published date, that would interfere
      //with the previous and last posts in getTrio,
      //so we don't do that, OK?
      doc.blogDate = doc.published;//.clone().addMinutes(doc.offsetmins);

      doc.date = doc.blogDate.toString('ddd MM.dd.yyyy hh:mm TT');
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
};

function getPageTitle(doc) {
  if(doc.type == 'achewood')
    return 'Achewood § ' + doc.published.toString('MMM dd, yyyy');
  else if(doc.type == 'raysplace')
    return 'Achewood § Ray\'s Place - ' + doc.title;
  else if(doc.type == 'blog')
    return blogInfo[doc.blog].title + ': ' + doc.title;
  else return null;
}

function getTrio(activeQuery,onSuccess,cb){
  items.findOne(activeQuery,onSuccess(function(active){
    if(!active) cb(null);
    else {
      var q = queue();

      var deferredFindOne = function(query,options){
        q.defer(function(endCb){
          items.findOne(query,options,function(){endCb.apply(this,arguments)});
        });
      };

      //this is pretty bad
      var prevQuery = active.type == 'achewood'?
        { $or: [
            {published: {$lt: active.published}},
            {published: active.published, type: 'raysplace'}]} :
        {published: {$lt: active.published}};
      var nextQuery = active.type == 'raysplace'?
        { $or: [
            {published: {$gt: active.published}},
            {published: active.published, type: 'achewood'}]} :
        {published: {$gt: active.published}};

      deferredFindOne(
        prevQuery,
        { limit: 1,
          sort: {published: -1},
          fields: edgeFields });
      deferredFindOne(
        nextQuery,
        { limit: 1,
          sort: {published: 1},
          fields: edgeFields });

      q.await(onSuccess(function(prev,next){
        var trio = {
          active: fortifyItem(active),
          prev: fortifyItem(prev),
          next: fortifyItem(next)
        };
        cb(trio);
      }));
    }
  }));
}

function renderPage(reqCobbler) {
  return function(req,res,next) {
    var onSuccess = errHandlingCb(next);
    var cobbled = reqCobbler(req);
    getTrio(cobbled.query,onSuccess,function(trio){
      if(!trio){
        respondNotFound(req,res);
      } else {
        if (trio.active.type == 'blog') {
          trio.blogName = blogInfo[trio.active.blog].title;
        }
        trio.pageTitle = getPageTitle(trio.active);
        trio.originalUrl = req.originalUrl;
        res.render(cobbled.viewName,trio);
      }
    });
  };
}

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.compress());

app.get("/achewood/date/:date",renderPage(function(req){
  return { query: {type: 'achewood', mdydate: req.params.date},
    viewName: 'achewood' };
}));
app.get("/raysplace/date/:date",renderPage(function(req){
  return { query: {type: 'raysplace', mdydate: req.params.date},
    viewName: 'raysplace' };
}));
app.get("/blogs/:blog*",renderPage(function(req){
  return { query: {type: 'blog', blog: req.params.blog,
    path: req.params[0] },
  viewName: 'blogs/' + req.params.blog };
}));
app.get("/",function(req,res){
  res.render('index');
});
app.get("/list",function(req,res){
});

function getLocationForSource(name) {
  function achewoodSearchUrl(query){
    return url.format({
      protocol: 'http:',
      host: 'www.ohnorobot.com',
      pathname: '/index.pl',
      query: {
        comic: '636',
        s: query
      }
    });
  }

  var parsed = url.parse(name, true);

  if(parsed.hostname == 'achewood.com' ||
    parsed.hostname == 'www.achewood.com'){
    if (parsed.pathname == '/index.php') {
      if(parsed.query.date) {
        return '/achewood/date/' + parsed.query.date;
      } else {
        //note redirecting to a redirect page like this is a bad idea
        return '/latest?type=achewood';
      }
    } else if (parsed.pathname == '/raysplace.php') {
      if(parsed.query.date) {
        return '/raysplace/date/' + parsed.query.date;
      } else {
        //note redirecting to a redirect page like this is a bad idea
        return '/latest?type=raysplace';
      }
    } else if (parsed.pathname == '/list.php'){
      return '/list';
    } else {
      return achewoodSearchUrl(name);
    }
  } else if (/^[a-zA-Z0-9\-]+\.blogspot\.com$/.test(parsed.hostname)){
    var blog = parsed.hostname.slice(0,parsed.hostname.indexOf('.'));
    var path = parsed.path.replace(/\.html$/,'');
    return '/blogs/' + blog + path;
  } else {
    return achewoodSearchUrl(name);
  }
}

app.get("/go",function(req,res){
  res.set('Location',
      getLocationForSource(req.param('q')))
    .send(302);
});

app.use(express.static(__dirname+'/static'));

app.use(respondNotFound);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
