var http = require("http");
var XmlStream = require("xml-stream");

module.exports = function crawlBlogRss(getOpts,entryHandler,endcb) {
  // Request the RSS feed for the blog, containing every post ever made
  http.get(getOpts, function(response) {
    var xml = new XmlStream(response);

    //Expect multiple link tags
    xml.collect('entry link');
    //Get the data from each entry:
    xml.on('updateElement: entry',entryHandler);
    xml.on('end',endcb);
  });
};
