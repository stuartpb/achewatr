var url = require("url");
var cheerequest = require('../cheerequest.js');

module.exports = function getItemFromArticleLink(article, cb) {
  //The document that will be added to the database.
  var item = {type: 'blog'};

  //title from the title element
  item.title = article.title;
  //console.log(article);

  //date from the published element (not the updated tag)
  item.published = new Date(article.pubdate);

  //time offset
  var offset = article['atom:published']['#']
    .match(/([\+\-])(\d\d)\:?(\d\d)?$/);
  // TODO: remove this, let clients parse offset at runtime
  item.offsetmins = (offset[1] == '-' ? -1 : 1) *
    (60 * offset[2] + parseInt(offset[3],10));

  //Grab the path from the href of the link tag with rel="alternate"
  var location = article.origlink || article.link;
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
