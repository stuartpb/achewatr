var argv = require("optimist").argv;

var env = {};
var crawlers = [];
var method;
var target = argv.target || argv._[0];

env.concurrency = argv.concurrency || 5;
method = {
  insert: require("./lib/saving/mongoDbUpserter.js"),
  'export': require("./lib/saving/mongoJsonExporter.js")
}[argv.method || 'insert'](target);

if(argv.crawl && !Array.isArray(argv.crawl)){
  crawlers[0]=require('./crawlers/'+argv.crawl);
  argv.crawl = [argv.crawl];
} else {
  argv.crawl = argv.crawl || ['achewood','raysplace','blogs'];
  for(var i = 0; i < argv.crawl.length; ++i) {
    crawlers[i] = require('./crawlers/'+argv.crawl[i]);
  }
}

function fireInsert(item, cb){
  method.insert(item,function(err) {
    if (err) throw err;
    if (argv.v) console.log(item._id);
    cb();
  });
}

function runCrawlers(index){
  if (index < crawlers.length) {
    console.log('Crawling ' + argv.crawl[index] + '...');
    crawlers[index](env, fireInsert, runCrawlers.bind(null,index+1));
  } else {
    method.finish();
  }
}

method.startup();
runCrawlers(0);
