var url = require("url");

module.exports = function itemFromArticleDescription(article) {
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

  //content from the content tag
  if (article.description){
    //with the <div class="blogger-post-footer"> content tracker removed
    item.content = article.description
      .replace(/<div class="blogger-post-footer">.*?<\/div>/,'');
  } else {
    item.content = '';
  }

  //Grab the author name from the name tag of the author tag
  var arname = article.author;
  //if it's not "me", save the name
    //(a few Nice Pete posts used 'Peter H. Cropes')
  if (arname != 'me'){
    item.author = arname;
  }

  //Grab the path from the href of the link tag with rel="alternate"
  var location = article.origlink || article.link;
  item._id = location;
  var urlobj = url.parse(location);
  item.path = urlobj.path.replace(/.html$/,'');

  // TODO: take this as a param?
  item.blog = urlobj.hostname.split('.',1)[0];

  return item;
};
