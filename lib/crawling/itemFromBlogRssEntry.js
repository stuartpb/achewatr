var url = require("url");

module.exports = function itemFromBlogRssEntry(entry) {
  //The document that will be added to the database.
  var item = {
    type: 'blog'};
  //title from the title element
  item.title = entry.title.$text;
  //date from the published element (not the updated tag)
  item.published = new Date(entry.published);
  //time offset
  var offset = entry.published.match(/([\+\-])(\d\d)\:?(\d\d)?$/);
  item.offsetmins = (offset[1] == '-' ? -1 : 1) *
    (60 * offset[2] + parseInt(offset[3],10));

  //content from the content tag
  if(entry.content.$text){
    //with the <div class="blogger-post-footer"> content tracker removed
    item.content = entry.content.$text
      .replace(/<div class="blogger-post-footer">.*?<\/div>/,'');
  } else {
    item.content = '';
  }

  //Grab the author name from the name tag of the author tag
  var arname = entry.author.name;
  //if it's not "me", save the name
    //(a few Nice Pete posts used 'Peter H. Cropes')
  if(arname!='me'){
    item.author = arname;
  }

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

  return item;
};
