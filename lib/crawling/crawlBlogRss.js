var request = require("request");
var FeedParser = require("feedparser");

module.exports = function crawlBlogRss(url,entryHandler,endcb) {
  // Request the RSS feed for the blog, containing every post ever made
  var req = request.get(url);
  var fp = new FeedParser({feedurl: url});

  req.on('error', endcb);

  req.on('response',function(res) {
    if (res.statusCode != 200) return endcb(new Error('Bad status code'));
    res.pipe(fp);
  });


  fp.on('error', console.error.bind(console));
  fp.on('readable', function() {
    var item;

    while (item = fp.read()) {
      entryHandler(item);
    }
  });
  fp.on('end', endcb);

};
