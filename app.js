var express = require('express');
var queue = require('queue-async');
var mongo = require('mongoskin');

var fortifyItem = require('./lib/rendering/fortifyItem.js');
var getLocationForSource = require('./lib/rendering/getLocationForSource.js');

var blogInfo = require("./data/bloginfo.json");

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
  res.status(404).render('notfound');
}

function respondError(err,req,res,next){
  console.error(err);
  res.status(500).render('error',{error:err});
}

function getPageTitle(doc) {
  if(doc.type == 'achewood')
    return 'Achewood § ' + doc.published.toString('MMMM d, yyyy');
  else if(doc.type == 'raysplace')
    return 'Achewood § Ray\'s Place - ' + doc.title;
  else if(doc.type == 'blog')
    if(doc.title){
      return blogInfo[doc.blog].title + ': ' + doc.title;
    } else {
      return blogInfo[doc.blog].title;
    }
  else return null;
}

var edgeFields = {
  title: 1,
  published: 1,
  type: 1,
  blog: 1,
  path: 1,
  mdydate: 1,
  offsetmins: 1
};

module.exports = function(cfg){

var mongoUrl = cfg.mongodb && cfg.mongodb.url || 'mongodb://localhost/default';
var items = mongo.db(mongoUrl).collection('items');

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

function getLocationForDocument(doc){
  if(doc.type == 'achewood'){
    return '/achewood/date/'+doc.mdydate;
  } else if(doc.type == 'raysplace') {
    return '/raysplace/date/'+doc.mdydate;
  } else if(doc.type == 'blog') {
    return '/blogs/'+doc.blog+doc.path;
  } else return null;
}

function redirectToDocLocation(doc,res){
  if(doc){
    res.redirect(getLocationForDocument(doc));
  } else {
    res.render('notfound');
  }
}

function redirectToLatest(type,res,next){
  var onSuccess = errHandlingCb(next);
  var query = {};
  if(type) query.type = type;
  items.find(query,
    { type: 1,
      blog: 1,
      mdydate: 1,
      path: 1},
    { limit:1,
      sort: {published: -1}},
    onSuccess(function(cursor){cursor.nextObject(onSuccess(function(doc){
      redirectToDocLocation(doc,res);
    }))}));
}

app.get("/latest",function(req,res,next){
  redirectToLatest(req.query.type,res,next);
});

app.get("/go",function(req,res){
  res.redirect(getLocationForSource(req.param('q')));
});

//error handlers like this are too good to save for just errors
app.get("/404",function(req,res){
  res.render('notfound');
});

app.get("/500",function(req,res){
  res.render('error',{error: req.query.e || "ENTERING DEATH MODE"});
});

app.use(express.static(__dirname+'/static'));

app.use(respondNotFound);
app.use(respondError);

return app;
};