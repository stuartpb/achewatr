var crawlBlogRss = require("./crawlBlogRss.js");
var itemFromBlogRssEntry = require("./itemFromBlogRssEntry.js");
var getItemFromRssEntryPost = require("./getItemFromRssEntryPost.js");

// for throttling
var queue = require("queue-async");

function onSuccess(cb){
  return function(err) {
    if (err) {
      throw err;
    } else {
      cb.apply(this,Array.prototype.slice.call(arguments,1));
    }
  };
}

var blogsWithRssContent = [
  "raysmuckles", //Ray
  "rbeef", //Roast Beef
  "journeyintoreason", //Pat
  "orezscu", //Téodor
  "philippesblog", //Philippe
  "corneliusbear", //Mr. Bear
  "lyle151", //Lyle
  "mollysanders", //Molly
  "chrisonstad", //Chris
  "peterhcropes", //Nice Pete
  "emerillg" //Emeril
];

// For some reason, the feed for Little Nephew's blog- and ONLY
// Little Nephew's blog- has "summary" elements instead of content,
// so each post must be individually retrieved and extracted fron the page
// rather than being taken from the RSS feed.
var blogsWithoutRssContent = [
  'charleysmuckles'
];

function saveFromBlogs(blogs, entryHandler, cb) {
  function saveFromBlog(index) {
    if (index < blogs.length) {
      console.log('Populating ' + blogs[index] + '...');
      crawlBlogRss({
        host: blogs[index]+'.blogspot.com',
        path: '/atom.xml?max-results=65536'},
        entryHandler,
        function(){
          saveFromBlog(index+1);
        });
    } else {
      cb();
    }
  }
  saveFromBlog(0);
}

module.exports = function saveFromAllBlogs(opts, insert, finish) {
  var q = queue(opts.concurrency);

  function handleEntryWithContent(entry){
    // defer to ensure all writes finish before we call `finish`
    q.defer(insert,itemFromBlogRssEntry(entry));
  }

  function handleEntryWithoutContent(entry){
    q.defer(function(cb){
      getItemFromRssEntryPost(entry, function(err, item) {
        if (err) return cb(err);
        insert(item, cb);
      });
    });
  }

  saveFromBlogs(blogsWithRssContent, handleEntryWithContent,
    saveFromBlogs.bind(null, blogsWithoutRssContent, handleEntryWithoutContent,
      function(){
        q.awaitAll(onSuccess(finish));
      }));
};
