var url = require("url");
var cheerequest = require('../cheerequest.js');

module.exports = function entryHandler(entry,cb){
  //The document that will be added to the database.
  var item = {type: 'blog'};
  //title from the title element
  item.title = entry.title.$text;
  //date from the published element (not the updated tag)
  item.published = new Date(entry.published);
  //time offset
  var offset = entry.published.match(/([\+\-])(\d\d)\:?(\d\d)?$/);
  // TODO: remove this, let clients parse offset at runtime
  item.offsetmins = (offset[1] == '-' ? -1 : 1) *
    (60 * offset[2] + parseInt(offset[3],10));

  //Grab the path from the href of the link tag with rel="alternate"
  var location;
  //Search backwards through the link elements: will probably be the last one,
  //but handle the case where it's not
  for(var i = entry.link.length-1; i >= 0 && !location; --i){
    var link = entry.link[i];
    if (link.$.rel == 'alternate') {
      location = link.$.href;
    }
  }
  item._id = location;
  var urlobj = url.parse(location);
  item.path = urlobj.path.replace(/.html$/,'');

  // TODO: take this as a param?
  item.blog = urlobj.hostname.split('.',1)[0];

  cheerequest(location).then(function($){
    var content = $('.post-body');

    //remove the clearfix div at the end of the content
    $('div', content).last().remove();
    item.content = content.html().trim();

    cb(null,item);
  });
};
