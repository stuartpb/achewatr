var mongodb = require("mongodb");
var fs = require('fs');
var argv = require("optimist").argv;

var env = {};
var crawlers = [];
var method;
var db, collection;
var startup = {};
var inserters = {};
var closers = {};
var target = argv.target|| argv._[0];

env.concurrency = argv.concurrency || 5;
method = argv.method || 'insert';
if(argv.crawl && !Array.isArray(argv.crawl)){
  crawlers[0]=require('./crawlers/'+argv.crawl);
  argv.crawl = [argv.crawl];
} else {
  argv.crawl = argv.crawl || ['achewood','raysplace','blogs','littlenephew'];
  for(var i = 0; i < argv.crawl.length; ++i) {
    crawlers[i] = require('./crawlers/'+argv.crawl[i]);
  }
}

function onSuccess(cb){
  return function(err) {
    if (err) {
      throw err;
    } else {
      cb.apply(this,Array.prototype.slice.call(arguments,1));
    }
  };
}


function connectToDb(continuation){
  mongodb.MongoClient.connect(target,onSuccess(function(database){
    db = database;
    collection = db.collection('items');
    continuation();
  }));
}

function closeDb(){
  db.close();
}
startup.insert = connectToDb;
startup.upsert = connectToDb;
startup['export'] = function(continuation){
  collection = fs.createWriteStream(target);
  continuation();
};

//callback for Mongo operation writeconcerns
var reportSuccessfulInsertion = onSuccess(function(doc){
  console.log(doc._id);
});

inserters.insert = function(item){
  collection.insert(item,reportSuccessfulInsertion);
};
inserters.upsert = function(item){
  collection.update({_id: item._id},
    item,{upsert:true},reportSuccessfulInsertion);
};
inserters['export'] = function(item){
  collection.write(JSON.stringify(item)+'\n');
};

closers.insert = closeDb;
closers.upsert = closeDb;
closers["export"] = function(){
  collection.end();
  collection.destroySoon();
};

function runCrawlers(index){
  if (index < crawlers.length) {
    console.log('Crawling ' + argv.crawl[index] + '...');
    crawlers[index](env,inserters[method],
      function(){
        runCrawlers(index+1);
      });
  } else {
    closers[method]();
  }
}

startup[method](function(){
  runCrawlers(0);
});
