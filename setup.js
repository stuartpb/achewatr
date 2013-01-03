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

//A moderately hacky way of getting around the fact that
//MongoDB uses a non-compliant form of JSON to preserve its data types-
//this is loosely patterned after the functions from the MongoDB shell
function tojsonObject(x){
  var k, pairs = [];
  if(x instanceof Date){
    return 'ISODate('+JSON.stringify(x.toISOString())+')';
  }
  //We don't use arrays but I feel icky not handling this
  else if (Array.isArray(x)) {
    return '['+x.map(tojson).join(',')+']';
  }
  //Also this - even though if this function's processing a null
  //that's a pretty good sign something's gone wrong
  else if (x === null) {
    return 'null';
  }
  //There are a bunch of other specialcase types that could be handled here
  //(like ObjectID), but we don't handle them because the only special case
  //this setup script needs is for dates
  else {
    for(k in x){
      //use JSON.stringify for the key because that could only be a string
      //use tojson for the value because that could need to recursively
      //come back to special JSON handling
      pairs.push(JSON.stringify(k)+':'+tojson(x[k]));
    }
    return '{'+pairs.join(',')+'}';
  }
}

function tojson(x){
  //If it's an object we gotta use the spooky voodoo
  if(typeof x == 'object'){
    return tojsonObject(x);
  //non-object types can only ever be the same as their conformant JSON
  //representation
  } else {
    return JSON.stringify(x);
  }
}

inserters['export'] = function(item){
  collection.write(tojson(item)+'\n');
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
